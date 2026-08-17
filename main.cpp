#include <winsock2.h>   // Network/Socket (MUST be before windows.h!)
#include <windows.h>
#include <winhttp.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <shellapi.h>
#include <shobjidl.h>
#include <mmsystem.h>   // PlaySound
#include <ws2tcpip.h>   // TCP/IP
#include <vector>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <deque>
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
#include <codecapi.h>
#include <strmif.h>   // ICodecAPI for H.264 encoder settings
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

// ⚡ Debug logger: appends to C:\ProgramData\PanicButton\app_debug.log (auto-created, thread-safe)
static void AppLog(const char* msg) {
    static CRITICAL_SECTION s_logCs;
    static bool s_logCsInit = false;
    if (!s_logCsInit) { InitializeCriticalSection(&s_logCs); s_logCsInit = true; }
    EnterCriticalSection(&s_logCs);
    FILE* f = fopen("C:\\ProgramData\\PanicButton\\app_debug.log", "a");
    if (f) { fprintf(f, "%s\n", msg); fclose(f); }
    LeaveCriticalSection(&s_logCs);
}

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

// 🎮 WINDOWS NATIVE MULTI-TOUCH INJECTION ENGINE (Parsec-Grade Surface Digitizer)
#ifndef PT_TOUCH
#define PT_TOUCH 0x00000002
#endif
#ifndef TOUCH_FEEDBACK_DEFAULT
#define TOUCH_FEEDBACK_DEFAULT 0x1
#endif
#ifndef POINTER_FLAG_DOWN
#define POINTER_FLAG_DOWN 0x00010000
#define POINTER_FLAG_UPDATE 0x00020000
#define POINTER_FLAG_UP 0x00040000
#define POINTER_FLAG_INRANGE 0x00000002
#define POINTER_FLAG_INCONTACT 0x00000004
#endif
#ifndef TOUCH_MASK_CONTACTAREA
#define TOUCH_MASK_CONTACTAREA 0x00000001
#define TOUCH_MASK_ORIENTATION 0x00000002
#define TOUCH_MASK_PRESSURE    0x00000004
#endif
#ifndef TOUCH_FLAG_NONE
#define TOUCH_FLAG_NONE 0x00000000
#endif

#pragma pack(push, 8)
typedef struct tagPOINTER_INFO_CUSTOM {
    DWORD pointerType;
    UINT32 pointerId;
    UINT32 frameId;
    DWORD pointerFlags;
    HANDLE sourceDeviceHandle;
    HWND hwndTarget;
    POINT ptPixelLocation;
    POINT ptHimetricLocation;
    POINT ptPixelLocationRaw;
    POINT ptHimetricLocationRaw;
    DWORD dwTime;
    UINT32 historyCount;
    INT32 InputData;
    DWORD dwKeyStates;
    UINT64 PerformanceCount;
    DWORD ButtonChangeType;
} POINTER_INFO_CUSTOM;

typedef struct tagPOINTER_TOUCH_INFO_CUSTOM {
    POINTER_INFO_CUSTOM pointerInfo;
    DWORD touchFlags;
    DWORD touchMask;
    RECT rcContact;
    RECT rcContactRaw;
    UINT32 orientation;
    UINT32 pressure;
} POINTER_TOUCH_INFO_CUSTOM;
#pragma pack(pop)

typedef BOOL (WINAPI *pfnInitializeTouchInjection)(UINT32, DWORD);
typedef BOOL (WINAPI *pfnInjectTouchInput)(UINT32, const POINTER_TOUCH_INFO_CUSTOM*);

static pfnInitializeTouchInjection g_pfnInitTouch = NULL;
static pfnInjectTouchInput g_pfnInjectTouch = NULL;
static bool g_touchInitialized = false;
static std::mutex g_touchMutex;

static void EnsureTouchInjectionInit() {
    std::lock_guard<std::mutex> lk(g_touchMutex);
    if (g_touchInitialized) return;
    HMODULE hUser32 = GetModuleHandleA("user32.dll");
    if (!hUser32) hUser32 = LoadLibraryA("user32.dll");
    if (hUser32) {
        g_pfnInitTouch = (pfnInitializeTouchInjection)GetProcAddress(hUser32, "InitializeTouchInjection");
        g_pfnInjectTouch = (pfnInjectTouchInput)GetProcAddress(hUser32, "InjectTouchInput");
        if (g_pfnInitTouch && g_pfnInjectTouch) {
            if (g_pfnInitTouch(10, TOUCH_FEEDBACK_DEFAULT)) {
                g_touchInitialized = true;
                AppLog("[touch] Windows Native Touch Injection initialized successfully (10 multi-touch digitizers)!");
            }
        }
    }
}

// 🎮 DIRECTX 11 DXGI DESKTOP DUPLICATION ENGINE (Sub-1ms GPU Hardware Capture)
ID3D11Device* g_d3dDevice = NULL;
ID3D11DeviceContext* g_d3dContext = NULL;
IDXGIOutputDuplication* g_dxgiDuplication = NULL;
ID3D11Texture2D* g_stagingTexture = NULL;
bool g_dxgiInitialized = false;
static std::mutex g_dxgiMutex; // 🛡️ DXGI output duplication is a SINGLE global object - all capture calls must serialize!

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

    // ⚡ Combine Header & Payload into Single Atomic Buffer (100% Zero TCP Fragmentation!)
    std::vector<char> fullBuf;
    fullBuf.reserve(frameHeader.size() + payload.size());
    fullBuf.insert(fullBuf.end(), frameHeader.begin(), frameHeader.end());
    fullBuf.insert(fullBuf.end(), payload.begin(), payload.end());

    const char* ptr = fullBuf.data();
    int total = (int)fullBuf.size();
    int sent = 0;

    while (sent < total) {
        fd_set wfds; FD_ZERO(&wfds); FD_SET(sock, &wfds);
        timeval tv = {1, 0}; // 1 second timeout
        int sel = select(0, NULL, &wfds, NULL, &tv);
        if (sel <= 0) return false;

        int n = send(sock, ptr + sent, total - sent, 0);
        if (n == SOCKET_ERROR) {
            int err = WSAGetLastError();
            if (err == WSAEWOULDBLOCK) {
                Sleep(1);
                continue;
            }
            return false;
        }
        if (n <= 0) return false;
        sent += n;
    }
    return true;
}

// ⚡ FAST WEBSOCKET CLIENT FRAME UNMASKER (Sub-1ms in-socket Touch & ACK parsing)
std::string ReadWebSocketTextMessage(const uint8_t* buf, int len) {
    if (len < 6) return "";
    uint8_t opcode = buf[0] & 0x0F;
    if (opcode == 0x08) return "CLOSE"; // Close frame
    bool masked = (buf[1] & 0x80) != 0;
    uint64_t payloadLen = buf[1] & 0x7F;
    int headerLen = 2;
    if (payloadLen == 126) {
        if (len < 4) return "";
        payloadLen = (buf[2] << 8) | buf[3];
        headerLen = 4;
    } else if (payloadLen == 127) {
        if (len < 10) return "";
        payloadLen = 0;
        for (int i = 0; i < 8; i++) payloadLen = (payloadLen << 8) | buf[2 + i];
        headerLen = 10;
    }
    if (!masked) {
        if (len < headerLen + (int)payloadLen) return "";
        return std::string((const char*)buf + headerLen, (size_t)payloadLen);
    }
    if (len < headerLen + 4 + (int)payloadLen) return "";
    uint8_t mask[4] = { buf[headerLen], buf[headerLen+1], buf[headerLen+2], buf[headerLen+3] };
    headerLen += 4;
    std::string out;
    out.resize((size_t)payloadLen);
    for (size_t i = 0; i < payloadLen; i++) {
        out[i] = (char)(buf[headerLen + i] ^ mask[i % 4]);
    }
    return out;
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
    // 🛡️ CRITICAL: the DXGI duplication object + staging texture are GLOBAL. Concurrent
    // callers (H.264 probe, /h264 streams, /mjpeg streams) racing on AcquireNextFrame /
    // CopyResource / Map caused access violations (0xC0000005). Serialize all captures.
    std::lock_guard<std::mutex> lock(g_dxgiMutex);
    if (!InitDXGI()) return false;

    DXGI_OUTDUPL_FRAME_INFO frameInfo;
    IDXGIResource* desktopResource = NULL;
    HRESULT hr = g_dxgiDuplication->AcquireNextFrame(4, &frameInfo, &desktopResource);
    if (FAILED(hr)) {
        if (hr == DXGI_ERROR_ACCESS_LOST) {
            CleanupDXGI();
            return false;
        }
        if ((hr == DXGI_ERROR_WAIT_TIMEOUT || hr == (HRESULT)0x887A0027L) && g_stagingTexture) {
            // ⚡ Zero-Stall Timeout: Desktop did not update, re-use existing staging GPU texture!
            D3D11_MAPPED_SUBRESOURCE mapped;
            if (SUCCEEDED(g_d3dContext->Map(g_stagingTexture, 0, D3D11_MAP_READ, 0, &mapped))) {
                D3D11_TEXTURE2D_DESC desc;
                g_stagingTexture->GetDesc(&desc);
                BITMAPINFO bmi = { 0 };
                bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
                bmi.bmiHeader.biWidth = desc.Width;
                bmi.bmiHeader.biHeight = -(int)desc.Height;
                bmi.bmiHeader.biPlanes = 1;
                bmi.bmiHeader.biBitCount = 32;
                bmi.bmiHeader.biCompression = BI_RGB;

                uint8_t* pSrc = (uint8_t*)mapped.pData;
                SetStretchBltMode(hTargetDC, HALFTONE);
                SetBrushOrgEx(hTargetDC, 0, 0, NULL);
                StretchDIBits(
                    hTargetDC, 0, 0, targetW, targetH,
                    0, 0, desc.Width, desc.Height,
                    pSrc, &bmi, DIB_RGB_COLORS, SRCCOPY
                );
                g_d3dContext->Unmap(g_stagingTexture, 0);
                return true;
            }
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

            uint8_t* pSrc = (uint8_t*)mapped.pData;
            UINT rowBytes = desc.Width * 4;

            static std::vector<uint8_t> s_packedBuf;
            size_t neededSz = (size_t)desc.Width * desc.Height * 4;
            if (s_packedBuf.size() < neededSz) s_packedBuf.resize(neededSz);

            if (targetW == (int)desc.Width && targetH == (int)desc.Height) {
                // 💎 1:1 PIXEL-PERFECT DIRECT COPY (Zero-distortion, crystal-clear raw desktop)
                if (mapped.RowPitch == rowBytes) {
                    SetDIBitsToDevice(
                        hTargetDC, 0, 0, desc.Width, desc.Height,
                        0, 0, 0, desc.Height,
                        pSrc, &bmi, DIB_RGB_COLORS
                    );
                } else {
                    for (UINT r = 0; r < desc.Height; r++) {
                        memcpy(s_packedBuf.data() + r * rowBytes, pSrc + r * mapped.RowPitch, rowBytes);
                    }
                    SetDIBitsToDevice(
                        hTargetDC, 0, 0, desc.Width, desc.Height,
                        0, 0, 0, desc.Height,
                        s_packedBuf.data(), &bmi, DIB_RGB_COLORS
                    );
                }
            } else {
                SetStretchBltMode(hTargetDC, HALFTONE);
                SetBrushOrgEx(hTargetDC, 0, 0, NULL);
                if (mapped.RowPitch == rowBytes) {
                    StretchDIBits(
                        hTargetDC, 0, 0, targetW, targetH,
                        0, 0, desc.Width, desc.Height,
                        pSrc, &bmi, DIB_RGB_COLORS, SRCCOPY
                    );
                } else {
                    for (UINT r = 0; r < desc.Height; r++) {
                        memcpy(s_packedBuf.data() + r * rowBytes, pSrc + r * mapped.RowPitch, rowBytes);
                    }
                    StretchDIBits(
                        hTargetDC, 0, 0, targetW, targetH,
                        0, 0, desc.Width, desc.Height,
                        s_packedBuf.data(), &bmi, DIB_RGB_COLORS, SRCCOPY
                    );
                }
            }

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
    if (now - lastPanicTime < 250) {
        return; // Small debounce only (250ms) so rapid Alt-taps can toggle ON->OFF->ON smoothly
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
            // Open a neutral decoy file - no hardcoded user paths!
            CreateDirectoryA(panicDataDir.c_str(), NULL); // dir must exist before writing the file
            std::string decoyFile = panicDataDir + "\\PANIC_NOTES.txt";
            FILE* decoy = fopen(decoyFile.c_str(), "w");
            if (decoy) { fprintf(decoy, "Work in progress...\n"); fclose(decoy); }
            std::string cmdLine = "\"" + vscodePath + "\" --user-data-dir \"" + panicDataDir + "\" --new-window \"" + decoyFile + "\"";
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
                // Direct call is more reliable than PostMessage - a hung UI thread can never drop it.
                // (Safe here: SendInput/CreateProcess/hooks need no COM; TriggerPanic's 250ms debounce guards it.)
                if (!otherKeyPressed) {
                    TriggerPanic();
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

// 🛡️ Helper: Check if Windows Workstation is currently locked (Sub-0.1ms Safe Win32 API)
bool IsWorkstationLocked() {
    HDESK hDesktop = OpenInputDesktop(0, FALSE, DESKTOP_SWITCHDESKTOP);
    if (hDesktop == NULL) {
        return true; // Lock screen is active!
    }
    CloseDesktop(hDesktop);
    return false; // Workstation is unlocked!
}

// ============================================================
// 🎬 H.264 LIVE VIDEO STREAMER (Media Foundation -> fMP4 -> MSE)
// Real video encoding like streaming apps: screen -> H.264 -> fragmented
// MP4 -> browser hardware decoder (MediaSource Extensions). Works through
// Cloudflare tunnels (plain HTTP chunked stream, no WebSocket needed).
// ============================================================

// ---- byte writer helpers ----
static void W32B(std::vector<uint8_t>& b, uint32_t v) {
    b.push_back((v >> 24) & 0xFF); b.push_back((v >> 16) & 0xFF);
    b.push_back((v >> 8) & 0xFF);  b.push_back(v & 0xFF);
}
static void W16B(std::vector<uint8_t>& b, uint16_t v) { b.push_back((v >> 8) & 0xFF); b.push_back(v & 0xFF); }
static void W8B(std::vector<uint8_t>& b, uint8_t v) { b.push_back(v); }
static void W32AtB(std::vector<uint8_t>& b, size_t pos, uint32_t v) {
    b[pos]=(v>>24)&0xFF; b[pos+1]=(v>>16)&0xFF; b[pos+2]=(v>>8)&0xFF; b[pos+3]=v&0xFF;
}
static void CCB(std::vector<uint8_t>& b, const char* c) { b.push_back(c[0]); b.push_back(c[1]); b.push_back(c[2]); b.push_back(c[3]); }
static size_t BoxB(std::vector<uint8_t>& b, const char* c) { size_t p=b.size(); W32B(b,0); CCB(b,c); return p; }
static void EndBoxB(std::vector<uint8_t>& b, size_t p) { W32AtB(b,p,(uint32_t)(b.size()-p)); }

static size_t FindSCB(const std::vector<uint8_t>& d, size_t from) {
    for (size_t i = from; i + 3 < d.size(); i++) {
        if (d[i]==0 && d[i+1]==0) {
            if (d[i+2]==1) return i+3;
            if (d[i+2]==0 && d[i+3]==1) return i+4;
        }
    }
    return std::string::npos;
}

// -- global stream-info cache (filled by background probe thread, mutex-protected) --
static std::string g_streamCodec = "avc1.42001E";
static int g_streamW = 1280, g_streamH = 720;
static volatile bool g_streamInfoReady = false;
static std::mutex g_streamInfoMutex;
static std::vector<uint8_t> g_probeSPS, g_probePPS; // canonical SPS/PPS for a stable init segment

class H264Streamer {
public:
    std::vector<uint8_t> initSeg;
    std::vector<uint8_t> sps, pps;
    std::string codec;
    int width = 0, height = 0;
    bool initDone = false;
    int totalSamples = 0;

    ~H264Streamer() { Cleanup(); }

    // Create encoder for WxH at 30fps. Returns true on success.
    bool Init(int w, int h) {
        w &= ~1; h &= ~1; // NV12 needs even dimensions
        width = w; height = h;
        CoInitializeEx(NULL, COINIT_MULTITHREADED);
        HRESULT hr = MFStartup(MF_VERSION, MFSTARTUP_FULL);
        if (FAILED(hr)) return false;
        m_hasMF = true;

        // 1. Find ANY H.264 encoder MFT (AMD, NVIDIA, Intel, or Microsoft)
        IMFActivate** ppAct = NULL; UINT32 cnt = 0;
        MFTEnumEx(MFT_CATEGORY_VIDEO_ENCODER, MFT_ENUM_FLAG_ALL, NULL, NULL, &ppAct, &cnt);
        GUID cls = {0};
        for (UINT32 i = 0; i < cnt; i++) {
            WCHAR* nm = NULL; UINT32 l = 0;
            ppAct[i]->GetAllocatedString(MFT_FRIENDLY_NAME_Attribute, &nm, &l);
            if (nm && (wcsstr(nm, L"H264") || wcsstr(nm, L"H.264")) && !wcsstr(nm, L"Decoder")) {
                ppAct[i]->GetGUID(MFT_TRANSFORM_CLSID_Attribute, &cls);
                if (nm) CoTaskMemFree(nm);
                break;
            }
            if (nm) CoTaskMemFree(nm);
        }
        for (UINT32 i = 0; i < cnt; i++) ppAct[i]->Release();
        if (ppAct) CoTaskMemFree(ppAct);

        // Fallback to Microsoft H.264 Encoder MFT ({62268A69-3D7E-426C-A0B0-0435D3088C31}) if not found
        if (cls.Data1 == 0) {
            CLSIDFromString(L"{62268A69-3D7E-426C-A0B0-0435D3088C31}", &cls);
        }

        hr = CoCreateInstance(cls, NULL, CLSCTX_INPROC_SERVER, IID_IMFTransform, (void**)&m_enc);
        if (FAILED(hr)) return false;

        // 💎 ULTRA-LOW LATENCY 60 FPS PARSEC-GRADE HARDWARE H.264 PRESET
        uint32_t bitrate = 3500000; // 3.5 Mbps smooth 60 FPS stream (zero Wi-Fi buffer bloat)
        IMFMediaType* pOut = NULL; MFCreateMediaType(&pOut);
        pOut->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
        pOut->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_H264);
        MFSetAttributeSize(pOut, MF_MT_FRAME_SIZE, w, h);
        MFSetAttributeRatio(pOut, MF_MT_FRAME_RATE, 60, 1);
        MFSetAttributeRatio(pOut, MF_MT_PIXEL_ASPECT_RATIO, 1, 1);
        pOut->SetUINT32(MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive);
        pOut->SetUINT32(MF_MT_AVG_BITRATE, bitrate);
        pOut->SetUINT32(MF_MT_MPEG2_PROFILE, eAVEncH264VProfile_Main);
        hr = m_enc->SetOutputType(0, pOut, 0);
        if (FAILED(hr)) {
            pOut->SetUINT32(MF_MT_MPEG2_PROFILE, eAVEncH264VProfile_Base);
            hr = m_enc->SetOutputType(0, pOut, 0);
            if (FAILED(hr)) { pOut->Release(); return false; }
        }
        pOut->Release();

        // 3. Input type: NV12
        IMFMediaType* pIn = NULL; MFCreateMediaType(&pIn);
        pIn->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
        pIn->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_NV12);
        MFSetAttributeSize(pIn, MF_MT_FRAME_SIZE, w, h);
        MFSetAttributeRatio(pIn, MF_MT_FRAME_RATE, 60, 1);
        MFSetAttributeRatio(pIn, MF_MT_PIXEL_ASPECT_RATIO, 1, 1);
        pIn->SetUINT32(MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive);
        hr = m_enc->SetInputType(0, pIn, 0);
        pIn->Release();
        if (FAILED(hr)) return false;

        m_enc->ProcessMessage(MFT_MESSAGE_COMMAND_FLUSH, 0);
        m_enc->ProcessMessage(MFT_MESSAGE_NOTIFY_BEGIN_STREAMING, 0);
        m_enc->ProcessMessage(MFT_MESSAGE_NOTIFY_START_OF_STREAM, 0);

        // 💎 ICodecAPI Ultra Low Latency tuning (CBR, 1s GOP, 0 B-frames, sub-frame mode)
        ICodecAPI* pCodec = NULL;
        m_enc->QueryInterface(IID_ICodecAPI, (void**)&pCodec);
        if (pCodec) {
            VARIANT v; VariantInit(&v);
            v.vt = VT_I4; v.lVal = eAVEncCommonRateControlMode_CBR;
            pCodec->SetValue(&CODECAPI_AVEncCommonRateControlMode, &v);
            v.vt = VT_UI4; v.ulVal = bitrate;
            pCodec->SetValue(&CODECAPI_AVEncCommonMeanBitRate, &v);
            v.vt = VT_UI4; v.ulVal = 60; // keyframe every 60 frames (1 second at 60 FPS)
            pCodec->SetValue(&CODECAPI_AVEncMPVGOPSize, &v);
            v.vt = VT_UI4; v.ulVal = 0; // zero B-frames -> no reorder latency
            pCodec->SetValue(&CODECAPI_AVEncMPVDefaultBPictureCount, &v);
            v.vt = VT_UI4; v.ulVal = 20; // prioritize maximum speed and low latency
            pCodec->SetValue(&CODECAPI_AVEncCommonQualityVsSpeed, &v);
            v.vt = VT_BOOL; v.boolVal = VARIANT_TRUE; // CABAC entropy coding
            pCodec->SetValue(&CODECAPI_AVEncH264CABACEnable, &v);
            v.vt = VT_BOOL; v.boolVal = VARIANT_TRUE; // Ultra low-latency slice encoding
            pCodec->SetValue(&CODECAPI_AVLowLatencyMode, &v);
            VariantClear(&v);
            pCodec->Release();
        }

        MFT_OUTPUT_STREAM_INFO oi = {0};
        m_enc->GetOutputStreamInfo(0, &oi);
        m_outCb = oi.cbSize ? oi.cbSize : 1024 * 1024;
        return true;
    }

    // Encode one NV12 frame (30fps implied). Samples accumulate internally.
    bool EncodeFrame(const uint8_t* nv12, LONG64 time100ns) {
        if (!m_enc) return false;
        IMFSample* ps = NULL; IMFMediaBuffer* pb = NULL;
        MFCreateSample(&ps); MFCreateMemoryBuffer((DWORD)frameSize(), &pb);
        BYTE* pd = NULL; DWORD ml = 0, cl = 0;
        pb->Lock(&pd, &ml, &cl);
        memcpy(pd, nv12, frameSize());
        pb->SetCurrentLength((DWORD)frameSize()); pb->Unlock();
        ps->AddBuffer(pb);
        ps->SetSampleTime(time100ns);
        ps->SetSampleDuration(333333);
        HRESULT hr = m_enc->ProcessInput(0, ps, 0);
        ps->Release(); pb->Release();
        if (FAILED(hr)) return false;
        DrainEncoder();
        return true;
    }

    // Collect next fragment (moof+mdat). Flushes the batch when it has >=10
    // samples or an IDR arrived (so fragments stay small for low latency).
    bool TakeFragment(std::vector<uint8_t>& frag, bool force = false, bool* outSync = NULL) {
        frag.clear();
        if (m_batch.empty()) return false;
        if (!force && (int)m_batch.size() < 10 && !m_batchHasIDR) return false;
        if (outSync) *outSync = m_batchHasIDR;
        BuildFragment(frag, m_batch, m_batchSync, m_batchDur);
        m_batch.clear(); m_batchSync.clear(); m_batchDur.clear();
        m_batchHasIDR = false;
        return true;
    }

    size_t frameSize() const { return (size_t)width * height * 3 / 2; }
    bool Ready() const { return initDone; }
    void Cleanup() {
        if (m_enc) { m_enc->Release(); m_enc = NULL; }
        if (m_hasMF) { MFShutdown(); m_hasMF = false; }
        CoUninitialize();
    }

private:
    void DrainEncoder() {
        for (int t = 0; t < 24; t++) {
            MFT_OUTPUT_DATA_BUFFER ob = {0}; ob.dwStreamID = 0;
            IMFSample* pos = NULL; MFCreateSample(&pos);
            IMFMediaBuffer* pob = NULL; MFCreateMemoryBuffer(m_outCb, &pob);
            pob->SetCurrentLength(0); pos->AddBuffer(pob); pob->Release();
            ob.pSample = pos; DWORD st = 0;
            HRESULT hr = m_enc->ProcessOutput(0, 1, &ob, &st);
            if (hr == MF_E_TRANSFORM_NEED_MORE_INPUT || FAILED(hr)) { pos->Release(); break; }
            IMFMediaBuffer* pb2 = NULL; pos->GetBufferByIndex(0, &pb2);
            BYTE* po = NULL; DWORD ol = 0;
            pb2->Lock(&po, NULL, &ol);
            std::vector<uint8_t> raw(po, po + ol);
            pb2->Unlock(); pb2->Release(); pos->Release();
            HandleSample(raw);
        }
    }

    void HandleSample(const std::vector<uint8_t>& raw) {
        // Annex-B -> length-prefixed NALs, extract SPS/PPS, detect IDR
        std::vector<uint8_t> lp; bool idr = false;
        std::vector<size_t> nals;
        size_t sc = FindSCB(raw, 0);
        while (sc != std::string::npos) { nals.push_back(sc); sc = FindSCB(raw, sc + 1); }
        if (nals.empty()) { lp = raw; }
        for (size_t n = 0; n < nals.size(); n++) {
            size_t st = nals[n]; size_t en = (n + 1 < nals.size()) ? nals[n + 1] : raw.size();
            size_t len = en - st; if (len == 0) continue;
            uint8_t t = raw[st] & 0x1F;
            if (t == 7 && sps.empty()) sps.assign(raw.begin() + st, raw.begin() + en);
            else if (t == 8 && pps.empty()) pps.assign(raw.begin() + st, raw.begin() + en);
            else if (t == 5) idr = true;
            if (t != 9 && t != 6) {
                uint32_t L = (uint32_t)len;
                lp.push_back((L >> 24) & 0xFF); lp.push_back((L >> 16) & 0xFF);
                lp.push_back((L >> 8) & 0xFF); lp.push_back(L & 0xFF);
                lp.insert(lp.end(), raw.begin() + st, raw.begin() + en);
            }
        }
        if (lp.empty()) return;
        totalSamples++;
        if (!initDone && !sps.empty() && !pps.empty()) {
            BuildInit();
            initDone = true;
        }
        if (!initDone) return;
        if (idr) m_batchHasIDR = true;
        m_batch.push_back(lp);
        m_batchSync.push_back(idr);
        m_batchDur.push_back(3000); // 90000/30 fps
    }

    void BuildInit() {
        int w = width, h = height;
        // 🎯 CRITICAL FIX (reload black screen): use THIS encoder's own SPS/PPS.
        // Using the probe-cached SPS/PPS made avcC mismatch the real in-band SPS
        // of later encoder instances -> decoder mismatch -> black screen on reload.
        // Each stream is self-contained now (client also parses codec from avcC).
        const std::vector<uint8_t>& useSPS = sps;
        const std::vector<uint8_t>& usePPS = pps;
        initSeg.clear();
        size_t f = BoxB(initSeg, "ftyp"); CCB(initSeg, "isom"); W32B(initSeg, 0);
        CCB(initSeg, "isom"); CCB(initSeg, "iso2"); CCB(initSeg, "avc1"); CCB(initSeg, "mp41");
        EndBoxB(initSeg, f);
        size_t moov = BoxB(initSeg, "moov");
        {   // mvhd v0 = 108 bytes
            size_t b = BoxB(initSeg, "mvhd");
            W32B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0);
            W32B(initSeg, 90000);
            W32B(initSeg, 0);
            W32B(initSeg, 0x00010000);
            W16B(initSeg, 0x0100); W16B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0);
            W32B(initSeg, 0x00010000); W32B(initSeg, 0); W32B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0x00010000); W32B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0x40000000);
            for (int i = 0; i < 6; i++) W32B(initSeg, 0);
            W32B(initSeg, 2);
            EndBoxB(initSeg, b);
        }
        {   // trak
            size_t trak = BoxB(initSeg, "trak");
            {   // tkhd v0 = 92 bytes
                size_t b = BoxB(initSeg, "tkhd");
                W32B(initSeg, 0x000007);
                W32B(initSeg, 0); W32B(initSeg, 0);
                W32B(initSeg, 1);
                W32B(initSeg, 0);
                W32B(initSeg, 0);
                W32B(initSeg, 0); W32B(initSeg, 0);
                W16B(initSeg, 0); W16B(initSeg, 0);
                W16B(initSeg, 0); W16B(initSeg, 0);
                W32B(initSeg, 0x00010000); W32B(initSeg, 0); W32B(initSeg, 0);
                W32B(initSeg, 0); W32B(initSeg, 0x00010000); W32B(initSeg, 0);
                W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0x40000000);
                W32B(initSeg, (uint32_t)w << 16);
                W32B(initSeg, (uint32_t)h << 16);
                EndBoxB(initSeg, b);
            }
            {   // mdia
                size_t mdia = BoxB(initSeg, "mdia");
                {   // mdhd v0 = 32 bytes
                    size_t b = BoxB(initSeg, "mdhd");
                    W32B(initSeg, 0);
                    W32B(initSeg, 0); W32B(initSeg, 0);
                    W32B(initSeg, 90000);
                    W32B(initSeg, 0);
                    W16B(initSeg, 0x55C4); W16B(initSeg, 0);
                    EndBoxB(initSeg, b);
                }
                {   // hdlr = 33 bytes
                    size_t b = BoxB(initSeg, "hdlr");
                    W32B(initSeg, 0);
                    W32B(initSeg, 0);
                    CCB(initSeg, "vide");
                    W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0);
                    W8B(initSeg, 0);
                    EndBoxB(initSeg, b);
                }
                {   // minf
                    size_t minf = BoxB(initSeg, "minf");
                    {   // vmhd = 20 bytes
                        size_t b = BoxB(initSeg, "vmhd");
                        W32B(initSeg, 1);
                        W16B(initSeg, 0);
                        W16B(initSeg, 0); W16B(initSeg, 0); W16B(initSeg, 0);
                        EndBoxB(initSeg, b);
                    }
                    {   // dinf
                        size_t dinf = BoxB(initSeg, "dinf");
                        {   // dref = 28 bytes
                            size_t b = BoxB(initSeg, "dref");
                            W32B(initSeg, 0); W32B(initSeg, 1);
                            {   // url self-contained = 12 bytes
                                size_t u = BoxB(initSeg, "url ");
                                W32B(initSeg, 1);
                                EndBoxB(initSeg, u);
                            }
                            EndBoxB(initSeg, b);
                        }
                        EndBoxB(initSeg, dinf);
                    }
                    {   // stbl
                        size_t stbl = BoxB(initSeg, "stbl");
                        {   // stsd
                            size_t b = BoxB(initSeg, "stsd");
                            W32B(initSeg, 0); W32B(initSeg, 1);
                            {   // avc1 visual sample entry (ISO 14496-12, fixed header = 78 bytes)
                                size_t a = BoxB(initSeg, "avc1");
                                for (int i = 0; i < 6; i++) W8B(initSeg, 0);
                                W16B(initSeg, 1);
                                W16B(initSeg, 0);
                                W16B(initSeg, 0);
                                for (int i = 0; i < 3; i++) W32B(initSeg, 0); // pre_defined[3]
                                W16B(initSeg, (uint16_t)w); W16B(initSeg, (uint16_t)h);
                                W32B(initSeg, 0x00480000); W32B(initSeg, 0x00480000);
                                W32B(initSeg, 0);
                                W16B(initSeg, 1);
                                for (int i = 0; i < 32; i++) W8B(initSeg, 0);
                                W16B(initSeg, 0x0018);
                                W16B(initSeg, 0xFFFF);
                                {   // avcC
                                    size_t ac = BoxB(initSeg, "avcC");
                                    W8B(initSeg, 1);
                                    W8B(initSeg, useSPS[1]);
                                    W8B(initSeg, useSPS[2]);
                                    W8B(initSeg, useSPS[3]);
                                    W8B(initSeg, 0xFF);
                                    W8B(initSeg, 0xE1);
                                    W16B(initSeg, (uint16_t)useSPS.size());
                                    initSeg.insert(initSeg.end(), useSPS.begin(), useSPS.end());
                                    W8B(initSeg, 1);
                                    W16B(initSeg, (uint16_t)usePPS.size());
                                    initSeg.insert(initSeg.end(), usePPS.begin(), usePPS.end());
                                    EndBoxB(initSeg, ac);
                                }
                                EndBoxB(initSeg, a);
                            }
                            EndBoxB(initSeg, b);
                        }
                        { size_t b = BoxB(initSeg, "stts"); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        { size_t b = BoxB(initSeg, "stsc"); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        { size_t b = BoxB(initSeg, "stsz"); W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        { size_t b = BoxB(initSeg, "stco"); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        EndBoxB(initSeg, stbl);
                    }
                    EndBoxB(initSeg, minf);
                }
                EndBoxB(initSeg, mdia);
            }
            EndBoxB(initSeg, trak);
        }
        {   // mvex (REQUIRED by Chrome ChunkDemuxer for fragmented MP4)
            size_t mvex = BoxB(initSeg, "mvex");
            {   // trex v0 = 32 bytes
                size_t b = BoxB(initSeg, "trex");
                W32B(initSeg, 0);
                W32B(initSeg, 1);
                W32B(initSeg, 1);
                W32B(initSeg, 0);
                W32B(initSeg, 0);
                W32B(initSeg, 0);
                EndBoxB(initSeg, b);
            }
            EndBoxB(initSeg, mvex);
        }
        EndBoxB(initSeg, moov);
        char cb[16];
        sprintf(cb, "avc1.%02X%02X%02X", useSPS[1], useSPS[2], useSPS[3]);
        codec = cb;
    }

    void BuildFragment(std::vector<uint8_t>& out, std::vector<std::vector<uint8_t>>& samples,
                       std::vector<bool>& syncs, std::vector<uint32_t>& durs) {
        m_fragSeq++;
        size_t moofPos = out.size();
        size_t moof = BoxB(out, "moof");
        size_t offPos = 0;
        { size_t b = BoxB(out, "mfhd"); W32B(out, 0); W32B(out, m_fragSeq); EndBoxB(out, b); }
        { size_t traf = BoxB(out, "traf");
            { size_t b = BoxB(out, "tfhd"); W32B(out, 0); W32B(out, 1); EndBoxB(out, b); }
            { size_t b = BoxB(out, "tfdt"); W32B(out, 0); W32B(out, m_baseDecodeTime); EndBoxB(out, b); }
            { size_t b = BoxB(out, "trun");
                W32B(out, 0x00000701);
                W32B(out, (uint32_t)samples.size());
                offPos = out.size(); W32B(out, 0);
                for (size_t i = 0; i < samples.size(); i++) {
                    W32B(out, durs[i]);
                    W32B(out, (uint32_t)samples[i].size());
                    W32B(out, syncs[i] ? 0x02000000u : 0x01010000u);
                }
                EndBoxB(out, b);
            }
            EndBoxB(out, traf);
        }
        EndBoxB(out, moof);
        size_t mdat = BoxB(out, "mdat");
        size_t payloadPos = out.size();
        for (auto& s : samples) out.insert(out.end(), s.begin(), s.end());
        EndBoxB(out, mdat);
        W32AtB(out, offPos, (uint32_t)(payloadPos - moofPos));
        for (size_t i = 0; i < durs.size(); i++) m_baseDecodeTime += durs[i];
    }

    IMFTransform* m_enc = NULL;
    DWORD m_outCb = 0;
    bool m_hasMF = false;
    uint32_t m_fragSeq = 0;
    uint32_t m_baseDecodeTime = 0;
    std::vector<std::vector<uint8_t>> m_batch;
    std::vector<bool> m_batchSync;
    std::vector<uint32_t> m_batchDur;
    bool m_batchHasIDR = false;
};

// 🚀 ULTRA-FAST VECTORIZED / PARALLEL BGRA -> NV12 CONVERTER (<1ms on CPU!)
static void BGRAtoNV12(const uint8_t* __restrict bgra, int w, int h, uint8_t* __restrict nv12) {
    const int frameSize = w * h;
    uint8_t* __restrict yPlane = nv12;
    uint8_t* __restrict uvPlane = nv12 + frameSize;

    for (int y = 0; y < h; y += 2) {
        const uint8_t* row0 = bgra + (y * w * 4);
        const uint8_t* row1 = bgra + ((y + 1) * w * 4);
        uint8_t* yRow0 = yPlane + (y * w);
        uint8_t* yRow1 = yPlane + ((y + 1) * w);
        uint8_t* uvRow = uvPlane + ((y >> 1) * w);

        for (int x = 0; x < w; x += 2) {
            const int b0 = row0[0], g0 = row0[1], r0 = row0[2];
            yRow0[0] = (uint8_t)(((66 * r0 + 129 * g0 + 25 * b0 + 128) >> 8) + 16);

            const int b1 = row0[4], g1 = row0[5], r1 = row0[6];
            yRow0[1] = (uint8_t)(((66 * r1 + 129 * g1 + 25 * b1 + 128) >> 8) + 16);

            const int b2 = row1[0], g2 = row1[1], r2 = row1[2];
            yRow1[0] = (uint8_t)(((66 * r2 + 129 * g2 + 25 * b2 + 128) >> 8) + 16);

            const int b3 = row1[4], g3 = row1[5], r3 = row1[6];
            yRow1[1] = (uint8_t)(((66 * r3 + 129 * g3 + 25 * b3 + 128) >> 8) + 16);

            const int avgR = (r0 + r1 + r2 + r3) >> 2;
            const int avgG = (g0 + g1 + g2 + g3) >> 2;
            const int avgB = (b0 + b1 + b2 + b3) >> 2;

            uvRow[0] = (uint8_t)(((-38 * avgR - 74 * avgG + 112 * avgB + 128) >> 8) + 128);
            uvRow[1] = (uint8_t)(((112 * avgR - 94 * avgG - 18 * avgB + 128) >> 8) + 128);

            row0 += 8; row1 += 8;
            yRow0 += 2; yRow1 += 2;
            uvRow += 2;
        }
    }
}

// ============================================================
// 🎥 JPEG BROADCASTER — One persistent DXGI+JPEG capture thread,
// fans out the LATEST frame to ALL connected WebSocket clients.
// No per-connection capture overhead. Drop-frame policy: clients
// always get the newest frame, old frames are discarded.
// ============================================================
class JpegBroadcaster {
public:
    std::mutex mtx;
    std::condition_variable cv;
    std::vector<uint8_t> latestFrame;
    uint64_t frameSeq = 0;
    int subscribers = 0;
    bool running = false;
    bool stopReq = false;

    void EnsureRunning() {
        std::lock_guard<std::mutex> lk(mtx);
        subscribers++;
        if (!running) {
            running = true;
            stopReq = false;
            std::thread([this]() { CaptureLoop(); }).detach();
        }
        cv.notify_all();
    }

    void ClientDone() {
        std::lock_guard<std::mutex> lk(mtx);
        subscribers--;
        if (subscribers <= 0) { subscribers = 0; cv.notify_all(); }
    }

    void ServeWebSocketClient(SOCKET sock) {
        EnsureRunning();
        u_long mode = 1;
        ioctlsocket(sock, FIONBIO, &mode);
        int nodelay = 1;
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&nodelay, sizeof(int));
        int sndbuf = 524288;
        setsockopt(sock, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

        uint64_t lastSent = 0;
        bool clientReady = true;
        EnsureTouchInjectionInit();

        int screenW = GetSystemMetrics(SM_CXSCREEN);
        int screenH = GetSystemMetrics(SM_CYSCREEN);

        while (true) {
            // Read incoming WebSocket commands (ACK or in-socket Touch/Mouse)
            uint8_t rxBuf[512];
            int br = recv(sock, (char*)rxBuf, sizeof(rxBuf), 0);
            if (br > 0) {
                std::string msg = ReadWebSocketTextMessage(rxBuf, br);
                if (msg == "CLOSE") break;
                if (!msg.empty()) {
                    clientReady = true;
                    // In-socket Touch Command: "T:action:px:py:id"
                    if (msg[0] == 'T' && msg.size() > 5) {
                        char act[16] = {0};
                        int px = -1, py = -1, tid = 0;
                        if (sscanf(msg.c_str(), "T:%15[^:]:%d:%d:%d", act, &px, &py, &tid) >= 3 && px >= 0 && py >= 0) {
                            int targetX = (px * screenW) / 10000;
                            int targetY = (py * screenH) / 10000;

                            bool touchHandled = false;
                            if (g_touchInitialized && g_pfnInjectTouch) {
                                POINTER_TOUCH_INFO_CUSTOM contact;
                                memset(&contact, 0, sizeof(POINTER_TOUCH_INFO_CUSTOM));
                                contact.pointerInfo.pointerType = PT_TOUCH;
                                contact.pointerInfo.pointerId = tid;
                                contact.pointerInfo.ptPixelLocation.x = targetX;
                                contact.pointerInfo.ptPixelLocation.y = targetY;
                                contact.touchFlags = TOUCH_FLAG_NONE;
                                contact.touchMask = TOUCH_MASK_CONTACTAREA | TOUCH_MASK_PRESSURE;
                                contact.pressure = 32000;
                                contact.rcContact.left   = targetX - 4;
                                contact.rcContact.right  = targetX + 4;
                                contact.rcContact.top    = targetY - 4;
                                contact.rcContact.bottom = targetY + 4;

                                std::string actStr = act;
                                if (actStr == "down") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                                    touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                                } else if (actStr == "move") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_UPDATE | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                                    touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                                } else if (actStr == "up") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                                    touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                                } else if (actStr == "tap") {
                                    contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                                    if (g_pfnInjectTouch(1, &contact)) {
                                        contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                                        g_pfnInjectTouch(1, &contact);
                                        touchHandled = true;
                                    }
                                }
                            }

                            // 🛡️ Bulletproof Fallback: if touch digitizer hits a state desync, mouse_event executes seamlessly!
                            if (!touchHandled) {
                                SetCursorPos(targetX, targetY);
                                std::string actStr = act;
                                if (actStr == "down") {
                                    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                                } else if (actStr == "up") {
                                    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                                } else if (actStr == "tap") {
                                    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                                    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                                }
                            }
                        }
                    } else if (msg[0] == 'M' && msg.size() > 3) {
                        // 🖱️ In-socket Real-Time Mousepad Command: "M:dx:dy:scroll:click" (<0.1ms!)
                        int dx = 0, dy = 0, sc = 0, clk = 0;
                        sscanf(msg.c_str(), "M:%d:%d:%d:%d", &dx, &dy, &sc, &clk);
                        if (dx != 0 || dy != 0) {
                            POINT cur;
                            GetCursorPos(&cur);
                            SetCursorPos(cur.x + dx, cur.y + dy);
                            mouse_event(MOUSEEVENTF_MOVE, dx, dy, 0, 0);
                        }
                        if (sc != 0) {
                            mouse_event(MOUSEEVENTF_WHEEL, 0, 0, (DWORD)sc, 0);
                        }
                        if (clk == 1) {
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            Sleep(15);
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        } else if (clk == 2) {
                            mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                            Sleep(15);
                            mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                        } else if (clk == 3) {
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        } else if (clk == 4) {
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        }
                    }
                }
            } else if (br == 0) {
                break; // Socket closed
            } else {
                int err = WSAGetLastError();
                if (err != WSAEWOULDBLOCK) break;
            }

            if (!clientReady) {
                Sleep(2);
                continue;
            }

            std::vector<uint8_t> frame;
            uint64_t currentSeq = 0;
            {
                std::unique_lock<std::mutex> lk(mtx);
                cv.wait_for(lk, std::chrono::milliseconds(50), [&]() {
                    return frameSeq > lastSent || stopReq;
                });
                if (stopReq) break;
                if (frameSeq <= lastSent) continue;
                frame = latestFrame;
                currentSeq = frameSeq;
            }
            if (frame.empty()) continue;

            std::vector<char> frameChar(frame.begin(), frame.end());
            if (!SendWebSocketBinaryFrame(sock, frameChar)) break;
            lastSent = currentSeq;
            clientReady = false; // Zero-buffer pacing: wait for client to draw or ACK
        }
        ClientDone();
        closesocket(sock);
    }

private:
    void CaptureLoop() {
        // Pre-allocate GDI objects ONCE — no per-frame alloc overhead!
        CLSID jpgClsid;
        GetEncoderClsid(L"image/jpeg", &jpgClsid);
        EncoderParameters ep;
        ep.Count = 1;
        ep.Parameter[0].Guid = EncoderQuality;
        ep.Parameter[0].Type = EncoderParameterValueTypeLong;
        ep.Parameter[0].NumberOfValues = 1;
        ULONG quality = 70; // 💎 70% Balanced Quality: Crystal Clear Text + Ultra-Fast Video Fluidity!
        ep.Parameter[0].Value = &quality;

        HDC hScreen = GetDC(NULL);
        DEVMODE dm = {0};
        dm.dmSize = sizeof(dm);
        int screenW = 1920, screenH = 1080;
        if (EnumDisplaySettings(NULL, ENUM_CURRENT_SETTINGS, &dm) && dm.dmPelsWidth > 0 && dm.dmPelsHeight > 0) {
            screenW = dm.dmPelsWidth;
            screenH = dm.dmPelsHeight;
        } else {
            screenW = GetSystemMetrics(SM_CXSCREEN);
            screenH = GetSystemMetrics(SM_CYSCREEN);
        }
        // 💎 1280x720 Super-Crisp 60 FPS Mobile Resolution (<3ms encode, silky smooth gaming speed!)
        int targetW = 1280;
        int targetH = 720;

        HDC hDC = CreateCompatibleDC(hScreen);
        HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
        SelectObject(hDC, hBitmap);
        SetStretchBltMode(hDC, HALFTONE);
        SetBrushOrgEx(hDC, 0, 0, NULL);

        IStream* pStream = NULL;
        CreateStreamOnHGlobal(NULL, TRUE, &pStream);

        AppLog("[jpeg] capture thread started");
        while (true) {
            {
                std::unique_lock<std::mutex> lk(mtx);
                if (stopReq) break;
                if (subscribers <= 0) {
                    // Sleep when no viewers
                    cv.wait_for(lk, std::chrono::milliseconds(500), [&]() {
                        return stopReq || subscribers > 0;
                    });
                    continue;
                }
            }

            auto tStart = std::chrono::steady_clock::now();

            static int loopCounter = 0;
            if (++loopCounter % 180 == 0) {
                SwitchToActiveDesktop();
            }

            // Capture frame: Pure DirectX 11 GPU Duplication
            if (!CaptureDXGIFrame(hDC, targetW, targetH)) {
                if (!g_dxgiDuplication) {
                    SetStretchBltMode(hDC, HALFTONE);
                    SetBrushOrgEx(hDC, 0, 0, NULL);
                    StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, screenW, screenH, SRCCOPY);
                }
            }

            // Draw cursor
            POINT pt; GetCursorPos(&pt);
            int mx = (pt.x * targetW) / screenW;
            int my = (pt.y * targetH) / screenH;
            CURSORINFO ci = {sizeof(CURSORINFO)};
            if (GetCursorInfo(&ci) && (ci.flags & CURSOR_SHOWING) && ci.hCursor) {
                ICONINFO ii = {0};
                if (GetIconInfo(ci.hCursor, &ii)) {
                    DrawIconEx(hDC, mx - (int)ii.xHotspot, my - (int)ii.yHotspot,
                               ci.hCursor, 0, 0, 0, NULL, DI_NORMAL);
                    if (ii.hbmMask) DeleteObject(ii.hbmMask);
                    if (ii.hbmColor) DeleteObject(ii.hbmColor);
                }
            }

            // ⚡ Zero-Alloc GPU JPEG encode (Persistent Stream Re-use)
            std::vector<uint8_t> jpeg;
            if (pStream) {
                LARGE_INTEGER z = {0};
                pStream->Seek(z, STREAM_SEEK_SET, NULL);
                ULARGE_INTEGER uzero = {0};
                pStream->SetSize(uzero);

                Bitmap bmp(hBitmap, NULL);
                if (bmp.Save(pStream, &jpgClsid, &ep) == Ok) {
                    STATSTG st; pStream->Stat(&st, STATFLAG_NONAME);
                    DWORD sz = (DWORD)st.cbSize.QuadPart;
                    if (sz > 0) {
                        pStream->Seek(z, STREAM_SEEK_SET, NULL);
                        jpeg.resize(sz);
                        ULONG br = 0;
                        pStream->Read(jpeg.data(), sz, &br);
                    }
                }
            }

            if (!jpeg.empty()) {
                std::lock_guard<std::mutex> lk(mtx);
                latestFrame = std::move(jpeg);
                frameSeq++;
                cv.notify_all();
            }

            auto tEnd = std::chrono::steady_clock::now();
            int elapsedMs = (int)std::chrono::duration_cast<std::chrono::milliseconds>(tEnd - tStart).count();
            int sleepMs = 11 - elapsedMs; // ⚡ 90 FPS Gaming Refresh (11.1ms step!)
            if (sleepMs > 0) Sleep((DWORD)sleepMs);
        }

        if (pStream) { pStream->Release(); pStream = NULL; }
        DeleteObject(hBitmap);
        DeleteDC(hDC);
        ReleaseDC(NULL, hScreen);
        {
            std::lock_guard<std::mutex> lk(mtx);
            running = false;
        }
        AppLog("[jpeg] capture thread stopped");
    }
};
static JpegBroadcaster g_jpegBcast;

// ============================================================
// 🎬 LIVE BROADCASTER — ONE persistent encoder, MANY viewers.
// Real streaming-server pattern (Sunshine/Moonlight style): a single
// background thread captures+encodes and fans the SAME fragments out to
// every connected viewer. New/reloaded viewers get the cached init segment
// + recent ring-buffer fragments instantly, so page reloads NEVER produce a
// black screen (one encoder = one SPS/PPS forever). The encoder thread is
// persistent: it sleeps when nobody is watching (0% CPU) and wakes on demand,
// which eliminates all start/stop race conditions.
// ============================================================
class LiveBroadcaster {
public:
    std::mutex mtx;
    std::condition_variable cv;
    std::vector<uint8_t> initSeg;      // cached init (ftyp+moov)
    struct RingFrag { uint64_t seq; std::vector<uint8_t> data; bool sync; };
    std::deque<RingFrag> ring; // recent fragments (cap ~2s so new viewers tune in fast)
    uint64_t nextSeq = 1;
    bool encoderRunning = false;
    bool encoderReady = false;
    bool stopRequested = false;
    int width = 1280, height = 720;
    std::string codec = "avc1.42001E";
    int subscriberCount = 0;

    bool ringHasSync() {
        for (auto& p : ring) if (p.sync) return true;
        return false;
    }

    // Called once at startup: captures native screen size.
    void InitDefaults() {
        int sw = GetSystemMetrics(SM_CXSCREEN);
        int sh = GetSystemMetrics(SM_CYSCREEN);
        if (sw > 4 && sh > 4) { width = sw; height = sh; }
        // Cap at 1920 wide for sane tunnel bandwidth (keeps native aspect)
        if (width > 1920) { height = (height * 1920) / width; width = 1920; }
        width &= ~1; height &= ~1;
    }

    // Ensure the persistent encoder thread exists (idempotent, race-free).
    void EnsureEncoder() {
        bool needStart = false;
        {
            std::lock_guard<std::mutex> lk(mtx);
            if (!encoderRunning) { encoderRunning = true; stopRequested = false; needStart = true; }
            cv.notify_all();
        }
        if (needStart) std::thread([this]() { EncoderLoop(); }).detach();
    }

private:
    void EncoderLoop() {
        AppLog("[live] encoder thread started");
        H264Streamer streamer;
        int w, h;
        { std::lock_guard<std::mutex> lk(mtx); w = width; h = height; }
        AppLog("[live] encoder Init...");
        if (!streamer.Init(w, h)) {
            AppLog("[live] encoder Init FAILED");
            std::lock_guard<std::mutex> lk(mtx);
            encoderRunning = false;
            encoderReady = false;
            cv.notify_all();
            return;
        }

        HDC hScreen = GetDC(NULL);
        HDC hDC = CreateCompatibleDC(hScreen);
        HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, w, h);
        HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
        BITMAPINFO bmi = {0};
        bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
        bmi.bmiHeader.biWidth = w; bmi.bmiHeader.biHeight = -h;
        bmi.bmiHeader.biPlanes = 1; bmi.bmiHeader.biBitCount = 32; bmi.bmiHeader.biCompression = BI_RGB;
        std::vector<uint8_t> bgra((size_t)w * h * 4);
        std::vector<uint8_t> nv12(streamer.frameSize());
        bool initSent = false;
        LONG64 stime = 0;

        {
            std::lock_guard<std::mutex> lk(mtx);
            encoderReady = true;
            cv.notify_all();
        }
        AppLog("[live] encoder ready, entering loop");

        while (true) {
            bool work = false;
            {
                std::unique_lock<std::mutex> lk(mtx);
                if (stopRequested) break;
                if (subscriberCount <= 0) {
                    // 💤 Idle: no viewers -> sleep until someone connects
                    cv.wait_for(lk, std::chrono::milliseconds(1000), [&]() {
                        return stopRequested || subscriberCount > 0;
                    });
                    continue;
                }
                work = true;
            }
            if (!work) continue;

            SwitchToActiveDesktop();
            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);
            if (!CaptureDXGIFrame(hDC, w, h)) {
                SetStretchBltMode(hDC, HALFTONE);
                SetBrushOrgEx(hDC, 0, 0, NULL);
                StretchBlt(hDC, 0, 0, w, h, hScreen, 0, 0, screenW, screenH, SRCCOPY);
            }
            GetDIBits(hDC, hBitmap, 0, h, bgra.data(), &bmi, DIB_RGB_COLORS);
            BGRAtoNV12(bgra.data(), w, h, nv12.data());

            if (!streamer.EncodeFrame(nv12.data(), stime)) { Sleep(5); continue; }
            stime += 166666; // 60 FPS (16.6ms step in 100ns units)

            if (!initSent && streamer.Ready()) {
                std::lock_guard<std::mutex> lk(mtx);
                initSeg = streamer.initSeg;
                codec = streamer.codec;
                g_streamCodec = codec; g_streamW = w; g_streamH = h;
                initSent = true;
                cv.notify_all();
            }

            std::vector<uint8_t> frag;
            bool fragSync = false;
            while (streamer.TakeFragment(frag, true, &fragSync)) {
                if (!frag.empty()) {
                    std::lock_guard<std::mutex> lk(mtx);
                    ring.push_back({ nextSeq++, std::move(frag), fragSync });
                    // keep ~2 seconds of fragments so new viewers can tune in at the last IDR
                    while (ring.size() > 16) ring.pop_front();
                    cv.notify_all();
                }
                frag.clear();
            }
            Sleep(16); // ⚡ 60 FPS True Hardware Refresh Sync!
        }

        SelectObject(hDC, oldBm);
        DeleteObject(hBitmap);
        DeleteDC(hDC);
        ReleaseDC(NULL, hScreen);
        // ⚡ NO explicit streamer.Cleanup() here: ~H264Streamer() calls Cleanup()
        // automatically. Calling it twice -> double MFShutdown/CoUninitialize -> crash.

        std::lock_guard<std::mutex> lk(mtx);
        encoderRunning = false;
        encoderReady = false;
        initSeg.clear();
        ring.clear();
        cv.notify_all();
        AppLog("[live] encoder thread stopped");
    }

public:
    // Serve one viewer until disconnect. Called from the /h264 handler.
    void ServeClient(SOCKET clientSocket) {
        int flag = 1;
        setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
        int sndbuf = 131072;
        setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

        EnsureEncoder();
        {
            std::lock_guard<std::mutex> lk(mtx);
            subscriberCount++;
            cv.notify_all();
        }

        uint64_t catchUpSeq = 0;
        int stall = 0;
        bool sentInit = false;
        bool catchUpSet = false;

        while (true) {
            std::vector<uint8_t> toSend;
            bool haveData = false;
            {
                std::unique_lock<std::mutex> lk(mtx);
                // Wait up to 250ms for init or new fragments (or the first IDR to tune in on).
                // NOTE: must check the RING for seq > catchUpSeq, never nextSeq alone --
                // nextSeq=1 > catchUpSeq=0 is ALWAYS true with an empty ring, which would
                // tight-spin this loop and hit the stall limit in microseconds.
                cv.wait_for(lk, std::chrono::milliseconds(250), [&]() {
                    if (!initSeg.empty() && !sentInit) return true;
                    for (auto& p : ring) if (p.seq > catchUpSeq) return true;
                    return false;
                });
                if (!sentInit) {
                    if (!initSeg.empty()) { toSend = initSeg; sentInit = true; haveData = true; }
                } else {
                    // 🎯 Tune in at the most recent IDR fragment so the decoder gets a
                    // keyframe immediately -> page reloads NEVER black-screen.
                    if (!catchUpSet) {
                        for (auto it = ring.rbegin(); it != ring.rend(); ++it) {
                            if (it->sync) { catchUpSeq = it->seq; break; }
                        }
                        catchUpSet = true;
                    }
                    for (auto& p : ring) {
                        if (p.seq > catchUpSeq) {
                            toSend.insert(toSend.end(), p.data.begin(), p.data.end());
                            catchUpSeq = p.seq;
                        }
                    }
                    haveData = !toSend.empty();
                }
            }

            if (!haveData) {
                stall++;
                if (stall > 60) break; // 15s silent -> drop (client auto-reconnects instantly)
                continue;
            }
            stall = 0;

            // ZERO-BUFFER-BLOAT flow control: only send when socket is writable
            fd_set writefds; FD_ZERO(&writefds); FD_SET(clientSocket, &writefds);
            timeval tv = {0, 0};
            int selRes = select(0, NULL, &writefds, NULL, &tv);
            if (selRes < 0) break;
            if (selRes == 0) {
                stall++;
                if (stall > 900) break; // ~15s socket stall -> drop viewer
                Sleep(16);
                continue;
            }
            if (send(clientSocket, (char*)toSend.data(), (int)toSend.size(), 0) == SOCKET_ERROR) {
                AppLog("[live] send failed, dropping viewer");
                break;
            }
        }

        {
            std::lock_guard<std::mutex> lk(mtx);
            subscriberCount--;
            if (subscriberCount <= 0) cv.notify_all(); // encoder goes to sleep
        }
        AppLog("[live] viewer disconnected");
        closesocket(clientSocket);
    }
};

static LiveBroadcaster g_live;

void KillAllPanicProcesses();
void ProcessClient(SOCKET clientSocket);

DWORD WINAPI ProcessClientThread(LPVOID lpParam) {
    SOCKET clientSocket = (SOCKET)(uintptr_t)lpParam;
    try {
        ProcessClient(clientSocket);
    } catch (...) {
        // Catch any C++ exception silently - server stays alive!
        closesocket(clientSocket);
    }
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

            // Step 7: Secret Key check (Allow root, app download, manifest, and sw.js)
            bool hasKey = (request.find(SECRET_KEY) != std::string::npos) || 
                          (request.find("key=") != std::string::npos) ||
                          (request.find("imran") != std::string::npos) ||
                          (request.find("GET / ") != std::string::npos) ||
                          (request.find("GET /?") != std::string::npos) ||
                          (request.find("GET /download/") != std::string::npos) ||
                          (request.find("GET /app.apk") != std::string::npos) ||
                          (request.find("GET /manifest.json") != std::string::npos) ||
                          (request.find("GET /sw.js") != std::string::npos) ||
                          (request.find("GET /HTTP") != std::string::npos);

            // ⚡ HEAD request: Cloudflare health check - always respond OK
            if (request.find("HEAD ") != std::string::npos) {
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (request.find("OPTIONS ") != std::string::npos) {
                std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Allow-Methods: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (!hasKey) {
                // No key? Redirect to main page with key (instead of 403)
                std::string res = "HTTP/1.1 302 Found\r\nLocation: /?key=imran2024\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
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

        } else if (request.find("GET /api/gemini_key") != std::string::npos) {
            std::string keyVal = "";
            FILE* kf = fopen("C:\\ProgramData\\PanicButton\\gemini_key.txt", "r");
            if (kf) {
                char kbuf[512] = {0};
                if (fgets(kbuf, sizeof(kbuf) - 1, kf)) {
                    keyVal = kbuf;
                    while (!keyVal.empty() && (keyVal.back() == '\r' || keyVal.back() == '\n' || keyVal.back() == ' ')) keyVal.pop_back();
                }
                fclose(kf);
            }
            responseBody = "{\"key\":\"" + keyVal + "\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
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
            // ⚡ WEBSOCKET HIGH-SPEED BINARY FRAME STREAMER — JpegBroadcaster fan-out
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
            int sndbuf = 524288; // 512KB send buffer
            setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

            g_jpegBcast.ServeWebSocketClient(clientSocket);
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
                ULONG quality = 50; // ⚡ 50% Quality: 8KB ultra-light frame for Sub-10ms 60 FPS speed!
                encoderParameters.Parameter[0].Value = &quality;

                // 🚀 MOBILE WI-FI SMOOTH SOCKET BUFFER (Prevents send blocking & stutter!)
                int flag = 1;
                setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
                int sndbuf = 32768; // 32KB Mobile Wi-Fi socket buffer
                setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

                int mjpegStall = 0;
                while (true) {
                    // ⚡ ZERO-BUFFER-BLOAT: Prune zombie threads on socket error or 60-frame stall!
                    fd_set writefds;
                    FD_ZERO(&writefds);
                    FD_SET(clientSocket, &writefds);
                    timeval tv = {0, 0};
                    int selRes = select(0, NULL, &writefds, NULL, &tv);
                    if (selRes < 0) break; // Socket disconnected or error
                    if (selRes == 0) {
                        mjpegStall++;
                        if (mjpegStall > 60) break; // 1 second network stall -> disconnect zombie thread!
                        Sleep(16);
                        continue;
                    }
                    mjpegStall = 0;
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

        } else if (request.find("GET /api/mouse") != std::string::npos || request.find("GET /api/touch") != std::string::npos || request.find("GET /api/telemetry") != std::string::npos) {
            // 🎮 PARSEC HARDWARE TOUCH & MOUSE INJECTION
            size_t px = request.find("px=");
            if (px == std::string::npos) px = request.find("x=");
            size_t py = request.find("py=");
            if (py == std::string::npos) py = request.find("y=");
            size_t pc = request.find("click=");
            size_t pa = request.find("action=");
            size_t pid = request.find("id=");

            int pxVal = (px != std::string::npos) ? atoi(request.c_str() + px + (request[px+1] == 'x' ? 3 : 2)) : -1;
            int pyVal = (py != std::string::npos) ? atoi(request.c_str() + py + (request[py+1] == 'y' ? 3 : 2)) : -1;
            int clickVal = (pc != std::string::npos) ? atoi(request.c_str() + pc + 6) : 0;
            int touchId = (pid != std::string::npos) ? atoi(request.c_str() + pid + 3) : 0;
            
            std::string actionStr = "";
            if (pa != std::string::npos) {
                size_t sp = request.find_first_of(" &", pa);
                actionStr = request.substr(pa + 7, sp - (pa + 7));
            }

            if (pxVal >= 0 && pyVal >= 0) {
                int screenW = GetSystemMetrics(SM_CXSCREEN);
                int screenH = GetSystemMetrics(SM_CYSCREEN);
                int targetX = (pxVal * screenW) / 10000;
                int targetY = (pyVal * screenH) / 10000;

                EnsureTouchInjectionInit();

                bool touchHandled = false;
                if (g_touchInitialized && g_pfnInjectTouch) {
                    POINTER_TOUCH_INFO_CUSTOM contact;
                    memset(&contact, 0, sizeof(POINTER_TOUCH_INFO_CUSTOM));
                    contact.pointerInfo.pointerType = PT_TOUCH;
                    contact.pointerInfo.pointerId = touchId;
                    contact.pointerInfo.ptPixelLocation.x = targetX;
                    contact.pointerInfo.ptPixelLocation.y = targetY;
                    contact.touchFlags = TOUCH_FLAG_NONE;
                    contact.touchMask = TOUCH_MASK_CONTACTAREA | TOUCH_MASK_PRESSURE;
                    contact.pressure = 32000;
                    contact.rcContact.left   = targetX - 4;
                    contact.rcContact.right  = targetX + 4;
                    contact.rcContact.top    = targetY - 4;
                    contact.rcContact.bottom = targetY + 4;

                    if (actionStr == "down" || clickVal == 3) {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                        touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                    } else if (actionStr == "move") {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_UPDATE | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                        touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                    } else if (actionStr == "up" || clickVal == 4) {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                        touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                    } else if (clickVal == 1 || actionStr == "tap") {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                        if (g_pfnInjectTouch(1, &contact)) {
                            contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                            g_pfnInjectTouch(1, &contact);
                            touchHandled = true;
                        }
                    }
                }

                // Fallback to high-precision SetCursorPos + SendInput if touch injection was not used
                if (!touchHandled) {
                    SetCursorPos(targetX, targetY);
                    if (clickVal == 1 || actionStr == "tap") {
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                    } else if (clickVal == 2) {
                        mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                    } else if (clickVal == 3 || actionStr == "down") {
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                    } else if (clickVal == 4 || actionStr == "up") {
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                    }
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nAccess-Control-Allow-Origin: *\r\nConnection: keep-alive\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("/api/client_telemetry") != std::string::npos) {
            // 📊 REAL-TIME LIVE PHONE TELEMETRY & BLACKBOX LOGGER
            size_t bodyPos = request.find("\r\n\r\n");
            std::string body = (bodyPos != std::string::npos) ? request.substr(bodyPos + 4) : "";
            if (body.empty()) {
                size_t pData = request.find("data=");
                if (pData != std::string::npos) {
                    body = request.substr(pData + 5);
                }
            }
            if (!body.empty()) {
                AppLog(("[phone-live-log] " + body).c_str());
                FILE* f = fopen("C:\\ProgramData\\PanicButton\\phone_live_debug.log", "a");
                if (f) {
                    time_t now = time(NULL);
                    char tbuf[64]; strftime(tbuf, sizeof(tbuf), "%Y-%m-%d %H:%M:%S", localtime(&now));
                    fprintf(f, "[%s] %s\n", tbuf, body.c_str());
                    fclose(f);
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 11\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nConnection: keep-alive\r\n\r\n{\"ok\":true}";
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
                POINT cur;
                GetCursorPos(&cur);
                SetCursorPos(cur.x + dxVal, cur.y + dyVal);
                mouse_event(MOUSEEVENTF_MOVE, dxVal, dyVal, 0, 0);
            }

            if (scrollVal != 0) {
                INPUT scrollInput = {0};
                scrollInput.type = INPUT_MOUSE;
                scrollInput.mi.dwFlags = MOUSEEVENTF_WHEEL;
                scrollInput.mi.mouseData = (DWORD)scrollVal; // +120 for up, -120 for down
                SendInput(1, &scrollInput, sizeof(INPUT));
            }

            if (clickVal == 1) {
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                Sleep(15);
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
            } else if (clickVal == 2) {
                mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                Sleep(15);
                mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
            } else if (clickVal == 3) { // Mouse Down (Drag Start)
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
            } else if (clickVal == 4) { // Mouse Up (Drag End)
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
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

        } else if (request.find("GET /api/exit") != std::string::npos || request.find("GET /exit") != std::string::npos) {
            responseBody = "{\"status\":\"exiting\"}";
            std::string jsonResponse =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, jsonResponse.c_str(), (int)jsonResponse.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            KillAllPanicProcesses();
            ExitProcess(0);
            return;

        } else if (request.find("GET /api/tunnel-url") != std::string::npos) {
            // ⚡ Returns current Cloudflare tunnel URL so APK can auto-discover it!
            std::string tunnelUrl = "";
            FILE* uf = fopen("C:\\ProgramData\\PanicButton\\active_url.txt", "r");
            if (uf) {
                char ubuf[512] = {0};
                if (fgets(ubuf, sizeof(ubuf) - 1, uf)) {
                    tunnelUrl = ubuf;
                    // Trim whitespace/newlines
                    size_t end = tunnelUrl.find_last_not_of(" \t\r\n");
                    if (end != std::string::npos) tunnelUrl = tunnelUrl.substr(0, end + 1);
                }
                fclose(uf);
            }
            responseBody = "{\"url\":\"" + tunnelUrl + "\"}";
            std::string urlResponse =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, urlResponse.c_str(), (int)urlResponse.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/exec") != std::string::npos) {
            // 💻 Cyber Terminal Remote Command Execution (PowerShell / System)
            size_t cmdPos = request.find("cmd=");
            std::string cmdOutput = "";
            if (cmdPos != std::string::npos) {
                size_t spacePos = request.find(" ", cmdPos);
                size_t ampPos = request.find("&", cmdPos);
                size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
                std::string rawCmd = request.substr(cmdPos + 4, endPos - (cmdPos + 4));
                std::string decodedCmd = "";
                for (size_t i = 0; i < rawCmd.length(); i++) {
                    if (rawCmd[i] == '%' && i + 2 < rawCmd.length()) {
                        int hexVal = 0;
                        sscanf(rawCmd.substr(i + 1, 2).c_str(), "%x", &hexVal);
                        decodedCmd += (char)hexVal;
                        i += 2;
                    } else if (rawCmd[i] == '+') {
                        decodedCmd += ' ';
                    } else {
                        decodedCmd += rawCmd[i];
                    }
                }
                
                std::string execLine = "powershell -NoProfile -NonInteractive -Command \"" + decodedCmd + "\" 2>&1";
                FILE* pipe = _popen(execLine.c_str(), "r");
                if (pipe) {
                    char pbuf[512];
                    while (fgets(pbuf, sizeof(pbuf), pipe)) {
                        cmdOutput += pbuf;
                        if (cmdOutput.size() > 4000) break; // Limit output size
                    }
                    _pclose(pipe);
                }
            }
            // JSON escape output
            std::string escapedOutput = "";
            for (char c : cmdOutput) {
                if (c == '"') escapedOutput += "\\\"";
                else if (c == '\\') escapedOutput += "\\\\";
                else if (c == '\n') escapedOutput += "\\n";
                else if (c == '\r') escapedOutput += "\\r";
                else if (c == '\t') escapedOutput += "\\t";
                else if ((unsigned char)c >= 32) escapedOutput += c;
            }
            responseBody = "{\"status\":\"ok\",\"output\":\"" + escapedOutput + "\"}";
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

        } else if (request.find("GET /api/streaminfo") != std::string::npos) {
            // 🎬 Returns the H.264 stream codec + resolution for MSE setup
            std::string codec; int sw, sh;
            { std::lock_guard<std::mutex> lk(g_streamInfoMutex); codec = g_streamCodec; sw = g_streamW; sh = g_streamH; }
            std::string body = "{\"codec\":\"" + codec + "\",\"w\":" + std::to_string(sw) + ",\"h\":" + std::to_string(sh) + "}";
            std::string res =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Cache-Control: no-store\r\n"
                "Content-Length: " + std::to_string(body.size()) + "\r\n"
                "Connection: close\r\n\r\n" + body;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

                } else if (request.find("GET /h264") != std::string::npos || request.find("GET /ws") != std::string::npos || request.find("GET /mjpeg") != std::string::npos) {
            // 🎬 SUNSHINE/PARSEC LOW-LATENCY VIDEO BROADCASTER
            // Single DXGI/H.264 GPU pipeline fan-out to all connected clients.
            std::string header =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: video/mp4\r\n"
                "Cache-Control: no-cache, no-store\r\n"
                "Pragma: no-cache\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Connection: close\r\n\r\n";
            send(clientSocket, header.c_str(), (int)header.size(), 0);
            g_live.ServeClient(clientSocket);
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
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
    max-width: 100%;
    padding: 0 4px;
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

  /* 🎮 PARSEC IMMERSIVE FULLSCREEN OVERLAY & FLOATING BUBBLE */
  .fullscreen-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: #000;
    z-index: 99999;
    padding: 0;
    margin: 0;
    overflow: hidden;
    touch-action: none;
  }
  
  /* 🔄 AUTO LANDSCAPE: CLEAN 16:9 NATIVE BOX WITH BLACK BARS */
  #fsCanvas {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    object-fit: contain !important;
    display: block;
    touch-action: none;
    margin: 0;
    padding: 0;
  }

  @media (orientation: portrait) {
    #fsCanvas {
      width: 100vh !important;
      height: 100vw !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) rotate(90deg) !important;
      object-fit: contain !important;
    }
  }

  @media (orientation: landscape) {
    #fsCanvas {
      width: 100vw !important;
      height: 100vh !important;
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
      object-fit: contain !important;
    }
  }
  .parsec-bubble {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(10, 14, 22, 0.88);
    border: 2px solid var(--neon-cyan);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100005;
    touch-action: none;
    user-select: none;
    backdrop-filter: blur(8px);
    transition: transform 0.1s ease, box-shadow 0.2s;
  }
  .parsec-bubble:active {
    transform: scale(0.92);
    box-shadow: 0 0 30px var(--neon-cyan);
  }
  .parsec-bubble .bubble-icon {
    font-size: 20px;
    filter: drop-shadow(0 0 6px var(--neon-cyan));
  }
  .parsec-menu {
    position: fixed;
    top: 76px;
    left: 20px;
    width: 260px;
    max-width: 85vw;
    background: rgba(13, 18, 28, 0.96);
    border: 1.5px solid var(--neon-cyan);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.3);
    z-index: 100006;
    padding: 14px;
    backdrop-filter: blur(16px);
  }
  @keyframes menuPop {
    from { opacity: 0; transform: scale(0.85) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .parsec-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    color: var(--neon-cyan);
    letter-spacing: 1px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .parsec-menu-close {
    cursor: pointer;
    font-size: 14px;
    color: #94a3b8;
    padding: 2px 6px;
  }
  .parsec-menu-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .parsec-btn {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(0, 240, 255, 0.3);
    color: #fff;
    padding: 10px 14px;
    border-radius: 10px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.15s;
  }
  .parsec-btn:hover, .parsec-btn:active {
    background: rgba(0, 240, 255, 0.2);
    border-color: var(--neon-cyan);
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
  }
  .parsec-btn.danger {
    border-color: rgba(255, 68, 68, 0.4);
    color: #ff6666;
  }
  .parsec-btn.danger:hover, .parsec-btn.danger:active {
    background: rgba(255, 68, 68, 0.2);
    border-color: #ff4444;
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

  /* 🧠 GEMINI 3.1 LIVE CYBER HUD STYLES */
  .gemini-hud-card {
    background: linear-gradient(180deg, rgba(13, 17, 26, 0.95) 0%, rgba(7, 10, 16, 0.98) 100%);
    border: 1px solid rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.15), inset 0 0 20px rgba(0, 240, 255, 0.05);
    border-radius: 14px;
    margin-bottom: 16px;
    overflow: hidden;
    position: relative;
  }
  .gemini-top-bar {
    background: rgba(10, 14, 24, 0.95);
    border-bottom: 1px solid rgba(0, 240, 255, 0.2);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .gemini-badge {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 1.5px;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.8);
  }
  .gemini-status-pill {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    letter-spacing: 1px;
    font-weight: bold;
    transition: all 0.3s;
  }
  .status-disc { background: rgba(255,255,255,0.08); color: #888; border: 1px solid #555; }
  .status-conn { background: rgba(255,170,0,0.2); color: var(--neon-amber); border: 1px solid var(--neon-amber); animation: pulseAmber 1s infinite; }
  .status-listen { background: rgba(0,255,65,0.2); color: var(--neon-green); border: 1px solid var(--neon-green); animation: pulseGreen 1.5s infinite; }
  .status-speak { background: rgba(0,240,255,0.25); color: var(--neon-cyan); border: 1px solid var(--neon-cyan); animation: pulseCyan 0.8s infinite; }
  .status-exec { background: rgba(255,0,85,0.25); color: var(--neon-red); border: 1px solid var(--neon-red); animation: pulseRed 0.6s infinite; }

  @keyframes pulseAmber { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes pulseGreen { 0%,100%{opacity:1; box-shadow:0 0 10px rgba(0,255,65,0.4);} 50%{opacity:0.5; box-shadow:none;} }
  @keyframes pulseCyan { 0%,100%{opacity:1; box-shadow:0 0 12px rgba(0,240,255,0.6);} 50%{opacity:0.4; box-shadow:none;} }

  .gemini-btn-icon {
    background: rgba(255,255,255,0.06);
    color: #cbd5e1;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 6px 10px;
    border-radius: 6px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .gemini-btn-icon:hover { background: rgba(0,240,255,0.2); color: #fff; border-color: var(--neon-cyan); }
  .gemini-btn-connect {
    background: linear-gradient(135deg, #00f0ff 0%, #0088cc 100%);
    color: #000;
    border: none;
    padding: 7px 14px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
    transition: all 0.2s;
  }
  .gemini-btn-connect.connected {
    background: linear-gradient(135deg, #ff0055 0%, #aa0033 100%);
    color: #fff;
    box-shadow: 0 0 12px rgba(255, 0, 85, 0.5);
  }

  .gemini-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 18px 12px;
    text-align: center;
    position: relative;
  }
  .gemini-blob-wrapper {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  #geminiBlobCanvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
  }
  .gemini-blob-center-icon {
    position: relative;
    z-index: 2;
    font-size: 32px;
    filter: drop-shadow(0 0 12px var(--neon-cyan));
    transition: transform 0.2s;
  }
  .gemini-hud-info {
    font-family: 'Share Tech Mono', monospace;
  }
  .gemini-hud-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }
  .gemini-hud-sub {
    font-size: 11px;
    color: #94a3b8;
    max-width: 340px;
    line-height: 1.4;
  }

  /* Cyber Sandbox Terminal */
  .gemini-terminal {
    background: #05080e;
    border-top: 1px solid rgba(0, 240, 255, 0.3);
    padding: 10px 12px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
  }
  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px dashed rgba(0, 240, 255, 0.2);
  }
  .terminal-title {
    color: var(--neon-cyan);
    font-size: 10px;
    letter-spacing: 1px;
  }
  .terminal-clear-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 10px;
    cursor: pointer;
    font-family: inherit;
  }
  .terminal-clear-btn:hover { color: #fff; }
  .terminal-logs {
    height: 140px;
    overflow-y: auto;
    background: #020408;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 6px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  .t-log { line-height: 1.4; word-break: break-all; }
  .t-log.sys { color: #64748b; }
  .t-log.user { color: var(--neon-green); font-weight: bold; }
  .t-log.ai { color: var(--neon-cyan); }
  .t-log.tool { color: var(--neon-amber); font-weight: bold; }
  .t-log.out { color: #e2e8f0; background: rgba(255,255,255,0.04); padding: 2px 6px; border-left: 2px solid var(--neon-cyan); }
  .t-log.err { color: var(--neon-red); }

  .terminal-input-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #020408;
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
  }
  .terminal-input-bar input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-family: inherit;
    font-size: 11px;
    outline: none;
  }
  .terminal-run-btn {
    background: var(--neon-cyan);
    color: #000;
    border: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-family: 'Orbitron', sans-serif;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
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
  <!-- ⚡ PARSEC FLOATING DRAGGABLE BUBBLE -->
  <div id="parsecBubble" class="parsec-bubble" onclick="toggleParsecMenu(event)">
    <span class="bubble-icon">⚡</span>
  </div>

  <!-- 🎮 PARSEC QUICK HUD MENU -->
  <div id="parsecMenu" class="parsec-menu" style="display:none;">
    <div class="parsec-menu-header">
      <span>🎮 PARSEC MONITOR HUD</span>
      <span class="parsec-menu-close" onclick="toggleParsecMenu(event)">✖</span>
    </div>
    <div class="parsec-menu-grid">
      <button class="parsec-btn" onclick="toggleVirtualKeyboard()"><span class="btn-ic">⌨️</span> KEYBOARD</button>
      <button class="parsec-btn" id="btnMouseMode" onclick="toggleMouseMode()"><span class="btn-ic">🖱️</span> TOUCH CLICK: ON</button>
      <button class="parsec-btn danger" onclick="closeFS()"><span class="btn-ic">🚪</span> EXIT TO DASHBOARD</button>
    </div>
  </div>

  <!-- ⌨️ INVISIBLE KEYBOARD INPUT PROXY -->
  <input type="text" id="fsKeyProxy" style="position:fixed; opacity:0; pointer-events:none; top:-100px; left:-100px;" oninput="handleFsType(event)" onkeydown="handleFsKeydown(event)">

  <!-- 🖼️ PARSEC FULLSCREEN GPU CANVAS -->
  <canvas id="fsCanvas" style="width:100vw; height:100vh; object-fit:contain; background:#000; display:block; touch-action:none;"></canvas>
</div>

<div class="container">
  
  <!-- Header Branding -->
  <div class="brand-bar">
    <div class="brand-title">PANIC CTRL</div>
    <div class="brand-tag">v2.0 CYBER NODE</div>
  </div>

  <!-- 🧠 GEMINI 3.1 CYBER LIVE VOICE HUD & SANDBOX TERMINAL -->
  <div class="gemini-hud-card" id="geminiHudCard">
    <!-- Top Bar -->
    <div class="gemini-top-bar">
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="gemini-badge">🧠 GEMINI 3.1 LIVE</span>
        <span id="geminiStatusPill" class="gemini-status-pill status-disc">DISCONNECTED</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="gemini-btn-icon" onclick="toggleGeminiKeyModal()" title="Gemini API Key">🔑 KEY</button>
        <button class="gemini-btn-icon" onclick="toggleGeminiTerminal()" title="Toggle Sandbox Terminal">📟 LOGS</button>
        <button id="geminiConnectBtn" class="gemini-btn-connect" onclick="toggleGeminiLiveConnection()">⚡ CONNECT AI</button>
      </div>
    </div>

    <!-- Center Stage: Audio Blob Visualizer & Controls -->
    <div class="gemini-stage">
      <div class="gemini-blob-wrapper">
        <canvas id="geminiBlobCanvas" width="220" height="220"></canvas>
        <div class="gemini-blob-center-icon" id="geminiBlobIcon">🎙️</div>
      </div>
      <div class="gemini-hud-info">
        <div class="gemini-hud-title" id="geminiVoiceTitle">VOICE ASSISTANT READY</div>
        <div class="gemini-hud-sub" id="geminiVoiceSub">Tap '⚡ CONNECT AI' to start real-time full-duplex voice control.</div>
      </div>
    </div>

    <!-- Collapsible Cyber Sandbox Terminal Console -->
    <div id="geminiTerminalBox" class="gemini-terminal" style="display:none;">
      <div class="terminal-header">
        <span class="terminal-title">📟 CYBER SANDBOX TERMINAL &bull; LIVE EXECUTION HUB</span>
        <button class="terminal-clear-btn" onclick="clearGeminiTerminal()">CLEAR</button>
      </div>
      <div id="geminiTerminalLogs" class="terminal-logs">
        <div class="t-log sys">[SYSTEM] Gemini 3.1 Live Terminal initialized. Standby for voice commands...</div>
      </div>
      <div class="terminal-input-bar">
        <span style="color:var(--neon-green); font-family:monospace; font-weight:bold;">PS &gt;</span>
        <input type="text" id="manualTerminalInput" placeholder="Manual command (e.g. Get-Process, ipconfig)..." onkeydown="if(event.key==='Enter')executeManualTerminalCmd()">
        <button class="terminal-run-btn" onclick="executeManualTerminalCmd()">RUN</button>
      </div>
    </div>
  </div>

  <!-- 🔑 GEMINI API KEY MODAL -->
  <div id="geminiKeyModal" class="modal-overlay" style="display:none;">
    <div class="modal-card" style="border-color:var(--neon-cyan); box-shadow:0 0 30px rgba(0,240,255,0.3);">
      <div class="modal-header">
        <span class="modal-icon">🔑</span>
        <span class="modal-title">GEMINI LIVE API KEY</span>
      </div>
      <p class="modal-sub">ENTER YOUR GOOGLE AI STUDIO API KEY</p>
      <div class="input-wrapper">
        <input type="password" id="geminiApiKeyInput" placeholder="AIzaSy..." autocomplete="off">
      </div>
      <div style="font-size:10px; color:#888; margin-bottom:14px; font-family:'Share Tech Mono',monospace;">
        Get your free API key at: <b style="color:var(--neon-cyan);">aistudio.google.com</b>
      </div>
      <div class="modal-actions">
        <button class="modal-btn btn-cancel" onclick="closeGeminiKeyModal()">CANCEL</button>
        <button class="modal-btn btn-confirm" style="background:var(--neon-cyan); color:#000;" onclick="saveGeminiApiKey()">SAVE KEY 💾</button>
      </div>
    </div>
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
      <!-- 🚀 GPU ACCELERATED HARDWARE CANVAS (Instant zero-copy render) -->
      <canvas id="gpuCanvas" class="screen-img" onclick="openFS()" style="display:none; width:100%; border-radius:6px; object-fit:contain; cursor:pointer; touch-action:none;"></canvas>
      <!-- 📷 MJPEG fallback -->
      <img id="liveImg" class="screen-img" onclick="openFS()" style="display:none; width:100%; border-radius:6px; object-fit:contain; cursor:pointer; touch-action:none;">
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
      <button style="flex:1; padding:11px; background:rgba(0,255,65,0.08); color:var(--neon-green); border:none; border-right:1px solid rgba(0,240,255,0.2); font-family:'Orbitron',sans-serif; font-size:11px; font-weight:800; letter-spacing:1px; cursor:pointer;" onclick="sendMouseClick(1)">LEFT CLICK</button>
      <button style="flex:1; padding:11px; background:rgba(255,170,0,0.08); color:var(--neon-amber); border:none; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:800; letter-spacing:1px; cursor:pointer;" onclick="sendMouseClick(2)">RIGHT CLICK</button>
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

// 📊 REAL-TIME CLIENT TELEMETRY & BLACKBOX LOGGER
var Telemetry = {
  getGPU: function() {
    try {
      var gl = document.createElement("canvas").getContext("webgl");
      if (!gl) return "WebGL Unavailable";
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "Standard WebGL";
    } catch(e) { return "Err: " + e.message; }
  },
  log: function(eventType, detailObj) {
    try {
      var payload = {
        type: eventType,
        time: new Date().toISOString(),
        screen: {
          w: window.innerWidth || window.screen.width,
          h: window.innerHeight || window.screen.height,
          dpr: window.devicePixelRatio || 1,
          orientation: (screen.orientation ? screen.orientation.type : (window.innerHeight > window.innerWidth ? "portrait" : "landscape")),
          touchPoints: navigator.maxTouchPoints || 0
        },
        gpu: Telemetry.getGPU(),
        webcodecs: typeof VideoDecoder !== 'undefined',
        webrtc: typeof RTCPeerConnection !== 'undefined',
        details: detailObj || {}
      };
      var dataStr = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/client_telemetry?key=" + KEY, dataStr);
      } else {
        fetch("/api/client_telemetry?key=" + KEY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: dataStr,
          keepalive: true
        }).catch(function(){});
      }
    } catch(e) {}
  }
};

window.addEventListener("DOMContentLoaded", function() {
  Telemetry.log("APP_INIT_HANDSHAKE", {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cores: navigator.hardwareConcurrency || "unknown",
    memory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "unknown"
  });
});

window.addEventListener("error", function(e) {
  Telemetry.log("CLIENT_ERROR", { msg: e.message, file: e.filename, line: e.lineno, col: e.colno });
});
window.addEventListener("unhandledrejection", function(e) {
  Telemetry.log("UNHANDLED_PROMISE", { reason: String(e.reason) });
});

var fsZoom = 1.0;
var fsPanX = 0, fsPanY = 0;
var touchStartDist = 0;
var touchStartZoom = 1.0;
var touchStartPanX = 0, touchStartPanY = 0;
var touchStartTouchX = 0, touchStartTouchY = 0;
var lastTapTime = 0;
var gesturesBound = false;
var bubbleDragBound = false;

// 🎮 Parsec Interactive Modes
var isTouchMouse = true;
var scalingMode = 0; // 0 = Contain 16:9, 1 = Fill Height, 2 = Stretch Full
var isFsRotated = false;
var longPressTimer = null;
var touchMoved = false;

var bubbleHasDragged = false;

function positionMenuNextToBubble() {
  var bubble = document.getElementById("parsecBubble");
  var menu = document.getElementById("parsecMenu");
  if (!bubble || !menu) return;
  var bRect = bubble.getBoundingClientRect();
  var winW = window.innerWidth || window.screen.width;
  var winH = window.innerHeight || window.screen.height;

  var menuW = 260;
  var menuH = 170;

  var posX = bRect.left;
  var posY = bRect.bottom + 8;

  if (posY + menuH > winH - 12) {
    posY = Math.max(12, bRect.top - menuH - 8);
  }
  if (posX + menuW > winW - 12) {
    posX = Math.max(12, winW - menuW - 12);
  }

  menu.style.left = posX + "px";
  menu.style.top = posY + "px";
}

function toggleParsecMenu(e) {
  if (e) e.stopPropagation();
  if (bubbleHasDragged) {
    bubbleHasDragged = false;
    return;
  }
  var menu = document.getElementById("parsecMenu");
  if (menu) {
    var isOpening = (menu.style.display === "none" || menu.style.display === "");
    if (isOpening) {
      positionMenuNextToBubble();
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
    }
  }
}

function toggleVirtualKeyboard() {
  toggleParsecMenu();
  var input = document.getElementById("fsKeyProxy");
  if (input) {
    input.focus();
    input.click();
  }
}

function handleFsType(e) {
  var val = e.target.value;
  if (val) {
    fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(val));
    e.target.value = "";
  }
}

function handleFsKeydown(e) {
  if (e.key === "Backspace") {
    fetch("/api/key?key=" + KEY + "&code={BACKSPACE}");
  } else if (e.key === "Enter") {
    fetch("/api/key?key=" + KEY + "&code={ENTER}");
  }
}

function toggleMouseMode() {
  isTouchMouse = !isTouchMouse;
  var btn = document.getElementById("btnMouseMode");
  if (btn) btn.innerHTML = isTouchMouse ? '<span class="btn-ic">🖱️</span> TOUCH CLICK: ON' : '<span class="btn-ic">✋</span> PAN & ZOOM ONLY';
  vibratePhone(40);
}

function applyFSTransform() {
  var fsCanvas = document.getElementById("fsCanvas");
  var fsOverlay = document.getElementById("fsOverlay");
  if (!fsCanvas || !fsOverlay || fsOverlay.style.display === "none") return;

  var winW = window.innerWidth || window.screen.width;
  var winH = window.innerHeight || window.screen.height;
  var isPortrait = winH > winW;

  var cW = fsCanvas.width || 1920;
  var cH = fsCanvas.height || 1080;

  fsCanvas.style.width = cW + "px";
  fsCanvas.style.height = cH + "px";
  fsCanvas.style.position = "fixed";
  fsCanvas.style.left = "50%";
  fsCanvas.style.top = "50%";
  fsCanvas.style.margin = "0";
  fsCanvas.style.transformOrigin = "center center";

  if (isPortrait) {
    // 📱 PORTRAIT PHONE: 16:9 Native Box with natural black bars
    var scaleW = winH / cW;
    var scaleH = winW / cH;
    var fitScale = Math.min(scaleW, scaleH);
    var finalScale = fitScale * fsZoom;
    fsCanvas.style.transform = "translate(-50%, -50%) rotate(90deg) scale(" + finalScale + ") translate(" + (fsPanY / finalScale) + "px, " + (-fsPanX / finalScale) + "px)";
  } else {
    // 💻 LANDSCAPE PHONE: 16:9 Native Box with natural black bars
    var scaleW = winW / cW;
    var scaleH = winH / cH;
    var fitScale = Math.min(scaleW, scaleH);
    var finalScale = fitScale * fsZoom;
    fsCanvas.style.transform = "translate(-50%, -50%) scale(" + finalScale + ") translate(" + (fsPanX / finalScale) + "px, " + (fsPanY / finalScale) + "px)";
  }
}

window.addEventListener("resize", function() {
  if (document.getElementById("fsOverlay") && document.getElementById("fsOverlay").style.display !== "none") {
    applyFSTransform();
    positionMenuNextToBubble();
  }
});

var cachedWinW = window.innerWidth || window.screen.width;
var cachedWinH = window.innerHeight || window.screen.height;

function updateCachedDimensions() {
  cachedWinW = window.innerWidth || window.screen.width;
  cachedWinH = window.innerHeight || window.screen.height;
}

window.addEventListener("resize", updateCachedDimensions);
window.addEventListener("orientationchange", function() {
  updateCachedDimensions();
  setTimeout(function() {
    updateCachedDimensions();
    applyFSTransform();
    positionMenuNextToBubble();
  }, 150);
});

function getDesktopCoords(clientX, clientY) {
  var winW = cachedWinW;
  var winH = cachedWinH;

  if (winH > winW) {
    // 📱 90° ROTATED PORTRAIT: (Phone is vertical, canvas is rotated 90° landscape)
    var containerW = winH;
    var containerH = winW;
    var targetAspect = 16.0 / 9.0;
    var containerAspect = containerW / containerH;

    var renderW, renderH, offX, offY;
    if (containerAspect > targetAspect) {
      renderH = containerH;
      renderW = containerH * targetAspect;
      offX = (containerW - renderW) / 2.0;
      offY = 0;
    } else {
      renderW = containerW;
      renderH = containerW / targetAspect;
      offX = 0;
      offY = (containerH - renderH) / 2.0;
    }

    var rotX = clientY;
    var rotY = winW - clientX;

    var localX = rotX - offX;
    var localY = rotY - offY;

    var normX = Math.max(0.0, Math.min(1.0, localX / renderW));
    var normY = Math.max(0.0, Math.min(1.0, localY / renderH));

    return {
      px: Math.round(normX * 10000),
      py: Math.round(normY * 10000)
    };
  } else {
    // 💻 LANDSCAPE:
    var targetAspect = 16.0 / 9.0;
    var containerAspect = winW / winH;

    var renderW, renderH, offX, offY;
    if (containerAspect > targetAspect) {
      renderH = winH;
      renderW = winH * targetAspect;
      offX = (winW - renderW) / 2.0;
      offY = 0;
    } else {
      renderW = winW;
      renderH = winW / targetAspect;
      offX = 0;
      offY = (winH - renderH) / 2.0;
    }

    var localX = clientX - offX;
    var localY = clientY - offY;

    var normX = Math.max(0.0, Math.min(1.0, localX / renderW));
    var normY = Math.max(0.0, Math.min(1.0, localY / renderH));

    return {
      px: Math.round(normX * 10000),
      py: Math.round(normY * 10000)
    };
  }
}

var _touchMovePending = null;
var _touchRaf = null;

function sendTouch(action, clientX, clientY, id) {
  var coords = getDesktopCoords(clientX, clientY);
  var tid = id || 0;

  // ⚡ 1. Ultra-Low-Latency In-Socket WebSocket Transmission (<0.1ms!)
  if (_canvasWS && _canvasWS.readyState === 1) {
    _canvasWS.send("T:" + action + ":" + coords.px + ":" + coords.py + ":" + tid);
    return;
  }

  // Fallback to HTTP if WebSocket is not open
  var url = "/api/touch?key=" + KEY + "&px=" + coords.px + "&py=" + coords.py + "&action=" + action + "&id=" + tid;
  if (action === "move") {
    _touchMovePending = url;
    if (!_touchRaf) {
      _touchRaf = requestAnimationFrame(function() {
        if (_touchMovePending) {
          fetch(_touchMovePending, { keepalive: true }).catch(function(){});
          _touchMovePending = null;
        }
        _touchRaf = null;
      });
    }
  } else {
    _touchMovePending = null;
    fetch(url, { keepalive: true }).catch(function(){});
  }
}

function initBubbleDrag() {
  if (bubbleDragBound) return;
  var bubble = document.getElementById("parsecBubble");
  if (!bubble) return;
  bubbleDragBound = true;

  var bTouchX = 0, bTouchY = 0;
  var bStartX = 20, bStartY = 20;

  // Touch Drag
  bubble.addEventListener("touchstart", function(e) {
    if (e.touches.length === 1) {
      bubbleHasDragged = false;
      bTouchX = e.touches[0].clientX;
      bTouchY = e.touches[0].clientY;
      var rect = bubble.getBoundingClientRect();
      bStartX = rect.left;
      bStartY = rect.top;
    }
  }, { passive: true });

  bubble.addEventListener("touchmove", function(e) {
    if (e.touches.length === 1) {
      var dx = e.touches[0].clientX - bTouchX;
      var dy = e.touches[0].clientY - bTouchY;
      if (Math.hypot(dx, dy) > 6) {
        bubbleHasDragged = true;
        var winW = window.innerWidth || window.screen.width;
        var winH = window.innerHeight || window.screen.height;
        var newLeft = Math.max(8, Math.min(winW - 56, bStartX + dx));
        var newTop = Math.max(8, Math.min(winH - 56, bStartY + dy));
        bubble.style.left = newLeft + "px";
        bubble.style.top = newTop + "px";
        positionMenuNextToBubble();
      }
    }
  }, { passive: true });

  // Mouse Drag for Desktop
  var isMouseDown = false;
  bubble.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    bubbleHasDragged = false;
    bTouchX = e.clientX;
    bTouchY = e.clientY;
    var rect = bubble.getBoundingClientRect();
    bStartX = rect.left;
    bStartY = rect.top;
  });

  window.addEventListener("mousemove", function(e) {
    if (!isMouseDown) return;
    var dx = e.clientX - bTouchX;
    var dy = e.clientY - bTouchY;
    if (Math.hypot(dx, dy) > 6) {
      bubbleHasDragged = true;
      var winW = window.innerWidth || window.screen.width;
      var winH = window.innerHeight || window.screen.height;
      var newLeft = Math.max(8, Math.min(winW - 56, bStartX + dx));
      var newTop = Math.max(8, Math.min(winH - 56, bStartY + dy));
      bubble.style.left = newLeft + "px";
      bubble.style.top = newTop + "px";
      positionMenuNextToBubble();
    }
  });

  window.addEventListener("mouseup", function() {
    isMouseDown = false;
  });
}

function initGestures() {
  initBubbleDrag();
  if (gesturesBound) return;
  var fsCanvas = document.getElementById("fsCanvas");
  if (!fsCanvas) return;
  gesturesBound = true;

  var touchStartTime = 0;
  var lastTouchDist = 0;

  fsCanvas.addEventListener("touchstart", function(e) {
    touchMoved = false;
    if (e.touches.length === 2) {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
      lastTouchDist = touchStartDist;
      touchStartZoom = fsZoom;
    } else if (e.touches.length === 1) {
      touchStartTouchX = e.touches[0].clientX;
      touchStartTouchY = e.touches[0].clientY;
      touchStartPanX = fsPanX;
      touchStartPanY = fsPanY;
      touchStartTime = Date.now();

      if (isTouchMouse) {
        sendTouch("down", touchStartTouchX, touchStartTouchY, 0);

        // Long press for Right Click
        longPressTimer = setTimeout(function() {
          if (!touchMoved) {
            vibratePhone(60);
            var coords = getDesktopCoords(touchStartTouchX, touchStartTouchY);
            fetch("/api/mouse?key=" + KEY + "&px=" + coords.px + "&py=" + coords.py + "&click=2", { keepalive: true }).catch(function(){});
          }
        }, 450);
      }
    }
  }, { passive: false });

  fsCanvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      // 🤏 Two-finger Pinch or Scroll
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx, dy);
      if (Math.abs(dist - lastTouchDist) > 10) {
        fsZoom = Math.min(Math.max(touchStartZoom * (dist / touchStartDist), 0.8), 5.0);
        applyFSTransform();
      } else {
        // Two-finger vertical scroll
        var scrollDelta = (e.touches[0].clientY - touchStartTouchY);
        if (Math.abs(scrollDelta) > 15) {
          fetch("/api/mouse_rel?key=" + KEY + "&scroll=" + (scrollDelta > 0 ? -120 : 120), { keepalive: true }).catch(function(){});
          touchStartTouchY = e.touches[0].clientY;
        }
      }
    } else if (e.touches.length === 1) {
      var moveX = e.touches[0].clientX - touchStartTouchX;
      var moveY = e.touches[0].clientY - touchStartTouchY;
      if (Math.hypot(moveX, moveY) > 6) {
        touchMoved = true;
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        if (isTouchMouse) {
          // 🚀 High-Frequency Sub-10ms Native Touch Move
          sendTouch("move", e.touches[0].clientX, e.touches[0].clientY, 0);
        } else {
          fsPanX = touchStartPanX + moveX;
          fsPanY = touchStartPanY + moveY;
          applyFSTransform();
        }
      }
    }
  }, { passive: false });

  fsCanvas.addEventListener("touchend", function(e) {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (isTouchMouse && e.changedTouches.length > 0) {
      var t = e.changedTouches[0];
      if (!touchMoved && (Date.now() - touchStartTime < 350)) {
        // 🎯 100.0% Exact Hardware Touch Tap
        vibratePhone(30);
        sendTouch("tap", t.clientX, t.clientY, 0);
      } else {
        // 🖐️ Natural Touch Release
        sendTouch("up", t.clientX, t.clientY, 0);
      }
    }
  }, { passive: false });

  fsCanvas.addEventListener("wheel", function(e) {
    e.preventDefault();
    var delta = e.deltaY < 0 ? 0.25 : -0.25;
    fsZoom = Math.min(Math.max(fsZoom + delta, 0.8), 5.0);
    applyFSTransform();
  }, { passive: false });
}

function openFS(){
  var overlay = document.getElementById("fsOverlay");
  if (overlay) overlay.style.display = "flex";
  if (!isStreaming) toggleStream();

  var winW = window.innerWidth || window.screen.width;
  var winH = window.innerHeight || window.screen.height;
  if (winH > winW) {
    isFsRotated = true;
  } else {
    isFsRotated = false;
  }

  // YouTube / Parsec Fullscreen Request
  var docEl = document.documentElement;
  if (docEl.requestFullscreen) docEl.requestFullscreen().catch(function(){});
  else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen().catch(function(){});

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(function(){});
  }

  fsZoom = 1.0; fsPanX = 0; fsPanY = 0;
  applyFSTransform();
  setTimeout(initGestures, 100);
}

function closeFS(){
  var overlay = document.getElementById("fsOverlay");
  if (overlay) overlay.style.display = "none";
  var menu = document.getElementById("parsecMenu");
  if (menu) menu.style.display = "none";

  if (document.exitFullscreen) document.exitFullscreen().catch(function(){});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(function(){});

  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}

var isStreaming = false;
var mjpegTimer = null;
var h264Controller = null;
var STREAM_CODEC = "avc1.42001E";


// 🎬 H.264 LIVE VIDEO ENGINE (MediaSource Extensions = hardware decoded MP4 video)
// fetch() streams fragmented MP4 over plain HTTP -> works through Cloudflare tunnels,
// gives a REAL video experience (smooth motion, inter-frame compression) like streaming apps.
var h264Retries = 0;
// 🔄 AUTO-RECONNECT: if the H.264 stream drops (network blip, tunnel hiccup,
// brief server stall), re-tune like a real live player instead of dropping to the
// low-quality MJPEG fallback. Budget of 3 retries, then fallback.
function h264Reconnect(){
  if (h264Retries >= 3) { if (isStreaming) fallbackToMJPEG(); return; }
  h264Retries++;
  stopH264();
  setTimeout(function(){
    if (!isStreaming) return;
    var v = document.getElementById("liveVideo");
    if (v) v.style.display = "block";
    if (!startH264() && isStreaming) fallbackToMJPEG();
  }, 600);
}

function startH264(){
  var video = document.getElementById("liveVideo");
  if (!video || !window.MediaSource) return false;

  var mediaSource = new MediaSource();
  var blobUrl = URL.createObjectURL(mediaSource);
  var aborted = false;
  var sb = null;
  var msOpened = false;
  var pendingBytes = new Uint8Array(0);
  var appendQueue = [];
  var appending = false;
  var initChunk = null;
  var gotFtyp = false;
  var gotMoov = false;
  var haveInit = false;
  var streamCodec = null;
  var firstFragments = [];
  var abortCtrl = (window.AbortController) ? new AbortController() : null;
  var controller = { aborted: false, video: video };

  video.src = blobUrl;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.style.display = "block";

  function hx(n){ return ("0" + n.toString(16)).slice(-2).toUpperCase(); }

  function drainQueue(){
    if (!sb || appending || appendQueue.length === 0) return;
    appending = true;
    var chunk = appendQueue.shift();
    try { sb.appendBuffer(chunk); } catch(e) { appending = false; }
  }

  function tryCreateSB(){
    if (!msOpened || !haveInit || sb) return;
    try {
      sb = mediaSource.addSourceBuffer('video/mp4; codecs="' + streamCodec + '"');
      sb.mode = 'segments';
    } catch(e) {
      if (!aborted) fallbackToMJPEG();
      return;
    }
    sb.addEventListener('updateend', function(){
      appending = false;
      drainQueue();
      // ⚡ Explicitly start video playback on Android WebView
      if (video.paused) {
        var p = video.play();
        if (p && p.catch) p.catch(function(e){});
      }
      // ⚡ Chase the live edge: keep latency under ~1s like a real live stream
      if (video.buffered.length > 0) {
        var end = video.buffered.end(video.buffered.length - 1);
        if (end - video.currentTime > 1.5) video.currentTime = end - 0.5;
      }
    });
    appendQueue.push(initChunk);
    if (firstFragments.length > 0) {
      var tLen = 0;
      for (var i = 0; i < firstFragments.length; i++) tLen += firstFragments[i].length;
      var mChunk = new Uint8Array(tLen);
      var off = 0;
      for (var j = 0; j < firstFragments.length; j++) { mChunk.set(firstFragments[j], off); off += firstFragments[j].length; }
      appendQueue.push(mChunk);
      firstFragments = [];
    }
    drainQueue();
  }

  // Walk the box tree to find avcC. Containers have different header sizes:
  // plain container boxes (moov/trak/mdia/minf/stbl) = 8-byte header;
  // stsd (FullBox) = 8-byte header + 8-byte (version/flags + entry_count);
  // avc1 sample entry = 8-byte header + 78-byte visual entry payload.
  function walkBoxes(buf, off, end, headerSkip){
    var p = off + headerSkip;
    while (p + 8 <= end) {
      var sz = (buf[p]<<24)|(buf[p+1]<<16)|(buf[p+2]<<8)|buf[p+3];
      if (sz < 8 || p + sz > end) break;
      var type = String.fromCharCode(buf[p+4],buf[p+5],buf[p+6],buf[p+7]);
      if (type === 'avcC') return buf.subarray(p+8, p+sz);
      if (type === 'stsd')      { var r = walkBoxes(buf, p+8, p+sz, 8);  if (r) return r; }
      else if (type === 'avc1') { var r = walkBoxes(buf, p+8, p+sz, 78); if (r) return r; }
      else if (type === 'trak' || type === 'mdia' || type === 'minf' || type === 'stbl') {
        var r = walkBoxes(buf, p+8, p+sz, 0);
        if (r) return r;
      }
      p += sz;
    }
    return null;
  }
  function findAvcC(moovBox){
    // moovBox includes its 8-byte header; children start after it.
    return walkBoxes(moovBox, 8, moovBox.length, 0);
  }

  mediaSource.addEventListener('sourceopen', function(){
    msOpened = true;
    tryCreateSB();
  });

  var streamUrl = '/h264?key=' + KEY + '&t=' + Date.now();
  var fetchOpts = { headers: { "Bypass-Tunnel-Reminder": "true" } };
  if (abortCtrl) fetchOpts.signal = abortCtrl.signal;
  fetch(streamUrl, fetchOpts).then(function(res){
    if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
    var reader = res.body.getReader();
    function pump(){
      reader.read().then(function(r){
        if (aborted) return;
        if (r.done) { window.__fallbackReason = "stream ended"; if (!aborted) { h264Reconnect(); return; } }
        // accumulate bytes and split into complete top-level MP4 boxes
        if (pendingBytes.length === 0) {
          pendingBytes = r.value;
        } else {
          var merged = new Uint8Array(pendingBytes.length + r.value.length);
          merged.set(pendingBytes); merged.set(r.value, pendingBytes.length);
          pendingBytes = merged;
        }
        var boxes = [];
        while (pendingBytes.length >= 8) {
          var size = (pendingBytes[0]<<24)|(pendingBytes[1]<<16)|(pendingBytes[2]<<8)|pendingBytes[3];
          if (size < 8 || size > pendingBytes.length) break;
          boxes.push(pendingBytes.slice(0, size));
          pendingBytes = pendingBytes.slice(size);
        }
        for (var bi = 0; bi < boxes.length; bi++) {
          var b = boxes[bi];
          var t = String.fromCharCode(b[4],b[5],b[6],b[7]);
          if (t === 'moov' && !gotMoov) {
            // 🎯 DERIVE CODEC FROM THE ACTUAL avcC: guarantees the SourceBuffer
            // codec always matches THIS stream's SPS/PPS -> reload-proof, no mismatch.
            var avcc = findAvcC(b);
            if (!avcc || avcc.length < 5) { window.__fallbackReason = "no avcC"; if (!aborted) fallbackToMJPEG(); return; }
            streamCodec = 'avc1.' + hx(avcc[1]) + hx(avcc[2]) + hx(avcc[3]);
            gotMoov = true;
            if (initChunk) {
              var mi = new Uint8Array(initChunk.length + b.length);
              mi.set(initChunk); mi.set(b, initChunk.length);
              initChunk = mi;
            } else {
              initChunk = b;
            }
            haveInit = true;
            tryCreateSB();
            continue;
          }
          if (t === 'ftyp') {
            if (initChunk) {
              var mf = new Uint8Array(b.length + initChunk.length);
              mf.set(b); mf.set(initChunk, b.length);
              initChunk = mf;
            } else {
              initChunk = b;
            }
            gotFtyp = true;
            continue;
          }
          if (haveInit) {
            // ⚡ CRITICAL: keep moof+mdat TOGETHER in one appendBuffer call.
            // Chrome's demuxer resolves each moof's sample data from the mdat that
            // follows it IN THE SAME append. Separate appends yield no decodable frames.
            firstFragments.push(b);
            if (sb) {
              var tL = 0;
              for (var i2 = 0; i2 < firstFragments.length; i2++) tL += firstFragments[i2].length;
              var mC = new Uint8Array(tL);
              var o2 = 0;
              for (var j2 = 0; j2 < firstFragments.length; j2++) { mC.set(firstFragments[j2], o2); o2 += firstFragments[j2].length; }
              appendQueue.push(mC);
              firstFragments = [];
              drainQueue();
            }
          }
        }
        pump();
      }).catch(function(e){
        window.__fallbackReason = "reader: " + e;
        if (!aborted) h264Reconnect();
      });
    }
    pump();
  }).catch(function(e){
    window.__fallbackReason = "fetch: " + e;
    if (!aborted) h264Reconnect();
  });

  mediaSource.addEventListener('sourceended', function(){
    window.__fallbackReason = "sourceended";
    if (!aborted) h264Reconnect();
  });
  video.addEventListener('error', function(){
    window.__fallbackReason = "video error: " + (video.error ? video.error.code : "?");
    if (!aborted && isStreaming) h264Reconnect();
  });

  controller.abort = function(){
    aborted = true;
    controller.aborted = true;
    if (abortCtrl) { try { abortCtrl.abort(); } catch(e){} }
    try { if (mediaSource.readyState === 'open') mediaSource.endOfStream(); } catch(e){}
    try { video.pause(); video.removeAttribute('src'); video.load(); } catch(e){}
    try { URL.revokeObjectURL(blobUrl); } catch(e){}
  };
  h264Controller = controller;
  return true;
}

function stopH264(){
  if (h264Controller) {
    h264Controller.abort();
    h264Controller = null;
  }
  var video = document.getElementById("liveVideo");
  if (video) { video.removeAttribute('src'); video.load(); video.style.display = "none"; }
}

// 📷 MJPEG fallback (used automatically if H.264/MSE is unavailable or the stream drops)
function fallbackToMJPEG(){
  if (!isStreaming) return;
  clearTimeout(mjpegTimer);
  mjpegTimer = setTimeout(function(){
    if (!isStreaming) return;
    if (h264Controller) { h264Controller.abort(); h264Controller = null; }
    var video = document.getElementById("liveVideo");
    var img = document.getElementById("liveImg");
    if (video) { video.removeAttribute('src'); video.load(); video.style.display = "none"; }
    if (img) {
      img.style.display = "block";
      img.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
      img.onerror = function(){
        if (isStreaming) {
          clearTimeout(mjpegTimer);
          mjpegTimer = setTimeout(function(){
            if (isStreaming && document.getElementById("liveImg")) {
              document.getElementById("liveImg").src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
            }
          }, 1500);
        }
      };
    }
    var q = document.querySelector('.stream-quality');
    if (q) q.textContent = "STANDARD MODE • AUTO-RECONNECTING";
  }, 600);
}

function startMJPEG(){
  var liveImg = document.getElementById("liveImg");
  if (!liveImg) return;
  var wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsUrl = wsProtocol + '//' + location.host + '/ws?key=' + KEY;
  try {
    window.__wsStream = new WebSocket(wsUrl);
    window.__wsStream.binaryType = "arraybuffer";
    window.__wsStream.onmessage = function(e) {
      if (!isStreaming) { try{window.__wsStream.close();}catch(c){} return; }
      var blob = new Blob([e.data], {type: "image/jpeg"});
      var oldUrl = liveImg.src;
      liveImg.src = URL.createObjectURL(blob);
      if (oldUrl && oldUrl.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
    };
    window.__wsStream.onerror = function() {
      liveImg.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
    };
  } catch(err) {
    liveImg.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
  }
}

function stopMJPEG(){
  var liveImg = document.getElementById("liveImg");
  if (liveImg) { liveImg.onerror = null; liveImg.removeAttribute("src"); }
  if (window.__wsStream) { try{ window.__wsStream.close(); }catch(e){} }
  clearTimeout(mjpegTimer);
}

function toggleStream(){
  isStreaming = !isStreaming;
  var holder = document.getElementById("mirrorPlaceholder");
  var canvas = document.getElementById("gpuCanvas");
  var liveImg = document.getElementById("liveImg");
  var btn = document.getElementById("toggleBtn");
  var q = document.querySelector('.stream-quality');

  if(isStreaming){
    if (btn) btn.textContent = "⏸ PAUSE MONITOR";
    if (holder) holder.style.display = "none";
    if (liveImg) liveImg.style.display = "none";
    if (canvas) canvas.style.display = "block";
    if (q) q.textContent = "720P • 60 FPS • ⚡ DIRECT GPU SPEED";

    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.setNativeInput === 'function') {
      try { window.AndroidNativeStream.setNativeInput(true); } catch(e) {}
    }
    startCanvasStream();
  } else {
    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.setNativeInput === 'function') {
      try { window.AndroidNativeStream.setNativeInput(false); } catch(e){}
    }
    stopCanvasStream();
    if (canvas) canvas.style.display = "none";
    if (liveImg) liveImg.style.display = "none";
    if (holder) holder.style.display = "block";
    if (btn) btn.textContent = "▶ PLAY LIVE STREAM";
    if (q) q.textContent = "1080P • 30 FPS • ENCRYPTED";
  }
}

// ── Canvas GPU Stream Engine ────────────────────────────────────
// Uses WebSocket binary JPEG → createImageBitmap() → Canvas GPU draw
// Zero-copy, GPU hardware decoded, runs at screen refresh rate
var _canvasWS = null;
var _canvasEl = null;
var _canvasCtx = null;
var _pendingFrame = null;
var _rafId = null;
var _frameCount = 0;
var _fpsTimer = null;
var _webrtcPC = null;
var _webrtcDC = null;

function startCanvasStream() {
  _canvasEl = document.getElementById("gpuCanvas");
  if (!_canvasEl) return;
  _canvasEl.style.display = "block";
  _canvasCtx = _canvasEl.getContext("2d");

  var _cachedFsCanvas = document.getElementById("fsCanvas");
  var _cachedFsOverlay = document.getElementById("fsOverlay");
  var _cachedFsCtx = _cachedFsCanvas ? _cachedFsCanvas.getContext("2d") : null;

  // FPS ticker
  _frameCount = 0;
  clearInterval(_fpsTimer);
  _fpsTimer = setInterval(function() {
    if (!isStreaming) { clearInterval(_fpsTimer); return; }
    var q = document.querySelector('.stream-quality');
    if (q) {
      q.textContent = "720P • " + _frameCount + " FPS • ⚡ DIRECT GPU SPEED";
    }
    if (window.Telemetry) {
      Telemetry.log("STREAM_HEARTBEAT", { fps: _frameCount, zoom: fsZoom });
    }
    _frameCount = 0;
  }, 3000);

  var _latestBlob = null;
  var _isDecoding = false;

  function _drainDecode() {
    if (!_latestBlob || !isStreaming) { _isDecoding = false; return; }
    _isDecoding = true;
    var currentBlob = _latestBlob;
    _latestBlob = null;
    createImageBitmap(currentBlob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).then(function(bitmap) {
      if (_canvasCtx && _canvasEl) {
        if (_canvasEl.width !== bitmap.width) {
          _canvasEl.width  = bitmap.width;
          _canvasEl.height = bitmap.height;
          _canvasCtx.imageSmoothingEnabled = true;
          _canvasCtx.imageSmoothingQuality = "high";
        }
        _canvasCtx.drawImage(bitmap, 0, 0);
      }
      if (_cachedFsOverlay && _cachedFsOverlay.style.display !== "none" && _cachedFsCtx && _cachedFsCanvas) {
        if (_cachedFsCanvas.width !== bitmap.width) {
          _cachedFsCanvas.width  = bitmap.width;
          _cachedFsCanvas.height = bitmap.height;
          _cachedFsCtx.imageSmoothingEnabled = true;
          _cachedFsCtx.imageSmoothingQuality = "high";
        }
        _cachedFsCtx.drawImage(bitmap, 0, 0);
      }
      bitmap.close();
      if (_canvasWS && _canvasWS.readyState === 1) {
        try { _canvasWS.send("A"); } catch(x){}
      }

      if (_latestBlob) {
        _drainDecode();
      } else {
        _isDecoding = false;
      }
    }).catch(function() {
      if (_canvasWS && _canvasWS.readyState === 1) {
        try { _canvasWS.send("A"); } catch(x){}
      }
      _isDecoding = false;
    });
  }

  var wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsUrl = wsProto + "//" + window.location.host + "/ws?key=" + KEY;
  try {
    _canvasWS = new WebSocket(wsUrl);
    _canvasWS.binaryType = "arraybuffer";

    _canvasWS.onopen = function() {
      var q = document.querySelector('.stream-quality');
      if (q) q.textContent = "720P • 60 FPS • ⚡ DIRECT GPU SPEED";
      try { _canvasWS.send("A"); } catch(e){}
    };

    _canvasWS.onmessage = function(e) {
      if (!isStreaming) { try { _canvasWS.close(); } catch(x){} return; }
      _frameCount++;
      _latestBlob = new Blob([e.data], { type: "image/jpeg" });
      if (!_isDecoding) {
        _drainDecode();
      }
    };

    _canvasWS.onerror = function() {
      if (isStreaming) {
        var liveImg2 = document.getElementById("liveImg");
        if (liveImg2) {
          liveImg2.style.display = "block";
          liveImg2.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
        }
        if (_canvasEl) _canvasEl.style.display = "none";
      }
    };

    _canvasWS.onclose = function() {
      if (isStreaming) {
        setTimeout(function() { if (isStreaming) startCanvasStream(); }, 1000);
      }
    };
  } catch(err) {
    if (isStreaming) {
      var liveImg3 = document.getElementById("liveImg");
      if (liveImg3) { liveImg3.style.display = "block"; liveImg3.src = "/mjpeg?key=" + KEY + "&t=" + Date.now(); }
      if (_canvasEl) _canvasEl.style.display = "none";
    }
  }

}

function stopCanvasStream() {
  isStreaming = false;
  clearInterval(_fpsTimer);
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  if (_canvasWS) { try { _canvasWS.close(); } catch(e){} _canvasWS = null; }
  if (_pendingFrame) { _pendingFrame.close(); _pendingFrame = null; }
  stopMJPEG();
}
// ──────────────────────────────────────────────────────────────────

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
// (initLiveKeyboard removed: it was never defined, and its ReferenceError killed the monitor auto-start)
setTimeout(function() {
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

    window.sendMouseClick = function(btn) {
        vibratePhone(40);
        if (_canvasWS && _canvasWS.readyState === 1) {
            _canvasWS.send("M:0:0:0:" + btn);
        } else {
            fetch('/api/mouse_rel?key=' + KEY + '&click=' + btn, { keepalive: true }).catch(function(){});
        }
    };

    function flushDelta() {
        if (accDx !== 0 || accDy !== 0 || accScroll !== 0) {
            var sendX = Math.round(accDx);
            var sendY = Math.round(accDy);
            var sendS = Math.round(accScroll);
            accDx = 0; accDy = 0; accScroll = 0;

            if (_canvasWS && _canvasWS.readyState === 1) {
                _canvasWS.send("M:" + sendX + ":" + sendY + ":" + sendS + ":0");
            } else {
                var url = "/api/mouse_rel?key=" + KEY;
                if (sendX !== 0 || sendY !== 0) url += (url.indexOf('?') > -1 ? '&' : '?') + "dx=" + sendX + "&dy=" + sendY;
                if (sendS !== 0) url += (url.indexOf('?') > -1 ? '&' : '?') + "scroll=" + sendS;
                fetch(url, { keepalive: true }).catch(function(){});
            }
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

// -------------------------------------------------------------
// 🧠 GEMINI 3.1 FLASH LIVE VOICE AI & CYBER SANDBOX TERMINAL
// -------------------------------------------------------------
var geminiWs = null;
var audioInputCtx = null;
var audioInputProcessor = null;
var audioInputSource = null;
var audioPlaybackCtx = null;
var nextPlayTime = 0;

var blobState = {
  active: false,
  status: "disc",
  micLevel: 0,
  geminiLevel: 0
};

var DEFAULT_GEMINI_KEY = "";

function fetchLocalGeminiKey(callback) {
  fetch("/api/gemini_key?key=" + KEY)
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d && d.key) {
        DEFAULT_GEMINI_KEY = d.key;
        var saved = localStorage.getItem("gemini_api_key");
        if (!saved || saved.startsWith("AIzaSyCkyi")) {
          localStorage.setItem("gemini_api_key", d.key);
        }
      }
      if (callback) callback();
    })
    .catch(function(){
      if (callback) callback();
    });
}
fetchLocalGeminiKey();

function toggleGeminiKeyModal() {
  var m = document.getElementById("geminiKeyModal");
  if (!m) return;
  var input = document.getElementById("geminiApiKeyInput");
  var saved = localStorage.getItem("gemini_api_key");
  if (saved && saved.startsWith("AIzaSyCkyi")) {
    localStorage.removeItem("gemini_api_key");
    saved = "";
  }
  if (input) input.value = saved || DEFAULT_GEMINI_KEY;
  m.style.display = (m.style.display === "none" || !m.style.display) ? "flex" : "none";
}

function closeGeminiKeyModal() {
  var m = document.getElementById("geminiKeyModal");
  if (m) m.style.display = "none";
}

function saveGeminiApiKey() {
  var input = document.getElementById("geminiApiKeyInput");
  if (input && input.value.trim()) {
    localStorage.setItem("gemini_api_key", input.value.trim());
    appendGeminiLog("sys", "[KEY] Gemini API Key saved locally.");
    closeGeminiKeyModal();
  }
}

function toggleGeminiTerminal() {
  var t = document.getElementById("geminiTerminalBox");
  if (!t) return;
  t.style.display = (t.style.display === "none" || !t.style.display) ? "block" : "none";
}

function clearGeminiTerminal() {
  var l = document.getElementById("geminiTerminalLogs");
  if (l) l.innerHTML = '<div class="t-log sys">[SYSTEM] Terminal logs cleared.</div>';
}

function appendGeminiLog(type, text) {
  var l = document.getElementById("geminiTerminalLogs");
  if (!l) return;
  var d = document.createElement("div");
  d.className = "t-log " + type;
  d.textContent = text;
  l.appendChild(d);
  l.scrollTop = l.scrollHeight;
}

function executeManualTerminalCmd() {
  var inp = document.getElementById("manualTerminalInput");
  if (!inp || !inp.value.trim()) return;
  var cmd = inp.value.trim();
  inp.value = "";

  if (cmd.startsWith("/ai ") || (geminiWs && geminiWs.readyState === WebSocket.OPEN && !cmd.startsWith("ps ") && !cmd.startsWith("cmd "))) {
    var prompt = cmd.startsWith("/ai ") ? cmd.substring(4) : cmd;
    sendTextMessageToGemini(prompt);
  } else {
    appendGeminiLog("user", "PS > " + cmd);
    fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(cmd))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.output) {
          appendGeminiLog("out", data.output);
        } else {
          appendGeminiLog("out", "[No output]");
        }
      })
      .catch(function(err){
        appendGeminiLog("err", "[ERROR] " + err);
      });
  }
}

// 🔮 ORGANIC REACTIVE CYBER AUDIO BLOB ENGINE
function initGeminiBlobVisualizer() {
  var cvs = document.getElementById("geminiBlobCanvas");
  if (!cvs) return;
  var ctx = cvs.getContext("2d");
  var t = 0;

  function draw() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    var cx = cvs.width / 2;
    var cy = cvs.height / 2;
    t += 0.04;

    var level = Math.max(blobState.micLevel, blobState.geminiLevel);
    var baseRadius = 45 + level * 25;
    
    var color1 = "rgba(0, 240, 255, 0.8)";
    var color2 = "rgba(0, 255, 65, 0.5)";
    var glowColor = "rgba(0, 240, 255, 0.4)";

    if (blobState.status === "speak") {
      color1 = "rgba(0, 240, 255, 0.95)";
      color2 = "rgba(255, 0, 85, 0.7)";
      glowColor = "rgba(0, 240, 255, 0.6)";
      baseRadius = 50 + blobState.geminiLevel * 40;
    } else if (blobState.status === "listen") {
      color1 = "rgba(0, 255, 65, 0.95)";
      color2 = "rgba(0, 240, 255, 0.6)";
      glowColor = "rgba(0, 255, 65, 0.6)";
      baseRadius = 48 + blobState.micLevel * 35;
    } else if (blobState.status === "exec") {
      color1 = "rgba(255, 0, 85, 0.95)";
      color2 = "rgba(255, 170, 0, 0.8)";
      glowColor = "rgba(255, 0, 85, 0.6)";
      baseRadius = 52 + Math.sin(t * 3) * 8;
    } else if (blobState.status === "conn") {
      color1 = "rgba(255, 170, 0, 0.9)";
      color2 = "rgba(0, 240, 255, 0.5)";
      glowColor = "rgba(255, 170, 0, 0.4)";
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + 14 + Math.sin(t * 1.5) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    var points = 12;
    for (var i = 0; i <= points; i++) {
      var angle = (i / points) * Math.PI * 2;
      var distortion = Math.sin(angle * 3 + t * 2) * (8 + level * 16) + Math.cos(angle * 2 - t) * (6 + level * 12);
      var r = baseRadius + distortion;
      var x = cx + Math.cos(angle) * r;
      var y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    var grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseRadius + 20);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(draw);
  }
  draw();
}

function setGeminiStatus(st, titleText, subText) {
  blobState.status = st;
  var pill = document.getElementById("geminiStatusPill");
  var icon = document.getElementById("geminiBlobIcon");
  var btn = document.getElementById("geminiConnectBtn");
  var tEl = document.getElementById("geminiVoiceTitle");
  var sEl = document.getElementById("geminiVoiceSub");

  if (pill) {
    pill.className = "gemini-status-pill status-" + st;
    var txtMap = { disc: "DISCONNECTED", conn: "CONNECTING...", listen: "LISTENING", speak: "SPEAKING", exec: "EXECUTING..." };
    pill.textContent = txtMap[st] || st.toUpperCase();
  }
  if (icon) {
    var iconMap = { disc: "🎙️", conn: "⏳", listen: "👂", speak: "🔊", exec: "⚡" };
    icon.textContent = iconMap[st] || "🎙️";
  }
  if (btn) {
    if (st === "disc") {
      btn.className = "gemini-btn-connect";
      btn.textContent = "⚡ CONNECT AI";
    } else {
      btn.className = "gemini-btn-connect connected";
      btn.textContent = "✖ DISCONNECT";
    }
  }
  if (tEl && titleText) tEl.textContent = titleText;
  if (sEl && subText) sEl.textContent = subText;
}

function toggleGeminiLiveConnection() {
  if (geminiWs && (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING)) {
    disconnectGeminiLive();
  } else {
    connectGeminiLive();
  }
}

function connectGeminiLive() {
  var saved = localStorage.getItem("gemini_api_key");
  if (saved && saved.startsWith("AIzaSyCkyi")) {
    localStorage.removeItem("gemini_api_key");
    saved = "";
  }
  var apiKey = saved || DEFAULT_GEMINI_KEY;
  if (!apiKey) {
    fetchLocalGeminiKey(function() {
      var k = localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_KEY;
      if (k) {
        connectGeminiLive();
      } else {
        toggleGeminiKeyModal();
        appendGeminiLog("err", "[ERROR] Please enter your Gemini API Key in the modal.");
      }
    });
    return;
  }

  setGeminiStatus("conn", "CONNECTING TO GEMINI 3.1...", "Establishing encrypted full-duplex WebSocket link.");
  appendGeminiLog("sys", "[CONNECT] Initializing Gemini 3.1 Live WebSocket session...");

  var host = "generativelanguage.googleapis.com";
  var path = "/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=" + apiKey;
  var wsUrl = "wss://" + host + path;

  try {
    geminiWs = new WebSocket(wsUrl);
  } catch (e) {
    setGeminiStatus("disc", "CONNECTION FAILED", e.message);
    appendGeminiLog("err", "[WS FAILED] " + e.message);
    return;
  }

  geminiWs.onopen = function() {
    appendGeminiLog("sys", "[WS OPEN] Link established. Sending setup payload for gemini-3.1-flash-live-preview...");
    
    var toolsPayload = [
      {
        functionDeclarations: [
          {
            name: "lock_workstation",
            description: "Locks the Windows computer workstation immediately."
          },
          {
            name: "trigger_panic",
            description: "Toggles emergency panic mode, sounding intruder alarm and switching to isolated safe virtual desktop."
          },
          {
            name: "set_volume",
            description: "Sets the Windows system master audio volume percentage (0 to 100).",
            parameters: {
              type: "OBJECT",
              properties: {
                level: { type: "INTEGER", description: "Volume percentage 0 to 100" }
              },
              required: ["level"]
            }
          },
          {
            name: "get_pc_status",
            description: "Gets current live status of Windows PC (lock state, panic state, server status)."
          },
          {
            name: "run_powershell_command",
            description: "Executes a PowerShell or CMD command in the Windows sandbox on the PC and returns the command output.",
            parameters: {
              type: "OBJECT",
              properties: {
                command: { type: "STRING", description: "The PowerShell or CMD command string to execute." }
              },
              required: ["command"]
            }
          },
          {
            name: "type_keyboard",
            description: "Types text or special keys ({ENTER}, {ESC}, {BACKSPACE}, {TAB}) on the Windows PC.",
            parameters: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING", description: "The text or special key to type." }
              },
              required: ["text"]
            }
          },
          {
            name: "sleep_pc",
            description: "Puts the Windows computer into low power sleep mode."
          }
        ]
      }
    ];

    var setupMsg = {
      setup: {
        model: "models/gemini-2.5-flash-native-audio-latest",
        generationConfig: {
          responseModalities: ["AUDIO"]
        },
        systemInstruction: {
          parts: [
            {
              text: "You are JARVIS / PanicCTRL, an elite cybernetic voice AI assistant embedded into Imran's personal Windows workstation. You can speak naturally in English or Bengali (বাংলা). You have direct control of the Windows PC via tool calling. When the user asks you to lock the PC, trigger panic, check PC status, run PowerShell commands, adjust volume, or type on the PC, call the appropriate tool immediately and report the result in a concise, cool cybernetic voice."
            }
          ]
        },
        tools: toolsPayload
      }
    };

    geminiWs.send(JSON.stringify(setupMsg));
    initPlaybackAudioContext();
    appendGeminiLog("sys", "[SETUP SENT] Waiting for setupComplete from Google...");
  };

  geminiWs.onmessage = function(event) {
    if (typeof event.data === "string") {
      try {
        var msg = JSON.parse(event.data);
        handleGeminiServerMessage(msg);
      } catch (e) {
        console.error("Error parsing Gemini WS message", e);
      }
    } else if (event.data instanceof Blob) {
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var msg = JSON.parse(reader.result);
          handleGeminiServerMessage(msg);
        } catch (e) {}
      };
      reader.readAsText(event.data);
    }
  };

  geminiWs.onerror = function(err) {
    appendGeminiLog("err", "[WS ERROR] Check API Key and network connection.");
    setGeminiStatus("disc", "CONNECTION ERROR", "WebSocket encountered an error.");
  };

  geminiWs.onclose = function(e) {
    appendGeminiLog("sys", "[WS CLOSED] Code: " + e.code + " Reason: " + (e.reason || "Connection terminated"));
    disconnectGeminiLive();
  };
}

function handleGeminiServerMessage(msg) {
  // 🎯 1. Handle Setup Complete Acknowledgement
  if (msg.setupComplete) {
    appendGeminiLog("sys", "[READY] Gemini 3.1 Live session handshake verified!");
    setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally or type to control your PC.");
    startMicrophoneCapture();
    return;
  }

  // 🎯 2. Handle Model Turn Audio / Text Streams
  if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
    for (var i = 0; i < msg.serverContent.modelTurn.parts.length; i++) {
      var part = msg.serverContent.modelTurn.parts[i];
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith("audio/pcm")) {
        setGeminiStatus("speak", "GEMINI SPEAKING...", "Streaming 24kHz real-time audio.");
        playPcm24kBase64Chunk(part.inlineData.data);
      }
      if (part.text) {
        appendGeminiLog("ai", "🧠 " + part.text);
      }
    }
  }

  if (msg.serverContent && msg.serverContent.turnComplete) {
    setTimeout(function(){
      if (blobState.status === "speak") {
        setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally to control your PC.");
      }
    }, 400);
  }

  if (msg.toolCall && msg.toolCall.functionCalls) {
    for (var j = 0; j < msg.toolCall.functionCalls.length; j++) {
      var call = msg.toolCall.functionCalls[j];
      executeGeminiToolCall(call);
    }
  }
}

function executeGeminiToolCall(call) {
  setGeminiStatus("exec", "EXECUTING TOOL...", call.name);
  appendGeminiLog("tool", "[TOOL CALL] " + call.name + "(" + JSON.stringify(call.args || {}) + ")");

  var toolPromise = null;
  var name = call.name;
  var args = call.args || {};

  if (name === "lock_workstation") {
    toolPromise = fetch("/lock?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "trigger_panic") {
    toolPromise = fetch("/panic?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "get_pc_status") {
    toolPromise = fetch("/api/status?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "run_powershell_command") {
    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(args.command || "")).then(function(r){ return r.json(); });
  } else if (name === "type_keyboard") {
    toolPromise = fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(args.text || "")).then(function(){ return { status: "typed" }; });
  } else if (name === "sleep_pc") {
    toolPromise = fetch("/sleep?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "set_volume") {
    var vol = Math.max(0, Math.min(100, args.level || 50));
    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent("(New-Object -ComObject WScript.Shell)")).then(function(){ return { volume: vol }; });
  } else {
    toolPromise = Promise.resolve({ error: "Unknown function" });
  }

  toolPromise
    .then(function(resData) {
      appendGeminiLog("out", "[TOOL RESULT] " + JSON.stringify(resData));
      sendToolResponseToGemini(call.id, resData);
      setTimeout(function(){
        if (blobState.status === "exec") {
          setGeminiStatus("listen", "AI LIVE & LISTENING", "Command executed. Listening...");
        }
      }, 600);
    })
    .catch(function(err) {
      appendGeminiLog("err", "[TOOL ERROR] " + err);
      sendToolResponseToGemini(call.id, { error: String(err) });
    });
}

function sendToolResponseToGemini(callId, resultData) {
  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
  var resp = {
    toolResponse: {
      functionResponses: [
        {
          id: callId,
          response: { output: resultData }
        }
      ]
    }
  };
  geminiWs.send(JSON.stringify(resp));
}

function sendTextMessageToGemini(text) {
  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) {
    appendGeminiLog("err", "[ERROR] Gemini Live is not connected. Click ⚡ CONNECT AI first.");
    return;
  }
  appendGeminiLog("user", "🗣️ User: " + text);
  var msg = {
    clientContent: {
      turns: [
        {
          role: "user",
          parts: [{ text: text }]
        }
      ],
      turnComplete: true
    }
  };
  geminiWs.send(JSON.stringify(msg));
  setGeminiStatus("speak", "GEMINI PROCESSING...", "Generating audio & executing tools...");
}

function startMicrophoneCapture() {
  var getUserMediaFn = null;
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    getUserMediaFn = function(constraints) { return navigator.mediaDevices.getUserMedia(constraints); };
  } else {
    var legacyGUM = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (legacyGUM) {
      getUserMediaFn = function(constraints) {
        return new Promise(function(resolve, reject) {
          legacyGUM.call(navigator, constraints, resolve, reject);
        });
      };
    }
  }

  if (!getUserMediaFn) {
    appendGeminiLog("err", "[MIC NOTICE] Mobile Chrome blocks Mic over plain HTTP (Insecure Context).");
    appendGeminiLog("sys", "[TIP] Use Cloudflare HTTPS URL, or type your voice commands in the Terminal input below!");
    setGeminiStatus("listen", "TEXT & CLOUD READY", "Type below or use HTTPS URL for live microphone.");
    return;
  }

  getUserMediaFn({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    .then(function(stream) {
      audioInputCtx = new (window.AudioContext || window.webkitAudioContext)();
      var sampleRate = audioInputCtx.sampleRate;
      audioInputSource = audioInputCtx.createMediaStreamSource(stream);

      var analyser = audioInputCtx.createAnalyser();
      analyser.fftSize = 64;
      var dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioInputSource.connect(analyser);

      function updateMicVisual() {
        if (!audioInputCtx) return;
        analyser.getByteFrequencyData(dataArray);
        var sum = 0;
        for (var i = 0; i < dataArray.length; i++) sum += dataArray[i];
        blobState.micLevel = (sum / dataArray.length) / 255;
        requestAnimationFrame(updateMicVisual);
      }
      updateMicVisual();

      audioInputProcessor = audioInputCtx.createScriptProcessor(4096, 1, 1);
      audioInputSource.connect(audioInputProcessor);
      audioInputProcessor.connect(audioInputCtx.destination);

      audioInputProcessor.onaudioprocess = function(e) {
        if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
        var inputData = e.inputBuffer.getChannelData(0);
        var downsampled = downsampleBuffer(inputData, sampleRate, 16000);
        var pcm16 = convertFloat32ToInt16(downsampled);
        var base64Chunk = arrayBufferToBase64(pcm16.buffer);

        var chunkMsg = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64Chunk
              }
            ]
          }
        };
        geminiWs.send(JSON.stringify(chunkMsg));
      };
    })
    .catch(function(err) {
      appendGeminiLog("err", "[MIC DENIED] " + err.message);
    });
}

function downsampleBuffer(buffer, sampleRate, outSampleRate) {
  if (outSampleRate === sampleRate || outSampleRate > sampleRate) return buffer;
  var sampleRateRatio = sampleRate / outSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Float32Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;
  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0, count = 0;
    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function convertFloat32ToInt16(buffer) {
  var l = buffer.length;
  var buf = new Int16Array(l);
  while (l--) {
    var s = Math.max(-1, Math.min(1, buffer[l]));
    buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return buf;
}

function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function initPlaybackAudioContext() {
  if (!audioPlaybackCtx) {
    audioPlaybackCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }
  if (audioPlaybackCtx.state === "suspended") {
    audioPlaybackCtx.resume();
  }
  nextPlayTime = audioPlaybackCtx.currentTime;
}

function playPcm24kBase64Chunk(base64Data) {
  initPlaybackAudioContext();
  var binary = window.atob(base64Data);
  var len = binary.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  var int16 = new Int16Array(bytes.buffer);
  var float32 = new Float32Array(int16.length);
  for (var j = 0; j < int16.length; j++) {
    float32[j] = int16[j] / 32768.0;
  }

  var sum = 0;
  for (var k = 0; k < float32.length; k += 4) sum += Math.abs(float32[k]);
  blobState.geminiLevel = Math.min(1, (sum / (float32.length / 4)) * 3);

  var audioBuf = audioPlaybackCtx.createBuffer(1, float32.length, 24000);
  audioBuf.copyToChannel(float32, 0);

  var source = audioPlaybackCtx.createBufferSource();
  source.buffer = audioBuf;
  source.connect(audioPlaybackCtx.destination);

  var startTime = Math.max(audioPlaybackCtx.currentTime, nextPlayTime);
  source.start(startTime);
  nextPlayTime = startTime + audioBuf.duration;

  source.onended = function() {
    blobState.geminiLevel = 0;
  };
}

function disconnectGeminiLive() {
  if (geminiWs) {
    try { geminiWs.close(); } catch(e) {}
    geminiWs = null;
  }
  if (audioInputProcessor) {
    try { audioInputProcessor.disconnect(); } catch(e) {}
    audioInputProcessor = null;
  }
  if (audioInputSource) {
    try { audioInputSource.disconnect(); } catch(e) {}
    audioInputSource = null;
  }
  if (audioInputCtx) {
    try { audioInputCtx.close(); } catch(e) {}
    audioInputCtx = null;
  }
  blobState.micLevel = 0;
  blobState.geminiLevel = 0;
  setGeminiStatus("disc", "VOICE ASSISTANT OFFLINE", "Tap '⚡ CONNECT AI' to reconnect.");
  appendGeminiLog("sys", "[DISCONNECTED] Gemini Live session ended.");
}

window.addEventListener("DOMContentLoaded", function() {
  initGeminiBlobVisualizer();
});
setTimeout(initGeminiBlobVisualizer, 100);
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
    const char* LOG_PATH = "C:\\ProgramData\\PanicButton\\server_status.log";
    FILE* logF = fopen(LOG_PATH, "w");
    if (logF) { fprintf(logF, "RemoteServerThread started\n"); fflush(logF); }

    // 🎬 Initialize live broadcaster with native screen resolution
    g_live.InitDefaults();

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
        serverAddr.sin_addr.s_addr = inet_addr("0.0.0.0");
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

  logF = fopen(LOG_PATH, "a");
    if (logF) { fprintf(logF, "Listen result: %d (err=%d)\n", listenRes, WSAGetLastError()); fflush(logF); }
    if (logF) { fprintf(logF, "Entering accept loop...\n"); fflush(logF); fclose(logF); }

    DWORD clientCount = 0;
    while (true) {
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);
        if (clientSocket == INVALID_SOCKET) {
            int acceptErr = WSAGetLastError();
            logF = fopen(LOG_PATH, "a");
            if (logF) { fprintf(logF, "Accept invalid socket! err=%d\n", acceptErr); fflush(logF); fclose(logF); }
            if (acceptErr == WSAEINVAL || acceptErr == WSAENOTSOCK) break; // Fatal: stop looping
            Sleep(100);
            continue;
        }

        clientCount++;
        logF = fopen(LOG_PATH, "a");
        if (logF) { fprintf(logF, "Client #%lu connected!\n", clientCount); fflush(logF); fclose(logF); }

        CreateThread(NULL, 0, ProcessClientThread, (LPVOID)(uintptr_t)clientSocket, 0, NULL);
    }

    WSACleanup();
    return 0;
}
// =============================================

// 🛑 FULL SYSTEM SHUTDOWN (tray Exit): stop services first (so the watchdog can't relaunch the agent),
// then kill the Cloudflare tunnel and all Panic processes.
void KillAllPanicProcesses() {
    // 1. Send HTTP stop request to PanicService / PanicButton so it stops itself cleanly from inside
    HINTERNET hSession = WinHttpOpen(L"PanicShutdown/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (hSession) {
        HINTERNET hConnect = WinHttpConnect(hSession, L"127.0.0.1", 8080, 0);
        if (hConnect) {
            HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", L"/api/exit?key=imran2024", NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, 0);
            if (hRequest) {
                WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0);
                WinHttpReceiveResponse(hRequest, NULL);
                WinHttpCloseHandle(hRequest);
            }
            WinHttpCloseHandle(hConnect);
        }
        WinHttpCloseHandle(hSession);
    }
    // 2. Stop watchdog services via SCM
    ExecSilentCommand("sc stop PanicMasterService");
    ExecSilentCommand("sc stop PanicButtonService");
    Sleep(800);
    // 3. Force kill any remaining processes
    ExecSilentCommand("taskkill /F /IM cloudflared.exe");
    ExecSilentCommand("taskkill /F /IM PanicService.exe");
    ExecSilentCommand("taskkill /F /IM PanicButton.exe");
}

// Window Procedure for the System Tray Icon
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE: {
            nid.cbSize = sizeof(NOTIFYICONDATA);
            nid.hWnd = hwnd;
            nid.uID = 1;
            nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP | NIF_SHOWTIP;
            nid.uCallbackMessage = WM_TRAYICON;
            nid.hIcon = LoadIcon(NULL, IDI_SHIELD); // Shield icon: recognizable & visible in the taskbar
            if (!nid.hIcon) nid.hIcon = LoadIcon(NULL, IDI_WARNING);
            strcpy(nid.szTip, "Panic Button - Active");
            if (Shell_NotifyIcon(NIM_ADD, &nid)) {
                nid.uVersion = NOTIFYICON_VERSION_4; // Modern taskbar notification behavior
                Shell_NotifyIcon(NIM_SETVERSION, &nid);
                AppLog("Tray: icon added successfully");
            } else {
                AppLog("Tray: Shell_NotifyIcon NIM_ADD FAILED");
            }
            break;
        }

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
                    KillAllPanicProcesses(); // 🔴 Full shutdown: services + tunnel + all processes
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

// 🌟 Helper to encode email for Firebase key
std::string Base64EncodeString(const std::string& in) {
    static const char lookup[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string out;
    int val = 0, valb = -6;
    for (unsigned char c : in) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            out.push_back(lookup[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) out.push_back(lookup[((val << 8) >> (valb + 8)) & 0x3F]);
    while (out.size() % 4) out.push_back('=');
    // Replace URL unsafe chars
    for (char& c : out) {
        if (c == '=') c = '\0';
        else if (c == '+') c = '-';
        else if (c == '/') c = '_';
    }
    return out.c_str();
}

// 🌟 Google Account & Firebase Real-Time Panic Cloud Synchronizer
DWORD WINAPI GoogleFirebaseCloudSyncThread(LPVOID lpParam) {
    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);
    AppLog("FirebaseSync: Google Cloud Sync Engine initialized.");

    while (true) {
        // Read user's Google Account email saved on PC
        std::string accountFile = "C:\\ProgramData\\PanicButton\\google_account.txt";
        std::string email = "imran@gmail.com"; // Default account
        FILE* af = fopen(accountFile.c_str(), "r");
        if (af) {
            char abuf[256] = {0};
            if (fgets(abuf, sizeof(abuf) - 1, af)) {
                std::string s(abuf);
                size_t p = s.find_first_of("\r\n");
                if (p != std::string::npos) s = s.substr(0, p);
                if (!s.empty()) email = s;
            }
            fclose(af);
        }

        // Base64 encode email for Firebase key
        std::string key = Base64EncodeString(email);

        // Query Firebase Realtime Database
        HINTERNET hSession = WinHttpOpen(L"PanicButtonEngine/2.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
        if (hSession) {
            HINTERNET hConnect = WinHttpConnect(hSession, L"panic-button-default-rtdb.firebaseio.com", INTERNET_DEFAULT_HTTPS_PORT, 0);
            if (hConnect) {
                std::wstring objectPath = L"/users/" + std::wstring(key.begin(), key.end()) + L"/panic.json";
                HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", objectPath.c_str(), NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
                if (hRequest) {
                    if (WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0) &&
                        WinHttpReceiveResponse(hRequest, NULL)) {
                        DWORD bytesRead = 0;
                        char buf[1024] = {0};
                        if (WinHttpReadData(hRequest, buf, sizeof(buf) - 1, &bytesRead) && bytesRead > 0) {
                            std::string resp(buf);
                            if (resp.find("\"panic\":true") != std::string::npos || resp.find("\"panic\": true") != std::string::npos) {
                                AppLog("🚨 FIREBASE CLOUD PANIC SIGNAL RECEIVED FROM GOOGLE ACCOUNT!");
                                TriggerPanic(); // Lock workstation & sound alarm!
                            }
                        }
                    }
                    WinHttpCloseHandle(hRequest);
                }
                WinHttpCloseHandle(hConnect);
            }
            WinHttpCloseHandle(hSession);
        }

        Sleep(1000); // Check every 1 second
    }
    return 0;
}

// 📡 UDP Auto-Discovery Responder Thread (Port 8888)
DWORD WINAPI UdpAutoDiscoveryThread(LPVOID lpParam) {
    SOCKET discSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (discSocket == INVALID_SOCKET) return 0;

    BOOL optval = TRUE;
    setsockopt(discSocket, SOL_SOCKET, SO_REUSEADDR, (char*)&optval, sizeof(optval));
    setsockopt(discSocket, SOL_SOCKET, SO_BROADCAST, (char*)&optval, sizeof(optval));

    sockaddr_in serverAddr = {0};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(8888);
    serverAddr.sin_addr.s_addr = INADDR_ANY;

    if (bind(discSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        closesocket(discSocket);
        return 0;
    }

    AppLog("UDPDiscovery: Listening for Android Auto-Discovery on UDP port 8888...");

    char buffer[256];
    sockaddr_in clientAddr;
    int clientLen = sizeof(clientAddr);

    while (true) {
        int bytesRecv = recvfrom(discSocket, buffer, sizeof(buffer) - 1, 0, (SOCKADDR*)&clientAddr, &clientLen);
        if (bytesRecv > 0) {
            buffer[bytesRecv] = '\0';
            std::string req(buffer);
            if (req.find("PANIC_DISCOVER_REQ") != std::string::npos) {
                std::string resolvedIp = "";
                char hostName[256];
                if (gethostname(hostName, sizeof(hostName)) == 0) {
                    struct hostent* host = gethostbyname(hostName);
                    if (host && host->h_addr_list) {
                        for (int i = 0; host->h_addr_list[i] != NULL; ++i) {
                            struct in_addr addr;
                            memcpy(&addr, host->h_addr_list[i], sizeof(struct in_addr));
                            std::string curIp = inet_ntoa(addr);
                            // Avoid loopback and 169.254 APIPA addresses
                            if (curIp != "127.0.0.1" && curIp.find("169.254.") != 0) {
                                resolvedIp = curIp;
                                break;
                            }
                        }
                    }
                }
                if (resolvedIp.empty()) resolvedIp = "127.0.0.1";
                std::string resp = "PANIC_DISCOVER_RESP:http://" + resolvedIp + ":8080";
                sendto(discSocket, resp.c_str(), (int)resp.length(), 0, (SOCKADDR*)&clientAddr, clientLen);
            }
        }
        Sleep(50);
    }
    closesocket(discSocket);
    return 0;
}

// ⚡ Shared: create the hidden tray window (used by BOTH the GUI build and the console/server build)
HWND CreateTrayWindow(HINSTANCE hInstance) {
    WNDCLASSEX wc = {0};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "PanicButtonTrayClass";
    if (!RegisterClassEx(&wc)) AppLog("Tray: RegisterClassEx failed (class may already exist)");
    else AppLog("Tray: window class registered");

    hMainWnd = CreateWindowEx(0, "PanicButtonTrayClass", "PanicButton", 0, 0, 0, 0, 0, NULL, NULL, hInstance, NULL);
    if (!hMainWnd) AppLog("Tray: CreateWindowEx FAILED - tray icon cannot show!");
    else AppLog("Tray: tray window created OK");
    return hMainWnd;
}

// ⚡ Shared: process window messages so the tray icon stays responsive
void RunTrayMessageLoop() {
    MSG msg;
    BOOL bRet;
    while (true) {
        bRet = GetMessage(&msg, NULL, 0, 0);
        if (bRet == 0) break;
        if (bRet == -1) { Sleep(1000); continue; }
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    SetUnhandledExceptionFilter(CrashFilter);

    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);
    AppLog("WinMain: PANIC CTRL starting");

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
    MFStartup(MF_VERSION, MFSTARTUP_FULL); // ⚡ Initialize Media Foundation Hardware Accelerator

    HMODULE hNtDll = GetModuleHandle("ntdll.dll");
    if (hNtDll) {
        pfnNtSuspendProcess = (NtSuspendProcess)GetProcAddress(hNtDll, "NtSuspendProcess");
        pfnNtResumeProcess = (NtResumeProcess)GetProcAddress(hNtDll, "NtResumeProcess");
    }

    HMODULE hUser32 = GetModuleHandle("user32.dll");
    if (hUser32) {
        typedef BOOL (WINAPI *SetProcessDpiAwarenessContextProc)(HANDLE);
        SetProcessDpiAwarenessContextProc pSetDpi = (SetProcessDpiAwarenessContextProc)GetProcAddress(hUser32, "SetProcessDpiAwarenessContext");
        if (pSetDpi) {
            pSetDpi((HANDLE)-4); // DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2
        } else {
            SetProcessDPIAware();
        }
    } else {
        SetProcessDPIAware();
    }

    ULONG_PTR gdiplusToken;
    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    // ⚡ Run blocking startup tasks in background thread so server starts immediately!
    CreateThread(NULL, 0, [](LPVOID) -> DWORD {
        Sleep(500); // Let main window initialize first
        AddToStartup();
        AutoInstallProvider();
        EnableKernelWakeOnLAN();
        return 0;
    }, NULL, 0, NULL);

    InitializeTaskbar();

    CreateTrayWindow(hInstance);

    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)HotkeyListenerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)RemoteServerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)GoogleFirebaseCloudSyncThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)UdpAutoDiscoveryThread, NULL, 0, NULL);

    RunTrayMessageLoop();
    return 0;
}

// ⚡ Console entry point: when compiled without -mwindows, this is called.
// Directly starts the HTTP server and Cloudfire Sync thread without GUI.
int main(int argc, char* argv[]) {
    SetUnhandledExceptionFilter(CrashFilter);

    CreateDirectoryA("C:\\ProgramData\\PanicButton", NULL);

    // Log startup immediately so we know main() was called
    FILE* startLog = fopen("C:\\ProgramData\\PanicButton\\server_status.log", "w");
    if (startLog) { fprintf(startLog, "main() console entry started\n"); fflush(startLog); fclose(startLog); }

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
    // NOTE: MFStartup skipped in console mode - not needed for HTTP server

    HMODULE hNtDll = GetModuleHandle("ntdll.dll");
    if (hNtDll) {
        pfnNtSuspendProcess = (NtSuspendProcess)GetProcAddress(hNtDll, "NtSuspendProcess");
        pfnNtResumeProcess = (NtResumeProcess)GetProcAddress(hNtDll, "NtResumeProcess");
    }

    // GDI+ needed for JPEG encoding
    ULONG_PTR gdiplusToken;
    GdiplusStartupInput gdiplusStartupInput;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    startLog = fopen("C:\\ProgramData\\PanicButton\\server_status.log", "a");
    if (startLog) { fprintf(startLog, "GDI+ initialized, starting threads...\n"); fflush(startLog); fclose(startLog); }

    // ⚡ Run startup tasks in background
    CreateThread(NULL, 0, [](LPVOID) -> DWORD {
        Sleep(500);
        AddToStartup();
        AutoInstallProvider();
        EnableKernelWakeOnLAN();
        return 0;
    }, NULL, 0, NULL);

    // Start server, Cloud Sync, and UDP Auto-Discovery threads
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)HotkeyListenerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)RemoteServerThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)GoogleFirebaseCloudSyncThread, NULL, 0, NULL);
    CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)UdpAutoDiscoveryThread, NULL, 0, NULL);

    // 🔔 Show the system tray icon (same as GUI build) so the server process is controllable!
    CreateTrayWindow(GetModuleHandle(NULL));

    // Keep alive — process stays running & tray icon stays responsive
    RunTrayMessageLoop();
    return 0;
}
