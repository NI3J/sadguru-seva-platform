// static/js/mantra.js
// Lightweight, accessible audio controller with optional track list and verse sync.
// Works even if some elements are missing — it will gracefully skip those features.

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const sel = (s, r = document) => r.querySelector(s);
    const selAll = (s, r = document) => Array.from(r.querySelectorAll(s));

    // Core elements (use these IDs in mantra.html)
    const audio = sel('#mantra-audio');
    if (!audio) {
      console.warn('[mantra.js] Missing <audio id="mantra-audio"> element');
      return;
    }

    const playBtn = sel('#play');
    const stopBtn = sel('#stop');
    const seek = sel('#seek');           // <input type="range" min="0" max="100" step="0.1">
    const cur = sel('#current-time');    // <span id="current-time">
    const dur = sel('#duration');        // <span id="duration">
    const vol = sel('#volume');          // <input type="range" min="0" max="1" step="0.01">
    const muteBtn = sel('#mute');
    const loopToggle = sel('#loop');     // <input type="checkbox" id="loop">
    const rateSel = sel('#rate');        // <select id="rate"> e.g., 0.75, 1, 1.25
    const trackList = sel('#track-list'); // Container with children having [data-src], optional [data-title]
    const versesContainer = sel('#verses'); // Container with verse nodes having [data-start]

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Config
    const SEEK_STEP = 5;        // seconds for keyboard seek
    const SEEK_STEP_LARGE = 15; // seconds for media session seek
    const VOL_STEP = 0.05;

    // Local storage keys
    const LS = {
      src: 'mantra:lastSrc',
      time: 'mantra:lastTime',
      vol: 'mantra:volume',
      muted: 'mantra:muted',
      loop: 'mantra:loop',
      rate: 'mantra:rate'
    };

    // Restore state
    restorePersisted(audio, { vol, loopToggle, rateSel });

    // Wire up controls
    bindCoreControls({ audio, playBtn, stopBtn, muteBtn, vol, loopToggle, rateSel, seek, cur, dur });

    // Track list support
    const tracks = trackList ? selAll('[data-src]', trackList) : [];
    if (tracks.length) {
      initTrackList({ audio, trackList, tracks });
    }

    // Verse sync support
    let verseIndex = null;
    if (versesContainer) {
      verseIndex = buildVerseIndex(versesContainer);
    }

    // Media Session API
    setupMediaSession({ audio, trackList, tracks });

    // Keyboard shortcuts
    setupKeyboardShortcuts({ audio, playBtn, vol, loopToggle });

    // Persist time periodically
    let lastPersist = 0;
    audio.addEventListener('timeupdate', () => {
      updateTimeUI({ audio, seek, cur, dur }, verseIndex, versesContainer, prefersReducedMotion);
      const now = performance.now();
      if (now - lastPersist > 1500) {
        persistTime(audio);
        lastPersist = now;
      }
    });

    // On metadata, update duration UI and restore last time for this src
    audio.addEventListener('loadedmetadata', () => {
      updateDurationUI({ audio, seek, dur });
      restoreLastTimeForSrc(audio);
    });

    // Autoplay last track if desired (comment out if not wanted)
    // safePlay(audio);

    // If a track list exists and nothing is set, load first item (no autoplay)
    if (!audio.src && tracks.length) {
      const first = tracks[0];
      loadTrack(audio, first.dataset.src, first.dataset.title || first.textContent?.trim());
      highlightActiveTrack(tracks, first);
    }
  }

  // ---------- Core controls ----------

  function bindCoreControls({ audio, playBtn, stopBtn, muteBtn, vol, loopToggle, rateSel, seek, cur, dur }) {
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

    if (seek) {
      // Update position when user drags
      let seeking = false;
      seek.addEventListener('input', () => {
        seeking = true;
        const pct = clamp(parseFloat(seek.value), 0, 100) / 100;
        if (isFinite(audio.duration)) {
          audio.currentTime = pct * audio.duration;
        }
      });
      seek.addEventListener('change', () => {
        seeking = false;
      });
      // Keep seek in sync while not actively dragging is handled by timeupdate/UI update
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
      // Initialize current state
      audio.loop = !!loopToggle.checked;
    }

    if (rateSel) {
      rateSel.addEventListener('change', () => {
        const r = parseFloat(rateSel.value);
        audio.playbackRate = isFinite(r) && r > 0 ? r : 1.0;
        localStorage.setItem('mantra:rate', String(audio.playbackRate));
      });
      // Initialize
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
    updateTimeUI({ audio, seek, cur, dur });
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
        // Autoplay might be blocked; no-op
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
    } else {
      btn.textContent = isPlaying ? 'Pause' : 'Play';
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
    } else {
      btn.textContent = muted ? 'Unmute' : 'Mute';
    }
  }

  function updateDurationUI({ audio, seek, dur }) {
    if (dur) dur.textContent = isFinite(audio.duration) ? formatTime(audio.duration) : '--:--';
    if (seek) seek.value = '0';
  }

  function updateTimeUI({ audio, seek, cur, dur }, verseIndex, versesContainer, prefersReducedMotion) {
    if (cur) cur.textContent = formatTime(audio.currentTime);
    if (dur && isFinite(audio.duration)) dur.textContent = formatTime(audio.duration);

    if (seek && isFinite(audio.duration) && audio.duration > 0) {
      const pct = (audio.currentTime / audio.duration) * 100;
      seek.value = String(pct);
      seek.setAttribute('aria-valuenow', seek.value);
    }

    if (verseIndex && versesContainer && isFinite(audio.currentTime)) {
      updateVerseHighlight(verseIndex, versesContainer, audio.currentTime, prefersReducedMotion);
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
      // Storage not available; ignore
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
        // Seek close to last position but not to the end
        const safeTime = Math.min(lastTime, Math.max(0, audio.duration - 2));
        audio.currentTime = safeTime;
      }
    } catch (_) {}
  }

  // ---------- Track list ----------

  function initTrackList({ audio, trackList, tracks }) {
    trackList.addEventListener('click', (e) => {
      const item = e.target.closest('[data-src]');
      if (!item || !trackList.contains(item)) return;

      const src = item.dataset.src;
      const title = item.dataset.title || item.textContent?.trim();
      if (!src) return;

      loadTrack(audio, src, title);
      highlightActiveTrack(tracks, item);
      // Try to play (will be blocked until user gesture in some browsers)
      safePlay(audio);
    });
  }

  function loadTrack(audio, src, title) {
    audio.src = src;
    audio.currentTime = 0;
    try {
      localStorage.setItem('mantra:lastSrc', src);
      localStorage.setItem('mantra:lastTime', '0');
    } catch (_) {}

    // Media Session metadata
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Mantra',
          artist: 'Sadguru Seva',
          album: 'Mantras',
          artwork: []
        });
      } catch (_) {}
    }
  }

  function highlightActiveTrack(tracks, active) {
    tracks.forEach(el => el.classList.toggle('is-active', el === active));
    // Ensure visibility
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------- Verse sync ----------

  function buildVerseIndex(container) {
    const nodes = Array.from(container.querySelectorAll('[data-start]'))
      .map((el) => {
        const t = parseFloat(el.getAttribute('data-start'));
        return isFinite(t) ? { el, start: t } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    if (!nodes.length) return null;

    // Compute end boundaries (next start or Infinity)
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].end = i < nodes.length - 1 ? nodes[i + 1].start : Number.POSITIVE_INFINITY;
    }
    return { nodes, activeIdx: -1 };
  }

  function updateVerseHighlight(index, container, currentTime, prefersReducedMotion) {
    if (!index) return;
    const { nodes } = index;

    // Binary search for efficiency
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

    if (found !== index.activeIdx) {
      // Update classes
      if (index.activeIdx >= 0) nodes[index.activeIdx].el.classList.remove('is-active');
      if (found >= 0) {
        const el = nodes[found].el;
        el.classList.add('is-active');
        // Auto-scroll verse into view (respect reduced motion)
        el.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
      index.activeIdx = found;
    }
  }

  // ---------- Media Session ----------

  function setupMediaSession({ audio, trackList, tracks }) {
    if (!('mediaSession' in navigator)) return;

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

    if (tracks.length) {
      navigator.mediaSession.setActionHandler?.('previoustrack', () => {
        const activeIdx = tracks.findIndex(el => el.classList.contains('is-active'));
        const prev = activeIdx > 0 ? tracks[activeIdx - 1] : tracks[0];
        prev?.click();
      });
      navigator.mediaSession.setActionHandler?.('nexttrack', () => {
        const activeIdx = tracks.findIndex(el => el.classList.contains('is-active'));
        const next = activeIdx >= 0 && activeIdx < tracks.length - 1 ? tracks[activeIdx + 1] : tracks[tracks.length - 1];
        next?.click();
      });
    }
  }

  // ---------- Keyboard shortcuts ----------

  function setupKeyboardShortcuts({ audio, playBtn, vol, loopToggle }) {
    document.addEventListener('keydown', (e) => {
      // Ignore when typing in inputs/selects/textareas
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay(audio, playBtn);
          break;
        case 'ArrowRight':
          audio.currentTime = Math.min((audio.duration || Infinity), audio.currentTime + 5);
          break;
        case 'ArrowLeft':
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          audio.volume = clamp(audio.volume + VOL_STEP, 0, 1);
          if (vol) vol.value = String(audio.volume);
          if (audio.volume > 0) audio.muted = false;
          localStorage.setItem('mantra:volume', String(audio.volume));
          localStorage.setItem('mantra:muted', audio.muted ? '1' : '0');
          break;
        case 'ArrowDown':
          e.preventDefault();
          audio.volume = clamp(audio.volume - VOL_STEP, 0, 1);
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
          } else {
            audio.loop = !audio.loop;
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
