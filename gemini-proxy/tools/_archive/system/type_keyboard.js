const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "type_keyboard",
    description: "Injects text keystrokes or special keys into the currently active Windows application window.",
    parameters: {
      type: "OBJECT",
      properties: {
        text: {
          type: "STRING",
          description: "The text to type or special keys (e.g. '{ENTER}', '{ESC}', '{TAB}', '^c', '^v')."
        }
      },
      required: ["text"]
    }
  },

  async execute(args) {
    const text = args?.text;
    if (!text || typeof text !== "string") {
      return { success: false, error: "Missing or invalid 'text' parameter." };
    }

    // Escape double quotes and backslashes for PowerShell WScript.Shell SendKeys
    const escaped = text.replace(/`/g, "``").replace(/"/g, '`"');

    const psScript = `
      $wsh = New-Object -ComObject WScript.Shell
      $wsh.SendKeys("${escaped}")
    `;

    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "${psScript.replace(/\n/g, ' ')}"`, { timeout: 5000, windowsHide: true }, (err) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({
          success: true,
          typed_text: text
        });
      });
    });
  }
};
