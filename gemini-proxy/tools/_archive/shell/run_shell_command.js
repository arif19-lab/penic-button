const { spawn } = require("child_process");

module.exports = {
  declaration: {
    name: "run_shell_command",
    description: "Executes a shell or PowerShell command on the Windows host PC with zero quote-escaping bugs using native UTF-16LE binary encoding. Returns stdout, stderr, and exitCode.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: {
          type: "STRING",
          description: "The command to execute (PowerShell or CMD syntax)."
        },
        timeout_ms: {
          type: "INTEGER",
          description: "Execution timeout in milliseconds (default: 30000)."
        }
      },
      required: ["command"]
    }
  },

  async execute(args) {
    const command = args?.command;
    if (!command || typeof command !== "string") {
      return { success: false, error: "Missing or invalid 'command' parameter." };
    }

    const timeout = typeof args.timeout_ms === "number" && args.timeout_ms > 0 ? args.timeout_ms : 30000;
    const start = Date.now();

    // Use UTF-16LE Base64 encoded command to eliminate all escaping and special character bugs
    const buffer = Buffer.from(command, "utf16le");
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
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
      }, timeout);

      child.stdout.on("data", (data) => { stdout += data.toString("utf8"); });
      child.stderr.on("data", (data) => { stderr += data.toString("utf8"); });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (killed) {
          return resolve({
            success: false,
            error: `Command timed out after ${timeout}ms`,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration_ms: Date.now() - start
          });
        }

        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration_ms: Date.now() - start,
          error: stderr.trim() || (code !== 0 ? `Process exited with code ${code}` : null)
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: err.message,
          duration_ms: Date.now() - start
        });
      });
    });
  }
};
