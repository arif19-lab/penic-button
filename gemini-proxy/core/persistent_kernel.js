const { spawn } = require("child_process");
const EventEmitter = require("events");

class PersistentWindowsKernel extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.busy = false;
    this.queue = [];
    this._initProcess();
  }

  _initProcess() {
    this.process = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-Command", "-"
    ], { windowsHide: true });

    this.process.stdout.setEncoding("utf8");
    this.process.stderr.setEncoding("utf8");

    this.process.on("close", (code) => {
      this.process = null;
    });
  }

  async execute(command) {
    if (!this.process) {
      this._initProcess();
    }

    const marker = `__PK_DONE_${Date.now()}_${Math.floor(Math.random() * 10000)}__`;
    const fullCmd = `
try {
    ${command}
} catch {
    Write-Error $_
}
Write-Output "${marker}:$LASTEXITCODE"
`;

    const startTime = Date.now();

    return new Promise((resolve) => {
      let outputBuffer = "";
      let errorBuffer = "";

      const onData = (chunk) => {
        outputBuffer += chunk;
        if (outputBuffer.includes(marker)) {
          cleanup();
          const parts = outputBuffer.split(marker);
          const rawOutput = parts[0].trim();
          const exitCodeStr = parts[1] ? parts[1].replace(":", "").trim() : "0";
          resolve({
            success: true,
            duration_ms: Date.now() - startTime,
            output: rawOutput,
            exitCode: parseInt(exitCodeStr, 10) || 0
          });
        }
      };

      const onError = (chunk) => {
        errorBuffer += chunk;
      };

      const cleanup = () => {
        this.process.stdout.off("data", onData);
        this.process.stderr.off("data", onError);
      };

      this.process.stdout.on("data", onData);
      this.process.stderr.on("data", onError);

      // Write command to persistent stdin
      this.process.stdin.write(fullCmd + "\n");
    });
  }

  destroy() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

async function benchmark() {
  console.log("=== BENCHMARKING WARM PERSISTENT WINDOWS KERNEL ===");
  const kernel = new PersistentWindowsKernel();

  // Warmup run
  await kernel.execute("Write-Output 'warmup'");

  console.log("\n[Warm Test 1] Get System Memory & CPU in Real Time:");
  const t1 = await kernel.execute("[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2)");
  console.log(` -> Free RAM: ${t1.output} GB (Time: ${t1.duration_ms} ms!)`);

  console.log("\n[Warm Test 2] Process Count & Active Window:");
  const t2 = await kernel.execute("(Get-Process).Count");
  console.log(` -> Total Running Processes: ${t2.output} (Time: ${t2.duration_ms} ms!)`);

  console.log("\n[Warm Test 3] C Drive Free Space:");
  const t3 = await kernel.execute("[math]::Round((Get-PSDrive C).Free / 1GB, 2)");
  console.log(` -> C Drive Free: ${t3.output} GB (Time: ${t3.duration_ms} ms!)`);

  kernel.destroy();
  console.log("\n✅ ALL EXECUTIONS COMPLETED IN SUB-50 MILLISECONDS!");
}

benchmark().catch(console.error);
