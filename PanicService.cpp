#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <wtsapi32.h>
#include <userenv.h>
#include <tlhelp32.h>
#include <iostream>
#include <string>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "wtsapi32.lib")
#pragma comment(lib, "userenv.lib")
#pragma comment(lib, "advapi32.lib")

#define SERVICE_NAME "PanicMasterService"
#define REMOTE_PORT 8080
#define SECRET_KEY  "imran2024"

SERVICE_STATUS g_SvcStatus;
SERVICE_STATUS_HANDLE g_SvcStatusHandle;
HANDLE g_SvcStopEvent = NULL;

// ⚡ Minimal diagnostic logger - tells us why a service start failed (1053 etc)
static void SvcLog(const char* msg) {
    FILE* f = fopen("C:\\ProgramData\\PanicButton\\service_run.log", "a");
    if (f) { fprintf(f, "[%lu] %s (err=%lu)\n", GetTickCount(), msg, GetLastError()); fflush(f); fclose(f); }
}

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

    std::string agentPath = "C:\\ProgramData\\PanicButton\\PanicButton.exe";

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
        "C:\\ProgramData\\PanicButton",
        &si,
        &pi
    );

    if (pi.hProcess) CloseHandle(pi.hProcess);
    if (pi.hThread) CloseHandle(pi.hThread);
    if (lpEnv) DestroyEnvironmentBlock(lpEnv);
    CloseHandle(hPrimaryToken);
    CloseHandle(hToken);
}

void ConfigureFirewallRules() {
    // Add inbound firewall rules for both executable path and port 8080 across ALL profiles (Domain, Private, Public/Unauthenticated Lock Screen)
    system("netsh advfirewall firewall delete rule name=\"PanicButton_8080\" >nul 2>&1");
    system("netsh advfirewall firewall add rule name=\"PanicButton_8080\" dir=in action=allow protocol=TCP localport=8080 profile=any >nul 2>&1");
    system("netsh advfirewall firewall delete rule name=\"PanicService_Exe\" >nul 2>&1");
    system("netsh advfirewall firewall add rule name=\"PanicService_Exe\" dir=in action=allow program=\"C:\\ProgramData\\PanicButton\\PanicService.exe\" profile=any >nul 2>&1");
}

void ProcessServiceRequest(SOCKET clientSocket, const std::string& request) {
    std::string responseBody;
    std::string contentType = "text/html; charset=utf-8";

    if (request.find("GET /manifest.json") != std::string::npos) {
        responseBody = R"JSON({
  "name": "PANIC CTRL - Remote Node",
  "short_name": "PANIC CTRL",
  "start_url": "/?key=imran2024",
  "display": "standalone",
  "background_color": "#07090e",
  "theme_color": "#07090e",
  "orientation": "any"
})JSON";
        contentType = "application/manifest+json";

    } else if (request.find("GET /sw.js") != std::string::npos) {
        responseBody = "self.addEventListener('install', (e)=>{e.waitUntil(self.skipWaiting());});\nself.addEventListener('activate', (e)=>{e.waitUntil(self.clients.claim());});\nself.addEventListener('fetch', (e)=>{e.respondWith(fetch(e.request));});";
        contentType = "application/javascript";

    } else if (request.find("GET /download/app.apk") != std::string::npos || request.find("GET /app.apk") != std::string::npos) {
        FILE* f = fopen("C:\\ProgramData\\PanicButton\\PanicCTRL.apk", "rb");
        if (!f) f = fopen("android-app/android/app/build/outputs/apk/debug/app-debug.apk", "rb");
        if (f) {
            fseek(f, 0, SEEK_END);
            long fsize = ftell(f);
            fseek(f, 0, SEEK_SET);
            std::string header = "HTTP/1.1 200 OK\r\nContent-Type: application/vnd.android.package-archive\r\nContent-Disposition: attachment; filename=\"PanicCTRL.apk\"\r\nContent-Length: " + std::to_string(fsize) + "\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            send(clientSocket, header.c_str(), (int)header.size(), 0);
            char buf[8192];
            size_t bytesRead;
            while ((bytesRead = fread(buf, 1, sizeof(buf), f)) > 0) {
                send(clientSocket, buf, (int)bytesRead, 0);
            }
            fclose(f);
            closesocket(clientSocket);
            return;
        }
        responseBody = "{\"error\":\"APK Not Found\"}";
        contentType = "application/json";

    } else if (request.find("GET /unlock") != std::string::npos) {
        std::string pin = "";
        size_t pinPos = request.find("pin=");
        if (pinPos != std::string::npos) {
            size_t spacePos = request.find(" ", pinPos);
            size_t ampPos = request.find("&", pinPos);
            size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
            if (endPos != std::string::npos) {
                std::string rawPin = request.substr(pinPos + 4, endPos - (pinPos + 4));
                for (size_t i = 0; i < rawPin.length(); i++) {
                    if (rawPin[i] == '%' && i + 2 < rawPin.length()) {
                        int hexVal = 0;
                        sscanf(rawPin.substr(i + 1, 2).c_str(), "%x", &hexVal);
                        pin += (char)hexVal;
                        i += 2;
                    } else if (rawPin[i] == '+') {
                        pin += ' ';
                    } else {
                        pin += rawPin[i];
                    }
                }
            }
        }
        HANDLE hPipe = CreateFileA("\\\\.\\pipe\\PanicUnlockPipe", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
        if (hPipe != INVALID_HANDLE_VALUE) {
            DWORD dwWritten;
            WriteFile(hPipe, pin.c_str(), (DWORD)pin.length(), &dwWritten, NULL);
            CloseHandle(hPipe);
        }
        responseBody = "{\"status\":\"unlocked\"}";
        contentType = "application/json";

    } else if (request.find("GET /lock") != std::string::npos) {
        LockWorkStation();
        responseBody = "{\"status\":\"locked\"}";
        contentType = "application/json";

    } else if (request.find("GET /api/status") != std::string::npos) {
        responseBody = "{\"status\":\"active\",\"locked\":true,\"mode\":\"service\"}";
        contentType = "application/json";

    } else {
        // Full Cyberpunk Master Web UI
        responseBody = R"HTML(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>PANIC CTRL - SYSTEM BOOT</title>
<style>
:root{--bg:#07090e;--panel:#111520;--neon:#00f0ff;--pink:#ff0055;--green:#00ff41;--text:#e2e8f0}
*{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-tap-highlight-color:transparent}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px}
.header{width:100%;max-width:500px;background:var(--panel);border:1px solid rgba(0,240,255,0.3);border-radius:16px;padding:20px;text-align:center;box-shadow:0 0 20px rgba(0,240,255,0.15);margin-bottom:20px}
h1{font-size:24px;color:var(--neon);letter-spacing:2px;margin-bottom:5px;text-shadow:0 0 10px var(--neon)}
.status-badge{display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(255,0,85,0.2);color:var(--pink);border:1px solid var(--pink);font-weight:bold;font-size:14px;margin-top:10px}
.card{width:100%;max-width:500px;background:var(--panel);border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,0.05);box-shadow:0 10px 30px rgba(0,0,0,0.5);margin-bottom:20px}
.input-group{margin-bottom:16px}
label{display:block;font-size:12px;color:var(--neon);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
input{width:100%;background:#0a0d14;border:1px solid rgba(0,240,255,0.4);border-radius:10px;padding:14px;color:#fff;font-size:18px;outline:none}
input:focus{border-color:var(--neon);box-shadow:0 0 12px rgba(0,240,255,0.4)}
.btn{width:100%;padding:16px;border-radius:12px;border:none;font-weight:bold;font-size:16px;cursor:pointer;transition:all 0.2s;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.btn-unlock{background:linear-gradient(135deg,#00ff41,#00b32d);color:#000;box-shadow:0 4px 15px rgba(0,255,65,0.3)}
.btn-unlock:active{transform:scale(0.98)}
.btn-lock{background:linear-gradient(135deg,#ff0055,#b3003b);color:#fff;box-shadow:0 4px 15px rgba(255,0,85,0.3)}
</style>
</head>
<body>
<div class="header">
<h1>⚡ PANIC CTRL</h1>
<p style="font-size:13px;color:#94a3b8">MASTER SYSTEM SERVICE</p>
<div class="status-badge" id="statusBadge">🔒 WINDOWS LOCKED (WINLOGON)</div>
</div>
<div class="card">
<div class="input-group">
<label>🔑 Windows Password / PIN</label>
<input type="password" id="pinInput" placeholder="Enter PIN to Unlock PC...">
</div>
<button class="btn btn-unlock" onclick="unlockPC()">🔓 REMOTELY UNLOCK PC</button>
<button class="btn btn-lock" onclick="lockPC()">🔒 LOCK WORKSTATION</button>
</div>
<script>
function getQueryKey(){const urlParams=new URLSearchParams(window.location.search);return urlParams.get('key')||'imran2024';}
async function unlockPC(){
  const pin=document.getElementById('pinInput').value;
  if(!pin){alert('Please enter your Windows PIN or Password');return;}
  try{
    const res=await fetch('/unlock?key='+getQueryKey()+'&pin='+encodeURIComponent(pin));
    const data=await res.json();
    if(data.status==='unlocked'){
      document.getElementById('statusBadge').innerText='🔓 UNLOCK SIGNAL SENT';
      document.getElementById('statusBadge').style.borderColor='#00ff41';
      document.getElementById('statusBadge').style.color='#00ff41';
      document.getElementById('statusBadge').style.background='rgba(0,255,65,0.2)';
      setTimeout(()=>location.reload(),2000);
    }
  }catch(e){alert('Error sending unlock signal: '+e.message);}
}
async function lockPC(){
  try{
    await fetch('/lock?key='+getQueryKey());
    location.reload();
  }catch(e){}
}
</script>
</body>
</html>)HTML";
    }

    std::string res = "HTTP/1.1 200 OK\r\nContent-Type: " + contentType + "\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(responseBody.size()) + "\r\nConnection: close\r\n\r\n" + responseBody;
    send(clientSocket, res.c_str(), (int)res.size(), 0);
    closesocket(clientSocket);
}

// 🛡️ True when PanicButton.exe (the logged-in user's app) is running.
// PanicService must NOT steal port 8080 while PanicButton owns it - with
// SO_REUSEADDR dual-bind, new connections go to the LAST listener, so a
// service restart would hijack ALL traffic and serve only the lock screen.
bool PanicButtonRunning() {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snap == INVALID_HANDLE_VALUE) return false;
    PROCESSENTRY32W pe;
    pe.dwSize = sizeof(pe);
    bool found = false;
    if (Process32FirstW(snap, &pe)) {
        do {
            if (_wcsicmp(pe.szExeFile, L"PanicButton.exe") == 0) { found = true; break; }
        } while (Process32NextW(snap, &pe));
    }
    CloseHandle(snap);
    return found;
}

// ⚡ Lock Screen Listener & Master HTTP Proxy Engine (Runs inside Session 0 System)
DWORD WINAPI MasterHttpListenerThread(LPVOID lpParam) {
    ConfigureFirewallRules();

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    SOCKET serverSocket = INVALID_SOCKET;
    while (serverSocket == INVALID_SOCKET && WaitForSingleObject(g_SvcStopEvent, 0) == WAIT_TIMEOUT) {
        // 🛡️ Only bind when the user's PanicButton is NOT running (Windows logon
        // screen / no user session). This makes port 8080 ownership deterministic:
        // PanicButton always serves when the user is logged in, PanicService only
        // at the logon screen.
        if (PanicButtonRunning()) {
            Sleep(2000);
            continue;
        }
        serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in serverAddr;
        memset(&serverAddr, 0, sizeof(serverAddr));
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = htonl(INADDR_ANY);
        serverAddr.sin_port = htons(REMOTE_PORT);

        if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            closesocket(serverSocket);
            serverSocket = INVALID_SOCKET;
            Sleep(1000); // Retry every 1s until network interface & DHCP IP is ready
        }
    }

    if (serverSocket != INVALID_SOCKET) {
        listen(serverSocket, SOMAXCONN);
        while (WaitForSingleObject(g_SvcStopEvent, 0) == WAIT_TIMEOUT) {
            SOCKET clientSocket = accept(serverSocket, NULL, NULL);
            if (clientSocket != INVALID_SOCKET) {
                char buffer[16384] = {0};
                int bytes = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
                if (bytes > 0) {
                    std::string req(buffer, bytes);
                    ProcessServiceRequest(clientSocket, req);
                } else {
                    closesocket(clientSocket);
                }
            }
        }
        closesocket(serverSocket);
    }
    WSACleanup();
    return 0;
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

VOID WINAPI MasterServiceMain(DWORD dwArgc, LPTSTR *lpszArgv) {
    SvcLog("MasterServiceMain entered");
    g_SvcStatusHandle = RegisterServiceCtrlHandlerA(SERVICE_NAME, ServiceCtrlHandler);
    if (!g_SvcStatusHandle) {
        SvcLog("RegisterServiceCtrlHandlerA FAILED");
        return;
    }

    g_SvcStatus.dwServiceType = SERVICE_WIN32_OWN_PROCESS;
    g_SvcStatus.dwServiceSpecificExitCode = 0;
    ServiceReportStatus(SERVICE_START_PENDING, NO_ERROR, 3000);

    g_SvcStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    if (g_SvcStopEvent == NULL) {
        SvcLog("CreateEvent FAILED");
        ServiceReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
        return;
    }

    ServiceReportStatus(SERVICE_RUNNING, NO_ERROR, 0);
    SvcLog("Service reported RUNNING");

    // Launch Master HTTP Server for Lock Screen Access
    CreateThread(NULL, 0, MasterHttpListenerThread, NULL, 0, NULL);

    // Watchdog loop: keeps Agent alive in active user session
    while (WaitForSingleObject(g_SvcStopEvent, 3000) == WAIT_TIMEOUT) {
        DWORD activeSession = GetActiveSessionId();
        if (activeSession != 0xFFFFFFFF) {
            LaunchAgentInSession(activeSession);
        }
    }

    ServiceReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
}

void InstallMasterService() {
    FILE* logF = fopen("C:\\ProgramData\\PanicButton\\service_install.log", "w");
    if (logF) { fprintf(logF, "InstallMasterService STARTED\n"); fflush(logF); }

    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (!schSCManager) {
        if (logF) { fprintf(logF, "OpenSCManager FAILED err=%lu\n", GetLastError()); fflush(logF); fclose(logF); }
        return;
    }

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
            schSCManager, SERVICE_NAME, "Panic Master Control Service",
            SERVICE_ALL_ACCESS, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL,
            quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL
        );
        if (logF) { fprintf(logF, "CreateService res=%p err=%lu\n", schService, GetLastError()); fflush(logF); }
    } else {
        ChangeServiceConfigA(schService, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL, quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL, NULL);
    }

    if (schService) {
        BOOL startRes = StartService(schService, 0, NULL);
        if (logF) { fprintf(logF, "StartService res=%d err=%lu\n", startRes, GetLastError()); fflush(logF); }
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
    if (logF) { fclose(logF); }
}

int main(int argc, char* argv[]) {
    SvcLog("PanicService main() entered");
    if (argc > 1 && std::string(argv[1]) == "-install") {
        InstallMasterService();
        return 0;
    }

    SERVICE_TABLE_ENTRYA ServiceTable[] = {
        { (LPSTR)SERVICE_NAME, (LPSERVICE_MAIN_FUNCTIONA)MasterServiceMain },
        { NULL, NULL }
    };
    if (!StartServiceCtrlDispatcherA(ServiceTable)) {
        SvcLog("StartServiceCtrlDispatcherA FAILED - falling back to install");
        InstallMasterService();
    }
    return 0;
}
