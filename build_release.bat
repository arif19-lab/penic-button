@echo off
setlocal EnableDelayedExpansion
rem ===========================================================================
rem  build_release.bat - PANIC CTRL release build
rem ===========================================================================
rem  This script BUILDS.  It does not touch the running installation:
rem  it does not stop services, does not write to C:\ProgramData and does not
rem  restart the agent.  Use deploy_release.bat for that.
rem
rem  Build order matters: the Android APK has to exist BEFORE the installer is
rem  compiled, otherwise the installer ships the APK from the previous build.
rem ===========================================================================

echo ===================================================
echo   PANIC CTRL - release build
echo ===================================================

cd /d "%~dp0"

rem ---- 0. version consistency --------------------------------------------
set VER=
for /f "usebackq delims=" %%v in ("version.txt") do set VER=%%v
if not defined VER (
    echo [ERROR] version.txt is missing or empty
    exit /b 1
)
findstr /c:"AppVersion=%VER%" installer.iss >nul
if errorlevel 1 (
    echo [ERROR] installer.iss AppVersion does not match version.txt ^(%VER%^)
    exit /b 1
)
findstr /c:"version=\"%VER%.0\"" PanicButton.manifest >nul
if errorlevel 1 (
    echo [ERROR] PanicButton.manifest version does not match version.txt ^(%VER%^)
    exit /b 1
)
echo [0/5] Version check OK (%VER%)

rem ---- 1. synchronise the modular web assets -----------------------------
echo [1/5] Synchronizing modular web assets...
python scripts\sync_assets.py
if errorlevel 1 (
    echo [ERROR] asset synchronisation failed
    exit /b 1
)

rem ---- 2. compile the Windows resource icon -------------------------------
echo [2/5] Compiling the Windows resource icon...
windres resource.rc -O coff -o resource.o
if errorlevel 1 (
    echo [ERROR] windres failed!
    exit /b 1
)

rem ---- 3. compile the three Windows binaries -----------------------------
echo [3/5] Compiling PanicButton.exe...
g++ -O2 -std=c++17 src/main.cpp src/audio/*.cpp src/capture/*.cpp src/core/*.cpp src/encoder/*.cpp src/input/*.cpp src/security/*.cpp src/server/*.cpp src/service/*.cpp src/streaming/*.cpp src/ui/*.cpp resource.o -o PanicButton.exe -Isrc -lws2_32 -liphlpapi -lwinhttp -lgdiplus -ldxgi -ld3d11 -lmfplat -lmfuuid -lwmcodecdspuuid -lstrmiids -luuid -lole32 -loleaut32 -lcrypt32 -lwinmm -lwtsapi32 -lpowrprof -static -mwindows
if errorlevel 1 (
    echo [ERROR] PanicButton.exe compilation failed!
    exit /b 1
)

echo [3/5] Compiling PanicService.exe...
g++ -O2 -std=c++17 PanicService.cpp -o PanicService.exe -lws2_32 -lwtsapi32 -luserenv -ladvapi32 -static
if errorlevel 1 (
    echo [ERROR] PanicService.exe compilation failed!
    exit /b 1
)

echo [3/5] Compiling PanicProvider.dll...
g++ -O2 -Wall -o PanicProvider.dll PanicProvider.cpp PanicCredential.cpp PanicProvider.def -shared -static-libgcc -static-libstdc++ -lole32 -luuid -lshlwapi -lsecur32 -lcredui -lgdi32 -ladvapi32
if errorlevel 1 (
    echo [ERROR] PanicProvider.dll compilation failed!
    exit /b 1
)

rem ---- 4. build the Android APK (before the installer!) -------------------
echo [4/5] Building the Android APK...
call scripts\build_android.bat
if errorlevel 1 (
    echo [ERROR] the Android APK build failed
    exit /b 1
)

rem ---- 5. compile the installer ------------------------------------------
echo [5/5] Building the Inno Setup installer...
if not exist "dist" mkdir dist
"C:\Program Files\Inno Setup 7\ISCC.exe" installer.iss
if errorlevel 1 (
    echo [ERROR] the installer build failed
    exit /b 1
)

echo.
echo ===================================================
echo   BUILD COMPLETE
echo   installer : dist\PanicCTRL-Setup.exe
echo   APK       : PanicCTRL.apk
echo   Run deploy_release.bat to install / update the machine.
echo ===================================================
exit /b 0
