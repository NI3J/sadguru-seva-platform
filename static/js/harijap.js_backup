class HariJapCounter {
    constructor() {
        // Core properties
        this.count = 0;
        this.totalMalas = 0;
        this.currentMalaWords = 0;
        this.isListening = false;
        this.recognition = null;
        this.targetPhrases = [
            'जय जय राम कृष्णा हारी',
            'जय जय राम कृष्ण हरी',
            'जय जय राम कृष्णा हारी',
            'जय जय राम कृष्ण हरी'
        ];

        // Configuration
        this.config = {
            wordsPerPronunciation: 5,
            wordsPerMala: 108,
            totalMalasTarget: 108,
            recognitionLang: 'hi-IN',
            celebrationDuration: 3000,
            autoSaveInterval: 10000,
            syncInterval: 30000,
        };

        // DOM elements
        this.elements = {};

        // State management
        this.state = {
            isInitialized: false,
            lastRecognizedTime: 0,
            isSaving: false,
            userName: '',
            userId: null,
            sessionStartTime: Date.now(),
            totalSessionTime: 0,
        };

        // Performance tracking
        this.performance = {
            recognitionSuccesses: 0,
            recognitionAttempts: 0,
            avgResponseTime: 0,
            lastUpdateTime: Date.now()
        };

        // Initialize the application
        this.init();
    }

    async init() {
        try {
            console.log('🕉️ Initializing Hari Jap Counter...');
            
            // Check authentication first
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                console.log('❌ Not authenticated, redirecting...');
                window.location.href = '/harijap/auth';
                return;
            }

            this.state.userName = authCheck.user_name || 'भक्त';
            this.state.userId = authCheck.user_id;

            this.initializeElements();
            this.initializeSpeechRecognition();
            this.setupEventListeners();
            await this.loadStateFromServer();
            this.updateDisplay();
            this.startAutoSave();
            this.startServerSync();
            this.state.isInitialized = true;
            
            this.showNotification('🙏 जय श्री राम! साधना प्रारंभ के लिए तैयार', 'success');
            this.logActivity('HARI_JAP_INITIALIZED');
            
        } catch (error) {
            console.error('❌ Error initializing Hari Jap Counter:', error);
            this.showNotification('प्रारंभिकरण में त्रुटि। पृष्ठ को पुनः लोड करें।', 'error');
        }
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/harijap/auth/check_session', {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Authentication check failed:', error);
            return { authenticated: false };
        }
    }

    initializeElements() {
        const elementIds = [
            'countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration', 'userName',
            'logoutBtn', 'sessionTime', 'todayCount', 'weekCount', 'accuracy'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`⚠️ Element with id '${id}' not found`);
            }
        });

        // Set user name if element exists
        if (this.elements.userName && this.state.userName) {
            this.elements.userName.textContent = `🙏 ${this.state.userName}`;
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
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 3;
            this.recognition.continuous = true;

            this.recognition.onresult = (event) => this.handleRecognitionResult(event);
            this.recognition.onend = () => this.handleRecognitionEnd();
            this.recognition.onerror = (event) => this.handleRecognitionError(event);
            this.recognition.onstart = () => this.handleRecognitionStart();
            this.recognition.onaudiostart = () => this.handleAudioStart();
            
            console.log('✅ Speech Recognition initialized successfully');
        } catch (error) {
            console.error('❌ Speech Recognition not supported:', error);
            this.showNotification('आपका ब्राउज़र आवाज पहचानने का समर्थन नहीं करता।', 'error');
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isListening) {
                e.preventDefault();
                this.startRecognition();
            } else if (e.code === 'Escape' && this.isListening) {
                this.stopRecognition();
            } else if (e.code === 'Enter' && e.ctrlKey) {
                this.manualCount();
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.stopRecognition();
            }
        });

        // Save before unload
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
                    this.count = data.count || 0;
                    this.totalMalas = data.total_malas || 0;
                    this.currentMalaWords = this.count % this.config.wordsPerMala;
                    console.log('✅ State loaded from server:', data);
                }
            }
        } catch (error) {
            console.error('❌ Error loading state from server:', error);
            // Fall back to local storage
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('hariJapData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.count = data.count || 0;
                this.totalMalas = data.totalMalas || 0;
                this.currentMalaWords = data.currentMalaWords || 0;
                console.log('✅ State loaded from local storage:', data);
            } catch (error) {
                console.error('❌ Error parsing local storage data:', error);
            }
        }
    }

    updateDisplay() {
        // Update count display with animation
        if (this.elements.countDisplay) {
            const currentValue = parseInt(this.elements.countDisplay.textContent);
            if (currentValue !== this.count) {
                this.elements.countDisplay.classList.add('pulse');
                this.elements.countDisplay.textContent = this.count;
                setTimeout(() => {
                    this.elements.countDisplay.classList.remove('pulse');
                }, 500);
            }
        }

        // Update mala status
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = `कुल माला: ${this.totalMalas}`;
        }
        
        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent = `वर्तमान माला: ${this.currentMalaWords} / ${this.config.wordsPerMala}`;
        }
        
        if (this.elements.remainingCount) {
            const remaining = this.config.wordsPerMala - this.currentMalaWords;
            this.elements.remainingCount.textContent = `शेष: ${remaining} जप`;
        }

        // Update listening status
        if (this.elements.listeningStatus) {
            if (this.isListening) {
                this.elements.listeningStatus.textContent = '🎤 सुन रहा है...';
                this.elements.listeningStatus.classList.add('listening');
            } else {
                this.elements.listeningStatus.textContent = '🎤 माइक्रोफोन तैयार है';
                this.elements.listeningStatus.classList.remove('listening');
            }
        }

        // Update progress bar
        if (this.elements.progressFill) {
            const progress = (this.currentMalaWords / this.config.wordsPerMala) * 100;
            this.elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
        }

        // Update button states
        if (this.elements.startBtn && this.elements.stopBtn) {
            this.elements.startBtn.disabled = this.isListening;
            this.elements.stopBtn.disabled = !this.isListening;
            
            if (this.isListening) {
                this.elements.startBtn.classList.add('active');
            } else {
                this.elements.startBtn.classList.remove('active');
            }
        }

        // Update session stats
        this.updateSessionStats();
    }

    updateSessionStats() {
        // Update session time
        if (this.elements.sessionTime) {
            const sessionMinutes = Math.floor((Date.now() - this.state.sessionStartTime) / 60000);
            this.elements.sessionTime.textContent = `${sessionMinutes} मिनट`;
        }

        // Update today's count
        if (this.elements.todayCount) {
            this.elements.todayCount.textContent = this.count;
        }

        // Update accuracy
        if (this.elements.accuracy && this.performance.recognitionAttempts > 0) {
            const accuracy = Math.round((this.performance.recognitionSuccesses / this.performance.recognitionAttempts) * 100);
            this.elements.accuracy.textContent = `${accuracy}%`;
        }
    }

    startRecognition() {
        if (!this.recognition) {
            this.showNotification('आवाज पहचान सेवा उपलब्ध नहीं है।', 'error');
            return;
        }
        
        if (!this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                this.updateDisplay();
                this.logActivity('RECOGNITION_STARTED');
                console.log('🎤 Starting recognition...');
            } catch (error) {
                console.error('❌ Error starting recognition:', error);
                if (error.message && error.message.includes('already started')) {
                    this.isListening = true;
                    this.updateDisplay();
                } else {
                    this.showNotification('आवाज पहचान शुरू करने में त्रुटि।', 'error');
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
                this.logActivity('RECOGNITION_STOPPED');
                console.log('🛑 Stopping recognition...');
            } catch (error) {
                console.error('❌ Error stopping recognition:', error);
                this.isListening = false;
                this.updateDisplay();
            }
        }
    }

    handleRecognitionResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];
        
        // Track performance
        const responseTime = Date.now() - this.state.lastRecognizedTime;
        this.performance.avgResponseTime = 
            (this.performance.avgResponseTime + responseTime) / 2;
        
        // Process all alternatives
        let recognized = false;
        let bestTranscript = '';
        
        for (let i = 0; i < lastResult.length; i++) {
            const transcript = lastResult[i].transcript.toLowerCase().trim();
            bestTranscript = lastResult[0].transcript;
            
            if (this.isTargetPhrase(transcript)) {
                recognized = true;
                break;
            }
        }
        
        // Update recognition text display
        if (this.elements.recognitionText) {
            this.elements.recognitionText.textContent = bestTranscript;
        }
        
        // Track attempt
        if (lastResult.isFinal) {
            this.performance.recognitionAttempts++;
            
            if (recognized) {
                this.performance.recognitionSuccesses++;
                this.incrementCount();
                this.showNotification('✨ जप स्वीकृत!', 'success', 1000);
                this.triggerVisualFeedback();
            }
        }
        
        this.state.lastRecognizedTime = Date.now();
    }

    isTargetPhrase(text) {
        // Normalize text
        const normalized = text
            .toLowerCase()
            .replace(/[।,.!?]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Check against all target phrases
        return this.targetPhrases.some(phrase => {
            const phraseNormalized = phrase.toLowerCase();
            return normalized.includes(phraseNormalized) || 
                   this.fuzzyMatch(normalized, phraseNormalized);
        });
    }

    fuzzyMatch(text, target) {
        // Simple fuzzy matching for common variations
        const textWords = text.split(' ');
        const targetWords = target.split(' ');
        
        let matchCount = 0;
        targetWords.forEach(targetWord => {
            if (textWords.some(textWord => 
                this.levenshteinDistance(textWord, targetWord) <= 2)) {
                matchCount++;
            }
        });
        
        return matchCount >= targetWords.length * 0.7;
    }

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

    incrementCount() {
        this.count += this.config.wordsPerPronunciation;
        this.currentMalaWords += this.config.wordsPerPronunciation;
        
        if (this.currentMalaWords >= this.config.wordsPerMala) {
            this.completeMala();
        }
        
        this.updateDisplay();
        this.saveToLocalStorage();
    }

    completeMala() {
        this.totalMalas++;
        this.currentMalaWords = this.currentMalaWords % this.config.wordsPerMala;
        this.triggerMalaCelebration();
        this.logActivity('MALA_COMPLETED', { totalMalas: this.totalMalas });
        
        // Check for milestone achievements
        this.checkMilestones();
    }

    checkMilestones() {
        const milestones = [10, 21, 51, 108, 1008];
        if (milestones.includes(this.totalMalas)) {
            this.triggerSpecialCelebration(this.totalMalas);
        }
    }

    triggerVisualFeedback() {
        // Add visual feedback for successful recognition
        document.body.style.background = 'radial-gradient(ellipse at center, rgba(76, 175, 80, 0.2), transparent)';
        setTimeout(() => {
            document.body.style.background = '';
        }, 300);
    }

    triggerMalaCelebration() {
        this.showCelebration('🎉 माला पूर्ण हुई! 🎉', 'बधाई हो! जय श्री राम!');
        
        // Play celebration sound if available
        this.playSound('celebration');
        
        // Trigger confetti effect
        this.createConfetti();
    }

    triggerSpecialCelebration(malas) {
        let message = '';
        let subMessage = '';
        
        switch(malas) {
            case 10:
                message = '🌟 10 मालाएं पूर्ण! 🌟';
                subMessage = 'अद्भुत प्रगति!';
                break;
            case 21:
                message = '✨ 21 मालाएं पूर्ण! ✨';
                subMessage = 'दिव्य साधना!';
                break;
            case 51:
                message = '🏆 51 मालाएं पूर्ण! 🏆';
                subMessage = 'असाधारण समर्पण!';
                break;
            case 108:
                message = '🙏 108 मालाएं पूर्ण! 🙏';
                subMessage = 'परम सिद्धि! जय श्री राम!';
                break;
            case 1008:
                message = '🕉️ 1008 मालाएं पूर्ण! 🕉️';
                subMessage = 'महा सिद्धि प्राप्त!';
                break;
        }
        
        this.showCelebration(message, subMessage, 5000);
        this.createSpecialEffects();
    }

    showCelebration(message, subMessage = '', duration = 3000) {
        if (!this.elements.celebration) return;
        
        const celebrationEl = this.elements.celebration;
        celebrationEl.innerHTML = `
            <div class="celebration-text">${message}</div>
            ${subMessage ? `<div class="celebration-subtext">${subMessage}</div>` : ''}
        `;
        
        celebrationEl.style.display = 'block';
        celebrationEl.classList.add('show');
        
        setTimeout(() => {
            celebrationEl.classList.remove('show');
            setTimeout(() => {
                celebrationEl.style.display = 'none';
            }, 500);
        }, duration);
    }

    createConfetti() {
        const colors = ['#ff6b35', '#ffd700', '#4caf50', '#2196f3', '#9c27b0'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -10px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                animation: confetti-fall ${2 + Math.random() * 2}s ease-out;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    createSpecialEffects() {
        // Create golden rays
        const raysContainer = document.createElement('div');
        raysContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        
        for (let i = 0; i < 12; i++) {
            const ray = document.createElement('div');
            ray.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 2px;
                height: 100%;
                background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.8), transparent);
                transform: translate(-50%, -50%) rotate(${i * 30}deg);
                animation: ray-burst 1s ease-out;
            `;
            raysContainer.appendChild(ray);
        }
        
        document.body.appendChild(raysContainer);
        setTimeout(() => raysContainer.remove(), 1000);
    }

    playSound(type) {
        // Implement sound playing if audio files are available
        try {
            const audio = new Audio(`/static/sounds/${type}.mp3`);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
            console.log('Audio not available');
        }
    }

    manualCount() {
        this.incrementCount();
        this.showNotification('➕ जप जोड़ा गया', 'success', 1000);
        this.triggerVisualFeedback();
        this.logActivity('MANUAL_COUNT');
    }

    confirmReset() {
        if (confirm('क्या आप वाकई काउंटर रीसेट करना चाहते हैं? यह क्रिया वापस नहीं की जा सकती।')) {
            this.resetCounter();
        }
    }

    resetCounter() {
        this.count = 0;
        this.totalMalas = 0;
        this.currentMalaWords = 0;
        this.updateDisplay();
        this.saveToLocalStorage();
        this.saveToServer();
        this.showNotification('🔄 काउंटर रीसेट किया गया', 'info');
        this.logActivity('COUNTER_RESET');
    }

    async logout() {
        try {
            await this.saveToServer(true);
            
            const response = await fetch('/harijap/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                window.location.href = '/harijap/auth';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/harijap/auth';
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4caf50, #66bb6a)' :
                         type === 'error' ? 'linear-gradient(135deg, #f44336, #ef5350)' :
                         'linear-gradient(135deg, #2196f3, #42a5f5)'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slide-in 0.3s ease-out;
            font-size: 1rem;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    handleRecognitionStart() {
        console.log('🎤 Speech recognition started');
        this.showNotification('🎤 माइक्रोफोन सक्रिय', 'info', 1500);
    }

    handleAudioStart() {
        console.log('🔊 Audio capture started');
    }

    handleRecognitionEnd() {
        console.log('🔚 Speech recognition ended');
        this.isListening = false;
        this.updateDisplay();
        
        // Auto-restart if it was running
        if (this.state.isInitialized && !document.hidden) {
            setTimeout(() => {
                if (!this.isListening && this.elements.startBtn && !this.elements.startBtn.disabled) {
                    console.log('🔄 Auto-restarting recognition...');
                    this.startRecognition();
                }
            }, 1000);
        }
    }

    handleRecognitionError(event) {
        console.error('❌ Speech recognition error:', event.error);
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
                errorMessage = 'माइक्रोफोन की अनुमति नहीं मिली। कृपया अनुमति दें।';
                break;
            case 'network':
                errorMessage = 'नेटवर्क त्रुटि। इंटरनेट कनेक्शन जांचें।';
                break;
            case 'aborted':
                // Silent error, usually happens when stopping
                return;
        }
        
        this.showNotification(errorMessage, 'error');
        this.updateDisplay();
    }

    saveToLocalStorage() {
        const data = {
            count: this.count,
            totalMalas: this.totalMalas,
            currentMalaWords: this.currentMalaWords,
            lastSaved: Date.now()
        };
        localStorage.setItem('hariJapData', JSON.stringify(data));
    }

    async saveToServer(immediate = false) {
        if (this.state.isSaving && !immediate) return;
        
        this.state.isSaving = true;
        
        try {
            const response = await fetch('/harijap/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    count: this.count,
                    totalMalas: this.totalMalas
                })
            });
            
            if (response.ok) {
                console.log('✅ Progress saved to server');
            } else {
                console.error('❌ Server save failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Error saving to server:', error);
        } finally {
            this.state.isSaving = false;
        }
    }

    startAutoSave() {
        setInterval(() => {
            this.saveToLocalStorage();
        }, 5000);
        
        setInterval(() => {
            this.saveToServer();
        }, this.config.autoSaveInterval);
    }

    startServerSync() {
        setInterval(() => {
            this.loadStateFromServer();
        }, this.config.syncInterval);
    }

    logActivity(activity, data = {}) {
        const logEntry = {
            activity,
            timestamp: new Date().toISOString(),
            count: this.count,
            totalMalas: this.totalMalas,
            currentMalaWords: this.currentMalaWords,
            ...data
        };
        
        console.log(`📊 Activity: ${activity}`, logEntry);
        
        // Store activity log for analytics
        const logs = JSON.parse(localStorage.getItem('hariJapLogs') || '[]');
        logs.push(logEntry);
        if (logs.length > 100) logs.shift(); // Keep only last 100 logs
        localStorage.setItem('hariJapLogs', JSON.stringify(logs));
    }
}

// Add CSS animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes ray-burst {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--rotation)) scale(0);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const counter = new HariJapCounter();
    window.hariJapCounter = counter; // Make it accessible for debugging
});
