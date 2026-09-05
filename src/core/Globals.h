#pragma once
#include <winsock2.h>
#include <windows.h>
#include <string>

extern std::string g_dynamicKey;

std::string GetLocalIP();
// Returns the IPv4 address assigned by Tailscale (100.64.0.0/10), or an
// empty string when Tailscale is not connected.  Reading the adapter table is
// deliberate: it avoids depending on a particular tailscale.exe install path.
std::string GetTailscaleIP();
void GenerateDynamicKey();
bool IsWorkstationLocked();
std::string GetProgramDataFolder();
