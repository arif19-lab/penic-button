const { exec } = require("child_process");
const path = require("path");
const mcpManager = require("../../mcp/McpManager");

module.exports = {
  declaration: {
    name: "manage_mcp_server",
    description: "Autonomously installs, connects, lists, or removes Model Context Protocol (MCP) servers live on demand without restarting. Allows the AI to instantly acquire any capability from the global MCP ecosystem (e.g. SQLite, GitHub, Docker, Playwright, Filesystem).",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action: 'install' (installs npm package and connects), 'connect' (connects an existing command), 'list' (lists connected servers and tools), or 'remove'."
        },
        name: {
          type: "STRING",
          description: "Unique name for this MCP server (e.g. 'sqlite', 'github', 'filesystem', 'playwright')."
        },
        package: {
          type: "STRING",
          description: "NPM package name (e.g. '@modelcontextprotocol/server-sqlite', '@modelcontextprotocol/server-filesystem') or executable command."
        },
        args: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Optional command-line arguments to pass to the MCP server."
        },
        env: {
          type: "OBJECT",
          description: "Optional environment variables needed by the MCP server (e.g. API tokens, paths)."
        }
      },
      required: ["action"]
    }
  },

  async execute(args) {
    const action = (args?.action || "list").toLowerCase().trim();
    const serverName = (args?.name || "").trim().toLowerCase();

    if (action === "list") {
      const connected = mcpManager.getConnectedServers();
      const allTools = mcpManager.listTools();
      return {
        success: true,
        action: "list",
        connected_servers_count: connected.length,
        connected_servers: connected,
        total_mcp_tools: allTools.length,
        tools: allTools.map((t) => ({ name: t.name, description: t.description }))
      };
    }

    if (action === "remove") {
      if (!serverName) {
        return { success: false, error: "Missing required parameter 'name' for remove action." };
      }
      const res = await mcpManager.removeServer(serverName);
      return {
        success: true,
        action: "remove",
        server: serverName,
        message: `MCP server '${serverName}' removed successfully.`
      };
    }

    if (action === "connect" || action === "install") {
      if (!serverName) {
        return { success: false, error: "Missing required parameter 'name'." };
      }

      const pkgOrCmd = (args?.package || args?.command || "").trim();
      if (!pkgOrCmd) {
        return { success: false, error: "Missing required parameter 'package' (e.g. '@modelcontextprotocol/server-sqlite')." };
      }

      const proxyRoot = path.join(__dirname, "..", "..");

      // If action is install and it looks like an npm package, install it first silently
      if (action === "install" && (pkgOrCmd.includes("/") || pkgOrCmd.startsWith("@") || pkgOrCmd.includes("server-"))) {
        console.log(`[MCP Auto-Provisioner] Installing package '${pkgOrCmd}' into ${proxyRoot}...`);
        await new Promise((resolve) => {
          exec(`npm install ${pkgOrCmd} --save`, { cwd: proxyRoot, windowsHide: true }, (err, stdout, stderr) => {
            if (err) {
              console.warn(`[MCP Auto-Provisioner] Notice during npm install: ${err.message}`);
            }
            resolve();
          });
        });
      }

      // Configure server: if it's an npm package, run via node or npx
      let srvConfig = null;
      if (pkgOrCmd.startsWith("@") || pkgOrCmd.includes("server-")) {
        // Run via npx or node
        srvConfig = {
          command: "npx",
          args: ["-y", pkgOrCmd, ...(args?.args || [])],
          env: args?.env || {}
        };
      } else {
        srvConfig = {
          command: pkgOrCmd,
          args: args?.args || [],
          env: args?.env || {}
        };
      }

      try {
        const connectRes = await mcpManager.connectServer(serverName, srvConfig, true);
        return {
          success: true,
          action,
          server: serverName,
          tool_count: connectRes.toolsCount,
          new_tools: connectRes.tools,
          message: `Autonomous MCP server '${serverName}' hot-plugged successfully. You can now invoke its tools using call_mcp_tool.`
        };
      } catch (connErr) {
        return {
          success: false,
          server: serverName,
          error: `Failed to hot-plug MCP server '${serverName}': ${connErr.message}`
        };
      }
    }

    return {
      success: false,
      error: `Unknown action '${action}'. Use 'install', 'connect', 'list', or 'remove'.`
    };
  }
};
