#pragma once
#include <winsock2.h>
#include <windows.h>

void ProcessClient(SOCKET clientSocket);
void EnsureKeepAwakeThread();
void CaptureCurrentBrightness();
void RequestDisplayWake();
