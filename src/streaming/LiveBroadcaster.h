#pragma once

#include <winsock2.h>
#include <windows.h>
#include <vector>
#include <deque>
#include <mutex>
#include <thread>
#include <condition_variable>
#include <string>
#include <cstdint>
#include <chrono>

#include "../capture/DXGICapture.h"
#include "../capture/ColorConvert.h"
#include "../encoder/H264Encoder.h"
#include "../server/WebSocket.h"
#include "../input/TouchInjector.h"
#include "../core/Logger.h"

// ============================================================
// 🎬 LIVE BROADCASTER — ONE persistent encoder, MANY viewers.
// Real streaming-server pattern (Sunshine/Moonlight style): a single
// background thread captures+encodes and fans the SAME fragments out to
// every connected viewer. New/reloaded viewers get the cached init segment
// + recent ring-buffer fragments instantly, so page reloads NEVER produce a
// black screen (one encoder = one SPS/PPS forever). The encoder thread is
// persistent: it sleeps when nobody is watching (0% CPU) and wakes on demand,
// which eliminates all start/stop race conditions.
// ============================================================
class LiveBroadcaster {
public:
    std::mutex mtx;
    std::condition_variable cv;
    std::vector<uint8_t> initSeg;      // cached init (ftyp+moov)
    struct RingFrag { uint64_t seq; std::vector<uint8_t> data; bool sync; };
    std::deque<RingFrag> ring; // recent fragments (cap ~2s so new viewers tune in fast)
    uint64_t nextSeq = 1;

    // ⚡ Pure Annex-B Ring Buffer for Zero-Latency WebCodecs GPU Streaming
    std::deque<RingFrag> annexbRing;
    uint64_t nextAnnexSeq = 1;

    bool encoderRunning = false;
    bool encoderReady = false;
    bool stopRequested = false;
    int width = 1280, height = 720;
    std::string codec = "avc1.42001E";
    int subscriberCount = 0;

    bool ringHasSync() {
        for (auto& p : ring) if (p.sync) return true;
        return false;
    }

    // Called once at startup: captures native screen size.
    void InitDefaults() {
        int sw = GetSystemMetrics(SM_CXSCREEN);
        int sh = GetSystemMetrics(SM_CYSCREEN);
        if (sw > 4 && sh > 4) { width = sw; height = sh; }
        // Cap at 1920 wide for sane tunnel bandwidth (keeps native aspect)
        if (width > 1920) { height = (height * 1920) / width; width = 1920; }
        width &= ~1; height &= ~1;
    }

    // Ensure the persistent encoder thread exists (idempotent, race-free).
    void EnsureEncoder() {
        bool needStart = false;
        {
            std::lock_guard<std::mutex> lk(mtx);
            if (!encoderRunning) { encoderRunning = true; stopRequested = false; needStart = true; }
            cv.notify_all();
        }
        if (needStart) std::thread([this]() { EncoderLoop(); }).detach();
    }

private:
    void EncoderLoop() {
        AppLog("[live] encoder thread started");
        H264Streamer streamer;
        int w, h;
        { std::lock_guard<std::mutex> lk(mtx); w = width; h = height; }
        AppLog("[live] encoder Init...");
        if (!streamer.Init(w, h)) {
            AppLog("[live] encoder Init FAILED");
            std::lock_guard<std::mutex> lk(mtx);
            encoderRunning = false;
            encoderReady = false;
            cv.notify_all();
            return;
        }

        HDC hScreen = GetDC(NULL);
        HDC hDC = CreateCompatibleDC(hScreen);
        HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, w, h);
        HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
        BITMAPINFO bmi = {0};
        bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
        bmi.bmiHeader.biWidth = w; bmi.bmiHeader.biHeight = -h;
        bmi.bmiHeader.biPlanes = 1; bmi.bmiHeader.biBitCount = 32; bmi.bmiHeader.biCompression = BI_RGB;
        std::vector<uint8_t> bgra((size_t)w * h * 4);
        std::vector<uint8_t> nv12(streamer.frameSize());
        bool initSent = false;
        LONG64 stime = 0;

        {
            std::lock_guard<std::mutex> lk(mtx);
            encoderReady = true;
            cv.notify_all();
        }
        AppLog("[live] encoder ready, entering loop");

        while (true) {
            bool work = false;
            {
                std::unique_lock<std::mutex> lk(mtx);
                if (stopRequested) break;
                if (subscriberCount <= 0) {
                    // 💤 Idle: no viewers -> sleep until someone connects
                    cv.wait_for(lk, std::chrono::milliseconds(1000), [&]() {
                        return stopRequested || subscriberCount > 0;
                    });
                    continue;
                }
                work = true;
            }
            if (!work) continue;

            SwitchToActiveDesktop();
            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);
            if (!CaptureDXGIFrame(hDC, w, h)) {
                SetStretchBltMode(hDC, HALFTONE);
                SetBrushOrgEx(hDC, 0, 0, NULL);
                StretchBlt(hDC, 0, 0, w, h, hScreen, 0, 0, screenW, screenH, SRCCOPY);
            }
            GetDIBits(hDC, hBitmap, 0, h, bgra.data(), &bmi, DIB_RGB_COLORS);
            BGRAtoNV12(bgra.data(), w, h, nv12.data());

            if (!streamer.EncodeFrame(nv12.data(), stime)) { Sleep(5); continue; }
            stime += 166666; // 60 FPS (16.6ms step in 100ns units)

            if (!initSent && streamer.Ready()) {
                std::lock_guard<std::mutex> lk(mtx);
                initSeg = streamer.initSeg;
                codec = streamer.codec;
                g_streamCodec = codec; g_streamW = w; g_streamH = h;
                initSent = true;
                cv.notify_all();
            }

            std::vector<uint8_t> frag;
            bool fragSync = false;
            while (streamer.TakeFragment(frag, true, &fragSync)) {
                if (!frag.empty()) {
                    std::lock_guard<std::mutex> lk(mtx);
                    ring.push_back({ nextSeq++, std::move(frag), fragSync });
                    // keep ~2 seconds of fragments so new viewers can tune in at the last IDR
                    while (ring.size() > 16) ring.pop_front();
                    cv.notify_all();
                }
                frag.clear();
            }

            // ⚡ Collect pure Annex-B frames for instant WebCodecs GPU WebSocket streaming
            std::vector<uint8_t> annexb;
            bool annexbSync = false;
            while (streamer.TakeAnnexB(annexb, &annexbSync)) {
                if (!annexb.empty()) {
                    std::lock_guard<std::mutex> lk(mtx);
                    annexbRing.push_back({ nextAnnexSeq++, std::move(annexb), annexbSync });
                    while (annexbRing.size() > 90) annexbRing.pop_front();
                    cv.notify_all();
                }
                annexb.clear();
            }

            Sleep(16); // ⚡ 60 FPS True Hardware Refresh Sync!
        }

        SelectObject(hDC, oldBm);
        DeleteObject(hBitmap);
        DeleteDC(hDC);
        ReleaseDC(NULL, hScreen);
        // ⚡ NO explicit streamer.Cleanup() here: ~H264Streamer() calls Cleanup()
        // automatically. Calling it twice -> double MFShutdown/CoUninitialize -> crash.

        std::lock_guard<std::mutex> lk(mtx);
        encoderRunning = false;
        encoderReady = false;
        initSeg.clear();
        ring.clear();
        annexbRing.clear();
        cv.notify_all();
        AppLog("[live] encoder thread stopped");
    }

public:
    // Serve one viewer until disconnect. Called from the /h264 handler.
    void ServeClient(SOCKET clientSocket) {
        int flag = 1;
        setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
        int sndbuf = 131072;
        setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

        EnsureEncoder();
        {
            std::lock_guard<std::mutex> lk(mtx);
            subscriberCount++;
            cv.notify_all();
        }

        uint64_t catchUpSeq = 0;
        int stall = 0;
        bool sentInit = false;
        bool catchUpSet = false;

        while (true) {
            std::vector<uint8_t> toSend;
            bool haveData = false;
            {
                std::unique_lock<std::mutex> lk(mtx);
                // Wait up to 250ms for init or new fragments (or the first IDR to tune in on).
                // NOTE: must check the RING for seq > catchUpSeq, never nextSeq alone --
                // nextSeq=1 > catchUpSeq=0 is ALWAYS true with an empty ring, which would
                // tight-spin this loop and hit the stall limit in microseconds.
                cv.wait_for(lk, std::chrono::milliseconds(250), [&]() {
                    if (!initSeg.empty() && !sentInit) return true;
                    for (auto& p : ring) if (p.seq > catchUpSeq) return true;
                    return false;
                });
                if (!sentInit) {
                    if (!initSeg.empty()) { toSend = initSeg; sentInit = true; haveData = true; }
                } else {
                    // 🎯 Tune in at the most recent IDR fragment so the decoder gets a
                    // keyframe immediately -> page reloads NEVER black-screen.
                    if (!catchUpSet) {
                        for (auto it = ring.rbegin(); it != ring.rend(); ++it) {
                            if (it->sync) { catchUpSeq = it->seq; break; }
                        }
                        catchUpSet = true;
                    }
                    for (auto& p : ring) {
                        if (p.seq > catchUpSeq) {
                            toSend.insert(toSend.end(), p.data.begin(), p.data.end());
                            catchUpSeq = p.seq;
                        }
                    }
                    haveData = !toSend.empty();
                }
            }

            if (!haveData) {
                stall++;
                if (stall > 60) break; // 15s silent -> drop (client auto-reconnects instantly)
                continue;
            }
            stall = 0;

            // ZERO-BUFFER-BLOAT flow control: only send when socket is writable
            fd_set writefds; FD_ZERO(&writefds); FD_SET(clientSocket, &writefds);
            timeval tv = {0, 0};
            int selRes = select(0, NULL, &writefds, NULL, &tv);
            if (selRes < 0) break;
            if (selRes == 0) {
                stall++;
                if (stall > 900) break; // ~15s socket stall -> drop viewer
                Sleep(16);
                continue;
            }
            if (send(clientSocket, (char*)toSend.data(), (int)toSend.size(), 0) == SOCKET_ERROR) {
                AppLog("[live] send failed, dropping viewer");
                break;
            }
        }

        {
            std::lock_guard<std::mutex> lk(mtx);
            subscriberCount--;
            if (subscriberCount <= 0) cv.notify_all(); // encoder goes to sleep
        }
        AppLog("[live] viewer disconnected");
        closesocket(clientSocket);
    }

    // ⚡ UNIFIED WEBSOCKET STREAMER: Streams pure Annex-B H.264 NAL units
    // to browser WebCodecs VideoDecoder with in-flight flow control & touch/mousepad injection!
    void ServeWebSocketClient(SOCKET sock) {
        EnsureEncoder();
        {
            std::lock_guard<std::mutex> lk(mtx);
            subscriberCount++;
            cv.notify_all();
        }

        u_long mode = 1;
        ioctlsocket(sock, FIONBIO, &mode);
        int nodelay = 1;
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&nodelay, sizeof(int));
        int sndbuf = 65536;
        setsockopt(sock, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

        uint64_t catchUpSeq = 0;
        bool catchUpSet = false;
        int inFlight = 0;
        DWORD lastSentTick = 0;
        EnsureTouchInjectionInit();

        int screenW = GetSystemMetrics(SM_CXSCREEN);
        int screenH = GetSystemMetrics(SM_CYSCREEN);

        while (true) {
            // 1. Read incoming WebSocket commands (ACK or in-socket Touch/Mouse/Keyboard)
            uint8_t rxBuf[512];
            int br = recv(sock, (char*)rxBuf, sizeof(rxBuf), 0);
            if (br > 0) {
                std::string msg = ReadWebSocketTextMessage(rxBuf, br);
                if (msg == "CLOSE") break;
                if (msg == "A") {
                    if (inFlight > 0) inFlight--;
                    continue;
                }
                if (!msg.empty()) {
                    if (msg[0] == 'T' && msg.size() > 5) {
                        char act[16] = {0};
                        int px = -1, py = -1, tid = 0;
                        if (sscanf(msg.c_str(), "T:%15[^:]:%d:%d:%d", act, &px, &py, &tid) >= 3 && px >= 0 && py >= 0) {
                            int targetX = (px * screenW) / 10000;
                            int targetY = (py * screenH) / 10000;
                            bool touchHandled = false;
                            if (g_touchInitialized && g_pfnInjectTouch) {
                                POINTER_TOUCH_INFO_CUSTOM contact;
                                memset(&contact, 0, sizeof(POINTER_TOUCH_INFO_CUSTOM));
                                contact.pointerInfo.pointerType = PT_TOUCH;
                                contact.pointerInfo.pointerId = tid;
                                contact.pointerInfo.ptPixelLocation.x = targetX;
                                contact.pointerInfo.ptPixelLocation.y = targetY;
                                contact.touchFlags = TOUCH_FLAG_NONE;
                                contact.touchMask = TOUCH_MASK_CONTACTAREA | TOUCH_MASK_PRESSURE;
                                contact.pressure = 32000;
                                contact.rcContact.left   = targetX - 4;
                                contact.rcContact.right  = targetX + 4;
                                contact.rcContact.top    = targetY - 4;
                                contact.rcContact.bottom = targetY + 4;
                                std::string actStr = act;
                                if (actStr == "down") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                                    touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                                } else if (actStr == "move") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_UPDATE | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                                    touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                                } else if (actStr == "up") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                                    touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                                } else if (actStr == "tap") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                                    if (g_pfnInjectTouch(1, &contact)) {
                                        contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                                        g_pfnInjectTouch(1, &contact);
                                        touchHandled = true;
                                    }
                                }
                            }
                            if (!touchHandled) {
                                SetCursorPos(targetX, targetY);
                                std::string actStr = act;
                                if (actStr == "down") mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                                else if (actStr == "up") mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                                else if (actStr == "tap") {
                                    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                                    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                                }
                            }
                        }
                    } else if (msg[0] == 'M' && msg.size() > 3) {
                        int dx = 0, dy = 0, sc = 0, clk = 0;
                        sscanf(msg.c_str(), "M:%d:%d:%d:%d", &dx, &dy, &sc, &clk);
                        if (dx != 0 || dy != 0) {
                            POINT cur; GetCursorPos(&cur);
                            SetCursorPos(cur.x + dx, cur.y + dy);
                            mouse_event(MOUSEEVENTF_MOVE, dx, dy, 0, 0);
                        }
                        if (sc != 0) mouse_event(MOUSEEVENTF_WHEEL, 0, 0, (DWORD)sc, 0);
                        if (clk == 1) {
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            Sleep(15);
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        } else if (clk == 2) {
                            mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                            Sleep(15);
                            mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                        } else if (clk == 3) mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        else if (clk == 4) mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                    } else if (msg[0] == 'K' && msg.size() > 3) {
                        int vk = 0, down = 0;
                        if (sscanf(msg.c_str(), "K:%d:%d", &vk, &down) >= 2 && vk > 0) {
                            keybd_event((BYTE)vk, 0, down ? 0 : KEYEVENTF_KEYUP, 0);
                        }
                    }
                }
            } else if (br == 0) {
                break;
            } else {
                int err = WSAGetLastError();
                if (err != WSAEWOULDBLOCK) break;
            }

            // 2. Flow Control: Max 2 in-flight frames in the network pipe
            DWORD nowTick = GetTickCount();
            if (inFlight >= 2 && (nowTick - lastSentTick) < 250) {
                Sleep(2);
                continue;
            }

            // 3. Collect next Annex-B packet
            std::vector<uint8_t> toSend;
            {
                std::unique_lock<std::mutex> lk(mtx);
                cv.wait_for(lk, std::chrono::milliseconds(25), [&]() {
                    if (stopRequested) return true;
                    for (auto& p : annexbRing) if (p.seq > catchUpSeq) return true;
                    return false;
                });
                if (stopRequested) break;

                // First frame: tune in to the latest IDR keyframe
                if (!catchUpSet) {
                    for (auto it = annexbRing.rbegin(); it != annexbRing.rend(); ++it) {
                        if (it->sync) {
                            catchUpSeq = it->seq - 1;
                            catchUpSet = true;
                            break;
                        }
                    }
                    if (!catchUpSet) continue; // Wait until an IDR keyframe is ready
                }

                for (auto& p : annexbRing) {
                    if (p.seq > catchUpSeq) {
                        toSend = p.data;
                        catchUpSeq = p.seq;
                        break;
                    }
                }
            }

            if (toSend.empty()) continue;

            // 4. Send binary WebSocket frame (100% atomic)
            std::vector<char> payload(toSend.begin(), toSend.end());
            if (!SendWebSocketBinaryFrame(sock, payload)) break;
            inFlight++;
            lastSentTick = GetTickCount();
        }

        {
            std::lock_guard<std::mutex> lk(mtx);
            subscriberCount--;
            if (subscriberCount <= 0) cv.notify_all();
        }
        closesocket(sock);
    }
};

extern LiveBroadcaster g_live;
