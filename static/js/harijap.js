/**
 * Hari Jap Counter Application
 * 
 * A voice-recognition based counter for chanting "जय जय राम कृष्णा हारी"
 * Features: Speech recognition, progress tracking, milestone celebrations
 */

class HariJapCounter {
    constructor() {
        // Core counting state
        this.totalWords = 0;
        this.currentMalaPronunciations = 0;
        this.totalMalas = 0;
        this.totalPronunciations = 0;
        
        // Recognition state
        this.isListening = false;
        this.recognition = null;
        this.lastRecognitionTime = 0;
        
        // Configuration
        this.config = {
            wordsPerPronunciation: 5,      // "जय जय राम कृष्णा हारी" = 5 words
            pronunciationsPerMala: 108,     // 108 times = 1 mala
            recognitionLang: 'hi-IN',
            minTimeBetweenCounts: 1500,    // ms between recognitions
            autoSaveInterval: 10000,        // Save every 10 seconds
            syncInterval: 30000             // Sync with server every 30 seconds
        };

        // DOM elements cache
        this.elements = {};
        
        // Application state
        this.state = {
            isInitialized: false,
            isSaving: false,
            userName: '',
            userId: null,
            sessionStartTime: Date.now()
        };

        // Performance metrics
        this.performance = {
            recognitionSuccesses: 0,
            recognitionAttempts: 0
        };

        this.init();
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async init() {
        try {
            console.log('🙏 Initializing Hari Jap Counter...');
            
            // Check authentication
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                console.log('Not authenticated, redirecting...');
                window.location.href = '/harijap/auth';
                return;
            }

            this.state.userName = authCheck.user_name || '🙏🏻';
            this.state.userId = authCheck.user_id;

            // Initialize components
            this.initializeElements();
            this.initializeSpeechRecognition();
            this.setupEventListeners();
            
            // Load saved state
            await this.loadStateFromServer();
            
            // Start UI updates and auto-save
            this.updateDisplay();
            this.startAutoSave();
            this.startServerSync();
            
            this.state.isInitialized = true;
            this.showNotification('जय श्री कृष्ण! काउंटर तैयार है।', 'success');
            
            console.log('✅ Initialization complete');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
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
        const elementIds = [
            'countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration', 'userName',
            'logoutBtn', 'sessionTime', 'todayCount', 'accuracy'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });

        // Set user name in UI
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
                throw new Error('Speech Recognition not supported');
            }
            
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.recognitionLang;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 5;
            this.recognition.continuous = true;
            
            // Mobile optimization
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                this.recognition.continuous = false;
                console.log('📱 Mobile device detected - optimized recognition');
            }

            // Event listeners
            this.recognition.onresult = (e) => this.handleRecognitionResult(e);
            this.recognition.onend = () => this.handleRecognitionEnd();
            this.recognition.onerror = (e) => this.handleRecognitionError(e);
            this.recognition.onstart = () => console.log('🎤 Recognition started');
            
            console.log('✅ Speech Recognition initialized');
            
        } catch (error) {
            console.error('❌ Speech Recognition initialization failed:', error);
            this.showNotification('वॉइस पहचान उपलब्ध नहीं है।', 'error');
            this.recognition = null;
        }
    }

    setupEventListeners() {
        // Button listeners
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

        // Stop recognition when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.stopRecognition();
            }
        });

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveToServer(true);
        });
    }

    // ========================================================================
    // DATA PERSISTENCE
    // ========================================================================

    async loadStateFromServer() {
        try {
            console.log('📥 Loading state from server...');
            
            const response = await fetch('/harijap/api/state', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // CRITICAL: Load all values directly - no recalculation!
                this.totalWords = data.count || 0;
                this.totalMalas = data.total_malas || 0;
                this.currentMalaPronunciations = data.current_mala_pronunciations || 0;
                this.totalPronunciations = data.total_pronunciations || 0;
                
                console.log('✅ State loaded:', {
                    totalWords: this.totalWords,
                    totalPronunciations: this.totalPronunciations,
                    currentMalaPronunciations: this.currentMalaPronunciations,
                    totalMalas: this.totalMalas
                });
            }
            
        } catch (error) {
            console.error('❌ Error loading from server:', error);
            this.showNotification('डेटा लोड करने में त्रुटि', 'error');
        }
    }

    async saveToServer(immediate = false) {
        if (this.state.isSaving && !immediate) {
            console.log('⏳ Save already in progress, skipping...');
            return;
        }
        
        this.state.isSaving = true;
        
        try {
            const payload = {
                count: this.totalWords,
                totalMalas: this.totalMalas,
                currentMalaPronunciations: this.currentMalaPronunciations,
                totalPronunciations: this.totalPronunciations
            };
            
            console.log('💾 Saving to server:', payload);
            
            const response = await fetch('/harijap/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('✅ Saved successfully');
            } else {
                console.error('❌ Save failed:', response.status);
                if (!immediate) {
                    this.showNotification('सेव करने में त्रुटि', 'error');
                }
            }
            
        } catch (error) {
            console.error('❌ Save error:', error);
            if (!immediate) {
                this.showNotification('सर्वर से संपर्क नहीं हो सका', 'error');
            }
        } finally {
            this.state.isSaving = false;
        }
    }

    startAutoSave() {
        setInterval(() => {
            if (!this.state.isSaving) {
                this.saveToServer();
            }
        }, this.config.autoSaveInterval);
        console.log(`🔄 Auto-save started (every ${this.config.autoSaveInterval / 1000}s)`);
    }

    startServerSync() {
        setInterval(() => {
            this.loadStateFromServer();
        }, this.config.syncInterval);
        console.log(`🔄 Server sync started (every ${this.config.syncInterval / 1000}s)`);
    }

    // ========================================================================
    // SPEECH RECOGNITION
    // ========================================================================

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
                console.log('🎤 Recognition started');
            } catch (error) {
                console.error('Start recognition error:', error);
                if (error.message && error.message.includes('already started')) {
                    this.isListening = true;
                    this.updateDisplay();
                } else {
                    this.showNotification('माइक्रोफोन शुरू नहीं हो सका', 'error');
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
                console.log('🛑 Recognition stopped');
            } catch (error) {
                console.error('Stop recognition error:', error);
                this.isListening = false;
                this.updateDisplay();
            }
        }
    }

    handleRecognitionResult(event) {
        const now = Date.now();
        
        // Prevent duplicate counts
        if (now - this.lastRecognitionTime < this.config.minTimeBetweenCounts) {
            console.log('⏭️ Duplicate recognition - skipping');
            return;
        }

        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (!lastResult.isFinal) return;
        
        let recognized = false;
        let bestTranscript = '';
        
        // Check all alternatives for match
        for (let i = 0; i < lastResult.length; i++) {
            const transcript = lastResult[i].transcript;
            const confidence = lastResult[i].confidence;
            
            if (i === 0) bestTranscript = transcript;
            
            console.log(`🔍 Alternative ${i + 1}: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
            
            if (this.isTargetPhrase(transcript)) {
                recognized = true;
                bestTranscript = transcript;
                console.log(`✅ MATCH found in alternative ${i + 1}`);
                break;
            }
        }
        
        // Display recognized text
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
        
        // Exact match check
        for (let phrase of exactMatches) {
            if (normalized === phrase.toLowerCase()) {
                console.log(`✅ Exact match: "${phrase}"`);
                return true;
            }
        }
        
        // Contains check
        for (let phrase of exactMatches) {
            if (normalized.includes(phrase.toLowerCase())) {
                console.log(`✅ Contains: "${phrase}"`);
                return true;
            }
        }
        
        // Fuzzy match check
        for (let phrase of exactMatches) {
            if (this.strictFuzzyMatch(normalized, phrase.toLowerCase())) {
                console.log(`✅ Fuzzy match: "${phrase}"`);
                return true;
            }
        }
        
        console.log(`❌ No match for: "${text}"`);
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

    handleRecognitionEnd() {
        console.log('🔚 Recognition ended');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Auto-restart for mobile devices
        if (isMobile && this.state.isInitialized && !document.hidden && this.isListening) {
            setTimeout(() => {
                if (this.isListening) {
                    try {
                        this.recognition.start();
                        console.log('🔄 Auto-restarting recognition (mobile)');
                    } catch (error) {
                        console.error('Auto-restart failed:', error);
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
        console.error('❌ Recognition error:', event.error);
        this.isListening = false;
        
        const errorMessages = {
            'no-speech': 'कोई आवाज नहीं सुनाई दी',
            'audio-capture': 'माइक्रोफोन कनेक्ट नहीं हो सका',
            'not-allowed': 'माइक्रोफोन की अनुमति दें',
            'network': 'नेटवर्क समस्या'
        };
        
        if (event.error !== 'aborted' && errorMessages[event.error]) {
            this.showNotification(errorMessages[event.error], 'error');
        }
        
        this.updateDisplay();
    }

    // ========================================================================
    // COUNTING LOGIC
    // ========================================================================

    incrementCount() {
        // Increment all counters
        this.totalWords += this.config.wordsPerPronunciation;
        this.totalPronunciations++;
        this.currentMalaPronunciations++;
        
        console.log(`📊 Count incremented: Words=${this.totalWords}, Pronunciations=${this.totalPronunciations}, Current=${this.currentMalaPronunciations}`);
        
        // Check if mala completed
        if (this.currentMalaPronunciations >= this.config.pronunciationsPerMala) {
            this.currentMalaPronunciations = 0;
            setTimeout(() => this.completeMala(), 100);
        }
        
        // Update UI and save
        this.updateDisplay();
        this.saveToServer();
    }

    completeMala() {
        this.totalMalas++;
        console.log(`🎉 Mala completed! Total malas: ${this.totalMalas}`);
        
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

    manualCount() {
        this.incrementCount();
        this.showNotification('जप मैन्युअल रूप से जोड़ा गया', 'success', 1000);
        this.triggerVisualFeedback();
    }

    confirmReset() {
        if (confirm('क्या आप वाकई काउंटर रीसेट करना चाहते हैं? यह सभी प्रगति हटा देगा।')) {
            this.resetCounter();
        }
    }

    resetCounter() {
        this.totalWords = 0;
        this.totalPronunciations = 0;
        this.totalMalas = 0;
        this.currentMalaPronunciations = 0;
        
        this.updateDisplay();
        this.saveToServer(true);
        this.showNotification('काउंटर रीसेट हो गया', 'info');
        
        console.log('🔄 Counter reset');
    }

    // ========================================================================
    // UI UPDATE AND DISPLAY
    // ========================================================================

    updateDisplay() {
        // Update main count with animation
        if (this.elements.countDisplay) {
            const current = parseInt(this.elements.countDisplay.textContent);
            if (current !== this.totalWords) {
                this.elements.countDisplay.classList.add('pulse');
                this.elements.countDisplay.textContent = this.totalWords;
                setTimeout(() => this.elements.countDisplay.classList.remove('pulse'), 500);
            }
        }

        // Update total malas
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = `कुल माला: ${this.totalMalas}`;
        }
        
        // Update current mala status
        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent = 
                `वर्तमान माला: ${this.currentMalaPronunciations} / ${this.config.pronunciationsPerMala}`;
        }
        
        // Update remaining count
        if (this.elements.remainingCount) {
            const remaining = this.config.pronunciationsPerMala - this.currentMalaPronunciations;
            this.elements.remainingCount.textContent = `शेष: ${remaining} बार`;
        }

        // Update listening status
        if (this.elements.listeningStatus) {
            if (this.isListening) {
                this.elements.listeningStatus.textContent = '🎤 सुन रहा हूं...';
                this.elements.listeningStatus.classList.add('listening');
            } else {
                this.elements.listeningStatus.textContent = '🎤 माइक्रोफोन बंद है';
                this.elements.listeningStatus.classList.remove('listening');
            }
        }

        // Update progress bar
        if (this.elements.progressFill) {
            const progress = (this.currentMalaPronunciations / this.config.pronunciationsPerMala) * 100;
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

        this.updateSessionStats();
    }

    updateSessionStats() {
        // Session time
        if (this.elements.sessionTime) {
            const minutes = Math.floor((Date.now() - this.state.sessionStartTime) / 60000);
            this.elements.sessionTime.textContent = `${minutes} मिनट`;
        }

        // Today's count
        if (this.elements.todayCount) {
            this.elements.todayCount.textContent = this.totalWords;
        }

        // Recognition accuracy
        if (this.elements.accuracy && this.performance.recognitionAttempts > 0) {
            const accuracy = Math.round(
                (this.performance.recognitionSuccesses / this.performance.recognitionAttempts) * 100
            );
            this.elements.accuracy.textContent = `${accuracy}%`;
        }
    }

    // ========================================================================
    // VISUAL FEEDBACK AND CELEBRATIONS
    // ========================================================================

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
        const celebrations = {
            10: ['🌟 10 मालाएं पूर्ण! 🌟', 'अद्भुत प्रगति!'],
            21: ['✨ 21 मालाएं पूर्ण! ✨', 'शानदार समर्पण!'],
            51: ['🔥 51 मालाएं पूर्ण! 🔥', 'असाधारण उपलब्धि!'],
            108: ['🌺 108 मालाएं पूर्ण! 🌺', 'महान उपलब्धि!'],
            1008: ['👑 1008 मालाएं पूर्ण! 👑', 'परम आध्यात्मिक उपलब्धि!']
        };
        
        const [message, subMessage] = celebrations[malas] || ['', ''];
        if (message) {
            this.showCelebration(message, subMessage, 5000);
            this.createConfetti();
        }
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

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        
        const bgColors = {
            success: 'linear-gradient(135deg, #4caf50, #66bb6a)',
            error: 'linear-gradient(135deg, #f44336, #ef5350)',
            info: 'linear-gradient(135deg, #2196f3, #42a5f5)'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${bgColors[type] || bgColors.info};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slide-in 0.3s ease-out;
            font-size: 0.9rem;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // ========================================================================
    // USER ACTIONS
    // ========================================================================

    async logout() {
        try {
            console.log('👋 Logging out...');
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
}

// ============================================================================
// STYLES
// ============================================================================

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
        to { 
            transform: translateY(100vh) rotate(360deg); 
            opacity: 0; 
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .pulse {
        animation: pulse 0.5s ease-in-out;
    }
    
    @media (max-width: 768px) {
        body { font-size: 14px; }
    }
`;
document.head.appendChild(style);

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Hari Jap Counter Application');
    window.hariJapCounter = new HariJapCounter();
});
