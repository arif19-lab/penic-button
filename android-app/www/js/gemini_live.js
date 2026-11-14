/**

 * 🎙️ GEMINI MULTIMODAL LIVE AI ENGINE

 */

console.log(

  "%c[Gemini Live AI] 🎙️ Engine Loaded & Ready%c Multimodal Live Voice Active",

  "background:linear-gradient(90deg, #1a237e, #0d47a1); color:#00f0ff; font-weight:bold; padding:3px 8px; border-radius:4px; border:1px solid #00f0ff; font-size:12px;",

  "color:#80d8ff; font-weight:bold; font-size:12px; margin-left:6px;"

);



var geminiWs = null;

var audioInputCtx = null;

var audioInputProcessor = null;

var audioInputWorkletNode = null;

var audioInputSource = null;

var audioHighPassFilter = null;

var audioLowPassFilter = null;

// 🔊 Echo-reference envelope: tracks AI playback energy so residual speaker

// bleed can be subtracted from mic RMS before VAD/barge-in decisions.

var _playbackEnvelope = 0;

var _ECHO_SUBTRACT_K = 0.6;

var _ECHO_DECAY_PER_FRAME = 0.82;

var audioPlaybackCtx = null;

var playbackGainNode = null;

var playbackKeepAliveNode = null;

var _isAutoReconnecting = false;

var nextPlayTime = 0;

var liveSpeechRecognizer = null;

var isSpeechRecognizerActive = false;

var accumulatedSpokenText = "";


function initLiveSpeechRecognizer() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("[WebSpeech] Not available in this browser");
    return;
  }

  // Stop any existing recognizer before starting a new one
  if (liveSpeechRecognizer) {
    try { liveSpeechRecognizer.onend = null; liveSpeechRecognizer.stop(); } catch(e) {}
    liveSpeechRecognizer = null;
    isSpeechRecognizerActive = false;
  }

  try {
    var recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = navigator.language || 'en-US';

    console.warn("[WebSpeech] Starting recognizer (lang=" + recognizer.lang + ")");

    recognizer.onresult = function(event) {
      // Don't process when AI is speaking (avoids acoustic feedback)
      if (isGeminiAudioPlaying()) return;

      var liveTranscript = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        liveTranscript += event.results[i][0].transcript + ' ';
      }
      var cleaned = liveTranscript.trim();
      if (!cleaned) return;

      // Only feed Web Speech results until Gemini's server-side transcription arrives
      if (accumulatedSpokenText) return;

      // Feed instantly to Live Transcript HUD (no server roundtrip delay)
      if (window.LiveTranscriptHUD) {
        window.LiveTranscriptHUD.onUserTranscript(cleaned, false);
      }
    };

    recognizer.onend = function() {
      // Keep recognizer alive while session is connected
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        try { recognizer.start(); } catch(e) {}
      } else {
        isSpeechRecognizerActive = false;
      }
    };

    recognizer.onerror = function(event) {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
    };

    recognizer.start();
    liveSpeechRecognizer = recognizer;
    isSpeechRecognizerActive = true;
    console.warn("[WebSpeech] Recognizer started successfully");
  } catch(e) {
    console.warn("[WebSpeech] Failed to start: " + e.message);
  }
}



var blobState = {

  active: false,

  status: "disc",

  micLevel: 0,

  geminiLevel: 0

};



var liveManuallyClosed = false;



var DEFAULT_GEMINI_KEY = "";



// 🛡️ PROXY ARCHITECTURE (reference project parity):

// Gemini Live WS routes through the PC node proxy (gemini-proxy/server.js, port 3001).

// The API key is securely stored on the host PC and never exposed to the client.

// The proxy pipelines the bidirectional Google Live WebSocket stream transparently.

var GEMINI_PROXY_PORT = 3001;

var _proxyHasKey = true; // Default true: PC proxy holds key and serves as primary live backend // set true once /api/health reports the PC proxy holds a key



function geminiProxyWsUrl() {
  var k = (typeof KEY !== "undefined" && KEY) ? KEY : (localStorage.getItem("panic_key") || "");
  var query = k ? "?key=" + encodeURIComponent(k) : "";
  if (typeof getWsUrl === "function") {
    return getWsUrl("/gemini-proxy/ws/live" + query);
  }
  var proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return proto + "//" + window.location.host + "/gemini-proxy/ws/live" + query;
}



function geminiProxyHttpBase() {

  if (typeof getApiUrl === "function") {

    return getApiUrl("/gemini-proxy");

  }

  return "/gemini-proxy";

}



function fetchLocalGeminiKey(callback) {

  fetch("/api/gemini_key?key=" + KEY)

    .then(function(r){ return r.json(); })

    .then(function(d){

      if (d && d.key) {

        DEFAULT_GEMINI_KEY = d.key;

        var saved = localStorage.getItem("gemini_api_key");

        if (!saved || saved.startsWith("AIzaSyCkyi")) {

          localStorage.setItem("gemini_api_key", d.key);

        }

        console.log(

          "%c[Gemini Live AI] 🔑 API Key Synchronized%c (Key configured & authenticated)",

          "background:#004d40; color:#64ffda; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:11px;",

          "color:#a7ffeb; font-size:11px;"

        );

      }

      if (callback) callback();

    })

    .catch(function(){

      if (callback) callback();

    });

}

fetchLocalGeminiKey();
// ⚡ Instantly pre-warm proxy connection in background so port 3001 is awake
try {
  fetch(geminiProxyHttpBase() + "/api/health").catch(function(){});
} catch(e) {}



function selectVoice(v) {

  invalidatePreWarm();

  localStorage.setItem("gemini_voice", v);

  var lbl = document.getElementById("geminiVoiceCurrentName");

  if (lbl) lbl.textContent = v;



  var items = document.querySelectorAll("#geminiVoicePickerPanel .cg-voice-item");

  for (var i = 0; i < items.length; i++) {

    var it = items[i];

    var isMatch = (it.getAttribute("data-voice") === v);

    it.classList.toggle("active", isMatch);

    var chk = it.querySelector(".cg-voice-check");

    if (chk) chk.textContent = isMatch ? "✓" : "";

  }



  closeVoicePicker();

  appendGeminiLog("sys", "[VOICE] Persona set to: " + v);



  if (geminiWs && (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING)) {

    appendGeminiLog("sys", "[VOICE SWITCH] Reconnecting Live session with " + v + "...");

    disconnectGeminiLive();

    setTimeout(connectGeminiLive, 250);

  }

}



function toggleVoicePicker(e) {

  if (e) e.stopPropagation();

  var p = document.getElementById("geminiVoicePickerPanel");

  var caret = document.querySelector("#geminiVoiceTrigger .cg-voice-pill-caret");

  if (!p) return;

  var isOpen = (p.style.display === "block" || p.style.display === "flex");

  p.style.display = isOpen ? "none" : "flex";

  if (caret) {

    caret.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";

    caret.style.transition = "transform 0.18s ease";

  }

  if (!isOpen) {

    closeGeminiModelMenu();

    closeGemini3DotMenu();

    if (typeof closeMiniRailUserPopover === "function") closeMiniRailUserPopover();

    if (typeof closeUserCard === "function") closeUserCard();

    try {

      var btn = document.getElementById("geminiVoiceTrigger");

      var arrow = p.querySelector(".cg-ios-arrow-anchor");

      if (btn && arrow) {

        var btnRect = btn.getBoundingClientRect();

        var panelRect = p.getBoundingClientRect();

        var targetX = (btnRect.left + btnRect.width / 2) - panelRect.left - 11;

        targetX = Math.max(16, Math.min(panelRect.width - 32, targetX));

        arrow.style.left = targetX + "px";

        arrow.style.right = "auto";

      }

    } catch(err) {}

  }

}



function closeVoicePicker() {

  var p = document.getElementById("geminiVoicePickerPanel");

  var caret = document.querySelector("#geminiVoiceTrigger .cg-voice-pill-caret");

  if (p) p.style.display = "none";

  if (caret) caret.style.transform = "rotate(0deg)";

}



function initVoicePicker() {

  var v = localStorage.getItem("gemini_voice") || 

    (window.GEMINI_CONFIG && window.GEMINI_CONFIG.defaultVoice) || "Puck";

  var lbl = document.getElementById("geminiVoiceCurrentName");

  if (lbl) lbl.textContent = v;



  var items = document.querySelectorAll("#geminiVoicePickerPanel .cg-voice-item");

  for (var i = 0; i < items.length; i++) {

    var it = items[i];

    var isMatch = (it.getAttribute("data-voice") === v);

    it.classList.toggle("active", isMatch);

    var chk = it.querySelector(".cg-voice-check");

    if (chk) chk.textContent = isMatch ? "✓" : "";

  }

}



// 🎭 GEMINI AI FULL PERSONA CONTROLLER (Definitions loaded from js/personas.js)

var GEMINI_PERSONAS = (window.GEMINI_PERSONAS) || {};



function getActivePersona() {

  var personas = window.GEMINI_PERSONAS || {};

  var pId = localStorage.getItem("gemini_persona") || "default";

  return personas[pId] || personas.default || { id: "default", name: "Default Assistant", emoji: "⚡", instruction: "" };

}



function getActivePersonaInstruction() {

  var base = (getActivePersona().instruction || "");
  var hist = (typeof getSessionHistoryContext === "function") ? getSessionHistoryContext() : "";
  return base + hist;

}



function togglePersonaPicker(e) {

  if (e && typeof e.stopPropagation === "function") e.stopPropagation();

  var p = document.getElementById("geminiPersonaPickerPanel");

  if (!p) return;

  var isOpen = (p.style.display === "block" || p.style.display === "flex");

  p.style.display = isOpen ? "none" : "flex";

  if (!isOpen) {

    closeSettingsMenu();

    closeVoicePicker();

    closeGeminiModelMenu();

    updatePersonaUI();

  }

}



function closePersonaPicker() {

  var p = document.getElementById("geminiPersonaPickerPanel");

  if (p) p.style.display = "none";

}



function selectPersona(personaId) {

  var personas = window.GEMINI_PERSONAS || {};

  var persona = personas[personaId];

  if (!persona) return;

  localStorage.setItem("gemini_persona", personaId);

  invalidatePreWarm();



  // 1. Update Persona UI checkmark and settings subtitle

  updatePersonaUI();

  closePersonaPicker();



  // 2. Automatically adopt persona signature voice & sync voice UI

  if (persona.voice) {

    localStorage.setItem("gemini_voice", persona.voice);

    var vLbl = document.getElementById("geminiVoiceCurrentName");

    if (vLbl) vLbl.textContent = persona.voice;

    var vItems = document.querySelectorAll("#geminiVoicePickerPanel .cg-voice-item");

    for (var vi = 0; vi < vItems.length; vi++) {

      var vItem = vItems[vi];

      var isVoiceMatch = (vItem.getAttribute("data-voice") === persona.voice);

      vItem.classList.toggle("active", isVoiceMatch);

      var vChk = vItem.querySelector(".cg-voice-check");

      if (vChk) vChk.textContent = isVoiceMatch ? "✓" : "";

    }

  }



  // 3. Respect & preserve user's chosen model (Do NOT force override)

  var userChosenModel = localStorage.getItem("gemini_live_model") || (window.GEMINI_CONFIG && window.GEMINI_CONFIG.model);

  if (!userChosenModel) {

    var targetModel = persona.model || "models/gemini-3.1-flash-live-preview";

    var targetModelLabel = persona.modelLabel || "Gemini 3.1 Flash Live";

    if (window.GEMINI_CONFIG) {

      window.GEMINI_CONFIG.model = targetModel;

    }

    localStorage.setItem("gemini_selected_model", targetModel);

    localStorage.setItem("gemini_live_model", targetModel);

    localStorage.setItem("gemini_model_display_name", targetModelLabel);

    var mTitle = document.getElementById("cgCurrentModelName");

    if (mTitle) mTitle.textContent = targetModelLabel;

  }



  // 4. Log persona switch & greeting in chat

  appendGeminiLog("sys", "[PERSONA ACTIVATED] " + persona.emoji + " Switched to " + persona.name + " (" + persona.tag + ")");

  appendGeminiLog("ai", persona.greeting);



  // 5. Update live session parameters dynamically if open

  pendingTextMessage = "";



  if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {

    appendGeminiLog("sys", "[REALTIME VOICE] Syncing Live session with " + persona.name + " (" + persona.voice + ")...");

    try {

      geminiWs.send(JSON.stringify({

        type: "init",

        config: {

          voice: persona.voice,

          systemInstruction: (typeof getActivePersonaInstruction === "function") ? getActivePersonaInstruction() : ""

        }

      }));

    } catch(e) {}

  }

}



function updatePersonaUI() {

  var current = getActivePersona();

  var subtitle = document.getElementById("cgActivePersonaSubtitle");

  if (subtitle) {

    subtitle.textContent = current.emoji + " " + current.name;

  }

  var subtitleBottom = document.getElementById("cgActivePersonaSubtitleBottom");

  if (subtitleBottom) {

    subtitleBottom.textContent = current.emoji + " " + current.name;

  }

  var subtitleMiniRail = document.getElementById("cgActivePersonaSubtitleMiniRail");

  if (subtitleMiniRail) {

    subtitleMiniRail.textContent = current.emoji + " " + current.name;

  }



  var items = document.querySelectorAll("#geminiPersonaPickerPanel .cg-persona-item");

  for (var i = 0; i < items.length; i++) {

    var it = items[i];

    var isMatch = (it.getAttribute("data-persona") === current.id);

    it.classList.toggle("active", isMatch);

    var chk = it.querySelector(".cg-persona-check");

    if (chk) chk.textContent = isMatch ? "✓" : "";

  }

}



function initPersonaSystem() {

  updatePersonaUI();

}



// 🧠 AI MODEL SELECTION CONTROLLER

function toggleGeminiModelMenu(e) {

  if (e) e.stopPropagation();

  var menu = document.getElementById("geminiModelDropdown");

  var caret = document.querySelector(".cg-model-title .cg-caret");

  if (!menu) return;

  var isOpen = (menu.style.display === "block");

  menu.style.display = isOpen ? "none" : "block";

  if (caret) {

    caret.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";

  }

  if (!isOpen) {

    closeGemini3DotMenu();

    closeVoicePicker();

    if (typeof closeMiniRailUserPopover === "function") closeMiniRailUserPopover();

    if (typeof closeUserCard === "function") closeUserCard();

  }

}



function closeGeminiModelMenu() {

  var menu = document.getElementById("geminiModelDropdown");

  var caret = document.querySelector(".cg-model-title .cg-caret");

  if (menu) menu.style.display = "none";

  if (caret) caret.style.transform = "rotate(0deg)";

}



function selectGeminiModel(modelId, displayName, isLiveModel) {

  invalidatePreWarm();

  var cleanModel = modelId.startsWith("models/") ? modelId.replace("models/", "") : modelId;

  if (cleanModel.indexOf("3.8-live-thinking") !== -1 || cleanModel.indexOf("thinking") !== -1 || cleanModel.indexOf("extended-thinking") !== -1) {

    cleanModel = "gemini-3.8-live-extended-thinking";

  } else {

    cleanModel = "gemini-3.8-live";

  }



  localStorage.setItem("gemini_selected_model", modelId);

  localStorage.setItem("gemini_model_display_name", displayName);



  var titleSpan = document.getElementById("cgCurrentModelName");

  if (titleSpan) titleSpan.textContent = displayName;



  var options = document.querySelectorAll("#geminiModelDropdown .cg-model-option");

  for (var i = 0; i < options.length; i++) {

    var opt = options[i];

    var isMatch = (opt.getAttribute("data-model") === modelId);

    opt.classList.toggle("active", isMatch);

    var chk = opt.querySelector(".cg-model-check");

    if (chk) chk.textContent = isMatch ? "✓" : "";

  }



  if (isLiveModel) {

    if (window.GEMINI_CONFIG) window.GEMINI_CONFIG.model = cleanModel;

    localStorage.setItem("gemini_live_model", cleanModel);

    appendGeminiLog("sys", "[MODEL] Live AI model switched to: " + displayName);

    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {

      try {

        geminiWs.send(JSON.stringify({

          type: "switch_model",

          model: cleanModel

        }));

      } catch(err) {

        disconnectGeminiLive();

        setTimeout(connectGeminiLive, 250);

      }

    }

  } else {

    if (window.GEMINI_CONFIG) window.GEMINI_CONFIG.restModel = modelId;

    localStorage.setItem("gemini_rest_model", modelId);

    appendGeminiLog("sys", "[MODEL] Text & coding AI model switched to: " + displayName);

  }



  closeGeminiModelMenu();

}



function initModelSelection() {

  var savedLive = localStorage.getItem("gemini_live_model");

  if (!savedLive || savedLive.indexOf("2.5") !== -1 || savedLive.indexOf("3.1") !== -1) {

    savedLive = "gemini-3.8-live";

    localStorage.setItem("gemini_live_model", savedLive);

  }

  if (window.GEMINI_CONFIG) {

    window.GEMINI_CONFIG.model = savedLive;

  }

  var savedRest = localStorage.getItem("gemini_rest_model");

  if (!savedRest || savedRest.indexOf("2.5") !== -1) {

    savedRest = "gemini-2.5-flash";

    localStorage.setItem("gemini_rest_model", savedRest);

  }

  if (window.GEMINI_CONFIG) {

    window.GEMINI_CONFIG.restModel = savedRest;

  }



  var savedName = localStorage.getItem("gemini_model_display_name");
  if (!savedName || savedName.indexOf("2.5") !== -1 || savedName.indexOf("3.1") !== -1) {
    savedName = "Gemini 3.8 Live";
    localStorage.setItem("gemini_model_display_name", savedName);
  }

  var savedModelId = localStorage.getItem("gemini_selected_model");
  if (!savedModelId || savedModelId.indexOf("2.5") !== -1 || savedModelId.indexOf("3.1") !== -1) {
    savedModelId = "models/gemini-3.8-live";
    localStorage.setItem("gemini_selected_model", savedModelId);
  }



  var titleSpan = document.getElementById("cgCurrentModelName");

  if (titleSpan) titleSpan.textContent = savedName;



  var options = document.querySelectorAll("#geminiModelDropdown .cg-model-option");

  for (var i = 0; i < options.length; i++) {

    var opt = options[i];

    var isMatch = (opt.getAttribute("data-model") === savedModelId);

    opt.classList.toggle("active", isMatch);

    var chk = opt.querySelector(".cg-model-check");

    if (chk) chk.textContent = isMatch ? "✓" : "";

  }

}



if (document.readyState === "loading") {

  document.addEventListener("DOMContentLoaded", function() {

    initVoicePicker();

    initPersonaSystem();

    initModelSelection();

    initChatSessionsSystem();

    // ⚡ Pre-warm Gemini connection in background so voice start is instant

    setTimeout(preWarmGeminiConnection, 1000);

  });

} else {

  initVoicePicker();

  initPersonaSystem();

  initModelSelection();

  initChatSessionsSystem();

  // ⚡ Pre-warm Gemini connection in background so voice start is instant

  setTimeout(preWarmGeminiConnection, 1000);

}



// Antigravity Orb: exact reference implementation (Three.js + GLSL).
// Vendored in vendor/antigravity-orb.js and mounted into #antigravityOrbContainer.
var antigravityOrbHandle = null;
var antigravityOrbUpdateTimer = null;
var antigravityOrbLastUser = -1;
var antigravityOrbLastAgent = -1;
var antigravityOrbLastTheme = null;
var antigravityOrbLastMicAnalyser = null;
var antigravityOrbLastAgentAnalyser = null;

var antigravityMicAnalyser = null;
var antigravityAgentAnalyser = null;

function getAntigravityOrbTheme() {
  return document.body.classList.contains("gemini-light") ? "light" : "dark";
}

function getAntigravityOrbState() {
  if (window.LiveTranscriptHUD && typeof window.LiveTranscriptHUD.getState === "function") {
    var hudState = window.LiveTranscriptHUD.getState();
    if (["idle","listening","thinking","speaking","interrupted"].indexOf(hudState) !== -1) return hudState;
  }
  var st = blobState.status;
  if (st === "speak") return "speaking";
  if (st === "listen") return "listening";
  if (st === "conn" || st === "exec" || st === "think") return "thinking";
  if (st === "interrupted") return "interrupted";
  return "idle";
}

function updateAntigravityOrb() {
  if (!antigravityOrbHandle) return;
  var theme = getAntigravityOrbTheme();
  if (theme !== antigravityOrbLastTheme) {
    antigravityOrbLastTheme = theme;
    antigravityOrbHandle.setTheme(theme);
  }
  antigravityOrbHandle.setState(getAntigravityOrbState());
  var micAnalyser = antigravityMicAnalyser;
  var agentAnalyser = antigravityAgentAnalyser;
  if (micAnalyser !== antigravityOrbLastMicAnalyser || agentAnalyser !== antigravityOrbLastAgentAnalyser) {
    antigravityOrbLastMicAnalyser = micAnalyser;
    antigravityOrbLastAgentAnalyser = agentAnalyser;
    antigravityOrbHandle.setAnalysers(micAnalyser, agentAnalyser);
  }
  var userLevel = Math.max(0, Math.min(1, Number(blobState.micLevel) || 0));
  var agentLevel = Math.max(0, Math.min(1, Number(blobState.geminiLevel) || 0));
  if (Math.abs(userLevel - antigravityOrbLastUser) > 0.008 || Math.abs(agentLevel - antigravityOrbLastAgent) > 0.008) {
    antigravityOrbLastUser = userLevel;
    antigravityOrbLastAgent = agentLevel;
    antigravityOrbHandle.setLevels(userLevel, agentLevel);
  }
}

function mountAntigravityOrb() {
  var container = document.getElementById("antigravityOrbContainer");
  if (!container || !window.AntigravityOrb || antigravityOrbHandle) {
    updateAntigravityOrb();
    return;
  }
  antigravityOrbLastTheme = getAntigravityOrbTheme();
  antigravityOrbHandle = window.AntigravityOrb.mount(container, {
    state: getAntigravityOrbState(),
    theme: antigravityOrbLastTheme,
    userAudioLevel: Math.max(0, Math.min(1, Number(blobState.micLevel) || 0)),
    agentAudioLevel: Math.max(0, Math.min(1, Number(blobState.geminiLevel) || 0)),
    micAnalyserNode: antigravityMicAnalyser,
    agentAnalyserNode: antigravityAgentAnalyser,
    onClick: function() { if (typeof handleStudioMicClick === "function") handleStudioMicClick(); }
  });
  antigravityOrbLastUser = Math.max(0, Math.min(1, Number(blobState.micLevel) || 0));
  antigravityOrbLastAgent = Math.max(0, Math.min(1, Number(blobState.geminiLevel) || 0));
  antigravityOrbLastMicAnalyser = antigravityMicAnalyser;
  antigravityOrbLastAgentAnalyser = antigravityAgentAnalyser;
  container.onkeydown = function(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (typeof handleStudioMicClick === "function") handleStudioMicClick();
    }
  };
  if (antigravityOrbUpdateTimer) clearInterval(antigravityOrbUpdateTimer);
  antigravityOrbUpdateTimer = setInterval(updateAntigravityOrb, 33);
}

function collapseHudTerminal() {
  setHudTerminalExpanded(false);
}

function setHudTerminalExpanded(expanded) {
  var section = document.getElementById("cgHudTerminalSection");
  var btn = document.getElementById("btnToggleHudTerminal");
  var content = document.getElementById("cgHudTerminalContent");
  var count = document.getElementById("cgHudTerminalCount");
  if (!section || !btn || !content) return;
  var currentlyExpanded = section.classList.contains("expanded");
  if (currentlyExpanded === expanded) return;
  section.classList.toggle("expanded", expanded);
  section.classList.toggle("collapsed", !expanded);
  btn.setAttribute("aria-expanded", expanded ? "true" : "false");
  btn.title = expanded ? "Collapse Workstation Terminal logs" : "Expand Workstation Terminal logs";
  content.setAttribute("aria-hidden", expanded ? "false" : "true");
  if (expanded && count) {
    count.textContent = "0";
    count.style.display = "none";
    window.setTimeout(function() {
      var logs = document.getElementById("cgHudTerminalLogs");
      if (logs) logs.scrollTop = logs.scrollHeight;
    }, 200);
  }
}

function sanitizeHudTerminalText(text) {
  return escapeHtml(String(text || "")).replace(/\n/g, "<br>");
}

function appendHudTerminalLog(type, cleanText) {
  var logs = document.getElementById("cgHudTerminalLogs");
  var section = document.getElementById("cgHudTerminalSection");
  var badge = document.getElementById("cgHudTerminalBadge");
  var count = document.getElementById("cgHudTerminalCount");
  if (!logs || !section) return false;
  var line = document.createElement("div");
  line.className = "cg-hud-terminal-line";
  var stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  var formatted;
  var lineType = type === "err" ? "err" : (type === "tool" ? "tool" : (type === "out" ? "out" : "sys"));
  if (type === "out" && typeof formatToolOutput === "function") {
    formatted = formatToolOutput(cleanText);
  } else {
    formatted = sanitizeHudTerminalText(cleanText);
  }
  line.innerHTML = '<span class="cg-hud-terminal-prompt">&gt; [' + escapeHtml(stamp) + ']</span>' + '<span class="cg-hud-terminal-text ' + lineType + '">' + formatted + '</span>';
  logs.appendChild(line);
  while (logs.children.length > 120) logs.removeChild(logs.firstElementChild);
  if (badge) {
    var badgeText = lineType === "err" ? "ERROR" : (lineType === "tool" ? "TOOL" : "LOGS");
    badge.textContent = badgeText;
    badge.classList.toggle("err", lineType === "err");
  }
  if (!section.classList.contains("expanded") && count) {
    var nextCount = parseInt(count.textContent || "0", 10) + 1;
    count.textContent = String(nextCount);
    count.style.display = "inline-flex";
  } else {
    logs.scrollTop = logs.scrollHeight;
  }
  return true;
}

function toggleHudTerminal() {
  var section = document.getElementById("cgHudTerminalSection");
  if (!section) return;
  setHudTerminalExpanded(!section.classList.contains("expanded"));
}

function installPWA() {

  if (typeof installPWAApp === 'function') {

    installPWAApp();

  } else {

    alert("To install PanicCTRL as an App:\n1. Tap Chrome 3-dot menu (⋮)\n2. Tap 'Install app' or 'Add to Home screen'");

  }

}



function toggleGeminiKeyModal() {

  var m = document.getElementById("geminiKeyModal");

  if (!m) return;

  var input = document.getElementById("geminiApiKeyInput");

  var saved = localStorage.getItem("gemini_api_key");

  if (saved && saved.startsWith("AIzaSyCkyi")) {

    localStorage.removeItem("gemini_api_key");

    saved = "";

  }

  if (input) input.value = saved || DEFAULT_GEMINI_KEY || "";

  var stBox = document.getElementById("geminiKeyValidationStatus");

  if (stBox) stBox.style.display = "none";

  m.style.display = (m.style.display === "none" || !m.style.display) ? "flex" : "none";

}



function closeGeminiKeyModal() {

  var m = document.getElementById("geminiKeyModal");

  if (m) m.style.display = "none";

}



function toggleApiKeyVisibility() {

  var input = document.getElementById("geminiApiKeyInput");

  var btn = document.getElementById("pwdToggleBtn");

  if (!input) return;

  if (input.type === "password") {

    input.type = "text";

    if (btn) btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  } else {

    input.type = "password";

    if (btn) btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';

  }

}



function testGeminiApiKey() {

  var input = document.getElementById("geminiApiKeyInput");

  var stBox = document.getElementById("geminiKeyValidationStatus");

  var btnTest = document.getElementById("btnTestGeminiKey");

  if (!input || !stBox) return;

  var key = input.value.trim();

  if (!key) {

    stBox.style.display = "block";

    stBox.className = "cg-modal-status-box error";

    stBox.textContent = "❌ Please enter an API key first.";

    return;

  }



  stBox.style.display = "block";

  stBox.className = "cg-modal-status-box loading";

  stBox.textContent = "🔄 Connecting to Google AI Studio & validating...";

  if (btnTest) btnTest.disabled = true;



  fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + key)

    .then(function(r) {

      if (!r.ok) {

        return r.json().then(function(err) {

          throw new Error((err && err.error && err.error.message) ? err.error.message : ("HTTP " + r.status));

        });

      }

      return r.json();

    })

    .then(function(data) {

      if (btnTest) btnTest.disabled = false;

      stBox.className = "cg-modal-status-box success";

      stBox.textContent = "✅ Valid API Key! Successfully connected to Google Gemini API.";

    })

    .catch(function(err) {

      if (btnTest) btnTest.disabled = false;

      stBox.className = "cg-modal-status-box error";

      stBox.textContent = "❌ Key Validation Failed: " + err.message;

    });

}



function saveGeminiApiKey() {

  var input = document.getElementById("geminiApiKeyInput");

  var stBox = document.getElementById("geminiKeyValidationStatus");

  if (!input) return;

  var key = input.value.trim();

  if (!key) {

    if (stBox) {

      stBox.style.display = "block";

      stBox.className = "cg-modal-status-box error";

      stBox.textContent = "❌ Please enter an API key before saving.";

    }

    return;

  }



  localStorage.setItem("gemini_api_key", key);

  DEFAULT_GEMINI_KEY = key;



  // Persist to host backend C:\ProgramData\PanicButton\gemini_key.txt

  fetch("/api/gemini_key?key=" + KEY, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ key: key })

  }).catch(function(){});



  // Ping the Gemini proxy so its next live connect picks up the new key

  // instantly (the proxy also re-reads the key file on every connect).

  try {

    fetch(geminiProxyHttpBase() + "/api/reload-key", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: "{}"

    }).catch(function(){});

  } catch(e) {}



  appendGeminiLog("sys", "🔑 [KEY] Gemini API Key saved and synchronized across devices.");

  closeGeminiKeyModal();

}



function removeGeminiApiKey() {

  localStorage.removeItem("gemini_api_key");

  DEFAULT_GEMINI_KEY = "";

  var input = document.getElementById("geminiApiKeyInput");

  if (input) input.value = "";

  var stBox = document.getElementById("geminiKeyValidationStatus");

  if (stBox) {

    stBox.style.display = "block";

    stBox.className = "cg-modal-status-box success";

    stBox.textContent = "🗑️ Gemini API key removed.";

  }



  // Clear on host backend

  fetch("/api/gemini_key?key=" + KEY, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ key: "" })

  }).catch(function(){});



  // Tell the Gemini proxy to drop its cached key too (file is gone → next

  // connect fetches from the C++ server which also returns empty).

  try {

    fetch(geminiProxyHttpBase() + "/api/reload-key", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: "{}"

    }).catch(function(){});

  } catch(e) {}



  appendGeminiLog("sys", "🗑️ [KEY] Gemini API Key cleared.");

}



function toggleGeminiTerminal() {

  var t = document.getElementById("geminiTerminalBox");

  if (!t) return;

  t.style.display = (t.style.display === "none" || !t.style.display) ? "block" : "none";

}



// 🧠 Centralized Chat Sessions & Multi-Layer Memory Engine
var geminiChatSessions = [];
var currentSessionId = "";
var geminiChatHistory = [];

function initChatSessionsSystem() {
  loadGeminiChatSessions();
  renderSidebarChatHistory();
}

function loadGeminiChatSessions() {}

function saveGeminiChatSessions() {}

function saveGeminiChatHistory() {}

function getSessionById() { return null; }

function getSessionHistoryContext() { return ""; }

function recordTurnInActiveSession() {}

function renderSidebarChatHistory() {}

function switchChatSession() {}

function startNewChatSession() {

  var l = document.getElementById("geminiTerminalLogs");

  if (l) l.innerHTML = "";

  var hero = document.getElementById("geminiHeroGreeting");

  if (hero) hero.style.display = "block";

  currentAiStreamRow = null; currentAiStreamText = "";

  currentUserStreamRow = null; currentUserStreamText = "";

}

function deleteChatSession() {}

function clearAllChatSessions() {}

function formatTurnsForGeminiApi() { return []; }





function clearGeminiTerminal() {

  startNewChatSession();

}







function loadGeminiChatSessions() {

  try {

    var raw = localStorage.getItem("gemini_chat_sessions");

    geminiChatSessions = raw ? JSON.parse(raw) : [];

  } catch(e) {

    geminiChatSessions = [];

  }

  if (!Array.isArray(geminiChatSessions)) {

    geminiChatSessions = [];

  }

  currentSessionId = localStorage.getItem("gemini_current_session_id") || "";

  if (!currentSessionId || !getSessionById(currentSessionId)) {

    if (geminiChatSessions.length > 0) {

      currentSessionId = geminiChatSessions[0].id;

    } else {

      var initialId = "session_" + Date.now();

      var initialSession = {

        id: initialId,

        title: "New Chat",

        createdAt: Date.now(),

        turns: []

      };

      geminiChatSessions.push(initialSession);

      currentSessionId = initialId;

      saveGeminiChatSessions();

    }

  }

  // Sanitize existing sessions: ensure every model turn is preceded by a user turn

  for (var sIdx = 0; sIdx < geminiChatSessions.length; sIdx++) {

    var sess = geminiChatSessions[sIdx];

    if (sess) {

      if (sess.title === "\u09a8\u09a4\u09c1\u09a8 \u0995\u09a5\u09cb\u09aa\u0995\u09a5\u09a8") sess.title = "New Chat";

      if (Array.isArray(sess.turns)) {

        var sanitized = [];

        for (var tIdx = 0; tIdx < sess.turns.length; tIdx++) {

          var turn = sess.turns[tIdx];

          if (turn && turn.parts && turn.parts[0] && (turn.parts[0].text === "🎙️ Voice Message" || turn.parts[0].text.indexOf("\u09ad\u09af\u09bc\u09c7\u09b8") !== -1)) {

            turn.parts[0].text = "🎙️ Voice Message";

          }

          if ((turn.role === "model" || turn.role === "assistant") && (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== "user")) {

            sanitized.push({

              role: "user",

              parts: [{ text: "🎙️ Voice Message" }]

            });

          }

          sanitized.push(turn);

        }

        sess.turns = sanitized;

      }

    }

  }



  var active = getSessionById(currentSessionId);

  geminiChatHistory = (active && active.turns) ? active.turns : [];

}



function saveGeminiChatSessions() {

  try {

    if (geminiChatSessions.length > 30) {

      geminiChatSessions = geminiChatSessions.slice(0, 30);

    }

    localStorage.setItem("gemini_chat_sessions", JSON.stringify(geminiChatSessions));

    localStorage.setItem("gemini_current_session_id", currentSessionId);

  } catch(e) {}

}



function saveGeminiChatHistory() {

  var s = getSessionById(currentSessionId);

  if (s) {

    s.turns = geminiChatHistory;

  }

  saveGeminiChatSessions();

}



function getSessionById(id) {

  for (var i = 0; i < geminiChatSessions.length; i++) {

    if (geminiChatSessions[i].id === id) return geminiChatSessions[i];

  }

  return null;

}



function getSessionHistoryContext() {

  if (!geminiChatHistory || geminiChatHistory.length === 0) return "";

  var summary = [];

  var slice = geminiChatHistory.slice(-10);

  for (var i = 0; i < slice.length; i++) {

    var turn = slice[i];

    var sender = (turn.role === "assistant" || turn.role === "model") ? "Model" : "User";

    var txt = "";

    if (turn.parts && turn.parts[0] && turn.parts[0].text) txt = turn.parts[0].text;

    else if (turn.text) txt = turn.text;

    if (txt && txt.trim()) {

      summary.push(sender + ": " + txt.trim());

    }

  }

  if (summary.length === 0) return "";

  return "\n\n[PRIOR CONVERSATION CONTEXT IN THIS SESSION - YOU MUST REMEMBER THIS CONTEXT AND CONTINUE NATURALLY]:\n" + summary.join("\n");

}



function recordTurnInActiveSession(role, text) {

  if (!text || !text.trim()) return;

  var s = getSessionById(currentSessionId);

  if (!s) {

    s = {

      id: currentSessionId || ("session_" + Date.now()),

      title: "New Chat",

      createdAt: Date.now(),

      turns: []

    };

    currentSessionId = s.id;

    geminiChatSessions.unshift(s);

  }

  // Auto-generate title from first user prompt if still generic

  if (role === "user" && (s.title === "New Chat" || s.title === "🎙️ Voice Message" || s.turns.length === 0)) {

    var rawTitle = text.trim().replace(/^👤 User:\s*/, "").replace(/^PS >\s*/, "");

    if (rawTitle && rawTitle !== "🎙️ Voice Message") {

      if (rawTitle.length > 28) rawTitle = rawTitle.substring(0, 25) + "...";

      s.title = rawTitle;

    }

  }

  s.turns.push({

    role: role === "user" ? "user" : "model",

    parts: [{ text: text.trim() }]

  });

  geminiChatHistory = s.turns;

  saveGeminiChatSessions();

  renderSidebarChatHistory();

}



function renderSidebarChatHistory() {

  var container = document.getElementById("cgSidebarChatHistoryList");

  if (!container) return;

  container.innerHTML = "";

  if (!geminiChatSessions || geminiChatSessions.length === 0) {

    container.innerHTML = '<div class="cg-history-empty-hint">No chat history</div>';

    return;

  }

  for (var i = 0; i < geminiChatSessions.length; i++) {

    var s = geminiChatSessions[i];

    var item = document.createElement("div");

    item.className = "cg-history-item" + (s.id === currentSessionId ? " active" : "");

    item.setAttribute("data-session-id", s.id);

    item.onclick = (function(sid) {

      return function() {

        switchChatSession(sid, true);

        if (window.innerWidth < 860) closeCgSidebar();

      };

    })(s.id);



    var iconSvg = '<svg class="cg-history-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    var titleSpan = '<span class="cg-history-item-title">' + escapeHtml(s.title || "Chat") + '</span>';

    var delBtn = '<button type="button" class="cg-history-item-del" onclick="deleteChatSession(\'' + s.id + '\', event)" title="Delete session">&times;</button>';



    item.innerHTML = iconSvg + titleSpan + delBtn;

    container.appendChild(item);

  }

}



function switchChatSession(sessionId, reconnectLive) {

  var s = getSessionById(sessionId);

  if (!s) return;

  currentSessionId = sessionId;

  geminiChatHistory = s.turns || [];

  localStorage.setItem("gemini_current_session_id", sessionId);



  var l = document.getElementById("geminiTerminalLogs");

  if (l) l.innerHTML = "";

  var hero = document.getElementById("geminiHeroGreeting");



  if (!s.turns || s.turns.length === 0) {

    if (hero) hero.style.display = "block";

  } else {

    if (hero) hero.style.display = "none";

    for (var i = 0; i < s.turns.length; i++) {

      var t = s.turns[i];

      var txt = (t.parts && t.parts[0] && t.parts[0].text) || "";

      if (txt) {

        if (t.role === "user") appendGeminiLog("user", txt);

        else appendGeminiLog("ai", txt);

      }

    }

  }

  currentAiStreamRow = null;

  currentAiStreamText = "";

  currentUserStreamRow = null;

  currentUserStreamText = "";



  renderSidebarChatHistory();



  // If live WebSocket is open, reconnect to initialize clean context for this session

  if (reconnectLive !== false && geminiWs && (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING)) {

    disconnectGeminiLive();

    setTimeout(function() {

      connectGeminiLive();

    }, 200);

  }

}



function startNewChatSession() {

  var newId = "session_" + Date.now();

  var newSession = {

    id: newId,

    title: "New Chat",

    createdAt: Date.now(),

    turns: []

  };

  geminiChatSessions.unshift(newSession);

  currentSessionId = newId;

  saveGeminiChatSessions();

  switchChatSession(newId);

  closeCgSidebar();

}



function deleteChatSession(sessionId, e) {

  if (e && typeof e.stopPropagation === "function") e.stopPropagation();

  geminiChatSessions = geminiChatSessions.filter(function(s) { return s.id !== sessionId; });

  if (currentSessionId === sessionId) {

    if (geminiChatSessions.length > 0) {

      currentSessionId = geminiChatSessions[0].id;

    } else {

      startNewChatSession();

      return;

    }

  }

  saveGeminiChatSessions();

  switchChatSession(currentSessionId);

}



function clearAllChatSessions(e) {

  if (e && typeof e.stopPropagation === "function") e.stopPropagation();

  if (confirm("Are you sure you want to clear all chat history?")) {

    geminiChatSessions = [];

    localStorage.removeItem("gemini_chat_sessions");

    localStorage.removeItem("gemini_current_session_id");

    startNewChatSession();

  }

}



function clearGeminiTerminal() {

  startNewChatSession();

}



function formatTurnsForGeminiApi(turns) {

  var formatted = [];

  var lastRole = null;

  for (var i = 0; i < turns.length; i++) {

    var t = turns[i];

    var role = (t.role === "assistant" || t.role === "model") ? "model" : "user";

    var text = "";

    if (t.parts && t.parts[0] && t.parts[0].text) text = t.parts[0].text;

    else if (t.text) text = t.text;

    if (!text || !text.trim()) continue;



    if (role === lastRole && formatted.length > 0) {

      formatted[formatted.length - 1].parts[0].text += "\n" + text.trim();

    } else {

      formatted.push({

        role: role,

        parts: [{ text: text.trim() }]

      });

      lastRole = role;

    }

  }

  while (formatted.length > 0 && formatted[0].role !== "user") {

    formatted.shift();

  }

  return formatted;

}



var currentAiStreamRow = null;

var currentAiStreamText = "";

var currentUserStreamRow = null;

var currentUserStreamText = "";



function scrollGeminiToBottom(smooth) {

  var scrollArea = document.getElementById("chatgptScrollContainer");

  var logs = document.getElementById("geminiTerminalLogs");

  if (!scrollArea && !logs) return;

  var target = scrollArea || logs;



  // Primary: scrollIntoView on last message — most reliable cross-browser

  if (logs && logs.lastElementChild) {

    try {

      logs.lastElementChild.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });

    } catch(e) {}

  }



  // Fallback: force scrollTop on the container

  try {

    target.scrollTop = target.scrollHeight + 9999;

  } catch(e) {}

}



// 📱 Mobile Virtual Keyboard & Viewport Fix (Native ChatGPT / Gemini parity)

(function initMobileKeyboardHandler() {

  function adjustGeminiViewport() {

    if (!document.body || !document.body.classList.contains('gemini-mode')) return;

    if (window.visualViewport) {

      var vv = window.visualViewport;

      var appContainer = document.querySelector('#tab-gemini .cg-app-container');

      if (appContainer) {

        appContainer.style.height = vv.height + 'px';

        appContainer.style.maxHeight = vv.height + 'px';

      }

    }

    // Prevent the outer browser window / document from scrolling up

    window.scrollTo(0, 0);

    document.body.scrollTop = 0;

    if (document.documentElement) document.documentElement.scrollTop = 0;

    

    // Smoothly ensure the chat stream shows the latest message

    scrollGeminiToBottom(false);

  }



  if (window.visualViewport) {

    window.visualViewport.addEventListener('resize', adjustGeminiViewport);

    window.visualViewport.addEventListener('scroll', function() {

      if (document.body && document.body.classList.contains('gemini-mode')) {

        window.scrollTo(0, 0);

        document.body.scrollTop = 0;

      }

    });

  }



  window.addEventListener('DOMContentLoaded', function() {

    var manualInput = document.getElementById('manualTerminalInput');

    if (manualInput) {

      manualInput.addEventListener('focus', function() {

        setTimeout(function() {

          adjustGeminiViewport();

          scrollGeminiToBottom(true);

        }, 80);

        setTimeout(function() {

          window.scrollTo(0, 0);

          document.body.scrollTop = 0;

        }, 260);

      });

    }

  });

})();





function updateUserSpeechBubble(text, isFinal) {
  var cleanText = String(text || "").replace(/^👤 User:\s*/, "").replace(/^PS >\s*/, "").trim();
  if (!cleanText) return;

  var isListeningPlaceholder = (
    cleanText === "🎙️ Listening..." ||
    cleanText === "Listening..." ||
    cleanText.indexOf("Listening") !== -1 ||
    cleanText.toLowerCase().indexOf("listening") !== -1
  );

  var hero = document.getElementById("geminiHeroGreeting");
  if (hero) hero.style.display = "none";

  // Mark that Gemini's server-side transcription has arrived — this stops
  // the Web Speech fallback from feeding, letting the more accurate server
  // transcription take over seamlessly.
  // Interim chunks are concatenated (like Antigravity's appendTranscriptFragment);
  // final text replaces the accumulated buffer with the complete transcript.
  if (!isListeningPlaceholder) {
    if (isFinal) {
      accumulatedSpokenText = cleanText;
    } else {
      accumulatedSpokenText = accumulatedSpokenText ? accumulatedSpokenText + cleanText : cleanText;
    }
  }

  // 🎙️ Stream User turn into Live Transcript HUD
  if (window.LiveTranscriptHUD) {
    var hudText = isListeningPlaceholder ? cleanText : accumulatedSpokenText;
    window.LiveTranscriptHUD.onUserTranscript(hudText, Boolean(isFinal));
  }

  // NOTE: User speech bubbles in the center terminal stream are permanently removed.
  // Transcriptions exclusively live in the Live Transcript HUD.
  currentUserStreamRow = null;
  currentUserStreamText = "";
  currentAiStreamRow = null;
  currentAiStreamText = "";
}

// 🎙️ Real-Time Word-by-Word Streamer for AI Spoken Responses
function enqueueAiSpokenText(newChunk, isFinal) {
  if (!newChunk && !isFinal) return;

  // 🎙️ Stream Agent turn into Live Transcript HUD
  if (window.LiveTranscriptHUD) {
    window.LiveTranscriptHUD.onAgentTranscript(newChunk, Boolean(isFinal));
  }
}

function appendGeminiLog(type, text, isStreamChunk) {
  var l = document.getElementById("geminiTerminalLogs");
  if (!l) return;

  var cleanText = String(text);

  // Hide Hero Greeting when conversation begins
  var hero = document.getElementById("geminiHeroGreeting");
  if (hero && (type === "user" || type === "ai" || type === "out" || type === "tool" || type === "sys" || type === "err")) {
    hero.style.display = "none";
  }

  if (type === "user") {
    cleanText = cleanText.replace(/^👤 User:\s*/, "").replace(/^PS >\s*/, "").trim();
    if (!cleanText) return;
    updateUserSpeechBubble(cleanText, true);
    return;
  } else if (type === "ai") {
    var rawChunk = String(text || "").replace(/^🧠\s*/, "");
    if (!rawChunk) return;

    // AI speech bubbles are permanently removed from center terminal stream.
    // Forward non-stream AI replies (e.g. static greetings or tool confirmations) to Live Transcript HUD:
    if (!isStreamChunk && window.LiveTranscriptHUD) {
      window.LiveTranscriptHUD.onAgentTranscript(rawChunk, true);
    }
    return;
  } else {
    currentAiStreamRow = null;
    currentAiStreamText = "";
    currentUserStreamRow = null;
    currentUserStreamText = "";

    appendHudTerminalLog(type, cleanText);
  }

  // Auto scroll smooth to bottom

  scrollGeminiToBottom(true);

}



function formatToolOutput(raw) {

  var data = raw;

  if (typeof raw === "string") {

    try {

      var stripped = raw.replace(/^\[TOOL RESULT\]\s*/, "").trim();

      data = JSON.parse(stripped);

    } catch(e) {

      return escapeHtml(raw);

    }

  }



  if (data && data.output) {

    try {

      var parsedInner = JSON.parse(data.output);

      data = parsedInner;

    } catch(e){}

  }



  if (data && data.CPU_Percent !== undefined) {

    return '🖥️ <b>CPU Usage:</b> ' + data.CPU_Percent + '%<br>' +

           '💾 <b>RAM Available:</b> ' + data.RAM_Free_GB + ' GB / ' + data.RAM_Total_GB + ' GB<br>' +

           '🛡️ <b>Security Status:</b> <span style="color:#00ff41; font-weight:bold;">SECURE & NORMAL</span>';

  }



  if (data && data.volume !== undefined) {

    return '🔊 <b>System Master Volume:</b> ' + data.volume + '%';

  }



  if (data && (data.status === "locked" || (data.status === "ok" && data.action === "lock"))) {

    return '🔒 <b>Workstation Status:</b> LOCKED';

  }



  if (data && data.status === "panic") {

    return '⚡ <b>Emergency Panic Defense:</b> ACTIVATED';

  }



  if (data && data.status === "launched") {

    return '🚀 <b>Application Launched:</b> ' + escapeHtml(data.target || "");

  }



  if (data && data.status === "typed") {

    return '⌨️ <b>Text Sent to PC Successfully</b>';

  }



  if (typeof data === "object") {

    var pairs = [];

    for (var k in data) {

      pairs.push('<b>' + escapeHtml(k) + ':</b> ' + escapeHtml(String(data[k])));

    }

    return pairs.join('<br>');

  }



  return escapeHtml(String(raw));

}



function copyCodeSnippet(btn, encoded) {

  try {

    var raw = decodeURIComponent(escape(atob(encoded)));

    if (navigator.clipboard && navigator.clipboard.writeText) {

      navigator.clipboard.writeText(raw).then(function() {

        var orig = btn.innerHTML;

        btn.innerHTML = '<span style="color:#10b981;">✔ Copied!</span>';

        setTimeout(function() { btn.innerHTML = orig; }, 2000);

      });

    } else {

      var ta = document.createElement("textarea");

      ta.value = raw;

      document.body.appendChild(ta);

      ta.select();

      document.execCommand("copy");

      document.body.removeChild(ta);

      var orig = btn.innerHTML;

      btn.innerHTML = '<span style="color:#10b981;">✔ Copied!</span>';

      setTimeout(function() { btn.innerHTML = orig; }, 2000);

    }

  } catch (e) {

    console.error("Copy failed", e);

  }

}



function formatAiText(txt) {

  if (!txt) return "";

  var raw = String(txt);

  

  // 1. Extract & Protect Code Blocks ```lang ... ```

  var codeBlocks = [];

  raw = raw.replace(/```([a-zA-Z0-9_\-\+]*)\n?([\s\S]*?)```/g, function(match, lang, code) {

    var cleanLang = (lang || "code").trim().toLowerCase();

    var displayLang = cleanLang ? cleanLang.toUpperCase() : "CODE";

    var encoded = btoa(unescape(encodeURIComponent(code.trim())));

    

    var blockHtml = 

      '<div class="cg-code-card">' +

        '<div class="cg-code-header">' +

          '<span class="cg-code-lang">' + escapeHtml(displayLang) + '</span>' +

          '<button type="button" class="cg-copy-btn" onclick="copyCodeSnippet(this, \'' + encoded + '\')">' +

            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +

              '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +

              '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +

            '</svg>' +

            '<span>Copy</span>' +

          '</button>' +

        '</div>' +

        '<pre class="cg-code-body"><code>' + escapeHtml(code.trim()) + '</code></pre>' +

      '</div>';

      

    codeBlocks.push(blockHtml);

    return "___CODE_BLOCK_" + (codeBlocks.length - 1) + "___";

  });



  // 2. Escape HTML for safe text

  var html = escapeHtml(raw);



  // 3. Headings

  html = html.replace(/^#### (.*?)$/gm, '<h5 class="cg-md-h5">$1</h5>');

  html = html.replace(/^### (.*?)$/gm, '<h4 class="cg-md-h4">$1</h4>');

  html = html.replace(/^## (.*?)$/gm, '<h3 class="cg-md-h3">$1</h3>');

  html = html.replace(/^# (.*?)$/gm, '<h2 class="cg-md-h2">$1</h2>');



  // 4. Blockquotes / Alerts (> text)

  html = html.replace(/^>\s*(.*?)$/gm, '<blockquote class="cg-md-quote">$1</blockquote>');



  // 5. Horizontal Rules (--- or ***)

  html = html.replace(/^(?:---|___|\*\*\*)$/gm, '<hr class="cg-md-hr">');



  // 6. Bold (**text** or __text__)

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');



  // 7. Italic (*text* or _text_)

  html = html.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');

  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');



  // 8. Strikethrough (~~text~~)

  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');



  // 9. Inline Code (`code`)

  html = html.replace(/`([^`\n]+)`/g, '<code class="cg-inline-code">$1</code>');



  // 10. Links [title](url)

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="cg-md-link">$1 ↗</a>');



  // 11. Bullet Lists (* item or - item)

  html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '<div class="cg-md-list-item"><span class="cg-md-bullet">•</span><span>$1</span></div>');



  // 12. Numbered Lists (1. item)

  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<div class="cg-md-list-item"><span class="cg-md-num">$1.</span><span>$2</span></div>');



  // 13. Line breaks

  html = html.replace(/\n\n+/g, '<div class="cg-md-gap"></div>');

  html = html.replace(/\n/g, '<br>');



  // 14. Restore Code Blocks

  for (var i = 0; i < codeBlocks.length; i++) {

    html = html.replace("___CODE_BLOCK_" + i + "___", codeBlocks[i]);

  }



  return html;

}



function escapeHtml(str) {

  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

}



function showAiTypingIndicator() {
  removeAiTypingIndicator();
  if (window.LiveTranscriptHUD) {
    window.LiveTranscriptHUD.setState('thinking');
  }
}

function removeAiTypingIndicator() {
  var ind = document.getElementById("cgTypingIndicator");
  if (ind) ind.remove();
}



function quickSendChat(text) {

  var inp = document.getElementById("manualTerminalInput");

  if (inp) inp.value = text;

  executeManualTerminalCmd();

}



var pendingTextMessage = "";



function executeManualTerminalCmd() {

  var inp = document.getElementById("manualTerminalInput");

  if (!inp || !inp.value.trim()) return;

  var cmd = inp.value.trim();

  inp.value = "";

  try { inp.focus(); } catch(e) {}



  appendGeminiLog("user", cmd);



  // 1. Intelligent Instant PC Actions (Shortcuts)

  var lower = cmd.toLowerCase().trim();

  if (lower === "lock" || lower === "lock pc" || lower === "lock the pc" || lower === "lock workstation") {

    lockPC();

    var rep = "🔒 **Windows Workstation Locked.**";

    appendGeminiLog("ai", rep);

    recordTurnInActiveSession("user", cmd);

    recordTurnInActiveSession("model", rep);

    return;

  }

  if (lower === "panic" || lower === "panic mode" || lower === "defense" || lower === "emergency") {

    triggerPanic();

    var rep = "⚡ **Emergency Panic Defense Triggered!** Intruder alarm active.";

    appendGeminiLog("ai", rep);

    recordTurnInActiveSession("user", cmd);

    recordTurnInActiveSession("model", rep);

    return;

  }

  if (lower === "sleep" || lower === "sleep pc") {

    sleepPC();

    var rep = "💤 **Putting PC into low-power sleep mode.**";

    appendGeminiLog("ai", rep);

    recordTurnInActiveSession("user", cmd);

    recordTurnInActiveSession("model", rep);

    return;

  }

  if (lower === "status" || lower === "pc status" || lower === "hardware") {

    showAiTypingIndicator();

    recordTurnInActiveSession("user", cmd);

    fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent('$cpu = (Get-CimInstance Win32_Processor).LoadPercentage; $os = Get-CimInstance Win32_OperatingSystem; $ramFree = [math]::Round($os.FreePhysicalMemory / 1024 / 1024, 2); $ramTotal = [math]::Round($os.TotalVisibleMemorySize / 1024 / 1024, 2); @{ CPU_Percent = $cpu; RAM_Free_GB = $ramFree; RAM_Total_GB = $ramTotal } | ConvertTo-Json -Compress'))

      .then(function(r){ return r.json(); })

      .then(function(res){

        removeAiTypingIndicator();

        var out = res.output;

        var rep = "";

        try {

          var p = JSON.parse(out);

          rep = "### 🖥️ Windows Hardware Telemetry\n- **CPU Load:** `" + p.CPU_Percent + "%`\n- **RAM Memory:** `" + p.RAM_Free_GB + " GB` free / `" + p.RAM_Total_GB + " GB` total\n- **Defense Status:** 🟢 `ACTIVE & SECURE`";

        } catch(e) {

          rep = out || "🖥️ Workstation is Online.";

        }

        appendGeminiLog("ai", rep);

        recordTurnInActiveSession("model", rep);

      })

      .catch(function(){

        removeAiTypingIndicator();

        var rep = "🖥️ Workstation is Online and protected by PanicCTRL.";

        appendGeminiLog("ai", rep);

        recordTurnInActiveSession("model", rep);

      });

    return;

  }



  // 2. Pure Gemini 3.1 Live Real-Time WebSocket Engine (Universal Text & Voice) — single model only

  if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {

    showAiTypingIndicator();

    sendTextMessageToGemini(cmd);

  } else if (geminiWs && geminiWs.readyState === WebSocket.CONNECTING) {

    pendingTextMessage = cmd;

    showAiTypingIndicator();

  } else {

    showAiTypingIndicator();

    sendTextToGeminiRest(cmd);

    return;

  }

}



function runLocalCmdFallback(cmd) {

  removeAiTypingIndicator();

  var lower = cmd.toLowerCase().trim();

  

  if (lower.startsWith("hey") || lower.startsWith("hi") || lower.startsWith("hello")) {

    appendGeminiLog("ai", "👋 Hey! I'm doing great — your PC is secure and ready. How can I help you?");

    return;

  }

  

  if (lower.startsWith("help") || lower === "who are you") {

    appendGeminiLog("ai", "👋 I'm **PanicCTRL AI**, your ultra-fast Windows PC assistant. Ask me anything or control your PC (e.g., `lock`, `sleep`, `status`, `panic`).");

    return;

  }

  

  // Only execute in PowerShell if it's explicitly a command or script

  if (lower.startsWith("cmd:") || lower.startsWith("ps:") || lower.startsWith("run ") || lower === "dir" || lower === "ipconfig" || lower === "tasklist" || lower === "ls") {

    var rawCmd = cmd.replace(/^(cmd:|ps:|run\s+)/i, "");

    fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(rawCmd))

      .then(function(r){ return r.json(); })

      .then(function(data){

        if (data && data.output && data.output.trim()) {

          appendGeminiLog("out", data.output);

        } else {

          appendGeminiLog("ai", "Command processed on Windows PC.");

        }

      })

      .catch(function(err){

        appendGeminiLog("err", "Execution failed: " + err);

      });

    return;

  }

  

  appendGeminiLog("ai", "💡 Got your message! Ask me anything, or try PC commands like `lock`, `status`, `sleep`, or `panic`.");

}



function setGeminiStatus(st, titleText, subText) {

  blobState.status = st;

  if (window.LiveTranscriptHUD) {
    var mappedSt = (st === "speak") ? "speaking" :
                   (st === "listen") ? "listening" :
                   (st === "think" || st === "conn" || st === "exec") ? "thinking" :
                   (st === "interrupted") ? "interrupted" : "idle";
    window.LiveTranscriptHUD.setState(mappedSt);
  }

  var dot = document.getElementById("chatStatusDot");

  var stTxt = document.getElementById("chatStatusText");

  var btn = document.getElementById("geminiConnectBtn");

  var vTitle = document.getElementById("geminiVoiceTitle");

  var glow = document.getElementById("geminiAmbientGlow");

  var goLiveBtn = document.getElementById("btnGoLive");

  var goLiveTxt = document.getElementById("goLiveBtnText");



  if (st === "disc") {

    if (dot) { dot.className = "chat-status-dot online"; }

    if (stTxt) { stTxt.textContent = "Neural Link • Ready"; }

    if (btn) { 

      btn.className = "gemini-main-voice-btn"; 

      btn.innerHTML = '<span class="voice-btn-icon">🎙️</span><span class="voice-btn-text">START LIVE VOICE</span>'; 

    }

    if (vTitle) { vTitle.textContent = "🎙️ TAP ORB OR BUTTON TO TALK"; }

    if (glow) { glow.style.background = "radial-gradient(circle, rgba(0, 240, 255, 0.2) 0%, transparent 70%)"; }

    if (goLiveBtn) {

      goLiveBtn.className = "cg-go-live-btn";

    }

  } else {

    if (dot) { dot.className = "chat-status-dot online"; }

    var txtMap = { conn: "Linking Neural Stream...", listen: "Neural Link Active & Listening", speak: "Gemini AI Responding...", exec: "Executing PC Tool..." };

    if (stTxt) { stTxt.textContent = txtMap[st] || st.toUpperCase(); }

    if (btn) { 

      btn.className = "gemini-main-voice-btn connected"; 

      btn.innerHTML = '<span class="voice-btn-icon">✖</span><span class="voice-btn-text">END LIVE SESSION</span>'; 

    }

    if (vTitle && titleText) { 

      vTitle.textContent = "🎙️ " + titleText.toUpperCase(); 

    }

    if (goLiveBtn) {

      if (st === "speak") {

        goLiveBtn.className = "cg-go-live-btn speaking";

      } else if (st === "listen") {

        goLiveBtn.className = "cg-go-live-btn connected listening";

      } else {

        goLiveBtn.className = "cg-go-live-btn connected";

      }

    }

    if (glow) {

      if (st === "speak") {

        glow.style.background = "radial-gradient(circle, rgba(255, 0, 85, 0.3) 0%, transparent 70%)";

      } else if (st === "listen") {

        glow.style.background = "radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, transparent 70%)";

      } else {

        glow.style.background = "radial-gradient(circle, rgba(255, 170, 0, 0.3) 0%, transparent 70%)";

      }

    }

  }

  try { if (typeof updateStudioControlsUI === "function") updateStudioControlsUI(); } catch(e) {}

}



// =============================================================================

// 🛰️ ENTERPRISE GEMINI LIVE DEEP DEV CONSOLE LOGGER

// Provides comprehensive, structured, colored telemetry in browser DevTools

// =============================================================================

var GeminiLiveDevLog = (function() {

  var STYLES = {

    badge: "background:#1a73e8; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    wsOut: "background:#00897b; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    wsIn: "background:#7b1fa2; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    vad: "background:#f57c00; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    bargeIn: "background:#d32f2f; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    tool: "background:#fbc02d; color:#212121; font-weight:bold; padding:2px 6px; border-radius:3px;",

    toolRes: "background:#388e3c; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    turn: "background:#0288d1; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    err: "background:#b71c1c; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    mic: "background:#455a64; color:#fff; font-weight:bold; padding:2px 6px; border-radius:3px;",

    info: "color:#80d8ff; font-weight:normal;",

    ts: "color:#888; font-size:10px; margin-left:6px;"

  };



  var sessionStartTime = 0;

  var turnStartTime = 0;

  var turnAudioChunkCount = 0;

  var turnAudioTotalBytes = 0;

  var outboundAudioChunkCount = 0;

  var outboundSilenceChunkCount = 0;

  var lastVadState = "idle"; // "speech", "hangover", "silence", "idle"

  var userSpeechStartTime = 0;

  var userSpeechEndTime = 0;

  var clientTurnSendTime = 0;

  var lastClientTurnText = "";



  function getTs() {

    var d = new Date();

    var h = String(d.getHours()).padStart(2, '0');

    var m = String(d.getMinutes()).padStart(2, '0');

    var s = String(d.getSeconds()).padStart(2, '0');

    var ms = String(d.getMilliseconds()).padStart(3, '0');

    return h + ":" + m + ":" + s + "." + ms;

  }



  function maskKey(url) {

    if (!url) return "";

    return url.replace(/key=([^&]+)/, function(match, key) {

      if (key.length > 8) return "key=" + key.substring(0, 4) + "..." + key.substring(key.length - 4);

      return "key=***";

    });

  }



  return {

    onConnectStart: function(url) {

      sessionStartTime = performance.now();

      outboundAudioChunkCount = 0;

      outboundSilenceChunkCount = 0;

      lastVadState = "idle";

      userSpeechStartTime = 0;

      userSpeechEndTime = 0;

      console.log(

        "%c[GEMINI LIVE]%c 🚀 Initiating WebSocket connection to: %c" + maskKey(url) + "%c (" + getTs() + ")",

        STYLES.badge, "color:#fff; font-weight:bold;", "color:#4fc3f7;", STYLES.ts

      );

    },



    onWsOpen: function(isPrewarm) {

      var latency = (performance.now() - sessionStartTime).toFixed(1);

      console.log(

        "%c[GEMINI LIVE]%c 🌐 WebSocket connection ESTABLISHED (handshake latency: " + latency + "ms)" + (isPrewarm ? " [PRE-WARMED]" : "") + "%c (" + getTs() + ")",

        STYLES.badge, "color:#a5d6a7; font-weight:bold;", STYLES.ts

      );

    },



    onSetupSent: function(setupPayload) {

      var modelName = (setupPayload && setupPayload.setup && setupPayload.setup.model) || "unknown";

      console.log(

        "%c[GEMINI LIVE -> OUT] 📤%c Client Setup Payload Transmitted (" + modelName + ")%c (" + getTs() + ")",

        STYLES.wsOut, "color:#80cbc4; font-weight:bold;", STYLES.ts

      );

    },



    onSetupComplete: function() {

      var rtt = (performance.now() - sessionStartTime).toFixed(1);

      console.log(

        "%c[GEMINI LIVE <- IN] ✅%c Session Verified (setupComplete received, RTT: " + rtt + "ms) - Multimodal link active!%c (" + getTs() + ")",

        STYLES.wsIn, "color:#c5e1a5; font-weight:bold;", STYLES.ts

      );

    },



    onGoogleVoiceActivity: function(va) {

      var act = "";

      if (typeof va === "string") {

        act = va;

      } else if (va && typeof va === "object") {

        act = va.activity || va.activityType || va.type || va.voiceActivityType || va.state || va.event || "";

        if (!act) {

          try {

            var s = JSON.stringify(va);

            if (/START|BEGIN/i.test(s)) act = "ACTIVITY_START";

            else if (/END|STOP|FINISH/i.test(s)) act = "ACTIVITY_END";

            else act = s;

          } catch(e) {

            act = String(va);

          }

        }

      }



      var isStart = /START|BEGIN/i.test(act) || (va && (va.speechStarted === true || va.started === true));

      var isEnd = /END|STOP|FINISH/i.test(act) || (va && (va.speechEnded === true || va.ended === true || va.finished === true));



      if (isStart) {

        userSpeechStartTime = performance.now();

        userSpeechEndTime = 0;

        console.log(

          "%c[USER SPEECH DETECTED] 🗣️%c Google detected user speaking...%c (" + getTs() + ")",

          "background:#00897b; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:12px;",

          "color:#80cbc4; font-weight:bold; font-size:12px;", STYLES.ts

        );

      } else if (isEnd) {

        userSpeechEndTime = performance.now();

        var dur = userSpeechStartTime > 0 ? ((userSpeechEndTime - userSpeechStartTime) / 1000).toFixed(2) + "s" : "detected";

        console.log(

          "%c[USER SPEECH COMPLETE] 🤫%c User finished speaking (" + dur + ") | Awaiting AI Response...%c (" + getTs() + ")",

          "background:#00897b; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:12px;",

          "color:#b2dfdb; font-weight:bold; font-size:12px;", STYLES.ts

        );

      } else {

        console.log(

          "%c[VOICE ACTIVITY]%c 🎙️ Google Voice Activity: " + act + "%c (" + getTs() + ")",

          STYLES.vad, "color:#ffe082;", STYLES.ts, va

        );

      }

    },



    onMicInitialized: function(sampleRate, filterFreq, isWorklet) {

      console.log(

        "%c[MIC AUDIO IN]%c 🎙️ Audio Capture Initialized | Sample Rate: " + sampleRate + "Hz | High-Pass Filter: " + filterFreq + "Hz (Fan Noise Block) | Engine: " + (isWorklet ? "AudioWorkletNode" : "ScriptProcessorNode") + "%c (" + getTs() + ")",

        STYLES.mic, "color:#b0bec5; font-weight:bold;", STYLES.ts

      );

    },



    onVadSpeechStart: function(rms, threshold, preBufferCount) {

      lastVadState = "speech";

      outboundSilenceChunkCount = 0;

      if (userSpeechStartTime === 0) {

        userSpeechStartTime = performance.now();

      }

      userSpeechEndTime = 0;

      clientTurnSendTime = 0;

      console.log(

        "%c[USER SPEECH DETECTED] 🗣️%c Human voice detected (RMS: " + rms.toFixed(4) + ") | Streaming to Gemini...%c (" + getTs() + ")",

        "background:#00897b; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:12px;",

        "color:#80cbc4; font-weight:bold; font-size:12px;", STYLES.ts

      );

    },



    onVadHangover: function(rms, hangoverFrames) {

      if (lastVadState !== "hangover") {

        lastVadState = "hangover";

      }

    },



    onVadDigitalSilence: function(rms) {

      if (lastVadState === "speech" || lastVadState === "hangover") {

        userSpeechEndTime = performance.now();

        var speechDur = userSpeechStartTime > 0 ? ((userSpeechEndTime - userSpeechStartTime) / 1000).toFixed(2) + "s" : "detected";

        console.log(

          "%c[USER SPEECH COMPLETE] 🤫%c User finished speaking (" + speechDur + ") | Awaiting AI Response...%c (" + getTs() + ")",

          "background:#00897b; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:12px;",

          "color:#b2dfdb; font-weight:bold; font-size:12px;", STYLES.ts

        );

      }

      if (lastVadState !== "silence") {

        lastVadState = "silence";

      }

      outboundSilenceChunkCount++;

    },



    onOutboundSpeechChunk: function(chunkBytes) {

      outboundAudioChunkCount++;

      if (outboundAudioChunkCount === 1 || outboundAudioChunkCount % 25 === 0) {

        console.log(

          "%c[AUDIO OUT]%c 🎤 Outbound User Speech | Chunks sent: " + outboundAudioChunkCount + " (" + chunkBytes + " bytes/chunk, 16kHz PCM16)%c (" + getTs() + ")",

          STYLES.wsOut, "color:#80cbc4;", STYLES.ts

        );

      }

    },



    onBargeInTriggered: function(rms, threshold) {

      console.log(

        "%c[BARGE-IN / INTERRUPTION]%c ⚡ User interruption detected! Vocal RMS: " + rms.toFixed(4) + " > barge-in threshold (" + threshold.toFixed(4) + ") while AI was speaking. Local speaker playback stopped!%c (" + getTs() + ")",

        STYLES.bargeIn, "color:#ff8a80; font-weight:bold;", STYLES.ts

      );

    },



    onServerInterrupted: function() {

      console.log(

        "%c[GEMINI LIVE <- IN]%c 🛑 Server Event: { interrupted: true } - Google confirmed user barge-in; cutting off model turn.%c (" + getTs() + ")",

        STYLES.bargeIn, "color:#ff8a80; font-weight:bold;", STYLES.ts

      );

    },



    onUserTranscription: function(text) {

      lastClientTurnText = text;

      console.log(

        "%c[USER SPOKE] 🗣️%c \"" + text + "\"%c (" + getTs() + ")",

        "background:#00acc1; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px;",

        "color:#80deea; font-size:13px; font-weight:bold; font-style:italic;", STYLES.ts

      );

    },



    onAiTranscriptionChunk: function(text) {

      console.log(

        "%c[AGENT SPOKE] 🤖%c \"" + text + "\"%c (" + getTs() + ")",

        "background:#8e24aa; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px;",

        "color:#e1bee7; font-size:13px; font-weight:bold;", STYLES.ts

      );

    },



    onModelAudioChunk: function(byteLength, mimeType) {

      if (turnAudioChunkCount === 0) {

        turnStartTime = performance.now();

        var latencyMs = -1;

        var latencyLabel = "Response Latency";

        if (userSpeechEndTime > 0) {

          latencyMs = Math.round(turnStartTime - userSpeechEndTime);

          latencyLabel = "Voice Turn-Taking (TTFB)";

        } else if (clientTurnSendTime > 0) {

          latencyMs = Math.round(turnStartTime - clientTurnSendTime);

          latencyLabel = "Text Turn-Taking (TTFB)";

        } else if (userSpeechStartTime > 0) {

          latencyMs = Math.round(turnStartTime - userSpeechStartTime);

          latencyLabel = "Speech-to-Audio";

        }

        if (latencyMs > 0) {

          var latencyTag = latencyMs < 500 ? "🟢 ULTRA-FAST (<500ms)" : (latencyMs < 1000 ? "🟡 FAST (<1s)" : "🔴 SLOW (>1s)");

          console.log(

            "%c[LATENCY / TTFB] ⚡%c " + latencyLabel + ": " + latencyMs + "ms " + latencyTag + "%c (" + getTs() + ")",

            "background:#1b5e20; color:#fff; font-weight:bold; padding:3px 10px; border-radius:3px; font-size:13px; text-shadow:0 1px 2px rgba(0,0,0,0.5);",

            "color:#69f0ae; font-weight:bold; font-size:13px;", STYLES.ts

          );

        }

        console.log(

          "%c[GEMINI LIVE <- AUDIO STREAM] 🔊%c Model 24kHz Audio Stream Beginning..." + (latencyMs > 0 ? " (Latency: " + latencyMs + "ms)" : "") + "%c (" + getTs() + ")",

          STYLES.wsIn, "color:#b39ddb; font-weight:bold;", STYLES.ts

        );

      }

      turnAudioChunkCount++;

      turnAudioTotalBytes += byteLength;

    },



    onModelTurnText: function(text) {

      console.log(

        "%c[AGENT TEXT] 🤖%c \"" + text + "\"%c (" + getTs() + ")",

        "background:#5e35b1; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px;",

        "color:#d1c4e9; font-size:13px; font-weight:bold;", STYLES.ts

      );

    },



    onTurnComplete: function(userText, aiText) {

      var turnDuration = turnStartTime > 0 ? (performance.now() - turnStartTime).toFixed(1) + "ms" : "N/A";

      var approxSec = (turnAudioTotalBytes / (24000 * 2)).toFixed(2) + "s";

      var finalUserText = userText || lastClientTurnText || "";

      var finalAiText = aiText || currentAiStreamText || "";



      // 🏁 UNCOLLAPSED, HIGHLY VISIBLE TURN METRICS LOG

      console.log(

        "%c[TURN COMPLETE] 🏁%c " +

        (finalUserText ? "User: \"" + (finalUserText.length > 50 ? finalUserText.substring(0, 50) + "..." : finalUserText) + "\" ➔ " : "") +

        "AI: \"" + (finalAiText ? (finalAiText.length > 70 ? finalAiText.substring(0, 70) + "..." : finalAiText) : "24kHz Audio Stream") + "\"" +

        " | Audio: " + turnAudioChunkCount + " chunks (~" + approxSec + ") | Duration: " + turnDuration + "%c (" + getTs() + ")",

        "background:#0288d1; color:#fff; font-weight:bold; padding:3px 8px; border-radius:3px; font-size:12px;",

        "color:#81d4fa; font-weight:bold; font-size:12px;", STYLES.ts

      );



      // Reset turn counters

      turnStartTime = 0;

      turnAudioChunkCount = 0;

      turnAudioTotalBytes = 0;

      userSpeechStartTime = 0;

      userSpeechEndTime = 0;

      clientTurnSendTime = 0;

      lastClientTurnText = "";

    },



    onToolCall: function(call) {

      console.log(

        "%c[TOOL CALL RECEIVED] 🛠️%c " + call.name + "(" + JSON.stringify(call.args || {}) + ")%c (" + getTs() + ")",

        STYLES.tool, "color:#fff59d; font-weight:bold;", STYLES.ts

      );

    },



    onToolExecuting: function(callName, args) {

      console.log(

        "%c[TOOL EXECUTING]%c ⚙️ Executing system command for: " + callName + "%c (" + getTs() + ")",

        STYLES.tool, "color:#ffe082;", STYLES.ts, args

      );

    },



    onToolResult: function(callName, resultData, durationMs) {

      console.log(

        "%c[TOOL RESULT] ✅%c " + callName + " completed in " + durationMs + "ms%c (" + getTs() + ")",

        STYLES.toolRes, "color:#a5d6a7; font-weight:bold;", STYLES.ts,

        resultData

      );

    },



    onToolResponseSent: function(callId, callName, resultData) {

      console.log(

        "%c[TOOL RESPONSE SENT -> OUT]%c 📤 Sent functionResponse for: " + callName + " (ID: " + callId + ")%c (" + getTs() + ")",

        STYLES.wsOut, "color:#80cbc4;", STYLES.ts

      );

    },



    onClientTextSent: function(text) {

      lastClientTurnText = text;

      clientTurnSendTime = performance.now();

      userSpeechEndTime = 0;

      console.log(

        "%c[CLIENT TURN -> OUT]%c 💬 Sent User Turn: \"" + (text.length > 80 ? text.substring(0, 80) + "..." : text) + "\"%c (" + getTs() + ")",

        "background:#00796b; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:12px;",

        "color:#80cbc4; font-weight:bold; font-size:12px;", STYLES.ts

      );

    },



    onWsError: function(err) {

      console.error(

        "%c[GEMINI LIVE ERROR]%c ❌ WebSocket Error encountered:%c (" + getTs() + ")",

        STYLES.err, "color:#ef9a9a; font-weight:bold;", STYLES.ts, err

      );

    },



    onWsClose: function(code, reason, wasClean) {

      console.log(

        "%c[GEMINI LIVE CLOSED]%c 🔌 Connection closed | Code: " + code + " | Reason: " + (reason || "None") + " | Clean: " + wasClean + "%c (" + getTs() + ")",

        STYLES.err, "color:#ef9a9a; font-weight:bold;", STYLES.ts

      );

    },



    onSessionDisconnected: function() {

      console.log(

        "%c[GEMINI LIVE]%c 🛑 Session Disconnected and audio pipelines released.%c (" + getTs() + ")",

        STYLES.badge, "color:#ffcdd2;", STYLES.ts

      );

    },



    onRawServerMessage: function(msg) {

      if (!msg) return;

      // Suppress all recognized Google Gemini Live protocol messages

      if (msg.voiceActivity || (msg.serverContent && msg.serverContent.voiceActivity)) return;

      if (msg.sessionResumptionUpdate) return;

      if (msg.setupComplete) return;

      if (msg.toolCall || msg.toolCallCancellation) return;

      if (msg.serverContent) return; // Handled by handleGeminiServerMessage

      if (msg.goAway) return;



      // Only log genuinely unrecognized / unhandled server packets

      console.groupCollapsed(

        "%c[WS MSG IN]%c Unhandled Server Message (" + Object.keys(msg).join(", ") + ")%c (" + getTs() + ")",

        STYLES.wsIn, "color:#ce93d8;", STYLES.ts

      );

      console.log(msg);

      console.groupEnd();

    }

  };

})();

window.GeminiLiveDevLog = GeminiLiveDevLog;



// ✅ SHARED SETUP BUILDER — used by both pre-warm AND real connectGeminiLive()

// Ensures pre-warm and real sessions are IDENTICAL (same tools, voice, persona, etc.)

function geminiResumeKey() {

  var m = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.model) || "gemini-3.8-live";

  return "gemini_session_handle::" + m;

}



function buildGeminiSetupMessage() {

  var toolsPayload = [

    {

      functionDeclarations: [

        { name: "lock_workstation", description: "Locks the Windows workstation instantly." },

        { name: "trigger_panic", description: "Toggles emergency panic defense, sounding intruder alarm and switching to safe virtual desktop." },

        {

          name: "open_application",

          description: "Launches any application, game, browser, or website on Windows (e.g. 'chrome', 'youtube', 'vscode', 'spotify', 'notepad', 'calculator', 'taskmgr', 'explorer', 'terminal').",

          parameters: { type: "OBJECT", properties: { target: { type: "STRING", description: "Name of the app or URL" } }, required: ["target"] }

        },

        {

          name: "web_search",

          description: "Searches Google or YouTube on the PC browser for a specific query.",

          parameters: { type: "OBJECT", properties: { query: { type: "STRING", description: "Search query keywords" }, platform: { type: "STRING", description: "'google' or 'youtube'" } }, required: ["query"] }

        },

        {

          name: "media_control",

          description: "Controls PC audio and media playback (play_pause, next_track, prev_track, volume_up, volume_down, mute). ONLY call when the user explicitly commands: 'volume up', 'volume down', 'mute', 'pause'. NEVER call autonomously during greetings or normal chat.",

          parameters: { type: "OBJECT", properties: { action: { type: "STRING", description: "Action: 'play_pause', 'next', 'prev', 'volume_up', 'volume_down', 'mute'" } }, required: ["action"] }

        },

        {

          name: "set_volume",

          description: "Sets the Windows master volume percentage (0 to 100). ONLY call when the user explicitly asks to set volume to a specific percentage. NEVER call during greetings.",

          parameters: { type: "OBJECT", properties: { level: { type: "INTEGER", description: "Volume percentage 0 to 100" } }, required: ["level"] }

        },

        { name: "get_pc_hardware_status", description: "Gets real-time CPU, RAM, battery, disk space, and lock status of the Windows PC. ONLY call if the user explicitly asks about CPU, RAM, or PC hardware performance. NEVER call autonomously during greetings or conversation." },

        { name: "get_pc_status", description: "Gets current live status of Windows PC. ONLY call when user explicitly asks for workstation status." },

        {

          name: "run_powershell_command",

          description: "Runs a PowerShell command on the Windows host ONLY when the user explicitly says 'run', 'execute', 'check live', or asks for live real-time output.",

          parameters: { type: "OBJECT", properties: { command: { type: "STRING", description: "The PowerShell command to execute on the PC." } }, required: ["command"] }

        },

        {

          name: "type_keyboard",

          description: "Injects text or keystrokes ({ENTER}, {ESC}, {BACKSPACE}, {TAB}) into the active Windows window.",

          parameters: { type: "OBJECT", properties: { text: { type: "STRING", description: "Text or special key to type" } }, required: ["text"] }

        },

        { name: "sleep_pc", description: "Puts the Windows PC into low-power sleep mode." },

        { name: "restart_pc", description: "Restarts the Windows computer." },

        { name: "shutdown_pc", description: "Safely shuts down the Windows computer." }

      ]

    }

  ];

  var chosenVoice = localStorage.getItem("gemini_voice") ||

    (window.GEMINI_CONFIG && window.GEMINI_CONFIG.defaultVoice) || "Puck";

  var liveModel = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.model) || "gemini-3.8-live";

  var activeTools = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.tools) || toolsPayload;

  var sessionContext = getSessionHistoryContext();

  var livePrompt = getActivePersonaInstruction() + sessionContext;

  // 🔁 Resume handle from the previous session (if the server issued one).

  // Sent ONLY when a handle exists — an empty object breaks session creation.

  // Scoped per model: handles are invalid across different models.

  var resumeHandle = null;

  try { resumeHandle = localStorage.getItem(geminiResumeKey()); } catch(e) {}

  var setupObj = {

      model: liveModel,

      // 🗜️ Sliding-window compression: server compacts old turns past ~100k

      // tokens, keeping long voice sessions coherent instead of degrading.

      contextWindowCompression: {

        triggerTokens: "100000",

        slidingWindow: { targetTokens: "50000" }

      },

      generationConfig: {

        // NOTE: this model accepts AUDIO-only modalities (server rejects

        // AUDIO+TEXT). Transcription handlers stay as dead paths.

        responseModalities: ["AUDIO"],

        temperature: 0.7,

        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: chosenVoice } } }

      },

      realtimeInputConfig: {

        activityHandling: "START_OF_ACTIVITY_INTERRUPTS",

        automaticActivityDetection: {

          disabled: false,

          startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",

          endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",

          silenceDurationMs: 250,

          prefixPaddingMs: 150

        }

      },

      systemInstruction: { parts: [{ text: livePrompt }] },

      tools: activeTools

  };

  if (resumeHandle) {

    // Replay stored handle so a reconnect continues the same conversation.

    setupObj.sessionResumption = { handle: resumeHandle };

  }

  return { setup: setupObj };

}



// ⚡ GEMINI LIVE PRE-WARM ENGINE

// Silently connects Gemini WebSocket BEFORE user clicks the voice button.

// When user activates voice, connection is already ready → instant AI greeting in real Gemini voice.

// This is how Siri/Copilot eliminate cold-start delay.

var _preWarmDone = false;

var _preWarmWs = null;

var _preWarmReady = false;



function invalidatePreWarm() {

  if (_preWarmWs) {

    try {

      _preWarmWs.onopen = null;

      _preWarmWs.onclose = null;

      _preWarmWs.onerror = null;

      _preWarmWs.onmessage = null;

      _preWarmWs.close();

    } catch(e) {}

    _preWarmWs = null;

  }

  _preWarmDone = false;

  _preWarmReady = false;

  _handedOffToMain = false;

}



function preWarmGeminiConnection() {

  // Direct on-demand connection matching reference project architecture

  return;

}



var _handedOffToMain = false;



function consumePreWarmConnection() {

  return null;

}



function toggleGeminiLiveConnection() {

  if (geminiWs && (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING)) {

    liveManuallyClosed = true;

    disconnectGeminiLive();

  } else {

    liveManuallyClosed = false;

    _isAutoReconnecting = false;

    _reconnectAttempts = 0;

    connectGeminiLive();

  }

}





// Legacy path: fetch key from the C++ host server; open key modal if still missing.

function legacyKeyFetchThenConnect() {

  fetchLocalGeminiKey(function() {

    var k = localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_KEY;

    if (k) {

      connectGeminiLive();

    } else {

      toggleGeminiKeyModal();

      appendGeminiLog("err", "[ERROR] Please enter your Gemini API Key in the modal.");

    }

  });

}



// 🩹 STALE-RESUME-HANDLE RECOVERY: If session disconnects before setupComplete,

// discard stale resumption handle so the next attempt starts fresh and healthy.

var _sessionReadyOnce = false; // whether setupComplete was received on current socket

var _reconnectAttempts = 0;    // backoff counter — reset upon setupComplete



function handleLiveSocketClose(e) {

  var reason = e.reason || "Connection terminated";

  GeminiLiveDevLog.onWsClose(e.code, reason, e.wasClean);

  if (e.code === 1011) {

    appendGeminiLog("err", "[WS CLOSED 1011] Quota or configuration error: " + reason + " — Check API key or quota in settings.");

  } else if (e.code === 4001) {

    appendGeminiLog("err", "[PROXY 4001] No Gemini API key on PC. Opening settings modal...");

    try { toggleGeminiKeyModal(); } catch(err) {}

  } else {

    appendGeminiLog("sys", "[WS CLOSED] Code: " + e.code + " Reason: " + reason);

  }

  // Drop stale handle if socket closed before setupComplete

  if (!_sessionReadyOnce) {

    try {

      localStorage.removeItem(geminiResumeKey());

      appendGeminiLog("sys", "[RECOVERY] Cleared stale session handle — starting fresh session...");

    } catch(err) {}

  }

  disconnectGeminiLive();

  // Auto-reconnect on abnormal/idle close, with escalating backoff + cap

  if (!liveManuallyClosed && (e.code === 1000 || e.code === 1001 || e.code === 1005 || e.code === 1006 || e.code === 1007 || e.code === 1008)) {

    if (_reconnectAttempts >= 6) {

      appendGeminiLog("err", "[AUTO-RECONNECT] Multiple reconnect attempts failed. Please verify PanicButton.exe & proxy are running, then retry.");

      _reconnectAttempts = 0;

      setGeminiStatus("disc", "CONNECTION FAILED", "Repeated connection failures — check PC proxy then press Connect.");

      return;

    }

    var delay = 1500 * Math.pow(2, Math.min(_reconnectAttempts, 4)); // 1.5s → 24s

    _reconnectAttempts++;

    _isAutoReconnecting = true;

    appendGeminiLog("sys", "[AUTO-RECONNECT] Retrying connection in " + Math.round(delay / 1000) + "s...");

    setTimeout(function() {

      if (!geminiWs || geminiWs.readyState === WebSocket.CLOSED) {

        connectGeminiLive();

      }

    }, delay);

  }

}



function connectGeminiLive() {

  console.log(

    "%c[GEMINI LIVE] 🎙️ Session Activated%c Initializing voice connection...",

    "background:#0d47a1; color:#fff; font-weight:bold; padding:2px 8px; border-radius:3px; font-size:12px;",

    "color:#82b1ff; font-weight:bold; font-size:12px;"

  );

  var saved = localStorage.getItem("gemini_api_key");

  if (saved && saved.startsWith("AIzaSyCkyi")) {

    localStorage.removeItem("gemini_api_key");

    saved = "";

  }

  var apiKey = saved || DEFAULT_GEMINI_KEY;

  if (!apiKey && !_proxyHasKey) {

    // 🛡️ PROXY-FIRST: If PC proxy holds the API key, the client does not need a local key.

    // The key never leaves the host PC. Fallback to legacy path only if proxy is unavailable.

    try {

      fetch(geminiProxyHttpBase() + "/api/health")

        .then(function(r) { return r.json(); })

        .then(function(h) {

          if (h && h.hasKey) {

            _proxyHasKey = true;

            appendGeminiLog("sys", "[PROXY] PC proxy holds the API key — connecting without device key.");

            connectGeminiLive();

          } else {

            legacyKeyFetchThenConnect();

          }

        })

        .catch(function() { legacyKeyFetchThenConnect(); });

    } catch (e) {

      legacyKeyFetchThenConnect();

    }

    return;

  }



  setGeminiStatus("conn", "CONNECTING TO GEMINI LIVE...", "Establishing encrypted full-duplex WebSocket link.");

  appendGeminiLog("sys", "[CONNECT] Initializing Gemini Live WebSocket session...");



  // ⚡ PRE-WARM REUSE: If background connection is already open, use it directly

  var warmWs = consumePreWarmConnection();

  if (warmWs && warmWs.readyState === WebSocket.OPEN) {

    geminiWs = warmWs;

    _sessionReadyOnce = true; // pre-warm already reached setupComplete

    GeminiLiveDevLog.onWsOpen(true);

    // Attach real message/error/close handlers to the warm socket

    geminiWs.onmessage = function(event) {

      if (typeof event.data === "string") {

        try { handleGeminiServerMessage(JSON.parse(event.data)); } catch(e) {}

      } else if (event.data instanceof Blob) {

        var r = new FileReader();

        r.onload = function() { try { handleGeminiServerMessage(JSON.parse(r.result)); } catch(e) {} };

        r.readAsText(event.data);

      }

    };

    geminiWs.onerror = function(err) {

      GeminiLiveDevLog.onWsError(err);

      appendGeminiLog("err", "[WS ERROR] Check API Key and network connection.");

      setGeminiStatus("disc", "CONNECTION ERROR", "WebSocket encountered an error.");

    };

    geminiWs.onclose = handleLiveSocketClose;

    // setupComplete was already received (or will arrive shortly) — treat as ready

    appendGeminiLog("sys", "[WS OPEN] Pre-warmed link active. Session already initialized!");

    appendGeminiLog("sys", "[READY] Gemini Live AI session verified & active!");

    setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally or type in terminal to control PC.");

    initPlaybackAudioContext();

    startMicrophoneCapture();

    if (pendingTextMessage) {

      var toSend = pendingTextMessage;

      pendingTextMessage = "";

      sendTextMessageToGemini(toSend);

    }

    return;  // ⚡ DONE — zero cold-start wait

  }



  // 🔁 Route through the PC-side Gemini proxy (raw protocol pipe, key stays on PC).

  var wsUrl = geminiProxyWsUrl();



  GeminiLiveDevLog.onConnectStart(wsUrl);



  try {

    geminiWs = new WebSocket(wsUrl);

    _sessionReadyOnce = false; // fresh socket — setupComplete pending

  } catch (e) {

    GeminiLiveDevLog.onWsError(e);

    setGeminiStatus("disc", "CONNECTION FAILED", e.message);

    appendGeminiLog("err", "[WS FAILED] " + e.message);

    return;

  }



  geminiWs.onopen = function() {

    var liveModel = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.model) || localStorage.getItem("gemini_live_model") || "gemini-3.8-live";

    if (liveModel.startsWith("models/")) liveModel = liveModel.replace("models/", "");

    if (liveModel.indexOf("3.8-live-thinking") !== -1 || liveModel.indexOf("extended-thinking") !== -1 || liveModel.indexOf("thinking") !== -1) {
      liveModel = "gemini-3.8-live-extended-thinking";
    } else {
      liveModel = "gemini-3.8-live";
    }

    var chosenVoice = (typeof _currentStudioVoice !== "undefined" && _currentStudioVoice) ? _currentStudioVoice : (localStorage.getItem("gemini_voice") || (window.GEMINI_CONFIG && window.GEMINI_CONFIG.defaultVoice) || "Zephyr");
    var activeEmotion = (typeof _currentStudioEmotion !== "undefined" && _currentStudioEmotion) ? _currentStudioEmotion : (localStorage.getItem("gemini_emotion") || "auto_affective");
    var activeThinking = (typeof _useExtendedThinking !== "undefined") ? _useExtendedThinking : (localStorage.getItem("gemini_live_thinking") === "true");
    if (activeThinking) {
      liveModel = "gemini-3.8-live-extended-thinking";
    }

    var persona = (typeof getActivePersona === "function") ? getActivePersona() : null;
    var prompt = (typeof getActivePersonaInstruction === "function") ? getActivePersonaInstruction() : "You are PanicCTRL AI, an elite, highly intelligent co-pilot. Keep voice responses concise, conversational, and direct.";

    appendGeminiLog("sys", "[WS OPEN] Live Link active. Initializing " + liveModel + " (" + chosenVoice + " · " + activeEmotion + ")...");
    GeminiLiveDevLog.onWsOpen(false);

    // Send Reference Project Init Packet (Direct @google/genai Live Session)
    var initPayload = {
      type: "init",
      voice: chosenVoice,
      emotionMode: activeEmotion,
      extendedThinking: activeThinking,
      config: {
        model: liveModel,
        voice: chosenVoice,
        emotionMode: activeEmotion,
        extendedThinking: activeThinking,
        systemInstruction: prompt
      }
    };
    try { geminiWs.send(JSON.stringify(initPayload)); } catch(e) {}



    initPlaybackAudioContext();

  };



  geminiWs.onmessage = function(event) {

    if (typeof event.data === "string") {

      try {

        var msg = JSON.parse(event.data);

        handleGeminiServerMessage(msg);

      } catch (e) {

        console.error("Error parsing Gemini WS message", e);

      }

    } else if (event.data instanceof Blob) {

      var reader = new FileReader();

      reader.onload = function() {

        try {

          var msg = JSON.parse(reader.result);

          handleGeminiServerMessage(msg);

        } catch (e) {}

      };

      reader.readAsText(event.data);

    }

  };



  geminiWs.onerror = function(err) {

    GeminiLiveDevLog.onWsError(err);

    appendGeminiLog("err", "[WS ERROR] Unable to reach Gemini proxy (port 3001). Please verify PanicButton.exe and node proxy are running.");

    setGeminiStatus("disc", "CONNECTION ERROR", "Proxy WebSocket encountered an error.");

  };



  geminiWs.onclose = handleLiveSocketClose;

}



function handleGeminiServerMessage(msg) {

  // 🎙️ 0. Support Official Reference Protocol ({ type: "status" | "audio" | "agent_transcript" | "user_transcript" | "tool_call" | "interrupted" })

  if (msg && msg.type) {

    if (msg.type === "status") {

      if (msg.state === "connected") {

        _sessionReadyOnce = true;

        _reconnectAttempts = 0;

        appendGeminiLog("sys", "[READY] Gemini Live AI session verified & active! (" + (msg.activeModel || "") + ")");

        setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally or type in terminal to control PC.");

        startMicrophoneCapture();

        initPlaybackAudioContext();

        if (pendingTextMessage) {

          var toSend = pendingTextMessage;

          pendingTextMessage = "";

          sendTextMessageToGemini(toSend);

        }

        _isAutoReconnecting = false;

      } else if (msg.state === "connecting") {

        setGeminiStatus("conn", "CONNECTING TO GEMINI LIVE...", msg.message || "");

      } else if (msg.state === "error") {

        setGeminiStatus("disc", "CONNECTION ERROR", msg.message || "");

        appendGeminiLog("err", "[ERROR] " + (msg.message || "Live session notice"));

      }

      return;

    }

    if (msg.type === "audio" && msg.audio) {

      removeAiTypingIndicator();

      setGeminiStatus("speak", "GEMINI SPEAKING...", "Streaming 24kHz real-time audio.");

      playPcm24kBase64Chunk(msg.audio);

      return;

    }

    if (msg.type === "agent_transcript") {

      removeAiTypingIndicator();

      if (msg.text) {

        enqueueAiSpokenText(msg.text, Boolean(msg.isFinal));

      } else if (msg.isFinal) {

        enqueueAiSpokenText("", true);

      }

      return;

    }

    if (msg.type === "user_transcript" && msg.text) {

      updateUserSpeechBubble(msg.text, Boolean(msg.isFinal));

      return;

    }

    if (msg.type === "tool_executing") {

      var calls = msg.functionCalls || [];

      for (var i = 0; i < calls.length; i++) {

        var call = calls[i];

        setGeminiStatus("exec", "EXECUTING TOOL...", call.name);

        appendGeminiLog("tool", "[TOOL EXECUTING] " + call.name + "(" + JSON.stringify(call.args || {}) + ")");

      }

      return;

    }

    if (msg.type === "tool_result") {

      appendGeminiLog("out", "[TOOL RESULT] " + JSON.stringify(msg.result || {}));

      setTimeout(function(){

        if (blobState.status === "exec") {

          setGeminiStatus("listen", "AI LIVE & LISTENING", "Command executed. Listening...");

        }

      }, 500);

      return;

    }

    if (msg.type === "tool_call" && msg.functionCalls) {

      for (var fc = 0; fc < msg.functionCalls.length; fc++) {

        executeGeminiToolCall(msg.functionCalls[fc]);

      }

      return;

    }

    if (msg.type === "interrupted") {

      if (window.LiveTranscriptHUD) {
        window.LiveTranscriptHUD.onInterrupted();
      }

      appendGeminiLog("sys", "[INTERRUPT] User spoke. Cutting off playback.");

      stopAllAudioPlayback();

      _aiWordQueue = [];
      if (_aiWordTimer) { clearInterval(_aiWordTimer); _aiWordTimer = null; }

      currentAiStreamRow = null;

      currentAiStreamText = "";

      currentUserStreamRow = null;

      currentUserStreamText = "";

      accumulatedSpokenText = "";

      setGeminiStatus("listen", "AI LIVE & LISTENING", "Listening to user...");

      return;

    }

    if (msg.type === "turn_complete") {

      enqueueAiSpokenText("", true);

      currentUserStreamRow = null;

      currentUserStreamText = "";

      var checkFinishInterval = setInterval(function(){

        if (!isGeminiAudioPlaying()) {

          clearInterval(checkFinishInterval);

          setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally to control your PC.");

        }

      }, 100);

      return;

    }

  }



  // 🔁 Session resumption handle: server rotates this token; replaying it in the

  // next setup restores conversation context after a reconnect (long talks stay smart).

  if (msg.sessionResumptionUpdate) {

    var rh = msg.sessionResumptionUpdate.newHandle || msg.sessionResumptionUpdate.handle;

    if (rh) {

      try { localStorage.setItem(geminiResumeKey(), rh); } catch(e) {}

    }

    return;

  }

  // 🎯 1. Handle Setup Complete Acknowledgement

  if (msg.setupComplete) {

    _sessionReadyOnce = true;   // socket healthy — safe to retain handle on close

    _reconnectAttempts = 0;     // backoff reset

    appendGeminiLog("sys", "[READY] Gemini Live AI session verified & active!");

    setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally or type in terminal to control PC.");

    startMicrophoneCapture();

    if (pendingTextMessage) {

      var toSend = pendingTextMessage;

      pendingTextMessage = "";

      sendTextMessageToGemini(toSend);

    }

    _isAutoReconnecting = false;

    return;

  }



  // 🎯 2. Handle Interruption (Barge-in: Instant cutoff of playing speech)

  if (msg.serverContent && msg.serverContent.interrupted) {

    appendGeminiLog("sys", "[INTERRUPT] User spoke. Cutting off playback.");

    stopAllAudioPlayback();

    currentAiStreamRow = null;

    currentAiStreamText = "";

    currentUserStreamRow = null;

    currentUserStreamText = "";

    accumulatedSpokenText = "";

    setGeminiStatus("listen", "AI LIVE & LISTENING", "Listening to user...");

    return;

  }



  // 🎯 3. Handle Live Transcription of User's Speech (camelCase, snake_case, parts)

  var userSpokenText = "";

  if (msg.serverContent) {

    var sc = msg.serverContent;

    var it = sc.inputTranscription || sc.input_transcription || sc.interimInputTranscription || sc.interim_input_transcription || msg.inputTranscription || msg.input_transcription;

    if (it) {

      if (typeof it === "string") userSpokenText = it.trim();

      else if (it.text) userSpokenText = it.text.trim();

      else if (it.parts && it.parts[0] && it.parts[0].text) userSpokenText = it.parts[0].text.trim();

    }

  }

  if (userSpokenText) {

    updateUserSpeechBubble(userSpokenText);

  }



  // 🎯 4. Handle Live Transcription of AI Agent's Spoken Speech (Realtime AI Response)

  if (msg.serverContent && msg.serverContent.outputTranscription && msg.serverContent.outputTranscription.text) {

    removeAiTypingIndicator();

    var aiSpokenText = msg.serverContent.outputTranscription.text.trim();

    if (aiSpokenText) {

      appendGeminiLog("ai", aiSpokenText, true);

    }

  }



  // 🎯 5. Handle Model Turn Audio / Text Streams

  if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {

    removeAiTypingIndicator();

    for (var i = 0; i < msg.serverContent.modelTurn.parts.length; i++) {

      var part = msg.serverContent.modelTurn.parts[i];

      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith("audio/pcm")) {

        setGeminiStatus("speak", "GEMINI SPEAKING...", "Streaming 24kHz real-time audio.");

        GeminiLiveDevLog.onModelAudioChunk(part.inlineData.data ? part.inlineData.data.length : 0, part.inlineData.mimeType);

        playPcm24kBase64Chunk(part.inlineData.data);

      }

      if (part.text && part.text.trim() && !part.thought) {

        GeminiLiveDevLog.onAiTranscriptionChunk(part.text);

        appendGeminiLog("ai", part.text, true);

      }

    }

  }



  if (msg.serverContent && msg.serverContent.turnComplete) {
    if (window.LiveTranscriptHUD && typeof window.LiveTranscriptHUD.onAgentTranscript === 'function') {
      window.LiveTranscriptHUD.onAgentTranscript('', true);
    }

    var userTextToRecord = (currentUserStreamText && currentUserStreamText.trim()) ? currentUserStreamText.trim() : "";

    var aiTextToRecord = (currentAiStreamText && currentAiStreamText.trim()) ? currentAiStreamText.trim() : "";

    GeminiLiveDevLog.onTurnComplete(userTextToRecord, aiTextToRecord);



    if (aiTextToRecord) {

      var lastTurn = geminiChatHistory.length > 0 ? geminiChatHistory[geminiChatHistory.length - 1] : null;

      var lastText = (lastTurn && lastTurn.parts && lastTurn.parts[0] && lastTurn.parts[0].text) ? lastTurn.parts[0].text : "";



      if (userTextToRecord) {

        if (!lastTurn || lastTurn.role !== "user" || lastText !== userTextToRecord) {

          recordTurnInActiveSession("user", userTextToRecord);

        }

      } else if (!lastTurn || lastTurn.role !== "user") {

        // Fallback user turn so model response is NEVER orphaned in chat history

        recordTurnInActiveSession("user", "🎙️ Voice Message");

      }

      recordTurnInActiveSession("model", aiTextToRecord);

    } else if (userTextToRecord) {

      recordTurnInActiveSession("user", userTextToRecord);

    }



    currentAiStreamRow = null;

    currentAiStreamText = "";

    currentUserStreamRow = null;

    currentUserStreamText = "";

    var checkFinishInterval = setInterval(function(){

      if (!isGeminiAudioPlaying()) {

        clearInterval(checkFinishInterval);

        setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally to control your PC.");

      }

    }, 100);

  }



  if (msg.toolCall && msg.toolCall.functionCalls) {

    for (var j = 0; j < msg.toolCall.functionCalls.length; j++) {

      var call = msg.toolCall.functionCalls[j];

      executeGeminiToolCall(call);

    }

  }



  // 🎯 6. Log truly unhandled/unknown server packets

  GeminiLiveDevLog.onRawServerMessage(msg);

}



function executeGeminiTool(name, args) {

  var friendlyLabels = {

    "lock_workstation": "🔒 Locking PC Workstation...",

    "trigger_panic": "⚡ Triggering Emergency Panic Defense...",

    "open_application": "🚀 Launching " + (args && args.target ? args.target : "application") + "...",

    "web_search": "🔍 Searching web for: " + (args && args.query ? args.query : "") + "...",

    "media_control": "🎵 Media action: " + (args && args.action ? args.action : "") + "...",

    "get_pc_hardware_status": "📊 Fetching PC CPU & RAM status...",

    "get_pc_status": "📊 Checking Workstation status...",

    "run_powershell_command": "💻 Executing: " + (args && args.command ? args.command : "") + "...",

    "type_keyboard": "⌨️ Typing text onto PC...",

    "sleep_pc": "💤 Putting PC to sleep...",

    "restart_pc": "🔄 Restarting PC...",

    "shutdown_pc": "⏻ Shutting down PC...",

    "set_volume": "🔊 Adjusting System Volume..."

  };

  if (friendlyLabels[name]) {

    appendGeminiLog("ai", friendlyLabels[name]);

  }



  var toolPromise = null;

  if (name === "lock_workstation") {

    toolPromise = fetch("/lock?key=" + KEY).then(function(r){ return r.json(); });

  } else if (name === "trigger_panic") {

    toolPromise = fetch("/panic?key=" + KEY).then(function(r){ return r.json(); });

  } else if (name === "open_application") {

    var target = String((args && args.target) || "").trim();

    var cmd = "";

    if (target.startsWith("http://") || target.startsWith("https://")) {

      cmd = 'Start-Process "' + target + '"';

    } else {

      var appMap = {

        "chrome": "chrome",

        "google chrome": "chrome",

        "youtube": "https://www.youtube.com",

        "vscode": "code",

        "code": "code",

        "spotify": "spotify",

        "notepad": "notepad",

        "calculator": "calc",

        "calc": "calc",

        "taskmgr": "taskmgr",

        "task manager": "taskmgr",

        "terminal": "wt",

        "explorer": "explorer"

      };

      var resolved = appMap[target.toLowerCase()] || target;

      cmd = 'Start-Process "' + resolved + '"';

    }

    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(cmd)).then(function(){ return { status: "launched", target: target }; });

  } else if (name === "web_search") {

    var q = encodeURIComponent((args && args.query) || "");

    var platform = ((args && args.platform) || "").toLowerCase();

    var sUrl = (platform === "youtube") ? ("https://www.youtube.com/results?search_query=" + q) : ("https://www.google.com/search?q=" + q);

    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent('Start-Process "' + sUrl + '"')).then(function(){ return { searched: (args && args.query), platform: platform || "google" }; });

  } else if (name === "media_control") {

    var action = ((args && args.action) || "play_pause").toLowerCase();

    var keyMap = {

      "play_pause": "0xCD",

      "next": "0xB0",

      "prev": "0xB1",

      "volume_up": "0xAF",

      "volume_down": "0xAE",

      "mute": "0xAD"

    };

    var vk = keyMap[action] || "0xCD";

    var pCmd = '$ws = New-Object -ComObject WScript.Shell; $ws.SendKeys([char]' + vk + ')';

    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(pCmd)).then(function(){ return { media_action: action }; });

  } else if (name === "get_pc_hardware_status" || name === "get_pc_status") {

    var pCmd = '$cpu = (Get-CimInstance Win32_Processor).LoadPercentage; $os = Get-CimInstance Win32_OperatingSystem; $ramFree = [math]::Round($os.FreePhysicalMemory / 1024 / 1024, 2); $ramTotal = [math]::Round($os.TotalVisibleMemorySize / 1024 / 1024, 2); @{ CPU_Percent = $cpu; RAM_Free_GB = $ramFree; RAM_Total_GB = $ramTotal } | ConvertTo-Json -Compress';

    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(pCmd))

      .then(function(r){ return r.json(); })

      .then(function(res){

        var clean = res;

        if (res && res.output) {

          try { clean = JSON.parse(res.output); } catch(e){ clean = { output: res.output }; }

        }

        return clean;

      });

  } else if (name === "run_powershell_command") {

    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent((args && args.command) || "")).then(function(r){ return r.json(); });

  } else if (name === "type_keyboard") {

    toolPromise = fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent((args && args.text) || "")).then(function(){ return { status: "typed" }; });

  } else if (name === "sleep_pc") {

    toolPromise = fetch("/sleep?key=" + KEY).then(function(r){ return r.json(); });

  } else if (name === "restart_pc") {

    toolPromise = fetch("/restart?key=" + KEY).then(function(r){ return r.json(); });

  } else if (name === "shutdown_pc") {

    toolPromise = fetch("/shutdown?key=" + KEY).then(function(r){ return r.json(); });

  } else if (name === "set_volume") {

    var vol = Math.max(0, Math.min(100, (args && args.level !== undefined) ? args.level : 50));

    toolPromise = fetch("/api/volume?key=" + KEY + "&level=" + vol).then(function(r){ return r.json(); });

  } else {

    toolPromise = Promise.resolve({ error: "Unknown function: " + name });

  }



  return toolPromise.then(function(resData) {

    if (name === "get_pc_hardware_status" || name === "get_pc_status") {

      if (resData && resData.CPU_Percent !== undefined) {

        appendGeminiLog("ai", "🖥️ **PC Status:** CPU: `" + resData.CPU_Percent + "%` | Free RAM: `" + resData.RAM_Free_GB + " GB` / `" + resData.RAM_Total_GB + " GB`");

      }

    } else if (name === "lock_workstation") {

      appendGeminiLog("ai", "🔒 Workstation locked successfully.");

    } else if (name === "trigger_panic") {

      appendGeminiLog("ai", "⚡ Panic Defense sequence activated.");

    } else if (name === "open_application") {

      appendGeminiLog("ai", "🚀 Launched " + ((args && args.target) || "application") + " successfully.");

    } else if (name === "set_volume") {

      appendGeminiLog("ai", "🔊 System volume updated to " + ((args && args.level) || 50) + "%.");

    }

    return resData;

  });

}



function executeGeminiToolCall(call) {

  var t0 = performance.now();

  var toolName = call.name || "";

  var toolArgs = call.args || {};



  // STRICT GUARD: Prevent autonomous app launching or panic triggering without user voice command

  var userSpoken = (currentUserStreamText || accumulatedSpokenText || "").toLowerCase();

  if (toolName === "open_application" || toolName === "run_powershell_command" || toolName === "run_powershell" || toolName === "trigger_panic") {

    var validActionWords = ["open", "launch", "start", "run", "panic", "emergency", "execute", "play", "show", "turn on", "bring up"];

    var hasIntent = validActionWords.some(function(w) { return userSpoken.indexOf(w) !== -1; });

    if (!hasIntent && !userSpoken.trim()) {

      console.warn("[Gemini Live] Blocked unprompted tool call during standby:", toolName, toolArgs);

      sendToolResponseToGemini(call.id, toolName, {

        status: "ignored",

        message: "Tool execution blocked: No explicit spoken user command detected."

      });

      return;

    }

  }



  setGeminiStatus("exec", "EXECUTING TOOL...", call.name);

  appendGeminiLog("tool", "[TOOL CALL] " + call.name + "(" + JSON.stringify(call.args || {}) + ")");



  if (!currentUserStreamText) {

    var friendlyTarget = (call.args && (call.args.target || call.args.query || call.args.command || call.args.action)) || "";

    var cmdDesc = call.name.replace(/_/g, " ") + (friendlyTarget ? " (" + friendlyTarget + ")" : "");

    GeminiLiveDevLog.onUserTranscription("Voice Command: " + cmdDesc);

    currentUserStreamText = "Voice: " + cmdDesc;

  }



  GeminiLiveDevLog.onToolCall(call);

  GeminiLiveDevLog.onToolExecuting(call.name, call.args || {});



  executeGeminiTool(call.name, call.args || {})

    .then(function(resData) {

      var dur = Math.round(performance.now() - t0);

      appendGeminiLog("out", "[TOOL RESULT] " + JSON.stringify(resData));

      GeminiLiveDevLog.onToolResult(call.name, resData, dur);

      sendToolResponseToGemini(call.id, call.name, resData);

      setTimeout(function(){

        if (blobState.status === "exec") {

          setGeminiStatus("listen", "AI LIVE & LISTENING", "Command executed. Listening...");

        }

      }, 600);

    })

    .catch(function(err) {

      var dur = Math.round(performance.now() - t0);

      appendGeminiLog("err", "[TOOL ERROR] " + err);

      GeminiLiveDevLog.onToolResult(call.name, { error: String(err) }, dur);

      sendToolResponseToGemini(call.id, call.name, { error: String(err) });

    });

}



function sendToolResponseToGemini(callId, callName, resultData) {

  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;

  var refResp = {

    type: "tool_response",

    functionResponses: [

      {

        id: callId || "call_0",

        name: callName || "tool",

        response: { output: resultData }

      }

    ]

  };

  try { geminiWs.send(JSON.stringify(refResp)); } catch(e) {}

  GeminiLiveDevLog.onToolResponseSent(callId, callName, resultData);

}



function sendTextMessageToGemini(text) {

  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) {

    appendGeminiLog("err", "Gemini Live is not connected. Tap 🎙️ LIVE VOICE first or type your message!");

    return;

  }

  recordTurnInActiveSession("user", text);



  try {

    geminiWs.send(JSON.stringify({

      type: "text",

      text: text

    }));

  } catch(e) {}

  GeminiLiveDevLog.onClientTextSent(text);

  setGeminiStatus("speak", "GEMINI PROCESSING...", "Generating audio & executing tools...");

}



function sendTextToGeminiRest(text) {

  var saved = localStorage.getItem("gemini_api_key");

  if (saved && saved.startsWith("AIzaSyCkyi")) {

    localStorage.removeItem("gemini_api_key");

    saved = "";

  }

  var apiKey = saved || DEFAULT_GEMINI_KEY;

  if (!apiKey) {

    removeAiTypingIndicator();

    toggleGeminiKeyModal();

    appendGeminiLog("err", "⚠️ Please enter your Gemini API Key in the settings modal to use PanicCTRL AI.");

    return;

  }



  var restModel = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.restModel) || "gemini-2.5-flash";

  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + restModel + ":generateContent?key=" + apiKey;



  var toolsPayload = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.tools) || [];

  var sysInstruction = getActivePersonaInstruction();





  var requestBody = {

    contents: [{ role: "user", parts: [{ text: text }] }],

    systemInstruction: {

      parts: [{ text: sysInstruction }]

    },

    tools: toolsPayload

  };





  fetch(url, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(requestBody)

  })

  .then(function(r) {

    if (!r.ok) {

      return r.json().then(function(err) {

        throw new Error((err && err.error && err.error.message) ? err.error.message : ("HTTP " + r.status));

      });

    }

    return r.json();

  })

  .then(function(data) {

    removeAiTypingIndicator();

    if (!data || !data.candidates || data.candidates.length === 0) {

      appendGeminiLog("ai", "No response received from Gemini.");

      return;

    }

    var cand = data.candidates[0];

    if (cand.content && cand.content.parts) {

      var fullAiReply = "";

      for (var i = 0; i < cand.content.parts.length; i++) {

        var part = cand.content.parts[i];

        if (part.text) {

          fullAiReply += part.text;

          appendGeminiLog("ai", part.text);

          if (window.LiveTranscriptHUD) {
            window.LiveTranscriptHUD.onAgentTranscript(part.text, true);
          }

        }

        if (part.functionCall) {

          var fn = part.functionCall;

          appendGeminiLog("tool", "[TOOL CALL] " + fn.name + "(" + JSON.stringify(fn.args || {}) + ")");

          executeGeminiTool(fn.name, fn.args || {});

        }

      }

      // 🧠 Record AI Response in Conversational Memory

      if (fullAiReply.trim()) {

        recordTurnInActiveSession("model", fullAiReply);

      }

    }

  })

  .catch(function(err) {

    removeAiTypingIndicator();

    appendGeminiLog("err", "[GEMINI ERROR] " + err.message);

  });

}



function startMicrophoneCapture() {

  // 🎙️ Voice-active flag: enables controls.js stream FPS throttling while voice is active to prevent thread starvation

  window.__voiceActive = true;

  if (audioInputCtx && audioInputSource) {

    if (audioInputCtx.state === "suspended") {

      audioInputCtx.resume();

    }

    return;

  }



  var getUserMediaFn = null;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

    getUserMediaFn = function(constraints) { return navigator.mediaDevices.getUserMedia(constraints); };

  } else {

    var legacyGUM = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (legacyGUM) {

      getUserMediaFn = function(constraints) {

        return new Promise(function(resolve, reject) {

          legacyGUM.call(navigator, constraints, resolve, reject);

        });

      };

    }

  }



  if (!getUserMediaFn) {

    appendGeminiLog("err", "[MIC NOTICE] Mobile Chrome requires HTTPS for Microphone access.");

    

    // Auto-detect and offer seamless 1-click switch to HTTPS

    var secureUrl = localStorage.getItem("panic_https_url");

    if (!secureUrl && window.PC_ENDPOINT && window.PC_ENDPOINT.startsWith("https://")) {

      secureUrl = window.PC_ENDPOINT;

    }

    if (!secureUrl) {

      var lan = localStorage.getItem("panic_lan_ip") || window.location.hostname;

      var key = localStorage.getItem("panic_key") || window.KEY || "";

      if (lan && lan !== "localhost" && lan !== "127.0.0.1") {

        secureUrl = "https://" + lan + ":8443/?key=" + key;

      }

    }



    if (secureUrl) {

      appendGeminiLog("sys", "[SWITCHING] Launching Secure HTTPS mode for 1-click microphone...");

      setGeminiStatus("listen", "SWITCHING TO HTTPS...", "Opening secure connection for microphone...");

      setTimeout(function() {

        var base = (secureUrl || '').replace(/\/+$/, '');
        var k = window.KEY || localStorage.getItem('panic_key') || '';
        var target = base;
        if (base.indexOf('key=') === -1 && k) {
          target = base + (base.includes('?') ? '&' : '/?') + 'key=' + encodeURIComponent(k);
        }

        window.location.href = target;

      }, 800);

      return;

    }



    appendGeminiLog("sys", "[TIP] Scan the PC QR code with Camera to open in verified HTTPS mode!");

    setGeminiStatus("listen", "HTTPS REQUIRED FOR MIC", "Scan PC QR code to open in secure mode.");

    return;

  }



  getUserMediaFn({

    audio: {

      channelCount: 1,

      echoCancellation: true,

      noiseSuppression: true,

      autoGainControl: true

    }

  })

  .then(function(stream) {

    audioInputCtx = new (window.AudioContext || window.webkitAudioContext)({

      sampleRate: 16000

    });



    if (audioInputCtx.state === "suspended") {

      audioInputCtx.resume();

    }



    audioInputSource = audioInputCtx.createMediaStreamSource(stream);

    // Start Web Speech recognizer for instant local user transcription.
    // Must be called after getUserMedia succeeds (user granted mic permission),
    // not from an async WebSocket callback — matches Antigravity's approach.
    if (typeof initLiveSpeechRecognizer === "function") {
      try { initLiveSpeechRecognizer(); } catch(e) {}
    }



    // Visualizer Analyser Node
    var analyser = audioInputCtx.createAnalyser();
    antigravityMicAnalyser = analyser;

    analyser.fftSize = 512;

    analyser.smoothingTimeConstant = 0.6;

    var dataArray = new Uint8Array(analyser.frequencyBinCount);

    audioInputSource.connect(analyser);



    function updateMicVisual() {

      if (!audioInputCtx) return;

      analyser.getByteFrequencyData(dataArray);

      var sum = 0;

      for (var i = 0; i < dataArray.length; i++) sum += dataArray[i];

      var avg = (sum / dataArray.length) / 255;

      if (avg > 0.05) {

        blobState.micLevel = Math.min(1.0, (avg - 0.05) * 4.0);

      } else {

        blobState.micLevel = 0;

      }

      requestAnimationFrame(updateMicVisual);

    }

    updateMicVisual();



    // 2048 buffer at 16kHz = 128ms chunks (matching reference project)

    var bufferSize = 2048;

    audioInputProcessor = audioInputCtx.createScriptProcessor(bufferSize, 1, 1);



    var speechThreshold = 0.025;

    var speechCounter = 0;

    var isUserSpeaking = false;

    var hasLoggedMicActive = false;



    audioInputProcessor.onaudioprocess = function(e) {

      if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;



      var inputChannelData = e.inputBuffer.getChannelData(0);



      // RMS calculation for Voice Activity Detection

      var sum = 0;

      for (var i = 0; i < inputChannelData.length; i++) {

        sum += inputChannelData[i] * inputChannelData[i];

      }

      var rms = Math.sqrt(sum / inputChannelData.length);

      // ─── ACOUSTIC ECHO GATING ───
      // When AI audio is actively playing through speakers, do not stream mic audio to Gemini.
      // This completely eliminates acoustic feedback loops, speaker echo, and self-interruption.
      var aiPlaying = isGeminiAudioPlaying();
      if (aiPlaying) {
        return;
      }

      var prevSpeaking = isUserSpeaking;



      if (rms > speechThreshold) {

        speechCounter = Math.min(speechCounter + 1, 10);

      } else {

        speechCounter = Math.max(speechCounter - 1, 0);

      }



      var currentlySpeaking = speechCounter > 2;

      if (currentlySpeaking !== isUserSpeaking) {

        isUserSpeaking = currentlySpeaking;

        var goLiveBtn = document.getElementById("btnGoLive");
        var studioMicBtn = document.getElementById("btnStudioMic");

        var voiceBannerTitle = document.getElementById("geminiVoiceTitle");

        if (isUserSpeaking) {

          if (goLiveBtn) goLiveBtn.classList.add("user-speaking");
          if (studioMicBtn) studioMicBtn.classList.add("user-speaking");

          if (voiceBannerTitle) voiceBannerTitle.textContent = "🎙️ SPEAKING (AI LISTENING)";

          if (!currentUserStreamRow || !currentUserStreamText || currentUserStreamText.indexOf("Listening") !== -1) {
            updateUserSpeechBubble("🎙️ Listening...", false);
          }

        } else {

          if (goLiveBtn) goLiveBtn.classList.remove("user-speaking");
          if (studioMicBtn) studioMicBtn.classList.remove("user-speaking");

          if (voiceBannerTitle) voiceBannerTitle.textContent = "🎙️ LIVE VOICE (READY & LISTENING)";
          if (prevSpeaking) {
            try {
              geminiWs.send(JSON.stringify({ type: "audio_stream_end" }));
            } catch(e) {}
          }

        }

      }



      // Note: Client-side barge-in removed. Google's server-side VAD handles

      // interruptions — this prevents false triggers from speaker bleed.



      if (!hasLoggedMicActive) {

        hasLoggedMicActive = true;

        appendGeminiLog("sys", "[MIC STREAMING] Voice audio flowing to Gemini Live.");

      }



      // Convert Float32 to 16-bit PCM Little Endian

      var base64Pcm = float32ToPcm16Base64(inputChannelData);



      // Send to WebSocket (single clean audio chunk)

      try {

        geminiWs.send(JSON.stringify({

          type: "audio",

          data: base64Pcm

        }));

      } catch(err) {}

    };



    audioInputSource.connect(audioInputProcessor);

    var silentGain = audioInputCtx.createGain();

    silentGain.gain.value = 0;

    audioInputProcessor.connect(silentGain);

    silentGain.connect(audioInputCtx.destination);

  })

  .catch(function(err) {

    appendGeminiLog("err", "[MIC ERROR] " + err.message);

  });

}



function sendScreenFrameToGeminiLive(jpegBase64) {

  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;

  var msg = {

    realtimeInput: {

      video: {

        mimeType: "image/jpeg",

        data: jpegBase64

      }

    }

  };

  geminiWs.send(JSON.stringify(msg));

}



function downsampleBuffer(buffer, sampleRate, outSampleRate) {

  if (outSampleRate === sampleRate || outSampleRate > sampleRate) return buffer;

  var sampleRateRatio = sampleRate / outSampleRate;

  var newLength = Math.round(buffer.length / sampleRateRatio);

  var result = new Float32Array(newLength);

  var offsetResult = 0;

  var offsetBuffer = 0;

  while (offsetResult < result.length) {

    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);

    var accum = 0, count = 0;

    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {

      accum += buffer[i];

      count++;

    }

    result[offsetResult] = count > 0 ? accum / count : 0;

    offsetResult++;

    offsetBuffer = nextOffsetBuffer;

  }

  return result;

}



function convertFloat32ToInt16(buffer) {

  var l = buffer.length;

  var buf = new Int16Array(l);

  while (l--) {

    var s = Math.max(-1, Math.min(1, buffer[l]));

    buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;

  }

  return buf;

}



function arrayBufferToBase64(buffer) {

  var binary = '';

  var bytes = new Uint8Array(buffer);

  var len = bytes.byteLength;

  for (var i = 0; i < len; i++) {

    binary += String.fromCharCode(bytes[i]);

  }

  return window.btoa(binary);

}



var activeAudioSources = [];



function stopAllAudioPlayback() {

  for (var i = 0; i < activeAudioSources.length; i++) {

    try {

      activeAudioSources[i].stop();

      activeAudioSources[i].disconnect();

    } catch(e){}

  }

  activeAudioSources = [];

  _playbackEnvelope = 0; // echo gate fully open for the interrupting user

  if (playbackGainNode && audioPlaybackCtx) {

    try {

      playbackGainNode.gain.cancelScheduledValues(audioPlaybackCtx.currentTime);

      playbackGainNode.gain.setValueAtTime(1.0, audioPlaybackCtx.currentTime);

    } catch(e) {}

  }

  if (audioPlaybackCtx) {

    nextPlayTime = audioPlaybackCtx.currentTime;

  }

  blobState.geminiLevel = 0;

}



function isGeminiAudioPlaying() {

  if (activeAudioSources.length > 0) return true;

  if (audioPlaybackCtx && audioPlaybackCtx.state === "running") {

    if (audioPlaybackCtx.currentTime < nextPlayTime + 0.05) {

      return true;

    }

  }

  return false;

}



function float32ToPcm16Base64(float32Array) {

  var buffer = new ArrayBuffer(float32Array.length * 2);

  var view = new DataView(buffer);

  for (var i = 0; i < float32Array.length; i++) {

    var s = Math.max(-1, Math.min(1, float32Array[i]));

    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // true = Little-Endian

  }

  var binary = "";

  var bytes = new Uint8Array(buffer);

  var len = bytes.byteLength;

  for (var i = 0; i < len; i++) {

    binary += String.fromCharCode(bytes[i]);

  }

  return window.btoa(binary);

}



function pcm16Base64ToFloat32(base64) {

  var binary = window.atob(base64);

  var len = binary.length;

  var bytes = new Uint8Array(len);

  for (var i = 0; i < len; i++) {

    bytes[i] = binary.charCodeAt(i);

  }

  var dataView = new DataView(bytes.buffer);

  var sampleCount = Math.floor(len / 2);

  var float32 = new Float32Array(sampleCount);

  for (var i = 0; i < sampleCount; i++) {

    var int16 = dataView.getInt16(i * 2, true); // true = Little-Endian

    float32[i] = int16 / (int16 < 0 ? 0x8000 : 0x7fff);

  }

  return float32;

}



function initPlaybackAudioContext() {

  if (!audioPlaybackCtx || audioPlaybackCtx.state === "closed") {

    audioPlaybackCtx = new (window.AudioContext || window.webkitAudioContext)({

      sampleRate: 24000

    });

    playbackGainNode = audioPlaybackCtx.createGain();
    playbackGainNode.gain.value = 1.0;
    antigravityAgentAnalyser = audioPlaybackCtx.createAnalyser();
    antigravityAgentAnalyser.fftSize = 512;
    antigravityAgentAnalyser.smoothingTimeConstant = 0.6;
    playbackGainNode.connect(antigravityAgentAnalyser);
    antigravityAgentAnalyser.connect(audioPlaybackCtx.destination);
    nextPlayTime = 0;

  }

  if (audioPlaybackCtx.state === "suspended") {

    audioPlaybackCtx.resume();

  }

}



function playPcm24kBase64Chunk(base64Data) {

  if (!base64Data) return;

  initPlaybackAudioContext();

  if (!audioPlaybackCtx) return;



  var float32 = pcm16Base64ToFloat32(base64Data);

  if (float32.length === 0) return;



  // Smooth audio reaction for blob visualizer

  var sum = 0;

  for (var k = 0; k < float32.length; k += 4) sum += Math.abs(float32[k]);

  blobState.geminiLevel = Math.min(1, (sum / (float32.length / 4)) * 3.5);



  var audioBuf = audioPlaybackCtx.createBuffer(1, float32.length, 24000);

  audioBuf.copyToChannel(float32, 0);



  var source = audioPlaybackCtx.createBufferSource();

  source.buffer = audioBuf;

  source.connect(playbackGainNode || audioPlaybackCtx.destination);



  // ⚡ Seamless Gapless Scheduling with Jitter Buffer:

  // If the playback queue is empty or fell behind (first chunk or network lag),

  // schedule with a 20ms buffer margin (matching reference project) to absorb WebSocket packet jitter.

  // Otherwise, schedule right at nextPlayTime for 100% gapless continuous speech.

  var now = audioPlaybackCtx.currentTime;

  var startTime = (nextPlayTime < now) ? (now + 0.02) : nextPlayTime;



  source.start(startTime);

  nextPlayTime = startTime + audioBuf.duration;

  activeAudioSources.push(source);

  if (window.LiveTranscriptHUD) {
    window.LiveTranscriptHUD.onAudioChunk(audioBuf.duration, startTime);
    window.LiveTranscriptHUD.setState("speaking");
  }



  source.onended = function() {

    var idx = activeAudioSources.indexOf(source);

    if (idx > -1) activeAudioSources.splice(idx, 1);

    if (activeAudioSources.length === 0 && (!audioPlaybackCtx || audioPlaybackCtx.currentTime >= nextPlayTime - 0.03)) {

      blobState.geminiLevel = 0;

      if (window.LiveTranscriptHUD) {
        window.LiveTranscriptHUD.finalizeAgentAudio();
      }

    }

  };

}



function disconnectGeminiLive() {

  GeminiLiveDevLog.onSessionDisconnected();

  window.__voiceActive = false; // 🎙️ stream throttle release

  if (geminiWs) {

    try { geminiWs.close(); } catch(e) {}

    geminiWs = null;

  }

  if (playbackKeepAliveNode) {

    try { playbackKeepAliveNode.stop(); } catch(e) {}

    playbackKeepAliveNode = null;

  }

  if (playbackGainNode) {

    try { playbackGainNode.disconnect(); } catch(e) {}

    playbackGainNode = null;

  }

  antigravityMicAnalyser = null;
  antigravityAgentAnalyser = null;

  if (audioPlaybackCtx) {

    try { audioPlaybackCtx.close(); } catch(e) {}

    audioPlaybackCtx = null;

  }

  if (audioInputWorkletNode) {

    try {

      audioInputWorkletNode.port.onmessage = null;

      audioInputWorkletNode.disconnect();

    } catch(e) {}

    audioInputWorkletNode = null;

  }

  if (audioInputProcessor) {

    try { audioInputProcessor.disconnect(); } catch(e) {}

    audioInputProcessor = null;

  }

  if (audioHighPassFilter) {

    try { audioHighPassFilter.disconnect(); } catch(e) {}

    audioHighPassFilter = null;

  }

  if (audioLowPassFilter) {

    try { audioLowPassFilter.disconnect(); } catch(e) {}

    audioLowPassFilter = null;

  }

  _playbackEnvelope = 0;

  if (audioInputSource) {

    try { audioInputSource.disconnect(); } catch(e) {}

    audioInputSource = null;

  }

  if (audioInputCtx) {

    try { audioInputCtx.close(); } catch(e) {}

    audioInputCtx = null;

  }

  blobState.micLevel = 0;

  blobState.geminiLevel = 0;

  setGeminiStatus("disc", "VOICE ASSISTANT OFFLINE", "Tap '⚡ CONNECT AI' to reconnect.");

  appendGeminiLog("sys", "[DISCONNECTED] Gemini Live session ended.");

}



function toggleSettingsMenu(e) {

  if (e) e.stopPropagation();

  var menu = document.getElementById("cgSettingsDropdown") || document.getElementById("gemini3DotDropdown");

  if (!menu) return;

  var isOpen = (menu.style.display === "block" || menu.style.display === "flex");

  menu.style.display = isOpen ? "none" : "block";

  if (!isOpen) {

    closeGeminiModelMenu();

    closeVoicePicker();

  }

}



function closeSettingsMenu() {

  var menu = document.getElementById("cgSettingsDropdown");

  if (menu) menu.style.display = "none";

  var oldMenu = document.getElementById("gemini3DotDropdown");

  if (oldMenu) oldMenu.style.display = "none";

}



function toggleGemini3DotMenu(e) {

  toggleSettingsMenu(e);

}



function closeGemini3DotMenu() {

  closeSettingsMenu();

}



function isSidebarMiniRail() {
  var drawer = document.getElementById("cgSidebarDrawer");
  if (!drawer) return false;
  if (window.innerWidth < 860) return false;
  return drawer.classList.contains("mini-rail") || drawer.classList.contains("collapsed") || drawer.offsetWidth <= 72;
}



function openMiniRailUserPopover() {

  var popover = document.getElementById("cgMiniRailUserPopover");

  var userBtn = document.getElementById("cgDrawerUserBtn");

  if (!popover || !userBtn) return;



  var rect = userBtn.getBoundingClientRect();

  var left = Math.round(rect.right + 10);

  var bottom = Math.max(12, Math.round(window.innerHeight - rect.bottom + 2));



  popover.style.left = left + "px";

  popover.style.bottom = bottom + "px";



  popover.classList.add("open");

  popover.setAttribute("aria-hidden", "false");



  if (typeof hideOptionHoverFlyout === "function") {

    hideOptionHoverFlyout();

  }

}



function closeMiniRailUserPopover() {

  var popover = document.getElementById("cgMiniRailUserPopover");

  if (popover) {

    popover.classList.remove("open");

    popover.setAttribute("aria-hidden", "true");

  }

}



function toggleMiniRailUserPopover() {

  var popover = document.getElementById("cgMiniRailUserPopover");

  if (!popover) return;

  if (popover.classList.contains("open")) {

    closeMiniRailUserPopover();

  } else {

    openMiniRailUserPopover();

  }

}



function toggleUserCard(e) {

  if (e) {

    e.stopPropagation();

    if (typeof e.preventDefault === "function") e.preventDefault();

  }

  if (typeof hideOptionHoverFlyout === "function") {

    hideOptionHoverFlyout();

  }



  // 🗂️ In Mini-Rail / Closed Desktop Mode: Pop out floating Quick Settings to the right!

  if (isSidebarMiniRail()) {

    var accordionCard = document.getElementById("cgUserCard");

    if (accordionCard) accordionCard.classList.remove("expanded");

    toggleMiniRailUserPopover();

    return;

  }



  // Wide Desktop or Mobile: Standard card accordion

  closeMiniRailUserPopover();

  var card = document.getElementById("cgUserCard");

  if (!card) return;

  var isExpanded = card.classList.contains("expanded");

  if (isExpanded) {

    card.classList.remove("expanded");

  } else {

    card.classList.add("expanded");

    closeSettingsMenu();

    closeGeminiModelMenu();

    closeVoicePicker();

  }

}



function closeUserCard() {

  var card = document.getElementById("cgUserCard");

  if (card) card.classList.remove("expanded");

  closeMiniRailUserPopover();

  if (typeof hideOptionHoverFlyout === "function") hideOptionHoverFlyout();

}



function toggleUserBottomPanel(e) { toggleUserCard(e); }

function closeUserBottomPanel() { closeUserCard(); }

function toggleUserCardExpand(e) { toggleUserCard(e); }

function closeUserCardExpand() { closeUserCard(); }

function toggleUserBottomSettings(e) { toggleUserCard(e); }

function closeUserBottomSettings() { closeUserCard(); }



document.addEventListener("click", function(e) {

  var miniPopover = document.getElementById("cgMiniRailUserPopover");

  if (miniPopover && miniPopover.classList.contains("open")) {

    if (!e.target.closest("#cgDrawerUserBtn") && !e.target.closest("#cgMiniRailUserPopover")) {

      closeMiniRailUserPopover();

    }

  }

  var userCard = document.getElementById("cgUserCard");

  if (userCard && userCard.classList.contains("expanded")) {

    if (!e.target.closest("#cgUserCard")) {

      closeUserCard();

    }

  }

  var bottomPanel = document.getElementById("cgUserBottomSettingsPanel");

  if (bottomPanel && bottomPanel.classList.contains("open")) {

    if (!e.target.closest("#cgDrawerUserBtn") && !e.target.closest("#cgUserBottomSettingsPanel")) {

      closeUserBottomPanel();

    }

  }

  var settingsMenu = document.getElementById("cgSettingsDropdown");

  if (settingsMenu && settingsMenu.style.display === "block") {

    if (!e.target.closest("#cgSettingsMenuBtn") && !e.target.closest("#cgSettingsDropdown")) {

      settingsMenu.style.display = "none";

    }

  }

  var menu = document.getElementById("gemini3DotDropdown");

  if (menu && menu.style.display === "block") {

    if (!e.target.closest(".cg-3dot-trigger") && !e.target.closest("#gemini3DotDropdown")) {

      menu.style.display = "none";

    }

  }

  var modelMenu = document.getElementById("geminiModelDropdown");

  if (modelMenu && modelMenu.style.display === "block") {

    if (!e.target.closest(".cg-model-title") && !e.target.closest("#geminiModelDropdown")) {

      closeGeminiModelMenu();

    }

  }

  var voicePicker = document.getElementById("geminiVoicePickerPanel");

  if (voicePicker && (voicePicker.style.display === "block" || voicePicker.style.display === "flex")) {

    if (!e.target.closest("#geminiVoiceTrigger") && !e.target.closest("#geminiVoicePickerPanel")) {

      closeVoicePicker();

    }

  }

});



function toggleMorePills() {

  var row = document.getElementById("cgMorePillsRow");

  if (!row) return;

  row.style.display = (row.style.display === "none" || !row.style.display) ? "flex" : "none";

}



function toggleCgSidebar() {
  var drawer = document.getElementById("cgSidebarDrawer");
  if (!drawer) return;

  var isClosed = (window.innerWidth >= 860)
    ? (drawer.classList.contains("mini-rail") || drawer.classList.contains("collapsed") || drawer.offsetWidth <= 72)
    : (!drawer.classList.contains("open"));

  if (isClosed) {
    openCgSidebar();
  } else {
    closeCgSidebar();
  }
}

function openCgSidebar() {
  if (typeof closeMiniRailUserPopover === "function") closeMiniRailUserPopover();
  var drawer = document.getElementById("cgSidebarDrawer");
  var backdrop = document.getElementById("cgSidebarBackdrop");
  var container = document.querySelector(".cg-app-container");
  if (!drawer) return;

  var savedW = parseInt(localStorage.getItem("panic_sidebar_width")) || 260;
  if (savedW <= 70) savedW = 260;

  drawer.classList.remove("cg-drawer-exiting", "collapsed", "mini-rail");
  drawer.classList.add("open");
  drawer.style.pointerEvents = "auto";

  if (window.innerWidth >= 860) {
    if (container) container.classList.remove("sidebar-collapsed");
    document.documentElement.style.setProperty("--cg-sidebar-width", savedW + "px");
    drawer.style.width = savedW + "px";
    if (backdrop) {
      backdrop.style.display = "none";
      backdrop.classList.remove("open", "backdrop-animating");
    }
  } else {
    document.body.classList.add("sidebar-open");
    drawer.style.width = "";
    if (backdrop) {
      backdrop.style.display = "block";
      backdrop.classList.add("open", "backdrop-animating");
    }
  }
}

function closeCgSidebar() {
  if (typeof closeMiniRailUserPopover === "function") closeMiniRailUserPopover();
  var drawer = document.getElementById("cgSidebarDrawer");
  var backdrop = document.getElementById("cgSidebarBackdrop");
  var container = document.querySelector(".cg-app-container");
  if (!drawer) return;

  if (window.innerWidth >= 860) {
    // Desktop: Smoothly collapse from Right to Left into the 64px Icon Rail
    drawer.classList.remove("open");
    drawer.classList.add("mini-rail", "collapsed");
    document.documentElement.style.setProperty("--cg-sidebar-width", "64px");
    drawer.style.width = "64px";
    drawer.style.pointerEvents = "auto";
    if (container) container.classList.add("sidebar-collapsed");
    if (backdrop) {
      backdrop.style.display = "none";
      backdrop.classList.remove("open", "backdrop-animating");
    }
  } else {
    // Mobile: Off-canvas slide right-to-left
    drawer.classList.remove("open");
    drawer.classList.add("collapsed");
    document.body.classList.remove("sidebar-open");
    if (backdrop) {
      backdrop.style.display = "none";
      backdrop.classList.remove("open", "backdrop-animating");
    }
  }
}



function toggleSidebarMenu() {

  toggleCgSidebar();

}



function initMobileDrawerGestureEngine() {

  var drawer = document.getElementById("cgSidebarDrawer");

  var backdrop = document.getElementById("cgSidebarBackdrop");

  if (!drawer) return;



  var drawerWidth = 0;

  var isOpen = false;

  var isDragging = false;

  var startX = 0;

  var startY = 0;

  var lastX = 0;

  var lastTime = 0;

  var velocity = 0;

  var currentX = 0;

  var rAF = null;



  function updateVisuals() {

    if (rAF) cancelAnimationFrame(rAF);

    rAF = requestAnimationFrame(function() {

      // 1. Move Drawer smoothly from -drawerWidth to 0

      drawer.style.transform = "translate3d(" + currentX + "px, 0, 0)";

      drawer.style.webkitTransform = "translate3d(" + currentX + "px, 0, 0)";



      // 2. Sync Backdrop Opacity

      var progress = Math.max(0, Math.min(1, (drawerWidth + currentX) / drawerWidth));

      if (backdrop) {

        backdrop.style.opacity = progress.toString();

        if (progress > 0.02) {

          backdrop.style.display = "block";

          backdrop.classList.add("open");

        } else if (!isOpen) {

          backdrop.style.display = "none";

          backdrop.classList.remove("open");

        }

      }

    });

  }



  function handleTouchStart(e) {

    if (window.innerWidth >= 860) return;

    if (!e.touches || e.touches.length !== 1) return;



    var target = e.target;

    isOpen = drawer.classList.contains("open");



    // Don't intercept touches if user is interacting with buttons/inputs while drawer is closed

    if (!isOpen && target && target.closest("button, a, input, select, textarea, .cg-tile, .hud-btn, .panic-btn, .tab-btn, .cg-chip, .cg-send-btn")) {

      startX = 0;

      return;

    }



    var x = e.touches[0].clientX;

    var y = e.touches[0].clientY;



    drawerWidth = drawer.getBoundingClientRect().width || (window.innerWidth * 0.85);



    // Allow swipe right from left 65% of screen when closed, or anywhere when open

    if (!isOpen && x > (window.innerWidth * 0.65)) return;



    startX = x;

    startY = y;

    lastX = x;

    lastTime = performance.now();

    isDragging = false;

    currentX = isOpen ? 0 : -drawerWidth;



    // Strip animation classes during finger tracking for 1:1 real-time movement

    drawer.classList.remove("drawer-animating");

    if (backdrop) {

      backdrop.classList.remove("backdrop-animating");

    }

  }



  function handleTouchMove(e) {

    if (startX === 0 || window.innerWidth >= 860) return;

    if (!e.touches || e.touches.length !== 1) return;



    var x = e.touches[0].clientX;

    var y = e.touches[0].clientY;

    var deltaX = x - startX;

    var deltaY = y - startY;



    if (!isDragging) {

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {

        if ((!isOpen && deltaX > 0) || (isOpen && deltaX < 0)) {

          isDragging = true;

        }

      } else if (Math.abs(deltaY) > 10) {

        // Vertical scroll intent: abort gesture

        startX = 0;

        return;

      }

    }



    if (isDragging) {

      if (e.cancelable) e.preventDefault();

      var now = performance.now();

      var dt = Math.max(1, now - lastTime);

      velocity = (x - lastX) / dt;

      lastX = x;

      lastTime = now;



      if (!isOpen) {

        // Pull drawer out from left side (0 to drawerWidth)

        currentX = Math.min(0, -drawerWidth + (deltaX * 1.2));

      } else {

        // Push drawer back into left side (0 to -drawerWidth)

        currentX = Math.min(0, deltaX);

      }



      currentX = Math.max(-drawerWidth, Math.min(0, currentX));

      updateVisuals();

    }

  }



  function handleTouchEnd(e) {

    if (!isDragging) {

      startX = 0;

      return;

    }

    isDragging = false;

    startX = 0;

    if (rAF) cancelAnimationFrame(rAF);



    var pulledDistance = drawerWidth + currentX;



    // Snap open or closed with smooth spring transition

    if (!isOpen) {

      if (velocity > 0.3 || pulledDistance > (drawerWidth * 0.35)) {

        openCgSidebar();

      } else {

        closeCgSidebar();

      }

    } else {

      if (velocity < -0.3 || pulledDistance < (drawerWidth * 0.7)) {

        closeCgSidebar();

      } else {

        openCgSidebar();

      }

    }

  }



  document.addEventListener("touchstart", handleTouchStart, { passive: true });

  document.addEventListener("touchmove", handleTouchMove, { passive: false });

  document.addEventListener("touchend", handleTouchEnd, { passive: true });

  document.addEventListener("touchcancel", handleTouchEnd, { passive: true });

  if (backdrop) {

    backdrop.addEventListener("click", function() {

      closeCgSidebar();

    });

  }

}

function initSidebarInitialState() {
  var drawer = document.getElementById("cgSidebarDrawer");
  if (!drawer) return;
  var savedW = parseInt(localStorage.getItem("panic_sidebar_width")) || 260;
  if (savedW <= 70) savedW = 260;
  if (window.innerWidth >= 860) {
    drawer.classList.add("open");
    drawer.classList.remove("collapsed", "mini-rail", "cg-drawer-exiting", "drawer-animating");
    drawer.style.width = savedW + "px";
    drawer.style.pointerEvents = "auto";
  } else {
    drawer.classList.add("collapsed");
    drawer.classList.remove("open", "mini-rail", "cg-drawer-exiting", "drawer-animating");
    drawer.style.pointerEvents = "none";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    initSidebarInitialState();
    initMobileDrawerGestureEngine();
  });
} else {
  initSidebarInitialState();
  initMobileDrawerGestureEngine();
}



// ============================================================================

// 🪟 FLOATING OPTION HOVER PREVIEW / DEMO FLYOUT ENGINE

// ============================================================================

var _flyoutHideTimeout = null;



function renderOptionFlyoutHTML(type) {

  if (type === "key") {

    var hasKey = !!(localStorage.getItem("gemini_api_key") || (window.DEFAULT_GEMINI_KEY));

    var masked = hasKey ? "AIzaSy••••••••••••38fQ" : "Not configured";

    var statusText = hasKey ? "Active & Encrypted" : "Ready to Add";

    var statusColor = hasKey ? "#10b981" : "#f59e0b";

    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-amber">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 8.5-8.5"/><path d="m15.5 7.5 2 2"/><path d="m18.5 4.5 2 2"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">Gemini API Key</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(245,158,11,0.12); color:#d97706; border:1px solid rgba(245,158,11,0.25);">Google AI</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">' +

          '<span style="width:6px;height:6px;border-radius:50%;background:' + statusColor + ';display:inline-block;box-shadow:0 0 6px ' + statusColor + ';"></span>' +

          'Status' +

        '</span>' +

        '<span class="cg-flyout-row-val" style="color:' + statusColor + '">' + statusText + '</span>' +

      '</div>' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">🔒 Key Vault</span>' +

        '<span class="cg-flyout-row-val">' + masked + '</span>' +

      '</div>' +

      '<div class="cg-flyout-pills" style="margin-top:2px;">' +

        '<span class="cg-flyout-pill">🎙️ Realtime Voice</span>' +

        '<span class="cg-flyout-pill">⚡ Free Quota</span>' +

        '<span class="cg-flyout-pill">🛡️ AES Encrypted</span>' +

      '</div>' +

    '</div>' +

    '<div class="cg-flyout-hint">' +

      '<span>Click to open API Key Settings</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  } else if (type === "persona") {

    var persona = (typeof getActivePersona === "function") ? getActivePersona() : { id: "default", name: "Default Assistant", emoji: "⚡" };

    var voiceName = localStorage.getItem("gemini_voice") || (persona.voice || "Puck");

    var greeting = "Hey there! Everything is running smoothly. How can I assist you?";

    if (persona.id === "girlfriend") greeting = "Hey handsome! I'm right here with you 💕 What are we doing today?";

    else if (persona.id === "jarvis") greeting = "All core PC telemetry online, sir. Standing by for commands.";

    else if (persona.id === "coder") greeting = "Codebase indexed. Ready for architectural analysis and debugging.";

    else if (persona.id === "mentor") greeting = "Let's approach this methodically. Focus on the core objective.";

    else if (persona.id === "buddy") greeting = "Sup bro! PC is cool and quiet. Ready when you are!";



    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-purple">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">AI Persona</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(124,58,237,0.12); color:#7c3aed; border:1px solid rgba(124,58,237,0.25);">' + (persona.emoji || "🎭") + ' Active</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">🎭 Active</span>' +

        '<span class="cg-flyout-row-val" style="color:#7c3aed">' + (persona.name || "Default") + '</span>' +

      '</div>' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">🎙️ Voice Signature</span>' +

        '<span class="cg-flyout-row-val" style="color:#0284c7">' + voiceName + '</span>' +

      '</div>' +

      '<div class="cg-flyout-quote">"' + greeting + '"</div>' +

    '</div>' +

    '<div class="cg-flyout-hint">' +

      '<span>Click to choose from 6 AI personas</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  } else if (type === "pairing") {

    var hostName = window.location.hostname || "localhost";

    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-cyan">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="19" x="5.5" y="2.5" rx="3"/><path d="M12 17.5h.01"/><path d="M9 6h6"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">Mobile QR Pairing</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(14,165,233,0.12); color:#0284c7; border:1px solid rgba(14,165,233,0.25);">Instant</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">📱 Protocol</span>' +

        '<span class="cg-flyout-row-val" style="color:#0284c7">HTTPS / WSS</span>' +

      '</div>' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">🌐 Host Node</span>' +

        '<span class="cg-flyout-row-val">' + hostName + '</span>' +

      '</div>' +

      '<div class="cg-flyout-pills" style="margin-top:2px;">' +

        '<span class="cg-flyout-pill">📷 1-Sec QR Scan</span>' +

        '<span class="cg-flyout-pill">📡 Wi-Fi Direct</span>' +

        '<span class="cg-flyout-pill">🛡️ Tailscale Mesh</span>' +

      '</div>' +

    '</div>' +

    '<div class="cg-flyout-hint">' +

      '<span>Click to scan or show QR code</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  } else if (type === "clear") {

    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-rose">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">Clear Chat</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(244,63,94,0.12); color:#e11d48; border:1px solid rgba(244,63,94,0.25);">Safe Reset</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-row" style="color:#e11d48;">' +

        '<span class="cg-flyout-row-label" style="color:#e11d48;">🧹 Resets</span>' +

        '<span class="cg-flyout-row-val" style="color:#e11d48;">Active Chat History</span>' +

      '</div>' +

      '<div class="cg-flyout-pills" style="margin-top:2px;">' +

        '<span class="cg-flyout-pill" style="color:#059669; border-color:rgba(16,185,129,0.3);">✓ Clears DOM Logs</span>' +

        '<span class="cg-flyout-pill" style="color:#059669; border-color:rgba(16,185,129,0.3);">✓ Frees RAM Cache</span>' +

        '<span class="cg-flyout-pill" style="color:#059669; border-color:rgba(16,185,129,0.3);">🔒 Keys Preserved</span>' +

      '</div>' +

    '</div>' +

    '<div class="cg-flyout-hint" style="color:#e11d48;">' +

      '<span>Click to reset chat log safely</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  } else if (type === "monitor") {

    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-cyan">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">PC Monitor</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(14,165,233,0.12); color:#0284c7; border:1px solid rgba(14,165,233,0.25);">Live Mirror</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">⚡ Framerate</span>' +

        '<span class="cg-flyout-row-val" style="color:#10b981">60 FPS Hardware</span>' +

      '</div>' +

      '<div class="cg-flyout-row">' +

        '<span class="cg-flyout-row-label">🎮 Latency</span>' +

        '<span class="cg-flyout-row-val" style="color:#0284c7">&lt; 15ms Ultra-low</span>' +

      '</div>' +

      '<div class="cg-flyout-pills" style="margin-top:2px;">' +

        '<span class="cg-flyout-pill">🖱️ Virtual Trackpad</span>' +

        '<span class="cg-flyout-pill">⌨️ Touch Keyboard</span>' +

      '</div>' +

    '</div>' +

    '<div class="cg-flyout-hint">' +

      '<span>Click to switch to PC Monitor</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  } else if (type === "panic") {

    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-rose">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">Emergency Panic</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.25);">Instant Defense</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-pills" style="flex-direction:column; gap:5px;">' +

        '<span class="cg-flyout-pill" style="color:#ef4444;">🔒 Locks Windows workstation immediately</span>' +

        '<span class="cg-flyout-pill" style="color:#ef4444;">🔇 Cuts & mutes all audio channels</span>' +

        '<span class="cg-flyout-pill" style="color:#ef4444;">🌑 Blanks screen backlight to 0%</span>' +

      '</div>' +

    '</div>' +

    '<div class="cg-flyout-hint" style="color:#ef4444;">' +

      '<span>Click to trigger emergency panic</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  } else if (type === "apk") {

    return '<div class="cg-flyout-header">' +

      '<div class="cg-flyout-title-wrap">' +

        '<div class="cg-flyout-icon-box cg-icon-cyan">' +

          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +

        '</div>' +

        '<span class="cg-flyout-title">Mobile APK</span>' +

      '</div>' +

      '<span class="cg-flyout-badge" style="background:rgba(14,165,233,0.12); color:#0284c7; border:1px solid rgba(14,165,233,0.25);">Android</span>' +

    '</div>' +

    '<div class="cg-flyout-demo-card">' +

      '<div class="cg-flyout-pills" style="flex-direction:column; gap:5px;">' +

        '<span class="cg-flyout-pill">📥 Standalone Android Client</span>' +

        '<span class="cg-flyout-pill">⚡ Direct Hardware Decoding</span>' +

        '<span class="cg-flyout-pill">📲 In-App QR Scanner Built-In</span>' +

      '</div>' +

    '</div>' +

    '<div class="cg-flyout-hint">' +

      '<span>Click to download APK file</span>' +

      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>' +

    '</div>';

  }

  return "";

}



function showOptionHoverFlyout(type, anchorEl) {

  var flyout = document.getElementById("cgOptionHoverFlyout");

  if (!flyout) {

    flyout = document.createElement("div");

    flyout.id = "cgOptionHoverFlyout";

    flyout.className = "cg-option-flyout-panel";

    flyout.setAttribute("aria-hidden", "true");

    document.body.appendChild(flyout);

  }

  if (flyout.parentElement !== document.body) {

    document.body.appendChild(flyout);

  }

  if (!anchorEl) return;

  var rect = anchorEl.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) return;



  var html = renderOptionFlyoutHTML(type);

  if (!html) return;



  flyout.innerHTML = html;

  flyout.classList.add("visible");

  flyout.setAttribute("aria-hidden", "false");



  var flyoutHeight = flyout.offsetHeight || 190;

  var left = rect.right + 12;

  var top = rect.top + (rect.height / 2) - (flyoutHeight / 2);



  top = Math.max(12, Math.min(window.innerHeight - flyoutHeight - 12, top));



  if (left + 280 > window.innerWidth) {

    left = Math.max(10, window.innerWidth - 285);

  }



  var arrowTop = (rect.top + rect.height / 2) - top;

  arrowTop = Math.max(16, Math.min(flyoutHeight - 16, arrowTop));

  flyout.style.setProperty("--arrow-top", arrowTop + "px");



  flyout.style.left = left + "px";

  flyout.style.top = top + "px";

}



function hideOptionHoverFlyout() {

  var flyout = document.getElementById("cgOptionHoverFlyout");

  if (flyout) {

    flyout.classList.remove("visible");

    flyout.setAttribute("aria-hidden", "true");

  }

}



function setupOptionHoverPreviews() {

  var items = document.querySelectorAll("[data-preview]");

  var flyout = document.getElementById("cgOptionHoverFlyout");

  if (!flyout) {

    flyout = document.createElement("div");

    flyout.id = "cgOptionHoverFlyout";

    flyout.className = "cg-option-flyout-panel";

    flyout.setAttribute("aria-hidden", "true");

    document.body.appendChild(flyout);

  }

  if (flyout.parentElement !== document.body) {

    document.body.appendChild(flyout);

  }



  for (var i = 0; i < items.length; i++) {

    (function(item) {

      if (item.hasAttribute("title")) item.removeAttribute("title");

      if (item._hasPreviewHoverAttached) return;

      item._hasPreviewHoverAttached = true;



      item.addEventListener("mouseenter", function() {

        if (item.closest("#cgMiniRailUserPopover")) {

          return;

        }

        if (item.id === "cgDrawerUserBtn" || item.closest("#cgDrawerUserBtn")) {

          var card = document.getElementById("cgUserCard");

          if (card && card.classList.contains("expanded")) {

            hideOptionHoverFlyout();

            return;

          }

          var popover = document.getElementById("cgMiniRailUserPopover");

          if (popover && popover.classList.contains("open")) {

            hideOptionHoverFlyout();

            return;

          }

        }

        if (_flyoutHideTimeout) {

          clearTimeout(_flyoutHideTimeout);

          _flyoutHideTimeout = null;

        }

        var type = item.getAttribute("data-preview");

        showOptionHoverFlyout(type, item);

      });



      item.addEventListener("mouseleave", function() {

        _flyoutHideTimeout = setTimeout(function() {

          hideOptionHoverFlyout();

        }, 90);

      });



      item.addEventListener("click", function() {

        hideOptionHoverFlyout();

      });

    })(items[i]);

  }

}



window.showOptionHoverFlyout = showOptionHoverFlyout;

window.hideOptionHoverFlyout = hideOptionHoverFlyout;

window.setupOptionHoverPreviews = setupOptionHoverPreviews;



window.addEventListener("DOMContentLoaded", function() {

  mountAntigravityOrb();


  setupOptionHoverPreviews();

});

setTimeout(function() {

  mountAntigravityOrb();


  setupOptionHoverPreviews();

}, 150);

setTimeout(function() {

  setupOptionHoverPreviews();

}, 500);









/**

 * Minified by jsDelivr using Terser v5.39.0.

 * Original file: /npm/jsqr@1.4.0/dist/jsQR.js

 *

 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files

 */

!function(o,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.jsQR=e():o.jsQR=e()}("undefined"!=typeof self?self:this,(function(){return function(o){var e={};function r(t){if(e[t])return e[t].exports;var c=e[t]={i:t,l:!1,exports:{}};return o[t].call(c.exports,c,c.exports,r),c.l=!0,c.exports}return r.m=o,r.c=e,r.d=function(o,e,t){r.o(o,e)||Object.defineProperty(o,e,{configurable:!1,enumerable:!0,get:t})},r.n=function(o){var e=o&&o.__esModule?function(){return o.default}:function(){return o};return r.d(e,"a",e),e},r.o=function(o,e){return Object.prototype.hasOwnProperty.call(o,e)},r.p="",r(r.s=3)}([function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function o(o,e){this.width=e,this.height=o.length/e,this.data=o}return o.createEmpty=function(e,r){return new o(new Uint8ClampedArray(e*r),e)},o.prototype.get=function(o,e){return!(o<0||o>=this.width||e<0||e>=this.height)&&!!this.data[e*this.width+o]},o.prototype.set=function(o,e,r){this.data[e*this.width+o]=r?1:0},o.prototype.setRegion=function(o,e,r,t,c){for(var s=e;s<e+t;s++)for(var a=o;a<o+r;a++)this.set(a,s,!!c)},o}();e.BitMatrix=t},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(2);e.addOrSubtractGF=function(o,e){return o^e};var c=function(){function o(o,e,r){this.primitive=o,this.size=e,this.generatorBase=r,this.expTable=new Array(this.size),this.logTable=new Array(this.size);for(var c=1,s=0;s<this.size;s++)this.expTable[s]=c,(c*=2)>=this.size&&(c=(c^this.primitive)&this.size-1);for(s=0;s<this.size-1;s++)this.logTable[this.expTable[s]]=s;this.zero=new t.default(this,Uint8ClampedArray.from([0])),this.one=new t.default(this,Uint8ClampedArray.from([1]))}return o.prototype.multiply=function(o,e){return 0===o||0===e?0:this.expTable[(this.logTable[o]+this.logTable[e])%(this.size-1)]},o.prototype.inverse=function(o){if(0===o)throw new Error("Can't invert 0");return this.expTable[this.size-this.logTable[o]-1]},o.prototype.buildMonomial=function(o,e){if(o<0)throw new Error("Invalid monomial degree less than 0");if(0===e)return this.zero;var r=new Uint8ClampedArray(o+1);return r[0]=e,new t.default(this,r)},o.prototype.log=function(o){if(0===o)throw new Error("Can't take log(0)");return this.logTable[o]},o.prototype.exp=function(o){return this.expTable[o]},o}();e.default=c},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(1),c=function(){function o(o,e){if(0===e.length)throw new Error("No coefficients.");this.field=o;var r=e.length;if(r>1&&0===e[0]){for(var t=1;t<r&&0===e[t];)t++;if(t===r)this.coefficients=o.zero.coefficients;else{this.coefficients=new Uint8ClampedArray(r-t);for(var c=0;c<this.coefficients.length;c++)this.coefficients[c]=e[t+c]}}else this.coefficients=e}return o.prototype.degree=function(){return this.coefficients.length-1},o.prototype.isZero=function(){return 0===this.coefficients[0]},o.prototype.getCoefficient=function(o){return this.coefficients[this.coefficients.length-1-o]},o.prototype.addOrSubtract=function(e){var r;if(this.isZero())return e;if(e.isZero())return this;var c=this.coefficients,s=e.coefficients;c.length>s.length&&(c=(r=[s,c])[0],s=r[1]);for(var a=new Uint8ClampedArray(s.length),n=s.length-c.length,d=0;d<n;d++)a[d]=s[d];for(d=n;d<s.length;d++)a[d]=t.addOrSubtractGF(c[d-n],s[d]);return new o(this.field,a)},o.prototype.multiply=function(e){if(0===e)return this.field.zero;if(1===e)return this;for(var r=this.coefficients.length,t=new Uint8ClampedArray(r),c=0;c<r;c++)t[c]=this.field.multiply(this.coefficients[c],e);return new o(this.field,t)},o.prototype.multiplyPoly=function(e){if(this.isZero()||e.isZero())return this.field.zero;for(var r=this.coefficients,c=r.length,s=e.coefficients,a=s.length,n=new Uint8ClampedArray(c+a-1),d=0;d<c;d++)for(var l=r[d],i=0;i<a;i++)n[d+i]=t.addOrSubtractGF(n[d+i],this.field.multiply(l,s[i]));return new o(this.field,n)},o.prototype.multiplyByMonomial=function(e,r){if(e<0)throw new Error("Invalid degree less than 0");if(0===r)return this.field.zero;for(var t=this.coefficients.length,c=new Uint8ClampedArray(t+e),s=0;s<t;s++)c[s]=this.field.multiply(this.coefficients[s],r);return new o(this.field,c)},o.prototype.evaluateAt=function(o){var e=0;if(0===o)return this.getCoefficient(0);var r=this.coefficients.length;if(1===o)return this.coefficients.forEach((function(o){e=t.addOrSubtractGF(e,o)})),e;e=this.coefficients[0];for(var c=1;c<r;c++)e=t.addOrSubtractGF(this.field.multiply(o,e),this.coefficients[c]);return e},o}();e.default=c},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(4),c=r(5),s=r(11),a=r(12);function n(o){var e=a.locate(o);if(!e)return null;for(var r=0,t=e;r<t.length;r++){var n=t[r],d=s.extract(o,n),l=c.decode(d.matrix);if(l)return{binaryData:l.bytes,data:l.text,chunks:l.chunks,version:l.version,location:{topRightCorner:d.mappingFunction(n.dimension,0),topLeftCorner:d.mappingFunction(0,0),bottomRightCorner:d.mappingFunction(n.dimension,n.dimension),bottomLeftCorner:d.mappingFunction(0,n.dimension),topRightFinderPattern:n.topRight,topLeftFinderPattern:n.topLeft,bottomLeftFinderPattern:n.bottomLeft,bottomRightAlignmentPattern:n.alignmentPattern}}}return null}var d={inversionAttempts:"attemptBoth"};function l(o,e,r,c){void 0===c&&(c={});var s=d;Object.keys(s||{}).forEach((function(o){s[o]=c[o]||s[o]}));var a="attemptBoth"===s.inversionAttempts||"invertFirst"===s.inversionAttempts,l="onlyInvert"===s.inversionAttempts||"invertFirst"===s.inversionAttempts,i=t.binarize(o,e,r,a),B=i.binarized,k=i.inverted,u=n(l?k:B);return u||"attemptBoth"!==s.inversionAttempts&&"invertFirst"!==s.inversionAttempts||(u=n(l?B:k)),u}l.default=l,e.default=l},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0);function c(o,e,r){return o<e?e:o>r?r:o}var s=function(){function o(o,e){this.width=o,this.data=new Uint8ClampedArray(o*e)}return o.prototype.get=function(o,e){return this.data[e*this.width+o]},o.prototype.set=function(o,e,r){this.data[e*this.width+o]=r},o}();e.binarize=function(o,e,r,a){if(o.length!==e*r*4)throw new Error("Malformed data passed to binarizer.");for(var n=new s(e,r),d=0;d<e;d++)for(var l=0;l<r;l++){var i=o[4*(l*e+d)+0],B=o[4*(l*e+d)+1],k=o[4*(l*e+d)+2];n.set(d,l,.2126*i+.7152*B+.0722*k)}for(var u=Math.ceil(e/8),C=Math.ceil(r/8),m=new s(u,C),f=0;f<C;f++)for(var w=0;w<u;w++){var P=0,v=1/0,h=0;for(l=0;l<8;l++)for(d=0;d<8;d++){var y=n.get(8*w+d,8*f+l);P+=y,v=Math.min(v,y),h=Math.max(h,y)}var p=P/Math.pow(8,2);if(h-v<=24&&(p=v/2,f>0&&w>0)){var b=(m.get(w,f-1)+2*m.get(w-1,f)+m.get(w-1,f-1))/4;v<b&&(p=b)}m.set(w,f,p)}var g=t.BitMatrix.createEmpty(e,r),x=null;for(a&&(x=t.BitMatrix.createEmpty(e,r)),f=0;f<C;f++)for(w=0;w<u;w++){for(var M=c(w,2,u-3),L=c(f,2,C-3),N=(P=0,-2);N<=2;N++)for(var I=-2;I<=2;I++)P+=m.get(M+N,L+I);var O=P/25;for(N=0;N<8;N++)for(I=0;I<8;I++){d=8*w+N,l=8*f+I;var z=n.get(d,l);g.set(d,l,z<=O),a&&x.set(d,l,!(z<=O))}}return a?{binarized:g,inverted:x}:{binarized:g}}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0),c=r(6),s=r(9),a=r(10);function n(o,e){for(var r=o^e,t=0;r;)t++,r&=r-1;return t}function d(o,e){return e<<1|o}var l=[{bits:21522,formatInfo:{errorCorrectionLevel:1,dataMask:0}},{bits:20773,formatInfo:{errorCorrectionLevel:1,dataMask:1}},{bits:24188,formatInfo:{errorCorrectionLevel:1,dataMask:2}},{bits:23371,formatInfo:{errorCorrectionLevel:1,dataMask:3}},{bits:17913,formatInfo:{errorCorrectionLevel:1,dataMask:4}},{bits:16590,formatInfo:{errorCorrectionLevel:1,dataMask:5}},{bits:20375,formatInfo:{errorCorrectionLevel:1,dataMask:6}},{bits:19104,formatInfo:{errorCorrectionLevel:1,dataMask:7}},{bits:30660,formatInfo:{errorCorrectionLevel:0,dataMask:0}},{bits:29427,formatInfo:{errorCorrectionLevel:0,dataMask:1}},{bits:32170,formatInfo:{errorCorrectionLevel:0,dataMask:2}},{bits:30877,formatInfo:{errorCorrectionLevel:0,dataMask:3}},{bits:26159,formatInfo:{errorCorrectionLevel:0,dataMask:4}},{bits:25368,formatInfo:{errorCorrectionLevel:0,dataMask:5}},{bits:27713,formatInfo:{errorCorrectionLevel:0,dataMask:6}},{bits:26998,formatInfo:{errorCorrectionLevel:0,dataMask:7}},{bits:5769,formatInfo:{errorCorrectionLevel:3,dataMask:0}},{bits:5054,formatInfo:{errorCorrectionLevel:3,dataMask:1}},{bits:7399,formatInfo:{errorCorrectionLevel:3,dataMask:2}},{bits:6608,formatInfo:{errorCorrectionLevel:3,dataMask:3}},{bits:1890,formatInfo:{errorCorrectionLevel:3,dataMask:4}},{bits:597,formatInfo:{errorCorrectionLevel:3,dataMask:5}},{bits:3340,formatInfo:{errorCorrectionLevel:3,dataMask:6}},{bits:2107,formatInfo:{errorCorrectionLevel:3,dataMask:7}},{bits:13663,formatInfo:{errorCorrectionLevel:2,dataMask:0}},{bits:12392,formatInfo:{errorCorrectionLevel:2,dataMask:1}},{bits:16177,formatInfo:{errorCorrectionLevel:2,dataMask:2}},{bits:14854,formatInfo:{errorCorrectionLevel:2,dataMask:3}},{bits:9396,formatInfo:{errorCorrectionLevel:2,dataMask:4}},{bits:8579,formatInfo:{errorCorrectionLevel:2,dataMask:5}},{bits:11994,formatInfo:{errorCorrectionLevel:2,dataMask:6}},{bits:11245,formatInfo:{errorCorrectionLevel:2,dataMask:7}}],i=[function(o){return(o.y+o.x)%2==0},function(o){return o.y%2==0},function(o){return o.x%3==0},function(o){return(o.y+o.x)%3==0},function(o){return(Math.floor(o.y/2)+Math.floor(o.x/3))%2==0},function(o){return o.x*o.y%2+o.x*o.y%3==0},function(o){return(o.y*o.x%2+o.y*o.x%3)%2==0},function(o){return((o.y+o.x)%2+o.y*o.x%3)%2==0}];function B(o,e,r){for(var c=i[r.dataMask],s=o.height,a=function(o){var e=17+4*o.versionNumber,r=t.BitMatrix.createEmpty(e,e);r.setRegion(0,0,9,9,!0),r.setRegion(e-8,0,8,9,!0),r.setRegion(0,e-8,9,8,!0);for(var c=0,s=o.alignmentPatternCenters;c<s.length;c++)for(var a=s[c],n=0,d=o.alignmentPatternCenters;n<d.length;n++){var l=d[n];6===a&&6===l||6===a&&l===e-7||a===e-7&&6===l||r.setRegion(a-2,l-2,5,5,!0)}return r.setRegion(6,9,1,e-17,!0),r.setRegion(9,6,e-17,1,!0),o.versionNumber>6&&(r.setRegion(e-11,0,3,6,!0),r.setRegion(0,e-11,6,3,!0)),r}(e),n=[],l=0,B=0,k=!0,u=s-1;u>0;u-=2){6===u&&u--;for(var C=0;C<s;C++)for(var m=k?s-1-C:C,f=0;f<2;f++){var w=u-f;if(!a.get(w,m)){B++;var P=o.get(w,m);c({y:m,x:w})&&(P=!P),l=d(P,l),8===B&&(n.push(l),B=0,l=0)}}k=!k}return n}function k(o){var e=function(o){var e=o.height,r=Math.floor((e-17)/4);if(r<=6)return a.VERSIONS[r-1];for(var t=0,c=5;c>=0;c--)for(var s=e-9;s>=e-11;s--)t=d(o.get(s,c),t);var l=0;for(s=5;s>=0;s--)for(c=e-9;c>=e-11;c--)l=d(o.get(s,c),l);for(var i,B=1/0,k=0,u=a.VERSIONS;k<u.length;k++){var C=u[k];if(C.infoBits===t||C.infoBits===l)return C;var m=n(t,C.infoBits);m<B&&(i=C,B=m),(m=n(l,C.infoBits))<B&&(i=C,B=m)}return B<=3?i:void 0}(o);if(!e)return null;var r=function(o){for(var e=0,r=0;r<=8;r++)6!==r&&(e=d(o.get(r,8),e));for(var t=7;t>=0;t--)6!==t&&(e=d(o.get(8,t),e));var c=o.height,s=0;for(t=c-1;t>=c-7;t--)s=d(o.get(8,t),s);for(r=c-8;r<c;r++)s=d(o.get(r,8),s);for(var a=1/0,i=null,B=0,k=l;B<k.length;B++){var u=k[B],C=u.bits,m=u.formatInfo;if(C===e||C===s)return m;var f=n(e,C);f<a&&(i=m,a=f),e!==s&&(f=n(s,C))<a&&(i=m,a=f)}return a<=3?i:null}(o);if(!r)return null;var t=function(o,e,r){var t=e.errorCorrectionLevels[r],c=[],s=0;if(t.ecBlocks.forEach((function(o){for(var e=0;e<o.numBlocks;e++)c.push({numDataCodewords:o.dataCodewordsPerBlock,codewords:[]}),s+=o.dataCodewordsPerBlock+t.ecCodewordsPerBlock})),o.length<s)return null;o=o.slice(0,s);for(var a=t.ecBlocks[0].dataCodewordsPerBlock,n=0;n<a;n++)for(var d=0,l=c;d<l.length;d++)l[d].codewords.push(o.shift());if(t.ecBlocks.length>1){var i=t.ecBlocks[0].numBlocks,B=t.ecBlocks[1].numBlocks;for(n=0;n<B;n++)c[i+n].codewords.push(o.shift())}for(;o.length>0;)for(var k=0,u=c;k<u.length;k++)u[k].codewords.push(o.shift());return c}(B(o,e,r),e,r.errorCorrectionLevel);if(!t)return null;for(var i=t.reduce((function(o,e){return o+e.numDataCodewords}),0),k=new Uint8ClampedArray(i),u=0,C=0,m=t;C<m.length;C++){var f=m[C],w=s.decode(f.codewords,f.codewords.length-f.numDataCodewords);if(!w)return null;for(var P=0;P<f.numDataCodewords;P++)k[u++]=w[P]}try{return c.decode(k,e.versionNumber)}catch(o){return null}}e.decode=function(o){if(null==o)return null;var e=k(o);if(e)return e;for(var r=0;r<o.width;r++)for(var t=r+1;t<o.height;t++)o.get(r,t)!==o.get(t,r)&&(o.set(r,t,!o.get(r,t)),o.set(t,r,!o.get(t,r)));return k(o)}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t,c,s=r(7),a=r(8);function n(o,e){for(var r=[],t="",c=[10,12,14][e],s=o.readBits(c);s>=3;){if((l=o.readBits(10))>=1e3)throw new Error("Invalid numeric value above 999");var a=Math.floor(l/100),n=Math.floor(l/10)%10,d=l%10;r.push(48+a,48+n,48+d),t+=a.toString()+n.toString()+d.toString(),s-=3}if(2===s){if((l=o.readBits(7))>=100)throw new Error("Invalid numeric value above 99");a=Math.floor(l/10),n=l%10;r.push(48+a,48+n),t+=a.toString()+n.toString()}else if(1===s){var l;if((l=o.readBits(4))>=10)throw new Error("Invalid numeric value above 9");r.push(48+l),t+=l.toString()}return{bytes:r,text:t}}!function(o){o.Numeric="numeric",o.Alphanumeric="alphanumeric",o.Byte="byte",o.Kanji="kanji",o.ECI="eci"}(t=e.Mode||(e.Mode={})),function(o){o[o.Terminator=0]="Terminator",o[o.Numeric=1]="Numeric",o[o.Alphanumeric=2]="Alphanumeric",o[o.Byte=4]="Byte",o[o.Kanji=8]="Kanji",o[o.ECI=7]="ECI"}(c||(c={}));var d=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function l(o,e){for(var r=[],t="",c=[9,11,13][e],s=o.readBits(c);s>=2;){var a=o.readBits(11),n=Math.floor(a/45),l=a%45;r.push(d[n].charCodeAt(0),d[l].charCodeAt(0)),t+=d[n]+d[l],s-=2}if(1===s){n=o.readBits(6);r.push(d[n].charCodeAt(0)),t+=d[n]}return{bytes:r,text:t}}function i(o,e){for(var r=[],t="",c=[8,16,16][e],s=o.readBits(c),a=0;a<s;a++){var n=o.readBits(8);r.push(n)}try{t+=decodeURIComponent(r.map((function(o){return"%"+("0"+o.toString(16)).substr(-2)})).join(""))}catch(o){}return{bytes:r,text:t}}function B(o,e){for(var r=[],t="",c=[8,10,12][e],s=o.readBits(c),n=0;n<s;n++){var d=o.readBits(13),l=Math.floor(d/192)<<8|d%192;l+=l<7936?33088:49472,r.push(l>>8,255&l),t+=String.fromCharCode(a.shiftJISTable[l])}return{bytes:r,text:t}}e.decode=function(o,e){for(var r,a,d,k,u=new s.BitStream(o),C=e<=9?0:e<=26?1:2,m={text:"",bytes:[],chunks:[],version:e};u.available()>=4;){var f=u.readBits(4);if(f===c.Terminator)return m;if(f===c.ECI)0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(7)}):0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(14)}):0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(21)}):m.chunks.push({type:t.ECI,assignmentNumber:-1});else if(f===c.Numeric){var w=n(u,C);m.text+=w.text,(r=m.bytes).push.apply(r,w.bytes),m.chunks.push({type:t.Numeric,text:w.text})}else if(f===c.Alphanumeric){var P=l(u,C);m.text+=P.text,(a=m.bytes).push.apply(a,P.bytes),m.chunks.push({type:t.Alphanumeric,text:P.text})}else if(f===c.Byte){var v=i(u,C);m.text+=v.text,(d=m.bytes).push.apply(d,v.bytes),m.chunks.push({type:t.Byte,bytes:v.bytes,text:v.text})}else if(f===c.Kanji){var h=B(u,C);m.text+=h.text,(k=m.bytes).push.apply(k,h.bytes),m.chunks.push({type:t.Kanji,bytes:h.bytes,text:h.text})}}if(0===u.available()||0===u.readBits(u.available()))return m}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function o(o){this.byteOffset=0,this.bitOffset=0,this.bytes=o}return o.prototype.readBits=function(o){if(o<1||o>32||o>this.available())throw new Error("Cannot read "+o.toString()+" bits");var e=0;if(this.bitOffset>0){var r=8-this.bitOffset,t=o<r?o:r,c=255>>8-t<<(s=r-t);e=(this.bytes[this.byteOffset]&c)>>s,o-=t,this.bitOffset+=t,8===this.bitOffset&&(this.bitOffset=0,this.byteOffset++)}if(o>0){for(;o>=8;)e=e<<8|255&this.bytes[this.byteOffset],this.byteOffset++,o-=8;if(o>0){var s;c=255>>(s=8-o)<<s;e=e<<o|(this.bytes[this.byteOffset]&c)>>s,this.bitOffset+=o}}return e},o.prototype.available=function(){return 8*(this.bytes.length-this.byteOffset)-this.bitOffset},o}();e.BitStream=t},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.shiftJISTable={32:32,33:33,34:34,35:35,36:36,37:37,38:38,39:39,40:40,41:41,42:42,43:43,44:44,45:45,46:46,47:47,48:48,49:49,50:50,51:51,52:52,53:53,54:54,55:55,56:56,57:57,58:58,59:59,60:60,61:61,62:62,63:63,64:64,65:65,66:66,67:67,68:68,69:69,70:70,71:71,72:72,73:73,74:74,75:75,76:76,77:77,78:78,79:79,80:80,81:81,82:82,83:83,84:84,85:85,86:86,87:87,88:88,89:89,90:90,91:91,92:165,93:93,94:94,95:95,96:96,97:97,98:98,99:99,100:100,101:101,102:102,103:103,104:104,105:105,106:106,107:107,108:108,109:109,110:110,111:111,112:112,113:113,114:114,115:115,116:116,117:117,118:118,119:119,120:120,121:121,122:122,123:123,124:124,125:125,126:8254,33088:12288,33089:12289,33090:12290,33091:65292,33092:65294,33093:12539,33094:65306,33095:65307,33096:65311,33097:65281,33098:12443,33099:12444,33100:180,33101:65344,33102:168,33103:65342,33104:65507,33105:65343,33106:12541,33107:12542,33108:12445,33109:12446,33110:12291,33111:20189,33112:12293,33113:12294,33114:12295,33115:12540,33116:8213,33117:8208,33118:65295,33119:92,33120:12316,33121:8214,33122:65372,33123:8230,33124:8229,33125:8216,33126:8217,33127:8220,33128:8221,33129:65288,33130:65289,33131:12308,33132:12309,33133:65339,33134:65341,33135:65371,33136:65373,33137:12296,33138:12297,33139:12298,33140:12299,33141:12300,33142:12301,33143:12302,33144:12303,33145:12304,33146:12305,33147:65291,33148:8722,33149:177,33150:215,33152:247,33153:65309,33154:8800,33155:65308,33156:65310,33157:8806,33158:8807,33159:8734,33160:8756,33161:9794,33162:9792,33163:176,33164:8242,33165:8243,33166:8451,33167:65509,33168:65284,33169:162,33170:163,33171:65285,33172:65283,33173:65286,33174:65290,33175:65312,33176:167,33177:9734,33178:9733,33179:9675,33180:9679,33181:9678,33182:9671,33183:9670,33184:9633,33185:9632,33186:9651,33187:9650,33188:9661,33189:9660,33190:8251,33191:12306,33192:8594,33193:8592,33194:8593,33195:8595,33196:12307,33208:8712,33209:8715,33210:8838,33211:8839,33212:8834,33213:8835,33214:8746,33215:8745,33224:8743,33225:8744,33226:172,33227:8658,33228:8660,33229:8704,33230:8707,33242:8736,33243:8869,33244:8978,33245:8706,33246:8711,33247:8801,33248:8786,33249:8810,33250:8811,33251:8730,33252:8765,33253:8733,33254:8757,33255:8747,33256:8748,33264:8491,33265:8240,33266:9839,33267:9837,33268:9834,33269:8224,33270:8225,33271:182,33276:9711,33359:65296,33360:65297,33361:65298,33362:65299,33363:65300,33364:65301,33365:65302,33366:65303,33367:65304,33368:65305,33376:65313,33377:65314,33378:65315,33379:65316,33380:65317,33381:65318,33382:65319,33383:65320,33384:65321,33385:65322,33386:65323,33387:65324,33388:65325,33389:65326,33390:65327,33391:65328,33392:65329,33393:65330,33394:65331,33395:65332,33396:65333,33397:65334,33398:65335,33399:65336,33400:65337,33401:65338,33409:65345,33410:65346,33411:65347,33412:65348,33413:65349,33414:65350,33415:65351,33416:65352,33417:65353,33418:65354,33419:65355,33420:65356,33421:65357,33422:65358,33423:65359,33424:65360,33425:65361,33426:65362,33427:65363,33428:65364,33429:65365,33430:65366,33431:65367,33432:65368,33433:65369,33434:65370,33439:12353,33440:12354,33441:12355,33442:12356,33443:12357,33444:12358,33445:12359,33446:12360,33447:12361,33448:12362,33449:12363,33450:12364,33451:12365,33452:12366,33453:12367,33454:12368,33455:12369,33456:12370,33457:12371,33458:12372,33459:12373,33460:12374,33461:12375,33462:12376,33463:12377,33464:12378,33465:12379,33466:12380,33467:12381,33468:12382,33469:12383,33470:12384,33471:12385,33472:12386,33473:12387,33474:12388,33475:12389,33476:12390,33477:12391,33478:12392,33479:12393,33480:12394,33481:12395,33482:12396,33483:12397,33484:12398,33485:12399,33486:12400,33487:12401,33488:12402,33489:12403,33490:12404,33491:12405,33492:12406,33493:12407,33494:12408,33495:12409,33496:12410,33497:12411,33498:12412,33499:12413,33500:12414,33501:12415,33502:12416,33503:12417,33504:12418,33505:12419,33506:12420,33507:12421,33508:12422,33509:12423,33510:12424,33511:12425,33512:12426,33513:12427,33514:12428,33515:12429,33516:12430,33517:12431,33518:12432,33519:12433,33520:12434,33521:12435,33600:12449,33601:12450,33602:12451,33603:12452,33604:12453,33605:12454,33606:12455,33607:12456,33608:12457,33609:12458,33610:12459,33611:12460,33612:12461,33613:12462,33614:12463,33615:12464,33616:12465,33617:12466,33618:12467,33619:12468,33620:12469,33621:12470,33622:12471,33623:12472,33624:12473,33625:12474,33626:12475,33627:12476,33628:12477,33629:12478,33630:12479,33631:12480,33632:12481,33633:12482,33634:12483,33635:12484,33636:12485,33637:12486,33638:12487,33639:12488,33640:12489,33641:12490,33642:12491,33643:12492,33644:12493,33645:12494,33646:12495,33647:12496,33648:12497,33649:12498,33650:12499,33651:12500,33652:12501,33653:12502,33654:12503,33655:12504,33656:12505,33657:12506,33658:12507,33659:12508,33660:12509,33661:12510,33662:12511,33664:12512,33665:12513,33666:12514,33667:12515,33668:12516,33669:12517,33670:12518,33671:12519,33672:12520,33673:12521,33674:12522,33675:12523,33676:12524,33677:12525,33678:12526,33679:12527,33680:12528,33681:12529,33682:12530,33683:12531,33684:12532,33685:12533,33686:12534,33695:913,33696:914,33697:915,33698:916,33699:917,33700:918,33701:919,33702:920,33703:921,33704:922,33705:923,33706:924,33707:925,33708:926,33709:927,33710:928,33711:929,33712:931,33713:932,33714:933,33715:934,33716:935,33717:936,33718:937,33727:945,33728:946,33729:947,33730:948,33731:949,33732:950,33733:951,33734:952,33735:953,33736:954,33737:955,33738:956,33739:957,33740:958,33741:959,33742:960,33743:961,33744:963,33745:964,33746:965,33747:966,33748:967,33749:968,33750:969,33856:1040,33857:1041,33858:1042,33859:1043,33860:1044,33861:1045,33862:1025,33863:1046,33864:1047,33865:1048,33866:1049,33867:1050,33868:1051,33869:1052,33870:1053,33871:1054,33872:1055,33873:1056,33874:1057,33875:1058,33876:1059,33877:1060,33878:1061,33879:1062,33880:1063,33881:1064,33882:1065,33883:1066,33884:1067,33885:1068,33886:1069,33887:1070,33888:1071,33904:1072,33905:1073,33906:1074,33907:1075,33908:1076,33909:1077,33910:1105,33911:1078,33912:1079,33913:1080,33914:1081,33915:1082,33916:1083,33917:1084,33918:1085,33920:1086,33921:1087,33922:1088,33923:1089,33924:1090,33925:1091,33926:1092,33927:1093,33928:1094,33929:1095,33930:1096,33931:1097,33932:1098,33933:1099,33934:1100,33935:1101,33936:1102,33937:1103,33951:9472,33952:9474,33953:9484,33954:9488,33955:9496,33956:9492,33957:9500,33958:9516,33959:9508,33960:9524,33961:9532,33962:9473,33963:9475,33964:9487,33965:9491,33966:9499,33967:9495,33968:9507,33969:9523,33970:9515,33971:9531,33972:9547,33973:9504,33974:9519,33975:9512,33976:9527,33977:9535,33978:9501,33979:9520,33980:9509,33981:9528,33982:9538,34975:20124,34976:21782,34977:23043,34978:38463,34979:21696,34980:24859,34981:25384,34982:23030,34983:36898,34984:33909,34985:33564,34986:31312,34987:24746,34988:25569,34989:28197,34990:26093,34991:33894,34992:33446,34993:39925,34994:26771,34995:22311,34996:26017,34997:25201,34998:23451,34999:22992,35e3:34427,35001:39156,35002:32098,35003:32190,35004:39822,35005:25110,35006:31903,35007:34999,35008:23433,35009:24245,35010:25353,35011:26263,35012:26696,35013:38343,35014:38797,35015:26447,35016:20197,35017:20234,35018:20301,35019:20381,35020:20553,35021:22258,35022:22839,35023:22996,35024:23041,35025:23561,35026:24799,35027:24847,35028:24944,35029:26131,35030:26885,35031:28858,35032:30031,35033:30064,35034:31227,35035:32173,35036:32239,35037:32963,35038:33806,35039:34915,35040:35586,35041:36949,35042:36986,35043:21307,35044:20117,35045:20133,35046:22495,35047:32946,35048:37057,35049:30959,35050:19968,35051:22769,35052:28322,35053:36920,35054:31282,35055:33576,35056:33419,35057:39983,35058:20801,35059:21360,35060:21693,35061:21729,35062:22240,35063:23035,35064:24341,35065:39154,35066:28139,35067:32996,35068:34093,35136:38498,35137:38512,35138:38560,35139:38907,35140:21515,35141:21491,35142:23431,35143:28879,35144:32701,35145:36802,35146:38632,35147:21359,35148:40284,35149:31418,35150:19985,35151:30867,35152:33276,35153:28198,35154:22040,35155:21764,35156:27421,35157:34074,35158:39995,35159:23013,35160:21417,35161:28006,35162:29916,35163:38287,35164:22082,35165:20113,35166:36939,35167:38642,35168:33615,35169:39180,35170:21473,35171:21942,35172:23344,35173:24433,35174:26144,35175:26355,35176:26628,35177:27704,35178:27891,35179:27945,35180:29787,35181:30408,35182:31310,35183:38964,35184:33521,35185:34907,35186:35424,35187:37613,35188:28082,35189:30123,35190:30410,35191:39365,35192:24742,35193:35585,35194:36234,35195:38322,35196:27022,35197:21421,35198:20870,35200:22290,35201:22576,35202:22852,35203:23476,35204:24310,35205:24616,35206:25513,35207:25588,35208:27839,35209:28436,35210:28814,35211:28948,35212:29017,35213:29141,35214:29503,35215:32257,35216:33398,35217:33489,35218:34199,35219:36960,35220:37467,35221:40219,35222:22633,35223:26044,35224:27738,35225:29989,35226:20985,35227:22830,35228:22885,35229:24448,35230:24540,35231:25276,35232:26106,35233:27178,35234:27431,35235:27572,35236:29579,35237:32705,35238:35158,35239:40236,35240:40206,35241:40644,35242:23713,35243:27798,35244:33659,35245:20740,35246:23627,35247:25014,35248:33222,35249:26742,35250:29281,35251:20057,35252:20474,35253:21368,35254:24681,35255:28201,35256:31311,35257:38899,35258:19979,35259:21270,35260:20206,35261:20309,35262:20285,35263:20385,35264:20339,35265:21152,35266:21487,35267:22025,35268:22799,35269:23233,35270:23478,35271:23521,35272:31185,35273:26247,35274:26524,35275:26550,35276:27468,35277:27827,35278:28779,35279:29634,35280:31117,35281:31166,35282:31292,35283:31623,35284:33457,35285:33499,35286:33540,35287:33655,35288:33775,35289:33747,35290:34662,35291:35506,35292:22057,35293:36008,35294:36838,35295:36942,35296:38686,35297:34442,35298:20420,35299:23784,35300:25105,35301:29273,35302:30011,35303:33253,35304:33469,35305:34558,35306:36032,35307:38597,35308:39187,35309:39381,35310:20171,35311:20250,35312:35299,35313:22238,35314:22602,35315:22730,35316:24315,35317:24555,35318:24618,35319:24724,35320:24674,35321:25040,35322:25106,35323:25296,35324:25913,35392:39745,35393:26214,35394:26800,35395:28023,35396:28784,35397:30028,35398:30342,35399:32117,35400:33445,35401:34809,35402:38283,35403:38542,35404:35997,35405:20977,35406:21182,35407:22806,35408:21683,35409:23475,35410:23830,35411:24936,35412:27010,35413:28079,35414:30861,35415:33995,35416:34903,35417:35442,35418:37799,35419:39608,35420:28012,35421:39336,35422:34521,35423:22435,35424:26623,35425:34510,35426:37390,35427:21123,35428:22151,35429:21508,35430:24275,35431:25313,35432:25785,35433:26684,35434:26680,35435:27579,35436:29554,35437:30906,35438:31339,35439:35226,35440:35282,35441:36203,35442:36611,35443:37101,35444:38307,35445:38548,35446:38761,35447:23398,35448:23731,35449:27005,35450:38989,35451:38990,35452:25499,35453:31520,35454:27179,35456:27263,35457:26806,35458:39949,35459:28511,35460:21106,35461:21917,35462:24688,35463:25324,35464:27963,35465:28167,35466:28369,35467:33883,35468:35088,35469:36676,35470:19988,35471:39993,35472:21494,35473:26907,35474:27194,35475:38788,35476:26666,35477:20828,35478:31427,35479:33970,35480:37340,35481:37772,35482:22107,35483:40232,35484:26658,35485:33541,35486:33841,35487:31909,35488:21e3,35489:33477,35490:29926,35491:20094,35492:20355,35493:20896,35494:23506,35495:21002,35496:21208,35497:21223,35498:24059,35499:21914,35500:22570,35501:23014,35502:23436,35503:23448,35504:23515,35505:24178,35506:24185,35507:24739,35508:24863,35509:24931,35510:25022,35511:25563,35512:25954,35513:26577,35514:26707,35515:26874,35516:27454,35517:27475,35518:27735,35519:28450,35520:28567,35521:28485,35522:29872,35523:29976,35524:30435,35525:30475,35526:31487,35527:31649,35528:31777,35529:32233,35530:32566,35531:32752,35532:32925,35533:33382,35534:33694,35535:35251,35536:35532,35537:36011,35538:36996,35539:37969,35540:38291,35541:38289,35542:38306,35543:38501,35544:38867,35545:39208,35546:33304,35547:20024,35548:21547,35549:23736,35550:24012,35551:29609,35552:30284,35553:30524,35554:23721,35555:32747,35556:36107,35557:38593,35558:38929,35559:38996,35560:39e3,35561:20225,35562:20238,35563:21361,35564:21916,35565:22120,35566:22522,35567:22855,35568:23305,35569:23492,35570:23696,35571:24076,35572:24190,35573:24524,35574:25582,35575:26426,35576:26071,35577:26082,35578:26399,35579:26827,35580:26820,35648:27231,35649:24112,35650:27589,35651:27671,35652:27773,35653:30079,35654:31048,35655:23395,35656:31232,35657:32e3,35658:24509,35659:35215,35660:35352,35661:36020,35662:36215,35663:36556,35664:36637,35665:39138,35666:39438,35667:39740,35668:20096,35669:20605,35670:20736,35671:22931,35672:23452,35673:25135,35674:25216,35675:25836,35676:27450,35677:29344,35678:30097,35679:31047,35680:32681,35681:34811,35682:35516,35683:35696,35684:25516,35685:33738,35686:38816,35687:21513,35688:21507,35689:21931,35690:26708,35691:27224,35692:35440,35693:30759,35694:26485,35695:40653,35696:21364,35697:23458,35698:33050,35699:34384,35700:36870,35701:19992,35702:20037,35703:20167,35704:20241,35705:21450,35706:21560,35707:23470,35708:24339,35709:24613,35710:25937,35712:26429,35713:27714,35714:27762,35715:27875,35716:28792,35717:29699,35718:31350,35719:31406,35720:31496,35721:32026,35722:31998,35723:32102,35724:26087,35725:29275,35726:21435,35727:23621,35728:24040,35729:25298,35730:25312,35731:25369,35732:28192,35733:34394,35734:35377,35735:36317,35736:37624,35737:28417,35738:31142,35739:39770,35740:20136,35741:20139,35742:20140,35743:20379,35744:20384,35745:20689,35746:20807,35747:31478,35748:20849,35749:20982,35750:21332,35751:21281,35752:21375,35753:21483,35754:21932,35755:22659,35756:23777,35757:24375,35758:24394,35759:24623,35760:24656,35761:24685,35762:25375,35763:25945,35764:27211,35765:27841,35766:29378,35767:29421,35768:30703,35769:33016,35770:33029,35771:33288,35772:34126,35773:37111,35774:37857,35775:38911,35776:39255,35777:39514,35778:20208,35779:20957,35780:23597,35781:26241,35782:26989,35783:23616,35784:26354,35785:26997,35786:29577,35787:26704,35788:31873,35789:20677,35790:21220,35791:22343,35792:24062,35793:37670,35794:26020,35795:27427,35796:27453,35797:29748,35798:31105,35799:31165,35800:31563,35801:32202,35802:33465,35803:33740,35804:34943,35805:35167,35806:35641,35807:36817,35808:37329,35809:21535,35810:37504,35811:20061,35812:20534,35813:21477,35814:21306,35815:29399,35816:29590,35817:30697,35818:33510,35819:36527,35820:39366,35821:39368,35822:39378,35823:20855,35824:24858,35825:34398,35826:21936,35827:31354,35828:20598,35829:23507,35830:36935,35831:38533,35832:20018,35833:27355,35834:37351,35835:23633,35836:23624,35904:25496,35905:31391,35906:27795,35907:38772,35908:36705,35909:31402,35910:29066,35911:38536,35912:31874,35913:26647,35914:32368,35915:26705,35916:37740,35917:21234,35918:21531,35919:34219,35920:35347,35921:32676,35922:36557,35923:37089,35924:21350,35925:34952,35926:31041,35927:20418,35928:20670,35929:21009,35930:20804,35931:21843,35932:22317,35933:29674,35934:22411,35935:22865,35936:24418,35937:24452,35938:24693,35939:24950,35940:24935,35941:25001,35942:25522,35943:25658,35944:25964,35945:26223,35946:26690,35947:28179,35948:30054,35949:31293,35950:31995,35951:32076,35952:32153,35953:32331,35954:32619,35955:33550,35956:33610,35957:34509,35958:35336,35959:35427,35960:35686,35961:36605,35962:38938,35963:40335,35964:33464,35965:36814,35966:39912,35968:21127,35969:25119,35970:25731,35971:28608,35972:38553,35973:26689,35974:20625,35975:27424,35976:27770,35977:28500,35978:31348,35979:32080,35980:34880,35981:35363,35982:26376,35983:20214,35984:20537,35985:20518,35986:20581,35987:20860,35988:21048,35989:21091,35990:21927,35991:22287,35992:22533,35993:23244,35994:24314,35995:25010,35996:25080,35997:25331,35998:25458,35999:26908,36e3:27177,36001:29309,36002:29356,36003:29486,36004:30740,36005:30831,36006:32121,36007:30476,36008:32937,36009:35211,36010:35609,36011:36066,36012:36562,36013:36963,36014:37749,36015:38522,36016:38997,36017:39443,36018:40568,36019:20803,36020:21407,36021:21427,36022:24187,36023:24358,36024:28187,36025:28304,36026:29572,36027:29694,36028:32067,36029:33335,36030:35328,36031:35578,36032:38480,36033:20046,36034:20491,36035:21476,36036:21628,36037:22266,36038:22993,36039:23396,36040:24049,36041:24235,36042:24359,36043:25144,36044:25925,36045:26543,36046:28246,36047:29392,36048:31946,36049:34996,36050:32929,36051:32993,36052:33776,36053:34382,36054:35463,36055:36328,36056:37431,36057:38599,36058:39015,36059:40723,36060:20116,36061:20114,36062:20237,36063:21320,36064:21577,36065:21566,36066:23087,36067:24460,36068:24481,36069:24735,36070:26791,36071:27278,36072:29786,36073:30849,36074:35486,36075:35492,36076:35703,36077:37264,36078:20062,36079:39881,36080:20132,36081:20348,36082:20399,36083:20505,36084:20502,36085:20809,36086:20844,36087:21151,36088:21177,36089:21246,36090:21402,36091:21475,36092:21521,36160:21518,36161:21897,36162:22353,36163:22434,36164:22909,36165:23380,36166:23389,36167:23439,36168:24037,36169:24039,36170:24055,36171:24184,36172:24195,36173:24218,36174:24247,36175:24344,36176:24658,36177:24908,36178:25239,36179:25304,36180:25511,36181:25915,36182:26114,36183:26179,36184:26356,36185:26477,36186:26657,36187:26775,36188:27083,36189:27743,36190:27946,36191:28009,36192:28207,36193:28317,36194:30002,36195:30343,36196:30828,36197:31295,36198:31968,36199:32005,36200:32024,36201:32094,36202:32177,36203:32789,36204:32771,36205:32943,36206:32945,36207:33108,36208:33167,36209:33322,36210:33618,36211:34892,36212:34913,36213:35611,36214:36002,36215:36092,36216:37066,36217:37237,36218:37489,36219:30783,36220:37628,36221:38308,36222:38477,36224:38917,36225:39321,36226:39640,36227:40251,36228:21083,36229:21163,36230:21495,36231:21512,36232:22741,36233:25335,36234:28640,36235:35946,36236:36703,36237:40633,36238:20811,36239:21051,36240:21578,36241:22269,36242:31296,36243:37239,36244:40288,36245:40658,36246:29508,36247:28425,36248:33136,36249:29969,36250:24573,36251:24794,36252:39592,36253:29403,36254:36796,36255:27492,36256:38915,36257:20170,36258:22256,36259:22372,36260:22718,36261:23130,36262:24680,36263:25031,36264:26127,36265:26118,36266:26681,36267:26801,36268:28151,36269:30165,36270:32058,36271:33390,36272:39746,36273:20123,36274:20304,36275:21449,36276:21766,36277:23919,36278:24038,36279:24046,36280:26619,36281:27801,36282:29811,36283:30722,36284:35408,36285:37782,36286:35039,36287:22352,36288:24231,36289:25387,36290:20661,36291:20652,36292:20877,36293:26368,36294:21705,36295:22622,36296:22971,36297:23472,36298:24425,36299:25165,36300:25505,36301:26685,36302:27507,36303:28168,36304:28797,36305:37319,36306:29312,36307:30741,36308:30758,36309:31085,36310:25998,36311:32048,36312:33756,36313:35009,36314:36617,36315:38555,36316:21092,36317:22312,36318:26448,36319:32618,36320:36001,36321:20916,36322:22338,36323:38442,36324:22586,36325:27018,36326:32948,36327:21682,36328:23822,36329:22524,36330:30869,36331:40442,36332:20316,36333:21066,36334:21643,36335:25662,36336:26152,36337:26388,36338:26613,36339:31364,36340:31574,36341:32034,36342:37679,36343:26716,36344:39853,36345:31545,36346:21273,36347:20874,36348:21047,36416:23519,36417:25334,36418:25774,36419:25830,36420:26413,36421:27578,36422:34217,36423:38609,36424:30352,36425:39894,36426:25420,36427:37638,36428:39851,36429:30399,36430:26194,36431:19977,36432:20632,36433:21442,36434:23665,36435:24808,36436:25746,36437:25955,36438:26719,36439:29158,36440:29642,36441:29987,36442:31639,36443:32386,36444:34453,36445:35715,36446:36059,36447:37240,36448:39184,36449:26028,36450:26283,36451:27531,36452:20181,36453:20180,36454:20282,36455:20351,36456:21050,36457:21496,36458:21490,36459:21987,36460:22235,36461:22763,36462:22987,36463:22985,36464:23039,36465:23376,36466:23629,36467:24066,36468:24107,36469:24535,36470:24605,36471:25351,36472:25903,36473:23388,36474:26031,36475:26045,36476:26088,36477:26525,36478:27490,36480:27515,36481:27663,36482:29509,36483:31049,36484:31169,36485:31992,36486:32025,36487:32043,36488:32930,36489:33026,36490:33267,36491:35222,36492:35422,36493:35433,36494:35430,36495:35468,36496:35566,36497:36039,36498:36060,36499:38604,36500:39164,36501:27503,36502:20107,36503:20284,36504:20365,36505:20816,36506:23383,36507:23546,36508:24904,36509:25345,36510:26178,36511:27425,36512:28363,36513:27835,36514:29246,36515:29885,36516:30164,36517:30913,36518:31034,36519:32780,36520:32819,36521:33258,36522:33940,36523:36766,36524:27728,36525:40575,36526:24335,36527:35672,36528:40235,36529:31482,36530:36600,36531:23437,36532:38635,36533:19971,36534:21489,36535:22519,36536:22833,36537:23241,36538:23460,36539:24713,36540:28287,36541:28422,36542:30142,36543:36074,36544:23455,36545:34048,36546:31712,36547:20594,36548:26612,36549:33437,36550:23649,36551:34122,36552:32286,36553:33294,36554:20889,36555:23556,36556:25448,36557:36198,36558:26012,36559:29038,36560:31038,36561:32023,36562:32773,36563:35613,36564:36554,36565:36974,36566:34503,36567:37034,36568:20511,36569:21242,36570:23610,36571:26451,36572:28796,36573:29237,36574:37196,36575:37320,36576:37675,36577:33509,36578:23490,36579:24369,36580:24825,36581:20027,36582:21462,36583:23432,36584:25163,36585:26417,36586:27530,36587:29417,36588:29664,36589:31278,36590:33131,36591:36259,36592:37202,36593:39318,36594:20754,36595:21463,36596:21610,36597:23551,36598:25480,36599:27193,36600:32172,36601:38656,36602:22234,36603:21454,36604:21608,36672:23447,36673:23601,36674:24030,36675:20462,36676:24833,36677:25342,36678:27954,36679:31168,36680:31179,36681:32066,36682:32333,36683:32722,36684:33261,36685:33311,36686:33936,36687:34886,36688:35186,36689:35728,36690:36468,36691:36655,36692:36913,36693:37195,36694:37228,36695:38598,36696:37276,36697:20160,36698:20303,36699:20805,36700:21313,36701:24467,36702:25102,36703:26580,36704:27713,36705:28171,36706:29539,36707:32294,36708:37325,36709:37507,36710:21460,36711:22809,36712:23487,36713:28113,36714:31069,36715:32302,36716:31899,36717:22654,36718:29087,36719:20986,36720:34899,36721:36848,36722:20426,36723:23803,36724:26149,36725:30636,36726:31459,36727:33308,36728:39423,36729:20934,36730:24490,36731:26092,36732:26991,36733:27529,36734:28147,36736:28310,36737:28516,36738:30462,36739:32020,36740:24033,36741:36981,36742:37255,36743:38918,36744:20966,36745:21021,36746:25152,36747:26257,36748:26329,36749:28186,36750:24246,36751:32210,36752:32626,36753:26360,36754:34223,36755:34295,36756:35576,36757:21161,36758:21465,36759:22899,36760:24207,36761:24464,36762:24661,36763:37604,36764:38500,36765:20663,36766:20767,36767:21213,36768:21280,36769:21319,36770:21484,36771:21736,36772:21830,36773:21809,36774:22039,36775:22888,36776:22974,36777:23100,36778:23477,36779:23558,36780:23567,36781:23569,36782:23578,36783:24196,36784:24202,36785:24288,36786:24432,36787:25215,36788:25220,36789:25307,36790:25484,36791:25463,36792:26119,36793:26124,36794:26157,36795:26230,36796:26494,36797:26786,36798:27167,36799:27189,36800:27836,36801:28040,36802:28169,36803:28248,36804:28988,36805:28966,36806:29031,36807:30151,36808:30465,36809:30813,36810:30977,36811:31077,36812:31216,36813:31456,36814:31505,36815:31911,36816:32057,36817:32918,36818:33750,36819:33931,36820:34121,36821:34909,36822:35059,36823:35359,36824:35388,36825:35412,36826:35443,36827:35937,36828:36062,36829:37284,36830:37478,36831:37758,36832:37912,36833:38556,36834:38808,36835:19978,36836:19976,36837:19998,36838:20055,36839:20887,36840:21104,36841:22478,36842:22580,36843:22732,36844:23330,36845:24120,36846:24773,36847:25854,36848:26465,36849:26454,36850:27972,36851:29366,36852:30067,36853:31331,36854:33976,36855:35698,36856:37304,36857:37664,36858:22065,36859:22516,36860:39166,36928:25325,36929:26893,36930:27542,36931:29165,36932:32340,36933:32887,36934:33394,36935:35302,36936:39135,36937:34645,36938:36785,36939:23611,36940:20280,36941:20449,36942:20405,36943:21767,36944:23072,36945:23517,36946:23529,36947:24515,36948:24910,36949:25391,36950:26032,36951:26187,36952:26862,36953:27035,36954:28024,36955:28145,36956:30003,36957:30137,36958:30495,36959:31070,36960:31206,36961:32051,36962:33251,36963:33455,36964:34218,36965:35242,36966:35386,36967:36523,36968:36763,36969:36914,36970:37341,36971:38663,36972:20154,36973:20161,36974:20995,36975:22645,36976:22764,36977:23563,36978:29978,36979:23613,36980:33102,36981:35338,36982:36805,36983:38499,36984:38765,36985:31525,36986:35535,36987:38920,36988:37218,36989:22259,36990:21416,36992:36887,36993:21561,36994:22402,36995:24101,36996:25512,36997:27700,36998:28810,36999:30561,37e3:31883,37001:32736,37002:34928,37003:36930,37004:37204,37005:37648,37006:37656,37007:38543,37008:29790,37009:39620,37010:23815,37011:23913,37012:25968,37013:26530,37014:36264,37015:38619,37016:25454,37017:26441,37018:26905,37019:33733,37020:38935,37021:38592,37022:35070,37023:28548,37024:25722,37025:23544,37026:19990,37027:28716,37028:30045,37029:26159,37030:20932,37031:21046,37032:21218,37033:22995,37034:24449,37035:24615,37036:25104,37037:25919,37038:25972,37039:26143,37040:26228,37041:26866,37042:26646,37043:27491,37044:28165,37045:29298,37046:29983,37047:30427,37048:31934,37049:32854,37050:22768,37051:35069,37052:35199,37053:35488,37054:35475,37055:35531,37056:36893,37057:37266,37058:38738,37059:38745,37060:25993,37061:31246,37062:33030,37063:38587,37064:24109,37065:24796,37066:25114,37067:26021,37068:26132,37069:26512,37070:30707,37071:31309,37072:31821,37073:32318,37074:33034,37075:36012,37076:36196,37077:36321,37078:36447,37079:30889,37080:20999,37081:25305,37082:25509,37083:25666,37084:25240,37085:35373,37086:31363,37087:31680,37088:35500,37089:38634,37090:32118,37091:33292,37092:34633,37093:20185,37094:20808,37095:21315,37096:21344,37097:23459,37098:23554,37099:23574,37100:24029,37101:25126,37102:25159,37103:25776,37104:26643,37105:26676,37106:27849,37107:27973,37108:27927,37109:26579,37110:28508,37111:29006,37112:29053,37113:26059,37114:31359,37115:31661,37116:32218,37184:32330,37185:32680,37186:33146,37187:33307,37188:33337,37189:34214,37190:35438,37191:36046,37192:36341,37193:36984,37194:36983,37195:37549,37196:37521,37197:38275,37198:39854,37199:21069,37200:21892,37201:28472,37202:28982,37203:20840,37204:31109,37205:32341,37206:33203,37207:31950,37208:22092,37209:22609,37210:23720,37211:25514,37212:26366,37213:26365,37214:26970,37215:29401,37216:30095,37217:30094,37218:30990,37219:31062,37220:31199,37221:31895,37222:32032,37223:32068,37224:34311,37225:35380,37226:38459,37227:36961,37228:40736,37229:20711,37230:21109,37231:21452,37232:21474,37233:20489,37234:21930,37235:22766,37236:22863,37237:29245,37238:23435,37239:23652,37240:21277,37241:24803,37242:24819,37243:25436,37244:25475,37245:25407,37246:25531,37248:25805,37249:26089,37250:26361,37251:24035,37252:27085,37253:27133,37254:28437,37255:29157,37256:20105,37257:30185,37258:30456,37259:31379,37260:31967,37261:32207,37262:32156,37263:32865,37264:33609,37265:33624,37266:33900,37267:33980,37268:34299,37269:35013,37270:36208,37271:36865,37272:36973,37273:37783,37274:38684,37275:39442,37276:20687,37277:22679,37278:24974,37279:33235,37280:34101,37281:36104,37282:36896,37283:20419,37284:20596,37285:21063,37286:21363,37287:24687,37288:25417,37289:26463,37290:28204,37291:36275,37292:36895,37293:20439,37294:23646,37295:36042,37296:26063,37297:32154,37298:21330,37299:34966,37300:20854,37301:25539,37302:23384,37303:23403,37304:23562,37305:25613,37306:26449,37307:36956,37308:20182,37309:22810,37310:22826,37311:27760,37312:35409,37313:21822,37314:22549,37315:22949,37316:24816,37317:25171,37318:26561,37319:33333,37320:26965,37321:38464,37322:39364,37323:39464,37324:20307,37325:22534,37326:23550,37327:32784,37328:23729,37329:24111,37330:24453,37331:24608,37332:24907,37333:25140,37334:26367,37335:27888,37336:28382,37337:32974,37338:33151,37339:33492,37340:34955,37341:36024,37342:36864,37343:36910,37344:38538,37345:40667,37346:39899,37347:20195,37348:21488,37349:22823,37350:31532,37351:37261,37352:38988,37353:40441,37354:28381,37355:28711,37356:21331,37357:21828,37358:23429,37359:25176,37360:25246,37361:25299,37362:27810,37363:28655,37364:29730,37365:35351,37366:37944,37367:28609,37368:35582,37369:33592,37370:20967,37371:34552,37372:21482,37440:21481,37441:20294,37442:36948,37443:36784,37444:22890,37445:33073,37446:24061,37447:31466,37448:36799,37449:26842,37450:35895,37451:29432,37452:40008,37453:27197,37454:35504,37455:20025,37456:21336,37457:22022,37458:22374,37459:25285,37460:25506,37461:26086,37462:27470,37463:28129,37464:28251,37465:28845,37466:30701,37467:31471,37468:31658,37469:32187,37470:32829,37471:32966,37472:34507,37473:35477,37474:37723,37475:22243,37476:22727,37477:24382,37478:26029,37479:26262,37480:27264,37481:27573,37482:30007,37483:35527,37484:20516,37485:30693,37486:22320,37487:24347,37488:24677,37489:26234,37490:27744,37491:30196,37492:31258,37493:32622,37494:33268,37495:34584,37496:36933,37497:39347,37498:31689,37499:30044,37500:31481,37501:31569,37502:33988,37504:36880,37505:31209,37506:31378,37507:33590,37508:23265,37509:30528,37510:20013,37511:20210,37512:23449,37513:24544,37514:25277,37515:26172,37516:26609,37517:27880,37518:34411,37519:34935,37520:35387,37521:37198,37522:37619,37523:39376,37524:27159,37525:28710,37526:29482,37527:33511,37528:33879,37529:36015,37530:19969,37531:20806,37532:20939,37533:21899,37534:23541,37535:24086,37536:24115,37537:24193,37538:24340,37539:24373,37540:24427,37541:24500,37542:25074,37543:25361,37544:26274,37545:26397,37546:28526,37547:29266,37548:30010,37549:30522,37550:32884,37551:33081,37552:33144,37553:34678,37554:35519,37555:35548,37556:36229,37557:36339,37558:37530,37559:38263,37560:38914,37561:40165,37562:21189,37563:25431,37564:30452,37565:26389,37566:27784,37567:29645,37568:36035,37569:37806,37570:38515,37571:27941,37572:22684,37573:26894,37574:27084,37575:36861,37576:37786,37577:30171,37578:36890,37579:22618,37580:26626,37581:25524,37582:27131,37583:20291,37584:28460,37585:26584,37586:36795,37587:34086,37588:32180,37589:37716,37590:26943,37591:28528,37592:22378,37593:22775,37594:23340,37595:32044,37596:29226,37597:21514,37598:37347,37599:40372,37600:20141,37601:20302,37602:20572,37603:20597,37604:21059,37605:35998,37606:21576,37607:22564,37608:23450,37609:24093,37610:24213,37611:24237,37612:24311,37613:24351,37614:24716,37615:25269,37616:25402,37617:25552,37618:26799,37619:27712,37620:30855,37621:31118,37622:31243,37623:32224,37624:33351,37625:35330,37626:35558,37627:36420,37628:36883,37696:37048,37697:37165,37698:37336,37699:40718,37700:27877,37701:25688,37702:25826,37703:25973,37704:28404,37705:30340,37706:31515,37707:36969,37708:37841,37709:28346,37710:21746,37711:24505,37712:25764,37713:36685,37714:36845,37715:37444,37716:20856,37717:22635,37718:22825,37719:23637,37720:24215,37721:28155,37722:32399,37723:29980,37724:36028,37725:36578,37726:39003,37727:28857,37728:20253,37729:27583,37730:28593,37731:3e4,37732:38651,37733:20814,37734:21520,37735:22581,37736:22615,37737:22956,37738:23648,37739:24466,37740:26007,37741:26460,37742:28193,37743:30331,37744:33759,37745:36077,37746:36884,37747:37117,37748:37709,37749:30757,37750:30778,37751:21162,37752:24230,37753:22303,37754:22900,37755:24594,37756:20498,37757:20826,37758:20908,37760:20941,37761:20992,37762:21776,37763:22612,37764:22616,37765:22871,37766:23445,37767:23798,37768:23947,37769:24764,37770:25237,37771:25645,37772:26481,37773:26691,37774:26812,37775:26847,37776:30423,37777:28120,37778:28271,37779:28059,37780:28783,37781:29128,37782:24403,37783:30168,37784:31095,37785:31561,37786:31572,37787:31570,37788:31958,37789:32113,37790:21040,37791:33891,37792:34153,37793:34276,37794:35342,37795:35588,37796:35910,37797:36367,37798:36867,37799:36879,37800:37913,37801:38518,37802:38957,37803:39472,37804:38360,37805:20685,37806:21205,37807:21516,37808:22530,37809:23566,37810:24999,37811:25758,37812:27934,37813:30643,37814:31461,37815:33012,37816:33796,37817:36947,37818:37509,37819:23776,37820:40199,37821:21311,37822:24471,37823:24499,37824:28060,37825:29305,37826:30563,37827:31167,37828:31716,37829:27602,37830:29420,37831:35501,37832:26627,37833:27233,37834:20984,37835:31361,37836:26932,37837:23626,37838:40182,37839:33515,37840:23493,37841:37193,37842:28702,37843:22136,37844:23663,37845:24775,37846:25958,37847:27788,37848:35930,37849:36929,37850:38931,37851:21585,37852:26311,37853:37389,37854:22856,37855:37027,37856:20869,37857:20045,37858:20970,37859:34201,37860:35598,37861:28760,37862:25466,37863:37707,37864:26978,37865:39348,37866:32260,37867:30071,37868:21335,37869:26976,37870:36575,37871:38627,37872:27741,37873:20108,37874:23612,37875:24336,37876:36841,37877:21250,37878:36049,37879:32905,37880:34425,37881:24319,37882:26085,37883:20083,37884:20837,37952:22914,37953:23615,37954:38894,37955:20219,37956:22922,37957:24525,37958:35469,37959:28641,37960:31152,37961:31074,37962:23527,37963:33905,37964:29483,37965:29105,37966:24180,37967:24565,37968:25467,37969:25754,37970:29123,37971:31896,37972:20035,37973:24316,37974:20043,37975:22492,37976:22178,37977:24745,37978:28611,37979:32013,37980:33021,37981:33075,37982:33215,37983:36786,37984:35223,37985:34468,37986:24052,37987:25226,37988:25773,37989:35207,37990:26487,37991:27874,37992:27966,37993:29750,37994:30772,37995:23110,37996:32629,37997:33453,37998:39340,37999:20467,38e3:24259,38001:25309,38002:25490,38003:25943,38004:26479,38005:30403,38006:29260,38007:32972,38008:32954,38009:36649,38010:37197,38011:20493,38012:22521,38013:23186,38014:26757,38016:26995,38017:29028,38018:29437,38019:36023,38020:22770,38021:36064,38022:38506,38023:36889,38024:34687,38025:31204,38026:30695,38027:33833,38028:20271,38029:21093,38030:21338,38031:25293,38032:26575,38033:27850,38034:30333,38035:31636,38036:31893,38037:33334,38038:34180,38039:36843,38040:26333,38041:28448,38042:29190,38043:32283,38044:33707,38045:39361,38046:40614,38047:20989,38048:31665,38049:30834,38050:31672,38051:32903,38052:31560,38053:27368,38054:24161,38055:32908,38056:30033,38057:30048,38058:20843,38059:37474,38060:28300,38061:30330,38062:37271,38063:39658,38064:20240,38065:32624,38066:25244,38067:31567,38068:38309,38069:40169,38070:22138,38071:22617,38072:34532,38073:38588,38074:20276,38075:21028,38076:21322,38077:21453,38078:21467,38079:24070,38080:25644,38081:26001,38082:26495,38083:27710,38084:27726,38085:29256,38086:29359,38087:29677,38088:30036,38089:32321,38090:33324,38091:34281,38092:36009,38093:31684,38094:37318,38095:29033,38096:38930,38097:39151,38098:25405,38099:26217,38100:30058,38101:30436,38102:30928,38103:34115,38104:34542,38105:21290,38106:21329,38107:21542,38108:22915,38109:24199,38110:24444,38111:24754,38112:25161,38113:25209,38114:25259,38115:26e3,38116:27604,38117:27852,38118:30130,38119:30382,38120:30865,38121:31192,38122:32203,38123:32631,38124:32933,38125:34987,38126:35513,38127:36027,38128:36991,38129:38750,38130:39131,38131:27147,38132:31800,38133:20633,38134:23614,38135:24494,38136:26503,38137:27608,38138:29749,38139:30473,38140:32654,38208:40763,38209:26570,38210:31255,38211:21305,38212:30091,38213:39661,38214:24422,38215:33181,38216:33777,38217:32920,38218:24380,38219:24517,38220:30050,38221:31558,38222:36924,38223:26727,38224:23019,38225:23195,38226:32016,38227:30334,38228:35628,38229:20469,38230:24426,38231:27161,38232:27703,38233:28418,38234:29922,38235:31080,38236:34920,38237:35413,38238:35961,38239:24287,38240:25551,38241:30149,38242:31186,38243:33495,38244:37672,38245:37618,38246:33948,38247:34541,38248:39981,38249:21697,38250:24428,38251:25996,38252:27996,38253:28693,38254:36007,38255:36051,38256:38971,38257:25935,38258:29942,38259:19981,38260:20184,38261:22496,38262:22827,38263:23142,38264:23500,38265:20904,38266:24067,38267:24220,38268:24598,38269:25206,38270:25975,38272:26023,38273:26222,38274:28014,38275:29238,38276:31526,38277:33104,38278:33178,38279:33433,38280:35676,38281:36e3,38282:36070,38283:36212,38284:38428,38285:38468,38286:20398,38287:25771,38288:27494,38289:33310,38290:33889,38291:34154,38292:37096,38293:23553,38294:26963,38295:39080,38296:33914,38297:34135,38298:20239,38299:21103,38300:24489,38301:24133,38302:26381,38303:31119,38304:33145,38305:35079,38306:35206,38307:28149,38308:24343,38309:25173,38310:27832,38311:20175,38312:29289,38313:39826,38314:20998,38315:21563,38316:22132,38317:22707,38318:24996,38319:25198,38320:28954,38321:22894,38322:31881,38323:31966,38324:32027,38325:38640,38326:25991,38327:32862,38328:19993,38329:20341,38330:20853,38331:22592,38332:24163,38333:24179,38334:24330,38335:26564,38336:20006,38337:34109,38338:38281,38339:38491,38340:31859,38341:38913,38342:20731,38343:22721,38344:30294,38345:30887,38346:21029,38347:30629,38348:34065,38349:31622,38350:20559,38351:22793,38352:29255,38353:31687,38354:32232,38355:36794,38356:36820,38357:36941,38358:20415,38359:21193,38360:23081,38361:24321,38362:38829,38363:20445,38364:33303,38365:37610,38366:22275,38367:25429,38368:27497,38369:29995,38370:35036,38371:36628,38372:31298,38373:21215,38374:22675,38375:24917,38376:25098,38377:26286,38378:27597,38379:31807,38380:33769,38381:20515,38382:20472,38383:21253,38384:21574,38385:22577,38386:22857,38387:23453,38388:23792,38389:23791,38390:23849,38391:24214,38392:25265,38393:25447,38394:25918,38395:26041,38396:26379,38464:27861,38465:27873,38466:28921,38467:30770,38468:32299,38469:32990,38470:33459,38471:33804,38472:34028,38473:34562,38474:35090,38475:35370,38476:35914,38477:37030,38478:37586,38479:39165,38480:40179,38481:40300,38482:20047,38483:20129,38484:20621,38485:21078,38486:22346,38487:22952,38488:24125,38489:24536,38490:24537,38491:25151,38492:26292,38493:26395,38494:26576,38495:26834,38496:20882,38497:32033,38498:32938,38499:33192,38500:35584,38501:35980,38502:36031,38503:37502,38504:38450,38505:21536,38506:38956,38507:21271,38508:20693,38509:21340,38510:22696,38511:25778,38512:26420,38513:29287,38514:30566,38515:31302,38516:37350,38517:21187,38518:27809,38519:27526,38520:22528,38521:24140,38522:22868,38523:26412,38524:32763,38525:20961,38526:30406,38528:25705,38529:30952,38530:39764,38531:40635,38532:22475,38533:22969,38534:26151,38535:26522,38536:27598,38537:21737,38538:27097,38539:24149,38540:33180,38541:26517,38542:39850,38543:26622,38544:40018,38545:26717,38546:20134,38547:20451,38548:21448,38549:25273,38550:26411,38551:27819,38552:36804,38553:20397,38554:32365,38555:40639,38556:19975,38557:24930,38558:28288,38559:28459,38560:34067,38561:21619,38562:26410,38563:39749,38564:24051,38565:31637,38566:23724,38567:23494,38568:34588,38569:28234,38570:34001,38571:31252,38572:33032,38573:22937,38574:31885,38575:27665,38576:30496,38577:21209,38578:22818,38579:28961,38580:29279,38581:30683,38582:38695,38583:40289,38584:26891,38585:23167,38586:23064,38587:20901,38588:21517,38589:21629,38590:26126,38591:30431,38592:36855,38593:37528,38594:40180,38595:23018,38596:29277,38597:28357,38598:20813,38599:26825,38600:32191,38601:32236,38602:38754,38603:40634,38604:25720,38605:27169,38606:33538,38607:22916,38608:23391,38609:27611,38610:29467,38611:30450,38612:32178,38613:32791,38614:33945,38615:20786,38616:26408,38617:40665,38618:30446,38619:26466,38620:21247,38621:39173,38622:23588,38623:25147,38624:31870,38625:36016,38626:21839,38627:24758,38628:32011,38629:38272,38630:21249,38631:20063,38632:20918,38633:22812,38634:29242,38635:32822,38636:37326,38637:24357,38638:30690,38639:21380,38640:24441,38641:32004,38642:34220,38643:35379,38644:36493,38645:38742,38646:26611,38647:34222,38648:37971,38649:24841,38650:24840,38651:27833,38652:30290,38720:35565,38721:36664,38722:21807,38723:20305,38724:20778,38725:21191,38726:21451,38727:23461,38728:24189,38729:24736,38730:24962,38731:25558,38732:26377,38733:26586,38734:28263,38735:28044,38736:29494,38737:29495,38738:30001,38739:31056,38740:35029,38741:35480,38742:36938,38743:37009,38744:37109,38745:38596,38746:34701,38747:22805,38748:20104,38749:20313,38750:19982,38751:35465,38752:36671,38753:38928,38754:20653,38755:24188,38756:22934,38757:23481,38758:24248,38759:25562,38760:25594,38761:25793,38762:26332,38763:26954,38764:27096,38765:27915,38766:28342,38767:29076,38768:29992,38769:31407,38770:32650,38771:32768,38772:33865,38773:33993,38774:35201,38775:35617,38776:36362,38777:36965,38778:38525,38779:39178,38780:24958,38781:25233,38782:27442,38784:27779,38785:28020,38786:32716,38787:32764,38788:28096,38789:32645,38790:34746,38791:35064,38792:26469,38793:33713,38794:38972,38795:38647,38796:27931,38797:32097,38798:33853,38799:37226,38800:20081,38801:21365,38802:23888,38803:27396,38804:28651,38805:34253,38806:34349,38807:35239,38808:21033,38809:21519,38810:23653,38811:26446,38812:26792,38813:29702,38814:29827,38815:30178,38816:35023,38817:35041,38818:37324,38819:38626,38820:38520,38821:24459,38822:29575,38823:31435,38824:33870,38825:25504,38826:30053,38827:21129,38828:27969,38829:28316,38830:29705,38831:30041,38832:30827,38833:31890,38834:38534,38835:31452,38836:40845,38837:20406,38838:24942,38839:26053,38840:34396,38841:20102,38842:20142,38843:20698,38844:20001,38845:20940,38846:23534,38847:26009,38848:26753,38849:28092,38850:29471,38851:30274,38852:30637,38853:31260,38854:31975,38855:33391,38856:35538,38857:36988,38858:37327,38859:38517,38860:38936,38861:21147,38862:32209,38863:20523,38864:21400,38865:26519,38866:28107,38867:29136,38868:29747,38869:33256,38870:36650,38871:38563,38872:40023,38873:40607,38874:29792,38875:22593,38876:28057,38877:32047,38878:39006,38879:20196,38880:20278,38881:20363,38882:20919,38883:21169,38884:23994,38885:24604,38886:29618,38887:31036,38888:33491,38889:37428,38890:38583,38891:38646,38892:38666,38893:40599,38894:40802,38895:26278,38896:27508,38897:21015,38898:21155,38899:28872,38900:35010,38901:24265,38902:24651,38903:24976,38904:28451,38905:29001,38906:31806,38907:32244,38908:32879,38976:34030,38977:36899,38978:37676,38979:21570,38980:39791,38981:27347,38982:28809,38983:36034,38984:36335,38985:38706,38986:21172,38987:23105,38988:24266,38989:24324,38990:26391,38991:27004,38992:27028,38993:28010,38994:28431,38995:29282,38996:29436,38997:31725,38998:32769,38999:32894,39e3:34635,39001:37070,39002:20845,39003:40595,39004:31108,39005:32907,39006:37682,39007:35542,39008:20525,39009:21644,39010:35441,39011:27498,39012:36036,39013:33031,39014:24785,39015:26528,39016:40434,39017:20121,39018:20120,39019:39952,39020:35435,39021:34241,39022:34152,39023:26880,39024:28286,39025:30871,39026:33109,39071:24332,39072:19984,39073:19989,39074:20010,39075:20017,39076:20022,39077:20028,39078:20031,39079:20034,39080:20054,39081:20056,39082:20098,39083:20101,39084:35947,39085:20106,39086:33298,39087:24333,39088:20110,39089:20126,39090:20127,39091:20128,39092:20130,39093:20144,39094:20147,39095:20150,39096:20174,39097:20173,39098:20164,39099:20166,39100:20162,39101:20183,39102:20190,39103:20205,39104:20191,39105:20215,39106:20233,39107:20314,39108:20272,39109:20315,39110:20317,39111:20311,39112:20295,39113:20342,39114:20360,39115:20367,39116:20376,39117:20347,39118:20329,39119:20336,39120:20369,39121:20335,39122:20358,39123:20374,39124:20760,39125:20436,39126:20447,39127:20430,39128:20440,39129:20443,39130:20433,39131:20442,39132:20432,39133:20452,39134:20453,39135:20506,39136:20520,39137:20500,39138:20522,39139:20517,39140:20485,39141:20252,39142:20470,39143:20513,39144:20521,39145:20524,39146:20478,39147:20463,39148:20497,39149:20486,39150:20547,39151:20551,39152:26371,39153:20565,39154:20560,39155:20552,39156:20570,39157:20566,39158:20588,39159:20600,39160:20608,39161:20634,39162:20613,39163:20660,39164:20658,39232:20681,39233:20682,39234:20659,39235:20674,39236:20694,39237:20702,39238:20709,39239:20717,39240:20707,39241:20718,39242:20729,39243:20725,39244:20745,39245:20737,39246:20738,39247:20758,39248:20757,39249:20756,39250:20762,39251:20769,39252:20794,39253:20791,39254:20796,39255:20795,39256:20799,39257:20800,39258:20818,39259:20812,39260:20820,39261:20834,39262:31480,39263:20841,39264:20842,39265:20846,39266:20864,39267:20866,39268:22232,39269:20876,39270:20873,39271:20879,39272:20881,39273:20883,39274:20885,39275:20886,39276:20900,39277:20902,39278:20898,39279:20905,39280:20906,39281:20907,39282:20915,39283:20913,39284:20914,39285:20912,39286:20917,39287:20925,39288:20933,39289:20937,39290:20955,39291:20960,39292:34389,39293:20969,39294:20973,39296:20976,39297:20981,39298:20990,39299:20996,39300:21003,39301:21012,39302:21006,39303:21031,39304:21034,39305:21038,39306:21043,39307:21049,39308:21071,39309:21060,39310:21067,39311:21068,39312:21086,39313:21076,39314:21098,39315:21108,39316:21097,39317:21107,39318:21119,39319:21117,39320:21133,39321:21140,39322:21138,39323:21105,39324:21128,39325:21137,39326:36776,39327:36775,39328:21164,39329:21165,39330:21180,39331:21173,39332:21185,39333:21197,39334:21207,39335:21214,39336:21219,39337:21222,39338:39149,39339:21216,39340:21235,39341:21237,39342:21240,39343:21241,39344:21254,39345:21256,39346:30008,39347:21261,39348:21264,39349:21263,39350:21269,39351:21274,39352:21283,39353:21295,39354:21297,39355:21299,39356:21304,39357:21312,39358:21318,39359:21317,39360:19991,39361:21321,39362:21325,39363:20950,39364:21342,39365:21353,39366:21358,39367:22808,39368:21371,39369:21367,39370:21378,39371:21398,39372:21408,39373:21414,39374:21413,39375:21422,39376:21424,39377:21430,39378:21443,39379:31762,39380:38617,39381:21471,39382:26364,39383:29166,39384:21486,39385:21480,39386:21485,39387:21498,39388:21505,39389:21565,39390:21568,39391:21548,39392:21549,39393:21564,39394:21550,39395:21558,39396:21545,39397:21533,39398:21582,39399:21647,39400:21621,39401:21646,39402:21599,39403:21617,39404:21623,39405:21616,39406:21650,39407:21627,39408:21632,39409:21622,39410:21636,39411:21648,39412:21638,39413:21703,39414:21666,39415:21688,39416:21669,39417:21676,39418:21700,39419:21704,39420:21672,39488:21675,39489:21698,39490:21668,39491:21694,39492:21692,39493:21720,39494:21733,39495:21734,39496:21775,39497:21780,39498:21757,39499:21742,39500:21741,39501:21754,39502:21730,39503:21817,39504:21824,39505:21859,39506:21836,39507:21806,39508:21852,39509:21829,39510:21846,39511:21847,39512:21816,39513:21811,39514:21853,39515:21913,39516:21888,39517:21679,39518:21898,39519:21919,39520:21883,39521:21886,39522:21912,39523:21918,39524:21934,39525:21884,39526:21891,39527:21929,39528:21895,39529:21928,39530:21978,39531:21957,39532:21983,39533:21956,39534:21980,39535:21988,39536:21972,39537:22036,39538:22007,39539:22038,39540:22014,39541:22013,39542:22043,39543:22009,39544:22094,39545:22096,39546:29151,39547:22068,39548:22070,39549:22066,39550:22072,39552:22123,39553:22116,39554:22063,39555:22124,39556:22122,39557:22150,39558:22144,39559:22154,39560:22176,39561:22164,39562:22159,39563:22181,39564:22190,39565:22198,39566:22196,39567:22210,39568:22204,39569:22209,39570:22211,39571:22208,39572:22216,39573:22222,39574:22225,39575:22227,39576:22231,39577:22254,39578:22265,39579:22272,39580:22271,39581:22276,39582:22281,39583:22280,39584:22283,39585:22285,39586:22291,39587:22296,39588:22294,39589:21959,39590:22300,39591:22310,39592:22327,39593:22328,39594:22350,39595:22331,39596:22336,39597:22351,39598:22377,39599:22464,39600:22408,39601:22369,39602:22399,39603:22409,39604:22419,39605:22432,39606:22451,39607:22436,39608:22442,39609:22448,39610:22467,39611:22470,39612:22484,39613:22482,39614:22483,39615:22538,39616:22486,39617:22499,39618:22539,39619:22553,39620:22557,39621:22642,39622:22561,39623:22626,39624:22603,39625:22640,39626:27584,39627:22610,39628:22589,39629:22649,39630:22661,39631:22713,39632:22687,39633:22699,39634:22714,39635:22750,39636:22715,39637:22712,39638:22702,39639:22725,39640:22739,39641:22737,39642:22743,39643:22745,39644:22744,39645:22757,39646:22748,39647:22756,39648:22751,39649:22767,39650:22778,39651:22777,39652:22779,39653:22780,39654:22781,39655:22786,39656:22794,39657:22800,39658:22811,39659:26790,39660:22821,39661:22828,39662:22829,39663:22834,39664:22840,39665:22846,39666:31442,39667:22869,39668:22864,39669:22862,39670:22874,39671:22872,39672:22882,39673:22880,39674:22887,39675:22892,39676:22889,39744:22904,39745:22913,39746:22941,39747:20318,39748:20395,39749:22947,39750:22962,39751:22982,39752:23016,39753:23004,39754:22925,39755:23001,39756:23002,39757:23077,39758:23071,39759:23057,39760:23068,39761:23049,39762:23066,39763:23104,39764:23148,39765:23113,39766:23093,39767:23094,39768:23138,39769:23146,39770:23194,39771:23228,39772:23230,39773:23243,39774:23234,39775:23229,39776:23267,39777:23255,39778:23270,39779:23273,39780:23254,39781:23290,39782:23291,39783:23308,39784:23307,39785:23318,39786:23346,39787:23248,39788:23338,39789:23350,39790:23358,39791:23363,39792:23365,39793:23360,39794:23377,39795:23381,39796:23386,39797:23387,39798:23397,39799:23401,39800:23408,39801:23411,39802:23413,39803:23416,39804:25992,39805:23418,39806:23424,39808:23427,39809:23462,39810:23480,39811:23491,39812:23495,39813:23497,39814:23508,39815:23504,39816:23524,39817:23526,39818:23522,39819:23518,39820:23525,39821:23531,39822:23536,39823:23542,39824:23539,39825:23557,39826:23559,39827:23560,39828:23565,39829:23571,39830:23584,39831:23586,39832:23592,39833:23608,39834:23609,39835:23617,39836:23622,39837:23630,39838:23635,39839:23632,39840:23631,39841:23409,39842:23660,39843:23662,39844:20066,39845:23670,39846:23673,39847:23692,39848:23697,39849:23700,39850:22939,39851:23723,39852:23739,39853:23734,39854:23740,39855:23735,39856:23749,39857:23742,39858:23751,39859:23769,39860:23785,39861:23805,39862:23802,39863:23789,39864:23948,39865:23786,39866:23819,39867:23829,39868:23831,39869:23900,39870:23839,39871:23835,39872:23825,39873:23828,39874:23842,39875:23834,39876:23833,39877:23832,39878:23884,39879:23890,39880:23886,39881:23883,39882:23916,39883:23923,39884:23926,39885:23943,39886:23940,39887:23938,39888:23970,39889:23965,39890:23980,39891:23982,39892:23997,39893:23952,39894:23991,39895:23996,39896:24009,39897:24013,39898:24019,39899:24018,39900:24022,39901:24027,39902:24043,39903:24050,39904:24053,39905:24075,39906:24090,39907:24089,39908:24081,39909:24091,39910:24118,39911:24119,39912:24132,39913:24131,39914:24128,39915:24142,39916:24151,39917:24148,39918:24159,39919:24162,39920:24164,39921:24135,39922:24181,39923:24182,39924:24186,39925:40636,39926:24191,39927:24224,39928:24257,39929:24258,39930:24264,39931:24272,39932:24271,4e4:24278,40001:24291,40002:24285,40003:24282,40004:24283,40005:24290,40006:24289,40007:24296,40008:24297,40009:24300,40010:24305,40011:24307,40012:24304,40013:24308,40014:24312,40015:24318,40016:24323,40017:24329,40018:24413,40019:24412,40020:24331,40021:24337,40022:24342,40023:24361,40024:24365,40025:24376,40026:24385,40027:24392,40028:24396,40029:24398,40030:24367,40031:24401,40032:24406,40033:24407,40034:24409,40035:24417,40036:24429,40037:24435,40038:24439,40039:24451,40040:24450,40041:24447,40042:24458,40043:24456,40044:24465,40045:24455,40046:24478,40047:24473,40048:24472,40049:24480,40050:24488,40051:24493,40052:24508,40053:24534,40054:24571,40055:24548,40056:24568,40057:24561,40058:24541,40059:24755,40060:24575,40061:24609,40062:24672,40064:24601,40065:24592,40066:24617,40067:24590,40068:24625,40069:24603,40070:24597,40071:24619,40072:24614,40073:24591,40074:24634,40075:24666,40076:24641,40077:24682,40078:24695,40079:24671,40080:24650,40081:24646,40082:24653,40083:24675,40084:24643,40085:24676,40086:24642,40087:24684,40088:24683,40089:24665,40090:24705,40091:24717,40092:24807,40093:24707,40094:24730,40095:24708,40096:24731,40097:24726,40098:24727,40099:24722,40100:24743,40101:24715,40102:24801,40103:24760,40104:24800,40105:24787,40106:24756,40107:24560,40108:24765,40109:24774,40110:24757,40111:24792,40112:24909,40113:24853,40114:24838,40115:24822,40116:24823,40117:24832,40118:24820,40119:24826,40120:24835,40121:24865,40122:24827,40123:24817,40124:24845,40125:24846,40126:24903,40127:24894,40128:24872,40129:24871,40130:24906,40131:24895,40132:24892,40133:24876,40134:24884,40135:24893,40136:24898,40137:24900,40138:24947,40139:24951,40140:24920,40141:24921,40142:24922,40143:24939,40144:24948,40145:24943,40146:24933,40147:24945,40148:24927,40149:24925,40150:24915,40151:24949,40152:24985,40153:24982,40154:24967,40155:25004,40156:24980,40157:24986,40158:24970,40159:24977,40160:25003,40161:25006,40162:25036,40163:25034,40164:25033,40165:25079,40166:25032,40167:25027,40168:25030,40169:25018,40170:25035,40171:32633,40172:25037,40173:25062,40174:25059,40175:25078,40176:25082,40177:25076,40178:25087,40179:25085,40180:25084,40181:25086,40182:25088,40183:25096,40184:25097,40185:25101,40186:25100,40187:25108,40188:25115,40256:25118,40257:25121,40258:25130,40259:25134,40260:25136,40261:25138,40262:25139,40263:25153,40264:25166,40265:25182,40266:25187,40267:25179,40268:25184,40269:25192,40270:25212,40271:25218,40272:25225,40273:25214,40274:25234,40275:25235,40276:25238,40277:25300,40278:25219,40279:25236,40280:25303,40281:25297,40282:25275,40283:25295,40284:25343,40285:25286,40286:25812,40287:25288,40288:25308,40289:25292,40290:25290,40291:25282,40292:25287,40293:25243,40294:25289,40295:25356,40296:25326,40297:25329,40298:25383,40299:25346,40300:25352,40301:25327,40302:25333,40303:25424,40304:25406,40305:25421,40306:25628,40307:25423,40308:25494,40309:25486,40310:25472,40311:25515,40312:25462,40313:25507,40314:25487,40315:25481,40316:25503,40317:25525,40318:25451,40320:25449,40321:25534,40322:25577,40323:25536,40324:25542,40325:25571,40326:25545,40327:25554,40328:25590,40329:25540,40330:25622,40331:25652,40332:25606,40333:25619,40334:25638,40335:25654,40336:25885,40337:25623,40338:25640,40339:25615,40340:25703,40341:25711,40342:25718,40343:25678,40344:25898,40345:25749,40346:25747,40347:25765,40348:25769,40349:25736,40350:25788,40351:25818,40352:25810,40353:25797,40354:25799,40355:25787,40356:25816,40357:25794,40358:25841,40359:25831,40360:33289,40361:25824,40362:25825,40363:25260,40364:25827,40365:25839,40366:25900,40367:25846,40368:25844,40369:25842,40370:25850,40371:25856,40372:25853,40373:25880,40374:25884,40375:25861,40376:25892,40377:25891,40378:25899,40379:25908,40380:25909,40381:25911,40382:25910,40383:25912,40384:30027,40385:25928,40386:25942,40387:25941,40388:25933,40389:25944,40390:25950,40391:25949,40392:25970,40393:25976,40394:25986,40395:25987,40396:35722,40397:26011,40398:26015,40399:26027,40400:26039,40401:26051,40402:26054,40403:26049,40404:26052,40405:26060,40406:26066,40407:26075,40408:26073,40409:26080,40410:26081,40411:26097,40412:26482,40413:26122,40414:26115,40415:26107,40416:26483,40417:26165,40418:26166,40419:26164,40420:26140,40421:26191,40422:26180,40423:26185,40424:26177,40425:26206,40426:26205,40427:26212,40428:26215,40429:26216,40430:26207,40431:26210,40432:26224,40433:26243,40434:26248,40435:26254,40436:26249,40437:26244,40438:26264,40439:26269,40440:26305,40441:26297,40442:26313,40443:26302,40444:26300,40512:26308,40513:26296,40514:26326,40515:26330,40516:26336,40517:26175,40518:26342,40519:26345,40520:26352,40521:26357,40522:26359,40523:26383,40524:26390,40525:26398,40526:26406,40527:26407,40528:38712,40529:26414,40530:26431,40531:26422,40532:26433,40533:26424,40534:26423,40535:26438,40536:26462,40537:26464,40538:26457,40539:26467,40540:26468,40541:26505,40542:26480,40543:26537,40544:26492,40545:26474,40546:26508,40547:26507,40548:26534,40549:26529,40550:26501,40551:26551,40552:26607,40553:26548,40554:26604,40555:26547,40556:26601,40557:26552,40558:26596,40559:26590,40560:26589,40561:26594,40562:26606,40563:26553,40564:26574,40565:26566,40566:26599,40567:27292,40568:26654,40569:26694,40570:26665,40571:26688,40572:26701,40573:26674,40574:26702,40576:26803,40577:26667,40578:26713,40579:26723,40580:26743,40581:26751,40582:26783,40583:26767,40584:26797,40585:26772,40586:26781,40587:26779,40588:26755,40589:27310,40590:26809,40591:26740,40592:26805,40593:26784,40594:26810,40595:26895,40596:26765,40597:26750,40598:26881,40599:26826,40600:26888,40601:26840,40602:26914,40603:26918,40604:26849,40605:26892,40606:26829,40607:26836,40608:26855,40609:26837,40610:26934,40611:26898,40612:26884,40613:26839,40614:26851,40615:26917,40616:26873,40617:26848,40618:26863,40619:26920,40620:26922,40621:26906,40622:26915,40623:26913,40624:26822,40625:27001,40626:26999,40627:26972,40628:27e3,40629:26987,40630:26964,40631:27006,40632:26990,40633:26937,40634:26996,40635:26941,40636:26969,40637:26928,40638:26977,40639:26974,40640:26973,40641:27009,40642:26986,40643:27058,40644:27054,40645:27088,40646:27071,40647:27073,40648:27091,40649:27070,40650:27086,40651:23528,40652:27082,40653:27101,40654:27067,40655:27075,40656:27047,40657:27182,40658:27025,40659:27040,40660:27036,40661:27029,40662:27060,40663:27102,40664:27112,40665:27138,40666:27163,40667:27135,40668:27402,40669:27129,40670:27122,40671:27111,40672:27141,40673:27057,40674:27166,40675:27117,40676:27156,40677:27115,40678:27146,40679:27154,40680:27329,40681:27171,40682:27155,40683:27204,40684:27148,40685:27250,40686:27190,40687:27256,40688:27207,40689:27234,40690:27225,40691:27238,40692:27208,40693:27192,40694:27170,40695:27280,40696:27277,40697:27296,40698:27268,40699:27298,40700:27299,40768:27287,40769:34327,40770:27323,40771:27331,40772:27330,40773:27320,40774:27315,40775:27308,40776:27358,40777:27345,40778:27359,40779:27306,40780:27354,40781:27370,40782:27387,40783:27397,40784:34326,40785:27386,40786:27410,40787:27414,40788:39729,40789:27423,40790:27448,40791:27447,40792:30428,40793:27449,40794:39150,40795:27463,40796:27459,40797:27465,40798:27472,40799:27481,40800:27476,40801:27483,40802:27487,40803:27489,40804:27512,40805:27513,40806:27519,40807:27520,40808:27524,40809:27523,40810:27533,40811:27544,40812:27541,40813:27550,40814:27556,40815:27562,40816:27563,40817:27567,40818:27570,40819:27569,40820:27571,40821:27575,40822:27580,40823:27590,40824:27595,40825:27603,40826:27615,40827:27628,40828:27627,40829:27635,40830:27631,40832:40638,40833:27656,40834:27667,40835:27668,40836:27675,40837:27684,40838:27683,40839:27742,40840:27733,40841:27746,40842:27754,40843:27778,40844:27789,40845:27802,40846:27777,40847:27803,40848:27774,40849:27752,40850:27763,40851:27794,40852:27792,40853:27844,40854:27889,40855:27859,40856:27837,40857:27863,40858:27845,40859:27869,40860:27822,40861:27825,40862:27838,40863:27834,40864:27867,40865:27887,40866:27865,40867:27882,40868:27935,40869:34893,40870:27958,40871:27947,40872:27965,40873:27960,40874:27929,40875:27957,40876:27955,40877:27922,40878:27916,40879:28003,40880:28051,40881:28004,40882:27994,40883:28025,40884:27993,40885:28046,40886:28053,40887:28644,40888:28037,40889:28153,40890:28181,40891:28170,40892:28085,40893:28103,40894:28134,40895:28088,40896:28102,40897:28140,40898:28126,40899:28108,40900:28136,40901:28114,40902:28101,40903:28154,40904:28121,40905:28132,40906:28117,40907:28138,40908:28142,40909:28205,40910:28270,40911:28206,40912:28185,40913:28274,40914:28255,40915:28222,40916:28195,40917:28267,40918:28203,40919:28278,40920:28237,40921:28191,40922:28227,40923:28218,40924:28238,40925:28196,40926:28415,40927:28189,40928:28216,40929:28290,40930:28330,40931:28312,40932:28361,40933:28343,40934:28371,40935:28349,40936:28335,40937:28356,40938:28338,40939:28372,40940:28373,40941:28303,40942:28325,40943:28354,40944:28319,40945:28481,40946:28433,40947:28748,40948:28396,40949:28408,40950:28414,40951:28479,40952:28402,40953:28465,40954:28399,40955:28466,40956:28364,161:65377,162:65378,163:65379,164:65380,165:65381,166:65382,167:65383,168:65384,169:65385,170:65386,171:65387,172:65388,173:65389,174:65390,175:65391,176:65392,177:65393,178:65394,179:65395,180:65396,181:65397,182:65398,183:65399,184:65400,185:65401,186:65402,187:65403,188:65404,189:65405,190:65406,191:65407,192:65408,193:65409,194:65410,195:65411,196:65412,197:65413,198:65414,199:65415,200:65416,201:65417,202:65418,203:65419,204:65420,205:65421,206:65422,207:65423,208:65424,209:65425,210:65426,211:65427,212:65428,213:65429,214:65430,215:65431,216:65432,217:65433,218:65434,219:65435,220:65436,221:65437,222:65438,223:65439,57408:28478,57409:28435,57410:28407,57411:28550,57412:28538,57413:28536,57414:28545,57415:28544,57416:28527,57417:28507,57418:28659,57419:28525,57420:28546,57421:28540,57422:28504,57423:28558,57424:28561,57425:28610,57426:28518,57427:28595,57428:28579,57429:28577,57430:28580,57431:28601,57432:28614,57433:28586,57434:28639,57435:28629,57436:28652,57437:28628,57438:28632,57439:28657,57440:28654,57441:28635,57442:28681,57443:28683,57444:28666,57445:28689,57446:28673,57447:28687,57448:28670,57449:28699,57450:28698,57451:28532,57452:28701,57453:28696,57454:28703,57455:28720,57456:28734,57457:28722,57458:28753,57459:28771,57460:28825,57461:28818,57462:28847,57463:28913,57464:28844,57465:28856,57466:28851,57467:28846,57468:28895,57469:28875,57470:28893,57472:28889,57473:28937,57474:28925,57475:28956,57476:28953,57477:29029,57478:29013,57479:29064,57480:29030,57481:29026,57482:29004,57483:29014,57484:29036,57485:29071,57486:29179,57487:29060,57488:29077,57489:29096,57490:29100,57491:29143,57492:29113,57493:29118,57494:29138,57495:29129,57496:29140,57497:29134,57498:29152,57499:29164,57500:29159,57501:29173,57502:29180,57503:29177,57504:29183,57505:29197,57506:29200,57507:29211,57508:29224,57509:29229,57510:29228,57511:29232,57512:29234,57513:29243,57514:29244,57515:29247,57516:29248,57517:29254,57518:29259,57519:29272,57520:29300,57521:29310,57522:29314,57523:29313,57524:29319,57525:29330,57526:29334,57527:29346,57528:29351,57529:29369,57530:29362,57531:29379,57532:29382,57533:29380,57534:29390,57535:29394,57536:29410,57537:29408,57538:29409,57539:29433,57540:29431,57541:20495,57542:29463,57543:29450,57544:29468,57545:29462,57546:29469,57547:29492,57548:29487,57549:29481,57550:29477,57551:29502,57552:29518,57553:29519,57554:40664,57555:29527,57556:29546,57557:29544,57558:29552,57559:29560,57560:29557,57561:29563,57562:29562,57563:29640,57564:29619,57565:29646,57566:29627,57567:29632,57568:29669,57569:29678,57570:29662,57571:29858,57572:29701,57573:29807,57574:29733,57575:29688,57576:29746,57577:29754,57578:29781,57579:29759,57580:29791,57581:29785,57582:29761,57583:29788,57584:29801,57585:29808,57586:29795,57587:29802,57588:29814,57589:29822,57590:29835,57591:29854,57592:29863,57593:29898,57594:29903,57595:29908,57596:29681,57664:29920,57665:29923,57666:29927,57667:29929,57668:29934,57669:29938,57670:29936,57671:29937,57672:29944,57673:29943,57674:29956,57675:29955,57676:29957,57677:29964,57678:29966,57679:29965,57680:29973,57681:29971,57682:29982,57683:29990,57684:29996,57685:30012,57686:30020,57687:30029,57688:30026,57689:30025,57690:30043,57691:30022,57692:30042,57693:30057,57694:30052,57695:30055,57696:30059,57697:30061,57698:30072,57699:30070,57700:30086,57701:30087,57702:30068,57703:30090,57704:30089,57705:30082,57706:30100,57707:30106,57708:30109,57709:30117,57710:30115,57711:30146,57712:30131,57713:30147,57714:30133,57715:30141,57716:30136,57717:30140,57718:30129,57719:30157,57720:30154,57721:30162,57722:30169,57723:30179,57724:30174,57725:30206,57726:30207,57728:30204,57729:30209,57730:30192,57731:30202,57732:30194,57733:30195,57734:30219,57735:30221,57736:30217,57737:30239,57738:30247,57739:30240,57740:30241,57741:30242,57742:30244,57743:30260,57744:30256,57745:30267,57746:30279,57747:30280,57748:30278,57749:30300,57750:30296,57751:30305,57752:30306,57753:30312,57754:30313,57755:30314,57756:30311,57757:30316,57758:30320,57759:30322,57760:30326,57761:30328,57762:30332,57763:30336,57764:30339,57765:30344,57766:30347,57767:30350,57768:30358,57769:30355,57770:30361,57771:30362,57772:30384,57773:30388,57774:30392,57775:30393,57776:30394,57777:30402,57778:30413,57779:30422,57780:30418,57781:30430,57782:30433,57783:30437,57784:30439,57785:30442,57786:34351,57787:30459,57788:30472,57789:30471,57790:30468,57791:30505,57792:30500,57793:30494,57794:30501,57795:30502,57796:30491,57797:30519,57798:30520,57799:30535,57800:30554,57801:30568,57802:30571,57803:30555,57804:30565,57805:30591,57806:30590,57807:30585,57808:30606,57809:30603,57810:30609,57811:30624,57812:30622,57813:30640,57814:30646,57815:30649,57816:30655,57817:30652,57818:30653,57819:30651,57820:30663,57821:30669,57822:30679,57823:30682,57824:30684,57825:30691,57826:30702,57827:30716,57828:30732,57829:30738,57830:31014,57831:30752,57832:31018,57833:30789,57834:30862,57835:30836,57836:30854,57837:30844,57838:30874,57839:30860,57840:30883,57841:30901,57842:30890,57843:30895,57844:30929,57845:30918,57846:30923,57847:30932,57848:30910,57849:30908,57850:30917,57851:30922,57852:30956,57920:30951,57921:30938,57922:30973,57923:30964,57924:30983,57925:30994,57926:30993,57927:31001,57928:31020,57929:31019,57930:31040,57931:31072,57932:31063,57933:31071,57934:31066,57935:31061,57936:31059,57937:31098,57938:31103,57939:31114,57940:31133,57941:31143,57942:40779,57943:31146,57944:31150,57945:31155,57946:31161,57947:31162,57948:31177,57949:31189,57950:31207,57951:31212,57952:31201,57953:31203,57954:31240,57955:31245,57956:31256,57957:31257,57958:31264,57959:31263,57960:31104,57961:31281,57962:31291,57963:31294,57964:31287,57965:31299,57966:31319,57967:31305,57968:31329,57969:31330,57970:31337,57971:40861,57972:31344,57973:31353,57974:31357,57975:31368,57976:31383,57977:31381,57978:31384,57979:31382,57980:31401,57981:31432,57982:31408,57984:31414,57985:31429,57986:31428,57987:31423,57988:36995,57989:31431,57990:31434,57991:31437,57992:31439,57993:31445,57994:31443,57995:31449,57996:31450,57997:31453,57998:31457,57999:31458,58e3:31462,58001:31469,58002:31472,58003:31490,58004:31503,58005:31498,58006:31494,58007:31539,58008:31512,58009:31513,58010:31518,58011:31541,58012:31528,58013:31542,58014:31568,58015:31610,58016:31492,58017:31565,58018:31499,58019:31564,58020:31557,58021:31605,58022:31589,58023:31604,58024:31591,58025:31600,58026:31601,58027:31596,58028:31598,58029:31645,58030:31640,58031:31647,58032:31629,58033:31644,58034:31642,58035:31627,58036:31634,58037:31631,58038:31581,58039:31641,58040:31691,58041:31681,58042:31692,58043:31695,58044:31668,58045:31686,58046:31709,58047:31721,58048:31761,58049:31764,58050:31718,58051:31717,58052:31840,58053:31744,58054:31751,58055:31763,58056:31731,58057:31735,58058:31767,58059:31757,58060:31734,58061:31779,58062:31783,58063:31786,58064:31775,58065:31799,58066:31787,58067:31805,58068:31820,58069:31811,58070:31828,58071:31823,58072:31808,58073:31824,58074:31832,58075:31839,58076:31844,58077:31830,58078:31845,58079:31852,58080:31861,58081:31875,58082:31888,58083:31908,58084:31917,58085:31906,58086:31915,58087:31905,58088:31912,58089:31923,58090:31922,58091:31921,58092:31918,58093:31929,58094:31933,58095:31936,58096:31941,58097:31938,58098:31960,58099:31954,58100:31964,58101:31970,58102:39739,58103:31983,58104:31986,58105:31988,58106:31990,58107:31994,58108:32006,58176:32002,58177:32028,58178:32021,58179:32010,58180:32069,58181:32075,58182:32046,58183:32050,58184:32063,58185:32053,58186:32070,58187:32115,58188:32086,58189:32078,58190:32114,58191:32104,58192:32110,58193:32079,58194:32099,58195:32147,58196:32137,58197:32091,58198:32143,58199:32125,58200:32155,58201:32186,58202:32174,58203:32163,58204:32181,58205:32199,58206:32189,58207:32171,58208:32317,58209:32162,58210:32175,58211:32220,58212:32184,58213:32159,58214:32176,58215:32216,58216:32221,58217:32228,58218:32222,58219:32251,58220:32242,58221:32225,58222:32261,58223:32266,58224:32291,58225:32289,58226:32274,58227:32305,58228:32287,58229:32265,58230:32267,58231:32290,58232:32326,58233:32358,58234:32315,58235:32309,58236:32313,58237:32323,58238:32311,58240:32306,58241:32314,58242:32359,58243:32349,58244:32342,58245:32350,58246:32345,58247:32346,58248:32377,58249:32362,58250:32361,58251:32380,58252:32379,58253:32387,58254:32213,58255:32381,58256:36782,58257:32383,58258:32392,58259:32393,58260:32396,58261:32402,58262:32400,58263:32403,58264:32404,58265:32406,58266:32398,58267:32411,58268:32412,58269:32568,58270:32570,58271:32581,58272:32588,58273:32589,58274:32590,58275:32592,58276:32593,58277:32597,58278:32596,58279:32600,58280:32607,58281:32608,58282:32616,58283:32617,58284:32615,58285:32632,58286:32642,58287:32646,58288:32643,58289:32648,58290:32647,58291:32652,58292:32660,58293:32670,58294:32669,58295:32666,58296:32675,58297:32687,58298:32690,58299:32697,58300:32686,58301:32694,58302:32696,58303:35697,58304:32709,58305:32710,58306:32714,58307:32725,58308:32724,58309:32737,58310:32742,58311:32745,58312:32755,58313:32761,58314:39132,58315:32774,58316:32772,58317:32779,58318:32786,58319:32792,58320:32793,58321:32796,58322:32801,58323:32808,58324:32831,58325:32827,58326:32842,58327:32838,58328:32850,58329:32856,58330:32858,58331:32863,58332:32866,58333:32872,58334:32883,58335:32882,58336:32880,58337:32886,58338:32889,58339:32893,58340:32895,58341:32900,58342:32902,58343:32901,58344:32923,58345:32915,58346:32922,58347:32941,58348:20880,58349:32940,58350:32987,58351:32997,58352:32985,58353:32989,58354:32964,58355:32986,58356:32982,58357:33033,58358:33007,58359:33009,58360:33051,58361:33065,58362:33059,58363:33071,58364:33099,58432:38539,58433:33094,58434:33086,58435:33107,58436:33105,58437:33020,58438:33137,58439:33134,58440:33125,58441:33126,58442:33140,58443:33155,58444:33160,58445:33162,58446:33152,58447:33154,58448:33184,58449:33173,58450:33188,58451:33187,58452:33119,58453:33171,58454:33193,58455:33200,58456:33205,58457:33214,58458:33208,58459:33213,58460:33216,58461:33218,58462:33210,58463:33225,58464:33229,58465:33233,58466:33241,58467:33240,58468:33224,58469:33242,58470:33247,58471:33248,58472:33255,58473:33274,58474:33275,58475:33278,58476:33281,58477:33282,58478:33285,58479:33287,58480:33290,58481:33293,58482:33296,58483:33302,58484:33321,58485:33323,58486:33336,58487:33331,58488:33344,58489:33369,58490:33368,58491:33373,58492:33370,58493:33375,58494:33380,58496:33378,58497:33384,58498:33386,58499:33387,58500:33326,58501:33393,58502:33399,58503:33400,58504:33406,58505:33421,58506:33426,58507:33451,58508:33439,58509:33467,58510:33452,58511:33505,58512:33507,58513:33503,58514:33490,58515:33524,58516:33523,58517:33530,58518:33683,58519:33539,58520:33531,58521:33529,58522:33502,58523:33542,58524:33500,58525:33545,58526:33497,58527:33589,58528:33588,58529:33558,58530:33586,58531:33585,58532:33600,58533:33593,58534:33616,58535:33605,58536:33583,58537:33579,58538:33559,58539:33560,58540:33669,58541:33690,58542:33706,58543:33695,58544:33698,58545:33686,58546:33571,58547:33678,58548:33671,58549:33674,58550:33660,58551:33717,58552:33651,58553:33653,58554:33696,58555:33673,58556:33704,58557:33780,58558:33811,58559:33771,58560:33742,58561:33789,58562:33795,58563:33752,58564:33803,58565:33729,58566:33783,58567:33799,58568:33760,58569:33778,58570:33805,58571:33826,58572:33824,58573:33725,58574:33848,58575:34054,58576:33787,58577:33901,58578:33834,58579:33852,58580:34138,58581:33924,58582:33911,58583:33899,58584:33965,58585:33902,58586:33922,58587:33897,58588:33862,58589:33836,58590:33903,58591:33913,58592:33845,58593:33994,58594:33890,58595:33977,58596:33983,58597:33951,58598:34009,58599:33997,58600:33979,58601:34010,58602:34e3,58603:33985,58604:33990,58605:34006,58606:33953,58607:34081,58608:34047,58609:34036,58610:34071,58611:34072,58612:34092,58613:34079,58614:34069,58615:34068,58616:34044,58617:34112,58618:34147,58619:34136,58620:34120,58688:34113,58689:34306,58690:34123,58691:34133,58692:34176,58693:34212,58694:34184,58695:34193,58696:34186,58697:34216,58698:34157,58699:34196,58700:34203,58701:34282,58702:34183,58703:34204,58704:34167,58705:34174,58706:34192,58707:34249,58708:34234,58709:34255,58710:34233,58711:34256,58712:34261,58713:34269,58714:34277,58715:34268,58716:34297,58717:34314,58718:34323,58719:34315,58720:34302,58721:34298,58722:34310,58723:34338,58724:34330,58725:34352,58726:34367,58727:34381,58728:20053,58729:34388,58730:34399,58731:34407,58732:34417,58733:34451,58734:34467,58735:34473,58736:34474,58737:34443,58738:34444,58739:34486,58740:34479,58741:34500,58742:34502,58743:34480,58744:34505,58745:34851,58746:34475,58747:34516,58748:34526,58749:34537,58750:34540,58752:34527,58753:34523,58754:34543,58755:34578,58756:34566,58757:34568,58758:34560,58759:34563,58760:34555,58761:34577,58762:34569,58763:34573,58764:34553,58765:34570,58766:34612,58767:34623,58768:34615,58769:34619,58770:34597,58771:34601,58772:34586,58773:34656,58774:34655,58775:34680,58776:34636,58777:34638,58778:34676,58779:34647,58780:34664,58781:34670,58782:34649,58783:34643,58784:34659,58785:34666,58786:34821,58787:34722,58788:34719,58789:34690,58790:34735,58791:34763,58792:34749,58793:34752,58794:34768,58795:38614,58796:34731,58797:34756,58798:34739,58799:34759,58800:34758,58801:34747,58802:34799,58803:34802,58804:34784,58805:34831,58806:34829,58807:34814,58808:34806,58809:34807,58810:34830,58811:34770,58812:34833,58813:34838,58814:34837,58815:34850,58816:34849,58817:34865,58818:34870,58819:34873,58820:34855,58821:34875,58822:34884,58823:34882,58824:34898,58825:34905,58826:34910,58827:34914,58828:34923,58829:34945,58830:34942,58831:34974,58832:34933,58833:34941,58834:34997,58835:34930,58836:34946,58837:34967,58838:34962,58839:34990,58840:34969,58841:34978,58842:34957,58843:34980,58844:34992,58845:35007,58846:34993,58847:35011,58848:35012,58849:35028,58850:35032,58851:35033,58852:35037,58853:35065,58854:35074,58855:35068,58856:35060,58857:35048,58858:35058,58859:35076,58860:35084,58861:35082,58862:35091,58863:35139,58864:35102,58865:35109,58866:35114,58867:35115,58868:35137,58869:35140,58870:35131,58871:35126,58872:35128,58873:35148,58874:35101,58875:35168,58876:35166,58944:35174,58945:35172,58946:35181,58947:35178,58948:35183,58949:35188,58950:35191,58951:35198,58952:35203,58953:35208,58954:35210,58955:35219,58956:35224,58957:35233,58958:35241,58959:35238,58960:35244,58961:35247,58962:35250,58963:35258,58964:35261,58965:35263,58966:35264,58967:35290,58968:35292,58969:35293,58970:35303,58971:35316,58972:35320,58973:35331,58974:35350,58975:35344,58976:35340,58977:35355,58978:35357,58979:35365,58980:35382,58981:35393,58982:35419,58983:35410,58984:35398,58985:35400,58986:35452,58987:35437,58988:35436,58989:35426,58990:35461,58991:35458,58992:35460,58993:35496,58994:35489,58995:35473,58996:35493,58997:35494,58998:35482,58999:35491,59e3:35524,59001:35533,59002:35522,59003:35546,59004:35563,59005:35571,59006:35559,59008:35556,59009:35569,59010:35604,59011:35552,59012:35554,59013:35575,59014:35550,59015:35547,59016:35596,59017:35591,59018:35610,59019:35553,59020:35606,59021:35600,59022:35607,59023:35616,59024:35635,59025:38827,59026:35622,59027:35627,59028:35646,59029:35624,59030:35649,59031:35660,59032:35663,59033:35662,59034:35657,59035:35670,59036:35675,59037:35674,59038:35691,59039:35679,59040:35692,59041:35695,59042:35700,59043:35709,59044:35712,59045:35724,59046:35726,59047:35730,59048:35731,59049:35734,59050:35737,59051:35738,59052:35898,59053:35905,59054:35903,59055:35912,59056:35916,59057:35918,59058:35920,59059:35925,59060:35938,59061:35948,59062:35960,59063:35962,59064:35970,59065:35977,59066:35973,59067:35978,59068:35981,59069:35982,59070:35988,59071:35964,59072:35992,59073:25117,59074:36013,59075:36010,59076:36029,59077:36018,59078:36019,59079:36014,59080:36022,59081:36040,59082:36033,59083:36068,59084:36067,59085:36058,59086:36093,59087:36090,59088:36091,59089:36100,59090:36101,59091:36106,59092:36103,59093:36111,59094:36109,59095:36112,59096:40782,59097:36115,59098:36045,59099:36116,59100:36118,59101:36199,59102:36205,59103:36209,59104:36211,59105:36225,59106:36249,59107:36290,59108:36286,59109:36282,59110:36303,59111:36314,59112:36310,59113:36300,59114:36315,59115:36299,59116:36330,59117:36331,59118:36319,59119:36323,59120:36348,59121:36360,59122:36361,59123:36351,59124:36381,59125:36382,59126:36368,59127:36383,59128:36418,59129:36405,59130:36400,59131:36404,59132:36426,59200:36423,59201:36425,59202:36428,59203:36432,59204:36424,59205:36441,59206:36452,59207:36448,59208:36394,59209:36451,59210:36437,59211:36470,59212:36466,59213:36476,59214:36481,59215:36487,59216:36485,59217:36484,59218:36491,59219:36490,59220:36499,59221:36497,59222:36500,59223:36505,59224:36522,59225:36513,59226:36524,59227:36528,59228:36550,59229:36529,59230:36542,59231:36549,59232:36552,59233:36555,59234:36571,59235:36579,59236:36604,59237:36603,59238:36587,59239:36606,59240:36618,59241:36613,59242:36629,59243:36626,59244:36633,59245:36627,59246:36636,59247:36639,59248:36635,59249:36620,59250:36646,59251:36659,59252:36667,59253:36665,59254:36677,59255:36674,59256:36670,59257:36684,59258:36681,59259:36678,59260:36686,59261:36695,59262:36700,59264:36706,59265:36707,59266:36708,59267:36764,59268:36767,59269:36771,59270:36781,59271:36783,59272:36791,59273:36826,59274:36837,59275:36834,59276:36842,59277:36847,59278:36999,59279:36852,59280:36869,59281:36857,59282:36858,59283:36881,59284:36885,59285:36897,59286:36877,59287:36894,59288:36886,59289:36875,59290:36903,59291:36918,59292:36917,59293:36921,59294:36856,59295:36943,59296:36944,59297:36945,59298:36946,59299:36878,59300:36937,59301:36926,59302:36950,59303:36952,59304:36958,59305:36968,59306:36975,59307:36982,59308:38568,59309:36978,59310:36994,59311:36989,59312:36993,59313:36992,59314:37002,59315:37001,59316:37007,59317:37032,59318:37039,59319:37041,59320:37045,59321:37090,59322:37092,59323:25160,59324:37083,59325:37122,59326:37138,59327:37145,59328:37170,59329:37168,59330:37194,59331:37206,59332:37208,59333:37219,59334:37221,59335:37225,59336:37235,59337:37234,59338:37259,59339:37257,59340:37250,59341:37282,59342:37291,59343:37295,59344:37290,59345:37301,59346:37300,59347:37306,59348:37312,59349:37313,59350:37321,59351:37323,59352:37328,59353:37334,59354:37343,59355:37345,59356:37339,59357:37372,59358:37365,59359:37366,59360:37406,59361:37375,59362:37396,59363:37420,59364:37397,59365:37393,59366:37470,59367:37463,59368:37445,59369:37449,59370:37476,59371:37448,59372:37525,59373:37439,59374:37451,59375:37456,59376:37532,59377:37526,59378:37523,59379:37531,59380:37466,59381:37583,59382:37561,59383:37559,59384:37609,59385:37647,59386:37626,59387:37700,59388:37678,59456:37657,59457:37666,59458:37658,59459:37667,59460:37690,59461:37685,59462:37691,59463:37724,59464:37728,59465:37756,59466:37742,59467:37718,59468:37808,59469:37804,59470:37805,59471:37780,59472:37817,59473:37846,59474:37847,59475:37864,59476:37861,59477:37848,59478:37827,59479:37853,59480:37840,59481:37832,59482:37860,59483:37914,59484:37908,59485:37907,59486:37891,59487:37895,59488:37904,59489:37942,59490:37931,59491:37941,59492:37921,59493:37946,59494:37953,59495:37970,59496:37956,59497:37979,59498:37984,59499:37986,59500:37982,59501:37994,59502:37417,59503:38e3,59504:38005,59505:38007,59506:38013,59507:37978,59508:38012,59509:38014,59510:38017,59511:38015,59512:38274,59513:38279,59514:38282,59515:38292,59516:38294,59517:38296,59518:38297,59520:38304,59521:38312,59522:38311,59523:38317,59524:38332,59525:38331,59526:38329,59527:38334,59528:38346,59529:28662,59530:38339,59531:38349,59532:38348,59533:38357,59534:38356,59535:38358,59536:38364,59537:38369,59538:38373,59539:38370,59540:38433,59541:38440,59542:38446,59543:38447,59544:38466,59545:38476,59546:38479,59547:38475,59548:38519,59549:38492,59550:38494,59551:38493,59552:38495,59553:38502,59554:38514,59555:38508,59556:38541,59557:38552,59558:38549,59559:38551,59560:38570,59561:38567,59562:38577,59563:38578,59564:38576,59565:38580,59566:38582,59567:38584,59568:38585,59569:38606,59570:38603,59571:38601,59572:38605,59573:35149,59574:38620,59575:38669,59576:38613,59577:38649,59578:38660,59579:38662,59580:38664,59581:38675,59582:38670,59583:38673,59584:38671,59585:38678,59586:38681,59587:38692,59588:38698,59589:38704,59590:38713,59591:38717,59592:38718,59593:38724,59594:38726,59595:38728,59596:38722,59597:38729,59598:38748,59599:38752,59600:38756,59601:38758,59602:38760,59603:21202,59604:38763,59605:38769,59606:38777,59607:38789,59608:38780,59609:38785,59610:38778,59611:38790,59612:38795,59613:38799,59614:38800,59615:38812,59616:38824,59617:38822,59618:38819,59619:38835,59620:38836,59621:38851,59622:38854,59623:38856,59624:38859,59625:38876,59626:38893,59627:40783,59628:38898,59629:31455,59630:38902,59631:38901,59632:38927,59633:38924,59634:38968,59635:38948,59636:38945,59637:38967,59638:38973,59639:38982,59640:38991,59641:38987,59642:39019,59643:39023,59644:39024,59712:39025,59713:39028,59714:39027,59715:39082,59716:39087,59717:39089,59718:39094,59719:39108,59720:39107,59721:39110,59722:39145,59723:39147,59724:39171,59725:39177,59726:39186,59727:39188,59728:39192,59729:39201,59730:39197,59731:39198,59732:39204,59733:39200,59734:39212,59735:39214,59736:39229,59737:39230,59738:39234,59739:39241,59740:39237,59741:39248,59742:39243,59743:39249,59744:39250,59745:39244,59746:39253,59747:39319,59748:39320,59749:39333,59750:39341,59751:39342,59752:39356,59753:39391,59754:39387,59755:39389,59756:39384,59757:39377,59758:39405,59759:39406,59760:39409,59761:39410,59762:39419,59763:39416,59764:39425,59765:39439,59766:39429,59767:39394,59768:39449,59769:39467,59770:39479,59771:39493,59772:39490,59773:39488,59774:39491,59776:39486,59777:39509,59778:39501,59779:39515,59780:39511,59781:39519,59782:39522,59783:39525,59784:39524,59785:39529,59786:39531,59787:39530,59788:39597,59789:39600,59790:39612,59791:39616,59792:39631,59793:39633,59794:39635,59795:39636,59796:39646,59797:39647,59798:39650,59799:39651,59800:39654,59801:39663,59802:39659,59803:39662,59804:39668,59805:39665,59806:39671,59807:39675,59808:39686,59809:39704,59810:39706,59811:39711,59812:39714,59813:39715,59814:39717,59815:39719,59816:39720,59817:39721,59818:39722,59819:39726,59820:39727,59821:39730,59822:39748,59823:39747,59824:39759,59825:39757,59826:39758,59827:39761,59828:39768,59829:39796,59830:39827,59831:39811,59832:39825,59833:39830,59834:39831,59835:39839,59836:39840,59837:39848,59838:39860,59839:39872,59840:39882,59841:39865,59842:39878,59843:39887,59844:39889,59845:39890,59846:39907,59847:39906,59848:39908,59849:39892,59850:39905,59851:39994,59852:39922,59853:39921,59854:39920,59855:39957,59856:39956,59857:39945,59858:39955,59859:39948,59860:39942,59861:39944,59862:39954,59863:39946,59864:39940,59865:39982,59866:39963,59867:39973,59868:39972,59869:39969,59870:39984,59871:40007,59872:39986,59873:40006,59874:39998,59875:40026,59876:40032,59877:40039,59878:40054,59879:40056,59880:40167,59881:40172,59882:40176,59883:40201,59884:40200,59885:40171,59886:40195,59887:40198,59888:40234,59889:40230,59890:40367,59891:40227,59892:40223,59893:40260,59894:40213,59895:40210,59896:40257,59897:40255,59898:40254,59899:40262,59900:40264,59968:40285,59969:40286,59970:40292,59971:40273,59972:40272,59973:40281,59974:40306,59975:40329,59976:40327,59977:40363,59978:40303,59979:40314,59980:40346,59981:40356,59982:40361,59983:40370,59984:40388,59985:40385,59986:40379,59987:40376,59988:40378,59989:40390,59990:40399,59991:40386,59992:40409,59993:40403,59994:40440,59995:40422,59996:40429,59997:40431,59998:40445,59999:40474,6e4:40475,60001:40478,60002:40565,60003:40569,60004:40573,60005:40577,60006:40584,60007:40587,60008:40588,60009:40594,60010:40597,60011:40593,60012:40605,60013:40613,60014:40617,60015:40632,60016:40618,60017:40621,60018:38753,60019:40652,60020:40654,60021:40655,60022:40656,60023:40660,60024:40668,60025:40670,60026:40669,60027:40672,60028:40677,60029:40680,60030:40687,60032:40692,60033:40694,60034:40695,60035:40697,60036:40699,60037:40700,60038:40701,60039:40711,60040:40712,60041:30391,60042:40725,60043:40737,60044:40748,60045:40766,60046:40778,60047:40786,60048:40788,60049:40803,60050:40799,60051:40800,60052:40801,60053:40806,60054:40807,60055:40812,60056:40810,60057:40823,60058:40818,60059:40822,60060:40853,60061:40860,60062:40864,60063:22575,60064:27079,60065:36953,60066:29796,60067:20956,60068:29081}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(1),c=r(2);e.decode=function(o,e){var r=new Uint8ClampedArray(o.length);r.set(o);for(var s=new t.default(285,256,0),a=new c.default(s,r),n=new Uint8ClampedArray(e),d=!1,l=0;l<e;l++){var i=a.evaluateAt(s.exp(l+s.generatorBase));n[n.length-1-l]=i,0!==i&&(d=!0)}if(!d)return r;var B=new c.default(s,n),k=function(o,e,r,t){var c;e.degree()<r.degree()&&(e=(c=[r,e])[0],r=c[1]);for(var s=e,a=r,n=o.zero,d=o.one;a.degree()>=t/2;){var l=s,i=n;if(n=d,(s=a).isZero())return null;a=l;for(var B=o.zero,k=s.getCoefficient(s.degree()),u=o.inverse(k);a.degree()>=s.degree()&&!a.isZero();){var C=a.degree()-s.degree(),m=o.multiply(a.getCoefficient(a.degree()),u);B=B.addOrSubtract(o.buildMonomial(C,m)),a=a.addOrSubtract(s.multiplyByMonomial(C,m))}if(d=B.multiplyPoly(n).addOrSubtract(i),a.degree()>=s.degree())return null}var f=d.getCoefficient(0);if(0===f)return null;var w=o.inverse(f);return[d.multiply(w),a.multiply(w)]}(s,s.buildMonomial(e,1),B,e);if(null===k)return null;var u=function(o,e){var r=e.degree();if(1===r)return[e.getCoefficient(1)];for(var t=new Array(r),c=0,s=1;s<o.size&&c<r;s++)0===e.evaluateAt(s)&&(t[c]=o.inverse(s),c++);return c!==r?null:t}(s,k[0]);if(null==u)return null;for(var C=function(o,e,r){for(var c=r.length,s=new Array(c),a=0;a<c;a++){for(var n=o.inverse(r[a]),d=1,l=0;l<c;l++)a!==l&&(d=o.multiply(d,t.addOrSubtractGF(1,o.multiply(r[l],n))));s[a]=o.multiply(e.evaluateAt(n),o.inverse(d)),0!==o.generatorBase&&(s[a]=o.multiply(s[a],n))}return s}(s,k[1],u),m=0;m<u.length;m++){var f=r.length-1-s.log(u[m]);if(f<0)return null;r[f]=t.addOrSubtractGF(r[f],C[m])}return r}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.VERSIONS=[{infoBits:null,versionNumber:1,alignmentPatternCenters:[],errorCorrectionLevels:[{ecCodewordsPerBlock:7,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:10,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:16}]},{ecCodewordsPerBlock:13,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:13}]},{ecCodewordsPerBlock:17,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:9}]}]},{infoBits:null,versionNumber:2,alignmentPatternCenters:[6,18],errorCorrectionLevels:[{ecCodewordsPerBlock:10,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:34}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:28}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:22}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:16}]}]},{infoBits:null,versionNumber:3,alignmentPatternCenters:[6,22],errorCorrectionLevels:[{ecCodewordsPerBlock:15,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:55}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:13}]}]},{infoBits:null,versionNumber:4,alignmentPatternCenters:[6,26],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:80}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:32}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:9}]}]},{infoBits:null,versionNumber:5,alignmentPatternCenters:[6,30],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:43}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:15},{numBlocks:2,dataCodewordsPerBlock:16}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:11},{numBlocks:2,dataCodewordsPerBlock:12}]}]},{infoBits:null,versionNumber:6,alignmentPatternCenters:[6,34],errorCorrectionLevels:[{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:68}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:27}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:15}]}]},{infoBits:31892,versionNumber:7,alignmentPatternCenters:[6,22,38],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:78}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:31}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:4,dataCodewordsPerBlock:15}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:13},{numBlocks:1,dataCodewordsPerBlock:14}]}]},{infoBits:34236,versionNumber:8,alignmentPatternCenters:[6,24,42],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:97}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:38},{numBlocks:2,dataCodewordsPerBlock:39}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:18},{numBlocks:2,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:14},{numBlocks:2,dataCodewordsPerBlock:15}]}]},{infoBits:39577,versionNumber:9,alignmentPatternCenters:[6,26,46],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:36},{numBlocks:2,dataCodewordsPerBlock:37}]},{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:16},{numBlocks:4,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:12},{numBlocks:4,dataCodewordsPerBlock:13}]}]},{infoBits:42195,versionNumber:10,alignmentPatternCenters:[6,28,50],errorCorrectionLevels:[{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:68},{numBlocks:2,dataCodewordsPerBlock:69}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:43},{numBlocks:1,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:19},{numBlocks:2,dataCodewordsPerBlock:20}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:15},{numBlocks:2,dataCodewordsPerBlock:16}]}]},{infoBits:48118,versionNumber:11,alignmentPatternCenters:[6,30,54],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:81}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:50},{numBlocks:4,dataCodewordsPerBlock:51}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:22},{numBlocks:4,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:12},{numBlocks:8,dataCodewordsPerBlock:13}]}]},{infoBits:51042,versionNumber:12,alignmentPatternCenters:[6,32,58],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:92},{numBlocks:2,dataCodewordsPerBlock:93}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:36},{numBlocks:2,dataCodewordsPerBlock:37}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:20},{numBlocks:6,dataCodewordsPerBlock:21}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:14},{numBlocks:4,dataCodewordsPerBlock:15}]}]},{infoBits:55367,versionNumber:13,alignmentPatternCenters:[6,34,62],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:107}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:37},{numBlocks:1,dataCodewordsPerBlock:38}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:20},{numBlocks:4,dataCodewordsPerBlock:21}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:11},{numBlocks:4,dataCodewordsPerBlock:12}]}]},{infoBits:58893,versionNumber:14,alignmentPatternCenters:[6,26,46,66],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:115},{numBlocks:1,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:40},{numBlocks:5,dataCodewordsPerBlock:41}]},{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:16},{numBlocks:5,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:12},{numBlocks:5,dataCodewordsPerBlock:13}]}]},{infoBits:63784,versionNumber:15,alignmentPatternCenters:[6,26,48,70],errorCorrectionLevels:[{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:87},{numBlocks:1,dataCodewordsPerBlock:88}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:41},{numBlocks:5,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:24},{numBlocks:7,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:12},{numBlocks:7,dataCodewordsPerBlock:13}]}]},{infoBits:68472,versionNumber:16,alignmentPatternCenters:[6,26,50,74],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:98},{numBlocks:1,dataCodewordsPerBlock:99}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:45},{numBlocks:3,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:19},{numBlocks:2,dataCodewordsPerBlock:20}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:15},{numBlocks:13,dataCodewordsPerBlock:16}]}]},{infoBits:70749,versionNumber:17,alignmentPatternCenters:[6,30,54,78],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:107},{numBlocks:5,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:46},{numBlocks:1,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:22},{numBlocks:15,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:17,dataCodewordsPerBlock:15}]}]},{infoBits:76311,versionNumber:18,alignmentPatternCenters:[6,30,56,82],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:120},{numBlocks:1,dataCodewordsPerBlock:121}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:9,dataCodewordsPerBlock:43},{numBlocks:4,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:22},{numBlocks:1,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:19,dataCodewordsPerBlock:15}]}]},{infoBits:79154,versionNumber:19,alignmentPatternCenters:[6,30,58,86],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:113},{numBlocks:4,dataCodewordsPerBlock:114}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:44},{numBlocks:11,dataCodewordsPerBlock:45}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:21},{numBlocks:4,dataCodewordsPerBlock:22}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:9,dataCodewordsPerBlock:13},{numBlocks:16,dataCodewordsPerBlock:14}]}]},{infoBits:84390,versionNumber:20,alignmentPatternCenters:[6,34,62,90],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:107},{numBlocks:5,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:41},{numBlocks:13,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:24},{numBlocks:5,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:15},{numBlocks:10,dataCodewordsPerBlock:16}]}]},{infoBits:87683,versionNumber:21,alignmentPatternCenters:[6,28,50,72,94],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:116},{numBlocks:4,dataCodewordsPerBlock:117}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:22},{numBlocks:6,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:16},{numBlocks:6,dataCodewordsPerBlock:17}]}]},{infoBits:92361,versionNumber:22,alignmentPatternCenters:[6,26,50,74,98],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:111},{numBlocks:7,dataCodewordsPerBlock:112}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:24},{numBlocks:16,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:34,dataCodewordsPerBlock:13}]}]},{infoBits:96236,versionNumber:23,alignmentPatternCenters:[6,30,54,74,102],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:121},{numBlocks:5,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:47},{numBlocks:14,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:16,dataCodewordsPerBlock:15},{numBlocks:14,dataCodewordsPerBlock:16}]}]},{infoBits:102084,versionNumber:24,alignmentPatternCenters:[6,28,54,80,106],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:117},{numBlocks:4,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:45},{numBlocks:14,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:24},{numBlocks:16,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:30,dataCodewordsPerBlock:16},{numBlocks:2,dataCodewordsPerBlock:17}]}]},{infoBits:102881,versionNumber:25,alignmentPatternCenters:[6,32,58,84,110],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:106},{numBlocks:4,dataCodewordsPerBlock:107}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:47},{numBlocks:13,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:24},{numBlocks:22,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:15},{numBlocks:13,dataCodewordsPerBlock:16}]}]},{infoBits:110507,versionNumber:26,alignmentPatternCenters:[6,30,58,86,114],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:114},{numBlocks:2,dataCodewordsPerBlock:115}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:46},{numBlocks:4,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:28,dataCodewordsPerBlock:22},{numBlocks:6,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:33,dataCodewordsPerBlock:16},{numBlocks:4,dataCodewordsPerBlock:17}]}]},{infoBits:110734,versionNumber:27,alignmentPatternCenters:[6,34,62,90,118],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:122},{numBlocks:4,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:45},{numBlocks:3,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:23},{numBlocks:26,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:15},{numBlocks:28,dataCodewordsPerBlock:16}]}]},{infoBits:117786,versionNumber:28,alignmentPatternCenters:[6,26,50,74,98,122],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:117},{numBlocks:10,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:45},{numBlocks:23,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:24},{numBlocks:31,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:15},{numBlocks:31,dataCodewordsPerBlock:16}]}]},{infoBits:119615,versionNumber:29,alignmentPatternCenters:[6,30,54,78,102,126],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:116},{numBlocks:7,dataCodewordsPerBlock:117}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:21,dataCodewordsPerBlock:45},{numBlocks:7,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:23},{numBlocks:37,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:15},{numBlocks:26,dataCodewordsPerBlock:16}]}]},{infoBits:126325,versionNumber:30,alignmentPatternCenters:[6,26,52,78,104,130],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:115},{numBlocks:10,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:47},{numBlocks:10,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:24},{numBlocks:25,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:23,dataCodewordsPerBlock:15},{numBlocks:25,dataCodewordsPerBlock:16}]}]},{infoBits:127568,versionNumber:31,alignmentPatternCenters:[6,30,56,82,108,134],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:115},{numBlocks:3,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:46},{numBlocks:29,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:42,dataCodewordsPerBlock:24},{numBlocks:1,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:23,dataCodewordsPerBlock:15},{numBlocks:28,dataCodewordsPerBlock:16}]}]},{infoBits:133589,versionNumber:32,alignmentPatternCenters:[6,34,60,86,112,138],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:115}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:46},{numBlocks:23,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:24},{numBlocks:35,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:15},{numBlocks:35,dataCodewordsPerBlock:16}]}]},{infoBits:136944,versionNumber:33,alignmentPatternCenters:[6,30,58,86,114,142],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:115},{numBlocks:1,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:14,dataCodewordsPerBlock:46},{numBlocks:21,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:29,dataCodewordsPerBlock:24},{numBlocks:19,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:15},{numBlocks:46,dataCodewordsPerBlock:16}]}]},{infoBits:141498,versionNumber:34,alignmentPatternCenters:[6,34,62,90,118,146],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:115},{numBlocks:6,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:14,dataCodewordsPerBlock:46},{numBlocks:23,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:44,dataCodewordsPerBlock:24},{numBlocks:7,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:59,dataCodewordsPerBlock:16},{numBlocks:1,dataCodewordsPerBlock:17}]}]},{infoBits:145311,versionNumber:35,alignmentPatternCenters:[6,30,54,78,102,126,150],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:121},{numBlocks:7,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:47},{numBlocks:26,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:39,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:15},{numBlocks:41,dataCodewordsPerBlock:16}]}]},{infoBits:150283,versionNumber:36,alignmentPatternCenters:[6,24,50,76,102,128,154],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:121},{numBlocks:14,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:47},{numBlocks:34,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:46,dataCodewordsPerBlock:24},{numBlocks:10,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:15},{numBlocks:64,dataCodewordsPerBlock:16}]}]},{infoBits:152622,versionNumber:37,alignmentPatternCenters:[6,28,54,80,106,132,158],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:122},{numBlocks:4,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:29,dataCodewordsPerBlock:46},{numBlocks:14,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:49,dataCodewordsPerBlock:24},{numBlocks:10,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:24,dataCodewordsPerBlock:15},{numBlocks:46,dataCodewordsPerBlock:16}]}]},{infoBits:158308,versionNumber:38,alignmentPatternCenters:[6,32,58,84,110,136,162],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:122},{numBlocks:18,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:46},{numBlocks:32,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:48,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:42,dataCodewordsPerBlock:15},{numBlocks:32,dataCodewordsPerBlock:16}]}]},{infoBits:161089,versionNumber:39,alignmentPatternCenters:[6,26,54,82,110,138,166],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:20,dataCodewordsPerBlock:117},{numBlocks:4,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:40,dataCodewordsPerBlock:47},{numBlocks:7,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:43,dataCodewordsPerBlock:24},{numBlocks:22,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:15},{numBlocks:67,dataCodewordsPerBlock:16}]}]},{infoBits:167017,versionNumber:40,alignmentPatternCenters:[6,30,58,86,114,142,170],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:118},{numBlocks:6,dataCodewordsPerBlock:119}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:18,dataCodewordsPerBlock:47},{numBlocks:31,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:34,dataCodewordsPerBlock:24},{numBlocks:34,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:20,dataCodewordsPerBlock:15},{numBlocks:61,dataCodewordsPerBlock:16}]}]}]},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0);function c(o,e,r,t){var c=o.x-e.x+r.x-t.x,s=o.y-e.y+r.y-t.y;if(0===c&&0===s)return{a11:e.x-o.x,a12:e.y-o.y,a13:0,a21:r.x-e.x,a22:r.y-e.y,a23:0,a31:o.x,a32:o.y,a33:1};var a=e.x-r.x,n=t.x-r.x,d=e.y-r.y,l=t.y-r.y,i=a*l-n*d,B=(c*l-n*s)/i,k=(a*s-c*d)/i;return{a11:e.x-o.x+B*e.x,a12:e.y-o.y+B*e.y,a13:B,a21:t.x-o.x+k*t.x,a22:t.y-o.y+k*t.y,a23:k,a31:o.x,a32:o.y,a33:1}}e.extract=function(o,e){for(var r,s,a=function(o,e,r,t){var s=c(o,e,r,t);return{a11:s.a22*s.a33-s.a23*s.a32,a12:s.a13*s.a32-s.a12*s.a33,a13:s.a12*s.a23-s.a13*s.a22,a21:s.a23*s.a31-s.a21*s.a33,a22:s.a11*s.a33-s.a13*s.a31,a23:s.a13*s.a21-s.a11*s.a23,a31:s.a21*s.a32-s.a22*s.a31,a32:s.a12*s.a31-s.a11*s.a32,a33:s.a11*s.a22-s.a12*s.a21}}({x:3.5,y:3.5},{x:e.dimension-3.5,y:3.5},{x:e.dimension-6.5,y:e.dimension-6.5},{x:3.5,y:e.dimension-3.5}),n=c(e.topLeft,e.topRight,e.alignmentPattern,e.bottomLeft),d=(s=a,{a11:(r=n).a11*s.a11+r.a21*s.a12+r.a31*s.a13,a12:r.a12*s.a11+r.a22*s.a12+r.a32*s.a13,a13:r.a13*s.a11+r.a23*s.a12+r.a33*s.a13,a21:r.a11*s.a21+r.a21*s.a22+r.a31*s.a23,a22:r.a12*s.a21+r.a22*s.a22+r.a32*s.a23,a23:r.a13*s.a21+r.a23*s.a22+r.a33*s.a23,a31:r.a11*s.a31+r.a21*s.a32+r.a31*s.a33,a32:r.a12*s.a31+r.a22*s.a32+r.a32*s.a33,a33:r.a13*s.a31+r.a23*s.a32+r.a33*s.a33}),l=t.BitMatrix.createEmpty(e.dimension,e.dimension),i=function(o,e){var r=d.a13*o+d.a23*e+d.a33;return{x:(d.a11*o+d.a21*e+d.a31)/r,y:(d.a12*o+d.a22*e+d.a32)/r}},B=0;B<e.dimension;B++)for(var k=0;k<e.dimension;k++){var u=i(k+.5,B+.5);l.set(k,B,o.get(Math.floor(u.x),Math.floor(u.y)))}return{matrix:l,mappingFunction:i}}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(o,e){return Math.sqrt(Math.pow(e.x-o.x,2)+Math.pow(e.y-o.y,2))};function c(o){return o.reduce((function(o,e){return o+e}))}function s(o,e,r,c){var s,a,n,d,l=[{x:Math.floor(o.x),y:Math.floor(o.y)}],i=Math.abs(e.y-o.y)>Math.abs(e.x-o.x);i?(s=Math.floor(o.y),a=Math.floor(o.x),n=Math.floor(e.y),d=Math.floor(e.x)):(s=Math.floor(o.x),a=Math.floor(o.y),n=Math.floor(e.x),d=Math.floor(e.y));for(var B=Math.abs(n-s),k=Math.abs(d-a),u=Math.floor(-B/2),C=s<n?1:-1,m=a<d?1:-1,f=!0,w=s,P=a;w!==n+C;w+=C){var v=i?P:w,h=i?w:P;if(r.get(v,h)!==f&&(f=!f,l.push({x:v,y:h}),l.length===c+1))break;if((u+=k)>0){if(P===d)break;P+=m,u-=B}}for(var y=[],p=0;p<c;p++)l[p]&&l[p+1]?y.push(t(l[p],l[p+1])):y.push(0);return y}function a(o,e,r,t){var c,a=e.y-o.y,n=e.x-o.x,d=s(o,e,r,Math.ceil(t/2)),l=s(o,{x:o.x-n,y:o.y-a},r,Math.ceil(t/2)),i=d.shift()+l.shift()-1;return(c=l.concat(i)).concat.apply(c,d)}function n(o,e){var r=c(o)/c(e),t=0;return e.forEach((function(e,c){t+=Math.pow(o[c]-e*r,2)})),{averageSize:r,error:t}}function d(o,e,r){try{var t=a(o,{x:-1,y:o.y},r,e.length),c=a(o,{x:o.x,y:-1},r,e.length),s=a(o,{x:Math.max(0,o.x-o.y)-1,y:Math.max(0,o.y-o.x)-1},r,e.length),d=a(o,{x:Math.min(r.width,o.x+o.y)+1,y:Math.min(r.height,o.y+o.x)+1},r,e.length),l=n(t,e),i=n(c,e),B=n(s,e),k=n(d,e),u=Math.sqrt(l.error*l.error+i.error*i.error+B.error*B.error+k.error*k.error),C=(l.averageSize+i.averageSize+B.averageSize+k.averageSize)/4;return u+(Math.pow(l.averageSize-C,2)+Math.pow(i.averageSize-C,2)+Math.pow(B.averageSize-C,2)+Math.pow(k.averageSize-C,2))/C}catch(o){return 1/0}}function l(o,e){for(var r=Math.round(e.x);o.get(r,Math.round(e.y));)r--;for(var t=Math.round(e.x);o.get(t,Math.round(e.y));)t++;for(var c=(r+t)/2,s=Math.round(e.y);o.get(Math.round(c),s);)s--;for(var a=Math.round(e.y);o.get(Math.round(c),a);)a++;return{x:c,y:(s+a)/2}}function i(o,e,r,s,n){var l,i,B;try{l=function(o,e,r,s){var n=(c(a(o,r,s,5))/7+c(a(o,e,s,5))/7+c(a(r,o,s,5))/7+c(a(e,o,s,5))/7)/4;if(n<1)throw new Error("Invalid module size");var d=Math.round(t(o,e)/n),l=Math.round(t(o,r)/n),i=Math.floor((d+l)/2)+7;switch(i%4){case 0:i++;break;case 2:i--}return{dimension:i,moduleSize:n}}(s,r,n,o),i=l.dimension,B=l.moduleSize}catch(o){return null}var k=r.x-s.x+n.x,u=r.y-s.y+n.y,C=(t(s,n)+t(s,r))/2/B,m=1-3/C,f={x:s.x+m*(k-s.x),y:s.y+m*(u-s.y)},w=e.map((function(e){var r=(e.top.startX+e.top.endX+e.bottom.startX+e.bottom.endX)/4,s=(e.top.y+e.bottom.y+1)/2;if(o.get(Math.floor(r),Math.floor(s))){var a=[e.top.endX-e.top.startX,e.bottom.endX-e.bottom.startX,e.bottom.y-e.top.y+1];c(a);return{x:r,y:s,score:d({x:Math.floor(r),y:Math.floor(s)},[1,1,1],o)+t({x:r,y:s},f)}}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score}));return{alignmentPattern:C>=15&&w.length?w[0]:f,dimension:i}}e.locate=function(o){for(var e=[],r=[],s=[],a=[],n=function(t){for(var n=0,d=!1,l=[0,0,0,0,0],i=function(e){var s=o.get(e,t);if(s===d)n++;else{l=[l[1],l[2],l[3],l[4],n],n=1,d=s;var i=c(l)/7,B=Math.abs(l[0]-i)<i&&Math.abs(l[1]-i)<i&&Math.abs(l[2]-3*i)<3*i&&Math.abs(l[3]-i)<i&&Math.abs(l[4]-i)<i&&!s,k=c(l.slice(-3))/3,u=Math.abs(l[2]-k)<k&&Math.abs(l[3]-k)<k&&Math.abs(l[4]-k)<k&&s;if(B){var C=e-l[3]-l[4],m=C-l[2],f={startX:m,endX:C,y:t};(w=r.filter((function(o){return m>=o.bottom.startX&&m<=o.bottom.endX||C>=o.bottom.startX&&m<=o.bottom.endX||m<=o.bottom.startX&&C>=o.bottom.endX&&l[2]/(o.bottom.endX-o.bottom.startX)<1.5&&l[2]/(o.bottom.endX-o.bottom.startX)>.5}))).length>0?w[0].bottom=f:r.push({top:f,bottom:f})}if(u){var w,P=e-l[4],v=P-l[3];f={startX:v,y:t,endX:P};(w=a.filter((function(o){return v>=o.bottom.startX&&v<=o.bottom.endX||P>=o.bottom.startX&&v<=o.bottom.endX||v<=o.bottom.startX&&P>=o.bottom.endX&&l[2]/(o.bottom.endX-o.bottom.startX)<1.5&&l[2]/(o.bottom.endX-o.bottom.startX)>.5}))).length>0?w[0].bottom=f:a.push({top:f,bottom:f})}}},B=-1;B<=o.width;B++)i(B);e.push.apply(e,r.filter((function(o){return o.bottom.y!==t&&o.bottom.y-o.top.y>=2}))),r=r.filter((function(o){return o.bottom.y===t})),s.push.apply(s,a.filter((function(o){return o.bottom.y!==t}))),a=a.filter((function(o){return o.bottom.y===t}))},B=0;B<=o.height;B++)n(B);e.push.apply(e,r.filter((function(o){return o.bottom.y-o.top.y>=2}))),s.push.apply(s,a);var k=e.filter((function(o){return o.bottom.y-o.top.y>=2})).map((function(e){var r=(e.top.startX+e.top.endX+e.bottom.startX+e.bottom.endX)/4,t=(e.top.y+e.bottom.y+1)/2;if(o.get(Math.round(r),Math.round(t))){var s=[e.top.endX-e.top.startX,e.bottom.endX-e.bottom.startX,e.bottom.y-e.top.y+1],a=c(s)/s.length;return{score:d({x:Math.round(r),y:Math.round(t)},[1,1,3,1,1],o),x:r,y:t,size:a}}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score})).map((function(o,e,r){if(e>4)return null;var t=r.filter((function(o,r){return e!==r})).map((function(e){return{x:e.x,y:e.y,score:e.score+Math.pow(e.size-o.size,2)/o.size,size:e.size}})).sort((function(o,e){return o.score-e.score}));if(t.length<2)return null;var c=o.score+t[0].score+t[1].score;return{points:[o].concat(t.slice(0,2)),score:c}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score}));if(0===k.length)return null;var u=function(o,e,r){var c,s,a,n,d,l,i,B=t(o,e),k=t(e,r),u=t(o,r);return k>=B&&k>=u?(d=(c=[e,o,r])[0],l=c[1],i=c[2]):u>=k&&u>=B?(d=(s=[o,e,r])[0],l=s[1],i=s[2]):(d=(a=[o,r,e])[0],l=a[1],i=a[2]),(i.x-l.x)*(d.y-l.y)-(i.y-l.y)*(d.x-l.x)<0&&(d=(n=[i,d])[0],i=n[1]),{bottomLeft:d,topLeft:l,topRight:i}}(k[0].points[0],k[0].points[1],k[0].points[2]),C=u.topRight,m=u.topLeft,f=u.bottomLeft,w=i(o,s,C,m,f),P=[];w&&P.push({alignmentPattern:{x:w.alignmentPattern.x,y:w.alignmentPattern.y},bottomLeft:{x:f.x,y:f.y},dimension:w.dimension,topLeft:{x:m.x,y:m.y},topRight:{x:C.x,y:C.y}});var v=l(o,C),h=l(o,m),y=l(o,f),p=i(o,s,v,h,y);return p&&P.push({alignmentPattern:{x:p.alignmentPattern.x,y:p.alignmentPattern.y},bottomLeft:{x:y.x,y:y.y},topLeft:{x:h.x,y:h.y},topRight:{x:v.x,y:v.y},dimension:p.dimension}),0===P.length?null:P}}]).default}));

//# sourceMappingURL=/sm/261261d91f249d4079ae119cfa50f739467d90fc365078a671172e0f499e862a.map



// ==============================================================================================
// 🎙️ ANTIGRAVITY STUDIO CONTROLS & POPUP ENGINE (30 Live HD Voices & 8 Emotion Prosody Modes)
// ==============================================================================================

var GEMINI_LIVE_VOICES = [
  // Expressive & Bright
  { id: 'Zephyr', name: 'Zephyr', style: 'Bright, Breezy & Expressive', category: 'Expressive & Bright' },
  { id: 'Puck', name: 'Puck', style: 'Upbeat, Energetic & Quick', category: 'Expressive & Bright' },
  { id: 'Fenrir', name: 'Fenrir', style: 'Excitable, Dynamic & Bold', category: 'Expressive & Bright' },
  { id: 'Aoede', name: 'Aoede', style: 'Breezy, Natural & Spontaneous', category: 'Expressive & Bright' },
  { id: 'Leda', name: 'Leda', style: 'Youthful, Crisp & Articulate', category: 'Expressive & Bright' },
  { id: 'Autonoe', name: 'Autonoe', style: 'Bright, Polished & Radiating', category: 'Expressive & Bright' },
  { id: 'Laomedeia', name: 'Laomedeia', style: 'Upbeat, Lively & Animated', category: 'Expressive & Bright' },
  { id: 'Pulcherrima', name: 'Pulcherrima', style: 'Forward, Projecting & Vivid', category: 'Expressive & Bright' },
  { id: 'Sadachbia', name: 'Sadachbia', style: 'Lively, Spirited & Playful', category: 'Expressive & Bright' },

  // Deep & Grounded
  { id: 'Charon', name: 'Charon', style: 'Deep, Informative & Grounded', category: 'Deep & Grounded' },
  { id: 'Orus', name: 'Orus', style: 'Firm, Resonant & Authoritative', category: 'Deep & Grounded' },
  { id: 'Kore', name: 'Kore', style: 'Firm, Confident & Direct', category: 'Deep & Grounded' },
  { id: 'Algenib', name: 'Algenib', style: 'Gravelly, Textured & Distinct', category: 'Deep & Grounded' },
  { id: 'Alnilam', name: 'Alnilam', style: 'Firm, Steady & Executive', category: 'Deep & Grounded' },
  { id: 'Gacrux', name: 'Gacrux', style: 'Mature, Rich & Experienced', category: 'Deep & Grounded' },
  { id: 'Sadaltager', name: 'Sadaltager', style: 'Knowledgeable, Deep & Refined', category: 'Deep & Grounded' },

  // Warm & Smooth
  { id: 'Callirrhoe', name: 'Callirrhoe', style: 'Easy-going, Relaxed & Human', category: 'Warm & Smooth' },
  { id: 'Enceladus', name: 'Enceladus', style: 'Breathy, Intimate & Soft', category: 'Warm & Smooth' },
  { id: 'Umbriel', name: 'Umbriel', style: 'Easy-going, Smooth & Mellow', category: 'Warm & Smooth' },
  { id: 'Algieba', name: 'Algieba', style: 'Smooth, Velvet & Composed', category: 'Warm & Smooth' },
  { id: 'Despina', name: 'Despina', style: 'Smooth, Friendly & Engaging', category: 'Warm & Smooth' },
  { id: 'Achernar', name: 'Achernar', style: 'Soft, Gentle & Empathetic', category: 'Warm & Smooth' },
  { id: 'Achird', name: 'Achird', style: 'Friendly, Approachable & Warm', category: 'Warm & Smooth' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', style: 'Casual, Conversational & Real', category: 'Warm & Smooth' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', style: 'Gentle, Calm & Soothing', category: 'Warm & Smooth' },
  { id: 'Sulafat', name: 'Sulafat', style: 'Warm, Expressive & Rich', category: 'Warm & Smooth' },

  // Crisp & Studio
  { id: 'Iapetus', name: 'Iapetus', style: 'Clear, Direct & Balanced', category: 'Crisp & Studio' },
  { id: 'Erinome', name: 'Erinome', style: 'Clear, Studio & Articulate', category: 'Crisp & Studio' },
  { id: 'Rasalgethi', name: 'Rasalgethi', style: 'Informative, Measured & Precise', category: 'Crisp & Studio' },
  { id: 'Schedar', name: 'Schedar', style: 'Even, Balanced & Natural', category: 'Crisp & Studio' }
];

var EMOTION_MODES = [
  {
    id: 'auto_affective',
    label: 'Auto Affective (Detect & Mirror)',
    shortTag: 'Affective AI',
    temperature: 1.05,
    promptInstruction: 'Use full Affective Dialog: listen closely to the user\'s vocal tone, speed, and emotion (whether calm, frustrated, angry, excited, or sad) and naturally adapt your vocal emotion, pitch inflection, breathing, and pacing like a real human.'
  },
  {
    id: 'natural_human',
    label: 'Real Human (Breathing & Laughs)',
    shortTag: 'Real Human',
    temperature: 1.05,
    promptInstruction: 'Speak like an ultra-realistic human in a live conversation: include natural micro-pauses, subtle breaths, genuine light chuckles when appropriate, dynamic pitch contours, and warm, unscripted conversational rhythm.'
  },
  {
    id: 'angry_intense',
    label: 'Angry / Fierce (High Intensity)',
    shortTag: 'Angry / Fierce',
    temperature: 1.15,
    promptInstruction: 'Adopt an unmistakably angry, fierce, sharp, and high-intensity vocal tone. Speak with heated emotion, punchy cadence, sharp emphasis on words, impatient energy, and raw vocal edge.'
  },
  {
    id: 'excited_hyped',
    label: 'Excited / Hyped (High Energy)',
    shortTag: 'Excited',
    temperature: 1.15,
    promptInstruction: 'Speak with high-voltage excitement, enthusiasm, and joy! Use fast, energetic pacing, expressive upward pitch inflections, and infectious hype in your voice.'
  },
  {
    id: 'empathetic_warm',
    label: 'Empathetic / Emotional (Soft)',
    shortTag: 'Empathetic',
    temperature: 0.95,
    promptInstruction: 'Speak with deep emotional empathy, tenderness, and warmth. Use a gentle, caring vocal tone, softer volume, comforting cadence, and compassionate sighs.'
  },
  {
    id: 'whisper_intimate',
    label: 'Whisper / Close-Mic (Quiet)',
    shortTag: 'Whisper',
    temperature: 0.9,
    promptInstruction: 'Speak in a soft, breathy, close-microphone whisper. Keep your voice hushed, intimate, quiet, and deliberate as if sharing a secret in a quiet room.'
  },
  {
    id: 'playful_witty',
    label: 'Playful / Sarcastic (Witty)',
    shortTag: 'Playful',
    temperature: 1.1,
    promptInstruction: 'Speak with a playful, witty, slightly teasing and charismatic tone. Include natural smirks in your voice, light chuckles, and expressive comedic timing.'
  },
  {
    id: 'dramatic_cinematic',
    label: 'Dramatic / Intense Storyteller',
    shortTag: 'Dramatic',
    temperature: 1.1,
    promptInstruction: 'Deliver your words with deep cinematic gravity, dramatic pauses, wide emotional dynamic range, and intense theatrical presence.'
  }
];

var _currentStudioVoice = localStorage.getItem("gemini_voice") || "Zephyr";
var _currentStudioEmotion = localStorage.getItem("gemini_emotion") || "auto_affective";
var _useExtendedThinking = localStorage.getItem("gemini_live_thinking") === "true";
var _activeStudioPanel = null;
var _voiceCategoryFilter = 'All';
var _voiceSearchQuery = '';

function getActiveEmotionSpec() {
  for (var i = 0; i < EMOTION_MODES.length; i++) {
    if (EMOTION_MODES[i].id === _currentStudioEmotion) return EMOTION_MODES[i];
  }
  return EMOTION_MODES[0];
}

function getActiveEmotionInstruction() {
  return getActiveEmotionSpec().promptInstruction;
}

function getActiveEmotionTemperature() {
  return getActiveEmotionSpec().temperature;
}

function renderStudioVoiceCards() {
  var grid = document.getElementById("voiceCardsGrid");
  if (!grid) return;
  var q = _voiceSearchQuery.trim().toLowerCase();
  var html = "";

  for (var i = 0; i < GEMINI_LIVE_VOICES.length; i++) {
    var v = GEMINI_LIVE_VOICES[i];
    var matchesCat = (_voiceCategoryFilter === 'All' || v.category === _voiceCategoryFilter);
    var matchesQuery = (!q || v.name.toLowerCase().indexOf(q) !== -1 || v.style.toLowerCase().indexOf(q) !== -1 || v.category.toLowerCase().indexOf(q) !== -1);
    if (!matchesCat || !matchesQuery) continue;

    var isSelected = (v.name === _currentStudioVoice);
    var selClass = isSelected ? " selected" : "";
    var checkSvg = isSelected ? '<svg class="cg-vcard-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '';

    html += '<div class="cg-vcard' + selClass + '" onclick="selectStudioVoice(\'' + v.name + '\')">';
    html += '  <div class="cg-vcard-info">';
    html += '    <span class="cg-vcard-name">' + v.name + '</span>';
    html += '    <span class="cg-vcard-style">' + v.style + '</span>';
    html += '  </div>';
    html += checkSvg;
    html += '</div>';
  }
  grid.innerHTML = html;
}

function renderStudioEmotionCards() {
  var grid = document.getElementById("emotionCardsGrid");
  if (!grid) return;
  var html = "";

  for (var i = 0; i < EMOTION_MODES.length; i++) {
    var m = EMOTION_MODES[i];
    var isSelected = (m.id === _currentStudioEmotion);
    var selClass = isSelected ? " selected" : "";
    var checkSvg = isSelected ? '<svg class="cg-vcard-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '';

    html += '<div class="cg-ecard' + selClass + '" onclick="selectStudioEmotion(\'' + m.id + '\')">';
    html += '  <div class="cg-ecard-info">';
    html += '    <div class="cg-ecard-header">';
    html += '      <span class="cg-ecard-title">' + m.label + '</span>';
    html += '      <span class="cg-ecard-temp">Temp ' + m.temperature + '</span>';
    html += '    </div>';
    html += '    <p class="cg-ecard-desc">' + m.promptInstruction + '</p>';
    html += '  </div>';
    html += checkSvg;
    html += '</div>';
  }
  grid.innerHTML = html;
}

function toggleStudioPopover(panel) {
  var vPop = document.getElementById("cgVoicePopover");
  var ePop = document.getElementById("cgEmotionPopover");
  var vBtn = document.getElementById("btnStudioVoice");
  var eBtn = document.getElementById("btnStudioEmotion");

  if (_activeStudioPanel === panel) {
    _activeStudioPanel = null;
    if (vPop) vPop.style.display = "none";
    if (ePop) ePop.style.display = "none";
    if (vBtn) vBtn.classList.remove("active");
    if (eBtn) eBtn.classList.remove("active");
    return;
  }

  _activeStudioPanel = panel;
  if (panel === "voice") {
    if (vPop) { vPop.style.display = "flex"; renderStudioVoiceCards(); }
    if (ePop) ePop.style.display = "none";
    if (vBtn) vBtn.classList.add("active");
    if (eBtn) eBtn.classList.remove("active");
    setTimeout(function() {
      var sInp = document.getElementById("voiceSearchInput");
      if (sInp) sInp.focus();
    }, 50);
  } else if (panel === "emotion") {
    if (ePop) { ePop.style.display = "flex"; renderStudioEmotionCards(); }
    if (vPop) vPop.style.display = "none";
    if (eBtn) eBtn.classList.add("active");
    if (vBtn) vBtn.classList.remove("active");
  }
}

function setVoiceCategory(cat) {
  _voiceCategoryFilter = cat;
  var tabs = document.querySelectorAll("#voiceCategoryTabs .cg-tab-btn");
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].getAttribute("data-cat") === cat) {
      tabs[i].classList.add("active");
    } else {
      tabs[i].classList.remove("active");
    }
  }
  renderStudioVoiceCards();
}

function filterVoiceModels(q) {
  _voiceSearchQuery = q || "";
  renderStudioVoiceCards();
}

function selectStudioVoice(name) {
  _currentStudioVoice = name;
  localStorage.setItem("gemini_voice", name);
  if (window.GEMINI_CONFIG) window.GEMINI_CONFIG.defaultVoice = name;
  invalidatePreWarm();
  try { localStorage.removeItem(geminiResumeKey()); } catch(e) {}
  try {
    if (window.selectVoice && typeof window.selectVoice === "function") {
      window.selectVoice(name);
    }
  } catch(e) {}

  updateStudioControlsUI();
  toggleStudioPopover("voice"); // close popover

  appendGeminiLog("sys", "[VOICE] Switched voice model to " + name + " (Active immediately).");

  // Re-init live session immediately so voice takes effect without page refresh
  if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
    try {
      geminiWs.send(JSON.stringify({
        type: "init",
        voice: name,
        emotionMode: _currentStudioEmotion,
        extendedThinking: _useExtendedThinking
      }));
    } catch(e) {
      reconnectWithNewVoice(name);
    }
  }
}

function reconnectWithNewVoice(name) {
  try {
    appendGeminiLog("sys", "[VOICE] Reconnecting Live session with " + name + "...");
    disconnectGeminiLive();
    setTimeout(function() {
      connectGeminiLive();
    }, 250);
  } catch(e) {}
}

function selectStudioEmotion(id) {
  _currentStudioEmotion = id;
  localStorage.setItem("gemini_emotion", id);
  updateStudioControlsUI();
  toggleStudioPopover("emotion"); // close popover

  var spec = getActiveEmotionSpec();
  appendGeminiLog("sys", "[PROSODY] Vocal acting mode updated: " + spec.label + " (Active immediately).");

  // Inject live vocal prosody director update into the active session immediately
  if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
    try {
      geminiWs.send(JSON.stringify({
        type: "emotionChange",
        emotionMode: id
      }));
    } catch(e) {}
  }
}

function toggleStudioThinking() {
  _useExtendedThinking = !_useExtendedThinking;
  localStorage.setItem("gemini_live_thinking", _useExtendedThinking ? "true" : "false");
  updateStudioControlsUI();

  appendGeminiLog("sys", _useExtendedThinking ? "[THINKING] Deep Thinking Mode (Extended Thinking) ENABLED." : "[THINKING] Standard Latency Mode active.");

  if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
    try {
      geminiWs.send(JSON.stringify({
        type: "init",
        voice: _currentStudioVoice,
        emotionMode: _currentStudioEmotion,
        extendedThinking: _useExtendedThinking
      }));
    } catch(e) {
      disconnectGeminiLive();
      setTimeout(function() { connectGeminiLive(); }, 250);
    }
  }
}

function handleStudioMicClick() {
  if (typeof toggleGeminiLiveConnection === "function") {
    toggleGeminiLiveConnection();
  }
}

function updateStudioControlsUI() {
  var vName = document.getElementById("studioVoiceName");
  if (vName) vName.textContent = _currentStudioVoice;

  var eSpec = getActiveEmotionSpec();
  var eName = document.getElementById("studioEmotionName");
  if (eName) eName.textContent = eSpec.shortTag;

  var inp = document.getElementById("manualTerminalInput");
  if (inp) {
    inp.placeholder = "Message " + _currentStudioVoice + " (" + eSpec.shortTag + ")...";
  }

  var thBtn = document.getElementById("btnStudioThinking");
  if (thBtn) {
    if (_useExtendedThinking) thBtn.classList.add("active");
    else thBtn.classList.remove("active");
  }

  // Update selection highlight in voice cards grid
  var vCards = document.querySelectorAll("#voiceCardsGrid .cg-vcard");
  for (var i = 0; i < vCards.length; i++) {
    var vTitle = vCards[i].querySelector(".cg-vcard-name");
    var isSel = (vTitle && vTitle.textContent.trim() === _currentStudioVoice);
    vCards[i].classList.toggle("selected", isSel);
    var oldCheck = vCards[i].querySelector(".cg-vcard-check");
    if (isSel && !oldCheck) {
      var chk = document.createElement("span");
      chk.innerHTML = '<svg class="cg-vcard-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      vCards[i].appendChild(chk.firstChild);
    } else if (!isSel && oldCheck) {
      oldCheck.remove();
    }
  }

  // Update selection highlight in emotion cards grid
  var eCards = document.querySelectorAll("#emotionCardsGrid .cg-ecard");
  for (var j = 0; j < eCards.length; j++) {
    var eTitle = eCards[j].querySelector(".cg-ecard-title");
    var isESel = (eTitle && eTitle.textContent.trim() === eSpec.label);
    eCards[j].classList.toggle("selected", isESel);
    var oldECheck = eCards[j].querySelector(".cg-vcard-check");
    if (isESel && !oldECheck) {
      var eChk = document.createElement("span");
      eChk.innerHTML = '<svg class="cg-vcard-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      eCards[j].appendChild(eChk.firstChild);
    } else if (!isESel && oldECheck) {
      oldECheck.remove();
    }
  }

  // Update Mic Button state
  var micBtn = document.getElementById("btnStudioMic");
  var micLbl = document.getElementById("studioMicLabel");
  if (micBtn && micLbl) {
    var isLiveActive = (geminiWs && (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING));
    if (isLiveActive) {
      micBtn.classList.add("live");
      micLbl.textContent = "Mic Live";
    } else {
      micBtn.classList.remove("live");
      micLbl.textContent = "Enable Mic";
    }
  }
}

// Global click outside to close popovers
document.addEventListener("click", function(e) {
  if (!e.target.closest("#cgStudioContainer")) {
    var vPop = document.getElementById("cgVoicePopover");
    var ePop = document.getElementById("cgEmotionPopover");
    var vBtn = document.getElementById("btnStudioVoice");
    var eBtn = document.getElementById("btnStudioEmotion");
    if (vPop) vPop.style.display = "none";
    if (ePop) ePop.style.display = "none";
    if (vBtn) vBtn.classList.remove("active");
    if (eBtn) eBtn.classList.remove("active");
    _activeStudioPanel = null;
  }
});

// Auto-initialize Studio UI on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    updateStudioControlsUI();
    if (window.LiveTranscriptHUD && window.LiveTranscriptHUD.init) {
      window.LiveTranscriptHUD.init();
    }
  });
} else {
  updateStudioControlsUI();
  if (window.LiveTranscriptHUD && window.LiveTranscriptHUD.init) {
    window.LiveTranscriptHUD.init();
  }
}

/* ==========================================================================
   🎙️ REAL-TIME LIVE TRANSCRIPT HUD CONTROLLER
   Exact Match to Antigravity Voice Assistant Reference Implementation
   Features:
   - Word-by-Word Streaming for both User & Agent
   - Pop-In vs Karaoke Reveal Mode Toggle
   - 60fps Audio Word Sync Waveform & Progress Sub-bar
   - Copy Full Transcript with Animated Checkmark Feedback
   - Clear Transcript History
   - Expand / Collapse Floating Studio HUD
   - Dual-Engine Dark & Light Theme Pixel-Perfect Support
   ========================================================================== */

window.LiveTranscriptHUD = (function() {
  var conversation = []; // Array of turns: { id, role: 'user'|'agent', text, words: [{ id, text, isSpoken, isCurrent }], spokenWordIndex, timestamp, isComplete, isInterrupted }
  var isExpanded = true;
  var revealMode = 'progressive'; // 'progressive' (Pop-In) or 'karaoke'
  var state = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'
  var activeAgentWords = [];
  var activeAgentWordIndex = -1;
  var audioPlaybackProgress = 0;
  var currentAgentTurnId = null;
  var currentAgentRawText = "";
  var currentUserTurnId = null;
  var agentAudioStartTime = 0;
  var agentAudioTotalDuration = 0;
  var syncInterval = null;
  var lastUserWordRevealAt = 0;
  var revealingUserTurnId = null;

  var LISTENING_GIF_DATA_URI = "data:image/gif;base64,R0lGODlhZAA3AIN9AAAAAP7+/ri4uNjY2Ofn50dHR1dXV6enp4mJiXd3dzc3N8bGxpeXl2RkZC4uLgAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJBAAAACwAAAAAZAA3AAAI/wABCBxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDisRYwIDJAiMdKlDgIOXABgcGBJhJM8CAAw1cDiyAQMAAAjMJELiZQMFHBQdqKl16wKhIBDKXLl2Qc2NSqVhpHgCJAGhWqQMMYDTg9WtWAmI3FohqFuvWigjaykWgMYFcswOcRmRwVy4DjHz7fiWAEmJcwW3pwkVsloDehwUSXGW8NO3EkpLZUqY5wOLhzUE1NlgAmqYAiw5Il36b0W7pAFUrTt5cOGOBspQ7XxRQ+vRGBbgZJ8ComfHjsaUXIAet2Grp2hVVU1beMbjg5hUNgCbgMTBl3xet9/+FnlH7Zt27QVveKP7u8YnehXuUzpg8fNDDO/KmDRi/x/2U2SdRfIjFthF9iL0nEYD1eVRcX9xh1J5cHikAGnrZgUYdR65RxlpFDCL2V0cICpZfRQU811EDpRGnoYOggUfRbIwZmBGNiAn4EIGIbagRj4LJuOBrOlIUonEUdcjcRg08iNiJKhlwwIR9CUkRT04i9mFDR8Z4kQMCUCmYjw91yZiVE5H12kxoOvTZZthdpECWfY2YXYlyhdXdeTZWlACdSw0AZUcFmIkVAXGWN+VZB6wXUgEMAErAAoNW2EACCDCAQAINKJiSAg0wIIAACwhwAAIGtKTTqqy26uqrsMYPKuustNZq66245qqrSwEBACH5BAkEAAAALAsAFABUABYAgwAAAP7+/khISMnJyXZ2dtbW1jQ0NGZmZrW1tenp6aioqFZWVpmZmYiIiC4uLgAAAAj/AAEIHDhwQYECAxIiUNCAwAIDBCNKnEixosADCjIyYNBwgQAHFkMWCECypMkEAxgcgBiyZUsBJmMGQKiSpUsAB2TqJFmggc2bQAUq2CmzAAMBLg0QJYogqNOcS4sSaDkgqs4DToEqtSoTpEUEXGNOzXpzZNiSSC0OPUtyLFmqbEmmrbiWrdu3FqvGnUsRbFyseEXGDfBzol62fANPTBA3QUgHgwMotggzboGQBAYPmFyxwWAFIQ+fZcCZolm7FqHuLS0x8+CQjONuZh0xNtumFUWfBUxboO6wiQn6ld17YN3bFA385jqgcOnlVgs4B+B5MIIFxQEQsH22AG+BAggMPj87gIBX1gYWMODO1Sh2iQIaKBhQgP3JAggavM++AEF9qyghQEBwFhkgwIEIEphdRAYuQMCDDx5wgADTURQQACH5BAkEAAAALAAAHgBeAAYAgwAAAOfn58bGxpeXl7i4uIiIiFdXV9nZ2WZmZqampvPz80ZGRjc3N3V1dS0tLQAAAAi/AAkMAECwoMGDCBMqBFBg4EKCAww8nEjRYAMDBg4oSLCgokeDCxIoCNCAokgBEj+qdFDgAEmCBgQoODCgo0qFBhIEUCAAwUcGOgMkSHkz4YICMg8USNhAQIAAAgYgsElxAYICBDQGIOCzKEEEBJ4KRMBAJYOrYQPQpLrQAFaXI9UKmEvX5c6nAhKQ9YpzgACtBwQQSDBgQMPCBAj8fRo4Il8ADAwgaFCgYeUCCDCWffzRgdWGCRIrHky4wdSKAQEAIfkECQQAAAAsAQAWAF4AEwCDAAAA/f39R0dHNzc3qKiomJiYdnZ2ycnJ1tbWZWVlhoaGVlZWtra25+fnLS0tAAAACP8AAQgcOHDAAoIIEypcyLBhQYcQHS5QwABBgwABBkR0KEDjRoIDElA80ADBx4YOEBo4gLElxgMnGRIIgKDAxgQEELjEyCDmwgM1DxrY6bKnz4RDMRqAWIBoS5tHETJoKSCpUwJRVbZc6nCm0wAKshJsirHq1wBYxQq0yrWhV6dh1QIgG0BAgrMw5SpomYDp2bhq3w4QcNak3LcCIFolmlYtywANBJ7NKFcnxogLCssFcJGmwMdw1RJ+GXHA5MRi72JMS5eo4axvoUIEzVjtVKUCR39t61N33Y2LiXo8mrklQdrCo4LOG9HBZOY+LQcwKlD119cn3wbo+1E7UdnZXaKFHnj7eszWgDcO6Pw1fcTW4AcmQO6ywUGIDh43KDD85ADvOzUGUXkEjKeQAAVIF2B/CA1AFgH3iTXAStdxx5ACFx2gQErqJVBARTvVlEBHAiwgEgEKGLgZACEVQNJO+y0w3GAUEWAAhxKWmIABPI7Y0Yrq2WWAAgUQUIACCSywgAAC4NhQQAAh+QQJBAAAACwBAAoAWQAkAIMAAAD+/v5HR0fm5ubX19d3d3c2Njanp6dYWFjJycm2traIiIiWlpZmZmYuLi4AAAAI/wABCBxIsGBBAwYMKlzIsKHDhxAJIliggMCAABgzDkigYIGAiCAXGmjA4EACAihRcmRQ4GNIAAUSZJxJs6YCBC8jIjhwsabPAAMUFHho4MDPoxoHbFyQk+GCnkiPDjjg0qDRqDUJeCyIoEHCpgOfYqU5tYEAAw4MICiAk2ADqGOBNgD7EAGBuBqZQlyAN+MBug/59g2gAKSAwQEYAHaIALFikAoG/13cUGbfyRENDCZAueHhvgleFhjctrNCBoOrRrQct7DphXfxYgYJF+vc1wY191UN8XPcAbgVNujL+WVjvKGDFxQcd3bE0XhdKx+IGq/ekNCbTyd4Ne5Q0Ze3D93sPvZ7yOHRxQusHve6YeLqYYbPOfjr9uNxi79kXV69bry8QcTeWPptxx9WzvU2mHnTZReXfSAdGNUAEAbnwGDSgYQeXgUqR95Yj4UkYVQd4vafdS/5htcApQU3oHYhMXdZgAOdBVZsxDFokAMFRYZYAAkwYJYAAqzFEV0G1JYfAwjYp5YCIQ404o9ALqbij0r1VKJAPlKZUYZ0IaDkj2Au5yVG7i1mAI5URrmQAFNGpQCNi72IXIsOGVCASWNitJGQ/u3J5k8EdESnYUUigICN8b3ZVQGQQmoWjwwFBAAh+QQJSAAAACwBAAYAWQApAIMAAAD+/v7o6Og2NjbX19eIiIiWlpanp6fHx8dGRkZXV1dkZGR3d3e3t7ctLS0AAAAI/wABCBxIsODABAoSJjDIsKHDhw4HDHAAsWLBBQcIBNjIMQCBAwssirSYoEADAgI2ChDwkcGAkQUHHOhIs+aBlzBzAiigsWZNBCFhzvRJlOMBnSILpCzqk4ACiwqWMi0q4CnShgl6TiV69GGBrWALXDXIAOxUAjgNGjAL1sDYgWvZMhWwsOBXuUUJIBDA4O1dvD5X0iWoADBNAgXqvhW4wHBHASATUJxIUCpgAkEXDxzgWGXfh0MNu9VcsEHnrg8TdBZLmmBjx6whmhbduiAC2BY5G0ZQm6Bqww1EljWctndouQIoWrwNGHVvAFrljrZoma3V57oBF09tWMDzga/x8v8WWRhw8O87aQtX/z0u3s8Wh+ON/fy49ZHypaMHYN9s5orh6Yeee3LBV9Fv4u2XH1vTWdTdfuUlOBJzeP1XW3Z4bfcQgWyN9x2FctEHEYIVoregWd5N+OB3DjjmHEQByuWhcY4ZCBGIMn6H4XsikYgXAYq1xqGAFf1l2E29RfejhQ3N1hkCBSyQAELKITVAdT8aoABOGgKAY2cBzIiUj52tdJ5BToJ55ltRgcnRmgYZaZiIbw2gJGANNqTAl2A51Z5jmOF3Z1429pZAmlsJQCdUB2DJEWTX7SdQAgYM+igCheo0wAIMFGBAAQws0KWkmy1gQAMNINDAAQUoUCVDAQEAIfkECQQAAAAsAQAUAFQAFgCDAAAA/v7+mJiYSEhIdnZ2ycnJpqam5+fnNTU1Z2dn19fXW1tbh4eHuLi4Li4uAAAACP8AAQgcSNDBAgIMDBhoUKCAgocICEqcSLGiRYEIBiRIwECAAIUGBFyUuEBAgwMBUqpcGaDByJcwAQwgIKAASpYrRY4kUACnT5UDYgolaUDBT58RLRo4elTB0KcMjDLFWeDigqk/XT6NyQCrT50VCXjFCXbrSAFjWRK4KDatSgZmYS51m3IBW7opy8atOJdugosJ8AbQu3ciWrxrLQ4QXLWwxbZ0CUsUfMCxxat4G1vsifev5YkIBAdIWvEwXc2fCXKmC1exaM+pB0J2W/niatqxC4o2AFg06th96SaueNut1tyhRQ+fOOAmXgVBc5vGK1mgAwHO6Rog/TlB8bQKYFM9XGAgO/jWqQcIkEr3gAG7FhEkqHnA/MoDChowWMA99kwDNmF1QAH6RRdTRgMkqGBuQmV0EAEQErDRAP0FBAAh+QQJBAAAACwAAB4AXgAGAIMAAAD4+PjW1tbp6em2tranp6eYmJjJyclmZmZ2dnZYWFg6OjqFhYVISEguLi4AAAAIxgAPFHAAoKDBgwgTKlxogMDCgwUUPJxIUSGDBAgGBCAgsaJHhAoIBBjAoKJIAQg+qjS4wIDGBAURCAgQIOLKhQ4QiAxwIOXHBQVoEvB5U2EDAzNJJlzAYGYAAQUSKFhQcUEDBAYOaNyYgGBRAAkO0BRgIEGDlQ0SZNVI9ixFBUi3jhwgoG7dAXhpjoSagOpXhQgKiKVJl4DhAogNEzggYOsAgQj8Fm2gAAEDAwYQY8aooIHXvz8VJGBQYDHjA6gJGLio4PPDgAAh+QQJBAAAACwBABYAUwATAIMAAAD+/v6Xl5dlZWXJycl3d3c1NTVHR0e3t7eJiYlYWFjp6enW1taoqKgvLy8AAAAI/wABCBw40MCBAQkENECAgIBDBgcISpxIsaJFgQYVDCiQIKGAjxcHKkiAgEGAkyhTnlwQsqVLAwgbLlCpksHFAgRo6kyJwKXPiQMamNypU4DFAkSTGv3JVEBSogWOPt2ZgCnTBlN1KpCaVeVSqy6xdk05wOKAsSm/gg3pFO3JqBUPuD1JYK1LpHPVTpwbgKXdkAr41rWYc27ZvxYN8A1gwGJbt4MRVyzstmrcxYclT8Tr1u9kvp41E3SwuIHZxZFFDxQ7Fy5FBIt7qi44k69roJTRQpyNkbVbvRIPCBiKFsFW3gZwzmVwmyJMASWnLmDQICJvjAMEEKgtHUFjnxk1DhQYoOCA9esXDW7s+FFAggLkvwMICAAh+QQJBAAAACwBAAoAWAAkAIMAAAD+/v7IyMjn5+eWlpZISEg3Nzd3d3dXV1eJiYnX19eoqKhlZWW2trYuLi4AAAAI/wABCBxIsGBBAwYMKlzIsKHDhxAHIkjQQMGAABgzDhDQIEGBiCAXGmBAYIEABShRciRw4GPIAwIyypw5c8ACBCFBIlhwkabPADYZODSw4KdRmg1w5mSYoOdRowMILCz61KiCBAmXMnVatebNAlkJMuDaNaMCoVoZIlBQluaAAw0TtKUpNS3TuTMXOCyAV2YCu2r7ZvzrsIHgAHUBK4wpmHBDA4cFKF7IV3ADiAcOh51MkIDgAQ4gMsarl7NBtn0TOyRbVqnpgZAFb2ZYGe+A1wUZCJYMEYFl3ATlpo6YeThwgZ77wsXc+LhAqnhdOyyOVzVu6HPRPtRt/HhyvMsf1sSey/s49bnWG352DsB33/IPR2d3HrvvbIbfybOX39bx3sPa4XZeW7dFxF9ZBQLnwGGlbReZc9jNFZ5DB5YFn2n1KQfReHgp4NJr+VUHkXAM3gcYaoKd9ZBhh2EkQAIMFFAAAqGlZQBrcylAAAJZ3Vfhg4Bx2OIAA1xmEIstYmSkYgjg2NeSBpF4mH+KGYDiYekVVMCPTzXwIYiRSffYASY5CZQABAR4nAFkXvmTAh19uZSMCNQJFnviIcDAAXzyGWONCgUEACH5BAlIAAAALAEABgBZACkAgwAAAP7+/ujo6DY2NtfX14iIiJaWlqenp8fHx0ZGRldXV2RkZHd3d7e3ty0tLQAAAAj/AAEIHEiw4MAEChImMMiwocOHDgcMcACxYsEFBwgE2MgxAIEDCyyKtJigQAMCAjYKEPCRwYCRBQcc6Eiz5oGXMHMCKKCxZk0EIWHO9EmU4wGdIgukLOqTgAKLCpYyLSrgKdKGBXpOJXr0IYKtYBFcXZgA7NQBOBcyMAuWwdiBa9kyJaCw4Fe5W8WOvYuXalqCBRIM7VvTKtKDgrUS5jgAIt/FAQi8JdhgAWSOAiA6sHy562SBZS8HCPpw8OK6nwEUkEq4cUUBlzOnFqiAdd8EFhX3/fvZwOUFUC/rnQ3AdF/UDzkTBk5coG25wx/6Xiy5OYC4hGVXfM4WeerprUXC+l5smDh3s7wbYr9tHYDy4xbX48VtfTxh7+oh029uH35F+XKRRtx7eKXHUH944feZbmxVtx1k7SkAmWsQgdcXc82FRphnDyEol1vWESjXfg4VcJmCbzVwWW6QYUgcg2xp55BxeAmYGo1yoQjXb9YBKJeMB4qmI1IeFuiQhpBFN1kDMI64kAIGHHDej6mV1KRcHApU5GJA6uSAAFPi5SJBW+LVJVJRibbRmQM9RpiSbylwpVkgSiciWE615yOeNj6UwJw0DUCidQWU6RMBcEIlJVUHlNeeQQzMScACgyKlQAMJIMAAAgk0YOCjMTXAgAACLCDAAQgYQJFIAQEAOw==";

  function init() {
    render();
    bindEvents();
    startSyncLoop();
    positionHUD();
    window.addEventListener('resize', positionHUD);
  }

  function positionHUD() {
    var hud = document.getElementById('cgLiveTranscriptHUD');
    if (!hud) return;

    var header = document.querySelector('.cg-header');
    var footer = document.querySelector('.cg-footer-composer');
    var feedScroll = document.getElementById('cgHudFeedScroll');

    var headerH = header ? header.offsetHeight : 50;
    var footerH = footer ? footer.offsetHeight : 120;

    var topOffset = headerH + 10;
    var bottomOffset = 16;

    hud.style.top = topOffset + 'px';

    if (isExpanded) {
      hud.style.bottom = bottomOffset + 'px';
      hud.style.height = '';
      if (feedScroll) {
        feedScroll.style.paddingBottom = Math.max(0, footerH - bottomOffset) + 'px';
      }
    } else {
      hud.style.bottom = '';
      if (feedScroll) feedScroll.style.paddingBottom = '';
    }
  }

  function startSyncLoop() {
    if (syncInterval) cancelAnimationFrame(syncInterval);
    function syncFrame() {
      // 1. Agent word-by-word pop-in sync.
      //    Audio playing  -> advance with the speaker (floor(progress * words)).
      //    No audio (text-only reply / pre-audio TTS delay) -> timed reveal
      //    (one word every ~70ms, matching the user-side cadence) so words
      //    still pop in instead of freezing or dumping all at once.
      var agentTurn = currentAgentTurnId ? findTurn(currentAgentTurnId) : null;
      var agentHasAudio = !!(audioPlaybackCtx && agentAudioTotalDuration > 0);
      if (agentTurn && agentTurn.words && agentTurn.words.length > 0) {
        if (state === 'speaking' && agentHasAudio) {
          var now = audioPlaybackCtx.currentTime;
          var elapsed = Math.max(0, now - agentAudioStartTime);
          var progress = Math.min(1.0, elapsed / agentAudioTotalDuration);
          audioPlaybackProgress = progress;

          var syncedIdx = Math.min(agentTurn.words.length - 1, Math.max(0, Math.floor(progress * agentTurn.words.length)));
          activeAgentWordIndex = syncedIdx;
          if (agentTurn.spokenWordIndex < syncedIdx) {
            agentTurn.spokenWordIndex = syncedIdx;
            agentTurn.words.forEach(function(w, wIdx) {
              w.isSpoken = (wIdx <= syncedIdx);
              w.isCurrent = (wIdx === syncedIdx);
            });
            renderWordsForTurn(agentTurn);
          }
          updateSyncBar();
        } else if (!agentTurn.revealDone) {
          var wallMs = performance.now();
          if (wallMs - (agentTurn._timedRevealAt || 0) >= 70) {
            agentTurn._timedRevealAt = wallMs;
            var timedTarget = agentTurn.words.length - 1;
            var timedCur = (agentTurn.spokenWordIndex | 0);
            if (timedCur < timedTarget) {
              agentTurn.spokenWordIndex = timedCur + 1;
              var timedIdx = agentTurn.spokenWordIndex;
              agentTurn.words.forEach(function(w, wIdx) {
                w.isSpoken = wIdx <= timedIdx;
                w.isCurrent = wIdx === timedIdx;
              });
              renderWordsForTurn(agentTurn);
            } else {
              agentTurn.revealDone = true;
              agentTurn.words.forEach(function(w) {
                w.isSpoken = true;
                w.isCurrent = false;
              });
              renderWordsForTurn(agentTurn);
            }
          }
        }
      } else if (state === 'speaking' && agentHasAudio) {
        updateSyncBar();
      }

      // User speech reveals one word every ~55ms, including a final
      // full-text event, so the HUD does not show all words at once.
      if (revealingUserTurnId) {
        var userTurn = findTurn(revealingUserTurnId);
        if (userTurn && userTurn.words && userTurn.words.length > 0) {
          var userTarget = userTurn.words.length - 1;
          var wallNowMs = performance.now();
          if (userTurn.spokenWordIndex < userTarget && wallNowMs - lastUserWordRevealAt >= 55) {
            lastUserWordRevealAt = wallNowMs;
            userTurn.spokenWordIndex = Math.min(userTarget, Math.max(0, userTurn.spokenWordIndex + 1));
            userTurn.words.forEach(function(w, wIdx) {
              w.isSpoken = wIdx <= userTurn.spokenWordIndex;
              w.isCurrent = wIdx === userTurn.spokenWordIndex;
            });
            renderWordsForTurn(userTurn);
          } else if (userTurn.spokenWordIndex >= userTarget) {
            userTurn.words.forEach(function(w) {
              w.isSpoken = true;
              w.isCurrent = false;
            });
            revealingUserTurnId = null;
            // KEY FIX: Only finalize (null currentUserTurnId) if isFinal text has arrived.
            // If still interim, more text may come, keep currentUserTurnId alive.
            if (userTurn.isFinalText) {
              userTurn.isComplete = true;
              userTurn.revealDone = true;
              if (currentUserTurnId === userTurn.id) {
                currentUserTurnId = null;
                state = 'idle';
              }
            }
            renderWordsForTurn(userTurn);
          }
        } else {
          revealingUserTurnId = null;
        }
      }
      syncInterval = requestAnimationFrame(syncFrame);
    }
    syncInterval = requestAnimationFrame(syncFrame);
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
    var hud = document.getElementById("cgLiveTranscriptHUD");
    var btn = document.getElementById("btnToggleHudExpand");
    if (!hud) return;

    if (isExpanded) {
      hud.classList.remove("collapsed");
      hud.classList.add("expanded");
      if (btn) btn.title = "Collapse Live Transcript HUD";
      positionHUD();
    } else {
      hud.classList.remove("expanded");
      hud.classList.add("collapsed");
      hud.style.bottom = "auto";
      var feedScroll = document.getElementById('cgHudFeedScroll');
      if (feedScroll) feedScroll.style.paddingBottom = '';
      if (btn) btn.title = "Expand Live Transcript HUD";
    }
  }

  function toggleRevealMode() {
    revealMode = (revealMode === 'progressive') ? 'karaoke' : 'progressive';
    var txt = document.getElementById("cgHudRevealModeText");
    if (txt) {
      txt.textContent = (revealMode === 'progressive') ? "Pop-In" : "Karaoke";
    }
    renderFeed();
  }

  function copyTranscript() {
    if (!conversation.length) return;
    var fullText = conversation.map(function(t) {
      return "[" + (t.role === 'agent' ? "AGENT" : "YOU") + "]: " + t.text;
    }).join("\n\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).catch(function(){});
    }

    var copyIcon = document.getElementById("cgHudCopyIcon");
    var checkIcon = document.getElementById("cgHudCheckIcon");
    if (copyIcon && checkIcon) {
      copyIcon.style.display = "none";
      checkIcon.style.display = "inline-block";
      setTimeout(function() {
        copyIcon.style.display = "inline-block";
        checkIcon.style.display = "none";
      }, 2000);
    }
  }

  function clearTranscript() {
    conversation = [];
    currentAgentTurnId = null;
    currentAgentRawText = "";
    currentUserTurnId = null;
    activeAgentWords = [];
    activeAgentWordIndex = -1;
    audioPlaybackProgress = 0;
    state = 'idle';
    render();
  }

  function onUserTranscript(text, isFinal) {
    // A new live voice turn takes priority over the log overlay.
    collapseHudTerminal();
    if (!text) return;
    var rawText = String(text).replace(/^👤 User:\s*/, "").replace(/^PS >\s*/, "").trim();
    if (!rawText) return;

    var isListeningPlaceholder = (
      rawText === "🎙️ Listening..." ||
      rawText === "Listening..." ||
      rawText.indexOf("Listening") !== -1 ||
      rawText.toLowerCase().indexOf("listening") !== -1
    );

    // Cleanly finalize any prior open agent turn
    if (currentAgentTurnId) {
      var prevAgentTurn = findTurn(currentAgentTurnId);
      if (prevAgentTurn) {
        prevAgentTurn.isComplete = true;
        prevAgentTurn.spokenWordIndex = Math.max(0, prevAgentTurn.words.length - 1);
        prevAgentTurn.words.forEach(function(w) {
          w.isSpoken = true;
          w.isCurrent = false;
        });
      }
      currentAgentTurnId = null;
      currentAgentRawText = "";
    }

    var turn = null;
    if (currentUserTurnId) {
      turn = findTurn(currentUserTurnId);
    }

    if (isListeningPlaceholder) {
      state = 'listening';
      if (!turn) {
        turn = {
          id: 'turn-u-' + Date.now(),
          role: 'user',
          text: '',
          words: [],
          spokenWordIndex: -1,
          timestamp: Date.now(),
          isComplete: false,
          isInterrupted: false
        };
        conversation.push(turn);
        currentUserTurnId = turn.id;
      }
      render();
      return;
    }

    var wordsArray = rawText.split(/\s+/).filter(Boolean);

    // KEY FIX: Never dump all words at once on isFinal.
    // Keep the already-revealed count as floor; rAF loop will advance the rest.
    var currentRevealedIdx = (turn && turn.spokenWordIndex >= 0) ? turn.spokenWordIndex : 0;
    // Clamp to current progress - never go backward, never jump to end.
    var revealedCount = Math.max(1, Math.min(wordsArray.length, currentRevealedIdx + 1));
    var wordsObj = wordsArray.map(function(w, idx) {
      return {
        id: 'u-' + Date.now() + '-' + idx,
        text: w,
        isSpoken: idx < revealedCount,
        isCurrent: idx === revealedCount - 1
      };
    });

    if (turn) {
      turn.text = rawText;
      turn.words = wordsObj;
      turn.spokenWordIndex = revealedCount - 1;
      turn.isComplete = false;
      turn.revealDone = false;
      turn.isFinalText = Boolean(isFinal);
      revealingUserTurnId = turn.id;
      // KEY FIX: Do NOT null currentUserTurnId here on isFinal.
      // The rAF loop will finalize when all words are revealed.
      state = 'listening';
    } else {
      turn = {
        id: 'turn-u-' + Date.now(),
        role: 'user',
        text: rawText,
        words: wordsObj,
        spokenWordIndex: revealedCount - 1,
        timestamp: Date.now(),
        isComplete: false,
        isInterrupted: false,
        revealDone: false,
        isFinalText: Boolean(isFinal)
      };
      conversation.push(turn);
      currentUserTurnId = turn.id;
      revealingUserTurnId = turn.id;
      state = 'listening';
    }

    render();
  }

  function onAgentTranscript(chunk, isFinal) {
    // Agent speech takes priority over the log overlay.
    collapseHudTerminal();
    // Cleanly finalize any open user turn
    if (currentUserTurnId) {
      var prevUserTurn = findTurn(currentUserTurnId);
      if (prevUserTurn) {
        prevUserTurn.isComplete = true;
        prevUserTurn.spokenWordIndex = Math.max(0, prevUserTurn.words.length - 1);
        prevUserTurn.words.forEach(function(w) {
          w.isSpoken = true;
          w.isCurrent = false;
        });
      }
      currentUserTurnId = null;
    }

    state = 'speaking';

    if (chunk) {
      currentAgentRawText = appendFragment(currentAgentRawText, chunk);
      var wordsArray = currentAgentRawText.split(/\s+/).filter(Boolean);
      activeAgentWords = wordsArray;

      var turn = null;
      if (currentAgentTurnId) {
        turn = findTurn(currentAgentTurnId);
      } else {
        turn = {
          id: 'turn-a-' + Date.now(),
          role: 'agent',
          text: currentAgentRawText,
          words: [],
          spokenWordIndex: -1,
          timestamp: Date.now(),
          isComplete: false,
          isInterrupted: false
        };
        conversation.push(turn);
        currentAgentTurnId = turn.id;
      }

      turn.isComplete = false;

      turn.text = currentAgentRawText;
      var curIdx = (turn.spokenWordIndex >= 0) ? turn.spokenWordIndex : 0;
      turn.words = wordsArray.map(function(w, idx) {
        return {
          id: turn.id + '-w-' + idx,
          text: w,
          isSpoken: (idx <= curIdx),
          isCurrent: (idx === curIdx)
        };
      });
      turn.spokenWordIndex = curIdx;
    }

    if (isFinal) {
      if (currentAgentTurnId) {
        var finTurn = findTurn(currentAgentTurnId);
        if (finTurn) {
          finTurn.isComplete = true;
          finTurn.spokenWordIndex = Math.max(0, finTurn.words.length - 1);
          finTurn.words.forEach(function(w) {
            w.isSpoken = true;
            w.isCurrent = false;
          });
        }
        currentAgentTurnId = null;
        currentAgentRawText = "";
      }
      activeAgentWordIndex = -1;
      audioPlaybackProgress = 0;
      state = 'idle';
    }

    render();
  }

  function onInterrupted() {
    // Barge-in also takes priority over the log overlay.
    collapseHudTerminal();
    if (currentAgentTurnId) {
      var turn = findTurn(currentAgentTurnId);
      if (turn) {
        turn.isInterrupted = true;
        turn.isComplete = true;
      }
      currentAgentTurnId = null;
      currentAgentRawText = "";
    }
    state = 'interrupted';
    activeAgentWordIndex = -1;
    audioPlaybackProgress = 0;
    render();
  }

  function onAudioChunk(duration, startTime) {
    // Agent audio starting early enough takes priority over the log overlay.
    collapseHudTerminal();
    if (!agentAudioStartTime || agentAudioStartTime === 0) {
      agentAudioStartTime = startTime;
      agentAudioTotalDuration = duration;
    } else {
      agentAudioTotalDuration += duration;
    }
  }

  function finalizeAgentAudio() {
    // Audio playback may end slightly before the final outputTranscription chunk.
    // Do NOT close the HUD turn here, or late chunks would start a duplicate card.
    if (currentAgentTurnId) {
      var turn = findTurn(currentAgentTurnId);
      if (turn) {
        turn.isComplete = true;
        turn.revealDone = true;
        turn.spokenWordIndex = Math.max(-1, turn.words.length - 1);
        turn.words.forEach(function(w) {
          w.isSpoken = true;
          w.isCurrent = false;
        });
      }
    }
    agentAudioStartTime = 0;
    agentAudioTotalDuration = 0;
    activeAgentWordIndex = -1;
    audioPlaybackProgress = 0;
    state = 'idle';
    render();
  }

  function setState(newState) {
    if (state !== newState) {
      state = newState;
      render();
    }
  }

  function findTurn(id) {
    for (var i = 0; i < conversation.length; i++) {
      if (conversation[i].id === id) return conversation[i];
    }
    return null;
  }

  function appendFragment(existing, fragment) {
    if (!fragment) return existing;
    if (!existing) return String(fragment).replace(/^\s+/, '');
    return existing + fragment;
  }

  function updateSyncBar() {
    var syncBar = document.getElementById("cgHudSyncBar");
    var statsEl = document.getElementById("cgHudSyncStats");
    if (!syncBar || !statsEl) return;

    var isSpeaking = (state === 'speaking');
    var turn = currentAgentTurnId ? findTurn(currentAgentTurnId) : null;
    var totalWords = (turn && turn.words) ? turn.words.length : activeAgentWords.length;

    if (isSpeaking && totalWords > 0 && isExpanded) {
      syncBar.style.display = "flex";
      var cur = Math.min(totalWords, (activeAgentWordIndex >= 0 ? activeAgentWordIndex + 1 : 1));
      var pct = Math.round(audioPlaybackProgress * 100);
      statsEl.textContent = cur + "/" + totalWords + " · " + pct + "%";
    } else {
      syncBar.style.display = "none";
    }
  }

  function render() {
    updateHeaderStats();
    updateSyncBar();
    renderFeed();
  }

  function updateHeaderStats() {
    var badge = document.getElementById("cgHudTurnCountBadge");
    var copyBtn = document.getElementById("btnCopyHudTranscript");
    var clearBtn = document.getElementById("btnClearHudTranscript");

    var count = conversation.length;
    if (badge) {
      if (count > 0) {
        badge.textContent = String(count);
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }

    if (copyBtn) {
      copyBtn.style.display = (count > 0) ? "inline-flex" : "none";
    }
    if (clearBtn) {
      clearBtn.style.display = (count > 0) ? "inline-flex" : "none";
    }
  }

  function renderFeed() {
    var scrollContainer = document.getElementById("cgHudFeedScroll");
    var emptyState = document.getElementById("cgHudEmptyState");
    if (!scrollContainer) return;

    if (conversation.length === 0) {
      if (emptyState) emptyState.style.display = "flex";
      var cards = scrollContainer.querySelectorAll(".cg-hud-turn-card");
      for (var c = 0; c < cards.length; c++) cards[c].remove();
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    var existingCards = scrollContainer.querySelectorAll(".cg-hud-turn-card");
    var existingMap = {};
    for (var i = 0; i < existingCards.length; i++) {
      var card = existingCards[i];
      existingMap[card.getAttribute("data-turn-id")] = card;
    }

    conversation.forEach(function(turn, turnIdx) {
      var isLatestTurn = (turnIdx === conversation.length - 1);
      var isAgent = (turn.role === 'agent');
      var isActivelySpeaking = isAgent && isLatestTurn && (state === 'speaking');
      var isActivelyListening = !isAgent && isLatestTurn && (!turn.isComplete || state === 'listening');
      var isTurnStreaming = isActivelySpeaking || isActivelyListening;

      var cardEl = existingMap[turn.id];
      if (!cardEl) {
        cardEl = document.createElement("div");
        cardEl.className = "cg-hud-turn-card";
        cardEl.setAttribute("data-turn-id", turn.id);
        scrollContainer.appendChild(cardEl);
      }

      cardEl.className = "cg-hud-turn-card " + (isAgent ? "role-agent" : "role-user") + (isTurnStreaming ? " active-stream" : "");

      var timeStr = "";
      try {
        timeStr = new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch(e) {
        timeStr = "";
      }

      var speakingHtml = "";
      if (isActivelySpeaking) {
        speakingHtml = '<span class="cg-hud-speaking-badge"><span class="cg-hud-speaking-dot"></span>Speaking</span>';
      } else if (isActivelyListening) {
        // User live turn: keep only the wave GIF, no redundant Listening label.
        speakingHtml = '';
      }

      var interruptedHtml = turn.isInterrupted ? '<span class="cg-hud-interrupted-badge">· Interrupted</span>' : '';

      // Update header (safe to rebuild — no transitions needed on header)
      var headerInner =
          '<div class="cg-hud-header-left">' +
            '<span class="cg-hud-role-badge">' + (isAgent ? "Agent" : "You") + '</span>' +
            speakingHtml +
            interruptedHtml +
          '</div>' +
          '<span class="cg-hud-timestamp">' + timeStr + '</span>';

      var headerDiv = cardEl.querySelector('.cg-hud-card-header');
      if (!headerDiv) {
        headerDiv = document.createElement('div');
        headerDiv.className = 'cg-hud-card-header';
        cardEl.appendChild(headerDiv);
      }
      headerDiv.innerHTML = headerInner;

      // Ensure words wrapper exists (created once, then managed by renderWordsForTurn)
      var wordsWrap = cardEl.querySelector('.cg-hud-words-wrap');
      if (!wordsWrap) {
        wordsWrap = document.createElement('div');
        wordsWrap.className = 'cg-hud-words-wrap';
        cardEl.appendChild(wordsWrap);
      }

      // Render words incrementally (preserves DOM spans for smooth CSS transitions)
      renderWordsForTurn(turn);
    });

    var validIds = conversation.map(function(t) { return t.id; });
    for (var k in existingMap) {
      if (validIds.indexOf(k) === -1) {
        existingMap[k].remove();
      }
    }

    var activeWord = scrollContainer.querySelector(".cg-hud-word.current");
    if (activeWord) {
      activeWord.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  function renderWordsForTurn(turn) {
    var card = document.querySelector('.cg-hud-turn-card[data-turn-id="' + turn.id + '"]');
    if (!card) return;
    var wordsWrap = card.querySelector(".cg-hud-words-wrap");
    if (!wordsWrap) return;

    var isAgent = (turn.role === 'agent');
    var isTurnStreaming = !turn.isComplete;

    // --- Wave GIF: add or remove without touching word spans ---
    var existingWave = wordsWrap.querySelector('.cg-hud-wave-anim');
    if (isTurnStreaming) {
      if (!existingWave) {
        var waveImg = document.createElement('img');
        waveImg.src = LISTENING_GIF_DATA_URI;
        waveImg.alt = isAgent ? "Speaking..." : "Listening...";
        waveImg.className = isAgent ? "cg-hud-wave-anim agent-wave" : "cg-hud-wave-anim";
        if (isAgent) {
          // Agent: wave at the beginning, before words
          wordsWrap.insertBefore(waveImg, wordsWrap.firstChild);
        } else {
          // User: wave at the end, after words
          wordsWrap.appendChild(waveImg);
        }
      }
    } else {
      if (existingWave) existingWave.remove();
    }

    // --- Determine which words to show ---
    var maxWordIdx = isTurnStreaming ? turn.spokenWordIndex : Math.max(0, turn.words.length - 1);
    var wordsToRender = (revealMode === 'progressive')
      ? turn.words.slice(0, maxWordIdx + 1)
      : turn.words;

    // Fallback: if no words array but text exists, use text directly
    if (wordsToRender.length === 0 && turn.text) {
      wordsToRender = [{ text: turn.text }];
    }

    // Agent "Thinking..." placeholder when no transcription yet
    if (wordsToRender.length === 0 && isTurnStreaming && isAgent) {
      if (wordsWrap.querySelectorAll('.cg-hud-word').length === 0) {
        var thinking = document.createElement('span');
        thinking.className = 'cg-hud-word dimmed';
        thinking.textContent = 'Thinking...';
        wordsWrap.appendChild(thinking);
      }
    }

    // --- Update existing word spans, create new ones (preserves DOM for CSS transitions) ---
    var existingSpans = wordsWrap.querySelectorAll('.cg-hud-word');

    for (var i = 0; i < wordsToRender.length; i++) {
      var span = existingSpans[i];
      if (!span) {
        // New word — create span and insert at correct position
        span = document.createElement('span');
        span.className = 'cg-hud-word';
        span.textContent = wordsToRender[i].text;
        var waveEl = wordsWrap.querySelector('.cg-hud-wave-anim');
        if (!isAgent && waveEl) {
          // User: words go before the wave GIF
          wordsWrap.insertBefore(span, waveEl);
        } else {
          // Agent: words go after the wave GIF (or append if no wave)
          wordsWrap.appendChild(span);
        }
      } else {
        // Existing word — update text if changed (interim correction)
        if (span.textContent !== wordsToRender[i].text) {
          span.textContent = wordsToRender[i].text;
        }
      }

      // Update class based on current state
      var isCurrentWord = isTurnStreaming && (i === maxWordIdx);
      var isSpoken = !isTurnStreaming || (i <= maxWordIdx);
      var newClass = isCurrentWord ? "cg-hud-word current" : (isSpoken ? "cg-hud-word spoken" : "cg-hud-word dimmed");
      if (span.className !== newClass) {
        span.className = newClass;
      }
    }

    // Remove excess spans (interim correction reduced word count or mode switched)
    var allSpans = wordsWrap.querySelectorAll('.cg-hud-word');
    if (allSpans.length > wordsToRender.length) {
      for (var j = wordsToRender.length; j < allSpans.length; j++) {
        allSpans[j].remove();
      }
    }

    // Auto-scroll to current word
    var activeWord = wordsWrap.querySelector(".cg-hud-word.current");
    if (activeWord) {
      activeWord.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function bindEvents() {
    var expandBtn = document.getElementById("btnToggleHudExpand");
    if (expandBtn) expandBtn.onclick = toggleExpand;

    var revealBtn = document.getElementById("btnToggleHudReveal");
    if (revealBtn) revealBtn.onclick = toggleRevealMode;

    var copyBtn = document.getElementById("btnCopyHudTranscript");
    if (copyBtn) copyBtn.onclick = copyTranscript;

    var clearBtn = document.getElementById("btnClearHudTranscript");
    if (clearBtn) clearBtn.onclick = clearTranscript;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    init: init,
    positionHUD: positionHUD,
    toggleExpand: toggleExpand,
    toggleRevealMode: toggleRevealMode,
    copyTranscript: copyTranscript,
    clearTranscript: clearTranscript,
    onUserTranscript: onUserTranscript,
    onAgentTranscript: onAgentTranscript,
    onInterrupted: onInterrupted,
    onAudioChunk: onAudioChunk,
    finalizeAgentAudio: finalizeAgentAudio,
    setState: setState,
    getState: function() {
      return state;
    },
    render: render
  };
})();
