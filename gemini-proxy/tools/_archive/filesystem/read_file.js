const fs = require("fs");
const path = require("path");

module.exports = {
  declaration: {
    name: "read_file",
    description: "Reads the content of a file on the Windows PC with optional line slicing.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: {
          type: "STRING",
          description: "Path to the file to read."
        },
        start_line: {
          type: "INTEGER",
          description: "Optional 1-based start line."
        },
        end_line: {
          type: "INTEGER",
          description: "Optional 1-based end line."
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

    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: `File does not exist: ${resolved}` };
      }

      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        return { success: false, error: `Target path is a directory, not a file: ${resolved}` };
      }

      // Read text content
      const content = fs.readFileSync(resolved, "utf8");
      const lines = content.split(/\r?\n/);
      const totalLines = lines.length;

      let start = parseInt(args?.start_line, 10);
      let end = parseInt(args?.end_line, 10);

      if (!start || start < 1) start = 1;
      if (!end || end > totalLines) end = totalLines;
      if (end < start) end = start;

      const selected = lines.slice(start - 1, end).join("\n");

      return {
        success: true,
        file_path: resolved,
        size_bytes: stat.size,
        total_lines: totalLines,
        start_line: start,
        end_line: end,
        content: selected
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
