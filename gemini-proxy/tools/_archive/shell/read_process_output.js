const fs = require("fs");
const path = require("path");

module.exports = {
  declaration: {
    name: "read_process_output",
    description: "Reads the recent stdout/stderr output lines from a background process or log file.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: {
          type: "STRING",
          description: "Absolute or relative path to the log file to read."
        },
        tail_lines: {
          type: "INTEGER",
          description: "Number of lines to read from the end of the file (default: 50)."
        }
      },
      required: ["file_path"]
    }
  },

  async execute(args) {
    const filePath = args?.file_path;
    if (!filePath || typeof filePath !== "string") {
      return { success: false, error: "Missing or invalid 'file_path'." };
    }

    const tailLines = Math.max(parseInt(args?.tail_lines, 10) || 50, 1);

    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: `File not found: ${resolved}` };
      }

      const content = fs.readFileSync(resolved, "utf8");
      const lines = content.split(/\r?\n/);
      const slice = lines.slice(-tailLines);

      return {
        success: true,
        file_path: resolved,
        total_lines: lines.length,
        returned_lines: slice.length,
        output: slice.join("\n")
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
