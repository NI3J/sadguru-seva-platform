/**
 * 🕉️ हरि जप साधना - Voice-based Jap Counter (Fixed Version)
 * 1 pronunciation of "जय जय राम कृष्णा हारी" = 1 jap count
 * 1 mala = 108 japs
 * Total count shows: japs × 5 (since each jap has 5 words)
 * Total for 108 malas = 108 × 108 × 5 = 58,320 words
 */

class HariJapCounter {
    constructor() {
        // Core properties - Fixed Logic
        this.japCount = 0;           // Total jap pronunciations
        this.totalMalas = 0;         // Total malas completed (108 japs each)
        this.currentMalaJaps = 0;    // Japs in current mala (0-108)
        this.isListening = false;
        this.recognition = null;
        this.targetPhrase = 'जय जय राम कृष्णा हारी';
        
        // Configuration
        this.config = {
            wordsPerJap: 5,              // Each jap = 5 words (for display only)
            japsPerMala: 108,            // 108 japs = 1 mala
            totalMalasTarget: 108,       // Target: 108 malas
            recognitionLang: 'hi-IN',
            fallbackLang: 'en-US',
            similarityThreshold: 0.6,
            celebrationDuration: 3000,
            pulseAnimationDuration: 300,
            autoSaveInterval: 5000,
            sessionCheckInterval: 30000,
            recognitionCooldown: 2000,   // 2 seconds cooldown
            autoRestart: true,
            maxRecognitionAttempts: 10   // Maximum restart attempts
        };
        
        // DOM elements
        this.elements = {};
        
        // State management
        this.state = {
            isInitialized: false,
            isSaving: false,
            autoSaveTimer: null,
            sessionCheckTimer: null,
            lastRecognizedTime: 0,
            isProcessing: false,
            recognitionAttempts: 0,
            restartTimeout: null
        };
        
        // Initialize the application
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            this.initializeElements();
            this.initializeSpeechRecognition();
            this.setupEventListeners();
            await this.loadSavedData();
            this.updateDisplay();
            this.startAutoSave();
            this.startSessionMonitoring();
            this.state.isInitialized = true;
            this.logActivity('HARI_JAP_INITIALIZED');
        } catch (error) {
            console.error('Error initializing Hari Jap Counter:', error);
            this.showError('प्रारंभिकरण में त्रुटि। पृष्ठ को पुनः लोड करें।');
        }
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        const elementIds = [
            'countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                console.warn(`Element with id '${id}' not found`);
            }
        });
    }
    
    /**
     * Initialize speech recognition
     */
    initializeSpeechRecognition() {
        if (!this.isSpeechRecognitionSupported()) {
            this.handleSpeechRecognitionUnavailable();
            return;
        }
        
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.setupRecognitionProperties();
            this.setupRecognitionEventHandlers();
            
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            this.handleSpeechRecognitionError('initialization_failed');
        }
    }
    
    /**
     * Check if speech recognition is supported
     */
    isSpeechRecognitionSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    /**
     * Setup recognition properties
     */
    setupRecognitionProperties() {
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = this.config.recognitionLang;
        this.recognition.maxAlternatives = 3;
    }
    
    /**
     * Setup recognition event handlers
     */
    setupRecognitionEventHandlers() {
        this.recognition.onstart = () => this.handleRecognitionStart();
        this.recognition.onend = () => this.handleRecognitionEnd();
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onnomatch = () => this.handleRecognitionNoMatch();
    }
    
    /**
     * Handle recognition start
     */
    handleRecognitionStart() {
        this.isListening = true;
        this.state.recognitionAttempts = 0; // Reset attempts on successful start
        this.updateListeningStatus('🎤 सुन रहा हूँ... (कृपया स्पष्ट बोलें)', true);
        this.toggleButtons(true);
        this.logActivity('SPEECH_RECOGNITION_STARTED');
    }
    
    /**
     * Handle recognition end
     */
    handleRecognitionEnd() {
        this.isListening = false;
        this.updateListeningStatus('माइक्रोफोन बंद है', false);
        this.toggleButtons(false);
        
        // Auto-restart with attempt limit
        if (this.config.autoRestart && this.state.recognitionAttempts < this.config.maxRecognitionAttempts) {
            this.state.restartTimeout = setTimeout(() => {
                if (!this.isListening && this.elements.startBtn && !this.elements.startBtn.disabled) {
                    console.log(`Auto-restarting recognition... (attempt ${this.state.recognitionAttempts + 1})`);
                    this.state.recognitionAttempts++;
                    this.startListening();
                }
            }, 1000);
        } else if (this.state.recognitionAttempts >= this.config.maxRecognitionAttempts) {
            this.updateListeningStatus('माइक्रोफोन सेवा रुक गई। मैन्युअल रूप से दोबारा शुरू करें।', false);
            this.config.autoRestart = false;
        }
        
        this.logActivity('SPEECH_RECOGNITION_ENDED', { attempts: this.state.recognitionAttempts });
    }
    
    /**
     * Handle recognition result
     */
    handleRecognitionResult(event) {
        // Prevent processing if already processing
        if (this.state.isProcessing) {
            console.log('⏳ Already processing, skipping...');
            return;
        }
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            
            if (result.isFinal) {
                // Check all alternatives
                for (let j = 0; j < result.length && j < 3; j++) {
                    const transcript = result[j].transcript;
                    const confidence = result[j].confidence || 0;
                    
                    this.logActivity('SPEECH_RESULT', { 
                        transcript: transcript.substring(0, 50) + '...', 
                        confidence: confidence.toFixed(2),
                        alternative: j
                    });
                    
                    // Process the transcript
                    if (this.checkForTargetPhrase(transcript)) {
                        break; // Stop checking alternatives if match found
                    }
                }
            }
        }
    }
    
    /**
     * Handle recognition error
     */
    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        
        // Don't show error for aborted (happens during restart)
        if (event.error !== 'aborted') {
            this.updateListeningStatus('त्रुटि: ' + event.error, false);
        }
        
        if (event.error === 'language-not-supported') {
            this.handleLanguageNotSupported();
        } else if (event.error === 'no-speech') {
            // Auto-restart on no-speech error with attempt limit
            if (this.config.autoRestart && this.state.recognitionAttempts < this.config.maxRecognitionAttempts) {
                this.state.restartTimeout = setTimeout(() => {
                    if (!this.isListening) {
                        this.state.recognitionAttempts++;
                        this.startListening();
                    }
                }, 1500);
            }
        }
        
        this.isListening = false;
        this.toggleButtons(false);
        this.logActivity('SPEECH_RECOGNITION_ERROR', { error: event.error });
    }
    
    /**
     * Handle language not supported error
     */
    handleLanguageNotSupported() {
        console.log('🔄 Trying English language...');
        this.recognition.lang = this.config.fallbackLang;
        this.state.restartTimeout = setTimeout(() => {
            if (!this.isListening) {
                this.startListening();
            }
        }, 1000);
    }
    
    /**
     * Handle recognition no match
     */
    handleRecognitionNoMatch() {
        this.updateRecognitionText('कुछ समझ नहीं आया, फिर कोशिश करें');
    }
    
    /**
     * Handle speech recognition unavailable
     */
    handleSpeechRecognitionUnavailable() {
        this.updateListeningStatus('Speech Recognition उपलब्ध नहीं है', false);
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = true;
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.setupButtonEventListeners();
        this.setupKeyboardEventListeners();
        this.setupWindowEventListeners();
    }
    
    /**
     * Setup button event listeners
     */
    setupButtonEventListeners() {
        const buttonHandlers = {
            startBtn: () => this.startListening(),
            stopBtn: () => this.stopListening(),
            manualBtn: () => this.incrementJapCount(),
            resetBtn: () => this.resetCounter()
        };
        
        Object.entries(buttonHandlers).forEach(([buttonId, handler]) => {
            if (this.elements[buttonId]) {
                this.elements[buttonId].addEventListener('click', handler);
            }
        });
    }
    
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.state.isSaving) return;
            
            switch (e.code) {
                case 'Space':
                    if (!this.isListening) {
                        e.preventDefault();
                        this.startListening();
                    }
                    break;
                case 'Escape':
                    if (this.isListening) {
                        this.stopListening();
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.incrementJapCount();
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetCounter();
                    }
                    break;
            }
        });
    }
    
    /**
     * Setup window event listeners
     */
    setupWindowEventListeners() {
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
        
        window.addEventListener('focus', () => {
            this.checkSessionStatus();
        });
        
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveData();
                if (this.isListening) {
                    this.stopListening();
                }
            } else {
                this.checkSessionStatus();
            }
        });
    }
    
    /**
     * Check for target phrase in transcript
     */
    checkForTargetPhrase(transcript) {
        const normalizedTranscript = transcript.toLowerCase().trim();
        const variations = this.getPhraseVariations();
        
        // Check for matches
        const isMatch = variations.some(variation => {
            const similarity = this.calculateSimilarity(normalizedTranscript, variation.toLowerCase());
            if (similarity > this.config.similarityThreshold) {
                console.log(`✅ Match found: "${normalizedTranscript}" ~ "${variation}" (${(similarity * 100).toFixed(1)}%)`);
                return true;
            }
            return normalizedTranscript.includes(variation.toLowerCase());
        });
        
        if (isMatch) {
            // Check cooldown to prevent multiple detections
            const now = Date.now();
            const timeSinceLastRecognition = now - this.state.lastRecognizedTime;
            
            if (timeSinceLastRecognition < this.config.recognitionCooldown) {
                console.log(`⏸️ Cooldown active (${timeSinceLastRecognition}ms < ${this.config.recognitionCooldown}ms)`);
                return false;
            }
            
            // Set processing flag
            this.state.isProcessing = true;
            
            // Update last recognized time
            this.state.lastRecognizedTime = now;
            
            // Increment jap count (1 pronunciation = 1 jap)
            this.incrementJapCount();
            this.showRecognitionSuccess();
            this.logActivity('MANTRA_DETECTED', { 
                transcript: transcript.substring(0, 30),
                timeSinceLastRecognition
            });
            
            // Clear processing flag after a delay
            setTimeout(() => {
                this.state.isProcessing = false;
            }, 1000);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get phrase variations for matching
     */
    getPhraseVariations() {
        return [
            'जय जय राम कृष्णा हारी',
            'जय जय राम कृष्ण हारी',
            'jai jai ram krishna hari',
            'jai jai rama krishna hari',
            'जय राम कृष्ण हारी',
            'राम कृष्ण हारी',
            'जय जय राम कृष्णा हरि',
            'जय जय राम कृष्ण हरि',
            'राम कृष्णा हारी',
            'राम कृष्ण हारी'
        ];
    }
    
    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     */
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
    
    /**
     * Start listening for speech
     */
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                // Clear any existing restart timeout
                if (this.state.restartTimeout) {
                    clearTimeout(this.state.restartTimeout);
                    this.state.restartTimeout = null;
                }
                
                // Reset processing state
                this.state.isProcessing = false;
                // Enable continuous listening
                this.config.autoRestart = true;
                this.recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.updateListeningStatus('माइक्रोफोन शुरू करने में त्रुटि', false);
            }
        }
    }
    
    /**
     * Stop listening for speech
     */
    stopListening() {
        if (this.recognition) {
            // Clear any restart timeout
            if (this.state.restartTimeout) {
                clearTimeout(this.state.restartTimeout);
                this.state.restartTimeout = null;
            }
            
            // Disable auto-restart
            this.config.autoRestart = false;
            this.state.recognitionAttempts = 0;
            
            if (this.isListening) {
                this.recognition.stop();
            }
        }
    }
    
    /**
     * Increment the jap count (each pronunciation = 1 jap)
     */
    async incrementJapCount() {
        if (this.state.isSaving) return;
        
        // Add 1 jap to the count
        this.japCount++;
        this.currentMalaJaps++;
        
        // Check if current mala is complete (108 japs)
        if (this.currentMalaJaps >= this.config.japsPerMala) {
            await this.completeMala();
        }
        
        this.updateDisplay();
        await this.saveData();
        this.animateCountIncrement();
        
        this.logActivity('JAP_COUNT_INCREMENTED', { 
            newJapCount: this.japCount, 
            currentMalaJaps: this.currentMalaJaps,
            totalMalas: this.totalMalas,
            displayCount: this.japCount * this.config.wordsPerJap
        });
    }
    
    /**
     * Complete a mala (108 japs)
     */
    async completeMala() {
        this.totalMalas++;
        // Handle overflow japs
        this.currentMalaJaps = this.currentMalaJaps - this.config.japsPerMala;
        this.showCelebration();
        await this.saveData();
        this.logActivity('MALA_COMPLETED', { 
            totalMalas: this.totalMalas,
            totalJaps: this.japCount,
            totalWords: this.japCount * this.config.wordsPerJap,
            overflowJaps: this.currentMalaJaps
        });
    }
    
    /**
     * Reset the counter
     */
    async resetCounter() {
        if (confirm('क्या आप वाकई काउंटर को रीसेट करना चाहते हैं?')) {
            this.japCount = 0;
            this.totalMalas = 0;
            this.currentMalaJaps = 0;
            this.updateDisplay();
            await this.saveData();
            this.logActivity('COUNTER_RESET');
        }
    }
    
    /**
     * Update the display
     */
    updateDisplay() {
        this.updateCountDisplay();
        this.updateMalaStatus();
        this.updateTotalMalas();
        this.updateProgressBar();
        this.updateRemainingCount();
    }
    
    /**
     * Update count display - shows total words (japs × 5)
     */
    updateCountDisplay() {
        if (this.elements.countDisplay) {
            const totalWords = this.japCount * this.config.wordsPerJap;
            this.elements.countDisplay.textContent = totalWords;
        }
    }
    
    /**
     * Update mala status
     */
    updateMalaStatus() {
        if (!this.elements.malaStatus) return;
        
        if (this.japCount === 0) {
            this.elements.malaStatus.textContent = 'जप शुरू करें';
        } else if (this.currentMalaJaps === 0 && this.totalMalas > 0) {
            this.elements.malaStatus.textContent = `${this.totalMalas} माला पूर्ण!`;
        } else {
            this.elements.malaStatus.textContent = `वर्तमान माला: ${this.currentMalaJaps}/${this.config.japsPerMala}`;
        }
    }
    
    /**
     * Update total malas display
     */
    updateTotalMalas() {
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = `कुल माला: ${this.totalMalas}`;
        }
    }
    
    /**
     * Update progress bar
     */
    updateProgressBar() {
        if (!this.elements.progressFill) return;
        
        const progressPercentage = (this.currentMalaJaps / this.config.japsPerMala) * 100;
        this.elements.progressFill.style.width = `${progressPercentage}%`;
    }
    
    /**
     * Update remaining count
     */
    updateRemainingCount() {
        if (!this.elements.remainingCount) return;
        
        const remainingInCurrentMala = this.config.japsPerMala - this.currentMalaJaps;
        this.elements.remainingCount.textContent = remainingInCurrentMala;
    }
    
    /**
     * Show celebration
     */
    showCelebration() {
        if (!this.elements.celebration) return;
        
        this.elements.celebration.style.display = 'block';
        this.elements.celebration.innerHTML = `
            <div style="font-size: 48px;">🎉</div>
            <div style="font-size: 24px; margin-top: 10px;">माला पूर्ण!</div>
            <div style="font-size: 18px; margin-top: 5px;">${this.totalMalas} माला संपन्न</div>
            <div style="font-size: 16px; margin-top: 5px;">कुल शब्द: ${this.japCount * this.config.wordsPerJap}</div>
        `;
        
        setTimeout(() => {
            this.elements.celebration.style.display = 'none';
        }, this.config.celebrationDuration);
        
        this.elements.celebration.onclick = () => {
            this.elements.celebration.style.display = 'none';
        };
    }
    
    /**
     * Animate count increment
     */
    animateCountIncrement() {
        if (!this.elements.countDisplay) return;
        
        this.elements.countDisplay.classList.add('pulse');
        setTimeout(() => {
            this.elements.countDisplay.classList.remove('pulse');
        }, this.config.pulseAnimationDuration);
    }
    
    /**
     * Show recognition success
     */
    showRecognitionSuccess() {
        this.updateRecognitionText(`✅ ${this.targetPhrase} (+${this.config.wordsPerJap})`);
        setTimeout(() => {
            this.clearRecognitionText();
        }, 1500);
    }
    
    /**
     * Update listening status
     */
    updateListeningStatus(text, isListening = false) {
        if (!this.elements.listeningStatus) return;
        
        this.elements.listeningStatus.textContent = text;
        
        if (isListening) {
            this.elements.listeningStatus.classList.add('listening');
        } else {
            this.elements.listeningStatus.classList.remove('listening');
        }
    }
    
    /**
     * Update recognition text
     */
    updateRecognitionText(text) {
        if (this.elements.recognitionText) {
            this.elements.recognitionText.textContent = text;
        }
    }
    
    /**
     * Clear recognition text
     */
    clearRecognitionText() {
        this.updateRecognitionText('');
    }
    
    /**
     * Toggle buttons state
     */
    toggleButtons(listening) {
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = listening;
        }
        if (this.elements.stopBtn) {
            this.elements.stopBtn.disabled = !listening;
        }
    }
    
    /**
     * Load saved data from database
     */
    async loadSavedData() {
        try {
            const response = await fetch('/harijap/api/state', { 
                credentials: 'same-origin' 
            });
            const data = await response.json();
            
            if (data && data.success) {
                // Load jap count (convert from old word count if needed)
                const savedCount = Number(data.count || 0);
                if (data.japCount) {
                    // New format: direct jap count
                    this.japCount = Number(data.japCount || 0);
                } else {
                    // Old format: convert from word count
                    this.japCount = Math.floor(savedCount / this.config.wordsPerJap);
                }
                
                this.totalMalas = Math.floor(this.japCount / this.config.japsPerMala);
                this.currentMalaJaps = this.japCount % this.config.japsPerMala;
                
                this.logActivity('DATA_LOADED', { 
                    japCount: this.japCount, 
                    totalMalas: this.totalMalas,
                    currentMalaJaps: this.currentMalaJaps,
                    displayCount: this.japCount * this.config.wordsPerJap
                });
            } else {
                this.logActivity('DATA_LOAD_FAILED', { error: data.error });
            }
        } catch (error) {
            console.log('Could not load saved data:', error);
            this.logActivity('DATA_LOAD_ERROR', { error: error.message });
        }
    }
    
    /**
     * Save data to database
     */
    async saveData() {
        if (this.state.isSaving) return;
        
        this.state.isSaving = true;
        
        try {
            const payload = {
                japCount: this.japCount,
                count: this.japCount * this.config.wordsPerJap, // For backward compatibility
                totalMalas: this.totalMalas
            };
            
            const response = await fetch('/harijap/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data && data.success) {
                this.logActivity('DATA_SAVED', { 
                    japCount: this.japCount, 
                    totalMalas: this.totalMalas,
                    displayCount: this.japCount * this.config.wordsPerJap
                });
            } else {
                this.logActivity('DATA_SAVE_FAILED', { error: data.error });
            }
        } catch (error) {
            console.log('Could not save data:', error);
            this.logActivity('DATA_SAVE_ERROR', { error: error.message });
        } finally {
            this.state.isSaving = false;
        }
    }
    
    /**
     * Start auto-save functionality
     */
    startAutoSave() {
        this.state.autoSaveTimer = setInterval(() => {
            if (this.state.isInitialized && !this.state.isSaving) {
                this.saveData();
            }
        }, this.config.autoSaveInterval);
    }
    
    /**
     * Start session monitoring
     */
    startSessionMonitoring() {
        this.state.sessionCheckTimer = setInterval(() => {
            this.checkSessionStatus();
        }, this.config.sessionCheckInterval);
    }
    
    /**
     * Check session status
     */
    async checkSessionStatus() {
        try {
            const response = await fetch('/harijap/auth/check_session', {
                credentials: 'same-origin'
            });
            const data = await response.json();
            
            if (!data.authenticated) {
                this.handleSessionExpired();
            }
        } catch (error) {
            console.log('Session check failed:', error);
        }
    }
    
    /**
     * Handle session expired
     */
    handleSessionExpired() {
        alert('सत्र समाप्त हो गया। कृपया दोबारा लॉगिन करें।');
        window.location.href = '/harijap/auth';
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        if (this.elements.listeningStatus) {
            this.elements.listeningStatus.textContent = message;
        }
    }
    
    /**
     * Log activity
     */
    logActivity(activity, details = {}) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [HariJapCounter] ${activity}:`, details);
    }
    
    /**
     * Data recovery from your current state
     * Call this function to recover from the reset
     */
    recoverFromReset() {
        // Based on your database showing total_malas = 3, let's recover
        const malasFromDB = 3; // From your database query
        
        if (malasFromDB > 0) {
            // Calculate approximate jap count from completed malas
            // 3 complete malas = 3 × 108 = 324 japs
            // Plus the current mala progress shown in UI (84/108)
            const completedJaps = malasFromDB * this.config.japsPerMala;
            const currentMalaProgress = 84; // From your UI screenshot
            
            this.japCount = completedJaps + currentMalaProgress;
            this.totalMalas = Math.floor(this.japCount / this.config.japsPerMala);
            this.currentMalaJaps = this.japCount % this.config.japsPerMala;
            
            console.log('🔧 Data recovered!');
            console.log('Recovered state:', {
                japCount: this.japCount,
                totalMalas: this.totalMalas,
                currentMalaJaps: this.currentMalaJaps,
                displayCount: this.japCount * this.config.wordsPerJap
            });
            
            this.updateDisplay();
            this.saveData();
            
            return {
                success: true,
                recoveredJapCount: this.japCount,
                recoveredDisplayCount: this.japCount * this.config.wordsPerJap
            };
        }
        
        return { success: false, message: 'No data to recover' };
    }
        return {
            japCount: this.japCount,
            totalWords: this.japCount * this.config.wordsPerJap,
            totalMalas: this.totalMalas,
            currentMalaJaps: this.currentMalaJaps,
            currentMalaProgress: ((this.currentMalaJaps / this.config.japsPerMala) * 100).toFixed(1) + '%',
            remainingJapsInCurrentMala: this.config.japsPerMala - this.currentMalaJaps,
            totalTargetWords: this.config.totalMalasTarget * this.config.japsPerMala * this.config.wordsPerJap,
            overallProgress: ((this.japCount / (this.config.totalMalasTarget * this.config.japsPerMala)) * 100).toFixed(1) + '%'
        };
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        // Clear timers
        if (this.state.autoSaveTimer) {
            clearInterval(this.state.autoSaveTimer);
        }
        if (this.state.sessionCheckTimer) {
            clearInterval(this.state.sessionCheckTimer);
        }
        if (this.state.restartTimeout) {
            clearTimeout(this.state.restartTimeout);
        }
        
        // Stop recognition
        if (this.recognition && this.isListening) {
            this.config.autoRestart = false;
            this.recognition.stop();
        }
        
        this.logActivity('HARI_JAP_DESTROYED');
    }
}

// Global functions for onclick handlers (backward compatibility)
function sendOTP() {
    if (window.hariJapLogin) {
        window.hariJapLogin.sendOTP();
    }
}

function verifyOTP() {
    if (window.hariJapLogin) {
        window.hariJapLogin.verifyOTP();
    }
}

function resendOTP() {
    if (window.hariJapLogin) {
        window.hariJapLogin.resendOTP();
    }
}

function goBack() {
    if (window.hariJapLogin) {
        window.hariJapLogin.goBack();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.hariJapCounter = new HariJapCounter();
        console.log('🕉️ हरि जप साधना initialized successfully!');
        console.log('='.repeat(60));
        console.log('📊 FIXED CONFIGURATION:');
        console.log('- 1 pronunciation ("जय जय राम कृष्णा हारी") = 1 jap count');
        console.log('- 1 jap = 5 words (for display calculation only)');
        console.log('- 1 mala = 108 jap pronunciations');
        console.log('- Display count = jap count × 5');
        console.log('- Target = 108 malas = 11,664 jap pronunciations = 58,320 words');
        console.log('='.repeat(60));
        console.log('⌨️ KEYBOARD SHORTCUTS:');
        console.log('- Space: Start continuous listening');
        console.log('- Escape: Stop listening');
        console.log('- Enter: Manual jap increment (+1 jap, +5 display count)');
        console.log('- Ctrl+R: Reset counter');
        console.log('='.repeat(60));
        console.log('🔧 IMPROVEMENTS MADE:');
        console.log('✅ Fixed: Each pronunciation now correctly adds 1 to mala count');
        console.log('✅ Fixed: Continuous listening until manually stopped');
        console.log('✅ Fixed: Prevents duplicate detection with cooldown');
        console.log('✅ Fixed: Display shows total words (japs × 5)');
        console.log('✅ Fixed: Proper mala completion at 108 japs (540 display count)');
        console.log('='.repeat(60));
    } catch (error) {
        console.error('Error initializing Hari Jap Counter:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.hariJapCounter) {
        window.hariJapCounter.destroy();
    }
});

// Debug function to get current statistics
window.getHariJapStats = function() {
    if (window.hariJapCounter) {
        const stats = window.hariJapCounter.getStatistics();
        console.table(stats);
        return stats;
    }
    return null;
};

// Manual recovery functions
window.recoverHariJapData = function() {
    if (window.hariJapCounter) {
        return window.hariJapCounter.recoverFromReset();
    }
    return { success: false, message: 'Counter not initialized' };
};

window.restoreFromBackup = function() {
    if (window.hariJapCounter) {
        return window.hariJapCounter.restoreFromBackup();
    }
    return false;
};

// Emergency manual set function (use with caution)
window.setHariJapCount = function(japCount, saveToDb = true) {
    if (window.hariJapCounter && typeof japCount === 'number' && japCount >= 0) {
        window.hariJapCounter.japCount = japCount;
        window.hariJapCounter.totalMalas = Math.floor(japCount / window.hariJapCounter.config.japsPerMala);
        window.hariJapCounter.currentMalaJaps = japCount % window.hariJapCounter.config.japsPerMala;
        window.hariJapCounter.updateDisplay();
        
        if (saveToDb) {
            window.hariJapCounter.saveData();
        }
        
        console.log('Manual count set to:', {
            japCount: japCount,
            displayCount: japCount * 5,
            totalMalas: window.hariJapCounter.totalMalas,
            currentMalaJaps: window.hariJapCounter.currentMalaJaps
        });
        
        return true;
    }
    return false;
};
