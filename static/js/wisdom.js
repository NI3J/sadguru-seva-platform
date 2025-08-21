// Wisdom Page JavaScript - Spiritual Theme with OTP Functionality
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Page Initialization
function initializePage() {
    initializeAnimations();
    initializeOTPForms();
    initializeQuoteAnimations();
    initializeSpiritualParticles();
    initializeScrollEffects();
    console.log('Wisdom page initialized successfully');
}

// Spiritual Particle Animation System
function initializeSpiritualParticles() {
    const particles = document.querySelectorAll('.spiritual-particles .particle');
    
    particles.forEach((particle, index) => {
        // Set random initial positions and animations
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 4;
        const size = 4 + Math.random() * 8;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = delay + 's';
        particle.style.animationDuration = duration + 's';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Add glowing effect
        particle.style.boxShadow = `0 0 ${size}px rgba(255, 215, 0, 0.6)`;
        particle.style.backgroundColor = getRandomSpiritualColor();
    });
    
    // Create additional floating particles dynamically
    createDynamicParticles();
}

function getRandomSpiritualColor() {
    const colors = [
        'rgba(255, 215, 0, 0.8)',    // Golden
        'rgba(255, 165, 0, 0.7)',    // Orange
        'rgba(255, 192, 203, 0.6)',  // Pink
        'rgba(147, 112, 219, 0.7)',  // Purple
        'rgba(173, 216, 230, 0.6)'   // Light blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createDynamicParticles() {
    const particlesContainer = document.querySelector('.spiritual-particles');
    
    setInterval(() => {
        if (document.querySelectorAll('.particle').length < 15) {
            const particle = document.createElement('div');
            particle.className = 'particle dynamic-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.bottom = '-10px';
            particle.style.backgroundColor = getRandomSpiritualColor();
            particle.style.width = (3 + Math.random() * 6) + 'px';
            particle.style.height = particle.style.width;
            particle.style.borderRadius = '50%';
            particle.style.position = 'absolute';
            particle.style.pointerEvents = 'none';
            particle.style.animation = 'floatUp 6s linear forwards';
            
            particlesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 6000);
        }
    }, 2000);
}

// Quote Card Animations
function initializeQuoteAnimations() {
    const quoteCards = document.querySelectorAll('.quote-card');
    
    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Add a slight delay for staggered effect
                const index = entry.target.dataset.index;
                entry.target.style.animationDelay = (index * 0.2) + 's';
            }
        });
    }, observerOptions);
    
    quoteCards.forEach(card => {
        observer.observe(card);
        
        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover-effect');
            createHoverParticles(card);
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover-effect');
        });
        
        // Add click effect for mobile
        card.addEventListener('touchstart', () => {
            card.classList.add('touch-effect');
        });
        
        card.addEventListener('touchend', () => {
            setTimeout(() => {
                card.classList.remove('touch-effect');
            }, 300);
        });
    });
}

function createHoverParticles(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'hover-particle';
        particle.style.position = 'fixed';
        particle.style.left = (rect.left + Math.random() * rect.width) + 'px';
        particle.style.top = (rect.top + Math.random() * rect.height) + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.backgroundColor = getRandomSpiritualColor();
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        particle.style.animation = 'particleFloat 1s ease-out forwards';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

// OTP Form Handling
function initializeOTPForms() {
    const otpRequestForm = document.getElementById('otpRequestForm');
    const otpValidationForm = document.getElementById('otpValidationForm');
    const resendButton = document.getElementById('resendOtp');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // OTP Request Form
    if (otpRequestForm) {
        otpRequestForm.addEventListener('submit', handleOTPRequest);
        
        // Mobile number validation
        const mobileInput = otpRequestForm.querySelector('input[name="mobile"]');
        if (mobileInput) {
            mobileInput.addEventListener('input', validateMobileNumber);
            mobileInput.addEventListener('keypress', restrictToNumbers);
        }
        
        // Username validation
        const usernameInput = otpRequestForm.querySelector('input[name="username"]');
        if (usernameInput) {
            usernameInput.addEventListener('input', validateUsername);
        }
    }
    
    // OTP Validation Form
    if (otpValidationForm) {
        otpValidationForm.addEventListener('submit', handleOTPValidation);
        
        // OTP input handling
        const otpInput = otpValidationForm.querySelector('input[name="otp"]');
        if (otpInput) {
            otpInput.addEventListener('input', handleOTPInput);
            otpInput.addEventListener('keypress', restrictToNumbers);
            otpInput.addEventListener('paste', handleOTPPaste);
        }
    }
    
    // Resend OTP functionality
    if (resendButton) {
        let resendTimer = 30;
        startResendTimer(resendButton, resendTimer);
        
        resendButton.addEventListener('click', () => {
            if (!resendButton.disabled) {
                handleResendOTP(resendButton);
            }
        });
    }
}

// OTP Request Handler
async function handleOTPRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username').trim();
    const mobile = formData.get('mobile').trim();
    
    // Client-side validation
    if (!validateForm(username, mobile)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/verify-otp', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('OTP यशस्वीपणे पाठविली गेली! 📱');
            // Reload page to show OTP validation form
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showError(result.message || 'OTP पाठविण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.');
        }
    } catch (error) {
        console.error('OTP Request Error:', error);
        showError('नेटवर्क त्रुटी. कृपया पुन्हा प्रयत्न करा.');
    } finally {
        showLoading(false);
    }
}

// OTP Validation Handler
async function handleOTPValidation(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const otp = formData.get('otp').trim();
    
    if (otp.length !== 6) {
        showError('कृपया ६ अंकी OTP लिहा');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/validate-otp', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('सफल प्रवेश! आध्यात्मिक प्रवासाचे स्वागत आहे! 🙏');
            createSuccessParticles();
            
            // Redirect to the protected content
            setTimeout(() => {
                window.location.href = result.redirect || '/protected-content';
            }, 2000);
        } else {
            showError(result.message || 'चुकीची OTP. कृपया पुन्हा प्रयत्न करा.');
            // Clear OTP input
            const otpInput = event.target.querySelector('input[name="otp"]');
            if (otpInput) {
                otpInput.value = '';
                otpInput.focus();
            }
        }
    } catch (error) {
        console.error('OTP Validation Error:', error);
        showError('नेटवर्क त्रुटी. कृपया पुन्हा प्रयत्न करा.');
    } finally {
        showLoading(false);
    }
}

// Resend OTP Handler
async function handleResendOTP(button) {
    showLoading(true);
    
    try {
        const response = await fetch('/resend-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('नवी OTP पाठविली गेली! 📱');
            startResendTimer(button, 30);
        } else {
            showError(result.message || 'OTP पुन्हा पाठविण्यात अडचण आली.');
        }
    } catch (error) {
        console.error('Resend OTP Error:', error);
        showError('नेटवर्क त्रुटी. कृपया पुन्हा प्रयत्न करा.');
    } finally {
        showLoading(false);
    }
}

// Form Validation Functions
function validateForm(username, mobile) {
    if (username.length < 2) {
        showError('कृपया वैध नाव लिहा (किमान २ अक्षरे)');
        return false;
    }
    
    if (!/^[0-9]{10}$/.test(mobile)) {
        showError('कृपया वैध १० अंकी मोबाईल नंबर लिहा');
        return false;
    }
    
    return true;
}

function validateMobileNumber(event) {
    const input = event.target;
    const value = input.value.replace(/[^0-9]/g, '');
    input.value = value.substring(0, 10);
    
    // Visual feedback
    if (value.length === 10) {
        input.classList.add('valid');
        input.classList.remove('invalid');
    } else {
        input.classList.remove('valid');
        input.classList.add('invalid');
    }
}

function validateUsername(event) {
    const input = event.target;
    const value = input.value.trim();
    
    if (value.length >= 2) {
        input.classList.add('valid');
        input.classList.remove('invalid');
    } else {
        input.classList.remove('valid');
        input.classList.add('invalid');
    }
}

function restrictToNumbers(event) {
    const char = String.fromCharCode(event.which);
    if (!/[0-9]/.test(char)) {
        event.preventDefault();
    }
}

function handleOTPInput(event) {
    const input = event.target;
    const value = input.value.replace(/[^0-9]/g, '');
    input.value = value.substring(0, 6);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
        input.classList.add('valid');
        // Small delay for better UX
        setTimeout(() => {
            const form = input.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }, 500);
    } else {
        input.classList.remove('valid');
    }
}

function handleOTPPaste(event) {
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const numbers = paste.replace(/[^0-9]/g, '').substring(0, 6);
    
    if (numbers.length === 6) {
        event.target.value = numbers;
        event.preventDefault();
        // Trigger input event for validation
        event.target.dispatchEvent(new Event('input'));
    }
}

// Resend Timer
function startResendTimer(button, seconds) {
    button.disabled = true;
    button.textContent = `🕒 ${seconds} सेकंदात पुन्हा पाठवा`;
    
    const timer = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            button.textContent = `🕒 ${seconds} सेकंदात पुन्हा पाठवा`;
        } else {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = '🔄 पुन्हा पाठवा';
        }
    }, 1000);
}

// UI Feedback Functions
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.style.display = 'flex';
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : '⚠️'}</span>
            <span class="notification-text">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Success Particles Effect
function createSuccessParticles() {
    const container = document.getElementById('successParticles');
    if (!container) return;
    
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const symbols = ['🌸', '✨', '🪷', '🙏', '🕉️', '💫'];
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'success-particle';
        
        const isSymbol = Math.random() > 0.7;
        if (isSymbol) {
            particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            particle.style.fontSize = (12 + Math.random() * 8) + 'px';
        } else {
            particle.style.width = (4 + Math.random() * 8) + 'px';
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
        }
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (2 + Math.random() * 3) + 's';
        
        container.appendChild(particle);
    }
    
    // Clean up particles
    setTimeout(() => {
        container.innerHTML = '';
    }, 6000);
}

// Scroll Effects
function initializeScrollEffects() {
    let lastScrollTop = 0;
    const header = document.querySelector('.sacred-header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Parallax effect for particles
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            const speed = 0.5 + (index % 3) * 0.2;
            particle.style.transform = `translateY(${scrollTop * speed}px)`;
        });
        
        // Header shadow effect
        if (header) {
            if (scrollTop > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        lastScrollTop = scrollTop;
    });
}

// General Animations
function initializeAnimations() {
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            0% {
                transform: translateY(0) scale(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) scale(1);
                opacity: 0;
            }
        }
        
        @keyframes particleFloat {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translateY(-50px) scale(0);
                opacity: 0;
            }
        }
        
        .quote-card.animate-in {
            animation: slideInUp 0.8s ease-out forwards;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 15px 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: all 0.3s ease;
            z-index: 10000;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification.error {
            border-left: 4px solid #f44336;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-text {
            font-family: 'Noto Sans Devanagari', sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .success-particle {
            position: absolute;
            animation: particleBurst 3s ease-out forwards;
            pointer-events: none;
        }
        
        @keyframes particleBurst {
            0% {
                opacity: 1;
                transform: translateY(0) scale(0) rotate(0deg);
            }
            50% {
                opacity: 1;
                transform: translateY(-100px) scale(1) rotate(180deg);
            }
            100% {
                opacity: 0;
                transform: translateY(-200px) scale(0) rotate(360deg);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error Handling
window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', event.error);
    // Don't show error to user unless it's critical
});

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}
