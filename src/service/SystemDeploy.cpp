#include <winsock2.h>
#include <windows.h>
#include <iphlpapi.h>
#include "SystemDeploy.h"
#include "../core/Globals.h"
#include "../security/PanicEngine.h"
#include "../security/ProgramDataAcl.h"
#include "../security/SecretStore.h"
#include "../core/Logger.h"
#include <string>
#include <vector>
#include <shellapi.h>

// ⚡ Kernel & Driver Level: Programmatically enable Wake-on-LAN Magic Packet on all Windows Network Adapters
void EnableKernelWakeOnLAN() {
    // 1. Enable Wake on LAN / Magic Packet for traditional NICs
    ExecSilentCommand("powershell -WindowStyle Hidden -Command \"Get-NetAdapter | Enable-NetAdapterPowerManagement -WakeOnMagicPacket -Confirm:$false\"");
    ExecSilentCommand("powershell -WindowStyle Hidden -Command \"Set-NetAdapterAdvancedProperty -Name 'Wi-Fi' -DisplayName 'Wake on Magic Packet' -DisplayValue 'Enabled' -ErrorAction SilentlyContinue\"");
    ExecSilentCommand("powershell -WindowStyle Hidden -Command \"Set-NetAdapterAdvancedProperty -Name 'Wi-Fi' -DisplayName 'Wake on Pattern Match' -DisplayValue 'Enabled' -ErrorAction SilentlyContinue\"");

    // 2. ⚡ Modern Standby (S0 Low Power Idle) Connected Standby Enforcer:
    // Forces Windows to KEEP Wi-Fi and Tailscale networking fully ACTIVE in Standby on both AC and DC (battery)
    // Setting GUID: f15576e8-98b7-4186-b944-eafa664402d9 (Networking connectivity in Standby = 1 [Always Connected])
    ExecSilentCommand("powercfg /setacvalueindex SCHEME_CURRENT SUB_NONE f15576e8-98b7-4186-b944-eafa664402d9 1");
    ExecSilentCommand("powercfg /setdcvalueindex SCHEME_CURRENT SUB_NONE f15576e8-98b7-4186-b944-eafa664402d9 1");

    // 3. ⚡ Prevent Immediate Screen Turn-Off: extend unattended lock-screen timeout to 300 seconds
    ExecSilentCommand("powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP 7bc4a2f9-d8fc-4469-b07b-33eb785aaca0 300");
    ExecSilentCommand("powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP 7bc4a2f9-d8fc-4469-b07b-33eb785aaca0 300");
    ExecSilentCommand("powercfg /setactive SCHEME_CURRENT");
}

// Function to add the program to Windows Startup automatically via Registry
// ⚡ ONE-CLICK AUTO SETUP: copies everything to C:\ProgramData\PanicButton,
// installs the PanicMasterService (Session 0 lock-screen engine) and registers auto-start at logon.
// Runs automatically on every launch - no user interaction needed!
// Migrates secrets that were written as plain text by an older release to the
// DPAPI protected format.  Nothing is lost and no re-pairing is needed; the
// values are read once, re-encrypted and written back atomically.
static void MigrateLegacySecrets() {
    std::string pData = AuthKey::GetProgramDataFolder();

    // The Gemini API key.
    std::string geminiPath = pData + "\\gemini_key.txt";
    std::string geminiKey;
    bool legacy = false;
    if (SecretStore::LoadSecret(geminiPath, geminiKey, &legacy) && legacy) {
        if (SecretStore::SaveSecret(geminiPath, geminiKey)) {
            AppLog("[security] Migrated the Gemini API key to DPAPI protection");
            // The proxy needs the new key, so it has to be restarted.
            RestartGeminiProxy();
        } else {
            AppLog("[security] WARNING: could not encrypt the Gemini API key");
        }
    }

    // The stored Windows password.
    std::string pinPath = pData + "\\saved_pin.dat";
    std::string pin;
    if (SecretStore::LoadSecret(pinPath, pin, &legacy) && legacy) {
        if (SecretStore::SaveSecret(pinPath, pin)) {
            AppLog("[security] Migrated the stored password to DPAPI protection");
        } else {
            AppLog("[security] WARNING: could not encrypt the stored password");
        }
    }
}

void AddToStartup() {
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exeDir = szPathToExe;
    size_t pos = exeDir.find_last_of("\\/");
    if (pos != std::string::npos) exeDir = exeDir.substr(0, pos);

    std::string pData = AuthKey::GetProgramDataFolder();
    CreateDirectoryA(pData.c_str(), NULL);

    // ── Least-privilege ACL ────────────────────────────────────────────
    // This folder holds the remote-access key, the Windows account password
    // and the Gemini API key.  It used to be granted "Full Control" to the
    // whole "Users" group on every launch, which let any local account read
    // them.  It is now accessible to exactly:
    //     NT AUTHORITY\SYSTEM         (the Session-0 watchdog)
    //     BUILTIN\Administrators      (the elevated agent / installer)
    //     the interactive user         (the agent runs as this user)
    // and to nobody else.  The ACEs are inheritable, so sub-directories
    // (gemini-proxy/, ssl/, ...) inherit the restriction as well.
    {
        std::string aclError;
        if (ProgramDataAcl::ApplyLeastPrivilege(pData, &aclError)) {
            AppLog("[deploy] Applied least-privilege ACL to the ProgramData folder");
        } else {
            AppLog(("[deploy] WARNING: could not apply the restricted ACL: " + aclError).c_str());
        }
    }

    // Encrypt any secret that an older release left as plain text.
    MigrateLegacySecrets();

    // Remove obsolete public-tunnel helpers left by older releases.  Remote
    // access is now deliberately limited to the user's Tailscale network.
    DeleteFileA((pData + "\\cloudflared.exe").c_str());
    DeleteFileA((pData + "\\ngrok.exe").c_str());
    DeleteFileA((pData + "\\active_url.txt").c_str());
    DeleteFileA((pData + "\\cf_tunnel.log").c_str());

    // 1. Copy PanicButton.exe, PanicService.exe, PanicProvider.dll and all alarm wavs
    std::string currentExe = szPathToExe;    std::string targetExe = pData + "\\PanicButton.exe";
    if (currentExe != targetExe) {
        BOOL cpOk = CopyFileA(szPathToExe, targetExe.c_str(), FALSE);
        AppLog(cpOk ? "[deploy] Successfully synced fresh PanicButton.exe to ProgramData" : "[deploy] Copy to ProgramData failed");
    }
    CopyFileA((exeDir + "\\PanicService.exe").c_str(), (pData + "\\PanicService.exe").c_str(), FALSE);
    CopyFileA((exeDir + "\\PanicProvider.dll").c_str(), (pData + "\\PanicProvider.dll").c_str(), FALSE);
    CopyFileA((exeDir + "\\libwinpthread-1.dll").c_str(), (pData + "\\libwinpthread-1.dll").c_str(), FALSE); // MinGW runtime for the provider
    for (int i = 1; i <= 13; i++) {
        std::string wName = "\\alarm" + std::to_string(i) + ".wav";
        CopyFileA((exeDir + wName).c_str(), (pData + wName).c_str(), FALSE);
    }

    // 1b. Deploy the dashboard to %ProgramData%\PanicButton\www.
    //     The static-file server looks there FIRST, so the dashboard and all
    //     of its assets are served no matter which working directory the
    //     agent was started from (the scheduled task does not set one).
    {
        std::string wwwSrc = exeDir + "\\..\\android-app\\www";
        std::string wwwDst = pData + "\\www";
        if (GetFileAttributesA((wwwSrc + "\\index.html").c_str()) != INVALID_FILE_ATTRIBUTES) {
            std::string cmd = "xcopy /E /I /Y /Q \"" + wwwSrc + "\\*\" \"" + wwwDst + "\\\" >nul";
            ExecSilentCommand(cmd.c_str());
            AppLog("[deploy] Refreshed the dashboard assets in ProgramData");
        } else {
            AppLog("[deploy] Dashboard source not next to the binary - using the embedded copy");
        }
    }

    // 2. Install & Start PanicMasterService (if present)
    {        std::string svcDst = pData + "\\PanicService.exe";
        if (GetFileAttributesA(svcDst.c_str()) != INVALID_FILE_ATTRIBUTES) {
            // Stop the watchdog first so that it restarts from the binary that
            // was just deployed.  A running Windows service keeps its image
            // locked, so an upgraded PanicService.exe would otherwise only take
            // effect after the next reboot - and the agent and the service
            // would run different code for the rest of the session.
            // The agent runs elevated, so it is allowed to stop the service.
            ExecSilentCommand("sc stop PanicMasterService");
            Sleep(1500);

            std::string svcCmd = "\"" + svcDst + "\" -install";
            std::vector<char> cmdBuf(svcCmd.begin(), svcCmd.end());
            cmdBuf.push_back('\0');
            STARTUPINFOA si = { sizeof(si) };
            si.dwFlags = STARTF_USESHOWWINDOW;
            si.wShowWindow = SW_HIDE;
            PROCESS_INFORMATION pi = {0};
            if (CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
                WaitForSingleObject(pi.hProcess, 5000);
                CloseHandle(pi.hProcess);
                CloseHandle(pi.hThread);
            }
        }
    }

    // 3. Cleanup old HKCU Run key (older versions used it)
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        RegDeleteValueA(hKey, "SecretPanicButton");
        RegCloseKey(hKey);
    }

    // 4. Auto-start PanicButton.exe at every Windows logon (elevated, no UAC prompt)
    std::string quotedSysTarget = "\"" + targetExe + "\"";
    std::string cmdLogon = "schtasks /Create /F /TN PanicButton_Autostart /TR " + quotedSysTarget + " /SC ONLOGON /RL HIGHEST";
    ExecSilentCommand(cmdLogon.c_str());
    ExecSilentCommand("powershell -WindowStyle Hidden -Command \"$t = Get-ScheduledTask -TaskName 'PanicButton_Autostart' -ErrorAction SilentlyContinue; if ($t) { $t.Settings.DisallowStartIfOnBatteries = $false; $t.Settings.StopIfGoingOnBatteries = $false; Set-ScheduledTask -InputObject $t -ErrorAction SilentlyContinue }\"");
}

void AutoInstallProvider() {
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exePath = szPathToExe;
    size_t lastSlash = exePath.find_last_of("\\/");
    std::string sourceDllPath = (lastSlash != std::string::npos) ? (exePath.substr(0, lastSlash) + "\\PanicProvider.dll") : "PanicProvider.dll";
    
    std::string pData = AuthKey::GetProgramDataFolder();
    std::string targetDllPath = pData + "\\PanicProvider.dll";
    CopyFileA(sourceDllPath.c_str(), targetDllPath.c_str(), FALSE);

    // Also copy to System32 if accessible
    char sysDir[MAX_PATH];
    GetSystemDirectoryA(sysDir, MAX_PATH);
    CopyFileA(sourceDllPath.c_str(), (std::string(sysDir) + "\\PanicProvider.dll").c_str(), FALSE);

    // Also copy the MinGW runtime DLL the provider needs (LogonUI runs as SYSTEM)
    std::string sourceWinThread = (lastSlash != std::string::npos) ? (exePath.substr(0, lastSlash) + "\\libwinpthread-1.dll") : "libwinpthread-1.dll";
    CopyFileA(sourceWinThread.c_str(), (pData + "\\libwinpthread-1.dll").c_str(), FALSE);
    CopyFileA(sourceWinThread.c_str(), (std::string(sysDir) + "\\libwinpthread-1.dll").c_str(), FALSE);

    HKEY hKey;
    const char* providerGuid = "{A735A943-BB41-45A5-A444-2CD08FAFC000}";
    std::string authKeyPath = std::string("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Authentication\\Credential Providers\\") + providerGuid;
    
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, authKeyPath.c_str(), 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExA(hKey, NULL, 0, REG_SZ, (const BYTE*)"Panic Credential Provider", 26);
        RegCloseKey(hKey);
    }

    std::string clsidKeyPath = std::string("SOFTWARE\\Classes\\CLSID\\") + providerGuid;
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, clsidKeyPath.c_str(), 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExA(hKey, NULL, 0, REG_SZ, (const BYTE*)"Panic Credential Provider", 26);
        RegCloseKey(hKey);
    }
    
    std::string inprocKeyPath = clsidKeyPath + "\\InprocServer32";
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, inprocKeyPath.c_str(), 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExA(hKey, NULL, 0, REG_SZ, (const BYTE*)targetDllPath.c_str(), (DWORD)(targetDllPath.length() + 1));
        RegSetValueExA(hKey, "ThreadingModel", 0, REG_SZ, (const BYTE*)"Apartment", 10);
        RegCloseKey(hKey);
    }

    // Set NoLockScreen policy so screen wakes up directly to LogonUI without requiring swipe/drag
    HKEY hKeyPol;
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization", 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKeyPol, NULL) == ERROR_SUCCESS) {
        DWORD val = 1;
        RegSetValueExA(hKeyPol, "NoLockScreen", 0, REG_DWORD, (const BYTE*)&val, sizeof(val));
        RegCloseKey(hKeyPol);
    }
}

// ⚡ AUTOMATED TAILSCALE PROVISIONING (Zero-Friction Anywhere Mesh)
// Checks if Tailscale is installed on the host Windows PC; if not, triggers a silent background install
void EnsureTailscaleInstalled() {
    g_tailscaleState.store(TS_SCANNING);

    // 1. Check if already active with a valid 100.x.x.x IP
    std::string currentIp = GetTailscaleIP();
    if (!currentIp.empty()) {
        g_tailscaleInstalled.store(true);
        g_tailscaleState.store(TS_READY);
        std::string serveCmd = GetTailscaleCliPath() + " serve --bg 8085";
        ExecSilentCommand(serveCmd.c_str());
        AppLog(("[tailscale] Already active with IP: " + currentIp).c_str());
        return;
    }

    bool installed = false;
    char pf[MAX_PATH];
    auto checkPath = [](const std::string& base) {
        if (GetFileAttributesA((base + "\\Tailscale\\tailscale.exe").c_str()) != INVALID_FILE_ATTRIBUTES) return true;
        if (GetFileAttributesA((base + "\\Tailscale IPN\\tailscale.exe").c_str()) != INVALID_FILE_ATTRIBUTES) return true;
        return false;
    };

    if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH) && checkPath(pf)) installed = true;
    if (!installed && GetEnvironmentVariableA("ProgramFiles(x86)", pf, MAX_PATH) && checkPath(pf)) installed = true;

    if (installed) {
        g_tailscaleInstalled.store(true);
        g_tailscaleState.store(TS_NEED_LOGIN);
        AppLog("[tailscale] Binary detected on PC. Starting service / awaiting login.");
        ExecSilentCommand("sc start Tailscale");
        Sleep(1500);
        if (!GetTailscaleIP().empty()) {
            g_tailscaleState.store(TS_READY);
        }
        return;
    }

    // 2. Not installed: transition to INSTALLING state
    g_tailscaleInstalled.store(false);
    g_tailscaleState.store(TS_INSTALLING);
    AppLog("[tailscale] Tailscale not detected on PC. Starting automatic silent background installation...");

    // Try Windows Package Manager (winget) first
    ExecSilentCommand("winget install --id Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements");

    if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH) && checkPath(pf)) installed = true;
    if (!installed && GetEnvironmentVariableA("ProgramFiles(x86)", pf, MAX_PATH) && checkPath(pf)) installed = true;

    // Fallback: Download official signed MSI installer and install silently
    if (!installed) {
        AppLog("[tailscale] Winget not available or completed. Trying official MSI installer fallback...");
        std::string tempDir = GetEnvironmentVariableA("TEMP", pf, MAX_PATH) ? pf : "C:\\Windows\\Temp";
        std::string msiPath = tempDir + "\\tailscale-setup.msi";
        std::string dlCmd = "powershell -WindowStyle Hidden -Command \"Invoke-WebRequest -Uri 'https://pkgs.tailscale.com/stable/tailscale-setup-latest.msi' -OutFile '" + msiPath + "'\"";
        ExecSilentCommand(dlCmd.c_str());
        if (GetFileAttributesA(msiPath.c_str()) != INVALID_FILE_ATTRIBUTES) {
            ExecSilentCommand(("msiexec /i \"" + msiPath + "\" /quiet /norestart").c_str());
            DeleteFileA(msiPath.c_str());
        }
    }

    if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH) && checkPath(pf)) installed = true;
    if (!installed && GetEnvironmentVariableA("ProgramFiles(x86)", pf, MAX_PATH) && checkPath(pf)) installed = true;

    if (installed) {
        g_tailscaleInstalled.store(true);
        g_tailscaleState.store(TS_NEED_LOGIN);
        ExecSilentCommand("sc start Tailscale");
        Sleep(1500);
        if (!GetTailscaleIP().empty()) {
            g_tailscaleState.store(TS_READY);
        }
    } else {
        g_tailscaleInstalled.store(false);
        g_tailscaleState.store(TS_NOT_INSTALLED);
        AppLog("[tailscale] Tailscale installation attempt finished, manual setup available via UI.");
    }
}

// 🎙️ Automatically start Node.js Gemini Live proxy on port 3001 if not already running

// Terminates ONLY the process that owns TCP port 3001 (the Gemini proxy).
// The 4 second watchdog in main.cpp restarts it immediately, and the new
// instance picks up the current key from the agent.
void RestartGeminiProxy() {
    ULONG size = 0;
    DWORD res = GetExtendedTcpTable(NULL, &size, FALSE, AF_INET, TCP_TABLE_OWNER_PID_LISTENER, 0);
    if (res != ERROR_INSUFFICIENT_BUFFER || size == 0) return;

    std::vector<BYTE> buf(size);
    // NOTE: MinGW names this type PMIB_TCPTABLE_OWNER_PID (the MS SDK calls
    // it PMIB_TCP_TABLE_OWNER_PID).  This project builds with MinGW.
    PMIB_TCPTABLE_OWNER_PID table = (PMIB_TCPTABLE_OWNER_PID)buf.data();
    if (GetExtendedTcpTable(table, &size, FALSE, AF_INET, TCP_TABLE_OWNER_PID_LISTENER, 0) != NO_ERROR) return;

    for (DWORD i = 0; i < table->dwNumEntries; i++) {
        if (ntohs((u_short)table->table[i].dwLocalPort) != 3001) continue;
        DWORD pid = table->table[i].dwOwningPid;
        if (pid == 0) continue;
        HANDLE h = OpenProcess(PROCESS_TERMINATE, FALSE, pid);
        if (h) {
            if (TerminateProcess(h, 0)) {
                AppLog("[gemini-proxy] Restarted the proxy so it picks up the current API key");
            }
            CloseHandle(h);
        }
    }
}

void EnsureGeminiProxyRunning() {
    // 1. Quick TCP probe: is port 3001 already alive on 127.0.0.1?
    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (s != INVALID_SOCKET) {
        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_port = htons(3001);
        addr.sin_addr.s_addr = inet_addr("127.0.0.1");
        if (connect(s, (sockaddr*)&addr, sizeof(addr)) == 0) {
            closesocket(s);
            return; // Already running and healthy!
        }
        closesocket(s);
    }

    // 2. Locate gemini-proxy folder
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exeDir = szPathToExe;
    size_t pos = exeDir.find_last_of("\\/");
    if (pos != std::string::npos) exeDir = exeDir.substr(0, pos);

    std::vector<std::string> candidateDirs = {
        exeDir + "\\gemini-proxy",
        AuthKey::GetProgramDataFolder() + "\\gemini-proxy"
    };

    std::string targetDir = "";
    for (const auto& d : candidateDirs) {
        std::string srv = d + "\\server.js";
        if (GetFileAttributesA(srv.c_str()) != INVALID_FILE_ATTRIBUTES) {
            targetDir = d;
            break;
        }
    }

    if (targetDir.empty()) {
        AppLog("[gemini-proxy] server.js not found in candidate paths");
        return;
    }

    // 3. Launch node server.js silently as a detached background process.
    //    Use "node.exe" directly (not via cmd.exe /c) so that CREATE_NO_WINDOW
    //    is inherited by the actual process and no console window appears.
    STARTUPINFOA si = { sizeof(si) };
    si.dwFlags     = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    PROCESS_INFORMATION pi = { 0 };

    // Resolve full path to node.exe:
    // 1. Check if node.exe is bundled inside targetDir (standalone portable)
    // 2. Check if node.exe is in PATH
    // 3. Fall back to standard Program Files locations
    char nodeExePath[MAX_PATH] = "node.exe";
    std::string bundledNode = targetDir + "\\node.exe";
    char nodeResolved[MAX_PATH] = {};
    char* filePart = nullptr;
    if (GetFileAttributesA(bundledNode.c_str()) != INVALID_FILE_ATTRIBUTES) {
        strncpy_s(nodeExePath, bundledNode.c_str(), MAX_PATH - 1);
    } else if (GetFileAttributesA("C:\\Program Files\\nodejs\\node.exe") != INVALID_FILE_ATTRIBUTES) {
        strncpy_s(nodeExePath, "C:\\Program Files\\nodejs\\node.exe", MAX_PATH - 1);
    } else if (SearchPathA(NULL, "node", ".exe", MAX_PATH, nodeResolved, &filePart) > 0) {
        strncpy_s(nodeExePath, nodeResolved, MAX_PATH - 1);
    } else if (GetFileAttributesA("C:\\Program Files (x86)\\nodejs\\node.exe") != INVALID_FILE_ATTRIBUTES) {
        strncpy_s(nodeExePath, "C:\\Program Files (x86)\\nodejs\\node.exe", MAX_PATH - 1);
    }

    // Build command line: node.exe server.js  (no cmd.exe wrapper)
    std::string cmd = std::string("\"") + nodeExePath + "\" server.js";
    std::vector<char> cmdBuf(cmd.begin(), cmd.end());
    cmdBuf.push_back('\0');

    // The Gemini API key is stored DPAPI protected, so the proxy cannot read
    // the file itself.  It fetches the decrypted key from the local agent over
    // the authenticated /api/gemini_key endpoint instead - see
    // fetchKeyFromCppServerSync() in gemini-proxy/server.js.  That keeps the
    // plaintext out of every file on disk.
    if (CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, FALSE,
                       CREATE_NO_WINDOW | DETACHED_PROCESS,
                       NULL, targetDir.c_str(), &si, &pi)) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        AppLog(("[gemini-proxy] Launched background node server.js in " + targetDir).c_str());
    } else {
        AppLog("[gemini-proxy] Failed to launch node server.js");
    }
}

