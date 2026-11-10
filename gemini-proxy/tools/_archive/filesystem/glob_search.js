const fs = require("fs");
const path = require("path");

function walkDir(dir, maxDepth, currentDepth = 0) {
  let results = [];
  if (currentDepth > maxDepth) return results;

  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      // Ignore huge build / vcs folders by default
      if (item.name === "node_modules" || item.name === ".git" || item.name === ".venv") {
        continue;
      }

      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push({ path: fullPath, is_directory: true });
        results = results.concat(walkDir(fullPath, maxDepth, currentDepth + 1));
      } else {
        results.push({ path: fullPath, is_directory: false });
      }
    }
  } catch (e) {
    // skip unreadable directories
  }
  return results;
}

function matchesPattern(filePath, pattern) {
  // Convert basic glob pattern (e.g. *.js, **/*.cpp, test*) to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/\\\\]*")
    .replace(/\?/g, ".");
  const re = new RegExp(`^${escaped}$`, "i");
  return re.test(path.basename(filePath)) || re.test(filePath.replace(/\\/g, "/"));
}

module.exports = {
  declaration: {
    name: "glob_search",
    description: "Searches for files matching a filename pattern or extension within a directory.",
    parameters: {
      type: "OBJECT",
      properties: {
        directory: {
          type: "STRING",
          description: "Starting directory path."
        },
        pattern: {
          type: "STRING",
          description: "Filename or glob pattern (e.g. '*.js', '*.cpp', 'config*')."
        },
        max_depth: {
          type: "INTEGER",
          description: "Maximum directory recursion depth (default: 4)."
        },
        limit: {
          type: "INTEGER",
          description: "Maximum matches to return (default: 50)."
        }
      },
      required: ["directory", "pattern"]
    }
  },

  async execute(args) {
    const dir = args?.directory;
    const pattern = args?.pattern;

    if (!dir || typeof dir !== "string") {
      return { success: false, error: "Missing or invalid 'directory'." };
    }
    if (!pattern || typeof pattern !== "string") {
      return { success: false, error: "Missing or invalid 'pattern'." };
    }

    const maxDepth = Math.min(Math.max(parseInt(args?.max_depth, 10) || 4, 1), 10);
    const limit = Math.min(Math.max(parseInt(args?.limit, 10) || 50, 1), 200);

    try {
      const resolved = path.resolve(dir);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: `Directory not found: ${resolved}` };
      }

      const allEntries = walkDir(resolved, maxDepth);
      const matches = [];

      for (const entry of allEntries) {
        if (!entry.is_directory && matchesPattern(entry.path, pattern)) {
          matches.push(entry.path);
          if (matches.length >= limit) break;
        }
      }

      return {
        success: true,
        directory: resolved,
        pattern,
        match_count: matches.length,
        matches
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
