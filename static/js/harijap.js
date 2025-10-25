/**
 * =====================================================================
 * HARI JAP COUNTER APPLICATION - FIXED VERSION
 * =====================================================================
 * Voice-recognition based counter for chanting "जय जय राम कृष्णा हारी"
 * Features: Multi-repetition detection, instant feedback, milestone tracking
 * =====================================================================
 */

class HariJapCounter {
    constructor() {
        // ============================================================
        // STATE MANAGEMENT
        // ============================================================
        this.state = {
            // Counting state - Total (lifetime)
            totalWords: 0,
            totalPronunciations: 0,
            totalMalas: 0,
            
            // Today's counting state
            todayWords: 0,
            todayPronunciations: 0,
            todayMalas: 0,
            todayDate: this.getTodayDateString(),
            
            // Current session state
            currentMalaPronunciations: 0,
            sessionStartTime: Date.now(),

            // Application state
            isInitialized: false,
            isListening: false,
            isSaving: false,

            // User state
            userName: '',
            userId: null,

            // Recognition state
            lastRecognitionTime: 0
        };

        // ============================================================
        // CONFIGURATION
        // ============================================================
        this.config = {
            // Mantra configuration
            wordsPerPronunciation: 5,
            pronunciationsPerMala: 108,

            // Recognition settings
            recognitionLang: 'hi-IN',
            minTimeBetweenCounts: 800,

            // Auto-save settings
            autoSaveInterval: 10000,
            syncInterval: 30000,

            // Target phrases for recognition
            targetPhrases: [
                'जय जय राम कृष्णा हारी',
                'जय जय राम कृष्ण हारी',
                'जय जय राम कृष्णा हरी',
                'जय जय राम कृष्णो हारी',
                'jai jai ram krishna hari',
                'jai jai ram krishna haari',
                'jai jai ram krishna hare',
                'jai jai ram krishna harry'
            ],

            // Milestone celebrations
            milestones: [10, 21, 51, 108, 1008]
        };

        // ============================================================
        // PERFORMANCE METRICS
        // ============================================================
        this.metrics = {
            recognitionSuccesses: 0,
            recognitionAttempts: 0,
            totalSessionTime: 0
        };

        // ============================================================
        // DOM ELEMENTS CACHE
        // ============================================================
        this.elements = {};

        // ============================================================
        // SPEECH RECOGNITION
        // ============================================================
        this.recognition = null;

        // Start initialization
        this.init();
    }

    // ================================================================
    // INITIALIZATION METHODS
    // ================================================================

    async init() {
        try {
            console.log('🙏 Initializing Hari Jap Counter...');

            await this.authenticateUser();
            await this.getServerTime(); // Get server time for date calculations
            this.cacheElements();
            this.initializeSpeechRecognition();
            this.attachEventListeners();
            await this.loadStateFromServer();
            this.startAutoProcesses();

            this.state.isInitialized = true;
            this.updateUI();
            this.showNotification('🙏 स्वागत आहे! जपाची तयारी झाली', 'success');

            console.log('✅ Initialization complete');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.handleInitError(error);
        }
    }

    async authenticateUser() {
        try {
            const response = await fetch('/harijap/auth/check_session', {
                method: 'GET',
                credentials: 'same-origin'
            });

            const authData = await response.json();

            if (!authData.authenticated) {
                window.location.href = '/harijap/auth';
                throw new Error('Not authenticated');
            }

            this.state.userName = authData.user_name || 'साधक';
            this.state.userId = authData.user_id;

            console.log('✅ Authenticated as: ' + this.state.userName);
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            throw error;
        }
    }

    cacheElements() {
        const elementIds = [
            'countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration', 'userName',
            'logoutBtn', 'sessionTime', 'todayCount', 'accuracy'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn('⚠️ Element not found: ' + id);
            }
        });

        // Cache the new full jap element
        const fullJapElement = document.getElementById('fullJapCount');
        if (fullJapElement) {
            this.elements.fullJapCount = fullJapElement;
        } else {
            console.warn('⚠️ Element not found: fullJapCount');
        }

        if (this.elements.userName && this.state.userName) {
            this.elements.userName.textContent = '🙏 ' + this.state.userName;
        }

        console.log('✅ Cached ' + Object.keys(this.elements).length + ' DOM elements');
    }

    initializeSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition ||
                                     window.webkitSpeechRecognition ||
                                     window.mozSpeechRecognition ||
                                     window.msSpeechRecognition;

            if (!SpeechRecognition) {
                throw new Error('Speech Recognition not supported');
            }

            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.recognitionLang;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 5;
            this.recognition.continuous = true;

            // Mobile optimization
            const isMobile = this.isMobileDevice();
            if (isMobile) {
                this.recognition.continuous = false;
                console.log('📱 Mobile device detected - optimized recognition');
            }

            // Attach recognition event handlers
            this.recognition.onresult = (e) => this.onRecognitionResult(e);
            this.recognition.onend = () => this.onRecognitionEnd();
            this.recognition.onerror = (e) => this.onRecognitionError(e);
            this.recognition.onstart = () => {
                console.log('🎤 Recognition started');
                this.state.isListening = true;
                this.updateUI();
            };

            console.log('✅ Speech Recognition initialized');
        } catch (error) {
            console.error('❌ Speech Recognition initialization failed:', error);
            this.showNotification('आवाज ओळख उपलब्ध नाही', 'error');
            this.recognition = null;
        }
    }

    attachEventListeners() {
        // Button listeners
        this.addListener('startBtn', 'click', () => this.startListening());
        this.addListener('stopBtn', 'click', () => this.stopListening());
        this.addListener('manualBtn', 'click', () => this.addManualCount());
        this.addListener('resetBtn', 'click', () => this.confirmReset());
        this.addListener('logoutBtn', 'click', () => this.logout());

        // Page visibility and unload
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isListening) {
                this.stopListening();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveToServer(true);
        });

        console.log('✅ Event listeners attached');
    }

    addListener(elementId, event, handler) {
        if (this.elements[elementId]) {
            this.elements[elementId].addEventListener(event, handler);
        }
    }

    startAutoProcesses() {
        // Auto-save
        setInterval(() => {
            if (!this.state.isSaving) {
                this.saveToServer();
            }
        }, this.config.autoSaveInterval);

        // Server sync
        setInterval(() => {
            this.loadStateFromServer();
        }, this.config.syncInterval);

        // Server time sync (every 5 minutes)
        setInterval(() => {
            this.getServerTime();
        }, 5 * 60 * 1000);

        // Check for date change (every minute)
        setInterval(() => {
            this.checkForDateChange();
        }, 60 * 1000);

        console.log('✅ Auto-save, sync, and time sync started');
    }

    handleInitError(error) {
        this.showNotification('प्रारंभ करता आले नाही', 'error');
        if (error.message === 'Not authenticated') {
            setTimeout(() => {
                window.location.href = '/harijap/auth';
            }, 2000);
        }
    }

    // ================================================================
    // SPEECH RECOGNITION HANDLERS
    // ================================================================

    async startListening() {
        if (!this.recognition) {
            this.showNotification('आवाज ओळख उपलब्ध नाही', 'error');
            return;
        }

        // Request microphone permission explicitly
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately after getting permission
        } catch (permError) {
            console.error('❌ Microphone permission denied:', permError);
            this.showNotification('मायक्रोफोन ची परवानगी नाही', 'error');
            return;
        }

        if (!this.state.isListening) {
            try {
                this.recognition.start();
                this.state.isListening = true;
                this.updateUI();
                console.log('🎤 Listening started');
            } catch (error) {
                console.error('❌ Start listening error:', error);
                if (error.message && error.message.includes('already started')) {
                    this.state.isListening = true;
                    this.updateUI();
                } else {
                    this.showNotification('सुरुवात करता आली नाही', 'error');
                }
            }
        }
    }

    stopListening() {
        if (this.state.isListening && this.recognition) {
            try {
                this.recognition.stop();
                this.state.isListening = false;
                this.updateUI();
                console.log('⏸️ Listening stopped');
            } catch (error) {
                console.error('❌ Stop listening error:', error);
                this.state.isListening = false;
                this.updateUI();
            }
        }
    }

    onRecognitionResult(event) {
        const now = Date.now();
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (!lastResult.isFinal) return;

        let matchCount = 0;
        let bestTranscript = '';

        // Check all alternatives
        for (let i = 0; i < lastResult.length; i++) {
            const transcript = lastResult[i].transcript;
            const confidence = lastResult[i].confidence;

            if (i === 0) bestTranscript = transcript;

            console.log('🎤 Alt ' + (i + 1) + ': "' + transcript + '" (' + (confidence * 100).toFixed(1) + '%)');

            const count = this.countMantraRepetitions(transcript);
            if (count > 0) {
                matchCount = count;
                bestTranscript = transcript;
                console.log('✅ MATCH: ' + count + ' repetitions in alt ' + (i + 1));
                break;
            }
        }

        this.displayRecognizedText(bestTranscript);
        this.metrics.recognitionAttempts++;

        if (matchCount > 0) {
            this.handleSuccessfulRecognition(matchCount, now);
        } else if (bestTranscript.trim().length > 0) {
            this.handleInvalidSpeech();
        }
    }

    onRecognitionEnd() {
        console.log('🔚 Recognition ended');

        if (this.isMobileDevice() &&
            this.state.isInitialized &&
            !document.hidden &&
            this.state.isListening) {

            setTimeout(() => {
                if (this.state.isListening) {
                    try {
                        this.recognition.start();
                        console.log('🔄 Auto-restarting recognition (mobile)');
                    } catch (error) {
                        console.error('❌ Auto-restart failed:', error);
                        this.state.isListening = false;
                        this.updateUI();
                    }
                }
            }, 500);
        } else {
            this.state.isListening = false;
            this.updateUI();
        }
    }

    onRecognitionError(event) {
        console.error('❌ Recognition error:', event.error);
        this.state.isListening = false;

        const errorMessages = {
            'no-speech': 'कोणी बोलत नाही असे वाटते',
            'audio-capture': 'मायक्रोफोन उपलब्ध नाही आहे',
            'not-allowed': 'मायक्रोफोन ची परवानगी नाही',
            'network': 'नेटवर्क समस्या'
        };

        if (event.error !== 'aborted' && errorMessages[event.error]) {
            this.showNotification(errorMessages[event.error], 'error');
        }

        this.updateUI();
    }

    handleSuccessfulRecognition(count, timestamp) {
        // Prevent too-rapid duplicates
        if (timestamp - this.state.lastRecognitionTime < this.config.minTimeBetweenCounts) {
            console.log('⏭️ Too rapid - skipping');
            return;
        }

        this.metrics.recognitionSuccesses++;
        this.state.lastRecognitionTime = timestamp;

        // Add counts for all repetitions - each repetition counts as 5 words
        for (let i = 0; i < count; i++) {
            this.incrementCounter();
        }

        // Show appropriate notification with word count
        const totalWordsAdded = count * this.config.wordsPerPronunciation;
        if (count === 1) {
            this.showNotification('✅ ' + this.config.wordsPerPronunciation + ' शब्द गणना झाले!', 'success', 800);
        } else {
            this.showNotification('✅ ' + count + ' वेळा (' + totalWordsAdded + ' शब्द) गणना झाले!', 'success', 1000);
        }

        this.triggerSuccessFeedback();
    }

    handleInvalidSpeech() {
        this.showNotification('⚠️ कृपया मंत्राव्यतिरिक्त दुसरे काही म्हणू नका', 'error', 2000);
        this.triggerWarningFeedback();
    }

    // ================================================================
    // MANTRA DETECTION LOGIC
    // ================================================================

    countMantraRepetitions(text) {
        const normalized = this.normalizeText(text);
        let maxCount = 0;

        // Clean the text to remove unwanted words like "Shri", "Shree", etc.
        const cleanedText = this.cleanMantraText(normalized);
        
        // Try each target phrase pattern
        for (let pattern of this.config.targetPhrases) {
            const patternLower = pattern.toLowerCase();
            let count = 0;
            let searchText = cleanedText;

            // Count occurrences with better boundary detection
            while (searchText.includes(patternLower)) {
                const index = searchText.indexOf(patternLower);
                
                // Check if it's a complete word match (not part of another word)
                const beforeChar = index > 0 ? searchText.charAt(index - 1) : ' ';
                const afterIndex = index + patternLower.length;
                const afterChar = afterIndex < searchText.length ? searchText.charAt(afterIndex) : ' ';
                
                // Only count if surrounded by word boundaries
                if ((beforeChar === ' ' || beforeChar === '।' || beforeChar === '.') && 
                    (afterChar === ' ' || afterChar === '।' || afterChar === '.' || afterChar === '')) {
                    count++;
                }
                
                // Move past this occurrence
                searchText = searchText.substring(index + patternLower.length);
            }

            if (count > maxCount) {
                maxCount = count;
            }
        }

        // If no exact matches, try fuzzy matching for single phrase
        if (maxCount === 0 && this.isMantraPhrase(text)) {
            return 1;
        }

        return maxCount;
    }

    isMantraPhrase(text) {
        const normalized = this.normalizeText(text);
        const cleanedText = this.cleanMantraText(normalized);

        // Exact match with cleaned text
        for (let phrase of this.config.targetPhrases) {
            if (cleanedText === phrase.toLowerCase()) {
                console.log('✓ Exact: "' + phrase + '"');
                return true;
            }
        }

        // Contains match with cleaned text
        for (let phrase of this.config.targetPhrases) {
            if (cleanedText.includes(phrase.toLowerCase())) {
                console.log('✓ Contains: "' + phrase + '"');
                return true;
            }
        }

        // Fuzzy match with cleaned text
        for (let phrase of this.config.targetPhrases) {
            if (this.fuzzyMatch(cleanedText, phrase.toLowerCase())) {
                console.log('✓ Fuzzy: "' + phrase + '"');
                return true;
            }
        }

        console.log('✗ No match: "' + text + '" (cleaned: "' + cleanedText + '")');
        return false;
    }

    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[।,\.\!]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    cleanMantraText(text) {
        // Remove unwanted words that might interfere with mantra recognition
        const unwantedWords = [
            'shri', 'shree', 'श्री', 'श्री', 'sri', 'sree',
            'om', 'ओम', 'aum', 'औम',
            'namah', 'नमः', 'namo', 'नमो',
            'swami', 'स्वामी', 'guruji', 'गुरुजी',
            'baba', 'बाबा', 'sadguru', 'सद्गुरु'
        ];
        
        let cleanedText = text;
        
        // Remove unwanted words with word boundaries
        unwantedWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleanedText = cleanedText.replace(regex, '');
        });
        
        // Clean up extra spaces
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
        
        return cleanedText;
    }

    fuzzyMatch(text, target) {
        const distance = this.levenshteinDistance(text, target);
        const wordMatch = text.split(' ').length === target.split(' ').length;
        return wordMatch && distance <= 2;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // ================================================================
    // COUNTING LOGIC
    // ================================================================

    incrementCounter() {
        // Check if it's a new day and reset today's count if needed
        const currentDate = this.getTodayDateString();
        if (this.state.todayDate !== currentDate) {
            console.log('📅 New day detected! Resetting today\'s count. Old date:', this.state.todayDate, 'New date:', currentDate);
            this.state.todayWords = 0;
            this.state.todayPronunciations = 0;
            this.state.todayMalas = 0;
            this.state.todayDate = currentDate;
            
            // Show notification about new day
            this.showNotification('🌅 नया दिन! आज के जप शुरू करें', 'info', 3000);
        }

        // Increment both total and today's counts
        this.state.totalWords += this.config.wordsPerPronunciation;
        this.state.totalPronunciations++;
        this.state.todayWords += this.config.wordsPerPronunciation;
        this.state.todayPronunciations++;
        this.state.currentMalaPronunciations++;

        console.log('📊 Total: Words=' + this.state.totalWords + ', Today: Words=' + this.state.todayWords + ', Pronunciations=' + this.state.totalPronunciations + ', Current=' + this.state.currentMalaPronunciations);

        // Check for mala completion
        if (this.state.currentMalaPronunciations >= this.config.pronunciationsPerMala) {
            this.state.currentMalaPronunciations = 0;
            this.state.totalMalas++;
            this.state.todayMalas++;
            setTimeout(() => this.completeMala(), 100);
        }

        this.updateUI();
        this.saveToServer();
    }

    completeMala() {
        console.log('🎉 Mala completed! Total: ' + this.state.totalMalas + ', Today: ' + this.state.todayMalas);

        this.triggerMalaCelebration();
        this.checkMilestones();
        this.updateUI();
    }

    checkMilestones() {
        if (this.config.milestones.includes(this.state.totalMalas)) {
            this.triggerMilestoneCelebration(this.state.totalMalas);
        }
    }

    addManualCount() {
        this.incrementCounter();
        this.showNotification('➕ व्यक्तिशः काउंट जोडले गेले', 'success', 1000);
        this.triggerSuccessFeedback();
    }

    confirmReset() {
        if (confirm('खात्री आहे काय? आज के जप रिसेट होईल (कुल जप सुरक्षित रहेगा)')) {
            this.resetCounter();
        }
    }

    resetCounter() {
        // Only reset today's counts, preserve total counts
        this.state.todayWords = 0;
        this.state.todayPronunciations = 0;
        this.state.todayMalas = 0;
        this.state.currentMalaPronunciations = 0;

        this.updateUI();
        this.saveToServer(true);
        this.showNotification('आज के जप रिसेट झाले (कुल जप सुरक्षित)', 'info');

        console.log('🔄 Today\'s counter reset (total preserved)');
    }

    // ================================================================
    // DATA PERSISTENCE
    // ================================================================

    async loadStateFromServer() {
        try {
            console.log('📥 Loading state from server...');

            const response = await fetch('/harijap/api/state', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();

            if (data.success) {
                this.state.totalWords = data.count || 0;
                this.state.totalMalas = data.total_malas || 0;
                this.state.currentMalaPronunciations = data.current_mala_pronunciations || 0;
                this.state.totalPronunciations = data.total_pronunciations || 0;
                
                // Load today's data
                this.state.todayWords = data.today_words || 0;
                this.state.todayPronunciations = data.today_pronunciations || 0;
                this.state.todayMalas = data.today_malas || 0;
                this.state.todayDate = data.today_date || this.getTodayDateString();

                console.log('✅ State loaded:', {
                    totalWords: this.state.totalWords,
                    totalPronunciations: this.state.totalPronunciations,
                    currentMalaPronunciations: this.state.currentMalaPronunciations,
                    totalMalas: this.state.totalMalas,
                    todayWords: this.state.todayWords,
                    todayPronunciations: this.state.todayPronunciations,
                    todayMalas: this.state.todayMalas
                });
            }
        } catch (error) {
            console.error('❌ Error loading from server:', error);
            this.showNotification('डेटा लोड करता आला नाही', 'error');
        }
    }

    async saveToServer(immediate = false) {
        if (this.state.isSaving && !immediate) {
            console.log('⏭️ Save in progress, skipping...');
            return;
        }

        this.state.isSaving = true;

        try {
            const payload = {
                count: this.state.totalWords,
                totalMalas: this.state.totalMalas,
                currentMalaPronunciations: this.state.currentMalaPronunciations,
                totalPronunciations: this.state.totalPronunciations,
                todayWords: this.state.todayWords,
                todayPronunciations: this.state.todayPronunciations,
                todayMalas: this.state.todayMalas,
                todayDate: this.state.todayDate
            };

            console.log('💾 Saving to server:', payload);

            const response = await fetch('/harijap/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('✅ Saved successfully');
            } else {
                console.error('❌ Save failed:', response.status);
                if (!immediate) {
                    this.showNotification('सेव्ह करता आले नाही', 'error');
                }
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            if (!immediate) {
                this.showNotification('सर्वर शी कनेक्ट करता आले नाही', 'error');
            }
        } finally {
            this.state.isSaving = false;
        }
    }

    // ================================================================
    // UI UPDATE METHODS
    // ================================================================

    updateUI() {
        this.updateCountDisplay();
        this.updateMalaStatus();
        this.updateProgress();
        this.updateListeningStatus();
        this.updateButtons();
        this.updateSessionStats();
        this.updateFullJapDisplay();
    }

    updateCountDisplay() {
        if (this.elements.countDisplay) {
            const current = parseInt(this.elements.countDisplay.textContent) || 0;
            if (current !== this.state.totalWords) {
                this.elements.countDisplay.classList.add('pulse');
                this.elements.countDisplay.textContent = this.state.totalWords;
                setTimeout(() => {
                    this.elements.countDisplay.classList.remove('pulse');
                }, 500);
            }
        }
    }

    updateMalaStatus() {
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = 'कुल माला: ' + this.state.totalMalas + ' | आज: ' + this.state.todayMalas;
        }

        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent =
                'वर्तमान माला: ' + this.state.currentMalaPronunciations + ' / ' + this.config.pronunciationsPerMala;
        }

        if (this.elements.remainingCount) {
            const remaining = this.config.pronunciationsPerMala - this.state.currentMalaPronunciations;
            this.elements.remainingCount.textContent = 'शेष: ' + remaining + ' वार';
        }
    }

    updateProgress() {
        if (this.elements.progressFill) {
            const progress = (this.state.currentMalaPronunciations / this.config.pronunciationsPerMala) * 100;
            this.elements.progressFill.style.width = Math.min(progress, 100) + '%';
        }
    }

    updateListeningStatus() {
        if (this.elements.listeningStatus) {
            if (this.state.isListening) {
                this.elements.listeningStatus.textContent = '🎤 ऐकत आहे...';
                this.elements.listeningStatus.classList.add('listening');
            } else {
                this.elements.listeningStatus.textContent = '⏸️ थांबलेले आहे';
                this.elements.listeningStatus.classList.remove('listening');
            }
        }
    }

    updateButtons() {
        if (this.elements.startBtn && this.elements.stopBtn) {
            this.elements.startBtn.disabled = this.state.isListening;
            this.elements.stopBtn.disabled = !this.state.isListening;

            if (this.state.isListening) {
                this.elements.startBtn.classList.add('active');
            } else {
                this.elements.startBtn.classList.remove('active');
            }
        }
    }

    updateSessionStats() {
        if (this.elements.sessionTime) {
            const minutes = Math.floor((Date.now() - this.state.sessionStartTime) / 60000);
            this.elements.sessionTime.textContent = minutes + ' मिनट';
        }

        if (this.elements.todayCount) {
            this.elements.todayCount.textContent = this.state.todayWords;
        }

        if (this.elements.accuracy && this.metrics.recognitionAttempts > 0) {
            const accuracy = Math.round(
                (this.metrics.recognitionSuccesses / this.metrics.recognitionAttempts) * 100
            );
            this.elements.accuracy.textContent = accuracy + '%';
        }
    }

    displayRecognizedText(text) {
        if (this.elements.recognitionText) {
            this.elements.recognitionText.textContent = text;
        }
    }

    updateFullJapDisplay() {
        if (this.elements.fullJapCount) {
            const current = parseInt(this.elements.fullJapCount.textContent) || 0;
            if (current !== this.state.totalWords) {
                this.elements.fullJapCount.classList.add('pulse');
                this.elements.fullJapCount.textContent = this.state.totalWords;
                setTimeout(() => {
                    this.elements.fullJapCount.classList.remove('pulse');
                }, 500);
            }
        }
    }

    // ================================================================
    // VISUAL FEEDBACK & CELEBRATIONS
    // ================================================================

    triggerSuccessFeedback() {
        this.flashBackground('rgba(76, 175, 80, 0.3)', 400);
    }

    triggerWarningFeedback() {
        this.flashBackground('rgba(255, 152, 0, 0.3)', 400);
    }

    flashBackground(color, duration) {
        document.body.style.background = 'radial-gradient(ellipse at center, ' + color + ', transparent)';
        setTimeout(() => {
            document.body.style.background = '';
        }, duration);
    }

    triggerMalaCelebration() {
        this.showCelebration('🎉 एक माला पूर्ण झाली! 🎉', 'हरी बोला! आणखी एक मिळवली!');
        this.createConfetti();
    }

    triggerMilestoneCelebration(malas) {
        const messages = {
            10: ['🎊 10 माला पूर्ण झाल्या! 🎊', 'उत्तम प्रगती!'],
            21: ['✨ 21 माला पूर्ण झाल्या! ✨', 'अप्रतिम कार्य!'],
            51: ['🌟 51 माला पूर्ण झाल्या! 🌟', 'तुमची लगबग अविश्वसनीय!'],
            108: ['💫 108 माला पूर्ण झाल्या! 💫', 'शंभर आठ साधलेत!'],
            1008: ['🏆 1008 माला पूर्ण झाल्या! 🏆', 'हजार आठ साधलेत! अलौकिक!']
        };

        const [message, subMessage] = messages[malas] || ['', ''];
        if (message) {
            this.showCelebration(message, subMessage, 5000);
            this.createConfetti();
        }
    }

    showCelebration(message, subMessage = '', duration = 3000) {
        if (!this.elements.celebration) return;

        this.elements.celebration.innerHTML = 
            '<div class="celebration-text">' + message + '</div>' +
            (subMessage ? '<div class="celebration-subtext">' + subMessage + '</div>' : '');

        this.elements.celebration.style.display = 'block';
        this.elements.celebration.classList.add('show');

        setTimeout(() => {
            this.elements.celebration.classList.remove('show');
            setTimeout(() => {
                this.elements.celebration.style.display = 'none';
            }, 500);
        }, duration);
    }

    createConfetti() {
        const colors = ['#ff6b35', '#ffd700', '#4caf50', '#2196f3', '#9c27b0'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = 
                'position: fixed;' +
                'width: 10px;' +
                'height: 10px;' +
                'background: ' + colors[Math.floor(Math.random() * colors.length)] + ';' +
                'left: ' + (Math.random() * 100) + '%;' +
                'top: -10px;' +
                'border-radius: 50%;' +
                'pointer-events: none;' +
                'z-index: 9999;' +
                'animation: confetti-fall ' + (2 + Math.random() * 2) + 's ease-out;';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');

        const bgColors = {
            success: 'linear-gradient(135deg, #4caf50, #66bb6a)',
            error: 'linear-gradient(135deg, #f44336, #ef5350)',
            info: 'linear-gradient(135deg, #2196f3, #42a5f5)'
        };

        notification.style.cssText = 
            'position: fixed;' +
            'top: 20px;' +
            'right: 20px;' +
            'padding: 12px 16px;' +
            'background: ' + (bgColors[type] || bgColors.info) + ';' +
            'color: white;' +
            'border-radius: 8px;' +
            'box-shadow: 0 4px 20px rgba(0,0,0,0.3);' +
            'z-index: 10000;' +
            'animation: slide-in 0.3s ease-out;' +
            'font-size: 0.9rem;' +
            'max-width: 300px;' +
            'word-wrap: break-word;';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    getTodayDateString() {
        // Use cached server date if available, otherwise fallback to local time
        if (this.serverDate) {
            return this.serverDate;
        }
        
        // Fallback to local time if server date not available
        const today = new Date();
        return today.getFullYear() + '-' + 
               String(today.getMonth() + 1).padStart(2, '0') + '-' + 
               String(today.getDate()).padStart(2, '0');
    }

    async getServerTime() {
        try {
            const response = await fetch('/harijap/api/server_time', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.serverDate = data.date;
                    console.log('🕐 Server time loaded:', data.date);
                    return data.date;
                }
            }
        } catch (error) {
            console.error('❌ Error getting server time:', error);
        }
        
        // Fallback to local time
        const today = new Date();
        return today.getFullYear() + '-' + 
               String(today.getMonth() + 1).padStart(2, '0') + '-' + 
               String(today.getDate()).padStart(2, '0');
    }

    checkForDateChange() {
        const currentDate = this.getTodayDateString();
        if (this.state.todayDate !== currentDate) {
            console.log('📅 Date change detected! Resetting today\'s count. Old date:', this.state.todayDate, 'New date:', currentDate);
            this.state.todayWords = 0;
            this.state.todayPronunciations = 0;
            this.state.todayMalas = 0;
            this.state.todayDate = currentDate;
            
            // Show notification about new day
            this.showNotification('🌅 नया दिन! आज के जप शुरू करें', 'info', 3000);
            
            // Update UI and save
            this.updateUI();
            this.saveToServer();
        }
    }

    isMobileDevice() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    // ================================================================
    // USER ACTIONS
    // ================================================================

    async logout() {
        try {
            console.log('👋 Logging out...');
            await this.saveToServer(true);

            await fetch('/harijap/auth/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });

            window.location.href = '/harijap/auth';
        } catch (error) {
            console.error('❌ Logout error:', error);
            window.location.href = '/harijap/auth';
        }
    }
}

// ====================================================================
// GLOBAL STYLES
// ====================================================================

const style = document.createElement('style');
style.textContent = `
    /* Animations */
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }

    /* Utility classes */
    .pulse {
        animation: pulse 0.5s ease-in-out;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        body {
            font-size: 14px;
        }
    }
`;
document.head.appendChild(style);

// ====================================================================
// APPLICATION INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🙏 Initializing Hari Jap Counter Application');
    window.hariJapCounter = new HariJapCounter();
});

// ====================================================================
// EXPORT FOR TESTING (optional)
// ====================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HariJapCounter;
}
