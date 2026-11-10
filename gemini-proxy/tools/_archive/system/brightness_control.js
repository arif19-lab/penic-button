const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "brightness_control",
    description: "Inspects or adjusts the monitor display brightness percentage (0 to 100). Returns verified current hardware brightness level.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action to perform: 'set' (default) to set exact level, or 'get' to inspect current brightness without changing it."
        },
        level: {
          type: "INTEGER",
          description: "Target brightness percentage (0-100). Required if action is 'set'."
        }
      }
    }
  },

  async execute(args) {
    const action = (args?.action || "set").toLowerCase();

    // 1. Get Current Brightness (Read-only inspection)
    if (action === "get" || (args?.level === undefined && args?.level === null)) {
      const getScript = `
        try {
          $b = (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness -ErrorAction Stop).CurrentBrightness;
          Write-Output "LEVEL:$b";
        } catch {
          Write-Output "ERROR:$($_.Exception.Message)";
        }
      `.trim();

      const encoded = Buffer.from(getScript, "utf16le").toString("base64");
      return new Promise((resolve) => {
        exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ${encoded}`, { timeout: 6000, windowsHide: true }, (err, stdout) => {
          const out = (stdout || "").trim();
          if (out.startsWith("LEVEL:")) {
            const currentLevel = parseInt(out.replace("LEVEL:", "").trim(), 10);
            return resolve({
              success: true,
              action: "get",
              current_brightness: currentLevel,
              verified: true,
              message: `Current display brightness is ${currentLevel}%.`
            });
          }
          resolve({
            success: false,
            action: "get",
            error: out.replace("ERROR:", "").trim() || err?.message || "Could not read display brightness"
          });
        });
      });
    }

    // 2. Set Brightness with Read-Back Verification
    if (typeof args?.level !== "number") {
      return { success: false, error: "Missing or invalid 'level' parameter (0-100)." };
    }

    const targetLevel = Math.min(Math.max(Math.round(args.level), 0), 100);

    const setScript = `
      try {
        $methods = Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -ErrorAction Stop;
        $methods.WmiSetBrightness(1, ${targetLevel}) | Out-Null;
        Start-Sleep -Milliseconds 150;
        $verified = (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness -ErrorAction Stop).CurrentBrightness;
        Write-Output "VERIFIED:$verified";
      } catch {
        Write-Output "ERROR:$($_.Exception.Message)";
      }
    `.trim();

    const encodedCmd = Buffer.from(setScript, "utf16le").toString("base64");

    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ${encodedCmd}`, { timeout: 8000, windowsHide: true }, (err, stdout) => {
        const out = (stdout || "").trim();
        if (out.startsWith("VERIFIED:")) {
          const verifiedLevel = parseInt(out.replace("VERIFIED:", "").trim(), 10);
          const isExact = (verifiedLevel === targetLevel);
          return resolve({
            success: true,
            action: "set",
            requested_level: targetLevel,
            verified_level: verifiedLevel,
            state_confirmed: isExact,
            message: `Display brightness set to ${verifiedLevel}% and verified by hardware sensor.`
          });
        }

        resolve({
          success: false,
          action: "set",
          requested_level: targetLevel,
          error: out.replace("ERROR:", "").trim() || err?.message || "Failed to set display brightness"
        });
      });
    });
  }
};
