const os = require("os");
const { exec } = require("child_process");

module.exports = {
  declaration: {
    name: "system_stats",
    description: "Returns Windows host system statistics including CPU usage, RAM utilization, storage free space, and uptime.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },

  async execute() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const uptimeSec = Math.round(os.uptime());

    // Query disk space and battery via PowerShell
    const psScript = `
      $disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select-Object DeviceID, @{N='SizeGB';E={[math]::Round($_.Size/1GB,1)}}, @{N='FreeGB';E={[math]::Round($_.FreeSpace/1GB,1)}}
      $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
      [PSCustomObject]@{ Disks = $disks; CpuLoad = $cpu } | ConvertTo-Json -Compress
    `;

    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "${psScript.replace(/\n/g, ' ')}"`, { timeout: 10000, windowsHide: true }, (err, stdout) => {
        let psData = { Disks: [], CpuLoad: null };
        try {
          if (stdout) psData = JSON.parse(stdout);
        } catch (e) {}

        resolve({
          success: true,
          platform: "win32",
          hostname: os.hostname(),
          uptime_hours: Math.round((uptimeSec / 3600) * 10) / 10,
          cpu: {
            model: cpus[0]?.model || "Unknown",
            cores: cpus.length,
            load_percentage: psData.CpuLoad != null ? psData.CpuLoad : 0
          },
          memory: {
            total_gb: Math.round((totalMem / (1024 ** 3)) * 10) / 10,
            used_gb: Math.round((usedMem / (1024 ** 3)) * 10) / 10,
            free_gb: Math.round((freeMem / (1024 ** 3)) * 10) / 10,
            percent_used: memPercent
          },
          disks: psData.Disks || []
        });
      });
    });
  }
};
