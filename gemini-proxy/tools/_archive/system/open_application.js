const { exec } = require("child_process");

const APP_MAP = {
  chrome: "chrome",
  browser: "chrome",
  google: "https://google.com",
  youtube: "https://youtube.com",
  spotify: "spotify",
  notepad: "notepad",
  calculator: "calc",
  calc: "calc",
  vscode: "code",
  code: "code",
  terminal: "wt",
  cmd: "cmd",
  powershell: "powershell",
  explorer: "explorer",
  taskmgr: "taskmgr",
  settings: "ms-settings:"
};

module.exports = {
  declaration: {
    name: "open_application",
    description: "Launches an application, software, game, or URL on the Windows desktop (e.g. 'chrome', 'notepad', 'calc', 'vscode', 'spotify', or any website URL).",
    parameters: {
      type: "OBJECT",
      properties: {
        target: {
          type: "STRING",
          description: "Application name (e.g. 'chrome', 'spotify', 'notepad') or website URL (e.g. 'https://youtube.com')."
        }
      },
      required: ["target"]
    }
  },

  async execute(args) {
    const rawTarget = (args?.target || "").trim();
    if (!rawTarget) {
      return { success: false, error: "Missing 'target' parameter." };
    }

    const lower = rawTarget.toLowerCase();
    const resolved = APP_MAP[lower] || rawTarget;

    return new Promise((resolve) => {
      // Use Start-Process via PowerShell for clean asynchronous desktop launching
      let command = "";
      if (resolved.startsWith("http://") || resolved.startsWith("https://") || resolved.startsWith("ms-settings:")) {
        command = `Start-Process "${resolved}"`;
      } else {
        command = `Start-Process "${resolved}" -ErrorAction Stop`;
      }

      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "${command}"`, { timeout: 8000, windowsHide: true }, (err) => {
        if (err) {
          // Fallback to cmd /c start
          exec(`cmd.exe /c start "" "${resolved}"`, { windowsHide: true }, (err2) => {
            if (err2) {
              return resolve({ success: false, target: rawTarget, error: err2.message });
            }
            resolve({ success: true, target: rawTarget, launched: resolved, method: "cmd_start" });
          });
          return;
        }
        resolve({ success: true, target: rawTarget, launched: resolved, method: "powershell_start" });
      });
    });
  }
};
