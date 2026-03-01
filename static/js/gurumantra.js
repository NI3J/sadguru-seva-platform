/**
 * =====================================================================
 * HARI JAP COUNTER APPLICATION - FINAL FIXED VERSION
 * =====================================================================
 * Voice-recognition based counter for chanting "जय जय राम कृष्णा हारी"
 * Features: Multi-repetition detection, instant feedback, milestone tracking
 * FIXED: Enhanced fuzzy matching for better speech recognition
 * =====================================================================
 */

class GuruMantraCounter {
    constructor() {
        // ============================================================
        // STATE MANAGEMENT
        // ============================================================
        this.state = {
            // Counting state - Total (lifetime)
            totalWords: 0,
            totalPronunciations: 0,
            totalMalas: 0,
            
            // Today's counting state
            todayWords: 0,
            todayPronunciations: 0,
            todayMalas: 0,
            todayDate: this.getTodayDateString(),
            todaysCount: 0, // New field for persistent today's count
            
            // Current session state
            currentMalaPronunciations: 0,
            sessionStartTime: Date.now(),

            // Application state
            isInitialized: false,
            isListening: false,
            isSaving: false,
            isFirstLoad: true, // CRITICAL: Flag to track first load from server

            // User state
            userName: '',
            userId: null,

            // Recognition state
            lastRecognitionTime: 0,
            lastRecognitionCount: 0, // Store last count for duplicate detection

            // Mantra word tracking - Guru Mantra: ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि तन्नो रुद्रः प्रचोदयात् ॥
            mantraWords: ['ॐ', 'तत्पुरुषाय', 'विद्महे', 'महादेवाय', 'धीमहि', 'तन्नो', 'रुद्रः', 'प्रचोदयात्']
        };

        // ============================================================
        // CONFIGURATION
        // ============================================================
        this.config = {
            // Mantra configuration - Guru Mantra has 8 words
            wordsPerPronunciation: 8,  // ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि तन्नो रुद्रः प्रचोदयात्
            pronunciationsPerMala: 108,

            // Recognition settings - CRITICAL FIX
            recognitionLang: 'en-IN', // Keep English (India) for better recognition
            minTimeBetweenCounts: 300,

            // Auto-save settings
            autoSaveInterval: 10000,
            syncInterval: 30000,

            // COMPREHENSIVE target phrases - prioritize most common variations
            // Based on actual pronunciation: "Om Tatpurushaya Vidmahe Mahadevaya Dhimahi Tanno Rudra Prachodayat"
            // Rudra Gayatri Mantra recognition patterns
            targetPhrases: [
                // PRIMARY: Complete mantra variations (most common)
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudrah prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayath',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayath',
                
                // Variations with different spellings and pronunciations
                'om tatpurushay vidmahe mahadevay dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                
                // Common speech recognition variations
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                
                // Without "Om" prefix (common in continuous chanting)
                'tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'tatpurushaya vidmahe mahadevaya dhimahi tanno rudrah prachodayat',
                
                // Partial patterns - common when chanting (key phrases)
                'tatpurushaya vidmahe mahadevaya dhimahi',
                'vidmahe mahadevaya dhimahi tanno rudra',
                'mahadevaya dhimahi tanno rudra prachodayat',
                'dhimahi tanno rudra prachodayat',
                'tanno rudra prachodayat',
                'rudra prachodayat',
                
                // Speech recognition variations (no spaces, merged words)
                'om tatpurushayavidmahe mahadevayadhimahi tannorudra prachodayat',
                'tatpurushayavidmahe mahadevayadhimahi',
                'mahadevayadhimahi tannorudra',
                'tannorudra prachodayat',
                
                // Common mispronunciations/variations
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                'om tatpurushaya vidmahe mahadevaya dhimahi tanno rudra prachodayat',
                
                // Hindi/Devanagari variations (if supported by speech recognition)
                'ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि तन्नो रुद्रः प्रचोदयात्',
                'तत्पुरुषाय विद्महे महादेवाय धीमहि तन्नो रुद्रः प्रचोदयात्',
                'तत्पुरुषाय विद्महे महादेवाय धीमहि',
                'महादेवाय धीमहि तन्नो रुद्रः',
                'तन्नो रुद्रः प्रचोदयात्',
                'रुद्रः प्रचोदयात्',
                
                // Key words that indicate mantra (for partial matching)
                'tatpurushaya',
                'vidmahe',
                'mahadevaya',
                'dhimahi',
                'tanno',
                'rudra',
                'prachodayat'
            ],

            // Milestone celebrations
            milestones: [10, 21, 51, 108, 1008]
        };

        // ============================================================
        // PERFORMANCE METRICS
        // ============================================================
        this.metrics = {
            recognitionSuccesses: 0,
            recognitionAttempts: 0,
            totalSessionTime: 0
        };

        // ============================================================
        // DOM ELEMENTS CACHE
        // ============================================================
        this.elements = {};

        // ============================================================
        // SPEECH RECOGNITION
        // ============================================================
        this.recognition = null;

        // ============================================================
        // SERVER TIME MANAGEMENT
        // ============================================================
        this.serverDate = null;
        this.serverTime = null;
        this.serverHour = null;
        this.serverMinute = null;
        this.serverSecond = null;
        this.serverTimeFetchedAt = null;
        this.serverTimeLoading = false;

        // ============================================================
        // SESSION TIMEOUT MANAGEMENT
        // ============================================================
        this.sessionTimeout = {
            duration: 5 * 60 * 1000, // 5 minutes in milliseconds
            warningDuration: 30 * 1000, // 30 seconds warning
            lastActivity: Date.now(),
            timeoutId: null,
            warningId: null,
            isWarningShown: false
        };

        // Start initialization
        this.init();
    }

    // ================================================================
    // INITIALIZATION METHODS
    // ================================================================

    async init() {
        try {
            console.log('🙏 Initializing Hari Jap Counter...');

            await this.authenticateUser();
            // CRITICAL: Load server time FIRST and wait for it to complete
            // This ensures serverDate is set before loading state
            const serverDate = await this.getServerTime();
            console.log('🕐 Server date loaded:', serverDate);
            
            this.cacheElements();
            this.initializeSpeechRecognition();
            this.attachEventListeners();
            await this.loadStateFromServer();
            this.startAutoProcesses();
            this.startSessionTimeout();

            this.state.isInitialized = true;
            this.updateUI();
            
            // Verify button is clickable
            this.verifyButtonSetup();
            
            this.showNotification('🙏 स्वागत आहे! जपाची तयारी झाली', 'success');

            console.log('✅ Initialization complete');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.handleInitError(error);
        }
    }

    async authenticateUser() {
        try {
            const response = await fetch('/guru-mantra/auth/check_session', {
                method: 'GET',
                credentials: 'same-origin'
            });

            const authData = await response.json();

            if (!authData.authenticated) {
                window.location.href = '/guru-mantra/auth';
                throw new Error('Not authenticated');
            }

            this.state.userName = authData.user_name || 'साधक';
            this.state.userId = authData.user_id;

            console.log('✅ Authenticated as: ' + this.state.userName);
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            throw error;
        }
    }

    cacheElements() {
        const elementIds = [
            'countDisplay', 'malaStatus', 'totalMalas', 'startBtn', 'stopBtn',
            'manualBtn', 'resetBtn', 'listeningStatus', 'recognitionText',
            'progressFill', 'remainingCount', 'celebration', 'userName',
            'logoutBtn', 'sessionTime', 'todayCount', 'accuracy', 'datetimeDisplay'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn('⚠️ Element not found: ' + id);
            }
        });

        // Cache the new full jap element
        const fullJapElement = document.getElementById('fullJapCount');
        if (fullJapElement) {
            this.elements.fullJapCount = fullJapElement;
        } else {
            console.warn('⚠️ Element not found: fullJapCount');
        }
        
        // Cache datetimeDisplaySection and its child datetimeDisplay
        const datetimeSection = document.getElementById('datetimeDisplaySection');
        if (datetimeSection) {
            this.elements.datetimeDisplaySection = datetimeSection;
            const datetimeDisplay = datetimeSection.querySelector('#datetimeDisplay');
            if (datetimeDisplay) {
                this.elements.datetimeDisplay = datetimeDisplay;
            }
        }

        if (this.elements.userName && this.state.userName) {
            this.elements.userName.textContent = '🙏 ' + this.state.userName;
        }

        console.log('✅ Cached ' + Object.keys(this.elements).length + ' DOM elements');
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
            const isMobile = this.isMobileDevice();
            if (isMobile) {
                this.recognition.continuous = false;
                console.log('📱 Mobile device detected - optimized recognition');
            }
            
            // CRITICAL: Log what we're listening for
            console.log('✅ Recognition initialized');
            console.log('📝 Listening for variations of: "Om Tatpurushaya Vidmahe Mahadevaya Dhimahi Tanno Rudra Prachodayat"');
            console.log('🌐 Language:', this.config.recognitionLang);
            console.log('📋 Accepted patterns:', this.config.targetPhrases.slice(0, 6));

            // Attach recognition event handlers
            this.recognition.onresult = (e) => this.onRecognitionResult(e);
            this.recognition.onend = () => this.onRecognitionEnd();
            this.recognition.onerror = (e) => this.onRecognitionError(e);
            this.recognition.onstart = () => {
                console.log('🎤 Recognition started - Listening...');
                this.state.isListening = true;
                this.updateUI();
            };

            console.log('✅ Speech Recognition initialized');
        } catch (error) {
            console.error('❌ Speech Recognition initialization failed:', error);
            this.showNotification('आवाज ओळख उपलब्ध नाही', 'error');
            this.recognition = null;
        }
    }

    attachEventListeners() {
        // Button listeners - use both click and mousedown for maximum compatibility
        this.addListener('startBtn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎤 Start button clicked');
            this.startListening();
        });
        this.addListener('startBtn', 'mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎤 Start button mousedown');
            if (!this.state.isListening) {
                this.startListening();
            }
        });
        
        this.addListener('stopBtn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.stopListening();
        });
        this.addListener('stopBtn', 'mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.state.isListening) {
                this.stopListening();
            }
        });
        
        this.addListener('manualBtn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.addManualCount();
        });
        this.addListener('manualBtn', 'mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.addManualCount();
        });
        
        this.addListener('resetBtn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmReset();
        });
        this.addListener('resetBtn', 'mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmReset();
        });
        
        this.addListener('logoutBtn', 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.logout();
        });
        
        // Touch event handlers for mobile devices
        this.addListener('startBtn', 'touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎤 Start button touched');
            if (!this.state.isListening) {
                this.startListening();
            }
        });
        
        this.addListener('stopBtn', 'touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.state.isListening) {
                this.stopListening();
            }
        });
        
        this.addListener('manualBtn', 'touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.addManualCount();
        });
        
        this.addListener('resetBtn', 'touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmReset();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.updateActivity();
            
            // Space key to start/stop listening
            if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
                e.preventDefault();
                if (this.state.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
            }
            
            // Escape key to stop listening
            if (e.code === 'Escape' && this.state.isListening) {
                e.preventDefault();
                this.stopListening();
            }
            
            // Ctrl+Enter for manual count
            if (e.ctrlKey && e.code === 'Enter') {
                e.preventDefault();
                this.addManualCount();
            }
        });

        // Add activity tracking for general user interactions
        document.addEventListener('click', () => this.updateActivity());
        document.addEventListener('mousemove', () => this.updateActivity());

        // Page visibility and unload
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isListening) {
                this.stopListening();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveToServer(true);
        });

        console.log('✅ Event listeners attached');
    }

    addListener(elementId, event, handler) {
        // First try to get from cached elements
        let element = this.elements[elementId];
        
        // If not found in cache, try to find it directly in DOM
        if (!element) {
            element = document.getElementById(elementId);
            if (element) {
                console.warn('⚠️ Element ' + elementId + ' not in cache, found directly in DOM');
                this.elements[elementId] = element; // Cache it for future use
            }
        }
        
        if (element) {
            element.addEventListener(event, handler);
            console.log('✅ Event listener attached to ' + elementId);
        } else {
            console.error('❌ Element not found: ' + elementId + ' - event listener not attached');
        }
    }

    verifyButtonSetup() {
        // Verify all buttons are properly set up
        const buttons = ['startBtn', 'stopBtn', 'manualBtn', 'resetBtn'];
        
        buttons.forEach(btnId => {
            const btn = this.elements[btnId] || document.getElementById(btnId);
            if (btn) {
                const computedStyle = window.getComputedStyle(btn);
                console.log(`✅ ${btnId} found:`, {
                    id: btn.id,
                    disabled: btn.disabled,
                    pointerEvents: computedStyle.pointerEvents,
                    zIndex: computedStyle.zIndex,
                    position: computedStyle.position,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility
                });
                
                // Ensure button is clickable
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
                btn.style.position = 'relative';
                btn.style.zIndex = '100';
                
                // Check if button is covered by another element
                const rect = btn.getBoundingClientRect();
                const elementAtPoint = document.elementFromPoint(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );
                
                if (elementAtPoint !== btn && !btn.contains(elementAtPoint)) {
                    console.warn(`⚠️ ${btnId} might be covered by:`, elementAtPoint);
                }
            } else {
                console.error(`❌ ${btnId} not found in DOM!`);
            }
        });
        
        // Specifically check start button
        const startBtn = this.elements.startBtn || document.getElementById('startBtn');
        if (startBtn) {
            // Ensure button is not disabled initially
            if (startBtn.disabled && !this.state.isListening) {
                console.warn('⚠️ Start button is disabled but should be enabled');
                startBtn.disabled = false;
            }
            
            // Add a test click handler to verify it works
            const testHandler = (e) => {
                console.log('🔍 Test click detected on start button', e);
            };
            startBtn.addEventListener('click', testHandler, { once: true });
        }
    }

    startAutoProcesses() {
        // Auto-save
        setInterval(() => {
            if (!this.state.isSaving) {
                this.saveToServer();
            }
        }, this.config.autoSaveInterval);

        // Server time sync and date check (every 5 minutes) - CRITICAL for IST midnight reset
        setInterval(async () => {
            await this.getServerTime();
            this.checkForDateChange();
            this.updateDateTimeDisplay();
        }, 5 * 60 * 1000);

        // Check for date change (every minute) - CRITICAL for IST midnight reset
        setInterval(() => {
            this.checkForDateChange();
        }, 60 * 1000);
        
        // Update date/time display every second
        setInterval(() => {
            this.updateDateTimeDisplay();
        }, 1000);

        console.log('✅ Auto-save, sync, and time sync started');
    }

    handleInitError(error) {
        this.showNotification('प्रारंभ करता आले नाही', 'error');
        if (error.message === 'Not authenticated') {
            setTimeout(() => {
                window.location.href = '/guru-mantra/auth';
            }, 2000);
        }
    }

    // ================================================================
    // SPEECH RECOGNITION HANDLERS
    // ================================================================

    async startListening() {
        if (!this.recognition) {
            this.showNotification('आवाज ओळख उपलब्ध नाही', 'error');
            return;
        }

        // Request microphone permission explicitly
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately after getting permission
        } catch (permError) {
            console.error('❌ Microphone permission denied:', permError);
            this.showNotification('मायक्रोफोन ची परवानगी नाही', 'error');
            return;
        }

        if (!this.state.isListening) {
            try {
                this.recognition.start();
                this.state.isListening = true;
                this.updateUI();
                this.updateActivity(); // Reset session timeout
                console.log('🎤 Listening started');
            } catch (error) {
                console.error('❌ Start listening error:', error);
                if (error.message && error.message.includes('already started')) {
                    this.state.isListening = true;
                    this.updateUI();
                } else {
                    this.showNotification('सुरुवात करता आली नाही', 'error');
                }
            }
        }
    }

    stopListening() {
        if (this.state.isListening && this.recognition) {
            try {
                this.recognition.stop();
                this.state.isListening = false;
                this.updateUI();
                this.updateActivity(); // Reset session timeout
                console.log('⏸️ Listening stopped');
            } catch (error) {
                console.error('❌ Stop listening error:', error);
                this.state.isListening = false;
                this.updateUI();
            }
        }
    }

    onRecognitionResult(event) {
        const now = Date.now();
        const results = event.results;
        const lastResult = results[results.length - 1];

        // CRITICAL FIX: Only process FINAL results to prevent automatic counting
        // This ensures count only increases when user actually says the mantra
        if (!lastResult.isFinal) {
            return; // Don't process interim results - prevents automatic counting
        }

        let matchCount = 0;
        let bestTranscript = '';

        // Check all alternatives in the final result
        for (let i = 0; i < lastResult.length; i++) {
            const transcript = lastResult[i].transcript;
            const confidence = lastResult[i].confidence;

            if (i === 0) bestTranscript = transcript;

            console.log('🎤 Alt ' + (i + 1) + ': "' + transcript + '" (' + (confidence * 100).toFixed(1) + '%)');

            const count = this.countMantraRepetitions(transcript);
            if (count > 0) {
                matchCount = count;
                bestTranscript = transcript;
                console.log('✅ MATCH: ' + count + ' repetitions in alt ' + (i + 1));
                break; // Use first matching alternative
            }
        }

        this.displayRecognizedText(bestTranscript);
        this.metrics.recognitionAttempts++;

        if (matchCount > 0) {
            console.log('✅ Found ' + matchCount + ' mantra(s) in recognition');
            this.handleSuccessfulRecognition(matchCount, now);
        } else if (bestTranscript.trim().length > 0) {
            console.log('⚠️ No mantra match found in: "' + bestTranscript + '"');
            this.handleInvalidSpeech();
        }
    }

    onRecognitionEnd() {
        console.log('🔚 Recognition ended');

        // CRITICAL FIX: Always keep listening state true if user wants to listen
        // Only auto-restart if user is still in listening mode
        if (this.state.isListening && this.state.isInitialized && !document.hidden) {
            // Immediate restart for continuous recognition
            setTimeout(() => {
                if (this.state.isListening && this.recognition) {
                    try {
                        this.recognition.start();
                        console.log('🔄 Auto-restarting recognition');
                        // Ensure listening state stays true
                        this.state.isListening = true;
                        this.updateUI();
                    } catch (error) {
                        console.error('❌ Auto-restart failed:', error);
                        // CRITICAL FIX: Don't stop listening if recognition is already started
                        // This is a common error and doesn't mean recognition failed
                        if (error.message && error.message.includes('already started')) {
                            console.log('ℹ️ Recognition already running, continuing...');
                            // Keep listening state as true - DO NOT TURN OFF
                            this.state.isListening = true;
                            this.updateUI();
                        } else {
                            // Try again after a short delay
                            setTimeout(() => {
                                if (this.state.isListening && this.recognition) {
                                    try {
                                        this.recognition.start();
                                        this.state.isListening = true;
                                        this.updateUI();
                                    } catch (retryError) {
                                        console.error('❌ Retry failed:', retryError);
                                        // Only stop if it's a critical error
                                        if (!retryError.message || !retryError.message.includes('already started')) {
                                            this.state.isListening = false;
                                            this.updateUI();
                                        }
                                    }
                                }
                            }, 200);
                        }
                    }
                }
            }, 50); // Reduced to 50ms for faster continuous recognition
        } else {
            // Only stop if user explicitly stopped or page is hidden
            if (!this.state.isListening) {
                // User stopped it, don't restart
                this.updateUI();
            } else {
                // Page might be hidden, but keep state
                this.updateUI();
            }
        }
    }

    onRecognitionError(event) {
        console.error('❌ Recognition error:', event.error);
        
        const errorMessages = {
            'no-speech': 'कोणी बोलत नाही असे वाटते',
            'audio-capture': 'मायक्रोफोन उपलब्ध नाही आहे',
            'not-allowed': 'मायक्रोफोन ची परवानगी नाही',
            'network': 'नेटवर्क समस्या'
        };

        // CRITICAL FIX: Don't stop listening on 'no-speech' errors
        // These are common and recognition should continue
        // Only stop on critical errors
        const criticalErrors = ['not-allowed', 'audio-capture', 'network'];
        
        if (criticalErrors.includes(event.error)) {
            // Only stop if it's truly critical
            if (event.error === 'not-allowed' || event.error === 'audio-capture') {
                this.state.isListening = false;
                if (errorMessages[event.error]) {
                    this.showNotification(errorMessages[event.error], 'error');
                }
            } else {
                // For network errors, try to continue
                console.log('⚠️ Network error, attempting to continue...');
                this.state.isListening = true; // Keep listening state
            }
        } else if (event.error === 'no-speech') {
            // 'no-speech' is normal - just continue listening
            console.log('ℹ️ No speech detected, continuing to listen...');
            // CRITICAL: Keep listening state true - DO NOT TURN OFF
            this.state.isListening = true;
        } else if (event.error !== 'aborted') {
            // For other errors, try to continue
            console.log('⚠️ Recognition error, attempting to continue:', event.error);
            // CRITICAL: Keep listening state true - DO NOT TURN OFF
            this.state.isListening = true;
        }

        this.updateUI();
        
        // Auto-restart if still in listening mode and not a critical error
        if (this.state.isListening && !criticalErrors.includes(event.error) && event.error !== 'aborted') {
            setTimeout(() => {
                if (this.state.isListening && this.recognition) {
                    try {
                        this.recognition.start();
                        console.log('🔄 Auto-restarting after error');
                        // Ensure listening state stays true
                        this.state.isListening = true;
                        this.updateUI();
                    } catch (error) {
                        console.error('❌ Auto-restart after error failed:', error);
                        // Only stop if it's a critical restart failure
                        if (error.message && !error.message.includes('already started')) {
                            // Try one more time
                            setTimeout(() => {
                                if (this.state.isListening && this.recognition) {
                                    try {
                                        this.recognition.start();
                                        this.state.isListening = true;
                                        this.updateUI();
                                    } catch (retryError) {
                                        console.error('❌ Retry after error failed:', retryError);
                                        // Only stop if it's truly critical
                                        if (!retryError.message || !retryError.message.includes('already started')) {
                                            this.state.isListening = false;
                                            this.updateUI();
                                        }
                                    }
                                }
                            }, 100);
                        } else {
                            // Already started is fine - keep listening
                            this.state.isListening = true;
                            this.updateUI();
                        }
                    }
                }
            }, 100); // Reduced delay to 100ms for faster recovery after errors
        }
    }

    handleSuccessfulRecognition(count, timestamp) {
        // CRITICAL FIX: Prevent too-rapid duplicates to avoid automatic counting
        // Only process if enough time has passed since last recognition
        if (timestamp - this.state.lastRecognitionTime < this.config.minTimeBetweenCounts) {
            console.log('⏭️ Too rapid - skipping to prevent automatic counting');
            return;
        }

        this.metrics.recognitionSuccesses++;
        this.state.lastRecognitionTime = timestamp;
        this.updateActivity(); // Reset session timeout on successful recognition

        // Handle complete mantra disappearing animation ONCE (not per count)
        this.disappearCompleteMantra();

        // Calculate total words added (each complete sequence = 5 words)
        // CRITICAL: Each mantra = 5 words, rosary count increases by 1 per mantra
        // Example: 1 mantra = 5 words + 1 rosary, 2 mantras = 10 words + 2 rosary
        const totalWordsAdded = count * this.config.wordsPerPronunciation;

        // Increment counter - count mantras = count * 5 words, count rosary increments
        // The incrementCounterByCount function handles: words = count * 5, rosary = count
        this.incrementCounterByCount(count);

        // Show appropriate notification with word count
        if (count === 1) {
            this.showNotification('✅ ' + this.config.wordsPerPronunciation + ' शब्द गणना झाले! (1 माला)', 'success', 800);
        } else {
            this.showNotification('✅ ' + count + ' वेळा (' + totalWordsAdded + ' शब्द) गणना झाले! (' + count + ' माला)', 'success', 1000);
        }

        this.triggerSuccessFeedback();
    }

    handleInvalidSpeech() {
        this.showNotification('⚠️ कृपया मंत्राव्यतिरिक्त दुसरे काही म्हणू नका', 'error', 2000);
        this.triggerWarningFeedback();
    }

    // ================================================================
    // MANTRA DETECTION LOGIC - FINAL FIXED VERSION
    // ================================================================

    countMantraRepetitions(text) {
        const normalized = this.normalizeText(text);
        const cleaned = this.cleanMantraText(normalized);
        
        console.log('🔍 Original text:', text);
        console.log('🔍 Normalized text:', normalized);
        console.log('🔍 Cleaned text:', cleaned);
        
        // STRATEGY 0: Quick check for exact Guru Mantra pattern
        // This is the most common pronunciation, so check it first
        const exactMantraPattern = /om\s+tatpurushaya\s+vidmahe\s+mahadevaya\s+dhimahi\s+tanno\s+rudra\s+prachodayat/i;
        if (exactMantraPattern.test(normalized)) {
            const matches = normalized.match(new RegExp(exactMantraPattern.source, 'gi'));
            const count = matches ? matches.length : 1;
            console.log('✅ EXACT MATCH (Guru Mantra):', count);
            return count;
        }
        
        // Also check without "om" prefix
        const exactMantraNoOmPattern = /tatpurushaya\s+vidmahe\s+mahadevaya\s+dhimahi\s+tanno\s+rudra\s+prachodayat/i;
        if (exactMantraNoOmPattern.test(normalized)) {
            const matches = normalized.match(new RegExp(exactMantraNoOmPattern.source, 'gi'));
            const count = matches ? matches.length : 1;
            console.log('✅ EXACT MATCH (Guru Mantra without Om):', count);
            return count;
        }
        
        // STRATEGY 1: Exact phrase matching (fastest and most accurate)
        for (let pattern of this.config.targetPhrases) {
            const patternLower = pattern.toLowerCase();
            
            // Exact match
            if (normalized === patternLower || cleaned === patternLower) {
                console.log('✅ EXACT MATCH:', pattern);
                return 1;
            }
            
            // Contains match (for multiple repetitions)
            if (normalized.includes(patternLower) || cleaned.includes(patternLower)) {
                const textToUse = normalized.includes(patternLower) ? normalized : cleaned;
                const matches = this.countOccurrences(textToUse, patternLower);
                if (matches > 0) {
                    console.log(`✅ FOUND ${matches} occurrence(s) of:`, pattern);
                    return matches;
                }
            }
        }
        
        // STRATEGY 2: Fuzzy matching for common speech recognition errors
        const fuzzyScore = this.fuzzyMatchMantra(text); // Pass original text to preserve "hare"
        if (fuzzyScore > 0) {
            console.log('✅ FUZZY MATCH found:', fuzzyScore, 'mantras');
            return fuzzyScore;
        }
        
        console.log('❌ No match found in:', text);
        return 0;
    }

    // Helper: Count non-overlapping occurrences
    countOccurrences(text, pattern) {
        let count = 0;
        let pos = 0;
        
        while (true) {
            const index = text.indexOf(pattern, pos);
            if (index === -1) break;
            
            // Verify word boundaries
            const beforeOk = index === 0 || /\s/.test(text[index - 1]);
            const afterOk = index + pattern.length >= text.length || 
                           /\s/.test(text[index + pattern.length]);
            
            if (beforeOk && afterOk) {
                count++;
                pos = index + pattern.length;
            } else {
                pos = index + 1;
            }
        }
        
        return count;
    }

    // NEW: Enhanced fuzzy matching for Guru Mantra variations
    // Handles "Om Tatpurushaya Vidmahe Mahadevaya Dhimahi Tanno Rudra Prachodayat" and all variations
    fuzzyMatchMantra(originalText) {
        // Normalize the text first
        const normalized = this.normalizeText(originalText);
        const cleaned = this.cleanMantraText(normalized);
        
        // Check for key Guru Mantra words/phrases
        // Core phrases that indicate the mantra
        const keyPhrases = [
            /\btatpurushaya\s+vidmahe\s+mahadevaya\s+dhimahi\b/i,
            /\bvidmahe\s+mahadevaya\s+dhimahi\s+tanno\s+rudra\b/i,
            /\bmahadevaya\s+dhimahi\s+tanno\s+rudra\s+prachodayat\b/i,
            /\bdhimahi\s+tanno\s+rudra\s+prachodayat\b/i,
            /\btanno\s+rudra\s+prachodayat\b/i
        ];
        
        // Check for individual key words (at least 3-4 should be present)
        const keyWords = [
            /\btatpurushaya\b/i,
            /\bvidmahe\b/i,
            /\bmahadevaya\b/i,
            /\bdhimahi\b/i,
            /\btanno\b/i,
            /\brudra\b/i,
            /\bprachodayat\b/i
        ];
        
        // Check for key phrases first (more reliable)
        let phraseMatches = 0;
        for (const phrase of keyPhrases) {
            if (phrase.test(cleaned) || phrase.test(normalized)) {
                phraseMatches++;
            }
        }
        
        // Count key words present
        let wordMatches = 0;
        for (const word of keyWords) {
            if (word.test(cleaned) || word.test(normalized)) {
                wordMatches++;
            }
        }
        
        // Optional: Check for "om" prefix
        const hasOm = /\bom\b/i.test(cleaned) || /\bom\b/i.test(normalized);
        
        // Log what was found
        console.log('🔍 Fuzzy match components:', {
            phraseMatches,
            wordMatches,
            hasOm,
            originalText: originalText,
            normalizedText: normalized,
            cleanedText: cleaned
        });
        
        // ACCEPT if key phrases are found (most reliable)
        if (phraseMatches > 0) {
            console.log(`✅ Fuzzy match: Found ${phraseMatches} key phrase(s)`);
            return phraseMatches;
        }
        
        // ACCEPT if at least 4-5 key words are present (indicates mantra)
        if (wordMatches >= 4) {
            console.log(`✅ Fuzzy match: Found ${wordMatches} key words`);
            return 1; // Count as one mantra
        }
        
        // ACCEPT if "rudra prachodayat" is present (distinctive ending)
        if (/\brudra\s+prachodayat\b/i.test(cleaned) || /\brudra\s+prachodayat\b/i.test(normalized)) {
            console.log('✅ Fuzzy match: Found "rudra prachodayat"');
            return 1;
        }
        
        // ACCEPT if "mahadevaya dhimahi" is present (distinctive middle)
        if (/\bmahadevaya\s+dhimahi\b/i.test(cleaned) || /\bmahadevaya\s+dhimahi\b/i.test(normalized)) {
            console.log('✅ Fuzzy match: Found "mahadevaya dhimahi"');
            return 1;
        }
        
        // No match found
        console.log('❌ Fuzzy match: Insufficient key words/phrases found');
        return 0;
        // - "ramkrishna" (no space)
        
        // Count occurrences - prioritize "jai jai" count if present (more accurate)
        if (hasJaiJay) {
            const jaiJayPattern = /\b(jai|jay)\s+(jai|jay)\b/gi;
            const jaiJayMatches = cleaned.match(jaiJayPattern) || normalized.match(jaiJayPattern);
            const jaiJayCount = jaiJayMatches ? jaiJayMatches.length : 0;
            if (jaiJayCount > 0) {
                console.log('✅ Using jai jai count:', jaiJayCount);
                return jaiJayCount;
            }
        }
        
        // Count "ram krishna" occurrences (with or without space)
        const ramKrishnaMatches = cleaned.match(ramKrishnaPattern) || cleaned.match(ramKrishnaNoSpace);
        const coreMatches = ramKrishnaMatches ? ramKrishnaMatches.length : 0;
        
        if (coreMatches > 0) {
            console.log('✅ Fuzzy match - "ram krishna" found:', coreMatches, 'time(s)');
            return coreMatches;
        }
        
        // If we have ram and krishna nearby, count as 1
        if (hasRamKrishnaNearby) {
            console.log('✅ Fuzzy match - "ram" and "krishna" found nearby, counting as 1');
            return 1;
        }
        
        return 0;
    }

    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[।,\.!\?;:"']/g, ' ')  // Replace punctuation with space
            .replace(/\s+/g, ' ')             // Normalize multiple spaces
            .trim();
    }

    cleanMantraText(text) {
        // Normalize common word variations for better matching
        // IMPORTANT: This normalization helps with matching but we also check
        // the original normalized text in fuzzyMatchMantra for "hare" specifically
        return text
            // Normalize hari/hare/haare variations (all are acceptable)
            // Keep "hare" recognizable - convert to "hari" for consistency
            .replace(/\b(haare|hare|harry|her|hair)\b/gi, 'hari')  // Normalize all variations → hari
            .replace(/\bहारी\b/g, 'hari')                  // Hindi हारी → hari
            .replace(/\bहरी\b/g, 'hari')                   // Hindi हरी → hari
            .replace(/\bहरि\b/g, 'hari')                    // Hindi हरि → hari
            // Normalize krishna variations
            .replace(/\bkrishn\b/gi, 'krishna')            // Normalize krishn → krishna
            .replace(/\bकृष्ण\b/g, 'krishna')              // Hindi कृष्ण → krishna
            .replace(/\bकृष्णा\b/g, 'krishna')             // Hindi कृष्णा → krishna
            // Normalize jay/jai variations
            .replace(/\bjay\b/gi, 'jai')                   // Normalize jay → jai
            .replace(/\bजय\b/g, 'jai')                     // Hindi जय → jai
            // Normalize ram (handle common mispronunciations)
            .replace(/\bराम\b/g, 'ram')                   // Hindi राम → ram
            // Handle "ramkrishna" as one word - add space for better matching
            .replace(/\bramkrishna\b/gi, 'ram krishna')
            .replace(/\bramkrishn\b/gi, 'ram krishna')
            // Clean up extra spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ================================================================
    // COUNTING LOGIC
    // ================================================================

    incrementCounterByCount(count) {
        // DO NOT reset dates during increment - let checkForDateChange handle it
        // This prevents false resets during chanting

        // Calculate total words and pronunciations for this recognition
        const wordsToAdd = count * this.config.wordsPerPronunciation;
        const pronunciationsToAdd = count;

        console.log('DEBUG: Before increment - currentMala:', this.state.currentMalaPronunciations, 'todayMalas:', this.state.todayMalas, 'count to add:', count, 'pronunciationsToAdd:', pronunciationsToAdd);

        // Check for mala completion BEFORE incrementing
        // This ensures we capture the completed mala properly
        const willCompleteMala = (this.state.currentMalaPronunciations + pronunciationsToAdd) >= this.config.pronunciationsPerMala;
        
        if (willCompleteMala) {
            console.log('DEBUG: MALA WILL BE COMPLETED! Incrementing todayMalas from', this.state.todayMalas);
            this.state.totalMalas++;
            this.state.todayMalas++;
            console.log('DEBUG: After mala completion - todayMalas:', this.state.todayMalas, 'totalMalas:', this.state.totalMalas);
            
            // Calculate remaining pronunciations for current mala
            const remainingForCurrentMala = this.config.pronunciationsPerMala - this.state.currentMalaPronunciations;
            this.state.currentMalaPronunciations = 0;
            
            // Handle excess pronunciations for next mala
            const excessPronunciations = pronunciationsToAdd - remainingForCurrentMala;
            if (excessPronunciations > 0) {
                this.state.currentMalaPronunciations = excessPronunciations;
            }
            
            setTimeout(() => this.completeMala(), 100);
        } else {
            // Normal increment - no mala completion
            this.state.currentMalaPronunciations += pronunciationsToAdd;
        }

        // CRITICAL FIX: Increment both total and today's counts
        // These are the authoritative sources for count tracking
        this.state.totalWords += wordsToAdd;
        this.state.totalPronunciations += pronunciationsToAdd;
        this.state.todayWords += wordsToAdd;
        this.state.todayPronunciations += pronunciationsToAdd;

        // CRITICAL FIX: todaysCount should always equal todayWords
        // Don't recalculate from mala progress - use the actual increment
        this.state.todaysCount = this.state.todayWords;

        console.log('📊 Count Update:', {
            totalWords: this.state.totalWords,
            todayWords: this.state.todayWords, 
            todayPronunciations: this.state.todayPronunciations,
            currentMalaPronunciations: this.state.currentMalaPronunciations,
            todayMalas: this.state.todayMalas,
            todaysCount: this.state.todaysCount
        });

        this.updateUI();
        this.saveToServer();
    }

    incrementCounter() {
        // Legacy method - now calls incrementCounterByCount with count 1
        this.incrementCounterByCount(1);
    }

    completeMala() {
        console.log('🎉 Mala completed! Total: ' + this.state.totalMalas + ', Today: ' + this.state.todayMalas);

        this.triggerMalaCelebration();
        this.checkMilestones();
        this.updateUI();
    }

    checkMilestones() {
        if (this.config.milestones.includes(this.state.totalMalas)) {
            this.triggerMilestoneCelebration(this.state.totalMalas);
        }
    }

    addManualCount() {
        // Trigger complete mantra disappearing for manual count
        this.disappearCompleteMantra();
        this.updateActivity(); // Reset session timeout
        
        // Increment counter by 1 (single mantra)
        this.incrementCounterByCount(1);
        
        this.showNotification('➕ व्यक्तिशः काउंट जोडले गेले', 'success', 1000);
        this.triggerSuccessFeedback();
    }

    confirmReset() {
        if (confirm('खात्री आहे काय? आज के जप रिसेट होईल (कुल जप सुरक्षित रहेगा)')) {
            this.resetCounter();
            this.updateActivity(); // Reset session timeout
        }
    }

    resetCounter() {
        // Only reset today's counts, preserve total counts
        this.state.todayWords = 0;
        this.state.todayPronunciations = 0;
        this.state.todayMalas = 0;
        this.state.currentMalaPronunciations = 0;
        this.state.todaysCount = 0; // Reset persistent today's count

        // Reset mantra display
        this.resetMantraDisplay();

        this.updateUI();
        this.saveToServer(true);
        this.showNotification('आज के जप रिसेट झाले (कुल जप सुरक्षित)', 'info');

        console.log('🔄 Today\'s counter reset (total preserved)');
    }

    // ================================================================
    // DATA PERSISTENCE
    // ================================================================

    async loadStateFromServer() {
        try {
            console.log('📥 Loading state from server...');

            const response = await fetch('/guru-mantra/api/state', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();

            if (data.success) {
                // CRITICAL FIX: Only update from server if loading from initial state
                // or if the server values are higher (preserve data integrity)
                const serverCount = data.count || 0;
                const serverTotalMalas = data.total_malas || 0;
                const serverTotalPronunciations = data.total_pronunciations || 0;
                
                // Use the greater value to prevent data loss
                this.state.totalWords = Math.max(this.state.totalWords, serverCount);
                this.state.totalMalas = Math.max(this.state.totalMalas, serverTotalMalas);
                this.state.totalPronunciations = Math.max(this.state.totalPronunciations, serverTotalPronunciations);
                
                // Load session-specific data (can be different from client)
                this.state.currentMalaPronunciations = data.current_mala_pronunciations || 0;
                
                // CRITICAL FIX: Load today's data and check if date matches
                // Use server date from response, and compare with serverDate (IST) from getServerTime
                const serverTodayDate = data.today_date || this.serverDate || this.getTodayDateString();
                const currentServerDate = this.serverDate || this.getTodayDateString();
                
                console.log('📅 Date comparison - Server stored date:', serverTodayDate, 'Current server date:', currentServerDate, 'isFirstLoad:', this.state.isFirstLoad);
                console.log('📅 Full server response:', {
                    today_date: data.today_date,
                    today_words: data.today_words,
                    todays_count: data.todays_count,
                    today_malas: data.today_malas
                });
                
                // CRITICAL FIX: Always load today's data from server if server date matches current server date
                // This ensures today's count persists after logout/login
                // Only skip loading if the date has actually changed (IST midnight passed)
                // Also handle case where serverDate might not be loaded yet - use server's today_date as fallback
                const datesMatch = serverTodayDate === currentServerDate || 
                                  (!this.serverDate && serverTodayDate); // If serverDate not loaded, trust server's today_date
                
                if (datesMatch) {
                    // Server date matches current date - load today's data from server
                    // CRITICAL: Use todays_count if available, otherwise use today_words
                    const serverTodaysCount = data.todays_count !== undefined ? data.todays_count : (data.today_words || 0);
                    
                    const serverTodayWords = data.today_words || 0;
                    const serverTodayPronunciations = data.today_pronunciations || 0;
                    const serverTodayMalas = data.today_malas || 0;
                    
                    // CRITICAL FIX: On first load, directly assign server values
                    // On subsequent syncs, use Math.max to prevent overwriting local increments
                    if (this.state.isFirstLoad) {
                        // First load - directly assign from server
                        // This is critical for preserving count after logout/login
                        this.state.todayWords = serverTodayWords;
                        this.state.todayPronunciations = serverTodayPronunciations;
                        this.state.todayMalas = serverTodayMalas;
                        this.state.todaysCount = serverTodaysCount;
                        this.state.todayDate = serverTodayDate;
                        this.state.isFirstLoad = false;  // Mark that first load is complete
                        
                        console.log('✅ FIRST LOAD - directly loaded today\'s data from server:', {
                            todayWords: this.state.todayWords,
                            todaysCount: this.state.todaysCount,
                            todayDate: this.state.todayDate,
                            serverTodayDate: serverTodayDate,
                            currentServerDate: currentServerDate,
                            serverTodayWords: serverTodayWords,
                            serverTodaysCount: serverTodaysCount
                        });
                        
                        // CRITICAL: Update UI immediately after first load
                        this.updateUI();
                    } else {
                        // Subsequent sync - use Math.max to prevent overwriting local increments
                        this.state.todayWords = Math.max(this.state.todayWords, serverTodayWords);
                        this.state.todayPronunciations = Math.max(this.state.todayPronunciations, serverTodayPronunciations);
                        this.state.todayMalas = Math.max(this.state.todayMalas, serverTodayMalas);
                        this.state.todaysCount = Math.max(this.state.todaysCount, serverTodaysCount);
                        this.state.todayDate = serverTodayDate;
                        
                        // Ensure todaysCount reflects todayWords if it's higher
                        if (this.state.todayWords > this.state.todaysCount) {
                            this.state.todaysCount = this.state.todayWords;
                        }
                        
                        console.log('✅ Sync - loaded today\'s data from server (using Math.max):', {
                            todayWords: this.state.todayWords,
                            todaysCount: this.state.todaysCount,
                            todayDate: this.state.todayDate
                        });
                    }
                } else {
                    // Date changed - server date is different from current date
                    // This means IST midnight passed - reset will be handled by checkForDateChange
                    console.log('📅 Date changed detected. Server stored:', serverTodayDate, 'Current:', currentServerDate);
                    
                    // CRITICAL FIX: On first load, if dates don't match but server has data,
                    // it might be a timezone/format issue. Only reset if we're sure it's a new day.
                    // If it's first load and server has non-zero count, be more cautious about resetting
                    if (this.state.isFirstLoad && (serverTodayWords > 0 || serverTodaysCount > 0)) {
                        console.warn('⚠️ First load: Dates don\'t match but server has count data. Loading anyway to preserve data.');
                        // Load the data anyway - might be a date format issue
                        this.state.todayWords = serverTodayWords;
                        this.state.todayPronunciations = serverTodayPronunciations;
                        this.state.todayMalas = serverTodayMalas;
                        this.state.todaysCount = serverTodaysCount;
                        this.state.todayDate = serverTodayDate || currentServerDate;
                        this.state.isFirstLoad = false;
                        this.updateUI();
                    } else {
                        // Set todayDate to current server date to prevent false resets
                        this.state.todayDate = currentServerDate;
                        // Initialize today's counters to 0 for new day
                        this.state.todayWords = 0;
                        this.state.todayPronunciations = 0;
                        this.state.todayMalas = 0;
                        this.state.todaysCount = 0;
                        this.state.currentMalaPronunciations = 0;
                    }
                }

                console.log('DEBUG LOAD: todayMalas=' + this.state.todayMalas + ', todaysCount=' + this.state.todaysCount + ', currentMalaPron=' + this.state.currentMalaPronunciations);
                console.log('✅ State loaded:', {
                    totalWords: this.state.totalWords,
                    totalPronunciations: this.state.totalPronunciations,
                    currentMalaPronunciations: this.state.currentMalaPronunciations,
                    totalMalas: this.state.totalMalas,
                    todayWords: this.state.todayWords,
                    todayPronunciations: this.state.todayPronunciations,
                    todayMalas: this.state.todayMalas,
                    todaysCount: this.state.todaysCount
                });
            }
        } catch (error) {
            console.error('❌ Error loading from server:', error);
            this.showNotification('डेटा लोड करता आला नाही', 'error');
        }
    }

    async saveToServer(immediate = false) {
        if (this.state.isSaving && !immediate) {
            console.log('⏭️ Save in progress, skipping...');
            return;
        }

        this.state.isSaving = true;

        try {
            // Calculate actual todays count for persistence
            const actualTodaysCount = this.calculateTodayTotalWords();
            
            const payload = {
                count: this.state.totalWords,
                totalMalas: this.state.totalMalas,
                currentMalaPronunciations: this.state.currentMalaPronunciations,
                totalPronunciations: this.state.totalPronunciations,
                todayWords: this.state.todayWords,
                todayPronunciations: this.state.todayPronunciations,
                todayMalas: this.state.todayMalas,
                todayDate: this.state.todayDate,
                todaysCount: actualTodaysCount // Save the calculated value
            };

            console.log('💾 Saving to server:', payload);
            console.log('DEBUG SAVE: todayMalas=' + payload.todayMalas + ', todaysCount=' + payload.todaysCount + ', currentMalaPron=' + payload.currentMalaPronunciations);

            const response = await fetch('/guru-mantra/api/save', {
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

    // ================================================================
    // UI UPDATE METHODS
    // ================================================================

    updateUI() {
        this.updateCountDisplay();
        this.updateMalaStatus();
        this.updateProgress();
        this.updateListeningStatus();
        this.updateButtons();
        this.updateSessionStats();
        this.updateFullJapDisplay();
        this.updateMantraDisplay();
        this.updateDateTimeDisplay();
    }

    updateCountDisplay() {
        if (this.elements.countDisplay) {
            const todayTotalWords = this.calculateTodayTotalWords();
            
            const current = parseInt(this.elements.countDisplay.textContent) || 0;
            if (current !== todayTotalWords) {
                this.elements.countDisplay.classList.add('pulse');
                this.elements.countDisplay.textContent = todayTotalWords;
                setTimeout(() => {
                    this.elements.countDisplay.classList.remove('pulse');
                }, 500);
            }
        }
    }

    updateMalaStatus() {
        if (this.elements.totalMalas) {
            this.elements.totalMalas.textContent = 'कुल माला: ' + this.state.totalMalas + ' | आज: ' + this.state.todayMalas;
        }

        if (this.elements.malaStatus) {
            this.elements.malaStatus.textContent =
                'वर्तमान माला: ' + this.state.currentMalaPronunciations + ' / ' + this.config.pronunciationsPerMala;
        }

        if (this.elements.remainingCount) {
            const remaining = this.config.pronunciationsPerMala - this.state.currentMalaPronunciations;
            this.elements.remainingCount.textContent = 'शेष: ' + remaining + ' वार';
        }
    }

    updateProgress() {
        if (this.elements.progressFill) {
            const progress = (this.state.currentMalaPronunciations / this.config.pronunciationsPerMala) * 100;
            this.elements.progressFill.style.width = Math.min(progress, 100) + '%';
        }
    }

    updateListeningStatus() {
        if (this.elements.listeningStatus) {
            if (this.state.isListening) {
                this.elements.listeningStatus.textContent = '🎤 ऐकत आहे...';
                this.elements.listeningStatus.classList.add('listening');
            } else {
                this.elements.listeningStatus.textContent = '⏸️ थांबलेले आहे';
                this.elements.listeningStatus.classList.remove('listening');
            }
        }
    }

    updateButtons() {
        if (this.elements.startBtn && this.elements.stopBtn) {
            this.elements.startBtn.disabled = this.state.isListening;
            this.elements.stopBtn.disabled = !this.state.isListening;

            if (this.state.isListening) {
                this.elements.startBtn.classList.add('active');
            } else {
                this.elements.startBtn.classList.remove('active');
            }
        }
    }

    updateSessionStats() {
        if (this.elements.sessionTime) {
            const minutes = Math.floor((Date.now() - this.state.sessionStartTime) / 60000);
            this.elements.sessionTime.textContent = minutes + ' मिनट';
        }

        if (this.elements.todayCount) {
            const todayTotalWords = this.calculateTodayTotalWords();
            this.elements.todayCount.textContent = todayTotalWords;
        }

        if (this.elements.accuracy && this.metrics.recognitionAttempts > 0) {
            const accuracy = Math.round(
                (this.metrics.recognitionSuccesses / this.metrics.recognitionAttempts) * 100
            );
            this.elements.accuracy.textContent = accuracy + '%';
        }
    }

    updateDateTimeDisplay() {
        // Update both the datetimeDisplay in user-info and datetimeDisplaySection in counter-section
        const displayElement = this.elements.datetimeDisplay || 
                              (this.elements.datetimeDisplaySection ? 
                               this.elements.datetimeDisplaySection.querySelector('#datetimeDisplay') : null);
        
        if (displayElement) {
            // Use server time if available, otherwise use client time
            let now;
            
            // Check if we have server time data (from getServerTime response)
            if (this.serverHour !== null && this.serverMinute !== null && this.serverSecond !== null) {
                // Use server-provided hour, minute, second directly (already in IST)
                // Create a date object for today using server date
                const serverDateParts = this.serverDate.split('-');
                const year = parseInt(serverDateParts[0]);
                const month = parseInt(serverDateParts[1]) - 1; // JavaScript months are 0-indexed
                const day = parseInt(serverDateParts[2]);
                
                // Create date in IST (UTC+5:30)
                // We'll create it in UTC and then adjust
                now = new Date(Date.UTC(year, month, day, this.serverHour, this.serverMinute, this.serverSecond));
                // Adjust for IST offset (subtract 5:30 from UTC to get IST)
                const istOffset = 5.5 * 60 * 60 * 1000;
                now = new Date(now.getTime() - istOffset);
            } else if (this.serverTime) {
                // Fallback: Parse server datetime string if available
                try {
                    // Server time is already in IST, so parse it directly
                    now = new Date(this.serverTime);
                    if (isNaN(now.getTime())) {
                        throw new Error('Invalid date');
                    }
                } catch (e) {
                    console.error('Error parsing server time:', e, 'Server time:', this.serverTime);
                    // Fallback to current time in IST
                    now = this.getClientISTTime();
                }
            } else {
                // Fallback to client time with IST adjustment
                now = this.getClientISTTime();
            }
            
            // Format date and time
            // Format: "17 जानेवारी 2026, 18:10:04 IST"
            const dateStr = now.toLocaleDateString('mr-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });
            
            // Format time manually to ensure correct display (use server time directly)
            let hours, minutes, seconds;
            if (this.serverHour !== null && this.serverMinute !== null && this.serverSecond !== null) {
                // Use server time directly and add elapsed seconds for live clock
                let currentSecond = this.serverSecond;
                if (this.serverTimeFetchedAt) {
                    const elapsedSeconds = Math.floor((Date.now() - this.serverTimeFetchedAt) / 1000);
                    currentSecond = (this.serverSecond + elapsedSeconds) % 60;
                    const additionalMinutes = Math.floor((this.serverSecond + elapsedSeconds) / 60);
                    if (additionalMinutes > 0) {
                        const currentMinute = (this.serverMinute + additionalMinutes) % 60;
                        const additionalHours = Math.floor((this.serverMinute + additionalMinutes) / 60);
                        minutes = String(currentMinute).padStart(2, '0');
                        hours = String((this.serverHour + additionalHours) % 24).padStart(2, '0');
                    } else {
                        hours = String(this.serverHour).padStart(2, '0');
                        minutes = String(this.serverMinute).padStart(2, '0');
                    }
                } else {
                    hours = String(this.serverHour).padStart(2, '0');
                    minutes = String(this.serverMinute).padStart(2, '0');
                }
                seconds = String(currentSecond).padStart(2, '0');
            } else {
                // Fallback: format from date object
                hours = String(now.getHours()).padStart(2, '0');
                minutes = String(now.getMinutes()).padStart(2, '0');
                seconds = String(now.getSeconds()).padStart(2, '0');
            }
            const timeStr = `${hours}:${minutes}:${seconds}`;
            
            displayElement.textContent = `${dateStr}, ${timeStr} IST`;
        }
    }
    
    getClientISTTime() {
        // Get current time and convert to IST
        const now = new Date();
        // Convert to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
        return new Date(utcTime + istOffset);
    }

    displayRecognizedText(text) {
        if (this.elements.recognitionText) {
            this.elements.recognitionText.textContent = text;
        }
    }

    updateFullJapDisplay() {
        if (this.elements.fullJapCount) {
            // Show total lifetime count, not today's count
            const current = parseInt(this.elements.fullJapCount.textContent) || 0;
            if (current !== this.state.totalWords) {
                this.elements.fullJapCount.classList.add('pulse');
                this.elements.fullJapCount.textContent = this.state.totalWords;
                setTimeout(() => {
                    this.elements.fullJapCount.classList.remove('pulse');
                }, 500);
            }
        }
    }

    // ================================================================
    // MANTRA WORD DISAPPEARING METHODS
    // ================================================================

    updateMantraDisplay() {
        const mantraWords = document.querySelectorAll('.mantra-word');
        mantraWords.forEach(word => {
            word.classList.remove('current', 'completed', 'disappearing');
        });
    }

    disappearCompleteMantra() {
        console.log('🎉 Complete mantra recognized! All words disappearing...');
        
        // Make all words disappear simultaneously
        const mantraWords = document.querySelectorAll('.mantra-word');
        mantraWords.forEach(word => {
            word.classList.add('disappearing');
        });
        
        setTimeout(() => {
            // After animation, reset all words (no counter increment here)
            mantraWords.forEach(word => {
                word.classList.remove('disappearing');
            });
        }, 800);
    }

    resetMantraDisplay() {
        const mantraWords = document.querySelectorAll('.mantra-word');
        mantraWords.forEach(word => {
            word.classList.remove('completed', 'current', 'disappearing');
        });
        this.updateMantraDisplay();
    }

    // ================================================================
    // VISUAL FEEDBACK & CELEBRATIONS
    // ================================================================

    triggerSuccessFeedback() {
        this.flashBackground('rgba(76, 175, 80, 0.1)', 200);
    }

    triggerWarningFeedback() {
        this.flashBackground('rgba(255, 152, 0, 0.1)', 200);
    }

    flashBackground(color, duration) {
        document.body.style.background = 'radial-gradient(ellipse at center, ' + color + ', transparent)';
        setTimeout(() => {
            document.body.style.background = '';
        }, duration);
    }

    triggerMalaCelebration() {
        this.showCelebration('🎉 एक माला पूर्ण झाली! 🎉', 'हरी बोला! आणखी एक मिळवली!');
        // Reduced confetti for less eye irritation
        this.createConfetti();
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

    showCelebration(message, subMessage = '', duration = 3000) {
        if (!this.elements.celebration) return;

        this.elements.celebration.innerHTML = 
            '<div class="celebration-text">' + message + '</div>' +
            (subMessage ? '<div class="celebration-subtext">' + subMessage + '</div>' : '');

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
        const confettiCount = 20; // Reduced from 50 to 20

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = 
                'position: fixed;' +
                'width: 8px;' +
                'height: 8px;' +
                'background: ' + colors[Math.floor(Math.random() * colors.length)] + ';' +
                'left: ' + (Math.random() * 100) + '%;' +
                'top: -10px;' +
                'border-radius: 50%;' +
                'pointer-events: none;' +
                'z-index: 9999;' +
                'opacity: 0.7;' +
                'animation: confetti-fall ' + (1.5 + Math.random() * 1) + 's ease-out;';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');

        const bgColors = {
            success: 'linear-gradient(135deg, #4caf50, #66bb6a)',
            error: 'linear-gradient(135deg, #f44336, #ef5350)',
            info: 'linear-gradient(135deg, #2196f3, #42a5f5)'
        };

        notification.style.cssText = 
            'position: fixed;' +
            'top: 20px;' +
            'right: 20px;' +
            'padding: 12px 16px;' +
            'background: ' + (bgColors[type] || bgColors.info) + ';' +
            'color: white;' +
            'border-radius: 8px;' +
            'box-shadow: 0 4px 20px rgba(0,0,0,0.3);' +
            'z-index: 10000;' +
            'animation: slide-in 0.3s ease-out;' +
            'font-size: 0.9rem;' +
            'max-width: 300px;' +
            'word-wrap: break-word;';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // ================================================================
    // SESSION TIMEOUT METHODS
    // ================================================================

    startSessionTimeout() {
        this.resetSessionTimeout();
        console.log('⏰ Session timeout started (5 minutes)');
    }

    resetSessionTimeout() {
        // Clear existing timeouts
        if (this.sessionTimeout.timeoutId) {
            clearTimeout(this.sessionTimeout.timeoutId);
        }
        if (this.sessionTimeout.warningId) {
            clearTimeout(this.sessionTimeout.warningId);
        }

        // Update last activity
        this.sessionTimeout.lastActivity = Date.now();
        this.sessionTimeout.isWarningShown = false;

        // CRITICAL FIX: Show prompt at exactly 5 minutes of inactivity
        // If user clicks "Yes", continue; if "No", logout immediately
        // Don't show warning at 4.5 minutes - show prompt at 5 minutes
        this.sessionTimeout.timeoutId = setTimeout(() => {
            this.showSessionWarning();
            // If user doesn't respond within 30 seconds, logout
            this.sessionTimeout.warningId = setTimeout(() => {
                if (this.sessionTimeout.isWarningShown) {
                    this.forceLogout();
                }
            }, 30000); // 30 seconds to respond
        }, this.sessionTimeout.duration);
    }

    showSessionWarning() {
        if (this.sessionTimeout.isWarningShown) {
            return;
        }

        this.sessionTimeout.isWarningShown = true;
        
        // CRITICAL FIX: Show prompt asking "Do you want to continue chanting?"
        // If Yes, continue session; If No, logout
        const warningDialog = document.createElement('div');
        warningDialog.id = 'sessionWarningDialog';
        warningDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Noto Sans Devanagari', sans-serif;
        `;

        warningDialog.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 24px; margin-bottom: 15px;">⚠️</div>
                <h3 style="color: #f44336; margin-bottom: 15px;">जप जारी रखना चाहते हैं?</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    आपने 5 मिनट से जप नहीं किया है।<br>
                    क्या आप जप जारी रखना चाहते हैं?
                </p>
                <button id="continueSessionBtn" style="
                    background: #4caf50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-right: 10px;
                ">हाँ, जारी रखें</button>
                <button id="logoutNowBtn" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                ">नहीं, लॉगआउट</button>
            </div>
        `;

        document.body.appendChild(warningDialog);

        // Add event listeners
        document.getElementById('continueSessionBtn').addEventListener('click', () => {
            this.continueSession();
        });

        document.getElementById('logoutNowBtn').addEventListener('click', () => {
            this.logout();
        });

        console.log('⚠️ Session warning shown - asking user to continue chanting');
    }

    continueSession() {
        // Remove warning dialog
        const dialog = document.getElementById('sessionWarningDialog');
        if (dialog) {
            dialog.remove();
        }

        // Clear the warning timeout if it exists
        if (this.sessionTimeout.warningId) {
            clearTimeout(this.sessionTimeout.warningId);
        }

        // Reset session timeout
        this.resetSessionTimeout();
        this.showNotification('सत्र जारी रखा गया', 'success', 2000);
        console.log('✅ Session continued by user');
    }

    forceLogout() {
        console.log('🚪 Force logout due to inactivity');
        this.showNotification('सत्र समाप्त हो गया', 'error', 2000);
        
        // Remove warning dialog if still present
        const dialog = document.getElementById('sessionWarningDialog');
        if (dialog) {
            dialog.remove();
        }

        // Logout after a short delay
        setTimeout(() => {
            this.logout();
        }, 1000);
    }

    updateActivity() {
        // This method should be called whenever user performs an activity
        this.resetSessionTimeout();
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    calculateTodayTotalWords() {
        // CRITICAL FIX: Calculate today's total words based on actual today words
        // This ensures that todaysCount reflects the actual count that happened today
        // Use today_words directly from state as it's the authoritative source
        // Only if it's 0, calculate from mala progress
        if (this.state.todayWords > 0) {
            return this.state.todayWords;
        }
        
        // Fallback: calculate based on current mala progress and completed malas
        // This handles the case when todayWords hasn't been set yet
        const currentMalaWords = this.state.currentMalaPronunciations * this.config.wordsPerPronunciation;
        const completedMalasWords = this.state.todayMalas * this.config.pronunciationsPerMala * this.config.wordsPerPronunciation;
        const calculatedTotal = currentMalaWords + completedMalasWords;
        
        return calculatedTotal;
    }

    getTodayDateString() {
        // CRITICAL FIX: Always use server date for consistency with timezone
        // This ensures date comparisons are done with server timezone (IST)
        if (this.serverDate) {
            return this.serverDate;
        }
        
        // If server date not loaded yet, return local date as fallback
        // This prevents infinite recursion - server date will be loaded asynchronously
        const today = new Date();
        const fallbackDate = today.getFullYear() + '-' + 
               String(today.getMonth() + 1).padStart(2, '0') + '-' + 
               String(today.getDate()).padStart(2, '0');
        
        // Try to load server time asynchronously (don't wait for it)
        if (!this.serverTimeLoading) {
            this.serverTimeLoading = true;
            this.getServerTime().then(() => {
                this.serverTimeLoading = false;
                // Once server time is loaded, check for date change
                if (this.state.isInitialized) {
                    this.checkForDateChange();
                }
            }).catch(() => {
                this.serverTimeLoading = false;
            });
        }
        
        return fallbackDate;
    }

    async getServerTime() {
        try {
            const response = await fetch('/guru-mantra/api/server_time', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.serverDate = data.date;
                    this.serverTime = data.datetime;
                    // Store hour, minute, second separately for accurate time display
                    this.serverHour = data.hour !== undefined ? parseInt(data.hour) : null;
                    this.serverMinute = data.minute !== undefined ? parseInt(data.minute) : null;
                    this.serverSecond = data.second !== undefined ? parseInt(data.second) : null;
                    this.serverTimeFetchedAt = Date.now(); // Store when we fetched the time for live clock
                    console.log('🕐 Server time loaded:', data.date, 'at', this.serverHour + ':' + this.serverMinute + ':' + this.serverSecond, 'Server datetime:', data.datetime);
                    
                    // Update date/time display when server time is loaded
                    this.updateDateTimeDisplay();
                    
                    // If server time was loaded, trigger date check
                    if (this.state.isInitialized) {
                        this.checkForDateChange();
                    }
                    
                    return data.date;
                }
            }
        } catch (error) {
            console.error('❌ Error getting server time:', error);
        }
        
        // Fallback: return today's date in ISO format (will be corrected on next server sync)
        const today = new Date();
        return today.getFullYear() + '-' + 
               String(today.getMonth() + 1).padStart(2, '0') + '-' + 
               String(today.getDate()).padStart(2, '0');
    }

    checkForDateChange() {
        // CRITICAL FIX: Only check for date change if we have server time
        // This ensures we're using IST timezone for accurate midnight detection
        if (!this.serverDate) {
            // Server time not loaded yet, skip check
            return;
        }
        
        const currentDate = this.serverDate; // Use server date (IST) for comparison
        
        // Only reset if the date actually changed (e.g., midnight passed)
        // Do NOT reset if dates are the same (prevent false positives)
        if (this.state.todayDate && this.state.todayDate !== currentDate) {
            console.log('📅 Date change detected! Resetting today\'s count. Old date:', this.state.todayDate, 'New date:', currentDate);
            
            // CRITICAL FIX: Save current day's progress BEFORE resetting
            this.saveToServer(true);
            
            // Now reset today's counters for the new day
            // CRITICAL: Only reset today's fields, NEVER reset total count
            this.state.todayWords = 0;
            this.state.todayPronunciations = 0;
            this.state.todayMalas = 0;
            this.state.currentMalaPronunciations = 0; // Reset current mala for new day
            this.state.todayDate = currentDate;
            this.state.todaysCount = 0; // Reset persistent today's count
            
            // Show notification about new day
            this.showNotification('🌅 नया दिन! आज के जप शुरू करें', 'info', 3000);
            
            // Update UI and save
            this.updateUI();
            this.saveToServer(true);
        } else if (!this.state.todayDate) {
            // If todayDate is not set, set it without resetting
            this.state.todayDate = currentDate;
            this.saveToServer();
        }
    }

    isMobileDevice() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    // ================================================================
    // USER ACTIONS
    // ================================================================

    async logout() {
        try {
            console.log('👋 Logging out...');
            
            // CRITICAL FIX: Save all state to server before logging out
            // This ensures count persists after logout/login
            await this.saveToServer(true);
            console.log('✅ State saved before logout');

            // Stop listening if active
            if (this.state.isListening) {
                this.stopListening();
            }

            // Clear session timeout
            if (this.sessionTimeout.timeoutId) {
                clearTimeout(this.sessionTimeout.timeoutId);
            }
            if (this.sessionTimeout.warningId) {
                clearTimeout(this.sessionTimeout.warningId);
            }

            await fetch('/guru-mantra/auth/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });

            window.location.href = '/guru-mantra/auth';
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Even if logout fails, redirect to login
            window.location.href = '/guru-mantra/auth';
        }
    }
}

// ====================================================================
// GLOBAL STYLES
// ====================================================================

const style = document.createElement('style');
style.textContent = `
    /* Animations */
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

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
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

// ====================================================================
// APPLICATION INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🙏 Initializing Hari Jap Counter Application');
    window.guruMantraCounter = new GuruMantraCounter();
    
    // Fallback: Direct event listeners if initialization failed
    setTimeout(() => {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const manualBtn = document.getElementById('manualBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (startBtn && !startBtn.onclick) {
            console.log('⚠️ Adding fallback click handler for startBtn');
            startBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Fallback click handler triggered for startBtn');
                if (window.guruMantraCounter && typeof window.guruMantraCounter.startListening === 'function') {
                    window.guruMantraCounter.startListening();
                } else {
                    console.error('❌ hariJapCounter not initialized or startListening not available');
                }
            }, { capture: true });
        }
        
        if (stopBtn && !stopBtn.onclick) {
            stopBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.guruMantraCounter && typeof window.guruMantraCounter.stopListening === 'function') {
                    window.guruMantraCounter.stopListening();
                }
            }, { capture: true });
        }
        
        if (manualBtn && !manualBtn.onclick) {
            manualBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.guruMantraCounter && typeof window.guruMantraCounter.addManualCount === 'function') {
                    window.guruMantraCounter.addManualCount();
                }
            }, { capture: true });
        }
        
        if (resetBtn && !resetBtn.onclick) {
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.guruMantraCounter && typeof window.guruMantraCounter.confirmReset === 'function') {
                    window.guruMantraCounter.confirmReset();
                }
            }, { capture: true });
        }
    }, 1000);
});

// ====================================================================
// DEBUG HELPER FUNCTION
// ====================================================================

window.debugHariJapButtons = function() {
    console.log('🔍 Debugging Hari Jap Buttons...');
    const buttons = ['startBtn', 'stopBtn', 'manualBtn', 'resetBtn'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            const elementAtPoint = document.elementFromPoint(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
            
            console.log(`${btnId}:`, {
                found: true,
                disabled: btn.disabled,
                visible: rect.width > 0 && rect.height > 0,
                position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
                elementAtCenter: elementAtPoint?.tagName + (elementAtPoint?.id ? `#${elementAtPoint.id}` : ''),
                isCovered: elementAtPoint !== btn && !btn.contains(elementAtPoint),
                computedStyle: {
                    pointerEvents: window.getComputedStyle(btn).pointerEvents,
                    zIndex: window.getComputedStyle(btn).zIndex,
                    position: window.getComputedStyle(btn).position,
                    display: window.getComputedStyle(btn).display
                },
                eventListeners: {
                    click: btn.onclick !== null,
                    hasListeners: btn.getEventListeners ? btn.getEventListeners() : 'unknown'
                }
            });
            
            // Test click programmatically
            try {
                btn.click();
                console.log(`✅ Programmatic click on ${btnId} succeeded`);
            } catch (e) {
                console.error(`❌ Programmatic click on ${btnId} failed:`, e);
            }
        } else {
            console.error(`❌ ${btnId} not found in DOM`);
        }
    });
    
    if (window.guruMantraCounter) {
        console.log('✅ HariJapCounter instance exists');
        console.log('State:', window.guruMantraCounter.state);
    } else {
        console.error('❌ HariJapCounter instance not found');
    }
};

// ====================================================================
// EXPORT FOR TESTING (optional)
// ====================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HariJapCounter;
}
