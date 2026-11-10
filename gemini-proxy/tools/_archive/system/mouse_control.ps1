param(
  [string]$Action = "get_position",
  [int]$X = -1,
  [int]$Y = -1,
  [int]$Delta = 0
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class Win32Mouse {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    public const uint MOUSEEVENTF_LEFTDOWN   = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP     = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN  = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP    = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP   = 0x0040;
    public const uint MOUSEEVENTF_WHEEL      = 0x0800;
  }
"@ -ErrorAction SilentlyContinue

$curPos = [System.Windows.Forms.Cursor]::Position
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

if ($X -ge 0 -and $Y -ge 0) {
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
  Start-Sleep -Milliseconds 30
}

switch ($Action.ToLower()) {
  "click" {
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 20
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  }
  "double_click" {
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 20
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 80
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 20
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  }
  "right_click" {
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 20
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)
  }
  "middle_click" {
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 20
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0)
  }
  "drag" {
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    if ($X -ge 0 -and $Y -ge 0) {
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
    }
    Start-Sleep -Milliseconds 50
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  }
  "scroll" {
    [Win32Mouse]::mouse_event([Win32Mouse]::MOUSEEVENTF_WHEEL, 0, 0, [uint32]$Delta, 0)
  }
  "move" {
    # Cursor position already updated above
  }
  "get_position" {
    # Default query
  }
}

$finalPos = [System.Windows.Forms.Cursor]::Position

[PSCustomObject]@{
  Action = $Action
  CursorX = $finalPos.X
  CursorY = $finalPos.Y
  ScreenWidth = $screen.Width
  ScreenHeight = $screen.Height
} | ConvertTo-Json -Compress
