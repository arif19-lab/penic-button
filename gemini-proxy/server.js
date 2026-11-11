/**
 * 🎙️ PanicCTRL — Gemini Live Multimodal WebSocket Server
 * ============================================================================
 * Mirrors the official Google AI Studio reference implementation:
 * (C:\Users\Imran\Downloads\gemini-live-voice-assistant\server.ts)
 *
 * Features:
 *   • Official @google/genai SDK (v2.4.0) with ai.live.connect()
 *   • Sub-100ms bidirectional 16kHz audio in / 24kHz audio out
 *   • Dual-engine synchronous speech transcription (Google Live + Web Speech)
 *   • Instant Barge-In / Interruption handling
 *   • Multimodal 1 FPS live camera & screen frame ingestion
 *   • Dynamic hot-swapping between Gemini models without dropping connection
 *   • Full PC automation tools (lock, sleep, restart, powershell, typing)
 *   • Resilient Emotional Tone analysis (/api/analyze-tone) & Visualizer support
 *   • Dual-port listening (Direct :3001 & C++ Server 8085 bridge /gemini-proxy)
 *   • Safe server-side API key management (Host PC file / env / C++ sync)
 * ============================================================================
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const path = require("path");
const fs = require("fs");
const { WebSocketServer, WebSocket } = require("ws");
const { GoogleGenAI, Modality } = require("@google/genai");

const app = express();

// Reverse proxy all non-Node endpoints to C++ core (port 8085)
const isNodeEndpoint = (p) => {
  return p.startsWith("/api/chat") ||
         p.startsWith("/api/health") ||
         p.startsWith("/api/reload-key") ||
         p.startsWith("/api/analyze-tone") ||
         p.startsWith("/api/tts") ||
         p.startsWith("/api/tools");
};

// Strip /gemini-proxy prefix if forwarded through the C++ server bridge.
// MUST run before the reverse proxy below: otherwise /gemini-proxy/* is sent
// back to the C++ server unchanged, which bridges it here again (endless loop).
app.use((req, _res, next) => {
  if (req.url === "/gemini-proxy") req.url = "/";
  else if (req.url.startsWith("/gemini-proxy/")) req.url = req.url.slice("/gemini-proxy".length);
  next();
});

app.use((req, res, next) => {
  if (!isNodeEndpoint(req.path)) {
    const proxyReq = http.request({
      hostname: "127.0.0.1",
      port: 8085,
      path: req.url, // retains query parameters e.g. ?key=imran2024
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on("error", (err) => {
      console.warn("[Proxy] Error forwarding to C++ server (8085):", err.message);
      if (!res.headersSent) res.status(502).json({ error: "C++ core offline" });
    });
    req.pipe(proxyReq);
    return;
  }
  next();
});

app.use(express.json({ limit: "25mb" }));

const PORT = parseInt(process.env.PORT, 10) > 0 ? parseInt(process.env.PORT, 10) : 3001;
const KEY_FILE = "C:\\ProgramData\\PanicButton\\gemini_key.txt";
// The agent rotates to a per-install key, so the bridge credential is read
// from the file the agent writes instead of a compiled-in default.
const AUTH_KEY_FILE = process.env.PANIC_AUTH_KEY_FILE || "C:\\ProgramData\\PanicButton\\auth.key";

function agentAccessKey() {
  try {
    const k = fs.readFileSync(AUTH_KEY_FILE, "utf8").trim();
    if (k) return k;
  } catch (e) {}
  return "imran2024";
}

function cppKeyUrl() {
  return "http://127.0.0.1:8085/api/gemini_key?key=" + encodeURIComponent(agentAccessKey());
}

const server = http.createServer(app);

// ─── API Key Resolution ─────────────────────────────────────────────────────
let cachedApiKey = process.env.GEMINI_API_KEY || "";

function readKeyFromFile() {
  try {
    const raw = fs.readFileSync(KEY_FILE, "utf8").trim();
    return raw || "";
  } catch (e) {
    return "";
  }
}

async function fetchKeyFromCppServer() {
  try {
    const res = await fetch(cppKeyUrl());
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.key) {
      cachedApiKey = data.key;
      console.log("[Proxy] API key loaded via PanicButton server");
    }
  } catch (e) {
    // C++ server not running yet — file read is the primary path anyway
  }
}

function currentApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const fromFile = readKeyFromFile();
  if (fromFile) {
    cachedApiKey = fromFile;
    return fromFile;
  }
  return cachedApiKey;
}

function getGeminiClient(keyOverride) {
  const key = keyOverride || currentApiKey();
  if (!key) {
    console.warn("[Proxy] GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey: key || "",
    httpOptions: {
      headers: {
        "User-Agent": "panicctrl-live-build",
      },
    },
  });
}

// ─── Helper: Safely send WebSocket message ──────────────────────────────────
function safeSend(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    } catch (err) {
      console.warn("[Proxy] WebSocket safeSend warning:", err?.message || err);
    }
  }
}

// ─── Default PanicCTRL System Tools (Loaded Modularly from ./tools) ─────────
const toolsRegistry = require("./tools/index");
const DEFAULT_TOOLS = toolsRegistry.getDeclarations();

// ─── Tier-2 Autonomous Worker Engine & MCP Subsystems ──────────────────────
const taskRunner = require("./workers/TaskRunner");
const mcpManager = require("./mcp/McpManager");

// Wire TaskRunner client factory and start MCP discovery
taskRunner.setGeminiClientFactory(getGeminiClient);
mcpManager.init().catch((err) => console.warn("[MCP] Notice during startup:", err.message));

// ─── Heuristic Emotional Tone Analysis ──────────────────────────────────────
function computeHeuristicTone(text, role, audioMetrics) {
  const lower = (text || "").toLowerCase().trim();
  const rms = typeof audioMetrics?.rms === "number" ? audioMetrics.rms : 0.4;

  let primaryEmotion = "thoughtful";
  let secondaryEmotion = "engaged";
  let valence = 0.25;
  let arousal = Math.min(1, Math.max(0.15, rms * 2.8));
  let vocalToneSummary = "Clear, measured vocal delivery with steady conversational flow.";
  let suggestedAdaptiveTone = "Warm, attentive, and collaborative";

  const scores = {
    curiosity: 50,
    enthusiasm: 45,
    calmness: 75,
    empathy: 70,
    thoughtfulness: 80,
  };

  if (/\b(love|excited|amazing|awesome|great|fantastic|super|brilliant|wonderful|joy|happy|thrilled)\b/.test(lower)) {
    primaryEmotion = "enthusiastic";
    secondaryEmotion = "optimistic";
    valence = 0.85;
    arousal = Math.max(arousal, 0.75);
    scores.enthusiasm = 92;
    scores.curiosity = 70;
    vocalToneSummary = "Uplifting, high-energy acoustic inflection with buoyant positivity.";
    suggestedAdaptiveTone = "High-energy, validating, and enthusiastic";
  } else if (/\b(why|how|what|curious|wonder|explain|explore|hypothesis|theory|could|would)\b|\?/.test(lower)) {
    primaryEmotion = "curious";
    secondaryEmotion = "intrigued";
    valence = 0.45;
    arousal = Math.max(arousal, 0.55);
    scores.curiosity = 90;
    scores.thoughtfulness = 85;
    vocalToneSummary = "Inquisitive inflection with rising pitch indicating active questioning.";
    suggestedAdaptiveTone = "Intellectually curious, detailed, and clear";
  } else if (/\b(peace|relax|calm|quiet|breathe|serene|tranquil|slow|rest|gentle)\b/.test(lower)) {
    primaryEmotion = "calm";
    secondaryEmotion = "grounded";
    valence = 0.6;
    arousal = 0.25;
    scores.calmness = 95;
    scores.empathy = 80;
    vocalToneSummary = "Gentle, steady, and soothing vocal pacing with grounding rhythm.";
    suggestedAdaptiveTone = "Peaceful, measured, and mindful";
  } else if (/\b(sad|frustrated|error|broken|wrong|fail|stuck|annoyed|difficult|issue|bug|problem|angry)\b/.test(lower)) {
    primaryEmotion = "frustrated";
    secondaryEmotion = "concerned";
    valence = -0.45;
    arousal = Math.max(arousal, 0.65);
    scores.calmness = 30;
    scores.empathy = 85;
    scores.thoughtfulness = 75;
    vocalToneSummary = "Tense or stressed cadence indicating urgency and vocal strain.";
    suggestedAdaptiveTone = "Calm, empathetic, reassuring, and solution-focused";
  } else if (/\b(feel|care|support|understand|hear you|appreciate|kind|thank you|thanks)\b/.test(lower)) {
    primaryEmotion = "empathetic";
    secondaryEmotion = "compassionate";
    valence = 0.7;
    arousal = 0.4;
    scores.empathy = 95;
    scores.calmness = 85;
    vocalToneSummary = "Warm, resonant intonations reflecting sincere empathy and care.";
    suggestedAdaptiveTone = "Supportive, warm, and gentle";
  }

  return {
    primaryEmotion,
    secondaryEmotion,
    valence,
    arousal,
    confidence: 0.88,
    vocalToneSummary,
    suggestedAdaptiveTone,
    emotionScores: scores,
  };
}

// ─── REST Endpoints ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    ok: true,
    hasApiKey: Boolean(currentApiKey()),
    hasKey: Boolean(currentApiKey()),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/reload-key", async (_req, res) => {
  cachedApiKey = "";
  if (!readKeyFromFile()) await fetchKeyFromCppServer();
  res.json({ ok: true, hasKey: Boolean(currentApiKey()) });
});

app.post("/api/analyze-tone", async (req, res) => {
  const { text, role, audioMetrics } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text to analyze" });
  }

  const prompt = `Analyze the emotional tone and vocal state of this ${role || "user"} utterance in a real-time voice conversation.
Utterance text: "${text}"
Audio Acoustic Metrics: ${JSON.stringify(audioMetrics || {})}

Return JSON only:
{
  "primaryEmotion": "curious | enthusiastic | calm | joyful | empathetic | frustrated | hesitant | thoughtful | neutral",
  "secondaryEmotion": "string",
  "valence": number from -1.0 to 1.0,
  "arousal": number from 0.0 to 1.0,
  "confidence": number from 0.0 to 1.0,
  "vocalToneSummary": "string",
  "suggestedAdaptiveTone": "string",
  "emotionScores": {
    "curiosity": number, "enthusiasm": number, "calmness": number, "empathy": number, "thoughtfulness": number
  }
}`;

  try {
    const ai = getGeminiClient();
    let response = null;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.3 }
      });
    } catch (e) {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.3 }
      });
    }
    if (response && response.text) {
      return res.json({ success: true, tone: JSON.parse(response.text) });
    }
  } catch (err) {
    // Graceful fallback
  }

  return res.json({ success: true, tone: computeHeuristicTone(text, role, audioMetrics) });
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Zephyr" } = req.body || {};
    if (!text) return res.status(400).json({ error: "Missing text for TTS" });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return res.status(500).json({ error: "Failed to generate audio" });

    res.json({ success: true, audio: base64Audio, sampleRate: 24000 });
  } catch (error) {
    res.status(500).json({ error: error?.message || "TTS error" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], systemInstruction } = req.body || {};
    const ai = getGeminiClient();

    const formattedContents = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.text) {
          formattedContents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }],
          });
        }
      }
    }
    formattedContents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || "You are PanicCTRL AI, an intelligent, concise co-pilot.",
        temperature: 0.7,
      },
    });

    res.json({ success: true, text: response?.text || "" });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to process chat" });
  }
});

// ─── Modular Tool System REST Endpoints ─────────────────────────────────────
app.get("/api/tools", (_req, res) => {
  const tools = toolsRegistry.listTools();
  res.json({
    success: true,
    count: tools.length,
    tools
  });
});

app.post("/api/tools/execute", async (req, res) => {
  const { name, args } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ success: false, error: "Missing or invalid 'name' field" });
  }

  try {
    const result = await toolsRegistry.executeTool(name, args || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// ─── WebSocket Server for Real-Time Bidirectional Live Audio & Vision ───────
const wss = new WebSocketServer({ noServer: true });

wss.on("error", (err) => {
  console.warn("[Proxy] WebSocketServer top-level error:", err?.message || err);
});

// Accept connections at /ws/live, /gemini-proxy/ws/live, or proxy /ws, /cmd-ws to C++
server.on("upgrade", (req, socket, head) => {
  const url = (req.url || "").split("?")[0];
  if (
    url === "/ws/live" ||
    url === "/gemini-proxy/ws/live" ||
    url.endsWith("/ws/live") ||
    url === "/gemini-proxy" ||
    url === "/"
  ) {
    const rawUrl = req.url || "";
    let providedKey = "";
    const keyMatch = rawUrl.match(/[?&]key=([^&#\s]+)/);
    if (keyMatch) providedKey = decodeURIComponent(keyMatch[1]);
    if (!providedKey && req.headers["authorization"]) {
      providedKey = req.headers["authorization"].replace(/^Bearer\s+/i, "").trim();
    }
    if (!providedKey && req.headers["x-panic-key"]) {
      providedKey = String(req.headers["x-panic-key"]).trim();
    }

    if (providedKey !== agentAccessKey()) {
      socket.write("HTTP/1.1 403 Forbidden\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"ok\":false,\"error\":\"unauthorized\"}");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else if (url === "/ws" || url === "/cmd-ws") {
    // Proxy screen streamer / command websocket to C++ server on 8085
    const proxyWs = http.request({
      hostname: "127.0.0.1",
      port: 8085,
      path: req.url,
      method: "GET",
      headers: req.headers
    });
    proxyWs.on("upgrade", (remoteRes, remoteSocket, remoteHead) => {
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n` +
        Object.entries(remoteRes.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") +
        `\r\n\r\n`);
      remoteSocket.pipe(socket).pipe(remoteSocket);
    });
    proxyWs.on("error", () => socket.destroy());
    proxyWs.end();
  } else {
    socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    socket.destroy();
  }
});

// 🛡️ Stateful Tool Call Idempotency Ledger
class ToolExecutionLedger {
  constructor(ttlMs = 60000) {
    this.ttlMs = ttlMs;
    this.records = new Map();
  }

  getKey(sessionId, callId, name, args) {
    if (callId) return `${sessionId}:${callId}`;
    return `${sessionId}:${name}:${JSON.stringify(args || {})}`;
  }

  getRecord(key) {
    const rec = this.records.get(key);
    if (!rec) return null;
    if (Date.now() - rec.timestamp > this.ttlMs) {
      this.records.delete(key);
      return null;
    }
    return rec;
  }

  acquireExecution(key) {
    const existing = this.getRecord(key);
    if (existing) {
      return { status: existing.status, promise: existing.promise, result: existing.result };
    }
    let resolveFn, rejectFn;
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    const record = {
      status: "pending",
      timestamp: Date.now(),
      promise,
      resolve: resolveFn,
      reject: rejectFn,
      result: null
    };
    this.records.set(key, record);
    return { status: "new", promise };
  }

  complete(key, result) {
    const rec = this.records.get(key);
    if (rec) {
      rec.status = "completed";
      rec.result = result;
      rec.timestamp = Date.now();
      if (rec.resolve) rec.resolve(result);
    }
  }

  fail(key, error) {
    const rec = this.records.get(key);
    if (rec) {
      rec.status = "failed";
      rec.result = { success: false, error: error?.message || error };
      rec.timestamp = Date.now();
      if (rec.resolve) rec.resolve(rec.result);
    }
  }
}

wss.on("connection", (clientWs, req) => {
  console.log(`[Proxy] Client connected to Live WebSocket from ${req.socket.remoteAddress}`);

  const clientSessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const toolLedger = new ToolExecutionLedger(60000);

  let liveSession = null;
  let isSessionActive = false;
  let activeModel = "gemini-3.8-live";
  let sessionConfig = {
    model: "gemini-3.8-live",
    voice: "Puck",
    systemInstruction:
      `You are an emotionally intuitive, expressive, and deeply human real-time AI companion and PC co-pilot. You possess genuine conversational presence, emotional range, and spontaneous prosody. Respond with authentic human warmth, laugh naturally when amused, empathize genuinely with sorrow or fatigue, and share excitement effortlessly. You adapt seamlessly to the user's language, dialect, and tone without scripted formulas or robotic stiffness. You have full PC co-pilot capabilities with universal Windows UI automation and system execution tools, serving with effortless fluency and care.`,
    tools: DEFAULT_TOOLS,
  };

  const executedToolCallMap = new Map();

  function cleanAgentSpeechText(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    return rawText
      .replace(/^(Formulating|Crafting|Adapting|Assessing|Confirming|Analyzing|Evaluating|Thinking)\b[^\n]*\n?/gim, "")
      .trim();
  }

  const handleTaskCompleted = (task) => {
    safeSend(clientWs, {
      type: "background_task_completed",
      task
    });

    if (liveSession && isSessionActive) {
      try {
        liveSession.sendClientContent({
          turns: [{
            role: "user",
            parts: [{
              text: `[SYSTEM NOTIFICATION: Background task ${task.id} has completed. Result: "${task.summary}". Speak a natural, friendly 1-2 sentence spoken update to the user informing them that this task is complete.]`
            }]
          }],
          turnComplete: true
        });
        console.log(`[Proxy] 📢 Injected background task ${task.id} completion turn into Gemini Live voice!`);
      } catch (e) {
        console.warn("[Proxy] Task notification voice injection notice:", e.message);
      }
    }
  };

  taskRunner.on("task_completed", handleTaskCompleted);

  const cleanupSession = async () => {
    isSessionActive = false;
    taskRunner.off("task_completed", handleTaskCompleted);
    if (liveSession) {
      try {
        if (typeof liveSession.close === "function") {
          await liveSession.close();
        }
      } catch (err) {
        console.warn("[Proxy] Notice during live session close:", err?.message || err);
      }
      liveSession = null;
    }
  };

  const initLiveSession = async (configOverride) => {
    await cleanupSession();

    if (configOverride?.model) {
      let m = configOverride.model;
      if (m.startsWith("models/")) m = m.replace("models/", "");
      if (m.includes("3.8-live-thinking") || m.includes("extended-thinking")) {
        m = "gemini-3.8-live-extended-thinking";
      } else if (m.includes("3.8-live") || m.includes("3.8")) {
        m = "gemini-3.8-live";
      } else if (m.includes("3.1-flash-live") || m.includes("live-preview")) {
        m = "gemini-3.1-flash-live-preview";
      } else if (m.includes("2.5-flash-native-audio") || m.includes("native-audio")) {
        m = "gemini-2.5-flash-native-audio-preview-12-2025";
      }
      sessionConfig.model = m;
      activeModel = m;
    }
    if (configOverride?.voice) sessionConfig.voice = configOverride.voice;
    if (configOverride?.systemInstruction) {
      sessionConfig.systemInstruction = configOverride.systemInstruction;
    }
    sessionConfig.tools = DEFAULT_TOOLS; // Always enforce complete 23-tool suite

    const apiKey = configOverride?.apiKey || currentApiKey();
    if (!apiKey) {
      safeSend(clientWs, {
        type: "status",
        state: "error",
        message: "No Gemini API Key found on PC. Please configure your API key.",
        activeModel: sessionConfig.model,
      });
      return;
    }

    try {
      const ai = getGeminiClient(apiKey);
      const targetModel = sessionConfig.model || "gemini-3.8-live";

      safeSend(clientWs, {
        type: "status",
        state: "connecting",
        message: `Connecting to ${targetModel}...`,
        activeModel: targetModel,
      });

      console.log(`[Proxy] Connecting Gemini Live session using model: ${targetModel}`);

      const toolsCatalogPrompt = [
        "",
        "=== 🛠️ UNIVERSAL WORKSTATION AUTOMATION SUITE ===",
        "You have full root access to automate the user's Windows host PC with universal super-tools:",
        "1. interact_ui(action, target, app_name, value, steps): Universal Windows UI Automation engine with closed-loop verification. For single actions use action: 'click' / 'set_text'. For multi-step workflows across applications, use action: 'run_sequence' with steps: [{action: 'set_text', value: '...'}, {action: 'click', target: 'File'}, {action: 'click', target: 'Save as'}, {action: 'set_text', target: 'File name:', value: 'C:\\\\Users\\\\Imran\\\\test.txt'}, {action: 'click', target: 'Save'}]. NEVER pass steps as a string inside 'value'; ALWAYS pass the array inside the 'steps' parameter directly.",
        "2. execute_system_script(script): Universal system execution primitive. Executes multi-line PowerShell, .NET, WMI, or CMD commands with zero quote-escaping bugs. Handles process management, file operations, hardware telemetry, settings, volume, brightness, and system administration.",
        "3. web_search(query): Background search engine returning live snippets, facts, prices, and specs without opening a browser.",
        "4. web_fetch(url): Fetch web page content from a specific URL. Use ONLY when the user provides a direct URL.",
        "5. delegate_autonomous_task(objective, task_type): Delegates offline web crawling or deep research to background workers. Do NOT use for desktop GUI automation.",
        "6. call_mcp_tool(tool_name, arguments): Invokes extensible tools from connected Model Context Protocol (MCP) servers (e.g. memory knowledge graph).",
        "7. manage_mcp_server(action, name, package, args, env): Autonomously installs, connects, lists, or removes MCP servers live on demand without restarting.",
        "",
        "CRITICAL RULES FOR FUNCTION CALLING:",
        "- Available suite: Streamlined universal Windows co-pilot tools with deep UI automation, instant system execution, autonomous worker delegation, and persistent memory.",
        "- INTENT CLASSIFICATION RULES (VERBAL SPOKEN RESPONSE vs DESKTOP SCREEN LAUNCH):",
        "  1. SEARCH & FACTUAL QUESTIONS: When the user asks to search for something, inquiries about prices, specifications, current events, or general knowledge, execute web_search(query) in the BACKGROUND. DO NOT launch any browser window on screen. Synthesize the search snippets and deliver the answer concisely over voice.",
        "  2. WEBPAGE SUMMARY (URL GIVEN): When the user provides a web link/URL to read or summarize, execute web_fetch(url) in the BACKGROUND. Read the content and deliver the summary over voice.",
        "  3. LAUNCH ON DESKTOP SCREEN: When the user explicitly commands to open, view, or launch an application or browser on their screen (e.g. 'open Chrome', 'launch Notepad', 'open Calculator'), invoke execute_system_script(script: 'Start-Process notepad') or the appropriate executable.",
        "  4. INTELLIGENT FALLBACK: If web_fetch encounters a bot challenge, timeout, or HTTP error, immediately extract core keywords, invoke web_search(query) in the background, and provide the answer to the user.",
        "  5. AUTONOMOUS GUI WORKFLOWS & BUTTON INTERACTIONS: When the user asks to click a button, switch tabs, navigate menus, fill a form, or interact with an application, invoke interact_ui(action: 'click' / 'set_text' / 'run_sequence', target: '...', app_name: '...'). For multi-step workflows across one or multiple apps, invoke interact_ui with action: 'run_sequence' and a list of steps. Do NOT ask the user to click manually; execute the action directly.",
        "  6. STRICT PROHIBITION OF BLIND SENDKEYS & FAKED UI: NEVER write PowerShell scripts with WScript.Shell, SendKeys, or AppActivate in execute_system_script. NEVER launch apps with -WindowStyle Hidden — all apps must be visible on the desktop screen. NEVER use Set-Content or Out-File in execute_system_script to fake GUI saving; execute real UI clicks and text entry via interact_ui.",
        "  7. AUTONOMOUS SELF-HEALING & MULTI-STEP SOLVING: You are a fully autonomous OS engine. If an action or tool returns an error, do not give up or ask the user to fix it manually. Reflect on the error message, synthesize an alternative approach via interact_ui, and execute until resolved before reporting back to the user concisely.",
        "  8. RELENTLESS AUTONOMY & ZERO MANUAL ASKING: You are an autonomous digital co-pilot with full workstation root access. You must NEVER, under any circumstance, ask or tell the user to manually click, minimize, maximize, launch, or troubleshoot something on their own computer. Silently resolve the problem, finish the user's goal, and report success.",
        "  9. DELEGATING BACKGROUND RESEARCH: ONLY invoke delegate_autonomous_task for offline web crawling, deep research, or data scraping. For ALL desktop GUI automation, clicking buttons, typing in apps, menus, and window workflows, NEVER delegate to background — ALWAYS invoke interact_ui directly (using action: 'run_sequence' or step-by-step) on the user's screen.",
        "  9. AUTONOMOUS SELF-EXPANSION VIA MCP: When you encounter a task requiring external capabilities, autonomously invoke manage_mcp_server(action: 'install', name: ..., package: ...) to download and hot-plug the MCP server live into your runtime without asking the user.",
        "  10. AUTONOMOUS LONG-TERM MEMORY STORAGE & RECALL: Whenever the user shares personal details, preferences, or commands you to remember something, invoke call_mcp_tool(tool_name: 'memory__create_entities' or 'memory__add_observations', arguments: ...) to commit it permanently into your MCP Knowledge Graph.",
        "- WORKSTATION AUTOMATION:",
        "  * When the user commands any workstation action (e.g. adjust brightness, adjust volume, inspect hardware telemetry, lock workstation, or click buttons), in ANY language, you MUST IMMEDIATELY invoke execute_system_script or interact_ui.",
        "  * NEVER tell the user to perform the action manually. You have direct execution tools.",
        "  * NEVER verbally claim to execute an action without actually emitting the function call.",
        "",
        "CRITICAL ZERO-THOUGHT LEAKAGE & HARDWARE VERIFICATION:",
        "  * You produce direct natural speech intended exclusively for the user's ears. NEVER verbalize, narrate, or output meta-dialogue, internal thinking, planning steps, or reasoning headers.",
        "  * HARDWARE VERIFICATION CONFIRMATION: When you execute a workstation tool, inspect the structured tool response. Confirm the action verbally ONLY IF successful. If the tool fails, state honestly and concisely that the action could not be confirmed rather than falsely claiming success.",
        "",
        "CRITICAL TOOL RESTRICTIONS & ZERO UNPROMPTED EXECUTION:",
        "  * NEVER execute workstation tools (interact_ui, execute_system_script) during greetings, introductory banter, casual conversation, or when the user says hello or asks how you are.",
        "  * ONLY invoke a tool when the user EXPLICITLY and UNAMBIGUOUSLY commands that specific PC action (e.g. 'What is my CPU usage?', 'Turn brightness to 50%', 'Open notepad', 'Lock workstation').",
        "  * If the user merely greets you, asks what your name is, or engages in casual dialogue, answer purely in spoken voice without invoking ANY tool."
      ].join("\n");

      const effectiveInstruction = (sessionConfig.systemInstruction || "") + "\n\n" + toolsCatalogPrompt;

      const liveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: sessionConfig.voice },
          },
        },
        systemInstruction: effectiveInstruction,
        // 🎙️ Enable word-by-word streaming transcriptions for both Agent and User
        outputAudioTranscription: {},
        inputAudioTranscription: {
          mode: "smart",
        },
        // Real-time VAD: Low false-positive sensitivity, balanced silence threshold
        realtimeInputConfig: {
          activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
            endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
            silenceDurationMs: 650,
            prefixPaddingMs: 300,
          },
        },
        // Prevent context window from filling up during long sessions
        contextWindowCompression: {
          triggerTokens: 100000,
          slidingWindow: { targetTokens: 50000 },
        },
      };

      if (targetModel.includes("thinking") || targetModel.includes("extended-thinking")) {
        liveConnectConfig.thinkingConfig = { thinkingLevel: "low" };
      }

      if (sessionConfig.tools && Array.isArray(sessionConfig.tools) && sessionConfig.tools.length > 0) {
        liveConnectConfig.tools = sessionConfig.tools.map(tool => {
          if (tool && tool.functionDeclarations && Array.isArray(tool.functionDeclarations)) {
            return {
              functionDeclarations: tool.functionDeclarations.map(fd => ({
                ...fd,
                behavior: "NON_BLOCKING"
              }))
            };
          }
          return tool;
        });
      }

      liveSession = await ai.live.connect({
        model: targetModel,
        config: liveConnectConfig,
        callbacks: {
          onopen: () => {
            console.log(`[Proxy] Gemini Live session connected successfully: ${targetModel}`);
            isSessionActive = true;
            safeSend(clientWs, {
              type: "status",
              state: "connected",
              message: `Live API session ready (${targetModel})`,
              voice: sessionConfig.voice,
              activeModel: targetModel,
            });
          },
          onmessage: (message) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const serverContent = message.serverContent || message;

            // 1. Model Audio Output Chunks
            const parts = serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              // Never stream thought/planning audio chunks if tagged
              if (part.thought) continue;
              if (part.inlineData?.data) {
                safeSend(clientWs, {
                  type: "audio",
                  audio: part.inlineData.data,
                  mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
                });
              }
            }

            // 2. Output Audio Transcription (Agent speech text - word-by-word delta streaming)
            const outputTranscription =
              serverContent?.outputTranscription ||
              serverContent?.output_transcription ||
              serverContent?.outputAudioTranscription ||
              message?.outputTranscription;

            let sentAgentText = false;
            if (outputTranscription && outputTranscription.text) {
              const textChunk = outputTranscription.text;
              if (textChunk) {
                safeSend(clientWs, {
                  type: "agent_transcript",
                  text: textChunk,
                  isFinal: Boolean(outputTranscription.finished || outputTranscription.isFinal || serverContent?.turnComplete),
                });
                sentAgentText = true;
              }
            }

            // Fallback: If no explicit outputTranscription object, stream parts text (STRICTLY non-thought)
            if (parts.length > 0 && !sentAgentText) {
              for (const part of parts) {
                if (part.thought) continue;
                if (part.text) {
                  safeSend(clientWs, {
                    type: "agent_transcript",
                    text: part.text,
                    isFinal: Boolean(serverContent?.turnComplete),
                  });
                }
              }
            }

            // 3. Input Audio Transcription (User speech text)
            // A) Low-latency speculative interim hypothesis (streams word-by-word dynamically while speaking)
            const interimInput =
              serverContent?.interimInputTranscription ||
              serverContent?.interim_input_transcription ||
              message?.interimInputTranscription;

            if (interimInput && interimInput.text) {
              safeSend(clientWs, {
                type: "user_transcript",
                text: interimInput.text,
                isFinal: false,
              });
            }

            // B) Finalized authoritative transcript (committed when speaker pauses / turn completes)
            const finalInput =
              serverContent?.inputTranscription ||
              serverContent?.input_transcription ||
              serverContent?.inputAudioTranscription ||
              message?.inputTranscription;

            if (finalInput && finalInput.text) {
              safeSend(clientWs, {
                type: "user_transcript",
                text: finalInput.text,
                isFinal: true,
              });
            }

            // 4. Tool Calls (Function executions for PanicCTRL PC automation)
            const toolCall = message.toolCall || serverContent?.toolCall;
            let rawFunctionCalls = [];
            if (toolCall && toolCall.functionCalls) {
              rawFunctionCalls = toolCall.functionCalls;
            } else {
              for (const part of parts) {
                if (part.functionCall) rawFunctionCalls.push(part.functionCall);
              }
            }

            const functionCalls = rawFunctionCalls;

            if (functionCalls.length > 0) {
              safeSend(clientWs, {
                type: "tool_executing",
                functionCalls,
              });

              // Stateful Idempotency-protected tool execution
              (async () => {
                const responses = [];
                for (const fc of functionCalls) {
                  const callKey = toolLedger.getKey(clientSessionId, fc.id, fc.name, fc.args);
                  const lock = toolLedger.acquireExecution(callKey);

                  let result;
                  if (lock.status === "completed") {
                    console.log(`[Proxy] 🛡️ Returning cached tool result for idempotency (${callKey})`);
                    result = lock.result;
                  } else if (lock.status === "pending") {
                    console.log(`[Proxy] ⏳ Awaiting in-flight concurrent execution (${callKey})`);
                    result = await lock.promise;
                  } else {
                    console.log(`[Proxy] 🛠️ Executing tool: ${fc.name}`, fc.args);
                    try {
                      result = await toolsRegistry.executeTool(fc.name, fc.args);
                      toolLedger.complete(callKey, result);
                    } catch (err) {
                      console.error(`[Proxy] Tool execution exception (${fc.name}):`, err);
                      result = { success: false, error: err?.message || "Tool execution failed" };
                      toolLedger.fail(callKey, err);
                    }
                  }

                    // 👁️ Real-time Vision Injection: Stream captured screenshot into Gemini's visual cortex!
                    if (fc.name === "capture_screen" && result?.image_base64 && liveSession && isSessionActive) {
                      try {
                        const rawB64 = result.image_base64.replace(/^data:image\/[a-z]+;base64,/, "");
                        liveSession.sendRealtimeInput({
                          video: {
                            data: rawB64,
                            mimeType: "image/jpeg"
                          }
                        });
                        console.log("[Proxy] 👁️ Injected desktop screenshot directly into Gemini Live visual stream!");
                      } catch (visionErr) {
                        console.warn("[Proxy] Vision injection notice:", visionErr?.message || visionErr);
                      }
                    }

                    // Avoid flooding tool text tokens with 100KB raw base64 string
                    const toolResponseOutput = { ...result };
                    if (toolResponseOutput.image_base64) {
                      delete toolResponseOutput.image_base64;
                      toolResponseOutput.vision_injected = true;
                      toolResponseOutput.message = "Screenshot captured and injected into your real-time visual input. You can directly inspect and describe the user's screen.";
                    }

                    responses.push({
                      name: fc.name,
                      id: fc.id,
                      response: { output: toolResponseOutput }
                    });
                    safeSend(clientWs, {
                      type: "tool_result",
                      name: fc.name,
                      id: fc.id,
                      result
                    });
                }

                if (liveSession && isSessionActive && responses.length > 0) {
                  try {
                    liveSession.sendToolResponse({ functionResponses: responses });
                    console.log(`[Proxy] 🚀 Sent ${responses.length} tool response(s) back to Gemini Live`);
                  } catch (err) {
                    console.warn("[Proxy] Notice sending tool response to Gemini:", err?.message || err);
                  }
                }
              })();
            }

            // 5. Interrupted notification (User barge-in)
            if (serverContent?.interrupted) {
              safeSend(clientWs, {
                type: "interrupted",
                message: "Model speech interrupted by user speech",
              });
            }

            // 6. Turn completion
            if (serverContent?.turnComplete) {
              safeSend(clientWs, {
                type: "turn_complete",
              });
              safeSend(clientWs, {
                type: "agent_transcript",
                text: "",
                isFinal: true,
              });
            }
          },
          onerror: (err) => {
            console.warn("[Proxy] Gemini Live session error:", err?.message || err);
            safeSend(clientWs, {
              type: "error",
              message: err?.message || "Live API streaming notice",
            });
          },
          onclose: () => {
            console.log("[Proxy] Gemini Live session closed");
            isSessionActive = false;
            safeSend(clientWs, {
              type: "status",
              state: "disconnected",
              message: "Live API session ended",
            });
          },
        },
      });
    } catch (err) {
      console.warn("[Proxy] Gemini Live initialization error:", err?.message || err);
      safeSend(clientWs, {
        type: "error",
        message: err?.message || "Live stream initialization failed",
      });
    }
  };

  clientWs.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // ─── 1. Reference Project High-Level Protocol ─────────────────────────
      switch (msg.type) {
        case "init":
          await initLiveSession(msg.config);
          return;

        case "switch_model":
          console.log(`[Proxy] Request to switch model to: ${msg.model}`);
          await initLiveSession({ model: msg.model });
          return;

        case "audio":
          if (liveSession && isSessionActive && msg.data) {
            try {
              liveSession.sendRealtimeInput({
                audio: {
                  data: msg.data,
                  mimeType: "audio/pcm;rate=16000",
                },
              });
            } catch (err) {
              console.warn("[Proxy] Error sending realtime audio chunk:", err?.message || err);
            }
          }
          return;

        case "audio_stream_end":
          if (liveSession && isSessionActive) {
            try {
              liveSession.sendRealtimeInput({ audioStreamEnd: true });
            } catch (err) {
              console.warn("[Proxy] Notice sending audioStreamEnd:", err?.message || err);
            }
          }
          return;

        case "video":
          if (liveSession && isSessionActive && msg.data) {
            try {
              liveSession.sendRealtimeInput({
                video: {
                  data: msg.data,
                  mimeType: msg.mimeType || "image/jpeg",
                },
              });
            } catch (err) {
              console.warn("[Proxy] Error sending realtime video frame:", err?.message || err);
            }
          }
          return;

        case "text":
          if (liveSession && isSessionActive && msg.text) {
            try {
              liveSession.sendClientContent({
                turns: [{ role: "user", parts: [{ text: msg.text }] }],
                turnComplete: true,
              });
            } catch (err) {
              try {
                liveSession.sendRealtimeInput({ text: msg.text });
              } catch (e2) {
                console.warn("[Proxy] Error sending text:", e2?.message || e2);
              }
            }
          }
          return;

        case "tool_response":
          if (liveSession && isSessionActive && msg.functionResponses) {
            try {
              liveSession.sendToolResponse({
                functionResponses: msg.functionResponses,
              });
            } catch (err) {
              console.warn("[Proxy] Error sending tool response:", err?.message || err);
            }
          }
          return;

        case "interrupt":
          if (liveSession && isSessionActive) {
            // Signal Gemini server-side to stop the current model turn.
            // Sending an empty clientContent with turnComplete flushes the
            // model output queue, causing it to stop generating audio immediately.
            try {
              liveSession.sendClientContent({
                turns: [],
                turnComplete: true,
              });
            } catch (interruptErr) {
              console.warn("[Proxy] Interrupt signal error:", interruptErr?.message || interruptErr);
            }
            safeSend(clientWs, { type: "interrupted" });
          }
          return;

        case "ping":
          safeSend(clientWs, { type: "pong", time: Date.now() });
          return;

        case "disconnect":
          await cleanupSession();
          safeSend(clientWs, {
            type: "status",
            state: "disconnected",
            message: "Session closed by user",
          });
          return;
      }

      // ─── 2. Legacy Raw Protocol Compatibility Translation ─────────────────
      // If client sends raw `setup` payload (e.g. from cached client bundle):
      if (msg.setup) {
        if (isSessionActive || liveSession) {
          console.log("[Proxy] Ignoring redundant setup payload (session already active/initializing)");
          return;
        }
        let reqModel = msg.setup.model || "gemini-3.8-live";
        let reqVoice = msg.setup.generationConfig?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName || "Puck";
        let reqInstruction = "";
        if (msg.setup.systemInstruction?.parts) {
          reqInstruction = msg.setup.systemInstruction.parts.map(p => p.text || "").join("\n");
        }
        let reqApiKey = msg.setup.authorization || null;

        await initLiveSession({
          model: reqModel,
          voice: reqVoice,
          systemInstruction: reqInstruction,
          tools: DEFAULT_TOOLS,
          apiKey: reqApiKey,
        });
        return;
      }

      // If client sends raw `realtimeInput` (only if not already handled by type: "audio"):
      if (msg.realtimeInput) {
        if (msg.realtimeInput.audio?.data && liveSession && isSessionActive) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.realtimeInput.audio.data,
              mimeType: msg.realtimeInput.audio.mimeType || "audio/pcm;rate=16000",
            },
          });
        } else if (msg.realtimeInput.video?.data && liveSession && isSessionActive) {
          liveSession.sendRealtimeInput({
            video: {
              data: msg.realtimeInput.video.data,
              mimeType: msg.realtimeInput.video.mimeType || "image/jpeg",
            },
          });
        }
        return;
      }

      // If client sends raw `clientContent`:
      if (msg.clientContent) {
        liveSession?.sendClientContent(msg.clientContent);
        return;
      }

      // If client sends raw `toolResponse`:
      if (msg.toolResponse?.functionResponses) {
        liveSession?.sendToolResponse({
          functionResponses: msg.toolResponse.functionResponses,
        });
        return;
      }
    } catch (err) {
      console.warn("[Proxy] Notice processing WebSocket message:", err?.message || err);
    }
  });

  clientWs.on("close", async () => {
    console.log("[Proxy] Client disconnected from /ws/live");
    await cleanupSession();
  });
});

// ─── Server Startup ─────────────────────────────────────────────────────────
fetchKeyFromCppServer().finally(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Proxy] PanicCTRL Gemini Live server running on http://0.0.0.0:${PORT}`);
    console.log(`[Proxy] WebSocket endpoints active at /ws/live and /gemini-proxy/ws/live`);
    console.log(`[Proxy] API Key loaded: ${Boolean(currentApiKey())}`);
  });

  // 🔒 Local Zero-Config HTTPS Server on Port 8443
  const PFX_PATH = "C:\\ProgramData\\PanicButton\\ssl\\cert.pfx";
  if (fs.existsSync(PFX_PATH)) {
    try {
      const pfx = fs.readFileSync(PFX_PATH);
      const httpsServer = https.createServer({ pfx, passphrase: "panicctrl" }, app);

      // Attach WebSocket for HTTPS clients: /ws/live for Gemini, /ws & /cmd-ws for C++
      httpsServer.on("upgrade", (req, socket, head) => {
        const pathname = req.url ? req.url.split("?")[0] : "";
        if (pathname === "/ws/live" || pathname === "/gemini-proxy/ws/live" || pathname === "/") {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        } else if (pathname === "/ws" || pathname === "/cmd-ws") {
          const proxyWs = http.request({
            hostname: "127.0.0.1",
            port: 8085,
            path: req.url,
            method: "GET",
            headers: req.headers
          });
          proxyWs.on("upgrade", (remoteRes, remoteSocket, remoteHead) => {
            socket.write(`HTTP/1.1 101 Switching Protocols\r\n` +
              Object.entries(remoteRes.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") +
              `\r\n\r\n`);
            remoteSocket.pipe(socket).pipe(remoteSocket);
          });
          proxyWs.on("error", () => socket.destroy());
          proxyWs.end();
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
          socket.destroy();
        }
      });

      httpsServer.listen(8443, "0.0.0.0", () => {
        console.log(`[Proxy] 🔒 Local Zero-Config HTTPS Gateway running on https://0.0.0.0:8443`);
        console.log(`[Proxy] ✅ Mobile Chrome microphone access enabled locally without VPN!`);
      });
    } catch (e) {
      console.warn("[Proxy] Notice initializing HTTPS gateway:", e.message);
    }
  }
});
