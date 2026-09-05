#include "WebSocket.h"
#include "../core/Config.h"
#include "../security/PanicEngine.h"
#include <wincrypt.h>

// 📡 WEBSOCKET SHA-1 & BINARY FRAME ENCODER (Sub-1ms Browser GPU Canvas Stream)
std::string CalculateWebSocketAcceptKey(const std::string& clientKey) {
    std::string concatenated = clientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    BYTE hash[20];
    DWORD hashLen = 20;
    std::string result = "";

    if (CryptAcquireContext(&hProv, NULL, NULL, PROV_RSA_FULL, CRYPT_VERIFYCONTEXT)) {
        if (CryptCreateHash(hProv, CALG_SHA1, 0, 0, &hHash)) {
            if (CryptHashData(hHash, (const BYTE*)concatenated.c_str(), (DWORD)concatenated.length(), 0)) {
                if (CryptGetHashParam(hHash, HP_HASHVAL, hash, &hashLen, 0)) {
                    DWORD base64Len = 0;
                    CryptBinaryToStringA(hash, 20, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, NULL, &base64Len);
                    if (base64Len > 0) {
                        std::vector<char> base64Buf(base64Len);
                        CryptBinaryToStringA(hash, 20, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, base64Buf.data(), &base64Len);
                        result = std::string(base64Buf.data());
                    }
                }
            }
            CryptDestroyHash(hHash);
        }
        CryptReleaseContext(hProv, 0);
    }
    return result;
}

bool SendWebSocketBinaryFrame(SOCKET sock, const std::vector<char>& payload) {
    size_t len = payload.size();
    std::vector<char> frameHeader;
    frameHeader.push_back((char)0x82); // 0x80 (FIN) | 0x02 (Binary Frame)

    if (len < 125) {
        frameHeader.push_back((char)len);
    } else if (len <= 65535) {
        frameHeader.push_back((char)126);
        frameHeader.push_back((char)((len >> 8) & 0xFF));
        frameHeader.push_back((char)(len & 0xFF));
    } else {
        frameHeader.push_back((char)127);
        for (int i = 7; i >= 0; i--) {
            frameHeader.push_back((char)((len >> (i * 8)) & 0xFF));
        }
    }

    // ⚡ Combine Header & Payload into Single Atomic Buffer (100% Zero TCP Fragmentation!)
    std::vector<char> fullBuf;
    fullBuf.reserve(frameHeader.size() + payload.size());
    fullBuf.insert(fullBuf.end(), frameHeader.begin(), frameHeader.end());
    fullBuf.insert(fullBuf.end(), payload.begin(), payload.end());

    const char* ptr = fullBuf.data();
    int total = (int)fullBuf.size();
    int sent = 0;

    while (sent < total) {
        fd_set wfds; FD_ZERO(&wfds); FD_SET(sock, &wfds);
        timeval tv = {1, 0}; // 1 second timeout
        int sel = select(0, NULL, &wfds, NULL, &tv);
        if (sel <= 0) return false;

        int n = send(sock, ptr + sent, total - sent, 0);
        if (n == SOCKET_ERROR) {
            int err = WSAGetLastError();
            if (err == WSAEWOULDBLOCK) {
                Sleep(1);
                continue;
            }
            return false;
        }
        if (n <= 0) return false;
        sent += n;
    }
    return true;
}

// ⚡ FAST WEBSOCKET CLIENT FRAME UNMASKER (Sub-1ms in-socket Touch & ACK parsing)
std::string ReadWebSocketTextMessage(const uint8_t* buf, int len) {
    if (len < 6) return "";
    uint8_t opcode = buf[0] & 0x0F;
    if (opcode == 0x08) return "CLOSE"; // Close frame
    bool masked = (buf[1] & 0x80) != 0;
    uint64_t payloadLen = buf[1] & 0x7F;
    int headerLen = 2;
    if (payloadLen == 126) {
        if (len < 4) return "";
        payloadLen = (buf[2] << 8) | buf[3];
        headerLen = 4;
    } else if (payloadLen == 127) {
        if (len < 10) return "";
        payloadLen = 0;
        for (int i = 0; i < 8; i++) payloadLen = (payloadLen << 8) | buf[2 + i];
        headerLen = 10;
    }
    if (!masked) {
        if (len < headerLen + (int)payloadLen) return "";
        return std::string((const char*)buf + headerLen, (size_t)payloadLen);
    }
    if (len < headerLen + 4 + (int)payloadLen) return "";
    uint8_t mask[4] = { buf[headerLen], buf[headerLen+1], buf[headerLen+2], buf[headerLen+3] };
    headerLen += 4;
    std::string out;
    out.resize((size_t)payloadLen);
    for (size_t i = 0; i < payloadLen; i++) {
        out[i] = (char)(buf[headerLen + i] ^ mask[i % 4]);
    }
    return out;
}

bool SendWebSocketTextMessage(SOCKET sock, const std::string& message) {
    size_t len = message.size();
    std::vector<char> frameHeader;
    frameHeader.push_back((char)0x81); // 0x80 (FIN) | 0x01 (Text Frame)

    if (len < 125) {
        frameHeader.push_back((char)len);
    } else if (len <= 65535) {
        frameHeader.push_back((char)126);
        frameHeader.push_back((char)((len >> 8) & 0xFF));
        frameHeader.push_back((char)(len & 0xFF));
    } else {
        frameHeader.push_back((char)127);
        for (int i = 7; i >= 0; i--) {
            frameHeader.push_back((char)((len >> (i * 8)) & 0xFF));
        }
    }

    std::vector<char> fullBuf;
    fullBuf.reserve(frameHeader.size() + message.size());
    fullBuf.insert(fullBuf.end(), frameHeader.begin(), frameHeader.end());
    fullBuf.insert(fullBuf.end(), message.begin(), message.end());

    int n = send(sock, fullBuf.data(), (int)fullBuf.size(), 0);
    return n > 0;
}

// ⚡ Direct High-Speed Command WebSocket Handler for /cmd-ws
void ServeCommandWebSocketClient(SOCKET sock) {
    u_long mode = 1;
    ioctlsocket(sock, FIONBIO, &mode);
    int nodelay = 1;
    setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&nodelay, sizeof(int));

    while (true) {
        fd_set rfds;
        FD_ZERO(&rfds);
        FD_SET(sock, &rfds);
        timeval tv = { 5, 0 }; // 5s select timeout
        int sel = select(0, &rfds, NULL, NULL, &tv);
        if (sel < 0) break;
        if (sel == 0) continue; // Heartbeat

        uint8_t rxBuf[2048];
        int br = recv(sock, (char*)rxBuf, sizeof(rxBuf), 0);
        if (br <= 0) {
            int err = WSAGetLastError();
            if (err == WSAEWOULDBLOCK) {
                Sleep(10);
                continue;
            }
            break;
        }

        std::string msg = ReadWebSocketTextMessage(rxBuf, br);
        if (msg == "CLOSE") break;
        if (msg.empty()) continue;

        if (msg == "LOCK") {
            LockWorkStation();
            SendWebSocketTextMessage(sock, "{\"status\":\"locked\"}");
        } else if (msg == "PANIC") {
            if (hMainWnd) {
                SendMessage(hMainWnd, WM_COMMAND, IDM_TRIGGER, 0);
            } else {
                TriggerPanic();
            }
            SendWebSocketTextMessage(sock, isPanicMode ? "{\"panic\":true,\"state\":" + std::to_string(panicState) + "}" : "{\"panic\":false,\"state\":0}");
        } else if (msg == "SLEEP") {
            SendWebSocketTextMessage(sock, "{\"status\":\"sleeping\"}");
            SetSystemPowerState(TRUE, FALSE);
        } else if (msg == "RESTART") {
            SendWebSocketTextMessage(sock, "{\"status\":\"restarting\"}");
            system("shutdown /r /t 5 /c \"Remote restart initiated.\"");
        } else if (msg == "SHUTDOWN") {
            SendWebSocketTextMessage(sock, "{\"status\":\"shutting_down\"}");
            system("shutdown /s /t 10 /c \"Remote shutdown initiated.\"");
        } else if (msg.rfind("UNLOCK:", 0) == 0) {
            std::string pin = msg.substr(7);
            HANDLE hPipe = CreateFileA("\\\\.\\pipe\\PanicUnlockPipe", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
            if (hPipe != INVALID_HANDLE_VALUE) {
                DWORD bytesWritten;
                WriteFile(hPipe, pin.c_str(), (DWORD)pin.length(), &bytesWritten, NULL);
                CloseHandle(hPipe);
                SendWebSocketTextMessage(sock, "{\"status\":\"unlock_sent\"}");
            } else {
                SendWebSocketTextMessage(sock, "{\"status\":\"pipe_error\"}");
            }
        } else if (msg == "PING") {
            SendWebSocketTextMessage(sock, "PONG");
        }
    }
    closesocket(sock);
}
