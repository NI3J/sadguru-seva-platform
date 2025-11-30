// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌸 Krishna Lila JavaScript - Sadguru Seva Platform
// static/js/lila.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', function() {
    console.log('🕉️ Krishna Lila page initialized');
    
    // Initialize all components
    initializeTabs();
    initializeSearch();
    initializeScrollEffects();
    initializeLazyLoading();
    initializeTooltips();
    initializeKeyboardNavigation();
    
    // Add loading states
    addLoadingStates();
    
    // Initialize performance monitoring
    monitorPerformance();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 Tab System for Categories
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0) return;
    
    // Set first tab as active by default
    if (tabButtons[0]) {
        tabButtons[0].classList.add('active');
    }
    if (tabContents[0]) {
        tabContents[0].classList.add('active');
    }
    
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const category = button.textContent.toLowerCase().includes('childhood') ? 'childhood' :
                           button.textContent.toLowerCase().includes('youth') ? 'youth' :
                           button.textContent.toLowerCase().includes('mathura') ? 'mathura' :
                           button.textContent.toLowerCase().includes('dwarka') ? 'dwarka' :
                           button.textContent.toLowerCase().includes('devotion') ? 'devotion' :
                           button.textContent.toLowerCase().includes('teaching') ? 'teachings' :
                           button.textContent.toLowerCase().includes('miracle') ? 'miracles' : 
                           'childhood';
            
            showCategory(category);
            
            // Analytics tracking
            trackEvent('category_view', {
                category: category,
                method: 'tab_click'
            });
        });
        
        // Add keyboard support
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
            
            // Arrow key navigation
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const nextIndex = e.key === 'ArrowRight' ? 
                    (index + 1) % tabButtons.length : 
                    (index - 1 + tabButtons.length) % tabButtons.length;
                tabButtons[nextIndex].focus();
            }
        });
    });
}

function showCategory(category) {
    console.log(`🏷️ Showing category: ${category}`);
    
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    const activeButton = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.textContent.toLowerCase().includes(category.toLowerCase()));
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const activeContent = document.getElementById(`${category}-content`);
    if (activeContent) {
        activeContent.classList.add('active');
        
        // Trigger animations for cards in active content
        const cards = activeContent.querySelectorAll('.lila-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 50}ms`;
            card.classList.add('animate-slide-up');
        });
    }
    
    // Update URL without page reload
    if (history.pushState) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('category', category);
        history.pushState({ category }, '', newUrl);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 Enhanced Search Functionality
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchForm = document.querySelector('.search-form');
    
    if (!searchInput || !searchForm) return;
    
    let searchTimeout;
    
    // Auto-suggest functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            hideSearchSuggestions();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            fetchSearchSuggestions(query);
        }, 300);
    });
    
    // Handle form submission
    searchForm.addEventListener('submit', function(e) {
        const query = searchInput.value.trim();
        
        if (!query) {
            e.preventDefault();
            showNotification('कृपया शोध शब्द प्रविष्ट करा', 'Please enter search terms', 'warning');
            searchInput.focus();
            return;
        }
        
        // Track search
        trackEvent('search', {
            query: query,
            method: 'form_submit'
        });
    });
    
    // Clear search on escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            hideSearchSuggestions();
            this.blur();
        }
    });
}

function fetchSearchSuggestions(query) {
    // Create suggestions dropdown
    let suggestionsContainer = document.querySelector('.search-suggestions');
    
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        document.querySelector('.hero-search').appendChild(suggestionsContainer);
    }
    
    // Mock suggestions (in real app, this would be an API call)
    const mockSuggestions = [
        'कृष्णाचा जन्म', 'Krishna Birth', 'मक्खन चोरी', 'Butter Theft',
        'गोवर्धन गिरी', 'Govardhan Hill', 'राधा कृष्ण', 'Radha Krishna',
        'द्वारका नगरी', 'Dwarka City', 'भगवद्गीता', 'Bhagavad Gita'
    ];
    
    const filteredSuggestions = mockSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    if (filteredSuggestions.length === 0) {
        hideSearchSuggestions();
        return;
    }
    
    const suggestionsHTML = filteredSuggestions.map(suggestion => 
        `<div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
    ).join('');
    
    suggestionsContainer.innerHTML = suggestionsHTML;
    suggestionsContainer.style.display = 'block';
}

function selectSuggestion(suggestion) {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = suggestion;
        document.querySelector('.search-form').submit();
    }
}

function hideSearchSuggestions() {
    const container = document.querySelector('.search-suggestions');
    if (container) {
        container.style.display = 'none';
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 Scroll Effects & Animations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeScrollEffects() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.style.background = 'rgba(30, 58, 138, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'var(--gradient-primary)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
        
        // Hide/show navbar on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                if (element.classList.contains('stat-card')) {
                    animateCounter(element.querySelector('.stat-number'));
                }
                
                if (element.classList.contains('featured-card') || 
                    element.classList.contains('lila-card')) {
                    element.classList.add('animate-slide-up');
                }
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.stat-card, .featured-card, .lila-card').forEach(el => {
        scrollObserver.observe(el);
    });
}

function animateCounter(element) {
    if (!element || element.dataset.animated) return;
    
    const target = parseInt(element.textContent);
    const duration = 1000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
            element.dataset.animated = 'true';
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ Lazy Loading for Images
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 Tooltips & Interactive Elements
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

function showTooltip(e) {
    const element = e.target;
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (!tooltipText) return;
    
    let tooltip = document.querySelector('.tooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = tooltipText;
    tooltip.style.display = 'block';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⌨️ Keyboard Navigation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Alt + H: Go to home
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '/';
        }
        
        // Alt + S: Focus search
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape: Close any open modals or suggestions
        if (e.key === 'Escape') {
            hideSearchSuggestions();
            hideTooltip();
        }
    });
    
    // Skip link for accessibility
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ Loading States
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function addLoadingStates() {
    // Add loading spinner CSS
    const style = document.createElement('style');
    style.textContent = `
        .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 0 0 1rem 1rem;
            box-shadow: var(--card-shadow);
            z-index: 10;
            display: none;
            overflow: hidden;
        }
        
        .suggestion-item {
            padding: 1rem 1.5rem;
            cursor: pointer;
            transition: background-color 0.2s;
            font-family: var(--font-devanagari);
        }
        
        .suggestion-item:hover {
            background: #f3f4f6;
        }
        
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            z-index: 1000;
            transform: translateX(-50%);
            pointer-events: none;
            white-space: nowrap;
            display: none;
        }
        
        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: rgba(0, 0, 0, 0.9);
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid var(--krishna-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .lazy {
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 Analytics & Performance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function trackEvent(eventName, parameters = {}) {
    // Console logging for development
    console.log(`📊 Event: ${eventName}`, parameters);
    
    // In production, send to analytics service
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Store in sessionStorage for debugging
    const events = JSON.parse(sessionStorage.getItem('krishna_lila_events') || '[]');
    events.push({
        event: eventName,
        parameters,
        timestamp: new Date().toISOString()
    });
    sessionStorage.setItem('krishna_lila_events', JSON.stringify(events.slice(-50)));
}

function monitorPerformance() {
    // Track page load performance
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        trackEvent('page_performance', {
            load_time: Math.round(perfData.loadEventEnd - perfData.fetchStart),
            dom_content_loaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
            page_type: 'krishna_lila_index'
        });
    });
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) {
                        console.warn(`⚠️ Long task detected: ${entry.duration}ms`);
                    }
                });
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.log('Long task monitoring not supported');
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 Notification System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showNotification(marathiText, englishText, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-text marathi">${marathiText}</div>
            <div class="notification-text english">${englishText}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add notification styles
    if (!document.querySelector('#notification-styles')) {
        const notificationStyles = document.createElement('style');
        notificationStyles.id = 'notification-styles';
        notificationStyles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-left: 4px solid var(--krishna-blue);
                border-radius: var(--card-radius);
                box-shadow: var(--hover-shadow);
                padding: 1rem;
                z-index: 1000;
                max-width: 400px;
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                border-left-color: #10b981;
            }
            
            .notification-warning {
                border-left-color: #f59e0b;
            }
            
            .notification-error {
                border-left-color: #ef4444;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-text.marathi {
                font-family: var(--font-devanagari);
                font-weight: 600;
                color: #374151;
                margin-bottom: 0.25rem;
            }
            
            .notification-text.english {
                font-size: 0.9em;
                color: #6b7280;
                font-style: italic;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: var(--transition-smooth);
            }
            
            .notification-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
        `;
        document.head.appendChild(notificationStyles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // Track notification
    trackEvent('notification_shown', {
        type: type,
        marathi_text: marathiText,
        english_text: englishText
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌓 Theme Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeTheme() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('krishna-lila-theme') || 'light';
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Create theme toggle if it doesn't exist
    let themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) {
        themeToggle = createThemeToggle();
    }
    
    // Add event listener
    themeToggle.addEventListener('click', toggleTheme);
}

function createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = '🌙';
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.setAttribute('data-tooltip', 'Switch Theme / थीम बदला');
    
    // Add to navbar
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.appendChild(toggle);
    }
    
    return toggle;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('krishna-lila-theme', newTheme);
    
    // Update toggle icon
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        toggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Track theme change
    trackEvent('theme_changed', {
        new_theme: newTheme,
        previous_theme: currentTheme
    });
    
    // Show notification
    const messages = {
        dark: {
            marathi: 'डार्क मोड सक्रिय केला',
            english: 'Dark mode activated'
        },
        light: {
            marathi: 'लाइट मोड सक्रिय केला',
            english: 'Light mode activated'
        }
    };
    
    showNotification(
        messages[newTheme].marathi,
        messages[newTheme].english,
        'success'
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 Advanced Interactions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initializeAdvancedFeatures() {
    // Reading progress indicator
    createReadingProgress();
    
    // Quick actions menu
    createQuickActions();
    
    // Favorite system
    initializeFavorites();
    
    // Share functionality
    initializeSharing();
}

function createReadingProgress() {
    if (document.querySelector('.lila-content')) {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
        
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', updateReadingProgress);
    }
}

function updateReadingProgress() {
    const content = document.querySelector('.lila-content');
    if (!content) return;
    
    const contentRect = content.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const contentHeight = content.offsetHeight;
    
    const scrolled = Math.max(0, -contentRect.top);
    const progress = Math.min(100, (scrolled / (contentHeight - windowHeight)) * 100);
    
    const progressFill = document.querySelector('.reading-progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

function createQuickActions() {
    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.innerHTML = `
        <button class="quick-action" onclick="scrollToTop()" data-tooltip="Top / वर जा">
            <i class="fas fa-arrow-up"></i>
        </button>
        <button class="quick-action" onclick="toggleFavorite()" data-tooltip="Favorite / आवडते">
            <i class="far fa-heart"></i>
        </button>
        <button class="quick-action" onclick="shareContent()" data-tooltip="Share / सामायिक करा">
            <i class="fas fa-share"></i>
        </button>
    `;
    
    document.body.appendChild(quickActions);
    
    // Show/hide based on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            quickActions.style.transform = 'translateY(0)';
        } else {
            quickActions.style.transform = 'translateY(100px)';
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    trackEvent('scroll_to_top', {
        method: 'quick_action'
    });
}

function initializeFavorites() {
    const favorites = JSON.parse(localStorage.getItem('krishna-lila-favorites') || '[]');
    
    // Update UI for favorited items
    document.querySelectorAll('.lila-card, .featured-card').forEach(card => {
        const lilaId = card.dataset.lilaId;
        if (favorites.includes(lilaId)) {
            card.classList.add('favorited');
            const heartIcon = card.querySelector('.fa-heart');
            if (heartIcon) {
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
            }
        }
    });
}

function toggleFavorite(lilaId) {
    const favorites = JSON.parse(localStorage.getItem('krishna-lila-favorites') || '[]');
    
    if (!lilaId) {
        // Try to get from URL or page data
        lilaId = new URLSearchParams(window.location.search).get('id') || 
                 document.querySelector('[data-lila-id]')?.dataset.lilaId;
    }
    
    if (!lilaId) return;
    
    const isFavorited = favorites.includes(lilaId);
    
    if (isFavorited) {
        const index = favorites.indexOf(lilaId);
        favorites.splice(index, 1);
        showNotification('आवडत्यांमधून काढले', 'Removed from favorites', 'info');
    } else {
        favorites.push(lilaId);
        showNotification('आवडत्यांमध्ये जोडले', 'Added to favorites', 'success');
    }
    
    localStorage.setItem('krishna-lila-favorites', JSON.stringify(favorites));
    
    // Update UI
    const heartIcons = document.querySelectorAll('.fa-heart');
    heartIcons.forEach(icon => {
        if (isFavorited) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
    });
    
    trackEvent('favorite_toggled', {
        lila_id: lilaId,
        action: isFavorited ? 'removed' : 'added'
    });
}

function initializeSharing() {
    // Add share buttons to appropriate places
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', shareContent);
    });
}

function shareContent() {
    const title = document.querySelector('h1')?.textContent || 'कृष्ण लिला';
    const url = window.location.href;
    const text = `${title} - Krishna Lila from Sadguru Seva Platform`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).then(() => {
            trackEvent('content_shared', {
                method: 'native_share',
                title: title
            });
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
            showNotification('दुवा कॉपी केला', 'Link copied to clipboard', 'success');
            trackEvent('content_shared', {
                method: 'clipboard',
                title: title
            });
        }).catch(() => {
            // Final fallback: Open share dialog
            openShareDialog(title, url, text);
        });
    }
}

function openShareDialog(title, url, text) {
    const shareDialog = document.createElement('div');
    shareDialog.className = 'share-dialog';
    shareDialog.innerHTML = `
        <div class="share-dialog-content">
            <h3>सामायिक करा / Share</h3>
            <div class="share-options">
                <a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" 
                   target="_blank" class="share-option whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" 
                   target="_blank" class="share-option facebook">
                    <i class="fab fa-facebook"></i> Facebook
                </a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" 
                   target="_blank" class="share-option twitter">
                    <i class="fab fa-twitter"></i> Twitter
                </a>
                <button onclick="copyToClipboard('${url}')" class="share-option copy">
                    <i class="fas fa-copy"></i> Copy Link
                </button>
            </div>
            <button onclick="closeShareDialog()" class="close-dialog">✕</button>
        </div>
        <div class="share-dialog-overlay" onclick="closeShareDialog()"></div>
    `;
    
    document.body.appendChild(shareDialog);
    
    // Add animation
    setTimeout(() => shareDialog.classList.add('active'), 10);
}

function closeShareDialog() {
    const dialog = document.querySelector('.share-dialog');
    if (dialog) {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 300);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('दुवा कॉपी केला', 'Link copied!', 'success');
        closeShareDialog();
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 Utility Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Debounce function for performance
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

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format numbers for display
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Error handling wrapper
function withErrorHandling(func) {
    return function(...args) {
        try {
            return func.apply(this, args);
        } catch (error) {
            console.error('Error in function:', error);
            trackEvent('javascript_error', {
                error_message: error.message,
                stack: error.stack,
                function_name: func.name
            });
        }
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 Browser Support & Polyfills
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Check for required features
function checkBrowserSupport() {
    const requiredFeatures = {
        'IntersectionObserver': 'IntersectionObserver' in window,
        'localStorage': 'localStorage' in window,
        'fetch': 'fetch' in window,
        'Promise': 'Promise' in window
    };
    
    const missingFeatures = Object.entries(requiredFeatures)
        .filter(([feature, supported]) => !supported)
        .map(([feature]) => feature);
    
    if (missingFeatures.length > 0) {
        console.warn('Missing browser features:', missingFeatures);
        showNotification(
            'आपला ब्राउझर जुना आहे', 
            'Your browser may not support all features', 
            'warning'
        );
    }
    
    return missingFeatures.length === 0;
}

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

function initialize() {
    console.log('🕉️ Krishna Lila platform initializing...');
    
    // Check browser support
    const hasFullSupport = checkBrowserSupport();
    
    if (hasFullSupport) {
        // Initialize all features
        initializeTheme();
        initializeAdvancedFeatures();
    }
    
    console.log('✅ Krishna Lila platform ready!');
    
    // Track initialization
    trackEvent('app_initialized', {
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        screen_size: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
    });
}

// Export functions for global access
window.KrishnaLila = {
    showCategory,
    showNotification,
    toggleFavorite,
    shareContent,
    trackEvent
};

// Console message
console.log(`
🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸
   Krishna Lila Platform Loaded
   कृष्ण लिला प्लॅटफॉर्म तयार
🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸🕉️🌸
`);
