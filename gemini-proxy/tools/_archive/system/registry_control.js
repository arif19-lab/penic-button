const { execFile } = require("child_process");

module.exports = {
  declaration: {
    name: "registry_control",
    description: "Reads, writes, creates, or deletes Windows Registry keys and values (HKCU / HKLM) natively without external dependencies.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action to perform: 'read', 'write', or 'delete'."
        },
        path: {
          type: "STRING",
          description: "Registry key path (e.g. 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' or 'HKLM:\\SOFTWARE\\...')."
        },
        name: {
          type: "STRING",
          description: "Registry value name (e.g. 'AppsUseLightTheme', 'SystemUsesLightTheme')."
        },
        value: {
          type: "STRING",
          description: "Value to write (used only for 'write' action)."
        },
        value_type: {
          type: "STRING",
          description: "Data type for 'write': 'DWord', 'String', 'ExpandString', 'Binary', 'MultiString', or 'QWord'. Default is 'String' (or auto-detected DWord if integer)."
        }
      },
      required: ["action", "path", "name"]
    }
  },

  async execute(args = {}) {
    const action = (args.action || "read").toLowerCase().trim();
    let regPath = (args.path || "").trim();
    const regName = (args.name || "").trim();
    const rawVal = args.value !== undefined && args.value !== null ? String(args.value) : "";
    let valType = (args.value_type || "").trim();

    if (!regPath || !regName) {
      return { success: false, error: "Missing required 'path' or 'name' parameter." };
    }

    // Normalize HKEY prefixes to PowerShell drive paths
    regPath = regPath
      .replace(/^HKEY_CURRENT_USER\\?/i, "HKCU:\\")
      .replace(/^HKEY_LOCAL_MACHINE\\?/i, "HKLM:\\")
      .replace(/^HKCU\\/i, "HKCU:\\")
      .replace(/^HKLM\\/i, "HKLM:\\");

    if (!valType) {
      valType = /^-?\d+$/.test(rawVal) ? "DWord" : "String";
    }

    let psCode = "";
    if (action === "read") {
      psCode = `
        try {
          $val = (Get-ItemProperty -Path "${regPath}" -Name "${regName}" -ErrorAction Stop)."${regName}"
          [PSCustomObject]@{ Success = $true; Path = "${regPath}"; Name = "${regName}"; Value = $val } | ConvertTo-Json -Compress
        } catch {
          [PSCustomObject]@{ Success = $false; Error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
      `;
    } else if (action === "write") {
      const parsedVal = valType === "DWord" || valType === "QWord" ? parseInt(rawVal, 10) : rawVal;
      psCode = `
        try {
          if (-not (Test-Path -Path "${regPath}")) {
            New-Item -Path "${regPath}" -Force | Out-Null
          }
          New-ItemProperty -Path "${regPath}" -Name "${regName}" -Value ${typeof parsedVal === "number" ? parsedVal : `"${parsedVal}"`} -PropertyType "${valType}" -Force | Out-Null
          $newVal = (Get-ItemProperty -Path "${regPath}" -Name "${regName}")."${regName}"
          [PSCustomObject]@{ Success = $true; Path = "${regPath}"; Name = "${regName}"; Value = $newVal; Type = "${valType}" } | ConvertTo-Json -Compress
        } catch {
          [PSCustomObject]@{ Success = $false; Error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
      `;
    } else if (action === "delete") {
      psCode = `
        try {
          Remove-ItemProperty -Path "${regPath}" -Name "${regName}" -Force -ErrorAction Stop
          [PSCustomObject]@{ Success = $true; Path = "${regPath}"; Name = "${regName}"; Action = "deleted" } | ConvertTo-Json -Compress
        } catch {
          [PSCustomObject]@{ Success = $false; Error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
      `;
    } else {
      return { success: false, error: `Invalid action '${action}'. Must be 'read', 'write', or 'delete'.` };
    }

    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", psCode],
        { timeout: 8000, windowsHide: true },
        (err, stdout, stderr) => {
          if (err && !stdout) {
            return resolve({ success: false, action, error: stderr?.trim() || err.message });
          }
          try {
            const data = JSON.parse((stdout || "").trim());
            resolve({
              action,
              ...data
            });
          } catch (pe) {
            resolve({
              success: false,
              action,
              error: `Failed to parse registry result: ${stdout || pe.message}`
            });
          }
        }
      );
    });
  }
};
