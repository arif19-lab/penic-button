#pragma once
#include <winsock2.h>
#include <windows.h>

namespace Core {

class App {
public:
    static App& Instance();

    int Run(HINSTANCE hInstance, int nCmdShow);

private:
    App();
    ~App();

    static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    void InitTray(HWND hwnd);
    void RemoveTray();

    NOTIFYICONDATAA nid;
    HWND hMainWnd;
    ULONG_PTR gdiplusToken;
};

} // namespace Core
