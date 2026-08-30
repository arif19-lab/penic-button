@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   PANIC CTRL - MASTER DEPLOYMENT ENGINE (1-CLICK)
echo ===================================================

:: 1. Recompile PanicButton.exe (C++ Windows Host)
echo [1/3] Compiling C++ Windows Host Engine...
call build_release.bat
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] C++ build failed!
    exit /b 1
)

:: 2. Build Android APK (Release/Debug)
echo [2/3] Building Native Android APK...
cd android-app\android
call gradlew.bat assembleDebug
cd ..\..
if not exist "android-app\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo [ERROR] Android APK build failed!
    exit /b 1
)

:: 3. Copy APK to Root and Output Release Bundle
echo [3/3] Synchronizing Assets and Release Bundle...
copy /Y "android-app\android\app\build\outputs\apk\debug\app-debug.apk" "PanicCTRL.apk" >nul

echo ===================================================
echo   SUCCESS! All Modules Successfully Built & Synced!
echo   • PanicButton.exe  [Windows C++ Host Ready]
echo   • PanicCTRL.apk    [Android Mobile APK Ready]
echo ===================================================
