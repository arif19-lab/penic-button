#pragma once

#include <windows.h>
#include <mutex>

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

// Extern globals
extern pfnInitializeTouchInjection g_pfnInitTouch;
extern pfnInjectTouchInput g_pfnInjectTouch;
extern bool g_touchInitialized;
extern std::mutex g_touchMutex;

// Function declarations
void EnsureTouchInjectionInit();
