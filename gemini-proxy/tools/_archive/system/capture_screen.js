const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  declaration: {
    name: "capture_screen",
    description: "Captures a high-resolution screenshot of the Windows primary desktop display using native Win32/GDI without external tools. Can return file path and optional base64 image.",
    parameters: {
      type: "OBJECT",
      properties: {
        include_base64: {
          type: "BOOLEAN",
          description: "If true, returns the captured image as a base64 JPEG data URL for visual inspection or AI multimodal vision."
        }
      }
    }
  },

  async execute(args = {}) {
    const includeBase64 = args.include_base64 === true;

    // Zero-dependency native .NET screen grab
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $tempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "panic_screen_capture.jpg")
      $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
      $g.Dispose()
      $bmp.Dispose()
      [PSCustomObject]@{
        Width = $screen.Width
        Height = $screen.Height
        FilePath = $tempPath
      } | ConvertTo-Json -Compress
    `;

    // Encode script to avoid shell escaping issues
    const encoded = Buffer.from(psScript, "utf16le").toString("base64");

    return new Promise((resolve) => {
      exec(
        `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ${encoded}`,
        { timeout: 10000, windowsHide: true },
        async (err, stdout) => {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          let data = {};
          try {
            data = JSON.parse((stdout || "").trim());
          } catch (parseErr) {
            return resolve({
              success: false,
              error: `Failed to parse screen capture output: ${stdout || parseErr.message}`
            });
          }

          let base64Url = null;
          let fileSizeBytes = 0;
          if (data.FilePath && fs.existsSync(data.FilePath)) {
            try {
              const stat = await fs.promises.stat(data.FilePath);
              fileSizeBytes = stat.size;
              if (includeBase64) {
                const imgBuf = await fs.promises.readFile(data.FilePath);
                base64Url = `data:image/jpeg;base64,${imgBuf.toString("base64")}`;
              }
            } catch (readErr) {
              // Ignore base64 read failure, path is still valid
            }
          }

          resolve({
            success: true,
            width: data.Width,
            height: data.Height,
            aspect_ratio: `${data.Width}:${data.Height}`,
            file_path: data.FilePath,
            file_size_bytes: fileSizeBytes,
            image_base64: base64Url || undefined,
            timestamp: new Date().toISOString()
          });
        }
      );
    });
  }
};
