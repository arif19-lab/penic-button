const { execFile } = require("child_process");
const path = require("path");

const SCRIPT_PATH = path.join(__dirname, "mouse_control.ps1");

module.exports = {
  declaration: {
    name: "mouse_control",
    description: "Controls the Windows mouse cursor with native Win32 precision: click, double_click, right_click, middle_click, move, drag, scroll, or query current cursor position and screen dimensions.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Mouse action: 'click', 'double_click', 'right_click', 'middle_click', 'move', 'drag', 'scroll', or 'get_position'."
        },
        x: {
          type: "INTEGER",
          description: "Target X screen coordinate in pixels (optional; defaults to current cursor X)."
        },
        y: {
          type: "INTEGER",
          description: "Target Y screen coordinate in pixels (optional; defaults to current cursor Y)."
        },
        delta: {
          type: "INTEGER",
          description: "Scroll wheel delta (e.g. 120 to scroll up, -120 to scroll down). Required only for 'scroll'."
        }
      },
      required: ["action"]
    }
  },

  async execute(args = {}) {
    const action = (args.action || "get_position").toLowerCase().trim();
    const x = args.x !== undefined && args.x !== null ? Math.round(Number(args.x)) : -1;
    const y = args.y !== undefined && args.y !== null ? Math.round(Number(args.y)) : -1;
    const delta = args.delta !== undefined && args.delta !== null ? Math.round(Number(args.delta)) : 0;

    const psArgs = [
      "-NoProfile",
      "-NonInteractive",
      "-WindowStyle",
      "Hidden",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      SCRIPT_PATH,
      "-Action",
      action,
      "-X",
      String(x),
      "-Y",
      String(y),
      "-Delta",
      String(delta)
    ];

    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        psArgs,
        { timeout: 8000, windowsHide: true },
        (err, stdout, stderr) => {
          if (err) {
            return resolve({ success: false, action, error: stderr?.trim() || err.message });
          }

          try {
            const res = JSON.parse((stdout || "").trim());
            resolve({
              success: true,
              action: res.Action,
              cursor_x: res.CursorX,
              cursor_y: res.CursorY,
              screen_width: res.ScreenWidth,
              screen_height: res.ScreenHeight
            });
          } catch (pe) {
            resolve({
              success: true,
              action,
              raw_output: (stdout || "").trim()
            });
          }
        }
      );
    });
  }
};
