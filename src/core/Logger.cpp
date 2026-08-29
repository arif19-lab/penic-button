#include "Logger.h"
#include <windows.h>
#include <cstdio>

// ⚡ Debug logger: appends to C:\ProgramData\PanicButton\app_debug.log (auto-created, thread-safe)
void AppLog(const char* msg) {
    static CRITICAL_SECTION s_logCs;
    static bool s_logCsInit = false;
    if (!s_logCsInit) { InitializeCriticalSection(&s_logCs); s_logCsInit = true; }
    EnterCriticalSection(&s_logCs);
    FILE* f = fopen("C:\\ProgramData\\PanicButton\\app_debug.log", "a");
    if (f) { fprintf(f, "%s\n", msg); fclose(f); }
    LeaveCriticalSection(&s_logCs);
}

LONG WINAPI CrashFilter(EXCEPTION_POINTERS* pEx) {
    FILE* f = fopen("crash_dump.log", "w");
    if (f) {
        fprintf(f, "CRASH DETECTED! Code: 0x%lX, Addr: %p\n", pEx->ExceptionRecord->ExceptionCode, pEx->ExceptionRecord->ExceptionAddress);
        fflush(f);
        fclose(f);
    }
    return EXCEPTION_CONTINUE_SEARCH;
}
