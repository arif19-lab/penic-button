const mcpManager = require("../../mcp/McpManager");

module.exports = {
  declaration: {
    name: "call_mcp_tool",
    description: "Invokes an extensible tool from any connected Model Context Protocol (MCP) server. Pass 'tool_name' (e.g. 'memory__search_nodes', 'memory__read_graph', 'sequential_thinking__sequentialthinking', etc.) and key-value 'arguments'.",
    parameters: {
      type: "OBJECT",
      properties: {
        tool_name: {
          type: "STRING",
          description: "Name of the MCP tool to invoke."
        },
        arguments: {
          type: "OBJECT",
          description: "Key-value arguments object required by the target MCP tool."
        }
      },
      required: ["tool_name"]
    }
  },

  async execute(args) {
    const toolName = (args?.tool_name || "").trim();
    let toolArgs = args?.arguments || {};

    if (!toolName) {
      return {
        success: false,
        error: "Missing required parameter 'tool_name'."
      };
    }

    // 1. Unnest double-wrapped arguments: e.g. { arguments: { ... } }
    while (toolArgs && typeof toolArgs === "object" && toolArgs.arguments && Object.keys(toolArgs).length === 1) {
      toolArgs = toolArgs.arguments;
    }

    // 2. Allow top-level args fallback if LLM omitted 'arguments' wrapper
    if ((!toolArgs || Object.keys(toolArgs).length === 0) && args) {
      const copy = { ...args };
      delete copy.tool_name;
      delete copy.arguments;
      if (Object.keys(copy).length > 0) {
        toolArgs = copy;
      }
    }

    // 3. Dynamic Universal Schema Adapter (Generic for ANY MCP Tool)
    // Inspects registered MCP tool's JSON schema and dynamically aligns arguments
    const allRegisteredTools = mcpManager.listTools();
    const targetTool = allRegisteredTools.find((t) => t.name === toolName || t.originalName === toolName);

    if (targetTool && targetTool.inputSchema && targetTool.inputSchema.properties) {
      const schemaProps = targetTool.inputSchema.properties;
      const normalizedArgs = { ...toolArgs };

      for (const [propName, propDef] of Object.entries(schemaProps)) {
        // Handle array wrapping if LLM passed single object/string instead of array
        if (propDef.type === "array" && normalizedArgs[propName] && !Array.isArray(normalizedArgs[propName])) {
          normalizedArgs[propName] = [normalizedArgs[propName]];
        }

        // Fuzzy key alignment: match aliases (e.g. type -> entityType, query -> q, content -> contents)
        if (normalizedArgs[propName] === undefined) {
          const lowerProp = propName.toLowerCase();
          for (const key of Object.keys(normalizedArgs)) {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey === lowerProp ||
              lowerKey.includes(lowerProp) ||
              lowerProp.includes(lowerKey) ||
              (lowerProp === "entitytype" && lowerKey === "type") ||
              (lowerProp === "contents" && (lowerKey === "content" || lowerKey === "observations"))
            ) {
              normalizedArgs[propName] = normalizedArgs[key];
              break;
            }
          }
        }
      }
      toolArgs = normalizedArgs;
    }

    try {
      let result = await mcpManager.callTool(toolName, toolArgs);

      // Generic Empty-Result Resilience: If any search/query returns empty, try fallback read
      const text = result?.content?.[0]?.text || "";
      const isEmpty = text.includes('"entities": []') || (result?.structuredContent?.entities && result.structuredContent.entities.length === 0);
      if (isEmpty && (toolName.includes("search") || toolName.includes("query"))) {
        const baseName = toolName.split("__")[0];
        const readTool = allRegisteredTools.find((t) => t.name === `${baseName}__read_graph` || t.name === `${baseName}__list` || t.name === `${baseName}__get_all`);
        if (readTool) {
          try {
            const fallbackRes = await mcpManager.callTool(readTool.name, {});
            result = fallbackRes;
          } catch (fbErr) {}
        }
      }

      return {
        success: true,
        tool_name: toolName,
        result
      };
    } catch (err) {
      return {
        success: false,
        tool_name: toolName,
        error: err?.message || String(err)
      };
    }
  }
};
