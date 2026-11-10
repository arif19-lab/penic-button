const { spawn } = require("child_process");

module.exports = {
  declaration: {
    name: "execute_system_script",
    description: "Universal Windows administrative and system execution primitive. Executes multi-line PowerShell, .NET, WMI, or CLI scripts directly on the Windows host (file system, hardware telemetry, settings, processes, registry). STRICT RESTRICTION: DO NOT use this tool for GUI automation, typing in apps, clicking buttons, or sending simulated keystrokes (no WScript.Shell or SendKeys). For all GUI interactions across apps, menus, and dialogs, you MUST use 'interact_ui'.",
    parameters: {
      type: "OBJECT",
      properties: {
        script: {
          type: "STRING",
          description: "The full PowerShell or .NET script to execute on Windows (administrative/system tasks only)."
        },
        timeout_ms: {
          type: "INTEGER",
          description: "Execution timeout in milliseconds (default: 30000)."
        }
      },
      required: ["script"]
    }
  },

  async execute(args) {
    const script = args?.script;
    if (!script || typeof script !== "string") {
      return { success: false, error: "Missing or invalid 'script' parameter." };
    }

    // Safeguard 1: Prevent blind SendKeys GUI scripting from bypassing closed-loop UI engine
    if (script.includes("WScript.Shell") && (script.includes("SendKeys") || script.includes("AppActivate"))) {
      return {
        success: false,
        error: "Blind WScript.Shell SendKeys is prohibited. For desktop GUI automation, clicking, and typing into applications, use interact_ui (action: 'run_sequence' or 'click' / 'set_text') for closed-loop verified execution."
      };
    }

    // Safeguard 2: Prevent launching apps in Hidden mode
    if (/windowstyle\s+hidden/i.test(script)) {
      return {
        success: false,
        error: "Opening desktop applications with -WindowStyle Hidden is prohibited. All apps must be opened visibly on the user's desktop screen."
      };
    }

    // Safeguard 3: Prevent faking UI file saves via Set-Content / Out-File
    if (/(Set-Content|Out-File).*(\.txt|\.doc)/i.test(script) && !script.includes("# allow-direct-write")) {
      return {
        success: false,
        error: "Directly writing text files via Set-Content or Out-File is prohibited during UI automation tasks. Files must be saved through the application's real UI (File -> Save as) using interact_ui."
      };
    }

    const timeout = typeof args.timeout_ms === "number" && args.timeout_ms > 0 ? args.timeout_ms : 30000;
    const startTime = Date.now();

    // Convert script to UTF-16LE Base64 for PowerShell -EncodedCommand (prevents ALL quote/escaping bugs)
    const buffer = Buffer.from(script, "utf16le");
    const base64Script = buffer.toString("base64");

    return new Promise((resolve) => {
      const child = spawn("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle", "Hidden",
        "-ExecutionPolicy", "Bypass",
        "-EncodedCommand", base64Script
      ], {
        windowsHide: true
      });

      let stdout = "";
      let stderr = "";
      let timer = null;

      if (timeout > 0) {
        timer = setTimeout(() => {
          child.kill();
          resolve({
            success: false,
            error: `Script execution timed out after ${timeout}ms`,
            duration_ms: Date.now() - startTime,
            stdout,
            stderr
          });
        }, timeout);
      }

      child.stdout.on("data", (data) => {
        stdout += data.toString("utf8");
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString("utf8");
      });

      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        const duration_ms = Date.now() - startTime;
        resolve({
          success: code === 0,
          exitCode: code,
          duration_ms,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on("error", (err) => {
        if (timer) clearTimeout(timer);
        resolve({
          success: false,
          error: err.message,
          duration_ms: Date.now() - startTime,
          stdout,
          stderr
        });
      });
    });
  }
};
