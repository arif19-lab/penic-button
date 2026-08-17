#include "InputManager.h"
#include "../core/Utils.h"
#include <mutex>
#include <vector>
#include <mmdeviceapi.h>
#include <endpointvolume.h>

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

typedef LONG (NTAPI *NtSuspendProcess)(IN HANDLE ProcessHandle);
typedef LONG (NTAPI *NtResumeProcess)(IN HANDLE ProcessHandle);

namespace Input {

static pfnInitializeTouchInjection g_pfnInitTouch = NULL;
static pfnInjectTouchInput g_pfnInjectTouch = NULL;
static bool g_touchInitialized = false;
static std::mutex g_touchMutex;

void EnsureTouchInjectionInit() {
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
            }
        }
    }
}

void InjectTouch(const std::string& act, int px, int py, int pointerId) {
    EnsureTouchInjectionInit();
    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);
    int targetX = (int)((px / 10000.0f) * screenW);
    int targetY = (int)((py / 10000.0f) * screenH);

    if (g_pfnInjectTouch && g_touchInitialized) {
        POINTER_TOUCH_INFO_CUSTOM touchInfo = {0};
        touchInfo.pointerInfo.pointerType = PT_TOUCH;
        touchInfo.pointerInfo.pointerId = (UINT32)pointerId;
        touchInfo.pointerInfo.ptPixelLocation.x = targetX;
        touchInfo.pointerInfo.ptPixelLocation.y = targetY;
        touchInfo.touchMask = TOUCH_MASK_CONTACTAREA | TOUCH_MASK_PRESSURE;
        touchInfo.rcContact.left = targetX - 5;
        touchInfo.rcContact.right = targetX + 5;
        touchInfo.rcContact.top = targetY - 5;
        touchInfo.rcContact.bottom = targetY + 5;
        touchInfo.pressure = 512;

        if (act == "down") {
            touchInfo.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
        } else if (act == "move") {
            touchInfo.pointerInfo.pointerFlags = POINTER_FLAG_UPDATE | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
        } else if (act == "up") {
            touchInfo.pointerInfo.pointerFlags = POINTER_FLAG_UP;
        }

        if (g_pfnInjectTouch(1, &touchInfo)) return;
    }

    // Fallback to SendInput mouse simulation
    INPUT input = {0};
    input.type = INPUT_MOUSE;
    input.mi.dx = (LONG)((targetX * 65535.0f) / screenW);
    input.mi.dy = (LONG)((targetY * 65535.0f) / screenH);
    input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE;

    if (act == "down") input.mi.dwFlags |= MOUSEEVENTF_LEFTDOWN;
    else if (act == "up") input.mi.dwFlags |= MOUSEEVENTF_LEFTUP;

    SendInput(1, &input, sizeof(INPUT));
}

void MouseMove(int dx, int dy) {
    INPUT input = {0};
    input.type = INPUT_MOUSE;
    input.mi.dx = dx;
    input.mi.dy = dy;
    input.mi.dwFlags = MOUSEEVENTF_MOVE;
    SendInput(1, &input, sizeof(INPUT));
}

void MouseMoveAbs(int x, int y) {
    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);
    INPUT input = {0};
    input.type = INPUT_MOUSE;
    input.mi.dx = (LONG)((x * 65535.0f) / screenW);
    input.mi.dy = (LONG)((y * 65535.0f) / screenH);
    input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE;
    SendInput(1, &input, sizeof(INPUT));
}

void MouseClick(bool isRight) {
    INPUT inputs[2] = {0};
    inputs[0].type = INPUT_MOUSE;
    inputs[1].type = INPUT_MOUSE;
    if (isRight) {
        inputs[0].mi.dwFlags = MOUSEEVENTF_RIGHTDOWN;
        inputs[1].mi.dwFlags = MOUSEEVENTF_RIGHTUP;
    } else {
        inputs[0].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
        inputs[1].mi.dwFlags = MOUSEEVENTF_LEFTUP;
    }
    SendInput(2, inputs, sizeof(INPUT));
}

void MouseDoubleClick() {
    MouseClick(false);
    Sleep(50);
    MouseClick(false);
}

void MouseWheel(int delta) {
    INPUT input = {0};
    input.type = INPUT_MOUSE;
    input.mi.dwFlags = MOUSEEVENTF_WHEEL;
    input.mi.mouseData = delta;
    SendInput(1, &input, sizeof(INPUT));
}

void KeyboardType(const std::string& text) {
    for (char c : text) {
        INPUT inputs[2] = {0};
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wScan = (WORD)c;
        inputs[0].ki.dwFlags = KEYEVENTF_UNICODE;

        inputs[1].type = INPUT_KEYBOARD;
        inputs[1].ki.wScan = (WORD)c;
        inputs[1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;

        SendInput(2, inputs, sizeof(INPUT));
    }
}

void SendVirtualKey(WORD vk) {
    INPUT inputs[2] = {0};
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = vk;

    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = vk;
    inputs[1].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(2, inputs, sizeof(INPUT));
}

void LockWorkstation() {
    ::LockWorkStation();
}

void SetSystemVolume(float vol) {
    CoInitialize(NULL);
    IMMDeviceEnumerator *deviceEnumerator = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_INPROC_SERVER, __uuidof(IMMDeviceEnumerator), (LPVOID *)&deviceEnumerator);
    if (SUCCEEDED(hr)) {
        IMMDevice *defaultDevice = NULL;
        hr = deviceEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &defaultDevice);
        deviceEnumerator->Release();
        if (SUCCEEDED(hr)) {
            IAudioEndpointVolume *endpointVolume = NULL;
            hr = defaultDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_INPROC_SERVER, NULL, (LPVOID *)&endpointVolume);
            defaultDevice->Release();
            if (SUCCEEDED(hr)) {
                endpointVolume->SetMasterVolumeLevelScalar(vol, NULL);
                endpointVolume->Release();
            }
        }
    }
    CoUninitialize();
}

void ToggleMute() {
    CoInitialize(NULL);
    IMMDeviceEnumerator *deviceEnumerator = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_INPROC_SERVER, __uuidof(IMMDeviceEnumerator), (LPVOID *)&deviceEnumerator);
    if (SUCCEEDED(hr)) {
        IMMDevice *defaultDevice = NULL;
        hr = deviceEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &defaultDevice);
        deviceEnumerator->Release();
        if (SUCCEEDED(hr)) {
            IAudioEndpointVolume *endpointVolume = NULL;
            hr = defaultDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_INPROC_SERVER, NULL, (LPVOID *)&endpointVolume);
            defaultDevice->Release();
            if (SUCCEEDED(hr)) {
                BOOL isMuted = FALSE;
                endpointVolume->GetMute(&isMuted);
                endpointVolume->SetMute(!isMuted, NULL);
                endpointVolume->Release();
            }
        }
    }
    CoUninitialize();
}

void SuspendProcess(const std::string& procName) {
    DWORD pid = Utils::GetProcessIdByName(procName);
    if (pid == 0) return;
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) return;
    NtSuspendProcess pfnSuspend = (NtSuspendProcess)GetProcAddress(hNtdll, "NtSuspendProcess");
    if (!pfnSuspend) return;
    HANDLE hProc = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
    if (hProc) {
        pfnSuspend(hProc);
        CloseHandle(hProc);
    }
}

void ResumeProcess(const std::string& procName) {
    DWORD pid = Utils::GetProcessIdByName(procName);
    if (pid == 0) return;
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) return;
    NtResumeProcess pfnResume = (NtResumeProcess)GetProcAddress(hNtdll, "NtResumeProcess");
    if (!pfnResume) return;
    HANDLE hProc = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
    if (hProc) {
        pfnResume(hProc);
        CloseHandle(hProc);
    }
}

} // namespace Input
