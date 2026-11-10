const fs = require("fs");
const path = require("path");

module.exports = {
  declaration: {
    name: "write_file",
    description: "Writes content to a file, automatically creating any missing parent directories.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: {
          type: "STRING",
          description: "Target file path."
        },
        content: {
          type: "STRING",
          description: "Text content to write into the file."
        },
        append: {
          type: "BOOLEAN",
          description: "If true, appends content to existing file instead of overwriting (default: false)."
        }
      },
      required: ["file_path", "content"]
    }
  },

  async execute(args) {
    const filePath = args?.file_path;
    const content = args?.content;

    if (!filePath || typeof filePath !== "string") {
      return { success: false, error: "Missing or invalid 'file_path'." };
    }
    if (typeof content !== "string") {
      return { success: false, error: "Missing or invalid 'content' string." };
    }

    try {
      const resolved = path.resolve(filePath);
      const dir = path.dirname(resolved);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (args?.append) {
        fs.appendFileSync(resolved, content, "utf8");
      } else {
        fs.writeFileSync(resolved, content, "utf8");
      }

      const stat = fs.statSync(resolved);
      return {
        success: true,
        file_path: resolved,
        size_bytes: stat.size,
        mode: args?.append ? "appended" : "overwritten"
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
