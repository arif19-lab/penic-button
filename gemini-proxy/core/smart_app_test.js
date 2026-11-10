const { spawn } = require("child_process");

// ─── Self-Contained Smart Windows Automation Script ──────────────────────────
const automationScript = `
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms

Write-Output "[AI-Agent] 1. Launching Windows Calculator..."
Start-Process calc

# 1. Intelligent Window Wait Loop (handles slow startup)
$calc = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 250
    $root = [System.Windows.Automation.AutomationElement]::RootElement
    
    # Try finding by ClassName or Name
    $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ClassNameProperty, "ApplicationFrameWindow")
    $frames = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $cond)
    foreach ($f in $frames) {
        if ($f.Current.Name -like "*Calculator*" -or $f.Current.Name -like "*ক্যালকুলেটর*") {
            $calc = $f
            break
        }
    }
    if ($null -ne $calc) { break }
}

if ($null -eq $calc) {
    Write-Output "ERROR: Could not detect Calculator window."
    exit 1
}

Write-Output "[AI-Agent] 2. Detected Window: '$($calc.Current.Name)' (ProcessId: $($calc.Current.ProcessId))"

# 2. Bring window to front
$calc.SetFocus()
Start-Sleep -Milliseconds 400

# Helper function to find button intelligently by AutomationId or Name
function Click-UIAButton($element, $autoId, $name) {
    $found = $null
    if ($autoId) {
        $c1 = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, $autoId)
        $found = $element.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $c1)
    }
    if ($null -eq $found -and $name) {
        $c2 = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $name)
        $found = $element.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $c2)
    }
    
    if ($null -eq $found) {
        Write-Output "   -> Warning: Button [$autoId / $name] not found."
        return $false
    }
    
    # Try InvokePattern
    $pattern = $null
    if ($found.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pattern)) {
        $pattern.Invoke()
        Write-Output "   -> [CLICKED] '$($found.Current.Name)' via InvokePattern"
        return $true
    } else {
        # Fallback to physical click on button coordinates
        $rect = $found.Current.BoundingRectangle
        if ($rect.Width -gt 0) {
            $centerX = [int]($rect.X + $rect.Width / 2)
            $centerY = [int]($rect.Y + $rect.Height / 2)
            [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($centerX, $centerY)
            
            # Send mouse click via Windows API
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class MouseApi {
                    [DllImport("user32.dll")]
                    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
                }
"@
            [MouseApi]::mouse_event(0x0002, 0, 0, 0, 0) # Left Down
            Start-Sleep -Milliseconds 30
            [MouseApi]::mouse_event(0x0004, 0, 0, 0, 0) # Left Up
            Write-Output "   -> [CLICKED] '$($found.Current.Name)' via Coordinate ($centerX, $centerY)"
            return $true
        }
    }
    return $false
}

Write-Output "[AI-Agent] 3. Executing Calculation: 9 5 * 2 = ..."

# Click 9
Click-UIAButton $calc "num9Button" "Nine"
Start-Sleep -Milliseconds 250

# Click 5
Click-UIAButton $calc "num5Button" "Five"
Start-Sleep -Milliseconds 250

# Click Multiply (*)
Click-UIAButton $calc "multiplyButton" "Multiply by"
Start-Sleep -Milliseconds 250

# Click 2
Click-UIAButton $calc "num2Button" "Two"
Start-Sleep -Milliseconds 250

# Click Equals (=)
Click-UIAButton $calc "equalButton" "Equals"
Start-Sleep -Milliseconds 500

# 3. Read Output from Calculator Display Screen
Write-Output "[AI-Agent] 4. Reading Result from Calculator Screen..."
$resCond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "CalculatorResults")
$displayElem = $calc.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $resCond)

if ($displayElem) {
    $resultText = $displayElem.Current.Name
    Write-Output "======================================================"
    Write-Output " 🎯 FINAL RESULT READ FROM APP: '$resultText'"
    Write-Output "======================================================"
} else {
    Write-Output "Could not read display element directly."
}

# 4. Gracefully close Calculator
Start-Sleep -Milliseconds 1000
Write-Output "[AI-Agent] 5. Closing Calculator cleanly..."
Stop-Process -Name CalculatorApp, calc -Force -ErrorAction SilentlyContinue
Write-Output "[AI-Agent] Test successfully finished!"
`;

// Encode as UTF-16LE Base64 for zero-error execution
const buffer = Buffer.from(automationScript, "utf16le");
const base64Cmd = buffer.toString("base64");

console.log("Starting Intelligent App Automation Demonstration...\n");

const child = spawn("powershell.exe", [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy", "Bypass",
  "-EncodedCommand", base64Cmd
]);

child.stdout.on("data", (data) => {
  process.stdout.write(data.toString());
});

child.stderr.on("data", (data) => {
  process.stderr.write(data.toString());
});

child.on("close", (code) => {
  console.log(`\nScript exited with code ${code}.`);
});
