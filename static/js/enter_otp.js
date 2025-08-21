// Spiritual OTP Entry Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupFormInteractions();
    createSpiritualEffects();
});

function initializePage() {
    // The HTML structure is already complete, just enhance existing elements
    const body = document.body;
    
    // Style the form elements (if they don't already have classes)
    const otpInput = document.querySelector('input[name="otp"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (otpInput && !otpInput.classList.contains('otp-input')) {
        otpInput.className = 'otp-input';
        otpInput.setAttribute('maxlength', '6');
        otpInput.setAttribute('pattern', '[0-9]{6}');
        otpInput.setAttribute('autocomplete', 'one-time-code');
        otpInput.setAttribute('inputmode', 'numeric');
    }
    
    if (submitBtn && !submitBtn.classList.contains('otp-submit')) {
        submitBtn.className = 'otp-submit';
    }
    
    // Add additional particles if needed
    const particleContainer = document.querySelector('.spiritual-particles');
    if (particleContainer && particleContainer.children.length < 10) {
        for (let i = particleContainer.children.length; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
            particleContainer.appendChild(particle);
        }
    }
}
    
    // Style the form elements
    const otpInput = document.querySelector('input[name="otp"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (otpInput) {
        otpInput.className = 'otp-input';
        otpInput.setAttribute('maxlength', '6');
        otpInput.setAttribute('pattern', '[0-9]{6}');
    }
    
    if (submitBtn) {
        submitBtn.className = 'otp-submit';
    }
    
    // Create floating particles
    createFloatingParticles();
}

function setupFormInteractions() {
    const form = document.querySelector('.otp-form') || document.querySelector('form');
    const otpInput = document.querySelector('input[name="otp"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (!form || !otpInput || !submitBtn) return;
    
    // Auto-format OTP input (only numbers)
    otpInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value;
        
        // Add spiritual feedback
        if (value.length === 6) {
            e.target.style.borderColor = '#90EE90';
            e.target.style.boxShadow = '0 0 20px rgba(144, 238, 144, 0.5)';
            playChime();
            
            // Add success glow to container
            const container = document.querySelector('.otp-container');
            if (container) {
                container.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(144, 238, 144, 0.3), 0 0 30px rgba(144, 238, 144, 0.2)';
                setTimeout(() => {
                    container.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)';
                }, 2000);
            }
        } else {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.boxShadow = 'none';
        }
    });
    
    // Add focus effects
    otpInput.addEventListener('focus', function() {
        createRippleEffect(this);
    });
    
    // Form submission with spiritual loading
    form.addEventListener('submit', function(e) {
        const otpValue = otpInput.value.trim();
        
        if (otpValue.length !== 6) {
            e.preventDefault();
            showSpiritualMessage('कृपया ६ अंकी OTP प्रविष्ट करा', 'warning');
            return;
        }
        
        // Show loading overlay
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
        
        // Add loading state to button
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '🔄 प्रमाणीकरण...';
        
        // Create success particles
        createSuccessParticles();
        
        // Optional: Remove loading state if form validation fails
        setTimeout(() => {
            if (submitBtn.classList.contains('loading')) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                if (loadingOverlay) {
                    loadingOverlay.classList.remove('show');
                }
            }
        }, 5000);
    });
    
    // Add enter key support
    otpInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });
}

function createFloatingParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'spiritual-particles';
    document.body.appendChild(particleContainer);
    
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        particleContainer.appendChild(particle);
    }
}

function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 215, 0, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.marginLeft = '-10px';
    ripple.style.marginTop = '-10px';
    ripple.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    // Add ripple animation CSS if not exists
    if (!document.querySelector('#ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function createSuccessParticles() {
    const successContainer = document.getElementById('successParticles') || document.body;
    const container = document.querySelector('.otp-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = ['#FFD700', '#FF6B35', '#2ED573', '#74B9FF'][Math.floor(Math.random() * 4)];
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.zIndex = '10001';
        particle.style.boxShadow = '0 0 6px currentColor';
        
        const angle = (i / 20) * 360 * (Math.PI / 180);
        const velocity = Math.random() * 150 + 100;
        const gravity = Math.random() * 0.5 + 0.3;
        
        particle.style.transform = 'translate(-50%, -50%)';
        
        // Animate particle
        let posX = 0;
        let posY = 0;
        let velX = Math.cos(angle) * velocity;
        let velY = Math.sin(angle) * velocity;
        let life = 1;
        
        successContainer.appendChild(particle);
        
        function animateParticle() {
            posX += velX * 0.016;
            posY += velY * 0.016;
            velY += gravity;
            life -= 0.015;
            
            particle.style.left = (centerX + posX) + 'px';
            particle.style.top = (centerY + posY) + 'px';
            particle.style.opacity = life;
            particle.style.transform = `translate(-50%, -50%) scale(${life})`;
            
            if (life > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        
        requestAnimationFrame(animateParticle);
    }
}

function showSpiritualMessage(message, type = 'info') {
    // Remove existing messages
    const existingMsg = document.querySelector('.spiritual-message');
    if (existingMsg) existingMsg.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `spiritual-message ${type}`;
    messageDiv.textContent = message;
    
    const colors = {
        warning: '#FF6B35',
        error: '#FF4757',
        success: '#2ED573',
        info: '#FFD700'
    };
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: ${colors[type]};
        padding: 1rem 2rem;
        border-radius: 10px;
        border: 2px solid ${colors[type]};
        font-size: 1rem;
        z-index: 1000;
        animation: messageSlide 0.5s ease-out;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
    `;
    
    // Add message animation CSS if not exists
    if (!document.querySelector('#message-animation')) {
        const style = document.createElement('style');
        style.id = 'message-animation';
        style.textContent = `
            @keyframes messageSlide {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'messageSlide 0.5s ease-out reverse';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
}

function playChime() {
    // Create a simple audio chime using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Fallback: silent operation if Web Audio API is not supported
        console.log('Audio chime not supported');
    }
}

function createSpiritualEffects() {
    // Add random glowing effects
    setInterval(() => {
        const particles = document.querySelectorAll('.particle');
        const randomParticle = particles[Math.floor(Math.random() * particles.length)];
        if (randomParticle) {
            randomParticle.style.background = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0, 0.8)`;
            setTimeout(() => {
                randomParticle.style.background = 'rgba(255, 215, 0, 0.6)';
            }, 1000);
        }
    }, 3000);
    
    // Sacred symbol animation variations
    const symbol = document.querySelector('.sacred-symbol');
    if (symbol) {
        const symbols = ['🕉️', '🔱', '☸️', '🪷'];
        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % symbols.length;
            symbol.textContent = symbols[currentIndex];
        }, 10000);
    }
}
