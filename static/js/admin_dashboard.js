/**
 * Admin Dashboard JavaScript
 * Handles form validation, animations, and user interactions
 */

class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupFormValidation();
        this.setupDateConstraints();
        this.setupPhoneValidation();
    }

    setupEventListeners() {
        // Page load animation
        window.addEventListener('load', () => {
            this.animatePageLoad();
        });

        // Form submissions
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                this.handleFormSubmission(e, form);
            });
        });

        // Input enhancements
        this.enhanceInputs();

        // Keyboard navigation
        this.setupKeyboardNavigation();
    }

    animatePageLoad() {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            setTimeout(() => {
                container.classList.add('loaded');
            }, 100);
        }
    }

    setupFormValidation() {
        const programForm = document.getElementById('programForm');
        const loginForm = document.getElementById('loginForm');

        if (programForm) {
            this.setupProgramFormValidation(programForm);
        }

        if (loginForm) {
            this.setupLoginFormValidation(loginForm);
        }
    }

    setupProgramFormValidation(form) {
        const dateField = document.getElementById('date');
        const contentField = document.getElementById('content');

        // Real-time validation
        if (dateField) {
            dateField.addEventListener('change', () => {
                this.validateDate(dateField);
            });
        }

        if (contentField) {
            contentField.addEventListener('input', () => {
                this.validateContent(contentField);
            });

            // Character counter
            this.addCharacterCounter(contentField);
        }
    }

    setupLoginFormValidation(form) {
        const nameField = document.getElementById('name');
        const mobileField = document.getElementById('mobile');

        if (nameField) {
            nameField.addEventListener('input', () => {
                this.validateName(nameField);
            });
        }

        if (mobileField) {
            mobileField.addEventListener('input', () => {
                this.validateMobile(mobileField);
            });
        }
    }

    validateDate(dateField) {
        const selectedDate = new Date(dateField.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.showFieldError(dateField, 'भूतकाळातील तारीख निवडू शकत नाही 📅');
            return false;
        }

        this.clearFieldError(dateField);
        return true;
    }

    validateContent(contentField) {
        const content = contentField.value.trim();
        
        if (content.length < 10) {
            this.showFieldError(contentField, 'कार्यक्रमाचे तपशील किमान 10 अक्षरांचे असावेत 📝');
            return false;
        }

        if (content.length > 1000) {
            this.showFieldError(contentField, 'कार्यक्रमाचे तपशील 1000 अक्षरांपेक्षा जास्त असू शकत नाहीत 📝');
            return false;
        }

        this.clearFieldError(contentField);
        return true;
    }

    validateName(nameField) {
        const name = nameField.value.trim();
        
        if (name.length < 2) {
            this.showFieldError(nameField, 'नाव किमान 2 अक्षरांचे असावे 👤');
            return false;
        }

        // Check for valid characters (allow Marathi and English)
        const nameRegex = /^[a-zA-Z\u0900-\u097F\s]+$/;
        if (!nameRegex.test(name)) {
            this.showFieldError(nameField, 'नावात फक्त अक्षरे वापरा 👤');
            return false;
        }

        this.clearFieldError(nameField);
        return true;
    }

    validateMobile(mobileField) {
        let mobile = mobileField.value.replace(/\D/g, '');
        
        // Auto-format mobile number
        if (mobile.length > 10) {
            mobile = mobile.slice(0, 10);
            mobileField.value = mobile;
        }

        if (mobile.length !== 10) {
            this.showFieldError(mobileField, 'मोबाईल क्रमांक 10 अंकांचा असावा 📱');
            return false;
        }

        // Check if it starts with valid digits (6-9)
        if (!/^[6-9]/.test(mobile)) {
            this.showFieldError(mobileField, 'मोबाईल क्रमांक 6, 7, 8 किंवा 9 ने सुरू होणे आवश्यक 📱');
            return false;
        }

        this.clearFieldError(mobileField);
        return true;
    }

    setupDateConstraints() {
        const dateField = document.getElementById('date');
        if (dateField) {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            dateField.min = today;

            // Set maximum date to 1 year from now
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 1);
            dateField.max = maxDate.toISOString().split('T')[0];
        }
    }

    setupPhoneValidation() {
        const mobileField = document.getElementById('mobile');
        if (mobileField) {
            // Only allow numeric input
            mobileField.addEventListener('keypress', (e) => {
                if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                }
            });

            // Auto-format as user types
            mobileField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) {
                    value = value.slice(0, 10);
                }
                e.target.value = value;
            });
        }
    }

    handleFormSubmission(e, form) {
        const formId = form.id;
        let isValid = true;

        // Show loading state
        this.showLoadingState(form);

        if (formId === 'programForm') {
            isValid = this.validateProgramForm();
        } else if (formId === 'loginForm') {
            isValid = this.validateLoginForm();
        }

        if (!isValid) {
            e.preventDefault();
            this.hideLoadingState(form);
            this.showGeneralError('कृपया सर्व फील्ड्स योग्यरित्या भरा 🙏');
            return false;
        }

        // Additional validation passed - form will submit
        return true;
    }

    validateProgramForm() {
        const dateField = document.getElementById('date');
        const contentField = document.getElementById('content');

        let isValid = true;

        if (!dateField.value) {
            this.showFieldError(dateField, 'कृपया कार्यक्रमाची तारीख निवडा 📆');
            isValid = false;
        } else if (!this.validateDate(dateField)) {
            isValid = false;
        }

        if (!contentField.value.trim()) {
            this.showFieldError(contentField, 'कृपया कार्यक्रमाचे तपशील भरा 📝');
            isValid = false;
        } else if (!this.validateContent(contentField)) {
            isValid = false;
        }

        return isValid;
    }

    validateLoginForm() {
        const nameField = document.getElementById('name');
        const mobileField = document.getElementById('mobile');

        let isValid = true;

        if (!nameField.value.trim()) {
            this.showFieldError(nameField, 'कृपया आपले नाव भरा 👤');
            isValid = false;
        } else if (!this.validateName(nameField)) {
            isValid = false;
        }

        if (!mobileField.value.trim()) {
            this.showFieldError(mobileField, 'कृपया मोबाईल क्रमांक भरा 📱');
            isValid = false;
        } else if (!this.validateMobile(mobileField)) {
            isValid = false;
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#D32F2F';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.fontWeight = '500';
        errorDiv.textContent = message;

        field.style.borderColor = '#D32F2F';
        field.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        
        field.parentNode.appendChild(errorDiv);
        
        // Add shake animation
        field.style.animation = 'shake 0.5s';
        setTimeout(() => {
            field.style.animation = '';
        }, 500);
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        field.style.borderColor = '';
        field.style.backgroundColor = '';
    }

    showGeneralError(message) {
        // Remove existing error
        const existingError = document.querySelector('.temp-error');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'temp-error';
        errorDiv.style.cssText = `
            background: rgba(244, 67, 54, 0.1);
            border: 2px solid rgba(244, 67, 54, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
            color: #D32F2F;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;

        const form = document.querySelector('form');
        form.parentNode.insertBefore(errorDiv, form.nextSibling);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showLoadingState(form) {
        form.classList.add('loading');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = 'प्रतीक्षा करा...';
        }
    }

    hideLoadingState(form) {
        form.classList.remove('loading');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || submitBtn.textContent;
        }
    }

    enhanceInputs() {
        const inputs = document.querySelectorAll('.form-input, .form-textarea');
        
        inputs.forEach(input => {
            // Add focus animations
            input.addEventListener('focus', () => {
                input.parentNode.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentNode.classList.remove('focused');
                if (input.value.trim()) {
                    input.parentNode.classList.add('filled');
                } else {
                    input.parentNode.classList.remove('filled');
                }
            });

            // Initial state check
            if (input.value.trim()) {
                input.parentNode.classList.add('filled');
            }
        });
    }

    addCharacterCounter(textarea) {
        const maxLength = 1000;
        const counterDiv = document.createElement('div');
        counterDiv.className = 'character-counter';
        counterDiv.style.cssText = `
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        `;

        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counterDiv.textContent = `${textarea.value.length}/${maxLength}`;
            
            if (remaining < 50) {
                counterDiv.style.color = '#D32F2F';
            } else if (remaining < 100) {
                counterDiv.style.color = '#FF9800';
            } else {
                counterDiv.style.color = '#666';
            }
        };

        textarea.addEventListener('input', updateCounter);
        textarea.parentNode.appendChild(counterDiv);
        updateCounter();
    }

    setupKeyboardNavigation() {
        // Add keyboard navigation for buttons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
                e.target.click();
            }
        });
    }

    initializeAnimations() {
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            @keyframes slideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(-10px); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
            }
            
            .form-group.focused .form-input,
            .form-group.focused .form-textarea {
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
