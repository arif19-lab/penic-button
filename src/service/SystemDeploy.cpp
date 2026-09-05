#include <winsock2.h>
#include <windows.h>
#include "SystemDeploy.h"
#include "../core/Globals.h"
#include "../security/PanicEngine.h"
#include "../core/Logger.h"
#include <string>
#include <vector>
#include <shellapi.h>

// ⚡ Kernel & Driver Level: Programmatically enable Wake-on-LAN Magic Packet on all Windows Network Adapters
void EnableKernelWakeOnLAN() {
    ExecSilentCommand("powershell -WindowStyle Hidden -Command \"Get-NetAdapter | Enable-NetAdapterPowerManagement -WakeOnMagicPacket -Confirm:$false\"");
}

// Function to add the program to Windows Startup automatically via Registry
// ⚡ ONE-CLICK AUTO SETUP: copies everything to C:\ProgramData\PanicButton,
// installs the PanicMasterService (Session 0 lock-screen engine) and registers auto-start at logon.
// Runs automatically on every launch - no user interaction needed!
void AddToStartup() {
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exeDir = szPathToExe;
    size_t pos = exeDir.find_last_of("\\/");
    if (pos != std::string::npos) exeDir = exeDir.substr(0, pos);

    std::string pData = GetProgramDataFolder();
    CreateDirectoryA(pData.c_str(), NULL);
    ExecSilentCommand(("icacls \"" + pData + "\" /grant Users:(OI)(CI)(F) /T /Q").c_str());

    // Remove obsolete public-tunnel helpers left by older releases.  Remote
    // access is now deliberately limited to the user's Tailscale network.
    DeleteFileA((pData + "\\cloudflared.exe").c_str());
    DeleteFileA((pData + "\\ngrok.exe").c_str());
    DeleteFileA((pData + "\\active_url.txt").c_str());
    DeleteFileA((pData + "\\cf_tunnel.log").c_str());

    // 1. Copy PanicButton.exe, PanicService.exe, PanicProvider.dll and all alarm wavs
    std::string currentExe = szPathToExe;
    std::string targetExe = pData + "\\PanicButton.exe";
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

    // 2. Install & Start PanicMasterService.
    // We are ALREADY elevated (manifest) -> CreateProcess inherits the token, so NO second UAC prompt!
    {
        std::string svcDst = pData + "\\PanicService.exe";
        std::string svcCmd = "\"" + svcDst + "\" -install";
        std::vector<char> cmdBuf(svcCmd.begin(), svcCmd.end());
        cmdBuf.push_back('\0');
        STARTUPINFOA si = { sizeof(si) };
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_HIDE;
        PROCESS_INFORMATION pi = {0};
        if (CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
            WaitForSingleObject(pi.hProcess, 30000); // Wait for install+start to finish
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
        } else if (GetLastError() == ERROR_ELEVATION_REQUIRED) {
            // Edge case: running without admin - ask the user via UAC once
            ShellExecuteA(NULL, "runas", svcDst.c_str(), "-install", NULL, SW_HIDE);
        }
    }

    // 3. Cleanup old HKCU Run key (older versions used it)
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        RegDeleteValueA(hKey, "SecretPanicButton_Imran");
        RegCloseKey(hKey);
    }

    // 4. Auto-start PanicButton.exe at every Windows logon (elevated, no UAC prompt)
    std::string quotedSysTarget = "\"" + targetExe + "\"";
    std::string cmdLogon = "schtasks /Create /F /TN PanicButton_Autostart /TR " + quotedSysTarget + " /SC ONLOGON /RL HIGHEST";
    ExecSilentCommand(cmdLogon.c_str());
}

void AutoInstallProvider() {
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exePath = szPathToExe;
    size_t lastSlash = exePath.find_last_of("\\/");
    std::string sourceDllPath = (lastSlash != std::string::npos) ? (exePath.substr(0, lastSlash) + "\\PanicProvider.dll") : "PanicProvider.dll";
    
    // LogonUI runs as SYSTEM, so it often cannot read DLLs from User/OneDrive folders.
    // We MUST copy it to System32!
    char sysDir[MAX_PATH];
    GetSystemDirectoryA(sysDir, MAX_PATH);
    std::string targetDllPath = std::string(sysDir) + "\\PanicProvider.dll";
    
    CopyFileA(sourceDllPath.c_str(), targetDllPath.c_str(), FALSE);

    // Also copy the MinGW runtime DLL the provider needs (LogonUI runs as SYSTEM and cannot see the user's PATH)
    std::string sourceWinThread = (lastSlash != std::string::npos) ? (exePath.substr(0, lastSlash) + "\\libwinpthread-1.dll") : "libwinpthread-1.dll";
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
        RegSetValueExA(hKey, NULL, 0, REG_SZ, (const BYTE*)targetDllPath.c_str(), targetDllPath.length() + 1);
        RegSetValueExA(hKey, "ThreadingModel", 0, REG_SZ, (const BYTE*)"Apartment", 10);
        RegCloseKey(hKey);
    }

    // Explicitly delete NoLockScreen key so original Windows Lock Screen displays normally
    HKEY hKeyPol;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization", 0, KEY_SET_VALUE, &hKeyPol) == ERROR_SUCCESS) {
        RegDeleteValueA(hKeyPol, "NoLockScreen");
        RegCloseKey(hKeyPol);
    }
}

// ⚡ AUTOMATED TAILSCALE PROVISIONING (Zero-Friction Anywhere Mesh)
// Checks if Tailscale is installed on the host Windows PC; if not, triggers a silent background install
void EnsureTailscaleInstalled() {
    if (!GetTailscaleIP().empty()) {
        AppLog(("[tailscale] Already active with IP: " + GetTailscaleIP()).c_str());
        return;
    }

    bool installed = false;
    char pf[MAX_PATH];
    if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH)) {
        std::string p = std::string(pf) + "\\Tailscale IPN\\tailscale.exe";
        if (GetFileAttributesA(p.c_str()) != INVALID_FILE_ATTRIBUTES) installed = true;
    }
    if (!installed && GetEnvironmentVariableA("ProgramFiles(x86)", pf, MAX_PATH)) {
        std::string p = std::string(pf) + "\\Tailscale IPN\\tailscale.exe";
        if (GetFileAttributesA(p.c_str()) != INVALID_FILE_ATTRIBUTES) installed = true;
    }

    if (!installed) {
        AppLog("[tailscale] Tailscale not detected on PC. Starting automatic silent background installation...");
        // 1. Try Windows Package Manager (winget) first
        ExecSilentCommand("winget install --id Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements");

        // Verify if installed via winget
        if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH)) {
            std::string p = std::string(pf) + "\\Tailscale IPN\\tailscale.exe";
            if (GetFileAttributesA(p.c_str()) != INVALID_FILE_ATTRIBUTES) installed = true;
        }

        // 2. Fallback: Download official signed MSI installer and install silently
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
    }

    // Ensure the Tailscale background service is running
    ExecSilentCommand("sc start Tailscale");
}

