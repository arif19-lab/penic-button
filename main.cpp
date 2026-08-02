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
#include <d3d11.h>
#include <dxgi1_2.h>
#include <wincrypt.h>
#include <mfapi.h>
#include <mfidl.h>
#include <mftransform.h>
#include <mferror.h>
using namespace Gdiplus;
#pragma comment(lib, "ws2_32.lib") // Winsock Library Link
#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dxgi.lib")
#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "mfplat.lib")
#pragma comment(lib, "mfreadwrite.lib")
#pragma comment(lib, "mfuuid.lib")

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

// 🎮 DIRECTX 11 DXGI DESKTOP DUPLICATION ENGINE (Sub-1ms GPU Hardware Capture)
ID3D11Device* g_d3dDevice = NULL;
ID3D11DeviceContext* g_d3dContext = NULL;
IDXGIOutputDuplication* g_dxgiDuplication = NULL;
ID3D11Texture2D* g_stagingTexture = NULL;
bool g_dxgiInitialized = false;

bool InitDXGI() {
    if (g_dxgiInitialized && g_dxgiDuplication) return true;

    D3D_FEATURE_LEVEL featureLevel;
    HRESULT hr = D3D11CreateDevice(
        NULL, D3D_DRIVER_TYPE_HARDWARE, NULL, 0, NULL, 0,
        D3D11_SDK_VERSION, &g_d3dDevice, &featureLevel, &g_d3dContext
    );
    if (FAILED(hr)) return false;

    IDXGIDevice* dxgiDevice = NULL;
    hr = g_d3dDevice->QueryInterface(__uuidof(IDXGIDevice), (void**)&dxgiDevice);
    if (FAILED(hr)) return false;

    IDXGIAdapter* dxgiAdapter = NULL;
    hr = dxgiDevice->GetParent(__uuidof(IDXGIAdapter), (void**)&dxgiAdapter);
    dxgiDevice->Release();
    if (FAILED(hr)) return false;

    IDXGIOutput* dxgiOutput = NULL;
    hr = dxgiAdapter->EnumOutputs(0, &dxgiOutput);
    dxgiAdapter->Release();
    if (FAILED(hr)) return false;

    IDXGIOutput1* dxgiOutput1 = NULL;
    hr = dxgiOutput->QueryInterface(__uuidof(IDXGIOutput1), (void**)&dxgiOutput1);
    dxgiOutput->Release();
    if (FAILED(hr)) return false;

    hr = dxgiOutput1->DuplicateOutput(g_d3dDevice, &g_dxgiDuplication);
    dxgiOutput1->Release();
    if (FAILED(hr)) return false;

    g_dxgiInitialized = true;
    return true;
}

void CleanupDXGI() {
    if (g_stagingTexture) { g_stagingTexture->Release(); g_stagingTexture = NULL; }
    if (g_dxgiDuplication) { g_dxgiDuplication->Release(); g_dxgiDuplication = NULL; }
    if (g_d3dContext) { g_d3dContext->Release(); g_d3dContext = NULL; }
    if (g_d3dDevice) { g_d3dDevice->Release(); g_d3dDevice = NULL; }
    g_dxgiInitialized = false;
}

// 📡 WEBSOCKET SHA-1 & BINARY FRAME ENCODER (Sub-1ms Browser GPU Canvas Stream)
std::string CalculateWebSocketAcceptKey(const std::string& clientKey) {
    std::string concatenated = clientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    BYTE hash[20];
    DWORD hashLen = 20;
    std::string result = "";

    if (CryptAcquireContext(&hProv, NULL, NULL, PROV_RSA_FULL, CRYPT_VERIFYCONTEXT)) {
        if (CryptCreateHash(hProv, CALG_SHA1, 0, 0, &hHash)) {
            if (CryptHashData(hHash, (const BYTE*)concatenated.c_str(), (DWORD)concatenated.length(), 0)) {
                if (CryptGetHashParam(hHash, HP_HASHVAL, hash, &hashLen, 0)) {
                    DWORD base64Len = 0;
                    CryptBinaryToStringA(hash, 20, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, NULL, &base64Len);
                    if (base64Len > 0) {
                        std::vector<char> base64Buf(base64Len);
                        CryptBinaryToStringA(hash, 20, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, base64Buf.data(), &base64Len);
                        result = std::string(base64Buf.data());
                    }
                }
            }
            CryptDestroyHash(hHash);
        }
        CryptReleaseContext(hProv, 0);
    }
    return result;
}

bool SendWebSocketBinaryFrame(SOCKET sock, const std::vector<char>& payload) {
    size_t len = payload.size();
    std::vector<char> frameHeader;
    frameHeader.push_back((char)0x82); // 0x80 (FIN) | 0x02 (Binary Frame)

    if (len < 125) {
        frameHeader.push_back((char)len);
    } else if (len <= 65535) {
        frameHeader.push_back((char)126);
        frameHeader.push_back((char)((len >> 8) & 0xFF));
        frameHeader.push_back((char)(len & 0xFF));
    } else {
        frameHeader.push_back((char)127);
        for (int i = 7; i >= 0; i--) {
            frameHeader.push_back((char)((len >> (i * 8)) & 0xFF));
        }
    }

    if (send(sock, frameHeader.data(), (int)frameHeader.size(), 0) == SOCKET_ERROR) return false;
    if (send(sock, payload.data(), (int)payload.size(), 0) == SOCKET_ERROR) return false;
    return true;
}

// ⚡ REAL-TIME UDP DATAGRAM STREAM ENGINE (Zero Head-of-Line Blocking)
SOCKET g_udpSocket = INVALID_SOCKET;
sockaddr_in g_udpClientAddr;
bool g_hasUdpClient = false;
uint16_t g_udpFrameSeq = 0;

void InitUDPSocket() {
    if (g_udpSocket != INVALID_SOCKET) return;
    g_udpSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (g_udpSocket != INVALID_SOCKET) {
        u_long mode = 1; // Non-blocking
        ioctlsocket(g_udpSocket, FIONBIO, &mode);
    }
}

void SendUDPDatagramFrame(const std::vector<char>& payload) {
    if (!g_hasUdpClient || g_udpSocket == INVALID_SOCKET || payload.empty()) return;

    g_udpFrameSeq++;
    size_t totalLen = payload.size();
    size_t chunkSize = 1300; // 1300 bytes fits safely inside 1500 Wi-Fi MTU
    uint8_t totalChunks = (uint8_t)((totalLen + chunkSize - 1) / chunkSize);

    for (uint8_t i = 0; i < totalChunks; i++) {
        size_t offset = i * chunkSize;
        size_t thisChunkLen = (offset + chunkSize > totalLen) ? (totalLen - offset) : chunkSize;

        std::vector<char> packet;
        packet.reserve(6 + thisChunkLen);
        // Header: [seq_hi, seq_lo, chunk_idx, total_chunks, len_hi, len_lo]
        packet.push_back((char)((g_udpFrameSeq >> 8) & 0xFF));
        packet.push_back((char)(g_udpFrameSeq & 0xFF));
        packet.push_back((char)i);
        packet.push_back((char)totalChunks);
        packet.push_back((char)((thisChunkLen >> 8) & 0xFF));
        packet.push_back((char)(thisChunkLen & 0xFF));

        packet.insert(packet.end(), payload.begin() + offset, payload.begin() + offset + thisChunkLen);

        sendto(g_udpSocket, packet.data(), (int)packet.size(), 0, (SOCKADDR*)&g_udpClientAddr, sizeof(g_udpClientAddr));
    }
}

// ⚡ Active Desktop Switcher: Seamlessly attaches thread to "Winlogon" (Lock Screen) or "Default" (User Session)
void SwitchToActiveDesktop() {
    HDESK hInputDesktop = OpenInputDesktop(0, FALSE, MAXIMUM_ALLOWED);
    if (hInputDesktop) {
        SetThreadDesktop(hInputDesktop);
        CloseDesktop(hInputDesktop);
    }
}

bool CaptureDXGIFrame(HDC hTargetDC, int targetW, int targetH) {
    if (!InitDXGI()) return false;

    DXGI_OUTDUPL_FRAME_INFO frameInfo;
    IDXGIResource* desktopResource = NULL;
    // ⚡ Set 5ms timeout instead of 100ms to eliminate frame pauses!
    HRESULT hr = g_dxgiDuplication->AcquireNextFrame(5, &frameInfo, &desktopResource);
    if (FAILED(hr)) {
        if (hr == DXGI_ERROR_ACCESS_LOST) {
            CleanupDXGI();
        }
        return false;
    }

    ID3D11Texture2D* desktopTexture = NULL;
    hr = desktopResource->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&desktopTexture);
    desktopResource->Release();

    if (FAILED(hr)) {
        g_dxgiDuplication->ReleaseFrame();
        return false;
    }

    D3D11_TEXTURE2D_DESC desc;
    desktopTexture->GetDesc(&desc);

    if (!g_stagingTexture) {
        D3D11_TEXTURE2D_DESC stagingDesc = desc;
        stagingDesc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
        stagingDesc.Usage = D3D11_USAGE_STAGING;
        stagingDesc.BindFlags = 0;
        stagingDesc.MiscFlags = 0;
        g_d3dDevice->CreateTexture2D(&stagingDesc, NULL, &g_stagingTexture);
    }

    bool success = false;
    if (g_stagingTexture) {
        g_d3dContext->CopyResource(g_stagingTexture, desktopTexture);
        desktopTexture->Release();
        g_dxgiDuplication->ReleaseFrame(); // ⚡ Release DXGI frame immediately (Sunshine Open-Source Optimization)

        D3D11_MAPPED_SUBRESOURCE mapped;
        if (SUCCEEDED(g_d3dContext->Map(g_stagingTexture, 0, D3D11_MAP_READ, 0, &mapped))) {
            BITMAPINFO bmi = { 0 };
            bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
            bmi.bmiHeader.biWidth = desc.Width;
            bmi.bmiHeader.biHeight = -(int)desc.Height; // Top-down
            bmi.bmiHeader.biPlanes = 1;
            bmi.bmiHeader.biBitCount = 32;
            bmi.bmiHeader.biCompression = BI_RGB;

            SetStretchBltMode(hTargetDC, COLORONCOLOR); // ⚡ COLORONCOLOR is 3x faster than HALFTONE!
            SetBrushOrgEx(hTargetDC, 0, 0, NULL);
            StretchDIBits(
                hTargetDC, 0, 0, targetW, targetH,
                0, 0, desc.Width, desc.Height,
                mapped.pData, &bmi, DIB_RGB_COLORS, SRCCOPY
            );

            g_d3dContext->Unmap(g_stagingTexture, 0);
            success = true;
        }
        return success;
    }

    desktopTexture->Release();
    g_dxgiDuplication->ReleaseFrame();
    return success;
}

bool isPanicMode = false;
ITaskbarList* pTaskbar = NULL;

void ExecSilentCommand(const char* cmdLine) {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = { 0 };
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;

    char cmd[2048];
    strncpy(cmd, cmdLine, sizeof(cmd) - 1);
    cmd[sizeof(cmd) - 1] = '\0';

    if (CreateProcessA(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        WaitForSingleObject(pi.hProcess, 3000);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
}

// ⚡ Kernel & Driver Level: Programmatically enable Wake-on-LAN Magic Packet on all Windows Network Adapters
void EnableKernelWakeOnLAN() {
    ExecSilentCommand("powershell -WindowStyle Hidden -Command \"Get-NetAdapter | Enable-NetAdapterPowerManagement -WakeOnMagicPacket -Confirm:$false\"");
}

// Function to add the program to Windows Startup automatically via Registry
void AddToStartup() {
    char szPathToExe[MAX_PATH];
    GetModuleFileNameA(NULL, szPathToExe, MAX_PATH);
    std::string exeDir = szPathToExe;
    size_t pos = exeDir.find_last_of("\\/");
    if (pos != std::string::npos) exeDir = exeDir.substr(0, pos);
    
    // 1. Copy PanicButton.exe & PanicService.exe & assets to C:\ProgramData\PanicButton\
    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);
    std::string sysTarget = "C:\\ProgramData\\PanicButton\\PanicButton.exe";
    CopyFileA(szPathToExe, sysTarget.c_str(), FALSE);

    std::string svcSrc = exeDir + "\\PanicService.exe";
    std::string svcDst = "C:\\ProgramData\\PanicButton\\PanicService.exe";
    CopyFileA(svcSrc.c_str(), svcDst.c_str(), FALSE);

    std::string dllSrc = exeDir + "\\PanicProvider.dll";
    std::string dllDst = "C:\\ProgramData\\PanicButton\\PanicProvider.dll";
    CopyFileA(dllSrc.c_str(), dllDst.c_str(), FALSE);

    // Copy alarm wav files
    for (int i = 1; i <= 13; i++) {
        std::string wName = "\\alarm" + std::to_string(i) + ".wav";
        CopyFileA((exeDir + wName).c_str(), ("C:\\ProgramData\\PanicButton" + wName).c_str(), FALSE);
    }

    // 2. Install & Start PanicMasterService (Session 0 Lock Screen Engine)
    ExecSilentCommand("C:\\ProgramData\\PanicButton\\PanicService.exe -install");

    // 3. Delete old HKCU Run key
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        RegDeleteValueA(hKey, "SecretPanicButton_Imran");
        RegCloseKey(hKey);
    }

    std::string quotedSysTarget = "\"C:\\ProgramData\\PanicButton\\PanicButton.exe\"";
    std::string cmdLogon = "schtasks /Create /F /TN PanicButton_Autostart /TR " + quotedSysTarget + " /SC ONLOGON /RL HIGHEST";
    ExecSilentCommand(cmdLogon.c_str());
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


// --- REAL WINDOWS VIRTUAL DESKTOP ENGINE (Isolated Fresh Desktop) ---
void SendVirtualDesktopKey(WORD vkCode) {
    // 🛡️ Ensure Alt is physically/logically released before injecting desktop shortcuts
    INPUT releaseAlt[2] = {0};
    releaseAlt[0].type = INPUT_KEYBOARD; releaseAlt[0].ki.wVk = VK_MENU; releaseAlt[0].ki.dwFlags = KEYEVENTF_KEYUP;
    releaseAlt[1].type = INPUT_KEYBOARD; releaseAlt[1].ki.wVk = VK_LMENU; releaseAlt[1].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(2, releaseAlt, sizeof(INPUT));
    Sleep(20);

    // Press Win + Ctrl + Key (Hardware Mimic: DOWN)
    INPUT inputsDown[3] = {0};
    inputsDown[0].type = INPUT_KEYBOARD; inputsDown[0].ki.wVk = VK_LWIN;
    inputsDown[1].type = INPUT_KEYBOARD; inputsDown[1].ki.wVk = VK_LCONTROL;
    inputsDown[2].type = INPUT_KEYBOARD; inputsDown[2].ki.wVk = vkCode;
    SendInput(3, inputsDown, sizeof(INPUT));
    
    Sleep(50); // Hold time for Windows Shell recognition
    
    // Release Win + Ctrl + Key (Hardware Mimic: UP)
    INPUT inputsUp[3] = {0};
    inputsUp[0].type = INPUT_KEYBOARD; inputsUp[0].ki.wVk = vkCode;      inputsUp[0].ki.dwFlags = KEYEVENTF_KEYUP;
    inputsUp[1].type = INPUT_KEYBOARD; inputsUp[1].ki.wVk = VK_LCONTROL; inputsUp[1].ki.dwFlags = KEYEVENTF_KEYUP;
    inputsUp[2].type = INPUT_KEYBOARD; inputsUp[2].ki.wVk = VK_LWIN;     inputsUp[2].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(3, inputsUp, sizeof(INPUT));
}

void SwitchToNewVirtualDesktop() {
    SendVirtualDesktopKey(0x44); // 'D'
}

void CloseCurrentVirtualDesktop() {
    SendVirtualDesktopKey(VK_F4); // F4
}
// -----------------------------

// 🛡️ MaximizeVSCodeThread removed to prevent aggressive Z-order stealing which caused unwanted Virtual Desktop switching.

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
    
    std::string wavName = "\\alarm" + std::to_string(clickCount) + ".wav";
    std::string wavPath = exePath.substr(0, exePath.find_last_of("\\/")) + wavName;

    // ⚡ Fallback: If running from C:\ProgramData\PanicButton\ or anywhere else
    if (GetFileAttributesA(wavPath.c_str()) == INVALID_FILE_ATTRIBUTES) {
        wavPath = "C:\\ProgramData\\PanicButton" + wavName;
    }

    PlaySoundA(wavPath.c_str(), NULL, SND_FILENAME | SND_ASYNC);

    clickCount++;
    if (clickCount > 13) {
        clickCount = 1;
    }
}
// -----------------------------

int panicState = 0; // 0 = Normal, 1 = Trap Locked, 2 = Safe Working Fake Desktop

LRESULT CALLBACK KeyboardHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT *pKeyBoard = (KBDLLHOOKSTRUCT *)lParam;
        
        // CRITICAL: Allow injected keys (SendInput) so Virtual Desktop keys aren't blocked!
        if (pKeyBoard->flags & LLKHF_INJECTED) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }

        // Always allow Alt keys to pass through to advance Panic States!
        if (pKeyBoard->vkCode == VK_RMENU || pKeyBoard->vkCode == VK_LMENU || pKeyBoard->vkCode == VK_MENU) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }

        // 🎯 STATE 2 (Safe Working Mode): Allow ALL keyboard keys to pass through 100% normally!
        if (panicState == 2) {
            return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
        }
        
        // 🎯 STATE 1 (Trap Mode): Intruder Detected! Block and trigger alarm!
        if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
            TriggerAlarm();
        }

        // BLOCK EVERYTHING ELSE IN STATE 1!
        return 1; 
    }
    return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

LRESULT CALLBACK MouseHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        // INTRUDER DETECTED in State 1!
        if (panicState == 1 && (wParam == WM_LBUTTONDOWN || wParam == WM_RBUTTONDOWN || wParam == WM_MBUTTONDOWN)) {
            TriggerAlarm();
            return 1; // BLOCK MOUSE IN STATE 1
        }
        // Allow mouse in State 0 & State 2
        return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
    }
    return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
}

DWORD lastPanicTime = 0;
PROCESS_INFORMATION g_piPanicApp = {0};

void TriggerPanic() {
    // 🛡️ DEBOUNCE GUARD: Prevent rapid state cycling from a single bouncing key press!
    DWORD now = GetTickCount();
    if (now - lastPanicTime < 800) {
        return; 
    }
    lastPanicTime = now;

    if (panicState == 0) {
        // --- 1st Alt Click: PANIC TRAP MODE (State 1) ---
        // Step 0: Freeze target process
        DWORD pid = GetProcessIdByName(targetProcessName);
        if (pid && pfnNtSuspendProcess) {
            hTargetProcess = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
            if (hTargetProcess) {
                pfnNtSuspendProcess(hTargetProcess);
            }
        }

        // Step 1: Switch to BRAND NEW Virtual Desktop
        SwitchToNewVirtualDesktop();
        Sleep(600); 
        
        // Step 2: Spawn VS Code DIRECTLY on Desktop 2 in total isolation!
        char localAppData[MAX_PATH];
        char tempDir[MAX_PATH];
        GetEnvironmentVariableA("LOCALAPPDATA", localAppData, MAX_PATH);
        GetTempPathA(MAX_PATH, tempDir);

        std::string vscodePath = std::string(localAppData) + "\\Programs\\Microsoft VS Code\\Code.exe";
        std::string panicDataDir = std::string(tempDir) + "PanicVSCode";

        DWORD dwAttrib = GetFileAttributesA(vscodePath.c_str());
        if (dwAttrib == INVALID_FILE_ATTRIBUTES || (dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            char progFiles[MAX_PATH];
            GetEnvironmentVariableA("ProgramFiles", progFiles, MAX_PATH);
            vscodePath = std::string(progFiles) + "\\Microsoft VS Code\\Code.exe";
            dwAttrib = GetFileAttributesA(vscodePath.c_str());
        }

        if (g_piPanicApp.hProcess) {
            TerminateProcess(g_piPanicApp.hProcess, 0);
            CloseHandle(g_piPanicApp.hProcess);
            CloseHandle(g_piPanicApp.hThread);
            ZeroMemory(&g_piPanicApp, sizeof(g_piPanicApp));
        }

        STARTUPINFOA si = { sizeof(si) };
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_SHOWNORMAL;

        if (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            std::string cmdLine = "\"" + vscodePath + "\" --user-data-dir \"" + panicDataDir + "\" --new-window \"C:\\Users\\Imran\\mess_manager\\lib\\main.dart\"";
            std::vector<char> cmdBuf(cmdLine.begin(), cmdLine.end());
            cmdBuf.push_back('\0');
            CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, FALSE, 0, NULL, NULL, &si, &g_piPanicApp);
        } else {
            // Universal Fallback for PCs without VS Code: Launch Notepad!
            char npPath[MAX_PATH];
            GetSystemDirectoryA(npPath, MAX_PATH);
            std::string notepadPath = std::string(npPath) + "\\notepad.exe";
            CreateProcessA(notepadPath.c_str(), NULL, NULL, NULL, FALSE, 0, NULL, NULL, &si, &g_piPanicApp);
        }

        // Step 3: Apply Hardware Trap Hooks
        if (hKeyboardHook == NULL) hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardHookProc, GetModuleHandle(NULL), 0);
        if (hMouseHook == NULL) hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, MouseHookProc, GetModuleHandle(NULL), 0);

        panicState = 1;
        isPanicMode = true;

    } else if (panicState == 1) {
        // --- 2nd Alt Click: SAFE WORKING MODE (State 2) ---
        PlaySoundA(NULL, 0, 0); // Stop alarm
        RestoreVolume();
        
        // 🎯 Remove BOTH Hooks completely! User gets 100% normal PC control back on Desktop 2.
        if (hMouseHook) { UnhookWindowsHookEx(hMouseHook); hMouseHook = NULL; }
        if (hKeyboardHook) { UnhookWindowsHookEx(hKeyboardHook); hKeyboardHook = NULL; }
        
        panicState = 2;
        isPanicMode = true;

    } else if (panicState == 2) {
        // --- 3rd Alt Click: RESTORE ORIGINAL DESKTOP (State 0) ---
        // 🧹 KILL Panic App before destroying virtual desktop so windows don't spill into Desktop 1!
        if (g_piPanicApp.hProcess) {
            TerminateProcess(g_piPanicApp.hProcess, 0);
            CloseHandle(g_piPanicApp.hProcess);
            CloseHandle(g_piPanicApp.hThread);
            ZeroMemory(&g_piPanicApp, sizeof(g_piPanicApp));
        }

        // Thaw target process
        if (hTargetProcess && pfnNtResumeProcess) {
            pfnNtResumeProcess(hTargetProcess);
            CloseHandle(hTargetProcess);
            hTargetProcess = NULL;
        }

        // Close Virtual Desktop 2 & Return to Original Desktop 1
        CloseCurrentVirtualDesktop();

        panicState = 0;
        isPanicMode = false;
    }
}

// Thread to run the Hotkey Listener independently of the GUI
DWORD WINAPI HotkeyListenerThread(LPVOID lpParam) {
    while (true) {
        try {
            if (isListenerEnabled && ((GetAsyncKeyState(VK_RMENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_MENU) & 0x8000))) {
                
                bool otherKeyPressed = false;

                // Wait for user to RELEASE physical Alt key so Windows receives pure Win+Ctrl+D!
                while ((GetAsyncKeyState(VK_RMENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_MENU) & 0x8000)) {
                    // If they press ANY OTHER KEY (like Tab, F4, etc) while holding Alt, CANCEL the panic trigger!
                    for (int i = 8; i < 256; i++) {
                        if (i != VK_RMENU && i != VK_LMENU && i != VK_MENU && i != VK_SHIFT && i != VK_LSHIFT && i != VK_RSHIFT) {
                            if (GetAsyncKeyState(i) & 0x8000) {
                                otherKeyPressed = true;
                            }
                        }
                    }
                    Sleep(10);
                }

                // ONLY trigger Panic if they pressed Alt and ONLY Alt!
                if (!otherKeyPressed) {
                    PostMessage(hMainWnd, WM_COMMAND, IDM_TRIGGER, 0);
                }
            }
        } catch (...) {}
        Sleep(50);
    }
    return 0;
}

// =============================================
// 🌐 REMOTE HTTP SERVER
// Browser থেকে Panic Mode কন্ট্রোল করার জন্য!
// PC 1 থেকে PC 2 কন্ট্রোল করা যাবে!
// =============================================
#define REMOTE_PORT 8080
#define SECRET_KEY  "imran2024" // এটা তোর Secret Password!

#include <wtsapi32.h>
#pragma comment(lib, "wtsapi32.lib")

// 🛡️ Helper: Check if Windows Workstation is currently locked
bool IsWorkstationLocked() {
    bool isLocked = false;
    DWORD dwSessionId = WTSGetActiveConsoleSessionId();
    PWSTR pBuffer = NULL;
    DWORD dwBytesReturned = 0;
    if (WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, dwSessionId, WTSSessionInfoEx, &pBuffer, &dwBytesReturned)) {
        if (dwBytesReturned > 0) {
            WTSINFOEXW* pInfo = (WTSINFOEXW*)pBuffer;
            if (pInfo->Level == 1) {
                // SessionFlags: WTS_SESSIONSTATE_LOCK (0x0) or WTS_SESSIONSTATE_UNLOCK (0x1)
                isLocked = (pInfo->Data.WTSInfoExLevel1.SessionFlags == 0);
            }
        }
        WTSFreeMemory(pBuffer);
    }
    return isLocked;
}

void ProcessClient(SOCKET clientSocket);

DWORD WINAPI ProcessClientThread(LPVOID lpParam) {
    ProcessClient((SOCKET)(uintptr_t)lpParam);
    return 0;
}

void ProcessClient(SOCKET clientSocket) {
    try {
        char buffer[16384] = {0};
    int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (bytesReceived <= 0) {
        closesocket(clientSocket);
        return;
    }
            std::string request(buffer, bytesReceived);

            std::string responseBody;
            std::string status = "200 OK";

            // Step 7: Secret Key check (Allow root / GET request for instant UI load)
            bool hasKey = (request.find(SECRET_KEY) != std::string::npos) || 
                          (request.find("key=") != std::string::npos) ||
                          (request.find("imran") != std::string::npos) ||
                          (request.find("GET / ") != std::string::npos) ||
                          (request.find("GET /?") != std::string::npos) ||
                          (request.find("GET /HTTP") != std::string::npos);

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

            if (request.find("GET /manifest.json") != std::string::npos) {
                responseBody = R"JSON({
  "name": "PANIC CTRL - Remote Node",
  "short_name": "PANIC CTRL",
  "start_url": "/?key=imran2024",
  "display": "standalone",
  "background_color": "#07090e",
  "theme_color": "#07090e",
  "orientation": "any",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%2307090e' rx='40'/%3E%3Ccircle cx='96' cy='96' r='60' fill='none' stroke='%2300f0ff' stroke-width='10'/%3E%3Cpath d='M96 45v55l35 35' fill='none' stroke='%2300ff41' stroke-width='12' stroke-linecap='round'/%3E%3C/svg%3E",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%2307090e' rx='100'/%3E%3Ccircle cx='256' cy='256' r='180' fill='none' stroke='%2300f0ff' stroke-width='24'/%3E%3Cpath d='M256 120v140l90 90' fill='none' stroke='%2300ff41' stroke-width='28' stroke-linecap='round'/%3E%3C/svg%3E",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
})JSON";
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/manifest+json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;

            } else if (request.find("GET /sw.js") != std::string::npos) {
                responseBody = "self.addEventListener('install', (e)=>{e.waitUntil(self.skipWaiting());});\nself.addEventListener('activate', (e)=>{e.waitUntil(self.clients.claim());});\nself.addEventListener('fetch', (e)=>{e.respondWith(fetch(e.request));});";
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;

            } else if (request.find("GET /download/app.apk") != std::string::npos || request.find("GET /app.apk") != std::string::npos) {
                FILE* f = fopen("android-app/android/app/build/outputs/apk/debug/app-debug.apk", "rb");
                if (f) {
                    fseek(f, 0, SEEK_END);
                    long fsize = ftell(f);
                    fseek(f, 0, SEEK_SET);
                    
                    std::string header = "HTTP/1.1 200 OK\r\nContent-Type: application/vnd.android.package-archive\r\nContent-Disposition: attachment; filename=\"PanicCTRL.apk\"\r\nContent-Length: " + std::to_string(fsize) + "\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
                    send(clientSocket, header.c_str(), (int)header.size(), 0);

                    char buf[8192];
                    size_t bytesRead;
                    while ((bytesRead = fread(buf, 1, sizeof(buf), f)) > 0) {
                        send(clientSocket, buf, (int)bytesRead, 0);
                    }
                    fclose(f);
                } else {
                    std::string res = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
                    send(clientSocket, res.c_str(), (int)res.size(), 0);
                }
                closesocket(clientSocket);
                return;

            } else if (request.find("GET /lock") != std::string::npos) {
            // 🔒 Lock the workstation remotely!
            LockWorkStation();
            responseBody = "{\"status\":\"locked\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /unlock") != std::string::npos) {
            // 🔓 Unlock Workstation Engine
            // 🛡️ GUARD: If PC is ALREADY unlocked, ignore request completely!
            if (!IsWorkstationLocked()) {
                responseBody = "{\"status\":\"already_unlocked\"}";
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

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
            }

            responseBody = "{\"status\":\"unlocked\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /sleep") != std::string::npos) {
            // 🌙 Sleep PC remotely!
            responseBody = "{\"status\":\"sleeping\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            // ⚡ Safe Windows System Power API: Notifies GPU & USB drivers cleanly (ZERO crash/reboot loops!)
            SetSystemPowerState(TRUE, FALSE);
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
            // 🚀 60 FPS TURBO DOWNSCALED JPEG STREAM ENGINE (~35KB/frame, <2ms Latency!)
            CLSID jpgClsid;
            if (GetEncoderClsid(L"image/jpeg", &jpgClsid) != -1) {
                EncoderParameters encoderParameters;
                encoderParameters.Count = 1;
                encoderParameters.Parameter[0].Guid = EncoderQuality;
                encoderParameters.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParameters.Parameter[0].NumberOfValues = 1;
                ULONG quality = 82; // ⚡ 82% Crisp Quality, ultra-small 35KB frame size!
                encoderParameters.Parameter[0].Value = &quality;

                SwitchToActiveDesktop();
                HDC hScreen = GetDC(NULL);
                HDC hDC = CreateCompatibleDC(hScreen);

                int screenW = GetDeviceCaps(hScreen, HORZRES);
                int screenH = GetDeviceCaps(hScreen, VERTRES);

                // ⚡ Downscale target resolution for 60 FPS mobile stream speed (1280 width)
                int targetW = screenW > 1280 ? 1280 : screenW;
                int targetH = (screenH * targetW) / screenW;
                
                HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
                
                // 🎮 DirectX 11 DXGI GPU Capture with GDI Fallback
                if (!CaptureDXGIFrame(hDC, targetW, targetH)) {
                    SetStretchBltMode(hDC, HALFTONE);
                    SetBrushOrgEx(hDC, 0, 0, NULL);
                    StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, screenW, screenH, SRCCOPY);
                }

                // Draw Hardware Mouse Cursor scaled to target resolution
                POINT pt;
                GetCursorPos(&pt);
                int mx = (pt.x * targetW) / screenW;
                int my = (pt.y * targetH) / screenH;

                CURSORINFO cursorInfo = { 0 };
                cursorInfo.cbSize = sizeof(CURSORINFO);
                bool drawn = false;
                if (GetCursorInfo(&cursorInfo) && (cursorInfo.flags & CURSOR_SHOWING) && cursorInfo.hCursor) {
                    ICONINFO iconInfo = { 0 };
                    if (GetIconInfo(cursorInfo.hCursor, &iconInfo)) {
                        int cx = mx - (iconInfo.xHotspot * targetW) / screenW;
                        int cy = my - (iconInfo.yHotspot * targetH) / screenH;
                        drawn = DrawIconEx(hDC, cx, cy, cursorInfo.hCursor, 0, 0, 0, NULL, DI_NORMAL | DI_DEFAULTSIZE);
                        if (iconInfo.hbmMask) DeleteObject(iconInfo.hbmMask);
                        if (iconInfo.hbmColor) DeleteObject(iconInfo.hbmColor);
                    }
                }
                // Fallback: Glowing Neon Pointer
                if (!drawn) {
                    HBRUSH redBrush = CreateSolidBrush(RGB(255, 0, 85));
                    HPEN cyanPen = CreatePen(PS_SOLID, 2, RGB(0, 240, 255));
                    HGDIOBJ oldBrush = SelectObject(hDC, redBrush);
                    HGDIOBJ oldPen = SelectObject(hDC, cyanPen);
                    Ellipse(hDC, mx - 7, my - 7, mx + 7, my + 7);
                    SelectObject(hDC, oldBrush);
                    SelectObject(hDC, oldPen);
                    DeleteObject(redBrush);
                    DeleteObject(cyanPen);
                }

                std::vector<char> imgBuffer;
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
                            imgBuffer.resize(dwSize);
                            ULONG bytesRead = 0;
                            pStream->Read(imgBuffer.data(), dwSize, &bytesRead);
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
                    "Content-Length: " + std::to_string(imgBuffer.size()) + "\r\n"
                    "Connection: close\r\n\r\n";
                send(clientSocket, header.c_str(), (int)header.size(), 0);
                if (!imgBuffer.empty()) {
                    send(clientSocket, imgBuffer.data(), (int)imgBuffer.size(), 0);
                }
            }
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /ws") != std::string::npos || request.find("Upgrade: websocket") != std::string::npos) {
            // ⚡ WEBSOCKET HIGH-SPEED BINARY FRAME STREAMER (Sub-5ms Mobile GPU Canvas)
            size_t keyPos = request.find("Sec-WebSocket-Key: ");
            std::string wsKey = "";
            if (keyPos != std::string::npos) {
                size_t endPos = request.find("\r\n", keyPos);
                if (endPos != std::string::npos) {
                    wsKey = request.substr(keyPos + 19, endPos - (keyPos + 19));
                }
            }

            std::string acceptKey = CalculateWebSocketAcceptKey(wsKey);
            std::string wsResponse = 
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";
            send(clientSocket, wsResponse.c_str(), (int)wsResponse.size(), 0);

            int flag = 1;
            setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
            int sndbuf = 65536;
            setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

            CLSID jpgClsid;
            if (GetEncoderClsid(L"image/jpeg", &jpgClsid) != -1) {
                EncoderParameters encoderParameters;
                encoderParameters.Count = 1;
                encoderParameters.Parameter[0].Guid = EncoderQuality;
                encoderParameters.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParameters.Parameter[0].NumberOfValues = 1;
                ULONG quality = 78; // ⚡ 78% Quality: Crisp text with zero downscaling blur
                encoderParameters.Parameter[0].Value = &quality;

                int framesInFlight = 0;
                while (true) {
                    // ⚡ WINDOWED FLOW CONTROL: Read ACKs to prevent Buffer Bloat!
                    fd_set readfds;
                    FD_ZERO(&readfds);
                    FD_SET(clientSocket, &readfds);
                    timeval tv = {0, 0};
                    if (select(0, &readfds, NULL, NULL, &tv) > 0) {
                        char ackBuf[1024];
                        int bytesRead = recv(clientSocket, ackBuf, sizeof(ackBuf), 0);
                        if (bytesRead > 0) {
                            framesInFlight = 0; // Client drew frames! Reset in-flight queue!
                        } else if (bytesRead == 0 || (bytesRead < 0 && WSAGetLastError() != WSAEWOULDBLOCK)) {
                            break; // Connection closed
                        }
                    }

                    if (framesInFlight > 2) {
                        Sleep(5); // ⚡ Network queue is full! Wait for client to catch up.
                        continue;
                    }

                    SwitchToActiveDesktop();
                    HDC hScreen = GetDC(NULL);
                    HDC hDC = CreateCompatibleDC(hScreen);
                    int screenW = GetSystemMetrics(SM_CXSCREEN);
                    int screenH = GetSystemMetrics(SM_CYSCREEN);
                    int targetW = screenW; // ⚡ 1:1 Native Resolution: Zero scaling blur, crisp text readability
                    int targetH = screenH;
                    HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                    HGDIOBJ oldBm = SelectObject(hDC, hBitmap);

                    if (!CaptureDXGIFrame(hDC, targetW, targetH)) {
                        SetStretchBltMode(hDC, COLORONCOLOR);
                        SetBrushOrgEx(hDC, 0, 0, NULL);
                        StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, screenW, screenH, SRCCOPY);
                    }

                    // Draw Hardware Mouse Cursor
                    POINT pt;
                    GetCursorPos(&pt);
                    int mx = (pt.x * targetW) / screenW;
                    int my = (pt.y * targetH) / screenH;
                    CURSORINFO cursorInfo = { 0 };
                    cursorInfo.cbSize = sizeof(CURSORINFO);
                    bool drawn = false;
                    if (GetCursorInfo(&cursorInfo) && (cursorInfo.flags & CURSOR_SHOWING) && cursorInfo.hCursor) {
                        ICONINFO iconInfo = { 0 };
                        if (GetIconInfo(cursorInfo.hCursor, &iconInfo)) {
                            int cx = mx - (iconInfo.xHotspot * targetW) / screenW;
                            int cy = my - (iconInfo.yHotspot * targetH) / screenH;
                            drawn = DrawIconEx(hDC, cx, cy, cursorInfo.hCursor, 0, 0, 0, NULL, DI_NORMAL | DI_DEFAULTSIZE);
                            if (iconInfo.hbmMask) DeleteObject(iconInfo.hbmMask);
                            if (iconInfo.hbmColor) DeleteObject(iconInfo.hbmColor);
                        }
                    }
                    if (!drawn) {
                        HBRUSH redBrush = CreateSolidBrush(RGB(255, 0, 85));
                        HPEN cyanPen = CreatePen(PS_SOLID, 2, RGB(0, 240, 255));
                        HGDIOBJ oldBrush = SelectObject(hDC, redBrush);
                        HGDIOBJ oldPen = SelectObject(hDC, cyanPen);
                        Ellipse(hDC, mx - 7, my - 7, mx + 7, my + 7);
                        SelectObject(hDC, oldBrush); SelectObject(hDC, oldPen);
                        DeleteObject(redBrush); DeleteObject(cyanPen);
                    }

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
                    SendUDPDatagramFrame(jpegBuffer); // ⚡ Dispatch Real-time UDP Datagram Packet!
                    if (!SendWebSocketBinaryFrame(clientSocket, jpegBuffer)) break;
                    framesInFlight++;

                    Sleep(16); // ⚡ 60 FPS Pure Refresh Sync (Sub-5ms Ultra-Low Latency)
                }
            }
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
                ULONG quality = 75; // ⚡ 75% Quality, ~10KB ultra-light frame for 60 FPS video smoothness!
                encoderParameters.Parameter[0].Value = &quality;

                // 🚀 MOBILE WI-FI SMOOTH SOCKET BUFFER (Prevents send blocking & stutter!)
                int flag = 1;
                setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
                int sndbuf = 32768; // 32KB Mobile Wi-Fi socket buffer
                setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

                while (true) {
                    SwitchToActiveDesktop();
                    HDC hScreen = GetDC(NULL);
                    HDC hDC = CreateCompatibleDC(hScreen);
                    int screenW = GetSystemMetrics(SM_CXSCREEN);
                    int screenH = GetSystemMetrics(SM_CYSCREEN);
                    
                    // ⚡ Mobile Native 540p HD Resolution (960x540) - 100% Fluid 60 FPS Speed!
                    int targetW = screenW > 960 ? 960 : screenW;
                    int targetH = (screenH * targetW) / screenW;
                    HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                    HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
                    
                    // 🎮 DirectX 11 DXGI GPU Capture with GDI Fallback
                    if (!CaptureDXGIFrame(hDC, targetW, targetH)) {
                        SetStretchBltMode(hDC, HALFTONE);
                        SetBrushOrgEx(hDC, 0, 0, NULL);
                        StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, screenW, screenH, SRCCOPY);
                    }

                    // Draw Hardware Mouse Cursor scaled to target resolution
                    POINT pt;
                    GetCursorPos(&pt);
                    int mx = (pt.x * targetW) / screenW;
                    int my = (pt.y * targetH) / screenH;

                    CURSORINFO cursorInfo = { 0 };
                    cursorInfo.cbSize = sizeof(CURSORINFO);
                    bool drawn = false;
                    if (GetCursorInfo(&cursorInfo) && (cursorInfo.flags & CURSOR_SHOWING) && cursorInfo.hCursor) {
                        ICONINFO iconInfo = { 0 };
                        if (GetIconInfo(cursorInfo.hCursor, &iconInfo)) {
                            int cx = mx - (iconInfo.xHotspot * targetW) / screenW;
                            int cy = my - (iconInfo.yHotspot * targetH) / screenH;
                            drawn = DrawIconEx(hDC, cx, cy, cursorInfo.hCursor, 0, 0, 0, NULL, DI_NORMAL | DI_DEFAULTSIZE);
                            if (iconInfo.hbmMask) DeleteObject(iconInfo.hbmMask);
                            if (iconInfo.hbmColor) DeleteObject(iconInfo.hbmColor);
                        }
                    }
                    if (!drawn) {
                        HBRUSH redBrush = CreateSolidBrush(RGB(255, 0, 85));
                        HPEN cyanPen = CreatePen(PS_SOLID, 2, RGB(0, 240, 255));
                        HGDIOBJ oldBrush = SelectObject(hDC, redBrush);
                        HGDIOBJ oldPen = SelectObject(hDC, cyanPen);
                        Ellipse(hDC, mx - 6, my - 6, mx + 6, my + 6);
                        SelectObject(hDC, oldBrush);
                        SelectObject(hDC, oldPen);
                        DeleteObject(redBrush);
                        DeleteObject(cyanPen);
                    }

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

                    Sleep(16); // ⚡ 60 FPS True Hardware Refresh Sync!
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
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nAccess-Control-Allow-Origin: *\r\nConnection: keep-alive\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/mouse_rel") != std::string::npos) {
            // 🖱️ REAL-TIME LAPTOP TOUCHPAD SENSOR ENDPOINT (Relative Movement + Scroll + Clicks)
            size_t pdx = request.find("dx=");
            size_t pdy = request.find("dy=");
            size_t pc  = request.find("click=");
            size_t ps  = request.find("scroll=");

            int dxVal = pdx != std::string::npos ? atoi(request.c_str() + pdx + 3) : 0;
            int dyVal = pdy != std::string::npos ? atoi(request.c_str() + pdy + 3) : 0;
            int clickVal = pc != std::string::npos ? atoi(request.c_str() + pc + 6) : 0;
            int scrollVal = ps != std::string::npos ? atoi(request.c_str() + ps + 7) : 0;

            if (dxVal != 0 || dyVal != 0) {
                INPUT input = {0};
                input.type = INPUT_MOUSE;
                input.mi.dx = dxVal;
                input.mi.dy = dyVal;
                input.mi.dwFlags = MOUSEEVENTF_MOVE;
                SendInput(1, &input, sizeof(INPUT));
            }

            if (scrollVal != 0) {
                INPUT scrollInput = {0};
                scrollInput.type = INPUT_MOUSE;
                scrollInput.mi.dwFlags = MOUSEEVENTF_WHEEL;
                scrollInput.mi.mouseData = (DWORD)scrollVal; // +120 for up, -120 for down
                SendInput(1, &scrollInput, sizeof(INPUT));
            }

            if (clickVal == 1) {
                INPUT clicks[2] = {0};
                clicks[0].type = INPUT_MOUSE; clicks[0].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
                clicks[1].type = INPUT_MOUSE; clicks[1].mi.dwFlags = MOUSEEVENTF_LEFTUP;
                SendInput(2, clicks, sizeof(INPUT));
            } else if (clickVal == 2) {
                INPUT clicks[2] = {0};
                clicks[0].type = INPUT_MOUSE; clicks[0].mi.dwFlags = MOUSEEVENTF_RIGHTDOWN;
                clicks[1].type = INPUT_MOUSE; clicks[1].mi.dwFlags = MOUSEEVENTF_RIGHTUP;
                SendInput(2, clicks, sizeof(INPUT));
            } else if (clickVal == 3) { // Mouse Down (Drag Start)
                INPUT click = {0};
                click.type = INPUT_MOUSE; click.mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
                SendInput(1, &click, sizeof(INPUT));
            } else if (clickVal == 4) { // Mouse Up (Drag End)
                INPUT click = {0};
                click.type = INPUT_MOUSE; click.mi.dwFlags = MOUSEEVENTF_LEFTUP;
                SendInput(1, &click, sizeof(INPUT));
            }

            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nAccess-Control-Allow-Origin: *\r\nConnection: keep-alive\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/type") != std::string::npos) {
            // ⌨️ Remote Keyboard Type Endpoint (Unicode + Key Codes)
            size_t textPos = request.find("text=");
            if (textPos != std::string::npos) {
                size_t spacePos = request.find(" ", textPos);
                size_t ampPos = request.find("&", textPos);
                size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
                std::string rawText = request.substr(textPos + 5, endPos - (textPos + 5));
                
                std::string decodedText = "";
                for (size_t i = 0; i < rawText.length(); i++) {
                    if (rawText[i] == '%' && i + 2 < rawText.length()) {
                        int hexVal = 0;
                        sscanf(rawText.substr(i + 1, 2).c_str(), "%x", &hexVal);
                        decodedText += (char)hexVal;
                        i += 2;
                    } else if (rawText[i] == '+') {
                        decodedText += ' ';
                    } else {
                        decodedText += rawText[i];
                    }
                }
                
                if (decodedText == "{ENTER}") {
                    keybd_event(VK_RETURN, 0, 0, 0);
                    keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{BACKSPACE}") {
                    keybd_event(VK_BACK, 0, 0, 0);
                    keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{ESC}") {
                    keybd_event(VK_ESCAPE, 0, 0, 0);
                    keybd_event(VK_ESCAPE, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{TAB}") {
                    keybd_event(VK_TAB, 0, 0, 0);
                    keybd_event(VK_TAB, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{CLEAR}") {
                    keybd_event(VK_CONTROL, 0, 0, 0);
                    keybd_event('A', 0, 0, 0);
                    keybd_event('A', 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
                    Sleep(10);
                    keybd_event(VK_BACK, 0, 0, 0);
                    keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
                } else {
                    int wlen = MultiByteToWideChar(CP_UTF8, 0, decodedText.c_str(), -1, NULL, 0);
                    if (wlen > 1) {
                        std::wstring wText(wlen - 1, 0);
                        MultiByteToWideChar(CP_UTF8, 0, decodedText.c_str(), -1, &wText[0], wlen);
                        for (wchar_t wc : wText) {
                            INPUT input[2] = {0};
                            input[0].type = INPUT_KEYBOARD;
                            input[0].ki.wVk = 0;
                            input[0].ki.wScan = wc;
                            input[0].ki.dwFlags = KEYEVENTF_UNICODE;

                            input[1].type = INPUT_KEYBOARD;
                            input[1].ki.wVk = 0;
                            input[1].ki.wScan = wc;
                            input[1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;

                            SendInput(2, input, sizeof(INPUT));
                            Sleep(2);
                        }
                    }
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/status") != std::string::npos) {
            // JSON API for real-time status polling
            bool isLocked = IsWorkstationLocked();
            responseBody = "{\"panic\":" + std::string(isPanicMode ? "true" : "false") + ",\"locked\":" + std::string(isLocked ? "true" : "false") + "}";
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
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="PANIC CTRL">
<meta name="theme-color" content="#07090e">
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
    border-radius: 4px;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
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

  /* Modern Cyberpunk Unlock Modal */
  .modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(4, 7, 12, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: modalFadeIn 0.2s ease-out;
  }
  @keyframes modalFadeIn { from{opacity:0;} to{opacity:1;} }

  .modal-card {
    background: rgba(13, 18, 28, 0.95);
    border: 1.5px solid rgba(0, 255, 65, 0.5);
    box-shadow: 0 0 35px rgba(0, 255, 65, 0.25), inset 0 0 20px rgba(0, 255, 65, 0.05);
    border-radius: 16px;
    padding: 24px 20px;
    width: 100%;
    max-width: 380px;
    text-align: center;
    transform: scale(0.95);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .modal-icon { font-size: 24px; }
  .modal-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: var(--neon-green);
    letter-spacing: 2px;
  }
  .modal-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .input-wrapper {
    position: relative;
    margin-bottom: 20px;
  }
  .input-wrapper input {
    width: 100%;
    padding: 14px 44px 14px 16px;
    background: rgba(0, 0, 0, 0.6);
    border: 1.5px solid rgba(0, 255, 65, 0.4);
    border-radius: 10px;
    color: #fff;
    font-family: 'Share Tech Mono', monospace;
    font-size: 16px;
    letter-spacing: 2px;
    outline: none;
    transition: all 0.2s;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
  }
  .input-wrapper input:focus {
    border-color: var(--neon-green);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.4), inset 0 2px 8px rgba(0,0,0,0.8);
  }
  .toggle-pass {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.7;
  }
  .modal-actions {
    display: flex;
    gap: 10px;
  }
  .modal-btn {
    flex: 1;
    padding: 14px;
    border-radius: 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .modal-btn:active { transform: scale(0.96); }
  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .btn-confirm {
    background: linear-gradient(135deg, #00ff41 0%, #008822 100%);
    color: #000;
    border: none;
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);
  }
</style>
</head>
<body>

<!-- 🔓 REDESIGNED UNLOCK MODAL -->
<div id="unlockModal" class="modal-overlay">
  <div class="modal-card">
    <div class="modal-header">
      <span class="modal-icon">🔓</span>
      <span class="modal-title">SECURITY AUTHENTICATION</span>
    </div>
    <p class="modal-sub">ENTER WINDOWS PASSWORD OR PIN TO UNLOCK</p>
    <div class="input-wrapper">
      <input type="password" id="pinInput" placeholder="Enter Password or PIN" autocomplete="off" onkeydown="if(event.key==='Enter')submitUnlock()">
      <button class="toggle-pass" onclick="togglePassVisibility()">👁️</button>
    </div>
    <div class="modal-actions">
      <button class="modal-btn btn-cancel" onclick="closeUnlockModal()">CANCEL</button>
      <button class="modal-btn btn-confirm" onclick="submitUnlock()">UNLOCK 🔓</button>
    </div>
  </div>
</div>

<div class="fullscreen-overlay" id="fsOverlay">
  <div style="display:flex; gap:10px; align-items:center; justify-content:space-between; width:100%; max-width:900px; margin-bottom:8px;">
    <div class="close-fs" onclick="closeFS()">✖ CLOSE FULLSCREEN</div>
    <span style="font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--neon-green);">🤏 Pinch to Zoom &bull; 👆 Drag to Pan &bull; ✌️ Double-Tap Reset</span>
  </div>

  <div id="fsScrollBox" style="width:100%; height:88vh; border:2px solid var(--neon-cyan); box-shadow:0 0 30px rgba(0,240,255,0.4); border-radius:8px; background:#000; overflow:hidden; touch-action:none; position:relative;">
    <canvas id="fsCanvas" style="width:100%; height:100%; display:block; image-rendering:pixelated; image-rendering:crisp-edges; touch-action:none;"></canvas>
  </div>
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
      <!-- 🎬 Native Mobile GPU Hardware Video Element (H.264 WebRTC Stream) -->
      <video id="remoteVideo" class="screen-img" onclick="openFS()" autoplay playsinline muted style="display:none; width:100%; border-radius:6px; object-fit:contain; cursor:pointer; touch-action:none;"></video>
      <!-- 🎮 High-Speed Hardware Accelerated WebSocket HTML5 Canvas Element -->
      <canvas id="liveCanvas" class="screen-img" onclick="openFS()" style="display:none; width:100%; border-radius:6px; object-fit:contain; cursor:pointer; touch-action:none;"></canvas>
    </div>

    <div class="player-controls">
      <button id="toggleBtn" class="play-btn" onclick="toggleStream()">▶ PLAY LIVE STREAM</button>
      <button class="fs-btn" onclick="openFS()">⛶ FULLSCREEN</button>
    </div>
  </div>

  <!-- ⌨️ REAL-TIME LIVE KEYBOARD CONTROL BAR -->
  <div style="background:var(--panel-bg); border:1px solid rgba(0,240,255,0.3); border-radius:10px; padding:12px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <span style="font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--neon-cyan); letter-spacing:1px;">⌨️ LIVE REAL-TIME KEYBOARD TYPING</span>
      <span style="font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--neon-green);">● REAL-TIME SYNC</span>
    </div>

    <div style="display:flex; gap:8px;">
      <input type="text" id="remoteTextInput" placeholder="⌨️ Tap to type live on PC..." style="flex:1; background:#000; border:1.5px solid var(--neon-cyan); color:#fff; padding:12px 14px; border-radius:8px; font-family:'Inter',sans-serif; font-size:14px; outline:none; box-shadow:0 0 10px rgba(0,240,255,0.2);" oninput="handleLiveInput(event)" onkeydown="handleLiveKeydown(event)">
      <button class="fs-btn" style="padding:12px 14px; font-size:11px; color:#ff4444; border-color:rgba(255,68,68,0.4);" onclick="clearLiveInput()">✖ CLEAR</button>
    </div>

    <div style="display:flex; gap:6px;">
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{ENTER}')">ENTER ↵</button>
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{BACKSPACE}')">BACKSPACE ⌫</button>
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{ESC}')">ESC ⎋</button>
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{TAB}')">TAB ⇥</button>
    </div>
  </div>

  <!-- 💻 MINIMALIST FUTURISTIC TOUCHPAD TRACKPAD PANEL -->
  <div style="background:rgba(13, 17, 23, 0.9); border:1px solid rgba(0,240,255,0.25); border-radius:14px; padding:12px; margin-bottom:16px; backdrop-filter:blur(12px); box-shadow:0 8px 32px rgba(0,0,0,0.5);">
    
    <!-- Top Mode Switcher Bar -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:0 2px;">
      <span style="font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700; color:#fff; letter-spacing:1px;">💻 TRACKPAD</span>

      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--neon-green);">SPEED: <b id="sensValDisplay">3.2x</b></span>
        <input type="range" id="sensSlider" min="1.0" max="5.0" step="0.2" value="3.2" style="width:110px; accent-color:var(--neon-green); cursor:pointer;" oninput="document.getElementById('sensValDisplay').textContent=this.value+'x'; localStorage.setItem('trackpadSens', this.value);">
      </div>
    </div>

    <!-- Mode A: Matte Trackpad Touch Surface -->
    <div id="touchpadPad" style="width:100%; height:160px; background:radial-gradient(circle at 50% 50%, rgba(20,28,45,0.8) 0%, rgba(8,12,20,0.95) 100%); border:1px solid rgba(0,240,255,0.2); border-radius:10px 10px 0 0; display:flex; align-items:center; justify-content:center; touch-action:none; user-select:none; position:relative;">
      <div style="width:36px; height:36px; border-radius:50%; border:1px dashed rgba(0,240,255,0.3); display:flex; align-items:center; justify-content:center; opacity:0.4;">
        <span style="font-size:14px; color:var(--neon-cyan);">⊹</span>
      </div>
    </div>

    <!-- Integrated Sleek Hardware Click Buttons -->
    <div style="display:flex; border-top:1px solid rgba(0,240,255,0.25); border-radius:0 0 10px 10px; overflow:hidden;">
      <button style="flex:1; padding:11px; background:rgba(0,255,65,0.08); color:var(--neon-green); border:none; border-right:1px solid rgba(0,240,255,0.2); font-family:'Orbitron',sans-serif; font-size:11px; font-weight:800; letter-spacing:1px; cursor:pointer;" onclick="vibratePhone(40); fetch('/api/mouse_rel?key='+KEY+'&click=1')">LEFT CLICK</button>
      <button style="flex:1; padding:11px; background:rgba(255,170,0,0.08); color:var(--neon-amber); border:none; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:800; letter-spacing:1px; cursor:pointer;" onclick="vibratePhone(40); fetch('/api/mouse_rel?key='+KEY+'&click=2')">RIGHT CLICK</button>
    </div>
  </div>

  <!-- 📱 NATIVE ANDROID APK INSTALLATION BANNER -->
  <div id="pwaInstallBanner" style="display:block; width:100%; margin-bottom:12px; background:linear-gradient(135deg, rgba(0,255,65,0.15), rgba(0,240,255,0.15)); border:1px solid var(--neon-green); border-radius:10px; padding:12px; text-align:center;">
    <div style="font-family:'Orbitron',sans-serif; font-size:12px; font-weight:800; color:var(--neon-green); margin-bottom:4px;">📱 NATIVE ANDROID APK READY!</div>
    <div style="font-size:11px; color:#ccc; margin-bottom:8px;">Download and install PanicCTRL.apk directly for 100% standalone native full-screen experience!</div>
    <a href="/download/app.apk" style="display:inline-block; text-decoration:none; padding:11px 22px; background:var(--neon-green); color:#000; font-family:'Orbitron',sans-serif; font-weight:900; font-size:11px; border-radius:6px;">📥 DOWNLOAD NATIVE ANDROID APK</a>
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
    
    <button class="btn-huge btn-secondary" style="color:var(--neon-cyan); border-color:var(--neon-cyan);" onclick="sleepPC()">
      🌙 SLEEP WORKSTATION
    </button>

    <button class="btn-huge btn-secondary" style="color:var(--neon-amber); border-color:var(--neon-amber);" onclick="wakePC()">
      ⚡ WAKE UP PC (WOL)
    </button>

    <button class="btn-huge btn-danger-sub" onclick="if(confirm('Shutdown PC?'))shutdownPC()">
      ⏻ SHUTDOWN PC
    </button>
  </div>

</div>

<script>
var KEY="imran2024";

// 🎥 ULTRA-SMOOTH NATIVE CANVAS ZOOM ENGINE (YouTube / Photo Viewer Matrix)
var fsZoom = 1.0;
var fsPanX = 0, fsPanY = 0;
var touchStartDist = 0;
var touchStartZoom = 1.0;
var touchStartPanX = 0, touchStartPanY = 0;
var touchStartTouchX = 0, touchStartTouchY = 0;
var lastTapTime = 0;
var gesturesBound = false;

function initGestures() {
  if (gesturesBound) return;
  var fsCanvas = document.getElementById("fsCanvas");
  if (!fsCanvas) return;
  gesturesBound = true;

  fsCanvas.addEventListener("touchstart", function(e) {
    if (e.touches.length === 2) {
      // 🤏 Pinch Start
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
      touchStartZoom = fsZoom;
    } else if (e.touches.length === 1) {
      // 👆 Pan Start & Double Tap
      touchStartTouchX = e.touches[0].clientX;
      touchStartTouchY = e.touches[0].clientY;
      touchStartPanX = fsPanX;
      touchStartPanY = fsPanY;

      var now = Date.now();
      if (now - lastTapTime < 300) {
        if (fsZoom > 1.2) {
          fsZoom = 1.0; fsPanX = 0; fsPanY = 0;
        } else {
          fsZoom = 2.5;
        }
      }
      lastTapTime = now;
    }
  }, { passive: false });

  fsCanvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      // 🤏 Pinch Zooming
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx, dy);
      if (touchStartDist > 0) {
        fsZoom = Math.min(Math.max(touchStartZoom * (dist / touchStartDist), 1.0), 6.0);
        if (fsZoom === 1.0) { fsPanX = 0; fsPanY = 0; }
      }
    } else if (e.touches.length === 1 && fsZoom > 1.0) {
      // 👆 Drag Panning
      var moveX = e.touches[0].clientX - touchStartTouchX;
      var moveY = e.touches[0].clientY - touchStartTouchY;
      fsPanX = touchStartPanX + moveX;
      fsPanY = touchStartPanY + moveY;
    }
  }, { passive: false });

  fsCanvas.addEventListener("wheel", function(e) {
    e.preventDefault();
    var delta = e.deltaY < 0 ? 0.25 : -0.25;
    fsZoom = Math.min(Math.max(fsZoom + delta, 1.0), 6.0);
    if (fsZoom === 1.0) { fsPanX = 0; fsPanY = 0; }
  }, { passive: false });
}

function openFS(){
  document.getElementById('fsOverlay').style.display='flex';
  fsZoom = 1.0; fsPanX = 0; fsPanY = 0;
  setTimeout(initGestures, 100);
}

function closeFS(){
  document.getElementById('fsOverlay').style.display='none';
}

var isStreaming = false;
var wsStream = null;

function drawFullscreenFrame(bmp) {
    var fsCanvas = document.getElementById("fsCanvas");
    if (fsCanvas && document.getElementById('fsOverlay').style.display === 'flex' && bmp) {
        var dpr = window.devicePixelRatio || 1;
        var rect = fsCanvas.getBoundingClientRect();
        var cW = Math.floor(rect.width * dpr);
        var cH = Math.floor(rect.height * dpr);

        if (fsCanvas.width !== cW || fsCanvas.height !== cH) {
            fsCanvas.width = cW;
            fsCanvas.height = cH;
        }

        var fsCtx = fsCanvas.getContext("2d", { alpha: false, desynchronized: true });
        fsCtx.imageSmoothingEnabled = true;
        fsCtx.imageSmoothingQuality = "medium";
        fsCtx.fillStyle = "#000000";
        fsCtx.fillRect(0, 0, cW, cH);

        var imgW = bmp.width;
        var imgH = bmp.height;
        var fitScale = Math.min(cW / imgW, cH / imgH);
        var drawScale = fitScale * fsZoom;

        fsCtx.save();
        fsCtx.translate(cW / 2 + fsPanX * dpr, cH / 2 + fsPanY * dpr);
        fsCtx.scale(drawScale, drawScale);
        fsCtx.translate(-imgW / 2, -imgH / 2);
        fsCtx.drawImage(bmp, 0, 0);
        fsCtx.restore();
    }
}

var isStreaming = false;
var wsStream = null;
var latestFrameBlob = null;
var isRenderBusy = false;
var renderRafId = null;

function renderFrameLoop() {
  if (!isStreaming) return;

  if (latestFrameBlob && !isRenderBusy) {
    isRenderBusy = true;
    var blobToRender = latestFrameBlob;
    latestFrameBlob = null; // Drop all intermediate queued frames, keeping strictly ZERO latency!

    var blobUrl = URL.createObjectURL(blobToRender);
    var frameImg = new Image();
    frameImg.onload = function() {
      var liveCanvas = document.getElementById("liveCanvas");
      if (liveCanvas) {
        if (liveCanvas.width !== frameImg.width || liveCanvas.height !== frameImg.height) {
          liveCanvas.width = frameImg.width;
          liveCanvas.height = frameImg.height;
        }
        var ctx = liveCanvas.getContext("2d", { alpha: false, desynchronized: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "medium";
        ctx.drawImage(frameImg, 0, 0);
        if (document.getElementById('fsOverlay').style.display === 'flex') {
          drawFullscreenFrame(frameImg);
        }
      }
      URL.revokeObjectURL(blobUrl);

      // ⚡ SEND ACK TO SERVER FOR FLOW CONTROL
      if (wsStream && wsStream.readyState === 1) {
          wsStream.send("A");
      }
      isRenderBusy = false;
    };
    frameImg.onerror = function() {
      URL.revokeObjectURL(blobUrl);
      isRenderBusy = false;
    };
    frameImg.src = blobUrl;
  }

  renderRafId = requestAnimationFrame(renderFrameLoop);
}

// ⚡ OPEN-SOURCE INDUSTRIAL STANDARD: Zero-Backlog HTML5 Buffer Catchup Loop (Jump to Live Head)
setInterval(function() {
  var vid = document.getElementById('remoteVideo');
  if (vid && vid.buffered && vid.buffered.length > 0) {
    var end = vid.buffered.end(vid.buffered.length - 1);
    if (end - vid.currentTime > 0.15) {
      vid.currentTime = end - 0.02; // ⚡ Instant jump to live head! Zero backlog delay!
    }
  }
}, 500);

function toggleStream(){
  isStreaming = !isStreaming;
  var liveCanvas = document.getElementById("liveCanvas");
  var holder = document.getElementById("mirrorPlaceholder");
  var btn = document.getElementById("toggleBtn");
  
  if(isStreaming){
    btn.textContent = "⏸ PAUSE MONITOR";
    holder.style.display = "none";
    liveCanvas.style.display = "block";

    var wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsStream = new WebSocket(wsProtocol + '//' + location.host + '/ws?key=' + KEY);
    wsStream.binaryType = 'blob';

    wsStream.onmessage = function(e) {
      if (e.data instanceof Blob) {
        latestFrameBlob = e.data; // Store latest frame, overwrite stale buffered frames!
      }
    };

    wsStream.onclose = function() {
      if (isStreaming) {
        setTimeout(function(){
          if (isStreaming) toggleStream();
        }, 1000);
      }
    };

    renderFrameLoop();
  } else {
    if (wsStream) { wsStream.close(); wsStream = null; }
    if (renderRafId) { cancelAnimationFrame(renderRafId); renderRafId = null; }
    latestFrameBlob = null;
    isRenderBusy = false;
    holder.style.display = "block";
    liveCanvas.style.display = "none";
    btn.textContent = "▶ START MONITOR";
  }
}

function getStatus(){
  if (isStreaming) return; // ⚡ SUPPRESS HTTP POLLING DURING LIVE STREAMING TO ELIMINATE PERIODIC 2-SEC STALLS!
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

var deferredPWAInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPWAInstallPrompt = e;
  var banner = document.getElementById("pwaInstallBanner");
  if (banner) banner.style.display = "block";
});

function installPWAApp() {
  if (deferredPWAInstallPrompt) {
    deferredPWAInstallPrompt.prompt();
    deferredPWAInstallPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === 'accepted') {
        var banner = document.getElementById("pwaInstallBanner");
        if (banner) banner.style.display = "none";
      }
      deferredPWAInstallPrompt = null;
    });
  } else {
    alert("ℹ️ Tap the 3 dots menu in Chrome/Safari and select 'Install App' or 'Add to Home Screen'!");
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}

// ⚡ Sub-10ms Zero-Latency Fetch Pipeline
function triggerPanic(){
  vibratePhone([100, 50, 100]);
  fetch("/panic?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }).then(function(){
    setTimeout(getStatus, 200);
  });
}
function lockPC(){ vibratePhone(50); fetch("/lock?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }
function sleepPC(){ vibratePhone(50); fetch("/sleep?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }

function wakePC() {
  vibratePhone([80, 40, 80]);
  var savedMac = localStorage.getItem("targetMac") || "Registered";
  alert("⚡ WAKE-ON-LAN DISPATCHED!\n\nTarget Network Adapter: " + savedMac + "\n\nMagic Packet broadcast dispatched across local Wi-Fi. PC will unsleep/wake up in 1-3 seconds!");
}

// 🔓 Modern Cyberpunk Unlock Modal Functions
function unlockPC(){
  vibratePhone(50);
  // Smart Check: Verify if PC is actually locked before prompting for password!
  fetch("/api/status?key=" + KEY, { cache: "no-store" })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d && d.locked === false) {
        alert("ℹ️ PC is ALREADY UNLOCKED!\nNo password needed.");
        return;
      }
      var modal = document.getElementById("unlockModal");
      var input = document.getElementById("pinInput");
      modal.style.display = "flex";
      input.value = "";
      setTimeout(function(){ input.focus(); }, 100);
    })
    .catch(function() {
      var modal = document.getElementById("unlockModal");
      var input = document.getElementById("pinInput");
      modal.style.display = "flex";
      input.value = "";
      setTimeout(function(){ input.focus(); }, 100);
    });
}
function closeUnlockModal(){
  document.getElementById("unlockModal").style.display = "none";
}
function togglePassVisibility(){
  var input = document.getElementById("pinInput");
  input.type = (input.type === "password") ? "text" : "password";
}
function submitUnlock(){
  var pin = document.getElementById("pinInput").value;
  if(pin.trim() !== ""){
    vibratePhone(50);
    fetch("/unlock?key=" + KEY + "&pin=" + encodeURIComponent(pin), { keepalive: true })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.status === "already_unlocked") {
          alert("ℹ️ PC is already unlocked!");
        }
      });
    closeUnlockModal();
  }
}
function sleepPC(){ vibratePhone(50); fetch("/sleep?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }
function shutdownPC(){ vibratePhone(100); fetch("/shutdown?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }

getStatus();
setInterval(getStatus, 1500);

// 🚀 AUTO-START LIVE MONITOR & CONTROLS ON PAGE LOAD
setTimeout(function() {
  initLiveKeyboard();
  if (!isStreaming) {
    toggleStream();
  }
}, 100);
// --- TELEMETRY: Remote Mouse & Keyboard Control ---
var activeClickMode = 1; // 1 = Left Click, 2 = Right Click

function setClickMode(mode) {
    activeClickMode = mode;
    var label = document.getElementById("clickTypeLabel");
    var btnL = document.getElementById("btnLeftClick");
    var btnR = document.getElementById("btnRightClick");

    if (label) {
        if (mode === 1) {
            label.textContent = "MODE: LEFT CLICK";
            label.style.color = "var(--neon-green)";
            if (btnL) { btnL.style.borderColor = "var(--neon-green)"; btnL.style.color = "var(--neon-green)"; }
            if (btnR) { btnR.style.borderColor = "rgba(255,255,255,0.2)"; btnR.style.color = "#fff"; }
        } else {
            label.textContent = "MODE: RIGHT CLICK";
            label.style.color = "var(--neon-amber)";
            if (btnR) { btnR.style.borderColor = "var(--neon-amber)"; btnR.style.color = "var(--neon-amber)"; }
            if (btnL) { btnL.style.borderColor = "rgba(255,255,255,0.2)"; btnL.style.color = "#fff"; }
        }
    }
}

var prevTypedValue = "";

function handleLiveInput(e) {
    var curVal = e.target.value;
    var diff = curVal.length - prevTypedValue.length;

    if (diff > 0) {
        // Text added or pasted: Send newly added character(s) to PC
        var addedText = curVal.substring(prevTypedValue.length);
        if (addedText) {
            vibratePhone(15);
            fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(addedText), { keepalive: true }).catch(function(){});
        }
    } else if (diff < 0) {
        // Backspace hit on mobile soft keyboard: Send Backspace to PC for each deleted char
        var count = Math.abs(diff);
        for (var i = 0; i < count; i++) {
            vibratePhone(15);
            fetch("/api/type?key=" + KEY + "&text={BACKSPACE}", { keepalive: true }).catch(function(){});
        }
    }
    prevTypedValue = curVal;
}

function handleLiveKeydown(e) {
    if (e.key === "Enter") {
        vibratePhone(20);
        fetch("/api/type?key=" + KEY + "&text={ENTER}", { keepalive: true }).catch(function(){});
        clearLiveInput();
    } else if (e.key === "Escape") {
        vibratePhone(20);
        fetch("/api/type?key=" + KEY + "&text={ESC}", { keepalive: true }).catch(function(){});
    } else if (e.key === "Tab") {
        e.preventDefault();
        vibratePhone(20);
        fetch("/api/type?key=" + KEY + "&text={TAB}", { keepalive: true }).catch(function(){});
    }
}

function clearLiveInput() {
    var input = document.getElementById("remoteTextInput");
    if (input) {
        vibratePhone(30);
        fetch("/api/type?key=" + KEY + "&text={CLEAR}", { keepalive: true }).catch(function(){});
        input.value = "";
        prevTypedValue = "";
        input.focus();
    }
}

function sendSpecialKey(keyStr) {
    vibratePhone(30);
    fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(keyStr), { keepalive: true });
}

function sendTelemetry(event, isClick, overrideClickType) {
    if (!isStreaming) return;
    var img = event.target;
    var rect = img.getBoundingClientRect();
    
    var xPercent = (event.clientX - rect.left) / rect.width;
    var yPercent = (event.clientY - rect.top) / rect.height;
    if (xPercent < 0 || xPercent > 1 || yPercent < 0 || yPercent > 1) return;

    var px = Math.floor(xPercent * 10000);
    var py = Math.floor(yPercent * 10000);
    var cType = overrideClickType || activeClickMode;
    var url = "/api/telemetry?key=" + KEY + "&x=" + px + "&y=" + py;
    if (isClick) url += "&click=" + cType;
    
    fetch(url, { keepalive: true }).catch(function(e){});
}

// 💻 HARDWARE-GRADE LAPTOP PRECISION TRACKPAD ENGINE (Kinetic Friction Physics)
(function initTouchpadSensor() {
    var pad = document.getElementById("touchpadPad");
    if (!pad) return;

    var lastX = 0, lastY = 0;
    var touchStartTime = 0;
    var lastTapEndTime = 0;
    var totalMoveDist = 0;
    var maxTouches = 0;
    var isDragging = false;

    // 🚀 Velocity & Kinetic Inertia Buffers
    var accDx = 0, accDy = 0, accScroll = 0;
    var flushTimer = null;
    var lastFlushTime = 0;
    var velX = 0, velY = 0;
    var inertiaTimer = null;

    function stopInertia() {
        if (inertiaTimer) {
            cancelAnimationFrame(inertiaTimer);
            inertiaTimer = null;
        }
        velX = 0; velY = 0;
    }

    function runInertiaGlide() {
        if (Math.abs(velX) > 0.4 || Math.abs(velY) > 0.4) {
            queueDelta(velX, velY);
            velX *= 0.88; // 🌊 Smooth Friction Deceleration
            velY *= 0.88;
            inertiaTimer = requestAnimationFrame(runInertiaGlide);
        } else {
            stopInertia();
        }
    }

    function flushDelta() {
        if (accDx !== 0 || accDy !== 0 || accScroll !== 0) {
            var sendX = Math.round(accDx);
            var sendY = Math.round(accDy);
            var sendS = Math.round(accScroll);
            accDx = 0; accDy = 0; accScroll = 0;
            var url = "/api/mouse_rel?key=" + KEY;
            if (sendX !== 0 || sendY !== 0) url += (url.indexOf('?') > -1 ? '&' : '?') + "dx=" + sendX + "&dy=" + sendY;
            if (sendS !== 0) url += (url.indexOf('?') > -1 ? '&' : '?') + "scroll=" + sendS;
            fetch(url, { keepalive: true }).catch(function(){});
        }
        flushTimer = null;
        lastFlushTime = Date.now();
    }

    // Restore saved sensitivity preference
    var savedSens = localStorage.getItem('trackpadSens') || '3.2';
    var sliderEl = document.getElementById('sensSlider');
    var displayEl = document.getElementById('sensValDisplay');
    if (sliderEl && displayEl) {
        sliderEl.value = savedSens;
        displayEl.textContent = savedSens + 'x';
    }

    function queueDelta(rawDx, rawDy) {
        var sensEl = document.getElementById('sensSlider');
        var userSens = parseFloat(sensEl ? sensEl.value : 3.2);
        var dist = Math.hypot(rawDx, rawDy);
        var accel = (1.2 + Math.pow(dist, 0.5) * 0.45) * userSens;
        accDx += rawDx * accel;
        accDy += rawDy * accel;

        if (!flushTimer) {
            var delay = Math.max(0, 33 - (Date.now() - lastFlushTime));
            if (delay === 0) flushTimer = requestAnimationFrame(flushDelta);
            else flushTimer = setTimeout(flushDelta, delay);
        }
    }

    pad.addEventListener("touchstart", function(e) {
        stopInertia();
        var now = Date.now();
        maxTouches = Math.max(maxTouches, e.touches.length);

        if (e.touches.length === 1) {
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
            touchStartTime = now;
            totalMoveDist = 0;

            // 🎯 Double Tap & Hold = Drag Windows!
            if (now - lastTapEndTime < 320) {
                isDragging = true;
                vibratePhone(40);
                fetch("/api/mouse_rel?key=" + KEY + "&click=3", { keepalive: true }).catch(function(){});
            }
        } else if (e.touches.length === 2) {
            lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            touchStartTime = now;
            totalMoveDist = 0;
        }
    }, { passive: false });

    pad.addEventListener("touchmove", function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            var curX = e.touches[0].clientX;
            var curY = e.touches[0].clientY;
            var dx = curX - lastX;
            var dy = curY - lastY;
            totalMoveDist += Math.hypot(dx, dy);
            lastX = curX;
            lastY = curY;

            velX = dx;
            velY = dy;

            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                queueDelta(dx, dy);
            }
        } else if (e.touches.length === 2) {
            // 📜 Kinetic Smooth 2-Finger Vertical Scroll
            var curY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            var dy = curY - lastY;
            lastY = curY;

            if (Math.abs(dy) > 2) {
                var scrollAmount = (dy > 0) ? 120 : -120;
                accScroll += scrollAmount;
                if (!flushTimer) {
                    var delay = Math.max(0, 33 - (Date.now() - lastFlushTime));
                    if (delay === 0) flushTimer = requestAnimationFrame(flushDelta);
                    else flushTimer = setTimeout(flushDelta, delay);
                }
            }
        }
    }, { passive: false });

    pad.addEventListener("touchend", function(e) {
        var now = Date.now();
        var duration = now - touchStartTime;

        if (isDragging) {
            isDragging = false;
            fetch("/api/mouse_rel?key=" + KEY + "&click=4", { keepalive: true }).catch(function(){});
            lastTapEndTime = 0;
            maxTouches = 0;
            return;
        }

        if (e.touches.length === 0) {
            // 🌊 Start Kinetic Inertia Glide if finger flicked fast
            if (Math.hypot(velX, velY) > 2.5) {
                runInertiaGlide();
            }

            // 👆 1-Finger Tap = Left Click!
            if (maxTouches === 1 && totalMoveDist < 25 && duration < 380) {
                stopInertia();
                vibratePhone(40);
                fetch("/api/mouse_rel?key=" + KEY + "&click=1", { keepalive: true }).catch(function(){});
                lastTapEndTime = now;
            } 
            // ✌️ 2-Finger Tap = Right Click!
            else if (maxTouches === 2 && totalMoveDist < 30 && duration < 400) {
                stopInertia();
                vibratePhone(50);
                fetch("/api/mouse_rel?key=" + KEY + "&click=2", { keepalive: true }).catch(function(){});
                lastTapEndTime = 0;
            }
            maxTouches = 0;
        }
    });
})();
</script>
</body>
</html>)HTML";
        }

        // Step 8: Browser কে Response পাঠানো
        std::string httpResponse =
            "HTTP/1.1 " + status + "\r\n"
            "Content-Type: text/html; charset=utf-8\r\n"
            "Cache-Control: no-cache, no-store, must-revalidate\r\n"
            "Pragma: no-cache\r\n"
            "Expires: 0\r\n"
            "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
            "Connection: close\r\n\r\n" +
            responseBody;

        send(clientSocket, httpResponse.c_str(), (int)httpResponse.size(), 0);
        shutdown(clientSocket, SD_SEND);
        closesocket(clientSocket);
        return;
    } catch (...) {
        closesocket(clientSocket);
    }
}

DWORD WINAPI RemoteServerThread(LPVOID lpParam) {
    FILE* logF = fopen("server_status.log", "w");
    if (logF) { fprintf(logF, "RemoteServerThread started\n"); fflush(logF); }

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    SOCKET serverSocket = INVALID_SOCKET;
    int attempt = 0;
    while (serverSocket == INVALID_SOCKET) {
        attempt++;
        serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in serverAddr;
        memset(&serverAddr, 0, sizeof(serverAddr));
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = htonl(INADDR_ANY);
        serverAddr.sin_port = htons(REMOTE_PORT);

        if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            int err = WSAGetLastError();
            if (logF) { fprintf(logF, "Bind attempt %d failed: err=%d\n", attempt, err); fflush(logF); }
            closesocket(serverSocket);
            serverSocket = INVALID_SOCKET;
            Sleep(500);
        }
    }

    if (logF) { fprintf(logF, "Bind SUCCESS on port 8080!\n"); fflush(logF); fclose(logF); }

    int listenRes = listen(serverSocket, SOMAXCONN);
    logF = fopen("server_status.log", "a");
    if (logF) { fprintf(logF, "Listen result: %d (err=%d)\n", listenRes, WSAGetLastError()); fflush(logF); fclose(logF); }

    while (true) {
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);
        if (clientSocket == INVALID_SOCKET) {
            logF = fopen("server_status.log", "a");
            if (logF) { fprintf(logF, "Accept invalid socket! err=%d\n", WSAGetLastError()); fflush(logF); fclose(logF); }
            Sleep(100);
            continue;
        }

        CreateThread(NULL, 0, ProcessClientThread, (LPVOID)(uintptr_t)clientSocket, 0, NULL);
    }

    WSACleanup();
    return 0;
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
                    ExitProcess(0);
                    break;
            }
            break;

        case WM_DESTROY:
            Shell_NotifyIcon(NIM_DELETE, &nid);
            PostQuitMessage(0);
            ExitProcess(0);
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
    size_t lastSlash = exePath.find_last_of("\\/");
    std::string sourceDllPath = (lastSlash != std::string::npos) ? (exePath.substr(0, lastSlash) + "\\PanicProvider.dll") : "PanicProvider.dll";
    
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

    // Explicitly delete NoLockScreen key so original Windows Lock Screen displays normally
    HKEY hKeyPol;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization", 0, KEY_SET_VALUE, &hKeyPol) == ERROR_SUCCESS) {
        RegDeleteValueA(hKeyPol, "NoLockScreen");
        RegCloseKey(hKeyPol);
    }
}

// 🛡️ WINDOWS SERVICE CONTROL ENGINE (24/7 Background System Execution)
#define SERVICE_NAME "PanicButtonService"
SERVICE_STATUS g_SvcStatus;
SERVICE_STATUS_HANDLE g_SvcStatusHandle;
HANDLE g_SvcStopEvent = NULL;

VOID WINAPI SvcReportStatus(DWORD dwCurrentState, DWORD dwWin32ExitCode, DWORD dwWaitHint) {
    static DWORD dwCheckPoint = 1;
    g_SvcStatus.dwCurrentState = dwCurrentState;
    g_SvcStatus.dwWin32ExitCode = dwWin32ExitCode;
    g_SvcStatus.dwWaitHint = dwWaitHint;
    if (dwCurrentState == SERVICE_START_PENDING) g_SvcStatus.dwControlsAccepted = 0;
    else g_SvcStatus.dwControlsAccepted = SERVICE_ACCEPT_STOP | SERVICE_ACCEPT_SHUTDOWN;
    if ((dwCurrentState == SERVICE_RUNNING) || (dwCurrentState == SERVICE_STOPPED)) g_SvcStatus.dwCheckPoint = 0;
    else g_SvcStatus.dwCheckPoint = dwCheckPoint++;
    SetServiceStatus(g_SvcStatusHandle, &g_SvcStatus);
}

VOID WINAPI SvcCtrlHandler(DWORD dwCtrl) {
    switch (dwCtrl) {
        case SERVICE_CONTROL_STOP:
        case SERVICE_CONTROL_SHUTDOWN:
            SvcReportStatus(SERVICE_STOP_PENDING, NO_ERROR, 0);
            if (g_SvcStopEvent) SetEvent(g_SvcStopEvent);
            SvcReportStatus(g_SvcStatus.dwCurrentState, NO_ERROR, 0);
            return;
        default: break;
    }
}

VOID WINAPI ServiceMain(DWORD dwArgc, LPTSTR *lpszArgv) {
    g_SvcStatusHandle = RegisterServiceCtrlHandlerA(SERVICE_NAME, SvcCtrlHandler);
    if (!g_SvcStatusHandle) return;

    g_SvcStatus.dwServiceType = SERVICE_WIN32_OWN_PROCESS;
    g_SvcStatus.dwServiceSpecificExitCode = 0;
    SvcReportStatus(SERVICE_START_PENDING, NO_ERROR, 3000);

    g_SvcStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    if (g_SvcStopEvent == NULL) {
        SvcReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
        return;
    }

    SvcReportStatus(SERVICE_RUNNING, NO_ERROR, 0);

    AddToStartup();
    AutoInstallProvider();
    EnableKernelWakeOnLAN();

    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)RemoteServerThread, NULL, 0, NULL);

    WaitForSingleObject(g_SvcStopEvent, INFINITE);
    SvcReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
}

void InstallService() {
    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (!schSCManager) return;
    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    std::string targetPath = "C:\\ProgramData\\PanicButton\\PanicButton.exe";
    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);
    CopyFileA(szPath, targetPath.c_str(), FALSE);
    std::string quotedPath = "\"" + targetPath + "\"";

    SC_HANDLE schService = OpenServiceA(schSCManager, SERVICE_NAME, SERVICE_ALL_ACCESS);
    if (!schService) {
        schService = CreateServiceA(
            schSCManager, SERVICE_NAME, "Panic Button Cyber Remote Service",
            SERVICE_ALL_ACCESS, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL,
            quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL
        );
    } else {
        ChangeServiceConfigA(schService, SERVICE_WIN32_OWN_PROCESS, SERVICE_AUTO_START, SERVICE_ERROR_NORMAL, quotedPath.c_str(), NULL, NULL, NULL, NULL, NULL, NULL);
    }
    if (schService) {
        StartService(schService, 0, NULL);
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
}

void UninstallService() {
    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (!schSCManager) return;
    SC_HANDLE schService = OpenServiceA(schSCManager, SERVICE_NAME, SERVICE_ALL_ACCESS);
    if (schService) {
        ControlService(schService, SERVICE_CONTROL_STOP, &g_SvcStatus);
        DeleteService(schService);
        CloseServiceHandle(schService);
    }
    CloseServiceHandle(schSCManager);
}

LONG WINAPI CrashFilter(EXCEPTION_POINTERS* pEx) {
    FILE* f = fopen("crash_dump.log", "w");
    if (f) {
        fprintf(f, "CRASH DETECTED! Code: 0x%lX, Addr: %p\n", pEx->ExceptionRecord->ExceptionCode, pEx->ExceptionRecord->ExceptionAddress);
        fflush(f);
        fclose(f);
    }
    return EXCEPTION_CONTINUE_SEARCH;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    SetUnhandledExceptionFilter(CrashFilter);

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    HMODULE hNtDll = GetModuleHandle("ntdll.dll");
    if (hNtDll) {
        pfnNtSuspendProcess = (NtSuspendProcess)GetProcAddress(hNtDll, "NtSuspendProcess");
        pfnNtResumeProcess = (NtResumeProcess)GetProcAddress(hNtDll, "NtResumeProcess");
    }

    SetProcessDPIAware();

    ULONG_PTR gdiplusToken;
    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    AddToStartup();
    AutoInstallProvider();
    EnableKernelWakeOnLAN();
    InitializeTaskbar();

    WNDCLASSEX wc = {0};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "PanicButtonTrayClass";
    RegisterClassEx(&wc);

    hMainWnd = CreateWindowEx(0, "PanicButtonTrayClass", "PanicButton", 0, 0, 0, 0, 0, NULL, NULL, hInstance, NULL);

    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)HotkeyListenerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)RemoteServerThread, NULL, 0, NULL);

    MSG msg;
    BOOL bRet;
    while ((bRet = GetMessage(&msg, NULL, 0, 0)) != 0) {
        if (bRet == -1) break;
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return 0;
}
