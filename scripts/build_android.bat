@echo off
setlocal
rem ===========================================================================
rem  build_android.bat - build the Android APK and place it at the repo root
rem ===========================================================================
rem  NOTE: this script deliberately avoids parenthesised IF blocks.  cmd.exe
rem  mis-parses a block when the echo text inside it contains parentheses, and
rem  the failure is silent: the script exits with code 0 and does nothing.
rem  That is exactly how the Android build stopped running unnoticed.
rem ===========================================================================

cd /d "%~dp0.."

if not exist "android-app\android\gradlew.bat" goto :no_gradle
if not exist "android-app\android\local.properties" goto :no_sdk

pushd "android-app\android"
call gradlew.bat assembleDebug
set BUILD_RESULT=%errorlevel%
popd

if not "%BUILD_RESULT%"=="0" goto :gradle_failed
if not exist "android-app\android\app\build\outputs\apk\debug\app-debug.apk" goto :no_apk

copy /Y "android-app\android\app\build\outputs\apk\debug\app-debug.apk" "PanicCTRL.apk" >nul
if errorlevel 1 goto :copy_failed

for %%F in ("PanicCTRL.apk") do echo   APK: %%~zF bytes
exit /b 0

:no_gradle
echo   [SKIP] no Gradle wrapper found
exit /b 0

:no_sdk
echo   [SKIP] the Android SDK is not configured
exit /b 0

:gradle_failed
echo   [ERROR] Gradle build failed
exit /b 1

:no_apk
echo   [ERROR] Gradle reported success but no APK was produced
exit /b 1

:copy_failed
echo   [ERROR] could not copy the APK to PanicCTRL.apk
exit /b 1
