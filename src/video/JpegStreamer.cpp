#include "JpegStreamer.h"
#include "DXGICapture.h"
#include "../server/WebSocket.h"
#include "../input/InputManager.h"
#include "../core/Utils.h"
#include <gdiplus.h>
#include <ws2tcpip.h>

using namespace Gdiplus;

namespace Video {

JpegBroadcaster& JpegBroadcaster::Instance() {
    static JpegBroadcaster inst;
    return inst;
}

JpegBroadcaster::JpegBroadcaster() : frameSeq(0), subscribers(0), stopReq(false) {}

JpegBroadcaster::~JpegBroadcaster() {
    {
        std::lock_guard<std::mutex> lk(mtx);
        stopReq = true;
        cv.notify_all();
    }
    if (worker.joinable()) worker.join();
}

void JpegBroadcaster::EnsureRunning() {
    std::lock_guard<std::mutex> lk(mtx);
    subscribers++;
    if (!worker.joinable()) {
        stopReq = false;
        worker = std::thread(&JpegBroadcaster::CaptureLoop, this);
    }
    cv.notify_all();
}

void JpegBroadcaster::ClientDone() {
    std::lock_guard<std::mutex> lk(mtx);
    subscribers--;
    if (subscribers <= 0) { subscribers = 0; cv.notify_all(); }
}

void JpegBroadcaster::ServeWebSocketClient(SOCKET sock) {
    EnsureRunning();
    u_long mode = 1;
    ioctlsocket(sock, FIONBIO, &mode);
    int nodelay = 1;
    setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&nodelay, sizeof(int));
    int sndbuf = 524288;
    setsockopt(sock, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

    uint64_t lastSent = 0;
    bool clientReady = true;
    Input::EnsureTouchInjectionInit();

    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);

    while (true) {
        uint8_t rxBuf[512];
        int br = recv(sock, (char*)rxBuf, sizeof(rxBuf), 0);
        if (br > 0) {
            std::string msg = WebSocket::ReadWebSocketTextMessage(rxBuf, br);
            if (msg == "CLOSE") break;
            if (!msg.empty()) {
                clientReady = true;
                if (msg[0] == 'T' && msg.size() > 5) {
                    char act[16] = {0};
                    int px = -1, py = -1, tid = 0;
                    if (sscanf(msg.c_str(), "T:%15[^:]:%d:%d:%d", act, &px, &py, &tid) >= 3 && px >= 0 && py >= 0) {
                        Input::InjectTouch(act, px, py, tid);
                    }
                } else if (msg[0] == 'M' && msg.size() > 3) {
                    int dx = 0, dy = 0, sc = 0, clk = 0;
                    sscanf(msg.c_str(), "M:%d:%d:%d:%d", &dx, &dy, &sc, &clk);
                    if (dx != 0 || dy != 0) Input::MouseMove(dx, dy);
                    if (sc != 0) Input::MouseWheel(sc);
                    if (clk == 1) { Input::MouseClick(false); }
                    else if (clk == 2) { Input::MouseClick(true); }
                }
            }
        } else if (br == 0) {
            break;
        } else {
            int err = WSAGetLastError();
            if (err != WSAEWOULDBLOCK) break;
        }

        if (!clientReady) {
            Sleep(2);
            continue;
        }

        std::vector<uint8_t> frame;
        uint64_t currentSeq = 0;
        {
            std::unique_lock<std::mutex> lk(mtx);
            cv.wait_for(lk, std::chrono::milliseconds(50), [&]() {
                return frameSeq > lastSent || stopReq;
            });
            if (stopReq) break;
            if (frameSeq <= lastSent) continue;
            frame = latestFrame;
            currentSeq = frameSeq;
        }
        if (frame.empty()) continue;

        std::vector<char> frameChar(frame.begin(), frame.end());
        if (!WebSocket::SendWebSocketBinaryFrame(sock, frameChar)) break;
        lastSent = currentSeq;
        clientReady = false;
    }
    ClientDone();
    closesocket(sock);
}

void JpegBroadcaster::ServeMjpegClient(SOCKET sock) {
    EnsureRunning();
    int nodelay = 1;
    setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&nodelay, sizeof(int));
    uint64_t lastSent = 0;

    while (true) {
        std::vector<uint8_t> frame;
        uint64_t currentSeq = 0;
        {
            std::unique_lock<std::mutex> lk(mtx);
            cv.wait_for(lk, std::chrono::milliseconds(100), [&]() {
                return frameSeq > lastSent || stopReq;
            });
            if (stopReq) break;
            if (frameSeq <= lastSent) continue;
            frame = latestFrame;
            currentSeq = frameSeq;
        }
        if (frame.empty()) continue;

        std::string partHeader = "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: " +
                                 std::to_string(frame.size()) + "\r\n\r\n";
        if (send(sock, partHeader.c_str(), (int)partHeader.length(), 0) <= 0) break;
        if (send(sock, (const char*)frame.data(), (int)frame.size(), 0) <= 0) break;
        if (send(sock, "\r\n", 2, 0) <= 0) break;
        lastSent = currentSeq;
    }
    ClientDone();
    closesocket(sock);
}

void JpegBroadcaster::CaptureLoop() {
    CLSID jpgClsid;
    Utils::GetEncoderClsid(L"image/jpeg", &jpgClsid);
    EncoderParameters ep;
    ep.Count = 1;
    ep.Parameter[0].Guid = EncoderQuality;
    ep.Parameter[0].Type = EncoderParameterValueTypeLong;
    ep.Parameter[0].NumberOfValues = 1;
    ULONG quality = 70;
    ep.Parameter[0].Value = &quality;

    HDC hScreen = GetDC(NULL);
    int targetW = 1280;
    int targetH = 720;

    HDC hDC = CreateCompatibleDC(hScreen);
    HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
    SelectObject(hDC, hBitmap);
    SetStretchBltMode(hDC, HALFTONE);

    int loopCounter = 0;

    while (true) {
        {
            std::unique_lock<std::mutex> lk(mtx);
            if (subscribers <= 0) {
                cv.wait(lk, [&]() { return subscribers > 0 || stopReq; });
            }
            if (stopReq) break;
        }

        loopCounter++;
        if (loopCounter % 180 == 0) {
            Utils::SwitchToActiveDesktop();
        }

        bool captured = CaptureDXGIFrame(hDC, targetW, targetH);
        if (!captured) {
            int curScreenW = GetSystemMetrics(SM_CXSCREEN);
            int curScreenH = GetSystemMetrics(SM_CYSCREEN);
            HDC curScreen = GetDC(NULL);
            StretchBlt(hDC, 0, 0, targetW, targetH, curScreen, 0, 0, curScreenW, curScreenH, SRCCOPY);
            ReleaseDC(NULL, curScreen);
        }

        IStream* pStream = NULL;
        if (CreateStreamOnHGlobal(NULL, TRUE, &pStream) == S_OK) {
            Bitmap bmp(hBitmap, NULL);
            bmp.Save(pStream, &jpgClsid, &ep);

            STATSTG stg;
            if (pStream->Stat(&stg, STATFLAG_NONAME) == S_OK) {
                ULONG sz = (ULONG)stg.cbSize.QuadPart;
                HGLOBAL hg = NULL;
                if (GetHGlobalFromStream(pStream, &hg) == S_OK && hg) {
                    void* pBytes = GlobalLock(hg);
                    if (pBytes) {
                        std::lock_guard<std::mutex> lk(mtx);
                        latestFrame.assign((uint8_t*)pBytes, (uint8_t*)pBytes + sz);
                        frameSeq++;
                        cv.notify_all();
                        GlobalUnlock(hg);
                    }
                }
            }
            pStream->Release();
        }
        Sleep(11); // ~90 FPS pace
    }

    DeleteObject(hBitmap);
    DeleteDC(hDC);
    ReleaseDC(NULL, hScreen);
    CleanupDXGI();
}

} // namespace Video
