#include "TrayIcon.h"
#include "../core/Config.h"
#include "../core/Logger.h"
#include "../security/PanicEngine.h"
#include <winhttp.h>
#include <shellapi.h>
#include <powrprof.h>

#ifndef MSGFLT_ADD
#define MSGFLT_ADD 1
#endif
#ifndef MSGFLT_ALLOW
#define MSGFLT_ALLOW 1
#endif
#ifndef NIN_SELECT
#define NIN_SELECT (WM_USER + 0)
#endif
#ifndef NIN_KEYSELECT
#define NIN_KEYSELECT (WM_USER + 1)
#endif
#ifndef WM_CONTEXTMENU
#define WM_CONTEXTMENU 0x007B
#endif

#include <gdiplus.h>
#pragma comment(lib, "gdiplus.lib")

using namespace Gdiplus;

// ─── Custom Floating Modern Tray Panel with Rounded Card Buttons ─────────────
static HWND g_hPanelWnd = NULL;
static int g_hoveredBtn = -1;
static ULONGLONG s_lastTrayClickTick = 0;

struct PanelItem {
    int id;
    const wchar_t* icon;
    const wchar_t* title;
    const wchar_t* subtext;
    bool isDanger;
    bool isWarning;
    bool isSuccess;
};

static void GetPanelItems(PanelItem items[5]) {
    items[0] = {
        IDM_TRIGGER,
        isPanicMode ? L"🛡️" : L"🚨",
        isPanicMode ? L"Turn Panic OFF" : L"Trigger Panic ON",
        isPanicMode ? L"Lockdown active • Click to restore" : L"Instant screen blank, lock & mute",
        !isPanicMode, // danger style when trigger ON
        false,
        isPanicMode   // emerald style when Panic is currently active
    };
    items[1] = {
        IDM_PAUSE,
        isListenerEnabled ? L"⏸️" : L"▶️",
        isListenerEnabled ? L"Pause Hotkey" : L"Resume Hotkey",
        isListenerEnabled ? L"Global F8 hotkey is active" : L"Hotkeys temporarily suspended",
        false,
        !isListenerEnabled,
        false
    };
    items[2] = {
        IDM_SCAN_MOBILE,
        L"📱",
        L"Scan in Mobile (QR)",
        L"Pair phone camera & live screen",
        false,
        false,
        false
    };
    items[3] = {
        IDM_DASHBOARD,
        L"🌐",
        L"Open Dashboard",
        L"Launch web control center",
        false,
        false,
        false
    };
    items[4] = {
        IDM_EXIT,
        L"🚪",
        L"Exit Completely",
        L"Terminate all services & quit",
        true,
        false,
        false
    };
}

static void AddRoundedRect(GraphicsPath& path, RectF rect, float radius) {
    float diameter = radius * 2.0f;
    path.AddArc(rect.X, rect.Y, diameter, diameter, 180.0f, 90.0f);
    path.AddArc(rect.GetRight() - diameter, rect.Y, diameter, diameter, 270.0f, 90.0f);
    path.AddArc(rect.GetRight() - diameter, rect.GetBottom() - diameter, diameter, diameter, 0.0f, 90.0f);
    path.AddArc(rect.X, rect.GetBottom() - diameter, diameter, diameter, 90.0f, 90.0f);
    path.CloseFigure();
}

static void ExecutePanelCommand(HWND hOwner, int cmdId) {
    if (g_hPanelWnd && IsWindow(g_hPanelWnd)) {
        DestroyWindow(g_hPanelWnd);
        g_hPanelWnd = NULL;
    }

    switch (cmdId) {
        case IDM_TRIGGER:
            TriggerPanic();
            break;
        case IDM_PAUSE:
            isListenerEnabled = !isListenerEnabled;
            snprintf(nid.szTip, sizeof(nid.szTip), "PanicCTRL AI (Port 8085)\nHotkey (F8): %s | Panic: %s",
                     isListenerEnabled ? "Active" : "Paused",
                     isPanicMode ? "TRIGGERED" : "Ready");
            Shell_NotifyIcon(NIM_MODIFY, &nid);
            break;
        case IDM_SCAN_MOBILE:
            ShellExecute(NULL, "open", "http://127.0.0.1:8085/qr", NULL, NULL, SW_SHOWNORMAL);
            break;
        case IDM_DASHBOARD:
            ShellExecute(NULL, "open", "http://127.0.0.1:8085", NULL, NULL, SW_SHOWNORMAL);
            break;
        case IDM_EXIT:
            KillAllPanicProcesses();
            KillTimer(hOwner, 1001);
            Shell_NotifyIcon(NIM_DELETE, &nid);
            DestroyWindow(hOwner);
            PostQuitMessage(0);
            break;
    }
}

static LRESULT CALLBACK PanelWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    static const int ITEM_COUNT = 5;
    static const int BTN_HEIGHT = 54;
    static const int BTN_GAP = 8;
    static const int PADDING = 10;

    switch (msg) {
        case WM_ACTIVATE: {
            if (LOWORD(wParam) == WA_INACTIVE) {
                KillTimer(hwnd, 999);
                DestroyWindow(hwnd);
                g_hPanelWnd = NULL;
                return 0;
            }
            break;
        }

        case WM_TIMER: {
            if (wParam == 999) {
                // If user clicks outside this window anywhere on desktop/taskbar, dismiss
                if ((GetAsyncKeyState(VK_LBUTTON) & 0x8000) || (GetAsyncKeyState(VK_RBUTTON) & 0x8000)) {
                    POINT pt;
                    GetCursorPos(&pt);
                    RECT rc;
                    GetWindowRect(hwnd, &rc);
                    if (!PtInRect(&rc, pt)) {
                        KillTimer(hwnd, 999);
                        DestroyWindow(hwnd);
                        g_hPanelWnd = NULL;
                        return 0;
                    }
                }
            }
            break;
        }

        case WM_MOUSEMOVE: {
            int my = HIWORD(lParam);
            int mx = LOWORD(lParam);
            RECT rc;
            GetClientRect(hwnd, &rc);
            int w = rc.right - rc.left;

            int oldHover = g_hoveredBtn;
            g_hoveredBtn = -1;

            int curY = PADDING;
            for (int i = 0; i < ITEM_COUNT; ++i) {
                if (mx >= PADDING && mx <= (w - PADDING) && my >= curY && my <= (curY + BTN_HEIGHT)) {
                    g_hoveredBtn = i;
                    break;
                }
                curY += BTN_HEIGHT + BTN_GAP;
            }

            if (oldHover != g_hoveredBtn) {
                InvalidateRect(hwnd, NULL, FALSE);
            }

            TRACKMOUSEEVENT tme = { sizeof(TRACKMOUSEEVENT), TME_LEAVE, hwnd, 0 };
            TrackMouseEvent(&tme);
            return 0;
        }

        case WM_MOUSELEAVE: {
            if (g_hoveredBtn != -1) {
                g_hoveredBtn = -1;
                InvalidateRect(hwnd, NULL, FALSE);
            }
            return 0;
        }

        case WM_LBUTTONUP: {
            int my = HIWORD(lParam);
            int mx = LOWORD(lParam);
            RECT rc;
            GetClientRect(hwnd, &rc);
            int w = rc.right - rc.left;

            int curY = PADDING;
            PanelItem items[5];
            GetPanelItems(items);

            for (int i = 0; i < ITEM_COUNT; ++i) {
                if (mx >= PADDING && mx <= (w - PADDING) && my >= curY && my <= (curY + BTN_HEIGHT)) {
                    HWND hOwner = (HWND)GetWindowLongPtr(hwnd, GWLP_USERDATA);
                    ExecutePanelCommand(hOwner, items[i].id);
                    return 0;
                }
                curY += BTN_HEIGHT + BTN_GAP;
            }
            return 0;
        }

        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hwnd, &ps);
            RECT rc;
            GetClientRect(hwnd, &rc);
            int width = rc.right - rc.left;
            int height = rc.bottom - rc.top;

            // Double buffering
            HDC memDC = CreateCompatibleDC(hdc);
            HBITMAP memBitmap = CreateCompatibleBitmap(hdc, width, height);
            HGDIOBJ oldBitmap = SelectObject(memDC, memBitmap);

            Graphics g(memDC);
            g.SetSmoothingMode(SmoothingModeAntiAlias);
            g.SetTextRenderingHint(TextRenderingHintClearTypeGridFit);

            // 1. Clear with deep cyber dark background
            SolidBrush bgBrush(Color(255, 12, 16, 24)); // #0c1018
            g.FillRectangle(&bgBrush, 0, 0, width, height);

            // 2. Rounded Outer Panel Card with glowing neon border
            RectF panelRect(1.0f, 1.0f, (float)(width - 2), (float)(height - 2));
            GraphicsPath panelPath;
            AddRoundedRect(panelPath, panelRect, 18.0f);
            SolidBrush cardBg(Color(255, 14, 18, 28)); // #0e121c
            g.FillPath(&cardBg, &panelPath);

            Pen borderPen(Color(140, 0, 240, 255), 1.5f); // Neon Cyan #00f0ff accent
            g.DrawPath(&borderPen, &panelPath);

            // Fonts
            FontFamily ff(L"Segoe UI");
            const FontFamily* pFf = (ff.GetLastStatus() == Ok) ? &ff : FontFamily::GenericSansSerif();
            Font iconFont(pFf, 16.0f, FontStyleRegular, UnitPixel);
            Font btnTitleFont(pFf, 12.5f, FontStyleBold, UnitPixel);
            Font btnSubFont(pFf, 9.5f, FontStyleRegular, UnitPixel);
            Font arrowFont(pFf, 14.0f, FontStyleBold, UnitPixel);

            SolidBrush whiteBrush(Color(255, 255, 255, 255));
            SolidBrush grayBrush(Color(255, 140, 155, 175)); // #8c9baf

            // 3. Render the 5 Rounded Card Buttons
            PanelItem items[5];
            GetPanelItems(items);

            int curY = PADDING;
            for (int i = 0; i < ITEM_COUNT; ++i) {
                RectF btnRect((float)PADDING, (float)curY, (float)(width - (PADDING * 2)), (float)BTN_HEIGHT);
                GraphicsPath btnPath;
                AddRoundedRect(btnPath, btnRect, 12.0f);

                bool isHov = (g_hoveredBtn == i);

                // Button Background & Border styling
                if (items[i].isDanger) {
                    SolidBrush btnBg(isHov ? Color(255, 65, 24, 34) : Color(255, 38, 18, 24));
                    Pen btnBorder(isHov ? Color(240, 255, 75, 95) : Color(90, 255, 60, 80), isHov ? 1.5f : 1.0f);
                    g.FillPath(&btnBg, &btnPath);
                    g.DrawPath(&btnBorder, &btnPath);
                } else if (items[i].isSuccess) {
                    SolidBrush btnBg(isHov ? Color(255, 25, 65, 42) : Color(255, 18, 44, 29));
                    Pen btnBorder(isHov ? Color(240, 0, 255, 130) : Color(90, 0, 255, 110), isHov ? 1.5f : 1.0f);
                    g.FillPath(&btnBg, &btnPath);
                    g.DrawPath(&btnBorder, &btnPath);
                } else if (items[i].isWarning) {
                    SolidBrush btnBg(isHov ? Color(255, 60, 45, 15) : Color(255, 38, 28, 12));
                    Pen btnBorder(isHov ? Color(240, 255, 180, 20) : Color(90, 255, 170, 0), isHov ? 1.5f : 1.0f);
                    g.FillPath(&btnBg, &btnPath);
                    g.DrawPath(&btnBorder, &btnPath);
                } else {
                    SolidBrush btnBg(isHov ? Color(255, 26, 36, 56) : Color(255, 18, 24, 38));
                    Pen btnBorder(isHov ? Color(220, 0, 240, 255) : Color(60, 0, 240, 255), isHov ? 1.5f : 1.0f);
                    g.FillPath(&btnBg, &btnPath);
                    g.DrawPath(&btnBorder, &btnPath);
                }

                // Button Icon
                PointF ptBtnIcon((float)(PADDING + 12), (float)(curY + 13));
                g.DrawString(items[i].icon, -1, &iconFont, ptBtnIcon, &whiteBrush);

                // Button Title
                Color titleClr;
                if (items[i].isDanger) {
                    titleClr = isHov ? Color(255, 255, 110, 130) : Color(255, 255, 80, 100);
                } else if (items[i].isSuccess) {
                    titleClr = isHov ? Color(255, 100, 255, 170) : Color(255, 50, 240, 140);
                } else if (items[i].isWarning) {
                    titleClr = isHov ? Color(255, 255, 200, 60) : Color(255, 255, 180, 20);
                } else {
                    titleClr = isHov ? Color(255, 0, 240, 255) : Color(255, 240, 246, 252);
                }
                SolidBrush titleBrush(titleClr);
                PointF ptBtnTitle((float)(PADDING + 44), (float)(curY + 9));
                g.DrawString(items[i].title, -1, &btnTitleFont, ptBtnTitle, &titleBrush);

                // Button Subtext
                PointF ptBtnSub((float)(PADDING + 44), (float)(curY + 28));
                g.DrawString(items[i].subtext, -1, &btnSubFont, ptBtnSub, &grayBrush);

                // Subtle arrow indicator on right
                PointF ptArrow((float)(width - PADDING - 20), (float)(curY + 16));
                SolidBrush arrowBrush(isHov ? Color(255, 0, 240, 255) : Color(70, 255, 255, 255));
                g.DrawString(L"›", -1, &arrowFont, ptArrow, &arrowBrush);

                curY += BTN_HEIGHT + BTN_GAP;
            }

            // Transfer from memDC to hdc
            BitBlt(hdc, 0, 0, width, height, memDC, 0, 0, SRCCOPY);

            SelectObject(memDC, oldBitmap);
            DeleteObject(memBitmap);
            DeleteDC(memDC);

            EndPaint(hwnd, &ps);
            return 0;
        }

        case WM_DESTROY: {
            KillTimer(hwnd, 999);
            g_hPanelWnd = NULL;
            return 0;
        }

        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

static void ShowModernTrayPanel(HWND hOwner) {
    if (g_hPanelWnd && IsWindow(g_hPanelWnd)) {
        DestroyWindow(g_hPanelWnd);
        g_hPanelWnd = NULL;
        return;
    }
    g_hPanelWnd = NULL;

    HINSTANCE hInst = (HINSTANCE)GetWindowLongPtr(hOwner, GWLP_HINSTANCE);
    if (!hInst) hInst = GetModuleHandle(NULL);

    static bool s_classRegistered = false;
    if (!s_classRegistered) {
        WNDCLASSEXW wcx = { sizeof(WNDCLASSEXW) };
        wcx.lpfnWndProc = PanelWndProc;
        wcx.hInstance = hInst;
        wcx.lpszClassName = L"PanicModernTrayPanelClass";
        wcx.hCursor = LoadCursor(NULL, IDC_ARROW);
        RegisterClassExW(&wcx);
        s_classRegistered = true;
    }

    // Dimensions: 310px width, 322px height (5 items * 54px + 4 gaps * 8px + 20px padding)
    int panelW = 310;
    int panelH = 322;

    // Position above taskbar tray at bottom-right corner
    RECT workArea;
    SystemParametersInfo(SPI_GETWORKAREA, 0, &workArea, 0);

    POINT cursorPos;
    GetCursorPos(&cursorPos);

    int posX = cursorPos.x - (panelW / 2);
    if (posX + panelW > workArea.right - 10) posX = workArea.right - panelW - 10;
    if (posX < workArea.left + 10) posX = workArea.left + 10;

    int posY = workArea.bottom - panelH - 10;
    if (cursorPos.y < (workArea.top + workArea.bottom) / 2) {
        // If taskbar is at the top of the screen
        posY = workArea.top + 10;
    }

    g_hPanelWnd = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        L"PanicModernTrayPanelClass",
        L"PanicCTRL Quick Panel",
        WS_POPUP,
        posX, posY, panelW, panelH,
        NULL, NULL, hInst, NULL
    );

    if (g_hPanelWnd) {
        SetWindowLongPtr(g_hPanelWnd, GWLP_USERDATA, (LONG_PTR)hOwner);

        // Set rounded window region for genuine Windows rounded panel contour
        HRGN hRgn = CreateRoundRectRgn(0, 0, panelW + 1, panelH + 1, 24, 24);
        SetWindowRgn(g_hPanelWnd, hRgn, TRUE);

        SetWindowPos(g_hPanelWnd, HWND_TOPMOST, posX, posY, panelW, panelH, SWP_SHOWWINDOW);
        SetForegroundWindow(g_hPanelWnd);
        SetActiveWindow(g_hPanelWnd);
        SetFocus(g_hPanelWnd);
        SetTimer(g_hPanelWnd, 999, 40, NULL);
    }
}

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
    
    snprintf(nid.szTip, sizeof(nid.szTip), "PanicCTRL AI (Port 8085)\nHotkey (F8): %s | Panic: %s",
             isListenerEnabled ? "Active" : "Paused",
             isPanicMode ? "TRIGGERED" : "Ready");

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

        case WM_TRAYICON: {
            UINT event = LOWORD(lParam);
            // On right-click OR left-click, pop up the modern rounded floating quick panel
            if (event == WM_CONTEXTMENU || event == WM_RBUTTONUP || event == NIN_KEYSELECT || 
                event == NIN_SELECT || event == WM_LBUTTONUP || lParam == WM_RBUTTONUP || lParam == WM_LBUTTONUP) {
                ULONGLONG now = GetTickCount64();
                if (now - s_lastTrayClickTick < 250) {
                    return 0; // Debounce duplicate event fired in same mouse click
                }
                s_lastTrayClickTick = now;
                ShowModernTrayPanel(hwnd);
            }
            break;
        }

        case WM_COMMAND:
            ExecutePanelCommand(hwnd, LOWORD(wParam));
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
    else {
        AppLog("Tray: tray window created OK");
        // Also apply window-specific UIPI bypass via ChangeWindowMessageFilterEx
        typedef BOOL(WINAPI* PFN_CWMS_EX)(HWND, UINT, DWORD, PVOID);
        if (hUser32) {
            PFN_CWMS_EX pChangeWindowMessageFilterEx = (PFN_CWMS_EX)GetProcAddress(hUser32, "ChangeWindowMessageFilterEx");
            if (pChangeWindowMessageFilterEx) {
                pChangeWindowMessageFilterEx(hMainWnd, g_wmTaskbarCreated, MSGFLT_ALLOW, NULL);
                pChangeWindowMessageFilterEx(hMainWnd, WM_TRAYICON, MSGFLT_ALLOW, NULL);
                pChangeWindowMessageFilterEx(hMainWnd, WM_COMMAND, MSGFLT_ALLOW, NULL);
            }
        }
    }
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
