// ============================================================
// PANIC CTRL - Commercial-Grade Modular Architecture
// Entry Point: WinMain (GUI) & main (Console/Service)
// ============================================================

#include <winsock2.h>
#include <windows.h>
#include <gdiplus.h>
#include <mfapi.h>
#include <cstdio>
#include <ctime>

// Core modules
#include "core/Config.h"
#include "core/Logger.h"
#include "core/Globals.h"

// Feature modules
#include "audio/AudioManager.h"
#include "security/PanicEngine.h"
#include "security/HotkeyListener.h"
#include "service/SystemDeploy.h"
#include "server/HttpServer.h"
#include "server/UdpDiscovery.h"
#include "ui/TrayIcon.h"

using namespace Gdiplus;

// ============================================================
// GUI Entry Point (WinMain)
// ============================================================
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    SetUnhandledExceptionFilter(CrashFilter);

    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);
    AppLog("WinMain: PANIC CTRL starting");

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
    MFStartup(MF_VERSION, MFSTARTUP_FULL);

    HMODULE hNtDll = GetModuleHandle("ntdll.dll");
    if (hNtDll) {
        pfnNtSuspendProcess = (NtSuspendProcess)GetProcAddress(hNtDll, "NtSuspendProcess");
        pfnNtResumeProcess = (NtResumeProcess)GetProcAddress(hNtDll, "NtResumeProcess");
    }

    HMODULE hUser32 = GetModuleHandle("user32.dll");
    if (hUser32) {
        typedef BOOL (WINAPI *SetProcessDpiAwarenessContextProc)(HANDLE);
        SetProcessDpiAwarenessContextProc pSetDpi = (SetProcessDpiAwarenessContextProc)GetProcAddress(hUser32, "SetProcessDpiAwarenessContext");
        if (pSetDpi) {
            pSetDpi((HANDLE)-4);
        } else {
            SetProcessDPIAware();
        }
    } else {
        SetProcessDPIAware();
    }

    ULONG_PTR gdiplusToken;
    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    // 🚀 First-Run Zero-Friction Setup: Auto-open QR pairing screen for new users (fast independent thread)
    bool forceSetup = (lpCmdLine && strstr(lpCmdLine, "--setup") != NULL);
    CreateThread(NULL, 0, [](LPVOID param) -> DWORD {
        bool force = (param != NULL);
        Sleep(1500);
        std::string flagPath = GetProgramDataFolder() + "\\setup_shown.txt";
        if (force || GetFileAttributesA(flagPath.c_str()) == INVALID_FILE_ATTRIBUTES) {
            FILE* f = fopen(flagPath.c_str(), "w");
            if (f) { fprintf(f, "1\n"); fclose(f); }
            AppLog("Triggering auto-open for pairing HUD: http://127.0.0.1:8085/qr");
            HINSTANCE hRes = ShellExecuteA(NULL, "open", "http://127.0.0.1:8085/qr", NULL, NULL, SW_SHOWNORMAL);
            if ((INT_PTR)hRes <= 32) {
                ShellExecuteA(NULL, "open", "powershell.exe", "-WindowStyle Hidden -Command \"Start-Process 'http://127.0.0.1:8085/qr'\"", NULL, SW_HIDE);
            }
        }
        return 0;
    }, (LPVOID)(forceSetup ? (void*)1 : NULL), 0, NULL);

    // Background system deployment tasks
    CreateThread(NULL, 0, [](LPVOID) -> DWORD {
        EnsureTailscaleInstalled();
        Sleep(100);
        AddToStartup();
        AutoInstallProvider();
        EnableKernelWakeOnLAN();
        return 0;
    }, NULL, 0, NULL);

    InitializeTaskbar();
    CreateTrayWindow(hInstance);

    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)HotkeyListenerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)RemoteServerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)UdpAutoDiscoveryThread, NULL, 0, NULL);

    RunTrayMessageLoop();
    return 0;
}

// ============================================================
// Console Entry Point (headless / service mode)
// ============================================================
int main(int argc, char* argv[]) {
    SetUnhandledExceptionFilter(CrashFilter);

    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);

    FILE* startLog = fopen("C:\\ProgramData\\PanicButton\\server_status.log", "w");
    if (startLog) { fprintf(startLog, "main() console entry started\n"); fflush(startLog); fclose(startLog); }

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    HMODULE hNtDll = GetModuleHandle("ntdll.dll");
    if (hNtDll) {
        pfnNtSuspendProcess = (NtSuspendProcess)GetProcAddress(hNtDll, "NtSuspendProcess");
        pfnNtResumeProcess = (NtResumeProcess)GetProcAddress(hNtDll, "NtResumeProcess");
    }

    ULONG_PTR gdiplusToken;
    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    startLog = fopen("C:\\ProgramData\\PanicButton\\server_status.log", "a");
    if (startLog) { fprintf(startLog, "GDI+ initialized, starting threads...\n"); fflush(startLog); fclose(startLog); }

    CreateThread(NULL, 0, [](LPVOID) -> DWORD {
        Sleep(500);
        AddToStartup();
        AutoInstallProvider();
        EnableKernelWakeOnLAN();
        EnsureTailscaleInstalled();
        return 0;
    }, NULL, 0, NULL);

    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)HotkeyListenerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)RemoteServerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)UdpAutoDiscoveryThread, NULL, 0, NULL);

    CreateTrayWindow(GetModuleHandle(NULL));
    RunTrayMessageLoop();
    return 0;
}
