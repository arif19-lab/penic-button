#include "PanicEngine.h"
#include "../audio/AudioManager.h"
#include <vector>
#include <mmsystem.h>
#include <stdio.h>

// Global definitions
NtSuspendProcess pfnNtSuspendProcess = NULL;
NtResumeProcess pfnNtResumeProcess = NULL;
HANDLE hTargetProcess = NULL;
std::string targetProcessName = "chrome.exe"; // Default target

bool isListenerEnabled = true;
NOTIFYICONDATA nid;
HWND hMainWnd;

HHOOK hKeyboardHook = NULL;
HHOOK hMouseHook = NULL;

int panicState = 0; // 0 = Normal, 1 = Trap Locked, 2 = Safe Working Fake Desktop
DWORD lastPanicTime = 0;
PROCESS_INFORMATION g_piPanicApp = {0};
bool isPanicMode = false;

DWORD GetProcessIdByName(const std::string& processName) {
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return 0;

    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (processName == pe32.szExeFile) {
                CloseHandle(hSnapshot);
                return pe32.th32ProcessID;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    CloseHandle(hSnapshot);
    return 0;
}

void ExecSilentCommand(const char* cmdLine) {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = { 0 };
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;

    char cmd[2048];
    strncpy(cmd, cmdLine, sizeof(cmd) - 1);
    cmd[sizeof(cmd) - 1] = '\0';

    if (CreateProcessA(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        WaitForSingleObject(pi.hProcess, 3000);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
}

// --- REAL WINDOWS VIRTUAL DESKTOP ENGINE (Isolated Fresh Desktop) ---
void SendVirtualDesktopKey(WORD vkCode) {
    // 🛡️ Ensure Alt is physically/logically released before injecting desktop shortcuts
    INPUT releaseAlt[2] = {0};
    releaseAlt[0].type = INPUT_KEYBOARD; releaseAlt[0].ki.wVk = VK_MENU; releaseAlt[0].ki.dwFlags = KEYEVENTF_KEYUP;
    releaseAlt[1].type = INPUT_KEYBOARD; releaseAlt[1].ki.wVk = VK_LMENU; releaseAlt[1].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(2, releaseAlt, sizeof(INPUT));
    Sleep(20);

    // Press Win + Ctrl + Key (Hardware Mimic: DOWN)
    INPUT inputsDown[3] = {0};
    inputsDown[0].type = INPUT_KEYBOARD; inputsDown[0].ki.wVk = VK_LWIN;
    inputsDown[1].type = INPUT_KEYBOARD; inputsDown[1].ki.wVk = VK_LCONTROL;
    inputsDown[2].type = INPUT_KEYBOARD; inputsDown[2].ki.wVk = vkCode;
    SendInput(3, inputsDown, sizeof(INPUT));
    
    Sleep(50); // Hold time for Windows Shell recognition
    
    // Release Win + Ctrl + Key (Hardware Mimic: UP)
    INPUT inputsUp[3] = {0};
    inputsUp[0].type = INPUT_KEYBOARD; inputsUp[0].ki.wVk = vkCode;      inputsUp[0].ki.dwFlags = KEYEVENTF_KEYUP;
    inputsUp[1].type = INPUT_KEYBOARD; inputsUp[1].ki.wVk = VK_LCONTROL; inputsUp[1].ki.dwFlags = KEYEVENTF_KEYUP;
    inputsUp[2].type = INPUT_KEYBOARD; inputsUp[2].ki.wVk = VK_LWIN;     inputsUp[2].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(3, inputsUp, sizeof(INPUT));
}

void SwitchToNewVirtualDesktop() {
    SendVirtualDesktopKey(0x44); // 'D'
}

void CloseCurrentVirtualDesktop() {
    SendVirtualDesktopKey(VK_F4); // F4
}
// -----------------------------

LRESULT CALLBACK KeyboardHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT *pKeyBoard = (KBDLLHOOKSTRUCT *)lParam;
        
        // CRITICAL: Allow injected keys (SendInput) so Virtual Desktop keys aren't blocked!
        if (pKeyBoard->flags & LLKHF_INJECTED) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }

        // Always allow Alt keys to pass through to advance Panic States!
        if (pKeyBoard->vkCode == VK_RMENU || pKeyBoard->vkCode == VK_LMENU || pKeyBoard->vkCode == VK_MENU) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }

        // 🎯 STATE 2 (Safe Working Mode): Allow ALL keyboard keys to pass through 100% normally!
        if (panicState == 2) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }
        
        // 🎯 STATE 1 (Trap Mode): Intruder Detected! Block and trigger alarm!
        if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
            TriggerAlarm();
        }

        // BLOCK EVERYTHING ELSE IN STATE 1!
        return 1; 
    }
    return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

LRESULT CALLBACK MouseHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        // INTRUDER DETECTED in State 1!
        if (panicState == 1 && (wParam == WM_LBUTTONDOWN || wParam == WM_RBUTTONDOWN || wParam == WM_MBUTTONDOWN)) {
            TriggerAlarm();
            return 1; // BLOCK MOUSE IN STATE 1
        }
        // Allow mouse in State 0 & State 2
        return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
    }
    return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
}

void TriggerPanic() {
    // 🛡️ DEBOUNCE GUARD: Prevent rapid state cycling from a single bouncing key press!
    DWORD now = GetTickCount();
    if (now - lastPanicTime < 250) {
        return; // Small debounce only (250ms) so rapid Alt-taps can toggle ON->OFF->ON smoothly
    }
    lastPanicTime = now;

    if (panicState == 0) {
        // --- 1st Alt Click: PANIC TRAP MODE (State 1) ---
        // Step 0: Freeze target process
        DWORD pid = GetProcessIdByName(targetProcessName);
        if (pid && pfnNtSuspendProcess) {
            hTargetProcess = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
            if (hTargetProcess) {
                pfnNtSuspendProcess(hTargetProcess);
            }
        }

        // Step 1: Switch to BRAND NEW Virtual Desktop
        SwitchToNewVirtualDesktop();
        Sleep(600); 
        
        // Step 2: Spawn VS Code DIRECTLY on Desktop 2 in total isolation!
        char localAppData[MAX_PATH];
        char tempDir[MAX_PATH];
        GetEnvironmentVariableA("LOCALAPPDATA", localAppData, MAX_PATH);
        GetTempPathA(MAX_PATH, tempDir);

        std::string vscodePath = std::string(localAppData) + "\\Programs\\Microsoft VS Code\\Code.exe";
        std::string panicDataDir = std::string(tempDir) + "PanicVSCode";

        DWORD dwAttrib = GetFileAttributesA(vscodePath.c_str());
        if (dwAttrib == INVALID_FILE_ATTRIBUTES || (dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            char progFiles[MAX_PATH];
            GetEnvironmentVariableA("ProgramFiles", progFiles, MAX_PATH);
            vscodePath = std::string(progFiles) + "\\Microsoft VS Code\\Code.exe";
            dwAttrib = GetFileAttributesA(vscodePath.c_str());
        }

        if (g_piPanicApp.hProcess) {
            TerminateProcess(g_piPanicApp.hProcess, 0);
            CloseHandle(g_piPanicApp.hProcess);
            CloseHandle(g_piPanicApp.hThread);
            ZeroMemory(&g_piPanicApp, sizeof(g_piPanicApp));
        }

        STARTUPINFOA si = { sizeof(si) };
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_SHOWNORMAL;

        if (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            // Open a neutral decoy file - no hardcoded user paths!
            CreateDirectoryA(panicDataDir.c_str(), NULL); // dir must exist before writing the file
            std::string decoyFile = panicDataDir + "\\PANIC_NOTES.txt";
            FILE* decoy = fopen(decoyFile.c_str(), "w");
            if (decoy) { fprintf(decoy, "Work in progress...\n"); fclose(decoy); }
            std::string cmdLine = "\"" + vscodePath + "\" --user-data-dir \"" + panicDataDir + "\" --new-window \"" + decoyFile + "\"";
            std::vector<char> cmdBuf(cmdLine.begin(), cmdLine.end());
            cmdBuf.push_back('\0');
            CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, FALSE, 0, NULL, NULL, &si, &g_piPanicApp);
        } else {
            // Universal Fallback for PCs without VS Code: Launch Notepad!
            char npPath[MAX_PATH];
            GetSystemDirectoryA(npPath, MAX_PATH);
            std::string notepadPath = std::string(npPath) + "\\notepad.exe";
            CreateProcessA(notepadPath.c_str(), NULL, NULL, NULL, FALSE, 0, NULL, NULL, &si, &g_piPanicApp);
        }

        // Step 3: Apply Hardware Trap Hooks
        if (hKeyboardHook == NULL) hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardHookProc, GetModuleHandle(NULL), 0);
        if (hMouseHook == NULL) hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, MouseHookProc, GetModuleHandle(NULL), 0);

        panicState = 1;
        isPanicMode = true;

    } else if (panicState == 1) {
        // --- 2nd Alt Click: SAFE WORKING MODE (State 2) ---
        PlaySoundA(NULL, 0, 0); // Stop alarm
        RestoreVolume();
        
        // 🎯 Remove BOTH Hooks completely! User gets 100% normal PC control back on Desktop 2.
        if (hMouseHook) { UnhookWindowsHookEx(hMouseHook); hMouseHook = NULL; }
        if (hKeyboardHook) { UnhookWindowsHookEx(hKeyboardHook); hKeyboardHook = NULL; }
        
        panicState = 2;
        isPanicMode = true;

    } else if (panicState == 2) {
        // --- 3rd Alt Click: RESTORE ORIGINAL DESKTOP (State 0) ---
        // 🧹 KILL Panic App before destroying virtual desktop so windows don't spill into Desktop 1!
        if (g_piPanicApp.hProcess) {
            TerminateProcess(g_piPanicApp.hProcess, 0);
            CloseHandle(g_piPanicApp.hProcess);
            CloseHandle(g_piPanicApp.hThread);
            ZeroMemory(&g_piPanicApp, sizeof(g_piPanicApp));
        }

        // Thaw target process
        if (hTargetProcess && pfnNtResumeProcess) {
            pfnNtResumeProcess(hTargetProcess);
            CloseHandle(hTargetProcess);
            hTargetProcess = NULL;
        }

        // Close Virtual Desktop 2 & Return to Original Desktop 1
        CloseCurrentVirtualDesktop();

        panicState = 0;
        isPanicMode = false;
    }
}
