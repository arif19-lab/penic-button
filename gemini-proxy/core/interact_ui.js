const { spawn } = require("child_process");
const path = require("path");

const ENGINE_PATH = path.join(__dirname, "ui_engine.py");

module.exports = {
  declaration: {
    name: "interact_ui",
    description: "Universal Closed-Loop Windows UI Automation Engine. Observe -> Act -> Verify. Automatically handles popups, modal dialogs (Save As, Open, Confirmations), menus, tabs, and text editors across all Windows apps. Actions are verified before returning success.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action to perform: 'click' (click button/menu/tab), 'set_text' (type into editor or input field), 'focus_window' (bring window/dialog to front), 'get_ui_tree' (observe active window, dialogs, and interactive controls), or 'run_sequence' (execute a sequence of verified steps).",
          enum: ["click", "set_text", "focus_window", "get_ui_tree", "run_sequence"]
        },
        target: {
          type: "STRING",
          description: "The button name, menu item, input field name, or AutomationId to target (e.g. 'File', 'Save as', 'File name:', 'Save', 'Add New Tab', 'CloseTab'). Automatically targets active modal dialog if one is open. Leave empty to target the main editor area for 'set_text'."
        },
        app_name: {
          type: "STRING",
          description: "Optional name or title of the target application window (e.g. 'Notepad', 'Chrome', 'Settings', 'Calculator'). If not open, it is automatically launched."
        },
        value: {
          type: "STRING",
          description: "Text value to insert when action is 'set_text'."
        },
        steps: {
          type: "ARRAY",
          description: "List of steps when action is 'run_sequence' (e.g. [{app_name: 'Notepad', action: 'set_text', value: 'Hello'}, {action: 'click', target: 'File'}, {action: 'click', target: 'Save as'}]). Executes verified closed-loop actions across one or multiple apps.",
          items: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", description: "'click', 'set_text', 'focus_window', or 'get_ui_tree'" },
              target: { type: "STRING", description: "Button name, menu name, or input field" },
              value: { type: "STRING", description: "Text to type" },
              app_name: { type: "STRING", description: "App name if this step targets another app (e.g. 'Calculator', 'Notepad')" },
              delay_ms: { type: "INTEGER", description: "Delay in ms before next step (default: 300)" }
            },
            required: ["action"]
          }
        }
      },
      required: ["action"]
    }
  },

  async execute(args = {}) {
    const action = args.action || "click";
    const target = args.target || "";
    const appName = args.app_name || "";
    const val = args.value || "";

    // Robust extraction of steps (whether array, JSON string, or mistakenly passed in 'value')
    let steps = args.steps;
    if (typeof steps === "string") {
      try { steps = JSON.parse(steps); } catch { steps = []; }
    }
    if ((!steps || !Array.isArray(steps) || steps.length === 0) && typeof val === "string" && val.trim().startsWith("[")) {
      try { steps = JSON.parse(val.trim()); } catch { steps = []; }
    }
    if (!Array.isArray(steps)) {
      steps = [];
    }

    if (action === "run_sequence" && steps.length === 0) {
      return {
        success: false,
        error: "run_sequence requires a non-empty array of steps in the 'steps' parameter. Example: {action: 'run_sequence', app_name: 'Notepad', steps: [{action: 'set_text', value: 'Hello'}, {action: 'click', target: 'File'}, {action: 'click', target: 'Save as'}]}"
      };
    }

    const payload = {
      action,
      target,
      app_name: appName,
      value: val,
      steps
    };

    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    const startTime = Date.now();

    return new Promise((resolve) => {
      const child = spawn("python", [ENGINE_PATH, "--b64", b64], {
        windowsHide: true
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => { stdout += d.toString("utf8"); });
      child.stderr.on("data", (d) => { stderr += d.toString("utf8"); });

      child.on("close", (code) => {
        let parsed = null;
        try {
          parsed = JSON.parse(stdout.trim());
        } catch {
          parsed = { success: false, raw: stdout.trim() };
        }

        resolve({
          success: code === 0 && (parsed.success !== false),
          action,
          target,
          app_name: appName,
          duration_ms: Date.now() - startTime,
          ...parsed,
          error: parsed.error || stderr.trim() || (code !== 0 ? "UI Execution failed" : null)
        });
      });
    });
  }
};
