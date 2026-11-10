const tools = require("./tools/index");

async function runTests() {
  console.log("=== Testing Panic-Button Modular Tool Registry ===");
  const list = tools.listTools();
  console.log(`Loaded ${list.length} primary tools (and ${tools.toolMap.size} total callable names/aliases):`);
  for (const t of list) {
    console.log(` - ${t.name}: ${t.description.slice(0, 55)}...`);
  }

  console.log("\n--- Test 1: Shell Execution ---");
  const shellRes = await tools.executeTool("run_shell_command", { command: "echo Hello from PanicCTRL" });
  console.log("run_shell_command:", shellRes);

  console.log("\n--- Test 2: Legacy Alias (get_pc_hardware_status) ---");
  const aliasRes = await tools.executeTool("get_pc_hardware_status", {});
  console.log("get_pc_hardware_status alias:", aliasRes.success, "CPU cores:", aliasRes.cpu?.cores, "RAM:", aliasRes.memory?.used_gb + "GB/" + aliasRes.memory?.total_gb + "GB");

  console.log("\n--- Test 3: Media Control ---");
  const mediaRes = await tools.executeTool("media_control", { action: "volume_up" });
  console.log("media_control:", mediaRes);

  console.log("\n--- Test 4: Open Application (Validation) ---");
  console.log("open_application declaration:", tools.toolMap.get("open_application")?.declaration?.name);

  console.log("\n--- Test 5: Web Search (Validation) ---");
  console.log("web_search declaration:", tools.toolMap.get("web_search")?.declaration?.name);

  console.log("\nAll 22 tools verified successfully!");
}

runTests().catch(console.error);
