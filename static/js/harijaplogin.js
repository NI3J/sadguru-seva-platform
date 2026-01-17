/* Enhanced Hari Jap Sadhana Login - JavaScript */

// State management
const state = {
  isSubmitting: false,
  currentStep: 0,
  userName: '',
  userMobile: '',
  otpSent: false,
  otpTimer: null,
  otpExpiry: null
};

// DOM Elements
const elements = {
  form: null,
  nameInput: null,
  mobileInput: null,
  otpInput: null,
  otpGroup: null,
  otpTimer: null,
  resendOtpBtn: null,
  nameCount: null,
  sendOtpBtn: null,
  messageContainer: null,
  progressDots: null,
  loading: null,
  btnText: null
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  attachEventListeners();
  updateProgressDots();
});

// Initialize DOM elements
function initializeElements() {
  elements.form = document.getElementById('loginForm');
  elements.nameInput = document.getElementById('name');
  elements.mobileInput = document.getElementById('mobile');
  elements.otpInput = document.getElementById('otp');
  elements.otpGroup = document.getElementById('otpGroup');
  elements.otpTimer = document.getElementById('otpTimer');
  elements.resendOtpBtn = document.getElementById('resendOtpBtn');
  elements.nameCount = document.getElementById('nameCount');
  elements.sendOtpBtn = document.getElementById('sendOtpBtn');
  elements.messageContainer = document.getElementById('messageContainer');
  elements.progressDots = document.querySelectorAll('.dot');
  elements.loading = document.querySelector('.loading');
  elements.btnText = document.getElementById('btnText');
}

// Attach event listeners
function attachEventListeners() {
  // Name input character counter
  elements.nameInput.addEventListener('input', function() {
    const length = this.value.length;
    elements.nameCount.textContent = `${length} / 50`;
    
    if (length > 40) {
      elements.nameCount.classList.add('warning');
    } else {
      elements.nameCount.classList.remove('warning');
    }
    
    // Remove error state on input
    this.classList.remove('error');
  });

  // Mobile input validation - only numbers
  elements.mobileInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
    this.classList.remove('error');
  });
  
  // OTP input validation - only numbers
  if (elements.otpInput) {
    elements.otpInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
      this.classList.remove('error');
      
      // Auto-submit when 6 digits entered
      if (this.value.length === 6) {
        setTimeout(() => {
          if (state.otpSent && !state.isSubmitting) {
            verifyOTP();
          }
        }, 300);
      }
    });
    
    elements.otpInput.addEventListener('keypress', function(e) {
      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
        e.preventDefault();
      }
    });
  }

  // Mobile input formatting
  elements.mobileInput.addEventListener('keypress', function(e) {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
      e.preventDefault();
    }
  });

  // Real-time mobile validation
  elements.mobileInput.addEventListener('blur', function() {
    if (this.value && !validateMobile(this.value)) {
      showFieldError(this, 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें');
    }
  });

  // Name validation
  elements.nameInput.addEventListener('blur', function() {
    if (this.value && !validateName(this.value)) {
      showFieldError(this, 'कृपया वैध नाम दर्ज करें (केवल अक्षर और रिक्त स्थान)');
    }
  });
}

// Validate name
function validateName(name) {
  // Allow Hindi/Devanagari characters, English letters, and spaces
  // Match backend validation: only alphabets (A-Z, a-z) and spaces, 2-50 chars
  const nameRegex = /^[A-Za-z\s]+$/;
  return name.trim().length >= 2 && name.trim().length <= 50 && nameRegex.test(name);
}

// Validate mobile number
function validateMobile(mobile) {
  // Indian mobile number: 10 digits, starts with 6-9
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

// Show field-specific error
function showFieldError(input, message) {
  input.classList.add('error');
  showMessage(message, 'error');
}

// Main function to send OTP or verify OTP
function sendOTP() {
  // Prevent double submission
  if (state.isSubmitting) {
    return;
  }

  // If OTP is already sent, verify OTP
  if (state.otpSent) {
    verifyOTP();
    return;
  }

  // Get form values
  const name = elements.nameInput.value.trim();
  const mobile = elements.mobileInput.value.trim();

  // Clear previous messages
  clearMessage();

  // Validate inputs
  if (!validateForm(name, mobile)) {
    return;
  }

  // Store user data
  state.userName = name;
  state.userMobile = mobile;

  // Start submission process
  startSubmission();

  // Send OTP request to Flask backend
  sendOTPRequest(name, mobile)
    .then(response => {
      if (response.success && response.requires_otp) {
        handleOTPSent(mobile, response);
      } else if (response.success) {
        // Legacy support - direct login
        handleOTPSuccess(mobile, response);
      } else {
        handleOTPError(response.error || response.message || 'OTP भेजने में विफल');
      }
    })
    .catch(error => {
      console.error('Send OTP Error:', error);
      handleOTPError(error.message || 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।');
    })
    .finally(() => {
      endSubmission();
    });
}

// Verify OTP function
function verifyOTP() {
  if (state.isSubmitting) {
    return;
  }

  const otp = elements.otpInput.value.trim();

  // Clear previous messages
  clearMessage();

  // Validate OTP
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    showMessage('कृपया 6 अंकों का OTP दर्ज करें।', 'error');
    return;
  }

  // Start submission process
  startSubmission();

  // Verify OTP request to Flask backend
  verifyOTPRequest(otp)
    .then(response => {
      if (response.success) {
        handleOTPSuccess(state.userMobile, response);
      } else {
        handleOTPError(response.error || response.message || 'OTP सत्यापन विफल');
      }
    })
    .catch(error => {
      console.error('Verify OTP Error:', error);
      handleOTPError(error.message || 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।');
    })
    .finally(() => {
      endSubmission();
    });
}

// Resend OTP function
function resendOTP() {
  if (state.isSubmitting) {
    return;
  }

  // Clear OTP input
  elements.otpInput.value = '';
  clearMessage();

  // Hide resend button
  elements.resendOtpBtn.style.display = 'none';

  // Resend OTP
  sendOTP();
}

// Validate form
function validateForm(name, mobile) {
  let isValid = true;

  // Validate name
  if (!name) {
    showFieldError(elements.nameInput, 'कृपया अपना नाम दर्ज करें');
    isValid = false;
  } else if (!validateName(name)) {
    showFieldError(elements.nameInput, 'कृपया वैध नाम दर्ज करें');
    isValid = false;
  }

  // Validate mobile
  if (!mobile) {
    showFieldError(elements.mobileInput, 'कृपया मोबाइल नंबर दर्ज करें');
    isValid = false;
  } else if (!validateMobile(mobile)) {
    showFieldError(elements.mobileInput, 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें');
    isValid = false;
  }

  return isValid;
}

// Start submission state
function startSubmission() {
  state.isSubmitting = true;
  elements.sendOtpBtn.disabled = true;
  elements.loading.classList.add('show');
  
  if (state.otpSent) {
    elements.btnText.textContent = 'सत्यापित किया जा रहा है...';
  } else {
    elements.btnText.textContent = 'भेजा जा रहा है...';
  }
  
  if (!state.otpSent) {
    updateProgressDots(1);
  }
}

// End submission state
function endSubmission() {
  state.isSubmitting = false;
  elements.sendOtpBtn.disabled = false;
  elements.loading.classList.remove('show');
  
  if (state.otpSent) {
    elements.btnText.textContent = 'OTP सत्यापित करें';
  } else {
    elements.btnText.textContent = 'OTP भेजें';
  }
}

// Send OTP request to Flask backend
function sendOTPRequest(name, mobile) {
  // Get CSRF token if exists
  const csrfToken = document.querySelector('input[name="csrf_token"]');
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken.value;
  }

  // Use the new OTP endpoint
  return fetch('/harijap/auth/send_otp', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      name: name,
      mobile: mobile
    }),
    credentials: 'same-origin'
  })
  .then(response => {
    // Parse JSON response
    return response.json().then(data => {
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Network error');
      }
      return data;
    });
  })
  .catch(error => {
    console.error('Fetch error:', error);
    throw error;
  });
}

// Verify OTP request to Flask backend
function verifyOTPRequest(otp) {
  // Get CSRF token if exists
  const csrfToken = document.querySelector('input[name="csrf_token"]');
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken.value;
  }

  // Use the OTP verification endpoint
  return fetch('/harijap/auth/verify_otp', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      otp: otp
    }),
    credentials: 'same-origin'
  })
  .then(response => {
    // Parse JSON response
    return response.json().then(data => {
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Network error');
      }
      return data;
    });
  })
  .catch(error => {
    console.error('Fetch error:', error);
    throw error;
  });
}

// Generate random OTP (for demo purposes)
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Handle OTP sent successfully
function handleOTPSent(mobile, response) {
  state.otpSent = true;
  state.otpExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes
  
  // Show OTP input field
  elements.otpGroup.style.display = 'block';
  elements.otpInput.focus();
  elements.otpInput.required = true;
  
  // Disable name and mobile inputs
  elements.nameInput.disabled = true;
  elements.mobileInput.disabled = true;
  
  // Update button text
  elements.btnText.textContent = 'OTP सत्यापित करें';
  
  // Update progress
  updateProgressDots(1);
  
  // Show message
  const message = response.message || 'OTP आपके मोबाइल पर भेजा गया है।';
  showMessage(message, 'success');
  
  // Start OTP timer
  startOTPTimer();
}

// Handle OTP verification success
function handleOTPSuccess(mobile, messageOrResponse) {
  // Stop timer
  if (state.otpTimer) {
    clearInterval(state.otpTimer);
    state.otpTimer = null;
  }
  
  // Handle both string message and response object
  let message = '';
  let redirectUrl = '/harijap';  // default redirect
  
  if (typeof messageOrResponse === 'object' && messageOrResponse !== null) {
    message = messageOrResponse.message || 'लॉगिन सफल!';
    redirectUrl = messageOrResponse.redirect_url || redirectUrl;
  } else {
    message = messageOrResponse || 'लॉगिन सफल!';
  }
  
  const maskedMobile = maskMobile(mobile);
  const displayMessage = message.includes('******') ? message : `✓ ${message}`;
  
  showMessage(displayMessage, 'success');
  updateProgressDots(2);
  
  // Store data for next step
  console.log('User logged in:', {
    name: state.userName,
    mobile: state.userMobile,
    timestamp: new Date().toISOString()
  });

  // Redirect to the URL from backend response
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 1500);
}

// Start OTP timer
function startOTPTimer() {
  const expiryTime = state.otpExpiry;
  
  if (state.otpTimer) {
    clearInterval(state.otpTimer);
  }
  
  state.otpTimer = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    
    if (remaining <= 0) {
      clearInterval(state.otpTimer);
      state.otpTimer = null;
      elements.otpTimer.textContent = 'OTP समय सीमा समाप्त हो गई';
      elements.resendOtpBtn.style.display = 'block';
      showMessage('OTP समय सीमा समाप्त हो गई। कृपया नया OTP प्राप्त करें।', 'error');
      return;
    }
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    elements.otpTimer.textContent = `OTP ${minutes}:${seconds.toString().padStart(2, '0')} मिनट तक वैध है`;
  }, 1000);
}

// Handle OTP error
function handleOTPError(message) {
  showMessage(message, 'error');
  updateProgressDots(0);
  
  // Vibrate if supported
  if ('vibrate' in navigator) {
    navigator.vibrate(200);
  }
}

// Mask mobile number for display
function maskMobile(mobile) {
  if (mobile.length === 10) {
    return `******${mobile.slice(-4)}`;
  }
  return mobile;
}

// Show message
function showMessage(text, type) {
  const icon = type === 'success' ? '✓' : '✕';
  
  const messageHTML = `
    <div class="message ${type}">
      <span class="message-icon">${icon}</span>
      <span>${text}</span>
    </div>
  `;
  
  elements.messageContainer.innerHTML = messageHTML;
  
  // Auto-clear error messages after 5 seconds
  if (type === 'error') {
    setTimeout(clearMessage, 5000);
  }
}

// Clear message
function clearMessage() {
  elements.messageContainer.innerHTML = '';
}

// Update progress dots
function updateProgressDots(step = 0) {
  state.currentStep = step;
  elements.progressDots.forEach((dot, index) => {
    if (index <= step) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Make functions globally accessible
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.resendOTP = resendOTP;

// Form validation on enter key
elements.form.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && !state.isSubmitting) {
    e.preventDefault();
    sendOTP();
  }
});

// Prevent form submission on enter in input fields (handled by keypress above)
[elements.nameInput, elements.mobileInput].forEach(input => {
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });
});

// Add focus animations
function addFocusAnimation(input) {
  input.addEventListener('focus', function() {
    this.parentElement.parentElement.style.transform = 'scale(1.01)';
  });
  
  input.addEventListener('blur', function() {
    this.parentElement.parentElement.style.transform = 'scale(1)';
  });
}

addFocusAnimation(elements.nameInput);
addFocusAnimation(elements.mobileInput);

// Log initialization
console.log('Hari Jap Sadhana Login initialized successfully');
console.log('Ready for user registration');
