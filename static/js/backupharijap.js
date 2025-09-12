/**
 * 🕉️ हरि जप साधना - Voice-based Jap Counter
 * A spiritual chanting application with voice recognition
 * Author: Sadguru Seva Platform
 * Version: 2.0
 */

class HariJapCounter {
    constructor() {
        // Core properties
        this.count = 0;
        this.totalMalas = 0;
        this.isListening = false;
        this.recognition = null;
        this.targetPhrase = 'जय जय राम कृष्ण हरि';
        
        // Configuration
        this.config = {
            malaSize: 108,
            recognitionLang: 'hi-IN',
            fallbackLang: 'en-US',
            similarityThreshold: 0.7,
            celebrationDuration: 3000,
            pulseAnimationDuration: 300
        };
        
        // DOM elements
        this.elements = {};
        
        // Initialize the application
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.setupEventListeners();
        this.loadSavedData();
        this.updateDisplay();
        this.logInitialization();
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
        console.log('�� Speech recognition started with language:', this.recognition.lang);
    }
    
    /**
     * Handle recognition end
     */
    handleRecognitionEnd() {
        this.isListening = false;
        this.updateListeningStatus('माइक्रोफोन बंद है', false);
        this.toggleButtons(false);
        this.clearRecognitionText();
        console.log('�� Speech recognition ended');
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
            
            console.log(`🎤 Result ${i}:`, transcript, `(confidence: ${confidence})`);
            
            if (result.isFinal) {
                finalTranscript += transcript;
                console.log('🎤 Final transcript:', transcript);
            } else {
                interimTranscript += transcript;
                console.log('🎤 Interim transcript:', transcript);
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
        console.log('🎤 No match found by speech recognition');
        this.updateRecognitionText('कुछ समझ नहीं आया, फिर कोशिश करें');
    }
    
    /**
     * Handle speech recognition unavailable
     */
    handleSpeechRecognitionUnavailable() {
        this.updateListeningStatus('Speech Recognition उपलब्ध नहीं है', false);
        this.elements.startBtn.disabled = true;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.setupButtonEventListeners();
        this.setupKeyboardEventListeners();
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
            this.incrementCount();
            this.showRecognitionSuccess();
        }
    }
    
    /**
     * Get phrase variations for matching
     */
    getPhraseVariations() {
        return [
            'जय जय राम कृष्ण हरि',
            'जय जय राम कृष्ण हारी',
            'jai jai ram krishna hari',
            'jai jai rama krishna hari',
            'जय राम कृष्ण हरि',
            'राम कृष्ण हरि'
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
     * Increment the count
     */
    incrementCount() {
        this.count++;
        this.updateDisplay();
        this.saveData();
        this.animateCountIncrement();
        
        if (this.isMalaComplete()) {
            this.completeMala();
        }
    }
    
    /**
     * Check if mala is complete
     */
    isMalaComplete() {
        return this.count % this.config.malaSize === 0;
    }
    
    /**
     * Complete a mala
     */
    completeMala() {
        this.totalMalas++;
        this.showCelebration();
        this.saveData();
    }
    
    /**
     * Reset the counter
     */
    resetCounter() {
        if (confirm('क्या आप वाकई काउंटर को रीसेट करना चाहते हैं?')) {
            this.count = 0;
            this.totalMalas = 0;
            this.updateDisplay();
            this.saveData();
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
        
        const currentMalaCount = this.count % this.config.malaSize;
        
        if (this.count === 0) {
            this.elements.malaStatus.textContent = 'जप शुरू करें';
        } else if (currentMalaCount === 0) {
            this.elements.malaStatus.textContent = `${this.totalMalas} माला पूर्ण!`;
        } else {
            this.elements.malaStatus.textContent = `वर्तमान माला: ${currentMalaCount}/${this.config.malaSize}`;
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
        
        const currentMalaCount = this.count % this.config.malaSize;
        const progressPercentage = (currentMalaCount / this.config.malaSize) * 100;
        this.elements.progressFill.style.width = `${progressPercentage}%`;
    }
    
    /**
     * Update remaining count
     */
    updateRemainingCount() {
        if (!this.elements.remainingCount) return;
        
        const currentMalaCount = this.count % this.config.malaSize;
        const remainingInCurrentMala = this.config.malaSize - currentMalaCount;
        this.elements.remainingCount.textContent = remainingInCurrentMala === this.config.malaSize ? this.config.malaSize : remainingInCurrentMala;
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
     * Save data to storage
     */
    saveData() {
        const data = {
            count: this.count,
            totalMalas: this.totalMalas,
            lastSaved: new Date().toISOString()
        };
        
        // Use localStorage if available, otherwise use global variable
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('hariJapData', JSON.stringify(data));
        } else {
            window.hariJapData = data;
        }
    }
    
    /**
     * Load saved data from storage
     */
    loadSavedData() {
        let data = null;
        
        // Try localStorage first, then global variable
        if (typeof Storage !== 'undefined') {
            const savedData = localStorage.getItem('hariJapData');
            if (savedData) {
                try {
                    data = JSON.parse(savedData);
                } catch (e) {
                    console.warn('Error parsing saved data:', e);
                }
            }
        } else if (window.hariJapData) {
            data = window.hariJapData;
        }
        
        if (data) {
            this.count = data.count || 0;
            this.totalMalas = data.totalMalas || 0;
        }
    }
    
    /**
     * Log initialization message
     */
    logInitialization() {
        console.log('��️ जप साधना initialized successfully!');
        console.log('Shortcuts:');
        console.log('- Space: Start listening');
        console.log('- Escape: Stop listening');
        console.log('- Enter: Manual count increment');
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        const hariJapCounter = new HariJapCounter();
        
        // Make it globally accessible for debugging
        window.hariJapCounter = hariJapCounter;
        
        console.log('��️ हरि जप साधना loaded successfully!');
        
    } catch (error) {
        console.error('Error initializing Hari Jap Counter:', error);
    }
});

/**
 * Service Worker registration for offline functionality
 */
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
