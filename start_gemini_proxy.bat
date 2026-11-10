@echo off
REM 🎙️ Gemini Live Proxy — PC-side WebSocket bridge for PANIC CTRL
REM Phone (APK) connects here instead of Google directly; API key stays on this PC.
REM Keep this window open while using the Gemini voice feature.
title PanicCTRL - Gemini Live Proxy (port 3001)
cd /d "%~dp0gemini-proxy"
echo ============================================
echo   PanicCTRL Gemini Live Proxy  (port 3001)
echo   API key source: C:\ProgramData\PanicButton\gemini_key.txt
echo ============================================
if not exist node_modules (
  echo Installing dependencies...
  call npm install --no-audit --no-fund
)
node server.js
pause
