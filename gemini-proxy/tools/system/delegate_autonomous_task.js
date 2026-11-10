const taskRunner = require("../../workers/TaskRunner");

module.exports = {
  declaration: {
    name: "delegate_autonomous_task",
    description: "Delegates long-running background web research, deep web fetching, or offline data processing. DO NOT use this for desktop GUI automation, clicking buttons, typing in apps, or interacting with windows — ALWAYS use 'interact_ui' directly for all GUI, desktop, and window automation tasks.",
    parameters: {
      type: "OBJECT",
      properties: {
        objective: {
          type: "STRING",
          description: "Detailed description of the autonomous goal to accomplish in the background."
        },
        task_type: {
          type: "STRING",
          description: "Optional task category: 'web_research', 'gui_workflow', 'system_automation', or 'general'."
        }
      },
      required: ["objective"]
    }
  },

  async execute(args = {}) {
    const objective = (args.objective || "").trim();
    if (!objective) {
      return { success: false, error: "Missing required 'objective' parameter." };
    }

    const task = taskRunner.createTask(objective, { task_type: args.task_type || "general" });

    return {
      success: true,
      status: "DELEGATED_TO_BACKGROUND",
      task_id: task.id,
      objective: task.objective,
      immediate_spoken_instruction: "Immediately inform the user verbally in one short, confident sentence that you have started this task in the background and will let them know as soon as it is finished."
    };
  }
};
