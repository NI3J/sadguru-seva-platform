class JapaApp {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.wordCount = 0;
        this.totalCount = parseInt(document.getElementById('currentCount').textContent) || 0;
        this.totalRounds = parseInt(document.getElementById('totalRounds').textContent) || 0;
        this.targetWords = 16;

        // 🌼 Mantra patterns (regex for phonetic flexibility)
        this.wordPatterns = [
            /राधे|radhe|राधी|radhi|ऱाधे/gi,
            /कृष्णा|krishna|कृष्ण/gi,
            /शाम|shaam|shyam|श्याम/gi,
            /शामा|shama|shyama|श्यामा/gi
        ];
        this.mantraWords = ['राधे', 'कृष्णा', 'शाम', 'शामा'];

        // 🌿 Debounce tracking
        this.lastMatchedWord = '';
        this.lastMatchTime = 0;
        this.matchCooldown = 1000; // 1 second

        // 🌿 UI Elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            voiceStatus: document.getElementById('voiceStatus'),
            wordCount: document.getElementById('wordCount'),
            wordProgress: document.getElementById('wordProgress'),
            mantraBox: document.getElementById('mantraBox'),
            mantraText: document.getElementById('mantraText'),
            currentCount: document.getElementById('currentCount'),
            totalRounds: document.getElementById('totalRounds'),
            counterRing: document.querySelector('.counter-ring')
        };

        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupEventListeners();
        this.initSpeechRecognition();
    }

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startListening());
        this.elements.stopBtn.addEventListener('click', () => this.stopListening());
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.updateStatus('❌ आपका ब्राउज़र वॉइस रिकग्निशन सपोर्ट नहीं करता');
            this.elements.startBtn.disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'hi-IN';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('🎤 सुन रहा है... जप करें');
            this.elements.startBtn.style.display = 'none';
            this.elements.stopBtn.style.display = 'inline-flex';
            this.elements.startBtn.classList.add('listening');
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                setTimeout(() => {
                    try { this.recognition.start(); } catch (e) { console.log('Restart failed:', e); }
                }, 100);
            }
        };

        this.recognition.onerror = (event) => {
            const messages = {
                'no-speech': '🔇 कुछ सुनाई नहीं दिया, फिर से बोलें',
                'audio-capture': '❌ माइक्रोफोन एक्सेस नहीं मिला',
            };
            this.updateStatus(messages[event.error] || '❌ आवाज़ पहचानने में समस्या');
        };

        this.recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript.trim().toLowerCase();
                this.elements.voiceStatus.textContent = `🗣 सुना गया: ${transcript}`;
                this.processTranscript(transcript);
            }
        };
    }

    processTranscript(transcript) {
        const now = Date.now();
        const matchedWords = this.extractMatchedWords(transcript);
        let validCount = 0;

        matchedWords.forEach(word => {
            if (this.shouldCountWord(word, now)) {
                this.incrementWordCount();
                this.lastMatchedWord = word;
                this.lastMatchTime = now;
                validCount++;
            }
        });

        if (validCount > 0) {
            this.updateStatus(`✅ पहचाने गए शब्द: ${validCount} / ${this.targetWords}`);
        } else {
            this.updateStatus('🔍 जप शब्द नहीं पहचाना गया');
        }
    }

    extractMatchedWords(transcript) {
        const matched = [];
        this.wordPatterns.forEach((pattern, index) => {
            const matches = transcript.match(pattern);
            if (matches) matched.push(this.mantraWords[index]);
        });
        return [...new Set(matched)];
    }

    shouldCountWord(word, now) {
        return word !== this.lastMatchedWord || (now - this.lastMatchTime > this.matchCooldown);
    }

    incrementWordCount() {
        this.wordCount++;
        this.totalCount++;

        this.updateDisplay();
        this.elements.counterRing.classList.add('updated');
        setTimeout(() => {
            this.elements.counterRing.classList.remove('updated');
        }, 600);

        if (this.wordCount >= this.targetWords) {
            this.completeMantraRound();
        }

        this.saveProgress();
    }

    completeMantraRound() {
        this.wordCount = 0;
        this.totalRounds++;

        this.elements.mantraBox.classList.add('completed');
        this.elements.mantraText.classList.add('vanishing');
        this.updateStatus('🎉 मंत्र पूरा! 16 शब्द पूरे हुए');

        setTimeout(() => {
            this.elements.mantraText.classList.remove('vanishing');
            this.elements.mantraBox.classList.remove('completed');
            this.updateDisplay();
        }, 1000);
    }

    updateDisplay() {
        this.elements.wordCount.textContent = this.wordCount;
        this.elements.wordProgress.textContent = `${this.wordCount}/16`;
        this.elements.currentCount.textContent = this.totalCount;
        this.elements.totalRounds.textContent = this.totalRounds;
    }

    updateStatus(message) {
        this.elements.voiceStatus.textContent = message;
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (e) {
                console.log('Recognition start failed:', e);
                this.updateStatus('❌ वॉइस रिकग्निशन शुरू नहीं हो सका');
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.isListening = false;
            this.recognition.stop();
            this.updateStatus('⏹ जप रोका गया');
            this.elements.startBtn.style.display = 'inline-flex';
            this.elements.stopBtn.style.display = 'none';
            this.elements.startBtn.classList.remove('listening');
        }
    }

    async saveProgress() {
        try {
            const response = await fetch('/api/japa/update-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    count: this.totalCount,
                    rounds: this.totalRounds
                })
            });
            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save progress:', data.error);
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    async loadProgress() {
        try {
            const response = await fetch('/api/japa/get-stats');
            const data = await response.json();
            if (data.success) {
                this.totalCount = data.today.count;
                this.totalRounds = data.today.rounds;
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
}

// 🌿 Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.japaApp = new JapaApp();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.japaApp) {
        window.japaApp.stopListening();
    }
});

window.addEventListener('beforeunload', () => {
    if (window.japaApp && window.japaApp.isListening) {
        window.japaApp.stopListening();
    }
});
