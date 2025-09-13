/**
 * 🕉️ हरि जप साधना - Voice-based Jap Counter (Improved Version)
 * 5-word mantra: "जय जय राम कृष्णा हारी" = 5 words
 * Mala calculation: 5 words = 1 mala
 * Total count: 108 malas × 5 words = 540 total count
 */

class HariJapCounter {
    constructor() {
        // Core properties
        this.count = 0;           // Total word count
        this.totalMalas = 0;      // Total malas completed
        this.currentMalaWords = 0; // Words in current mala (0-5)
        this.isListening = false;
        this.recognition = null;
        this.targetPhrase = 'जय जय राम कृष्णा हारी';
        
        // Configuration
        this.config = {
            wordsPerMala: 5,           // 5 words = 1 mala
            malasPerRound: 108,        // 108 malas per round
            totalWordsPerRound: 540,   // 108 × 5 = 540 words
            recognitionLang: 'hi-IN',
            fallbackLang: 'en-US',
            similarityThreshold: 0.7,
            celebrationDuration: 3000,
            pulseAnimationDuration: 300,
            autoSaveInterval: 5000,
            sessionCheckInterval: 30000
        };
        
        // DOM elements
        this.elements = {};
        
        // State management
        this.state = {
            isInitialized: false,
            isSaving: false,
            autoSaveTimer: null,
            sessionCheckTimer: null,
            lastRecognizedTime: 0,     // Prevent double counting
            recognitionCooldown: 2000  // 2 seconds cooldown between recognitions
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
        this.recognition.interimResults = true;
        this.recognition.lang = this.config.recognitionLang;
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
        this.clearRecognitionText();
        this.logActivity('SPEECH_RECOGNITION_ENDED');
    }
    
    /**
     * Handle recognition result
     */
    handleRecognitionResult(event) {
        const { interimTranscript, finalTranscript } = this.processRecognitionResults(event);
        
        this.displayRecognitionText(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
            this.checkForTargetPhrase(finalTranscript);
        } else if (interimTranscript) {
            this.checkForTargetPhrase(interimTranscript);
        }
    }
    
    /**
     * Process recognition results
     */
    processRecognitionResults(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;
            
            this.logActivity('SPEECH_RESULT', { 
                transcript: transcript.substring(0, 20) + '...', 
                confidence: confidence.toFixed(2) 
            });
            
            if (result.isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        return { interimTranscript, finalTranscript };
    }
    
    /**
     * Handle recognition error
     */
    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.updateListeningStatus('त्रुटि: ' + event.error, false);
        
        if (event.error === 'language-not-supported') {
            this.handleLanguageNotSupported();
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
        setTimeout(() => {
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
            manualBtn: () => this.incrementCount(),
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
                    this.incrementCount();
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
        
        const isMatch = variations.some(variation => {
            return normalizedTranscript.includes(variation.toLowerCase()) ||
                   this.calculateSimilarity(normalizedTranscript, variation.toLowerCase()) > this.config.similarityThreshold;
        });
        
        if (isMatch) {
            // Prevent double counting with cooldown
            const now = Date.now();
            if (now - this.state.lastRecognizedTime < this.state.recognitionCooldown) {
                console.log('�� Ignoring duplicate recognition (cooldown)');
                return;
            }
            
            this.state.lastRecognizedTime = now;
            this.incrementCount();
            this.showRecognitionSuccess();
            this.logActivity('MANTRA_DETECTED', { transcript: transcript.substring(0, 30) });
        }
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
        
        return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
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
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    /**
     * Increment the count (5 words = 1 mala)
     */
    async incrementCount() {
        if (this.state.isSaving) return;
        
        // Increment word count
        this.count++;
        this.currentMalaWords++;
        
        // Check if current mala is complete (5 words)
        if (this.currentMalaWords >= this.config.wordsPerMala) {
            this.completeMala();
        }
        
        this.updateDisplay();
        await this.saveData();
        this.animateCountIncrement();
        
        this.logActivity('COUNT_INCREMENTED', { 
            newCount: this.count, 
            currentMalaWords: this.currentMalaWords,
            totalMalas: this.totalMalas
        });
    }
    
    /**
     * Complete a mala (5 words = 1 mala)
     */
    async completeMala() {
        this.totalMalas++;
        this.currentMalaWords = 0; // Reset current mala words
        this.showCelebration();
        await this.saveData();
        this.logActivity('MALA_COMPLETED', { 
            totalMalas: this.totalMalas,
            totalWords: this.count
        });
    }
    
    /**
     * Reset the counter
     */
    async resetCounter() {
        if (confirm('क्या आप वाकई काउंटर को रीसेट करना चाहते हैं?')) {
            this.count = 0;
            this.totalMalas = 0;
            this.currentMalaWords = 0;
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
     * Update count display
     */
    updateCountDisplay() {
        if (this.elements.countDisplay) {
            this.elements.countDisplay.textContent = this.count;
        }
    }
    
    /**
     * Update mala status
     */
    updateMalaStatus() {
        if (!this.elements.malaStatus) return;
        
        if (this.count === 0) {
            this.elements.malaStatus.textContent = 'जप शुरू करें';
        } else if (this.currentMalaWords === 0 && this.totalMalas > 0) {
            this.elements.malaStatus.textContent = `${this.totalMalas} माला पूर्ण!`;
        } else {
            this.elements.malaStatus.textContent = `वर्तमान माला: ${this.currentMalaWords}/${this.config.wordsPerMala}`;
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
        
        const progressPercentage = (this.currentMalaWords / this.config.wordsPerMala) * 100;
        this.elements.progressFill.style.width = `${progressPercentage}%`;
    }
    
    /**
     * Update remaining count
     */
    updateRemainingCount() {
        if (!this.elements.remainingCount) return;
        
        const remainingInCurrentMala = this.config.wordsPerMala - this.currentMalaWords;
        this.elements.remainingCount.textContent = remainingInCurrentMala === this.config.wordsPerMala ? this.config.wordsPerMala : remainingInCurrentMala;
    }
    
    /**
     * Show celebration
     */
    showCelebration() {
        if (!this.elements.celebration) return;
        
        this.elements.celebration.style.display = 'block';
        
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
        this.updateRecognitionText('✅ ' + this.targetPhrase);
        setTimeout(() => {
            this.clearRecognitionText();
        }, 1000);
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
     * Display recognition text
     */
    displayRecognitionText(text) {
        this.updateRecognitionText(text);
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
                this.count = Number(data.count || 0);
                this.totalMalas = Number(data.total_malas || 0);
                // Calculate current mala words from total count
                this.currentMalaWords = this.count % this.config.wordsPerMala;
                this.logActivity('DATA_LOADED', { 
                    count: this.count, 
                    totalMalas: this.totalMalas,
                    currentMalaWords: this.currentMalaWords
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
                count: this.count,
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
                this.logActivity('DATA_SAVED', { count: this.count, totalMalas: this.totalMalas });
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
    }
    
    /**
     * Log activity
     */
    logActivity(activity, details = {}) {
        console.log(`[HariJapCounter] ${activity}:`, details);
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        if (this.state.autoSaveTimer) {
            clearInterval(this.state.autoSaveTimer);
        }
        if (this.state.sessionCheckTimer) {
            clearInterval(this.state.sessionCheckTimer);
        }
        if (this.recognition && this.isListening) {
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
        console.log('Shortcuts:');
        console.log('- Space: Start listening');
        console.log('- Escape: Stop listening');
        console.log('- Enter: Manual count increment');
        console.log('- Ctrl+R: Reset counter');
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

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
