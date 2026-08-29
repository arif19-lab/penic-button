#include "TouchInjector.h"
#include "../core/Logger.h"

pfnInitializeTouchInjection g_pfnInitTouch = NULL;
pfnInjectTouchInput g_pfnInjectTouch = NULL;
bool g_touchInitialized = false;
std::mutex g_touchMutex;

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
                AppLog("[touch] Windows Native Touch Injection initialized successfully (10 multi-touch digitizers)!");
            }
        }
    }
}
