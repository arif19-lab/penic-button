const fs = require("fs");
const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

class McpManager {
  constructor() {
    this.clients = new Map();
    this.tools = [];
    this.initialized = false;
  }

  async init(configPath) {
    const targetPath = configPath || path.join(__dirname, "..", "mcp_servers.json");
    if (!fs.existsSync(targetPath)) {
      console.log("[MCP] No mcp_servers.json configuration found. Skipping MCP initialization.");
      return;
    }

    let config = {};
    try {
      config = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
    } catch (parseErr) {
      console.warn("[MCP] Warning: Failed to parse mcp_servers.json:", parseErr.message);
      return;
    }

    const servers = config.mcpServers || {};
    const serverKeys = Object.keys(servers);
    console.log(`[MCP] Discovering ${serverKeys.length} configured MCP server(s)...`);

    for (const name of serverKeys) {
      try {
        await this.connectServer(name, servers[name], false);
      } catch (err) {
        console.warn(`[MCP] Could not connect to MCP server '${name}':`, err.message);
      }
    }

    this.initialized = true;
  }

  async connectServer(name, srv, persist = true) {
    if (!name || !srv || !srv.command) {
      throw new Error("Invalid server configuration: 'name' and 'command' are required.");
    }

    // If already connected, safely close existing connection
    if (this.clients.has(name)) {
      try {
        await this.clients.get(name).close();
      } catch (e) {}
      this.clients.delete(name);
      this.tools = this.tools.filter((t) => t.serverName !== name);
    }

    let command = srv.command;
    if (process.platform === "win32" && command.toLowerCase() === "npx") {
      command = "npx.cmd";
    }

    const targetDir = path.join(__dirname, "..");
    const resolvedArgs = (srv.args || []).map((arg) => {
      if (typeof arg === "string" && arg.startsWith("./")) {
        return path.resolve(targetDir, arg);
      }
      return arg;
    });

    const transport = new StdioClientTransport({
      command,
      args: resolvedArgs,
      env: { ...process.env, ...(srv.env || {}) }
    });

    const client = new Client(
      { name: `panicctrl-${name}`, version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    await client.connect(transport);
    this.clients.set(name, client);

    const toolListRes = await client.listTools();
    const serverTools = toolListRes.tools || [];
    const registeredTools = [];
    for (const t of serverTools) {
      const toolDef = {
        name: `${name}__${t.name}`,
        originalName: t.name,
        serverName: name,
        description: t.description || `Tool provided by MCP server ${name}`,
        inputSchema: t.inputSchema || {}
      };
      this.tools.push(toolDef);
      registeredTools.push(toolDef.name);
    }

    console.log(`[MCP] Live connected '${name}' server with ${serverTools.length} tool(s).`);

    if (persist) {
      this._persistServer(name, srv);
    }

    return {
      success: true,
      serverName: name,
      toolsCount: serverTools.length,
      tools: registeredTools
    };
  }

  _persistServer(name, srv) {
    const configPaths = [
      path.join(__dirname, "..", "mcp_servers.json"),
      path.join(process.env.ProgramData || "C:\\ProgramData", "PanicButton", "gemini-proxy", "mcp_servers.json")
    ];

    for (const cp of configPaths) {
      try {
        let cur = { mcpServers: {} };
        if (fs.existsSync(cp)) {
          cur = JSON.parse(fs.readFileSync(cp, "utf8"));
          if (!cur.mcpServers) cur.mcpServers = {};
        }
        cur.mcpServers[name] = srv;
        fs.writeFileSync(cp, JSON.stringify(cur, null, 2), "utf8");
      } catch (err) {
        console.warn(`[MCP] Notice persisting server to ${cp}:`, err.message);
      }
    }
  }

  async removeServer(name) {
    if (this.clients.has(name)) {
      try {
        await this.clients.get(name).close();
      } catch (e) {}
      this.clients.delete(name);
      this.tools = this.tools.filter((t) => t.serverName !== name);
    }

    const configPaths = [
      path.join(__dirname, "..", "mcp_servers.json"),
      path.join(process.env.ProgramData || "C:\\ProgramData", "PanicButton", "gemini-proxy", "mcp_servers.json")
    ];

    for (const cp of configPaths) {
      try {
        if (fs.existsSync(cp)) {
          const cur = JSON.parse(fs.readFileSync(cp, "utf8"));
          if (cur.mcpServers && cur.mcpServers[name]) {
            delete cur.mcpServers[name];
            fs.writeFileSync(cp, JSON.stringify(cur, null, 2), "utf8");
          }
        }
      } catch (e) {}
    }

    return { success: true, removed: name };
  }

  listTools() {
    return this.tools;
  }

  getConnectedServers() {
    return Array.from(this.clients.keys());
  }

  async callTool(prefixedName, args = {}) {
    const found = this.tools.find((t) => t.name === prefixedName || t.originalName === prefixedName);
    if (!found) {
      throw new Error(`MCP tool '${prefixedName}' not found in active servers.`);
    }

    const client = this.clients.get(found.serverName);
    if (!client) {
      throw new Error(`MCP server '${found.serverName}' is not connected.`);
    }

    const result = await client.callTool({
      name: found.originalName,
      arguments: args
    });

    return result;
  }

  async closeAll() {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
      } catch (e) {}
    }
    this.clients.clear();
    this.tools = [];
    this.initialized = false;
  }
}

module.exports = new McpManager();
