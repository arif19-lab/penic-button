const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "list_processes",
    description: "Lists currently running processes on the Windows PC with their PID, Process Name, Memory Usage, and CPU.",
    parameters: {
      type: "OBJECT",
      properties: {
        filter: {
          type: "STRING",
          description: "Optional name filter (e.g. 'chrome', 'python', 'node')."
        },
        limit: {
          type: "INTEGER",
          description: "Maximum number of processes to return (default: 30, max: 100)."
        }
      }
    }
  },

  async execute(args) {
    const limit = Math.min(Math.max(parseInt(args?.limit, 10) || 30, 1), 100);
    const filter = (args?.filter || "").trim().toLowerCase();

    const psScript = `Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 100 Id, ProcessName, @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64 / 1MB, 1)}}, @{Name='CPU_s';Expression={[math]::Round($_.CPU, 1)}} | ConvertTo-Json -Compress`;

    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "${psScript}"`, { timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ success: false, error: stderr || error.message });
        }

        try {
          let list = JSON.parse(stdout || "[]");
          if (!Array.isArray(list)) list = [list];

          if (filter) {
            list = list.filter((p) => (p.ProcessName || "").toLowerCase().includes(filter));
          }

          list = list.slice(0, limit);

          resolve({
            success: true,
            total_matches: list.length,
            processes: list.map((p) => ({
              pid: p.Id,
              name: p.ProcessName,
              memory_mb: p.MemoryMB,
              cpu_seconds: p.CPU_s
            }))
          });
        } catch (parseErr) {
          resolve({ success: false, error: "Failed to parse process output: " + parseErr.message });
        }
      });
    });
  }
};
