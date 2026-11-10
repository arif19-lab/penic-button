const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "volume_control",
    description: "Sets master Windows audio volume (0-100) or mutes audio by setting volume to 0.",
    parameters: {
      type: "OBJECT",
      properties: {
        level: {
          type: "INTEGER",
          description: "Volume level from 0 (silent) to 100 (max)."
        },
        mute: {
          type: "BOOLEAN",
          description: "If true, sets volume to 0."
        }
      }
    }
  },

  async execute(args) {
    let targetLevel = 50;
    if (args?.mute) {
      targetLevel = 0;
    } else if (typeof args?.level === "number") {
      targetLevel = Math.min(Math.max(Math.round(args.level), 0), 100);
    }

    // PowerShell script to adjust Windows CoreAudio master volume scalar
    const psScript = `
      $wsh = New-Object -ComObject WScript.Shell
      # Or use endpoint volume
      $def = [math]::Round(${targetLevel} * 655.35)
      # Simulating volume keys or setting volume
      for ($i=0; $i -lt 50; $i++) { $wsh.SendKeys([char]174) }
      $steps = [math]::Round(${targetLevel} / 2)
      for ($i=0; $i -lt $steps; $i++) { $wsh.SendKeys([char]175) }
    `;

    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "${psScript.replace(/\n/g, ' ')}"`, { timeout: 10000, windowsHide: true }, (err) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({
          success: true,
          level: targetLevel,
          message: `Volume set to ${targetLevel}%`
        });
      });
    });
  }
};
