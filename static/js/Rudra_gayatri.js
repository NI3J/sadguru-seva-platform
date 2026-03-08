/**
 * Rudra_gayatri.js
 * Sacred Spiritual Interactions
 * श्री संत कल्याणबाबा मंदिर कलशारोहण महोत्सव
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     PRELOADER
  ───────────────────────────────────────────────────────── */
  const preloader   = document.getElementById('preloader');
  const pageWrapper = document.getElementById('pageWrapper');

  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      pageWrapper.classList.add('visible');
      initRevealObserver();
    }, 1600);
  });

  /* ─────────────────────────────────────────────────────────
     CUSTOM CURSOR / FLAME TRAIL
  ───────────────────────────────────────────────────────── */
  const cursorTrail = document.getElementById('cursorTrail');
  let cursorX = -100, cursorY = -100;
  let trailX = -100, trailY = -100;

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  });

  // Trailing flame particles
  const trailParticles = [];
  const MAX_TRAIL = 12;

  function spawnTrailParticle(x, y) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:fixed;
      pointer-events:none;
      z-index:9998;
      width:6px;
      height:6px;
      border-radius:50%;
      background:radial-gradient(circle, #f0c040, #ff6600 60%, transparent);
      left:${x}px;
      top:${y}px;
      transform:translate(-50%,-50%);
      transition:opacity 0.6s ease, transform 0.6s ease;
    `;
    document.body.appendChild(p);
    trailParticles.push(p);

    if (trailParticles.length > MAX_TRAIL) {
      const old = trailParticles.shift();
      old.remove();
    }

    setTimeout(() => {
      p.style.opacity = '0';
      p.style.transform = `translate(-50%, calc(-50% - 15px)) scale(0.3)`;
    }, 50);
    setTimeout(() => p.remove(), 650);
  }

  let lastTrailTime = 0;
  function animateCursor() {
    // Smooth cursor follow
    trailX += (cursorX - trailX) * 0.15;
    trailY += (cursorY - trailY) * 0.15;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';

    // Spawn trail particles
    const now = Date.now();
    if (now - lastTrailTime > 60) {
      const dx = Math.abs(cursorX - trailX);
      const dy = Math.abs(cursorY - trailY);
      if (dx + dy > 5) {
        spawnTrailParticle(trailX, trailY);
        lastTrailTime = now;
      }
    }

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hide cursor on mobile
  if ('ontouchstart' in window) {
    cursorTrail.style.display = 'none';
    document.body.style.cursor = 'auto';
  }

  /* ─────────────────────────────────────────────────────────
     SACRED PARTICLE CANVAS
  ───────────────────────────────────────────────────────── */
  const canvas = document.getElementById('sacredCanvas');
  const ctx    = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Sacred symbols and dots
  const SYMBOLS = ['ॐ', '✦', '•', '🔱', '✦', '•', '•'];
  const particles = [];

  class Particle {
    constructor() { this.reset(); }

    reset() {
      this.x      = Math.random() * canvas.width;
      this.y      = canvas.height + 20;
      this.size   = Math.random() * 14 + 6;
      this.speedY = -(Math.random() * 0.4 + 0.15);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.alpha  = 0;
      this.maxAlpha = Math.random() * 0.25 + 0.05;
      this.fadeIn = true;
      this.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

      // Color: gold or saffron
      this.color  = Math.random() > 0.5
        ? `rgba(212,160,23,${this.maxAlpha})`
        : `rgba(255,102,0,${this.maxAlpha})`;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;

      if (this.fadeIn) {
        this.alpha = Math.min(this.alpha + 0.005, this.maxAlpha);
        if (this.alpha >= this.maxAlpha) this.fadeIn = false;
      } else {
        this.alpha = Math.max(this.alpha - 0.002, 0);
      }

      if (this.y < -30 || this.alpha <= 0) this.reset();
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.font = `${this.size}px "Noto Sans Devanagari", sans-serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.fillText(this.symbol, this.x, this.y);
      ctx.restore();
    }
  }

  // Init particles
  for (let i = 0; i < 55; i++) {
    const p = new Particle();
    p.y = Math.random() * canvas.height; // scatter initial positions
    particles.push(p);
  }

  // Mandala rings
  const rings = [
    { r: 200, speed: 0.0008, alpha: 0.04, color: '#d4a017' },
    { r: 350, speed: -0.0005, alpha: 0.03, color: '#ff6600' },
    { r: 500, speed: 0.0003, alpha: 0.02, color: '#d4a017' },
  ];
  let ringAngle = 0;

  function drawMandalaRings() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    rings.forEach((ring, i) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringAngle * (i % 2 === 0 ? 1 : -1) + i * 0.5);

      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.alpha;
      ctx.lineWidth   = 1;

      // Dotted ring
      ctx.setLineDash([4, 20]);
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });

    ringAngle += 0.003;
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMandalaRings();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();

  /* ─────────────────────────────────────────────────────────
     TABS / SCHEDULE
  ───────────────────────────────────────────────────────── */
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.dataset.day;

      // Update buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panels
      tabPanels.forEach(p => p.classList.remove('active'));
      const target = document.querySelector(`.tab-panel[data-panel="${day}"]`);
      if (target) target.classList.add('active');

      // Scroll tab into view
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });

  /* ─────────────────────────────────────────────────────────
     AUTO-SWITCH TO CURRENT / UPCOMING DAY
  ───────────────────────────────────────────────────────── */
  const eventDays = [
    new Date('2026-03-19'),
    new Date('2026-03-20'),
    new Date('2026-03-21'),
    new Date('2026-03-22'),
    new Date('2026-03-23'),
    new Date('2026-03-24'),
    new Date('2026-03-25'),
    new Date('2026-03-26'),
    new Date('2026-03-27'),
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeDay = 0; // default to pre-event
  for (let i = eventDays.length - 1; i >= 0; i--) {
    if (today >= eventDays[i]) { activeDay = i; break; }
  }
  if (today > eventDays[eventDays.length - 1]) activeDay = eventDays.length - 1;

  // Activate the matching tab
  const matchBtn = document.querySelector(`.tab-btn[data-day="${activeDay}"]`);
  if (matchBtn) {
    setTimeout(() => matchBtn.click(), 1800);
  }

  /* ─────────────────────────────────────────────────────────
     COUNTDOWN TIMER
  ───────────────────────────────────────────────────────── */
  const countdownTarget = new Date('2026-03-20T06:00:00+05:30');
  const cdDays    = document.getElementById('cd-days');
  const cdHours   = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');

  function pad2(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const now  = new Date();
    const diff = countdownTarget - now;

    if (diff <= 0) {
      // Event has started
      if (cdDays)    cdDays.textContent    = '00';
      if (cdHours)   cdHours.textContent   = '00';
      if (cdMinutes) cdMinutes.textContent = '00';
      if (cdSeconds) cdSeconds.textContent = '00';

      // Show "Live" indicator
      const cdGrid = document.getElementById('countdown');
      if (cdGrid && !cdGrid.querySelector('.live-badge')) {
        const badge = document.createElement('div');
        badge.className = 'live-badge';
        badge.innerHTML = '🔴 महोत्सव सुरू आहे!';
        badge.style.cssText = `
          margin-top:1.2rem;
          font-family:'Noto Sans Devanagari',sans-serif;
          font-size:1.1rem;
          color:#ff6600;
          font-weight:700;
          animation:fadeFlicker 1.5s ease-in-out infinite;
          text-align:center;
        `;
        cdGrid.after(badge);
      }
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (cdDays)    cdDays.textContent    = pad2(days);
    if (cdHours)   cdHours.textContent   = pad2(hours);
    if (cdMinutes) cdMinutes.textContent = pad2(minutes);
    if (cdSeconds) cdSeconds.textContent = pad2(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ─────────────────────────────────────────────────────────
     SCROLL REVEAL — INTERSECTION OBSERVER
  ───────────────────────────────────────────────────────── */
  function initRevealObserver() {
    const revealEls = document.querySelectorAll(
      '.reveal-up, .reveal-left, .reveal-right, .reveal-fade'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
        setTimeout(() => el.classList.add('in-view'), delay);
        observer.unobserve(el);
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => observer.observe(el));
  }

  /* ─────────────────────────────────────────────────────────
     HEADER PARALLAX
  ───────────────────────────────────────────────────────── */
  const siteHeader = document.querySelector('.site-header');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (siteHeader && scrollY < window.innerHeight) {
      const headerContent = siteHeader.querySelector('.header-content');
      if (headerContent) {
        headerContent.style.transform = `translateY(${scrollY * 0.25}px)`;
        headerContent.style.opacity   = 1 - (scrollY / (window.innerHeight * 0.8));
      }
    }
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────
     MANTRA CARD — GENTLE GLOW PULSE ON HOVER
  ───────────────────────────────────────────────────────── */
  const mantraCard = document.querySelector('.mantra-card');
  if (mantraCard) {
    mantraCard.addEventListener('mouseenter', () => {
      mantraCard.style.boxShadow = '0 0 50px rgba(212,160,23,0.4), 0 0 100px rgba(212,160,23,0.15), inset 0 0 40px rgba(212,160,23,0.05)';
    });
    mantraCard.addEventListener('mouseleave', () => {
      mantraCard.style.boxShadow = '';
    });
  }

  /* ─────────────────────────────────────────────────────────
     SMOOTH SCROLL FOR ANCHOR LINKS
  ───────────────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─────────────────────────────────────────────────────────
     ABOUT CARDS — ENTRANCE STAGGER ON SCROLL
  ───────────────────────────────────────────────────────── */
  const aboutCards = document.querySelectorAll('.about-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  aboutCards.forEach(card => {
    card.classList.add('reveal-up');
    cardObserver.observe(card);
  });

  /* ─────────────────────────────────────────────────────────
     COUNTDOWN BOX — FLIP ANIMATION ON DIGIT CHANGE
  ───────────────────────────────────────────────────────── */
  const cdBoxes = document.querySelectorAll('.countdown-num');
  const prevVals = {};

  function flashChange(el, id) {
    const current = el.textContent;
    if (prevVals[id] !== current) {
      prevVals[id] = current;
      el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      el.style.transform  = 'scaleY(0.7)';
      el.style.opacity    = '0.5';
      setTimeout(() => {
        el.style.transform = 'scaleY(1)';
        el.style.opacity   = '1';
      }, 200);
    }
  }

  // Hook into countdown update
  const origUpdate = updateCountdown;
  setInterval(() => {
    cdBoxes.forEach((box, i) => {
      const ids = ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'];
      if (ids[i]) flashChange(box, ids[i]);
    });
  }, 1000);

  /* ─────────────────────────────────────────────────────────
     TOUCH SWIPE ON TABS (Mobile)
  ───────────────────────────────────────────────────────── */
  let touchStartX = 0;
  let touchEndX   = 0;
  const panelsContainer = document.getElementById('tabPanels');

  if (panelsContainer) {
    panelsContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    panelsContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        const activeBtn  = document.querySelector('.tab-btn.active');
        const allBtns    = [...document.querySelectorAll('.tab-btn')];
        const currentIdx = allBtns.indexOf(activeBtn);

        if (diff > 0 && currentIdx < allBtns.length - 1) {
          allBtns[currentIdx + 1].click(); // swipe left → next
        } else if (diff < 0 && currentIdx > 0) {
          allBtns[currentIdx - 1].click(); // swipe right → prev
        }
      }
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────
     KEYBOARD NAVIGATION FOR TABS
  ───────────────────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const activeBtn  = document.querySelector('.tab-btn.active');
    const allBtns    = [...document.querySelectorAll('.tab-btn')];
    const currentIdx = allBtns.indexOf(activeBtn);

    if (e.key === 'ArrowRight' && currentIdx < allBtns.length - 1) {
      allBtns[currentIdx + 1].click();
    }
    if (e.key === 'ArrowLeft' && currentIdx > 0) {
      allBtns[currentIdx - 1].click();
    }
  });

  /* ─────────────────────────────────────────────────────────
     AUDIO PLAYER — AUTO-SCROLL TO MANTRA SECTION
  ───────────────────────────────────────────────────────── */
  const rudraAudio = document.getElementById('rudraAudio');
  const mantraSection = document.getElementById('mantra-section');

  if (rudraAudio && mantraSection) {
    // When audio starts playing, scroll to mantra section
    rudraAudio.addEventListener('play', () => {
      setTimeout(() => {
        mantraSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight effect
        mantraSection.classList.add('audio-playing');
      }, 300);
    });

    // Remove highlight when audio pauses or ends
    rudraAudio.addEventListener('pause', () => {
      mantraSection.classList.remove('audio-playing');
    });

    rudraAudio.addEventListener('ended', () => {
      mantraSection.classList.remove('audio-playing');
    });

    // Optional: Highlight mantra lines as audio plays
    const mantraLines = document.querySelectorAll('.mantra-line');
    if (mantraLines.length > 0) {
      rudraAudio.addEventListener('timeupdate', () => {
        const currentTime = rudraAudio.currentTime;
        const duration = rudraAudio.duration;
        
        if (duration > 0) {
          const progress = currentTime / duration;
          const activeIndex = Math.floor(progress * mantraLines.length);
          
          mantraLines.forEach((line, index) => {
            if (index <= activeIndex) {
              line.classList.add('active');
            } else {
              line.classList.remove('active');
            }
          });
        }
      });
    }
  }

  console.log('🕉️  रुद्र गायत्री महायज्ञ — JS Initialized  ✦  हर हर महादेव');

})();
