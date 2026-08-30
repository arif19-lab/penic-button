@echo off
echo ===================================================
echo   Compiling PanicButton (Commercial Modular Build)
echo ===================================================

echo [1/2] Compiling Windows Resource Icon...
windres resource.rc -O coff -o resource.o
if %errorlevel% neq 0 (
    echo [ERROR] windres failed!
    exit /b %errorlevel%
)

echo [2/2] Compiling All C++ Modules from src/...
g++ -O2 -std=c++17 src/main.cpp src/audio/*.cpp src/capture/*.cpp src/core/*.cpp src/encoder/*.cpp src/input/*.cpp src/security/*.cpp src/server/*.cpp src/service/*.cpp src/streaming/*.cpp src/ui/*.cpp resource.o -o PanicButton_Release.exe -Isrc -lws2_32 -liphlpapi -lwinhttp -lgdiplus -ldxgi -ld3d11 -lmfplat -lmfuuid -lwmcodecdspuuid -lstrmiids -luuid -lole32 -loleaut32 -lcrypt32 -lwinmm -lwtsapi32 -static -mwindows

if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check compiler errors above.
    exit /b %errorlevel%
)

copy /Y PanicButton_Release.exe PanicButton.exe >nul 2>&1

echo ===================================================
echo   SUCCESS! Commercial Modular PanicButton.exe Ready!
echo ===================================================
