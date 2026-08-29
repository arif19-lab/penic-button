#pragma once

#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <mutex>
#include <cstdint>
#include <vector>

// 🎮 DIRECTX 11 DXGI DESKTOP DUPLICATION ENGINE (Sub-1ms GPU Hardware Capture)
extern ID3D11Device* g_d3dDevice;
extern ID3D11DeviceContext* g_d3dContext;
extern IDXGIOutputDuplication* g_dxgiDuplication;
extern ID3D11Texture2D* g_stagingTexture;
extern bool g_dxgiInitialized;
extern std::mutex g_dxgiMutex; // 🛡️ DXGI output duplication is a SINGLE global object - all capture calls must serialize!

bool InitDXGI();
void CleanupDXGI();
void SwitchToActiveDesktop();
bool CaptureDXGIFrame(HDC hTargetDC, int targetW, int targetH);
