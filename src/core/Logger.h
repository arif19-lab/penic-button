#pragma once
#include <windows.h>

void AppLog(const char* msg);
LONG WINAPI CrashFilter(EXCEPTION_POINTERS* pEx);
