// Enhanced JavaScript for index page
document.addEventListener('DOMContentLoaded', function() {
    
    // Create floating particles
    function createParticles() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        heroSection.appendChild(particlesContainer);
        
        function createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random starting position
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            
            // Random size
            const size = Math.random() * 4 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            particlesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 25000);
        }
        
        // Create particles periodically
        setInterval(createParticle, 2000);
        
        // Create initial particles
        for (let i = 0; i < 5; i++) {
            setTimeout(createParticle, i * 400);
        }
    }
    
    // Add sacred symbols decoration
    function addSacredSymbols() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        const symbols = document.createElement('div');
        symbols.className = 'sacred-symbols';
        symbols.innerHTML = '☸️';
        heroSection.appendChild(symbols);
    }
    
    // Enhanced image interactions
    function setupImageInteractions() {
        const mahadevImg = document.querySelector('.mahadev-img');
        if (mahadevImg) {
            let isAnimating = false;
            
            mahadevImg.addEventListener('click', function() {
                if (isAnimating) return;
                
                isAnimating = true;
                this.style.transform = 'scale(1.1) rotate(360deg)';
                this.style.filter = 'brightness(1.2) hue-rotate(30deg)';
                
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                    this.style.filter = 'none';
                    isAnimating = false;
                }, 1000);
            });
            
            // Add loading effect
            mahadevImg.addEventListener('load', function() {
                this.style.opacity = '1';
                this.style.transform = 'scale(1)';
            });
        }
    }
    
    // Trishul interactions
    function setupTrishulInteractions() {
        const trishul = document.querySelector('.floating-trishul');
        if (trishul) {
            let clickCount = 0;
            
            trishul.addEventListener('click', function(e) {
                e.preventDefault();
                clickCount++;
                
                // Create ripple effect
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(255, 215, 0, 0.6)';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.left = (e.clientX - 10) + 'px';
                ripple.style.top = (e.clientY - 10) + 'px';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.pointerEvents = 'none';
                ripple.style.zIndex = '1000';
                
                document.body.appendChild(ripple);
                
                setTimeout(() => {
                    document.body.removeChild(ripple);
                }, 600);
                
                // Special effect after multiple clicks
                if (clickCount >= 5) {
                    showBlessings();
                    clickCount = 0;
                }
            });
        }
    }
    
    // Show blessing message
    function showBlessings() {
        const blessing = document.createElement('div');
        blessing.innerHTML = '🙏 हर हर महादेव 🙏';
        blessing.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            color: #c28800;
            background: rgba(255, 255, 255, 0.95);
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 1001;
            font-family: 'Tiro Devanagari Marathi', serif;
            font-weight: bold;
            text-align: center;
            opacity: 0;
            animation: blessingAppear 3s ease forwards;
            pointer-events: none;
        `;
        
        document.body.appendChild(blessing);
        
        setTimeout(() => {
            document.body.removeChild(blessing);
        }, 3000);
    }
    
    // Smooth scrolling enhancement
    function enhanceScrolling() {
        // Add scroll-triggered animations for future content
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        // Observe elements for future use
        document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
    
    // Time-based greetings
    function addTimeBasedGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) {
            greeting = 'शुभ प्रभात';
        } else if (hour < 17) {
            greeting = 'नमस्कार';
        } else {
            greeting = 'शुभ संध्या';
        }
        
        // Add greeting to welcome text if it exists
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText && !welcomeText.dataset.greetingAdded) {
            const greetingSpan = document.createElement('span');
            greetingSpan.style.cssText = `
                display: block;
                font-size: 0.6em;
                opacity: 0.8;
                margin-bottom: 10px;
                color: #8b4513;
            `;
            greetingSpan.textContent = greeting;
            welcomeText.insertBefore(greetingSpan, welcomeText.firstChild);
            welcomeText.dataset.greetingAdded = 'true';
        }
    }
    
    // Dynamic background music indicator (visual only)
    function addMusicVisualizer() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        const musicBars = document.createElement('div');
        musicBars.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 3px;
            z-index: 10;
        `;
        
        for (let i = 0; i < 4; i++) {
            const bar = document.createElement('div');
            bar.style.cssText = `
                width: 4px;
                height: 20px;
                background: linear-gradient(to top, #c28800, #ffd700);
                border-radius: 2px;
                animation: musicBar 1s infinite ease-in-out;
                animation-delay: ${i * 0.2}s;
                opacity: 0.6;
            `;
            musicBars.appendChild(bar);
        }
        
        heroSection.appendChild(musicBars);
    }
    
    // Add CSS animations for new elements
    function addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes blessingAppear {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            @keyframes musicBar {
                0%, 100% { height: 8px; }
                50% { height: 25px; }
            }
            
            .fade-in-on-scroll {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.8s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize all functions
    createParticles();
    addSacredSymbols();
    setupImageInteractions();
    setupTrishulInteractions();
    enhanceScrolling();
    addTimeBasedGreeting();
    addMusicVisualizer();
    addDynamicStyles();
    
    // Console message for developers
    console.log('🕉️ राधाकृष्ण आश्रम वेबसाइट लोड झाली | Website Loaded Successfully');
    
    // Performance optimization
    requestAnimationFrame(() => {
        document.body.style.visibility = 'visible';
    });
});
