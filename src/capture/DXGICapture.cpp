#include "DXGICapture.h"
#include <vector>
#include <cstdint>
#include <cstring>

// 🎮 DIRECTX 11 DXGI DESKTOP DUPLICATION ENGINE (Sub-1ms GPU Hardware Capture)
ID3D11Device* g_d3dDevice = NULL;
ID3D11DeviceContext* g_d3dContext = NULL;
IDXGIOutputDuplication* g_dxgiDuplication = NULL;
ID3D11Texture2D* g_stagingTexture = NULL;
bool g_dxgiInitialized = false;
std::mutex g_dxgiMutex; // 🛡️ DXGI output duplication is a SINGLE global object - all capture calls must serialize!

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
            SwitchToActiveDesktop();
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
