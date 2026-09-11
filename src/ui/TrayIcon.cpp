#include "TrayIcon.h"
#include "../core/Config.h"
#include "../core/Logger.h"
#include "../security/PanicEngine.h"
#include <winhttp.h>
#include <shellapi.h>

#ifndef MSGFLT_ADD
#define MSGFLT_ADD 1
#endif

static UINT g_wmTaskbarCreated = 0;
static bool g_trayIconActive = false;

// 🛑 Clean shutdown only stops external watchdog/service processes.
// We never taskkill the current app itself, otherwise the shutdown becomes recursive and hangs.
void KillAllPanicProcesses() {
    // 1. Stop watchdog services via SCM.
    ExecSilentCommand("sc stop PanicMasterService");
    ExecSilentCommand("sc stop PanicButtonService");
    Sleep(200);

    // 2. Force kill only the companion service that may be left behind.
    ExecSilentCommand("taskkill /F /IM PanicService.exe");
}

bool EnsureTrayIcon(HWND hwnd) {
    memset(&nid, 0, sizeof(NOTIFYICONDATA));
    nid.cbSize = sizeof(NOTIFYICONDATA);
    nid.hWnd = hwnd;
    nid.uID = 1;
    nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    nid.uCallbackMessage = WM_TRAYICON;
    nid.hIcon = LoadIcon(NULL, IDI_SHIELD); // Shield icon: recognizable & visible in the taskbar
    if (!nid.hIcon) nid.hIcon = LoadIcon(NULL, IDI_WARNING);
    strncpy(nid.szTip, isListenerEnabled ? "Panic Button - Active" : "Panic Button - Paused", sizeof(nid.szTip) - 1);

    // Try modifying first in case it's already there
    if (Shell_NotifyIcon(NIM_MODIFY, &nid)) {
        g_trayIconActive = true;
        return true;
    }

    if (Shell_NotifyIcon(NIM_ADD, &nid)) {
        nid.uVersion = NOTIFYICON_VERSION_4; // Modern taskbar notification behavior
        Shell_NotifyIcon(NIM_SETVERSION, &nid);
        AppLog("Tray: icon added successfully");
        g_trayIconActive = true;
        return true;
    } else {
        DWORD err = GetLastError();
        char buf[128];
        snprintf(buf, sizeof(buf), "Tray: Shell_NotifyIcon NIM_ADD failed, error=%lu", err);
        AppLog(buf);
        g_trayIconActive = false;
        return false;
    }
}

// Window Procedure for the System Tray Icon
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    // Handle Explorer Taskbar (re)creation after boot / login / explorer restart
    if (g_wmTaskbarCreated != 0 && msg == g_wmTaskbarCreated) {
        AppLog("Tray: TaskbarCreated received - restoring tray icon");
        EnsureTrayIcon(hwnd);
        return 0;
    }

    switch (msg) {
        case WM_CREATE: {
            EnsureTrayIcon(hwnd);
            // 🔄 Robust Boot/Logon Timer: Retry every 2 seconds until Explorer taskbar is ready!
            SetTimer(hwnd, 1001, 2000, NULL);
            break;
        }

        case WM_TIMER: {
            if (wParam == 1001) {
                if (EnsureTrayIcon(hwnd)) {
                    // Successfully added! Slow down timer to 15-second watchdog
                    SetTimer(hwnd, 1001, 15000, NULL);
                } else {
                    // Keep rapid 2-second retry until Explorer shell is active
                    SetTimer(hwnd, 1001, 2000, NULL);
                }
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
                    ShellExecute(NULL, "open", "http://127.0.0.1:8085/qr", NULL, NULL, SW_SHOWNORMAL);
                    break;
                case IDM_EXIT:
                    KillAllPanicProcesses();
                    KillTimer(hwnd, 1001);
                    Shell_NotifyIcon(NIM_DELETE, &nid);
                    DestroyWindow(hwnd);
                    PostQuitMessage(0);
                    break;
            }
            break;

        case WM_DESTROY:
            KillTimer(hwnd, 1001);
            Shell_NotifyIcon(NIM_DELETE, &nid);
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

// ⚡ Shared: create the hidden tray window (used by BOTH the GUI build and the console/server build)
HWND CreateTrayWindow(HINSTANCE hInstance) {
    // 1. Register TaskbarCreated message to handle Explorer restarts and delayed boot
    g_wmTaskbarCreated = RegisterWindowMessageA("TaskbarCreated");

    // 2. Bypass UIPI (User Interface Privilege Isolation):
    // If PanicButton is elevated (/RL HIGHEST), explorer.exe (medium integrity) can still send TaskbarCreated
    typedef BOOL(WINAPI* PFN_CWMS)(UINT, DWORD);
    HMODULE hUser32 = GetModuleHandleA("user32.dll");
    if (hUser32) {
        PFN_CWMS pChangeWindowMessageFilter = (PFN_CWMS)GetProcAddress(hUser32, "ChangeWindowMessageFilter");
        if (pChangeWindowMessageFilter) {
            pChangeWindowMessageFilter(g_wmTaskbarCreated, MSGFLT_ADD);
            pChangeWindowMessageFilter(WM_TRAYICON, MSGFLT_ADD);
        }
    }

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
