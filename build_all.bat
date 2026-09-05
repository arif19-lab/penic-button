@echo off
setlocal

echo Building PANIC CTRL for Windows and Android...
call build_release.bat
if errorlevel 1 exit /b %errorlevel%

pushd android-app\android
call gradlew.bat assembleDebug
set BUILD_RESULT=%errorlevel%
popd
if not "%BUILD_RESULT%"=="0" exit /b %BUILD_RESULT%

if not exist "android-app\android\app\build\outputs\apk\debug\app-debug.apk" exit /b 1
copy /Y "android-app\android\app\build\outputs\apk\debug\app-debug.apk" "PanicCTRL.apk" >nul
echo Build completed successfully.
