// Enhanced Japa Sadhana JavaScript with improved speech recognition
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
        this.consecutiveFailures = 0;

        // Load mantra words from page data
        const mantraWordsElement = document.getElementById('mantraWordsData');
        this.mantraWords = mantraWordsElement ? JSON.parse(mantraWordsElement.textContent) : [];
        this.totalWordsInMantra = this.mantraWords.length || 16;

        // Initialize elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            voiceStatus: document.getElementById('voiceStatus'),
            recognitionFeedback: document.getElementById('recognitionFeedback'),
            expectedWord: document.getElementById('expectedWord'),
            expectedDevanagari: document.getElementById('expectedDevanagari'),
            expectedEnglish: document.getElementById('expectedEnglish'),
            wordProgress: document.getElementById('wordProgress'),
            progressNumber: document.getElementById('progressNumber'),
            mantraBox: document.getElementById('mantraBox'),
            mantraText: document.getElementById('mantraText'),
            sessionCount: document.getElementById('sessionCount'),
            dailyWords: document.getElementById('dailyWords'),
            dailyRounds: document.getElementById('dailyRounds'),
            lifetimeWords: document.getElementById('lifetimeWords'),
            lifetimeRounds: document.getElementById('lifetimeRounds'),
            counterRing: document.getElementById('counterRing')
        };

        this.init();
    }

    init() {
        this.loadInitialData();
        this.setupEventListeners();
        this.initSpeechRecognition();
        this.updateDisplay();
    }

    loadInitialData() {
        // Get initial values from the page
        this.sessionCount = parseInt(this.elements.sessionCount?.textContent) || 0;
        this.dailyWords = parseInt(this.elements.dailyWords?.textContent) || 0;
        this.dailyRounds = parseInt(this.elements.dailyRounds?.textContent) || 0;
        this.lifetimeWords = parseInt(this.elements.lifetimeWords?.textContent) || 0;
        this.lifetimeRounds = parseInt(this.elements.lifetimeRounds?.textContent) || 0;
        this.currentWordIndex = parseInt(this.elements.progressNumber?.textContent) || 1;
    }

    setupEventListeners() {
        this.elements.startBtn?.addEventListener('click', () => this.startJapaSession());
        this.elements.stopBtn?.addEventListener('click', () => this.stopJapaSession());
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isListening) {
                e.preventDefault();
                this.startJapaSession();
            } else if (e.code === 'Escape' && this.isListening) {
                e.preventDefault();
                this.stopJapaSession();
            }
        });
    }

    async startJapaSession() {
        try {
            this.updateStatus('🔄 सत्र प्रारंभ हो रहा है...');
            
            // Start backend session
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
                this.updateStatus('❌ सत्र शुरू नहीं हो सका: ' + data.error);
            }
        } catch (error) {
            console.error('Error starting session:', error);
            this.updateStatus('❌ सत्र शुरू करने में त्रुटि');
        }
    }

    async stopJapaSession() {
        try {
            this.stopListening();

            // End backend session
            const response = await fetch('/api/japa/end_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            this.sessionActive = false;
            this.updateStatus('✅ जप सत्र समाप्त');
            this.consecutiveFailures = 0;
            
            // Update stats after ending session
            await this.updateStats();
        } catch (error) {
            console.error('Error ending session:', error);
            this.updateStatus('❌ सत्र समाप्त करने में त्रुटि');
        }
    }

    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.updateStatus('❌ आपका ब्राउज़र वॉइस रिकग्निशन सपोर्ट नहीं करता');
            this.elements.startBtn.disabled = true;
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Enhanced recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        
        // Try multiple language settings for better recognition
        this.recognition.lang = 'en-IN'; // English (India) often works better for transliterated words
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.lastRecognitionTime = Date.now();
            this.updateStatus('🎤 सुन रहा है... अपेक्षित शब्द बोलें');
            this.elements.startBtn.style.display = 'none';
            this.elements.stopBtn.style.display = 'inline-flex';
            this.elements.stopBtn.classList.add('listening');
            
            // Set a timeout to restart recognition if it stops unexpectedly
            this.setRecognitionTimeout();
        };

        this.recognition.onend = () => {
            this.clearRecognitionTimeout();
            
            if (this.isListening && this.sessionActive) {
                // Auto-restart recognition with a short delay
                setTimeout(() => {
                    if (this.isListening && this.sessionActive) {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            console.log('Recognition restart failed:', e);
                            this.handleRecognitionError('restart_failed');
                        }
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

            // Show interim results for better UX
            if (interimTranscript) {
                this.updateStatus(`🎤 सुना गया: "${interimTranscript.trim()}" (प्रसंस्करण...)`);
            }

            // Process final results
            if (finalTranscript.trim()) {
                this.processTranscript(finalTranscript.trim());
            }

            // Reset timeout
            this.setRecognitionTimeout();
        };
    }

    setRecognitionTimeout() {
        this.clearRecognitionTimeout();
        this.recognitionTimeout = setTimeout(() => {
            if (this.isListening) {
                this.updateStatus('🔄 फिर से सुनने की कोशिश कर रहा है...');
                try {
                    this.recognition.stop();
                } catch (e) {
                    console.log('Error stopping recognition:', e);
                }
            }
        }, 10000); // 10 second timeout
    }

    clearRecognitionTimeout() {
        if (this.recognitionTimeout) {
            clearTimeout(this.recognitionTimeout);
            this.recognitionTimeout = null;
        }
    }

    handleRecognitionError(error) {
        this.consecutiveFailures++;
        
        switch (error) {
            case 'no-speech':
                if (this.consecutiveFailures < 3) {
                    this.updateStatus('🔇 कुछ सुनाई नहीं दिया, फिर से बोलें');
                } else {
                    this.updateStatus('🔇 कई बार कुछ नहीं सुना। माइक की जांच करें');
                }
                break;
            case 'audio-capture':
                this.updateStatus('❌ माइक्रोफोन एक्सेस नहीं मिला');
                this.stopJapaSession();
                break;
            case 'not-allowed':
                this.updateStatus('❌ माइक्रोफोन की अनुमति नहीं दी गई');
                this.stopJapaSession();
                break;
            case 'network':
                this.updateStatus('❌ नेटवर्क त्रुटि, कनेक्शन जांचें');
                break;
            case 'service-not-allowed':
                this.updateStatus('❌ वॉइस सर्विस उपलब्ध नहीं');
                this.stopJapaSession();
                break;
            default:
                this.updateStatus(`❌ आवाज़ पहचानने में समस्या: ${error}`);
        }

        // If too many failures, suggest troubleshooting
        if (this.consecutiveFailures >= 5) {
            this.updateStatus('❌ बहुत सारी त्रुटियां। कृपया माइक और इंटरनेट जांचें');
            this.stopJapaSession();
        }
    }

    async processTranscript(transcript) {
        const cleanedWord = transcript.toLowerCase().trim();
        this.updateStatus(`🔄 प्रसंस्करण: "${cleanedWord}"`);

        try {
            const response = await fetch('/api/japa/update_count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: cleanedWord })
            });

            const data = await response.json();

            if (data.success) {
                if (data.matched) {
                    // Word matched successfully
                    this.consecutiveFailures = 0;
                    this.sessionCount = data.new_count;
                    this.currentWordIndex = data.current_word_index;

                    this.showRecognitionFeedback(`✅ सही! "${data.recognized_word}"`, true);
                    this.animateCounterUpdate();

                    if (data.completed_round) {
                        this.showRoundCompletion();
                        await this.updateStats();
                    }

                    this.updateDisplay();
                    this.updateStatus('🎤 बहुत अच्छे! अगला शब्द बोलें');
                } else {
                    // Word didn't match
                    const expected = data.expected_word;
                    const similarity = (data.similarity_score * 100).toFixed(0);
                    
                    this.showRecognitionFeedback(
                        `❌ गलत शब्द: "${data.recognized_word}" | अपेक्षित: "${expected.word_english}" (समानता: ${similarity}%)`,
                        false
                    );
                    
                    this.updateStatus(`🎤 फिर से कोशिश करें। बोलें: "${expected.word_english}"`);
                }
            } else {
                console.error('API Error:', data.error);
                this.updateStatus('❌ सर्वर त्रुटि। फिर से कोशिश करें');
            }
        } catch (error) {
            console.error('Error processing transcript:', error);
            this.updateStatus('❌ शब्द प्रसंस्करण में त्रुटि');
        }
    }

    showRecognitionFeedback(message, isSuccess) {
        const feedback = this.elements.recognitionFeedback;
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `recognition-feedback ${isSuccess ? 'success' : 'error'}`;
            feedback.style.display = 'block';

            // Auto-hide after delay
            setTimeout(() => {
                feedback.style.display = 'none';
            }, isSuccess ? 2000 : 4000);
        }
    }

    showRoundCompletion() {
        // Visual feedback for completing a full round
        this.elements.mantraBox?.classList.add('completed');
        this.updateStatus('🎉 एक राउंड पूरा! ' + this.totalWordsInMantra + ' शब्द पूरे हुए');

        // Add celebration animation
        if (this.elements.counterRing) {
            this.elements.counterRing.classList.add('celebration');
            setTimeout(() => {
                this.elements.counterRing?.classList.remove('celebration');
            }, 2000);
        }

        setTimeout(() => {
            this.elements.mantraBox?.classList.remove('completed');
        }, 3000);
    }

    animateCounterUpdate() {
        if (this.elements.counterRing) {
            this.elements.counterRing.classList.add('updated');
            setTimeout(() => {
                this.elements.counterRing?.classList.remove('updated');
            }, 600);
        }
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
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateDisplay() {
        // Update current expected word
        if (this.mantraWords && this.currentWordIndex <= this.mantraWords.length) {
            const currentWord = this.mantraWords[this.currentWordIndex - 1];
            if (currentWord) {
                if (this.elements.expectedDevanagari) {
                    this.elements.expectedDevanagari.textContent = currentWord.word_devanagari;
                }
                if (this.elements.expectedEnglish) {
                    this.elements.expectedEnglish.textContent = `(${currentWord.word_english})`;
                }
            }
        }

        // Update progress
        if (this.elements.wordProgress) {
            this.elements.wordProgress.textContent = `${this.currentWordIndex}/${this.totalWordsInMantra}`;
        }
        if (this.elements.progressNumber) {
            this.elements.progressNumber.textContent = this.currentWordIndex;
        }

        // Update counts with animation
        this.updateCountWithAnimation(this.elements.sessionCount, this.sessionCount);
        this.updateCountWithAnimation(this.elements.dailyWords, this.dailyWords);
        this.updateCountWithAnimation(this.elements.dailyRounds, this.dailyRounds);
        this.updateCountWithAnimation(this.elements.lifetimeWords, this.lifetimeWords);
        this.updateCountWithAnimation(this.elements.lifetimeRounds, this.lifetimeRounds);

        // Highlight current word in mantra
        this.highlightCurrentWord();
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
                this.updateStatus('❌ वॉइस रिकग्निशन शुरू नहीं हो सका');
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

            this.updateStatus('⏹ जप रोका गया');
            this.elements.startBtn.style.display = 'inline-flex';
            this.elements.stopBtn.style.display = 'none';
            this.elements.stopBtn?.classList.remove('listening');
        }
    }

    // Utility method to get current expected word
    getCurrentExpectedWord() {
        if (this.mantraWords && this.currentWordIndex <= this.mantraWords.length) {
            return this.mantraWords[this.currentWordIndex - 1];
        }
        return null;
    }

    // Method to provide pronunciation hints
    getPronunciationHint(word) {
        const hints = {
            'radhe': 'राधे - "राधेय" या "राधा" की तरह बोलें',
            'krishna': 'कृष्णा - "कृष्ण" या "कन्हैया" की तरह बोलें',
            'shyam': 'श्याम - "श्यामा" या "श्याम सुंदर" की तरह बोलें',
            'shama': 'शामा - "श्यामा" की तरह बोलें'
        };
        return hints[word.toLowerCase()] || `${word} - स्पष्ट उच्चारण करें`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.japaApp = new JapaApp();
    
    // Add helpful tips on load
    setTimeout(() => {
        if (window.japaApp && !window.japaApp.sessionActive) {
            window.japaApp.updateStatus('💡 टिप: स्पेसबार दबाकर जप शुरू करें, Escape से रोकें');
        }
    }, 2000);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.japaApp) {
        window.japaApp.stopListening();
    }
});

// Handle before page unload
window.addEventListener('beforeunload', (e) => {
    if (window.japaApp && window.japaApp.isListening) {
        window.japaApp.stopJapaSession();
        e.preventDefault();
        e.returnValue = 'जप सत्र चल रहा है। क्या आप वाकई पेज छोड़ना चाहते हैं?';
    }
});

// Handle connection issues
window.addEventListener('online', () => {
    if (window.japaApp) {
        window.japaApp.updateStatus('🟢 इंटरनेट कनेक्शन वापस आ गया');
    }
});

window.addEventListener('offline', () => {
    if (window.japaApp) {
        window.japaApp.updateStatus('🔴 इंटरनेट कनेक्शन बंद है');
        window.japaApp.stopJapaSession();
    }
});
