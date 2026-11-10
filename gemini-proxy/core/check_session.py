import subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')

cmd = """
$proc = Get-Process -Id $PID
Write-Output "Current Script PID: $($proc.Id), SessionId: $($proc.SessionId)"

$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Write-Output "Running as: $user"

# Check active explorer session
$explorer = Get-Process -Name explorer -ErrorAction SilentlyContinue | Select-Object -First 1
if ($explorer) {
    Write-Output "Explorer PID: $($explorer.Id), SessionId: $($explorer.SessionId)"
}
"""

res = subprocess.run(['powershell', '-Command', cmd], capture_output=True, text=True, encoding='utf-8')
print(res.stdout)
print(res.stderr)
