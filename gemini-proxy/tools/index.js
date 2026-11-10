const path = require("path");

// ─── Universal Super-Primitives ─────────────────────────────────────────────
const interactUi = require("../core/interact_ui");
const executeSystemScript = require("../core/execute_system_script");

// ─── Research & Extended Autonomous Capabilities ────────────────────────────
const webSearch = require("./web/web_search");
const webFetch = require("./web/web_fetch");
const delegateAutonomousTask = require("./system/delegate_autonomous_task");
const callMcpTool = require("./system/call_mcp_tool");
const manageMcpServer = require("./system/manage_mcp_server");

// ─── Primary Tools Exposed to Gemini Live ───────────────────────────────────
// Minimalist, high-performance universal suite (low token latency, zero confusion)
const TOOLS = [
  interactUi,
  executeSystemScript,
  webSearch,
  webFetch,
  delegateAutonomousTask,
  callMcpTool,
  manageMcpServer
];

// ─── Map Registration & Full Backward-Compatible Aliases ─────────────────────
const toolMap = new Map();
for (const tool of TOOLS) {
  if (tool && tool.declaration && tool.declaration.name) {
    toolMap.set(tool.declaration.name, tool);
  }
}

// 1. UI Automation Aliases -> routed to interactUi
toolMap.set("execute_gui_task", interactUi);
toolMap.set("gui_task", interactUi);
toolMap.set("automate_gui", interactUi);
toolMap.set("fill_form", interactUi);
toolMap.set("ui_automation", interactUi);
toolMap.set("interact_with_ui", interactUi);
toolMap.set("click_button", interactUi);
toolMap.set("mouse_control", interactUi);
toolMap.set("mouse_click", interactUi);
toolMap.set("type_keyboard", {
  declaration: { name: "type_keyboard" },
  execute: async (args) => interactUi.execute({ action: "set_text", value: args.text })
});
toolMap.set("manage_window", {
  declaration: { name: "manage_window" },
  execute: async (args) => interactUi.execute({ action: "focus_window", app_name: args.title })
});

// 2. System Execution & Shell Aliases -> routed to executeSystemScript
toolMap.set("run_shell_command", {
  declaration: { name: "run_shell_command" },
  execute: async (args) => executeSystemScript.execute({ script: args.command, timeout_ms: args.timeout_ms })
});
toolMap.set("run_powershell_command", {
  declaration: { name: "run_powershell_command" },
  execute: async (args) => executeSystemScript.execute({ script: args.command, timeout_ms: args.timeout_ms })
});
toolMap.set("run_powershell", {
  declaration: { name: "run_powershell" },
  execute: async (args) => executeSystemScript.execute({ script: args.command, timeout_ms: args.timeout_ms })
});
toolMap.set("open_application", {
  declaration: { name: "open_application" },
  execute: async (args) => executeSystemScript.execute({ script: `Start-Process "${args.target}"` })
});
toolMap.set("system_stats", {
  declaration: { name: "system_stats" },
  execute: async () => executeSystemScript.execute({
    script: `
      $cpu = (Get-CimInstance Win32_Processor).LoadPercentage
      $os = Get-CimInstance Win32_OperatingSystem
      $freeRam = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
      $totalRam = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
      [PSCustomObject]@{ CPU_Percent = $cpu; Free_RAM_GB = $freeRam; Total_RAM_GB = $totalRam } | ConvertTo-Json
    `
  })
});
toolMap.set("get_pc_hardware_status", toolMap.get("system_stats"));
toolMap.set("get_pc_status", toolMap.get("system_stats"));
toolMap.set("volume_control", {
  declaration: { name: "volume_control" },
  execute: async (args) => executeSystemScript.execute({
    script: `
      Add-Type -AssemblyName System.Windows.Forms
      if ("${args.action}" -eq "mute") { [System.Windows.Forms.SendKeys]::SendWait([char]173) }
      elseif ("${args.action}" -eq "up") { [System.Windows.Forms.SendKeys]::SendWait([char]175) }
      elseif ("${args.action}" -eq "down") { [System.Windows.Forms.SendKeys]::SendWait([char]174) }
    `
  })
});
toolMap.set("set_volume", toolMap.get("volume_control"));
toolMap.set("lock_workstation", {
  declaration: { name: "lock_workstation" },
  execute: async () => executeSystemScript.execute({ script: "rundll32.exe user32.dll,LockWorkStation" })
});
toolMap.set("delegate_task", delegateAutonomousTask);
toolMap.set("background_task", delegateAutonomousTask);

/**
 * Returns function declarations array formatted for Google GenAI / Gemini SDK
 */
function getDeclarations() {
  return [
    {
      functionDeclarations: TOOLS.map((t) => t.declaration)
    }
  ];
}

/**
 * Returns summary list of all available tools
 */
function listTools() {
  return TOOLS.map((t) => ({
    name: t.declaration.name,
    description: t.declaration.description,
    parameters: t.declaration.parameters || {}
  }));
}

/**
 * Dispatches and executes a tool by name with arguments
 */
async function executeTool(name, args = {}) {
  const tool = toolMap.get(name);
  if (!tool) {
    return {
      success: false,
      tool_name: name,
      duration_ms: 0,
      error: `Unknown tool: '${name}'. Available tools: ${Array.from(toolMap.keys()).join(", ")}`
    };
  }

  const start = Date.now();
  try {
    const result = await tool.execute(args);
    const duration = Date.now() - start;
    return {
      tool_name: name,
      duration_ms: duration,
      ...result
    };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      success: false,
      tool_name: name,
      duration_ms: duration,
      error: err?.message || String(err)
    };
  }
}

module.exports = {
  getDeclarations,
  listTools,
  executeTool,
  toolMap
};
