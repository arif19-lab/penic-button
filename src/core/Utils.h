#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <gdiplus.h>

namespace Utils {
    void AppLog(const char* msg);
    DWORD GetProcessIdByName(const std::string& processName);
    int GetEncoderClsid(const WCHAR* format, CLSID* pClsid);
    void SwitchToActiveDesktop();
}
