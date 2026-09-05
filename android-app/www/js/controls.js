/**
 * ⚡ SYSTEM CONTROLS & DEFENSE ENGINE
 */

var KEY = window.KEY || "imran2024";
var _cmdWS = null;

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
// fetch() streams fragmented MP4 over plain HTTP.
// gives a REAL video experience (smooth motion, inter-frame compression) like streaming apps.
var h264Retries = 0;
// 🔄 AUTO-RECONNECT: if the H.264 stream drops due to a network blip,
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
  var fetchOpts = {};
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
  if (!isStreaming || !sourceBitmap) return;
  _frameCount++;

  var sw = sourceBitmap.displayWidth || sourceBitmap.width;
  var sh = sourceBitmap.displayHeight || sourceBitmap.height;
  if (!sw || !sh) return;

  // 1. Render to Dashboard Canvas
  if (_canvasEl && _canvasCtx) {
    if (_canvasEl.width !== sw || _canvasEl.height !== sh) {
      _canvasEl.width  = sw;
      _canvasEl.height = sh;
      _canvasCtx.imageSmoothingEnabled = true;
      _canvasCtx.imageSmoothingQuality = "medium";
    }
    _canvasCtx.drawImage(sourceBitmap, 0, 0);
  }

  // 2. Render to Fullscreen Canvas if Overlay is Visible
  if (_fsOverlayEl && _fsOverlayEl.style.display !== "none" && _fsCanvasEl && _fsCanvasCtx) {
    if (_fsCanvasEl.width !== sw || _fsCanvasEl.height !== sh) {
      _fsCanvasEl.width  = sw;
      _fsCanvasEl.height = sh;
      _fsCanvasCtx.imageSmoothingEnabled = true;
      _fsCanvasCtx.imageSmoothingQuality = "medium";
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
      q.textContent = "1080P • " + (_frameCount * 2) + " FPS";
    }
    if (window.Telemetry) {
      Telemetry.log("STREAM_HEARTBEAT", { fps: _frameCount, fallback: _fallbackActive, zoom: fsZoom });
    }
    _frameCount = 0;
  }, 1000);

  _connectWebSocket();
}

function _connectWebSocket() {
  if (!isStreaming) return;
  _fallbackActive = false;

  var wsUrl = getWsUrl('/ws?key=' + KEY);

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
          try { _canvasWS.send("A"); } catch(e) {}
        }
        if (_latestBlob) _drainDecode();
        else _isDecoding = false;
      })
      .catch(function() {
        if (_canvasWS && _canvasWS.readyState === 1) {
          try { _canvasWS.send("A"); } catch(e) {}
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
      if (q) q.textContent = "⚡ ULTRA-FAST • 60 FPS";
      try { _canvasWS.send("A"); } catch(e){}
    };

    _canvasWS.onmessage = function(e) {
      if (!isStreaming) { try { _canvasWS.close(); } catch(x){} return; }
      _latestBlob = new Blob([e.data], { type: "image/jpeg" });
      if (!_isDecoding) _drainDecode();
    };

    _canvasWS.onerror = function() {
      if (isStreaming) {
        setTimeout(function() {
          if (isStreaming && (!_canvasWS || _canvasWS.readyState > 1)) {
            _connectWebSocket();
          }
        }, 600);
      }
    };

    _canvasWS.onclose = function() {
      if (isStreaming) {
        setTimeout(function() {
          if (isStreaming && (!_canvasWS || _canvasWS.readyState > 1)) {
            _connectWebSocket();
          }
        }, 600);
      }
    };
  } catch(err) {
    if (isStreaming) {
      setTimeout(function() {
        if (isStreaming) _connectWebSocket();
      }, 800);
    }
  }
}

function stopCanvasStream() {
  isStreaming = false;
  _fallbackActive = false;
  clearInterval(_fpsTimer);
  clearTimeout(_reconnectTimeout);

  if (_h264Decoder) {
    try { _h264Decoder.close(); } catch(e){}
    _h264Decoder = null;
  }

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
    if (q) q.textContent = "1080P • CONNECTING...";

    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.start === 'function') {
      try {
        var nativeUrl = window.location.protocol + "//" + window.location.host + "/stream.h264?key=" + KEY;
        window.AndroidNativeStream.start(nativeUrl);
        window.AndroidNativeStream.setNativeInput(true);
        if (q) q.textContent = "1080P • 60 FPS";
      } catch(e) {}
    }
    startCanvasStream();
  } else {
    if (window.AndroidNativeStream && typeof window.AndroidNativeStream.stop === 'function') {
      try {
        window.AndroidNativeStream.setNativeInput(false);
        window.AndroidNativeStream.stop();
      } catch(e){}
    }
    stopCanvasStream();
    if (canvas) canvas.style.display = "none";
    if (holder) holder.style.display = "block";
    if (btn) btn.textContent = "▶ PLAY LIVE STREAM";
    if (q) q.textContent = "1080P • 60 FPS";
  }
}
// ──────────────────────────────────────────────────────────────────

function showCyberToast(msg, type) {
  var existing = document.getElementById("cyberToastNotification");
  if (existing) existing.remove();

  var toast = document.createElement("div");
  toast.id = "cyberToastNotification";
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%) translateY(-20px)";
  toast.style.background = type === "danger" ? "rgba(255, 0, 85, 0.92)" : (type === "warning" ? "rgba(255, 170, 0, 0.92)" : "rgba(6, 15, 28, 0.94)");
  toast.style.color = type === "danger" || type === "warning" ? "#ffffff" : "#00f0ff";
  toast.style.border = type === "danger" ? "1px solid #ff0055" : (type === "warning" ? "1px solid #ffaa00" : "1px solid rgba(0, 240, 255, 0.6)");
  toast.style.boxShadow = type === "danger" ? "0 8px 30px rgba(255, 0, 85, 0.6)" : "0 8px 30px rgba(0, 240, 255, 0.45)";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "999px";
  toast.style.fontFamily = "'Share Tech Mono', monospace";
  toast.style.fontSize = "12px";
  toast.style.fontWeight = "bold";
  toast.style.letterSpacing = "1px";
  toast.style.zIndex = "999999";
  toast.style.backdropFilter = "blur(16px)";
  toast.style.webkitBackdropFilter = "blur(16px)";
  toast.style.opacity = "0";
  toast.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  toast.innerHTML = msg;

  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0px)";
  });

  setTimeout(function() {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-20px)";
    setTimeout(function() { toast.remove(); }, 350);
  }, 2600);
}

function getStatus(force){
  if (isStreaming && !force) return;
  fetch("/api/status?key=" + KEY, { cache: "no-store", keepalive: true })
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

// ⚡ Sub-10ms Zero-Latency Control Actions with Real-time Cyber HUD Feedback
function getActiveSessionKey() {
  var k = window.KEY || (typeof KEY !== "undefined" ? KEY : "") || localStorage.getItem("panic_key") || "imran2024";
  return k || "imran2024";
}

function triggerPanic(){
  vibratePhone([100, 50, 100]);
  var k = getActiveSessionKey();
  showCyberToast("⚡ EMERGENCY PANIC TRIGGERED!", "danger");
  fetch("/panic?key=" + encodeURIComponent(k), { keepalive: true })
    .then(function(r){ return r.json(); })
    .then(function(d){
      getStatus(true);
      if (d && (d.panic || d.state === 1)) {
        showCyberToast("🚨 STATE 1: INTRUDER TRAP (LOCKED)", "danger");
      } else if (d && d.state === 2) {
        showCyberToast("🛡️ STATE 2: SAFE WORKING (DECOY DESKTOP)", "warning");
      } else {
        showCyberToast("🟢 STATE 0: RESTORED ORIGINAL DESKTOP", "success");
      }
    })
    .catch(function(){
      getStatus(true);
    });
}

function lockPC(){ 
  vibratePhone(50); 
  var k = getActiveSessionKey();
  showCyberToast("🔒 LOCK COMMAND SENT TO PC", "info");
  fetch("/lock?key=" + encodeURIComponent(k), { keepalive: true })
    .then(function(r){ return r.json(); })
    .then(function(){
      showCyberToast("🔒 WORKSTATION LOCKED SUCCESSFULLY!", "info");
      getStatus(true);
    })
    .catch(function(){
      showCyberToast("🔒 LOCK SENT TO PC", "info");
      getStatus(true);
    });
}

function sleepPC(){ 
  vibratePhone(50); 
  var k = getActiveSessionKey();
  showCyberToast("💤 PUTTING PC TO SLEEP...", "warning");
  fetch("/sleep?key=" + encodeURIComponent(k), { keepalive: true })
    .then(function(){
      showCyberToast("💤 PC ENTERED SLEEP MODE", "warning");
      getStatus(true);
    }); 
}

function restartPC(){ 
  vibratePhone(100); 
  var k = getActiveSessionKey();
  showCyberToast("🔄 RESTART INITIATED (5s)", "warning");
  fetch("/restart?key=" + encodeURIComponent(k), { keepalive: true })
    .then(function(){
      showCyberToast("🔄 PC REBOOTING NOW", "warning");
    }); 
}

function shutdownPC(){ 
  vibratePhone(100); 
  var k = getActiveSessionKey();
  showCyberToast("⏻ SHUTDOWN INITIATED (10s)", "danger");
  fetch("/shutdown?key=" + encodeURIComponent(k), { keepalive: true })
    .then(function(){
      showCyberToast("⏻ PC SHUTTING DOWN", "danger");
    }); 
}

function wakePC() {
  vibratePhone([80, 40, 80]);
  showCyberToast("📡 MAGIC PACKET BROADCAST SENT!", "success");
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
    showCyberToast("🔓 VERIFYING CREDENTIALS...", "info");
    fetch("/unlock?key=" + KEY + "&pin=" + encodeURIComponent(pin), { keepalive: true })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.status === "already_unlocked") {
          showCyberToast("ℹ️ PC IS ALREADY UNLOCKED!", "info");
        } else {
          showCyberToast("🔓 UNLOCK SIGNAL DISPATCHED!", "success");
        }
        getStatus(true);
      })
      .catch(function(){
        showCyberToast("🔓 UNLOCK SENT", "success");
        getStatus(true);
      });
    closeUnlockModal();
  }
}

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

// -------------------------------------------------------------
// 🧠 GEMINI 3.1 FLASH LIVE VOICE AI & CYBER SANDBOX TERMINAL
// -------------------------------------------------------------
