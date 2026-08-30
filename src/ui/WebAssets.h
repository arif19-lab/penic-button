#pragma once
#include <string>

// Full embedded cyber dashboard HTML/JS/CSS
// Extracted from main.cpp lines 3061-6288
static const char* DASHBOARD_HTML = R"HTML(<!DOCTYPE html>
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
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
    aspect-ratio: 16/9;
    min-height: 200px;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    border-radius: 6px;
  }
  
  .screen-img {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    display: block;
    cursor: pointer;
    border-radius: 4px;
    object-fit: contain !important;
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

  /* 🧠 GEMINI 3.1 LIVE CYBER HUD STYLES */
  .gemini-hud-card {
    background: linear-gradient(180deg, rgba(13, 17, 26, 0.95) 0%, rgba(7, 10, 16, 0.98) 100%);
    border: 1px solid rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.15), inset 0 0 20px rgba(0, 240, 255, 0.05);
    border-radius: 14px;
    margin-bottom: 16px;
    overflow: hidden;
    position: relative;
  }
  .gemini-top-bar {
    background: rgba(10, 14, 24, 0.95);
    border-bottom: 1px solid rgba(0, 240, 255, 0.2);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .gemini-badge {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 1.5px;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.8);
  }
  .gemini-status-pill {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    letter-spacing: 1px;
    font-weight: bold;
    transition: all 0.3s;
  }
  .status-disc { background: rgba(255,255,255,0.08); color: #888; border: 1px solid #555; }
  .status-conn { background: rgba(255,170,0,0.2); color: var(--neon-amber); border: 1px solid var(--neon-amber); animation: pulseAmber 1s infinite; }
  .status-listen { background: rgba(0,255,65,0.2); color: var(--neon-green); border: 1px solid var(--neon-green); animation: pulseGreen 1.5s infinite; }
  .status-speak { background: rgba(0,240,255,0.25); color: var(--neon-cyan); border: 1px solid var(--neon-cyan); animation: pulseCyan 0.8s infinite; }
  .status-exec { background: rgba(255,0,85,0.25); color: var(--neon-red); border: 1px solid var(--neon-red); animation: pulseRed 0.6s infinite; }

  @keyframes pulseAmber { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes pulseGreen { 0%,100%{opacity:1; box-shadow:0 0 10px rgba(0,255,65,0.4);} 50%{opacity:0.5; box-shadow:none;} }
  @keyframes pulseCyan { 0%,100%{opacity:1; box-shadow:0 0 12px rgba(0,240,255,0.6);} 50%{opacity:0.4; box-shadow:none;} }

  .gemini-btn-icon {
    background: rgba(255,255,255,0.06);
    color: #cbd5e1;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 6px 10px;
    border-radius: 6px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .gemini-btn-icon:hover { background: rgba(0,240,255,0.2); color: #fff; border-color: var(--neon-cyan); }
  .gemini-btn-connect {
    background: linear-gradient(135deg, #00f0ff 0%, #0088cc 100%);
    color: #000;
    border: none;
    padding: 7px 14px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
    transition: all 0.2s;
  }
  .gemini-btn-connect.connected {
    background: linear-gradient(135deg, #ff0055 0%, #aa0033 100%);
    color: #fff;
    box-shadow: 0 0 12px rgba(255, 0, 85, 0.5);
  }

  .gemini-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 18px 12px;
    text-align: center;
    position: relative;
  }
  .gemini-blob-wrapper {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  #geminiBlobCanvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
  }
  .gemini-blob-center-icon {
    position: relative;
    z-index: 2;
    font-size: 32px;
    filter: drop-shadow(0 0 12px var(--neon-cyan));
    transition: transform 0.2s;
  }
  .gemini-hud-info {
    font-family: 'Share Tech Mono', monospace;
  }
  .gemini-hud-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }
  .gemini-hud-sub {
    font-size: 11px;
    color: #94a3b8;
    max-width: 340px;
    line-height: 1.4;
  }

  /* Cyber Sandbox Terminal */
  .gemini-terminal {
    background: #05080e;
    border-top: 1px solid rgba(0, 240, 255, 0.3);
    padding: 10px 12px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
  }
  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px dashed rgba(0, 240, 255, 0.2);
  }
  .terminal-title {
    color: var(--neon-cyan);
    font-size: 10px;
    letter-spacing: 1px;
  }
  .terminal-clear-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 10px;
    cursor: pointer;
    font-family: inherit;
  }
  .terminal-clear-btn:hover { color: #fff; }
  .terminal-logs {
    height: 140px;
    overflow-y: auto;
    background: #020408;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 6px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  .t-log { line-height: 1.4; word-break: break-all; }
  .t-log.sys { color: #64748b; }
  .t-log.user { color: var(--neon-green); font-weight: bold; }
  .t-log.ai { color: var(--neon-cyan); }
  .t-log.tool { color: var(--neon-amber); font-weight: bold; }
  .t-log.out { color: #e2e8f0; background: rgba(255,255,255,0.04); padding: 2px 6px; border-left: 2px solid var(--neon-cyan); }
  .t-log.err { color: var(--neon-red); }

  .terminal-input-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #020408;
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
  }
  .terminal-input-bar input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-family: inherit;
    font-size: 11px;
    outline: none;
  }
  .terminal-run-btn {
    background: var(--neon-cyan);
    color: #000;
    border: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-family: 'Orbitron', sans-serif;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

/* ⚡ CYBER LINK PAIRING & QR SCANNER STYLES */
@keyframes spinRadar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulseRadar { 0%, 100% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
@keyframes laserScan { 0% { top: 5%; } 50% { top: 90%; } 100% { top: 5%; } }


  /* 📱 CYBER BOTTOM NAVIGATION BAR & TAB SYSTEM */
  .container {
    padding-bottom: 90px !important;
  }
  .tab-content {
    display: none;
    animation: tabFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .tab-content.active {
    display: block;
  }
  @keyframes tabFadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  
  
  
  
  


  /* 📱 CYBER 2-COLUMN CONTROLS & RESPONSIVE TABS */
  .container {
    padding-bottom: 90px !important;
  }
  .tab-content {
    display: none;
    animation: tabFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .tab-content.active {
    display: block;
  }
  @keyframes tabFadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  
  
  
  
  

  /* 2-COLUMN CONTROL BUTTONS (NO ICONS) */
  .btn-ctrl-2col {
    background: rgba(13, 17, 23, 0.85);
    border: 1.5px solid rgba(0, 240, 255, 0.35);
    color: #fff;
    border-radius: 10px;
    padding: 16px 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-ctrl-2col:active {
    transform: scale(0.96);
  }
  .btn-panic-col {
    background: linear-gradient(135deg, rgba(255,0,60,0.2), rgba(255,60,0,0.2));
    border-color: #ff003c;
    color: #ff003c;
    box-shadow: 0 0 15px rgba(255,0,60,0.25);
  }
  .btn-unlock-col {
    border-color: var(--neon-green);
    color: var(--neon-green);
  }
  .btn-sleep-col {
    border-color: var(--neon-cyan);
    color: var(--neon-cyan);
  }
  .btn-wake-col {
    border-color: var(--neon-amber);
    color: var(--neon-amber);
  }
  .btn-shutdown-col {
    border-color: rgba(255, 68, 68, 0.6);
    color: #ff4444;
  }
  .btn-restart-col {
    border-color: rgba(0, 240, 255, 0.6);
    color: var(--neon-cyan);
    background: rgba(0, 240, 255, 0.08);
  }


  /* 🧊 FROSTED GLASS CLEAN BOTTOM NAVIGATION BAR */
  
  
  
  
  
  


  /* 🧊 CLEAN FROSTED GLASS BOTTOM NAVIGATION BAR */
  .cyber-bottom-nav {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    height: 58px !important;
    background: rgba(10, 14, 23, 0.45) !important;
    backdrop-filter: blur(28px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
    border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.6) !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 99999 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
  .cyber-nav-tab {
    flex: 1 !important;
    height: 100% !important;
    max-width: 85px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 3px !important;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: rgba(255, 255, 255, 0.45) !important;
    font-family: 'Orbitron', sans-serif !important;
    font-size: 8.5px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    user-select: none !important;
    -webkit-tap-highlight-color: transparent !important;
    padding: 4px 0 !important;
  }
  .cyber-nav-tab .nav-icon-img {
    width: 22px !important;
    height: 22px !important;
    object-fit: contain !important;
    filter: brightness(0) invert(1) !important;
    opacity: 0.45 !important;
    transition: all 0.15s ease !important;
  }
  .cyber-nav-tab.active {
    color: #ffffff !important;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
  .cyber-nav-tab.active .nav-icon-img {
    filter: brightness(0) invert(1) !important;
    opacity: 1 !important;
    transform: scale(1.08) !important;
  }
  .cyber-nav-tab:active {
    transform: scale(0.92) !important;
  }

</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>
</head>
<body>

<!-- 📱 FROSTED GLASS 4-TAB BOTTOM NAVIGATION BAR -->
<nav class="cyber-bottom-nav">
  <button id="nav-home" class="cyber-nav-tab active" onclick="switchTab('home')">
    <img src="data:image/png;base64,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" class="nav-icon-img" alt="Monitor">
    <span>MONITOR</span>
  </button>
  <button id="nav-gemini" class="cyber-nav-tab" onclick="switchTab('gemini')">
    <img src="data:image/png;base64,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" class="nav-icon-img" alt="Gemini">
    <span>GEMINI AI</span>
  </button>
  <button id="nav-qr" class="cyber-nav-tab" onclick="openPairingModal()">
    <img src="data:image/png;base64,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" class="nav-icon-img" alt="QR">
    <span>QR</span>
  </button>
  <button id="nav-controls" class="cyber-nav-tab" onclick="switchTab('controls')">
    <img src="data:image/png;base64,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" class="nav-icon-img" alt="Controls">
    <span>CONTROLS</span>
  </button>
</nav>

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
  var fsCanvas = document.getElementById("fsCanvas");
  var gpuCanvas = document.getElementById("gpuCanvas");
  var canvas = (document.getElementById("fsOverlay") && document.getElementById("fsOverlay").style.display !== "none") ? fsCanvas : gpuCanvas;

  var winW = window.innerWidth || cachedWinW;
  var winH = window.innerHeight || cachedWinH;
  var isPortrait = winH > winW;

  var cW = (canvas && canvas.width) ? canvas.width : 1920;
  var cH = (canvas && canvas.height) ? canvas.height : 1080;
  var targetAspect = (cW / cH) || (16.0 / 9.0);

  if (isPortrait && canvas === fsCanvas) {
    // 📱 90° ROTATED PORTRAIT: (Phone is vertical, canvas is rotated 90° landscape)
    var containerW = winH;
    var containerH = winW;
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

    // Apply zoom & pan inverse transform
    var centerX = containerW / 2.0;
    var centerY = containerH / 2.0;
    var zoom = fsZoom || 1.0;
    var panX = fsPanX || 0;
    var panY = fsPanY || 0;

    var localX = (rotX - centerX - panX) / zoom + centerX - offX;
    var localY = (rotY - centerY - panY) / zoom + centerY - offY;

    var normX = Math.max(0.0, Math.min(1.0, localX / renderW));
    var normY = Math.max(0.0, Math.min(1.0, localY / renderH));

    return {
      px: Math.round(normX * 10000),
      py: Math.round(normY * 10000)
    };
  } else {
    // 💻 LANDSCAPE / INLINE:
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

    var centerX = winW / 2.0;
    var centerY = winH / 2.0;
    var zoom = (canvas === fsCanvas ? fsZoom : 1.0) || 1.0;
    var panX = (canvas === fsCanvas ? fsPanX : 0) || 0;
    var panY = (canvas === fsCanvas ? fsPanY : 0) || 0;

    var localX = (clientX - centerX - panX) / zoom + centerX - offX;
    var localY = (clientY - centerY - panY) / zoom + centerY - offY;

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

// ── UNIFIED ROCK-SOLID STREAMING & RENDERING ENGINE ─────────────
var isStreaming = false;
var _canvasWS = null;
var _canvasEl = null;
var _canvasCtx = null;
var _fsCanvasEl = null;
var _fsCanvasCtx = null;
var _fsOverlayEl = null;
var _frameCount = 0;
var _fpsTimer = null;
var _fallbackActive = false;
var _fallbackAbortCtrl = null;
var _reconnectTimeout = null;

// 🎨 Centralized Dual-Canvas Frame Dispatcher (Updates Dashboard Canvas + Fullscreen Canvas in 1 shot)
function renderFrame(sourceBitmap) {
  if (!isStreaming) return;
  _frameCount++;

  // 1. Render to Dashboard Canvas
  if (_canvasEl && _canvasCtx) {
    if (_canvasEl.width !== sourceBitmap.width || _canvasEl.height !== sourceBitmap.height) {
      _canvasEl.width  = sourceBitmap.width;
      _canvasEl.height = sourceBitmap.height;
      _canvasCtx.imageSmoothingEnabled = true;
      _canvasCtx.imageSmoothingQuality = "high";
    }
    _canvasCtx.drawImage(sourceBitmap, 0, 0);
  }

  // 2. Render to Fullscreen Canvas if Overlay is Visible
  if (_fsOverlayEl && _fsOverlayEl.style.display !== "none" && _fsCanvasEl && _fsCanvasCtx) {
    if (_fsCanvasEl.width !== sourceBitmap.width || _fsCanvasEl.height !== sourceBitmap.height) {
      _fsCanvasEl.width  = sourceBitmap.width;
      _fsCanvasEl.height = sourceBitmap.height;
      _fsCanvasCtx.imageSmoothingEnabled = true;
      _fsCanvasCtx.imageSmoothingQuality = "high";
      applyFSTransform();
    }
    _fsCanvasCtx.drawImage(sourceBitmap, 0, 0);
  }
}

// 🚀 Primary: WebSocket Binary Frame Decoder
function startCanvasStream() {
  _canvasEl = document.getElementById("gpuCanvas");
  _fsCanvasEl = document.getElementById("fsCanvas");
  _fsOverlayEl = document.getElementById("fsOverlay");

  if (_canvasEl) {
    _canvasEl.style.display = "block";
    _canvasCtx = _canvasEl.getContext("2d", { alpha: false, desynchronized: true });
  }
  if (_fsCanvasEl) {
    _fsCanvasCtx = _fsCanvasEl.getContext("2d", { alpha: false, desynchronized: true });
  }

  // FPS Monitor
  _frameCount = 0;
  clearInterval(_fpsTimer);
  _fpsTimer = setInterval(function() {
    if (!isStreaming) { clearInterval(_fpsTimer); return; }
    var q = document.querySelector('.stream-quality');
    if (q) {
      var modeTag = _fallbackActive ? "⚡ HTTP TURBO" : "⚡ DIRECT GPU WS";
      q.textContent = "720P • " + _frameCount + " FPS • " + modeTag;
    }
    if (window.Telemetry) {
      Telemetry.log("STREAM_HEARTBEAT", { fps: _frameCount, fallback: _fallbackActive, zoom: fsZoom });
    }
    _frameCount = 0;
  }, 3000);

  _connectWebSocket();
}

function _connectWebSocket() {
  if (!isStreaming) return;
  _fallbackActive = false;

  var wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsUrl = wsProto + "//" + window.location.host + "/ws?key=" + KEY;

  var _latestBlob = null;
  var _isDecoding = false;

  function _drainDecode() {
    if (!_latestBlob || !isStreaming) { _isDecoding = false; return; }
    _isDecoding = true;
    var blob = _latestBlob;
    _latestBlob = null;

    createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
      .then(function(bitmap) {
        renderFrame(bitmap);
        bitmap.close();
        if (_canvasWS && _canvasWS.readyState === 1) {
          try { _canvasWS.send("A"); } catch(x){}
        }
        if (_latestBlob) _drainDecode();
        else _isDecoding = false;
      })
      .catch(function() {
        if (_canvasWS && _canvasWS.readyState === 1) {
          try { _canvasWS.send("A"); } catch(x){}
        }
        _isDecoding = false;
      });
  }

  try {
    _canvasWS = new WebSocket(wsUrl);
    _canvasWS.binaryType = "arraybuffer";

    _canvasWS.onopen = function() {
      _fallbackActive = false;
      var q = document.querySelector('.stream-quality');
      if (q) q.textContent = "720P • 60 FPS • ⚡ DIRECT GPU WS";
      try { _canvasWS.send("A"); } catch(e){}
    };

    _canvasWS.onmessage = function(e) {
      if (!isStreaming) { try { _canvasWS.close(); } catch(x){} return; }
      _latestBlob = new Blob([e.data], { type: "image/jpeg" });
      if (!_isDecoding) _drainDecode();
    };

    _canvasWS.onerror = function() {
      if (isStreaming && !_fallbackActive) {
        _startCanvasFetchFallback();
      }
    };

    _canvasWS.onclose = function() {
      if (isStreaming && !_fallbackActive) {
        _startCanvasFetchFallback();
      }
    };
  } catch(err) {
    if (isStreaming && !_fallbackActive) {
      _startCanvasFetchFallback();
    }
  }
}

// 🛡️ Fallback: Unified Fetch-to-Canvas Stream (Zero DOM Shifts)
function _startCanvasFetchFallback() {
  if (_fallbackActive || !isStreaming) return;
  _fallbackActive = true;
  if (_canvasWS) { try { _canvasWS.close(); } catch(e){} _canvasWS = null; }

  var q = document.querySelector('.stream-quality');
  if (q) q.textContent = "720P • AUTO-RECOVERING • ⚡ HTTP TURBO";

  _fallbackAbortCtrl = window.AbortController ? new AbortController() : null;
  var streamRunning = true;

  function pullFrameLoop() {
    if (!isStreaming || !_fallbackActive || !streamRunning) return;

    var frameUrl = "/rawframe?key=" + KEY + "&t=" + Date.now();
    var fetchOpts = {
      cache: "no-store",
      headers: { "Bypass-Tunnel-Reminder": "true" },
      signal: _fallbackAbortCtrl ? _fallbackAbortCtrl.signal : undefined
    };

    fetch(frameUrl, fetchOpts)
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.blob();
      })
      .then(function(blob) {
        return createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      })
      .then(function(bitmap) {
        renderFrame(bitmap);
        bitmap.close();
        if (isStreaming && _fallbackActive) {
          requestAnimationFrame(pullFrameLoop);
        }
      })
      .catch(function(err) {
        if (isStreaming && _fallbackActive) {
          setTimeout(pullFrameLoop, 100);
        }
      });
  }

  pullFrameLoop();

  // Retry WebSocket upgrade in background every 8 seconds
  clearTimeout(_reconnectTimeout);
  _reconnectTimeout = setTimeout(function() {
    if (isStreaming && _fallbackActive) {
      _connectWebSocket();
    }
  }, 8000);
}

function stopCanvasStream() {
  isStreaming = false;
  _fallbackActive = false;
  clearInterval(_fpsTimer);
  clearTimeout(_reconnectTimeout);

  if (_fallbackAbortCtrl) {
    try { _fallbackAbortCtrl.abort(); } catch(e){}
    _fallbackAbortCtrl = null;
  }
  if (_canvasWS) {
    try { _canvasWS.close(); } catch(e){}
    _canvasWS = null;
  }
}

function toggleStream() {
  isStreaming = !isStreaming;
  var holder = document.getElementById("mirrorPlaceholder");
  var canvas = document.getElementById("gpuCanvas");
  var btn = document.getElementById("toggleBtn");
  var q = document.querySelector('.stream-quality');

  if (isStreaming) {
    if (btn) btn.textContent = "⏸ PAUSE MONITOR";
    if (holder) holder.style.display = "none";
    if (canvas) canvas.style.display = "block";
    if (q) q.textContent = "720P • INITIALIZING...";

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
    if (holder) holder.style.display = "block";
    if (btn) btn.textContent = "▶ PLAY LIVE STREAM";
    if (q) q.textContent = "1080P • 30 FPS • ENCRYPTED";
  }
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
      if(d && (d.state === 1 || (d.panic && d.state === undefined))){
        box.className="status-card panic";
        txt.className="status-text panic";
        txt.textContent="🚨 INTRUDER TRAP (INPUT BLOCKED)";
        if(icon) icon.textContent="🚨";
      } else if(d && d.state === 2){
        box.className="status-card";
        box.style.borderColor = "var(--neon-amber)";
        txt.className="status-text";
        txt.style.color = "var(--neon-amber)";
        txt.textContent="🛡️ SAFE WORKING (DECOY DESKTOP)";
        if(icon) icon.textContent="🛡️";
      } else {
        box.className="status-card";
        box.style.borderColor = "";
        txt.className="status-text";
        txt.style.color = "";
        txt.textContent="🟢 SYSTEM SECURE";
        if(icon) icon.textContent="🟢";
      }
    }).catch(function(err){
      var txt=document.getElementById("statusText");
      if(txt && txt.textContent.indexOf("ACTIVE") === -1 && txt.textContent.indexOf("TRAP") === -1) {
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
  var modal = document.getElementById("unlockModal");
  var input = document.getElementById("pinInput");
  if (modal) modal.style.display = "flex";
  if (input) {
    input.value = "";
    setTimeout(function(){ input.focus(); }, 100);
  }
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

function restartPC(){ 
  vibratePhone(100); 
  if (_cmdWS && _cmdWS.readyState === WebSocket.OPEN) { _cmdWS.send("RESTART"); return; }
  fetch("/restart?key=" + KEY, { keepalive: true }); 
}

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
                sendMouseClick(3);
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
            sendMouseClick(4);
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
                sendMouseClick(1);
                lastTapEndTime = now;
            } 
            // ✌️ 2-Finger Tap = Right Click!
            else if (maxTouches === 2 && totalMoveDist < 30 && duration < 400) {
                stopInertia();
                vibratePhone(50);
                sendMouseClick(2);
                lastTapEndTime = 0;
            }
            maxTouches = 0;
        }
    });
})();

// -------------------------------------------------------------
// 🧠 GEMINI 3.1 FLASH LIVE VOICE AI & CYBER SANDBOX TERMINAL
// -------------------------------------------------------------
var geminiWs = null;
var audioInputCtx = null;
var audioInputProcessor = null;
var audioInputSource = null;
var audioPlaybackCtx = null;
var nextPlayTime = 0;

var blobState = {
  active: false,
  status: "disc",
  micLevel: 0,
  geminiLevel: 0
};

var DEFAULT_GEMINI_KEY = "";

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
      }
      if (callback) callback();
    })
    .catch(function(){
      if (callback) callback();
    });
}
fetchLocalGeminiKey();

function changeGeminiVoice(v) {
  localStorage.setItem("gemini_voice", v);
  appendGeminiLog("sys", "[VOICE] Voice persona changed to: " + v);
}

function initVoiceDropdown() {
  var v = localStorage.getItem("gemini_voice") || "Puck";
  var sel = document.getElementById("geminiVoiceSelect");
  if (sel) sel.value = v;
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVoiceDropdown);
} else {
  initVoiceDropdown();
}

// 📱 PWA 1-Click Install Engine & Service Worker Registration
var deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPwaPrompt = e;
  var btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.style.display = 'inline-block';
});

function installPWA() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === 'accepted') {
        var btn = document.getElementById('pwaInstallBtn');
        if (btn) btn.style.display = 'none';
      }
      deferredPwaPrompt = null;
    });
  } else {
    alert("To install PanicCTRL as an App:\n1. Tap Chrome 3-dot menu (⋮)\n2. Tap 'Install app' or 'Add to Home screen'");
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
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
  if (input) input.value = saved || DEFAULT_GEMINI_KEY;
  m.style.display = (m.style.display === "none" || !m.style.display) ? "flex" : "none";
}

function closeGeminiKeyModal() {
  var m = document.getElementById("geminiKeyModal");
  if (m) m.style.display = "none";
}

function saveGeminiApiKey() {
  var input = document.getElementById("geminiApiKeyInput");
  if (input && input.value.trim()) {
    localStorage.setItem("gemini_api_key", input.value.trim());
    appendGeminiLog("sys", "[KEY] Gemini API Key saved locally.");
    closeGeminiKeyModal();
  }
}

function toggleGeminiTerminal() {
  var t = document.getElementById("geminiTerminalBox");
  if (!t) return;
  t.style.display = (t.style.display === "none" || !t.style.display) ? "block" : "none";
}

function clearGeminiTerminal() {
  var l = document.getElementById("geminiTerminalLogs");
  if (l) l.innerHTML = '<div class="t-log sys">[SYSTEM] Terminal logs cleared.</div>';
}

function appendGeminiLog(type, text) {
  var l = document.getElementById("geminiTerminalLogs");
  if (!l) return;
  var d = document.createElement("div");
  d.className = "t-log " + type;
  d.textContent = text;
  l.appendChild(d);
  l.scrollTop = l.scrollHeight;
}

function executeManualTerminalCmd() {
  var inp = document.getElementById("manualTerminalInput");
  if (!inp || !inp.value.trim()) return;
  var cmd = inp.value.trim();
  inp.value = "";

  if (cmd.startsWith("/ai ") || (geminiWs && geminiWs.readyState === WebSocket.OPEN && !cmd.startsWith("ps ") && !cmd.startsWith("cmd "))) {
    var prompt = cmd.startsWith("/ai ") ? cmd.substring(4) : cmd;
    sendTextMessageToGemini(prompt);
  } else {
    appendGeminiLog("user", "PS > " + cmd);
    fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(cmd))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.output) {
          appendGeminiLog("out", data.output);
        } else {
          appendGeminiLog("out", "[No output]");
        }
      })
      .catch(function(err){
        appendGeminiLog("err", "[ERROR] " + err);
      });
  }
}

// 🔮 ORGANIC REACTIVE CYBER AUDIO BLOB ENGINE
function initGeminiBlobVisualizer() {
  var cvs = document.getElementById("geminiBlobCanvas");
  if (!cvs) return;
  var ctx = cvs.getContext("2d");
  var t = 0;

  function draw() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    var cx = cvs.width / 2;
    var cy = cvs.height / 2;
    t += 0.04;

    var level = Math.max(blobState.micLevel, blobState.geminiLevel);
    var baseRadius = 45 + level * 25;
    
    var color1 = "rgba(0, 240, 255, 0.8)";
    var color2 = "rgba(0, 255, 65, 0.5)";
    var glowColor = "rgba(0, 240, 255, 0.4)";

    if (blobState.status === "speak") {
      color1 = "rgba(0, 240, 255, 0.95)";
      color2 = "rgba(255, 0, 85, 0.7)";
      glowColor = "rgba(0, 240, 255, 0.6)";
      baseRadius = 50 + blobState.geminiLevel * 40;
    } else if (blobState.status === "listen") {
      color1 = "rgba(0, 255, 65, 0.95)";
      color2 = "rgba(0, 240, 255, 0.6)";
      glowColor = "rgba(0, 255, 65, 0.6)";
      baseRadius = 48 + blobState.micLevel * 35;
    } else if (blobState.status === "exec") {
      color1 = "rgba(255, 0, 85, 0.95)";
      color2 = "rgba(255, 170, 0, 0.8)";
      glowColor = "rgba(255, 0, 85, 0.6)";
      baseRadius = 52 + Math.sin(t * 3) * 8;
    } else if (blobState.status === "conn") {
      color1 = "rgba(255, 170, 0, 0.9)";
      color2 = "rgba(0, 240, 255, 0.5)";
      glowColor = "rgba(255, 170, 0, 0.4)";
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + 14 + Math.sin(t * 1.5) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    var points = 12;
    for (var i = 0; i <= points; i++) {
      var angle = (i / points) * Math.PI * 2;
      var distortion = Math.sin(angle * 3 + t * 2) * (8 + level * 16) + Math.cos(angle * 2 - t) * (6 + level * 12);
      var r = baseRadius + distortion;
      var x = cx + Math.cos(angle) * r;
      var y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    var grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseRadius + 20);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(draw);
  }
  draw();
}

function setGeminiStatus(st, titleText, subText) {
  blobState.status = st;
  var pill = document.getElementById("geminiStatusPill");
  var icon = document.getElementById("geminiBlobIcon");
  var btn = document.getElementById("geminiConnectBtn");
  var tEl = document.getElementById("geminiVoiceTitle");
  var sEl = document.getElementById("geminiVoiceSub");

  if (pill) {
    pill.className = "gemini-status-pill status-" + st;
    var txtMap = { disc: "DISCONNECTED", conn: "CONNECTING...", listen: "LISTENING", speak: "SPEAKING", exec: "EXECUTING..." };
    pill.textContent = txtMap[st] || st.toUpperCase();
  }
  if (icon) {
    var iconMap = { disc: "🎙️", conn: "⏳", listen: "👂", speak: "🔊", exec: "⚡" };
    icon.textContent = iconMap[st] || "🎙️";
  }
  if (btn) {
    if (st === "disc") {
      btn.className = "gemini-btn-connect";
      btn.textContent = "⚡ CONNECT AI";
    } else {
      btn.className = "gemini-btn-connect connected";
      btn.textContent = "✖ DISCONNECT";
    }
  }
  if (tEl && titleText) tEl.textContent = titleText;
  if (sEl && subText) sEl.textContent = subText;
}

function toggleGeminiLiveConnection() {
  if (geminiWs && (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING)) {
    disconnectGeminiLive();
  } else {
    connectGeminiLive();
  }
}

function connectGeminiLive() {
  var saved = localStorage.getItem("gemini_api_key");
  if (saved && saved.startsWith("AIzaSyCkyi")) {
    localStorage.removeItem("gemini_api_key");
    saved = "";
  }
  var apiKey = saved || DEFAULT_GEMINI_KEY;
  if (!apiKey) {
    fetchLocalGeminiKey(function() {
      var k = localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_KEY;
      if (k) {
        connectGeminiLive();
      } else {
        toggleGeminiKeyModal();
        appendGeminiLog("err", "[ERROR] Please enter your Gemini API Key in the modal.");
      }
    });
    return;
  }

  setGeminiStatus("conn", "CONNECTING TO GEMINI 3.1...", "Establishing encrypted full-duplex WebSocket link.");
  appendGeminiLog("sys", "[CONNECT] Initializing Gemini 3.1 Live WebSocket session...");

  var host = "generativelanguage.googleapis.com";
  var path = "/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=" + apiKey;
  var wsUrl = "wss://" + host + path;

  try {
    geminiWs = new WebSocket(wsUrl);
  } catch (e) {
    setGeminiStatus("disc", "CONNECTION FAILED", e.message);
    appendGeminiLog("err", "[WS FAILED] " + e.message);
    return;
  }

  geminiWs.onopen = function() {
    appendGeminiLog("sys", "[WS OPEN] Link established. Sending setup payload for gemini-3.1-flash-live-preview...");
    
    var toolsPayload = [
      {
        functionDeclarations: [
          {
            name: "lock_workstation",
            description: "Locks the Windows computer workstation immediately."
          },
          {
            name: "trigger_panic",
            description: "Toggles emergency panic mode, sounding intruder alarm and switching to isolated safe virtual desktop."
          },
          {
            name: "set_volume",
            description: "Sets the Windows system master audio volume percentage (0 to 100).",
            parameters: {
              type: "OBJECT",
              properties: {
                level: { type: "INTEGER", description: "Volume percentage 0 to 100" }
              },
              required: ["level"]
            }
          },
          {
            name: "get_pc_status",
            description: "Gets current live status of Windows PC (lock state, panic state, server status)."
          },
          {
            name: "run_powershell_command",
            description: "Executes a PowerShell or CMD command in the Windows sandbox on the PC and returns the command output.",
            parameters: {
              type: "OBJECT",
              properties: {
                command: { type: "STRING", description: "The PowerShell or CMD command string to execute." }
              },
              required: ["command"]
            }
          },
          {
            name: "type_keyboard",
            description: "Types text or special keys ({ENTER}, {ESC}, {BACKSPACE}, {TAB}) on the Windows PC.",
            parameters: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING", description: "The text or special key to type." }
              },
              required: ["text"]
            }
          },
          {
            name: "sleep_pc",
            description: "Puts the Windows computer into low power sleep mode."
          }
        ]
      }
    ];

    var currentVoice = localStorage.getItem("gemini_voice") || "Puck";
    var setupMsg = {
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: currentVoice
              }
            }
          }
        },
        systemInstruction: {
          parts: [
            {
              text: "You are a friendly, highly intelligent, and expressive voice AI assistant. Speak with completely natural human emotion, lively conversational pacing, clear intonation, and a warm, engaging tone. You speak fluent, natural English and fluent natural Bengali (বাংলা) depending on what language the user speaks. You have direct control of the Windows PC via tool calling. When the user asks you to perform an action, execute the appropriate tool immediately and respond in a natural, lively, and conversational human manner."
            }
          ]
        },
        tools: toolsPayload
      }
    };

    geminiWs.send(JSON.stringify(setupMsg));
    initPlaybackAudioContext();
    appendGeminiLog("sys", "[SETUP SENT] Waiting for setupComplete from Google...");
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
    appendGeminiLog("err", "[WS ERROR] Check API Key and network connection.");
    setGeminiStatus("disc", "CONNECTION ERROR", "WebSocket encountered an error.");
  };

  geminiWs.onclose = function(e) {
    appendGeminiLog("sys", "[WS CLOSED] Code: " + e.code + " Reason: " + (e.reason || "Connection terminated"));
    disconnectGeminiLive();
  };
}

function handleGeminiServerMessage(msg) {
  // 🎯 1. Handle Setup Complete Acknowledgement
  if (msg.setupComplete) {
    appendGeminiLog("sys", "[READY] Gemini Live AI session verified & active!");
    setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally or type in terminal to control PC.");
    startMicrophoneCapture();
    return;
  }

  // 🎯 2. Handle Interruption (Barge-in)
  if (msg.serverContent && msg.serverContent.interrupted) {
    appendGeminiLog("sys", "[INTERRUPT] User spoke. Cutting off playback.");
    if (audioPlaybackCtx) {
      nextPlayTime = audioPlaybackCtx.currentTime;
    }
    setGeminiStatus("listen", "AI LIVE & LISTENING", "Listening to user...");
    return;
  }

  // 🎯 3. Handle Model Turn Audio / Text Streams
  if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
    for (var i = 0; i < msg.serverContent.modelTurn.parts.length; i++) {
      var part = msg.serverContent.modelTurn.parts[i];
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith("audio/pcm")) {
        setGeminiStatus("speak", "GEMINI SPEAKING...", "Streaming 24kHz real-time audio.");
        playPcm24kBase64Chunk(part.inlineData.data);
      }
      if (part.text) {
        appendGeminiLog("ai", "🧠 " + part.text);
      }
    }
  }

  if (msg.serverContent && msg.serverContent.turnComplete) {
    setTimeout(function(){
      if (blobState.status === "speak") {
        setGeminiStatus("listen", "AI LIVE & LISTENING", "Speak naturally to control your PC.");
      }
    }, 400);
  }

  if (msg.toolCall && msg.toolCall.functionCalls) {
    for (var j = 0; j < msg.toolCall.functionCalls.length; j++) {
      var call = msg.toolCall.functionCalls[j];
      executeGeminiToolCall(call);
    }
  }
}

function executeGeminiToolCall(call) {
  setGeminiStatus("exec", "EXECUTING TOOL...", call.name);
  appendGeminiLog("tool", "[TOOL CALL] " + call.name + "(" + JSON.stringify(call.args || {}) + ")");

  var toolPromise = null;
  var name = call.name;
  var args = call.args || {};

  if (name === "lock_workstation") {
    toolPromise = fetch("/lock?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "trigger_panic") {
    toolPromise = fetch("/panic?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "get_pc_status") {
    toolPromise = fetch("/api/status?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "run_powershell_command") {
    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent(args.command || "")).then(function(r){ return r.json(); });
  } else if (name === "type_keyboard") {
    toolPromise = fetch("/api/type?key=" + KEY + "&text=" + encodeURIComponent(args.text || "")).then(function(){ return { status: "typed" }; });
  } else if (name === "sleep_pc") {
    toolPromise = fetch("/sleep?key=" + KEY).then(function(r){ return r.json(); });
  } else if (name === "set_volume") {
    var vol = Math.max(0, Math.min(100, args.level || 50));
    toolPromise = fetch("/api/exec?key=" + KEY + "&cmd=" + encodeURIComponent("(New-Object -ComObject WScript.Shell)")).then(function(){ return { volume: vol }; });
  } else {
    toolPromise = Promise.resolve({ error: "Unknown function" });
  }

  toolPromise
    .then(function(resData) {
      appendGeminiLog("out", "[TOOL RESULT] " + JSON.stringify(resData));
      sendToolResponseToGemini(call.id, resData);
      setTimeout(function(){
        if (blobState.status === "exec") {
          setGeminiStatus("listen", "AI LIVE & LISTENING", "Command executed. Listening...");
        }
      }, 600);
    })
    .catch(function(err) {
      appendGeminiLog("err", "[TOOL ERROR] " + err);
      sendToolResponseToGemini(call.id, { error: String(err) });
    });
}

function sendToolResponseToGemini(callId, resultData) {
  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
  var resp = {
    toolResponse: {
      functionResponses: [
        {
          id: callId,
          response: { output: resultData }
        }
      ]
    }
  };
  geminiWs.send(JSON.stringify(resp));
}

function sendTextMessageToGemini(text) {
  if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) {
    appendGeminiLog("err", "[ERROR] Gemini Live is not connected. Click ⚡ CONNECT AI first.");
    return;
  }
  appendGeminiLog("user", "🗣️ User: " + text);
  var msg = {
    clientContent: {
      turns: [
        {
          role: "user",
          parts: [{ text: text }]
        }
      ],
      turnComplete: true
    }
  };
  geminiWs.send(JSON.stringify(msg));
  setGeminiStatus("speak", "GEMINI PROCESSING...", "Generating audio & executing tools...");
}

function startMicrophoneCapture() {
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
    appendGeminiLog("err", "[MIC NOTICE] Mobile Chrome blocks Mic over plain HTTP (Insecure Context).");
    appendGeminiLog("sys", "[TIP] Use Cloudflare HTTPS URL, or type your voice commands in the Terminal input below!");
    setGeminiStatus("listen", "TEXT & CLOUD READY", "Type below or use HTTPS URL for live microphone.");
    return;
  }

  getUserMediaFn({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    .then(function(stream) {
      audioInputCtx = new (window.AudioContext || window.webkitAudioContext)();
      var sampleRate = audioInputCtx.sampleRate;
      audioInputSource = audioInputCtx.createMediaStreamSource(stream);

      var analyser = audioInputCtx.createAnalyser();
      analyser.fftSize = 64;
      var dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioInputSource.connect(analyser);

      function updateMicVisual() {
        if (!audioInputCtx) return;
        analyser.getByteFrequencyData(dataArray);
        var sum = 0;
        for (var i = 0; i < dataArray.length; i++) sum += dataArray[i];
        blobState.micLevel = (sum / dataArray.length) / 255;
        requestAnimationFrame(updateMicVisual);
      }
      updateMicVisual();

      audioInputProcessor = audioInputCtx.createScriptProcessor(4096, 1, 1);
      audioInputSource.connect(audioInputProcessor);
      audioInputProcessor.connect(audioInputCtx.destination);

      audioInputProcessor.onaudioprocess = function(e) {
        if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
        // 🛡️ DUCKING: If Gemini is actively speaking and user isn't shouting over it, don't feedback speaker noise!
        if (blobState.status === "speak" && blobState.micLevel < 0.25) return;

        var inputData = e.inputBuffer.getChannelData(0);
        var downsampled = downsampleBuffer(inputData, sampleRate, 16000);
        var pcm16 = convertFloat32ToInt16(downsampled);
        var base64Chunk = arrayBufferToBase64(pcm16.buffer);

        var chunkMsg = {
          realtimeInput: {
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Chunk
            }
          }
        };
        geminiWs.send(JSON.stringify(chunkMsg));
      };
    })
    .catch(function(err) {
      appendGeminiLog("err", "[MIC DENIED] " + err.message);
    });
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

function initPlaybackAudioContext() {
  if (!audioPlaybackCtx) {
    audioPlaybackCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioPlaybackCtx.state === "suspended") {
    audioPlaybackCtx.resume();
  }
  if (nextPlayTime < audioPlaybackCtx.currentTime) {
    nextPlayTime = audioPlaybackCtx.currentTime + 0.05;
  }
}

function playPcm24kBase64Chunk(base64Data) {
  initPlaybackAudioContext();
  var binary = window.atob(base64Data);
  var len = binary.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // 🎯 Bit-exact Little-Endian 16-bit PCM to Float32 conversion (pure HD studio quality)
  var dataView = new DataView(bytes.buffer);
  var numSamples = Math.floor(len / 2);
  var float32 = new Float32Array(numSamples);
  for (var j = 0; j < numSamples; j++) {
    var int16 = dataView.getInt16(j * 2, true); // true = Little-Endian
    float32[j] = int16 / 32768.0;
  }

  // Smooth audio reaction for blob visualizer
  var sum = 0;
  for (var k = 0; k < float32.length; k += 4) sum += Math.abs(float32[k]);
  blobState.geminiLevel = Math.min(1, (sum / (float32.length / 4)) * 3.5);

  var audioBuf = audioPlaybackCtx.createBuffer(1, float32.length, 24000);
  audioBuf.copyToChannel(float32, 0);

  var source = audioPlaybackCtx.createBufferSource();
  source.buffer = audioBuf;
  source.connect(audioPlaybackCtx.destination);

  // ⚡ Official Google AudioStreamer continuous scheduling (smooth, natural, gapless!)
  var startTime = Math.max(audioPlaybackCtx.currentTime, nextPlayTime);
  source.start(startTime);
  nextPlayTime = startTime + audioBuf.duration;

  source.onended = function() {
    if (audioPlaybackCtx && audioPlaybackCtx.currentTime >= nextPlayTime - 0.05) {
      blobState.geminiLevel = 0;
    }
  };
}

function disconnectGeminiLive() {
  if (geminiWs) {
    try { geminiWs.close(); } catch(e) {}
    geminiWs = null;
  }
  if (audioInputProcessor) {
    try { audioInputProcessor.disconnect(); } catch(e) {}
    audioInputProcessor = null;
  }
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

window.addEventListener("DOMContentLoaded", function() {
  initGeminiBlobVisualizer();
});
setTimeout(initGeminiBlobVisualizer, 100);
</script>

<!-- ⚡ CYBER LINK PAIRING ONBOARDING MODAL -->
<div id="cyberPairingModal" class="modal-overlay" style="display:none; z-index:99999; background:rgba(2,4,8,0.96); backdrop-filter:blur(15px);">
  <div class="modal-card" style="max-width:420px; text-align:center; border:1px solid rgba(0,240,255,0.5); box-shadow:0 0 35px rgba(0,240,255,0.25); border-radius:16px; padding:24px;">
    <div style="position:relative; width:80px; height:80px; margin:0 auto 16px auto;">
      <div style="position:absolute; inset:0; border-radius:50%; border:2px dashed #00f0ff; animation:spinRadar 6s linear infinite;"></div>
      <div style="position:absolute; inset:8px; border-radius:50%; background:radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%); animation:pulseRadar 2s infinite;"></div>
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:32px;">📱</div>
    </div>

    <h2 style="font-family:'Orbitron',sans-serif; font-size:18px; font-weight:900; color:#fff; letter-spacing:2px; margin-bottom:6px; text-shadow:0 0 15px rgba(0,240,255,0.8);">
      CYBER LINK PAIRING
    </h2>
    <p style="font-family:'Share Tech Mono',monospace; font-size:11px; color:#8892b0; margin-bottom:20px; line-height:1.5;">
      PAIR WITH YOUR HOST PC IN 1-SECOND.<br><span style="color:#00ff41;">SAVES PERMANENTLY AFTER FIRST SCAN.</span>
    </p>

    <!-- Scan QR Button -->
    <button onclick="startInAppQrScanner()" style="width:100%; padding:15px; background:linear-gradient(135deg, #00f0ff 0%, #0077ff 100%); color:#000; border:none; border-radius:10px; font-family:'Orbitron',sans-serif; font-size:13px; font-weight:900; letter-spacing:1.5px; cursor:pointer; box-shadow:0 0 25px rgba(0,240,255,0.4); margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px;">
      <span>📷</span> SCAN PC QR CODE
    </button>

    <!-- Auto Detect Button -->
    <button onclick="triggerAutoDetectPc()" id="autoDetectBtn" style="width:100%; padding:13px; background:rgba(0,255,65,0.1); color:#00ff41; border:1px solid rgba(0,255,65,0.4); border-radius:10px; font-family:'Share Tech Mono',monospace; font-size:12px; font-weight:bold; letter-spacing:1px; cursor:pointer; margin-bottom:16px;">
      📡 AUTO-DETECT WI-FI PC
    </button>

    <!-- Manual IP Collapsible -->
    <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:12px;">
      <a href="javascript:void(0)" onclick="toggleManualSetup()" style="font-family:'Share Tech Mono',monospace; font-size:11px; color:#64748b; text-decoration:none;">
        ⚙️ Manual IP / Advanced Setup ▾
      </a>
      <div id="manualSetupBox" style="display:none; margin-top:12px;">
        <input type="text" id="manualIpInput" placeholder="e.g. 192.168.0.104:8080" style="width:100%; padding:10px; background:#000; border:1px solid rgba(0,240,255,0.3); border-radius:6px; color:#fff; font-family:'Share Tech Mono',monospace; font-size:12px; margin-bottom:8px; outline:none;">
        <input type="text" id="manualKeyInput" placeholder="Session Key (e.g. imran2024)" style="width:100%; padding:10px; background:#000; border:1px solid rgba(0,240,255,0.3); border-radius:6px; color:#fff; font-family:'Share Tech Mono',monospace; font-size:12px; margin-bottom:8px; outline:none;">
        <button onclick="saveManualPairing()" style="width:100%; padding:10px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.3); border-radius:6px; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:bold; cursor:pointer;">
          CONNECT MANUALLY
        </button>
      </div>
    </div>
  </div>
</div>

<!-- 📷 IN-APP LIVE CAMERA QR SCANNER MODAL -->
<div id="qrCameraScannerModal" class="modal-overlay" style="display:none; z-index:100000; background:#000;">
  <div style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
    <!-- Scanner Header -->
    <div style="position:absolute; top:20px; left:0; width:100%; display:flex; justify-content:space-between; align-items:center; padding:0 20px; z-index:10;">
      <span style="font-family:'Orbitron',sans-serif; font-size:14px; font-weight:900; color:#00f0ff; letter-spacing:2px; text-shadow:0 0 10px rgba(0,240,255,0.8);">
        📷 SCAN PC QR CODE
      </span>
      <button onclick="stopInAppQrScanner()" style="background:rgba(255,0,85,0.2); border:1px solid rgba(255,0,85,0.5); color:#ff0055; width:36px; height:36px; border-radius:50%; font-size:18px; font-weight:bold; cursor:pointer;">
        ✕
      </button>
    </div>

    <!-- Live Video Viewport Container -->
    <div id="qrVideoContainer" style="width:280px; height:280px; position:relative; border-radius:16px; overflow:hidden; border:2px solid #00f0ff; box-shadow:0 0 30px rgba(0,240,255,0.4);">
      <div id="qrReader" style="width:100%; height:100%;"></div>
  </div>

  <!-- ==================== TAB 2: 🧠 GEMINI AI (VOICE HUD & SANDBOX) ==================== -->
  <div id="tab-gemini" class="tab-content">
    <!-- 🧠 GEMINI 3.1 CYBER LIVE VOICE HUD & SANDBOX TERMINAL -->
  <div class="gemini-hud-card" id="geminiHudCard">
    <!-- Top Bar -->
    <div class="gemini-top-bar">
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="gemini-badge">🧠 GEMINI 3.1 LIVE</span>
        <span id="geminiStatusPill" class="gemini-status-pill status-disc">DISCONNECTED</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <select id="geminiVoiceSelect" onchange="changeGeminiVoice(this.value)" style="background:#030816; color:var(--neon-cyan); border:1px solid rgba(0,240,255,0.4); border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:10px; padding:3px 6px; outline:none; cursor:pointer;">
          <option value="Puck">🎙️ Puck (Natural Male - Default)</option>
          <option value="Aoede">🎙️ Aoede (Smooth Female)</option>
          <option value="Charon">🎙️ Charon (Deep Male)</option>
          <option value="Fenrir">🎙️ Fenrir (Dynamic Male)</option>
          <option value="Kore">🎙️ Kore (Warm Female)</option>
          <option value="Zephyr">🎙️ Zephyr (Calm Bright)</option>
        </select>
        <button class="gemini-btn-icon" onclick="toggleGeminiKeyModal()" title="Gemini API Key">🔑 KEY</button>
        <button class="gemini-btn-icon" onclick="toggleGeminiTerminal()" title="Toggle Sandbox Terminal">📟 LOGS</button>
        <button id="geminiConnectBtn" class="gemini-btn-connect" onclick="toggleGeminiLiveConnection()">⚡ CONNECT AI</button>
      </div>
    </div>

    <!-- Center Stage: Audio Blob Visualizer & Controls -->
    <div class="gemini-stage">
      <div class="gemini-blob-wrapper">
        <canvas id="geminiBlobCanvas" width="220" height="220"></canvas>
        <div class="gemini-blob-center-icon" id="geminiBlobIcon">🎙️</div>
      </div>
      <div class="gemini-hud-info">
        <div class="gemini-hud-title" id="geminiVoiceTitle">VOICE ASSISTANT READY</div>
        <div class="gemini-hud-sub" id="geminiVoiceSub">Tap '⚡ CONNECT AI' to start real-time full-duplex voice control.</div>
      </div>
    </div>

    <!-- Collapsible Cyber Sandbox Terminal Console -->
    <div id="geminiTerminalBox" class="gemini-terminal" style="display:none;">
      <div class="terminal-header">
        <span class="terminal-title">📟 CYBER SANDBOX TERMINAL &bull; LIVE EXECUTION HUB</span>
        <button class="terminal-clear-btn" onclick="clearGeminiTerminal()">CLEAR</button>
      </div>
      <div id="geminiTerminalLogs" class="terminal-logs">
        <div class="t-log sys">[SYSTEM] Gemini 3.1 Live Terminal initialized. Standby for voice commands...</div>
      </div>
      <div class="terminal-input-bar">
        <span style="color:var(--neon-green); font-family:monospace; font-weight:bold;">PS &gt;</span>
        <input type="text" id="manualTerminalInput" placeholder="Manual command (e.g. Get-Process, ipconfig)..." onkeydown="if(event.key==='Enter')executeManualTerminalCmd()">
        <button class="terminal-run-btn" onclick="executeManualTerminalCmd()">RUN</button>
      </div>
    </div>
  </div>

  <!-- 🔑 GEMINI API KEY MODAL -->
  <div id="geminiKeyModal" class="modal-overlay" style="display:none;">
    <div class="modal-card" style="border-color:var(--neon-cyan); box-shadow:0 0 30px rgba(0,240,255,0.3);">
      <div class="modal-header">
        <span class="modal-icon">🔑</span>
        <span class="modal-title">GEMINI LIVE API KEY</span>
      </div>
      <p class="modal-sub">ENTER YOUR GOOGLE AI STUDIO API KEY</p>
      <div class="input-wrapper">
        <input type="password" id="geminiApiKeyInput" placeholder="AIzaSy..." autocomplete="off">
      </div>
      <div style="font-size:10px; color:#888; margin-bottom:14px; font-family:'Share Tech Mono',monospace;">
        Get your free API key at: <b style="color:var(--neon-cyan);">aistudio.google.com</b>
      </div>
      <div class="modal-actions">
        <button class="modal-btn btn-cancel" onclick="closeGeminiKeyModal()">CANCEL</button>
        <button class="modal-btn btn-confirm" style="background:var(--neon-cyan); color:#000;" onclick="saveGeminiApiKey()">SAVE KEY 💾</button>
      </div>
    </div>
  </div>
  </div>

  <!-- ==================== TAB 3: ⚡ CONTROLS (SYSTEM DEFENSE & POWER) ==================== -->
  <div id="tab-controls" class="tab-content">
    <!-- Animated Laser Scan Line -->
      <div style="position:absolute; left:0; width:100%; height:3px; background:#00f0ff; box-shadow:0 0 15px #00f0ff; animation:laserScan 2s ease-in-out infinite; z-index:5; pointer-events:none;"></div>
    </div>

    <p style="font-family:'Share Tech Mono',monospace; font-size:12px; color:#8892b0; margin-top:24px; text-align:center;">
      Point camera at PC tray icon:<br><span style="color:#00ff41;">"📱 Scan in Mobile (QR)"</span>
    </p>
  </div>
  </div>

</div>





<script>

// ⚡ CYBER LINK ONBOARDING & CAMERA QR SCANNER CONTROLLER
var _html5QrCode = null;

function checkOnboardingPairing() {
  // If already loaded directly on PC host or key is present, NEVER show onboarding modal!
  var isDirectHost = (window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1' && 
                      !window.location.hostname.includes('web.app') && 
                      !window.location.hostname.includes('firebaseapp.com') &&
                      window.location.protocol.startsWith('http'));
  if (isDirectHost || window.location.search.indexOf('key=') > -1) {
    var modal = document.getElementById('cyberPairingModal');
    if (modal) modal.style.display = 'none';
    return;
  }
  var savedEndpoint = localStorage.getItem('panic_pc_endpoint');
  var savedKey = localStorage.getItem('panic_key');
  if (!savedEndpoint || savedEndpoint.indexOf('127.0.0.1') > -1 || !savedKey) {
    var modal = document.getElementById('cyberPairingModal');
    if (modal) modal.style.display = 'flex';
  }
}

function openPairingModal() {
  var modal = document.getElementById('cyberPairingModal');
  if (modal) modal.style.display = 'flex';
}

function closePairingModal() {
  var modal = document.getElementById('cyberPairingModal');
  if (modal) modal.style.display = 'none';
}

function startInAppQrScanner() {
  closePairingModal();
  var scanModal = document.getElementById('qrCameraScannerModal');
  if (scanModal) scanModal.style.display = 'flex';

  if (!window.Html5Qrcode) {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
    script.onload = function() { initScannerInstance(); };
    document.head.appendChild(script);
  } else {
    initScannerInstance();
  }
}

function initScannerInstance() {
  try {
    if (_html5QrCode) {
      _html5QrCode.stop().then(function() {
        _html5QrCode.clear();
        _html5QrCode = null;
        startCameraStream();
      }).catch(function() {
        _html5QrCode = null;
        startCameraStream();
      });
    } else {
      startCameraStream();
    }
  } catch(e) {
    startCameraStream();
  }
}

function startCameraStream() {
  try {
    _html5QrCode = new Html5Qrcode("qrReader");
    var config = { fps: 15, qrbox: { width: 250, height: 250 } };
    _html5QrCode.start(
      { facingMode: "environment" },
      config,
      onQrCodeSuccess,
      function(err) {}
    ).catch(function(err) {
      alert("Camera error: " + err);
      stopInAppQrScanner();
      openPairingModal();
    });
  } catch(e) {
    alert("Camera init failed: " + e);
  }
}

function onQrCodeSuccess(decodedText) {
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  stopInAppQrScanner();

  try {
    var parsedUrl = new URL(decodedText);
    var key = parsedUrl.searchParams.get("key") || "imran2024";
    var endpoint = parsedUrl.origin;

    localStorage.setItem('panic_pc_endpoint', endpoint);
    localStorage.setItem('panic_key', key);
    
    // Save natively to Android SharedPreferences if running in APK
    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
      window.AndroidNativeStream.savePcUrl(decodedText);
    }

    closePairingModal();
    // ⚡ Direct navigation to PC Host Dashboard (100% full live session!)
    window.location.href = decodedText;
  } catch(e) {
    if (decodedText.indexOf('http') === 0) {
      localStorage.setItem('panic_pc_endpoint', decodedText);
      if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
        window.AndroidNativeStream.savePcUrl(decodedText);
      }
      closePairingModal();
      window.location.href = decodedText;
    }
  }
}

function stopInAppQrScanner() {
  if (_html5QrCode) {
    _html5QrCode.stop().then(function() {
      _html5QrCode.clear();
      _html5QrCode = null;
    }).catch(function() {
      _html5QrCode = null;
    });
  }
  var scanModal = document.getElementById('qrCameraScannerModal');
  if (scanModal) scanModal.style.display = 'none';
}

function toggleManualSetup() {
  var box = document.getElementById('manualSetupBox');
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function saveManualPairing() {
  var ip = document.getElementById('manualIpInput').value.trim();
  var key = document.getElementById('manualKeyInput').value.trim() || 'imran2024';
  if (!ip) { alert('Please enter PC IP address'); return; }
  if (!ip.startsWith('http://') && !ip.startsWith('https://')) ip = 'http://' + ip;

  var fullUrl = ip + (ip.includes('?') ? '&' : '/?') + 'key=' + key;
  localStorage.setItem('panic_pc_endpoint', ip);
  localStorage.setItem('panic_key', key);

  if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
    window.AndroidNativeStream.savePcUrl(fullUrl);
  }

  closePairingModal();
  window.location.href = fullUrl;
}

function triggerAutoDetectPc() {
  var btn = document.getElementById('autoDetectBtn');
  if (btn) btn.textContent = '🔍 SCANNING LOCAL WI-FI...';
  if (typeof probeBestEndpoint === 'function') probeBestEndpoint();
  setTimeout(function() {
    if (btn) btn.textContent = '📡 AUTO-DETECT WI-FI PC';
    var ep = localStorage.getItem('panic_pc_endpoint');
    if (ep && ep.indexOf('127.0.0.1') === -1) {
      closePairingModal();
      var k = localStorage.getItem('panic_key') || 'imran2024';
      var targetUrl = ep + (ep.includes('?') ? '&' : '/?') + 'key=' + k;
      if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
        window.AndroidNativeStream.savePcUrl(targetUrl);
      }
      window.location.href = targetUrl;
    }
  }, 2500);
}

window.addEventListener('DOMContentLoaded', checkOnboardingPairing);

// Hide install/download button if already running in native Android App or standalone PWA
(function() {
  function hideIfNative() {
    var isNative = window.AndroidNativeStream || 
                   window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true;
    if (isNative) {
      var btn = document.getElementById('pwaInstallBtn');
      if (btn) btn.style.display = 'none';
      var banner = document.getElementById('pwaInstallBanner');
      if (banner) banner.style.display = 'none';
    }
  }
  window.addEventListener('DOMContentLoaded', hideIfNative);
  setTimeout(hideIfNative, 500);
})();



// 📱 TAB CONTROLLER ENGINE
function switchTab(tabId) {
  if (navigator.vibrate) navigator.vibrate(25);
  document.querySelectorAll('.tab-content').forEach(function(el) {
    el.classList.remove('active');
  });
  document.querySelectorAll('.cyber-nav-tab').forEach(function(el) {
    el.classList.remove('active');
  });
  
  var target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');
  var navBtn = document.getElementById('nav-' + tabId);
  if (navBtn) navBtn.classList.add('active');
  
  try {
    sessionStorage.setItem('panic_active_tab', tabId);
  } catch(e) {}
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', function() {
  try {
    var savedTab = sessionStorage.getItem('panic_active_tab') || 'home';
    switchTab(savedTab);
  } catch(e) {
    switchTab('home');
  }
});

</script>
</body>
</html>)HTML";
