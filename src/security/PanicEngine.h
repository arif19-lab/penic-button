#pragma once
#include <windows.h>
#include <shellapi.h>
#include <string>
#include <tlhelp32.h>

// Function pointer typedefs
typedef LONG (NTAPI *NtSuspendProcess)(IN HANDLE ProcessHandle);
typedef LONG (NTAPI *NtResumeProcess)(IN HANDLE ProcessHandle);

// Global variable extern declarations
extern int panicState;
extern DWORD lastPanicTime;
extern PROCESS_INFORMATION g_piPanicApp;
extern HHOOK hKeyboardHook;
extern HHOOK hMouseHook;
extern bool isListenerEnabled;
extern HWND hMainWnd;
extern NOTIFYICONDATA nid;
extern bool isPanicMode;

extern NtSuspendProcess pfnNtSuspendProcess;
extern NtResumeProcess pfnNtResumeProcess;
extern HANDLE hTargetProcess;
extern std::string targetProcessName;

// Function declarations
void TriggerPanic();
LRESULT CALLBACK KeyboardHookProc(int nCode, WPARAM wParam, LPARAM lParam);
LRESULT CALLBACK MouseHookProc(int nCode, WPARAM wParam, LPARAM lParam);
void SendVirtualDesktopKey(WORD vkCode);
void SwitchToNewVirtualDesktop();
void CloseCurrentVirtualDesktop();
DWORD GetProcessIdByName(const std::string& processName);
void ExecSilentCommand(const char* cmdLine);
