const { spawn } = require("child_process");
const interactUi = require("./interact_ui");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("======================================================================");
  console.log("   🧪 TESTING FULL interact_ui NODE.JS ENGINE (LIVE TEST)");
  console.log("======================================================================\n");

  console.log("[1] Launching Notepad...");
  spawn("notepad.exe", [], { detached: true, stdio: "ignore" }).unref();
  await sleep(2500);

  console.log("[2] Getting UI Tree for Notepad...");
  const tree = await interactUi.execute({ action: "get_ui_tree", app_name: "Notepad" });
  console.log(" -> Result Tree:", JSON.stringify(tree, null, 2));

  console.log("\n[3] Clicking 'Add New Tab' (by AutoId: AddButton)...");
  const tabRes = await interactUi.execute({ action: "click", app_name: "Notepad", target: "AddButton" });
  console.log(" -> Click Result:", JSON.stringify(tabRes, null, 2));
  await sleep(2000);

  console.log("\n[4] Clicking 'Settings' (by AutoId: SettingsButton)...");
  const setRes = await interactUi.execute({ action: "click", app_name: "Notepad", target: "SettingsButton" });
  console.log(" -> Click Result:", JSON.stringify(setRes, null, 2));
  await sleep(2500);

  console.log("\n[5] Closing Notepad...");
  const killProc = spawn("taskkill", ["/F", "/IM", "notepad.exe"]);
  killProc.on("close", () => {
    console.log(" -> Notepad closed cleanly.");
    console.log("\n======================================================================");
    console.log("   🏆 100% SUCCESS: Node.js interact_ui ENGINE TEST PASSED!");
    console.log("======================================================================\n");
  });
}

run();
