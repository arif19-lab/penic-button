#pragma once

#include <winsock2.h>
#include <windows.h>
#include <vector>
#include <cstdint>

// ⚡ REAL-TIME UDP DATAGRAM STREAM ENGINE (Zero Head-of-Line Blocking)
extern SOCKET g_udpSocket;
extern sockaddr_in g_udpClientAddr;
extern bool g_hasUdpClient;
extern uint16_t g_udpFrameSeq;

void InitUDPSocket();
void SendUDPDatagramFrame(const std::vector<char>& payload);
DWORD WINAPI UdpAutoDiscoveryThread(LPVOID lpParam);
