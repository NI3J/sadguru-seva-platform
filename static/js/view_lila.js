// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌸 View Lila JavaScript - Krishna Lila Individual Page
// static/js/view_lila.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 Global Variables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentLanguage = 'marathi';
let isAudioPlaying = false;
let isVideoPlaying = false;
let bookmarkedLilas = JSON.parse(localStorage.getItem('bookmarkedLilas') || '[]');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 Initialize Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    checkBookmarkStatus();
    setupScrollEffects();
});

function initializePage() {
    console.log('🌸 Krishna Lila View initialized');
    
    // Set initial language
    showLanguage('marathi');
    
    // Initialize reading progress
    initializeReadingProgress();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Initialize tooltips
    initializeTooltips();
}

function setupEventListeners() {
    // Language toggle buttons
    document.getElementById('marathiBtn')?.addEventListener('click', () => showLanguage('marathi'));
    document.getElementById('englishBtn')?.addEventListener('click', () => showLanguage('english'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Print functionality
    setupPrintStyles();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 Language Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLanguage(language) {
    currentLanguage = language;
    
    // Hide all story sections
    const storyElements = document.querySelectorAll('.story-section');
    storyElements.forEach(el => {
        el.classList.remove('active');
    });
    
    // Remove active class from all buttons
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected language story
    const targetStory = document.getElementById(language + 'Story');
    const targetButton = document.getElementById(language + 'Btn');
    
    if (targetStory) {
        targetStory.classList.add('active');
        // Smooth fade-in effect
        targetStory.style.opacity = '0';
        setTimeout(() => {
            targetStory.style.opacity = '1';
        }, 100);
    }
    
    if (targetButton) {
        targetButton.classList.add('active');
    }
    
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', language);
    
    console.log(`📝 Language switched to: ${language}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 Media Control Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleAudio() {
    const mediaPlayer = document.getElementById('mediaPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const audioBtn = document.querySelector('.audio-btn');
    
    if (!audioPlayer) {
        showNotification('Audio not available', 'error');
        return;
    }
    
    // Hide video if playing
    if (videoPlayer && !videoPlayer.paused) {
        videoPlayer.pause();
        videoPlayer.style.display = 'none';
        isVideoPlaying = false;
        updateVideoButton();
    }
    
    if (isAudioPlaying) {
        audioPlayer.pause();
        mediaPlayer.style.display = 'none';
        audioPlayer.style.display = 'none';
        isAudioPlaying = false;
        audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>ऑडिओ</span>';
    } else {
        mediaPlayer.style.display = 'block';
        audioPlayer.style.display = 'block';
        audioPlayer.play();
        isAudioPlaying = true;
        audioBtn.innerHTML = '<i class="fas fa-pause"></i><span>रोका</span>';
    }
    
    // Scroll to media player
    if (isAudioPlaying) {
        mediaPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function toggleVideo() {
    const mediaPlayer = document.getElementById('mediaPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoBtn = document.querySelector('.video-btn');
    
    if (!videoPlayer) {
        showNotification('Video not available', 'error');
        return;
    }
    
    // Hide audio if playing
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.style.display = 'none';
        isAudioPlaying = false;
        updateAudioButton();
    }
    
    if (isVideoPlaying) {
        videoPlayer.pause();
        mediaPlayer.style.display = 'none';
        videoPlayer.style.display = 'none';
        isVideoPlaying = false;
        videoBtn.innerHTML = '<i class="fas fa-play"></i><span>व्हिडिओ</span>';
    } else {
        mediaPlayer.style.display = 'block';
        videoPlayer.style.display = 'block';
        videoPlayer.play();
        isVideoPlaying = true;
        videoBtn.innerHTML = '<i class="fas fa-pause"></i><span>रोका</span>';
    }
    
    // Scroll to media player
    if (isVideoPlaying) {
        mediaPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateAudioButton() {
    const audioBtn = document.querySelector('.audio-btn');
    if (audioBtn) {
        if (isAudioPlaying) {
            audioBtn.innerHTML = '<i class="fas fa-pause"></i><span>रोका</span>';
        } else {
            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>ऑडिओ</span>';
        }
    }
}

function updateVideoButton() {
    const videoBtn = document.querySelector('.video-btn');
    if (videoBtn) {
        if (isVideoPlaying) {
            videoBtn.innerHTML = '<i class="fas fa-pause"></i><span>रोका</span>';
        } else {
            videoBtn.innerHTML = '<i class="fas fa-play"></i><span>व्हिडिओ</span>';
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔖 Bookmark Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function bookmarkLila(lilaId) {
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    
    if (bookmarkedLilas.includes(lilaId)) {
        // Remove from bookmarks
        bookmarkedLilas = bookmarkedLilas.filter(id => id !== lilaId);
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>जतन करा</span>';
        showNotification('Bookmark removed', 'success');
    } else {
        // Add to bookmarks
        bookmarkedLilas.push(lilaId);
        bookmarkBtn.classList.add('bookmarked');
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>जतन केले</span>';
        showNotification('Lila bookmarked!', 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('bookmarkedLilas', JSON.stringify(bookmarkedLilas));
}

function checkBookmarkStatus() {
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    const lilaId = getCurrentLilaId();
    
    if (lilaId && bookmarkedLilas.includes(lilaId)) {
        bookmarkBtn?.classList.add('bookmarked');
        if (bookmarkBtn) {
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>जतन केले</span>';
        }
    }
}

function getCurrentLilaId() {
    // Extract lila ID from URL or from data attribute
    const path = window.location.pathname;
    const match = path.match(/\/lila\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 Share Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function shareLila() {
    const title = document.querySelector('.title-marathi')?.textContent || 'Krishna Lila';
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: `🌸 ${title} - कृष्ण लिला`,
            text: 'भगवान कृष्णाची ही दिव्य लिला वाचा',
            url: url
        }).then(() => {
            showNotification('Shared successfully!', 'success');
        }).catch(() => {
            fallbackShare(title, url);
        });
    } else {
        fallbackShare(title, url);
    }
}

function fallbackShare(title, url) {
    // Create temporary textarea and copy URL
    const textarea = document.createElement('textarea');
    textarea.value = `🌸 ${title} - ${url}`;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    showNotification('Link copied to clipboard!', 'success');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 Reading Progress Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeReadingProgress() {
    // Create reading progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.innerHTML = '<div class="progress-fill"></div>';
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: rgba(255, 107, 53, 0.2);
            z-index: 1000;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b35, #f7931e);
            width: 0%;
            transition: width 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', updateReadingProgress);
}

function updateReadingProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${Math.min(progress, 100)}%`;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⌨️ Keyboard Shortcuts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleKeyboardShortcuts(event) {
    // Don't trigger if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(event.key) {
        case 'm':
        case 'M':
            showLanguage('marathi');
            break;
        case 'e':
        case 'E':
            showLanguage('english');
            break;
        case 'a':
        case 'A':
            if (document.getElementById('audioPlayer')) {
                toggleAudio();
            }
            break;
        case 'v':
        case 'V':
            if (document.getElementById('videoPlayer')) {
                toggleVideo();
            }
            break;
        case 'b':
        case 'B':
            const lilaId = getCurrentLilaId();
            if (lilaId) {
                bookmarkLila(lilaId);
            }
            break;
        case 's':
        case 'S':
            shareLila();
            break;
        case 'Escape':
            // Close any open modals or players
            closeAllMedia();
            break;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 Visual Effects Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupScrollEffects() {
    // Add scroll-triggered animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);

    // Observe content sections
    document.querySelectorAll('.content-section').forEach(section => {
        observer.observe(section);
    });

    // Add CSS for animations
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        .content-section {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .content-section.animate-fade-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(animationStyles);
}

function setupSmoothScrolling() {
    // Add smooth scrolling to all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 Notification Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    // Add styles
    const notificationStyles = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        .notification.notification-success {
            border-left: 4px solid #4caf50;
        }
        .notification.notification-error {
            border-left: 4px solid #f44336;
        }
        .notification.notification-info {
            border-left: 4px solid #2196f3;
        }
        .notification.notification-warning {
            border-left: 4px solid #ff9800;
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification-icon {
            font-size: 16px;
        }
        .notification-message {
            font-weight: 500;
        }
    `;

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = notificationStyles;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖨️ Print Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupPrintStyles() {
    const printStyles = document.createElement('style');
    printStyles.textContent = `
        @media print {
            .navbar, .breadcrumb-container, .media-controls, 
            .navigation-buttons, .footer, .reading-progress {
                display: none !important;
            }
            
            .lila-content {
                background: white !important;
            }
            
            .content-section {
                box-shadow: none !important;
                border: 1px solid #ddd !important;
                page-break-inside: avoid;
            }
            
            .story-section {
                display: block !important;
            }
            
            .language-toggle {
                display: none !important;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
        }
    `;
    document.head.appendChild(printStyles);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 Utility Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function closeAllMedia() {
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const mediaPlayer = document.getElementById('mediaPlayer');

    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        isAudioPlaying = false;
        updateAudioButton();
    }

    if (videoPlayer && !videoPlayer.paused) {
        videoPlayer.pause();
        isVideoPlaying = false;
        updateVideoButton();
    }

    if (mediaPlayer) {
        mediaPlayer.style.display = 'none';
        if (audioPlayer) audioPlayer.style.display = 'none';
        if (videoPlayer) videoPlayer.style.display = 'none';
    }
}

function initializeTooltips() {
    // Add tooltips to buttons
    const tooltips = {
        '.audio-btn': 'Press A to toggle audio',
        '.video-btn': 'Press V to toggle video',
        '.share-btn': 'Press S to share',
        '.bookmark-btn': 'Press B to bookmark',
        '#marathiBtn': 'Press M for Marathi',
        '#englishBtn': 'Press E for English'
    };

    Object.entries(tooltips).forEach(([selector, tooltip]) => {
        const element = document.querySelector(selector);
        if (element) {
            element.title = tooltip;
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 Analytics Functions (Optional)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function trackLilaView() {
    const lilaId = getCurrentLilaId();
    if (lilaId) {
        // Track view in localStorage
        const viewedLilas = JSON.parse(localStorage.getItem('viewedLilas') || '[]');
        if (!viewedLilas.includes(lilaId)) {
            viewedLilas.push(lilaId);
            localStorage.setItem('viewedLilas', JSON.stringify(viewedLilas));
        }
        
        // You can add analytics tracking here
        console.log(`📊 Lila ${lilaId} viewed`);
    }
}

function trackTimeSpent() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
        const timeSpent = Date.now() - startTime;
        const lilaId = getCurrentLilaId();
        
        if (lilaId && timeSpent > 5000) { // Only track if spent more than 5 seconds
            const readingTimes = JSON.parse(localStorage.getItem('readingTimes') || '{}');
            readingTimes[lilaId] = (readingTimes[lilaId] || 0) + timeSpent;
            localStorage.setItem('readingTimes', JSON.stringify(readingTimes));
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 Font Size Control
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createFontSizeControl() {
    const fontControl = document.createElement('div');
    fontControl.className = 'font-size-control';
    fontControl.innerHTML = `
        <button onclick="adjustFontSize(-1)" title="Decrease font size">A-</button>
        <button onclick="resetFontSize()" title="Reset font size">A</button>
        <button onclick="adjustFontSize(1)" title="Increase font size">A+</button>
    `;
    
    const controlStyles = `
        .font-size-control {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 5px;
            z-index: 1000;
        }
        .font-size-control button {
            width: 40px;
            height: 40px;
            border: none;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .font-size-control button:hover {
            background: #ff6b35;
            color: white;
            transform: translateY(-2px);
        }
    `;
    
    if (!document.getElementById('font-control-styles')) {
        const style = document.createElement('style');
        style.id = 'font-control-styles';
        style.textContent = controlStyles;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(fontControl);
}

function adjustFontSize(change) {
    const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    const newSize = currentSize + (change * 2);
    
    if (newSize >= 14 && newSize <= 24) {
        document.body.style.fontSize = newSize + 'px';
        localStorage.setItem('fontSize', newSize);
        showNotification(`Font size: ${newSize}px`, 'info');
    }
}

function resetFontSize() {
    document.body.style.fontSize = '16px';
    localStorage.setItem('fontSize', '16');
    showNotification('Font size reset', 'info');
}

// Load saved font size
function loadSavedFontSize() {
    const savedSize = localStorage.getItem('fontSize');
    if (savedSize) {
        document.body.style.fontSize = savedSize + 'px';
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 Final Initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Track lila view
    trackLilaView();
    trackTimeSpent();
    
    // Load saved preferences
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && (savedLanguage === 'marathi' || savedLanguage === 'english')) {
        showLanguage(savedLanguage);
    }
    
    loadSavedFontSize();
    
    // Create font size control
    createFontSizeControl();
    
    console.log('🌸 Krishna Lila view fully initialized!');
});

// Export functions for global access
window.showLanguage = showLanguage;
window.toggleAudio = toggleAudio;
window.toggleVideo = toggleVideo;
window.shareLila = shareLila;
window.bookmarkLila = bookmarkLila;
window.adjustFontSize = adjustFontSize;
window.resetFontSize = resetFontSize;
