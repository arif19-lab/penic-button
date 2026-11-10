const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "lock_workstation",
    description: "Instantly locks the Windows PC screen for security and privacy.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },

  async execute() {
    return new Promise((resolve) => {
      // Invoke user32.dll LockWorkStation
      exec("rundll32.exe user32.dll,LockWorkStation", { windowsHide: true }, (err) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({
          success: true,
          message: "Workstation locked successfully."
        });
      });
    });
  }
};
