/**
 * Enhanced Japa Sadhana JavaScript Application
 * Restructured for better organization and maintainability
 */

// ==============================================================================
// CONFIGURATION & CONSTANTS
// ==============================================================================

const JAPA_CONFIG = {
    RECOGNITION_TIMEOUT: 10000,
    AUTO_RESTART_DELAY: 100,
    SUCCESS_FEEDBACK_DURATION: 3000,
    ERROR_FEEDBACK_DURATION: 5000,
    CELEBRATION_DURATION: 2000,
    UPDATE_ANIMATION_DURATION: 600,
    COUNT_ANIMATION_DURATION: 300,
    MAX_CONSECUTIVE_FAILURES: 5,
    MIN_SIMILARITY_THRESHOLD: 0.7
};

const MESSAGES = {
    STARTING_SESSION: 'सत्र प्रारंभ हो रहा है...',
    LISTENING: 'सुन रहा है... अपेक्षित शब्द बोलें',
    SESSION_ENDED: 'जप सत्र समाप्त',
    PROCESSING: 'प्रसंस्करण...',
    ROUND_COMPLETED: 'एक राउंड पूरा!',
    RECOGNITION_RESTARTING: 'फिर से सुनने की कोशिश कर रहा है...',
    CONNECTION_RESTORED: 'इंटरनेट कनेक्शन वापस आ गया',
    CONNECTION_LOST: 'इंटरनेट कनेक्शन बंद है',
    KEYBOARD_SHORTCUT_TIP: 'टिप: स्पेसबार दबाकर जप शुरू करें, Escape से रोकें'
};

// ==============================================================================
// MAIN JAPA APPLICATION CLASS
// ==============================================================================

class JapaApp {
    constructor() {
        // Core state
        this.recognition = null;
        this.isListening = false;
        this.sessionActive = false;
        
        // Session data
        this.currentWordIndex = 1;
        this.sessionCount = 0;
        this.totalWordsInMantra = 16;
        
        // Statistics
        this.dailyWords = 0;
        this.dailyRounds = 0;
        this.lifetimeWords = 0;
        this.lifetimeRounds = 0;
        
        // Recognition management
        this.recognitionTimeout = null;
        this.lastRecognitionTime = 0;
        this.consecutiveFailures = 0;
        
        // Pattern data
        this.mantraWords = [];
        this.mantraPattern = null;
        
        // UI elements cache
        this.elements = {};
        
        this.init();
    }

    // --------------------------------------------------------------------------
    // INITIALIZATION
    // --------------------------------------------------------------------------

    async init() {
        try {
            this.cacheElements();
            this.loadInitialData();
            this.setupEventListeners();
            this.initSpeechRecognition();
            await this.loadMantraPattern();
            this.updateDisplay();
            this.showInitialTip();
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateStatus('प्रारंभिक लोडिंग में त्रुटि');
        }
    }

    cacheElements() {
        const elementIds = [
            'startBtn', 'stopBtn', 'voiceStatus', 'recognitionFeedback',
            'expectedWord', 'expectedDevanagari', 'expectedEnglish',
            'wordProgress', 'progressNumber', 'mantraBox', 'mantraText',
            'sessionCount', 'dailyWords', 'dailyRounds', 'lifetimeWords', 
            'lifetimeRounds', 'counterRing', 'mantraWordsData'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    loadInitialData() {
        // Load mantra words from page data
        const mantraWordsElement = this.elements.mantraWordsData;
        this.mantraWords = mantraWordsElement ? JSON.parse(mantraWordsElement.textContent) : [];
        this.totalWordsInMantra = this.mantraWords.length || 16;

        // Get initial values from the page
        this.sessionCount = this.getElementValue('sessionCount');
        this.dailyWords = this.getElementValue('dailyWords');
        this.dailyRounds = this.getElementValue('dailyRounds');
        this.lifetimeWords = this.getElementValue('lifetimeWords');
        this.lifetimeRounds = this.getElementValue('lifetimeRounds');
        this.currentWordIndex = this.getElementValue('progressNumber', 1);
    }

    getElementValue(elementName, defaultValue = 0) {
        return parseInt(this.elements[elementName]?.textContent) || defaultValue;
    }

    setupEventListeners() {
        // Button event listeners
        this.elements.startBtn?.addEventListener('click', () => this.startJapaSession());
        this.elements.stopBtn?.addEventListener('click', () => this.stopJapaSession());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isListening && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.startJapaSession();
            } else if (e.code === 'Escape' && this.isListening) {
                e.preventDefault();
                this.stopJapaSession();
            }
        });

        // Page lifecycle events
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.stopListening();
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.isListening) {
                this.stopJapaSession();
                e.preventDefault();
                e.returnValue = 'जप सत्र चल रहा है। क्या आप वाकई पेज छोड़ना चाहते हैं?';
            }
        });

        // Network status events
        window.addEventListener('online', () => {
            this.updateStatus(MESSAGES.CONNECTION_RESTORED);
        });

        window.addEventListener('offline', () => {
            this.updateStatus(MESSAGES.CONNECTION_LOST);
            this.stopJapaSession();
        });
    }

    async loadMantraPattern() {
        try {
            const response = await fetch('/api/japa/get_pattern');
            const data = await response.json();

            if (data.success) {
                this.mantraPattern = data.data.pattern;
                this.totalWordsInMantra = data.data.total_utterances;
                console.log('Loaded mantra pattern:', this.mantraPattern);
                console.log('Total utterances in one round:', this.totalWordsInMantra);
            }
        } catch (error) {
            console.error('Error loading mantra pattern:', error);
            this.totalWordsInMantra = 16; // Fallback
        }
    }

    showInitialTip() {
        setTimeout(() => {
            if (!this.sessionActive) {
                this.updateStatus(MESSAGES.KEYBOARD_SHORTCUT_TIP);
            }
        }, 2000);
    }

    // --------------------------------------------------------------------------
    // SESSION MANAGEMENT
    // --------------------------------------------------------------------------

    async startJapaSession() {
        try {
            this.updateStatus(MESSAGES.STARTING_SESSION);

            const response = await fetch('/api/japa/start_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (data.success) {
                this.sessionActive = true;
                this.sessionCount = data.data.total_count;
                this.currentWordIndex = data.data.current_word_index;
                this.consecutiveFailures = 0;
                this.updateDisplay();
                this.startListening();
            } else {
                this.updateStatus('सत्र शुरू नहीं हो सका: ' + data.error);
            }
        } catch (error) {
            console.error('Error starting session:', error);
            this.updateStatus('सत्र शुरू करने में त्रुटि');
        }
    }

    async stopJapaSession() {
        try {
            this.stopListening();

            const response = await fetch('/api/japa/end_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            this.sessionActive = false;
            this.updateStatus(MESSAGES.SESSION_ENDED);
            this.consecutiveFailures = 0;

            await this.updateStats();
        } catch (error) {
            console.error('Error ending session:', error);
            this.updateStatus('सत्र समाप्त करने में त्रुटि');
        }
    }

    // --------------------------------------------------------------------------
    // SPEECH RECOGNITION
    // --------------------------------------------------------------------------

    initSpeechRecognition() {
        if (!this.isSpeechRecognitionSupported()) {
            this.updateStatus('आपका ब्राउज़र वॉइस रिकग्निशन सपोर्ट नहीं करता');
            this.elements.startBtn.disabled = true;
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.configureSpeechRecognition();
        this.setupSpeechEventHandlers();
    }

    isSpeechRecognitionSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    configureSpeechRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = 'en-IN'; // English (India) for better transliteration
    }

    setupSpeechEventHandlers() {
        this.recognition.onstart = () => this.handleRecognitionStart();
        this.recognition.onend = () => this.handleRecognitionEnd();
        this.recognition.onerror = (event) => this.handleRecognitionError(event.error);
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
    }

    handleRecognitionStart() {
        this.isListening = true;
        this.lastRecognitionTime = Date.now();
        this.updateStatus(MESSAGES.LISTENING);
        this.updateButtonStates(true);
        this.setRecognitionTimeout();
    }

    handleRecognitionEnd() {
        this.clearRecognitionTimeout();

        if (this.isListening && this.sessionActive) {
            setTimeout(() => {
                if (this.isListening && this.sessionActive) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.log('Recognition restart failed:', e);
                        this.handleRecognitionError('restart_failed');
                    }
                }
            }, JAPA_CONFIG.AUTO_RESTART_DELAY);
        }
    }

    handleRecognitionResult(event) {
        this.clearRecognitionTimeout();
        this.lastRecognitionTime = Date.now();

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (interimTranscript) {
            this.updateStatus(`सुना गया: "${interimTranscript.trim()}" (${MESSAGES.PROCESSING})`);
        }

        if (finalTranscript.trim()) {
            this.processTranscript(finalTranscript.trim());
        }

        this.setRecognitionTimeout();
    }

    handleRecognitionError(error) {
        this.consecutiveFailures++;
        
        const errorMessages = {
            'no-speech': this.consecutiveFailures < 3 ? 'कुछ सुनाई नहीं दिया, फिर से बोलें' : 'कई बार कुछ नहीं सुना। माइक की जांच करें',
            'audio-capture': 'माइक्रोफोन एक्सेस नहीं मिला',
            'not-allowed': 'माइक्रोफोन की अनुमति नहीं दी गई',
            'network': 'नेटवर्क त्रुटि, कनेक्शन जांचें',
            'service-not-allowed': 'वॉइस सेवा उपलब्ध नहीं',
            'default': `आवाज़ पहचानने में समस्या: ${error}`
        };

        this.updateStatus(errorMessages[error] || errorMessages.default);

        if (['audio-capture', 'not-allowed', 'service-not-allowed'].includes(error)) {
            this.stopJapaSession();
        }

        if (this.consecutiveFailures >= JAPA_CONFIG.MAX_CONSECUTIVE_FAILURES) {
            this.updateStatus('बहुत सारी त्रुटियां। कृपया माइक और इंटरनेट जांचें');
            this.stopJapaSession();
        }
    }

    setRecognitionTimeout() {
        this.clearRecognitionTimeout();
        this.recognitionTimeout = setTimeout(() => {
            if (this.isListening) {
                this.updateStatus(MESSAGES.RECOGNITION_RESTARTING);
                try {
                    this.recognition.stop();
                } catch (e) {
                    console.log('Error stopping recognition:', e);
                }
            }
        }, JAPA_CONFIG.RECOGNITION_TIMEOUT);
    }

    clearRecognitionTimeout() {
        if (this.recognitionTimeout) {
            clearTimeout(this.recognitionTimeout);
            this.recognitionTimeout = null;
        }
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (e) {
                console.log('Recognition start failed:', e);
                this.updateStatus('वॉइस रिकग्निशन शुरू नहीं हो सका');
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.isListening = false;
            this.clearRecognitionTimeout();

            try {
                this.recognition.stop();
            } catch (e) {
                console.log('Recognition stop failed:', e);
            }

            this.updateStatus('जप रोका गया');
            this.updateButtonStates(false);
        }
    }

    // --------------------------------------------------------------------------
    // WORD PROCESSING
    // --------------------------------------------------------------------------

    async processTranscript(transcript) {
        const cleanedWord = transcript.toLowerCase().trim();
        this.updateStatus(`प्रसंस्करण: "${cleanedWord}"`);

        try {
            const response = await fetch('/api/japa/update_count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: cleanedWord })
            });

            const data = await response.json();

            if (data.success) {
                if (data.matched) {
                    this.handleWordMatch(data);
                } else {
                    this.handleWordMismatch(data);
                }
            } else {
                console.error('API Error:', data.error);
                this.updateStatus('सर्वर त्रुटि। फिर से कोशिश करें');
            }
        } catch (error) {
            console.error('Error processing transcript:', error);
            this.updateStatus('शब्द प्रसंस्करण में त्रुटि');
        }
    }

    handleWordMatch(data) {
        this.consecutiveFailures = 0;
        this.sessionCount = data.new_count;
        this.currentWordIndex = data.current_word_index;

        const successMessage = this.createSuccessMessage(data);
        this.showRecognitionFeedback(successMessage, true);
        this.animateCounterUpdate();

        if (data.completed_round) {
            this.showRoundCompletion();
            this.updateStats();
        }

        this.updateDisplay();
        this.updateStatusForNextWord(data.next_word);
    }

    handleWordMismatch(data) {
        const expected = data.expected_word;
        const similarity = (data.similarity_score * 100).toFixed(0);

        let errorMessage = `गलत शब्द: "${data.recognized_word}" | अपेक्षित: "${expected.word_english}"`;
        
        if (expected.repetition_info) {
            const [current, total] = expected.repetition_info.split('/');
            if (parseInt(total) > 1) {
                errorMessage += ` (${total} बार में से ${current} बार)`;
            }
        }
        
        errorMessage += ` (समानता: ${similarity}%)`;
        this.showRecognitionFeedback(errorMessage, false);

        const statusMessage = this.createRetryMessage(expected);
        this.updateStatus(statusMessage);
    }

    createSuccessMessage(data) {
        let message = `सही! "${data.recognized_word}"`;
        
        if (data.next_word && data.next_word.repetition_info) {
            const [current, total] = data.next_word.repetition_info.split('/');
            const totalReps = parseInt(total);
            const currentRep = parseInt(current);
            
            if (totalReps > 1) {
                if (currentRep === 1) {
                    message += ` - अब "${data.next_word.word_english}" बोलें (${data.next_word.repetition_info})`;
                } else {
                    message += ` - फिर से "${data.next_word.word_english}" बोलें (${data.next_word.repetition_info})`;
                }
            } else {
                message += ` - अब "${data.next_word.word_english}" बोलें`;
            }
        }
        
        return message;
    }

    createRetryMessage(expected) {
        if (expected.repetition_info) {
            const [current, total] = expected.repetition_info.split('/');
            if (parseInt(total) > 1) {
                return `फिर से कोशिश करें। बोलें: "${expected.word_english}" (${total} बार में से ${current} बार)`;
            }
        }
        return `फिर से कोशिश करें। बोलें: "${expected.word_english}"`;
    }

    updateStatusForNextWord(nextWord) {
        if (!nextWord || !nextWord.repetition_info) {
            this.updateStatus('सुन रहा है... अगला शब्द बोलें');
            return;
        }

        const [current, total] = nextWord.repetition_info.split('/');
        const totalReps = parseInt(total);
        const currentRep = parseInt(current);

        let statusMessage;
        if (totalReps > 1) {
            if (currentRep === 1) {
                statusMessage = `सुन रहा है... "${nextWord.word_english}" बोलें (${total} बार में से ${current} बार)`;
            } else {
                statusMessage = `सुन रहा है... "${nextWord.word_english}" फिर से बोलें (${total} बार में से ${current} बार)`;
            }
        } else {
            statusMessage = `सुन रहा है... "${nextWord.word_english}" बोलें`;
        }

        this.updateStatus(statusMessage);
    }

    // --------------------------------------------------------------------------
    // UI UPDATES & ANIMATIONS
    // --------------------------------------------------------------------------

    updateDisplay() {
        this.updateCurrentWord();
        this.updateProgress();
        this.updateCounts();
        this.highlightCurrentWord();
        this.updateProgressRing();
    }

    updateCurrentWord() {
        if (this.mantraWords && this.currentWordIndex <= this.mantraWords.length) {
            const currentWord = this.mantraWords[this.currentWordIndex - 1];
            if (currentWord) {
                if (this.elements.expectedDevanagari) {
                    this.elements.expectedDevanagari.textContent = currentWord.word_devanagari;
                }
                if (this.elements.expectedEnglish) {
                    let englishText = `(${currentWord.word_english})`;
                    if (currentWord.repetition_number && currentWord.total_repetitions > 1) {
                        englishText += ` [${currentWord.repetition_number}/${currentWord.total_repetitions}]`;
                    }
                    this.elements.expectedEnglish.textContent = englishText;
                }
            }
        }
    }

    updateProgress() {
        if (this.elements.wordProgress) {
            this.elements.wordProgress.textContent = `${this.currentWordIndex}/${this.totalWordsInMantra}`;
        }
        if (this.elements.progressNumber) {
            this.elements.progressNumber.textContent = this.currentWordIndex;
        }
    }

    updateCounts() {
        this.updateCountWithAnimation(this.elements.sessionCount, this.sessionCount);
        this.updateCountWithAnimation(this.elements.dailyWords, this.dailyWords);
        this.updateCountWithAnimation(this.elements.dailyRounds, this.dailyRounds);
        this.updateCountWithAnimation(this.elements.lifetimeWords, this.lifetimeWords);
        this.updateCountWithAnimation(this.elements.lifetimeRounds, this.lifetimeRounds);
    }

    updateCountWithAnimation(element, newValue) {
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue !== newValue) {
            element.style.transform = 'scale(1.2)';
            element.style.color = '#4CAF50';
            element.textContent = newValue;

            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, JAPA_CONFIG.COUNT_ANIMATION_DURATION);
        }
    }

    highlightCurrentWord() {
        const mantraWords = document.querySelectorAll('.mantra-word');
        mantraWords.forEach((word, index) => {
            word.classList.toggle('current', (index + 1) === this.currentWordIndex);
        });
    }

    updateProgressRing() {
        if (this.elements.counterRing) {
            this.elements.counterRing.setAttribute('aria-valuenow', this.currentWordIndex);
            this.elements.counterRing.setAttribute('aria-valuemax', this.totalWordsInMantra);
        }
    }

    updateButtonStates(isListening) {
        if (isListening) {
            this.elements.startBtn.style.display = 'none';
            this.elements.stopBtn.style.display = 'inline-flex';
            this.elements.stopBtn?.classList.add('listening');
        } else {
            this.elements.startBtn.style.display = 'inline-flex';
            this.elements.stopBtn.style.display = 'none';
            this.elements.stopBtn?.classList.remove('listening');
        }
    }

    showRecognitionFeedback(message, isSuccess) {
        const feedback = this.elements.recognitionFeedback;
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `recognition-feedback ${isSuccess ? 'success' : 'error'}`;
            feedback.style.display = 'block';

            const duration = isSuccess ? JAPA_CONFIG.SUCCESS_FEEDBACK_DURATION : JAPA_CONFIG.ERROR_FEEDBACK_DURATION;
            setTimeout(() => {
                feedback.style.display = 'none';
            }, duration);
        }
    }

    showRoundCompletion() {
        this.elements.mantraBox?.classList.add('completed');
        this.updateStatus(`${MESSAGES.ROUND_COMPLETED} ${this.totalWordsInMantra} शब्द पूरे हुए`);

        if (this.elements.counterRing) {
            this.elements.counterRing.classList.add('celebration');
            setTimeout(() => {
                this.elements.counterRing?.classList.remove('celebration');
            }, JAPA_CONFIG.CELEBRATION_DURATION);
        }

        setTimeout(() => {
            this.elements.mantraBox?.classList.remove('completed');
        }, JAPA_CONFIG.CELEBRATION_DURATION + 1000);
    }

    animateCounterUpdate() {
        if (this.elements.counterRing) {
            this.elements.counterRing.classList.add('updated');
            setTimeout(() => {
                this.elements.counterRing?.classList.remove('updated');
            }, JAPA_CONFIG.UPDATE_ANIMATION_DURATION);
        }
    }

    updateStatus(message) {
        if (this.elements.voiceStatus) {
            this.elements.voiceStatus.textContent = message;
        }
    }

    // --------------------------------------------------------------------------
    // STATISTICS & DATA
    // --------------------------------------------------------------------------

    async updateStats() {
        try {
            const response = await fetch('/api/japa/get_stats');
            const data = await response.json();

            if (data.success) {
                this.dailyWords = data.data.today.words;
                this.dailyRounds = data.data.today.rounds;
                this.lifetimeWords = data.data.lifetime.words;
                this.lifetimeRounds = data.data.lifetime.rounds;

                if (data.data.pattern_info && data.data.pattern_info.total_utterances) {
                    this.totalWordsInMantra = data.data.pattern_info.total_utterances;
                }

                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // --------------------------------------------------------------------------
    // UTILITY METHODS
    // --------------------------------------------------------------------------

    getCurrentExpectedWord() {
        if (this.mantraWords && this.currentWordIndex <= this.mantraWords.length) {
            return this.mantraWords[this.currentWordIndex - 1];
        }
        return null;
    }

    getPronunciationHint(word) {
        const hints = {
            'radhe': 'राधे - "राधेय" या "राधा" की तरह बोलें',
            'krishna': 'कृष्णा - "कृष्ण" या "कन्हैया" की तरह बोलें',
            'shyam': 'श्याम - "श्यामा" या "श्याम सुंदर" की तरह बोलें',
            'shyama': 'श्यामा - "श्यामा" की तरह बोलें'
        };
        return hints[word.toLowerCase()] || `${word} - स्पष्ट उच्चारण करें`;
    }

    showPatternInfo() {
        if (this.mantraPattern) {
            console.log('Mantra Pattern:', this.mantraPattern);
            console.log('Current Position:', this.currentWordIndex);
            console.log('Total Utterances:', this.totalWordsInMantra);

            const currentWord = this.getCurrentExpectedWord();
            if (currentWord) {
                console.log('Current Word Info:', currentWord);
            }
        }
    }

    getRepetitionStatus(repetitionInfo) {
        if (!repetitionInfo) return '';

        const [current, total] = repetitionInfo.split('/').map(n => parseInt(n));

        if (total === 1) {
            return '';
        } else if (current === 1) {
            return `(${total} बार बोलना है - पहली बार)`;
        } else if (current === total) {
            return `(अंतिम बार - ${current}/${total})`;
        } else {
            return `(${current}/${total} बार)`;
        }
    }
}

// ==============================================================================
// APPLICATION INITIALIZATION
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.japaApp = new JapaApp();
        
        // Add debug command for development
        window.showPatternInfo = () => {
            if (window.japaApp) {
                window.japaApp.showPatternInfo();
            }
        };

        // Performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('Page Load Time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
                    }
                }, 0);
            });
        }
    } catch (error) {
        console.error('Failed to initialize Japa App:', error);
    }
