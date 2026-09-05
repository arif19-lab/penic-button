/**
 * 📱 ONBOARDING, QR SCANNER, PWA & TAB NAVIGATION
 */

var _qrStream = null;
var _qrAnimFrame = null;

function checkOnboardingPairing() {
  var isDirectHost = (window.location.protocol.startsWith('http') && 
                      window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1');
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
  triggerNativeQrScan();
}

function triggerNativeQrScan() {
  if (window.AndroidNativeStream && typeof window.AndroidNativeStream.startQrScan === 'function') {
    window.AndroidNativeStream.startQrScan();
    closePairingModal();
    return;
  }
  closePairingModal();
  var scanModal = document.getElementById('qrCameraScannerModal');
  if (scanModal) scanModal.style.display = 'flex';
  var fb = document.getElementById('qrCameraFallback');
  if (fb) fb.style.display = 'none';
  var video = document.getElementById('qrVideo');
  if (!video) return;
  var constraints = { video: { facingMode: 'environment' }, audio: false };
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      _qrStream = stream;
      video.srcObject = stream;
      video.play();
      _qrAnimFrame = requestAnimationFrame(scanQrVideoTick);
    }).catch(function() {
      if (fb) fb.style.display = 'block';
    });
  } else {
    if (fb) fb.style.display = 'block';
  }
}

function scanQrVideoTick() {
  var video = document.getElementById('qrVideo');
  var canvas = document.getElementById('qrCanvas');
  if (!video || !canvas || !_qrStream) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (typeof jsQR !== 'undefined') {
      var code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });
      if (code && code.data) {
        onQrCodeSuccess(code.data);
        return;
      }
    }
  }
  _qrAnimFrame = requestAnimationFrame(scanQrVideoTick);
}

function stopInAppQrScanner() {
  if (_qrAnimFrame) {
    cancelAnimationFrame(_qrAnimFrame);
    _qrAnimFrame = null;
  }
  if (_qrStream) {
    _qrStream.getTracks().forEach(function(track) {
      try { track.stop(); } catch(e){}
    });
    _qrStream = null;
  }
  var video = document.getElementById('qrVideo');
  if (video) {
    video.srcObject = null;
  }
  var scanModal = document.getElementById('qrCameraScannerModal');
  if (scanModal) scanModal.style.display = 'none';
}

function processQrImageFile(event) {
  if (!event.target.files || !event.target.files[0]) return;
  var file = event.target.files[0];
  var reader = new FileReader();

  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      var imageData = ctx.getImageData(0, 0, img.width, img.height);

      if (typeof jsQR !== 'undefined') {
        var code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          onQrCodeSuccess(code.data);
        } else {
          alert('Could not find a valid QR code in this picture. Please take a clearer photo or use Auto-Detect.');
        }
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function onQrCodeSuccess(decodedText) {
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  stopInAppQrScanner();
  closePairingModal();

  try {
    var parsedUrl = new URL(decodedText);
    var key = parsedUrl.searchParams.get('key') || 'imran2024';
    var endpoint = parsedUrl.origin;

    localStorage.setItem('panic_pc_endpoint', endpoint);
    localStorage.setItem('panic_key', key);
    
    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
      window.AndroidNativeStream.savePcUrl(decodedText);
    }

    window.location.href = decodedText;
  } catch(e) {
    if (decodedText.startsWith('http')) {
      localStorage.setItem('panic_pc_endpoint', decodedText);
      if (window.AndroidNativeStream && typeof window.AndroidNativeStream.savePcUrl === 'function') {
        window.AndroidNativeStream.savePcUrl(decodedText);
      }
      window.location.href = decodedText;
    }
  }
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
  if (btn) btn.textContent = 'SCANNING LOCAL WI-FI...';
  if (typeof probeBestEndpoint === 'function') probeBestEndpoint();
  setTimeout(function() {
    if (btn) btn.textContent = 'AUTO-DETECT WI-FI PC';
    var ep = localStorage.getItem('panic_pc_endpoint');
    if (ep && ep.indexOf('127.0.0.1') === -1) {
      stopInAppQrScanner();
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

// Ensure install/download button works smoothly
(function() {
  function setupApkBtn() {
    var btn = document.getElementById('pwaInstallBtn');
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '4px';
    }
  }
  window.addEventListener('DOMContentLoaded', setupApkBtn);
  setTimeout(setupApkBtn, 500);
})();

// ⚡ TAB CONTROLLER ENGINE
function applySystemBarColor(colorHex, isLightIcons) {
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', colorHex);
  
  function tryNative() {
    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.setSystemTheme === 'function') {
      window.AndroidNativeStream.setSystemTheme(colorHex, isLightIcons);
      return true;
    }
    return false;
  }
  
  if (!tryNative()) {
    var retries = 0;
    var timer = setInterval(function() {
      retries++;
      if (tryNative() || retries > 25) {
        clearInterval(timer);
      }
    }, 100);
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(function(el) {
    el.classList.remove('active');
  });
  document.querySelectorAll('.cyber-nav-tab, .cyber-nav-btn').forEach(function(el) {
    el.classList.remove('active');
  });
  
  var target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');
  var navBtn = document.getElementById('nav-' + tabId);
  if (navBtn) navBtn.classList.add('active');
  
  var mainHeader = document.getElementById('mainTopHeader');
  var bottomNav = document.getElementById('mainBottomNav') || document.querySelector('.cyber-bottom-nav');
  var body = document.body;
  
  if (tabId === 'gemini') {
    // 🎨 Gemini AI Tab: Pure White Background, Hide Cyber Header, Hide Bottom Nav
    if (mainHeader) mainHeader.style.setProperty('display', 'none', 'important');
    if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
    if (body) {
      body.classList.add('gemini-mode');
      body.style.background = '#ffffff';
    }
    applySystemBarColor('#ffffff', false); // White bar + dark icons
  } else {
    // 🖥️ Monitor / Other Tabs: Show Cyber Header & Bottom Nav, Restore Dark Background
    if (mainHeader) mainHeader.style.setProperty('display', 'flex', 'important');
    if (bottomNav) bottomNav.style.setProperty('display', 'flex', 'important');
    if (body) {
      body.classList.remove('gemini-mode');
      body.style.background = '';
    }
    applySystemBarColor('#07090e', true); // Dark bar + white icons
  }
  
  try {
    sessionStorage.setItem('panic_active_tab', tabId);
  } catch(e) {}
  
  var container = document.querySelector('.container');
  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', function() {
  try {
    checkOnboardingPairing();
    var savedTab = sessionStorage.getItem('panic_active_tab') || 'home';
    switchTab(savedTab);
  } catch(e) {
    switchTab('home');
  }
});
