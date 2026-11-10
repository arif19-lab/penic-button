const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "shutdown_pc",
    description: "Safely shuts down the Windows computer.",
    parameters: {
      type: "OBJECT",
      properties: {
        force: {
          type: "BOOLEAN",
          description: "Force close open applications without warning (default: false)."
        }
      }
    }
  },

  async execute(args) {
    const forceFlag = args?.force ? "/f" : "";
    const command = `shutdown.exe /s /t 2 ${forceFlag}`;

    return new Promise((resolve) => {
      exec(command, { windowsHide: true }, (err) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }
        resolve({
          success: true,
          message: "System shutdown initiated."
        });
      });
    });
  }
};
