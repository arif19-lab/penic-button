#pragma once
#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <mutex>

namespace Video {
    bool InitDXGI();
    void CleanupDXGI();
    bool CaptureDXGIFrame(HDC hTargetDC, int targetW, int targetH);
}
