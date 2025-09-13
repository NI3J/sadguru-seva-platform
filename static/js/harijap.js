class HariJapCounter {
    constructor() {
        // Core properties
        this.count = 0;
        this.totalMalas = 0;
        this.currentMalaWords = 0;
        this.isListening = false;
        this.recognition = null;
        this.targetPhrase = 'जय जय राम कृष्णा हारी';

        // Configuration
        this.config = {
            wordsPerPronunciation: 5,
            wordsPerMala: 108,
            totalMalasTarget: 108,
            recognitionLang: 'hi-IN',
            celebrationDuration: 3000,
            sessionCheckInterval: 30000,
            autoSaveInterval: 5000,
        };

        // DOM elements
        this.elements = {};

        // State management
        this.state = {
            isInitialized: false,
            lastRecognizedTime: 0,
            isSaving: false,
        };

        // Initialize the application
        this.init();
    }

    async init() {
        try {
            this.initializeElements();
            this.initializeSpeechRecognition();
            this.setupEventListeners();
            await this.loadSavedData();
            this.updateDisplay();
            this.startAutoSave();
            this.state.isInitialized = true;
            this.logActivity('HARI_JAP_INITIALIZED');
        } catch (error) {
            console.error('Error initializing Hari Jap Counter:', error);
            this.showError('प्रारंभिकरण में त्रुटि। पृष्ठ को पुनः लोड करें।');
        }
    }

    initializeElements() {
        const elementIds = [
            'countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration',
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    initializeSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.recognitionLang;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => this.handleRecognitionResult(event);
            this.recognition.onend = () => this.handleRecognitionEnd();
        } catch (error) {
            console.error('Speech Recognition not supported:', error);
            this.showError('आपका ब्राउज़र आवाज पहचानने का समर्थन नहीं करता।');
        }
    }

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startRecognition());
        this.elements.stopBtn.addEventListener('click', () => this.stopRecognition());
        this.elements.manualBtn.addEventListener('click', () => this.manualCount());
        this.elements.resetBtn.addEventListener('click', () => this.resetCounter());
    }

    async loadSavedData() {
        const savedData = JSON.parse(localStorage.getItem('hariJapData'));
        if (savedData) {
            this.count = savedData.count || 0;
            this.totalMalas = savedData.totalMalas || 0;
            this.currentMalaWords = savedData.currentMalaWords || 0;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        this.elements.countDisplay.textContent = this.count;
        this.elements.totalMalas.textContent = this.totalMalas;
        this.elements.malaStatus.textContent = `${this.currentMalaWords} / ${this.config.wordsPerMala}`;
        this.elements.remainingCount.textContent = `${this.config.totalMalasTarget - this.totalMalas} malas remaining`;
        this.elements.listeningStatus.textContent = this.isListening ? 'Listening...' : 'Not Listening';
    }

    startRecognition() {
        if (!this.isListening) {
            this.recognition.start();
            this.isListening = true;
            this.updateDisplay();
        }
    }

    stopRecognition() {
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateDisplay();
        }
    }

    handleRecognitionResult(event) {
        const result = event.results[0][0].transcript;
        this.elements.recognitionText.textContent = result;
        this.state.lastRecognizedTime = Date.now();

        if (this.isTargetPhrase(result)) {
            this.count += this.config.wordsPerPronunciation;
            this.currentMalaWords += this.config.wordsPerPronunciation;
            this.checkMalaCompletion();
            this.updateDisplay();
            this.triggerCelebration();
        }
    }

    isTargetPhrase(result) {
        return result.includes(this.targetPhrase);
    }

    checkMalaCompletion() {
        if (this.currentMalaWords >= this.config.wordsPerMala) {
            this.totalMalas += 1;
            this.currentMalaWords = 0;
            this.triggerMalaCelebration();
        }
    }

    triggerMalaCelebration() {
        this.showCelebration('Congratulations on completing a mala!');
    }

    triggerCelebration() {
        this.showCelebration('जय जय राम कृष्णा हारी कहा गया!');
    }

    showCelebration(message) {
        this.elements.celebration.textContent = message;
        setTimeout(() => {
            this.elements.celebration.textContent = '';
        }, this.config.celebrationDuration);
    }

    manualCount() {
        this.count += this.config.wordsPerPronunciation;
        this.currentMalaWords += this.config.wordsPerPronunciation;
        this.checkMalaCompletion();
        this.updateDisplay();
    }

    resetCounter() {
        this.count = 0;
        this.totalMalas = 0;
        this.currentMalaWords = 0;
        this.updateDisplay();
    }

    showError(message) {
        alert(message);
    }

    startAutoSave() {
        setInterval(() => this.saveData(), this.config.autoSaveInterval);
    }

    saveData() {
        if (!this.state.isSaving) {
            this.state.isSaving = true;
            localStorage.setItem('hariJapData', JSON.stringify({
                count: this.count,
                totalMalas: this.totalMalas,
                currentMalaWords: this.currentMalaWords,
            }));
            this.state.isSaving = false;
        }
    }
}

// Usage
document.addEventListener('DOMContentLoaded', () => {
    const counter = new HariJapCounter();
});

