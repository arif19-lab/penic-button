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
var _rawParamKey = _urlParams.get('key') || '';
if (_rawParamKey === 'imran2024') {
  _rawParamKey = '';
  try {
    _urlParams.delete('key');
    var cleanSearch = _urlParams.toString();
    var cleanPath = window.location.pathname + (cleanSearch ? ('?' + cleanSearch) : '') + window.location.hash;
    window.history.replaceState({}, document.title, cleanPath);
  } catch(e) {}
}

if (localStorage.getItem('panic_key') === 'imran2024') {
  localStorage.removeItem('panic_key');
}

var KEY = _rawParamKey || localStorage.getItem('panic_key') || '';
if (_rawParamKey) {
  localStorage.setItem('panic_key', _rawParamKey);
}

var PC_ENDPOINT = (function() {
  // If loading directly in browser over HTTP or HTTPS (LAN, Tailscale, or Localhost):
  if (window.location.protocol.startsWith('http')) {
    return window.location.origin;
  }

  // Inside Capacitor / Android Native wrapper only:
  var savedHttps = localStorage.getItem('panic_https_url');
  if (savedHttps && savedHttps.startsWith('https://')) {
    return savedHttps.replace(/\/+$/, '');
  }

  var saved = localStorage.getItem('panic_pc_endpoint');
  if (saved && !saved.includes('127.0.0.1') && !saved.includes('localhost')) {
    if (!saved.startsWith('http://') && !saved.startsWith('https://')) {
      saved = 'http://' + saved;
    }
    return saved.replace(/\/+$/, '');
  }

  return '';
})();

function getApiUrl(path) {
  if (!PC_ENDPOINT || window.location.origin === PC_ENDPOINT) return path;
  var base = PC_ENDPOINT;
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'http://' + base;
  }
  if (base.endsWith('/')) base = base.slice(0, -1);
  return base + (path.startsWith('/') ? path : '/' + path);
}

function getWsUrl(path) {
  if (PC_ENDPOINT && PC_ENDPOINT !== window.location.origin) {
    var wsProto = PC_ENDPOINT.startsWith('https') ? 'wss://' : 'ws://';
    var cleanHost = PC_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return wsProto + cleanHost + (path.startsWith('/') ? path : '/' + path);
  }
  var wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return wsProto + '//' + window.location.host + (path.startsWith('/') ? path : '/' + path);
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



  var isHttps = ep.startsWith('https://') || (window.location.protocol === 'https:' && !ep.startsWith('http://'));

  var type = isHttps ? 'TAILSCALE HTTPS 🔒' : (isTailscale ? 'TAILSCALE' : (isLocal ? 'LOCAL WI-FI' : 'REMOTE'));

  return {

    type: type,

    isHttps: isHttps,

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

    var color = '#00ff41';

    var label = '📡 LOCAL WI-FI';

    if (net.isHttps) {

      color = '#00ff88';

      label = '🔒 TAILSCALE HTTPS';

    } else if (net.isTailscale) {

      color = '#00f0ff';

      label = '🌐 TAILSCALE';

    }



    if (dot) {

      dot.style.background = color;

      dot.style.boxShadow = '0 0 8px ' + color;

    }

    if (txt) {

      txt.textContent = label + ' (' + ms + 'ms)';

      txt.style.color = color;

    }

    if (badge) {

      badge.style.borderColor = net.isHttps ? 'rgba(0,255,136,0.6)' : (net.isTailscale ? 'rgba(0,240,255,0.6)' : 'rgba(0,255,65,0.6)');

      badge.style.background = net.isHttps ? 'rgba(0,255,136,0.12)' : (net.isTailscale ? 'rgba(0,240,255,0.12)' : 'rgba(0,255,65,0.12)');

    }

    if (detailType) {

      if (net.isHttps) {

        detailType.textContent = '🔒 TAILSCALE HTTPS (Official Let\'s Encrypt)';

      } else if (net.isTailscale) {

        detailType.textContent = '🌐 TAILSCALE (Worldwide WireGuard)';

      } else {

        detailType.textContent = '📡 LOCAL WI-FI (High-Speed LAN)';

      }

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



function getEffectiveKey() {
  var k = localStorage.getItem('panic_key') || KEY || '';
  if (k === 'imran2024') {
    localStorage.removeItem('panic_key');
    KEY = '';
    return '';
  }
  return k;
}

function quickConnectIp(hostPort) {

  var url = (hostPort.startsWith('http') ? hostPort : ('http://' + hostPort));

  var key = getEffectiveKey();

  var fullUrl = url + (url.includes('?') ? '&' : '/?') + (key ? ('key=' + key) : '');



  localStorage.setItem('panic_pc_endpoint', url);

  if (key) localStorage.setItem('panic_key', key);
  else localStorage.removeItem('panic_key');



  if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {

    window.AndroidNativeStream.savePcUrl(fullUrl);

  }



  if (typeof closePairingModal === 'function') closePairingModal();

  window.location.href = fullUrl;

}



function updateQuickConnectButtons(lanIp, tailscaleIp, localHttpsUrl, tailscaleDns, tsHttpsUrl) {

  var lanSpan = document.getElementById('quickLanHost');

  var tsSpan = document.getElementById('quickTailscaleHost');

  var httpsBtn = document.getElementById('btnQuickHttps');

  var httpsSpan = document.getElementById('quickHttpsHost');

  var tsHttpsBtn = document.getElementById('btnQuickTsHttps');

  var tsHttpsSpan = document.getElementById('quickTsHttpsHost');



  if (lanSpan && lanIp) lanSpan.textContent = lanIp + ':8085';

  if (tsSpan && tailscaleIp) tsSpan.textContent = tailscaleIp + ':8085';



  var lHttps = localHttpsUrl || localStorage.getItem('panic_local_https') || localStorage.getItem('panic_https_url');

  if (!lHttps && lanIp) {

    var key = getEffectiveKey();

    lHttps = 'https://' + lanIp + ':8443/?key=' + key;

  }

  if (httpsBtn && lHttps) {

    httpsBtn.style.display = 'flex';

    if (httpsSpan) httpsSpan.textContent = lHttps.replace(/^https?:\/\//, '').split('/')[0] + ' (Local SSL)';

  }



  var tHttps = tsHttpsUrl || localStorage.getItem('panic_tailscale_https');

  if (!tHttps && (tailscaleDns || localStorage.getItem('panic_tailscale_dns'))) {

    var dns = tailscaleDns || localStorage.getItem('panic_tailscale_dns');

    var key = getEffectiveKey();

    tHttps = 'https://' + dns + '/?key=' + key;

  }

  if (tsHttpsBtn && tHttps) {

    tsHttpsBtn.style.display = 'flex';

    if (tsHttpsSpan) tsHttpsSpan.textContent = tHttps.replace(/^https?:\/\//, '').split('/')[0] + ' (Official SSL)';

  }

}



function quickConnectTailscaleHttps() {

  var url = localStorage.getItem('panic_tailscale_https');

  if (!url) {

    var dns = localStorage.getItem('panic_tailscale_dns');

    var key = getEffectiveKey();

    if (dns) url = 'https://' + dns + '/?key=' + key;

  }

  if (url) {

    window.location.href = url;

    return;

  }

  quickConnectTailscale();

}



function quickConnectHttps() {

  var url = localStorage.getItem('panic_local_https') || localStorage.getItem('panic_https_url');

  if (!url) {

    var lan = localStorage.getItem('panic_lan_ip') || window.location.hostname;

    var key = getEffectiveKey();

    if (lan && lan !== 'localhost' && lan !== '127.0.0.1') {

      url = 'https://' + lan + ':8443/?key=' + key;

    }

  }

  if (url) {

    window.location.href = url;

    return;

  }

  quickConnectLan();

}



function quickConnectTailscale() {

  var ip = localStorage.getItem('panic_tailscale_ip');

  if (!ip) {

    if (typeof startInAppQrScanner === 'function') startInAppQrScanner();

    return;

  }

  quickConnectIp(ip + ':8085');

}



function quickConnectLan() {

  var ip = localStorage.getItem('panic_lan_ip');

  if (!ip) {

    if (typeof startInAppQrScanner === 'function') startInAppQrScanner();

    return;

  }

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
        if (data.authenticated === false || data.requires_auth) {
          _isCurrentlyConnected = false;
          if (KEY === 'imran2024') {
            localStorage.removeItem('panic_key');
            KEY = '';
          }
          updateNetworkUi(false, ms, 'PAIRING REQUIRED');
          var modal = document.getElementById('cyberPairingModal');
          if (modal && (!modal.style.display || modal.style.display === 'none')) {
            openPairingModal();
          }
          return;
        }

        if (data.lan_ip) localStorage.setItem('panic_lan_ip', data.lan_ip);
        if (data.tailscale_ip) localStorage.setItem('panic_tailscale_ip', data.tailscale_ip);
        if (data.tailscale_dns) localStorage.setItem('panic_tailscale_dns', data.tailscale_dns);
        if (data.tailscale_https_url) localStorage.setItem('panic_tailscale_https', data.tailscale_https_url);
        if (data.local_https_url) localStorage.setItem('panic_local_https', data.local_https_url);
        if (data.local_https_url || data.https_url) localStorage.setItem('panic_https_url', data.local_https_url || data.https_url);
        updateQuickConnectButtons(data.lan_ip, data.tailscale_ip, data.local_https_url, data.tailscale_dns, data.tailscale_https_url);
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



  var key = localStorage.getItem('panic_key') || KEY || '';

  var candidates = [];

  var dynHttps = localStorage.getItem('panic_https_url');

  var dynLan = localStorage.getItem('panic_lan_ip');

  var dynTs = localStorage.getItem('panic_tailscale_ip');

  var savedEp = localStorage.getItem('panic_pc_endpoint');



  // ⚡ Priority 1 (Highest): Official Tailscale HTTPS if enabled!

  if (dynHttps && !candidates.includes(dynHttps)) candidates.push(dynHttps);

  if (savedEp && !candidates.includes(savedEp)) candidates.push(savedEp);

  if (dynTs && !candidates.includes('http://' + dynTs + ':8085')) candidates.push('http://' + dynTs + ':8085');

  if (dynLan && !candidates.includes('http://' + dynLan + ':8085')) candidates.push('http://' + dynLan + ':8085');



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

  updateQuickConnectButtons(localStorage.getItem('panic_lan_ip'), localStorage.getItem('panic_tailscale_ip'), localStorage.getItem('panic_https_url'));

  checkPcConnection();

  setInterval(checkPcConnection, 3000);

  // Only probe if initial connection is completely dead after 2 seconds

  setTimeout(function() {

    if (!_isCurrentlyConnected) {

      probeBestEndpoint(false);

    }

  }, 2000);

});











var probedOk = false;

