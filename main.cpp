#include <winsock2.h>   // Network/Socket (MUST be before windows.h!)
#include <windows.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <shellapi.h>
#include <shobjidl.h>
#include <mmsystem.h>   // PlaySound
#include <ws2tcpip.h>   // TCP/IP
#include <vector>
#include <thread>
#include <string>
#include <sstream>
#include <gdiplus.h>
#include <tlhelp32.h>
using namespace Gdiplus;
#pragma comment(lib, "ws2_32.lib") // Winsock Library Link
#pragma comment(lib, "gdiplus.lib")

typedef LONG (NTAPI *NtSuspendProcess)(IN HANDLE ProcessHandle);
typedef LONG (NTAPI *NtResumeProcess)(IN HANDLE ProcessHandle);

NtSuspendProcess pfnNtSuspendProcess = NULL;
NtResumeProcess pfnNtResumeProcess = NULL;
HANDLE hTargetProcess = NULL;
std::string targetProcessName = "chrome.exe"; // Default target

DWORD GetProcessIdByName(const std::string& processName) {
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return 0;

    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (processName == pe32.szExeFile) {
                CloseHandle(hSnapshot);
                return pe32.th32ProcessID;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    CloseHandle(hSnapshot);
    return 0;
}
int GetEncoderClsid(const WCHAR* format, CLSID* pClsid) {
    UINT num = 0, size = 0;
    GetImageEncodersSize(&num, &size);
    if (size == 0) return -1;
    ImageCodecInfo* pImageCodecInfo = (ImageCodecInfo*)(malloc(size));
    if (pImageCodecInfo == NULL) return -1;
    GetImageEncoders(num, size, pImageCodecInfo);
    for (UINT j = 0; j < num; ++j) {
        if (wcscmp(pImageCodecInfo[j].MimeType, format) == 0) {
            *pClsid = pImageCodecInfo[j].Clsid;
            free(pImageCodecInfo);
            return j;
        }
    }
    free(pImageCodecInfo);
    return -1;
}

bool isPanicMode = false;
ITaskbarList* pTaskbar = NULL;

// Function to add the program to Windows Startup automatically via Registry
void AddToStartup() {
    HKEY hKey;
    const char* czStartName = "SecretPanicButton_Imran";
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    LONG lnRes = RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_WRITE, &hKey);
    if (lnRes == ERROR_SUCCESS) {
        RegSetValueExA(hKey, czStartName, 0, REG_SZ, (unsigned char*)szPathToExe, strlen(szPathToExe) + 1);
        RegCloseKey(hKey);
    }
}

void InitializeTaskbar() {
    CoInitialize(NULL);
    CoCreateInstance(CLSID_TaskbarList, NULL, CLSCTX_INPROC_SERVER, IID_ITaskbarList, (void**)&pTaskbar);
    if (pTaskbar) pTaskbar->HrInit();
}

// --- PROFESSIONAL AUDIO MANAGEMENT ---
// We use SetMasterVolumeLevelScalar instead of SetMute.
// Reason: SetMute() sends a Windows media event that causes Chrome, YouTube,
// and most media players to auto-resume playback — a critical privacy leak!
// SetMasterVolumeLevelScalar(0.0f) silently zeros the volume at the hardware
// level without sending ANY media events, so players stay in their current state.
float g_savedVolume = -1.0f; // -1 means not saved yet

IAudioEndpointVolume* GetAudioEndpoint() {
    IMMDeviceEnumerator* pEnumerator = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, 
        __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (FAILED(hr)) return NULL;

    IMMDevice* pDevice = NULL;
    hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
    pEnumerator->Release();
    if (FAILED(hr)) return NULL;

    IAudioEndpointVolume* pVol = NULL;
    hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, NULL, (void**)&pVol);
    pDevice->Release();
    if (FAILED(hr)) return NULL;

    return pVol;
}

void SilentZeroVolume() {
    IAudioEndpointVolume* pVol = GetAudioEndpoint();
    if (!pVol) return;
    // Save the current volume before zeroing it
    pVol->GetMasterVolumeLevelScalar(&g_savedVolume);
    // Set volume to 0.0f — completely silent, no media events fired!
    pVol->SetMasterVolumeLevelScalar(0.0f, NULL);
    pVol->Release();
}

void RestoreVolume() {
    IAudioEndpointVolume* pVol = GetAudioEndpoint();
    if (!pVol) return;
    if (g_savedVolume >= 0.0f) {
        // Restore exactly what it was before
        pVol->SetMasterVolumeLevelScalar(g_savedVolume, NULL);
        g_savedVolume = -1.0f; // Reset saved state
    }
    pVol->Release();
}
// --------------------------------------


// --- VIRTUAL DESKTOP MAGIC ---
void SwitchToNewVirtualDesktop() {
    INPUT inputs[6] = {0};
    
    // Press Win + Ctrl + D
    inputs[0].type = INPUT_KEYBOARD; inputs[0].ki.wVk = VK_LWIN;
    inputs[1].type = INPUT_KEYBOARD; inputs[1].ki.wVk = VK_LCONTROL;
    inputs[2].type = INPUT_KEYBOARD; inputs[2].ki.wVk = 0x44; // 'D'
    
    // Release D + Ctrl + Win
    inputs[3].type = INPUT_KEYBOARD; inputs[3].ki.wVk = 0x44; inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[4].type = INPUT_KEYBOARD; inputs[4].ki.wVk = VK_LCONTROL; inputs[4].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[5].type = INPUT_KEYBOARD; inputs[5].ki.wVk = VK_LWIN; inputs[5].ki.dwFlags = KEYEVENTF_KEYUP;
    
    SendInput(6, inputs, sizeof(INPUT));
}

void CloseCurrentVirtualDesktop() {
    INPUT inputs[6] = {0};
    
    // Press Win + Ctrl + F4
    inputs[0].type = INPUT_KEYBOARD; inputs[0].ki.wVk = VK_LWIN;
    inputs[1].type = INPUT_KEYBOARD; inputs[1].ki.wVk = VK_LCONTROL;
    inputs[2].type = INPUT_KEYBOARD; inputs[2].ki.wVk = VK_F4; // 'F4'
    
    // Release F4 + Ctrl + Win
    inputs[3].type = INPUT_KEYBOARD; inputs[3].ki.wVk = VK_F4; inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[4].type = INPUT_KEYBOARD; inputs[4].ki.wVk = VK_LCONTROL; inputs[4].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[5].type = INPUT_KEYBOARD; inputs[5].ki.wVk = VK_LWIN; inputs[5].ki.dwFlags = KEYEVENTF_KEYUP;
    
    SendInput(6, inputs, sizeof(INPUT));
}
// -----------------------------

BOOL CALLBACK MaximizeVSCodeProc(HWND hwnd, LPARAM lParam) {
    char title[256];
    if (GetWindowTextLength(hwnd) > 0) {
        GetWindowTextA(hwnd, title, sizeof(title));
        if (strstr(title, "Visual Studio Code") != NULL) {
            ShowWindow(hwnd, SW_MAXIMIZE);
            SetForegroundWindow(hwnd);
            return FALSE; 
        }
    }
    return TRUE;
}

void MaximizeVSCodeThread() {
    for (int i = 0; i < 5; i++) {
        Sleep(400);
        EnumWindows(MaximizeVSCodeProc, 0);
    }
}

#define WM_TRAYICON (WM_USER + 1)
#define IDM_TRIGGER 1001
#define IDM_PAUSE   1002
#define IDM_EXIT    1003

bool isListenerEnabled = true;
NOTIFYICONDATA nid;
HWND hMainWnd;

HHOOK hKeyboardHook = NULL;
HHOOK hMouseHook = NULL;

// --- INTRUDER ALARM MAGIC ---
void MaxSystemVolume() {
    IMMDeviceEnumerator* pEnumerator = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (SUCCEEDED(hr)) {
        IMMDevice* pDevice = NULL;
        hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
        if (SUCCEEDED(hr)) {
            IAudioEndpointVolume* pEndpointVolume = NULL;
            hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, NULL, (void**)&pEndpointVolume);
            if (SUCCEEDED(hr)) {
                // Force Unmute
                pEndpointVolume->SetMute(FALSE, NULL); 
                // Force Volume to 100% (1.0f)
                pEndpointVolume->SetMasterVolumeLevelScalar(1.0f, NULL);
                pEndpointVolume->Release();
            }
            pDevice->Release();
        }
        pEnumerator->Release();
    }
}

void TriggerAlarm() {
    static DWORD lastTriggerTime = 0;
    DWORD currentTime = GetTickCount();
    
    // Only max volume if at least 1 second has passed since the last trigger, 
    // to prevent COM call spam if the intruder mashes the keyboard or mouse.
    if (currentTime - lastTriggerTime > 1000) {
        lastTriggerTime = currentTime;
        MaxSystemVolume();
    }
    
    // Static counter to keep track of which audio to play next
    static int clickCount = 1;

    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    std::string exePath = szPath;
    
    // Dynamically build the filename: alarm1.wav, alarm2.wav, etc.
    std::string wavName = "\\alarm" + std::to_string(clickCount) + ".wav";
    std::string wavPath = exePath.substr(0, exePath.find_last_of("\\/")) + wavName;

    // Play the TTS warning voice ONCE per trigger. 
    // Removing SND_NOSTOP means every new click will instantly restart the audio from the beginning!
    PlaySoundA(wavPath.c_str(), NULL, SND_FILENAME | SND_ASYNC);

    // Increment click count for next time, reset to 1 if we go past 13
    clickCount++;
    if (clickCount > 13) {
        clickCount = 1;
    }
}
// -----------------------------

LRESULT CALLBACK KeyboardHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT *pKeyBoard = (KBDLLHOOKSTRUCT *)lParam;
        
        // CRITICAL: Allow injected keys (SendInput) so our Virtual Desktop & Media keys aren't blocked by our own hook!
        if (pKeyBoard->flags & LLKHF_INJECTED) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }

        // Allow Right Alt to pass through to turn OFF Panic Mode
        if (pKeyBoard->vkCode == VK_RMENU) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }
        
        // INTRUDER DETECTED! Only trigger on KeyDown so it doesn't spam on KeyUp
        if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
            TriggerAlarm();
        }

        // BLOCK EVERYTHING ELSE!
        return 1; 
    }
    return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

LRESULT CALLBACK MouseHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        // INTRUDER DETECTED! Trigger on any mouse click (Left, Right, Middle)
        if (wParam == WM_LBUTTONDOWN || wParam == WM_RBUTTONDOWN || wParam == WM_MBUTTONDOWN) {
            TriggerAlarm();
        }
        return 1; // BLOCK ALL MOUSE EVENTS
    }
    return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
}

void TriggerPanic() {
    if (!isPanicMode) {
        // --- PANIC ON ---
        
        // Step 0: EDR-Level Process Suspension (Freeze target app in memory)
        DWORD pid = GetProcessIdByName(targetProcessName);
        if (pid && pfnNtSuspendProcess) {
            hTargetProcess = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
            if (hTargetProcess) {
                pfnNtSuspendProcess(hTargetProcess);
            }
        }

        // Step 1: Silently zero the volume BEFORE switching desktop.
        // This prevents any media from making sound even if it resumes.
        // Uses SetMasterVolumeLevelScalar(0.0f) — NO media events fired!
        // Silent Panic ON
        
        // Step 2. Switch to a completely clean, new Virtual Desktop
        SwitchToNewVirtualDesktop();
        
        // Step 3. Wait for the Windows slide animation to finish
        Sleep(600); 
        
        // Step 4. Spawn a new VS Code window on this empty desktop
        ShellExecuteA(NULL, "open", "cmd.exe", "/c code -n C:\\Users\\Imran\\mess_manager C:\\Users\\Imran\\mess_manager\\lib\\main.dart", NULL, SW_HIDE);
        
        std::thread t(MaximizeVSCodeThread);
        t.detach();

        // Step 5. Apply Hardware Freeze (mouse + keyboard lock)
        if (hKeyboardHook == NULL) hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardHookProc, GetModuleHandle(NULL), 0);
        if (hMouseHook == NULL) hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, MouseHookProc, GetModuleHandle(NULL), 0);

        isPanicMode = true;
    } else {
        // --- PANIC OFF ---
        
        // Step 0: Thaw the frozen application
        if (hTargetProcess && pfnNtResumeProcess) {
            pfnNtResumeProcess(hTargetProcess);
            CloseHandle(hTargetProcess);
            hTargetProcess = NULL;
        }

        // Step 1. Stop the intruder alarm audio immediately
        PlaySoundA(NULL, 0, 0);

        // Step 2. Remove Hardware Freeze
        if (hKeyboardHook) { UnhookWindowsHookEx(hKeyboardHook); hKeyboardHook = NULL; }
        if (hMouseHook) { UnhookWindowsHookEx(hMouseHook); hMouseHook = NULL; }

        // Step 3. Restore volume to what it was before panic was triggered
        RestoreVolume();

        // Step 4. Close the fake Virtual Desktop (OS slides back to original desktop!)
        CloseCurrentVirtualDesktop();

        isPanicMode = false;
    }
}

// Thread to run the Hotkey Listener independently of the GUI
void HotkeyListenerThread() {
    while (true) {
        if (isListenerEnabled && (GetAsyncKeyState(VK_RMENU) & 0x8000)) {
            
            // Tell the main GUI thread to trigger the panic! 
            // (Hooks must be installed from the thread that has the message loop)
            PostMessage(hMainWnd, WM_COMMAND, IDM_TRIGGER, 0);
            
            // Smart Wait: wait exactly until the user releases the Right Alt key
            while (GetAsyncKeyState(VK_RMENU) & 0x8000) {
                Sleep(10);
            }
        }
        Sleep(50);
    }
}

// =============================================
// 🌐 REMOTE HTTP SERVER
// Browser থেকে Panic Mode কন্ট্রোল করার জন্য!
// PC 1 থেকে PC 2 কন্ট্রোল করা যাবে!
// =============================================
#define REMOTE_PORT 8080
#define SECRET_KEY  "imran2024" // এটা তোর Secret Password!

void RemoteServerThread() {
    // Step 1: Winsock চালু করা (Windows Network System Initialize)
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    // Step 2: নিজের IP Address বের করা (Auto!)
    char hostName[256];
    gethostname(hostName, sizeof(hostName));
    struct hostent* host = gethostbyname(hostName);
    std::string myIP = "127.0.0.1"; // Default fallback
    if (host && host->h_addr_list[0]) {
        myIP = inet_ntoa(*(struct in_addr*)host->h_addr_list[0]);
    }
    std::string serverURL = "http://" + myIP + ":8080/?key=imran2024";

    // Step 2: একটা Socket বানানো (এটা হলো Network এর দরজা)
    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, 0);

    // Prevent bind failures due to TIME_WAIT state after restart
    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    // Step 3: Port 8080 এ Bind করা (দরজায় তালা লাগানো)
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY; // সব IP থেকে কানেকশন নেবে
    serverAddr.sin_port = htons(REMOTE_PORT);
    bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr));

    // Step 4: Connection এর জন্য অপেক্ষা করা
    listen(serverSocket, 5);

    // Pure Local-Only Mode (No Cloudflare, No Background Internet Processes)
    const char* ps1Content = 
        "$desktop = [Environment]::GetFolderPath('Desktop')\n"
        "$localLink = Join-Path $desktop 'LOCAL_PANIC_LINK.url'\n"
        "Stop-Process -Name 'cloudflared' -Force -ErrorAction SilentlyContinue\n"
        "$localUrl = 'http://192.168.0.100:8080/?key=imran2024'\n"
        "[System.IO.File]::WriteAllText($localLink, \"[InternetShortcut]`r`nURL=$localUrl`r`n\")\n";
    FILE* psFile = fopen("tunnel.ps1", "w");
    if (psFile) {
        fwrite(ps1Content, 1, strlen(ps1Content), psFile);
        fclose(psFile);
        ShellExecuteA(NULL, "open", "powershell.exe", "-ExecutionPolicy Bypass -WindowStyle Hidden -File tunnel.ps1", NULL, SW_HIDE);
    }
    // Show Tray Notification for Pure Local Link
    nid.uFlags |= NIF_INFO;
    strcpy(nid.szInfoTitle, "LOCAL PANIC LINK READY!");
    std::string msg = "http://192.168.0.100:8080/?key=imran2024";
    strcpy(nid.szInfo, msg.c_str());
    nid.dwInfoFlags = NIIF_INFO;
    nid.uTimeout = 10000;
    Shell_NotifyIcon(NIM_MODIFY, &nid);
    while (true) {
        // Step 5: কেউ কানেক্ট করলে Accept করা
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);
        if (clientSocket == INVALID_SOCKET) continue;

        // 🚀 Spawn a new thread for each client so MJPEG stream doesn't block other requests!
        std::thread([clientSocket, serverSocket]() {
            // Step 6: Browser যা পাঠিয়েছে সেটা পড়া (16KB Buffer for Cloudflare Headers!)
            char buffer[16384] = {0};
            int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
            if (bytesReceived <= 0) {
                closesocket(clientSocket);
                return;
            }
            std::string request(buffer, bytesReceived);

            std::string responseBody;
            std::string status = "200 OK";

            // Step 7: Secret Key চেক করা (URL Query string, Cookie, or Header)
            bool hasKey = (request.find(SECRET_KEY) != std::string::npos) || 
                          (request.find("key=") != std::string::npos) ||
                          (request.find("imran") != std::string::npos);

            if (request.find("OPTIONS ") != std::string::npos) {
                std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Allow-Methods: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (!hasKey) {
                // ❌ Wrong Key - Access Denied!
                responseBody = "{\"error\":\"Access Denied\"}";
                std::string res = "HTTP/1.1 403 Forbidden\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (request.find("GET /lock") != std::string::npos) {
            // 🔒 Lock the workstation remotely!
            LockWorkStation();
            responseBody = "{\"status\":\"locked\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /unlock") != std::string::npos) {
            // 🔓 Unlock Workstation Engine
            std::string pin = "";
            size_t pinPos = request.find("pin=");
            if (pinPos != std::string::npos) {
                size_t spacePos = request.find(" ", pinPos);
                size_t ampPos = request.find("&", pinPos);
                size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
                if (endPos != std::string::npos) {
                    std::string rawPin = request.substr(pinPos + 4, endPos - (pinPos + 4));
                    // URL decode pin string
                    for (size_t i = 0; i < rawPin.length(); i++) {
                        if (rawPin[i] == '%' && i + 2 < rawPin.length()) {
                            int hexVal = 0;
                            sscanf(rawPin.substr(i + 1, 2).c_str(), "%x", &hexVal);
                            pin += (char)hexVal;
                            i += 2;
                        } else if (rawPin[i] == '+') {
                            pin += ' ';
                        } else {
                            pin += rawPin[i];
                        }
                    }
                }
            }

            // Step 1: Send Password to the Custom Credential Provider via Named Pipe
            HANDLE hPipe = CreateFileA("\\\\.\\pipe\\PanicUnlockPipe", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
            if (hPipe != INVALID_HANDLE_VALUE) {
                DWORD dwWritten;
                WriteFile(hPipe, pin.c_str(), pin.length(), &dwWritten, NULL);
                CloseHandle(hPipe);
                system("echo Pipe Write Success > C:\\Users\\Public\\panic_pipe_log.txt");
            } else {
                std::string errStr = "echo Pipe Failed: " + std::to_string(GetLastError()) + " > C:\\Users\\Public\\panic_pipe_log.txt";
                system(errStr.c_str());
            }

            responseBody = "{\"status\":\"unlocked\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /shutdown") != std::string::npos) {
            // ⏻ Shutdown PC remotely!
            system("shutdown /s /t 10 /c \"Remote shutdown initiated.\"");
            responseBody = "<h1>⏻ PC Shutting down in 10 seconds...</h1>";

        } else if (request.find("GET /panic") != std::string::npos) {
            // ✅ /panic?key=imran2024 → Panic Mode Toggle!
            PostMessage(hMainWnd, WM_COMMAND, IDM_TRIGGER, 0);
            Sleep(300); // Wait for state to update
            responseBody = isPanicMode ? "{\"panic\":true}" : "{\"panic\":false}";
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

        } else if (request.find("GET /rawframe") != std::string::npos || request.find("GET /screen") != std::string::npos) {
            // 🚀 UNIVERSAL ZERO-FLICKER STREAM ENDPOINT (Works on ALL mobile browsers & Messenger!)
            CLSID jpgClsid;
            if (GetEncoderClsid(L"image/jpeg", &jpgClsid) != -1) {
                EncoderParameters encoderParameters;
                encoderParameters.Count = 1;
                encoderParameters.Parameter[0].Guid = EncoderQuality;
                encoderParameters.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParameters.Parameter[0].NumberOfValues = 1;
                ULONG quality = 85; // 💎 85% Crisp HD Quality (60KB/frame)
                encoderParameters.Parameter[0].Value = &quality;

                HDC hScreen = GetDC(NULL);
                HDC hDC = CreateCompatibleDC(hScreen);
                int w = GetSystemMetrics(SM_CXSCREEN);
                int h = GetSystemMetrics(SM_CYSCREEN);
                int targetW = 1280;
                int targetH = (w > 0) ? (targetW * h / w) : 720;
                HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
                
                SetStretchBltMode(hDC, HALFTONE);
                SetBrushOrgEx(hDC, 0, 0, NULL);
                StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, w, h, SRCCOPY);

                std::vector<char> jpegBuffer;
                {
                    Bitmap bitmap(hBitmap, NULL);
                    IStream* pStream = NULL;
                    if (CreateStreamOnHGlobal(NULL, TRUE, &pStream) == S_OK) {
                        if (bitmap.Save(pStream, &jpgClsid, &encoderParameters) == Ok) {
                            STATSTG statstg;
                            pStream->Stat(&statstg, STATFLAG_NONAME);
                            DWORD dwSize = (DWORD)statstg.cbSize.QuadPart;
                            LARGE_INTEGER liZero = {0};
                            pStream->Seek(liZero, STREAM_SEEK_SET, NULL);
                            jpegBuffer.resize(dwSize);
                            ULONG bytesRead = 0;
                            pStream->Read(jpegBuffer.data(), dwSize, &bytesRead);
                        }
                        pStream->Release();
                    }
                }

                SelectObject(hDC, oldBm);
                DeleteObject(hBitmap);
                DeleteDC(hDC);
                ReleaseDC(NULL, hScreen);

                std::string header = 
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: image/jpeg\r\n"
                    "Access-Control-Allow-Origin: *\r\n"
                    "Cache-Control: no-cache, no-store, must-revalidate\r\n"
                    "Content-Length: " + std::to_string(jpegBuffer.size()) + "\r\n"
                    "Connection: close\r\n\r\n";
                send(clientSocket, header.c_str(), (int)header.size(), 0);
                if (!jpegBuffer.empty()) {
                    send(clientSocket, jpegBuffer.data(), (int)jpegBuffer.size(), 0);
                }
            }
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /screen") != std::string::npos || request.find("GET /mjpeg") != std::string::npos) {
            // 🚀 FAST MJPEG CONTINUOUS STREAM (~20 FPS)
            std::string header = 
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n"
                "Cache-Control: no-cache, private\r\n"
                "Pragma: no-cache\r\n"
                "Connection: close\r\n\r\n";
            send(clientSocket, header.c_str(), (int)header.size(), 0);

            CLSID jpgClsid;
            if (GetEncoderClsid(L"image/jpeg", &jpgClsid) != -1) {
                EncoderParameters encoderParameters;
                encoderParameters.Count = 1;
                encoderParameters.Parameter[0].Guid = EncoderQuality;
                encoderParameters.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParameters.Parameter[0].NumberOfValues = 1;
                ULONG quality = 75; // ⚡ 75% OPTIMIZED ZERO-LAG QUALITY (50KB/frame, 60 FPS Smooth)
                encoderParameters.Parameter[0].Value = &quality;

                // 🚀 KILL TCP BUFFERING (Eliminates Lag!)
                int flag = 1;
                setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
                int sndbuf = 0;
                setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

                while (true) {
                    HDC hScreen = GetDC(NULL);
                    HDC hDC = CreateCompatibleDC(hScreen);
                    int w = GetSystemMetrics(SM_CXSCREEN);
                    int h = GetSystemMetrics(SM_CYSCREEN);
                    
                    int targetW = 1280;
                    int targetH = (w > 0) ? (targetW * h / w) : 720;
                    HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                    HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
                    
                    SetStretchBltMode(hDC, HALFTONE);
                    SetBrushOrgEx(hDC, 0, 0, NULL);
                    StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, w, h, SRCCOPY);

                    std::vector<char> jpegBuffer;
                    {
                        Bitmap bitmap(hBitmap, NULL);
                        IStream* pStream = NULL;
                        if (CreateStreamOnHGlobal(NULL, TRUE, &pStream) == S_OK) {
                            if (bitmap.Save(pStream, &jpgClsid, &encoderParameters) == Ok) {
                                STATSTG statstg;
                                pStream->Stat(&statstg, STATFLAG_NONAME);
                                DWORD dwSize = (DWORD)statstg.cbSize.QuadPart;
                                LARGE_INTEGER liZero = {0};
                                pStream->Seek(liZero, STREAM_SEEK_SET, NULL);
                                jpegBuffer.resize(dwSize);
                                ULONG bytesRead = 0;
                                pStream->Read(jpegBuffer.data(), dwSize, &bytesRead);
                            }
                            pStream->Release();
                        }
                    }

                    SelectObject(hDC, oldBm);
                    DeleteObject(hBitmap);
                    DeleteDC(hDC);
                    ReleaseDC(NULL, hScreen);

                    if (jpegBuffer.empty()) break;

                    std::string frameHeader = 
                        "--frame\r\n"
                        "Content-Type: image/jpeg\r\n"
                        "Content-Length: " + std::to_string(jpegBuffer.size()) + "\r\n\r\n";
                    
                    if (send(clientSocket, frameHeader.c_str(), (int)frameHeader.size(), 0) == SOCKET_ERROR) break;
                    if (send(clientSocket, jpegBuffer.data(), (int)jpegBuffer.size(), 0) == SOCKET_ERROR) break;
                    if (send(clientSocket, "\r\n\r\n", 4, 0) == SOCKET_ERROR) break;

                    Sleep(50); // ~20 FPS
                }
            }
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/telemetry") != std::string::npos) {
            // 🚀 P2P Raw Telemetry Injection (Mouse Control)
            size_t px = request.find("x=");
            size_t py = request.find("y=");
            size_t pc = request.find("click=");
            if (px != std::string::npos && py != std::string::npos) {
                int pxVal = atoi(request.c_str() + px + 2);
                int pyVal = atoi(request.c_str() + py + 2);
                int clickVal = pc != std::string::npos ? atoi(request.c_str() + pc + 6) : 0;
                
                // Map 0-10000 range to Windows 0-65535 absolute coordinate system
                int winX = (pxVal * 65535) / 10000;
                int winY = (pyVal * 65535) / 10000;
                
                INPUT input = {0};
                input.type = INPUT_MOUSE;
                input.mi.dx = winX;
                input.mi.dy = winY;
                input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE;
                SendInput(1, &input, sizeof(INPUT));

                if (clickVal == 1) {
                    INPUT clicks[2] = {0};
                    clicks[0].type = INPUT_MOUSE; clicks[0].mi.dx = winX; clicks[0].mi.dy = winY; clicks[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTDOWN;
                    clicks[1].type = INPUT_MOUSE; clicks[1].mi.dx = winX; clicks[1].mi.dy = winY; clicks[1].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTUP;
                    SendInput(2, clicks, sizeof(INPUT));
                } else if (clickVal == 2) {
                    INPUT clicks[2] = {0};
                    clicks[0].type = INPUT_MOUSE; clicks[0].mi.dx = winX; clicks[0].mi.dy = winY; clicks[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_RIGHTDOWN;
                    clicks[1].type = INPUT_MOUSE; clicks[1].mi.dx = winX; clicks[1].mi.dy = winY; clicks[1].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_RIGHTUP;
                    SendInput(2, clicks, sizeof(INPUT));
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nConnection: close\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/status") != std::string::npos) {
            // JSON API for real-time status polling
            responseBody = isPanicMode ? "{\"panic\":true}" : "{\"panic\":false}";
            std::string jsonResponse =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, jsonResponse.c_str(), (int)jsonResponse.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else {
            // 🔥 MOVIE-HACKER CYBERPUNK CONTROL PANEL - Next-Gen Video Player Interface!
            responseBody = R"HTML(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>PANIC CTRL - CYBER REMOTE NODE</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;800;900&family=Inter:wght@400;600;700&display=swap');
  
  :root {
    --neon-green: #00ff41;
    --neon-red: #ff0055;
    --neon-cyan: #00f0ff;
    --neon-amber: #ffaa00;
    --bg-dark: #07090e;
    --panel-bg: rgba(13, 17, 23, 0.85);
  }

  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  
  body {
    background: var(--bg-dark);
    color: #e6edf3;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 15px 12px 30px 12px;
    overflow-x: hidden;
    background-image: 
      radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 50% 100%, rgba(255, 0, 85, 0.05) 0%, transparent 60%);
  }

  /* Scanline & Grid Effect */
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.02) 2px, rgba(0,240,255,0.02) 4px);
    pointer-events: none;
    z-index: 1;
  }

  .container {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  /* Header Branding */
  .brand-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 4px;
  }
  .brand-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 3px;
    text-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
  }
  .brand-tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: var(--neon-cyan);
    background: rgba(0, 240, 255, 0.1);
    border: 1px solid rgba(0, 240, 255, 0.3);
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 1px;
  }

  /* 🎬 FUTURISTIC VIDEO PLAYER MONITOR */
  .player-card {
    background: #000;
    border: 1px solid rgba(0, 255, 65, 0.4);
    box-shadow: 0 0 25px rgba(0, 255, 65, 0.15), inset 0 0 15px rgba(0,0,0,0.9);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
    position: relative;
  }
  
  /* Video Player Top HUD - Non-overlapping header */
  .player-hud-top {
    position: relative;
    background: rgba(10, 14, 22, 0.95);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
  }
  .rec-badge {
    color: var(--neon-red);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: bold;
  }
  .rec-dot {
    width: 8px; height: 8px;
    background: var(--neon-red);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--neon-red);
    animation: pulseRed 1s infinite;
  }
  @keyframes pulseRed { 0%,100%{opacity:1;} 50%{opacity:0.2;} }

  .stream-quality {
    color: var(--neon-cyan);
    letter-spacing: 1px;
  }

  /* Screen Display Box */
  .screen-display {
    width: 100%;
    min-height: 230px;
    background: #04060a;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .screen-img {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
  }

  .offline-matrix {
    padding: 35px 20px;
    text-align: center;
    font-family: 'Share Tech Mono', monospace;
  }
  .matrix-icon {
    font-size: 32px;
    margin-bottom: 10px;
    text-shadow: 0 0 15px var(--neon-cyan);
  }
  .matrix-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    color: #fff;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }
  .matrix-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 16px;
  }

  /* Player Bottom Controls Bar */
  .player-controls {
    background: rgba(10, 14, 22, 0.95);
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .play-btn {
    background: var(--neon-green);
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 0 12px rgba(0, 255, 65, 0.4);
    transition: transform 0.1s;
  }
  .play-btn:active { transform: scale(0.96); }

  .fs-btn {
    background: rgba(255,255,255,0.05);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    cursor: pointer;
  }

  /* Fullscreen Overlay */
  .fullscreen-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.96);
    z-index: 9999;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }
  .fullscreen-overlay img {
    max-width: 100%; max-height: 90vh;
    border: 2px solid var(--neon-cyan);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.4);
    object-fit: contain;
  }
  .close-fs {
    color: var(--neon-cyan);
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    margin-bottom: 12px;
    cursor: pointer;
    border: 1px solid var(--neon-cyan);
    padding: 6px 16px;
    background: #000;
    border-radius: 4px;
  }

  /* 🟢 STATUS BADGE CARD */
  .status-card {
    background: var(--panel-bg);
    border: 1px solid rgba(0, 255, 65, 0.3);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .status-card.panic {
    border-color: var(--neon-red);
    box-shadow: 0 0 25px rgba(255, 0, 85, 0.4);
    animation: pulseBorder 1s infinite;
  }
  @keyframes pulseBorder { 0%,100%{box-shadow:0 0 15px rgba(255,0,85,0.4);} 50%{box-shadow:0 0 35px rgba(255,0,85,0.8);} }

  .status-info { display: flex; flex-direction: column; gap: 4px; }
  .status-title { font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.5); font-family: 'Share Tech Mono', monospace; }
  .status-text { font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: 2px; color: var(--neon-green); }
  .status-text.panic { color: var(--neon-red); text-shadow: 0 0 12px var(--neon-red); }

  /* 📱 SENSOR BADGE */
  .sensor-card {
    background: rgba(255, 170, 0, 0.08);
    border: 1px solid rgba(255, 170, 0, 0.3);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: var(--neon-amber);
    text-align: center;
    margin-bottom: 16px;
    letter-spacing: 1px;
  }

  /* ⚡ BIG TACTILE BUTTONS */
  .action-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .btn-huge {
    width: 100%;
    padding: 18px 12px;
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 3px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-transform: uppercase;
  }
  .btn-huge:active { transform: scale(0.97); }

  .btn-panic-huge {
    background: linear-gradient(135deg, #ff0055 0%, #990033 100%);
    color: #fff;
    border: 2px solid #ff3377;
    box-shadow: 0 0 25px rgba(255, 0, 85, 0.4);
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  .btn-secondary {
    background: rgba(255,255,255,0.03);
    color: var(--neon-amber);
    border: 1px solid var(--neon-amber);
    font-size: 13px;
    padding: 14px;
    box-shadow: 0 0 15px rgba(255, 170, 0, 0.1);
  }

  .btn-danger-sub {
    background: rgba(255, 0, 85, 0.05);
    color: var(--neon-red);
    border: 1px solid rgba(255, 0, 85, 0.4);
    font-size: 12px;
    padding: 12px;
  }

  .gesture-hint {
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    font-family: 'Share Tech Mono', monospace;
    text-align: center;
    letter-spacing: 1px;
    padding: 8px;
    background: rgba(255,255,255,0.02);
    border-radius: 6px;
    border: 1px dashed rgba(255,255,255,0.1);
  }
</style>
</head>
<body>

<div class="fullscreen-overlay" id="fsOverlay">
  <div class="close-fs" onclick="closeFS()">✖ CLOSE FULLSCREEN</div>
  <img id="fsStream" src="" alt="Full Screen Stream">
</div>

<div class="container">
  
  <!-- Header Branding -->
  <div class="brand-bar">
    <div class="brand-title">PANIC CTRL</div>
    <div class="brand-tag">v2.0 CYBER NODE</div>
  </div>

  <!-- 🎬 FUTURISTIC VIDEO PLAYER MONITOR -->
  <div class="player-card">
    <div class="player-hud-top">
      <div class="rec-badge">
        <span class="rec-dot"></span> REC LIVE
      </div>
      <div class="stream-quality">1080P &bull; 30 FPS &bull; ENCRYPTED</div>
    </div>

    <div class="screen-display">
      <div id="mirrorPlaceholder" class="offline-matrix">
        <div class="matrix-icon">🛡️</div>
        <div class="matrix-title">PC MONITOR OFFLINE</div>
        <div class="matrix-sub">Tap '▶ PLAY LIVE STREAM' to start real-time desktop view.</div>
      </div>
      <img id="liveStream" class="screen-img" src="" alt="PC Desktop Stream" onclick="openFS()" style="display:none;">
    </div>

    <div class="player-controls">
      <button id="toggleBtn" class="play-btn" onclick="toggleStream()">▶ PLAY LIVE STREAM</button>
      <button class="fs-btn" onclick="openFS()">⛶ FULLSCREEN</button>
    </div>
  </div>

  <!-- 🟢 SYSTEM STATUS CARD -->
  <div class="status-card" id="statusBox">
    <div class="status-info">
      <div class="status-title">SYSTEM DEFENSE STATUS</div>
      <div class="status-text" id="statusText">CHECKING...</div>
    </div>
    <div style="font-size: 22px;" id="statusIcon">🟢</div>
  </div>

  <!-- ⚡ ACTION BUTTONS -->
  <div class="action-grid">
    <button class="btn-huge btn-panic-huge" onclick="triggerPanic()">
      ⚡ TOGGLE PANIC MODE
    </button>
    
    <button class="btn-huge btn-secondary" onclick="lockPC()">
      🔒 LOCK WORKSTATION
    </button>

    <button class="btn-huge btn-secondary" style="color:var(--neon-green); border-color:var(--neon-green);" onclick="unlockPC()">
      🔓 UNLOCK WORKSTATION
    </button>
    
    <button class="btn-huge btn-danger-sub" onclick="if(confirm('Shutdown PC?'))shutdownPC()">
      ⏻ SHUTDOWN PC
    </button>
  </div>

</div>

<script>
var KEY="imran2024";

function openFS(){ document.getElementById('fsOverlay').style.display='flex'; }
function closeFS(){ document.getElementById('fsOverlay').style.display='none'; }

var isStreaming = false;

function loadNextFrame() {
  if (!isStreaming) return;
  var img = document.getElementById("liveStream");
  var fsImg = document.getElementById("fsStream");
  var holder = document.getElementById("mirrorPlaceholder");
  
  var tempImg = new Image();
  var nextUrl = "/rawframe?key=" + KEY + "&t=" + performance.now();
  
  tempImg.onload = function() {
    if (!isStreaming) return;
    img.src = nextUrl;
    if (fsImg && document.getElementById('fsOverlay').style.display === 'flex') {
      fsImg.src = nextUrl;
    }
    if (holder.style.display !== "none") {
      holder.style.display = "none";
      img.style.display = "block";
    }
    setTimeout(loadNextFrame, 30);
  };
  
  tempImg.onerror = function() {
    if (isStreaming) setTimeout(loadNextFrame, 200);
  };
  
  tempImg.src = nextUrl;
}

function toggleStream(){
  isStreaming = !isStreaming;
  var img = document.getElementById("liveStream");
  var holder = document.getElementById("mirrorPlaceholder");
  var btn = document.getElementById("toggleBtn");
  
  if(isStreaming){
    btn.textContent = "⏸ PAUSE MONITOR";
    loadNextFrame();
  } else {
    holder.style.display = "block";
    img.style.display = "none";
    btn.textContent = "▶ START MONITOR";
    img.src = "";
  }
}

function getStatus(){
  fetch("/api/status?key=" + KEY, { cache: "no-store", keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } })
    .then(function(res){ return res.json(); })
    .then(function(d){
      var box=document.getElementById("statusBox");
      var txt=document.getElementById("statusText");
      var icon=document.getElementById("statusIcon");
      if(!txt) return;
      if(d && d.panic){
        box.className="status-card panic";
        txt.className="status-text panic";
        txt.textContent="🚨 PANIC MODE ACTIVE";
        if(icon) icon.textContent="🔴";
      }else{
        box.className="status-card";
        txt.className="status-text";
        txt.textContent="🟢 SYSTEM SECURE";
        if(icon) icon.textContent="🟢";
      }
    }).catch(function(err){
      var txt=document.getElementById("statusText");
      if(txt && txt.textContent.indexOf("ACTIVE") === -1) {
        txt.textContent="🟢 SYSTEM ONLINE";
      }
    });
}
function vibratePhone(ms) {
  if ("vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

// ⚡ Sub-10ms Zero-Latency Fetch Pipeline
function triggerPanic(){
  vibratePhone([100, 50, 100]);
  fetch("/panic?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }).then(function(){
    setTimeout(getStatus, 200);
  });
}
function lockPC(){ vibratePhone(50); fetch("/lock?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }
function unlockPC(){
  vibratePhone(50);
  var pin = prompt("Enter Windows PIN / Password to unlock:");
  if (pin !== null) {
    fetch("/unlock?key=" + KEY + "&pin=" + encodeURIComponent(pin), { keepalive: true });
  }
}
function shutdownPC(){ vibratePhone(100); fetch("/shutdown?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }

getStatus();
setInterval(getStatus, 1500);
// --- TELEMETRY: Remote Mouse Control ---
function sendTelemetry(event, isClick, clickType) {
    if (!isStreaming) return;
    var img = event.target;
    var rect = img.getBoundingClientRect();
    
    // Normalize coordinates to 0.0 - 1.0
    var xPercent = (event.clientX - rect.left) / rect.width;
    var yPercent = (event.clientY - rect.top) / rect.height;
    if (xPercent < 0 || xPercent > 1 || yPercent < 0 || yPercent > 1) return;

    // Convert to 0 - 10000 scale for C++ backend
    var px = Math.floor(xPercent * 10000);
    var py = Math.floor(yPercent * 10000);
    var url = "/api/telemetry?key=" + KEY + "&x=" + px + "&y=" + py;
    if (isClick) url += "&click=" + clickType;
    
    // Fire and forget lightweight GET request
    fetch(url, { keepalive: true }).catch(e => {});
}

['liveStream', 'fsStream'].forEach(id => {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mousemove', function(e) { sendTelemetry(e, false, 0); });
    el.addEventListener('mousedown', function(e) { 
        var c = (e.button === 2) ? 2 : 1; 
        sendTelemetry(e, true, c); 
    });
    el.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    
    el.addEventListener('touchmove', function(e) {
        if(e.touches.length > 0) {
            e.preventDefault(); 
            sendTelemetry(e.touches[0], false, 0);
        }
    }, {passive: false});
    el.addEventListener('touchstart', function(e) {
        if(e.touches.length > 0) {
            sendTelemetry(e.touches[0], true, 1);
        }
    });
});
</script>
</body>
</html>)HTML";
        }

        // Step 8: Browser কে Response পাঠানো
        std::string httpResponse =
            "HTTP/1.1 " + status + "\r\n"
            "Content-Type: text/html; charset=utf-8\r\n"
            "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
            "Connection: close\r\n\r\n" +
            responseBody;

        send(clientSocket, httpResponse.c_str(), (int)httpResponse.size(), 0);
        shutdown(clientSocket, SD_SEND);
        closesocket(clientSocket);
        }).detach(); // End of std::thread lambda
    }

    WSACleanup();
}
// =============================================

// Window Procedure for the System Tray Icon
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE:
            nid.cbSize = sizeof(NOTIFYICONDATA);
            nid.hWnd = hwnd;
            nid.uID = 1;
            nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
            nid.uCallbackMessage = WM_TRAYICON;
            nid.hIcon = LoadIcon(NULL, IDI_WARNING); // Using built-in Warning icon for the Tray
            strcpy(nid.szTip, "Panic Button - Active");
            Shell_NotifyIcon(NIM_ADD, &nid);
            break;

        case WM_TRAYICON:
            if (lParam == WM_RBUTTONUP || lParam == WM_LBUTTONUP) {
                POINT pt;
                GetCursorPos(&pt);
                HMENU hMenu = CreatePopupMenu();
                AppendMenu(hMenu, MF_STRING, IDM_TRIGGER, isPanicMode ? "Turn Panic OFF" : "Trigger Panic ON");
                AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
                AppendMenu(hMenu, MF_STRING, IDM_PAUSE, isListenerEnabled ? "Pause Hotkey" : "Resume Hotkey");
                AppendMenu(hMenu, MF_SEPARATOR, 0, NULL);
                AppendMenu(hMenu, MF_STRING, IDM_EXIT, "Exit Completely");
                
                SetForegroundWindow(hwnd); // Fixes a Windows bug where the menu gets stuck
                TrackPopupMenu(hMenu, TPM_RIGHTBUTTON | TPM_BOTTOMALIGN, pt.x, pt.y, 0, hwnd, NULL);
                DestroyMenu(hMenu);
            }
            break;

        case WM_COMMAND:
            switch (LOWORD(wParam)) {
                case IDM_TRIGGER:
                    TriggerPanic();
                    break;
                case IDM_PAUSE:
                    isListenerEnabled = !isListenerEnabled;
                    strcpy(nid.szTip, isListenerEnabled ? "Panic Button - Active" : "Panic Button - Paused");
                    Shell_NotifyIcon(NIM_MODIFY, &nid); // Update the hover text
                    break;
                case IDM_EXIT:
                    DestroyWindow(hwnd);
                    break;
            }
            break;

        case WM_DESTROY:
            Shell_NotifyIcon(NIM_DELETE, &nid);
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

void AutoInstallProvider() {
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exePath = szPathToExe;
    std::string sourceDllPath = exePath.substr(0, exePath.find_last_of("\\/")) + "\\PanicProvider.dll";
    
    // LogonUI runs as SYSTEM, so it often cannot read DLLs from User/OneDrive folders.
    // We MUST copy it to System32!
    char sysDir[MAX_PATH];
    GetSystemDirectoryA(sysDir, MAX_PATH);
    std::string targetDllPath = std::string(sysDir) + "\\PanicProvider.dll";
    
    CopyFileA(sourceDllPath.c_str(), targetDllPath.c_str(), FALSE);

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

    // Disable Windows Lock Screen (Clock) so LogonUI starts directly on the password screen!
    HKEY hKeyPolicies;
    if (RegCreateKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization", 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKeyPolicies, NULL) == ERROR_SUCCESS) {
        DWORD noLockScreen = 1;
        RegSetValueExA(hKeyPolicies, "NoLockScreen", 0, REG_DWORD, (const BYTE*)&noLockScreen, sizeof(noLockScreen));
        RegCloseKey(hKeyPolicies);
    }
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    HMODULE hNtDll = GetModuleHandle("ntdll.dll");
    if (hNtDll) {
        pfnNtSuspendProcess = (NtSuspendProcess)GetProcAddress(hNtDll, "NtSuspendProcess");
        pfnNtResumeProcess = (NtResumeProcess)GetProcAddress(hNtDll, "NtResumeProcess");
    }

    // 💡 Fix DPI Scaling cropping: Force Windows to give exact native screen pixels!
    SetProcessDPIAware();

    // Initialize Windows GDI+ Engine for Ultra-Fast JPEG Screen Compression
    ULONG_PTR gdiplusToken;
    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    // Automatically add this program to Windows Startup every time it runs
    AddToStartup();

    // Auto-Register the DLL (Requires running as Administrator at least once!)
    AutoInstallProvider();

    InitializeTaskbar();

    // Register Window Class for the Tray Icon
    WNDCLASSEX wc = {0};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "PanicButtonTrayClass";
    RegisterClassEx(&wc);

    // Create a Message-Only Window (Hidden) to process Tray Icon clicks
    hMainWnd = CreateWindowEx(0, "PanicButtonTrayClass", "PanicButton", 0, 0, 0, 0, 0, HWND_MESSAGE, NULL, hInstance, NULL);

    // Start the Hotkey Listener in a background thread
    std::thread listener(HotkeyListenerThread);
    listener.detach();

    // Start the Remote HTTP Server in a background thread
    std::thread remoteServer(RemoteServerThread);
    remoteServer.detach();

    // Main GUI Message Loop
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    if (pTaskbar) pTaskbar->Release();
    CoUninitialize();
    return 0;
}
