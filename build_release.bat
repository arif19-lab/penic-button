@echo off
taskkill /F /IM PanicButton.exe 2>nul
echo ===================================================
echo   Compiling PanicButton (Commercial Modular Build)
echo ===================================================

echo [1/3] Synchronizing Modular Web Assets...
python scripts/sync_assets.py

echo [2/3] Compiling Windows Resource Icon...
windres resource.rc -O coff -o resource.o
if %errorlevel% neq 0 (
    echo [ERROR] windres failed!
    exit /b %errorlevel%
)

echo [3/3] Compiling All C++ Modules from src/...
g++ -O2 -std=c++17 src/main.cpp src/audio/*.cpp src/capture/*.cpp src/core/*.cpp src/encoder/*.cpp src/input/*.cpp src/security/*.cpp src/server/*.cpp src/service/*.cpp src/streaming/*.cpp src/ui/*.cpp resource.o -o PanicButton.exe -Isrc -lws2_32 -liphlpapi -lwinhttp -lgdiplus -ldxgi -ld3d11 -lmfplat -lmfuuid -lwmcodecdspuuid -lstrmiids -luuid -lole32 -loleaut32 -lcrypt32 -lwinmm -lwtsapi32 -static -mwindows

if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check compiler errors above.
    exit /b %errorlevel%
)

echo ===================================================
echo   SUCCESS! Commercial Modular PanicButton.exe Ready!
echo ===================================================
