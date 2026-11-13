@echo off
setlocal
rem ===========================================================================
rem  deploy_release.bat - install the freshly built release on this machine
rem ===========================================================================
rem  This is the only script that changes the running installation.  It is
rem  deliberately separate from build_release.bat so that a plain build can
rem  never stop the running agent, rewrite C:\ProgramData or reinstall the
rem  product by accident.
rem
rem  NOTE: parenthesised IF blocks are avoided on purpose - cmd.exe mis-parses
rem  a block whose echo text contains parentheses and then fails silently.
rem ===========================================================================

cd /d "%~dp0"

echo ===================================================
echo   PANIC CTRL - deploying the release
echo ===================================================

rem ---- 1. stop the running pieces ----------------------------------------
rem  Order matters.  PanicMasterService is a watchdog: when PanicButton.exe
rem  disappears it relaunches it within 3 seconds, and the relaunched agent
rem  locks its own executable again - so a deployment that only kills the
rem  agent can never replace PanicButton.exe.
rem
rem  The /api/exit request is the clean way to stop both: the agent runs
rem  elevated and stops the service itself before it exits.
echo [1/4] Stopping the service and the agent...
if exist "C:\ProgramData\PanicButton\auth.key" goto :have_key
goto :no_key
:have_key
set /p CUR_KEY=<"C:\ProgramData\PanicButton\auth.key"
curl.exe -s -m 3 "http://127.0.0.1:8085/api/exit?key=!CUR_KEY!" >nul 2>&1
:no_key
schtasks /End /TN "PanicButton_Autostart" >nul 2>&1
taskkill /F /IM PanicButton.exe /T >nul 2>&1
taskkill /F /IM PanicService.exe /T >nul 2>&1
rem Wait until BOTH processes are gone, otherwise the watchdog relaunches
rem the agent and locks PanicButton.exe again.
set /a WAIT_TRIES=0
:wait_agent
tasklist /FI "IMAGENAME eq PanicButton.exe" /NH 2>nul | find /I "PanicButton.exe" >nul
if not errorlevel 1 goto :wait_again
tasklist /FI "IMAGENAME eq PanicService.exe" /NH 2>nul | find /I "PanicService.exe" >nul
if not errorlevel 1 goto :wait_again
goto :agent_gone
:wait_again
set /a WAIT_TRIES+=1
if %WAIT_TRIES% GEQ 30 goto :agent_gone
ping 127.0.0.1 -n 2 >nul
goto :wait_agent
:agent_gone
ping 127.0.0.1 -n 2 >nul

rem ---- 2. copy the artefacts into ProgramData -----------------------------
rem  Windows keeps a RUNNING executable locked, so a plain copy into it
rem  fails with "being used by another process" - and PanicMasterService
rem  relaunches the agent within 3 seconds, so it can never be won by a
rem  retry loop without elevation.
rem
rem  Windows DOES allow a running image to be RENAMED.  Renaming the old
rem  executable out of the way and then writing the new file into place
rem  upgrades the binaries with no elevated stop and no race.
echo [2/4] Deploying the binaries...
if not exist "C:\ProgramData\PanicButton" mkdir "C:\ProgramData\PanicButton"
if exist "C:\ProgramData\PanicButton\PanicButton.old.exe" del /Q "C:\ProgramData\PanicButton\PanicButton.old.exe" >nul 2>&1
if exist "C:\ProgramData\PanicButton\PanicService.old.exe" del /Q "C:\ProgramData\PanicButton\PanicService.old.exe" >nul 2>&1
if exist "C:\ProgramData\PanicButton\PanicButton.exe" move /Y "C:\ProgramData\PanicButton\PanicButton.exe" "C:\ProgramData\PanicButton\PanicButton.old.exe" >nul 2>&1
if exist "C:\ProgramData\PanicButton\PanicService.exe" move /Y "C:\ProgramData\PanicButton\PanicService.exe" "C:\ProgramData\PanicButton\PanicService.old.exe" >nul 2>&1
copy /Y "PanicButton.exe" "C:\ProgramData\PanicButton\PanicButton.exe" >nul
if errorlevel 1 goto :deploy_failed
copy /Y "PanicService.exe" "C:\ProgramData\PanicButton\PanicService.exe" >nul
if errorlevel 1 goto :deploy_failed
copy /Y "PanicProvider.dll" "C:\ProgramData\PanicButton\PanicProvider.dll" >nul
if errorlevel 1 goto :deploy_failed

if exist "android-app\www\jsqr.min.js" copy /Y "android-app\www\jsqr.min.js" "C:\ProgramData\PanicButton\jsqr.min.js" >nul
if exist "PanicCTRL.apk" copy /Y "PanicCTRL.apk" "C:\ProgramData\PanicButton\PanicCTRL.apk" >nul
if exist "dist\PanicCTRL-Setup.exe" copy /Y "dist\PanicCTRL-Setup.exe" "C:\ProgramData\PanicButton\PanicCTRL-Setup.exe" >nul

rem ---- 3. refresh the web assets -----------------------------------------
rem  The agent serves static assets from %ProgramData%\PanicButton\www first,
rem  so copying them there makes the dashboard work regardless of the working
rem  directory the agent was started from.
echo [3/4] Refreshing the deployed web assets...
if not exist "android-app\www" goto :no_www
if not exist "C:\ProgramData\PanicButton\www" mkdir "C:\ProgramData\PanicButton\www"
xcopy /E /I /Y /Q "android-app\www\*" "C:\ProgramData\PanicButton\www\" >nul
:no_www

rem ---- 4. start the agent -------------------------------------------------
echo [4/4] Restarting the agent...
schtasks /Run /TN "PanicButton_Autostart" >nul 2>&1
ping 127.0.0.1 -n 3 >nul

echo.
echo ===================================================
echo   DEPLOYED
echo   installer : C:\ProgramData\PanicButton\PanicCTRL-Setup.exe
echo   source    : dist\PanicCTRL-Setup.exe
echo ===================================================
exit /b 0

:deploy_failed
echo [ERROR] could not deploy the binaries to C:\ProgramData\PanicButton
exit /b 1
