#include "Globals.h"
#include <ctime>
#include <cstdlib>
#include <wtsapi32.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <iphlpapi.h>
#include <vector>
#include <string>

std::string g_dynamicKey = "imran2024";
std::atomic<time_t> g_lastClientActivity{0};
std::atomic<int> g_tailscaleState{0}; // TS_SCANNING
std::atomic<bool> g_tailscaleInstalled{false};

std::string GetLocalIP() {
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
            if ((hostOrder & 0xFFC00000UL) != 0x64400000UL) continue;

            char text[INET_ADDRSTRLEN] = {};
            if (inet_ntop(AF_INET, &ipv4->sin_addr, text, sizeof(text))) {
                return std::string(text);
            }
        }
    }
    return "";
}

std::string GetTailscaleCliPath() {
    char pf[MAX_PATH];
    if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH)) {
        std::string p1 = std::string(pf) + "\\Tailscale\\tailscale.exe";
        if (GetFileAttributesA(p1.c_str()) != INVALID_FILE_ATTRIBUTES) return "\"" + p1 + "\"";
        std::string p2 = std::string(pf) + "\\Tailscale IPN\\tailscale.exe";
        if (GetFileAttributesA(p2.c_str()) != INVALID_FILE_ATTRIBUTES) return "\"" + p2 + "\"";
    }
    if (GetEnvironmentVariableA("ProgramFiles(x86)", pf, MAX_PATH)) {
        std::string p1 = std::string(pf) + "\\Tailscale\\tailscale.exe";
        if (GetFileAttributesA(p1.c_str()) != INVALID_FILE_ATTRIBUTES) return "\"" + p1 + "\"";
    }
    return "tailscale.exe";
}

static std::string RunProcessCaptureOutput(const std::string& cmdLine, DWORD timeoutMs = 2500) {
    SECURITY_ATTRIBUTES sa = { sizeof(sa), NULL, TRUE };
    HANDLE hRead = NULL, hWrite = NULL;
    if (!CreatePipe(&hRead, &hWrite, &sa, 0)) return "";
    SetHandleInformation(hRead, HANDLE_FLAG_INHERIT, 0);

    STARTUPINFOA si = { sizeof(si) };
    si.dwFlags = STARTF_USESHOWWINDOW | STARTF_USESTDHANDLES;
    si.wShowWindow = SW_HIDE;
    si.hStdOutput = hWrite;
    si.hStdError = hWrite;
    si.hStdInput = NULL;

    PROCESS_INFORMATION pi = { 0 };
    std::vector<char> buf(cmdLine.begin(), cmdLine.end());
    buf.push_back('\0');

    std::string output = "";
    if (CreateProcessA(NULL, buf.data(), NULL, NULL, TRUE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        CloseHandle(hWrite);
        hWrite = NULL;

        char readBuf[4096];
        DWORD bytesRead = 0;
        while (ReadFile(hRead, readBuf, sizeof(readBuf) - 1, &bytesRead, NULL) && bytesRead > 0) {
            readBuf[bytesRead] = '\0';
            output.append(readBuf, bytesRead);
        }

        WaitForSingleObject(pi.hProcess, timeoutMs);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    if (hWrite) CloseHandle(hWrite);
    if (hRead) CloseHandle(hRead);
    return output;
}

std::string GetTailscaleDNS() {
    static std::string s_cachedDns = "";
    static time_t s_lastDnsCheck = 0;
    static CRITICAL_SECTION s_dnsCs;
    static bool s_csInit = false;
    if (!s_csInit) {
        InitializeCriticalSection(&s_dnsCs);
        s_csInit = true;
    }

    EnterCriticalSection(&s_dnsCs);
    time_t now = time(NULL);
    if (!s_cachedDns.empty()) {
        if (now - s_lastDnsCheck < 60) {
            std::string dns = s_cachedDns;
            LeaveCriticalSection(&s_dnsCs);
            return dns;
        }
    } else {
        // If DNS is not yet cached, allow retry at most once per second to avoid CPU spin
        if (s_lastDnsCheck > 0 && (now - s_lastDnsCheck < 1)) {
            LeaveCriticalSection(&s_dnsCs);
            return "";
        }
    }
    s_lastDnsCheck = now;

    std::string cmd = GetTailscaleCliPath() + " status --json";
    LeaveCriticalSection(&s_dnsCs);

    std::string json = RunProcessCaptureOutput(cmd, 2500);

    EnterCriticalSection(&s_dnsCs);
    // 1. Try CertDomains first (clean FQDN without trailing dot)
    size_t cdPos = json.find("\"CertDomains\":");
    if (cdPos != std::string::npos) {
        size_t start = json.find("\"", cdPos + 14);
        if (start != std::string::npos) {
            size_t end = json.find("\"", start + 1);
            if (end != std::string::npos && end > start + 1) {
                std::string domain = json.substr(start + 1, end - start - 1);
                while (!domain.empty() && (domain.back() == '.' || domain.back() == ' ')) {
                    domain.pop_back();
                }
                if (!domain.empty() && domain.find('.') != std::string::npos) {
                    s_cachedDns = domain;
                    s_lastDnsCheck = time(NULL);
                    std::string res = s_cachedDns;
                    LeaveCriticalSection(&s_dnsCs);
                    return res;
                }
            }
        }
    }

    // 2. Fallback to Self.DNSName
    size_t selfPos = json.find("\"Self\":");
    size_t searchPos = (selfPos != std::string::npos) ? selfPos : 0;
    size_t pos = json.find("\"DNSName\":", searchPos);
    if (pos != std::string::npos) {
        size_t quoteStart = json.find("\"", pos + 10);
        if (quoteStart != std::string::npos) {
            size_t quoteEnd = json.find("\"", quoteStart + 1);
            if (quoteEnd != std::string::npos && quoteEnd > quoteStart + 1) {
                std::string dns = json.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
                while (!dns.empty() && (dns.back() == '.' || dns.back() == ' ')) {
                    dns.pop_back();
                }
                if (!dns.empty() && dns.find('.') != std::string::npos) {
                    s_cachedDns = dns;
                    s_lastDnsCheck = time(NULL);
                    std::string res = s_cachedDns;
                    LeaveCriticalSection(&s_dnsCs);
                    return res;
                }
            }
        }
    }

    std::string res = s_cachedDns;
    LeaveCriticalSection(&s_dnsCs);
    return res;
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
