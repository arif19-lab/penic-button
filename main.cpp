#include "src/core/App.h"

// 🚀 PanicCTRL - 2.0 Cyber Node (Clean Modular Architecture)
// Sub-1ms DirectX 11 GPU Screen Capture & Hardware Input Engine

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    return Core::App::Instance().Run(hInstance, nCmdShow);
}
