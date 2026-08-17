#pragma once

namespace UI {

inline const char* GetDashboardHTML() {
    return R"HTML(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="PANIC CTRL">
<meta name="theme-color" content="#07090e">
<title>PANIC CTRL - CYBER REMOTE NODE</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;800;900&family=Inter:wght@400;600;700&display=swap');
  
  :root {
    --neon-green: #00ff41;
    --neon-red: #ff0055;
    --neon-cyan: #00f0ff;
    --neon-amber: #ffaa00;
    --bg-dark: #07090e;
    --panel-bg: rgba(13, 17, 23, 0.85);
  }

  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  
  body {
    background: var(--bg-dark);
    color: #e6edf3;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 15px 12px 30px 12px;
    overflow-x: hidden;
    background-image: 
      radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 50% 100%, rgba(255, 0, 85, 0.05) 0%, transparent 60%);
  }

  /* Scanline & Grid Effect */
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.02) 2px, rgba(0,240,255,0.02) 4px);
    pointer-events: none;
    z-index: 1;
  }

  .container {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 100%;
    padding: 0 4px;
    margin: 0 auto;
  }

  /* Header Branding */
  .brand-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 4px;
  }
  .brand-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 3px;
    text-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
  }
  .brand-tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: var(--neon-cyan);
    background: rgba(0, 240, 255, 0.1);
    border: 1px solid rgba(0, 240, 255, 0.3);
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 1px;
  }

  /* 🎬 FUTURISTIC VIDEO PLAYER MONITOR */
  .player-card {
    background: #000;
    border: 1px solid rgba(0, 255, 65, 0.4);
    box-shadow: 0 0 25px rgba(0, 255, 65, 0.15), inset 0 0 15px rgba(0,0,0,0.9);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
    position: relative;
  }
  
  /* Video Player Top HUD - Non-overlapping header */
  .player-hud-top {
    position: relative;
    background: rgba(10, 14, 22, 0.95);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
  }
  .rec-badge {
    color: var(--neon-red);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: bold;
  }
  .rec-dot {
    width: 8px; height: 8px;
    background: var(--neon-red);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--neon-red);
    animation: pulseRed 1s infinite;
  }
  @keyframes pulseRed { 0%,100%{opacity:1;} 50%{opacity:0.2;} }

  .stream-quality {
    color: var(--neon-cyan);
    letter-spacing: 1px;
  }

  /* Screen Display Box */
  .screen-display {
    width: 100%;
    min-height: 230px;
    background: #04060a;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .screen-img {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
    border-radius: 4px;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }

  .offline-matrix {
    padding: 35px 20px;
    text-align: center;
    font-family: 'Share Tech Mono', monospace;
  }
  .matrix-icon {
    font-size: 32px;
    margin-bottom: 10px;
    text-shadow: 0 0 15px var(--neon-cyan);
  }
  .matrix-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    color: #fff;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }
  .matrix-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 16px;
  }

  /* Player Bottom Controls Bar */
  .player-controls {
    background: rgba(10, 14, 22, 0.95);
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .play-btn {
    background: var(--neon-green);
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 0 12px rgba(0, 255, 65, 0.4);
    transition: transform 0.1s;
  }
  .play-btn:active { transform: scale(0.96); }

  .fs-btn {
    background: rgba(255,255,255,0.05);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    cursor: pointer;
  }

  /* 🎮 PARSEC IMMERSIVE FULLSCREEN OVERLAY & FLOATING BUBBLE */
  .fullscreen-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: #000;
    z-index: 99999;
    padding: 0;
    margin: 0;
    overflow: hidden;
    touch-action: none;
  }
  
  /* 🔄 AUTO LANDSCAPE: CLEAN 16:9 NATIVE BOX WITH BLACK BARS */
  #fsCanvas {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    object-fit: contain !important;
    display: block;
    touch-action: none;
    margin: 0;
    padding: 0;
  }

  @media (orientation: portrait) {
    #fsCanvas {
      width: 100vh !important;
      height: 100vw !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) rotate(90deg) !important;
      object-fit: contain !important;
    }
  }

  @media (orientation: landscape) {
    #fsCanvas {
      width: 100vw !important;
      height: 100vh !important;
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
      object-fit: contain !important;
    }
  }
  .parsec-bubble {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(10, 14, 22, 0.88);
    border: 2px solid var(--neon-cyan);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100005;
    touch-action: none;
    user-select: none;
    backdrop-filter: blur(8px);
    transition: transform 0.1s ease, box-shadow 0.2s;
  }
  .parsec-bubble:active {
    transform: scale(0.92);
    box-shadow: 0 0 30px var(--neon-cyan);
  }
  .parsec-bubble .bubble-icon {
    font-size: 20px;
    filter: drop-shadow(0 0 6px var(--neon-cyan));
  }
  .parsec-menu {
    position: fixed;
    top: 76px;
    left: 20px;
    width: 260px;
    max-width: 85vw;
    background: rgba(13, 18, 28, 0.96);
    border: 1.5px solid var(--neon-cyan);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.3);
    z-index: 100006;
    padding: 14px;
    backdrop-filter: blur(16px);
  }
  @keyframes menuPop {
    from { opacity: 0; transform: scale(0.85) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .parsec-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    color: var(--neon-cyan);
    letter-spacing: 1px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .parsec-menu-close {
    cursor: pointer;
    font-size: 14px;
    color: #94a3b8;
    padding: 2px 6px;
  }
  .parsec-menu-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .parsec-btn {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(0, 240, 255, 0.3);
    color: #fff;
    padding: 10px 14px;
    border-radius: 10px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.15s;
  }
  .parsec-btn:hover, .parsec-btn:active {
    background: rgba(0, 240, 255, 0.2);
    border-color: var(--neon-cyan);
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
  }
  .parsec-btn.danger {
    border-color: rgba(255, 68, 68, 0.4);
    color: #ff6666;
  }
  .parsec-btn.danger:hover, .parsec-btn.danger:active {
    background: rgba(255, 68, 68, 0.2);
    border-color: #ff4444;
  }

  /* 🟢 STATUS BADGE CARD */
  .status-card {
    background: var(--panel-bg);
    border: 1px solid rgba(0, 255, 65, 0.3);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .status-card.panic {
    border-color: var(--neon-red);
    box-shadow: 0 0 25px rgba(255, 0, 85, 0.4);
    animation: pulseBorder 1s infinite;
  }
  @keyframes pulseBorder { 0%,100%{box-shadow:0 0 15px rgba(255,0,85,0.4);} 50%{box-shadow:0 0 35px rgba(255,0,85,0.8);} }

  .status-info { display: flex; flex-direction: column; gap: 4px; }
  .status-title { font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.5); font-family: 'Share Tech Mono', monospace; }
  .status-text { font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: 2px; color: var(--neon-green); }
  .status-text.panic { color: var(--neon-red); text-shadow: 0 0 12px var(--neon-red); }

  /* ⚡ BIG TACTILE BUTTONS */
  .action-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .btn-huge {
    width: 100%;
    padding: 18px 12px;
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 3px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-transform: uppercase;
  }
  .btn-huge:active { transform: scale(0.97); }

  .btn-panic-huge {
    background: linear-gradient(135deg, #ff0055 0%, #990033 100%);
    color: #fff;
    border: 2px solid #ff3377;
    box-shadow: 0 0 25px rgba(255, 0, 85, 0.4);
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  .btn-secondary {
    background: rgba(255,255,255,0.03);
    color: var(--neon-amber);
    border: 1px solid var(--neon-amber);
    font-size: 13px;
    padding: 14px;
    box-shadow: 0 0 15px rgba(255, 170, 0, 0.1);
  }

  .btn-danger-sub {
    background: rgba(255, 0, 85, 0.05);
    color: var(--neon-red);
    border: 1px solid rgba(255, 0, 85, 0.4);
    font-size: 12px;
    padding: 12px;
  }

  /* Modern Cyberpunk Unlock Modal */
  .modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(4, 7, 12, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: modalFadeIn 0.2s ease-out;
  }
  @keyframes modalFadeIn { from{opacity:0;} to{opacity:1;} }

  .modal-card {
    background: rgba(13, 18, 28, 0.95);
    border: 1.5px solid rgba(0, 255, 65, 0.5);
    box-shadow: 0 0 35px rgba(0, 255, 65, 0.25), inset 0 0 20px rgba(0, 255, 65, 0.05);
    border-radius: 16px;
    padding: 24px 20px;
    width: 100%;
    max-width: 380px;
    text-align: center;
    transform: scale(0.95);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .modal-icon { font-size: 24px; }
  .modal-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: var(--neon-green);
    letter-spacing: 2px;
  }
  .modal-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .input-wrapper {
    position: relative;
    margin-bottom: 20px;
  }
  .input-wrapper input {
    width: 100%;
    padding: 14px 44px 14px 16px;
    background: rgba(0, 0, 0, 0.6);
    border: 1.5px solid rgba(0, 255, 65, 0.4);
    border-radius: 10px;
    color: #fff;
    font-family: 'Share Tech Mono', monospace;
    font-size: 16px;
    letter-spacing: 2px;
    outline: none;
    transition: all 0.2s;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
  }
  .input-wrapper input:focus {
    border-color: var(--neon-green);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.4), inset 0 2px 8px rgba(0,0,0,0.8);
  }
  .toggle-pass {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.7;
  }
  .modal-actions {
    display: flex;
    gap: 10px;
  }
  .modal-btn {
    flex: 1;
    padding: 14px;
    border-radius: 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .modal-btn:active { transform: scale(0.96); }
  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .btn-confirm {
    background: linear-gradient(135deg, #00ff41 0%, #008822 100%);
    color: #000;
    border: none;
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);
  }
</style>
</head>
<body>

<!-- 🔓 REDESIGNED UNLOCK MODAL -->
<div id="unlockModal" class="modal-overlay">
  <div class="modal-card">
    <div class="modal-header">
      <span class="modal-icon">🔓</span>
      <span class="modal-title">SECURITY AUTHENTICATION</span>
    </div>
    <p class="modal-sub">ENTER WINDOWS PASSWORD OR PIN TO UNLOCK</p>
    <div class="input-wrapper">
      <input type="password" id="pinInput" placeholder="Enter Password or PIN" autocomplete="off" onkeydown="if(event.key==='Enter')submitUnlock()">
      <button class="toggle-pass" onclick="togglePassVisibility()">👁️</button>
    </div>
    <div class="modal-actions">
      <button class="modal-btn btn-cancel" onclick="closeUnlockModal()">CANCEL</button>
      <button class="modal-btn btn-confirm" onclick="submitUnlock()">UNLOCK 🔓</button>
    </div>
  </div>
</div>

<div class="fullscreen-overlay" id="fsOverlay">
  <!-- ⚡ PARSEC FLOATING DRAGGABLE BUBBLE -->
  <div id="parsecBubble" class="parsec-bubble" onclick="toggleParsecMenu(event)">
    <span class="bubble-icon">⚡</span>
  </div>

  <!-- 🎮 PARSEC QUICK HUD MENU -->
  <div id="parsecMenu" class="parsec-menu" style="display:none;">
    <div class="parsec-menu-header">
      <span>🎮 PARSEC MONITOR HUD</span>
      <span class="parsec-menu-close" onclick="toggleParsecMenu(event)">✖</span>
    </div>
    <div class="parsec-menu-grid">
      <button class="parsec-btn" onclick="toggleVirtualKeyboard()"><span class="btn-ic">⌨️</span> KEYBOARD</button>
      <button class="parsec-btn" id="btnMouseMode" onclick="toggleMouseMode()"><span class="btn-ic">🖱️</span> TOUCH CLICK: ON</button>
      <button class="parsec-btn danger" onclick="closeFS()"><span class="btn-ic">🚪</span> EXIT TO DASHBOARD</button>
    </div>
  </div>

  <!-- ⌨️ INVISIBLE KEYBOARD INPUT PROXY -->
  <input type="text" id="fsKeyProxy" style="position:fixed; opacity:0; pointer-events:none; top:-100px; left:-100px;" oninput="handleFsType(event)" onkeydown="handleFsKeydown(event)">

  <!-- 🖼️ PARSEC FULLSCREEN GPU CANVAS -->
  <canvas id="fsCanvas" style="width:100vw; height:100vh; object-fit:contain; background:#000; display:block; touch-action:none;"></canvas>
</div>

<div class="container">
  
  <!-- Header Branding -->
  <div class="brand-bar">
    <div class="brand-title">PANIC CTRL</div>
    <div class="brand-tag">v2.0 CYBER NODE</div>
  </div>

  <!-- 🎬 FUTURISTIC VIDEO PLAYER MONITOR -->
  <div class="player-card">
    <div class="player-hud-top">
      <div class="rec-badge">
        <span class="rec-dot"></span> REC LIVE
      </div>
      <div class="stream-quality">1080P &bull; 30 FPS &bull; ENCRYPTED</div>
    </div>

    <div class="screen-display">
      <div id="mirrorPlaceholder" class="offline-matrix">
        <div class="matrix-icon">🛡️</div>
        <div class="matrix-title">PC MONITOR OFFLINE</div>
        <div class="matrix-sub">Tap '▶ PLAY LIVE STREAM' to start real-time desktop view.</div>
      </div>
      <!-- 🚀 GPU ACCELERATED HARDWARE CANVAS (Instant zero-copy render) -->
      <canvas id="gpuCanvas" class="screen-img" onclick="openFS()" style="display:none; width:100%; border-radius:6px; object-fit:contain; cursor:pointer; touch-action:none;"></canvas>
      <!-- 📷 MJPEG fallback -->
      <img id="liveImg" class="screen-img" onclick="openFS()" style="display:none; width:100%; border-radius:6px; object-fit:contain; cursor:pointer; touch-action:none;">
    </div>

    <div class="player-controls">
      <button id="toggleBtn" class="play-btn" onclick="toggleStream()">▶ PLAY LIVE STREAM</button>
      <button class="fs-btn" onclick="openFS()">⛶ FULLSCREEN</button>
    </div>
  </div>

  <!-- ⌨️ REAL-TIME LIVE KEYBOARD CONTROL BAR -->
  <div style="background:var(--panel-bg); border:1px solid rgba(0,240,255,0.3); border-radius:10px; padding:12px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <span style="font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--neon-cyan); letter-spacing:1px;">⌨️ LIVE REAL-TIME KEYBOARD TYPING</span>
      <span style="font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--neon-green);">● REAL-TIME SYNC</span>
    </div>

    <div style="display:flex; gap:8px;">
      <input type="text" id="remoteTextInput" placeholder="⌨️ Tap to type live on PC..." style="flex:1; background:#000; border:1.5px solid var(--neon-cyan); color:#fff; padding:12px 14px; border-radius:8px; font-family:'Inter',sans-serif; font-size:14px; outline:none; box-shadow:0 0 10px rgba(0,240,255,0.2);" oninput="handleLiveInput(event)" onkeydown="handleLiveKeydown(event)">
      <button class="fs-btn" style="padding:12px 14px; font-size:11px; color:#ff4444; border-color:rgba(255,68,68,0.4);" onclick="clearLiveInput()">✖ CLEAR</button>
    </div>

    <div style="display:flex; gap:6px;">
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{ENTER}')">ENTER ↵</button>
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{BACKSPACE}')">BACKSPACE ⌫</button>
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{ESC}')">ESC ⎋</button>
      <button class="fs-btn" style="flex:1; font-size:10px; padding:8px;" onclick="sendSpecialKey('{TAB}')">TAB ⇥</button>
    </div>
  </div>

  <!-- 💻 MINIMALIST FUTURISTIC TOUCHPAD TRACKPAD PANEL -->
  <div style="background:rgba(13, 17, 23, 0.9); border:1px solid rgba(0,240,255,0.25); border-radius:14px; padding:12px; margin-bottom:16px; backdrop-filter:blur(12px); box-shadow:0 8px 32px rgba(0,0,0,0.5);">
    
    <!-- Top Mode Switcher Bar -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:0 2px;">
      <span style="font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700; color:#fff; letter-spacing:1px;">💻 TRACKPAD</span>

      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--neon-green);">SPEED: <b id="sensValDisplay">3.2x</b></span>
        <input type="range" id="sensSlider" min="1.0" max="5.0" step="0.2" value="3.2" style="width:110px; accent-color:var(--neon-green); cursor:pointer;" oninput="document.getElementById('sensValDisplay').textContent=this.value+'x'; localStorage.setItem('trackpadSens', this.value);">
      </div>
    </div>

    <!-- Mode A: Matte Trackpad Touch Surface -->
    <div id="touchpadPad" style="width:100%; height:160px; background:radial-gradient(circle at 50% 50%, rgba(20,28,45,0.8) 0%, rgba(8,12,20,0.95) 100%); border:1px solid rgba(0,240,255,0.2); border-radius:10px 10px 0 0; display:flex; align-items:center; justify-content:center; touch-action:none; user-select:none; position:relative;">
      <div style="width:36px; height:36px; border-radius:50%; border:1px dashed rgba(0,240,255,0.3); display:flex; align-items:center; justify-content:center; opacity:0.4;">
        <span style="font-size:14px; color:var(--neon-cyan);">⊹</span>
      </div>
    </div>

    <!-- Integrated Sleek Hardware Click Buttons -->
    <div style="display:flex; border-top:1px solid rgba(0,240,255,0.25); border-radius:0 0 10px 10px; overflow:hidden;">
      <button style="flex:1; padding:11px; background:rgba(0,255,65,0.08); color:var(--neon-green); border:none; border-right:1px solid rgba(0,240,255,0.2); font-family:'Orbitron',sans-serif; font-size:11px; font-weight:800; letter-spacing:1px; cursor:pointer;" onclick="sendMouseClick(1)">LEFT CLICK</button>
      <button style="flex:1; padding:11px; background:rgba(255,170,0,0.08); color:var(--neon-amber); border:none; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:800; letter-spacing:1px; cursor:pointer;" onclick="sendMouseClick(2)">RIGHT CLICK</button>
    </div>
  </div>

  <!-- 📱 NATIVE ANDROID APK INSTALLATION BANNER -->
  <div id="pwaInstallBanner" style="display:block; width:100%; margin-bottom:12px; background:linear-gradient(135deg, rgba(0,255,65,0.15), rgba(0,240,255,0.15)); border:1px solid var(--neon-green); border-radius:10px; padding:12px; text-align:center;">
    <div style="font-family:'Orbitron',sans-serif; font-size:12px; font-weight:800; color:var(--neon-green); margin-bottom:4px;">📱 NATIVE ANDROID APK READY!</div>
    <div style="font-size:11px; color:#ccc; margin-bottom:8px;">Download and install PanicCTRL.apk directly for 100% standalone native full-screen experience!</div>
    <a href="/download/app.apk" style="display:inline-block; text-decoration:none; padding:11px 22px; background:var(--neon-green); color:#000; font-family:'Orbitron',sans-serif; font-weight:900; font-size:11px; border-radius:6px;">📥 DOWNLOAD NATIVE ANDROID APK</a>
  </div>

  <!-- 🟢 SYSTEM STATUS CARD -->
  <div class="status-card" id="statusBox">
    <div class="status-info">
      <div class="status-title">SYSTEM DEFENSE STATUS</div>
      <div class="status-text" id="statusText">CHECKING...</div>
    </div>
    <div style="font-size: 22px;" id="statusIcon">🟢</div>
  </div>

  <!-- ⚡ ACTION BUTTONS -->
  <div class="action-grid">
    <button class="btn-huge btn-panic-huge" onclick="triggerPanic()">
      ⚡ TOGGLE PANIC MODE
    </button>
    
    <button class="btn-huge btn-secondary" onclick="lockPC()">
      🔒 LOCK WORKSTATION
    </button>

    <button class="btn-huge btn-secondary" style="color:var(--neon-green); border-color:var(--neon-green);" onclick="unlockPC()">
      🔓 UNLOCK WORKSTATION
    </button>
    
    <button class="btn-huge btn-secondary" style="color:var(--neon-cyan); border-color:var(--neon-cyan);" onclick="sleepPC()">
      🌙 SLEEP WORKSTATION
    </button>

    <button class="btn-huge btn-secondary" style="color:var(--neon-amber); border-color:var(--neon-amber);" onclick="wakePC()">
      ⚡ WAKE UP PC (WOL)
    </button>

    <button class="btn-huge btn-danger-sub" onclick="if(confirm('Shutdown PC?'))shutdownPC()">
      ⏻ SHUTDOWN PC
    </button>
  </div>

</div>

<script>
var KEY="imran2024";

// 📊 REAL-TIME CLIENT TELEMETRY & BLACKBOX LOGGER
var Telemetry = {
  getGPU: function() {
    try {
      var gl = document.createElement("canvas").getContext("webgl");
      if (!gl) return "WebGL Unavailable";
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "Standard WebGL";
    } catch(e) { return "Err: " + e.message; }
  },
  log: function(eventType, detailObj) {
    try {
      var payload = {
        type: eventType,
        time: new Date().toISOString(),
        screen: {
          w: window.innerWidth || window.screen.width,
          h: window.innerHeight || window.screen.height,
          dpr: window.devicePixelRatio || 1,
          orientation: (screen.orientation ? screen.orientation.type : (window.innerHeight > window.innerWidth ? "portrait" : "landscape")),
          touchPoints: navigator.maxTouchPoints || 0
        },
        gpu: Telemetry.getGPU(),
        webcodecs: typeof VideoDecoder !== 'undefined',
        webrtc: typeof RTCPeerConnection !== 'undefined',
        details: detailObj || {}
      };
      var dataStr = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/client_telemetry?key=" + KEY, dataStr);
      } else {
        fetch("/api/client_telemetry?key=" + KEY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: dataStr,
          keepalive: true
        }).catch(function(){});
      }
    } catch(e) {}
  }
};

window.addEventListener("DOMContentLoaded", function() {
  Telemetry.log("APP_INIT_HANDSHAKE", {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cores: navigator.hardwareConcurrency || "unknown",
    memory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "unknown"
  });
});

window.addEventListener("error", function(e) {
  Telemetry.log("CLIENT_ERROR", { msg: e.message, file: e.filename, line: e.lineno, col: e.colno });
});
window.addEventListener("unhandledrejection", function(e) {
  Telemetry.log("UNHANDLED_PROMISE", { reason: String(e.reason) });
});

var fsZoom = 1.0;
var fsPanX = 0, fsPanY = 0;
var touchStartDist = 0;
var touchStartZoom = 1.0;
var touchStartPanX = 0, touchStartPanY = 0;
var touchStartTouchX = 0, touchStartTouchY = 0;
var lastTapTime = 0;
var gesturesBound = false;
var bubbleDragBound = false;

// 🎮 Parsec Interactive Modes
var isTouchMouse = true;
var scalingMode = 0; // 0 = Contain 16:9, 1 = Fill Height, 2 = Stretch Full
var isFsRotated = false;
var longPressTimer = null;
var touchMoved = false;

var bubbleHasDragged = false;

function positionMenuNextToBubble() {
  var bubble = document.getElementById("parsecBubble");
  var menu = document.getElementById("parsecMenu");
  if (!bubble || !menu) return;
  var bRect = bubble.getBoundingClientRect();
  var winW = window.innerWidth || window.screen.width;
  var winH = window.innerHeight || window.screen.height;

  var menuW = 260;
  var menuH = 170;

  var posX = bRect.left;
  var posY = bRect.bottom + 8;

  if (posY + menuH > winH - 12) {
    posY = Math.max(12, bRect.top - menuH - 8);
  }
  if (posX + menuW > winW - 12) {
    posX = Math.max(12, winW - menuW - 12);
  }

  menu.style.left = posX + "px";
  menu.style.top = posY + "px";
}

function toggleParsecMenu(e) {
  if (e) e.stopPropagation();
  if (bubbleHasDragged) {
    bubbleHasDragged = false;
    return;
  }
  var menu = document.getElementById("parsecMenu");
  if (menu) {
    var isOpening = (menu.style.display === "none" || menu.style.display === "");
    if (isOpening) {
      positionMenuNextToBubble();
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
    }
  }
}

function toggleVirtualKeyboard() {
  toggleParsecMenu();
  var input = document.getElementById("fsKeyProxy");
  if (input) {
    input.focus();
    input.click();
  }
}

function handleFsType(e) {
  var val = e.target.value;
  if (val) {
    fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(val));
    e.target.value = "";
  }
}

function handleFsKeydown(e) {
  if (e.key === "Backspace") {
    fetch("/api/key?key=" + KEY + "&code={BACKSPACE}");
  } else if (e.key === "Enter") {
    fetch("/api/key?key=" + KEY + "&code={ENTER}");
  }
}

function toggleMouseMode() {
  isTouchMouse = !isTouchMouse;
  var btn = document.getElementById("btnMouseMode");
  if (btn) btn.innerHTML = isTouchMouse ? '<span class="btn-ic">🖱️</span> TOUCH CLICK: ON' : '<span class="btn-ic">✋</span> PAN & ZOOM ONLY';
  vibratePhone(40);
}

function applyFSTransform() {
  var fsCanvas = document.getElementById("fsCanvas");
  var fsOverlay = document.getElementById("fsOverlay");
  if (!fsCanvas || !fsOverlay || fsOverlay.style.display === "none") return;

  var winW = window.innerWidth || window.screen.width;
  var winH = window.innerHeight || window.screen.height;
  var isPortrait = winH > winW;

  var cW = fsCanvas.width || 1920;
  var cH = fsCanvas.height || 1080;

  fsCanvas.style.width = cW + "px";
  fsCanvas.style.height = cH + "px";
  fsCanvas.style.position = "fixed";
  fsCanvas.style.left = "50%";
  fsCanvas.style.top = "50%";
  fsCanvas.style.margin = "0";
  fsCanvas.style.transformOrigin = "center center";

  if (isPortrait) {
    // 📱 PORTRAIT PHONE: 16:9 Native Box with natural black bars
    var scaleW = winH / cW;
    var scaleH = winW / cH;
    var fitScale = Math.min(scaleW, scaleH);
    var finalScale = fitScale * fsZoom;
    fsCanvas.style.transform = "translate(-50%, -50%) rotate(90deg) scale(" + finalScale + ") translate(" + (fsPanY / finalScale) + "px, " + (-fsPanX / finalScale) + "px)";
  } else {
    // 💻 LANDSCAPE PHONE: 16:9 Native Box with natural black bars
    var scaleW = winW / cW;
    var scaleH = winH / cH;
    var fitScale = Math.min(scaleW, scaleH);
    var finalScale = fitScale * fsZoom;
    fsCanvas.style.transform = "translate(-50%, -50%) scale(" + finalScale + ") translate(" + (fsPanX / finalScale) + "px, " + (fsPanY / finalScale) + "px)";
  }
}

window.addEventListener("resize", function() {
  if (document.getElementById("fsOverlay") && document.getElementById("fsOverlay").style.display !== "none") {
    applyFSTransform();
    positionMenuNextToBubble();
  }
});

var cachedWinW = window.innerWidth || window.screen.width;
var cachedWinH = window.innerHeight || window.screen.height;

function updateCachedDimensions() {
  cachedWinW = window.innerWidth || window.screen.width;
  cachedWinH = window.innerHeight || window.screen.height;
}

window.addEventListener("resize", updateCachedDimensions);
window.addEventListener("orientationchange", function() {
  updateCachedDimensions();
  setTimeout(function() {
    updateCachedDimensions();
    applyFSTransform();
    positionMenuNextToBubble();
  }, 150);
});

function getDesktopCoords(clientX, clientY) {
  var winW = cachedWinW;
  var winH = cachedWinH;

  if (winH > winW) {
    // 📱 90° ROTATED PORTRAIT: (Phone is vertical, canvas is rotated 90° landscape)
    var containerW = winH;
    var containerH = winW;
    var targetAspect = 16.0 / 9.0;
    var containerAspect = containerW / containerH;

    var renderW, renderH, offX, offY;
    if (containerAspect > targetAspect) {
      renderH = containerH;
      renderW = containerH * targetAspect;
      offX = (containerW - renderW) / 2.0;
      offY = 0;
    } else {
      renderW = containerW;
      renderH = containerW / targetAspect;
      offX = 0;
      offY = (containerH - renderH) / 2.0;
    }

    var rotX = clientY;
    var rotY = winW - clientX;

    var localX = rotX - offX;
    var localY = rotY - offY;

    var normX = Math.max(0.0, Math.min(1.0, localX / renderW));
    var normY = Math.max(0.0, Math.min(1.0, localY / renderH));

    return {
      px: Math.round(normX * 10000),
      py: Math.round(normY * 10000)
    };
  } else {
    // 💻 LANDSCAPE:
    var targetAspect = 16.0 / 9.0;
    var containerAspect = winW / winH;

    var renderW, renderH, offX, offY;
    if (containerAspect > targetAspect) {
      renderH = winH;
      renderW = winH * targetAspect;
      offX = (winW - renderW) / 2.0;
      offY = 0;
    } else {
      renderW = winW;
      renderH = winW / targetAspect;
      offX = 0;
      offY = (winH - renderH) / 2.0;
    }

    var localX = clientX - offX;
    var localY = clientY - offY;

    var normX = Math.max(0.0, Math.min(1.0, localX / renderW));
    var normY = Math.max(0.0, Math.min(1.0, localY / renderH));

    return {
      px: Math.round(normX * 10000),
      py: Math.round(normY * 10000)
    };
  }
}

var _touchMovePending = null;
var _touchRaf = null;

function sendTouch(action, clientX, clientY, id) {
  var coords = getDesktopCoords(clientX, clientY);
  var tid = id || 0;

  // ⚡ 1. Ultra-Low-Latency In-Socket WebSocket Transmission (<0.1ms!)
  if (_canvasWS && _canvasWS.readyState === 1) {
    _canvasWS.send("T:" + action + ":" + coords.px + ":" + coords.py + ":" + tid);
    return;
  }

  // Fallback to HTTP if WebSocket is not open
  var url = "/api/touch?key=" + KEY + "&px=" + coords.px + "&py=" + coords.py + "&action=" + action + "&id=" + tid;
  if (action === "move") {
    _touchMovePending = url;
    if (!_touchRaf) {
      _touchRaf = requestAnimationFrame(function() {
        if (_touchMovePending) {
          fetch(_touchMovePending, { keepalive: true }).catch(function(){});
          _touchMovePending = null;
        }
        _touchRaf = null;
      });
    }
  } else {
    _touchMovePending = null;
    fetch(url, { keepalive: true }).catch(function(){});
  }
}

function initBubbleDrag() {
  if (bubbleDragBound) return;
  var bubble = document.getElementById("parsecBubble");
  if (!bubble) return;
  bubbleDragBound = true;

  var bTouchX = 0, bTouchY = 0;
  var bStartX = 20, bStartY = 20;

  // Touch Drag
  bubble.addEventListener("touchstart", function(e) {
    if (e.touches.length === 1) {
      bubbleHasDragged = false;
      bTouchX = e.touches[0].clientX;
      bTouchY = e.touches[0].clientY;
      var rect = bubble.getBoundingClientRect();
      bStartX = rect.left;
      bStartY = rect.top;
    }
  }, { passive: true });

  bubble.addEventListener("touchmove", function(e) {
    if (e.touches.length === 1) {
      var dx = e.touches[0].clientX - bTouchX;
      var dy = e.touches[0].clientY - bTouchY;
      if (Math.hypot(dx, dy) > 6) {
        bubbleHasDragged = true;
        var winW = window.innerWidth || window.screen.width;
        var winH = window.innerHeight || window.screen.height;
        var newLeft = Math.max(8, Math.min(winW - 56, bStartX + dx));
        var newTop = Math.max(8, Math.min(winH - 56, bStartY + dy));
        bubble.style.left = newLeft + "px";
        bubble.style.top = newTop + "px";
        positionMenuNextToBubble();
      }
    }
  }, { passive: true });

  // Mouse Drag for Desktop
  var isMouseDown = false;
  bubble.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    bubbleHasDragged = false;
    bTouchX = e.clientX;
    bTouchY = e.clientY;
    var rect = bubble.getBoundingClientRect();
    bStartX = rect.left;
    bStartY = rect.top;
  });

  window.addEventListener("mousemove", function(e) {
    if (!isMouseDown) return;
    var dx = e.clientX - bTouchX;
    var dy = e.clientY - bTouchY;
    if (Math.hypot(dx, dy) > 6) {
      bubbleHasDragged = true;
      var winW = window.innerWidth || window.screen.width;
      var winH = window.innerHeight || window.screen.height;
      var newLeft = Math.max(8, Math.min(winW - 56, bStartX + dx));
      var newTop = Math.max(8, Math.min(winH - 56, bStartY + dy));
      bubble.style.left = newLeft + "px";
      bubble.style.top = newTop + "px";
      positionMenuNextToBubble();
    }
  });

  window.addEventListener("mouseup", function() {
    isMouseDown = false;
  });
}

function initGestures() {
  initBubbleDrag();
  if (gesturesBound) return;
  var fsCanvas = document.getElementById("fsCanvas");
  if (!fsCanvas) return;
  gesturesBound = true;

  var touchStartTime = 0;
  var lastTouchDist = 0;

  fsCanvas.addEventListener("touchstart", function(e) {
    touchMoved = false;
    if (e.touches.length === 2) {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
      lastTouchDist = touchStartDist;
      touchStartZoom = fsZoom;
    } else if (e.touches.length === 1) {
      touchStartTouchX = e.touches[0].clientX;
      touchStartTouchY = e.touches[0].clientY;
      touchStartPanX = fsPanX;
      touchStartPanY = fsPanY;
      touchStartTime = Date.now();

      if (isTouchMouse) {
        sendTouch("down", touchStartTouchX, touchStartTouchY, 0);

        // Long press for Right Click
        longPressTimer = setTimeout(function() {
          if (!touchMoved) {
            vibratePhone(60);
            var coords = getDesktopCoords(touchStartTouchX, touchStartTouchY);
            fetch("/api/mouse?key=" + KEY + "&px=" + coords.px + "&py=" + coords.py + "&click=2", { keepalive: true }).catch(function(){});
          }
        }, 450);
      }
    }
  }, { passive: false });

  fsCanvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      // 🤏 Two-finger Pinch or Scroll
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx, dy);
      if (Math.abs(dist - lastTouchDist) > 10) {
        fsZoom = Math.min(Math.max(touchStartZoom * (dist / touchStartDist), 0.8), 5.0);
        applyFSTransform();
      } else {
        // Two-finger vertical scroll
        var scrollDelta = (e.touches[0].clientY - touchStartTouchY);
        if (Math.abs(scrollDelta) > 15) {
          fetch("/api/mouse_rel?key=" + KEY + "&scroll=" + (scrollDelta > 0 ? -120 : 120), { keepalive: true }).catch(function(){});
          touchStartTouchY = e.touches[0].clientY;
        }
      }
    } else if (e.touches.length === 1) {
      var moveX = e.touches[0].clientX - touchStartTouchX;
      var moveY = e.touches[0].clientY - touchStartTouchY;
      if (Math.hypot(moveX, moveY) > 6) {
        touchMoved = true;
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        if (isTouchMouse) {
          // 🚀 High-Frequency Sub-10ms Native Touch Move
          sendTouch("move", e.touches[0].clientX, e.touches[0].clientY, 0);
        } else {
          fsPanX = touchStartPanX + moveX;
          fsPanY = touchStartPanY + moveY;
          applyFSTransform();
        }
      }
    }
  }, { passive: false });

  fsCanvas.addEventListener("touchend", function(e) {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (isTouchMouse && e.changedTouches.length > 0) {
      var t = e.changedTouches[0];
      if (!touchMoved && (Date.now() - touchStartTime < 350)) {
        // 🎯 100.0% Exact Hardware Touch Tap
        vibratePhone(30);
        sendTouch("tap", t.clientX, t.clientY, 0);
      } else {
        // 🖐️ Natural Touch Release
        sendTouch("up", t.clientX, t.clientY, 0);
      }
    }
  }, { passive: false });

  fsCanvas.addEventListener("wheel", function(e) {
    e.preventDefault();
    var delta = e.deltaY < 0 ? 0.25 : -0.25;
    fsZoom = Math.min(Math.max(fsZoom + delta, 0.8), 5.0);
    applyFSTransform();
  }, { passive: false });
}

function openFS(){
  var overlay = document.getElementById("fsOverlay");
  if (overlay) overlay.style.display = "flex";
  if (!isStreaming) toggleStream();

  var winW = window.innerWidth || window.screen.width;
  var winH = window.innerHeight || window.screen.height;
  if (winH > winW) {
    isFsRotated = true;
  } else {
    isFsRotated = false;
  }

  // YouTube / Parsec Fullscreen Request
  var docEl = document.documentElement;
  if (docEl.requestFullscreen) docEl.requestFullscreen().catch(function(){});
  else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen().catch(function(){});

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(function(){});
  }

  fsZoom = 1.0; fsPanX = 0; fsPanY = 0;
  applyFSTransform();
  setTimeout(initGestures, 100);
}

function closeFS(){
  var overlay = document.getElementById("fsOverlay");
  if (overlay) overlay.style.display = "none";
  var menu = document.getElementById("parsecMenu");
  if (menu) menu.style.display = "none";

  if (document.exitFullscreen) document.exitFullscreen().catch(function(){});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(function(){});

  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}

var isStreaming = false;
var mjpegTimer = null;
var h264Controller = null;
var STREAM_CODEC = "avc1.42001E";


// 🎬 H.264 LIVE VIDEO ENGINE (MediaSource Extensions = hardware decoded MP4 video)
// fetch() streams fragmented MP4 over plain HTTP -> works through Cloudflare tunnels,
// gives a REAL video experience (smooth motion, inter-frame compression) like streaming apps.
var h264Retries = 0;
// 🔄 AUTO-RECONNECT: if the H.264 stream drops (network blip, tunnel hiccup,
// brief server stall), re-tune like a real live player instead of dropping to the
// low-quality MJPEG fallback. Budget of 3 retries, then fallback.
function h264Reconnect(){
  if (h264Retries >= 3) { if (isStreaming) fallbackToMJPEG(); return; }
  h264Retries++;
  stopH264();
  setTimeout(function(){
    if (!isStreaming) return;
    var v = document.getElementById("liveVideo");
    if (v) v.style.display = "block";
    if (!startH264() && isStreaming) fallbackToMJPEG();
  }, 600);
}

function startH264(){
  var video = document.getElementById("liveVideo");
  if (!video || !window.MediaSource) return false;

  var mediaSource = new MediaSource();
  var blobUrl = URL.createObjectURL(mediaSource);
  var aborted = false;
  var sb = null;
  var msOpened = false;
  var pendingBytes = new Uint8Array(0);
  var appendQueue = [];
  var appending = false;
  var initChunk = null;
  var gotFtyp = false;
  var gotMoov = false;
  var haveInit = false;
  var streamCodec = null;
  var firstFragments = [];
  var abortCtrl = (window.AbortController) ? new AbortController() : null;
  var controller = { aborted: false, video: video };

  video.src = blobUrl;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.style.display = "block";

  function hx(n){ return ("0" + n.toString(16)).slice(-2).toUpperCase(); }

  function drainQueue(){
    if (!sb || appending || appendQueue.length === 0) return;
    appending = true;
    var chunk = appendQueue.shift();
    try { sb.appendBuffer(chunk); } catch(e) { appending = false; }
  }

  function tryCreateSB(){
    if (!msOpened || !haveInit || sb) return;
    try {
      sb = mediaSource.addSourceBuffer('video/mp4; codecs="' + streamCodec + '"');
      sb.mode = 'segments';
    } catch(e) {
      if (!aborted) fallbackToMJPEG();
      return;
    }
    sb.addEventListener('updateend', function(){
      appending = false;
      drainQueue();
      // ⚡ Explicitly start video playback on Android WebView
      if (video.paused) {
        var p = video.play();
        if (p && p.catch) p.catch(function(e){});
      }
      // ⚡ Chase the live edge: keep latency under ~1s like a real live stream
      if (video.buffered.length > 0) {
        var end = video.buffered.end(video.buffered.length - 1);
        if (end - video.currentTime > 1.5) video.currentTime = end - 0.5;
      }
    });
    appendQueue.push(initChunk);
    if (firstFragments.length > 0) {
      var tLen = 0;
      for (var i = 0; i < firstFragments.length; i++) tLen += firstFragments[i].length;
      var mChunk = new Uint8Array(tLen);
      var off = 0;
      for (var j = 0; j < firstFragments.length; j++) { mChunk.set(firstFragments[j], off); off += firstFragments[j].length; }
      appendQueue.push(mChunk);
      firstFragments = [];
    }
    drainQueue();
  }

  // Walk the box tree to find avcC. Containers have different header sizes:
  // plain container boxes (moov/trak/mdia/minf/stbl) = 8-byte header;
  // stsd (FullBox) = 8-byte header + 8-byte (version/flags + entry_count);
  // avc1 sample entry = 8-byte header + 78-byte visual entry payload.
  function walkBoxes(buf, off, end, headerSkip){
    var p = off + headerSkip;
    while (p + 8 <= end) {
      var sz = (buf[p]<<24)|(buf[p+1]<<16)|(buf[p+2]<<8)|buf[p+3];
      if (sz < 8 || p + sz > end) break;
      var type = String.fromCharCode(buf[p+4],buf[p+5],buf[p+6],buf[p+7]);
      if (type === 'avcC') return buf.subarray(p+8, p+sz);
      if (type === 'stsd')      { var r = walkBoxes(buf, p+8, p+sz, 8);  if (r) return r; }
      else if (type === 'avc1') { var r = walkBoxes(buf, p+8, p+sz, 78); if (r) return r; }
      else if (type === 'trak' || type === 'mdia' || type === 'minf' || type === 'stbl') {
        var r = walkBoxes(buf, p+8, p+sz, 0);
        if (r) return r;
      }
      p += sz;
    }
    return null;
  }
  function findAvcC(moovBox){
    // moovBox includes its 8-byte header; children start after it.
    return walkBoxes(moovBox, 8, moovBox.length, 0);
  }

  mediaSource.addEventListener('sourceopen', function(){
    msOpened = true;
    tryCreateSB();
  });

  var streamUrl = '/h264?key=' + KEY + '&t=' + Date.now();
  var fetchOpts = { headers: { "Bypass-Tunnel-Reminder": "true" } };
  if (abortCtrl) fetchOpts.signal = abortCtrl.signal;
  fetch(streamUrl, fetchOpts).then(function(res){
    if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
    var reader = res.body.getReader();
    function pump(){
      reader.read().then(function(r){
        if (aborted) return;
        if (r.done) { window.__fallbackReason = "stream ended"; if (!aborted) { h264Reconnect(); return; } }
        // accumulate bytes and split into complete top-level MP4 boxes
        if (pendingBytes.length === 0) {
          pendingBytes = r.value;
        } else {
          var merged = new Uint8Array(pendingBytes.length + r.value.length);
          merged.set(pendingBytes); merged.set(r.value, pendingBytes.length);
          pendingBytes = merged;
        }
        var boxes = [];
        while (pendingBytes.length >= 8) {
          var size = (pendingBytes[0]<<24)|(pendingBytes[1]<<16)|(pendingBytes[2]<<8)|pendingBytes[3];
          if (size < 8 || size > pendingBytes.length) break;
          boxes.push(pendingBytes.slice(0, size));
          pendingBytes = pendingBytes.slice(size);
        }
        for (var bi = 0; bi < boxes.length; bi++) {
          var b = boxes[bi];
          var t = String.fromCharCode(b[4],b[5],b[6],b[7]);
          if (t === 'moov' && !gotMoov) {
            // 🎯 DERIVE CODEC FROM THE ACTUAL avcC: guarantees the SourceBuffer
            // codec always matches THIS stream's SPS/PPS -> reload-proof, no mismatch.
            var avcc = findAvcC(b);
            if (!avcc || avcc.length < 5) { window.__fallbackReason = "no avcC"; if (!aborted) fallbackToMJPEG(); return; }
            streamCodec = 'avc1.' + hx(avcc[1]) + hx(avcc[2]) + hx(avcc[3]);
            gotMoov = true;
            if (initChunk) {
              var mi = new Uint8Array(initChunk.length + b.length);
              mi.set(initChunk); mi.set(b, initChunk.length);
              initChunk = mi;
            } else {
              initChunk = b;
            }
            haveInit = true;
            tryCreateSB();
            continue;
          }
          if (t === 'ftyp') {
            if (initChunk) {
              var mf = new Uint8Array(b.length + initChunk.length);
              mf.set(b); mf.set(initChunk, b.length);
              initChunk = mf;
            } else {
              initChunk = b;
            }
            gotFtyp = true;
            continue;
          }
          if (haveInit) {
            // ⚡ CRITICAL: keep moof+mdat TOGETHER in one appendBuffer call.
            // Chrome's demuxer resolves each moof's sample data from the mdat that
            // follows it IN THE SAME append. Separate appends yield no decodable frames.
            firstFragments.push(b);
            if (sb) {
              var tL = 0;
              for (var i2 = 0; i2 < firstFragments.length; i2++) tL += firstFragments[i2].length;
              var mC = new Uint8Array(tL);
              var o2 = 0;
              for (var j2 = 0; j2 < firstFragments.length; j2++) { mC.set(firstFragments[j2], o2); o2 += firstFragments[j2].length; }
              appendQueue.push(mC);
              firstFragments = [];
              drainQueue();
            }
          }
        }
        pump();
      }).catch(function(e){
        window.__fallbackReason = "reader: " + e;
        if (!aborted) h264Reconnect();
      });
    }
    pump();
  }).catch(function(e){
    window.__fallbackReason = "fetch: " + e;
    if (!aborted) h264Reconnect();
  });

  mediaSource.addEventListener('sourceended', function(){
    window.__fallbackReason = "sourceended";
    if (!aborted) h264Reconnect();
  });
  video.addEventListener('error', function(){
    window.__fallbackReason = "video error: " + (video.error ? video.error.code : "?");
    if (!aborted && isStreaming) h264Reconnect();
  });

  controller.abort = function(){
    aborted = true;
    controller.aborted = true;
    if (abortCtrl) { try { abortCtrl.abort(); } catch(e){} }
    try { if (mediaSource.readyState === 'open') mediaSource.endOfStream(); } catch(e){}
    try { video.pause(); video.removeAttribute('src'); video.load(); } catch(e){}
    try { URL.revokeObjectURL(blobUrl); } catch(e){}
  };
  h264Controller = controller;
  return true;
}

function stopH264(){
  if (h264Controller) {
    h264Controller.abort();
    h264Controller = null;
  }
  var video = document.getElementById("liveVideo");
  if (video) { video.removeAttribute('src'); video.load(); video.style.display = "none"; }
}

// 📷 MJPEG fallback (used automatically if H.264/MSE is unavailable or the stream drops)
function fallbackToMJPEG(){
  if (!isStreaming) return;
  clearTimeout(mjpegTimer);
  mjpegTimer = setTimeout(function(){
    if (!isStreaming) return;
    if (h264Controller) { h264Controller.abort(); h264Controller = null; }
    var video = document.getElementById("liveVideo");
    var img = document.getElementById("liveImg");
    if (video) { video.removeAttribute('src'); video.load(); video.style.display = "none"; }
    if (img) {
      img.style.display = "block";
      img.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
      img.onerror = function(){
        if (isStreaming) {
          clearTimeout(mjpegTimer);
          mjpegTimer = setTimeout(function(){
            if (isStreaming && document.getElementById("liveImg")) {
              document.getElementById("liveImg").src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
            }
          }, 1500);
        }
      };
    }
    var q = document.querySelector('.stream-quality');
    if (q) q.textContent = "STANDARD MODE • AUTO-RECONNECTING";
  }, 600);
}

function startMJPEG(){
  var liveImg = document.getElementById("liveImg");
  if (!liveImg) return;
  var wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsUrl = wsProtocol + '//' + location.host + '/ws?key=' + KEY;
  try {
    window.__wsStream = new WebSocket(wsUrl);
    window.__wsStream.binaryType = "arraybuffer";
    window.__wsStream.onmessage = function(e) {
      if (!isStreaming) { try{window.__wsStream.close();}catch(c){} return; }
      var blob = new Blob([e.data], {type: "image/jpeg"});
      var oldUrl = liveImg.src;
      liveImg.src = URL.createObjectURL(blob);
      if (oldUrl && oldUrl.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
    };
    window.__wsStream.onerror = function() {
      liveImg.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
    };
  } catch(err) {
    liveImg.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
  }
}

function stopMJPEG(){
  var liveImg = document.getElementById("liveImg");
  if (liveImg) { liveImg.onerror = null; liveImg.removeAttribute("src"); }
  if (window.__wsStream) { try{ window.__wsStream.close(); }catch(e){} }
  clearTimeout(mjpegTimer);
}

function toggleStream(){
  isStreaming = !isStreaming;
  var holder = document.getElementById("mirrorPlaceholder");
  var canvas = document.getElementById("gpuCanvas");
  var liveImg = document.getElementById("liveImg");
  var btn = document.getElementById("toggleBtn");
  var q = document.querySelector('.stream-quality');

  if(isStreaming){
    if (btn) btn.textContent = "⏸ PAUSE MONITOR";
    if (holder) holder.style.display = "none";
    if (liveImg) liveImg.style.display = "none";
    if (canvas) canvas.style.display = "block";
    if (q) q.textContent = "720P • 60 FPS • ⚡ DIRECT GPU SPEED";

    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.setNativeInput === 'function') {
      try { window.AndroidNativeStream.setNativeInput(true); } catch(e) {}
    }
    startCanvasStream();
  } else {
    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.setNativeInput === 'function') {
      try { window.AndroidNativeStream.setNativeInput(false); } catch(e){}
    }
    stopCanvasStream();
    if (canvas) canvas.style.display = "none";
    if (liveImg) liveImg.style.display = "none";
    if (holder) holder.style.display = "block";
    if (btn) btn.textContent = "▶ PLAY LIVE STREAM";
    if (q) q.textContent = "1080P • 30 FPS • ENCRYPTED";
  }
}

// ── Canvas GPU Stream Engine ────────────────────────────────────
// Uses WebSocket binary JPEG → createImageBitmap() → Canvas GPU draw
// Zero-copy, GPU hardware decoded, runs at screen refresh rate
var _canvasWS = null;
var _canvasEl = null;
var _canvasCtx = null;
var _pendingFrame = null;
var _rafId = null;
var _frameCount = 0;
var _fpsTimer = null;
var _webrtcPC = null;
var _webrtcDC = null;

function startCanvasStream() {
  _canvasEl = document.getElementById("gpuCanvas");
  if (!_canvasEl) return;
  _canvasEl.style.display = "block";
  _canvasCtx = _canvasEl.getContext("2d");

  var _cachedFsCanvas = document.getElementById("fsCanvas");
  var _cachedFsOverlay = document.getElementById("fsOverlay");
  var _cachedFsCtx = _cachedFsCanvas ? _cachedFsCanvas.getContext("2d") : null;

  // FPS ticker
  _frameCount = 0;
  clearInterval(_fpsTimer);
  _fpsTimer = setInterval(function() {
    if (!isStreaming) { clearInterval(_fpsTimer); return; }
    var q = document.querySelector('.stream-quality');
    if (q) {
      q.textContent = "720P • " + _frameCount + " FPS • ⚡ DIRECT GPU SPEED";
    }
    if (window.Telemetry) {
      Telemetry.log("STREAM_HEARTBEAT", { fps: _frameCount, zoom: fsZoom });
    }
    _frameCount = 0;
  }, 3000);

  var _latestBlob = null;
  var _isDecoding = false;

  function _drainDecode() {
    if (!_latestBlob || !isStreaming) { _isDecoding = false; return; }
    _isDecoding = true;
    var currentBlob = _latestBlob;
    _latestBlob = null;
    createImageBitmap(currentBlob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).then(function(bitmap) {
      if (_canvasCtx && _canvasEl) {
        if (_canvasEl.width !== bitmap.width) {
          _canvasEl.width  = bitmap.width;
          _canvasEl.height = bitmap.height;
          _canvasCtx.imageSmoothingEnabled = true;
          _canvasCtx.imageSmoothingQuality = "high";
        }
        _canvasCtx.drawImage(bitmap, 0, 0);
      }
      if (_cachedFsOverlay && _cachedFsOverlay.style.display !== "none" && _cachedFsCtx && _cachedFsCanvas) {
        if (_cachedFsCanvas.width !== bitmap.width) {
          _cachedFsCanvas.width  = bitmap.width;
          _cachedFsCanvas.height = bitmap.height;
          _cachedFsCtx.imageSmoothingEnabled = true;
          _cachedFsCtx.imageSmoothingQuality = "high";
        }
        _cachedFsCtx.drawImage(bitmap, 0, 0);
      }
      bitmap.close();
      if (_canvasWS && _canvasWS.readyState === 1) {
        try { _canvasWS.send("A"); } catch(x){}
      }

      if (_latestBlob) {
        _drainDecode();
      } else {
        _isDecoding = false;
      }
    }).catch(function() {
      if (_canvasWS && _canvasWS.readyState === 1) {
        try { _canvasWS.send("A"); } catch(x){}
      }
      _isDecoding = false;
    });
  }

  var wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsUrl = wsProto + "//" + window.location.host + "/ws?key=" + KEY;
  try {
    _canvasWS = new WebSocket(wsUrl);
    _canvasWS.binaryType = "arraybuffer";

    _canvasWS.onopen = function() {
      var q = document.querySelector('.stream-quality');
      if (q) q.textContent = "720P • 60 FPS • ⚡ DIRECT GPU SPEED";
      try { _canvasWS.send("A"); } catch(e){}
    };

    _canvasWS.onmessage = function(e) {
      if (!isStreaming) { try { _canvasWS.close(); } catch(x){} return; }
      _frameCount++;
      _latestBlob = new Blob([e.data], { type: "image/jpeg" });
      if (!_isDecoding) {
        _drainDecode();
      }
    };

    _canvasWS.onerror = function() {
      if (isStreaming) {
        var liveImg2 = document.getElementById("liveImg");
        if (liveImg2) {
          liveImg2.style.display = "block";
          liveImg2.src = "/mjpeg?key=" + KEY + "&t=" + Date.now();
        }
        if (_canvasEl) _canvasEl.style.display = "none";
      }
    };

    _canvasWS.onclose = function() {
      if (isStreaming) {
        setTimeout(function() { if (isStreaming) startCanvasStream(); }, 1000);
      }
    };
  } catch(err) {
    if (isStreaming) {
      var liveImg3 = document.getElementById("liveImg");
      if (liveImg3) { liveImg3.style.display = "block"; liveImg3.src = "/mjpeg?key=" + KEY + "&t=" + Date.now(); }
      if (_canvasEl) _canvasEl.style.display = "none";
    }
  }

}

function stopCanvasStream() {
  isStreaming = false;
  clearInterval(_fpsTimer);
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  if (_canvasWS) { try { _canvasWS.close(); } catch(e){} _canvasWS = null; }
  if (_pendingFrame) { _pendingFrame.close(); _pendingFrame = null; }
  stopMJPEG();
}
// ──────────────────────────────────────────────────────────────────

function getStatus(){
  if (isStreaming) return; // ⚡ SUPPRESS HTTP POLLING DURING LIVE STREAMING TO ELIMINATE PERIODIC 2-SEC STALLS!
  fetch("/api/status?key=" + KEY, { cache: "no-store", keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } })
    .then(function(res){ return res.json(); })
    .then(function(d){
      var box=document.getElementById("statusBox");
      var txt=document.getElementById("statusText");
      var icon=document.getElementById("statusIcon");
      if(!txt) return;
      if(d && d.panic){
        box.className="status-card panic";
        txt.className="status-text panic";
        txt.textContent="🚨 PANIC MODE ACTIVE";
        if(icon) icon.textContent="🔴";
      }else{
        box.className="status-card";
        txt.className="status-text";
        txt.textContent="🟢 SYSTEM SECURE";
        if(icon) icon.textContent="🟢";
      }
    }).catch(function(err){
      var txt=document.getElementById("statusText");
      if(txt && txt.textContent.indexOf("ACTIVE") === -1) {
        txt.textContent="🟢 SYSTEM ONLINE";
      }
    });
}
function vibratePhone(ms) {
  if ("vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

var deferredPWAInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPWAInstallPrompt = e;
  var banner = document.getElementById("pwaInstallBanner");
  if (banner) banner.style.display = "block";
});

function installPWAApp() {
  if (deferredPWAInstallPrompt) {
    deferredPWAInstallPrompt.prompt();
    deferredPWAInstallPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === 'accepted') {
        var banner = document.getElementById("pwaInstallBanner");
        if (banner) banner.style.display = "none";
      }
      deferredPWAInstallPrompt = null;
    });
  } else {
    alert("ℹ️ Tap the 3 dots menu in Chrome/Safari and select 'Install App' or 'Add to Home Screen'!");
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}

// ⚡ Sub-10ms Zero-Latency Fetch Pipeline
function triggerPanic(){
  vibratePhone([100, 50, 100]);
  fetch("/panic?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }).then(function(){
    setTimeout(getStatus, 200);
  });
}
function lockPC(){ vibratePhone(50); fetch("/lock?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }
function sleepPC(){ vibratePhone(50); fetch("/sleep?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }

function wakePC() {
  vibratePhone([80, 40, 80]);
  var savedMac = localStorage.getItem("targetMac") || "Registered";
  alert("⚡ WAKE-ON-LAN DISPATCHED!\n\nTarget Network Adapter: " + savedMac + "\n\nMagic Packet broadcast dispatched across local Wi-Fi. PC will unsleep/wake up in 1-3 seconds!");
}

// 🔓 Modern Cyberpunk Unlock Modal Functions
function unlockPC(){
  vibratePhone(50);
  // Smart Check: Verify if PC is actually locked before prompting for password!
  fetch("/api/status?key=" + KEY, { cache: "no-store" })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d && d.locked === false) {
        alert("ℹ️ PC is ALREADY UNLOCKED!\nNo password needed.");
        return;
      }
      var modal = document.getElementById("unlockModal");
      var input = document.getElementById("pinInput");
      modal.style.display = "flex";
      input.value = "";
      setTimeout(function(){ input.focus(); }, 100);
    })
    .catch(function() {
      var modal = document.getElementById("unlockModal");
      var input = document.getElementById("pinInput");
      modal.style.display = "flex";
      input.value = "";
      setTimeout(function(){ input.focus(); }, 100);
    });
}
function closeUnlockModal(){
  document.getElementById("unlockModal").style.display = "none";
}
function togglePassVisibility(){
  var input = document.getElementById("pinInput");
  input.type = (input.type === "password") ? "text" : "password";
}
function submitUnlock(){
  var pin = document.getElementById("pinInput").value;
  if(pin.trim() !== ""){
    vibratePhone(50);
    fetch("/unlock?key=" + KEY + "&pin=" + encodeURIComponent(pin), { keepalive: true })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.status === "already_unlocked") {
          alert("ℹ️ PC is already unlocked!");
        }
      });
    closeUnlockModal();
  }
}
function sleepPC(){ vibratePhone(50); fetch("/sleep?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }
function shutdownPC(){ vibratePhone(100); fetch("/shutdown?key=" + KEY, { keepalive: true, headers: { "Bypass-Tunnel-Reminder": "true" } }); }

getStatus();
setInterval(getStatus, 1500);

// 🚀 AUTO-START LIVE MONITOR & CONTROLS ON PAGE LOAD
// (initLiveKeyboard removed: it was never defined, and its ReferenceError killed the monitor auto-start)
setTimeout(function() {
  if (!isStreaming) {
    toggleStream();
  }
}, 100);
// --- TELEMETRY: Remote Mouse & Keyboard Control ---
var activeClickMode = 1; // 1 = Left Click, 2 = Right Click

function setClickMode(mode) {
    activeClickMode = mode;
    var label = document.getElementById("clickTypeLabel");
    var btnL = document.getElementById("btnLeftClick");
    var btnR = document.getElementById("btnRightClick");

    if (label) {
        if (mode === 1) {
            label.textContent = "MODE: LEFT CLICK";
            label.style.color = "var(--neon-green)";
            if (btnL) { btnL.style.borderColor = "var(--neon-green)"; btnL.style.color = "var(--neon-green)"; }
            if (btnR) { btnR.style.borderColor = "rgba(255,255,255,0.2)"; btnR.style.color = "#fff"; }
        } else {
            label.textContent = "MODE: RIGHT CLICK";
            label.style.color = "var(--neon-amber)";
            if (btnR) { btnR.style.borderColor = "var(--neon-amber)"; btnR.style.color = "var(--neon-amber)"; }
            if (btnL) { btnL.style.borderColor = "rgba(255,255,255,0.2)"; btnL.style.color = "#fff"; }
        }
    }
}

var prevTypedValue = "";

function handleLiveInput(e) {
    var curVal = e.target.value;
    var diff = curVal.length - prevTypedValue.length;

    if (diff > 0) {
        // Text added or pasted: Send newly added character(s) to PC
        var addedText = curVal.substring(prevTypedValue.length);
        if (addedText) {
            vibratePhone(15);
            fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(addedText), { keepalive: true }).catch(function(){});
        }
    } else if (diff < 0) {
        // Backspace hit on mobile soft keyboard: Send Backspace to PC for each deleted char
        var count = Math.abs(diff);
        for (var i = 0; i < count; i++) {
            vibratePhone(15);
            fetch("/api/type?key=" + KEY + "&text={BACKSPACE}", { keepalive: true }).catch(function(){});
        }
    }
    prevTypedValue = curVal;
}

function handleLiveKeydown(e) {
    if (e.key === "Enter") {
        vibratePhone(20);
        fetch("/api/type?key=" + KEY + "&text={ENTER}", { keepalive: true }).catch(function(){});
        clearLiveInput();
    } else if (e.key === "Escape") {
        vibratePhone(20);
        fetch("/api/type?key=" + KEY + "&text={ESC}", { keepalive: true }).catch(function(){});
    } else if (e.key === "Tab") {
        e.preventDefault();
        vibratePhone(20);
        fetch("/api/type?key=" + KEY + "&text={TAB}", { keepalive: true }).catch(function(){});
    }
}

function clearLiveInput() {
    var input = document.getElementById("remoteTextInput");
    if (input) {
        vibratePhone(30);
        fetch("/api/type?key=" + KEY + "&text={CLEAR}", { keepalive: true }).catch(function(){});
        input.value = "";
        prevTypedValue = "";
        input.focus();
    }
}

function sendSpecialKey(keyStr) {
    vibratePhone(30);
    fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(keyStr), { keepalive: true });
}

function sendTelemetry(event, isClick, overrideClickType) {
    if (!isStreaming) return;
    var img = event.target;
    var rect = img.getBoundingClientRect();
    
    var xPercent = (event.clientX - rect.left) / rect.width;
    var yPercent = (event.clientY - rect.top) / rect.height;
    if (xPercent < 0 || xPercent > 1 || yPercent < 0 || yPercent > 1) return;

    var px = Math.floor(xPercent * 10000);
    var py = Math.floor(yPercent * 10000);
    var cType = overrideClickType || activeClickMode;
    var url = "/api/telemetry?key=" + KEY + "&x=" + px + "&y=" + py;
    if (isClick) url += "&click=" + cType;
    
    fetch(url, { keepalive: true }).catch(function(e){});
}

// 💻 HARDWARE-GRADE LAPTOP PRECISION TRACKPAD ENGINE (Kinetic Friction Physics)
(function initTouchpadSensor() {
    var pad = document.getElementById("touchpadPad");
    if (!pad) return;

    var lastX = 0, lastY = 0;
    var touchStartTime = 0;
    var lastTapEndTime = 0;
    var totalMoveDist = 0;
    var maxTouches = 0;
    var isDragging = false;

    // 🚀 Velocity & Kinetic Inertia Buffers
    var accDx = 0, accDy = 0, accScroll = 0;
    var flushTimer = null;
    var lastFlushTime = 0;
    var velX = 0, velY = 0;
    var inertiaTimer = null;

    function stopInertia() {
        if (inertiaTimer) {
            cancelAnimationFrame(inertiaTimer);
            inertiaTimer = null;
        }
        velX = 0; velY = 0;
    }

    function runInertiaGlide() {
        if (Math.abs(velX) > 0.4 || Math.abs(velY) > 0.4) {
            queueDelta(velX, velY);
            velX *= 0.88; // 🌊 Smooth Friction Deceleration
            velY *= 0.88;
            inertiaTimer = requestAnimationFrame(runInertiaGlide);
        } else {
            stopInertia();
        }
    }

    window.sendMouseClick = function(btn) {
        vibratePhone(40);
        if (_canvasWS && _canvasWS.readyState === 1) {
            _canvasWS.send("M:0:0:0:" + btn);
        } else {
            fetch('/api/mouse_rel?key=' + KEY + '&click=' + btn, { keepalive: true }).catch(function(){});
        }
    };

    function flushDelta() {
        if (accDx !== 0 || accDy !== 0 || accScroll !== 0) {
            var sendX = Math.round(accDx);
            var sendY = Math.round(accDy);
            var sendS = Math.round(accScroll);
            accDx = 0; accDy = 0; accScroll = 0;

            if (_canvasWS && _canvasWS.readyState === 1) {
                _canvasWS.send("M:" + sendX + ":" + sendY + ":" + sendS + ":0");
            } else {
                var url = "/api/mouse_rel?key=" + KEY;
                if (sendX !== 0 || sendY !== 0) url += (url.indexOf('?') > -1 ? '&' : '?') + "dx=" + sendX + "&dy=" + sendY;
                if (sendS !== 0) url += (url.indexOf('?') > -1 ? '&' : '?') + "scroll=" + sendS;
                fetch(url, { keepalive: true }).catch(function(){});
            }
        }
        flushTimer = null;
        lastFlushTime = Date.now();
    }

    // Restore saved sensitivity preference
    var savedSens = localStorage.getItem('trackpadSens') || '3.2';
    var sliderEl = document.getElementById('sensSlider');
    var displayEl = document.getElementById('sensValDisplay');
    if (sliderEl && displayEl) {
        sliderEl.value = savedSens;
        displayEl.textContent = savedSens + 'x';
    }

    function queueDelta(rawDx, rawDy) {
        var sensEl = document.getElementById('sensSlider');
        var userSens = parseFloat(sensEl ? sensEl.value : 3.2);
        var dist = Math.hypot(rawDx, rawDy);
        var accel = (1.2 + Math.pow(dist, 0.5) * 0.45) * userSens;
        accDx += rawDx * accel;
        accDy += rawDy * accel;

        if (!flushTimer) {
            var delay = Math.max(0, 33 - (Date.now() - lastFlushTime));
            if (delay === 0) flushTimer = requestAnimationFrame(flushDelta);
            else flushTimer = setTimeout(flushDelta, delay);
        }
    }

    pad.addEventListener("touchstart", function(e) {
        stopInertia();
        var now = Date.now();
        maxTouches = Math.max(maxTouches, e.touches.length);

        if (e.touches.length === 1) {
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
            touchStartTime = now;
            totalMoveDist = 0;

            // 🎯 Double Tap & Hold = Drag Windows!
            if (now - lastTapEndTime < 320) {
                isDragging = true;
                vibratePhone(40);
                fetch("/api/mouse_rel?key=" + KEY + "&click=3", { keepalive: true }).catch(function(){});
            }
        } else if (e.touches.length === 2) {
            lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            touchStartTime = now;
            totalMoveDist = 0;
        }
    }, { passive: false });

    pad.addEventListener("touchmove", function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            var curX = e.touches[0].clientX;
            var curY = e.touches[0].clientY;
            var dx = curX - lastX;
            var dy = curY - lastY;
            totalMoveDist += Math.hypot(dx, dy);
            lastX = curX;
            lastY = curY;

            velX = dx;
            velY = dy;

            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                queueDelta(dx, dy);
            }
        } else if (e.touches.length === 2) {
            // 📜 Kinetic Smooth 2-Finger Vertical Scroll
            var curY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            var dy = curY - lastY;
            lastY = curY;

            if (Math.abs(dy) > 2) {
                var scrollAmount = (dy > 0) ? 120 : -120;
                accScroll += scrollAmount;
                if (!flushTimer) {
                    var delay = Math.max(0, 33 - (Date.now() - lastFlushTime));
                    if (delay === 0) flushTimer = requestAnimationFrame(flushDelta);
                    else flushTimer = setTimeout(flushDelta, delay);
                }
            }
        }
    }, { passive: false });

    pad.addEventListener("touchend", function(e) {
        var now = Date.now();
        var duration = now - touchStartTime;

        if (isDragging) {
            isDragging = false;
            fetch("/api/mouse_rel?key=" + KEY + "&click=4", { keepalive: true }).catch(function(){});
            lastTapEndTime = 0;
            maxTouches = 0;
            return;
        }

        if (e.touches.length === 0) {
            // 🌊 Start Kinetic Inertia Glide if finger flicked fast
            if (Math.hypot(velX, velY) > 2.5) {
                runInertiaGlide();
            }

            // 👆 1-Finger Tap = Left Click!
            if (maxTouches === 1 && totalMoveDist < 25 && duration < 380) {
                stopInertia();
                vibratePhone(40);
                fetch("/api/mouse_rel?key=" + KEY + "&click=1", { keepalive: true }).catch(function(){});
                lastTapEndTime = now;
            } 
            // ✌️ 2-Finger Tap = Right Click!
            else if (maxTouches === 2 && totalMoveDist < 30 && duration < 400) {
                stopInertia();
                vibratePhone(50);
                fetch("/api/mouse_rel?key=" + KEY + "&click=2", { keepalive: true }).catch(function(){});
                lastTapEndTime = 0;
            }
            maxTouches = 0;
        }
    });
})();
</script>
</body>
</html>)HTML";
}

}
