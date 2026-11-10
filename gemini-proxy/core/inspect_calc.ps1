Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes

# Start Calculator
$p = Start-Process calc -PassThru
Start-Sleep -Seconds 2

# Search all top-level windows in RootElement
$root = [System.Windows.Automation.AutomationElement]::RootElement
$allWindows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)

Write-Output "Total top-level elements: $($allWindows.Count)"
foreach ($w in $allWindows) {
    $name = $w.Current.Name
    $class = $w.Current.ClassName
    $pid = $w.Current.ProcessId
    if ($name -match "Calc" -or $class -match "Calc" -or $name -match "ক্যাল") {
        Write-Output "Found: Name='$name', Class='$class', PID=$pid"
        
        # List buttons inside
        $buttons = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)))
        Write-Output "Buttons found: $($buttons.Count)"
        foreach ($b in $buttons | Select-Object -First 5) {
            Write-Output " -> Button: '$($b.Current.Name)' (ID: $($b.Current.AutomationId))"
        }
    }
}

Stop-Process -Name CalculatorApp, calc -Force -ErrorAction SilentlyContinue
