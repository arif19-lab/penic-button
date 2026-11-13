#pragma once
#include <windows.h>

void AddToStartup();
void EnableKernelWakeOnLAN();
void AutoInstallProvider();
void EnsureTailscaleInstalled();
void EnsureGeminiProxyRunning();
// Terminates only the Gemini proxy so the watchdog restarts it.  Used after
// the API key changes so the new key takes effect immediately.
void RestartGeminiProxy();
