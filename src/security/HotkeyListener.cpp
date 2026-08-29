#include "HotkeyListener.h"
#include "PanicEngine.h"

// Thread to run the Hotkey Listener independently of the GUI
DWORD WINAPI HotkeyListenerThread(LPVOID lpParam) {
    while (true) {
        try {
            if (isListenerEnabled && ((GetAsyncKeyState(VK_RMENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_MENU) & 0x8000))) {
                
                bool otherKeyPressed = false;

                // Wait for user to RELEASE physical Alt key so Windows receives pure Win+Ctrl+D!
                while ((GetAsyncKeyState(VK_RMENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_MENU) & 0x8000)) {
                    // If they press ANY OTHER KEY (like Tab, F4, etc) while holding Alt, CANCEL the panic trigger!
                    for (int i = 8; i < 256; i++) {
                        if (i != VK_RMENU && i != VK_LMENU && i != VK_MENU && i != VK_SHIFT && i != VK_LSHIFT && i != VK_RSHIFT) {
                            if (GetAsyncKeyState(i) & 0x8000) {
                                otherKeyPressed = true;
                            }
                        }
                    }
                    Sleep(10);
                }

                // ONLY trigger Panic if they pressed Alt and ONLY Alt!
                // Direct call is more reliable than PostMessage - a hung UI thread can never drop it.
                // (Safe here: SendInput/CreateProcess/hooks need no COM; TriggerPanic's 250ms debounce guards it.)
                if (!otherKeyPressed) {
                    TriggerPanic();
                }
            }
        } catch (...) {}
        Sleep(50);
    }
    return 0;
}
