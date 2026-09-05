#pragma once
#include <winsock2.h>
#include <windows.h>

// UI / Tray & Menu IDs
#define IDM_SCAN_MOBILE 1050
#define WM_TRAYICON (WM_USER + 1)
#define IDM_TRIGGER 1001
#define IDM_PAUSE   1002
#define IDM_EXIT    1003

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

// =============================================
// 🌐 REMOTE HTTP SERVER
// Browser থেকে Panic Mode কন্ট্রোল করার জন্য!
// PC 1 থেকে PC 2 কন্ট্রোল করা যাবে!
// =============================================
#define REMOTE_PORT 8085
#define SECRET_KEY  "imran2024" // এটা তোর Secret Password!

// 🛡️ WINDOWS SERVICE CONTROL ENGINE (24/7 Background System Execution)
#define SERVICE_NAME "PanicButtonService"
