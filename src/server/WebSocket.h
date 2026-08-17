#pragma once
#include <winsock2.h>
#include <windows.h>
#include <string>
#include <vector>
#include <cstdint>

namespace WebSocket {
    std::string CalculateWebSocketAcceptKey(const std::string& clientKey);
    bool SendWebSocketBinaryFrame(SOCKET sock, const std::vector<char>& payload);
    bool SendWebSocketTextFrame(SOCKET sock, const std::string& text);
    std::string ReadWebSocketTextMessage(const uint8_t* buf, int len);
}
