#include "TrayIcon.h"
#include "../core/Config.h"
#include "../core/Logger.h"
#include "../security/PanicEngine.h"
#include <winhttp.h>
#include <shellapi.h>

// 🛑 FULL SYSTEM SHUTDOWN (tray Exit): stop services first (so the watchdog can't relaunch the agent),
// then kill the Cloudflare tunnel and all Panic processes.
void KillAllPanicProcesses() {
    // 1. Send HTTP stop request to PanicService / PanicButton so it stops itself cleanly from inside
    HINTERNET hSession = WinHttpOpen(L"PanicShutdown/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (hSession) {
        HINTERNET hConnect = WinHttpConnect(hSession, L"127.0.0.1", 8080, 0);
        if (hConnect) {
            HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", L"/api/exit?key=imran2024", NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, 0);
            if (hRequest) {
                WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0);
                WinHttpReceiveResponse(hRequest, NULL);
                WinHttpCloseHandle(hRequest);
            }
            WinHttpCloseHandle(hConnect);
        }
        WinHttpCloseHandle(hSession);
    }
    // 2. Stop watchdog services via SCM
    ExecSilentCommand("sc stop PanicMasterService");
    ExecSilentCommand("sc stop PanicButtonService");
    Sleep(800);
    // 3. Force kill any remaining processes
    ExecSilentCommand("taskkill /F /IM cloudflared.exe");
    ExecSilentCommand("taskkill /F /IM PanicService.exe");
    ExecSilentCommand("taskkill /F /IM PanicButton.exe");
}

// Window Procedure for the System Tray Icon
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE: {
            nid.cbSize = sizeof(NOTIFYICONDATA);
            nid.hWnd = hwnd;
            nid.uID = 1;
            nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP | NIF_SHOWTIP;
            nid.uCallbackMessage = WM_TRAYICON;
            nid.hIcon = LoadIcon(NULL, IDI_SHIELD); // Shield icon: recognizable & visible in the taskbar
            if (!nid.hIcon) nid.hIcon = LoadIcon(NULL, IDI_WARNING);
            strcpy(nid.szTip, "Panic Button - Active");
            if (Shell_NotifyIcon(NIM_ADD, &nid)) {
                nid.uVersion = NOTIFYICON_VERSION_4; // Modern taskbar notification behavior
                Shell_NotifyIcon(NIM_SETVERSION, &nid);
                AppLog("Tray: icon added successfully");
            } else {
                AppLog("Tray: Shell_NotifyIcon NIM_ADD FAILED");
            }
            break;
        }

        case WM_TRAYICON:
            if (lParam == WM_RBUTTONUP || lParam == WM_LBUTTONUP) {
                POINT pt;
                GetCursorPos(&pt);
                HMENU hMenu = CreatePopupMenu();
                AppendMenu(hMenu, MF_STRING, IDM_TRIGGER, isPanicMode ? "Turn Panic OFF" : "Trigger Panic ON");
                AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
                AppendMenu(hMenu, MF_STRING, IDM_PAUSE, isListenerEnabled ? "Pause Hotkey" : "Resume Hotkey");
                AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
                AppendMenu(hMenu, MF_STRING, IDM_SCAN_MOBILE, "📱 Scan in Mobile (QR)");
        AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
        AppendMenu(hMenu, MF_STRING, IDM_EXIT, "Exit Completely");
                
                SetForegroundWindow(hwnd); // Fixes a Windows bug where the menu gets stuck
                TrackPopupMenu(hMenu, TPM_RIGHTBUTTON | TPM_BOTTOMALIGN, pt.x, pt.y, 0, hwnd, NULL);
                DestroyMenu(hMenu);
            }
            break;

        case WM_COMMAND:
            switch (LOWORD(wParam)) {
                case IDM_TRIGGER:
                    TriggerPanic();
                    break;
                case IDM_PAUSE:
                    isListenerEnabled = !isListenerEnabled;
                    strcpy(nid.szTip, isListenerEnabled ? "Panic Button - Active" : "Panic Button - Paused");
                    Shell_NotifyIcon(NIM_MODIFY, &nid); // Update the hover text
                    break;
                case IDM_SCAN_MOBILE:
                ShellExecute(NULL, "open", "http://127.0.0.1:8080/qr", NULL, NULL, SW_SHOWNORMAL);
                break;
            case IDM_EXIT:
                    KillAllPanicProcesses(); // 🔴 Full shutdown: services + tunnel + all processes
                    DestroyWindow(hwnd);
                    ExitProcess(0);
                    break;
            }
            break;

        case WM_DESTROY:
            Shell_NotifyIcon(NIM_DELETE, &nid);
            PostQuitMessage(0);
            ExitProcess(0);
            break;

        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

// ⚡ Shared: create the hidden tray window (used by BOTH the GUI build and the console/server build)
HWND CreateTrayWindow(HINSTANCE hInstance) {
    WNDCLASSEX wc = {0};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "PanicButtonTrayClass";
    if (!RegisterClassEx(&wc)) AppLog("Tray: RegisterClassEx failed (class may already exist)");
    else AppLog("Tray: window class registered");

    hMainWnd = CreateWindowEx(0, "PanicButtonTrayClass", "PanicButton", 0, 0, 0, 0, 0, NULL, NULL, hInstance, NULL);
    if (!hMainWnd) AppLog("Tray: CreateWindowEx FAILED - tray icon cannot show!");
    else AppLog("Tray: tray window created OK");
    return hMainWnd;
}

// ⚡ Shared: process window messages so the tray icon stays responsive
void RunTrayMessageLoop() {
    MSG msg;
    BOOL bRet;
    while (true) {
        bRet = GetMessage(&msg, NULL, 0, 0);
        if (bRet == 0) break;
        if (bRet == -1) { Sleep(1000); continue; }
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}
