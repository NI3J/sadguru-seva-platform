// Japa Sadhana JavaScript - Updated for pymysql compatibility
class JapaApp {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentWordIndex = 1;
        this.sessionCount = 0;
        this.dailyWords = 0;
        this.dailyRounds = 0;
        this.sessionActive = false;
        
        // Load mantra words from page data
        const mantraWordsElement = document.getElementById('mantraWordsData');
        this.mantraWords = mantraWordsElement ? JSON.parse(mantraWordsElement.textContent) : [];
        
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
            dailyRounds: document.getElementById('dailyRounds')
        };
        
        this.init();
    }
    
    init() {
        this.loadInitialData();
        this.setupEventListeners();
        this.initSpeechRecognition();
    }
    
    loadInitialData() {
        // Get initial values from the page
        this.sessionCount = parseInt(this.elements.sessionCount?.textContent) || 0;
        this.dailyWords = parseInt(this.elements.dailyWords?.textContent) || 0;
        this.dailyRounds = parseInt(this.elements.dailyRounds?.textContent) || 0;
        this.currentWordIndex = parseInt(this.elements.progressNumber?.textContent) || 1;
        
        this.updateDisplay();
    }
    
    setupEventListeners() {
        this.elements.startBtn?.addEventListener('click', () => this.startJapaSession());
        this.elements.stopBtn?.addEventListener('click', () => this.stopJapaSession());
    }
    
    async startJapaSession() {
        try {
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
            await fetch('/api/japa/end_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            this.sessionActive = false;
            this.updateStatus('✅ जप सत्र समाप्त');
        } catch (error) {
            console.error('Error ending session:', error);
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
        
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'hi-IN';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('🎤 सुन रहा है... अपेक्षित शब्द बोलें');
            this.elements.startBtn.style.display = 'none';
            this.elements.stopBtn.style.display = 'inline-flex';
        };
        
        this.recognition.onend = () => {
            if (this.isListening && this.sessionActive) {
                setTimeout(() => {
                    if (this.isListening) {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            console.log('Recognition restart failed:', e);
                        }
                    }
                }, 100);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.log('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                this.updateStatus('🔇 कुछ सुनाई नहीं दिया, फिर से बोलें');
            } else if (event.error === 'audio-capture') {
                this.updateStatus('❌ माइक्रोफोन एक्सेस नहीं मिला');
            } else if (event.error === 'not-allowed') {
                this.updateStatus('❌ माइक्रोफोन की अनुमति नहीं दी गई');
            } else {
                this.updateStatus('❌ आवाज़ पहचानने में समस्या');
            }
        };
        
        this.recognition.onresult = (event) => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.trim();
            const confidence = event.results[lastResultIndex][0].confidence;
            
            console.log('Recognized:', transcript, 'Confidence:', confidence);
            this.processTranscript(transcript);
        };
    }
    
    async processTranscript(transcript) {
        const cleanedWord = transcript.toLowerCase().trim();
        
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
                    this.sessionCount = data.new_count;
                    this.currentWordIndex = data.current_word_index;
                    
                    this.showRecognitionFeedback(`✅ सही! "${data.recognized_word}"`, true);
                    
                    if (data.completed_round) {
                        this.showRoundCompletion();
                        await this.updateStats();
                    }
                    
                    this.updateDisplay();
                } else {
                    // Word didn't match
                    const expected = data.expected_word;
                    this.showRecognitionFeedback(
                        `❌ गलत शब्द: "${data.recognized_word}" | अपेक्षित: "${expected.word_devanagari}" (${expected.word_english})`, 
                        false
                    );
                }
            } else {
                console.error('API Error:', data.error);
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
            
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }
    }
    
    showRoundCompletion() {
        // Visual feedback for completing 16 words
        this.elements.mantraBox?.classList.add('completed');
        this.updateStatus('🎉 एक राउंड पूरा! 16 शब्द पूरे हुए');
        
        setTimeout(() => {
            this.elements.mantraBox?.classList.remove('completed');
        }, 2000);
    }
    
    async updateStats() {
        try {
            const response = await fetch('/api/japa/get_stats');
            const data = await response.json();
            
            if (data.success) {
                this.dailyWords = data.daily_words;
                this.dailyRounds = data.daily_rounds;
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
            if (this.elements.expectedDevanagari) {
                this.elements.expectedDevanagari.textContent = currentWord.word_devanagari;
            }
            if (this.elements.expectedEnglish) {
                this.elements.expectedEnglish.textContent = `(${currentWord.word_english})`;
            }
        }
        
        // Update progress
        if (this.elements.wordProgress) {
            this.elements.wordProgress.textContent = `${this.currentWordIndex}/16`;
        }
        if (this.elements.progressNumber) {
            this.elements.progressNumber.textContent = this.currentWordIndex;
        }
        
        // Update counts
        if (this.elements.sessionCount) {
            this.elements.sessionCount.textContent = this.sessionCount;
        }
        if (this.elements.dailyWords) {
            this.elements.dailyWords.textContent = this.dailyWords;
        }
        if (this.elements.dailyRounds) {
            this.elements.dailyRounds.textContent = this.dailyRounds;
        }
        
        // Highlight current word in mantra
        this.highlightCurrentWord();
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
            this.recognition.stop();
            
            this.updateStatus('⏹ जप रोका गया');
            this.elements.startBtn.style.display = 'inline-flex';
            this.elements.stopBtn.style.display = 'none';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.japaApp = new JapaApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.japaApp) {
        window.japaApp.stopListening();
    }
});

// Handle before page unload
window.addEventListener('beforeunload', () => {
    if (window.japaApp && window.japaApp.isListening) {
        window.japaApp.stopJapaSession();
    }
});
