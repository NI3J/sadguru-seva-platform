// ============================================
// PREMIUM SPIRITUAL WEBSITE - JAVASCRIPT
// Dark Mode, Particles, Animations, Interactions
// ============================================

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    initLoadingScreen();
    initDarkMode();
    initParticles();
    initAnimations();
    initTooltips();
    initIframeLoaders();
    initScrollAnimations();
});

// ============================================
// LOADING SCREEN
// ============================================
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Simulate loading progress
    let progress = 0;
    const progressBar = document.querySelector('.loading-progress');
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // Hide loading screen after animation
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                // Start particles animation after loading
                setTimeout(() => {
                    startParticlesAnimation();
                }, 500);
            }, 500);
        }
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }, 100);
}

// ============================================
// DARK MODE TOGGLE
// ============================================
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
    
    // Update toggle button state
    updateDarkModeButton(currentTheme);
    
    // Toggle dark mode on button click
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateDarkModeButton(newTheme);
            
            // Add transition effect
            body.style.transition = 'background 0.5s ease, color 0.5s ease';
        });
    }
}

function updateDarkModeButton(theme) {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        if (theme === 'dark') {
            darkModeToggle.setAttribute('aria-label', 'Switch to Light Mode');
        } else {
            darkModeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
        }
    }
}

// ============================================
// PARTICLES ANIMATION
// ============================================
let particlesCanvas;
let particlesCtx;
let particles = [];
let animationFrameId;

function initParticles() {
    particlesCanvas = document.getElementById('particles-canvas');
    if (!particlesCanvas) return;
    
    particlesCtx = particlesCanvas.getContext('2d');
    resizeCanvas();
    
    // Create particles
    createParticles();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
}

function resizeCanvas() {
    if (particlesCanvas) {
        particlesCanvas.width = window.innerWidth;
        particlesCanvas.height = window.innerHeight;
    }
}

function createParticles() {
    particles = [];
    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            color: getRandomParticleColor()
        });
    }
}

function getRandomParticleColor() {
    const colors = [
        'rgba(255, 107, 53, 0.6)',
        'rgba(247, 147, 30, 0.6)',
        'rgba(255, 140, 66, 0.6)',
        'rgba(255, 200, 150, 0.4)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function startParticlesAnimation() {
    if (!particlesCanvas || !particlesCtx) return;
    
    function animate() {
        particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
        
        particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = particlesCanvas.width;
            if (particle.x > particlesCanvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = particlesCanvas.height;
            if (particle.y > particlesCanvas.height) particle.y = 0;
            
            // Draw particle
            particlesCtx.beginPath();
            particlesCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            particlesCtx.fillStyle = particle.color;
            particlesCtx.globalAlpha = particle.opacity;
            particlesCtx.fill();
            particlesCtx.globalAlpha = 1;
        });
        
        // Draw connections
        drawConnections();
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                particlesCtx.beginPath();
                particlesCtx.moveTo(particles[i].x, particles[i].y);
                particlesCtx.lineTo(particles[j].x, particles[j].y);
                particlesCtx.strokeStyle = `rgba(255, 107, 53, ${0.2 * (1 - distance / 100)})`;
                particlesCtx.lineWidth = 0.5;
                particlesCtx.stroke();
            }
        }
    }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.episode-card, .benefit-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// ============================================
// SMOOTH ANIMATIONS
// ============================================
function initAnimations() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.episode-card, .benefit-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });
    });
    
    // Animate Om symbol on scroll
    const animatedOm = document.querySelector('.animated-om');
    if (animatedOm) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            animatedOm.style.transform = `rotate(${scrollY * 0.1}deg) scale(${1 + scrollY * 0.0001})`;
        });
    }
}

// ============================================
// TOOLTIPS
// ============================================
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            // Tooltip is handled by CSS, but we can add additional JS if needed
        });
    });
}

// ============================================
// GOOGLE DRIVE IFRAME PLAYERS
// ============================================
function initIframeLoaders() {
    // Initialize Google Drive iframe players
    const iframes = document.querySelectorAll('.audio-embed-container iframe');
    
    iframes.forEach((iframe, index) => {
        // Add loading indicator
        const container = iframe.closest('.audio-embed-container');
        const card = container.closest('.episode-card');
        
        if (container && card) {
            // Create loading overlay
            const loader = document.createElement('div');
            loader.className = 'iframe-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div class="loader-text">Loading audio player...</div>
                </div>
            `;
            loader.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 15px;
                z-index: 10;
                transition: opacity 0.3s ease;
            `;
            
            container.style.position = 'relative';
            container.appendChild(loader);
            
            // Remove loader when iframe loads
            iframe.addEventListener('load', () => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 300);
                console.log(`Google Drive audio player ${index + 1} loaded successfully!`);
            });
            
            iframe.addEventListener('error', () => {
                loader.innerHTML = `
                    <div class="loader-content" style="color: #ff6b35; text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                        <div>Error loading player</div>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem;">Please use Download button</div>
                    </div>
                `;
                console.error(`Error loading Google Drive audio player ${index + 1}`);
            });
        }
    });
}

// Removed initAudioPlayer function - using Google Drive iframes instead

// ============================================
// ADDITIONAL ENHANCEMENTS
// ============================================

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add ripple effect to buttons
document.querySelectorAll('.download-btn, .home-link').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            left: ${x}px;
            top: ${y}px;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .iframe-loader {
        transition: opacity 0.3s ease;
    }
    
    .loader-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 107, 53, 0.2);
        border-top-color: #ff6b35;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Performance optimization: Pause particles when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    } else {
        startParticlesAnimation();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
