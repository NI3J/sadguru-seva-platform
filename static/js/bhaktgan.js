// Enhanced JavaScript for Bhaktgan registration page
document.addEventListener('DOMContentLoaded', function() {
    
    // Add floating spiritual elements
    function addFloatingElements() {
        // Add floating Om symbol
        const omSymbol = document.createElement('div');
        omSymbol.className = 'floating-om';
        omSymbol.innerHTML = '🕉️';
        document.body.appendChild(omSymbol);
        
        // Add floating lotus
        const lotusSymbol = document.createElement('div');
        lotusSymbol.className = 'floating-lotus';
        lotusSymbol.innerHTML = '🪷';
        document.body.appendChild(lotusSymbol);
    }
    
    // Enhanced form field interactions
    function enhanceFormFields() {
        const formInputs = document.querySelectorAll('.vertical-form input, .vertical-form select');
        
        formInputs.forEach((input, index) => {
            // Wrap each input in a form group for better animation
            if (!input.parentElement.classList.contains('form-group')) {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                formGroup.style.transform = 'translateX(-30px)';
                input.parentElement.insertBefore(formGroup, input);
                formGroup.appendChild(input.previousElementSibling); // Move label
                formGroup.appendChild(input); // Move input
            }
            
            // Add focus effects
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
                createSparkles(this);
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
            
            // Add typing effects
            input.addEventListener('input', function() {
                if (this.value.length > 0) {
                    this.style.borderColor = '#2d8f00';
                    this.style.background = 'rgba(144, 238, 144, 0.1)';
                } else {
                    this.style.borderColor = 'rgba(194, 136, 0, 0.3)';
                    this.style.background = 'rgba(255, 255, 255, 0.9)';
                }
            });
        });
    }
    
    // Create sparkle effects on focus
    function createSparkles(element) {
        const rect = element.getBoundingClientRect();
        const sparkleCount = 5;
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.cssText = `
                position: fixed;
                z-index: 1000;
                pointer-events: none;
                font-size: 1rem;
                opacity: 0;
                animation: sparkleAnimation 1.5s ease-out forwards;
            `;
            
            // Random position around the input
            sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            
            document.body.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1500);
        }
    }
    
    // Enhanced seva selection system
    function createSevaSelector() {
        const sevaInput = document.getElementById('seva_interest');
        if (!sevaInput) return;
        
        const sevaOptions = [
            '🍯 प्रसाद सेवा',
            '🎵 कीर्तन सेवा', 
            '📚 पुस्तक वितरण',
            '🧹 सफाई सेवा',
            '👥 संघटन सेवा',
            '💻 तंत्रज्ञान सेवा',
            '🌱 बाग सेवा',
            '🏗️ बांधकाम सेवा',
            '📞 संपर्क सेवा',
            '✍️ इतर सेवा'
        ];
        
        // Create seva options container
        const sevaContainer = document.createElement('div');
        sevaContainer.className = 'seva-options';
        sevaContainer.style.display = 'none';
        
        sevaOptions.forEach(seva => {
            const option = document.createElement('div');
            option.className = 'seva-option';
            option.textContent = seva;
            option.addEventListener('click', function() {
                // Remove previous selection
                document.querySelectorAll('.seva-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Select current option
                this.classList.add('selected');
                sevaInput.value = seva;
                
                // Hide options
                sevaContainer.style.display = 'none';
                
                // Create blessing effect
                createBlessingEffect();
            });
            sevaContainer.appendChild(option);
        });
        
        // Insert after seva input
        sevaInput.parentElement.appendChild(sevaContainer);
        
        // Show/hide options on input click
        sevaInput.addEventListener('click', function() {
            sevaContainer.style.display = sevaContainer.style.display === 'none' ? 'grid' : 'none';
        });
        
        // Hide options when clicking outside
        document.addEventListener('click', function(e) {
            if (!sevaInput.contains(e.target) && !sevaContainer.contains(e.target)) {
                sevaContainer.style.display = 'none';
            }
        });
    }
    
    // Create blessing effect when seva is selected
    function createBlessingEffect() {
        const blessing = document.createElement('div');
        blessing.innerHTML = '🙏 धन्यवाद! 🙏';
        blessing.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            color: #c28800;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 30px;
            border-radius: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1001;
            font-family: 'Mukta', sans-serif;
            font-weight: bold;
            opacity: 0;
            animation: blessingAppear 2s ease forwards;
            pointer-events: none;
        `;
        
        document.body.appendChild(blessing);
        
        setTimeout(() => {
            if (blessing.parentNode) {
                blessing.parentNode.removeChild(blessing);
            }
        }, 2000);
    }
    
    // Enhanced form submission
    function enhanceFormSubmission() {
        const form = document.querySelector('.vertical-form');
        const submitButton = form?.querySelector('button[type="submit"]');
        
        if (!form || !submitButton) return;
        
        let originalButtonText = submitButton.textContent;
        
        form.addEventListener('submit', function(e) {
            // Don't prevent default - let form submit normally
            
            // Add loading state
            submitButton.disabled = true;
            submitButton.style.background = 'linear-gradient(135deg, #888, #aaa)';
            submitButton.innerHTML = '🔄 नोंदवत आहे...';
            
            // Create submission particles
            createSubmissionParticles();
            
            // Reset button after some time (fallback)
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.style.background = '';
                submitButton.innerHTML = originalButtonText;
            }, 3000);
        });
    }
    
    // Create particles on form submission
    function createSubmissionParticles() {
        const particleCount = 20;
        const colors = ['🌸', '✨', '🙏', '🕉️', '🪷'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.innerHTML = colors[Math.floor(Math.random() * colors.length)];
            particle.style.cssText = `
                position: fixed;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 1000;
                opacity: 0;
                animation: submitParticle 3s ease-out forwards;
            `;
            
            // Random starting position
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = window.innerHeight + 'px';
            particle.style.animationDelay = (Math.random() * 2) + 's';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 3000);
        }
    }
    
    // Form validation with spiritual messages
    function addSpiritualValidation() {
        const requiredFields = document.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('invalid', function(e) {
                e.preventDefault();
                
                const messages = [
                    'कृपया हे क्षेत्र भरा 🙏',
                    'आपली माहिती आवश्यक आहे ✨',
                    'सेवेसाठी ही माहिती गरजेची आहे 🌸'
                ];
                
                const message = messages[Math.floor(Math.random() * messages.length)];
                showValidationMessage(this, message);
            });
        });
    }
    
    function showValidationMessage(field, message) {
        // Remove existing message
        const existingMessage = field.parentElement.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = 'validation-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            color: #d63384;
            font-size: 0.9rem;
            margin-top: 5px;
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
            font-family: 'Mukta', sans-serif;
        `;
        
        field.parentElement.appendChild(messageEl);
        field.focus();
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }
    
    // Add dynamic styles
    function addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes sparkleAnimation {
                0% {
                    opacity: 0;
                    transform: scale(0) rotate(0deg);
                }
                50% {
                    opacity: 1;
                    transform: scale(1) rotate(180deg);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.5) rotate(360deg) translateY(-30px);
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
            
            @keyframes submitParticle {
                0% {
                    opacity: 0;
                    transform: translateY(0) rotate(0deg);
                }
                20% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                    transform: translateY(-100vh) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize all functions
    addFloatingElements();
    enhanceFormFields();
    createSevaSelector();
    enhanceFormSubmission();
    addSpiritualValidation();
    addDynamicStyles();
    
    // Console blessing
    console.log('🕉️ भक्तगण नोंदणी पृष्ठ तयार आहे | Bhaktgan Registration Page Ready 🙏');
    
    // Auto-focus first field after animation
    setTimeout(() => {
        const firstInput = document.querySelector('.vertical-form input');
        if (firstInput) {
            firstInput.focus();
        }
    }, 2000);
});
