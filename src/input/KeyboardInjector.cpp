#include "KeyboardInjector.h"

// ⌨️ Remote Keyboard Type Endpoint (Unicode + Key Codes)
void InjectKeyboardText(const std::string& text) {
    if (text == "{ENTER}") {
        keybd_event(VK_RETURN, 0, 0, 0);
        keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0);
    } else if (text == "{BACKSPACE}") {
        keybd_event(VK_BACK, 0, 0, 0);
        keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
    } else if (text == "{ESC}") {
        keybd_event(VK_ESCAPE, 0, 0, 0);
        keybd_event(VK_ESCAPE, 0, KEYEVENTF_KEYUP, 0);
    } else if (text == "{TAB}") {
        keybd_event(VK_TAB, 0, 0, 0);
        keybd_event(VK_TAB, 0, KEYEVENTF_KEYUP, 0);
    } else if (text == "{CLEAR}") {
        keybd_event(VK_CONTROL, 0, 0, 0);
        keybd_event('A', 0, 0, 0);
        keybd_event('A', 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
        Sleep(10);
        keybd_event(VK_BACK, 0, 0, 0);
        keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
    } else {
        int wlen = MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, NULL, 0);
        if (wlen > 1) {
            std::wstring wText(wlen - 1, 0);
            MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, &wText[0], wlen);
            for (wchar_t wc : wText) {
                INPUT input[2] = {0};
                input[0].type = INPUT_KEYBOARD;
                input[0].ki.wVk = 0;
                input[0].ki.wScan = wc;
                input[0].ki.dwFlags = KEYEVENTF_UNICODE;

                input[1].type = INPUT_KEYBOARD;
                input[1].ki.wVk = 0;
                input[1].ki.wScan = wc;
                input[1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;

                SendInput(2, input, sizeof(INPUT));
                Sleep(2);
            }
        }
    }
}
