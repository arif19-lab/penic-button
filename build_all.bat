@echo off
setlocal
rem ===========================================================================
rem  build_all.bat - build the whole release and install it on this machine
rem ===========================================================================
rem  The build order is handled by build_release.bat: the Android APK is
rem  compiled BEFORE the installer, so the installer always contains the APK
rem  that was just built and never the previous one.
rem ===========================================================================

echo Building PANIC CTRL for Windows and Android...
call build_release.bat
if errorlevel 1 exit /b %errorlevel%

call deploy_release.bat
if errorlevel 1 exit /b %errorlevel%

echo Build and deploy completed successfully.
