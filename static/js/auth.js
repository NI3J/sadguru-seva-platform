// Enhanced Authentication JavaScript
class AuthApp {
    constructor() {
        this.currentStep = 1;
        this.otpTimer = null;
        this.otpTimeRemaining = 600; // 10 minutes in seconds
        this.resendCooldown = 30; // 30 seconds cooldown for resend
        this.resendTimer = null;

        // DOM elements
        this.elements = {
            // Steps
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            
            // Forms
            mobileForm: document.getElementById('mobileForm'),
            otpForm: document.getElementById('otpForm'),
            
            // Inputs
            nameInput: document.getElementById('name'),
            mobileInput: document.getElementById('mobile'),
            otpInput: document.getElementById('otp'),
            
            // Buttons
            sendOtpBtn: document.getElementById('sendOtpBtn'),
            verifyOtpBtn: document.getElementById('verifyOtpBtn'),
            resendOtpBtn: document.getElementById('resendOtpBtn'),
            backBtn: document.getElementById('backBtn'),
            
            // Status elements
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),
            statusMessage: document.getElementById('statusMessage'),
            statusIcon: document.getElementById('statusIcon'),
            statusText: document.getElementById('statusText'),
            
            // Error elements
            nameError: document.getElementById('nameError'),
            mobileError: document.getElementById('mobileError'),
            otpError: document.getElementById('otpError'),
            
            // Other elements
            otpDescription: document.getElementById('otpDescription'),
            timerText: document.getElementById('timerText')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupInputValidation();
    }

    setupEventListeners() {
        // Form submissions
        this.elements.mobileForm?.addEventListener('submit', (e) => this.handleMobileSubmit(e));
        this.elements.otpForm?.addEventListener('submit', (e) => this.handleOtpSubmit(e));

        // Button clicks
        this.elements.resendOtpBtn?.addEventListener('click', () => this.resendOtp());
        this.elements.backBtn?.addEventListener('click', () => this.goBackToStep1());

        // Input formatting
        this.elements.mobileInput?.addEventListener('input', (e) => this.formatMobileInput(e));
        this.elements.otpInput?.addEventListener('input', (e) => this.formatOtpInput(e));

        // Real-time validation
        this.elements.nameInput?.addEventListener('blur', () => this.validateName());
        this.elements.mobileInput?.addEventListener('blur', () => this.validateMobile());
        this.elements.otpInput?.addEventListener('blur', () => this.validateOtp());

        // Auto-focus next input after OTP entry
        this.elements.otpInput?.addEventListener('input', (e) => {
            if (e.target.value.length === 6) {
                this.elements.verifyOtpBtn?.focus();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                if (this.currentStep === 1) {
                    this.elements.sendOtpBtn?.click();
                } else if (this.currentStep === 2) {
                    this.elements.verifyOtpBtn?.click();
                }
            }
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/auth/japa/check_session');
            const data = await response.json();

            if (data.authenticated) {
                // User is already authenticated, redirect to japa page
                this.showStatus('success', 'पहले से लॉगिन हैं, जप पेज पर जा रहे हैं...', '✅');
                setTimeout(() => {
                    window.location.href = '/japa';
                }, 1500);
            }
        } catch (error) {
            console.log('Auth check failed:', error);
        }
    }

    setupInputValidation() {
        // Name validation
        this.elements.nameInput?.addEventListener('input', (e) => {
            const value = e.target.value;
            const isValid = /^[A-Za-z\s]{2,50}$/.test(value);
            
            if (value && !isValid) {
                this.showInputError('nameError', 'केवल अक्षर और स्पेस, 2-50 वर्ण');
            } else {
                this.clearInputError('nameError');
            }
        });

        // Mobile validation
        this.elements.mobileInput?.addEventListener('input', (e) => {
            const value = e.target.value;
            const isValid = /^[6-9][0-9]{9}$/.test(value);
            
            if (value && value.length === 10 && !isValid) {
                this.showInputError('mobileError', 'भारतीय मोबाइल नंबर 6-9 से शुरू होना चाहिए');
            } else if (value && value.length === 10) {
                this.clearInputError('mobileError');
            }
        });
    }

    formatMobileInput(e) {
        // Remove non-digits and limit to 10 characters
        let value = e.target.value.replace(/\D/g, '').substring(0, 10);
        e.target.value = value;
    }

    formatOtpInput(e) {
        // Remove non-digits and limit to 6 characters
        let value = e.target.value.replace(/\D/g, '').substring(0, 6);
        e.target.value = value;
    }

    validateName() {
        const name = this.elements.nameInput?.value.trim();
        if (!name) {
            this.showInputError('nameError', 'नाम आवश्यक है');
            return false;
        }
        if (name.length < 2 || name.length > 50) {
            this.showInputError('nameError', 'नाम 2-50 वर्ण का होना चाहिए');
            return false;
        }
        if (!/^[A-Za-z\s]+$/.test(name)) {
            this.showInputError('nameError', 'केवल अक्षर और स्पेस की अनुमति है');
            return false;
        }
        this.clearInputError('nameError');
        return true;
    }

    validateMobile() {
        const mobile = this.elements.mobileInput?.value.trim();
        if (!mobile) {
            this.showInputError('mobileError', 'मोबाइल नंबर आवश्यक है');
            return false;
        }
        if (mobile.length !== 10) {
            this.showInputError('mobileError', '10 अंकों का मोबाइल नंबर दर्ज करें');
            return false;
        }
        if (!/^[6-9][0-9]{9}$/.test(mobile)) {
            this.showInputError('mobileError', 'वैध भारतीय मोबाइल नंबर दर्ज करें');
            return false;
        }
        this.clearInputError('mobileError');
        return true;
    }

    validateOtp() {
        const otp = this.elements.otpInput?.value.trim();
        if (!otp) {
            this.showInputError('otpError', 'OTP आवश्यक है');
            return false;
        }
        if (otp.length !== 6) {
            this.showInputError('otpError', '6 अंकों का OTP दर्ज करें');
            return false;
        }
        if (!/^[0-9]{6}$/.test(otp)) {
            this.showInputError('otpError', 'केवल अंक की अनुमति है');
            return false;
        }
        this.clearInputError('otpError');
        return true;
    }

    showInputError(elementId, message) {
        const errorElement = this.elements[elementId];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearInputError(elementId) {
        const errorElement = this.elements[elementId];
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    async handleMobileSubmit(e) {
        e.preventDefault();

        // Validate inputs
        const isNameValid = this.validateName();
        const isMobileValid = this.validateMobile();

        if (!isNameValid || !isMobileValid) {
            return;
        }

        const name = this.elements.nameInput.value.trim();
        const mobile = this.elements.mobileInput.value.trim();

        this.showLoading('OTP भेजा जा रहा है...');

        try {
            const response = await fetch('/auth/japa/send_otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, mobile })
            });

            const data = await response.json();

            this.hideLoading();

            if (data.success) {
                this.showStatus('success', data.message, '✅');
                this.goToStep2(mobile);
            } else {
                this.showStatus('error', data.error, '❌');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error sending OTP:', error);
            this.showStatus('error', 'नेटवर्क त्रुटि। कृपया दोबारा कोशिश करें।', '❌');
        }
    }

    async handleOtpSubmit(e) {
        e.preventDefault();

        if (!this.validateOtp()) {
            return;
        }

        const otp = this.elements.otpInput.value.trim();

        this.showLoading('OTP सत्यापित किया जा रहा है...');

        try {
            const response = await fetch('/auth/japa/verify_otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp })
            });

            const data = await response.json();

            this.hideLoading();

            if (data.success) {
                this.showStatus('success', data.message, '🎉');
                
                // Redirect to japa page after success
                setTimeout(() => {
                    window.location.href = '/japa';
                }, 2000);
            } else {
                this.showStatus('error', data.error, '❌');
                this.elements.otpInput.focus();
                this.elements.otpInput.select();
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error verifying OTP:', error);
            this.showStatus('error', 'नेटवर्क त्रुटि। कृपया दोबारा कोशिश करें।', '❌');
        }
    }

    async resendOtp() {
        this.showLoading('नया OTP भेजा जा रहा है...');

        try {
            const response = await fetch('/auth/japa/resend_otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            this.hideLoading();

            if (data.success) {
                this.showStatus('success', data.message, '✅');
                this.resetOtpTimer();
                this.startResendCooldown();
                this.elements.otpInput.value = '';
                this.elements.otpInput.focus();
            } else {
                this.showStatus('error', data.error, '❌');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error resending OTP:', error);
            this.showStatus('error', 'नेटवर्क त्रुटि। कृपया दोबारा कोशिश करें।', '❌');
        }
    }

    goToStep2(mobile) {
        this.currentStep = 2;
        
        // Update description with mobile number
        if (this.elements.otpDescription) {
            this.elements.otpDescription.textContent = 
                `${mobile} पर भेजा गया 6 अंकों का OTP दर्ज करें`;
        }

        // Animate transition
        this.elements.step1.classList.add('slide-out-left');
        
        setTimeout(() => {
            this.elements.step1.style.display = 'none';
            this.elements.step2.style.display = 'block';
            this.elements.step2.classList.add('slide-in-right');
            
            setTimeout(() => {
                this.elements.step2.classList.remove('slide-in-right');
                this.elements.step2.classList.add('active');
                this.elements.otpInput.focus();
            }, 50);
        }, 200);

        // Start OTP timer
        this.startOtpTimer();
        this.startResendCooldown();
    }

    goBackToStep1() {
        this.currentStep = 1;
        
        // Stop timers
        this.stopOtpTimer();
        this.stopResendTimer();

        // Animate transition
        this.elements.step2.classList.add('slide-out-right');
        
        setTimeout(() => {
            this.elements.step2.style.display = 'none';
            this.elements.step1.style.display = 'block';
            this.elements.step1.classList.remove('slide-out-left');
            this.elements.nameInput.focus();
        }, 200);

        // Clear OTP input
        this.elements.otpInput.value = '';
        this.clearInputError('otpError');
    }

    startOtpTimer() {
        this.otpTimeRemaining = 600; // 10 minutes
        this.updateTimerDisplay();

        this.otpTimer = setInterval(() => {
            this.otpTimeRemaining--;
            this.updateTimerDisplay();

            if (this.otpTimeRemaining <= 0) {
                this.stopOtpTimer();
                this.showStatus('warning', 'OTP समाप्त हो गया। कृपया नया OTP मांगें।', '⚠️');
                this.elements.resendOtpBtn.disabled = false;
                this.elements.resendOtpBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">नया OTP भेजें</span>';
            }
        }, 1000);
    }

    stopOtpTimer() {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
        }
    }

    resetOtpTimer() {
        this.stopOtpTimer();
        this.startOtpTimer();
    }

    updateTimerDisplay() {
        if (this.elements.timerText) {
            const minutes = Math.floor(this.otpTimeRemaining / 60);
            const seconds = this.otpTimeRemaining % 60;
            this.elements.timerText.textContent = 
                `OTP ${minutes}:${seconds.toString().padStart(2, '0')} मिनट में समाप्त होगा`;
        }
    }

    startResendCooldown() {
        let cooldownTime = this.resendCooldown;
        this.elements.resendOtpBtn.disabled = true;

        this.resendTimer = setInterval(() => {
            cooldownTime--;
            this.elements.resendOtpBtn.innerHTML = 
                `<span class="btn-icon">⏳</span><span class="btn-text">दोबारा भेजें (${cooldownTime}s)</span>`;

            if (cooldownTime <= 0) {
                this.stopResendTimer();
                this.elements.resendOtpBtn.disabled = false;
                this.elements.resendOtpBtn.innerHTML = 
                    '<span class="btn-icon">🔄</span><span class="btn-text">दोबारा भेजें</span>';
            }
        }, 1000);
    }

    stopResendTimer() {
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
            this.resendTimer = null;
        }
    }

    showLoading(text = 'प्रसंस्करण हो रहा है...') {
        if (this.elements.loadingOverlay) {
            this.elements.loadingText.textContent = text;
            this.elements.loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
    }

    showStatus(type, message, icon = '') {
        if (!this.elements.statusMessage) return;

        this.elements.statusIcon.textContent = icon;
        this.elements.statusText.textContent = message;
        
        // Remove existing classes
        this.elements.statusMessage.classList.remove('success', 'error', 'info', 'warning');
        
        // Add appropriate class
        this.elements.statusMessage.classList.add(type);
        this.elements.statusMessage.style.display = 'block';

        // Auto-hide after delay
        setTimeout(() => {
            this.elements.statusMessage.style.display = 'none';
        }, type === 'error' ? 5000 : 3000);
    }

    // Utility methods
    formatMobileForDisplay(mobile) {
        // Format mobile as XXX-XXX-XXXX
        return mobile.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authApp = new AuthApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.authApp) {
        // Page is hidden, pause timers if needed
        console.log('Page hidden, maintaining timers');
    } else if (window.authApp) {
        // Page is visible, resume normal operation
        console.log('Page visible, resuming normal operation');
    }
});

// Handle connection status
window.addEventListener('online', () => {
    if (window.authApp) {
        window.authApp.showStatus('success', 'इंटरनेट कनेक्शन वापस आ गया', '🟢');
    }
});

window.addEventListener('offline', () => {
    if (window.authApp) {
        window.authApp.showStatus('error', 'इंटरनेट कनेक्शन नहीं है', '🔴');
    }
});
