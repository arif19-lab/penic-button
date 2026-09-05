#pragma once
#include <winsock2.h>
#include <windows.h>
#include <string>
#include <atomic>

enum TailscaleState {
    TS_SCANNING = 0,
    TS_NOT_INSTALLED = 1,
    TS_INSTALLING = 2,
    TS_NEED_LOGIN = 3,
    TS_READY = 4
};
extern std::atomic<int> g_tailscaleState;
extern std::atomic<bool> g_tailscaleInstalled;
extern std::string g_dynamicKey;
extern std::atomic<time_t> g_lastClientActivity;

std::string GetLocalIP();
// Returns the IPv4 address assigned by Tailscale (100.64.0.0/10), or an
// empty string when Tailscale is not connected.  Reading the adapter table is
// deliberate: it avoids depending on a particular tailscale.exe install path.
std::string GetTailscaleIP();
std::string GetTailscaleCliPath();
std::string GetTailscaleDNS();
void GenerateDynamicKey();
bool IsWorkstationLocked();
std::string GetProgramDataFolder();
