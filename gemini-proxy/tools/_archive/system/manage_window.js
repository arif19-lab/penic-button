const { execFile } = require("child_process");

module.exports = {
  declaration: {
    name: "manage_window",
    description: "Controls or focuses any Windows application window (restore, focus, minimize, maximize, or close) with multi-strategy Win32/UWP activation.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action to perform: 'restore', 'focus', 'minimize', 'maximize', 'close_active', or 'minimize_all'."
        },
        process_name: {
          type: "STRING",
          description: "Target application or process name (e.g. 'notepad', 'chrome', 'calc', 'vscode'). If empty, targets the active window."
        }
      },
      required: ["action"]
    }
  },

  async execute(args) {
    const action = (args?.action || "restore").toLowerCase().trim();

    if (action === "minimize_all") {
      const psScript = `(New-Object -ComObject Shell.Application).MinimizeAll()`;
      return new Promise((resolve) => {
        execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", psScript], { windowsHide: true }, (err) => {
          resolve({ success: !err, action: "minimize_all", error: err?.message });
        });
      });
    }

    if (action === "close_active") {
      const psScript = `$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys("%{F4}")`;
      return new Promise((resolve) => {
        execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", psScript], { windowsHide: true }, (err) => {
          resolve({ success: !err, action: "close_active", error: err?.message });
        });
      });
    }

    const targetProc = (args?.process_name || "").replace(/[^a-zA-Z0-9_\-\.]/g, "");

    const psScript = `
$target = "${targetProc}"
$wsh = New-Object -ComObject WScript.Shell
$activated = $false

if ($target) {
  $activated = $wsh.AppActivate($target)
}

if (-not $activated) {
  $p = Get-Process | Where-Object { ($_.ProcessName -like "*$target*" -or $_.MainWindowTitle -like "*$target*") -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if ($p) {
    $activated = $wsh.AppActivate($p.Id)
  }
}

if (-not $activated -and ("${action}" -eq "restore" -or "${action}" -eq "focus") -and $target) {
  try {
    Start-Process $target -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 400
    $activated = $wsh.AppActivate($target)
  } catch {}
}

if ($activated) {
  Write-Output "OK"
} else {
  Write-Output "NOT_FOUND"
}
`;

    const encoded = Buffer.from(psScript, "utf16le").toString("base64");

    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-EncodedCommand", encoded],
        { timeout: 8000, windowsHide: true },
        (err, stdout, stderr) => {
          const out = (stdout || "").trim();
          if (out.includes("OK")) {
            resolve({ success: true, action, target: targetProc || "active_window" });
          } else {
            resolve({
              success: false,
              action,
              target: targetProc,
              error: out.includes("NOT_FOUND") ? `Could not activate or find window for '${targetProc}'` : (stderr?.trim() || err?.message || out)
            });
          }
        }
      );
    });
  }
};
