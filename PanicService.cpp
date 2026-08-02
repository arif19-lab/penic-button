#include <windows.h>
#include <wtsapi32.h>
#include <userenv.h>
#include <iostream>
#include <string>

#pragma comment(lib, "wtsapi32.lib")
#pragma comment(lib, "userenv.lib")

#define SERVICE_NAME "PanicMasterService"
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
    std::string agentPath = exeDir + "\\PanicButton.exe -agent";

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
            schSCManager, SERVICE_NAME, "Panic Master Control Service",
            SERVICE_ALL_ACCESS, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL,
            quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL
        );
    } else {
        ChangeServiceConfigA(schService, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL, quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL, NULL);
    }

    if (schService) {
        StartService(schService, 0, NULL);
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
}

int main(int argc, char* argv[]) {
    if (argc > 1 && std::string(argv[1]) == "-install") {
        InstallMasterService();
        return 0;
    }

    SERVICE_TABLE_ENTRYA ServiceTable[] = {
        { (LPSTR)SERVICE_NAME, (LPSERVICE_MAIN_FUNCTIONA)MasterServiceMain },
        { NULL, NULL }
    };
    if (!StartServiceCtrlDispatcherA(ServiceTable)) {
        InstallMasterService();
    }
    return 0;
}
