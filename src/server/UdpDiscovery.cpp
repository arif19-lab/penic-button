#include "UdpDiscovery.h"
#include "../core/Logger.h"
#include "../core/Globals.h"
#include <string>
#include <cstring>

// ⚡ REAL-TIME UDP DATAGRAM STREAM ENGINE (Zero Head-of-Line Blocking)
SOCKET g_udpSocket = INVALID_SOCKET;
sockaddr_in g_udpClientAddr;
bool g_hasUdpClient = false;
uint16_t g_udpFrameSeq = 0;

void InitUDPSocket() {
    if (g_udpSocket != INVALID_SOCKET) return;
    g_udpSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (g_udpSocket != INVALID_SOCKET) {
        u_long mode = 1; // Non-blocking
        ioctlsocket(g_udpSocket, FIONBIO, &mode);
    }
}

void SendUDPDatagramFrame(const std::vector<char>& payload) {
    if (!g_hasUdpClient || g_udpSocket == INVALID_SOCKET || payload.empty()) return;

    g_udpFrameSeq++;
    size_t totalLen = payload.size();
    size_t chunkSize = 1300; // 1300 bytes fits safely inside 1500 Wi-Fi MTU
    uint8_t totalChunks = (uint8_t)((totalLen + chunkSize - 1) / chunkSize);

    for (uint8_t i = 0; i < totalChunks; i++) {
        size_t offset = i * chunkSize;
        size_t thisChunkLen = (offset + chunkSize > totalLen) ? (totalLen - offset) : chunkSize;

        std::vector<char> packet;
        packet.reserve(6 + thisChunkLen);
        // Header: [seq_hi, seq_lo, chunk_idx, total_chunks, len_hi, len_lo]
        packet.push_back((char)((g_udpFrameSeq >> 8) & 0xFF));
        packet.push_back((char)(g_udpFrameSeq & 0xFF));
        packet.push_back((char)i);
        packet.push_back((char)totalChunks);
        packet.push_back((char)((thisChunkLen >> 8) & 0xFF));
        packet.push_back((char)(thisChunkLen & 0xFF));

        packet.insert(packet.end(), payload.begin() + offset, payload.begin() + offset + thisChunkLen);

        sendto(g_udpSocket, packet.data(), (int)packet.size(), 0, (SOCKADDR*)&g_udpClientAddr, sizeof(g_udpClientAddr));
    }
}

// 📡 UDP Auto-Discovery Responder Thread (Port 8888)
DWORD WINAPI UdpAutoDiscoveryThread(LPVOID lpParam) {
    SOCKET discSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (discSocket == INVALID_SOCKET) return 0;

    BOOL optval = TRUE;
    setsockopt(discSocket, SOL_SOCKET, SO_REUSEADDR, (char*)&optval, sizeof(optval));
    setsockopt(discSocket, SOL_SOCKET, SO_BROADCAST, (char*)&optval, sizeof(optval));

    sockaddr_in serverAddr = {0};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(8888);
    serverAddr.sin_addr.s_addr = INADDR_ANY;

    if (bind(discSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        closesocket(discSocket);
        return 0;
    }

    AppLog("UDPDiscovery: Listening for Android Auto-Discovery on UDP port 8888...");

    char buffer[256];
    sockaddr_in clientAddr;
    int clientLen = sizeof(clientAddr);

    while (true) {
        int bytesRecv = recvfrom(discSocket, buffer, sizeof(buffer) - 1, 0, (SOCKADDR*)&clientAddr, &clientLen);
        if (bytesRecv > 0) {
            buffer[bytesRecv] = '\0';
            std::string req(buffer);
            if (req.find("PANIC_DISCOVER_REQ") != std::string::npos) {
                std::string tsIp = GetTailscaleIP();
                std::string localIp = GetLocalIP();
                // ⚡ Prioritize Tailscale IP for worldwide connectivity, fallback to local LAN
                std::string primaryIp = (!tsIp.empty()) ? tsIp : localIp;
                std::string resp = "PANIC_DISCOVER_RESP:http://" + primaryIp + ":8085/?key=" + g_dynamicKey;
                if (!tsIp.empty()) {
                    resp += ";TAILSCALE=http://" + tsIp + ":8085/?key=" + g_dynamicKey;
                }
                resp += ";LOCAL=http://" + localIp + ":8085/?key=" + g_dynamicKey;
                sendto(discSocket, resp.c_str(), (int)resp.length(), 0, (SOCKADDR*)&clientAddr, clientLen);
            }
        }
        Sleep(50);
    }
    closesocket(discSocket);
    return 0;
}
