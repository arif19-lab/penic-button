const fs = require("fs");
const path = require("path");

module.exports = {
  declaration: {
    name: "replace_file_content",
    description: "Replaces target content with replacement content in an existing file.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: {
          type: "STRING",
          description: "Path to the file to modify."
        },
        target_content: {
          type: "STRING",
          description: "Exact text substring to find and replace."
        },
        replacement_content: {
          type: "STRING",
          description: "New text to substitute in place of target_content."
        },
        allow_multiple: {
          type: "BOOLEAN",
          description: "Whether to replace all occurrences or just the first match (default: false)."
        }
      },
      required: ["file_path", "target_content", "replacement_content"]
    }
  },

  async execute(args) {
    const filePath = args?.file_path;
    const target = args?.target_content;
    const replacement = args?.replacement_content;

    if (!filePath || typeof filePath !== "string") {
      return { success: false, error: "Missing or invalid 'file_path'." };
    }
    if (typeof target !== "string" || target.length === 0) {
      return { success: false, error: "Missing or empty 'target_content'." };
    }
    if (typeof replacement !== "string") {
      return { success: false, error: "Missing 'replacement_content'." };
    }

    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: `File not found: ${resolved}` };
      }

      let content = fs.readFileSync(resolved, "utf8");

      if (!content.includes(target)) {
        return { success: false, error: `Target content not found in ${resolved}` };
      }

      let replacementsCount = 0;
      if (args?.allow_multiple) {
        const parts = content.split(target);
        replacementsCount = parts.length - 1;
        content = parts.join(replacement);
      } else {
        content = content.replace(target, replacement);
        replacementsCount = 1;
      }

      fs.writeFileSync(resolved, content, "utf8");

      return {
        success: true,
        file_path: resolved,
        replacements_count: replacementsCount
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
