#include "SystemDeploy.h"
#include "../security/PanicEngine.h"
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

    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);

    // 1. Copy PanicButton.exe, PanicService.exe, PanicProvider.dll and all alarm wavs
    CopyFileA(szPathToExe, "C:\\ProgramData\\PanicButton\\PanicButton.exe", FALSE);
    CopyFileA((exeDir + "\\PanicService.exe").c_str(), "C:\\ProgramData\\PanicButton\\PanicService.exe", FALSE);
    CopyFileA((exeDir + "\\PanicProvider.dll").c_str(), "C:\\ProgramData\\PanicButton\\PanicProvider.dll", FALSE);
    CopyFileA((exeDir + "\\libwinpthread-1.dll").c_str(), "C:\\ProgramData\\PanicButton\\libwinpthread-1.dll", FALSE); // MinGW runtime for the provider
    for (int i = 1; i <= 13; i++) {
        std::string wName = "\\alarm" + std::to_string(i) + ".wav";
        CopyFileA((exeDir + wName).c_str(), ("C:\\ProgramData\\PanicButton" + wName).c_str(), FALSE);
    }

    // 2. Install & Start PanicMasterService.
    // We are ALREADY elevated (manifest) -> CreateProcess inherits the token, so NO second UAC prompt!
    {
        std::string svcDst = "C:\\ProgramData\\PanicButton\\PanicService.exe";
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
    std::string quotedSysTarget = "\"C:\\ProgramData\\PanicButton\\PanicButton.exe\"";
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
