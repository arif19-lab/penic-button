/**
 * 🌐 NETWORK & HOST DISCOVERY ENGINE (100% Direct LAN / WebSocket)
 */

// Direct LAN PC endpoint routing & Dynamic Hotspot/Wi-Fi Detection
(function() {
  try {
    var params = new URLSearchParams(window.location.search);
    var keyParam = params.get('key');
    if (keyParam) {
      localStorage.setItem('panic_key', keyParam);
    }
    // If loading directly from PC web server (any IP or domain)
    if (window.location.protocol.startsWith('http')) {
      localStorage.setItem('panic_pc_endpoint', window.location.origin);
    }
  } catch(e) {}
})();

function sanitizeEndpoint(url) {
  if (!url || typeof url !== 'string') return '';
  var clean = url.trim().replace(/^https?:\/\//, '').replace(/^\/+/, '');
  if (!clean) return '';
  var proto = url.startsWith('https://') ? 'https://' : 'http://';
  if (!clean.includes(':')) {
    clean += ':8085';
  }
  return proto + clean;
}

var _urlParams = new URLSearchParams(window.location.search);
var KEY = _urlParams.get('key') || localStorage.getItem('panic_key') || 'imran2024';
var PC_ENDPOINT = (function() {
  if (window.location.protocol.startsWith('http')) {
    return window.location.origin;
  }
  return sanitizeEndpoint(localStorage.getItem('panic_pc_endpoint')) || window.location.origin;
})();

function getApiUrl(path) {
  if (!PC_ENDPOINT || window.location.origin === PC_ENDPOINT) return path;
  var base = PC_ENDPOINT;
  if (base.endsWith('/')) base = base.slice(0, -1);
  return base + (path.startsWith('/') ? path : '/' + path);
}

function getWsUrl(path) {
  if (PC_ENDPOINT && PC_ENDPOINT !== window.location.origin) {
    var wsProto = PC_ENDPOINT.startsWith('https') ? 'wss://' : 'ws://';
    var cleanHost = PC_ENDPOINT.replace('https://', '').replace('http://', '');
    if (cleanHost.endsWith('/')) cleanHost = cleanHost.slice(0, -1);
    return wsProto + cleanHost + path;
  }
  var wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return wsProto + '//' + window.location.host + path;
}

// ⚡ Global Fetch & Beacon Interceptor
(function() {
  var _origFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = getApiUrl(input);
    }
    return _origFetch.call(this, input, init);
  };
  if (navigator.sendBeacon) {
    var _origBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = getApiUrl(url);
      }
      return _origBeacon.call(this, url, data);
    };
  }
})();

function saveAndConnectPc() {
  var input = document.getElementById('pcIpInput');
  if (!input) return;
  var val = sanitizeEndpoint(input.value);
  if (!val) {
    alert('Please enter your PC IP address (e.g. 10.72.151.59:8080 or 192.168.0.104:8080)');
    return;
  }
  localStorage.setItem('panic_pc_endpoint', val);
  PC_ENDPOINT = val;
  input.value = val;
  checkPcConnection();
  if (typeof startLiveStream === 'function') startLiveStream();
}

function checkPcConnection() {
  var badge = document.getElementById('pcPingBadge');
  var dot = document.getElementById('pcStatusDot');
  if (!badge) return;
  badge.textContent = 'CONNECTING...';
  badge.style.color = '#00f3ff';
  var t0 = performance.now();
  fetch(getApiUrl('/api/status?key=' + KEY), { cache: 'no-cache' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var ms = Math.round(performance.now() - t0);
      badge.textContent = '🟢 CONNECTED (' + ms + 'ms)';
      badge.style.color = '#00ff41';
      if (dot) {
        dot.style.background = '#00ff41';
        dot.style.boxShadow = '0 0 10px #00ff41';
      }
    })
    .catch(function(err) {
      badge.textContent = '🔴 DISCONNECTED';
      badge.style.color = '#ff003c';
      if (dot) {
        dot.style.background = '#ff003c';
        dot.style.boxShadow = '0 0 10px #ff003c';
      }
    });
}

window.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('pcIpInput');
  if (input) input.value = PC_ENDPOINT;
  checkPcConnection();
  setInterval(checkPcConnection, 3000);
  setTimeout(connectCommandWS, 2000);
});




// Direct command WebSocket.
var _cmdWS = null;
function connectCommandWS() {
  if (_cmdWS && (_cmdWS.readyState === WebSocket.OPEN || _cmdWS.readyState === WebSocket.CONNECTING)) return;
  try {
    var wsUrl = getWsUrl('/cmd-ws?key=' + KEY);
    console.log('[CmdWS] Connecting to:', wsUrl);
    _cmdWS = new WebSocket(wsUrl);
    _cmdWS.onopen = function() { console.log('[CmdWS] Connected! Commands will use WebSocket.'); };
    _cmdWS.onclose = function() {
      _cmdWS = null;
      setTimeout(connectCommandWS, 3000);
    };
    _cmdWS.onerror = function() { if (_cmdWS) _cmdWS.close(); };
  } catch(e) { console.warn('[CmdWS] Error:', e); }
}
var probedOk = false;
