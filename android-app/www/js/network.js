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
  if (window.location.protocol.startsWith('http') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  var saved = sanitizeEndpoint(localStorage.getItem('panic_pc_endpoint'));
  if (saved && !saved.includes('127.0.0.1') && !saved.includes('localhost')) {
    return saved;
  }
  // ⚡ Default to Tailscale Worldwide IP (Works Everywhere)
  return 'http://100.83.195.91:8085';
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

function getNetworkInfo() {
  var ep = PC_ENDPOINT || window.location.origin || '';
  var host = '';
  try {
    var u = new URL(ep.startsWith('http') ? ep : ('http://' + ep));
    host = u.hostname.toLowerCase();
  } catch(e) {
    host = ep.split(':')[0].toLowerCase();
  }

  // Tailscale: MagicDNS (.ts.net) or CGNAT 100.64.0.0/10 range (100.64.0.0 - 100.127.255.255)
  var isTailscale = false;
  if (host.includes('.ts.net')) {
    isTailscale = true;
  } else if (host.startsWith('100.')) {
    var parts = host.split('.');
    if (parts.length >= 2) {
      var secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 64 && secondOctet <= 127) {
        isTailscale = true;
      } else {
        isTailscale = true; // In our context, any 100.x node is Tailscale
      }
    }
  }

  var isLocal = false;
  if (!isTailscale) {
    if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.') || host === 'localhost' || host === '127.0.0.1') {
      isLocal = true;
    }
  }

  var type = isTailscale ? 'TAILSCALE' : (isLocal ? 'LOCAL WI-FI' : 'REMOTE');
  return {
    type: type,
    isTailscale: isTailscale,
    isLocal: isLocal,
    host: host,
    endpoint: ep
  };
}

function updateNetworkUi(isConnected, ms) {
  var net = getNetworkInfo();
  var badge = document.getElementById('activeNetworkBadge');
  var dot = document.getElementById('networkStatusDot');
  var txt = document.getElementById('networkStatusText');

  var detailType = document.getElementById('detailLinkType');
  var detailHost = document.getElementById('detailHostIp');
  var detailPing = document.getElementById('detailPingMs');

  if (isConnected) {
    var color = net.isTailscale ? '#00f0ff' : '#00ff41';
    var label = net.isTailscale ? '🌐 TAILSCALE' : '📡 LOCAL WI-FI';

    if (dot) {
      dot.style.background = color;
      dot.style.boxShadow = '0 0 8px ' + color;
    }
    if (txt) {
      txt.textContent = label + ' (' + ms + 'ms)';
      txt.style.color = color;
    }
    if (badge) {
      badge.style.borderColor = net.isTailscale ? 'rgba(0,240,255,0.6)' : 'rgba(0,255,65,0.6)';
      badge.style.background = net.isTailscale ? 'rgba(0,240,255,0.12)' : 'rgba(0,255,65,0.12)';
    }
    if (detailType) {
      detailType.textContent = net.isTailscale ? '🌐 TAILSCALE (Worldwide WireGuard)' : '📡 LOCAL WI-FI (High-Speed LAN)';
      detailType.style.color = color;
    }
    if (detailHost) {
      detailHost.textContent = PC_ENDPOINT || window.location.origin;
    }
    if (detailPing) {
      detailPing.textContent = ms + ' ms (Direct)';
      detailPing.style.color = color;
    }
  } else {
    if (dot) {
      dot.style.background = '#ff003c';
      dot.style.boxShadow = '0 0 8px #ff003c';
    }
    if (txt) {
      txt.textContent = '🔴 DISCONNECTED';
      txt.style.color = '#ff003c';
    }
    if (badge) {
      badge.style.borderColor = 'rgba(255,0,60,0.5)';
      badge.style.background = 'rgba(255,0,60,0.12)';
    }
    if (detailType) {
      detailType.textContent = 'OFFLINE (UNREACHABLE)';
      detailType.style.color = '#ff003c';
    }
    if (detailHost) {
      detailHost.textContent = PC_ENDPOINT || window.location.origin;
    }
    if (detailPing) {
      detailPing.textContent = 'Unreachable';
      detailPing.style.color = '#ff003c';
    }
  }
}

function quickConnectIp(hostPort) {
  var url = (hostPort.startsWith('http') ? hostPort : ('http://' + hostPort));
  var key = localStorage.getItem('panic_key') || KEY || 'imran2024';
  var fullUrl = url + (url.includes('?') ? '&' : '/?') + 'key=' + key;

  localStorage.setItem('panic_pc_endpoint', url);
  localStorage.setItem('panic_key', key);

  if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
    window.AndroidNativeStream.savePcUrl(fullUrl);
  }

  if (typeof closePairingModal === 'function') closePairingModal();
  window.location.href = fullUrl;
}

function updateQuickConnectButtons(lanIp, tailscaleIp) {
  var lanSpan = document.getElementById('quickLanHost');
  var tsSpan = document.getElementById('quickTailscaleHost');
  if (lanSpan && lanIp) {
    lanSpan.textContent = lanIp;
  }
  if (tsSpan && tailscaleIp) {
    tsSpan.textContent = tailscaleIp;
  }
}

function quickConnectTailscale() {
  var ip = localStorage.getItem('panic_tailscale_ip') || '100.83.195.91';
  quickConnectIp(ip + ':8085');
}

function quickConnectLan() {
  var ip = localStorage.getItem('panic_lan_ip') || '192.168.0.100';
  quickConnectIp(ip + ':8085');
}

var _isCurrentlyConnected = false;

function checkPcConnection() {
  var t0 = performance.now();
  fetch(getApiUrl('/api/status?key=' + KEY), { cache: 'no-cache' })
    .then(function(res) {
      if (!res.ok) throw new Error('Status not ok');
      return res.json();
    })
    .then(function(data) {
      var ms = Math.round(performance.now() - t0);
      _isCurrentlyConnected = true;
      updateNetworkUi(true, ms);
      if (data) {
        if (data.lan_ip) localStorage.setItem('panic_lan_ip', data.lan_ip);
        if (data.tailscale_ip) localStorage.setItem('panic_tailscale_ip', data.tailscale_ip);
        if (data.key) localStorage.setItem('panic_key', data.key);
        updateQuickConnectButtons(data.lan_ip, data.tailscale_ip);
      }
    })
    .catch(function(err) {
      _isCurrentlyConnected = false;
      updateNetworkUi(false, 0);
    });
}

function probeBestEndpoint(force, callback) {
  if (typeof force === 'function') {
    callback = force;
    force = false;
  }
  // ⚡ If already connected to user's selected endpoint (Local or Tailscale), RESPECT IT!
  if (!force && _isCurrentlyConnected) {
    if (typeof callback === 'function') callback(true, PC_ENDPOINT);
    return;
  }

  var key = localStorage.getItem('panic_key') || KEY || 'imran2024';
  var candidates = [];
  var dynLan = localStorage.getItem('panic_lan_ip');
  var dynTs = localStorage.getItem('panic_tailscale_ip');
  if (dynLan) candidates.push('http://' + dynLan + ':8085');
  if (dynTs) candidates.push('http://' + dynTs + ':8085');
  if (!candidates.includes('http://192.168.0.100:8085')) candidates.push('http://192.168.0.100:8085');
  if (!candidates.includes('http://100.83.195.91:8085')) candidates.push('http://100.83.195.91:8085');

  var probeIndex = 0;
  function tryNext() {
    if (probeIndex >= candidates.length) {
      if (typeof callback === 'function') callback(false);
      return;
    }
    var ep = candidates[probeIndex++];
    var testUrl = ep + '/api/status?key=' + key;

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function() { if (controller) controller.abort(); }, 1800);

    fetch(testUrl, { signal: controller ? controller.signal : undefined, cache: 'no-cache' })
      .then(function(res) {
        clearTimeout(timer);
        if (res.ok) {
          console.log('[Network] Connected to endpoint:', ep);
          localStorage.setItem('panic_pc_endpoint', ep);
          PC_ENDPOINT = ep;
          var input = document.getElementById('pcIpInput');
          if (input) input.value = ep;
          if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
            window.AndroidNativeStream.savePcUrl(ep + '/?key=' + key);
          }
          checkPcConnection();
          if (typeof callback === 'function') callback(true, ep);
        } else {
          tryNext();
        }
      })
      .catch(function() {
        clearTimeout(timer);
        tryNext();
      });
  }
  tryNext();
}

window.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('pcIpInput');
  if (input) input.value = PC_ENDPOINT;
  updateQuickConnectButtons(localStorage.getItem('panic_lan_ip'), localStorage.getItem('panic_tailscale_ip'));
  checkPcConnection();
  setInterval(checkPcConnection, 3000);
  setTimeout(connectCommandWS, 2000);
  // Only probe if initial connection is completely dead after 2 seconds
  setTimeout(function() {
    if (!_isCurrentlyConnected) {
      probeBestEndpoint(false);
    }
  }, 2000);
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
