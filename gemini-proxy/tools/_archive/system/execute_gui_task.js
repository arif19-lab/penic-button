const path = require("path");
const interactUi = require("../../core/interact_ui");

module.exports = {
  declaration: {
    name: "execute_gui_task",
    description: "Autonomously executes multi-step GUI workflows, human-like form filling, and native UI interactions on ANY Windows desktop or browser window using deep Win32 UIAutomation with 4-tier fallback (InvokePattern -> SelectPattern -> TogglePattern -> ClickInput).",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Action type: 'click' (click an element), 'set_text' (fill field), 'fill_form' (auto-fill multiple form fields and submit), 'execute_steps' (run custom action sequence), or 'inspect' (discover visible interactive UI controls)."
        },
        window_name: {
          type: "STRING",
          description: "Target application window or process name (e.g. 'chrome', 'notepad', 'msedge', 'calc', or partial window title). If empty, acts on the active foreground window."
        },
        target: {
          type: "STRING",
          description: "Element name or AutomationId to target when action is 'click' or 'set_text'."
        },
        value: {
          type: "STRING",
          description: "Value to type or enter when action is 'set_text'."
        },
        form_fields: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              field: { type: "STRING", description: "Field label, name, or AutomationId (e.g. 'Username', 'Email', 'Password', 'Search')." },
              value: { type: "STRING", description: "Value to type or enter into this field." }
            },
            required: ["field", "value"]
          },
          description: "List of fields and values to fill out when action is 'fill_form'."
        },
        submit_button: {
          type: "STRING",
          description: "Name of the button to click after filling (e.g. 'Submit', 'Login', 'Save', 'Search', 'Next', 'OK')."
        },
        steps: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", description: "'click_element', 'type', 'key', or 'wait'." },
              target: { type: "STRING", description: "Element name or label to click (for 'click_element')." },
              value: { type: "STRING", description: "Text to type or key name." },
              delay_ms: { type: "INTEGER" }
            },
            required: ["type"]
          },
          description: "Sequential list of actions when action is 'execute_steps'."
        }
      },
      required: ["action"]
    }
  },

  async execute(args = {}) {
    const action = (args.action || "inspect").toLowerCase().trim();
    const windowName = (args.window_name || args.app_name || "").trim();
    const target = (args.target || args.submit_button || "").trim();
    const value = args.value || "";

    // 1. Inspect UI Tree
    if (action === "inspect" || action === "get_ui_tree") {
      return await interactUi.execute({
        action: "get_ui_tree",
        app_name: windowName
      });
    }

    // 2. Direct click
    if (action === "click" || action === "click_element") {
      return await interactUi.execute({
        action: "click",
        app_name: windowName,
        target: target
      });
    }

    // 3. Direct set_text
    if (action === "set_text" || action === "type") {
      return await interactUi.execute({
        action: "set_text",
        app_name: windowName,
        target: target,
        value: value
      });
    }

    // 4. Fill form sequence
    if (action === "fill_form") {
      const fields = Array.isArray(args.form_fields) ? args.form_fields : [];
      const log = [];

      for (const f of fields) {
        const res = await interactUi.execute({
          action: "set_text",
          app_name: windowName,
          target: f.field,
          value: f.value
        });
        log.push({ field: f.field, success: res.success });
      }

      if (target) {
        const clickRes = await interactUi.execute({
          action: "click",
          app_name: windowName,
          target: target
        });
        log.push({ submit: target, success: clickRes.success });
      }

      return {
        success: log.every(l => l.success),
        action: "fill_form",
        log
      };
    }

    // 5. Execute steps sequence
    if (action === "execute_steps") {
      const steps = Array.isArray(args.steps) ? args.steps : [];
      const log = [];

      for (const step of steps) {
        const sType = (step.type || step.action || "").toLowerCase();
        if (sType === "click_element" || sType === "click") {
          const res = await interactUi.execute({
            action: "click",
            app_name: windowName,
            target: step.target
          });
          log.push({ step: "click", target: step.target, success: res.success });
        } else if (sType === "type" || sType === "set_text") {
          const res = await interactUi.execute({
            action: "set_text",
            app_name: windowName,
            target: step.target || "",
            value: step.value || ""
          });
          log.push({ step: "type", value: step.value, success: res.success });
        } else if (sType === "wait") {
          const delay = step.delay_ms || parseInt(step.value, 10) || 500;
          await new Promise(r => setTimeout(r, delay));
          log.push({ step: "wait", delay_ms: delay });
        }
      }

      return {
        success: log.filter(l => l.success !== undefined).every(l => l.success),
        action: "execute_steps",
        log
      };
    }

    // Default fallback to interactUi
    return await interactUi.execute({
      action,
      app_name: windowName,
      target,
      value
    });
  }
};
