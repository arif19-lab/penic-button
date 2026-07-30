$desktop = [Environment]::GetFolderPath('Desktop')
$localLink = Join-Path $desktop 'LOCAL_PANIC_LINK.url'
Stop-Process -Name 'cloudflared' -Force -ErrorAction SilentlyContinue
$localUrl = 'http://192.168.0.100:8080/?key=imran2024'
[System.IO.File]::WriteAllText($localLink, "[InternetShortcut]`r`nURL=$localUrl`r`n")
