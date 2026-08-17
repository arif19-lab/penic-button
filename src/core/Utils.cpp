#include "Utils.h"
#include "Config.h"
#include <stdio.h>
#include <tlhelp32.h>

using namespace Gdiplus;

namespace Utils {

void AppLog(const char* msg) {
    static CRITICAL_SECTION s_logCs;
    static bool s_logCsInit = false;
    if (!s_logCsInit) { InitializeCriticalSection(&s_logCs); s_logCsInit = true; }
    EnterCriticalSection(&s_logCs);
    FILE* f = fopen(PanicConfig::LOG_PATH.c_str(), "a");
    if (f) { fprintf(f, "%s\n", msg); fclose(f); }
    LeaveCriticalSection(&s_logCs);
}

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

int GetEncoderClsid(const WCHAR* format, CLSID* pClsid) {
    UINT num = 0, size = 0;
    GetImageEncodersSize(&num, &size);
    if (size == 0) return -1;
    ImageCodecInfo* pImageCodecInfo = (ImageCodecInfo*)(malloc(size));
    if (pImageCodecInfo == NULL) return -1;
    GetImageEncoders(num, size, pImageCodecInfo);
    for (UINT j = 0; j < num; ++j) {
        if (wcscmp(pImageCodecInfo[j].MimeType, format) == 0) {
            *pClsid = pImageCodecInfo[j].Clsid;
            free(pImageCodecInfo);
            return j;
        }
    }
    free(pImageCodecInfo);
    return -1;
}

void SwitchToActiveDesktop() {
    HDESK hInputDesktop = OpenInputDesktop(0, FALSE, MAXIMUM_ALLOWED);
    if (hInputDesktop) {
        SetThreadDesktop(hInputDesktop);
        CloseDesktop(hInputDesktop);
    }
}

} // namespace Utils
