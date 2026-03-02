/**
 * =====================================================================
 * GURU MANTRA JAP COUNTER
 * =====================================================================
 * Mantra: ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि तन्नो रुद्रः प्रचोदयात्
 *         (Rudra Gayatri / Shiva Gayatri Mantra)
 *
 * Features:
 *  - Voice recognition (hi-IN) with fuzzy Sanskrit matching
 *  - Manual count fallback
 *  - Mala tracking (108 per mala)
 *  - Today / lifetime counters with server persistence
 *  - IST-aware midnight reset
 *  - Session timeout with continue/logout prompt
 * =====================================================================
 */

// ======================================================================
// SECTION 1 — APPLICATION CLASS
// ======================================================================

class GuruMantraCounter {

    // ------------------------------------------------------------------
    // 1.1  CONSTRUCTOR
    // ------------------------------------------------------------------

    constructor() {
        this._initState();
        this._initConfig();
        this._initMetrics();
        this._initServerTime();
        this._initSessionTimeout();

        this.elements   = {};
        this.recognition = null;

        this.init();
    }

    _initState() {
        this.state = {
            // ---- lifetime totals ----
            totalWords:            0,
            totalPronunciations:   0,
            totalMalas:            0,

            // ---- today's totals ----
            todayWords:            0,
            todayPronunciations:   0,
            todayMalas:            0,
            todayDate:             this._localDateString(),
            todaysCount:           0,

            // ---- current mala progress ----
            currentMalaPronunciations: 0,

            // ---- session ----
            sessionStartTime:      Date.now(),
            isInitialized:         false,
            isListening:           false,
            isSaving:              false,
            isFirstLoad:           true,

            // ---- user ----
            userName: '',
            userId:   null,

            // ---- recognition ----
            lastRecognitionTime:  0,
        };
    }

    _initConfig() {
        this.config = {
            // Mantra: 8 words, 108 per mala
            wordsPerPronunciation:  8,
            pronunciationsPerMala: 108,

            // hi-IN gives far better Sanskrit / Devanagari recognition than en-IN
            recognitionLang: 'hi-IN',

            // Debounce — ignore duplicates within 300 ms
            minTimeBetweenCounts: 300,

            // Server sync intervals (ms)
            autoSaveInterval: 10_000,
            syncInterval:     30_000,

            // Milestone mala counts that trigger celebrations
            milestones: [10, 21, 51, 108, 1008],
        };
    }

    _initMetrics() {
        this.metrics = {
            recognitionSuccesses: 0,
            recognitionAttempts:  0,
        };
    }

    _initServerTime() {
        this.serverDate          = null;
        this.serverTime          = null;
        this.serverHour          = null;
        this.serverMinute        = null;
        this.serverSecond        = null;
        this.serverTimeFetchedAt = null;
        this.serverTimeLoading   = false;
    }

    _initSessionTimeout() {
        this.sessionTimeout = {
            duration:        5 * 60 * 1000,   // 5 min inactivity → prompt
            responseWindow:  30 * 1000,        // 30 s to respond before force-logout
            lastActivity:    Date.now(),
            timeoutId:       null,
            warningId:       null,
            isWarningShown:  false,
        };
    }

    // ------------------------------------------------------------------
    // 1.2  BOOT SEQUENCE
    // ------------------------------------------------------------------

    async init() {
        try {
            console.log('🙏 Booting Guru Mantra Counter…');

            await this._authenticateUser();
            const serverDate = await this._fetchServerTime();
            console.log('🕐 Server date:', serverDate);

            this._cacheElements();
            this._initSpeechRecognition();
            this._attachEventListeners();
            await this._loadStateFromServer();
            this._startAutoProcesses();
            this._startSessionTimeout();

            this.state.isInitialized = true;
            this._updateUI();
            this._verifyButtons();

            this._showNotification('🙏 स्वागत आहे! जपाची तयारी झाली', 'success');
            console.log('✅ Boot complete');
        } catch (err) {
            console.error('❌ Boot error:', err);
            this._handleBootError(err);
        }
    }

    async _authenticateUser() {
        const res  = await fetch('/guru-mantra/auth/check_session', {
            method: 'GET', credentials: 'same-origin',
        });
        const data = await res.json();

        if (!data.authenticated) {
            window.location.href = '/guru-mantra/auth';
            throw new Error('Not authenticated');
        }

        this.state.userName = data.user_name || 'साधक';
        this.state.userId   = data.user_id;
        console.log('✅ Authenticated:', this.state.userName);
    }

    _handleBootError(err) {
        this._showNotification('प्रारंभ करता आले नाही', 'error');
        if (err.message === 'Not authenticated') {
            setTimeout(() => { window.location.href = '/guru-mantra/auth'; }, 2000);
        }
    }

    // ------------------------------------------------------------------
    // 1.3  DOM CACHE
    // ------------------------------------------------------------------

    _cacheElements() {
        const ids = [
            'countDisplay', 'malaStatus', 'totalMalas',
            'startBtn', 'stopBtn', 'manualBtn', 'resetBtn',
            'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration',
            'userName', 'logoutBtn',
            'sessionTime', 'todayCount', 'accuracy',
            'datetimeDisplay', 'fullJapCount',
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                this.elements[id] = el;
            } else {
                console.warn('⚠️ Element not found:', id);
            }
        });

        // datetimeDisplay can also live inside datetimeDisplaySection
        if (!this.elements.datetimeDisplay) {
            const sec = document.getElementById('datetimeDisplaySection');
            if (sec) {
                this.elements.datetimeDisplaySection = sec;
                const inner = sec.querySelector('#datetimeDisplay');
                if (inner) this.elements.datetimeDisplay = inner;
            }
        }

        if (this.elements.userName && this.state.userName) {
            this.elements.userName.textContent = '🙏 ' + this.state.userName;
        }

        console.log('✅ Cached', Object.keys(this.elements).length, 'DOM elements');
    }

    // ------------------------------------------------------------------
    // 1.4  EVENT LISTENERS
    // ------------------------------------------------------------------

    _attachEventListeners() {
        // Helper: attach both click + touchstart
        const on = (id, fn) => {
            const el = this.elements[id] || document.getElementById(id);
            if (!el) { console.error('❌ Element missing:', id); return; }
            if (!this.elements[id]) this.elements[id] = el;

            ['click', 'mousedown', 'touchstart'].forEach(evt => {
                el.addEventListener(evt, e => {
                    e.preventDefault();
                    e.stopPropagation();
                    fn(e);
                });
            });
        };

        on('startBtn',  () => { if (!this.state.isListening) this.startListening(); });
        on('stopBtn',   () => { if (this.state.isListening)  this.stopListening(); });
        on('manualBtn', () => this._addManualCount());
        on('resetBtn',  () => this._confirmReset());

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.logout());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            this._updateActivity();
            if (e.code === 'Space' && !e.target.matches('input,textarea,button')) {
                e.preventDefault();
                this.state.isListening ? this.stopListening() : this.startListening();
            }
            if (e.code === 'Escape' && this.state.isListening)  { e.preventDefault(); this.stopListening(); }
            if (e.ctrlKey && e.code === 'Enter')                { e.preventDefault(); this._addManualCount(); }
        });

        document.addEventListener('click',     () => this._updateActivity());
        document.addEventListener('mousemove', () => this._updateActivity());

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isListening) this.stopListening();
        });

        window.addEventListener('beforeunload', () => this._saveToServer(true));

        console.log('✅ Event listeners attached');
    }

    _verifyButtons() {
        ['startBtn', 'stopBtn', 'manualBtn', 'resetBtn'].forEach(id => {
            const btn = this.elements[id] || document.getElementById(id);
            if (!btn) { console.error('❌ Button missing:', id); return; }
            btn.style.cssText += ';pointer-events:auto;cursor:pointer;position:relative;z-index:100;';
            if (id === 'startBtn' && btn.disabled && !this.state.isListening) btn.disabled = false;
        });
    }

    // ------------------------------------------------------------------
    // 1.5  AUTO PROCESSES
    // ------------------------------------------------------------------

    _startAutoProcesses() {
        // Auto-save every 10 s
        setInterval(() => { if (!this.state.isSaving) this._saveToServer(); }, this.config.autoSaveInterval);

        // Server-time sync + date-change check every 5 min
        setInterval(async () => {
            await this._fetchServerTime();
            this._checkDateChange();
            this._updateDateTimeDisplay();
        }, 5 * 60 * 1000);

        // Date-change check every minute
        setInterval(() => this._checkDateChange(), 60_000);

        // Clock tick every second
        setInterval(() => this._updateDateTimeDisplay(), 1_000);

        console.log('✅ Auto-processes started');
    }
}


// ======================================================================
// SECTION 2 — SPEECH RECOGNITION
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    // ------------------------------------------------------------------
    // 2.1  SETUP
    // ------------------------------------------------------------------

    _initSpeechRecognition() {
        try {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) throw new Error('SpeechRecognition API not available');

            this.recognition = new SR();
            this.recognition.lang             = this.config.recognitionLang; // hi-IN
            this.recognition.interimResults   = true;
            this.recognition.maxAlternatives  = 5;
            this.recognition.continuous       = true;

            this.recognition.onstart  = ()  => { this.state.isListening = true;  this._updateUI(); };
            this.recognition.onresult = (e) => this._onResult(e);
            this.recognition.onend    = ()  => this._onEnd();
            this.recognition.onerror  = (e) => this._onError(e);

            console.log('✅ Speech recognition ready (lang:', this.config.recognitionLang + ')');
        } catch (err) {
            console.error('❌ SpeechRecognition init failed:', err);
            this._showNotification('आवाज ओळख उपलब्ध नाही', 'error');
            this.recognition = null;
        }
    },

    // ------------------------------------------------------------------
    // 2.2  START / STOP
    // ------------------------------------------------------------------

    async startListening() {
        if (!this.recognition) {
            this._showNotification('आवाज ओळख उपलब्ध नाही', 'error');
            return;
        }
        // Request microphone permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
        } catch {
            this._showNotification('मायक्रोफोन ची परवानगी नाही', 'error');
            return;
        }
        if (!this.state.isListening) {
            try {
                this.recognition.start();
                this.state.isListening = true;
                this._updateUI();
                this._updateActivity();
                console.log('🎤 Listening started');
            } catch (err) {
                if (err.message?.includes('already started')) {
                    this.state.isListening = true;
                    this._updateUI();
                } else {
                    this._showNotification('सुरुवात करता आली नाही', 'error');
                }
            }
        }
    },

    stopListening() {
        if (this.state.isListening && this.recognition) {
            try   { this.recognition.stop(); }
            catch (err) { console.error('❌ stopListening:', err); }
            this.state.isListening = false;
            this._updateUI();
            this._updateActivity();
            console.log('⏸️ Listening stopped');
        }
    },

    // ------------------------------------------------------------------
    // 2.3  RECOGNITION EVENTS
    // ------------------------------------------------------------------

    _onResult(event) {
        const results     = event.results;
        let hasFinal      = false;
        let bestText      = '';
        let matchCount    = 0;

        for (let ri = 0; ri < results.length; ri++) {
            const result = results[ri];
            if (result.isFinal) hasFinal = true;

            for (let ai = 0; ai < result.length; ai++) {
                const transcript = result[ai].transcript;
                const confidence = result[ai].confidence;

                // Track best transcript for display
                if (ai === 0 && ri === results.length - 1) bestText = transcript;

                if (result.isFinal) {
                    console.log(`🎤 Final [${ai + 1}]: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
                    const c = this._countRepetitions(transcript);
                    if (c > 0) { matchCount = Math.max(matchCount, c); bestText = transcript; }
                } else {
                    console.log(`🎤 Interim: "${transcript}"`);
                }
            }
        }

        // Show interim feedback
        if (!hasFinal) {
            if (bestText) this._displayText(bestText + '…');
            return;
        }

        this._displayText(bestText);
        this.metrics.recognitionAttempts++;

        if (matchCount > 0) {
            console.log('✅ Mantras detected:', matchCount);
            this._handleMatch(matchCount, Date.now());
        } else if (bestText.trim()) {
            console.log('⚠️ No mantra in:', bestText);
            this._handleMismatch();
        }
    },

    _onEnd() {
        // Auto-restart when user still wants to listen
        if (this.state.isListening && this.state.isInitialized && !document.hidden && this.recognition) {
            this._safeRestart();
        } else {
            this._updateUI();
        }
    },

    _onError(event) {
        console.error('❌ Recognition error:', event.error);

        const fatal = ['not-allowed', 'audio-capture'];

        if (fatal.includes(event.error)) {
            this.state.isListening = false;
            const msgs = {
                'not-allowed':    'मायक्रोफोन ची परवानगी नाही',
                'audio-capture':  'मायक्रोफोन उपलब्ध नाही आहे',
            };
            if (msgs[event.error]) this._showNotification(msgs[event.error], 'error');
        } else if (event.error === 'no-speech') {
            // Normal — keep listening
            console.log('ℹ️ No speech, continuing…');
        } else if (event.error !== 'aborted') {
            console.log('⚠️ Non-fatal error, continuing:', event.error);
        }

        this._updateUI();

        if (this.state.isListening && !fatal.includes(event.error) && event.error !== 'aborted') {
            this._safeRestart();
        }
    },

    // ------------------------------------------------------------------
    // 2.4  SAFE RESTART HELPER
    // ------------------------------------------------------------------

    _safeRestart(attempt = 0) {
        if (!this.state.isListening || !this.recognition) return;

        requestAnimationFrame(() => {
            try {
                this.recognition.start();
                console.log('🔄 Recognition restarted');
                this.state.isListening = true;
                this._updateUI();
            } catch (err) {
                if (err.message?.includes('already started')) {
                    // Already running — fine
                    this.state.isListening = true;
                    this._updateUI();
                } else if (attempt < 3) {
                    // Retry up to 3 times with brief back-off
                    setTimeout(() => this._safeRestart(attempt + 1), 100 * (attempt + 1));
                } else {
                    console.error('❌ Could not restart recognition after 3 attempts');
                    this.state.isListening = false;
                    this._updateUI();
                    this._showNotification('ओळखणे थांबले', 'error');
                }
            }
        });
    },

    // ------------------------------------------------------------------
    // 2.5  MATCH HANDLERS
    // ------------------------------------------------------------------

    _handleMatch(count, timestamp) {
        if (timestamp - this.state.lastRecognitionTime < this.config.minTimeBetweenCounts) {
            console.log('⏭️ Debounced duplicate');
            return;
        }
        this.metrics.recognitionSuccesses++;
        this.state.lastRecognitionTime = timestamp;
        this._updateActivity();
        this._disappearMantraWords();
        this._incrementByCount(count);

        const words = count * this.config.wordsPerPronunciation;
        const msg   = count === 1
            ? `✅ ${this.config.wordsPerPronunciation} शब्द गणना झाले!`
            : `✅ ${count} वेळा (${words} शब्द) गणना झाले!`;
        this._showNotification(msg, 'success', 800);
        this._feedbackSuccess();
    },

    _handleMismatch() {
        this._showNotification('⚠️ कृपया मंत्राव्यतिरिक्त दुसरे काही म्हणू नका', 'error', 2000);
        this._feedbackWarning();
    },
});


// ======================================================================
// SECTION 3 — MANTRA DETECTION
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    // ------------------------------------------------------------------
    // 3.1  ENTRY POINT
    // ------------------------------------------------------------------

    _countRepetitions(rawText) {
        const norm    = this._normalizeText(rawText);
        const cleaned = this._cleanText(norm);

        console.log('🔍 Raw:', rawText);
        console.log('🔍 Norm:', norm);
        console.log('🔍 Cleaned:', cleaned);

        // Pass 1 — exact regex (fast path)
        const exactCount = this._exactMatch(norm, cleaned);
        if (exactCount > 0) return exactCount;

        // Pass 2 — fuzzy keyword scoring
        const fuzzyCount = this._fuzzyMatch(rawText, norm, cleaned);
        if (fuzzyCount > 0) return fuzzyCount;

        console.log('❌ No mantra detected');
        return 0;
    },

    // ------------------------------------------------------------------
    // 3.2  EXACT MATCH PATTERNS
    // ------------------------------------------------------------------

    _exactMatch(norm, cleaned) {
        // Ordered from most-specific to most-lenient
        const patterns = [
            // Standard full mantra
            /om\s+tatpurushaya\s+vidmahe\s+mahadevaya\s+dhimahi\s+tanno\s+rudra\s+prachodayat/i,
            // Without Om
            /tatpurushaya\s+vidmahe\s+mahadevaya\s+dhimahi\s+tanno\s+rudra\s+prachodayat/i,
            // Common en-IN misrecognition ("tatpurushon with mahesh")
            /tatpurushon\s+with\s+mahesh\s+dhimahi\s+tanno\s+rudra\s+prachodyat/i,
            /tatpurushon\s+with\s+mahesh\s+dhimahi\s+tanno\s+rudra\s+prachodayat/i,
            // Distinctive ending alone (highly unique to this mantra)
            /dhimahi\s+tanno\s+rudra[h]?\s+prachodayat/i,
            /dhimahi\s+tanno\s+rudra\s+prachodyat/i,
        ];

        for (const pat of patterns) {
            const src = pat.test(norm) ? norm : (pat.test(cleaned) ? cleaned : null);
            if (src) {
                const hits = (src.match(new RegExp(pat.source, 'gi')) || []).length;
                console.log('✅ Exact match:', pat.source, '— count:', hits);
                return hits;
            }
        }
        return 0;
    },

    // ------------------------------------------------------------------
    // 3.3  FUZZY MATCH (keyword scoring)
    // ------------------------------------------------------------------

    _fuzzyMatch(rawText, norm, cleaned) {
        // Each entry: [regex, label]
        const keywords = [
            [/\b(om|ॐ)\b/i,                                 'om'],
            [/\btatpurusha(ya|n|on)?\b/i,                   'tatpurushaya'],
            [/\b(vidmahe?|mahiti)\b/i,                      'vidmahe'],
            [/\b(mahadeva(ya)?|mahesh)\b/i,                 'mahadevaya'],
            [/\bdhimahi\b/i,                                'dhimahi'],
            [/\btanno\b/i,                                  'tanno'],
            [/\brudr[aah]?\b/i,                             'rudra'],
            [/\bprachod[aiy]*t?\b/i,                        'prachodayat'],
        ];

        // Also try Devanagari directly in the raw text
        const devanagariKw = [
            /तत्पुरुषाय/, /विद्महे/, /महादेवाय/,
            /धीमहि/, /तन्नो/, /रुद्र/, /प्रचोदयात्/,
        ];

        const matched = [];
        const sources = [norm, cleaned];

        for (const [pat, label] of keywords) {
            if (sources.some(s => pat.test(s))) matched.push(label);
        }

        let devanagariHits = 0;
        for (const pat of devanagariKw) {
            if (pat.test(rawText)) devanagariHits++;
        }

        console.log(`🔍 Fuzzy: ${matched.length}/8 Latin keywords: [${matched.join(', ')}]`);
        console.log(`🔍 Fuzzy: ${devanagariHits}/7 Devanagari keywords`);

        // Accept on Devanagari match (hi-IN returns script directly)
        if (devanagariHits >= 3) {
            console.log('✅ Fuzzy: Devanagari match');
            return 1;
        }

        // Accept on 4+ Latin keywords
        if (matched.length >= 4) {
            console.log('✅ Fuzzy: Latin keyword match');
            return 1;
        }

        // Distinctive ending shortcut — "tanno rudra prachodayat" is highly unique
        const hasEnding = /\btanno\b/i.test(cleaned) &&
                          /\brudr/i.test(cleaned) &&
                          /\bprachod/i.test(cleaned);
        if (hasEnding) {
            console.log('✅ Fuzzy: Distinctive ending detected');
            return 1;
        }

        return 0;
    },

    // ------------------------------------------------------------------
    // 3.4  TEXT NORMALISATION
    // ------------------------------------------------------------------

    _normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[।,\.!\?;:"']/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    _cleanText(norm) {
        return norm
            // Devanagari → Latin transliteration
            .replace(/ॐ/g,          'om')
            .replace(/तत्पुरुषाय/g, 'tatpurushaya')
            .replace(/विद्महे/g,    'vidmahe')
            .replace(/महादेवाय/g,   'mahadevaya')
            .replace(/धीमहि/g,      'dhimahi')
            .replace(/तन्नो/g,      'tanno')
            .replace(/रुद्रः/g,     'rudra')
            .replace(/प्रचोदयात्/g, 'prachodayat')

            // Common speech-engine mis-spellings
            .replace(/\btatpurush[ao]n\b/gi,   'tatpurushaya')
            .replace(/\bvidmahe?\b/gi,          'vidmahe')
            .replace(/\bmahadeva(ya)?\b/gi,     'mahadevaya')
            .replace(/\brudr[aah]+\b/gi,        'rudra')
            .replace(/\bprachod[ay]+t?\b/gi,    'prachodayat')

            .replace(/\s+/g, ' ')
            .trim();
    },
});


// ======================================================================
// SECTION 4 — COUNTING & MALA LOGIC
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    _incrementByCount(count) {
        // 1 recognition hit = `count` complete mantras
        const now = count;

        const willFinishMala =
            (this.state.currentMalaPronunciations + now) >= this.config.pronunciationsPerMala;

        if (willFinishMala) {
            const remaining = this.config.pronunciationsPerMala - this.state.currentMalaPronunciations;
            const excess    = now - remaining;

            this.state.totalMalas++;
            this.state.todayMalas++;
            this.state.currentMalaPronunciations = excess > 0 ? excess : 0;

            setTimeout(() => this._onMalaComplete(), 100);
        } else {
            this.state.currentMalaPronunciations += now;
        }

        this.state.totalWords          += now;
        this.state.totalPronunciations += now;
        this.state.todayWords          += now;
        this.state.todayPronunciations += now;
        this.state.todaysCount          = this.state.todayWords;

        console.log('📊 Count:', {
            total: this.state.totalWords,
            today: this.state.todayWords,
            malaProgress: this.state.currentMalaPronunciations,
            totalMalas: this.state.totalMalas,
        });

        this._updateUI();
        this._saveToServer();
    },

    _onMalaComplete() {
        console.log('🎉 Mala complete! Total:', this.state.totalMalas, '| Today:', this.state.todayMalas);
        this._celebrateMala();
        this._checkMilestones();
        this._updateUI();
    },

    _checkMilestones() {
        if (this.config.milestones.includes(this.state.totalMalas)) {
            this._celebrateMilestone(this.state.totalMalas);
        }
    },

    _addManualCount() {
        this._disappearMantraWords();
        this._updateActivity();
        this._incrementByCount(1);
        this._showNotification('➕ व्यक्तिशः काउंट जोडले गेले', 'success', 1000);
        this._feedbackSuccess();
    },

    _confirmReset() {
        if (confirm('खात्री आहे काय? आज के जप रिसेट होईल (कुल जप सुरक्षित रहेगा)')) {
            this._resetTodayCount();
            this._updateActivity();
        }
    },

    _resetTodayCount() {
        this.state.todayWords              = 0;
        this.state.todayPronunciations     = 0;
        this.state.todayMalas              = 0;
        this.state.currentMalaPronunciations = 0;
        this.state.todaysCount             = 0;
        this._resetMantraDisplay();
        this._updateUI();
        this._saveToServer(true);
        this._showNotification('आज के जप रिसेट झाले (कुल जप सुरक्षित)', 'info');
        console.log('🔄 Today\'s counter reset');
    },
});


// ======================================================================
// SECTION 5 — SERVER PERSISTENCE
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    async _loadStateFromServer() {
        try {
            console.log('📥 Loading state from server…');
            const res  = await fetch('/guru-mantra/api/state', { method: 'GET', credentials: 'same-origin' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (!data.success) return;

            // Lifetime totals — take the higher value to prevent data loss
            this.state.totalWords          = Math.max(this.state.totalWords,          data.count                  || 0);
            this.state.totalMalas          = Math.max(this.state.totalMalas,          data.total_malas            || 0);
            this.state.totalPronunciations = Math.max(this.state.totalPronunciations, data.total_pronunciations   || 0);
            this.state.currentMalaPronunciations = data.current_mala_pronunciations   || 0;

            // Date comparison (IST)
            const storedDate  = data.today_date       || this.serverDate || this._localDateString();
            const currentDate = this.serverDate        || this._localDateString();
            const sameDay     = storedDate === currentDate || (!this.serverDate && storedDate);

            if (sameDay) {
                const serverTodaysCount = data.todays_count !== undefined ? data.todays_count : (data.today_words || 0);

                if (this.state.isFirstLoad) {
                    // First boot — load server values directly
                    this.state.todayWords          = data.today_words          || 0;
                    this.state.todayPronunciations = data.today_pronunciations || 0;
                    this.state.todayMalas          = data.today_malas          || 0;
                    this.state.todaysCount         = serverTodaysCount;
                    this.state.todayDate           = storedDate;
                    this.state.isFirstLoad         = false;
                    console.log('✅ First load — server values applied:', { todayWords: this.state.todayWords });
                    this._updateUI();
                } else {
                    // Sync — keep the higher value
                    this.state.todayWords          = Math.max(this.state.todayWords,          data.today_words          || 0);
                    this.state.todayPronunciations = Math.max(this.state.todayPronunciations, data.today_pronunciations || 0);
                    this.state.todayMalas          = Math.max(this.state.todayMalas,          data.today_malas          || 0);
                    this.state.todaysCount         = Math.max(this.state.todaysCount,         serverTodaysCount);
                    if (this.state.todayWords > this.state.todaysCount) {
                        this.state.todaysCount = this.state.todayWords;
                    }
                    console.log('✅ Sync — merged values');
                }
            } else {
                // Date changed — new day
                console.log('📅 New day detected. Stored:', storedDate, '| Current:', currentDate);
                if (this.state.isFirstLoad && (data.today_words > 0 || data.todays_count > 0)) {
                    // Possible timezone mismatch on first load — be cautious
                    console.warn('⚠️ Date mismatch on first load but server has data — loading anyway');
                    this.state.todayWords          = data.today_words          || 0;
                    this.state.todayPronunciations = data.today_pronunciations || 0;
                    this.state.todayMalas          = data.today_malas          || 0;
                    this.state.todaysCount         = data.todays_count         || 0;
                    this.state.todayDate           = storedDate || currentDate;
                    this.state.isFirstLoad         = false;
                    this._updateUI();
                } else {
                    this.state.todayDate           = currentDate;
                    this.state.todayWords          = 0;
                    this.state.todayPronunciations = 0;
                    this.state.todayMalas          = 0;
                    this.state.currentMalaPronunciations = 0;
                    this.state.todaysCount         = 0;
                }
            }

            console.log('✅ State loaded:', {
                totalWords:    this.state.totalWords,
                todayWords:    this.state.todayWords,
                totalMalas:    this.state.totalMalas,
                todaysCount:   this.state.todaysCount,
            });
        } catch (err) {
            console.error('❌ Load error:', err);
            this._showNotification('डेटा लोड करता आला नाही', 'error');
        }
    },

    async _saveToServer(immediate = false) {
        if (this.state.isSaving && !immediate) return;
        this.state.isSaving = true;

        const payload = {
            count:                     this.state.totalWords,
            totalMalas:                this.state.totalMalas,
            currentMalaPronunciations: this.state.currentMalaPronunciations,
            totalPronunciations:       this.state.totalPronunciations,
            todayWords:                this.state.todayWords,
            todayPronunciations:       this.state.todayPronunciations,
            todayMalas:                this.state.todayMalas,
            todayDate:                 this.state.todayDate,
            todaysCount:               this._calcTodayTotal(),
        };

        console.log('💾 Saving:', payload);

        try {
            const res = await fetch('/guru-mantra/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                console.log('✅ Saved');
            } else {
                console.error('❌ Save failed:', res.status);
                if (!immediate) this._showNotification('सेव्ह करता आले नाही', 'error');
            }
        } catch (err) {
            console.error('❌ Save error:', err);
            if (!immediate) this._showNotification('सर्वर शी कनेक्ट करता आले नाही', 'error');
        } finally {
            this.state.isSaving = false;
        }
    },
});


// ======================================================================
// SECTION 6 — UI UPDATES
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    _updateUI() {
        this._updateCountDisplay();
        this._updateMalaStatus();
        this._updateProgress();
        this._updateListeningStatus();
        this._updateButtons();
        this._updateSessionStats();
        this._updateFullJap();
        this._updateMantraDisplay();
        this._updateDateTimeDisplay();
    },

    _updateCountDisplay() {
        const el = this.elements.countDisplay;
        if (!el) return;
        const val = this._calcTodayTotal();
        if (parseInt(el.textContent) !== val) {
            el.classList.add('pulse');
            el.textContent = val;
            setTimeout(() => el.classList.remove('pulse'), 500);
        }
    },

    _updateMalaStatus() {
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent =
                'कुल माला: ' + this.state.totalMalas + ' | आज: ' + this.state.todayMalas;
        }
        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent =
                'वर्तमान माला: ' + this.state.currentMalaPronunciations + ' / ' + this.config.pronunciationsPerMala;
        }
        if (this.elements.remainingCount) {
            const rem = this.config.pronunciationsPerMala - this.state.currentMalaPronunciations;
            this.elements.remainingCount.textContent = 'शेष: ' + rem + ' वार';
        }
    },

    _updateProgress() {
        if (this.elements.progressFill) {
            const pct = (this.state.currentMalaPronunciations / this.config.pronunciationsPerMala) * 100;
            this.elements.progressFill.style.width = Math.min(pct, 100) + '%';
        }
    },

    _updateListeningStatus() {
        const el = this.elements.listeningStatus;
        if (!el) return;
        if (this.state.isListening) {
            el.textContent = '🎤 ऐकत आहे...';
            el.classList.add('listening');
        } else {
            el.textContent = '⏸️ थांबलेले आहे';
            el.classList.remove('listening');
        }
    },

    _updateButtons() {
        if (this.elements.startBtn && this.elements.stopBtn) {
            this.elements.startBtn.disabled = this.state.isListening;
            this.elements.stopBtn.disabled  = !this.state.isListening;
            this.elements.startBtn.classList.toggle('active', this.state.isListening);
        }
    },

    _updateSessionStats() {
        if (this.elements.sessionTime) {
            const mins = Math.floor((Date.now() - this.state.sessionStartTime) / 60_000);
            this.elements.sessionTime.textContent = mins + ' मिनट';
        }
        if (this.elements.todayCount) {
            this.elements.todayCount.textContent = this._calcTodayTotal();
        }
        if (this.elements.accuracy && this.metrics.recognitionAttempts > 0) {
            const pct = Math.round((this.metrics.recognitionSuccesses / this.metrics.recognitionAttempts) * 100);
            this.elements.accuracy.textContent = pct + '%';
        }
    },

    _updateFullJap() {
        const el = this.elements.fullJapCount;
        if (!el) return;
        if (parseInt(el.textContent) !== this.state.totalWords) {
            el.classList.add('pulse');
            el.textContent = this.state.totalWords;
            setTimeout(() => el.classList.remove('pulse'), 500);
        }
    },

    _updateDateTimeDisplay() {
        const el = this.elements.datetimeDisplay;
        if (!el) return;

        let hours, minutes, seconds, dateStr;

        if (this.serverHour !== null && this.serverTimeFetchedAt) {
            const elapsed  = Math.floor((Date.now() - this.serverTimeFetchedAt) / 1000);
            const totalSec = this.serverHour * 3600 + this.serverMinute * 60 + this.serverSecond + elapsed;
            hours   = String(Math.floor(totalSec / 3600) % 24).padStart(2, '0');
            minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
            seconds = String(totalSec % 60).padStart(2, '0');

            const [y, m, d] = (this.serverDate || this._localDateString()).split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            dateStr  = dt.toLocaleDateString('mr-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            const ist = this._getISTTime();
            hours    = String(ist.getHours()).padStart(2, '0');
            minutes  = String(ist.getMinutes()).padStart(2, '0');
            seconds  = String(ist.getSeconds()).padStart(2, '0');
            dateStr  = ist.toLocaleDateString('mr-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        el.textContent = `${dateStr}, ${hours}:${minutes}:${seconds} IST`;
    },

    _displayText(text) {
        if (this.elements.recognitionText) this.elements.recognitionText.textContent = text;
    },
});


// ======================================================================
// SECTION 7 — MANTRA WORD ANIMATION
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    _disappearMantraWords() {
        const words = document.querySelectorAll('.mantra-word');
        words.forEach(w => w.classList.add('disappearing'));
        setTimeout(() => words.forEach(w => w.classList.remove('disappearing')), 800);
    },

    _resetMantraDisplay() {
        document.querySelectorAll('.mantra-word')
            .forEach(w => w.classList.remove('completed', 'current', 'disappearing'));
    },

    _updateMantraDisplay() {
        document.querySelectorAll('.mantra-word')
            .forEach(w => w.classList.remove('current', 'completed', 'disappearing'));
    },
});


// ======================================================================
// SECTION 8 — CELEBRATIONS & NOTIFICATIONS
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    _feedbackSuccess() {
        this._flash('rgba(76,175,80,0.1)');
    },

    _feedbackWarning() {
        this._flash('rgba(255,152,0,0.1)');
    },

    _flash(color) {
        document.body.style.background = `radial-gradient(ellipse at center, ${color}, transparent)`;
        setTimeout(() => { document.body.style.background = ''; }, 200);
    },

    _celebrateMala() {
        this._showCelebration('🎉 एक माला पूर्ण झाली! 🎉', 'हरी बोला! आणखी एक मिळवली!');
        this._createConfetti();
    },

    _celebrateMilestone(malas) {
        const msgs = {
            10:   ['🎊 10 माला पूर्ण झाल्या! 🎊',   'उत्तम प्रगती!'],
            21:   ['✨ 21 माला पूर्ण झाल्या! ✨',   'अप्रतिम कार्य!'],
            51:   ['🌟 51 माला पूर्ण झाल्या! 🌟',   'तुमची लगबग अविश्वसनीय!'],
            108:  ['💫 108 माला पूर्ण झाल्या! 💫',  'शंभर आठ साधलेत!'],
            1008: ['🏆 1008 माला पूर्ण झाल्या! 🏆', 'हजार आठ साधलेत! अलौकिक!'],
        };
        const [msg, sub] = msgs[malas] || [];
        if (msg) { this._showCelebration(msg, sub, 5000); this._createConfetti(); }
    },

    _showCelebration(msg, sub = '', duration = 3000) {
        const el = this.elements.celebration;
        if (!el) return;
        el.innerHTML  = `<div class="celebration-text">${msg}</div>${sub ? `<div class="celebration-subtext">${sub}</div>` : ''}`;
        el.style.display = 'block';
        el.classList.add('show');
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => { el.style.display = 'none'; }, 500);
        }, duration);
    },

    _createConfetti() {
        const colors = ['#ff6b35', '#ffd700', '#4caf50', '#2196f3', '#9c27b0'];
        for (let i = 0; i < 20; i++) {
            const el = document.createElement('div');
            el.style.cssText = [
                'position:fixed', 'width:8px', 'height:8px', 'border-radius:50%',
                `background:${colors[Math.floor(Math.random() * colors.length)]}`,
                `left:${Math.random() * 100}%`, 'top:-10px',
                'pointer-events:none', 'z-index:9999', 'opacity:0.7',
                `animation:confetti-fall ${1.5 + Math.random()}s ease-out`,
            ].join(';');
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }
    },

    _showNotification(msg, type = 'info', duration = 3000) {
        const bg = {
            success: 'linear-gradient(135deg,#4caf50,#66bb6a)',
            error:   'linear-gradient(135deg,#f44336,#ef5350)',
            info:    'linear-gradient(135deg,#2196f3,#42a5f5)',
        };
        const el = document.createElement('div');
        el.style.cssText = [
            'position:fixed', 'top:20px', 'right:20px',
            'padding:12px 16px', `background:${bg[type] || bg.info}`,
            'color:white', 'border-radius:8px',
            'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
            'z-index:10000', 'animation:slide-in 0.3s ease-out',
            'font-size:0.9rem', 'max-width:300px', 'word-wrap:break-word',
        ].join(';');
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => el.remove(), 300);
        }, duration);
    },
});


// ======================================================================
// SECTION 9 — SESSION TIMEOUT
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    _startSessionTimeout() {
        this._resetSessionTimeout();
        console.log('⏰ Session timeout active (5 min)');
    },

    _resetSessionTimeout() {
        clearTimeout(this.sessionTimeout.timeoutId);
        clearTimeout(this.sessionTimeout.warningId);
        this.sessionTimeout.lastActivity    = Date.now();
        this.sessionTimeout.isWarningShown  = false;

        this.sessionTimeout.timeoutId = setTimeout(() => {
            this._showSessionWarning();
            this.sessionTimeout.warningId = setTimeout(() => {
                if (this.sessionTimeout.isWarningShown) this._forceLogout();
            }, this.sessionTimeout.responseWindow);
        }, this.sessionTimeout.duration);
    },

    _showSessionWarning() {
        if (this.sessionTimeout.isWarningShown) return;
        this.sessionTimeout.isWarningShown = true;

        const overlay = document.createElement('div');
        overlay.id = 'sessionWarningDialog';
        overlay.style.cssText = [
            'position:fixed', 'inset:0',
            'background:rgba(0,0,0,0.8)',
            'display:flex', 'justify-content:center', 'align-items:center',
            'z-index:10000', "font-family:'Noto Sans Devanagari',sans-serif",
        ].join(';');

        overlay.innerHTML = `
            <div style="background:white;padding:30px;border-radius:15px;
                        text-align:center;max-width:400px;
                        box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                <div style="font-size:24px;margin-bottom:15px;">⚠️</div>
                <h3 style="color:#f44336;margin-bottom:15px;">जप जारी रखना चाहते हैं?</h3>
                <p style="margin-bottom:20px;color:#666;">
                    आपने 5 मिनट से जप नहीं किया है।<br>
                    क्या आप जप जारी रखना चाहते हैं?
                </p>
                <button id="continueSessionBtn"
                    style="background:#4caf50;color:white;border:none;
                           padding:12px 24px;border-radius:8px;font-size:16px;
                           cursor:pointer;margin-right:10px;">
                    हाँ, जारी रखें
                </button>
                <button id="logoutNowBtn"
                    style="background:#f44336;color:white;border:none;
                           padding:12px 24px;border-radius:8px;font-size:16px;
                           cursor:pointer;">
                    नहीं, लॉगआउट
                </button>
            </div>`;

        document.body.appendChild(overlay);
        document.getElementById('continueSessionBtn').addEventListener('click', () => this._continueSession());
        document.getElementById('logoutNowBtn').addEventListener('click', () => this.logout());
    },

    _continueSession() {
        document.getElementById('sessionWarningDialog')?.remove();
        clearTimeout(this.sessionTimeout.warningId);
        this._resetSessionTimeout();
        this._showNotification('सत्र जारी रखा गया', 'success', 2000);
    },

    _forceLogout() {
        console.log('🚪 Force-logout: inactivity');
        document.getElementById('sessionWarningDialog')?.remove();
        this._showNotification('सत्र समाप्त हो गया', 'error', 2000);
        setTimeout(() => this.logout(), 1000);
    },

    _updateActivity() {
        this._resetSessionTimeout();
    },
});


// ======================================================================
// SECTION 10 — UTILITIES
// ======================================================================

Object.assign(GuruMantraCounter.prototype, {

    _calcTodayTotal() {
        if (this.state.todayWords > 0) return this.state.todayWords;
        // Fallback when todayWords not yet populated
        return (this.state.currentMalaPronunciations * this.config.wordsPerPronunciation) +
               (this.state.todayMalas * this.config.pronunciationsPerMala * this.config.wordsPerPronunciation);
    },

    _localDateString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _getISTTime() {
        const now     = new Date();
        const utcMs   = now.getTime() + now.getTimezoneOffset() * 60_000;
        const istMs   = utcMs + 5.5 * 3600_000;
        return new Date(istMs);
    },

    async _fetchServerTime() {
        try {
            const res  = await fetch('/guru-mantra/api/server_time', { method: 'GET', credentials: 'same-origin' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (data.success) {
                this.serverDate          = data.date;
                this.serverTime          = data.datetime;
                this.serverHour          = data.hour   != null ? parseInt(data.hour)   : null;
                this.serverMinute        = data.minute != null ? parseInt(data.minute) : null;
                this.serverSecond        = data.second != null ? parseInt(data.second) : null;
                this.serverTimeFetchedAt = Date.now();
                console.log('🕐 Server time:', data.date, `${this.serverHour}:${this.serverMinute}:${this.serverSecond}`);
                this._updateDateTimeDisplay();
                if (this.state.isInitialized) this._checkDateChange();
                return data.date;
            }
        } catch (err) {
            console.error('❌ Server time error:', err);
        }
        return this._localDateString();
    },

    _checkDateChange() {
        if (!this.serverDate) return;                          // Server date not loaded yet
        const current = this.serverDate;
        if (!this.state.todayDate) { this.state.todayDate = current; return; }
        if (this.state.todayDate === current) return;          // Same day — nothing to do

        console.log('📅 Date changed:', this.state.todayDate, '→', current);
        this._saveToServer(true);

        this.state.todayWords              = 0;
        this.state.todayPronunciations     = 0;
        this.state.todayMalas              = 0;
        this.state.currentMalaPronunciations = 0;
        this.state.todayDate               = current;
        this.state.todaysCount             = 0;

        this._showNotification('🌅 नया दिन! आज के जप शुरू करें', 'info', 3000);
        this._updateUI();
        this._saveToServer(true);
    },

    // ------------------------------------------------------------------
    // 10.1  LOGOUT
    // ------------------------------------------------------------------

    async logout() {
        console.log('👋 Logging out…');
        await this._saveToServer(true);

        if (this.state.isListening) this.stopListening();
        clearTimeout(this.sessionTimeout.timeoutId);
        clearTimeout(this.sessionTimeout.warningId);

        try {
            await fetch('/guru-mantra/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } catch { /* ignore */ }

        window.location.href = '/guru-mantra/auth';
    },
});


// ======================================================================
// SECTION 11 — GLOBAL STYLES
// ======================================================================

(function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slide-out {
            from { transform: translateX(0);    opacity: 1; }
            to   { transform: translateX(100%); opacity: 0; }
        }
        @keyframes confetti-fall {
            to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1);   }
            50%       { transform: scale(1.1); }
        }
        .pulse    { animation: pulse 0.5s ease-in-out; }
        .listening { color: #4caf50; }
        @media (max-width: 768px) { body { font-size: 14px; } }
    `;
    document.head.appendChild(style);
})();


// ======================================================================
// SECTION 12 — BOOT
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🙏 Starting Guru Mantra Counter…');
    window.guruMantraCounter = new GuruMantraCounter();
});


// ======================================================================
// SECTION 13 — DEBUG HELPERS  (open console → debugGMC())
// ======================================================================

window.debugGMC = function () {
    const app = window.guruMantraCounter;
    if (!app) { console.error('❌ guruMantraCounter not found'); return; }

    console.group('🔍 Guru Mantra Counter — Debug');
    console.log('State:',   app.state);
    console.log('Config:',  app.config);
    console.log('Metrics:', app.metrics);

    ['startBtn', 'stopBtn', 'manualBtn', 'resetBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) { console.error('❌ Button missing:', id); return; }
        const r   = btn.getBoundingClientRect();
        const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        console.log(id, {
            disabled:     btn.disabled,
            visible:      r.width > 0,
            covered:      mid !== btn && !btn.contains(mid),
            coveredBy:    mid?.tagName + (mid?.id ? '#' + mid.id : ''),
            pointerEvents: getComputedStyle(btn).pointerEvents,
        });
    });
    console.groupEnd();
};


// ======================================================================
// CommonJS export (tests only)
// ======================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuruMantraCounter;
}
