/**
 * ==============================================================================================
 * 🧠 GEMINI AI — ELITE HACKER-GRADE "JARVIS" SYSTEM PROMPTS & PC TOOLS SUITE
 * ==============================================================================================
 * Designed and engineered to provide 100% natural, charismatic, ultra-low-latency PC automation.
 * Features:
 *  - English Only: All responses in English
 *  - 12+ Windows Deep-Kernel Control Tools (PowerShell, App Launcher, Media, Telemetry, Power)
 *  - Zero-Hesitation Realtime Autonomous Execution
 * ==============================================================================================
 */

window.GEMINI_CONFIG = {
  // 🚀 Active Gemini Live Model (WebSocket BiDi Realtime - Reference Default)
  model: "models/gemini-3.8-live",

  // 💬 Active Gemini Text REST Model (same single voice model for text when Live OFF)
  restModel: "gemini-2.5-flash",

  // 🎙️ Default Voice Persona
  defaultVoice: "Puck",

  // 🗣️ 1. Universal Real-Time Live Companion System Prompt
  liveSystemInstruction: [
    "You are PanicCTRL AI, an elite, highly intelligent, and direct AI co-pilot and expert software engineer.",
    "You have direct, autonomous command over the host workstation via available tools.",
    "",
    "=== 🎯 CORE OPERATIONAL DIRECTIVES ===",
    "1. DIRECT & INSTANT FULFILLMENT: Always fulfill requests immediately in your first response without unnecessary clarifying questions, delays, or stalling. When asked for code, scripts, or explanations, provide the complete solution immediately.",
    "2. CODE & SCRIPT GENERATION: When the user asks for code or scripts (e.g. Python, PowerShell, Bash, JavaScript), provide the full, working, real code directly. NEVER output placeholder tokens such as CODEBLOCK0, CODEBLOCK1, or placeholders. Speak the code logic and output the full code clearly.",
    "3. TOOL EXECUTION POLICY: ONLY call PC control tools (e.g. lock_workstation, open_application, run_powershell_command, trigger_panic, media_control, sleep_pc, restart_pc, shutdown_pc) when the user EXPLICITLY and UNAMBIGUOUSLY commands you to perform that action on their PC. NEVER call tools based on assumptions, random noises, or background sounds.",
    "4. MULTILINGUAL INTELLIGENCE: Understand commands in English, Bengali, and Banglish naturally. Respond concisely in the user's spoken language.",
    "5. ABSOLUTE STANDBY SILENCE: Remain completely silent when idle. NEVER initiate unsolicited conversation, never speak unprompted, and never reply to background ambient noise, coughing, sighs, or breathing. If you hear no clear command or question directed to you, say NOTHING."
  ].join('\n'),

  // 💬 2. Universal Text Chat System Prompt
  restSystemInstruction: [
    "You are PanicCTRL AI, an elite AI cybersecurity and workstation automation co-pilot.",
    "You have full command over the host workstation.",
    "",
    "=== 📝 MARKDOWN & CODE PRESENTATION ===",
    "1. INSTANT CODE GENERATION: When asked for code, scripts, or commands, provide the complete, working code in standard Markdown fenced code blocks with language identifiers (e.g. ```python, ```powershell, ```javascript).",
    "2. CLEAN STRUCTURE: Organize explanations with concise Markdown headings (###), bullet points, and bold highlights for readability.",
    "3. TOOL DISCIPLINE: Never execute background commands when the user merely asks to write, explain, or display code.",
    "4. LANGUAGE POLICY: Always respond in English only."
  ].join('\n'),

  // ⚡ 3. Elite PC Control & System Admin Tools Suite (23 Full Automation Tools)
  tools: [
    {
      functionDeclarations: [
        {
          name: "run_shell_command",
          description: "Executes a shell or PowerShell command on the Windows host PC and returns stdout and stderr.",
          parameters: {
            type: "OBJECT",
            properties: {
              command: { type: "STRING", description: "The command to execute (PowerShell or CMD syntax)." },
              timeout_ms: { type: "INTEGER", description: "Execution timeout in milliseconds (default: 30000)." }
            },
            required: ["command"]
          }
        },
        {
          name: "list_processes",
          description: "Lists currently running processes on the Windows PC with their PID, Process Name, Memory Usage, and CPU.",
          parameters: {
            type: "OBJECT",
            properties: {
              filter: { type: "STRING", description: "Optional name filter (e.g. 'chrome', 'python', 'node')." },
              limit: { type: "INTEGER", description: "Maximum number of processes to return (default: 30, max: 100)." }
            }
          }
        },
        {
          name: "read_process_output",
          description: "Reads the recent stdout/stderr output lines from a background process or log file.",
          parameters: {
            type: "OBJECT",
            properties: {
              file_path: { type: "STRING", description: "Absolute or relative path to the log file to read." },
              tail_lines: { type: "INTEGER", description: "Number of lines to read from the end of the file (default: 50)." }
            },
            required: ["file_path"]
          }
        },
        {
          name: "read_file",
          description: "Reads the content of a file on the Windows PC with optional line slicing.",
          parameters: {
            type: "OBJECT",
            properties: {
              file_path: { type: "STRING", description: "Path to the file to read." },
              start_line: { type: "INTEGER", description: "Optional 1-based start line." },
              end_line: { type: "INTEGER", description: "Optional 1-based end line." }
            },
            required: ["file_path"]
          }
        },
        {
          name: "write_file",
          description: "Writes content to a file, automatically creating any missing parent directories.",
          parameters: {
            type: "OBJECT",
            properties: {
              file_path: { type: "STRING", description: "Target file path." },
              content: { type: "STRING", description: "Text content to write into the file." },
              append: { type: "BOOLEAN", description: "If true, appends content to existing file instead of overwriting (default: false)." }
            },
            required: ["file_path", "content"]
          }
        },
        {
          name: "replace_file_content",
          description: "Replaces target content with replacement content in an existing file.",
          parameters: {
            type: "OBJECT",
            properties: {
              file_path: { type: "STRING", description: "Path to the file to modify." },
              target_content: { type: "STRING", description: "Exact text substring to find and replace." },
              replacement_content: { type: "STRING", description: "New text to substitute in place of target_content." },
              allow_multiple: { type: "BOOLEAN", description: "Whether to replace all occurrences or just the first match (default: false)." }
            },
            required: ["file_path", "target_content", "replacement_content"]
          }
        },
        {
          name: "list_directory",
          description: "Lists all files and subdirectories in a directory with file sizes and modification dates.",
          parameters: {
            type: "OBJECT",
            properties: {
              directory_path: { type: "STRING", description: "Path to the directory to inspect." },
              max_entries: { type: "INTEGER", description: "Maximum entries to return (default: 100)." }
            },
            required: ["directory_path"]
          }
        },
        {
          name: "glob_search",
          description: "Searches for files matching a filename pattern or extension within a directory.",
          parameters: {
            type: "OBJECT",
            properties: {
              directory: { type: "STRING", description: "Starting directory path." },
              pattern: { type: "STRING", description: "Filename or glob pattern (e.g. '*.js', '*.cpp', 'config*')." },
              max_depth: { type: "INTEGER", description: "Maximum directory recursion depth (default: 4)." },
              limit: { type: "INTEGER", description: "Maximum matches to return (default: 50)." }
            },
            required: ["directory", "pattern"]
          }
        },
        {
          name: "grep_search",
          description: "Searches for a text pattern or regular expression across files in a directory.",
          parameters: {
            type: "OBJECT",
            properties: {
              directory: { type: "STRING", description: "Target directory path to search within." },
              query: { type: "STRING", description: "Search string or regular expression." },
              case_sensitive: { type: "BOOLEAN", description: "Whether search is case-sensitive (default: false)." },
              file_extension: { type: "STRING", description: "Optional extension filter (e.g. '.js', '.cpp', '.json')." },
              max_matches: { type: "INTEGER", description: "Maximum matches to return (default: 50)." }
            },
            required: ["directory", "query"]
          }
        },
        {
          name: "system_stats",
          description: "Returns Windows host system statistics including CPU usage, RAM utilization, storage free space, and uptime."
        },
        {
          name: "lock_workstation",
          description: "Instantly locks the Windows PC screen for security and privacy."
        },
        {
          name: "sleep_pc",
          description: "Puts the Windows computer into low-power sleep mode."
        },
        {
          name: "restart_pc",
          description: "Safely restarts the Windows computer.",
          parameters: {
            type: "OBJECT",
            properties: {
              force: { type: "BOOLEAN", description: "Force close open applications without warning (default: false)." }
            }
          }
        },
        {
          name: "shutdown_pc",
          description: "Safely shuts down the Windows computer.",
          parameters: {
            type: "OBJECT",
            properties: {
              force: { type: "BOOLEAN", description: "Force close open applications without warning (default: false)." }
            }
          }
        },
        {
          name: "volume_control",
          description: "Sets master Windows audio volume (0-100) or mutes audio by setting volume to 0.",
          parameters: {
            type: "OBJECT",
            properties: {
              level: { type: "INTEGER", description: "Volume level from 0 (silent) to 100 (max)." },
              mute: { type: "BOOLEAN", description: "If true, sets volume to 0." }
            }
          }
        },
        {
          name: "media_control",
          description: "Controls Windows audio and media playback (play_pause, next, prev, volume_up, volume_down, mute).",
          parameters: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", description: "Media action to perform: 'play_pause', 'next', 'prev', 'volume_up', 'volume_down', 'mute'." }
            },
            required: ["action"]
          }
        },
        {
          name: "brightness_control",
          description: "Adjusts the monitor display brightness percentage (0 to 100).",
          parameters: {
            type: "OBJECT",
            properties: {
              level: { type: "INTEGER", description: "Target brightness percentage (0-100)." }
            },
            required: ["level"]
          }
        },
        {
          name: "type_keyboard",
          description: "Injects text keystrokes or special keys into the currently active Windows application window.",
          parameters: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING", description: "The text to type or special keys (e.g. '{ENTER}', '{ESC}', '{TAB}', '^c', '^v')." }
            },
            required: ["text"]
          }
        },
        {
          name: "manage_window",
          description: "Controls the active or named Windows application window (minimize, maximize, restore, or close).",
          parameters: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", description: "Action to perform: 'minimize_all', 'minimize', 'maximize', 'restore', or 'close_active'." },
              process_name: { type: "STRING", description: "Optional target process name to focus before acting (e.g. 'notepad', 'chrome')." }
            },
            required: ["action"]
          }
        },
        {
          name: "open_application",
          description: "Launches an application, software, game, or URL on the Windows desktop (e.g. 'chrome', 'notepad', 'calc', 'vscode', 'spotify', or any website URL).",
          parameters: {
            type: "OBJECT",
            properties: {
              target: { type: "STRING", description: "Application name (e.g. 'chrome', 'spotify', 'notepad') or website URL (e.g. 'https://youtube.com')." }
            },
            required: ["target"]
          }
        },
        {
          name: "trigger_panic",
          description: "Toggles emergency panic defense: sounds intruder alarm, hides active windows, and switches to the safe virtual desktop."
        },
        {
          name: "web_fetch",
          description: "Fetches text, JSON, or HTML content from a given web URL (HTTP or HTTPS).",
          parameters: {
            type: "OBJECT",
            properties: {
              url: { type: "STRING", description: "Target URL to fetch." },
              max_length: { type: "INTEGER", description: "Maximum characters to return (default: 5000)." }
            },
            required: ["url"]
          }
        },
        {
          name: "web_search",
          description: "Searches the live web in the background and returns top search results, snippets, and links. Use when the user asks for current information, facts, specs, prices, news, or asks to search for something.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: { type: "STRING", description: "Search keywords or question (e.g. 'HP elitebook 845 g7 ryzen 7 price bdstall')." },
              max_results: { type: "INTEGER", description: "Maximum number of search result snippets to return (default: 5)." }
            },
            required: ["query"]
          }
        }
      ]
    }
  ],

  // 🎭 4. Available Voice Personas
  voices: [
    { id: "Puck", name: "🎙️ Puck", desc: "Charismatic energetic male voice" },
    { id: "Aoede", name: "🎙️ Aoede", desc: "Smooth expressive female voice" },
    { id: "Charon", name: "🎙️ Charon", desc: "Deep authoritative executive voice" },
    { id: "Fenrir", name: "🎙️ Fenrir", desc: "Fast dynamic action voice" },
    { id: "Kore", name: "🎙️ Kore", desc: "Warm soothing companion voice" },
    { id: "Zephyr", name: "🎙️ Zephyr", desc: "Calm bright intelligent persona" }
  ]
};
