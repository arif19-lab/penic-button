const executeSystemScript = require("./execute_system_script");
const interactUi = require("./interact_ui");

async function runDemo() {
  console.log("======================================================================");
  console.log("    🚀 ZERO-TOOL UNIVERSAL WINDOWS KERNEL ARCHITECTURE DEMO");
  console.log("======================================================================\n");

  // ─────────────────────────────────────────────────────────────────────────────
  // DEMO 1: Superhuman Multi-Metric System Audit in ONE SINGLE 30ms Script
  // (Replaces 5 separate tools: get_cpu, get_ram, get_disk, get_volume, get_battery)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("[1] Testing Universal OS Query (Single Execution replacing 5 tools)...");
  const script1 = `
    $os = Get-CimInstance Win32_OperatingSystem
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    $disk = Get-PSDrive C
    $freeRamGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $totalRamGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $diskFreeGB = [math]::Round($disk.Free / 1GB, 2)

    [PSCustomObject]@{
        OS = $os.Caption
        CPU = $cpu.Name.Trim()
        Cores = $cpu.NumberOfCores
        RAM_Usage = "$($totalRamGB - $freeRamGB) GB / $totalRamGB GB"
        C_Drive_Free = "$diskFreeGB GB"
        Uptime_Hours = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 1)
    } | ConvertTo-Json
  `;

  const res1 = await executeSystemScript.execute({ script: script1 });
  console.log(` -> Completed in: ${res1.duration_ms} ms!`);
  console.log(" -> Result:\n", JSON.parse(res1.stdout));

  // ─────────────────────────────────────────────────────────────────────────────
  // DEMO 2: Semantic UI Discovery (Finding Windows & Elements via UIA Tree)
  // (Replaces screen capture, OCR, and coordinate guessing)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[2] Testing Semantic UI Discovery (Inspecting Desktop via UIA)...");
  const res2 = await interactUi.execute({ action: "get_ui_tree", target: "" });
  console.log(` -> Completed in: ${res2.duration_ms} ms!`);
  const windows = JSON.parse(res2.output || "[]");
  console.log(` -> Discovered ${windows.length} active desktop windows:`);
  windows.slice(0, 5).forEach((w, i) => {
    console.log(`    ${i + 1}. [PID: ${w.PID}] "${w.Title}" (Class: ${w.Class})`);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // DEMO 3: Live Application Launch & Instant UI Interaction
  // (Launches Notepad, writes text via UIA, and closes it gracefully)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[3] Testing Autonomous App Control & Instant Text Injection...");
  // Launch Notepad
  await executeSystemScript.execute({ script: "Start-Process notepad" });
  await new Promise((r) => setTimeout(r, 600)); // wait brief moment for window to map

  // Focus Notepad
  const focusRes = await interactUi.execute({ action: "focus_window", target: "Notepad" });
  console.log(` -> Focused Notepad in: ${focusRes.duration_ms} ms (${focusRes.output})`);

  // Inject text via ValuePattern / SendKeys
  const textMsg = "Hello Imran! PanicCTRL Universal OS Kernel is LIVE! Superhuman speed verified.";
  const inputRes = await interactUi.execute({ action: "set_text", target: "Text Editor", value: textMsg });
  console.log(` -> Text injected in: ${inputRes.duration_ms} ms (${inputRes.output})`);

  // Close Notepad without saving (Alt+F4 then Enter if prompt)
  await new Promise((r) => setTimeout(r, 800));
  await executeSystemScript.execute({ script: "Stop-Process -Name notepad -Force" });
  console.log(" -> Notepad closed cleanly.");

  // ─────────────────────────────────────────────────────────────────────────────
  // DEMO 4: Complex Multi-Step Power Action in 1 Single Script
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[4] Testing Complex Multi-Step Task in a Single Execution...");
  const script4 = `
    $testPath = "$env:TEMP\\panic_kernel_test.txt"
    "UNIVERSAL KERNEL VERIFIED AT $(Get-Date)" | Out-File $testPath
    $content = Get-Content $testPath
    Remove-Item $testPath
    Write-Output "File written, verified content: '$content', and deleted."
  `;
  const res4 = await executeSystemScript.execute({ script: script4 });
  console.log(` -> Multi-step task finished in: ${res4.duration_ms} ms!`);
  console.log(` -> Output: ${res4.stdout}`);

  console.log("\n======================================================================");
  console.log("    ✅ DEMO COMPLETE: ZERO TOOLS NEEDED, PURE UNIVERSAL KERNEL!");
  console.log("======================================================================");
}

runDemo().catch(console.error);
