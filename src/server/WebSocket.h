#pragma once

#include <winsock2.h>
#include <windows.h>
#include <string>
#include <vector>
#include <cstdint>

// 📡 WEBSOCKET SHA-1 & BINARY FRAME ENCODER (Sub-1ms Browser GPU Canvas Stream)
std::string CalculateWebSocketAcceptKey(const std::string& clientKey);
bool SendWebSocketBinaryFrame(SOCKET sock, const std::vector<char>& payload);
std::string ReadWebSocketTextMessage(const uint8_t* buf, int len);
