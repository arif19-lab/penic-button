#pragma once

#include <winsock2.h>
#include <windows.h>
#include <string>
#include <vector>
#include <cstdint>

// 📡 WEBSOCKET SHA-1 & BINARY/TEXT FRAME ENCODER
std::string CalculateWebSocketAcceptKey(const std::string& clientKey);
bool SendWebSocketBinaryFrame(SOCKET sock, const std::vector<char>& payload);
bool SendWebSocketTextMessage(SOCKET sock, const std::string& message);
std::string ReadWebSocketTextMessage(const uint8_t* buf, int len);
void ServeCommandWebSocketClient(SOCKET sock);
