# -*- coding: utf-8 -*-
"""
Script to apply User and Agent transcription update to gemini_live.js:
1. Permanently remove User and Agent chat bubble creation from #geminiTerminalLogs
2. Keep only unified workstation terminal logs (sys, tool, err, out) in #geminiTerminalLogs
3. Add Wave GIF indicator into LiveTranscriptHUD on User and Agent active turns ("gif > transcription")
4. Handle immediate listening state & turn card creation when user speech starts
"""
import re
import sys

filepath = 'android-app/www/js/gemini_live.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update updateUserSpeechBubble and enqueueAiSpokenText and appendGeminiLog
pattern_start = 'function updateUserSpeechBubble(text, isFinal) {'
pattern_end = '    // 💻 UNIFIED SYSTEM & TOOL TERMINAL BOX'

idx_start = content.find(pattern_start)
idx_end = content.find(pattern_end)

if idx_start == -1 or idx_end == -1:
    print(f"Error: could not find updateUserSpeechBubble block ({idx_start}, {idx_end})")
    sys.exit(1)

replacement_block = """function updateUserSpeechBubble(text, isFinal) {
  var cleanText = String(text || "").replace(/^👤 User:\\s*/, "").replace(/^PS >\\s*/, "").trim();
  if (!cleanText) return;

  var isListeningPlaceholder = (
    cleanText === "🎙️ Listening..." ||
    cleanText === "Listening..." ||
    cleanText.indexOf("Listening") !== -1 ||
    cleanText.toLowerCase().indexOf("listening") !== -1
  );

  var hero = document.getElementById("geminiHeroGreeting");
  if (hero) hero.style.display = "none";

  // 🎙️ Stream User turn into Live Transcript HUD
  if (window.LiveTranscriptHUD) {
    window.LiveTranscriptHUD.onUserTranscript(cleanText, Boolean(isFinal));
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
    cleanText = cleanText.replace(/^👤 User:\\s*/, "").replace(/^PS >\\s*/, "").trim();
    if (!cleanText) return;
    updateUserSpeechBubble(cleanText, true);
    return;
  } else if (type === "ai") {
    var rawChunk = String(text || "").replace(/^🧠\\s*/, "");
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

    """

content = content[:idx_start] + replacement_block + content[idx_end:]

# 2. Update showAiTypingIndicator and removeAiTypingIndicator
typing_start = 'function showAiTypingIndicator() {'
typing_end = 'function removeAiTypingIndicator() {'
t_idx1 = content.find(typing_start)
t_idx2 = content.find(typing_end)

if t_idx1 != -1 and t_idx2 != -1:
    # Find end of removeAiTypingIndicator
    t_idx3 = content.find('}', t_idx2) + 1
    new_typing_block = """function showAiTypingIndicator() {
  removeAiTypingIndicator();
  if (window.LiveTranscriptHUD) {
    window.LiveTranscriptHUD.setState('thinking');
  }
}

function removeAiTypingIndicator() {
  var ind = document.getElementById("cgTypingIndicator");
  if (ind) ind.remove();
}"""
    content = content[:t_idx1] + new_typing_block + content[t_idx3:]
    print("Updated showAiTypingIndicator and removeAiTypingIndicator.")
else:
    print("Warning: could not find showAiTypingIndicator block")

# 3. Update LiveTranscriptHUD
hud_start = 'window.LiveTranscriptHUD = (function() {'
hud_end = '})();' # at the very end of gemini_live.js

h_idx1 = content.find(hud_start)
h_idx2 = content.rfind(hud_end)

if h_idx1 == -1 or h_idx2 == -1:
    print(f"Error: could not find LiveTranscriptHUD ({h_idx1}, {h_idx2})")
    sys.exit(1)

new_hud_block = """window.LiveTranscriptHUD = (function() {
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

  var LISTENING_GIF_DATA_URI = "data:image/gif;base64,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";

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
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(function() {
      if (state === 'speaking' && currentAgentTurnId && audioPlaybackCtx && agentAudioTotalDuration > 0) {
        var now = audioPlaybackCtx.currentTime;
        var elapsed = Math.max(0, now - agentAudioStartTime);
        var progress = Math.min(1.0, elapsed / agentAudioTotalDuration);
        audioPlaybackProgress = progress;

        var turn = findTurn(currentAgentTurnId);
        if (turn && turn.words && turn.words.length > 0) {
          var syncedIdx = Math.min(turn.words.length - 1, Math.max(0, Math.floor(progress * turn.words.length)));
          activeAgentWordIndex = syncedIdx;
          if (turn.spokenWordIndex !== syncedIdx) {
            turn.spokenWordIndex = syncedIdx;
            turn.words.forEach(function(w, wIdx) {
              w.isSpoken = (wIdx <= syncedIdx);
              w.isCurrent = (wIdx === syncedIdx);
            });
            renderWordsForTurn(turn);
          }
        }
        updateSyncBar();
      }
    }, 45);
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
    }).join("\\n\\n");

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
    if (!text) return;
    var rawText = String(text).replace(/^👤 User:\\s*/, "").replace(/^PS >\\s*/, "").trim();
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

    var wordsArray = rawText.split(/\\s+/).filter(Boolean);
    var wordsObj = wordsArray.map(function(w, idx) {
      return {
        id: 'u-' + Date.now() + '-' + idx,
        text: w,
        isSpoken: true,
        isCurrent: (idx === wordsArray.length - 1)
      };
    });

    if (turn) {
      turn.text = rawText;
      turn.words = wordsObj;
      turn.spokenWordIndex = wordsObj.length - 1;
      if (isFinal) {
        turn.isComplete = true;
        currentUserTurnId = null;
        state = 'idle';
      }
    } else {
      turn = {
        id: 'turn-u-' + Date.now(),
        role: 'user',
        text: rawText,
        words: wordsObj,
        spokenWordIndex: wordsObj.length - 1,
        timestamp: Date.now(),
        isComplete: Boolean(isFinal),
        isInterrupted: false
      };
      conversation.push(turn);
      if (!isFinal) {
        currentUserTurnId = turn.id;
        state = 'listening';
      } else {
        state = 'idle';
      }
    }

    render();
  }

  function onAgentTranscript(chunk, isFinal) {
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
      var wordsArray = currentAgentRawText.split(/\\s+/).filter(Boolean);
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
    if (!agentAudioStartTime || agentAudioStartTime === 0) {
      agentAudioStartTime = startTime;
      agentAudioTotalDuration = duration;
    } else {
      agentAudioTotalDuration += duration;
    }
  }

  function finalizeAgentAudio() {
    if (currentAgentTurnId) {
      var turn = findTurn(currentAgentTurnId);
      if (turn) {
        turn.isComplete = true;
        turn.spokenWordIndex = Math.max(0, turn.words.length - 1);
        turn.words.forEach(function(w) {
          w.isSpoken = true;
          w.isCurrent = false;
        });
      }
      currentAgentTurnId = null;
      currentAgentRawText = "";
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
    if (!existing) return String(fragment).replace(/^\\s+/, '');
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
        speakingHtml = '<span class="cg-hud-speaking-badge"><span class="cg-hud-speaking-dot"></span>Listening</span>';
      }

      var interruptedHtml = turn.isInterrupted ? '<span class="cg-hud-interrupted-badge">· Interrupted</span>' : '';

      var headerHtml =
        '<div class="cg-hud-card-header">' +
          '<div class="cg-hud-header-left">' +
            '<span class="cg-hud-role-badge">' + (isAgent ? "Agent" : "You") + '</span>' +
            speakingHtml +
            interruptedHtml +
          '</div>' +
          '<span class="cg-hud-timestamp">' + timeStr + '</span>' +
        '</div>';

      // 🌊 Listening / Speaking Wave GIF indicator: "gif > user transcription" & "same agent gif > transcription"
      var waveGifHtml = "";
      if (isTurnStreaming) {
        var waveClass = isAgent ? "cg-hud-wave-anim agent-wave" : "cg-hud-wave-anim";
        waveGifHtml = '<img src="' + LISTENING_GIF_DATA_URI + '" alt="' + (isAgent ? "Speaking..." : "Listening...") + '" class="' + waveClass + '" /> ';
      }

      var maxWordIdx = isTurnStreaming ? turn.spokenWordIndex : Math.max(0, turn.words.length - 1);
      var wordsToRender = (isTurnStreaming && revealMode === 'progressive')
        ? turn.words.slice(0, maxWordIdx + 1)
        : turn.words;

      var wordsHtml = "";
      if (wordsToRender.length > 0) {
        wordsHtml = wordsToRender.map(function(w, wIdx) {
          var isCurrentWord = isTurnStreaming && (wIdx === maxWordIdx);
          var isSpoken = !isTurnStreaming || (wIdx <= maxWordIdx);
          var wordClass = isCurrentWord ? "current" : (isSpoken ? "spoken" : "dimmed");
          return '<span class="cg-hud-word ' + wordClass + '">' + escapeHtml(w.text) + '</span>';
        }).join(" ");
      } else if (turn.text) {
        wordsHtml = '<span class="cg-hud-word spoken">' + escapeHtml(turn.text) + '</span>';
      } else if (isTurnStreaming) {
        // Active turn with no words yet: placeholder wave GIF already rendered!
        wordsHtml = '<span class="cg-hud-word dimmed">' + (isAgent ? "Thinking..." : "Listening...") + '</span>';
      }

      cardEl.innerHTML = headerHtml + '<div class="cg-hud-words-wrap">' + waveGifHtml + wordsHtml + '</div>';
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
    var waveGifHtml = "";
    if (isTurnStreaming) {
      var waveClass = isAgent ? "cg-hud-wave-anim agent-wave" : "cg-hud-wave-anim";
      waveGifHtml = '<img src="' + LISTENING_GIF_DATA_URI + '" alt="' + (isAgent ? "Speaking..." : "Listening...") + '" class="' + waveClass + '" /> ';
    }

    var maxWordIdx = turn.spokenWordIndex;
    var wordsToRender = (revealMode === 'progressive')
      ? turn.words.slice(0, maxWordIdx + 1)
      : turn.words;

    var wordsHtml = "";
    if (wordsToRender.length > 0) {
      wordsWrap.innerHTML = waveGifHtml + wordsToRender.map(function(w, wIdx) {
        var isCurrentWord = (wIdx === maxWordIdx);
        var isSpoken = (wIdx <= maxWordIdx);
        var wordClass = isCurrentWord ? "current" : (isSpoken ? "spoken" : "dimmed");
        return '<span class="cg-hud-word ' + wordClass + '">' + escapeHtml(w.text) + '</span>';
      }).join(" ");
    } else if (turn.text) {
      wordsWrap.innerHTML = waveGifHtml + '<span class="cg-hud-word spoken">' + escapeHtml(turn.text) + '</span>';
    }

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
    render: render
  };
})();
"""

content = content[:h_idx1] + new_hud_block

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied updates to gemini_live.js!")
