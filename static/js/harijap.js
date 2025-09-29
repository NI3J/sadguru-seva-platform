class HariJapCounter {
    constructor() {
        this.totalWords = 0;
        this.currentMalaPronunciations = 0;
        this.totalMalas = 0;
        this.totalPronunciations = 0;
        this.isListening = false;
        this.recognition = null;
        this.lastRecognitionTime = 0;
        
        this.config = {
            wordsPerPronunciation: 5,
            pronunciationsPerMala: 108,
            recognitionLang: 'hi-IN',
            minTimeBetweenCounts: 1500,
            autoSaveInterval: 10000,
            syncInterval: 30000
        };

        this.elements = {};
        this.state = {
            isInitialized: false,
            isSaving: false,
            userName: '',
            userId: null,
            sessionStartTime: Date.now()
        };

        this.performance = {
            recognitionSuccesses: 0,
            recognitionAttempts: 0
        };

        this.init();
    }

    async init() {
        try {
            console.log('🙏 Initializing Hari Jap Counter...');
            
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                console.log('Not authenticated, redirecting...');
                window.location.href = '/harijap/auth';
                return;
            }

            this.state.userName = authCheck.user_name || '🙏🏻';
            this.state.userId = authCheck.user_id;

            this.initializeElements();
            this.initializeSpeechRecognition();
            this.setupEventListeners();
            await this.loadStateFromServer();
            this.updateDisplay();
            this.startAutoSave();
            this.startServerSync();
            this.state.isInitialized = true;
            
            this.showNotification('जय श्री कृष्ण! काउंटर तैयार है।', 'success');
            
        } catch (error) {
            console.error('Error initializing:', error);
            this.showNotification('प्रारंभ करने में त्रुटि।', 'error');
        }
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/harijap/auth/check_session', {
                method: 'GET',
                credentials: 'same-origin'
            });
            return await response.json();
        } catch (error) {
            console.error('Authentication check failed:', error);
            return { authenticated: false };
        }
    }

    initializeElements() {
        const ids = ['countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration', 'userName',
            'logoutBtn', 'sessionTime', 'todayCount', 'accuracy'];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) this.elements[id] = el;
        });

        if (this.elements.userName && this.state.userName) {
            this.elements.userName.textContent = `🙏 ${this.state.userName}`;
        }
    }

    initializeSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || 
                                     window.webkitSpeechRecognition || 
                                     window.mozSpeechRecognition || 
                                     window.msSpeechRecognition;
            
            if (!SpeechRecognition) {
                throw new Error('Speech Recognition not available');
            }
            
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.recognitionLang;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 5;
            this.recognition.continuous = true;
            
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                this.recognition.continuous = false;
                console.log('Mobile browser - optimized recognition');
            }

            this.recognition.onresult = (e) => this.handleRecognitionResult(e);
            this.recognition.onend = () => this.handleRecognitionEnd();
            this.recognition.onerror = (e) => this.handleRecognitionError(e);
            this.recognition.onstart = () => console.log('Recognition started');
            
            console.log('Speech Recognition initialized');
        } catch (error) {
            console.error('Speech Recognition error:', error);
            this.showNotification('वॉइस पहचान उपलब्ध नहीं है।', 'error');
            this.recognition = null;
        }
    }

    setupEventListeners() {
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startRecognition());
        }
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => this.stopRecognition());
        }
        if (this.elements.manualBtn) {
            this.elements.manualBtn.addEventListener('click', () => this.manualCount());
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.confirmReset());
        }
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.logout());
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.stopRecognition();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveToServer(true);
        });
    }

    async loadStateFromServer() {
        try {
            const response = await fetch('/harijap/api/state', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.totalWords = data.count || 0;
                    this.totalPronunciations = Math.floor(this.totalWords / this.config.wordsPerPronunciation);
                    this.totalMalas = Math.floor(this.totalWords / (this.config.pronunciationsPerMala * this.config.wordsPerPronunciation));
                    this.currentMalaPronunciations = this.totalPronunciations % this.config.pronunciationsPerMala;
                    
                    console.log('State loaded:', {
                        totalWords: this.totalWords,
                        totalPronunciations: this.totalPronunciations,
                        currentMalaPronunciations: this.currentMalaPronunciations
                    });
                }
            }
        } catch (error) {
            console.error('Error loading from server:', error);
        }
    }

    updateDisplay() {
        if (this.elements.countDisplay) {
            const current = parseInt(this.elements.countDisplay.textContent);
            if (current !== this.totalWords) {
                this.elements.countDisplay.classList.add('pulse');
                this.elements.countDisplay.textContent = this.totalWords;
                setTimeout(() => this.elements.countDisplay.classList.remove('pulse'), 500);
            }
        }

        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = `कुल माला: ${this.totalMalas}`;
        }
        
        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent = `वर्तमान माला: ${this.currentMalaPronunciations} / ${this.config.pronunciationsPerMala}`;
        }
        
        if (this.elements.remainingCount) {
            const remaining = this.config.pronunciationsPerMala - this.currentMalaPronunciations;
            this.elements.remainingCount.textContent = `शेष: ${remaining} बार`;
        }

        if (this.elements.listeningStatus) {
            if (this.isListening) {
                this.elements.listeningStatus.textContent = '🎤 सुन रहा हूं...';
                this.elements.listeningStatus.classList.add('listening');
            } else {
                this.elements.listeningStatus.textContent = '🎤 माइक्रोफोन बंद है';
                this.elements.listeningStatus.classList.remove('listening');
            }
        }

        if (this.elements.progressFill) {
            const progress = (this.currentMalaPronunciations / this.config.pronunciationsPerMala) * 100;
            this.elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
        }

        if (this.elements.startBtn && this.elements.stopBtn) {
            this.elements.startBtn.disabled = this.isListening;
            this.elements.stopBtn.disabled = !this.isListening;
            
            if (this.isListening) {
                this.elements.startBtn.classList.add('active');
            } else {
                this.elements.startBtn.classList.remove('active');
            }
        }

        this.updateSessionStats();
    }

    updateSessionStats() {
        if (this.elements.sessionTime) {
            const minutes = Math.floor((Date.now() - this.state.sessionStartTime) / 60000);
            this.elements.sessionTime.textContent = `${minutes} मिनट`;
        }

        if (this.elements.todayCount) {
            this.elements.todayCount.textContent = this.totalWords;
        }

        if (this.elements.accuracy && this.performance.recognitionAttempts > 0) {
            const accuracy = Math.round((this.performance.recognitionSuccesses / this.performance.recognitionAttempts) * 100);
            this.elements.accuracy.textContent = `${accuracy}%`;
        }
    }

    startRecognition() {
        if (!this.recognition) {
            this.showNotification('वॉइस पहचान उपलब्ध नहीं है', 'error');
            return;
        }
        
        if (!this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                this.updateDisplay();
            } catch (error) {
                console.error('Start error:', error);
                if (error.message && error.message.includes('already started')) {
                    this.isListening = true;
                    this.updateDisplay();
                }
            }
        }
    }

    stopRecognition() {
        if (this.isListening && this.recognition) {
            try {
                this.recognition.stop();
                this.isListening = false;
                this.updateDisplay();
            } catch (error) {
                console.error('Stop error:', error);
                this.isListening = false;
                this.updateDisplay();
            }
        }
    }

    handleRecognitionResult(event) {
        const now = Date.now();
        
        if (now - this.lastRecognitionTime < this.config.minTimeBetweenCounts) {
            console.log('Duplicate - skipping');
            return;
        }

        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (!lastResult.isFinal) return;
        
        let recognized = false;
        let bestTranscript = '';
        
        for (let i = 0; i < lastResult.length; i++) {
            const transcript = lastResult[i].transcript;
            const confidence = lastResult[i].confidence;
            
            if (i === 0) bestTranscript = transcript;
            
            console.log(`Alt ${i + 1}: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
            
            if (this.isTargetPhrase(transcript)) {
                recognized = true;
                bestTranscript = transcript;
                console.log(`MATCH in alt ${i + 1}`);
                break;
            }
        }
        
        if (this.elements.recognitionText) {
            this.elements.recognitionText.textContent = bestTranscript;
        }
        
        this.performance.recognitionAttempts++;
        
        if (recognized) {
            this.performance.recognitionSuccesses++;
            this.lastRecognitionTime = now;
            this.incrementCount();
            this.showNotification('जप गिना गया!', 'success', 1000);
            this.triggerVisualFeedback();
        }
    }

    isTargetPhrase(text) {
        const normalized = text
            .toLowerCase()
            .replace(/[।,.!?]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        const exactMatches = [
            'जय जय राम कृष्णा हारी',
            'जय जय राम कृष्ण हरी',
            'जय जय राम कृष्णा हरि',
            'जय जय राम कृष्ण हारी',
            'jai jai ram krishna hari',
            'jai jai ram krishna haari'
        ];
        
        for (let phrase of exactMatches) {
            if (normalized === phrase.toLowerCase()) {
                console.log(`Exact match: "${phrase}"`);
                return true;
            }
        }
        
        for (let phrase of exactMatches) {
            if (normalized.includes(phrase.toLowerCase())) {
                console.log(`Contains: "${phrase}"`);
                return true;
            }
        }
        
        for (let phrase of exactMatches) {
            if (this.strictFuzzyMatch(normalized, phrase.toLowerCase())) {
                console.log(`Fuzzy match: "${phrase}"`);
                return true;
            }
        }
        
        console.log(`No match for: "${text}"`);
        return false;
    }

    strictFuzzyMatch(text, target) {
        const distance = this.levenshteinDistance(text, target);
        const wordMatch = text.split(' ').length === target.split(' ').length;
        return wordMatch && distance <= 2;
    }

    levenshteinDistance(str1, str2) {
        const m = [];
        for (let i = 0; i <= str2.length; i++) {
            m[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            m[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    m[i][j] = m[i - 1][j - 1];
                } else {
                    m[i][j] = Math.min(
                        m[i - 1][j - 1] + 1,
                        m[i][j - 1] + 1,
                        m[i - 1][j] + 1
                    );
                }
            }
        }
        return m[str2.length][str1.length];
    }

    incrementCount() {
        this.totalWords += this.config.wordsPerPronunciation;
        this.totalPronunciations++;
        this.currentMalaPronunciations++;
        
        if (this.currentMalaPronunciations >= this.config.pronunciationsPerMala) {
            this.currentMalaPronunciations = 0;
            setTimeout(() => this.completeMala(), 100);
        }
        
        this.updateDisplay();
        this.saveToServer();
        
        console.log(`Count: Words=${this.totalWords}, Pronunciations=${this.totalPronunciations}, Current=${this.currentMalaPronunciations}`);
    }

    completeMala() {
        this.totalMalas++;
        this.triggerMalaCelebration();
        this.checkMilestones();
        this.updateDisplay();
    }

    checkMilestones() {
        const milestones = [10, 21, 51, 108, 1008];
        if (milestones.includes(this.totalMalas)) {
            this.triggerSpecialCelebration(this.totalMalas);
        }
    }

    triggerVisualFeedback() {
        document.body.style.background = 'radial-gradient(ellipse at center, rgba(76, 175, 80, 0.2), transparent)';
        setTimeout(() => {
            document.body.style.background = '';
        }, 300);
    }

    triggerMalaCelebration() {
        this.showCelebration('🎉 माला पूर्ण हुई! 🎉', 'बहुत बढ़िया! जय श्री कृष्ण!');
        this.createConfetti();
    }

    triggerSpecialCelebration(malas) {
        const messages = {
            10: ['🌟 10 मालाएं पूर्ण! 🌟', 'अद्भुत प्रगति!'],
            21: ['✨ 21 मालाएं पूर्ण! ✨', 'शानदार समर्पण!'],
            51: ['🔥 51 मालाएं पूर्ण! 🔥', 'असाधारण उपलब्धि!'],
            108: ['🌺 108 मालाएं पूर्ण! 🌺', 'महान उपलब्धि!'],
            1008: ['👑 1008 मालाएं पूर्ण! 👑', 'परम आध्यात्मिक उपलब्धि!']
        };
        
        const [msg, sub] = messages[malas] || ['', ''];
        this.showCelebration(msg, sub, 5000);
    }

    showCelebration(message, subMessage = '', duration = 3000) {
        if (!this.elements.celebration) return;
        
        this.elements.celebration.innerHTML = `
            <div class="celebration-text">${message}</div>
            ${subMessage ? `<div class="celebration-subtext">${subMessage}</div>` : ''}
        `;
        
        this.elements.celebration.style.display = 'block';
        this.elements.celebration.classList.add('show');
        
        setTimeout(() => {
            this.elements.celebration.classList.remove('show');
            setTimeout(() => {
                this.elements.celebration.style.display = 'none';
            }, 500);
        }, duration);
    }

    createConfetti() {
        const colors = ['#ff6b35', '#ffd700', '#4caf50', '#2196f3', '#9c27b0'];
        for (let i = 0; i < 50; i++) {
            const conf = document.createElement('div');
            conf.style.cssText = `
                position:fixed;width:10px;height:10px;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                left:${Math.random() * 100}%;top:-10px;border-radius:50%;
                pointer-events:none;z-index:9999;
                animation:confetti-fall ${2 + Math.random() * 2}s ease-out;
            `;
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 4000);
        }
    }

    manualCount() {
        this.incrementCount();
        this.showNotification('जप मैन्युअल रूप से जोड़ा गया', 'success', 1000);
        this.triggerVisualFeedback();
    }

    confirmReset() {
        if (confirm('क्या आप काउंटर रीसेट करना चाहते हैं?')) {
            this.resetCounter();
        }
    }

    resetCounter() {
        this.totalWords = 0;
        this.totalPronunciations = 0;
        this.totalMalas = 0;
        this.currentMalaPronunciations = 0;
        this.updateDisplay();
        this.saveToServer();
        this.showNotification('काउंटर रीसेट हो गया', 'info');
    }

    async logout() {
        try {
            await this.saveToServer(true);
            await fetch('/harijap/auth/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });
            window.location.href = '/harijap/auth';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/harijap/auth';
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notif = document.createElement('div');
        const bgColors = {
            success: 'linear-gradient(135deg, #4caf50, #66bb6a)',
            error: 'linear-gradient(135deg, #f44336, #ef5350)',
            info: 'linear-gradient(135deg, #2196f3, #42a5f5)'
        };
        
        notif.style.cssText = `
            position:fixed;top:20px;right:20px;padding:12px 16px;
            background:${bgColors[type]};color:white;border-radius:8px;
            box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;
            animation:slide-in 0.3s ease-out;font-size:0.9rem;
            max-width:300px;word-wrap:break-word;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => notif.remove(), 300);
        }, duration);
    }

    handleRecognitionEnd() {
        console.log('Recognition ended');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile && this.state.isInitialized && !document.hidden && this.isListening) {
            setTimeout(() => {
                if (this.isListening) {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        this.isListening = false;
                        this.updateDisplay();
                    }
                }
            }, 500);
        } else {
            this.isListening = false;
            this.updateDisplay();
        }
    }

    handleRecognitionError(event) {
        console.error('Recognition error:', event.error);
        this.isListening = false;
        
        const messages = {
            'no-speech': 'कोई आवाज नहीं सुनाई दी',
            'audio-capture': 'माइक्रोफोन कनेक्ट नहीं हो सका',
            'not-allowed': 'माइक्रोफोन की अनुमति दें',
            'network': 'नेटवर्क समस्या'
        };
        
        if (event.error !== 'aborted' && messages[event.error]) {
            this.showNotification(messages[event.error], 'error');
        }
        
        this.updateDisplay();
    }

    async saveToServer(immediate = false) {
        if (this.state.isSaving && !immediate) return;
        
        this.state.isSaving = true;
        
        try {
            const response = await fetch('/harijap/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    count: this.totalWords,
                    totalMalas: this.totalMalas
                })
            });
            
            if (response.ok) {
                console.log('Saved to server');
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            this.state.isSaving = false;
        }
    }

    startAutoSave() {
        setInterval(() => this.saveToServer(), this.config.autoSaveInterval);
    }

    startServerSync() {
        setInterval(() => this.loadStateFromServer(), this.config.syncInterval);
    }
}

const style = document.createElement('style');
style.textContent = `
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
    @media (max-width: 768px) {
        body { font-size: 14px; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.hariJapCounter = new HariJapCounter();
});
