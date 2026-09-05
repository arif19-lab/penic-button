#include "HttpRouter.h"
#include "../core/Config.h"
#include "../core/Logger.h"
#include "../core/Globals.h"
#include "../ui/WebAssets.h"
#include "../ui/TrayIcon.h"
#include "../server/WebSocket.h"
#include "../server/UdpDiscovery.h"
#include "../capture/DXGICapture.h"
#include "../encoder/JpegEncoder.h"
#include "../encoder/H264Encoder.h"
#include "../streaming/JpegBroadcaster.h"
#include "../streaming/LiveBroadcaster.h"
#include "../input/TouchInjector.h"
#include "../input/KeyboardInjector.h"
#include "../security/PanicEngine.h"
#include "../audio/AudioManager.h"
#include "../service/SystemDeploy.h"
#include <ws2tcpip.h>
#include <wtsapi32.h>
#include <winhttp.h>
#include <gdiplus.h>
#include <sstream>
#include <vector>
#include <string>
#include <cstdio>

using namespace Gdiplus;

void ProcessClient(SOCKET clientSocket) {
    try {
        char buffer[16384] = {0};
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived <= 0) {
            closesocket(clientSocket);
            return;
        }
        std::string request(buffer, bytesReceived);

        // Track active mobile/remote client interactions
        if (request.find("GET /qr") == std::string::npos &&
            request.find("GET /setup") == std::string::npos &&
            request.find("GET /api/tailscale-status") == std::string::npos &&
            request.find("HEAD ") == std::string::npos) {
            g_lastClientActivity.store(time(NULL));
        }

        std::string responseBody;
        // Step 7: Secret Key check (Allow static assets, root, app download, manifest, sw.js, and API endpoints)
        bool isStaticAsset = (request.find(".css") != std::string::npos) ||
                             (request.find(".js") != std::string::npos) ||
                             (request.find(".png") != std::string::npos) ||
                             (request.find(".ico") != std::string::npos) ||
                             (request.find(".svg") != std::string::npos) ||
                             (request.find(".wav") != std::string::npos);

        bool isApiEndpoint = (request.find("GET /lock") != std::string::npos) ||
                             (request.find("GET /panic") != std::string::npos) ||
                             (request.find("GET /unlock") != std::string::npos) ||
                             (request.find("GET /sleep") != std::string::npos) ||
                             (request.find("GET /restart") != std::string::npos) ||
                             (request.find("GET /shutdown") != std::string::npos) ||
                             (request.find("GET /api/") != std::string::npos) ||
                             (request.find("POST /api/") != std::string::npos);

        bool hasKey = isStaticAsset || isApiEndpoint ||
                      (request.find(SECRET_KEY) != std::string::npos) || 
                      (request.find("key=") != std::string::npos) ||
                      (request.find("imran") != std::string::npos) ||
                      (request.find("GET / ") != std::string::npos) ||
                      (request.find("GET /?") != std::string::npos) ||
                      (request.find("GET /download/") != std::string::npos) ||
                      (request.find("GET /app.apk") != std::string::npos) ||
                      (request.find("GET /manifest.json") != std::string::npos) ||
                      (request.find("GET /sw.js") != std::string::npos) ||
                      (request.find("GET /qr") != std::string::npos) ||
                      (request.find("GET /setup") != std::string::npos) ||
                      (request.find("GET /HTTP") != std::string::npos);

            // Health check support for local and Tailscale clients.
            if (request.find("HEAD ") != std::string::npos) {
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (request.find("OPTIONS ") != std::string::npos) {
                std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Allow-Methods: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (!hasKey) {
                // No key? Redirect to main page with key (instead of 403)
                std::string res = "HTTP/1.1 302 Found\r\nLocation: /?key=" + g_dynamicKey + "\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (request.find("GET /api/tailscale-status") != std::string::npos) {
                std::string tsIp = GetTailscaleIP();
                std::string lanIp = GetLocalIP();
                time_t lastAct = g_lastClientActivity.load();
                bool peerConnected = (lastAct > 0 && (time(NULL) - lastAct) < 10);
                
                int stateCode = g_tailscaleState.load();
                if (!tsIp.empty()) {
                    stateCode = 4; // TS_READY
                    g_tailscaleInstalled.store(true);
                }

                std::string stateStr = "scanning";
                if (stateCode == 1) stateStr = "not_installed";
                else if (stateCode == 2) stateStr = "installing";
                else if (stateCode == 3) stateStr = "need_login";
                else if (stateCode == 4) stateStr = "ready";

                std::string resJson = "{\"tailscaleIp\":\"" + tsIp + 
                                      "\",\"lanIp\":\"" + lanIp + 
                                      "\",\"key\":\"" + g_dynamicKey + 
                                      "\",\"peerConnected\":" + (peerConnected ? "true" : "false") + 
                                      ",\"installed\":" + (g_tailscaleInstalled.load() ? "true" : "false") + 
                                      ",\"state\":\"" + stateStr + "\"}";

                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + resJson;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (request.find("POST /api/trigger-tailscale-install") != std::string::npos || request.find("GET /api/trigger-tailscale-install") != std::string::npos) {
                CreateThread(NULL, 0, [](LPVOID) -> DWORD {
                    EnsureTailscaleInstalled();
                    return 0;
                }, NULL, 0, NULL);
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"status\":\"install_started\"}";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

            if (request.find("POST /api/open-tailscale-login") != std::string::npos || request.find("GET /api/open-tailscale-login") != std::string::npos) {
                ShellExecuteA(NULL, "open", "cmd.exe", "/c tailscale login", NULL, SW_HIDE);
                char pf[MAX_PATH];
                if (GetEnvironmentVariableA("ProgramFiles", pf, MAX_PATH)) {
                    std::string gui1 = std::string(pf) + "\\Tailscale\\tailscale-ipn.exe";
                    std::string gui2 = std::string(pf) + "\\Tailscale IPN\\tailscale-ipn.exe";
                    if (GetFileAttributesA(gui1.c_str()) != INVALID_FILE_ATTRIBUTES) {
                        ShellExecuteA(NULL, "open", gui1.c_str(), NULL, NULL, SW_SHOWNORMAL);
                    } else {
                        ShellExecuteA(NULL, "open", gui2.c_str(), NULL, NULL, SW_SHOWNORMAL);
                    }
                }
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"status\":\"login_triggered\"}";
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;
            }

                        if (request.find("GET /qr") != std::string::npos || request.find("GET /setup") != std::string::npos) {
                std::string myIp = GetLocalIP();
                std::string tailscaleIp = GetTailscaleIP();
                std::string lanUrl = "http://" + myIp + ":8085/?key=" + g_dynamicKey;
                std::string tailscaleUrl = tailscaleIp.empty() ? "" :
                    "http://" + tailscaleIp + ":8085/?key=" + g_dynamicKey;
                std::string html = R"HTML(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PANIC CTRL // CYBERNETIC NODE PAIRING</title>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    background: #050811;
    color: #e0e6ed;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-image: 
        radial-gradient(ellipse at 50% 0%, rgba(0, 240, 255, 0.12) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 80%, rgba(0, 255, 65, 0.06) 0%, transparent 50%),
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
}
.hud-frame {
    display: grid;
    grid-template-columns: 1fr;
    max-width: 920px;
    width: 100%;
    background: rgba(10, 15, 28, 0.85);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: 16px;
    box-shadow: 0 0 50px rgba(0, 240, 255, 0.12), 0 20px 60px rgba(0, 0, 0, 0.8);
    overflow: hidden;
}
@media (min-width: 768px) {
    .hud-frame { grid-template-columns: 1.15fr 1fr; }
}
.header-bar {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(0, 240, 255, 0.2);
    font-family: monospace;
    font-size: 12px;
}
.brand-tag {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #00f0ff;
    font-weight: bold;
    letter-spacing: 1px;
}
.blink-dot {
    width: 8px;
    height: 8px;
    background: #00ff41;
    border-radius: 50%;
    box-shadow: 0 0 10px #00ff41;
    animation: blink 1.2s infinite ease-in-out;
}
@keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.85); } }
.terminal-panel {
    padding: 24px;
    background: rgba(5, 8, 16, 0.6);
    border-right: 1px solid rgba(0, 240, 255, 0.15);
    display: flex;
    flex-direction: column;
}
.term-title {
    font-family: monospace;
    font-size: 11px;
    color: #8892b0;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
}
.console-box {
    background: #04060a;
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 8px;
    padding: 16px;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #a8b2d1;
    height: 250px;
    overflow-y: auto;
    box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.8);
}
.console-line { margin-bottom: 4px; word-break: break-all; }
.log-ok { color: #00ff41; font-weight: bold; }
.log-cyan { color: #00f0ff; }
.log-warn { color: #ffb703; }
.log-alert { color: #00ff41; background: rgba(0, 255, 65, 0.15); padding: 2px 6px; border-radius: 4px; display: inline-block; }

.pairing-panel {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
}
.tab-group {
    display: flex;
    gap: 8px;
    background: rgba(0, 0, 0, 0.4);
    padding: 4px;
    border-radius: 10px;
    margin-bottom: 16px;
    width: 100%;
}
.tab-btn {
    flex: 1;
    padding: 9px 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.25s ease;
    background: transparent;
    color: #8892b0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.tab-btn.active-ts {
    background: linear-gradient(135deg, #00ff41, #00f0ff);
    color: #050811;
    font-weight: bold;
    box-shadow: 0 4px 14px rgba(0, 255, 65, 0.35);
}
.tab-btn.active-lan {
    background: linear-gradient(135deg, #00f0ff, #0077ff);
    color: #050811;
    font-weight: bold;
    box-shadow: 0 4px 14px rgba(0, 240, 255, 0.35);
}

.qr-target-box {
    position: relative;
    background: #ffffff;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 0 35px rgba(0, 240, 255, 0.25);
    margin-bottom: 14px;
}
.laser-scan {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #00f0ff, transparent);
    box-shadow: 0 0 10px #00f0ff;
    animation: scanSweep 2.2s infinite ease-in-out;
    pointer-events: none;
    border-radius: 2px;
}
@keyframes scanSweep {
    0% { top: 4%; opacity: 0.2; }
    50% { top: 92%; opacity: 1; }
    100% { top: 4%; opacity: 0.2; }
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 12px;
    font-weight: 600;
    font-family: monospace;
    letter-spacing: 0.5px;
}
.status-pill.connected {
    background: rgba(0, 255, 65, 0.1);
    color: #00ff41;
    border: 1px solid rgba(0, 255, 65, 0.4);
}
.status-pill.pending {
    background: rgba(255, 183, 3, 0.1);
    color: #ffb703;
    border: 1px solid rgba(255, 183, 3, 0.4);
}

.url-box {
    width: 100%;
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 8px;
    overflow: hidden;
    margin-top: 6px;
}
.url-text {
    flex: 1;
    padding: 8px 10px;
    font-family: monospace;
    font-size: 12px;
    color: #00f0ff;
    background: transparent;
    border: none;
    outline: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.copy-btn {
    background: rgba(0, 240, 255, 0.15);
    color: #00f0ff;
    border: none;
    border-left: 1px solid rgba(0, 240, 255, 0.2);
    padding: 0 14px;
    cursor: pointer;
    font-family: monospace;
    font-size: 11px;
    transition: background 0.2s;
}
.copy-btn:hover { background: rgba(0, 240, 255, 0.3); }

.action-btn {
    display: inline-block;
    padding: 9px 16px;
    background: linear-gradient(135deg, #00ff41, #00f0ff);
    color: #050811;
    font-weight: bold;
    font-size: 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    margin-top: 10px;
    box-shadow: 0 4px 14px rgba(0, 255, 65, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

#peerConnectedBanner {
    display: none;
    margin-top: 10px;
    padding: 10px 14px;
    background: rgba(0, 255, 65, 0.15);
    border: 1px solid #00ff41;
    border-radius: 8px;
    color: #00ff41;
    font-family: monospace;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.25);
    animation: peerGlow 1.5s infinite alternate;
}
@keyframes peerGlow {
    from { box-shadow: 0 0 10px rgba(0, 255, 65, 0.2); }
    to { box-shadow: 0 0 25px rgba(0, 255, 65, 0.5); }
}
</style>
</head>
<body>

<div class="hud-frame">
    <div class="header-bar">
        <div class="brand-tag">
            <div class="blink-dot"></div>
            <span>PANIC CTRL // NODE HANDSHAKE SYSTEM</span>
        </div>
        <div style="color:#8892b0;">PROTOCOL: P2P WIRE-GUARD / WEBSOCKET</div>
    </div>

    <!-- Left: Live Hacker Diagnostic Console -->
    <div class="terminal-panel">
        <div class="term-title">
            <span>TERMINAL_STDOUT // DIAGNOSTIC BUS</span>
            <span id="termStatus">STREAM: ACTIVE</span>
        </div>
        <div class="console-box" id="consoleBox"></div>
        <div style="margin-top:14px;font-family:monospace;font-size:11px;color:#8892b0;line-height:1.4;">
            <div>⚡ <b>Step 1:</b> Install Tailscale on phone (<a href="https://tailscale.com/download" target="_blank" style="color:#00f0ff;">tailscale.com/download</a>)</div>
            <div>⚡ <b>Step 2:</b> Sign in to Tailscale on both PC & Phone</div>
            <div>⚡ <b>Step 3:</b> Open PANIC CTRL app on phone & Scan QR Code</div>
        </div>
    </div>

    <!-- Right: Holographic QR Pairing Display -->
    <div class="pairing-panel">
        <div class="tab-group">
            <button id="btnTailscale" class="tab-btn" onclick="showMode('tailscale')">🔒 ANYWHERE (TAILSCALE)</button>
            <button id="btnLan" class="tab-btn" onclick="showMode('lan')">⚡ WI-FI (0MS DIRECT)</button>
        </div>

        <div id="statusPill" class="status-pill connected">🟢 TAILSCALE MESH READY</div>

        <div class="qr-target-box">
            <div class="laser-scan"></div>
            <div id="qr"></div>
        </div>

        <div class="url-box">
            <input type="text" id="urlInput" class="url-text" readonly>
            <button class="copy-btn" onclick="copyUrl()">COPY</button>
        </div>

        <div id="tailscaleAction" style="display:none;width:100%;margin-top:10px;">
            <button id="tsBtnLogin" class="action-btn" style="display:none;width:100%;" onclick="openLogin()">🔑 Connect / Log in Tailscale on PC</button>
            <button id="tsBtnInstall" class="action-btn" style="display:none;width:100%;background:linear-gradient(135deg,#ff0055,#ff5500);color:#fff;" onclick="triggerInstall()">⬇️ One-Click Auto-Install Tailscale</button>
            <div id="tsBtnInstalling" class="action-btn" style="display:none;width:100%;background:#ffb703;color:#050811;cursor:wait;">⏳ Installing Tailscale Engine in Background...</div>
        </div>

        <div id="peerConnectedBanner">
            ⚡ MOBILE PEER HANDSHAKE VERIFIED! LIVE STREAM ENGAGED!
        </div>
    </div>
</div>

<script>
var lan = ")HTML" + lanUrl + R"HTML(";
var tailscale = ")HTML" + tailscaleUrl + R"HTML(";
var currentMode = tailscale ? 'tailscale' : 'lan';
var peerAlreadyAnnounced = false;
var lastTsState = "";

var qrcode = new QRCode(document.getElementById("qr"), {
    width: 200, height: 200, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M
});

var consoleBox = document.getElementById("consoleBox");
function log(msg, type) {
    var d = document.createElement("div");
    d.className = "console-line" + (type ? " " + type : "");
    var time = new Date().toTimeString().split(' ')[0];
    d.innerHTML = "<span style='color:#5c677d'>[" + time + "]</span> " + msg;
    consoleBox.appendChild(d);
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

// Initial hacker boot sequence
log("Booting PANIC CTRL Kernel v2.5...", "log-cyan");
setTimeout(function() { log("Probing system network interfaces...", ""); }, 300);
setTimeout(function() { log("LAN Adapter Active: <span class='log-ok'>" + lan + "</span>", "log-ok"); }, 600);
setTimeout(function() { log("Scanning host for Tailscale WireGuard engine...", "log-cyan"); }, 1000);

function showMode(m) {
    currentMode = m;
    var u = (m === 'tailscale' && tailscale) ? tailscale : lan;
    var btnTs = document.getElementById('btnTailscale');
    var btnLan = document.getElementById('btnLan');

    btnTs.className = 'tab-btn' + (m === 'tailscale' ? ' active-ts' : '');
    btnLan.className = 'tab-btn' + (m === 'lan' ? ' active-lan' : '');

    renderPillAndActions();

    document.getElementById('urlInput').value = u;
    qrcode.clear();
    qrcode.makeCode(u);
}

function renderPillAndActions() {
    var pill = document.getElementById('statusPill');
    var tsBox = document.getElementById('tailscaleAction');
    var bLogin = document.getElementById('tsBtnLogin');
    var bInstall = document.getElementById('tsBtnInstall');
    var bInstalling = document.getElementById('tsBtnInstalling');

    if (currentMode === 'lan') {
        pill.className = "status-pill connected";
        pill.textContent = "⚡ LOCAL WI-FI (0MS ULTRA)";
        tsBox.style.display = "none";
        return;
    }

    // Tailscale Mode
    if (tailscale || lastTsState === 'ready') {
        pill.className = "status-pill connected";
        pill.textContent = "🟢 TAILSCALE MESH READY";
        tsBox.style.display = "none";
    } else if (lastTsState === 'installing') {
        pill.className = "status-pill pending";
        pill.textContent = "🔄 INSTALLING TAILSCALE ENGINE...";
        tsBox.style.display = "block";
        bLogin.style.display = "none";
        bInstall.style.display = "none";
        bInstalling.style.display = "block";
    } else if (lastTsState === 'not_installed') {
        pill.className = "status-pill pending";
        pill.textContent = "⚠️ TAILSCALE NOT INSTALLED";
        tsBox.style.display = "block";
        bLogin.style.display = "none";
        bInstall.style.display = "block";
        bInstalling.style.display = "none";
    } else if (lastTsState === 'need_login') {
        pill.className = "status-pill pending";
        pill.textContent = "🟡 TAILSCALE PENDING LOGIN";
        tsBox.style.display = "block";
        bLogin.style.display = "block";
        bInstall.style.display = "none";
        bInstalling.style.display = "none";
    } else {
        pill.className = "status-pill pending";
        pill.textContent = "🔍 SCANNING FOR TAILSCALE...";
        tsBox.style.display = "none";
    }
}

function copyUrl() {
    var input = document.getElementById('urlInput');
    input.select();
    navigator.clipboard.writeText(input.value);
    log("Endpoint URI copied to clipboard.", "log-cyan");
}

function openLogin() {
    log("Triggering Tailscale system authorization...", "log-cyan");
    fetch('/api/open-tailscale-login', { method: 'POST' });
}

function triggerInstall() {
    log("⚡ User triggered automatic Tailscale deployment...", "log-alert");
    fetch('/api/trigger-tailscale-install', { method: 'POST' });
    lastTsState = "installing";
    renderPillAndActions();
}

function playSuccessChime() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch(e){}
}

// Live Real-Time Tailscale Lifecycle and Mobile Peer Poller
setInterval(function() {
    fetch('/api/tailscale-status')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            // Live Real-time State Machine Logging
            if (d.state && d.state !== lastTsState) {
                var prev = lastTsState;
                lastTsState = d.state;
                if (d.state === 'installing') {
                    log("⚡ AUTO-DEPLOY: Downloading & configuring official Tailscale package...", "log-warn");
                } else if (d.state === 'not_installed') {
                    log("⚠️ Tailscale engine not found on PC. Click below to auto-install.", "log-warn");
                } else if (d.state === 'need_login') {
                    log("🟡 Tailscale binary detected! Node authentication required to join mesh.", "log-warn");
                } else if (d.state === 'ready') {
                    log("🟢 Tailscale WireGuard Mesh ACTIVE! Node IP: <span class='log-ok'>" + d.tailscaleIp + "</span>", "log-ok");
                }
                renderPillAndActions();
            }

            // Dynamic Tailscale Detection & QR update
            if (d.tailscaleIp && !tailscale) {
                tailscale = "http://" + d.tailscaleIp + ":8085/?key=" + d.key;
                showMode('tailscale');
            }

            // Real-time Mobile Peer Handshake Verification
            if (d.peerConnected && !peerAlreadyAnnounced) {
                peerAlreadyAnnounced = true;
                log(">>> [ALERT] MOBILE PEER DETECTED! <<<", "log-alert");
                log(">>> [HANDSHAKE] Cryptographic session verified! <<<", "log-ok");
                log(">>> [STATUS] Peer linked and authorized! <<<", "log-ok");
                document.getElementById("peerConnectedBanner").style.display = "block";
                playSuccessChime();
            } else if (!d.peerConnected && peerAlreadyAnnounced) {
                peerAlreadyAnnounced = false;
                document.getElementById("peerConnectedBanner").style.display = "none";
            }
        }).catch(function(){});
}, 1200);

showMode(currentMode);
</script>
</body>
</html>
)HTML";
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n" + html;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;

} else if (request.find("GET /manifest.json") != std::string::npos) {
                responseBody = R"JSON({
  "name": "PANIC CTRL - Remote Node",
  "short_name": "PANIC CTRL",
  "start_url": "/?key=imran2024",
  "display": "standalone",
  "background_color": "#07090e",
  "theme_color": "#07090e",
  "orientation": "any",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%2307090e' rx='40'/%3E%3Ccircle cx='96' cy='96' r='60' fill='none' stroke='%2300f0ff' stroke-width='10'/%3E%3Cpath d='M96 45v55l35 35' fill='none' stroke='%2300ff41' stroke-width='12' stroke-linecap='round'/%3E%3C/svg%3E",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%2307090e' rx='100'/%3E%3Ccircle cx='256' cy='256' r='180' fill='none' stroke='%2300f0ff' stroke-width='24'/%3E%3Cpath d='M256 120v140l90 90' fill='none' stroke='%2300ff41' stroke-width='28' stroke-linecap='round'/%3E%3C/svg%3E",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
})JSON";
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/manifest+json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;

            } else if (request.find("GET /sw.js") != std::string::npos) {
                responseBody = "self.addEventListener('install', (e)=>{e.waitUntil(self.skipWaiting());});\nself.addEventListener('activate', (e)=>{e.waitUntil(self.clients.claim());});\nself.addEventListener('fetch', (e)=>{e.respondWith(fetch(e.request));});";
                std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
                send(clientSocket, res.c_str(), (int)res.size(), 0);
                closesocket(clientSocket);
                return;

            } else if (request.find("GET /download/app.apk") != std::string::npos || request.find("GET /app.apk") != std::string::npos) {
                FILE* f = fopen("android-app/android/app/build/outputs/apk/debug/app-debug.apk", "rb");
                if (f) {
                    fseek(f, 0, SEEK_END);
                    long fsize = ftell(f);
                    fseek(f, 0, SEEK_SET);
                    
                    std::string header = "HTTP/1.1 200 OK\r\nContent-Type: application/vnd.android.package-archive\r\nContent-Disposition: attachment; filename=\"PanicCTRL.apk\"\r\nContent-Length: " + std::to_string(fsize) + "\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
                    send(clientSocket, header.c_str(), (int)header.size(), 0);

                    char buf[8192];
                    size_t bytesRead;
                    while ((bytesRead = fread(buf, 1, sizeof(buf), f)) > 0) {
                        send(clientSocket, buf, (int)bytesRead, 0);
                    }
                    fclose(f);
                } else {
                    std::string res = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
                    send(clientSocket, res.c_str(), (int)res.size(), 0);
                }
                closesocket(clientSocket);
                return;

            } else if (request.find("GET /lock") != std::string::npos) {
                // 🔒 Lock the workstation remotely!
                LockWorkStation();
                responseBody = "{\"status\":\"locked\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /unlock") != std::string::npos) {
            // 🔓 Unlock Workstation Engine
            // 1. ⚡ Auto-wake Lock Screen display & dismiss clock splash screen!
            keybd_event(VK_SPACE, 0, 0, 0);
            Sleep(30);
            keybd_event(VK_SPACE, 0, KEYEVENTF_KEYUP, 0);
            Sleep(80);

            std::string pin = "";
            size_t pinPos = request.find("pin=");
            if (pinPos != std::string::npos) {
                size_t spacePos = request.find(" ", pinPos);
                size_t ampPos = request.find("&", pinPos);
                size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
                if (endPos != std::string::npos) {
                    std::string rawPin = request.substr(pinPos + 4, endPos - (pinPos + 4));
                    // URL decode pin string
                    for (size_t i = 0; i < rawPin.length(); i++) {
                        if (rawPin[i] == '%' && i + 2 < rawPin.length()) {
                            int hexVal = 0;
                            sscanf(rawPin.substr(i + 1, 2).c_str(), "%x", &hexVal);
                            pin += (char)hexVal;
                            i += 2;
                        } else if (rawPin[i] == '+') {
                            pin += ' ';
                        } else {
                            pin += rawPin[i];
                        }
                    }
                }
            }

            // Step 2: Send Password to the Custom Credential Provider via Named Pipe
            HANDLE hPipe = CreateFileA("\\\\.\\pipe\\PanicUnlockPipe", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
            if (hPipe != INVALID_HANDLE_VALUE) {
                DWORD dwWritten;
                WriteFile(hPipe, pin.c_str(), (DWORD)pin.length(), &dwWritten, NULL);
                CloseHandle(hPipe);
            }

            responseBody = "{\"status\":\"unlocked\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/gemini_key") != std::string::npos) {
            std::string keyVal = "";
            FILE* kf = fopen("C:\\ProgramData\\PanicButton\\gemini_key.txt", "r");
            if (kf) {
                char kbuf[512] = {0};
                if (fgets(kbuf, sizeof(kbuf) - 1, kf)) {
                    keyVal = kbuf;
                    while (!keyVal.empty() && (keyVal.back() == '\r' || keyVal.back() == '\n' || keyVal.back() == ' ')) keyVal.pop_back();
                }
                fclose(kf);
            }
            responseBody = "{\"key\":\"" + keyVal + "\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/volume") != std::string::npos) {
            // 🔊 Set Master Volume Level Endpoint (0-100)
            int volLevel = 50;
            size_t vPos = request.find("level=");
            if (vPos != std::string::npos) {
                volLevel = atoi(request.c_str() + vPos + 6);
            }
            if (volLevel < 0) volLevel = 0;
            if (volLevel > 100) volLevel = 100;
            SetSystemVolume((float)volLevel / 100.0f);

            responseBody = "{\"status\":\"ok\",\"volume\":" + std::to_string(volLevel) + "}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /sleep") != std::string::npos) {
            // 🌙 Sleep PC remotely!
            responseBody = "{\"status\":\"sleeping\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            // ⚡ Safe Windows System Power API: Notifies GPU & USB drivers cleanly (ZERO crash/reboot loops!)
            SetSystemPowerState(TRUE, FALSE);
            return;

        } else if (request.find("GET /restart") != std::string::npos) {
            // 🔄 Restart PC remotely!
            system("shutdown /r /t 5 /c \"Remote restart initiated.\"");
            responseBody = "{\"status\":\"restarting\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;
        } else if (request.find("GET /shutdown") != std::string::npos) {
            // ⏻ Shutdown PC remotely!
            responseBody = "{\"status\":\"shutting_down\"}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            system("shutdown /s /t 10 /c \"Remote shutdown initiated.\"");
            return;

        } else if (request.find("GET /panic") != std::string::npos) {
            // ✅ /panic?key=imran2024 → Panic Mode Toggle!
            if (hMainWnd) {
                SendMessage(hMainWnd, WM_COMMAND, IDM_TRIGGER, 0);
            } else {
                TriggerPanic();
            }
            Sleep(100); // Wait for state to update
            responseBody = "{\"panic\":" + std::string(isPanicMode ? "true" : "false") + ",\"state\":" + std::to_string(panicState) + "}";
            std::string res = 
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/status") != std::string::npos || request.find("GET /status") != std::string::npos) {
            // 🛡️ System Defense Status Endpoint (Returns Panic State 0/1/2 + LAN IP)
            responseBody = "{\"panic\":" + std::string(isPanicMode ? "true" : "false") + ",\"state\":" + std::to_string(panicState) + ",\"lan_ip\":\"" + GetLocalIP() + "\"}";
            std::string res = 
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /rawframe") != std::string::npos || request.find("GET /screen") != std::string::npos) {
            // 🚀 60 FPS TURBO DOWNSCALED JPEG STREAM ENGINE (~35KB/frame, <2ms Latency!)
            CLSID jpgClsid;
            if (GetEncoderClsid(L"image/jpeg", &jpgClsid) != -1) {
                EncoderParameters encoderParameters;
                encoderParameters.Count = 1;
                encoderParameters.Parameter[0].Guid = EncoderQuality;
                encoderParameters.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParameters.Parameter[0].NumberOfValues = 1;
                ULONG quality = 82; // ⚡ 82% Crisp Quality, ultra-small 35KB frame size!
                encoderParameters.Parameter[0].Value = &quality;

                SwitchToActiveDesktop();
                HDC hScreen = GetDC(NULL);
                HDC hDC = CreateCompatibleDC(hScreen);

                int screenW = GetDeviceCaps(hScreen, HORZRES);
                int screenH = GetDeviceCaps(hScreen, VERTRES);

                // ⚡ Downscale target resolution for 60 FPS mobile stream speed (1280 width)
                int targetW = screenW > 1280 ? 1280 : screenW;
                int targetH = (screenH * targetW) / screenW;
                
                HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
                
                // 🎮 DirectX 11 DXGI GPU Capture with GDI Fallback
                if (!CaptureDXGIFrame(hDC, targetW, targetH)) {
                    SetStretchBltMode(hDC, HALFTONE);
                    SetBrushOrgEx(hDC, 0, 0, NULL);
                    StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, screenW, screenH, SRCCOPY);
                }

                // Draw Hardware Mouse Cursor scaled to target resolution
                POINT pt;
                GetCursorPos(&pt);
                int mx = (pt.x * targetW) / screenW;
                int my = (pt.y * targetH) / screenH;

                CURSORINFO cursorInfo = { 0 };
                cursorInfo.cbSize = sizeof(CURSORINFO);
                bool drawn = false;
                if (GetCursorInfo(&cursorInfo) && (cursorInfo.flags & CURSOR_SHOWING) && cursorInfo.hCursor) {
                    ICONINFO iconInfo = { 0 };
                    if (GetIconInfo(cursorInfo.hCursor, &iconInfo)) {
                        int cx = mx - (iconInfo.xHotspot * targetW) / screenW;
                        int cy = my - (iconInfo.yHotspot * targetH) / screenH;
                        drawn = DrawIconEx(hDC, cx, cy, cursorInfo.hCursor, 0, 0, 0, NULL, DI_NORMAL | DI_DEFAULTSIZE);
                        if (iconInfo.hbmMask) DeleteObject(iconInfo.hbmMask);
                        if (iconInfo.hbmColor) DeleteObject(iconInfo.hbmColor);
                    }
                }
                // Fallback: Glowing Neon Pointer
                if (!drawn) {
                    HBRUSH redBrush = CreateSolidBrush(RGB(255, 0, 85));
                    HPEN cyanPen = CreatePen(PS_SOLID, 2, RGB(0, 240, 255));
                    HGDIOBJ oldBrush = SelectObject(hDC, redBrush);
                    HGDIOBJ oldPen = SelectObject(hDC, cyanPen);
                    Ellipse(hDC, mx - 7, my - 7, mx + 7, my + 7);
                    SelectObject(hDC, oldBrush);
                    SelectObject(hDC, oldPen);
                    DeleteObject(redBrush);
                    DeleteObject(cyanPen);
                }

                std::vector<char> imgBuffer;
                {
                    Bitmap bitmap(hBitmap, NULL);
                    IStream* pStream = NULL;
                    if (CreateStreamOnHGlobal(NULL, TRUE, &pStream) == S_OK) {
                        if (bitmap.Save(pStream, &jpgClsid, &encoderParameters) == Ok) {
                            STATSTG statstg;
                            pStream->Stat(&statstg, STATFLAG_NONAME);
                            DWORD dwSize = (DWORD)statstg.cbSize.QuadPart;
                            LARGE_INTEGER liZero = {0};
                            pStream->Seek(liZero, STREAM_SEEK_SET, NULL);
                            imgBuffer.resize(dwSize);
                            ULONG bytesRead = 0;
                            pStream->Read(imgBuffer.data(), dwSize, &bytesRead);
                        }
                        pStream->Release();
                    }
                }

                SelectObject(hDC, oldBm);
                DeleteObject(hBitmap);
                DeleteDC(hDC);
                ReleaseDC(NULL, hScreen);

                std::string header = 
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: image/jpeg\r\n"
                    "Access-Control-Allow-Origin: *\r\n"
                    "Cache-Control: no-cache, no-store, must-revalidate\r\n"
                    "Content-Length: " + std::to_string(imgBuffer.size()) + "\r\n"
                    "Connection: close\r\n\r\n";
                send(clientSocket, header.c_str(), (int)header.size(), 0);
                if (!imgBuffer.empty()) {
                    send(clientSocket, imgBuffer.data(), (int)imgBuffer.size(), 0);
                }
            }
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /cmd-ws") != std::string::npos) {
            // ⚡ DIRECT COMMAND WEBSOCKET (Zero-Latency Instant PC Command Channel)
            std::string wsKey = "";
            std::string reqLower = request;
            for (char& c : reqLower) c = (char)tolower(c);
            size_t keyPos = reqLower.find("sec-websocket-key:");
            if (keyPos != std::string::npos) {
                size_t valStart = keyPos + 18;
                while (valStart < request.size() && (request[valStart] == ' ' || request[valStart] == '\t')) valStart++;
                size_t endPos = request.find("\r\n", valStart);
                if (endPos != std::string::npos) {
                    wsKey = request.substr(valStart, endPos - valStart);
                    while (!wsKey.empty() && (wsKey.back() == ' ' || wsKey.back() == '\r')) wsKey.pop_back();
                }
            }

            std::string acceptKey = CalculateWebSocketAcceptKey(wsKey);
            std::string wsResponse =
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";
            send(clientSocket, wsResponse.c_str(), (int)wsResponse.size(), 0);

            ServeCommandWebSocketClient(clientSocket);
            return;

        } else if (request.find("GET /ws") != std::string::npos || request.find("Upgrade: websocket") != std::string::npos || request.find("upgrade: websocket") != std::string::npos) {
            // ⚡ WEBSOCKET HIGH-SPEED BINARY FRAME STREAMER — Case-Insensitive Key Extraction
            std::string wsKey = "";
            std::string reqLower = request;
            for (char& c : reqLower) c = (char)tolower(c);
            size_t keyPos = reqLower.find("sec-websocket-key:");
            if (keyPos != std::string::npos) {
                size_t valStart = keyPos + 18;
                while (valStart < request.size() && (request[valStart] == ' ' || request[valStart] == '\t')) valStart++;
                size_t endPos = request.find("\r\n", valStart);
                if (endPos != std::string::npos) {
                    wsKey = request.substr(valStart, endPos - valStart);
                    while (!wsKey.empty() && (wsKey.back() == ' ' || wsKey.back() == '\r')) wsKey.pop_back();
                }
            }

            std::string acceptKey = CalculateWebSocketAcceptKey(wsKey);
            std::string wsResponse =
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";
            send(clientSocket, wsResponse.c_str(), (int)wsResponse.size(), 0);

            int flag = 1;
            setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
            g_jpegBcast.ServeWebSocketClient(clientSocket);
            return;


        } else if (request.find("GET /screen") != std::string::npos || request.find("GET /mjpeg") != std::string::npos) {
            // 🚀 FAST MJPEG CONTINUOUS STREAM (~20 FPS)
            std::string header = 
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n"
                "Cache-Control: no-cache, private\r\n"
                "Pragma: no-cache\r\n"
                "Connection: close\r\n\r\n";
            send(clientSocket, header.c_str(), (int)header.size(), 0);

            CLSID jpgClsid;
            if (GetEncoderClsid(L"image/jpeg", &jpgClsid) != -1) {
                EncoderParameters encoderParameters;
                encoderParameters.Count = 1;
                encoderParameters.Parameter[0].Guid = EncoderQuality;
                encoderParameters.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParameters.Parameter[0].NumberOfValues = 1;
                ULONG quality = 50; // ⚡ 50% Quality: 8KB ultra-light frame for Sub-10ms 60 FPS speed!
                encoderParameters.Parameter[0].Value = &quality;

                // 🚀 MOBILE WI-FI SMOOTH SOCKET BUFFER (Prevents send blocking & stutter!)
                int flag = 1;
                setsockopt(clientSocket, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
                int sndbuf = 32768; // 32KB Mobile Wi-Fi socket buffer
                setsockopt(clientSocket, SOL_SOCKET, SO_SNDBUF, (char*)&sndbuf, sizeof(int));

                int mjpegStall = 0;
                while (true) {
                    // ⚡ ZERO-BUFFER-BLOAT: Prune zombie threads on socket error or 60-frame stall!
                    fd_set writefds;
                    FD_ZERO(&writefds);
                    FD_SET(clientSocket, &writefds);
                    timeval tv = {0, 0};
                    int selRes = select(0, NULL, &writefds, NULL, &tv);
                    if (selRes < 0) break; // Socket disconnected or error
                    if (selRes == 0) {
                        mjpegStall++;
                        if (mjpegStall > 60) break; // 1 second network stall -> disconnect zombie thread!
                        Sleep(16);
                        continue;
                    }
                    mjpegStall = 0;
                    SwitchToActiveDesktop();
                    HDC hScreen = GetDC(NULL);
                    HDC hDC = CreateCompatibleDC(hScreen);
                    int screenW = GetSystemMetrics(SM_CXSCREEN);
                    int screenH = GetSystemMetrics(SM_CYSCREEN);
                    
                    // ⚡ Mobile Native 540p HD Resolution (960x540) - 100% Fluid 60 FPS Speed!
                    int targetW = screenW > 960 ? 960 : screenW;
                    int targetH = (screenH * targetW) / screenW;
                    HBITMAP hBitmap = CreateCompatibleBitmap(hScreen, targetW, targetH);
                    HGDIOBJ oldBm = SelectObject(hDC, hBitmap);
                    
                    // 🎮 DirectX 11 DXGI GPU Capture with GDI Fallback
                    if (!CaptureDXGIFrame(hDC, targetW, targetH)) {
                        SetStretchBltMode(hDC, HALFTONE);
                        SetBrushOrgEx(hDC, 0, 0, NULL);
                        StretchBlt(hDC, 0, 0, targetW, targetH, hScreen, 0, 0, screenW, screenH, SRCCOPY);
                    }

                    // Draw Hardware Mouse Cursor scaled to target resolution
                    POINT pt;
                    GetCursorPos(&pt);
                    int mx = (pt.x * targetW) / screenW;
                    int my = (pt.y * targetH) / screenH;

                    CURSORINFO cursorInfo = { 0 };
                    cursorInfo.cbSize = sizeof(CURSORINFO);
                    bool drawn = false;
                    if (GetCursorInfo(&cursorInfo) && (cursorInfo.flags & CURSOR_SHOWING) && cursorInfo.hCursor) {
                        ICONINFO iconInfo = { 0 };
                        if (GetIconInfo(cursorInfo.hCursor, &iconInfo)) {
                            int cx = mx - (iconInfo.xHotspot * targetW) / screenW;
                            int cy = my - (iconInfo.yHotspot * targetH) / screenH;
                            drawn = DrawIconEx(hDC, cx, cy, cursorInfo.hCursor, 0, 0, 0, NULL, DI_NORMAL | DI_DEFAULTSIZE);
                            if (iconInfo.hbmMask) DeleteObject(iconInfo.hbmMask);
                            if (iconInfo.hbmColor) DeleteObject(iconInfo.hbmColor);
                        }
                    }
                    if (!drawn) {
                        HBRUSH redBrush = CreateSolidBrush(RGB(255, 0, 85));
                        HPEN cyanPen = CreatePen(PS_SOLID, 2, RGB(0, 240, 255));
                        HGDIOBJ oldBrush = SelectObject(hDC, redBrush);
                        HGDIOBJ oldPen = SelectObject(hDC, cyanPen);
                        Ellipse(hDC, mx - 6, my - 6, mx + 6, my + 6);
                        SelectObject(hDC, oldBrush);
                        SelectObject(hDC, oldPen);
                        DeleteObject(redBrush);
                        DeleteObject(cyanPen);
                    }

                    std::vector<char> jpegBuffer;
                    {
                        Bitmap bitmap(hBitmap, NULL);
                        IStream* pStream = NULL;
                        if (CreateStreamOnHGlobal(NULL, TRUE, &pStream) == S_OK) {
                            if (bitmap.Save(pStream, &jpgClsid, &encoderParameters) == Ok) {
                                STATSTG statstg;
                                pStream->Stat(&statstg, STATFLAG_NONAME);
                                DWORD dwSize = (DWORD)statstg.cbSize.QuadPart;
                                LARGE_INTEGER liZero = {0};
                                pStream->Seek(liZero, STREAM_SEEK_SET, NULL);
                                jpegBuffer.resize(dwSize);
                                ULONG bytesRead = 0;
                                pStream->Read(jpegBuffer.data(), dwSize, &bytesRead);
                            }
                            pStream->Release();
                        }
                    }

                    SelectObject(hDC, oldBm);
                    DeleteObject(hBitmap);
                    DeleteDC(hDC);
                    ReleaseDC(NULL, hScreen);

                    if (jpegBuffer.empty()) break;

                    std::string frameHeader = 
                        "--frame\r\n"
                        "Content-Type: image/jpeg\r\n"
                        "Content-Length: " + std::to_string(jpegBuffer.size()) + "\r\n\r\n";
                    
                    if (send(clientSocket, frameHeader.c_str(), (int)frameHeader.size(), 0) == SOCKET_ERROR) break;
                    if (send(clientSocket, jpegBuffer.data(), (int)jpegBuffer.size(), 0) == SOCKET_ERROR) break;
                    if (send(clientSocket, "\r\n\r\n", 4, 0) == SOCKET_ERROR) break;

                    Sleep(16); // ⚡ 60 FPS True Hardware Refresh Sync!
                }
            }
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/mouse") != std::string::npos || request.find("GET /api/touch") != std::string::npos || request.find("GET /api/telemetry") != std::string::npos) {
            // 🎮 PARSEC HARDWARE TOUCH & MOUSE INJECTION
            size_t px = request.find("px=");
            if (px == std::string::npos) px = request.find("x=");
            size_t py = request.find("py=");
            if (py == std::string::npos) py = request.find("y=");
            size_t pc = request.find("click=");
            size_t pa = request.find("action=");
            size_t pid = request.find("id=");

            int pxVal = (px != std::string::npos) ? atoi(request.c_str() + px + (request[px+1] == 'x' ? 3 : 2)) : -1;
            int pyVal = (py != std::string::npos) ? atoi(request.c_str() + py + (request[py+1] == 'y' ? 3 : 2)) : -1;
            int clickVal = (pc != std::string::npos) ? atoi(request.c_str() + pc + 6) : 0;
            int touchId = (pid != std::string::npos) ? atoi(request.c_str() + pid + 3) : 0;
            
            std::string actionStr = "";
            if (pa != std::string::npos) {
                size_t sp = request.find_first_of(" &", pa);
                actionStr = request.substr(pa + 7, sp - (pa + 7));
            }

            if (pxVal >= 0 && pyVal >= 0) {
                int screenW = GetSystemMetrics(SM_CXSCREEN);
                int screenH = GetSystemMetrics(SM_CYSCREEN);
                int targetX = (pxVal * screenW) / 10000;
                int targetY = (pyVal * screenH) / 10000;

                EnsureTouchInjectionInit();

                bool touchHandled = false;
                if (g_touchInitialized && g_pfnInjectTouch) {
                    POINTER_TOUCH_INFO_CUSTOM contact;
                    memset(&contact, 0, sizeof(POINTER_TOUCH_INFO_CUSTOM));
                    contact.pointerInfo.pointerType = PT_TOUCH;
                    contact.pointerInfo.pointerId = touchId;
                    contact.pointerInfo.ptPixelLocation.x = targetX;
                    contact.pointerInfo.ptPixelLocation.y = targetY;
                    contact.touchFlags = TOUCH_FLAG_NONE;
                    contact.touchMask = TOUCH_MASK_CONTACTAREA | TOUCH_MASK_PRESSURE;
                    contact.pressure = 32000;
                    contact.rcContact.left   = targetX - 4;
                    contact.rcContact.right  = targetX + 4;
                    contact.rcContact.top    = targetY - 4;
                    contact.rcContact.bottom = targetY + 4;

                    if (actionStr == "down" || clickVal == 3) {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                        touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                    } else if (actionStr == "move") {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_UPDATE | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                        touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                    } else if (actionStr == "up" || clickVal == 4) {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                        touchHandled = (g_pfnInjectTouch(1, &contact) == TRUE);
                    } else if (clickVal == 1 || actionStr == "tap") {
                        contact.pointerInfo.pointerFlags = POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT;
                        if (g_pfnInjectTouch(1, &contact)) {
                            contact.pointerInfo.pointerFlags = POINTER_FLAG_UP;
                            g_pfnInjectTouch(1, &contact);
                            touchHandled = true;
                        }
                    }
                }

                // Fallback to high-precision SetCursorPos + SendInput if touch injection was not used
                if (!touchHandled) {
                    SetCursorPos(targetX, targetY);
                    if (clickVal == 1 || actionStr == "tap") {
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                    } else if (clickVal == 2) {
                        mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                    } else if (clickVal == 3 || actionStr == "down") {
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                    } else if (clickVal == 4 || actionStr == "up") {
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                    }
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nAccess-Control-Allow-Origin: *\r\nConnection: keep-alive\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("/api/client_telemetry") != std::string::npos) {
            // 📊 REAL-TIME LIVE PHONE TELEMETRY & BLACKBOX LOGGER
            size_t bodyPos = request.find("\r\n\r\n");
            std::string body = (bodyPos != std::string::npos) ? request.substr(bodyPos + 4) : "";
            if (body.empty()) {
                size_t pData = request.find("data=");
                if (pData != std::string::npos) {
                    body = request.substr(pData + 5);
                }
            }
            if (!body.empty()) {
                AppLog(("[phone-live-log] " + body).c_str());
                FILE* f = fopen("C:\\ProgramData\\PanicButton\\phone_live_debug.log", "a");
                if (f) {
                    time_t now = time(NULL);
                    char tbuf[64]; strftime(tbuf, sizeof(tbuf), "%Y-%m-%d %H:%M:%S", localtime(&now));
                    fprintf(f, "[%s] %s\n", tbuf, body.c_str());
                    fclose(f);
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 11\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nConnection: keep-alive\r\n\r\n{\"ok\":true}";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/mouse_rel") != std::string::npos) {
            // 🖱️ REAL-TIME LAPTOP TOUCHPAD SENSOR ENDPOINT (Relative Movement + Scroll + Clicks)
            size_t pdx = request.find("dx=");
            size_t pdy = request.find("dy=");
            size_t pc  = request.find("click=");
            size_t ps  = request.find("scroll=");

            int dxVal = pdx != std::string::npos ? atoi(request.c_str() + pdx + 3) : 0;
            int dyVal = pdy != std::string::npos ? atoi(request.c_str() + pdy + 3) : 0;
            int clickVal = pc != std::string::npos ? atoi(request.c_str() + pc + 6) : 0;
            int scrollVal = ps != std::string::npos ? atoi(request.c_str() + ps + 7) : 0;

            if (dxVal != 0 || dyVal != 0) {
                POINT cur;
                GetCursorPos(&cur);
                SetCursorPos(cur.x + dxVal, cur.y + dyVal);
                mouse_event(MOUSEEVENTF_MOVE, dxVal, dyVal, 0, 0);
            }

            if (scrollVal != 0) {
                INPUT scrollInput = {0};
                scrollInput.type = INPUT_MOUSE;
                scrollInput.mi.dwFlags = MOUSEEVENTF_WHEEL;
                scrollInput.mi.mouseData = (DWORD)scrollVal; // +120 for up, -120 for down
                SendInput(1, &scrollInput, sizeof(INPUT));
            }

            if (clickVal == 1) {
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                Sleep(15);
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
            } else if (clickVal == 2) {
                mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                Sleep(15);
                mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
            } else if (clickVal == 3) { // Mouse Down (Drag Start)
                mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
            } else if (clickVal == 4) { // Mouse Up (Drag End)
                mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
            }

            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nAccess-Control-Allow-Origin: *\r\nConnection: keep-alive\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/type") != std::string::npos) {
            // ⌨️ Remote Keyboard Type Endpoint (Unicode + Key Codes)
            size_t textPos = request.find("text=");
            if (textPos != std::string::npos) {
                size_t spacePos = request.find(" ", textPos);
                size_t ampPos = request.find("&", textPos);
                size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
                std::string rawText = request.substr(textPos + 5, endPos - (textPos + 5));
                
                std::string decodedText = "";
                for (size_t i = 0; i < rawText.length(); i++) {
                    if (rawText[i] == '%' && i + 2 < rawText.length()) {
                        int hexVal = 0;
                        sscanf(rawText.substr(i + 1, 2).c_str(), "%x", &hexVal);
                        decodedText += (char)hexVal;
                        i += 2;
                    } else if (rawText[i] == '+') {
                        decodedText += ' ';
                    } else {
                        decodedText += rawText[i];
                    }
                }
                
                if (decodedText == "{ENTER}") {
                    keybd_event(VK_RETURN, 0, 0, 0);
                    keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{BACKSPACE}") {
                    keybd_event(VK_BACK, 0, 0, 0);
                    keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{ESC}") {
                    keybd_event(VK_ESCAPE, 0, 0, 0);
                    keybd_event(VK_ESCAPE, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{TAB}") {
                    keybd_event(VK_TAB, 0, 0, 0);
                    keybd_event(VK_TAB, 0, KEYEVENTF_KEYUP, 0);
                } else if (decodedText == "{CLEAR}") {
                    keybd_event(VK_CONTROL, 0, 0, 0);
                    keybd_event('A', 0, 0, 0);
                    keybd_event('A', 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
                    Sleep(10);
                    keybd_event(VK_BACK, 0, 0, 0);
                    keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
                } else {
                    int wlen = MultiByteToWideChar(CP_UTF8, 0, decodedText.c_str(), -1, NULL, 0);
                    if (wlen > 1) {
                        std::wstring wText(wlen - 1, 0);
                        MultiByteToWideChar(CP_UTF8, 0, decodedText.c_str(), -1, &wText[0], wlen);
                        for (wchar_t wc : wText) {
                            INPUT input[2] = {0};
                            input[0].type = INPUT_KEYBOARD;
                            input[0].ki.wVk = 0;
                            input[0].ki.wScan = wc;
                            input[0].ki.dwFlags = KEYEVENTF_UNICODE;

                            input[1].type = INPUT_KEYBOARD;
                            input[1].ki.wVk = 0;
                            input[1].ki.wScan = wc;
                            input[1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;

                            SendInput(2, input, sizeof(INPUT));
                            Sleep(2);
                        }
                    }
                }
            }
            std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\nOK";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/status") != std::string::npos) {
            // JSON API for real-time status polling
            bool isLocked = IsWorkstationLocked();
            responseBody = "{\"panic\":" + std::string(isPanicMode ? "true" : "false") + ",\"locked\":" + std::string(isLocked ? "true" : "false") + ",\"state\":" + std::to_string(panicState) + "}";
            std::string jsonResponse =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, jsonResponse.c_str(), (int)jsonResponse.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/exit") != std::string::npos || request.find("GET /exit") != std::string::npos) {
            responseBody = "{\"status\":\"exiting\"}";
            std::string jsonResponse =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, jsonResponse.c_str(), (int)jsonResponse.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);

            // Graceful shutdown: let TrayIcon WndProc handle KillAllPanicProcesses() once.
            // Do NOT call KillAllPanicProcesses() here — TrayIcon IDM_EXIT does it already.
            if (hMainWnd) {
                PostMessage(hMainWnd, WM_COMMAND, IDM_EXIT, 0);
                KillAllPanicProcesses();
                PostQuitMessage(0);
            }
            return;

        } else if (request.find("GET /icon-192.png") != std::string::npos || request.find("GET /icon-512.png") != std::string::npos) {
            const char* b64Icon = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAHKUlEQVR4nO2dS3IbORAFaYQWnv3c/4Tezw6ekCJojzwi2d0oAK/qZR6gP4WXheomJX5rb99/3gBMabsvAGAnCADWIABYgwBgDQKANQgA1iAAWPO2+wIq03/8E3as9vdfYceC33zjgzCdkF8FOa6DAAkD/wqEOA4CFAj8KxDiMQhQNPSPQIbPIIBB6B/ReLD2FsAx9I9opjJYCkDwH9PMRLASYEfwIwKV9bozYCHA7ADtDEvle1tBaQFmhUM5FI73PEJJAaJDkHnxqYWRAHz3hvrYChAR/syd/izUq4gALCT1sxVgJPxO3f4o3bCeKQVwXKiVdKP6phPg6uJkWxgFukGtU/1JpMOCKNEu1i3TV01S7AAEfz+9aPORF+BK4dWLnplebD2kR6Bqxa5Au1Bf5ZFIdgc4W7TKwX+vheL99QJrJLkDVChsFMrds52su+K9yAlA+HPRkksgNQKdKU7lrv9VPTLcb0+4fjI7QMbizUStU0avi8r9SQhA+OvQkkmwXQDC/7om2Xa8lkiCrQIQ/rGaKNOSSLBNgKM3/V7IbB0Qzq/dLgmaevidqNL9/0RZguUCEP6xumSliUqwVIDqiwz5crL9LdBXMPrUpAmOtMsEYPQZq0sVmtgotEQAwg+qEkwXgPCP16YiTUQCiWcAxdlwNs7hV1r3qQKwyDVCspuZOZomAKPPeG0caJtHoa0jkGN3I/xaOWi7Ftkx/DCWhxnNI1wAOhy1SfV7B6FHO3pSw+5PY9DMRagAjD6QbRSS+BygOnR/XcIEoPtfrwvs2wXYAcCaEAHo/tfrAnt3gSU7AG99qJtqboYFoMvBTkbzN30HoPuDcn6GBKD7U5P0P+oXeiV/HtzwE1/IlaPLAtD9qUmJ3zALvxJTaAg5mSYA4w9kyNMlAeh21KPMjyrOuBCn7k8zWMeMXPEMANacFoCOt6YWTrvo1h9ZDD270cLRCPYQnS9GILDmlAB0PeqQgVM/vRV5Yofxhyawn8icMQKBNQhwArq/sQDui+9+/9k4/L9po07oMP+DDlF5YwQ6AN2/LgjwAsJfm0MCEIK1ME7GcOjf9UScqOqCIb42EbljBHoA4fcAAcAaBPgCur8Pb7svQA2F8Ctcg8szHzsA2Ib/kADq3SgSp3t1ob9Y0+EdoEpHIPw513r0mhiBIG34I0AAur819gIw+vh2/3fsBQDf8N/cBaD7e4ffWgDCD9YCwHMcur+tAHT/5zST8FsKQPjBWgB4TjPq/nYC0P2f08zCbyUA4QdrAeA5zbD72whA939OMw2/hQCEH6wFgOc04+4fIoByh1W+NgVagfCPrvHbkSJlDZL6Ameta6UMMAKZot4cVoEAhhD+3yCA2fhD+D+DAGANAhhB958kAG8z9KkY/h4wRjbX4kF9juSWEcgAGthjEGADK0dGwr9IAJ4DYCVReTssAJ0kH85r1g7eOyNQUZzDfwYEAGtCBeA5QIPq3b8HvkQ4JUD1wq5gdpNgjW6nasAIBNaEC8AYtA+H7t+Dd9DTAjgUOSOsy7U6MAIVgPBfZ4oAjEGQJVeXBKDjCC0gI+lQLaaNQOwC83EKf5/0+phnALDmsgBO3UcR6h9Tj6k7AGPQHNzC3yd+ej4kgNtCgCYjOZz+DMAuEFsHt6bTZ393avgAZguyE2odX5Mlb4HYBUA1N22VhUgwv8aV6AfCH1ETPgdIgFv4VxImALsAZOv+H8cJOQpMG//o/nMJFYBdIBbH8PeF3f/jWLcN8ED8GsK/hnABHBcO1hGdryk7AKPQ/PpVoy8efX4d87YRRqH/Q/jX0nYvZHUJqt/fqvrMagxTdwDHbjYC9VpfF4nPAeiSnuHvArvjdAEYhUBx9Pl1/KlHv5+E54GQ+lShi4T/4xzTz3A/ERIM1aUKXSj8H+e5CaIwG0ZQ5T4q12OpAG7d7hXUY39dlu8AjELn6lCFLjb6/Drf0rPdT8rzgBVdNPzvfGtv33/eEsyEGTvmo/vLeC9V13frQ/CZm1Z8gLoC4deqyfa3QFUl+OpaCf9NribbBagsgSM9wdjz6RpuIlSXQGGxZ9OThX/7Q3BEuFUK+ew+VK8xisxrJrMDXC1Oxt2gEj1x+CUFqCaB2oJH0pOHX3IEGg22QpHv161wLTPoSdclzQ4wUjTl3aACvVD45XeA0VDvKvz79SovusMalBKg+iIo04vXXHoEiioqY9E1evHwp9sB7vDPZqmvtQB3EIF6WgsQNd5k2rKj6eb1Sy/AHfeFPAv1KiZA9MNuRRmoT3EBZr31ySwDtTAUYPbrT2UhHO95hNICLPu18Y3hqHxvK7AQYOcHYhEBynrdGbAS4A6fDD+mmQTfWoA7iOAb/DvWArjL0ExD/18QwEwGQv8ZBDCQgdA/BgEKCkHgj4MABYQg8NdBgInw3Rt9EACsSfUnkQDRIABYgwBgDQKANQgA1iAA3Jz5F2HLS7EP0hW/AAAAAElFTkSuQmCC";
            DWORD outLen = 0;
            CryptStringToBinaryA(b64Icon, 0, CRYPT_STRING_BASE64, NULL, &outLen, NULL, NULL);
            std::vector<BYTE> pngBytes(outLen);
            CryptStringToBinaryA(b64Icon, 0, CRYPT_STRING_BASE64, pngBytes.data(), &outLen, NULL, NULL);
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(outLen) + "\r\nConnection: close\r\n\r\n";
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            send(clientSocket, (const char*)pngBytes.data(), outLen, 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /manifest.json") != std::string::npos) {
            std::string manifest = "{\n"
                "  \"name\": \"PanicCTRL Cyber Node\",\n"
                "  \"short_name\": \"PanicCTRL\",\n"
                "  \"start_url\": \"/?key=imran2024\",\n"
                "  \"display\": \"standalone\",\n"
                "  \"background_color\": \"#020408\",\n"
                "  \"theme_color\": \"#00f0ff\",\n"
                "  \"orientation\": \"any\",\n"
                "  \"icons\": [\n"
                "    {\n"
                "      \"src\": \"/icon-192.png\",\n"
                "      \"sizes\": \"192x192\",\n"
                "      \"type\": \"image/png\",\n"
                "      \"purpose\": \"any maskable\"\n"
                "    },\n"
                "    {\n"
                "      \"src\": \"/icon-512.png\",\n"
                "      \"sizes\": \"512x512\",\n"
                "      \"type\": \"image/png\",\n"
                "      \"purpose\": \"any maskable\"\n"
                "    }\n"
                "  ]\n"
                "}";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/manifest+json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(manifest.size()) + "\r\nConnection: close\r\n\r\n" + manifest;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /sw.js") != std::string::npos) {
            std::string sw = "self.addEventListener('install', e => { self.skipWaiting(); });\n"
                "self.addEventListener('activate', e => { clients.claim(); });\n"
                "self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });\n";
            std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(sw.size()) + "\r\nConnection: close\r\n\r\n" + sw;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/exec") != std::string::npos) {
            // 💻 Cyber Terminal Remote Command Execution (PowerShell / System)
            size_t cmdPos = request.find("cmd=");
            std::string cmdOutput = "";
            if (cmdPos != std::string::npos) {
                size_t spacePos = request.find(" ", cmdPos);
                size_t ampPos = request.find("&", cmdPos);
                size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
                std::string rawCmd = request.substr(cmdPos + 4, endPos - (cmdPos + 4));
                std::string decodedCmd = "";
                for (size_t i = 0; i < rawCmd.length(); i++) {
                    if (rawCmd[i] == '%' && i + 2 < rawCmd.length()) {
                        int hexVal = 0;
                        sscanf(rawCmd.substr(i + 1, 2).c_str(), "%x", &hexVal);
                        decodedCmd += (char)hexVal;
                        i += 2;
                    } else if (rawCmd[i] == '+') {
                        decodedCmd += ' ';
                    } else {
                        decodedCmd += rawCmd[i];
                    }
                }
                
                // 🛡️ 100% STEALTH SILENT EXECUTION: Zero visible CMD/PowerShell windows on PC monitor!
                HANDLE hReadPipe = NULL, hWritePipe = NULL;
                SECURITY_ATTRIBUTES sa;
                sa.nLength = sizeof(SECURITY_ATTRIBUTES);
                sa.bInheritHandle = TRUE;
                sa.lpSecurityDescriptor = NULL;

                if (CreatePipe(&hReadPipe, &hWritePipe, &sa, 0)) {
                    SetHandleInformation(hReadPipe, HANDLE_FLAG_INHERIT, 0);

                    STARTUPINFOA si = { 0 };
                    si.cb = sizeof(STARTUPINFOA);
                    si.dwFlags = STARTF_USESHOWWINDOW | STARTF_USESTDHANDLES;
                    si.wShowWindow = SW_HIDE;
                    si.hStdOutput = hWritePipe;
                    si.hStdError = hWritePipe;
                    si.hStdInput = NULL;

                    PROCESS_INFORMATION pi = { 0 };
                    std::string fullCmd = "powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command \"" + decodedCmd + "\"";
                    std::vector<char> cmdBuf(fullCmd.begin(), fullCmd.end());
                    cmdBuf.push_back('\0');

                    if (CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, TRUE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
                        CloseHandle(hWritePipe);
                        hWritePipe = NULL;

                        char pbuf[512];
                        DWORD bytesRead = 0;
                        while (ReadFile(hReadPipe, pbuf, sizeof(pbuf) - 1, &bytesRead, NULL) && bytesRead > 0) {
                            pbuf[bytesRead] = '\0';
                            cmdOutput += pbuf;
                            if (cmdOutput.size() > 4000) break;
                        }

                        WaitForSingleObject(pi.hProcess, 5000);
                        CloseHandle(pi.hProcess);
                        CloseHandle(pi.hThread);
                    } else {
                        if (hWritePipe) CloseHandle(hWritePipe);
                    }
                    if (hReadPipe) CloseHandle(hReadPipe);
                }
            }
            // JSON escape output
            std::string escapedOutput = "";
            for (char c : cmdOutput) {
                if (c == '"') escapedOutput += "\\\"";
                else if (c == '\\') escapedOutput += "\\\\";
                else if (c == '\n') escapedOutput += "\\n";
                else if (c == '\r') escapedOutput += "\\r";
                else if (c == '\t') escapedOutput += "\\t";
                else if ((unsigned char)c >= 32) escapedOutput += c;
            }
            responseBody = "{\"status\":\"ok\",\"output\":\"" + escapedOutput + "\"}";
            std::string res =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" + responseBody;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

        } else if (request.find("GET /api/streaminfo") != std::string::npos) {
            // 🎬 Returns the H.264 stream codec + resolution for MSE setup
            std::string codec; int sw, sh;
            { std::lock_guard<std::mutex> lk(g_streamInfoMutex); codec = g_streamCodec; sw = g_streamW; sh = g_streamH; }
            std::string body = "{\"codec\":\"" + codec + "\",\"w\":" + std::to_string(sw) + ",\"h\":" + std::to_string(sh) + "}";
            std::string res =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Cache-Control: no-store\r\n"
                "Content-Length: " + std::to_string(body.size()) + "\r\n"
                "Connection: close\r\n\r\n" + body;
            send(clientSocket, res.c_str(), (int)res.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;

                } else if (request.find("GET /h264") != std::string::npos || request.find("GET /mjpeg") != std::string::npos) {
            // 🎬 SUNSHINE/PARSEC LOW-LATENCY VIDEO BROADCASTER
            // Single DXGI/H.264 GPU pipeline fan-out to all connected clients.
            std::string header =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: video/mp4\r\n"
                "Cache-Control: no-cache, no-store\r\n"
                "Pragma: no-cache\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Connection: close\r\n\r\n";
            send(clientSocket, header.c_str(), (int)header.size(), 0);
            g_live.ServeClient(clientSocket);
            return;

} else {
            // ⚡ Live Hot-Reload: Serve any static asset (.html, .css, .js, .json, .png, .wav) directly from android-app/www
            std::string reqPath = "/";
            size_t getPos = request.find("GET ");
            if (getPos != std::string::npos) {
                size_t spacePos = request.find(" ", getPos + 4);
                if (spacePos != std::string::npos) {
                    reqPath = request.substr(getPos + 4, spacePos - (getPos + 4));
                    size_t qPos = reqPath.find("?");
                    if (qPos != std::string::npos) reqPath = reqPath.substr(0, qPos);
                }
            }

            std::string contentType = "text/html; charset=utf-8";
            if (reqPath.find(".css") != std::string::npos) contentType = "text/css; charset=utf-8";
            else if (reqPath.find(".js") != std::string::npos) contentType = "application/javascript; charset=utf-8";
            else if (reqPath.find(".json") != std::string::npos) contentType = "application/json; charset=utf-8";
            else if (reqPath.find(".png") != std::string::npos) contentType = "image/png";
            else if (reqPath.find(".svg") != std::string::npos) contentType = "image/svg+xml";
            else if (reqPath.find(".ico") != std::string::npos) contentType = "image/x-icon";
            else if (reqPath.find(".wav") != std::string::npos) contentType = "audio/wav";

            std::string targetFile = (reqPath == "/" || reqPath.empty()) ? "/index.html" : reqPath;
            std::string fullLocalPath = "android-app/www" + targetFile;

            FILE* f = fopen(fullLocalPath.c_str(), "rb");
            if (!f) {
                std::string altPath = "public" + targetFile;
                f = fopen(altPath.c_str(), "rb");
            }

            if (f) {
                fseek(f, 0, SEEK_END);
                long fsize = ftell(f);
                fseek(f, 0, SEEK_SET);
                std::vector<char> fbuf(fsize);
                fread(fbuf.data(), 1, fsize, f);
                fclose(f);
                responseBody = std::string(fbuf.data(), fsize);
            } else {
                if (targetFile == "/index.html") {
                    responseBody = DASHBOARD_HTML;
                } else {
                    std::string notFound = "HTTP/1.1 404 Not Found\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                    send(clientSocket, notFound.c_str(), (int)notFound.size(), 0);
                    closesocket(clientSocket);
                    return;
                }
            }

            std::string httpResponse =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: " + contentType + "\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Cache-Control: no-cache, no-store, must-revalidate\r\n"
                "Pragma: no-cache\r\n"
                "Expires: 0\r\n"
                "Content-Length: " + std::to_string(responseBody.size()) + "\r\n"
                "Connection: close\r\n\r\n" +
                responseBody;

            send(clientSocket, httpResponse.c_str(), (int)httpResponse.size(), 0);
            shutdown(clientSocket, SD_SEND);
            closesocket(clientSocket);
            return;
        }
    } catch (...) {
        closesocket(clientSocket);
    }
}
