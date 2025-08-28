class JapaApp {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentWordIndex = 1;
        this.sessionCount = 0;
        this.dailyWords = 0;
        this.dailyRounds = 0;
        this.lifetimeRounds = 0;
        this.lifetimeWords = 0;
        this.sessionActive = false;
        this.totalWordsInMantra = 16;
        this.recognitionTimeout = null;
        this.lastRecognitionTime = 0;
        this.lastDetectedTime = 0;
        this.COOLDOWN_MS = 1500;
        this.consecutiveFailures = 0;
        this.mantraPattern = null;

        const mantraWordsElement = document.getElementById('mantraWordsData');
        this.mantraWords = mantraWordsElement ? JSON.parse(mantraWordsElement.textContent) : [];
        this.totalWordsInMantra = this.mantraWords.length || 16;

        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            voiceStatus: document.getElementById('voiceStatus'),
            recognitionFeedback: document.getElementById('recognitionFeedback'),
            expectedDevanagari: document.getElementById('expectedDevanagari'),
            expectedEnglish: document.getElementById('expectedEnglish'),
            wordProgress: document.getElementById('wordProgress'),
            progressNumber: document.getElementById('progressNumber'),
            mantraBox: document.getElementById('mantraBox'),
            sessionCount: document.getElementById('sessionCount'),
            dailyWords: document.getElementById('dailyWords'),
            dailyRounds: document.getElementById('dailyRounds'),
            lifetimeWords: document.getElementById('lifetimeWords'),
            lifetimeRounds: document.getElementById('lifetimeRounds'),
            counterRing: document.getElementById('counterRing')
        };

        this.init();
    }

    async init() {
        this.loadInitialData();
        this.setupEventListeners();
        this.initSpeechRecognition();
        await this.loadMantraPattern();
        this.updateDisplay();
    }

    loadInitialData() {
        this.sessionCount = parseInt(this.elements.sessionCount?.textContent) || 0;
        this.dailyWords = parseInt(this.elements.dailyWords?.textContent) || 0;
        this.dailyRounds = parseInt(this.elements.dailyRounds?.textContent) || 0;
        this.lifetimeWords = parseInt(this.elements.lifetimeWords?.textContent) || 0;
        this.lifetimeRounds = parseInt(this.elements.lifetimeRounds?.textContent) || 0;
        this.currentWordIndex = parseInt(this.elements.progressNumber?.textContent) || 1;
    }

    async loadMantraPattern() {
        try {
            const response = await fetch('/api/japa/get_pattern');
            const data = await response.json();
            if (data.success) {
                this.mantraPattern = data.data.pattern;
                this.totalWordsInMantra = data.data.total_utterances;
            }
        } catch (error) {
            console.error('Error loading mantra pattern:', error);
            this.totalWordsInMantra = 16;
        }
    }

    async startJapaSession() {
        try {
            this.updateStatus('सत्र प्रारंभ हो रहा है...');
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
            await fetch('/api/japa/end_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            this.sessionActive = false;
            this.updateStatus('जप सत्र समाप्त');
            this.consecutiveFailures = 0;
            await this.updateStats();
        } catch (error) {
            console.error('Error ending session:', error);
            this.updateStatus('सत्र समाप्त करने में त्रुटि');
        }
    }
     initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.updateStatus('आपका ब्राउज़र वॉइस रिकग्निशन सपोर्ट नहीं करता');
            this.elements.startBtn.disabled = true;
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = 'en-IN';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.lastRecognitionTime = Date.now();
            this.updateStatus('सुन रहा है... अपेक्षित शब्द बोलें');
            this.elements.startBtn.style.display = 'none';
            this.elements.stopBtn.style.display = 'inline-flex';
            this.elements.stopBtn.classList.add('listening');
            this.setRecognitionTimeout();
        };

        this.recognition.onend = () => {
            this.clearRecognitionTimeout();
            if (this.isListening && this.sessionActive) {
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.log('Recognition restart failed:', e);
                        this.handleRecognitionError('restart_failed');
                    }
                }, 100);
            }
        };

        this.recognition.onerror = (event) => {
            console.log('Speech recognition error:', event.error);
            this.clearRecognitionTimeout();
            this.handleRecognitionError(event.error);
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript.trim()) {
                const now = Date.now();
                if (now - this.lastDetectedTime >= this.COOLDOWN_MS) {
                    this.lastDetectedTime = now;
                    this.processTranscript(finalTranscript.trim());
                } else {
                    console.log('Ignored due to cooldown:', finalTranscript.trim());
                }
            }

            this.setRecognitionTimeout();
        };
    }
        
    processTranscript(transcript) {
        const expectedWord = this.getCurrentExpectedWord();
        if (!expectedWord) return;

        const normalized = transcript.toLowerCase().trim();
        const expected = expectedWord.word_english.toLowerCase();

        if (normalized === expected) {
            this.currentWordIndex++;
            this.dailyWords++;
            this.lifetimeWords++;
            this.animateCounterUpdate();
            this.updateDisplay();

            if (this.currentWordIndex > this.totalWordsInMantra) {
                this.dailyRounds++;
                this.lifetimeRounds++;
                this.currentWordIndex = 1;
                this.elements.mantraBox?.classList.add('completed');
                setTimeout(() => {
                    this.elements.mantraBox?.classList.remove('completed');
                }, 3000);
            }

            this.showFeedback(`🙏 ${expectedWord.word_devanagari} सुना गया`);
        } else {
            this.consecutiveFailures++;
            this.showFeedback(`❌ "${transcript}" अपेक्षित नहीं था`);
        }
    }

    showFeedback(message) {
        if (this.elements.recognitionFeedback) {
            this.elements.recognitionFeedback.textContent = message;
            this.elements.recognitionFeedback.style.display = 'block';
            setTimeout(() => {
                this.elements.recognitionFeedback.style.display = 'none';
            }, 2000);
        }
    }

    setRecognitionTimeout() {
        this.clearRecognitionTimeout();
        this.recognitionTimeout = setTimeout(() => {
            if (this.recognition && this.isListening) {
                try {
                    this.recognition.stop();
                } catch (e) {
                    console.log('Timeout stop failed:', e);
                }
            }
        }, 10000);
    }

    clearRecognitionTimeout() {
        if (this.recognitionTimeout) {
            clearTimeout(this.recognitionTimeout);
            this.recognitionTimeout = null;
        }
    }

    handleRecognitionError(error) {
        this.updateStatus('रिकग्निशन त्रुटि: ' + error);
        this.stopListening();
    }
        async updateStats() {
        try {
            const response = await fetch('/api/japa/get_stats');
            const data = await response.json();
            if (data.success) {
                this.dailyWords = data.data.today.words;
                this.dailyRounds = data.data.today.rounds;
                this.lifetimeWords = data.data.lifetime.words;
                this.lifetimeRounds = data.data.lifetime.rounds;

                if (data.data.pattern_info?.total_utterances) {
                    this.totalWordsInMantra = data.data.pattern_info.total_utterances;
                }

                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateDisplay() {
        const currentWord = this.getCurrentExpectedWord();
        if (currentWord) {
            this.elements.expectedDevanagari.textContent = currentWord.word_devanagari;
            let englishText = `(${currentWord.word_english})`;
            if (currentWord.repetition_number && currentWord.total_repetitions > 1) {
                englishText += ` [${currentWord.repetition_number}/${currentWord.total_repetitions}]`;
            }
            this.elements.expectedEnglish.textContent = englishText;
        }

        this.elements.wordProgress.textContent = `${this.currentWordIndex}/${this.totalWordsInMantra}`;
        this.elements.progressNumber.textContent = this.currentWordIndex;

        this.updateCountWithAnimation(this.elements.sessionCount, this.sessionCount);
        this.updateCountWithAnimation(this.elements.dailyWords, this.dailyWords);
        this.updateCountWithAnimation(this.elements.dailyRounds, this.dailyRounds);
        this.updateCountWithAnimation(this.elements.lifetimeWords, this.lifetimeWords);
        this.updateCountWithAnimation(this.elements.lifetimeRounds, this.lifetimeRounds);

        this.highlightCurrentWord();

        if (this.elements.counterRing) {
            this.elements.counterRing.setAttribute('aria-valuenow', this.currentWordIndex);
            this.elements.counterRing.setAttribute('aria-valuemax', this.totalWordsInMantra);
        }
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
            }, 300);
        }
    }

    highlightCurrentWord() {
        const mantraWords = document.querySelectorAll('.mantra-word');
        mantraWords.forEach((word, index) => {
            word.classList.toggle('current', (index + 1) === this.currentWordIndex);
        });
    }

    animateCounterUpdate() {
        if (this.elements.counterRing) {
            this.elements.counterRing.classList.add('updated');
            setTimeout(() => {
                this.elements.counterRing.classList.remove('updated');
            }, 600);
        }
    }

    updateStatus(message) {
        if (this.elements.voiceStatus) {
            this.elements.voiceStatus.textContent = message;
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
            this.elements.startBtn.style.display = 'inline-flex';
            this.elements.stopBtn.style.display = 'none';
            this.elements.stopBtn.classList.remove('listening');
        }
    }

    getCurrentExpectedWord() {
        return this.mantraWords[this.currentWordIndex - 1] || null;
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

    getRepetitionStatus(repetitionInfo) {
        if (!repetitionInfo) return '';
        const [current, total] = repetitionInfo.split('/').map(n => parseInt(n));
        if (total === 1) return '';
        if (current === 1) return `(${total} बार बोलना है - पहली बार)`;
        if (current === total) return `(अंतिम बार - ${current}/${total})`;
        return `(${current}/${total} बार)`;
    }

    showPatternInfo() {
        console.log('Mantra Pattern:', this.mantraPattern);
        console.log('Current Position:', this.currentWordIndex);
        console.log('Total Utterances:', this.totalWordsInMantra);
        const currentWord = this.getCurrentExpectedWord();
        if (currentWord) console.log('Current Word Info:', currentWord);
    }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.japaApp = new JapaApp();
    setTimeout(() => {
        if (!window.japaApp.sessionActive) {
            window.japaApp.updateStatus('टिप: स्पेसबार दबाकर जप शुरू करें, Escape से रोकें');
        }
    }, 2000);
    window.showPatternInfo = () => window.japaApp?.showPatternInfo();
});

// Page Visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.japaApp?.stopListening();
});

// Before Unload
window.addEventListener('beforeunload', (e) => {
    if (window.japaApp?.isListening) {
        window.japaApp.stopJapaSession();
        e.preventDefault();
        e.returnValue = 'जप सत्र चल रहा है। क्या आप वाकई पेज छोड़ना चाहते हैं?';
    }
});

// Connection Awareness
window.addEventListener('online', () => {
    window.japaApp?.updateStatus('इंटरनेट कनेक्शन वापस आ गया');
});
window.addEventListener('offline', () => {
    window.japaApp?.updateStatus('इंटरनेट कनेक्शन बंद है');
    window.japaApp?.stopJapaSession();
});

// Performance Monitoring
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

