// Access Granted Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    checkBrowserSupport();
    addButtonEffects();
    addImageLoadingEffect();
}

// Check browser video support
function checkBrowserSupport() {
    const browserNote = document.querySelector('.browser-note');
    
    if (browserNote) {
        const video = document.createElement('video');
        const hasVideoSupport = !!(video.canPlayType);
        
        if (hasVideoSupport) {
            browserNote.style.display = 'none';
        } else {
            browserNote.style.color = '#e74c3c';
            browserNote.innerHTML = '⚠️ तुमचा ब्राउझर व्हिडिओ सपोर्ट करत नाही. कृपया आधुनिक ब्राउझर वापरा.';
        }
    }
}

// Add interactive effects to button
function addButtonEffects() {
    const button = document.querySelector('.button');
    const homeButton = document.querySelector('.home-button');
    
    if (button) {
        // Add click ripple effect
        button.addEventListener('click', function(e) {
            createRipple(e, this);
        });
        
        // Add loading effect on navigation
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '⏳ लोड करत आहे...';
            this.style.pointerEvents = 'none';
            
            // Navigate after short delay
            setTimeout(() => {
                window.location.href = this.href;
            }, 800);
        });
    }
    
    if (homeButton) {
        // Add click ripple effect to home button
        homeButton.addEventListener('click', function(e) {
            createRipple(e, this);
        });
        
        // Add loading effect for home button
        homeButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const originalText = this.innerHTML;
            this.innerHTML = '⏳ जात आहे...';
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                window.location.href = this.href;
            }, 600);
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
    
    // Add ripple animation
    if (!document.querySelector('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
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

// Add image loading effect
function addImageLoadingEffect() {
    const img = document.querySelector('.sadguru-img');
    
    if (img) {
        img.style.opacity = '0';
        img.style.transform = 'scale(0.8)';
        
        img.onload = function() {
            this.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        };
        
        // If image is already cached
        if (img.complete) {
            img.onload();
        }
    }
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const button = document.querySelector('.button:focus');
        if (button) {
            e.preventDefault();
            button.click();
        }
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Page Error:', e.error);
    
    // Fallback for button if JS fails
    const button = document.querySelector('.button');
    if (button && !button.onclick) {
        button.onclick = function() {
            window.location.href = this.href;
        };
    }
});
