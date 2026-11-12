#pragma once
#include <winsock2.h>
#include <windows.h>
#include <string>
#include <atomic>

// The single authoritative implementation of the per-install access key
// (path, trimming, validation, generation, caching and request parsing).
// Used by the agent, by PanicService.exe and mirrored by the Node proxy.
#include "AuthKey.h"

enum TailscaleState {
    TS_SCANNING = 0,
    TS_NOT_INSTALLED = 1,
    TS_INSTALLING = 2,
    TS_NEED_LOGIN = 3,
    TS_READY = 4
};
extern std::atomic<int> g_tailscaleState;
extern std::atomic<bool> g_tailscaleInstalled;
extern std::atomic<time_t> g_lastClientActivity;

std::string GetLocalIP();
// Returns the IPv4 address assigned by Tailscale (100.64.0.0/10), or an
// empty string when Tailscale is not connected.  Reading the adapter table is
// deliberate: it avoids depending on a particular tailscale.exe install path.
std::string GetTailscaleIP();
std::string GetTailscaleCliPath();
std::string GetTailscaleDNS();
std::string GetPrimaryMacAddress();
// The old shared key stays valid only until a client proves it adopted the
// per-install key, so existing phones migrate without a re-pair.
bool IsLegacyKeyAllowed();
void MarkPairedWithCurrentKey();
bool IsWorkstationLocked();
