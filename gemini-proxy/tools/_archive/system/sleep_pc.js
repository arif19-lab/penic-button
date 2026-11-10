const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "sleep_pc",
    description: "Puts the Windows computer into low-power sleep mode.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },

  async execute() {
    return new Promise((resolve) => {
      // Use SetSuspendState
      exec("powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command \"Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)\"", { windowsHide: true }, (err) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({
          success: true,
          message: "PC suspended into sleep mode."
        });
      });
    });
  }
};
