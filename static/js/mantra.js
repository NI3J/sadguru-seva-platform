// static/js/mantra.js
// Enhanced audio controller with verse sync, prev/next navigation
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const sel = (s, r = document) => r.querySelector(s);
    const selAll = (s, r = document) => Array.from(r.querySelectorAll(s));

    // Core elements
    const audio = sel('#mantra-audio');
    if (!audio) {
      console.warn('[mantra.js] Missing <audio id="mantra-audio">');
      return;
    }

    const playBtn = sel('#play');
    const stopBtn = sel('#stop');
    const prevBtn = sel('#prev');
    const nextBtn = sel('#next');
    const seek = sel('#seek');
    const cur = sel('#current-time');
    const dur = sel('#duration');
    const vol = sel('#volume');
    const muteBtn = sel('#mute');
    const loopToggle = sel('#loop');
    const rateSel = sel('#rate');
    const versesContainer = sel('#verses');
    const loadingEl = sel('#loading');

    const prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Config
    const SEEK_STEP = 5;
    const VOL_STEP = 0.05;

    // Restore state
    restorePersisted(audio, { vol, loopToggle, rateSel });

    // Build verse index
    let verseIndex = null;
    if (versesContainer) {
      verseIndex = buildVerseIndex(versesContainer);
    }

    // Wire up controls
    bindCoreControls({ 
      audio, playBtn, stopBtn, prevBtn, nextBtn, muteBtn, 
      vol, loopToggle, rateSel, seek, cur, dur, 
      verseIndex, versesContainer 
    });
    
    // Initialize first shlok highlight immediately on page load
    if (verseIndex && versesContainer && verseIndex.nodes.length > 0) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
        updateVerseHighlight(verseIndex, versesContainer, currentTime, prefersReducedMotion);
      }, 100);
    }
    
    // Initialize first shlok highlight when audio starts playing
    audio.addEventListener('play', () => {
      if (verseIndex && versesContainer) {
        const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
        updateVerseHighlight(verseIndex, versesContainer, currentTime, prefersReducedMotion);
      }
    });

    // Media Session API
    setupMediaSession({ audio, verseIndex });

    // Keyboard shortcuts
    setupKeyboardShortcuts({ audio, playBtn, vol, loopToggle });

    // Time updates
    let lastPersist = 0;
    let isSeeking = false;
    
    // Use both timeupdate and progress events for better updates
    audio.addEventListener('timeupdate', () => {
      if (!isSeeking) {
        updateTimeUI({ audio, seek, cur, dur }, verseIndex, versesContainer, prefersReducedMotion);
      }
      
      const now = performance.now();
      if (now - lastPersist > 1500) {
        persistTime(audio);
        lastPersist = now;
      }
    });
    
    // Also listen to progress event for smoother updates
    audio.addEventListener('progress', () => {
      if (!isSeeking && isFinite(audio.duration) && audio.duration > 0) {
        updateTimeUI({ audio, seek, cur, dur }, verseIndex, versesContainer, prefersReducedMotion);
      }
    });
    
    // Listen to loadeddata for initial update
    audio.addEventListener('loadeddata', () => {
      updateDurationUI({ audio, seek, dur });
      if (verseIndex && versesContainer && isFinite(audio.currentTime)) {
        updateVerseHighlight(verseIndex, versesContainer, audio.currentTime, prefersReducedMotion);
      }
    });

    // On metadata loaded
    audio.addEventListener('loadedmetadata', () => {
      updateDurationUI({ audio, seek, dur });
      restoreLastTimeForSrc(audio);
      if (loadingEl) loadingEl.style.display = 'none';
      // Initialize verse highlight on load
      if (verseIndex && versesContainer) {
        const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
        updateVerseHighlight(verseIndex, versesContainer, currentTime, prefersReducedMotion);
      }
    });
    
    // On canplay - when audio is ready to play
    audio.addEventListener('canplay', () => {
      if (verseIndex && versesContainer) {
        const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
        updateVerseHighlight(verseIndex, versesContainer, currentTime, prefersReducedMotion);
      }
      // Update duration when audio can play
      updateDurationUI({ audio, seek, dur });
    });
    
    // On loadeddata - when audio data is loaded
    audio.addEventListener('loadeddata', () => {
      updateDurationUI({ audio, seek, dur });
      if (verseIndex && versesContainer) {
        const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
        updateVerseHighlight(verseIndex, versesContainer, currentTime, prefersReducedMotion);
      }
    });

    // Handle seeking flag
    if (seek) {
      seek.addEventListener('mousedown', () => { isSeeking = true; });
      seek.addEventListener('touchstart', () => { isSeeking = true; });
      seek.addEventListener('mouseup', () => { isSeeking = false; });
      seek.addEventListener('touchend', () => { isSeeking = false; });
    }

    // Make verses clickable for seeking
    if (verseIndex && versesContainer) {
      makeVersesClickable(audio, verseIndex, versesContainer);
    }
  }

  // ---------- Core controls ----------

  function bindCoreControls({ 
    audio, playBtn, stopBtn, prevBtn, nextBtn, muteBtn, 
    vol, loopToggle, rateSel, seek, cur, dur,
    verseIndex, versesContainer
  }) {
    if (playBtn) {
      playBtn.addEventListener('click', () => togglePlay(audio, playBtn));
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        updatePlayButton(playBtn, false);
      });
    }

    if (prevBtn && verseIndex) {
      prevBtn.addEventListener('click', () => {
        const currentIdx = verseIndex.activeIdx;
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0;
        seekToVerse(audio, verseIndex, prevIdx);
      });
    }

    if (nextBtn && verseIndex) {
      nextBtn.addEventListener('click', () => {
        const currentIdx = verseIndex.activeIdx;
        const nextIdx = currentIdx < verseIndex.nodes.length - 1 
          ? currentIdx + 1 
          : verseIndex.nodes.length - 1;
        seekToVerse(audio, verseIndex, nextIdx);
      });
    }

    if (seek) {
      let seeking = false;
      seek.addEventListener('input', () => {
        seeking = true;
        const pct = clamp(parseFloat(seek.value), 0, 100) / 100;
        if (isFinite(audio.duration)) {
          audio.currentTime = pct * audio.duration;
          // Update current time display immediately while seeking
          if (cur) cur.textContent = formatTime(audio.currentTime);
        }
      });
      seek.addEventListener('change', () => {
        seeking = false;
      });
    }

    if (vol) {
      vol.addEventListener('input', () => {
        audio.volume = clamp(parseFloat(vol.value), 0, 1);
        localStorage.setItem('mantra:volume', String(audio.volume));
        if (audio.volume > 0 && audio.muted) {
          audio.muted = false;
          localStorage.setItem('mantra:muted', '0');
          updateMuteButton(muteBtn, audio.muted);
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        localStorage.setItem('mantra:muted', audio.muted ? '1' : '0');
        updateMuteButton(muteBtn, audio.muted);
      });
    }

    if (loopToggle) {
      loopToggle.addEventListener('change', () => {
        audio.loop = !!loopToggle.checked;
        localStorage.setItem('mantra:loop', audio.loop ? '1' : '0');
      });
      audio.loop = !!loopToggle.checked;
    }

    if (rateSel) {
      rateSel.addEventListener('change', () => {
        const r = parseFloat(rateSel.value);
        audio.playbackRate = isFinite(r) && r > 0 ? r : 1.0;
        localStorage.setItem('mantra:rate', String(audio.playbackRate));
      });
      const r = parseFloat(rateSel.value || '1');
      audio.playbackRate = isFinite(r) && r > 0 ? r : 1.0;
    }

    // Update UI on state changes
    audio.addEventListener('play', () => updatePlayButton(playBtn, true));
    audio.addEventListener('pause', () => updatePlayButton(playBtn, false));
    audio.addEventListener('ended', () => updatePlayButton(playBtn, false));

    // Initial UI
    updatePlayButton(playBtn, !audio.paused && !audio.ended);
    updateVolumeUI(vol, muteBtn, audio);
    updateDurationUI({ audio, seek, dur });
    updateTimeUI({ audio, seek, cur, dur }, verseIndex, versesContainer, prefersReducedMotion);
  }

  function togglePlay(audio, playBtn) {
    if (audio.paused || audio.ended) {
      safePlay(audio);
    } else {
      audio.pause();
    }
    updatePlayButton(playBtn, !audio.paused && !audio.ended);
  }

  function safePlay(audio) {
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Autoplay blocked; no-op
      });
    }
  }

  function updatePlayButton(btn, isPlaying) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    btn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    const icon = btn.querySelector('[data-icon]');
    if (icon) {
      icon.textContent = isPlaying ? '⏸' : '▶️';
    }
    const textEl = btn.querySelector('#play-text');
    if (textEl) {
      textEl.textContent = isPlaying ? 'Pause' : 'Play';
    }
  }

  function updateVolumeUI(vol, muteBtn, audio) {
    if (vol) vol.value = String(audio.muted ? 0 : audio.volume);
    updateMuteButton(muteBtn, audio.muted);
  }

  function updateMuteButton(btn, muted) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    const icon = btn.querySelector('[data-icon]');
    if (icon) {
      icon.textContent = muted ? '🔇' : '🔊';
    }
  }

  function updateDurationUI({ audio, seek, dur }) {
    if (dur) dur.textContent = isFinite(audio.duration) ? formatTime(audio.duration) : '--:--';
    if (seek) {
      seek.max = '100';
      seek.value = '0';
      seek.setAttribute('aria-valuenow', '0');
    }
  }

  function updateTimeUI({ audio, seek, cur, dur }, verseIndex, versesContainer, prefersReducedMotion) {
    // Update current time display
    if (cur) {
      const time = isFinite(audio.currentTime) ? audio.currentTime : 0;
      cur.textContent = formatTime(time);
    }
    
    // Update duration display
    if (dur) {
      const duration = isFinite(audio.duration) ? audio.duration : 0;
      dur.textContent = duration > 0 ? formatTime(duration) : '--:--';
    }

    // Always update seek bar
    if (seek) {
      // Ensure max is set correctly
      if (seek.max !== '100') {
        seek.max = '100';
      }
      
      if (isFinite(audio.duration) && audio.duration > 0) {
        const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
        const pct = clamp((currentTime / audio.duration) * 100, 0, 100);
        seek.value = String(pct);
        seek.setAttribute('aria-valuenow', seek.value);
        // Force visual update
        seek.style.setProperty('--progress', pct + '%');
      } else {
        // Even if duration not loaded, show current position
        seek.value = '0';
      }
    }

    // Update verse highlight - always update, even if time is 0
    if (verseIndex && versesContainer) {
      const currentTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
      updateVerseHighlight(verseIndex, versesContainer, currentTime, prefersReducedMotion);
    }
  }

  // ---------- Persistence ----------

  function restorePersisted(audio, { vol, loopToggle, rateSel }) {
    try {
      const savedSrc = localStorage.getItem('mantra:lastSrc');
      if (savedSrc) audio.src = savedSrc;

      const savedVol = parseFloat(localStorage.getItem('mantra:volume') || '');
      if (isFinite(savedVol) && vol) {
        audio.volume = clamp(savedVol, 0, 1);
        vol.value = String(audio.volume);
      }

      const savedMuted = localStorage.getItem('mantra:muted');
      if (savedMuted) {
        audio.muted = savedMuted === '1';
      }

      const savedLoop = localStorage.getItem('mantra:loop');
      if (savedLoop && loopToggle) {
        loopToggle.checked = savedLoop === '1';
        audio.loop = loopToggle.checked;
      }

      const savedRate = parseFloat(localStorage.getItem('mantra:rate') || '');
      if (isFinite(savedRate) && rateSel) {
        rateSel.value = String(savedRate);
        audio.playbackRate = savedRate;
      }
    } catch (e) {
      // Storage not available
    }
  }

  function persistTime(audio) {
    try {
      if (audio.src) {
        localStorage.setItem('mantra:lastSrc', audio.src);
        localStorage.setItem('mantra:lastTime', String(Math.floor(audio.currentTime)));
      }
    } catch (_) {}
  }

  function restoreLastTimeForSrc(audio) {
    try {
      const lastSrc = localStorage.getItem('mantra:lastSrc');
      const lastTime = parseFloat(localStorage.getItem('mantra:lastTime') || '');
      if (lastSrc && normalizeUrl(lastSrc) === normalizeUrl(audio.src) && isFinite(lastTime)) {
        const safeTime = Math.min(lastTime, Math.max(0, audio.duration - 2));
        audio.currentTime = safeTime;
      }
    } catch (_) {}
  }

  // ---------- Verse sync ----------

  function buildVerseIndex(container) {
    const nodes = Array.from(container.querySelectorAll('[data-start]'))
      .map((el) => {
        const start = parseFloat(el.getAttribute('data-start'));
        const end = parseFloat(el.getAttribute('data-end'));
        const verse = el.getAttribute('data-verse');
        return isFinite(start) ? { el, start, end: isFinite(end) ? end : null, verse } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    if (!nodes.length) return null;

    // Set end times if not explicitly provided
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].end) {
        nodes[i].end = i < nodes.length - 1 ? nodes[i + 1].start : Number.POSITIVE_INFINITY;
      }
    }

    return { nodes, activeIdx: -1 };
  }

  function updateVerseHighlight(index, container, currentTime, prefersReducedMotion) {
    if (!index) return;
    const { nodes } = index;

    // Find active verse with binary search
    let lo = 0, hi = nodes.length - 1, found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const n = nodes[mid];
      if (currentTime >= n.start && currentTime < n.end) {
        found = mid;
        break;
      } else if (currentTime < n.start) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    // If no verse found but currentTime is 0, default to first verse
    if (found === -1 && currentTime === 0 && nodes.length > 0) {
      found = 0;
    }

    if (found !== index.activeIdx) {
      // Remove previous highlight and pointer
      if (index.activeIdx >= 0 && nodes[index.activeIdx]) {
        const prevEl = nodes[index.activeIdx].el;
        prevEl.classList.remove('is-active');
        // Remove pointer element if it exists
        const prevPointer = prevEl.querySelector('.shlok-pointer');
        if (prevPointer) {
          prevPointer.remove();
        }
      }
      
      // Add new highlight
      if (found >= 0) {
        const el = nodes[found].el;
        el.classList.add('is-active');
        el.style.position = 'relative';
        el.style.zIndex = '10';
        
        // Remove any existing pointer first
        const existingPointer = el.querySelector('.shlok-pointer');
        if (existingPointer) {
          existingPointer.remove();
        }
        
        // Create and add pointer element directly in DOM
        const pointerEl = document.createElement('span');
        pointerEl.className = 'shlok-pointer';
        pointerEl.textContent = '👉';
        pointerEl.setAttribute('aria-hidden', 'true');
        // Insert at the beginning of the shlok content
        if (el.firstChild) {
          el.insertBefore(pointerEl, el.firstChild);
        } else {
          el.appendChild(pointerEl);
        }
        
        // Force a reflow to ensure the element is rendered
        void pointerEl.offsetHeight;
        
        // Smooth scroll verse into view
        setTimeout(() => {
          el.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 50);
      }
      
      index.activeIdx = found;
    } else if (found >= 0 && index.activeIdx === found) {
      // Ensure active state is maintained
      const el = nodes[found].el;
      if (!el.classList.contains('is-active')) {
        el.classList.add('is-active');
        el.style.position = 'relative';
        el.style.zIndex = '10';
      }
      // Ensure pointer exists
      let pointerEl = el.querySelector('.shlok-pointer');
      if (!pointerEl) {
        pointerEl = document.createElement('span');
        pointerEl.className = 'shlok-pointer';
        pointerEl.textContent = '👉';
        pointerEl.setAttribute('aria-hidden', 'true');
        // Insert at the beginning of the shlok content
        if (el.firstChild) {
          el.insertBefore(pointerEl, el.firstChild);
        } else {
          el.appendChild(pointerEl);
        }
        // Force a reflow
        void pointerEl.offsetHeight;
      }
    }
  }

  function seekToVerse(audio, verseIndex, targetIdx) {
    if (!verseIndex || targetIdx < 0 || targetIdx >= verseIndex.nodes.length) return;
    
    const verse = verseIndex.nodes[targetIdx];
    audio.currentTime = verse.start;
    
    // Auto-play if paused
    if (audio.paused) {
      safePlay(audio);
    }
  }

  function makeVersesClickable(audio, verseIndex, container) {
    container.addEventListener('click', (e) => {
      const shloka = e.target.closest('.shloka[data-start]');
      if (!shloka) return;

      const start = parseFloat(shloka.getAttribute('data-start'));
      if (isFinite(start)) {
        audio.currentTime = start;
        
        // Auto-play if paused
        if (audio.paused) {
          safePlay(audio);
        }
      }
    });
  }

  // ---------- Media Session ----------

  function setupMediaSession({ audio, verseIndex }) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'रुद्राष्टकम् (Rudrashtakam)',
        artist: 'Gurudev Shri Vidyanand Baba Gategaonkar',
        album: 'Sadguru Seva Mantras',
        artwork: []
      });
    } catch (_) {}

    navigator.mediaSession.setActionHandler?.('play', () => safePlay(audio));
    navigator.mediaSession.setActionHandler?.('pause', () => audio.pause());
    
    navigator.mediaSession.setActionHandler?.('seekbackward', (details) => {
      const step = details.seekOffset || 10;
      audio.currentTime = Math.max(0, audio.currentTime - step);
    });
    
    navigator.mediaSession.setActionHandler?.('seekforward', (details) => {
      const step = details.seekOffset || 10;
      const dur = isFinite(audio.duration) ? audio.duration : Infinity;
      audio.currentTime = Math.min(dur, audio.currentTime + step);
    });
    
    navigator.mediaSession.setActionHandler?.('seekto', (details) => {
      if (details.fastSeek && 'fastSeek' in audio) {
        audio.fastSeek(details.seekTime);
      } else {
        audio.currentTime = details.seekTime;
      }
    });

    if (verseIndex) {
      navigator.mediaSession.setActionHandler?.('previoustrack', () => {
        const currentIdx = verseIndex.activeIdx;
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0;
        seekToVerse(audio, verseIndex, prevIdx);
      });
      
      navigator.mediaSession.setActionHandler?.('nexttrack', () => {
        const currentIdx = verseIndex.activeIdx;
        const nextIdx = currentIdx < verseIndex.nodes.length - 1 
          ? currentIdx + 1 
          : verseIndex.nodes.length - 1;
        seekToVerse(audio, verseIndex, nextIdx);
      });
    }
  }

  // ---------- Keyboard shortcuts ----------

  function setupKeyboardShortcuts({ audio, playBtn, vol, loopToggle }) {
    document.addEventListener('keydown', (e) => {
      // Ignore when typing in inputs
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay(audio, playBtn);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.currentTime = Math.min((audio.duration || Infinity), audio.currentTime + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          audio.volume = clamp(audio.volume + 0.05, 0, 1);
          if (vol) vol.value = String(audio.volume);
          if (audio.volume > 0) audio.muted = false;
          localStorage.setItem('mantra:volume', String(audio.volume));
          localStorage.setItem('mantra:muted', audio.muted ? '1' : '0');
          break;
        case 'ArrowDown':
          e.preventDefault();
          audio.volume = clamp(audio.volume - 0.05, 0, 1);
          if (vol) vol.value = String(audio.volume);
          if (audio.volume === 0) audio.muted = true;
          localStorage.setItem('mantra:volume', String(audio.volume));
          localStorage.setItem('mantra:muted', audio.muted ? '1' : '0');
          break;
        case 'm':
        case 'M':
          audio.muted = !audio.muted;
          localStorage.setItem('mantra:muted', audio.muted ? '1' : '0');
          break;
        case 'l':
        case 'L':
          if (loopToggle) {
            loopToggle.checked = !loopToggle.checked;
            audio.loop = loopToggle.checked;
            localStorage.setItem('mantra:loop', audio.loop ? '1' : '0');
          }
          break;
        default:
          break;
      }
    });
  }

  // ---------- Helpers ----------

  function formatTime(s) {
    if (!isFinite(s) || s < 0) return '--:--';
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const two = (n) => (n < 10 ? '0' + n : '' + n);
    return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function normalizeUrl(u) {
    try {
      return new URL(u, window.location.href).toString();
    } catch (_) {
      return u || '';
    }
  }
})();

