@echo off
schtasks /End /TN "PanicButton_Autostart" >nul 2>&1
taskkill /F /IM PanicButton.exe 2>nul
taskkill /F /IM PanicService.exe 2>nul
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
g++ -O2 -std=c++17 src/main.cpp src/audio/*.cpp src/capture/*.cpp src/core/*.cpp src/encoder/*.cpp src/input/*.cpp src/security/*.cpp src/server/*.cpp src/service/*.cpp src/streaming/*.cpp src/ui/*.cpp resource.o -o PanicButton.exe -Isrc -lws2_32 -liphlpapi -lwinhttp -lgdiplus -ldxgi -ld3d11 -lmfplat -lmfuuid -lwmcodecdspuuid -lstrmiids -luuid -lole32 -loleaut32 -lcrypt32 -lwinmm -lwtsapi32 -lpowrprof -static -mwindows

if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check compiler errors above.
    exit /b %errorlevel%
)

echo [4/5] Compiling 24/7 SYSTEM PanicService.exe...
g++ -O2 -std=c++17 PanicService.cpp -o PanicService.exe -lws2_32 -lwtsapi32 -luserenv -ladvapi32 -static
if %errorlevel% neq 0 (
    echo [ERROR] PanicService.exe compilation failed!
    exit /b %errorlevel%
)

echo [5/5] Compiling Windows Credential Provider PanicProvider.dll...
g++ -O2 -Wall -o PanicProvider.dll PanicProvider.cpp PanicCredential.cpp PanicProvider.def -shared -static-libgcc -static-libstdc++ -lole32 -luuid -lshlwapi -lsecur32 -lcredui -lgdi32
if %errorlevel% neq 0 (
    echo [ERROR] PanicProvider.dll compilation failed!
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   [AUTO-DEPLOY] Deploying Binaries to System...
echo ===================================================

schtasks /End /TN "PanicButton_Autostart" >nul 2>&1
taskkill /F /IM PanicButton.exe 2>nul
taskkill /F /IM PanicService.exe 2>nul
ping 127.0.0.1 -n 2 >nul

if not exist "C:\ProgramData\PanicButton" mkdir "C:\ProgramData\PanicButton"
copy /Y "PanicButton.exe" "C:\ProgramData\PanicButton\PanicButton.exe" >nul
copy /Y "PanicService.exe" "C:\ProgramData\PanicButton\PanicService.exe" >nul
copy /Y "PanicProvider.dll" "C:\ProgramData\PanicButton\PanicProvider.dll" >nul
if exist "android-app\www\jsqr.min.js" copy /Y "android-app\www\jsqr.min.js" "C:\ProgramData\PanicButton\jsqr.min.js" >nul

echo [AUTO-DEPLOY] Building Inno Setup Installer...
"C:\Program Files\Inno Setup 7\ISCC.exe" installer.iss >nul 2>&1
if exist "dist\PanicCTRL-Setup.exe" (
    copy /Y "dist\PanicCTRL-Setup.exe" "C:\Users\Imran\Desktop\PanicCTRL-Setup.exe" >nul
    echo [AUTO-DEPLOY] Desktop Installer Updated!
)

echo [AUTO-DEPLOY] Restarting PanicButton...
schtasks /Run /TN "PanicButton_Autostart" >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo ===================================================
echo   SUCCESS! Everything Built, Deployed and Running!
echo ===================================================

