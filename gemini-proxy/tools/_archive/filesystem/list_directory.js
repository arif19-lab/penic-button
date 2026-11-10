const fs = require("fs");
const path = require("path");

module.exports = {
  declaration: {
    name: "list_directory",
    description: "Lists all files and subdirectories in a directory with file sizes and modification dates.",
    parameters: {
      type: "OBJECT",
      properties: {
        directory_path: {
          type: "STRING",
          description: "Path to the directory to inspect."
        },
        max_entries: {
          type: "INTEGER",
          description: "Maximum entries to return (default: 100)."
        }
      },
      required: ["directory_path"]
    }
  },

  async execute(args) {
    const dirPath = args?.directory_path;
    if (!dirPath || typeof dirPath !== "string") {
      return { success: false, error: "Missing or invalid 'directory_path'." };
    }

    const maxEntries = Math.min(Math.max(parseInt(args?.max_entries, 10) || 100, 1), 500);

    try {
      const resolved = path.resolve(dirPath);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: `Directory not found: ${resolved}` };
      }

      const dirStat = fs.statSync(resolved);
      if (!dirStat.isDirectory()) {
        return { success: false, error: `Path is not a directory: ${resolved}` };
      }

      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        if (items.length >= maxEntries) break;

        const fullPath = path.join(resolved, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          items.push({
            name: entry.name,
            is_directory: entry.isDirectory(),
            size_bytes: entry.isDirectory() ? 0 : stat.size,
            modified_at: stat.mtime.toISOString()
          });
        } catch (e) {
          // If a file is locked or permission denied, still show its name
          items.push({
            name: entry.name,
            is_directory: entry.isDirectory(),
            error: e.message
          });
        }
      }

      return {
        success: true,
        directory: resolved,
        total_found: entries.length,
        returned_count: items.length,
        items
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
