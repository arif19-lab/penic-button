const { execFile, exec } = require("child_process");

module.exports = {
  declaration: {
    name: "manage_package",
    description: "Searches, installs, uninstalls, or lists software packages silently using Windows native package managers (winget, npm, or pip) with zero manual prompts.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action to perform: 'search', 'install', 'uninstall', or 'list'."
        },
        package_name: {
          type: "STRING",
          description: "Name, search term, or Package ID (e.g. '7zip.7zip', 'Git.Git', 'VideoLAN.VLC', 'Notepad++.Notepad++', 'express', 'requests')."
        },
        manager: {
          type: "STRING",
          description: "Package manager to use: 'winget' (Windows native, default), 'npm', or 'pip'."
        }
      },
      required: ["action", "package_name"]
    }
  },

  async execute(args = {}) {
    const action = (args.action || "search").toLowerCase().trim();
    const pkg = (args.package_name || "").trim();
    const manager = (args.manager || "winget").toLowerCase().trim();

    if (!pkg) {
      return { success: false, error: "Missing required 'package_name' parameter." };
    }

    if (manager === "winget") {
      let wingetArgs = [];
      if (action === "search") {
        wingetArgs = ["search", pkg, "--accept-source-agreements"];
      } else if (action === "install") {
        wingetArgs = [
          "install",
          "--id",
          pkg,
          "--silent",
          "--accept-source-agreements",
          "--accept-package-agreements",
          "--disable-interactivity"
        ];
      } else if (action === "uninstall") {
        wingetArgs = ["uninstall", "--id", pkg, "--silent", "--disable-interactivity"];
      } else if (action === "list") {
        wingetArgs = ["list", pkg, "--accept-source-agreements"];
      } else {
        return { success: false, error: `Unsupported action '${action}' for winget.` };
      }

      return new Promise((resolve) => {
        execFile(
          "winget.exe",
          wingetArgs,
          { timeout: 120000, windowsHide: true },
          (err, stdout, stderr) => {
            const out = (stdout || "").trim();
            const errOut = (stderr || "").trim();
            if (err && !out) {
              return resolve({
                success: false,
                manager: "winget",
                action,
                package: pkg,
                error: errOut || err.message
              });
            }
            resolve({
              success: true,
              manager: "winget",
              action,
              package: pkg,
              output: out.substring(0, 4000)
            });
          }
        );
      });
    }

    if (manager === "npm") {
      let npmCmd = "";
      if (action === "install") {
        npmCmd = `npm install -g ${pkg}`;
      } else if (action === "uninstall") {
        npmCmd = `npm uninstall -g ${pkg}`;
      } else if (action === "search") {
        npmCmd = `npm search ${pkg} --json`;
      } else {
        npmCmd = `npm list -g ${pkg}`;
      }

      return new Promise((resolve) => {
        exec(npmCmd, { timeout: 60000, windowsHide: true }, (err, stdout, stderr) => {
          if (err && !stdout) {
            return resolve({
              success: false,
              manager: "npm",
              action,
              package: pkg,
              error: (stderr || err.message).trim()
            });
          }
          resolve({
            success: true,
            manager: "npm",
            action,
            package: pkg,
            output: (stdout || "").trim().substring(0, 4000)
          });
        });
      });
    }

    if (manager === "pip") {
      let pipCmd = "";
      if (action === "install") {
        pipCmd = `python -m pip install ${pkg}`;
      } else if (action === "uninstall") {
        pipCmd = `python -m pip uninstall -y ${pkg}`;
      } else if (action === "list" || action === "search") {
        pipCmd = `python -m pip show ${pkg}`;
      } else {
        pipCmd = `python -m pip list`;
      }

      return new Promise((resolve) => {
        exec(pipCmd, { timeout: 60000, windowsHide: true }, (err, stdout, stderr) => {
          if (err && !stdout) {
            return resolve({
              success: false,
              manager: "pip",
              action,
              package: pkg,
              error: (stderr || err.message).trim()
            });
          }
          resolve({
            success: true,
            manager: "pip",
            action,
            package: pkg,
            output: (stdout || "").trim().substring(0, 4000)
          });
        });
      });
    }

    return { success: false, error: `Unknown manager '${manager}'. Use 'winget', 'npm', or 'pip'.` };
  }
};
