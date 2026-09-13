#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <wtsapi32.h>
#include <userenv.h>
#include <tlhelp32.h>
#include <string>
#include <vector>
#include <cstdio>
#include "src/ui/WebAssets.h"

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "wtsapi32.lib")
#pragma comment(lib, "userenv.lib")
#pragma comment(lib, "advapi32.lib")

#define SERVICE_NAME "PanicMasterService"
#define SERVICE_DISPLAY_NAME "Panic Master Control Service"

SERVICE_STATUS g_SvcStatus;
SERVICE_STATUS_HANDLE g_SvcStatusHandle;
HANDLE g_SvcStopEvent = NULL;

DWORD GetActiveSessionId() {
    DWORD sessionId = WTSGetActiveConsoleSessionId();
    if (sessionId != 0xFFFFFFFF) return sessionId;

    PWTS_SESSION_INFOA pSessionInfo = NULL;
    DWORD count = 0;
    if (WTSEnumerateSessionsA(WTS_CURRENT_SERVER_HANDLE, 0, 1, &pSessionInfo, &count)) {
        for (DWORD i = 0; i < count; i++) {
            if (pSessionInfo[i].State == WTSActive) {
                sessionId = pSessionInfo[i].SessionId;
                break;
            }
        }
        WTSFreeMemory(pSessionInfo);
    }
    return sessionId;
}

bool IsProcessRunning(const char* procName) {
    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap == INVALID_HANDLE_VALUE) return false;
    PROCESSENTRY32 pe = { sizeof(pe) };
    bool found = false;
    if (Process32First(hSnap, &pe)) {
        do {
            if (_stricmp(pe.szExeFile, procName) == 0) {
                found = true;
                break;
            }
        } while (Process32Next(hSnap, &pe));
    }
    CloseHandle(hSnap);
    return found;
}

void LaunchAgentInSession(DWORD sessionId) {
    HANDLE hToken = NULL;
    if (!WTSQueryUserToken(sessionId, &hToken)) {
        return;
    }

    HANDLE hPrimaryToken = NULL;
    if (!DuplicateTokenEx(hToken, MAXIMUM_ALLOWED, NULL, SecurityIdentification, TokenPrimary, &hPrimaryToken)) {
        CloseHandle(hToken);
        return;
    }

    LPVOID lpEnv = NULL;
    if (!CreateEnvironmentBlock(&lpEnv, hPrimaryToken, FALSE)) {
        lpEnv = NULL;
    }

    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    std::string exeDir = szPath;
    size_t pos = exeDir.find_last_of("\\/");
    if (pos != std::string::npos) exeDir = exeDir.substr(0, pos);
    
    std::string agentPath = exeDir + "\\PanicButton.exe";
    if (GetFileAttributesA(agentPath.c_str()) == INVALID_FILE_ATTRIBUTES) {
        agentPath = "C:\\ProgramData\\PanicButton\\PanicButton.exe";
    }

    STARTUPINFOA si = { sizeof(si) };
    si.lpDesktop = (LPSTR)"winsta0\\default";
    PROCESS_INFORMATION pi = { 0 };

    CreateProcessAsUserA(
        hPrimaryToken,
        NULL,
        (LPSTR)agentPath.c_str(),
        NULL,
        NULL,
        FALSE,
        NORMAL_PRIORITY_CLASS | CREATE_NEW_CONSOLE,
        lpEnv,
        exeDir.c_str(),
        &si,
        &pi
    );

    if (pi.hProcess) CloseHandle(pi.hProcess);
    if (pi.hThread) CloseHandle(pi.hThread);
    if (lpEnv) DestroyEnvironmentBlock(lpEnv);
    CloseHandle(hPrimaryToken);
    CloseHandle(hToken);
}

VOID WINAPI ServiceReportStatus(DWORD dwCurrentState, DWORD dwWin32ExitCode, DWORD dwWaitHint) {
    static DWORD dwCheckPoint = 1;
    g_SvcStatus.dwCurrentState = dwCurrentState;
    g_SvcStatus.dwWin32ExitCode = dwWin32ExitCode;
    g_SvcStatus.dwWaitHint = dwWaitHint;
    if (dwCurrentState == SERVICE_START_PENDING) g_SvcStatus.dwControlsAccepted = 0;
    else g_SvcStatus.dwControlsAccepted = SERVICE_ACCEPT_STOP | SERVICE_ACCEPT_SHUTDOWN;
    if ((dwCurrentState == SERVICE_RUNNING) || (dwCurrentState == SERVICE_STOPPED)) g_SvcStatus.dwCheckPoint = 0;
    else g_SvcStatus.dwCheckPoint = dwCheckPoint++;
    SetServiceStatus(g_SvcStatusHandle, &g_SvcStatus);
}

VOID WINAPI ServiceCtrlHandler(DWORD dwCtrl) {
    switch (dwCtrl) {
        case SERVICE_CONTROL_STOP:
        case SERVICE_CONTROL_SHUTDOWN:
            ServiceReportStatus(SERVICE_STOP_PENDING, NO_ERROR, 0);
            if (g_SvcStopEvent) SetEvent(g_SvcStopEvent);
            ServiceReportStatus(g_SvcStatus.dwCurrentState, NO_ERROR, 0);
            return;
        default: break;
    }
}

void WakeSystemAndDisplay() {
    // 1. Kernel Power Request: tell Windows display and system are required
    SetThreadExecutionState(ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED | ES_CONTINUOUS);

    // 2. Hardware GPU Reset Signal: Win + Ctrl + Shift + B (Official WDDM Graphics Driver Reset)
    keybd_event(VK_LWIN, (BYTE)MapVirtualKey(VK_LWIN, MAPVK_VK_TO_VSC), 0, 0);
    keybd_event(VK_CONTROL, (BYTE)MapVirtualKey(VK_CONTROL, MAPVK_VK_TO_VSC), 0, 0);
    keybd_event(VK_SHIFT, (BYTE)MapVirtualKey(VK_SHIFT, MAPVK_VK_TO_VSC), 0, 0);
    keybd_event('B', (BYTE)MapVirtualKey('B', MAPVK_VK_TO_VSC), 0, 0);
    Sleep(25);
    keybd_event('B', (BYTE)MapVirtualKey('B', MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    keybd_event(VK_SHIFT, (BYTE)MapVirtualKey(VK_SHIFT, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    keybd_event(VK_CONTROL, (BYTE)MapVirtualKey(VK_CONTROL, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    keybd_event(VK_LWIN, (BYTE)MapVirtualKey(VK_LWIN, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);

    // 3. Dispatch __WAKE__ directly to LogonUI pipe if locked (with retries)
    for (int retry = 0; retry < 5; ++retry) {
        HANDLE hPipe = CreateFileA("\\\\.\\pipe\\PanicUnlockPipe", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
        if (hPipe != INVALID_HANDLE_VALUE) {
            const char* wakeCmd = "__WAKE__";
            DWORD dwWritten = 0;
            WriteFile(hPipe, wakeCmd, (DWORD)strlen(wakeCmd), &dwWritten, NULL);
            CloseHandle(hPipe);
            break;
        }
        if (WaitNamedPipeA("\\\\.\\pipe\\PanicUnlockPipe", 150)) {
            continue;
        }
        Sleep(80);
    }

    // 5. Force graphics adapter signal re-train
    ChangeDisplaySettings(NULL, 0);

    // 4. Launch instant wake trigger in active user session
    DWORD activeSession = GetActiveSessionId();
    if (activeSession != 0xFFFFFFFF) {
        HANDLE hToken = NULL;
        if (WTSQueryUserToken(activeSession, &hToken)) {
            HANDLE hPrimaryToken = NULL;
            if (DuplicateTokenEx(hToken, MAXIMUM_ALLOWED, NULL, SecurityIdentification, TokenPrimary, &hPrimaryToken)) {
                LPVOID lpEnv = NULL;
                CreateEnvironmentBlock(&lpEnv, hPrimaryToken, FALSE);

                char szPath[MAX_PATH];
                GetModuleFileNameA(NULL, szPath, MAX_PATH);
                std::string exeDir = szPath;
                size_t pos = exeDir.find_last_of("\\/");
                if (pos != std::string::npos) exeDir = exeDir.substr(0, pos);
                std::string agentPath = exeDir + "\\PanicButton.exe";
                if (GetFileAttributesA(agentPath.c_str()) == INVALID_FILE_ATTRIBUTES) {
                    agentPath = "C:\\ProgramData\\PanicButton\\PanicButton.exe";
                }

                STARTUPINFOA si = { sizeof(si) };
                si.lpDesktop = (LPSTR)"winsta0\\default";
                PROCESS_INFORMATION pi = { 0 };
                std::string cmd = "\"" + agentPath + "\" --wake";

                CreateProcessAsUserA(
                    hPrimaryToken,
                    NULL,
                    (LPSTR)cmd.c_str(),
                    NULL,
                    NULL,
                    FALSE,
                    NORMAL_PRIORITY_CLASS,
                    lpEnv,
                    exeDir.c_str(),
                    &si,
                    &pi
                );

                if (pi.hProcess) {
                    WaitForSingleObject(pi.hProcess, 1000);
                    CloseHandle(pi.hProcess);
                }
                if (pi.hThread) CloseHandle(pi.hThread);
                if (lpEnv) DestroyEnvironmentBlock(lpEnv);
                CloseHandle(hPrimaryToken);
            }
            CloseHandle(hToken);
        }
    }
}

DWORD WINAPI WakeGatewayThread(LPVOID lpParam) {
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);

    // 1. Create TCP listener on port 8086 for HTTP /wake
    SOCKET tcpSock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    sockaddr_in tcpAddr;
    tcpAddr.sin_family = AF_INET;
    tcpAddr.sin_addr.s_addr = INADDR_ANY;
    tcpAddr.sin_port = htons(8086);
    int opt = 1;
    setsockopt(tcpSock, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
    bind(tcpSock, (sockaddr*)&tcpAddr, sizeof(tcpAddr));
    listen(tcpSock, 5);

    // 2. Create UDP listener on port 9 for Wake-on-LAN Magic Packets
    SOCKET udpSock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    sockaddr_in udpAddr;
    udpAddr.sin_family = AF_INET;
    udpAddr.sin_addr.s_addr = INADDR_ANY;
    udpAddr.sin_port = htons(9);
    setsockopt(udpSock, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
    bind(udpSock, (sockaddr*)&udpAddr, sizeof(udpAddr));

    // Polling loop with select()
    while (g_SvcStopEvent && WaitForSingleObject(g_SvcStopEvent, 0) == WAIT_TIMEOUT) {
        fd_set fds;
        FD_ZERO(&fds);
        FD_SET(tcpSock, &fds);
        FD_SET(udpSock, &fds);

        timeval tv;
        tv.tv_sec = 1;
        tv.tv_usec = 0;

        int sel = select(0, &fds, NULL, NULL, &tv);
        if (sel > 0) {
            if (FD_ISSET(tcpSock, &fds)) {
                SOCKET client = accept(tcpSock, NULL, NULL);
                if (client != INVALID_SOCKET) {
                    char buf[1024] = {0};
                    int r = recv(client, buf, sizeof(buf) - 1, 0);
                    if (r > 0) {
                        std::string req(buf, r);
                        if (req.find("GET /wake") != std::string::npos || req.find("GET /api/wake") != std::string::npos) {
                            WakeSystemAndDisplay();
                            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n{\"status\":\"woken\"}";
                            send(client, res.c_str(), (int)res.size(), 0);
                        }
                    }
                    closesocket(client);
                }
            }
            if (FD_ISSET(udpSock, &fds)) {
                char ubuf[256];
                sockaddr_in sender;
                int senderLen = sizeof(sender);
                int r = recvfrom(udpSock, ubuf, sizeof(ubuf), 0, (sockaddr*)&sender, &senderLen);
                if (r >= 102) { // 6 * 0xFF + 16 * MAC = 102 bytes
                    WakeSystemAndDisplay();
                }
            }
        }
    }

    closesocket(tcpSock);
    closesocket(udpSock);
    WSACleanup();
    return 0;
}

// Self-configure boot behavior on every start (SYSTEM has rights for this):
// - Depend on Tailscale so the phone path exists before we serve it.
// - No delayed start (serve lock screen ASAP after reboot).
// - Auto-restart on crash so boot-time coverage never silently dies.
void EnsureServiceConfig() {
    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_CONNECT);
    if (!schSCManager) return;
    SC_HANDLE schService = OpenServiceA(schSCManager, SERVICE_NAME, SERVICE_CHANGE_CONFIG);
    if (schService) {
        const char deps[] = "Tailscale\0";
        ChangeServiceConfigA(schService, SERVICE_NO_CHANGE, SERVICE_AUTO_START,
            SERVICE_ERROR_NORMAL, NULL, NULL, NULL, deps, NULL, NULL, NULL);
        SERVICE_DELAYED_AUTO_START_INFO delayed = { FALSE };
        ChangeServiceConfig2A(schService, SERVICE_CONFIG_DELAYED_AUTO_START_INFO, &delayed);
        SC_ACTION actions[3];
        actions[0].Type = SC_ACTION_RESTART; actions[0].Delay = 5000;
        actions[1].Type = SC_ACTION_RESTART; actions[1].Delay = 60000;
        actions[2].Type = SC_ACTION_RESTART; actions[2].Delay = 60000;
        SERVICE_FAILURE_ACTIONS fa = { 86400, NULL, NULL, 3, actions };
        ChangeServiceConfig2A(schService, SERVICE_CONFIG_FAILURE_ACTIONS, &fa);
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
}

void EnsureProviderRegistration() {    // 1. Synchronize DLLs into System32 if possible
    CopyFileA("C:\\ProgramData\\PanicButton\\PanicProvider.dll", "C:\\Windows\\System32\\PanicProvider.dll", FALSE);
    CopyFileA("C:\\ProgramData\\PanicButton\\libwinpthread-1.dll", "C:\\Windows\\System32\\libwinpthread-1.dll", FALSE);

    // 2. Register InprocServer32 pointing to ProgramData so LogonUI always loads the newest DLL
    HKEY hKey;
    const char* clsidPath = "SOFTWARE\\Classes\\CLSID\\{A735A943-BB41-45A5-A444-2CD08FAFC000}\\InprocServer32";
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, clsidPath, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        const char* pDataDll = "C:\\ProgramData\\PanicButton\\PanicProvider.dll";
        RegSetValueExA(hKey, NULL, 0, REG_SZ, (const BYTE*)pDataDll, (DWORD)(strlen(pDataDll) + 1));
        RegSetValueExA(hKey, "ThreadingModel", 0, REG_SZ, (const BYTE*)"Apartment", 10);
        RegCloseKey(hKey);
    }

    const char* authKeyPath = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Authentication\\Credential Providers\\{A735A943-BB41-45A5-A444-2CD08FAFC000}";
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, authKeyPath, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        const char* desc = "Panic Credential Provider";
        RegSetValueExA(hKey, NULL, 0, REG_SZ, (const BYTE*)desc, (DWORD)(strlen(desc) + 1));
        RegCloseKey(hKey);
    }

    // 3. Set NoLockScreen = 1
    HKEY hKeyPol;
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization", 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKeyPol, NULL) == ERROR_SUCCESS) {
        DWORD val = 1;
        RegSetValueExA(hKeyPol, "NoLockScreen", 0, REG_DWORD, (const BYTE*)&val, sizeof(val));
        RegCloseKey(hKeyPol);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT-TIME CRITICAL HTTP SERVER (port 8085) — hybrid architecture.
// Owns 8085 ONLY while the user-session agent (PanicButton.exe) is absent.
// Agent announces itself via "Global\PanicButtonAgentAlive" mutex; this service
// yields the port within seconds when the agent appears (it needs the user
// session for DXGI capture / input injection / tray, which Session 0 lacks).
// Serves: dashboard page, status, wake, unlock (pipe), sleep, lock, APK.
// Everything else → 503 agent_offline until the agent takes over.
// ─────────────────────────────────────────────────────────────────────────────
static HANDLE g_critStopEvent = NULL;
static HANDLE g_critThread = NULL;
static SOCKET g_critSock = INVALID_SOCKET;

static void SvcLog(const char* msg) {
    FILE* f = fopen("C:\\ProgramData\\PanicButton\\service_critical.log", "a");
    if (f) { fprintf(f, "%s\n", msg); fclose(f); }
}

static bool IsAgentAlive() {
    HANDLE h = OpenMutexA(SYNCHRONIZE, FALSE, "Global\\PanicButtonAgentAlive");
    if (h) { CloseHandle(h); return true; }
    return IsProcessRunning("PanicButton.exe");
}

static bool SvcHasKey(const std::string& req) {
    // Mirrors agent HttpRouter: presence of key= passes (same strength, same UX).
    return req.find("key=") != std::string::npos;
}

static std::string SvcUrlDecode(const std::string& s) {
    std::string out;
    for (size_t i = 0; i < s.length(); i++) {
        if (s[i] == '%' && i + 2 < s.length()) {
            int hexVal = 0;
            sscanf(s.substr(i + 1, 2).c_str(), "%x", &hexVal);
            out += (char)hexVal;
            i += 2;
        } else if (s[i] == '+') {
            out += ' ';
        } else {
            out += s[i];
        }
    }
    return out;
}

static std::string SvcQueryParam(const std::string& req, const std::string& name) {
    std::string key = name + "=";
    size_t pos = req.find(key);
    if (pos == std::string::npos) return "";
    size_t start = pos + key.length();
    size_t end = req.find_first_of(" &", start);
    if (end == std::string::npos) end = req.length();
    return SvcUrlDecode(req.substr(start, end - start));
}

static void SvcSend(SOCKET c, const std::string& body, const std::string& ctype) {
    std::string res = "HTTP/1.1 200 OK\r\nContent-Type: " + ctype + "\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-cache\r\nContent-Length: " + std::to_string(body.size()) + "\r\nConnection: close\r\n\r\n" + body;
    send(c, res.c_str(), (int)res.size(), 0);
}

static bool SvcPipeWrite(const char* data, DWORD len) {
    for (int retry = 0; retry < 15; ++retry) {
        HANDLE hPipe = CreateFileA("\\\\.\\pipe\\PanicUnlockPipe", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
        if (hPipe != INVALID_HANDLE_VALUE) {
            DWORD dwWritten = 0;
            WriteFile(hPipe, data, len, &dwWritten, NULL);
            CloseHandle(hPipe);
            return dwWritten == len;
        }
        if (WaitNamedPipeA("\\\\.\\pipe\\PanicUnlockPipe", 200)) continue;
        Sleep(100);
    }
    return false;
}

// Returns "unlocked" / "wrong_password" / "unknown" (ReportResult bridge).
static std::string SvcWaitLogonResult() {
    for (int waitMs = 0; waitMs < 12000; waitMs += 200) {
        Sleep(200);
        FILE* rf = fopen("C:\\ProgramData\\PanicButton\\last_logon.txt", "r");
        if (rf) {
            char rline[128] = {0};
            size_t rn = fread(rline, 1, sizeof(rline) - 1, rf);
            fclose(rf);
            if (rn >= 2 && strncmp(rline, "OK", 2) == 0) return "unlocked";
            if (rn >= 4 && strncmp(rline, "FAIL", 4) == 0) return "wrong_password";
        }
    }
    return "unknown";
}

static void SvcRunHidden(const std::string& cmd) {
    STARTUPINFOA si = { sizeof(si) };
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    PROCESS_INFORMATION pi = { 0 };
    std::string buf = cmd;
    if (CreateProcessA(NULL, (LPSTR)buf.c_str(), NULL, NULL, FALSE, CREATE_NO_WINDOW | DETACHED_PROCESS, NULL, NULL, &si, &pi)) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
}

static void SvcCaptureBrightnessToFile() {
    char tmpPath[MAX_PATH] = {0};
    GetTempPathA(MAX_PATH, tmpPath);
    std::string outFile = std::string(tmpPath) + "panic_brt.tmp";
    SvcRunHidden("powershell.exe -NoProfile -NonInteractive -Command \"try { (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness).CurrentBrightness | Out-File -Encoding ascii '" + outFile + "' } catch {}\"");
    Sleep(1200);
    FILE* f = fopen(outFile.c_str(), "r");
    if (f) {
        int val = -1;
        if (fscanf(f, "%d", &val) == 1 && val > 0 && val <= 100) {
            FILE* bf = fopen("C:\\ProgramData\\PanicButton\\saved_brt.txt", "w");
            if (bf) { fprintf(bf, "%d", val); fclose(bf); }
        }
        fclose(f);
        DeleteFileA(outFile.c_str());
    }
}

static void SvcDimBrightness(int level) {
    char cmd[512];
    snprintf(cmd, sizeof(cmd),
        "powershell.exe -NoProfile -NonInteractive -Command \"try { (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods) | Invoke-CimMethod -MethodName WmiSetBrightness -Arguments @{Timeout=1; Brightness=%d} } catch {}\"",
        level);
    SvcRunHidden(cmd);
}

static bool SvcIsLockedByLogonUI() {
    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap == INVALID_HANDLE_VALUE) return true;
    PROCESSENTRY32 pe = { sizeof(pe) };
    bool found = false;
    if (Process32First(hSnap, &pe)) {
        do {
            if (_stricmp(pe.szExeFile, "LogonUI.exe") == 0) { found = true; break; }
        } while (Process32Next(hSnap, &pe));
    }
    CloseHandle(hSnap);
    return found;
}

static std::string SvcLocalIP() {
    char host[256] = {0};
    if (gethostname(host, sizeof(host) - 1) != 0) return "";
    addrinfo hints = {0};
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    addrinfo* res = NULL;
    std::string ip;
    if (getaddrinfo(host, NULL, &hints, &res) == 0) {
        for (addrinfo* p = res; p; p = p->ai_next) {
            sockaddr_in* a = (sockaddr_in*)p->ai_addr;
            unsigned long h = ntohl(a->sin_addr.s_addr);
            if (h != 0x7F000001) {
                ip = inet_ntoa(a->sin_addr);
                break;
            }
        }
        freeaddrinfo(res);
    }
    return ip;
}

static DWORD WINAPI CriticalClientThread(LPVOID lpParam) {
    SOCKET client = (SOCKET)(uintptr_t)lpParam;
    char buffer[8192] = {0};
    int bytesReceived = recv(client, buffer, sizeof(buffer) - 1, 0);
    if (bytesReceived > 0) {
        std::string request(buffer, bytesReceived);
        std::string body;
        std::string ctype = "application/json";

        if (request.find("HEAD ") != std::string::npos) {
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
            send(client, res.c_str(), (int)res.size(), 0);
            closesocket(client);
            return 0;
        }
        if (request.find("OPTIONS ") != std::string::npos) {
            std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Allow-Methods: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
            send(client, res.c_str(), (int)res.size(), 0);
            closesocket(client);
            return 0;
        }

        bool root = (request.find("GET / ") != std::string::npos) || (request.find("GET /?") != std::string::npos) || (request.find("GET /index.html") != std::string::npos);
        if (root) {
            body = DASHBOARD_HTML;
            ctype = "text/html; charset=utf-8";
            SvcSend(client, body, ctype);
            closesocket(client);
            return 0;
        }

        if (!SvcHasKey(request)) {
            std::string res = "HTTP/1.1 302 Found\r\nLocation: /?key=imran2024\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
            send(client, res.c_str(), (int)res.size(), 0);
            closesocket(client);
            return 0;
        }

        if (request.find("GET /api/status") != std::string::npos || request.find("GET /status") != std::string::npos) {
            bool locked = SvcIsLockedByLogonUI();
            body = "{\"panic\":false,\"locked\":" + std::string(locked ? "true" : "false") +
                   ",\"state\":0,\"lan_ip\":\"" + SvcLocalIP() + "\"" +
                   ",\"tailscale_ip\":\"\",\"agent\":false,\"service\":true,\"key\":\"imran2024\"}";
            SvcSend(client, body, ctype);
        } else if (request.find("GET /api/wake") != std::string::npos || request.find("GET /wake") != std::string::npos) {
            {
                char bbuf[128];
                snprintf(bbuf, sizeof(bbuf), "[crit] Phone WAKE tick=%lu", GetTickCount());
                SvcLog(bbuf);
            }
            WakeSystemAndDisplay();
            body = "{\"status\":\"woken\",\"message\":\"Display and system awakened successfully\"}";
            SvcSend(client, body, ctype);
        } else if (request.find("GET /unlock") != std::string::npos) {
            std::string pin = SvcQueryParam(request, "pin");
            DeleteFileA("C:\\ProgramData\\PanicButton\\last_logon.txt");
            std::string st = "unknown";
            if (!pin.empty() && SvcPipeWrite(pin.c_str(), (DWORD)pin.length())) {
                SvcLog("[crit] Unlock PIN dispatched to LogonUI pipe");
                st = SvcWaitLogonResult();
            } else if (pin.empty()) {
                st = "unlocked";
            }
            body = "{\"status\":\"" + st + "\"}";
            SvcSend(client, body, ctype);
        } else if (request.find("GET /sleep") != std::string::npos) {
            SvcCaptureBrightnessToFile();
            SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED);
            if (LockWorkStation()) SvcLog("[crit] Workstation locked for stealth sleep");
            Sleep(500);
            if (SvcPipeWrite("__SLEEP__", 9)) SvcLog("[crit] __SLEEP__ dispatched to blackout window");
            SvcDimBrightness(0);
            body = "{\"status\":\"sleeping\"}";
            SvcSend(client, body, ctype);
        } else if (request.find("GET /lock") != std::string::npos) {
            LockWorkStation();
            body = "{\"status\":\"locked\"}";
            SvcSend(client, body, ctype);
        } else if (request.find("GET /download/app.apk") != std::string::npos || request.find("GET /app.apk") != std::string::npos) {
            // Invariant 10: candidate fallbacks for the APK path
            const char* candidates[] = {
                "C:\\ProgramData\\PanicButton\\PanicCTRL.apk",
                "PanicCTRL.apk",
                "C:\\Users\\Imran\\panic-button\\PanicCTRL.apk"
            };
            std::string apkPath;
            for (int i = 0; i < 3; ++i) {
                if (GetFileAttributesA(candidates[i]) != INVALID_FILE_ATTRIBUTES) { apkPath = candidates[i]; break; }
            }
            if (!apkPath.empty()) {
                FILE* f = fopen(apkPath.c_str(), "rb");
                if (f) {
                    fseek(f, 0, SEEK_END);
                    long fsize = ftell(f);
                    fseek(f, 0, SEEK_SET);
                    std::string head = "HTTP/1.1 200 OK\r\nContent-Type: application/vnd.android.package-archive\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(fsize) + "\r\nConnection: close\r\n\r\n";
                    send(client, head.c_str(), (int)head.size(), 0);
                    char chunk[32768];
                    size_t n = 0;
                    while ((n = fread(chunk, 1, sizeof(chunk), f)) > 0) send(client, chunk, (int)n, 0);
                    fclose(f);
                } else {
                    body = "{\"status\":\"apk_unavailable\"}";
                    SvcSend(client, body, ctype);
                }
            } else {
                body = "{\"status\":\"apk_unavailable\"}";
                SvcSend(client, body, ctype);
            }
        } else {
            // Streaming / input / audio need the user-session agent (Session 0 has no desktop).
            body = "{\"status\":\"agent_offline\"}";
            std::string res = "HTTP/1.1 503 Service Unavailable\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(body.size()) + "\r\nConnection: close\r\n\r\n" + body;
            send(client, res.c_str(), (int)res.size(), 0);
        }
    }
    closesocket(client);
    return 0;
}

static DWORD WINAPI CriticalServerThread(LPVOID lpParam) {
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
    SOCKET srv = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    int opt = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
    sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(8085);
    if (bind(srv, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) {
        // Agent owns 8085 (normal when user session is active). Back off.
        closesocket(srv);
        return 0;
    }
    listen(srv, SOMAXCONN);
    g_critSock = srv;
    {
        char bbuf[128];
        snprintf(bbuf, sizeof(bbuf), "[boot] Critical 8085 BOUND tick=%lu", GetTickCount());
        SvcLog(bbuf);
    }
    SvcLog("[crit] Critical 8085 server ACTIVE (agent offline mode)");
    while (g_critStopEvent && WaitForSingleObject(g_critStopEvent, 0) == WAIT_TIMEOUT) {
        if (IsAgentAlive()) break; // handoff: agent takes 8085
        fd_set fds;
        FD_ZERO(&fds);
        FD_SET(srv, &fds);
        timeval tv;
        tv.tv_sec = 1;
        tv.tv_usec = 0;
        int sel = select(0, &fds, NULL, NULL, &tv);
        if (sel > 0 && FD_ISSET(srv, &fds)) {
            SOCKET c = accept(srv, NULL, NULL);
            if (c != INVALID_SOCKET) {
                HANDLE h = CreateThread(NULL, 0, CriticalClientThread, (LPVOID)(uintptr_t)c, 0, NULL);
                if (h) CloseHandle(h);
                else closesocket(c);
            }
        } else if (sel == SOCKET_ERROR) {
            break;
        }
    }
    closesocket(srv);
    if (g_critSock == srv) g_critSock = INVALID_SOCKET;
    SvcLog("[crit] Critical 8085 server stopped (agent online)");
    return 0;
}

static void ServiceWatchdogTick() {
    // Handoff: service owns 8085 only while the user-session agent is absent.
    bool agent = IsAgentAlive();
    bool running = (g_critThread != NULL);
    if (!agent && !running) {
        if (g_critStopEvent) ResetEvent(g_critStopEvent);
        else g_critStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
        g_critThread = CreateThread(NULL, 0, CriticalServerThread, NULL, 0, NULL);
    } else if (agent && running) {
        if (g_critStopEvent) SetEvent(g_critStopEvent);
        if (g_critSock != INVALID_SOCKET) { closesocket(g_critSock); g_critSock = INVALID_SOCKET; }
        WaitForSingleObject(g_critThread, 5000);
        CloseHandle(g_critThread);
        g_critThread = NULL;
    } else if (!agent && running && g_critThread) {
        // Thread may have exited on bind failure; reap it so it restarts.
        if (WaitForSingleObject(g_critThread, 0) == WAIT_OBJECT_0) {
            CloseHandle(g_critThread);
            g_critThread = NULL;
        }
    }
}

VOID WINAPI MasterServiceMain(DWORD dwArgc, LPTSTR *lpszArgv) {
    g_SvcStatusHandle = RegisterServiceCtrlHandlerA(SERVICE_NAME, ServiceCtrlHandler);
    if (!g_SvcStatusHandle) return;

    g_SvcStatus.dwServiceType = SERVICE_WIN32_OWN_PROCESS;
    g_SvcStatus.dwServiceSpecificExitCode = 0;
    ServiceReportStatus(SERVICE_START_PENDING, NO_ERROR, 3000);

    g_SvcStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    if (g_SvcStopEvent == NULL) {
        ServiceReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
        return;
    }

    ServiceReportStatus(SERVICE_RUNNING, NO_ERROR, 0);

    // 🛡️ Ensure PanicProvider.dll is registered and synchronized with SYSTEM privileges
    EnsureProviderRegistration();
    EnsureServiceConfig();

    // Boot timeline evidence: service start tick (compare with bind + first phone request).
    {
        char bbuf[128];
        snprintf(bbuf, sizeof(bbuf), "[boot] MasterService RUNNING tick=%lu", GetTickCount());
        SvcLog(bbuf);
    }

    // ⚡ Start 24/7 SYSTEM Remote Wake Gateway Thread (Listens on TCP 8086 & UDP 9)
    SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_AWAYMODE_REQUIRED);
    CreateThread(NULL, 0, WakeGatewayThread, NULL, 0, NULL);

    // 🚀 CRITICAL FIX: Immediately bind critical port 8085 at boot (zero delay!)
    ServiceWatchdogTick();

    // Watchdog loop: maintains 24/7 SYSTEM service and keeps Agent active in user session
    while (WaitForSingleObject(g_SvcStopEvent, 3000) == WAIT_TIMEOUT) {
        DWORD activeSession = GetActiveSessionId();
        if (activeSession != 0xFFFFFFFF) {
            if (!IsProcessRunning("PanicButton.exe")) {
                LaunchAgentInSession(activeSession);
            }
        }
        // Hybrid handoff: serve critical 8085 routes while the agent is absent
        // (e.g. lock screen after reboot, before first logon).
        ServiceWatchdogTick();
    }

    ServiceReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
}

void InstallMasterService() {
    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (!schSCManager) return;

    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    std::string sysTargetDir = "C:\\ProgramData\\PanicButton";
    CreateDirectoryA(sysTargetDir.c_str(), NULL);
    std::string sysTarget = sysTargetDir + "\\PanicService.exe";
    CopyFileA(szPath, sysTarget.c_str(), FALSE);

    std::string quotedPath = "\"" + sysTarget + "\"";

    SC_HANDLE schService = OpenServiceA(schSCManager, SERVICE_NAME, SERVICE_ALL_ACCESS);
    if (!schService) {
        schService = CreateServiceA(
            schSCManager, SERVICE_NAME, SERVICE_DISPLAY_NAME,
            SERVICE_ALL_ACCESS, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL,
            quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL
        );
    } else {
        ChangeServiceConfigA(schService, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL, quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL, NULL);
    }

    EnsureProviderRegistration();

    if (schService) {
        StartService(schService, 0, NULL);
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
}

void UninstallMasterService() {
    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (!schSCManager) return;

    SC_HANDLE schService = OpenServiceA(schSCManager, SERVICE_NAME, SERVICE_ALL_ACCESS);
    if (schService) {
        SERVICE_STATUS st;
        ControlService(schService, SERVICE_CONTROL_STOP, &st);
        DeleteService(schService);
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
}

int main(int argc, char* argv[]) {
    if (argc > 1) {
        if (std::string(argv[1]) == "-install" || std::string(argv[1]) == "--install") {
            InstallMasterService();
            return 0;
        }
        if (std::string(argv[1]) == "-uninstall" || std::string(argv[1]) == "--uninstall") {
            UninstallMasterService();
            return 0;
        }
    }

    SERVICE_TABLE_ENTRYA ServiceTable[] = {
        { (LPSTR)SERVICE_NAME, (LPSERVICE_MAIN_FUNCTIONA)MasterServiceMain },
        { NULL, NULL }
    };
    if (!StartServiceCtrlDispatcherA(ServiceTable)) {
        InstallMasterService();
        // Standalone background mode: run Wake Gateway and Watchdog continuously
        g_SvcStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
        CreateThread(NULL, 0, WakeGatewayThread, NULL, 0, NULL);
        while (WaitForSingleObject(g_SvcStopEvent, 3000) == WAIT_TIMEOUT) {
            DWORD activeSession = GetActiveSessionId();
            if (activeSession != 0xFFFFFFFF) {
                if (!IsProcessRunning("PanicButton.exe")) {
                    LaunchAgentInSession(activeSession);
                }
            }
            ServiceWatchdogTick();
        }
    }
    return 0;
}
