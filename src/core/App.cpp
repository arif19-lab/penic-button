#include "App.h"
#include "Config.h"
#include "Utils.h"
#include "../server/HttpServer.h"
#include <winsock2.h>
#include <gdiplus.h>
#include <shellapi.h>

#define WM_TRAYICON (WM_USER + 1)
#define IDM_EXIT 1001

using namespace Gdiplus;

namespace Core {

App& App::Instance() {
    static App inst;
    return inst;
}

App::App() : hMainWnd(NULL), gdiplusToken(0) {
    memset(&nid, 0, sizeof(nid));
}

App::~App() {
    RemoveTray();
    if (gdiplusToken) GdiplusShutdown(gdiplusToken);
    WSACleanup();
}

LRESULT CALLBACK App::WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_TRAYICON:
            if (lParam == WM_RBUTTONUP || lParam == WM_LBUTTONUP) {
                POINT pt;
                GetCursorPos(&pt);
                HMENU hMenu = CreatePopupMenu();
                InsertMenuA(hMenu, 0, MF_BYPOSITION | MF_STRING, IDM_EXIT, "Exit PanicCTRL");
                SetForegroundWindow(hwnd);
                TrackPopupMenu(hMenu, TPM_RIGHTALIGN | TPM_BOTTOMALIGN, pt.x, pt.y, 0, hwnd, NULL);
                DestroyMenu(hMenu);
            }
            break;

        case WM_COMMAND:
            if (LOWORD(wParam) == IDM_EXIT) {
                DestroyWindow(hwnd);
            }
            break;

        case WM_DESTROY:
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

void App::InitTray(HWND hwnd) {
    nid.cbSize = sizeof(NOTIFYICONDATAA);
    nid.hWnd = hwnd;
    nid.uID = 1;
    nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    nid.uCallbackMessage = WM_TRAYICON;
    nid.hIcon = LoadIcon(NULL, IDI_SHIELD);
    strcpy(nid.szTip, "PanicCTRL - 2.0 Cyber Node");
    Shell_NotifyIconA(NIM_ADD, &nid);
}

void App::RemoveTray() {
    if (nid.hWnd) {
        Shell_NotifyIconA(NIM_DELETE, &nid);
        nid.hWnd = NULL;
    }
}

int App::Run(HINSTANCE hInstance, int nCmdShow) {
    HANDLE hMutex = CreateMutexA(NULL, TRUE, "Global\\PanicButtonSingleInstanceMutex");
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        return 0;
    }

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    WNDCLASSA wc = {0};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "PanicCTRLWindowClass";
    RegisterClassA(&wc);

    hMainWnd = CreateWindowA(
        "PanicCTRLWindowClass", "PanicCTRL Server",
        WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, 300, 200,
        NULL, NULL, hInstance, NULL
    );

    InitTray(hMainWnd);
    Server::HttpServer::Instance().Start(PanicConfig::DEFAULT_PORT);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    Server::HttpServer::Instance().Stop();
    if (hMutex) {
        ReleaseMutex(hMutex);
        CloseHandle(hMutex);
    }

    return (int)msg.wParam;
}

} // namespace Core
