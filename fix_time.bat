@echo off
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator privileges to fix PC Time...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ===================================================
echo     Fixing Windows Time Synchronization (W32Time)
echo ===================================================
echo.

echo [1/5] Stopping and re-registering Windows Time Service...
net stop w32time >nul 2>&1
w32tm /unregister >nul 2>&1
w32tm /register >nul 2>&1

echo [2/5] Configuring NTP servers (time.windows.com, time.google.com)...
sc config w32time start= auto >nul 2>&1
net start w32time >nul 2>&1
w32tm /config /manualpeerlist:"time.windows.com,0x9 time.google.com,0x9" /syncfromflags:manual /reliable:yes /update >nul 2>&1

echo [3/5] Querying live NTP time from Google & Microsoft...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$client = New-Object System.Net.Sockets.UdpClient; $client.Client.ReceiveTimeout = 4000; $client.Connect('time.google.com', 123); $data = New-Object byte[] 48; $data[0] = 0x1B; $client.Send($data, $data.Length) | Out-Null; $ep = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0); $buf = $client.Receive([ref]$ep); $client.Close(); $sec = ([uint32]$buf[40] -shl 24) -bor ([uint32]$buf[41] -shl 16) -bor ([uint32]$buf[42] -shl 8) -bor ([uint32]$buf[43]); $utc = (New-Object DateTime(1900, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)).AddSeconds($sec); $local = $utc.ToLocalTime(); Set-Date -Date $local; Write-Host '[SUCCESS] System Clock Updated to: ' $local -ForegroundColor Green"

echo [4/5] Forcing Windows Time Service resynchronization...
w32tm /resync /force /nowait >nul 2>&1

echo [5/5] Current System Status:
powershell -NoProfile -Command "Get-Date; w32tm /query /status"

echo.
echo ===================================================
echo     PC TIME IS NOW ACCURATELY SYNCHRONIZED!
echo ===================================================
echo Window will close automatically in 5 seconds...
timeout /t 5 >nul
