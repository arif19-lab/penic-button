@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Run this one file as Administrator. It stops the installed agent, builds
rem every artifact from the current source, deploys it, and starts the agent.

net session >nul 2>&1
if not errorlevel 1 goto :admin
echo Requesting Administrator permission...
powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b 0

:admin
cd /d "%~dp0"

set PANIC_VERSION=
for /f "usebackq delims=" %%v in ("version.txt") do set PANIC_VERSION=%%v
if not defined PANIC_VERSION goto :version_failed
findstr /c:"AppVersion=!PANIC_VERSION!" installer.iss >nul || goto :version_failed
findstr /c:"version=\"!PANIC_VERSION!.0\"" PanicButton.manifest >nul || goto :version_failed

echo.
echo ===================================================
echo   PANIC CTRL - FULL BUILD AND DEPLOY
echo ===================================================

echo [1/8] Stopping the running Panic CTRL services...
if exist "C:\ProgramData\PanicButton\auth.key" set /p PANIC_BUILD_KEY=<"C:\ProgramData\PanicButton\auth.key"
if defined PANIC_BUILD_KEY curl.exe -s -m 3 "http://127.0.0.1:8085/api/exit?key=!PANIC_BUILD_KEY!" >nul 2>&1
schtasks /End /TN "PanicButton_Autostart" >nul 2>&1
sc stop PanicMasterService >nul 2>&1
taskkill /F /IM PanicButton.exe /T >nul 2>&1
taskkill /F /IM PanicService.exe /T >nul 2>&1

set /a PANIC_WAIT=0
:wait_for_stop
tasklist /FI "IMAGENAME eq PanicButton.exe" /NH 2>nul | find /I "PanicButton.exe" >nul
if not errorlevel 1 goto :wait_again
tasklist /FI "IMAGENAME eq PanicService.exe" /NH 2>nul | find /I "PanicService.exe" >nul
if not errorlevel 1 goto :wait_again
goto :stopped
:wait_again
set /a PANIC_WAIT+=1
if !PANIC_WAIT! GEQ 30 goto :stop_timeout
timeout /t 1 /nobreak >nul
goto :wait_for_stop

:stop_timeout
echo [ERROR] Panic CTRL did not stop. Close it and run this file again.
exit /b 1

:stopped
echo [2/8] Synchronizing web assets...
python scripts\sync_assets.py || goto :failed

echo [3/8] Building Windows resources and binaries...
windres resource.rc -O coff -o resource.o || goto :failed
g++ -O2 -std=c++17 src/main.cpp src/audio/*.cpp src/capture/*.cpp src/core/*.cpp src/encoder/*.cpp src/input/TouchInjector.cpp src/security/*.cpp src/server/*.cpp src/service/SystemDeploy.cpp src/streaming/*.cpp src/ui/*.cpp resource.o -o PanicButton.exe -Isrc -lws2_32 -liphlpapi -lwinhttp -lgdiplus -ldxgi -ld3d11 -lmfplat -lmfuuid -lwmcodecdspuuid -lstrmiids -luuid -lole32 -loleaut32 -lcrypt32 -lwinmm -lwtsapi32 -lpowrprof -static -mwindows || goto :failed
g++ -O2 -std=c++17 PanicService.cpp -o PanicService.exe -lws2_32 -lwtsapi32 -luserenv -ladvapi32 -static || goto :failed
g++ -O2 -Wall -o PanicProvider.dll PanicProvider.cpp PanicCredential.cpp PanicProvider.def -shared -static-libgcc -static-libstdc++ -lole32 -luuid -lshlwapi -lsecur32 -lcredui -lgdi32 -ladvapi32 || goto :failed

echo [4/8] Building the Android APK...
pushd android-app\android
call gradlew.bat clean assembleDebug || goto :android_failed
popd
copy /Y "android-app\android\app\build\outputs\apk\debug\app-debug.apk" "PanicCTRL.apk" >nul || goto :failed

echo [5/8] Building the installer...
if not exist dist mkdir dist
taskkill /F /IM PanicCTRL-Setup-latest.exe /T >nul 2>&1
if exist "dist\PanicCTRL-Setup-latest.exe" del /Q "dist\PanicCTRL-Setup-latest.exe"
"C:\Program Files\Inno Setup 7\ISCC.exe" /O"%CD%\dist" /FPanicCTRL-Setup-latest installer.iss || goto :failed

echo [6/8] Deploying the new files...
if not exist "C:\ProgramData\PanicButton" mkdir "C:\ProgramData\PanicButton"
copy /Y "PanicButton.exe" "C:\ProgramData\PanicButton\PanicButton.exe" >nul || goto :failed
copy /Y "PanicService.exe" "C:\ProgramData\PanicButton\PanicService.exe" >nul || goto :failed
copy /Y "PanicProvider.dll" "C:\ProgramData\PanicButton\PanicProvider.dll" >nul || goto :failed
copy /Y "PanicCTRL.apk" "C:\ProgramData\PanicButton\PanicCTRL.apk" >nul || goto :failed
copy /Y "dist\PanicCTRL-Setup-latest.exe" "C:\ProgramData\PanicButton\PanicCTRL-Setup.exe" >nul || goto :failed
powershell -NoProfile -Command "$d=[Environment]::GetFolderPath('Desktop'); if($d -and (Test-Path $d)){ Copy-Item 'PanicCTRL.apk' (Join-Path $d 'PanicCTRL.apk') -Force; Copy-Item 'dist\PanicCTRL-Setup-latest.exe' (Join-Path $d 'PanicCTRL-Setup.exe') -Force }" >nul 2>&1

echo [7/8] Refreshing deployed web files...
if not exist "C:\ProgramData\PanicButton\www" mkdir "C:\ProgramData\PanicButton\www"
xcopy /E /I /Y /Q "android-app\www\*" "C:\ProgramData\PanicButton\www\" >nul
if errorlevel 2 goto :failed

echo [8/8] Restarting Panic CTRL...
sc start PanicMasterService >nul 2>&1
schtasks /Run /TN "PanicButton_Autostart" >nul 2>&1

echo.
echo ===================================================
echo   COMPLETE
echo   APK       : PanicCTRL.apk
echo   Installer : dist\PanicCTRL-Setup-latest.exe
echo ===================================================
exit /b 0

:android_failed
popd
echo [ERROR] Android APK build failed.
exit /b 1

:version_failed
echo [ERROR] version.txt, installer.iss, and PanicButton.manifest do not match.
exit /b 1

:failed
echo [ERROR] Build stopped. The installed app remains stopped so files are not mixed.
exit /b 1
