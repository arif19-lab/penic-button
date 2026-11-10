const fs = require("fs");
const path = require("path");

function walkFiles(dir, maxDepth, currentDepth = 0) {
  let files = [];
  if (currentDepth > maxDepth) return files;

  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === "node_modules" || item.name === ".git" || item.name === ".venv" || item.name === "build") {
        continue;
      }
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(walkFiles(fullPath, maxDepth, currentDepth + 1));
      } else {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

module.exports = {
  declaration: {
    name: "grep_search",
    description: "Searches for a text pattern or regular expression across files in a directory.",
    parameters: {
      type: "OBJECT",
      properties: {
        directory: {
          type: "STRING",
          description: "Target directory path to search within."
        },
        query: {
          type: "STRING",
          description: "Search string or regular expression."
        },
        case_sensitive: {
          type: "BOOLEAN",
          description: "Whether search is case-sensitive (default: false)."
        },
        file_extension: {
          type: "STRING",
          description: "Optional extension filter (e.g. '.js', '.cpp', '.json')."
        },
        max_matches: {
          type: "INTEGER",
          description: "Maximum matches to return (default: 50)."
        }
      },
      required: ["directory", "query"]
    }
  },

  async execute(args) {
    const dir = args?.directory;
    const query = args?.query;

    if (!dir || typeof dir !== "string") {
      return { success: false, error: "Missing or invalid 'directory'." };
    }
    if (!query || typeof query !== "string") {
      return { success: false, error: "Missing or invalid 'query'." };
    }

    const maxMatches = Math.min(Math.max(parseInt(args?.max_matches, 10) || 50, 1), 200);
    const extFilter = (args?.file_extension || "").toLowerCase();
    const caseSensitive = Boolean(args?.case_sensitive);

    try {
      const resolved = path.resolve(dir);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: `Directory not found: ${resolved}` };
      }

      const files = walkFiles(resolved, 4);
      const matches = [];
      const regex = new RegExp(query.replace(/[.+^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi");

      for (const file of files) {
        if (matches.length >= maxMatches) break;
        if (extFilter && !file.toLowerCase().endsWith(extFilter)) continue;

        // Skip huge binary files (> 5MB)
        try {
          const stat = fs.statSync(file);
          if (stat.size > 5 * 1024 * 1024) continue;

          const content = fs.readFileSync(file, "utf8");
          const lines = content.split(/\r?\n/);

          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              matches.push({
                file,
                line: i + 1,
                content: lines[i].trim()
              });
              if (matches.length >= maxMatches) break;
            }
          }
        } catch (e) {
          // skip unreadable file
        }
      }

      return {
        success: true,
        directory: resolved,
        query,
        match_count: matches.length,
        matches
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
