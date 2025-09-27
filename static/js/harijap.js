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
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        });
        
        // Verify critical elements are present
        const criticalElements = ['countDisplay', 'startBtn', 'stopBtn'];
        const missingElements = criticalElements.filter(id => !this.elements[id]);
        
        if (missingElements.length > 0) {
            throw new Error(`Critical elements missing: ${missingElements.join(', ')}`);
        }
    }

    initializeSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                throw new Error('Speech Recognition API not available');
            }
            
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.recognitionLang;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            this.recognition.continuous = true;

            this.recognition.onresult = (event) => this.handleRecognitionResult(event);
            this.recognition.onend = () => this.handleRecognitionEnd();
            this.recognition.onerror = (event) => this.handleRecognitionError(event);
            this.recognition.onstart = () => this.handleRecognitionStart();
            
            console.log('✅ Speech Recognition initialized successfully');
        } catch (error) {
            console.error('Speech Recognition not supported:', error);
            this.showError('आपका ब्राउज़र आवाज पहचानने का समर्थन नहीं करता।');
            this.recognition = null;
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
        // Safely update display elements with null checks
        if (this.elements.countDisplay) {
            this.elements.countDisplay.textContent = this.count;
        }
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = `कुल माला: ${this.totalMalas}`;
        }
        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent = `${this.currentMalaWords} / ${this.config.wordsPerMala}`;
        }
        if (this.elements.remainingCount) {
            this.elements.remainingCount.textContent = `${this.config.wordsPerMala - this.currentMalaWords}`;
        }
        if (this.elements.listeningStatus) {
            this.elements.listeningStatus.textContent = this.isListening ? 'सुन रहा है...' : 'माइक्रोफोन तैयार है';
        }
        
        // Update progress bar
        if (this.elements.progressFill) {
            const progress = (this.currentMalaWords / this.config.wordsPerMala) * 100;
            this.elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    startRecognition() {
        if (!this.recognition) {
            this.showError('आवाज पहचान सेवा उपलब्ध नहीं है।');
            return;
        }
        
        if (!this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                this.updateDisplay();
                this.logActivity('RECOGNITION_STARTED');
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.showError('आवाज पहचान शुरू करने में त्रुटि।');
            }
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

    // Event handlers for speech recognition
    handleRecognitionStart() {
        console.log('🎤 Speech recognition started');
        if (this.elements.listeningStatus) {
            this.elements.listeningStatus.textContent = 'सुन रहा है...';
            this.elements.listeningStatus.classList.add('listening');
        }
    }

    handleRecognitionEnd() {
        console.log('🎤 Speech recognition ended');
        this.isListening = false;
        if (this.elements.listeningStatus) {
            this.elements.listeningStatus.textContent = 'माइक्रोफोन तैयार है';
            this.elements.listeningStatus.classList.remove('listening');
        }
        
        // Auto-restart recognition if it was manually started
        if (this.state.isInitialized) {
            setTimeout(() => {
                if (!this.isListening) {
                    this.startRecognition();
                }
            }, 100);
        }
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        
        let errorMessage = 'आवाज पहचान में त्रुटि।';
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'कोई आवाज नहीं सुनी गई।';
                break;
            case 'audio-capture':
                errorMessage = 'माइक्रोफोन तक पहुंच नहीं मिली।';
                break;
            case 'not-allowed':
                errorMessage = 'माइक्रोफोन की अनुमति नहीं मिली।';
                break;
            case 'network':
                errorMessage = 'नेटवर्क त्रुटि।';
                break;
        }
        
        this.showError(errorMessage);
        this.updateDisplay();
    }

    logActivity(activity) {
        console.log(`📊 Activity: ${activity}`, {
            count: this.count,
            totalMalas: this.totalMalas,
            currentMalaWords: this.currentMalaWords,
            timestamp: new Date().toISOString()
        });
    }
}

// Usage
document.addEventListener('DOMContentLoaded', () => {
    const counter = new HariJapCounter();
});

