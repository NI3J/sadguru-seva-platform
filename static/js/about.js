// About Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAboutPage();
});

function initializeAboutPage() {
    addBackButtonEffects();
    createFloatingElements();
    addProgressBarAnimation();
    addCountdownEffect();
}

// Add effects to back button
function addBackButtonEffects() {
    const backButton = document.querySelector('.back-button');
    
    if (backButton) {
        // Add click ripple effect
        backButton.addEventListener('click', function(e) {
            createRipple(e, this);
        });
        
        // Add loading effect
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="back-icon">⏳</span><span class="back-text">जात आहे...</span>';
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                window.location.href = this.href;
            }, 600);
        });
        
        // Add keyboard navigation
        backButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }
}

// Create ripple effect
function createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        z-index: 1;
    `;
    
    // Add ripple keyframes if not already added
    if (!document.querySelector('#about-ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'about-ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple && ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// Create floating background elements
function createFloatingElements() {
    const container = document.querySelector('.about-container');
    
    if (container && window.innerWidth > 768) {
        const symbols = ['🕉️', '🪔', '✨', '🙏', '🌟', '💫', '🔮'];
        
        for (let i = 0; i < 12; i++) {
            createFloatingElement(container, symbols);
        }
    }
}

function createFloatingElement(container, symbols) {
    const element = document.createElement('div');
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    element.innerHTML = symbol;
    element.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 25 + 15}px;
        opacity: ${Math.random() * 0.3 + 0.1};
        pointer-events: none;
        z-index: 1;
        color: rgba(255, 255, 255, 0.8);
        animation: floatBackground ${Math.random() * 25 + 20}s infinite linear;
    `;
    
    // Random starting position
    element.style.left = Math.random() * 100 + '%';
    element.style.top = Math.random() * 100 + '%';
    
    // Add floating animation
    if (!document.querySelector('#float-background-styles')) {
        const style = document.createElement('style');
        style.id = 'float-background-styles';
        style.textContent = `
            @keyframes floatBackground {
                0% {
                    transform: translateY(0px) rotate(0deg);
                }
                25% {
                    transform: translateY(-30px) rotate(90deg);
                }
                50% {
                    transform: translateY(0px) rotate(180deg);
                }
                75% {
                    transform: translateY(30px) rotate(270deg);
                }
                100% {
                    transform: translateY(0px) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(element);
    
    // Remove element after animation
    setTimeout(() => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 25000);
}

// Enhanced progress bar animation
function addProgressBarAnimation() {
    const progressBar = document.querySelector('.progress-fill');
    
    if (progressBar) {
        // Add percentage indicator
        const percentageText = document.createElement('div');
        percentageText.style.cssText = `
            position: absolute;
            top: -25px;
            right: 0;
            font-size: 0.8rem;
            color: #636e72;
            font-weight: 600;
        `;
        
        const progressContainer = document.querySelector('.progress-bar');
        if (progressContainer) {
            progressContainer.style.position = 'relative';
            progressContainer.appendChild(percentageText);
            
            // Animate percentage
            let percentage = 0;
            const percentageInterval = setInterval(() => {
                percentage = (percentage + 1) % 101;
                percentageText.textContent = `${percentage}%`;
                
                if (percentage === 100) {
                    setTimeout(() => {
                        percentage = 0;
                    }, 1000);
                }
            }, 50);
            
            // Clean up on page unload
            window.addEventListener('beforeunload', () => {
                clearInterval(percentageInterval);
            });
        }
    }
}

// Add countdown effect to message
function addCountdownEffect() {
    const messageText = document.querySelector('.message-text');
    
    if (messageText) {
        const messages = [
            'हे पेज काही दिवसात अपडेट केले जाईल',
            'नवीन माहिती लवकरच उपलब्ध होईल',
            'आम्ही कार्यरत आहोत...',
            'धीर धरा, चांगले काही येत आहे'
        ];
        
        let messageIndex = 0;
        
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            
            // Fade out
            messageText.style.opacity = '0';
            messageText.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                // Change text
                messageText.textContent = messages[messageIndex];
                
                // Fade in
                messageText.style.opacity = '1';
                messageText.style.transform = 'translateY(0)';
            }, 300);
            
        }, 4000);
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(messageInterval);
        });
    }
}

// Add intersection observer for animations
function addScrollAnimations() {
    const animatedElements = document.querySelectorAll('.info-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.animation = `slideInUp 0.6s ease-out forwards`;
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize scroll animations
addScrollAnimations();

// Error handling
window.addEventListener('error', function(e) {
    console.error('About Page Error:', e.error);
    
    // Fallback for back button
    const backButton = document.querySelector('.back-button');
    if (backButton && !backButton.onclick) {
        backButton.onclick = function() {
            window.location.href = this.href;
        };
    }
});

// Performance optimization - clean up on page unload
window.addEventListener('beforeunload', function() {
    // Clear any running intervals/timeouts
    const floatingElements = document.querySelectorAll('[style*="floatBackground"]');
    floatingElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
});

// Add touch support for mobile
if ('ontouchstart' in window) {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });
        
        backButton.addEventListener('touchend', function() {
            this.style.transform = 'translateY(-3px) scale(1)';
        });
    }
}
