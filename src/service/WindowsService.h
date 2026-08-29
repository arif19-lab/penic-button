#pragma once
#include <windows.h>

// Global variable extern declarations
extern SERVICE_STATUS g_SvcStatus;
extern SERVICE_STATUS_HANDLE g_SvcStatusHandle;
extern HANDLE g_SvcStopEvent;

// Function declarations
void InstallService();
void UninstallService();
VOID WINAPI ServiceMain(DWORD dwArgc, LPTSTR *lpszArgv);
VOID WINAPI SvcCtrlHandler(DWORD dwCtrl);
VOID WINAPI SvcReportStatus(DWORD dwCurrentState, DWORD dwWin32ExitCode, DWORD dwWaitHint);
