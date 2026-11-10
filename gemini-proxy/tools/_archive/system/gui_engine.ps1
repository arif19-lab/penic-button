param(
  [string]$Action = "inspect",
  [string]$WindowName = "",
  [string]$TargetElement = "",
  [string]$Value = "",
  [string]$StepsJson = ""
)

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class Win32Gui {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN= 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP  = 0x0010;
    public const uint MOUSEEVENTF_WHEEL    = 0x0800;

    public static void ForceForeground(IntPtr hWnd) {
      if (hWnd == IntPtr.Zero) return;
      uint lpdwProcessId;
      uint targetThread = GetWindowThreadProcessId(hWnd, out lpdwProcessId);
      uint currentThread = GetCurrentThreadId();
      AttachThreadInput(currentThread, targetThread, true);
      ShowWindowAsync(hWnd, 9); // SW_RESTORE
      SetForegroundWindow(hWnd);
      AttachThreadInput(currentThread, targetThread, false);
    }
  }
"@ -ErrorAction SilentlyContinue

function Get-TargetWindowElement {
  param([string]$name)
  if (![string]::IsNullOrEmpty($name)) {
    $proc = Get-Process | Where-Object { ($_.ProcessName -like "*$name*" -or $_.MainWindowTitle -like "*$name*") -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($proc) {
      [Win32Gui]::ForceForeground($proc.MainWindowHandle)
      Start-Sleep -Milliseconds 150
      return [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
    }
  }
  $hwnd = [Win32Gui]::GetForegroundWindow()
  if ($hwnd -ne [IntPtr]::Zero) {
    return [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
  }
  return [System.Windows.Automation.AutomationElement]::RootElement
}

function Click-Point([int]$x, [int]$y) {
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($x, $y)
  Start-Sleep -Milliseconds 30
  [Win32Gui]::mouse_event([Win32Gui]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
  Start-Sleep -Milliseconds 25
  [Win32Gui]::mouse_event([Win32Gui]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  Start-Sleep -Milliseconds 30
}

function Send-NativeKeys([string]$text) {
  $wsh = New-Object -ComObject WScript.Shell
  $wsh.SendKeys($text)
  Start-Sleep -Milliseconds 50
}

# ─── ACTION 1: INSPECT UI TREE (Grounding) ──────────────────────────────────
if ($Action -eq "inspect") {
  $winEl = Get-TargetWindowElement -name $WindowName
  if (!$winEl) {
    [PSCustomObject]@{ Success = $false; Error = "Target window not found" } | ConvertTo-Json -Compress
    exit
  }

  $condition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::IsControlElementProperty, $true
  )
  $allControls = $winEl.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)

  $elements = @()
  $allowedTypes = @("Button", "Edit", "CheckBox", "ComboBox", "Hyperlink", "ListItem", "MenuItem", "TabItem")

  foreach ($ctrl in $allControls) {
    try {
      $type = $ctrl.Current.ControlType.ProgrammaticName.Replace("ControlType.", "")
      $name = $ctrl.Current.Name
      $autoId = $ctrl.Current.AutomationId
      $rect = $ctrl.Current.BoundingRectangle

      if ($allowedTypes -contains $type -and ($name -or $autoId) -and $rect.Width -gt 0 -and $rect.Height -gt 0) {
        $centerX = [int]($rect.X + ($rect.Width / 2))
        $centerY = [int]($rect.Y + ($rect.Height / 2))

        $elements += [PSCustomObject]@{
          Type = $type
          Name = $name
          AutomationId = $autoId
          X = $centerX
          Y = $centerY
          Width = [int]$rect.Width
          Height = [int]$rect.Height
        }
        if ($elements.Count -ge 35) { break }
      }
    } catch {}
  }

  [PSCustomObject]@{
    Success = $true
    Window = $winEl.Current.Name
    ControlCount = $elements.Count
    Controls = $elements
  } | ConvertTo-Json -Compress -Depth 4
  exit
}

# ─── ACTION 2: MULTI-STEP TASK EXECUTION (Sense-Plan-Act Sequence) ──────────
if ($Action -eq "execute_steps") {
  $winEl = Get-TargetWindowElement -name $WindowName
  $steps = @()
  try {
    if ($StepsJson) {
      $steps = ConvertFrom-Json $StepsJson
    }
  } catch {
    [PSCustomObject]@{ Success = $false; Error = "Invalid steps JSON: " + $_.Exception.Message } | ConvertTo-Json -Compress
    exit
  }

  $log = @()
  foreach ($s in $steps) {
    $sType = ($s.type + "").ToLower().Trim()
    $sTarget = $s.target
    $sValue = $s.value
    $sX = if ($s.x) { [int]$s.x } else { -1 }
    $sY = if ($s.y) { [int]$s.y } else { -1 }

    switch ($sType) {
      "click_element" {
        $found = $null
        if ($winEl) {
          $condition = New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::NameProperty, $sTarget
          )
          $found = $winEl.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
        }
        if ($found) {
          $rect = $found.Current.BoundingRectangle
          $cx = [int]($rect.X + ($rect.Width / 2))
          $cy = [int]($rect.Y + ($rect.Height / 2))
          Click-Point $cx $cy
          $log += "Clicked element '$sTarget' at ($cx, $cy)"
        } elseif ($sX -ge 0 -and $sY -ge 0) {
          Click-Point $sX $sY
          $log += "Clicked coordinates ($sX, $sY)"
        } else {
          $log += "Failed to find element '$sTarget'"
        }
      }
      "click_coords" {
        if ($sX -ge 0 -and $sY -ge 0) {
          Click-Point $sX $sY
          $log += "Clicked coordinates ($sX, $sY)"
        }
      }
      "type" {
        if ($sValue) {
          Send-NativeKeys $sValue
          $log += "Typed value into active field"
        }
      }
      "key" {
        if ($sValue) {
          $k = switch ($sValue.ToUpper()) {
            "ENTER" { "{ENTER}" }
            "TAB" { "{TAB}" }
            "ESC" { "{ESC}" }
            "BACKSPACE" { "{BACKSPACE}" }
            "SPACE" { " " }
            "SELECT_ALL" { "^a" }
            "COPY" { "^c" }
            "PASTE" { "^v" }
            default { "{$sValue}" }
          }
          Send-NativeKeys $k
          $log += "Pressed key $sValue"
        }
      }
      "wait" {
        $ms = if ($sValue) { [int]$sValue } else { 300 }
        Start-Sleep -Milliseconds $ms
        $log += "Waited ${ms}ms"
      }
    }
  }

  [PSCustomObject]@{
    Success = $true
    Window = if ($winEl) { $winEl.Current.Name } else { "Active Window" }
    StepsExecuted = $log.Count
    ExecutionLog = $log
  } | ConvertTo-Json -Compress -Depth 4
  exit
}

# ─── ACTION 3: HIGH-LEVEL FORM AUTO-FILL ─────────────────────────────────────
if ($Action -eq "fill_form") {
  $winEl = Get-TargetWindowElement -name $WindowName
  $formData = @()
  try {
    if ($StepsJson) {
      $formData = ConvertFrom-Json $StepsJson
    }
  } catch {
    [PSCustomObject]@{ Success = $false; Error = "Invalid form JSON: " + $_.Exception.Message } | ConvertTo-Json -Compress
    exit
  }

  $fillLog = @()
  foreach ($item in $formData) {
    $fieldName = $item.field
    $fieldValue = $item.value

    # Find the element by Name or AutomationId
    $fieldEl = $null
    if ($winEl -and $fieldName) {
      $condition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, $fieldName
      )
      $fieldEl = $winEl.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)

      if (!$fieldEl) {
        $conditionId = New-Object System.Windows.Automation.PropertyCondition(
          [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $fieldName
        )
        $fieldEl = $winEl.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $conditionId)
      }
    }

    if ($fieldEl) {
      $rect = $fieldEl.Current.BoundingRectangle
      $cx = [int]($rect.X + ($rect.Width / 2))
      $cy = [int]($rect.Y + ($rect.Height / 2))
      Click-Point $cx $cy
      Start-Sleep -Milliseconds 50
      Send-NativeKeys "^a"
      Start-Sleep -Milliseconds 30
      Send-NativeKeys $fieldValue
      $fillLog += "Filled field '$fieldName' with provided value"
    } else {
      # Fallback: Tab navigation
      Send-NativeKeys "{TAB}"
      Start-Sleep -Milliseconds 40
      Send-NativeKeys $fieldValue
      $fillLog += "Tabbed into field and entered value for '$fieldName'"
    }
    Start-Sleep -Milliseconds 50
  }

  # If TargetElement is specified, click the submit/action button
  if ($TargetElement) {
    $submitBtn = $null
    if ($winEl) {
      $btnCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, $TargetElement
      )
      $submitBtn = $winEl.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $btnCondition)
    }

    if ($submitBtn) {
      $bRect = $submitBtn.Current.BoundingRectangle
      $bx = [int]($bRect.X + ($bRect.Width / 2))
      $by = [int]($bRect.Y + ($bRect.Height / 2))
      Click-Point $bx $by
      $fillLog += "Clicked submit button '$TargetElement' at ($bx, $by)"
    } else {
      # Default: Press Enter
      Send-NativeKeys "{ENTER}"
      $fillLog += "Pressed ENTER to submit form"
    }
  }

  [PSCustomObject]@{
    Success = $true
    Window = if ($winEl) { $winEl.Current.Name } else { "Active Window" }
    FilledFields = $formData.Count
    ExecutionLog = $fillLog
  } | ConvertTo-Json -Compress -Depth 4
  exit
}
