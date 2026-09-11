#include "HotkeyListener.h"
#include "PanicEngine.h"
#include "../core/Config.h"
#include "../core/Logger.h"
#include "../server/HttpRouter.h"

// Thread to run the Hotkey Listener independently of the GUI
DWORD WINAPI HotkeyListenerThread(LPVOID lpParam) {
    ULONGLONG lastSecretWake = 0;
    bool secretWasDown = false;
    while (true) {
        try {
            // ── Secret local fallback: physical Ctrl + Alt + K restores display ──
            // (Owner-only rescue if phone is lost. Panic on Alt-alone is unaffected
            // because that path requires NO other key pressed.)
            bool ctrlDown = (GetAsyncKeyState(VK_CONTROL) & 0x8000) || (GetAsyncKeyState(VK_LCONTROL) & 0x8000) || (GetAsyncKeyState(VK_RCONTROL) & 0x8000);
            bool altDown = (GetAsyncKeyState(VK_MENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_RMENU) & 0x8000);
            bool kDown = (GetAsyncKeyState('K') & 0x8000);
            if (ctrlDown && altDown && kDown) {
                ULONGLONG now = GetTickCount64();
                if (!secretWasDown && (now - lastSecretWake > 3000)) {
                    lastSecretWake = now;
                    AppLog("[kbd] Secret Ctrl+Alt+K detected, local wake initiated");
                    RequestDisplayWake();
                }
                secretWasDown = true;
            } else {
                secretWasDown = false;
            }

            // ── Flag bridge from LogonUI watcher (works when locked) ──
            // SecretWatchProc in PanicProvider.dll (Winlogon desktop) writes this
            // flag on physical Ctrl+Alt+K. Consuming it runs the FULL proven
            // phone-wake path below, identical to GET /api/wake.
            if (GetFileAttributesA("C:\\ProgramData\\PanicButton\\secret_wake.flag") != INVALID_FILE_ATTRIBUTES) {
                DeleteFileA("C:\\ProgramData\\PanicButton\\secret_wake.flag");
                ULONGLONG now = GetTickCount64();
                if (now - lastSecretWake > 3000) {
                    lastSecretWake = now;
                    AppLog("[kbd] Secret flag consumed, running full wake");
                    RequestDisplayWake();
                }
            }

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
