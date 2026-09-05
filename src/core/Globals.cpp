#include "Globals.h"
#include <ctime>
#include <cstdlib>
#include <wtsapi32.h>

std::string g_dynamicKey = "imran2024";

#include <winsock2.h>
#include <ws2tcpip.h>
#include <iphlpapi.h>
#include <vector>

std::string GetLocalIP() {
    // 🚀 1. Primary Method: Kernel-level UDP socket routing probe
    // Connects to a standard router/gateway target to determine the EXACT active interface selected by Windows kernel routing table
    SOCKET probeSock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (probeSock != INVALID_SOCKET) {
        sockaddr_in remoteAddr = {0};
        remoteAddr.sin_family = AF_INET;
        remoteAddr.sin_port = htons(53);
        inet_pton(AF_INET, "8.8.8.8", &remoteAddr.sin_addr);

        if (connect(probeSock, (sockaddr*)&remoteAddr, sizeof(remoteAddr)) != SOCKET_ERROR) {
            sockaddr_in localAddr = {0};
            int addrLen = sizeof(localAddr);
            if (getsockname(probeSock, (sockaddr*)&localAddr, &addrLen) != SOCKET_ERROR) {
                char ipStr[INET_ADDRSTRLEN] = {0};
                inet_ntop(AF_INET, &localAddr.sin_addr, ipStr, sizeof(ipStr));
                closesocket(probeSock);
                if (strlen(ipStr) > 0 && strcmp(ipStr, "0.0.0.0") != 0 && strcmp(ipStr, "127.0.0.1") != 0) {
                    return std::string(ipStr);
                }
            }
        }
        closesocket(probeSock);
    }

    // 🚀 2. Secondary Method: GetAdaptersAddresses (filtering only ACTIVE physical up adapters)
    ULONG outBufLen = 15000;
    std::vector<BYTE> buffer(outBufLen);
    PIP_ADAPTER_ADDRESSES pAddresses = (IP_ADAPTER_ADDRESSES*)buffer.data();

    if (GetAdaptersAddresses(AF_INET, GAA_FLAG_INCLUDE_GATEWAYS, NULL, pAddresses, &outBufLen) == ERROR_BUFFER_OVERFLOW) {
        buffer.resize(outBufLen);
        pAddresses = (IP_ADAPTER_ADDRESSES*)buffer.data();
    }

    if (GetAdaptersAddresses(AF_INET, GAA_FLAG_INCLUDE_GATEWAYS, NULL, pAddresses, &outBufLen) == NO_ERROR) {
        std::string fallback = "";
        for (PIP_ADAPTER_ADDRESSES pCurr = pAddresses; pCurr != NULL; pCurr = pCurr->Next) {
            if (pCurr->OperStatus != IfOperStatusUp) continue;
            if (pCurr->IfType == IF_TYPE_SOFTWARE_LOOPBACK || pCurr->IfType == IF_TYPE_TUNNEL) continue;

            for (PIP_ADAPTER_UNICAST_ADDRESS pUnicast = pCurr->FirstUnicastAddress; pUnicast != NULL; pUnicast = pUnicast->Next) {
                sockaddr_in* sa_in = (sockaddr_in*)pUnicast->Address.lpSockaddr;
                if (sa_in && sa_in->sin_family == AF_INET) {
                    char ipStr[INET_ADDRSTRLEN] = {0};
                    inet_ntop(AF_INET, &(sa_in->sin_addr), ipStr, sizeof(ipStr));
                    std::string ip(ipStr);
                    if (ip.find("192.168.") == 0) {
                        if (ip != "192.168.137.1") return ip;
                    }
                    if (ip.find("10.") == 0 || ip.find("172.") == 0) {
                        fallback = ip;
                    }
                }
            }
        }
        if (!fallback.empty()) return fallback;
    }

    return "127.0.0.1";
}

std::string GetTailscaleIP() {
    ULONG outBufLen = 15000;
    std::vector<BYTE> buffer(outBufLen);
    PIP_ADAPTER_ADDRESSES addresses = (PIP_ADAPTER_ADDRESSES)buffer.data();

    DWORD result = GetAdaptersAddresses(AF_INET, 0, NULL, addresses, &outBufLen);
    if (result == ERROR_BUFFER_OVERFLOW) {
        buffer.resize(outBufLen);
        addresses = (PIP_ADAPTER_ADDRESSES)buffer.data();
        result = GetAdaptersAddresses(AF_INET, 0, NULL, addresses, &outBufLen);
    }
    if (result != NO_ERROR) return "";

    for (PIP_ADAPTER_ADDRESSES adapter = addresses; adapter; adapter = adapter->Next) {
        if (adapter->OperStatus != IfOperStatusUp) continue;
        for (PIP_ADAPTER_UNICAST_ADDRESS address = adapter->FirstUnicastAddress;
             address; address = address->Next) {
            sockaddr_in* ipv4 = (sockaddr_in*)address->Address.lpSockaddr;
            if (!ipv4 || ipv4->sin_family != AF_INET) continue;

            unsigned long hostOrder = ntohl(ipv4->sin_addr.S_un.S_addr);
            // Tailscale allocates IPv4 addresses from 100.64.0.0/10.
            if ((hostOrder & 0xFFC00000UL) != 0x64400000UL) continue;

            char text[INET_ADDRSTRLEN] = {};
            if (inet_ntop(AF_INET, &ipv4->sin_addr, text, sizeof(text))) {
                return std::string(text);
            }
        }
    }
    return "";
}

void GenerateDynamicKey() {
    const char charset[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    g_dynamicKey = "";
    srand((unsigned int)time(NULL));
    for (int i = 0; i < 8; ++i) {
        g_dynamicKey += charset[rand() % (sizeof(charset) - 1)];
    }
}

bool IsWorkstationLocked() {
    HDESK hDesktop = OpenInputDesktop(0, FALSE, DESKTOP_SWITCHDESKTOP);
    if (hDesktop == NULL) {
        return true;
    }
    CloseDesktop(hDesktop);
    return false;
}

std::string GetProgramDataFolder() {
    char buf[MAX_PATH] = {0};
    DWORD len = GetEnvironmentVariableA("ProgramData", buf, MAX_PATH);
    if (len > 0 && len < MAX_PATH) {
        return std::string(buf) + "\\PanicButton";
    }
    return "C:\\ProgramData\\PanicButton";
}
