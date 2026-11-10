import subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')

ps_script = """
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms

Write-Output "[1] Starting Notepad..."
$np = Start-Process notepad -PassThru
$handle = 0
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 200
    $np.Refresh()
    if ($np.MainWindowHandle -ne 0) {
        $handle = $np.MainWindowHandle
        break
    }
}

if ($handle -eq 0) {
    Write-Output "ERROR: Window handle not acquired."
    exit 1
}

Write-Output "[2] Acquired Window Handle: $handle (PID: $($np.Id))"

# Get UI Automation Element directly from Window Handle
$winElement = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$handle)
Write-Output "[3] Connected to UI Automation Root: '$($winElement.Current.Name)'"

# Find all interactive elements inside Notepad
$condition = New-Object System.Windows.Automation.OrCondition(
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)),
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::MenuItem))
)

$elements = $winElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
Write-Output "[4] Total Clickable Elements Found: $($elements.Count)"

foreach ($el in $elements) {
    $n = $el.Current.Name
    $id = $el.Current.AutomationId
    $type = $el.Current.ControlType.ProgrammaticName
    if (-not [string]::IsNullOrWhiteSpace($n)) {
        Write-Output "   * [$type] '$n' (AutoId: $id)"
    }
}

# Click on the first interactive button/menu item intelligently!
$target = $null
foreach ($el in $elements) {
    if ($el.Current.Name -in @("File", "Settings", "Edit", "View", "New tab")) {
        $target = $el
        break
    }
}

if (-not $target -and $elements.Count -gt 0) {
    $target = $elements[0]
}

if ($target) {
    Write-Output "[5] Intelligently Invoking Button: '$($target.Current.Name)'..."
    $pattern = $null
    if ($target.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pattern)) {
        $pattern.Invoke()
        Write-Output "   -> SUCCESS: Invoked '$($target.Current.Name)' via UIA InvokePattern!"
    } elseif ($target.TryGetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$pattern)) {
        $pattern.Expand()
        Write-Output "   -> SUCCESS: Expanded menu '$($target.Current.Name)' via ExpandCollapsePattern!"
    } else {
        # Click via BoundingRectangle
        $rect = $target.Current.BoundingRectangle
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]($rect.X + $rect.Width/2), [int]($rect.Y + $rect.Height/2))
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        Write-Output "   -> SUCCESS: Triggered '$($target.Current.Name)' via focused coordinates!"
    }
}

Start-Sleep -Milliseconds 1500
Stop-Process -Id $np.Id -Force
Write-Output "[6] Test completed cleanly!"
"""

res = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script], capture_output=True, text=True, encoding='utf-8')
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
