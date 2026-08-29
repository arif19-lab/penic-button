#pragma once
#include <winsock2.h>
#include <windows.h>

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
HWND CreateTrayWindow(HINSTANCE hInstance);
void RunTrayMessageLoop();
void KillAllPanicProcesses();
