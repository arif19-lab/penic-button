#include "Globals.h"
#include <ctime>
#include <cstdlib>
#include <wtsapi32.h>

std::string g_dynamicKey = "imran2024";

std::string GetLocalIP() {
    char ac[80];
    if (gethostname(ac, sizeof(ac)) == SOCKET_ERROR) return "127.0.0.1";
    struct hostent *phe = gethostbyname(ac);
    if (phe == 0) return "127.0.0.1";
    
    std::string fallback = "";
    for (int i = 0; phe->h_addr_list[i] != 0; ++i) {
        struct in_addr addr;
        memcpy(&addr, phe->h_addr_list[i], sizeof(struct in_addr));
        std::string ip = inet_ntoa(addr);
        if (ip.find("192.168.") == 0) {
            if (ip == "192.168.137.1") continue;
            return ip; 
        }
        if (ip.find("10.") == 0 || ip.find("172.") == 0) fallback = ip;
    }
    
    if (!fallback.empty()) return fallback;
    return "127.0.0.1";
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
