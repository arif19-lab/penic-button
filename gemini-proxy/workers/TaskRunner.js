const EventEmitter = require("events");
const toolsRegistry = require("../tools/index");
const mcpManager = require("../mcp/McpManager");
const interactUi = require("../core/interact_ui");
const executeSystemScript = require("../core/execute_system_script");

class TaskRunner extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.geminiClientFactory = null;
  }

  setGeminiClientFactory(factory) {
    this.geminiClientFactory = factory;
  }

  createTask(objective, context = {}) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      id: taskId,
      objective: (objective || "").trim(),
      context,
      status: "running",
      progress: "Task initiated in background.",
      stepsCompleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: null,
      error: null
    };

    this.tasks.set(taskId, record);
    this.emit("task_started", record);

    // Asynchronous decoupled execution loop
    setImmediate(() => {
      this._runAutonomousLoop(record);
    });

    return record;
  }

  async _runAutonomousLoop(task) {
    console.log(`[TaskRunner] 🚀 Starting autonomous execution for ${task.id}: "${task.objective}"`);

    try {
      if (!this.geminiClientFactory) {
        throw new Error("Gemini AI client factory not configured on TaskRunner.");
      }

      const ai = this.geminiClientFactory();
      const prompt = `You are the Tier-2 Autonomous Worker Engine for the PanicCTRL Operating System.
The user requested this high-level task:
"${task.objective}"

Context: ${JSON.stringify(task.context || {})}

Decompose this task into concrete, executable steps using:
1. "script": PowerShell commands (e.g. "Start-Process notepad.exe", "Start-Process calc.exe", file verification, math calculations).
2. "ui": UI Automation actions with "action" ('click', 'set_text', 'focus_window'), "app_name", "target", "value".

Format your response STRICTLY as JSON with NO MARKDOWN:
{
  "steps": [
    { "type": "script", "command": "Start-Process notepad.exe" },
    { "type": "ui", "action": "set_text", "app_name": "Notepad", "target": "", "value": "text here" }
  ],
  "spoken_summary": "1-2 natural, polite sentences summarizing what was accomplished."
}`;

      let response = null;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.1 }
        });
      } catch (e) {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.1 }
        });
      }

      let parsed = {};
      try {
        parsed = JSON.parse(response?.text || "{}");
      } catch (pe) {
        parsed = { spoken_summary: response?.text || "Task finished successfully.", steps: [] };
      }

      // Execute each step autonomously on the workstation
      const executionLogs = [];
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        for (const step of parsed.steps) {
          try {
            if (step.type === "script" && step.command) {
              const res = await executeSystemScript.execute({ script: step.command });
              executionLogs.push({ step, res });
            } else if (step.type === "ui" && step.action) {
              const res = await interactUi.execute({
                action: step.action,
                target: step.target,
                app_name: step.app_name,
                value: step.value
              });
              executionLogs.push({ step, res });
            }
          } catch (e) {
            executionLogs.push({ step, error: e.message });
          }
        }
      }

      task.status = "completed";
      task.summary = parsed.spoken_summary || "Task completed successfully.";
      task.actionsTaken = executionLogs;
      task.updatedAt = new Date().toISOString();

      console.log(`[TaskRunner] ✅ Task ${task.id} completed: "${task.summary}"`);
      this.emit("task_completed", task);
    } catch (err) {
      console.error(`[TaskRunner] ❌ Task ${task.id} failed:`, err.message);
      task.status = "failed";
      task.error = err.message;
      task.summary = `I encountered an issue completing the task: ${err.message}`;
      task.updatedAt = new Date().toISOString();
      this.emit("task_failed", task);
    }
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  listActiveTasks() {
    return Array.from(this.tasks.values()).filter((t) => t.status === "running");
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.status === "running") {
      task.status = "cancelled";
      task.updatedAt = new Date().toISOString();
      this.emit("task_cancelled", task);
      return true;
    }
    return false;
  }
}

module.exports = new TaskRunner();
