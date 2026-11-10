const { execFile } = require("child_process");

module.exports = {
  declaration: {
    name: "clipboard_control",
    description: "Reads or sets the Windows system clipboard text natively.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action to perform: 'get', 'set', or 'clear'."
        },
        text: {
          type: "STRING",
          description: "Text to copy to the clipboard (required when action is 'set')."
        }
      },
      required: ["action"]
    }
  },

  async execute(args = {}) {
    const action = (args.action || "get").toLowerCase().trim();
    const textToSet = args.text !== undefined && args.text !== null ? String(args.text) : "";

    let psCode = "";
    if (action === "get") {
      psCode = `[PSCustomObject]@{ Success = $true; Action = "get"; Text = (Get-Clipboard -Raw -ErrorAction SilentlyContinue) } | ConvertTo-Json -Compress`;
    } else if (action === "set") {
      // Base64 encode the string inside script to avoid quote breaks
      const b64 = Buffer.from(textToSet, "utf8").toString("base64");
      psCode = `
        $bytes = [System.Convert]::FromBase64String("${b64}")
        $str = [System.Text.Encoding]::UTF8.GetString($bytes)
        Set-Clipboard -Value $str
        [PSCustomObject]@{ Success = $true; Action = "set"; Length = $str.Length } | ConvertTo-Json -Compress
      `;
    } else if (action === "clear") {
      psCode = `
        Set-Clipboard -Value ""
        [PSCustomObject]@{ Success = $true; Action = "clear" } | ConvertTo-Json -Compress
      `;
    } else {
      return { success: false, error: `Invalid action '${action}'. Must be 'get', 'set', or 'clear'.` };
    }

    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", psCode],
        { timeout: 5000, windowsHide: true },
        (err, stdout, stderr) => {
          if (err && !stdout) {
            return resolve({ success: false, action, error: stderr?.trim() || err.message });
          }
          try {
            const data = JSON.parse((stdout || "").trim());
            resolve({
              success: true,
              ...data
            });
          } catch (pe) {
            resolve({
              success: true,
              action,
              text: (stdout || "").trim()
            });
          }
        }
      );
    });
  }
};
