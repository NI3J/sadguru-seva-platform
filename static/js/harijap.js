class HariJapCounter {
    constructor() {
        // Enhanced configuration options
        this.config = {
            targetPhrases: [
                'जय जय राम कृष्णा हारी',
                'जय जय राम कृष्ण हारी',
                'जय जय राम कृष्णा हरी',
                'जय जय राम कृष्णो हारी',
                'jai jai ram krishna hari',
                'jai jai ram krishna haari'
            ],
            wordsPerPronunciation: 5,
            pronunciationsPerMala: 108,
            recognitionLang: 'hi-IN',
            minTimeBetweenCounts: 800,
            autoSaveInterval: 10000,
            syncInterval: 30000,
            milestones: [10, 21, 51, 108, 1008]
        };

        // Enhanced state management
        this.state = {
            totalWords: 0,
            totalPronunciations: 0,
            currentMalaPronunciations: 0,
            totalMalas: 0,
            isInitialized: false,
            isListening: false,
            isSaving: false,
            userName: '',
            userId: null,
            sessionStartTime: Date.now(),
            lastRecognitionTime: 0
        };

        // Enhanced metrics tracking
        this.metrics = {
            recognitionSuccesses: 0,
            recognitionAttempts: 0,
            totalSessionTime: 0
        };

        // Initialize the application
        this.init();
    }

    async init() {
        try {
            console.log('🙏 Initializing Hari Jap Counter...');
            await this.authenticateUser();
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

    // Enhanced speech recognition handling
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
            console.log(`🎤 Alt ${i + 1}: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);

            const count = this.countMantraRepetitions(transcript);
            if (count > 0) {
                matchCount = count;
                bestTranscript = transcript;
                console.log(`✅ MATCH: ${count} repetitions in alt ${i + 1}`);
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

    // Enhanced UI updates
    updateUI() {
        this.updateCountDisplay();
        this.updateMalaStatus();
        this.updateProgress();
        this.updateListeningStatus();
        this.updateButtons();
        this.updateSessionStats();
    }

    // Enhanced milestone celebrations
    checkMilestones() {
        if (this.config.milestones.includes(this.state.totalMalas)) {
            this.triggerMilestoneCelebration(this.state.totalMalas);
        }
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

    // Enhanced data persistence
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
                totalPronunciations: this.state.totalPronunciations
            };

            console.log('💾 Saving to server:', payload);
            const response = await fetch('/harijap/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
}

// Enhanced global styles
const style = document.createElement('style');
style.textContent = `
    /* Animations */
    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    @keyframes confetti-fall {
        to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
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

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🙏 Initializing Hari Jap Counter Application');
    window.hariJapCounter = new HariJapCounter();
});
