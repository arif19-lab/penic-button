/**
 * PanicButton WebRTC Bridge Server
 * 
 * Architecture:
 *   C++ Server (port 8080) → WebSocket JPEG frames (ws://localhost:8080/ws)
 *       ↓
 *   This Node.js Bridge (port 9090)
 *       ↓ WebRTC (UDP, LAN only, no STUN/TURN needed)
 *   Android Phone (RTCPeerConnection)
 * 
 * How it works:
 * 1. Connects to C++ server's WebSocket and receives JPEG binary frames
 * 2. Phone opens http://PC_IP:9090 → gets WebRTC offer via /offer endpoint
 * 3. Phone sends answer via POST /answer
 * 4. WebRTC UDP channel established → JPEG frames forwarded as DataChannel messages
 * 5. Phone renders frames on Canvas GPU — ~30-50ms total latency on LAN WiFi
 */

const http = require('http');
const WebSocket = require('ws');
const { RTCPeerConnection, RTCSessionDescription } = require('@roamhq/wrtc');

const C_SERVER_WS = 'ws://127.0.0.1:8080/ws?key=imran2024';
const BRIDGE_PORT = 9090;

// ── Latest JPEG frame buffer (shared across all WebRTC clients) ──
let latestFrame = null;
let frameSeq = 0;
const frameListeners = new Set(); // callbacks when new frame arrives

// ── Connect to C++ server WebSocket ──
function connectToCapture() {
  console.log('[bridge] Connecting to C++ capture server...');
  const ws = new WebSocket(C_SERVER_WS);
  ws.binaryType = 'arraybuffer';

  ws.on('open', () => {
    console.log('[bridge] ✅ Connected to C++ capture server');
  });

  ws.on('message', (data) => {
    if (!(data instanceof ArrayBuffer) && !Buffer.isBuffer(data)) return;
    latestFrame = Buffer.isBuffer(data) ? data : Buffer.from(data);
    frameSeq++;
    // Notify all active WebRTC clients of new frame
    for (const cb of frameListeners) {
      try { cb(latestFrame); } catch(e) {}
    }
  });

  ws.on('close', () => {
    console.log('[bridge] C++ server disconnected, reconnecting in 1s...');
    setTimeout(connectToCapture, 1000);
  });

  ws.on('error', (e) => {
    console.log('[bridge] WS error:', e.message);
    ws.terminate();
  });
}

// ── Active WebRTC sessions ──
const sessions = new Map(); // id -> { pc, dc, active }

// ── HTTP Server (signaling + web UI) ──
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  // ── GET / → Web UI (for browser testing) ──
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(getWebUI());
    return;
  }

  // ── GET /offer → Create WebRTC offer, return to phone ──
  if (req.method === 'GET' && req.url.startsWith('/offer')) {
    const id = Math.random().toString(36).slice(2);
    const pc = new RTCPeerConnection({ iceServers: [] }); // LAN: no STUN needed!

    // DataChannel for sending JPEG frames as binary
    const dc = pc.createDataChannel('frames', {
      ordered: false,      // Drop old frames — we want latest always
      maxRetransmits: 0,   // Zero retransmit = zero bufferbloat
    });

    dc.onopen = () => {
      console.log(`[webrtc:${id}] DataChannel open — starting stream`);
      const listener = (frame) => {
        if (dc.readyState !== 'open') {
          frameListeners.delete(listener);
          return;
        }
        try {
          dc.send(frame);
        } catch(e) {
          frameListeners.delete(listener);
        }
      };
      frameListeners.add(listener);
      sessions.set(id, { pc, dc, listener, active: true });
      // Send current frame immediately
      if (latestFrame) { try { dc.send(latestFrame); } catch(e){} }
    };

    dc.onclose = () => {
      console.log(`[webrtc:${id}] DataChannel closed`);
      const s = sessions.get(id);
      if (s) { frameListeners.delete(s.listener); sessions.delete(id); }
    };

    pc.onicecandidate = () => {}; // We use end-of-candidates (no trickle for simplicity)

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering to finish (LAN only → fast)
    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') { resolve(); return; }
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') resolve();
      };
      setTimeout(resolve, 3000); // max 3s wait
    });

    const sdpOffer = JSON.stringify({ id, sdp: pc.localDescription });
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(sdpOffer);
    sessions.set(id, { pc, dc, listener: null, active: false });
    console.log(`[webrtc:${id}] Offer sent to client`);
    return;
  }

  // ── POST /answer → Receive answer from phone ──
  if (req.method === 'POST' && req.url === '/answer') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { id, sdp } = JSON.parse(body);
        const s = sessions.get(id);
        if (!s) { res.writeHead(404); res.end('Session not found'); return; }
        await s.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end('{"ok":true}');
        console.log(`[webrtc:${id}] ✅ Answer received — WebRTC connecting!`);
      } catch(e) {
        console.error('[answer error]', e.message);
        res.writeHead(500); res.end(e.message);
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ── Web UI for browser testing ──
function getWebUI() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PanicButton WebRTC</title>
<style>
  body { background:#07090e; color:#e2e8f0; font-family:monospace; display:flex;
         flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  canvas { max-width:100%; border:1px solid #00f0ff; border-radius:8px; }
  button { margin:12px; padding:14px 28px; background:#00f0ff; color:#000;
           font-weight:bold; border:none; border-radius:8px; font-size:15px; cursor:pointer; }
  #status { color:#00ff41; font-size:13px; margin:8px; }
</style></head><body>
<h2 style="color:#00f0ff;letter-spacing:3px">⚡ PANIC CTRL — WebRTC Stream</h2>
<div id="status">Tap START to connect</div>
<canvas id="c"></canvas>
<button onclick="start()">▶ START WebRTC STREAM</button>
<script>
const HOST = window.location.hostname;
let pc, active = false;

async function start() {
  document.getElementById('status').textContent = 'Connecting...';
  const res = await fetch('http://' + HOST + ':9090/offer');
  const { id, sdp } = await res.json();

  pc = new RTCPeerConnection({ iceServers: [] });

  pc.ondatachannel = (e) => {
    const dc = e.channel;
    dc.binaryType = 'arraybuffer';
    document.getElementById('status').textContent = '✅ WebRTC Live!';
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');

    dc.onmessage = (ev) => {
      const blob = new Blob([ev.data], { type: 'image/jpeg' });
      createImageBitmap(blob).then(bmp => {
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        ctx.drawImage(bmp, 0, 0);
        bmp.close();
      });
    };
  };

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await fetch('http://' + HOST + ':9090/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, sdp: pc.localDescription })
  });
}
</script></body></html>`;
}

// ── Start everything ──
connectToCapture();
server.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`\n[bridge] ✅ WebRTC Bridge running at http://0.0.0.0:${BRIDGE_PORT}`);
  console.log(`[bridge] Open on phone: http://YOUR_PC_IP:${BRIDGE_PORT}`);
  console.log(`[bridge] Waiting for C++ capture server on port 8080...\n`);
});
