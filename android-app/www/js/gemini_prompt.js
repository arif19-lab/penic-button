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
  // 🚀 Active Gemini Live Model (WebSocket BiDi Realtime)
  model: "models/gemini-3.1-flash-live-preview",

  // 💬 Active Gemini Text REST Model (same single voice model for text when Live OFF)
  restModel: "gemini-3.1-flash-live-preview",

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
    "4. MULTILINGUAL INTELLIGENCE: Understand commands in English, Bengali (বাংলা), and Banglish naturally. Respond concisely in the user's spoken language.",
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

  // ⚡ ৩. এলিট পিসি কন্ট্রোল টুলস সুইট (12+ Elite PC Automation Tools)
  tools: [
    {
      functionDeclarations: [
        {
          name: "lock_workstation",
          description: "Locks the Windows workstation instantly."
        },
        {
          name: "trigger_panic",
          description: "Toggles emergency panic defense, sounding intruder alarm and switching to safe virtual desktop."
        },
        {
          name: "open_application",
          description: "Launches any application, game, browser, or website on Windows (e.g. 'chrome', 'youtube', 'vscode', 'spotify', 'notepad', 'calculator', 'taskmgr', 'explorer', 'terminal').",
          parameters: {
            type: "OBJECT",
            properties: {
              target: { 
                type: "STRING", 
                description: "Name of the app (e.g. 'chrome', 'spotify', 'notepad', 'vscode') or URL (e.g. 'https://youtube.com')" 
              }
            },
            required: ["target"]
          }
        },
        {
          name: "web_search",
          description: "Searches Google or YouTube on the PC browser for a specific query.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: { type: "STRING", description: "Search query keywords" },
              platform: { type: "STRING", description: "'google' or 'youtube'" }
            },
            required: ["query"]
          }
        },
        {
          name: "media_control",
          description: "Controls PC audio and media playback (play_pause, next_track, prev_track, volume_up, volume_down, mute).",
          parameters: {
            type: "OBJECT",
            properties: {
              action: { 
                type: "STRING", 
                description: "Action to perform: 'play_pause', 'next', 'prev', 'volume_up', 'volume_down', 'mute'" 
              }
            },
            required: ["action"]
          }
        },
        {
          name: "set_volume",
          description: "Sets the Windows master volume percentage (0 to 100).",
          parameters: {
            type: "OBJECT",
            properties: {
              level: { 
                type: "INTEGER", 
                description: "Volume percentage 0 to 100" 
              }
            },
            required: ["level"]
          }
        },
        {
          name: "get_pc_hardware_status",
          description: "Gets real-time CPU, RAM, battery, disk space, and lock status of the Windows PC."
        },
        {
          name: "run_powershell_command",
          description: "Runs a PowerShell command on the Windows host ONLY when the user explicitly says 'run', 'execute', 'check live', or asks for live real-time output. DO NOT use this tool when the user asks to 'write', 'create', 'generate', or 'explain' a script—write the script in chat instead.",
          parameters: {
            type: "OBJECT",
            properties: {
              command: { 
                type: "STRING", 
                description: "The PowerShell command to execute on the PC." 
              }
            },
            required: ["command"]
          }
        },
        {
          name: "type_keyboard",
          description: "Injects text or keystrokes ({ENTER}, {ESC}, {BACKSPACE}, {TAB}) into the active Windows window.",
          parameters: {
            type: "OBJECT",
            properties: {
              text: { 
                type: "STRING", 
                description: "Text or special key to type" 
              }
            },
            required: ["text"]
          }
        },
        {
          name: "sleep_pc",
          description: "Puts the Windows PC into low-power sleep mode."
        },
        {
          name: "restart_pc",
          description: "Restarts the Windows computer."
        },
        {
          name: "shutdown_pc",
          description: "Safely shuts down the Windows computer."
        }
      ]
    }
  ],

  // 🎭 ৪. উপলব্ধ ভয়েস পার্সোনাসমূহ (Available Voice Personas)
  voices: [
    { id: "Puck", name: "🎙️ Puck", desc: "Charismatic energetic male voice" },
    { id: "Aoede", name: "🎙️ Aoede", desc: "Smooth expressive female voice" },
    { id: "Charon", name: "🎙️ Charon", desc: "Deep authoritative executive voice" },
    { id: "Fenrir", name: "🎙️ Fenrir", desc: "Fast dynamic action voice" },
    { id: "Kore", name: "🎙️ Kore", desc: "Warm soothing companion voice" },
    { id: "Zephyr", name: "🎙️ Zephyr", desc: "Calm bright intelligent persona" }
  ]
};
