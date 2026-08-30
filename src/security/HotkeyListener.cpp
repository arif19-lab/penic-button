#include "HotkeyListener.h"
#include "PanicEngine.h"
#include "../core/Config.h"

// Thread to run the Hotkey Listener independently of the GUI
DWORD WINAPI HotkeyListenerThread(LPVOID lpParam) {
    while (true) {
        try {
            if (isListenerEnabled && ((GetAsyncKeyState(VK_RMENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_MENU) & 0x8000))) {
                
                bool otherKeyPressed = false;

                // Wait for user to RELEASE physical Alt key so Windows receives pure Win+Ctrl+D!
                while ((GetAsyncKeyState(VK_RMENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_MENU) & 0x8000)) {
                    // Fast check for common combination keys (Tab, Ctrl, Esc, Del, F4, etc.) without looping 256 syscalls
                    if ((GetAsyncKeyState(VK_TAB) & 0x8000) ||
                        (GetAsyncKeyState(VK_CONTROL) & 0x8000) ||
                        (GetAsyncKeyState(VK_LCONTROL) & 0x8000) ||
                        (GetAsyncKeyState(VK_RCONTROL) & 0x8000) ||
                        (GetAsyncKeyState(VK_ESCAPE) & 0x8000) ||
                        (GetAsyncKeyState(VK_DELETE) & 0x8000) ||
                        (GetAsyncKeyState(VK_F4) & 0x8000) ||
                        (GetAsyncKeyState(VK_LWIN) & 0x8000) ||
                        (GetAsyncKeyState(VK_RWIN) & 0x8000)) {
                        otherKeyPressed = true;
                    }
                    Sleep(15);
                }

                // ONLY trigger Panic if they pressed Alt and ONLY Alt!
                // Dispatched to main UI thread so SetWindowsHookEx runs in the thread with active Win32 message pump!
                if (!otherKeyPressed) {
                    if (hMainWnd) {
                        PostMessage(hMainWnd, WM_COMMAND, IDM_TRIGGER, 0);
                    } else {
                        TriggerPanic();
                    }
                }
            }
        } catch (...) {}
        Sleep(50);
    }
    return 0;
}
