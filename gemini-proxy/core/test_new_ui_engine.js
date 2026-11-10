const interactUi = require("./interact_ui");

async function run() {
  console.log("=== Testing Auto-Launch, Text Injection & Sequence in Node.js ===");

  // Test 1: set_text with empty target (auto-detects document area and auto-launches if needed)
  console.log("[1] Setting text in Notepad editor...");
  const textRes = await interactUi.execute({
    action: "set_text",
    app_name: "Notepad",
    value: "Hello Imran Sir! Direct text injection into Windows 11 Document area is WORKING!"
  });
  console.log("Result 1:", textRes);

  // Test 2: run_sequence
  console.log("\n[2] Executing run_sequence: Click File then Edit...");
  const seqRes = await interactUi.execute({
    action: "run_sequence",
    app_name: "Notepad",
    steps: [
      { action: "click", target: "File", delay_ms: 800 },
      { action: "click", target: "Edit", delay_ms: 800 }
    ]
  });
  console.log("Result 2:", seqRes);
}

run();
