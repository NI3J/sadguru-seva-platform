// जप साधना - Hari Jap Counter JavaScript
class HariJapCounter {
    constructor() {
        this.count = 0;
        this.totalMalas = 0;
        this.isListening = false;
        this.recognition = null;
        this.targetPhrase = 'जय जय राम कृष्ण हरि';
        
        // Initialize elements
        this.countDisplay = document.getElementById('countDisplay');
        this.malaStatus = document.getElementById('malaStatus');
        this.totalMalasDisplay = document.getElementById('totalMalas');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.manualBtn = document.getElementById('manualBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.listeningStatus = document.getElementById('listeningStatus');
        this.recognitionText = document.getElementById('recognitionText');
        this.progressFill = document.getElementById('progressFill');
        this.remainingCount = document.getElementById('remainingCount');
        this.celebration = document.getElementById('celebration');
        
        this.initializeSpeechRecognition();
        this.setupEventListeners();
        this.loadSavedData();
        this.updateDisplay();
    }
    
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'hi-IN'; // Hindi language
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.listeningStatus.textContent = '🎤 सुन रहा हूँ...';
                this.listeningStatus.classList.add('listening');
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.listeningStatus.textContent = 'माइक्रोफोन बंद है';
                this.listeningStatus.classList.remove('listening');
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                this.recognitionText.textContent = '';
            };
            
            this.recognition.onresult = (event) => {
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
                
                // Display what's being recognized
                this.recognitionText.textContent = finalTranscript || interimTranscript;
                
                // Check if the target phrase was spoken
                if (finalTranscript) {
                    this.checkForTargetPhrase(finalTranscript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.listeningStatus.textContent = 'त्रुटि: ' + event.error;
                this.isListening = false;
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
            };
        } else {
            this.listeningStatus.textContent = 'Speech Recognition उपलब्ध नहीं है';
            this.startBtn.disabled = true;
        }
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());
        this.manualBtn.addEventListener('click', () => this.incrementCount());
        this.resetBtn.addEventListener('click', () => this.resetCounter());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isListening) {
                e.preventDefault();
                this.startListening();
            } else if (e.code === 'Escape' && this.isListening) {
                this.stopListening();
            } else if (e.code === 'Enter') {
                e.preventDefault();
                this.incrementCount();
            }
        });
    }
    
    checkForTargetPhrase(transcript) {
        // Normalize the transcript for better matching
        const normalizedTranscript = transcript.toLowerCase().trim();
        const variations = [
            'जय जय राम कृष्ण हरि',
            'जय जय राम कृष्ण हारी',
            'jai jai ram krishna hari',
            'jai jai rama krishna hari',
            'जय राम कृष्ण हरि',
            'राम कृष्ण हरि'
        ];
        
        // Check if any variation matches
        const isMatch = variations.some(variation => {
            return normalizedTranscript.includes(variation.toLowerCase()) ||
                   this.calculateSimilarity(normalizedTranscript, variation.toLowerCase()) > 0.7;
        });
        
        if (isMatch) {
            this.incrementCount();
            this.recognitionText.textContent = '✅ ' + this.targetPhrase;
            setTimeout(() => {
                if (this.recognitionText) {
                    this.recognitionText.textContent = '';
                }
            }, 1000);
        }
    }
    
    calculateSimilarity(str1, str2) {
        // Simple similarity calculation
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
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
    
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.listeningStatus.textContent = 'माइक्रोफोन शुरू करने में त्रुटि';
            }
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    incrementCount() {
        this.count++;
        this.updateDisplay();
        this.saveData();
        
        // Add pulse animation to count
        this.countDisplay.classList.add('pulse');
        setTimeout(() => {
            this.countDisplay.classList.remove('pulse');
        }, 300);
        
        // Check if mala is complete (108 counts)
        if (this.count % 108 === 0) {
            this.completeMala();
        }
    }
    
    completeMala() {
        this.totalMalas++;
        this.showCelebration();
        this.saveData();
    }
    
    showCelebration() {
        this.celebration.style.display = 'block';
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.celebration.style.display = 'none';
        }, 3000);
        
        // Add click to dismiss
        this.celebration.onclick = () => {
            this.celebration.style.display = 'none';
        };
    }
    
    resetCounter() {
        if (confirm('क्या आप वाकई काउंटर को रीसेट करना चाहते हैं?')) {
            this.count = 0;
            this.totalMalas = 0;
            this.updateDisplay();
            this.saveData();
        }
    }
    
    updateDisplay() {
        this.countDisplay.textContent = this.count;
        
        const currentMalaCount = this.count % 108;
        const remainingInCurrentMala = 108 - currentMalaCount;
        
        if (this.count === 0) {
            this.malaStatus.textContent = 'जप शुरू करें';
        } else if (currentMalaCount === 0) {
            this.malaStatus.textContent = `${this.totalMalas} माला पूर्ण!`;
        } else {
            this.malaStatus.textContent = `वर्तमान माला: ${currentMalaCount}/108`;
        }
        
        this.totalMalasDisplay.textContent = `कुल माला: ${this.totalMalas}`;
        this.remainingCount.textContent = remainingInCurrentMala === 108 ? 108 : remainingInCurrentMala;
        
        // Update progress bar
        const progressPercentage = (currentMalaCount / 108) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
    }
    
    saveData() {
        const data = {
            count: this.count,
            totalMalas: this.totalMalas,
            lastSaved: new Date().toISOString()
        };
        
        // Since localStorage is not available, we'll use a global variable
        window.hariJapData = data;
    }
    
    loadSavedData() {
        // Load from global variable if available
        if (window.hariJapData) {
            const data = window.hariJapData;
            this.count = data.count || 0;
            this.totalMalas = data.totalMalas || 0;
        }
    }
}

// Initialize the counter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const hariJapCounter = new HariJapCounter();
    
    // Make it globally accessible for debugging
    window.hariJapCounter = hariJapCounter;
    
    // Add some helpful console messages
    console.log('🕉️ जप साधना initialized successfully!');
    console.log('Shortcuts:');
    console.log('- Space: Start listening');
    console.log('- Escape: Stop listening');
    console.log('- Enter: Manual count increment');
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
