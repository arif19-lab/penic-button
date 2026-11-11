import os, re

# 1. Update src/server/HttpRouter.cpp
router_path = 'src/server/HttpRouter.cpp'
with open(router_path, 'r', encoding='utf-8') as f:
    router_code = f.read()

# 1a. Remove universal secret from RequestHasValidKey
old_valid_key = """            if (value == g_dynamicKey) {

                if (usedCurrentKey) *usedCurrentKey = true;

                return true;

            }

            if (value == SECRET_KEY) return true;"""

new_valid_key = """            if (value == g_dynamicKey) {

                if (usedCurrentKey) *usedCurrentKey = true;

                return true;

            }"""

assert old_valid_key in router_code, "old_valid_key not found in HttpRouter.cpp"
router_code = router_code.replace(old_valid_key, new_valid_key)

# 1b. Gate gemini-proxy against remote unauthenticated access
old_proxy_route = """        if (request.find("gemini-proxy/") != std::string::npos) {

            BridgeToGeminiProxy(clientSocket, request);

            return;

        }"""

new_proxy_route = """        if (request.find("gemini-proxy/") != std::string::npos) {

            if (!IsLoopbackPeer(clientSocket) && !RequestHasValidKey(request)) {

                std::string deny = "HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json\\r\\nConnection: close\\r\\n\\r\\n{\\"ok\\":false,\\"status\\":403,\\"error\\":\\"unauthorized\\"}";

                send(clientSocket, deny.c_str(), (int)deny.size(), 0);

                closesocket(clientSocket);

                return;

            }

            BridgeToGeminiProxy(clientSocket, request);

            return;

        }"""

assert old_proxy_route in router_code, "old_proxy_route not found in HttpRouter.cpp"
router_code = router_code.replace(old_proxy_route, new_proxy_route)

# 1c. Sanitize /api/status and /status: Safe discovery for unauthenticated, full telemetry (no key leak) for authenticated
old_status_block_start = """        } else if (request.find("GET /api/status") != std::string::npos || request.find("GET /status") != std::string::npos) {

            // 🛡️ System Defense Status Endpoint with Real-Time Deep Native Hardware Telemetry (<1μs zero overhead)"""

assert old_status_block_start in router_code, "old_status_block_start not found in HttpRouter.cpp"

# We replace the whole /api/status handler up to the send/return
status_pattern = re.compile(
    r'(        \} else if \(request\.find\("GET /api/status"\) != std::string::npos \|\| request\.find\("GET /status"\) != std::string::npos\) \{\s*\n)'
    r'.*?'
    r'(            send\(clientSocket, res\.c_str\(\), \(int\)res\.size\(\), 0\);\s*\n'
    r'            shutdown\(clientSocket, SD_SEND\);\s*\n'
    r'            closesocket\(clientSocket\);\s*\n'
    r'            return;\s*\n)',
    re.DOTALL
)

new_status_handler = r'''        } else if (request.find("GET /api/status") != std::string::npos || request.find("GET /status") != std::string::npos) {
            bool isAuth = RequestHasValidKey(request);
            bool isLocked = IsWorkstationLocked();
            std::string tsIp = GetTailscaleIP();
            std::string tsDns = GetTailscaleDNS();
            std::string lanIp = GetLocalIP();

            if (!isAuth) {
                // Public discovery response: Minimal non-sensitive health & connectivity info ONLY.
                // NEVER leak auth keys, saved PINs, Gemini credentials, or detailed hardware telemetry to unauthenticated callers.
                responseBody = "{\"ok\":true,\"service\":\"panic-ctrl\",\"version\":\"2.7.0\",\"authenticated\":false,\"requires_auth\":true"
                               ",\"panic\":" + std::string(isPanicMode ? "true" : "false") +
                               ",\"locked\":" + std::string(isLocked ? "true" : "false") +
                               ",\"state\":" + std::to_string(panicState) +
                               ",\"lan_ip\":\"" + lanIp + "\"" +
                               ",\"tailscale_ip\":\"" + tsIp + "\"" +
                               ",\"tailscale_dns\":\"" + tsDns + "\"}";
            } else {
                // Authenticated response: Full real-time system defense status & hardware telemetry.
                std::string mac = GetPrimaryMacAddress();
                std::string localHttpsUrl = "https://" + lanIp + ":8443/";
                std::string tsHttpsUrl = tsDns.empty() ? "" : ("https://" + tsDns + "/");

                // 1. Live CPU Usage via GetSystemTimes
                static FILETIME prevIdle = {0}, prevKernel = {0}, prevUser = {0};
                FILETIME idle, kernel, user;
                double cpuPct = 0.0;
                if (GetSystemTimes(&idle, &kernel, &user)) {
                    auto FT2U64 = [](const FILETIME& ft) -> ULONGLONG {
                        return (((ULONGLONG)ft.dwHighDateTime) << 32) | ft.dwLowDateTime;
                    };
                    ULONGLONG i = FT2U64(idle), k = FT2U64(kernel), u = FT2U64(user);
                    ULONGLONG pi = FT2U64(prevIdle), pk = FT2U64(prevKernel), pu = FT2U64(prevUser);
                    prevIdle = idle; prevKernel = kernel; prevUser = user;
                    if (pk > 0 || pu > 0) {
                        ULONGLONG sys = (k - pk) + (u - pu);
                        ULONGLONG idl = (i - pi);
                        if (sys > 0) {
                            cpuPct = (double)(sys - idl) * 100.0 / (double)sys;
                            if (cpuPct < 0.0) cpuPct = 0.0;
                            if (cpuPct > 100.0) cpuPct = 100.0;
                        }
                    }
                }

                SYSTEM_INFO sysInfo;
                GetSystemInfo(&sysInfo);
                int cpuCores = (int)sysInfo.dwNumberOfProcessors;

                // 2. RAM Usage via GlobalMemoryStatusEx
                MEMORYSTATUSEX mem;
                mem.dwLength = sizeof(mem);
                double ramTotal = 0.0, ramUsed = 0.0;
                int ramPct = 0;
                if (GlobalMemoryStatusEx(&mem)) {
                    ramTotal = (double)mem.ullTotalPhys / (1024.0 * 1024.0 * 1024.0);
                    double ramFree = (double)mem.ullAvailPhys / (1024.0 * 1024.0 * 1024.0);
                    ramUsed = ramTotal - ramFree;
                    if (ramUsed < 0.0) ramUsed = 0.0;
                    ramPct = (int)mem.dwMemoryLoad;
                }

                // 3. Storage (C:) via GetDiskFreeSpaceExA
                ULARGE_INTEGER freeBytes, totalBytes, totalFreeBytes;
                double diskTotal = 0.0, diskFree = 0.0;
                int diskPct = 0;
                if (GetDiskFreeSpaceExA("C:\\", &freeBytes, &totalBytes, &totalFreeBytes)) {
                    diskTotal = (double)totalBytes.QuadPart / (1024.0 * 1024.0 * 1024.0);
                    diskFree = (double)freeBytes.QuadPart / (1024.0 * 1024.0 * 1024.0);
                    double diskUsed = diskTotal - diskFree;
                    diskPct = (diskTotal > 0) ? (int)((diskUsed / diskTotal) * 100.0) : 0;
                }

                // 4. Display Resolution & Refresh Rate
                int scrW = GetSystemMetrics(SM_CXSCREEN);
                int scrH = GetSystemMetrics(SM_CYSCREEN);
                DEVMODEA dm = {0};
                dm.dmSize = sizeof(dm);
                int refreshHz = 60;
                if (EnumDisplaySettingsA(NULL, ENUM_CURRENT_SETTINGS, &dm)) {
                    if (dm.dmDisplayFrequency > 0) refreshHz = (int)dm.dmDisplayFrequency;
                }

                // 5. System Uptime
                ULONGLONG upSec = GetTickCount64() / 1000;
                int upH = (int)(upSec / 3600);
                int upM = (int)((upSec % 3600) / 60);
                char ubuf[32];
                snprintf(ubuf, sizeof(ubuf), "%dh %dm", upH, upM);

                char hwBuf[512];
                snprintf(hwBuf, sizeof(hwBuf),
                    ",\"cpu_pct\":%.1f,\"cpu_cores\":%d,\"ram_used\":%.1f,\"ram_total\":%.1f,\"ram_pct\":%d,"
                    "\"disk_free\":%.1f,\"disk_total\":%.1f,\"disk_pct\":%d,\"disp_w\":%d,\"disp_h\":%d,\"disp_hz\":%d,\"uptime\":\"%s\"",
                    cpuPct, cpuCores, ramUsed, ramTotal, ramPct,
                    diskFree, diskTotal, diskPct, scrW, scrH, refreshHz, ubuf);

                bool hasSavedPin = (GetFileAttributesA("C:\\ProgramData\\PanicButton\\saved_pin.dat") != INVALID_FILE_ATTRIBUTES);

                responseBody = "{\"ok\":true,\"service\":\"panic-ctrl\",\"version\":\"2.7.0\",\"authenticated\":true"
                               ",\"panic\":" + std::string(isPanicMode ? "true" : "false") + 
                               ",\"locked\":" + std::string(isLocked ? "true" : "false") + 
                               ",\"sleeping\":" + std::string(g_isSleepActive.load() ? "true" : "false") + 
                               ",\"has_saved_pin\":" + std::string(hasSavedPin ? "true" : "false") + 
                               ",\"state\":" + std::to_string(panicState) + 
                               ",\"lan_ip\":\"" + lanIp + "\"" + 
                               ",\"mac\":\"" + mac + "\"" + 
                               ",\"tailscale_ip\":\"" + tsIp + "\"" + 
                               ",\"tailscale_dns\":\"" + tsDns + "\"" + 
                               ",\"local_https_url\":\"" + localHttpsUrl + "\",\"https_url\":\"" + localHttpsUrl + "\",\"tailscale_https_url\":\"" + tsHttpsUrl + "\"" + 
                               std::string(hwBuf) + "}";
            }

            std::string res = 
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;
'''

match = status_pattern.search(router_code)
assert match, "status_pattern match failed in HttpRouter.cpp"
router_code = router_code[:match.start()] + new_status_handler + router_code[match.end():]

with open(router_path, 'w', encoding='utf-8') as f:
    f.write(router_code)
print("HttpRouter.cpp successfully updated!")

# 2. Update PanicService.cpp: Remove key leak in /api/status and enforce single key
svc_path = 'PanicService.cpp'
with open(svc_path, 'r', encoding='utf-8') as f:
    svc_code = f.read()

old_svc_body = 'body = "{\\"panic\\":false,\\"locked\\":" + std::string(locked ? "true" : "false") +\n                   ",\\"state\\":0,\\"lan_ip\\":\\"" + SvcLocalIP() + "\\"" +\n                   ",\\"tailscale_ip\\":\\"\\",\\"agent\\":false,\\"service\\":true,\\"key\\":\\"" + SvcAuthKey() + "\\"}";'
new_svc_body = 'body = "{\\"ok\\":true,\\"service\\":\\"panic-service\\",\\"panic\\":false,\\"locked\\":" + std::string(locked ? "true" : "false") +\n                   ",\\"state\\":0,\\"lan_ip\\":\\"" + SvcLocalIP() + "\\"" +\n                   ",\\"tailscale_ip\\":\\"\\",\\"agent\\":false,\\"service\\":true}";'

if old_svc_body in svc_code:
    svc_code = svc_code.replace(old_svc_body, new_svc_body)
elif old_svc_body.replace('\n', '\r\n') in svc_code:
    svc_code = svc_code.replace(old_svc_body.replace('\n', '\r\n'), new_svc_body.replace('\n', '\r\n'))
else:
    print("Warning: old_svc_body not found in PanicService.cpp")

with open(svc_path, 'w', encoding='utf-8') as f:
    f.write(svc_code)
print("PanicService.cpp successfully updated!")
