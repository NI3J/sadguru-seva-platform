// Program Page JavaScript
// 🌟 Global Variables
let originalDays = [];
let filteredDays = [];
let currentView = 'list';
let currentSort = 'date-desc';

// 🚀 Document Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🕉️ Program page loaded');
    initializePrograms();
});

// 🔧 Initialize Program Page
function initializePrograms() {
    // Show loading animation
    showLoading();
    
    // Add loaded class to container
    setTimeout(() => {
        const container = document.querySelector('.program-container');
        if (container) {
            container.classList.add('loaded');
        }
        hideLoading();
    }, 300);
    
    // Store original data
    storeOriginalData();
    
    // Initialize components
    initializeFilters();
    initializeExpanders();
    initializeFloatingButtons();
    initializeFlashMessages();
    initializeViewControls();
    initializeSortControls();
    updateStats();
    
    console.log('✅ Program page initialized');
}

// 📊 Store Original Data
function storeOriginalData() {
    const dayBlocks = document.querySelectorAll('.day-block');
    originalDays = [];
    
    dayBlocks.forEach(block => {
        const date = block.dataset.date;
        const programItems = block.querySelectorAll('.program-item');
        const programs = Array.from(programItems).map(item => 
            item.querySelector('.program-text')?.textContent?.trim() || ''
        );
        
        originalDays.push({
            date: date,
            programs: programs,
            element: block
        });
    });
    
    filteredDays = [...originalDays];
    console.log(`📊 Stored ${originalDays.length} days of programs`);
}

// 🔍 Initialize Filters
function initializeFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSection = document.getElementById('filterSection');
    const filterClose = document.getElementById('filterClose');
    const dateFilter = document.getElementById('dateFilter');
    const searchFilter = document.getElementById('searchFilter');
    const searchClear = document.getElementById('searchClear');
    const todayFilter = document.getElementById('todayFilter');
    const upcomingFilter = document.getElementById('upcomingFilter');
    const clearFilters = document.getElementById('clearFilters');

    // Toggle filter section
    if (filterToggle) {
        filterToggle.addEventListener('click', () => {
            const isVisible = filterSection.classList.contains('show');
            if (isVisible) {
                hideFilters();
            } else {
                showFilters();
            }
        });
    }

    // Close filter section
    if (filterClose) {
        filterClose.addEventListener('click', hideFilters);
    }

    // Date filter
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }

    // Search filter
    if (searchFilter) {
        searchFilter.addEventListener('input', debounce(applyFilters, 300));
    }

    // Clear search
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchFilter.value = '';
            applyFilters();
        });
    }

    // Today filter
    if (todayFilter) {
        todayFilter.addEventListener('click', filterToday);
    }

    // Upcoming filter
    if (upcomingFilter) {
        upcomingFilter.addEventListener('click', filterUpcoming);
    }

    // Clear all filters
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }
}

// 👁️ Show/Hide Filters
function showFilters() {
    const filterSection = document.getElementById('filterSection');
    const filterToggle = document.getElementById('filterToggle');
    
    if (filterSection) {
        filterSection.classList.add('show');
        filterSection.setAttribute('aria-hidden', 'false');
    }
    
    if (filterToggle) {
        filterToggle.classList.add('active');
    }
}

function hideFilters() {
    const filterSection = document.getElementById('filterSection');
    const filterToggle = document.getElementById('filterToggle');
    
    if (filterSection) {
        filterSection.classList.remove('show');
        filterSection.setAttribute('aria-hidden', 'true');
    }
    
    if (filterToggle) {
        filterToggle.classList.remove('active');
    }
}

// 🔍 Apply Filters
function applyFilters() {
    const dateFilter = document.getElementById('dateFilter')?.value;
    const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase();
    
    filteredDays = originalDays.filter(day => {
        // Date filter
        if (dateFilter && day.date !== dateFilter) {
            return false;
        }
        
        // Search filter
        if (searchFilter) {
            const searchText = day.programs.join(' ').toLowerCase();
            if (!searchText.includes(searchFilter)) {
                return false;
            }
        }
        
        return true;
    });
    
    updateDisplay();
    updateActiveFilters();
    updateStats();
}

// 📅 Filter to Today
function filterToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    applyFilters();
}

// ⏭️ Filter to Upcoming
function filterUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    
    filteredDays = originalDays.filter(day => day.date >= today);
    updateDisplay();
    updateActiveFilters();
    updateStats();
}

// ❌ Clear All Filters
function clearAllFilters() {
    document.getElementById('dateFilter').value = '';
    document.getElementById('searchFilter').value = '';
    
    filteredDays = [...originalDays];
    updateDisplay();
    updateActiveFilters();
    updateStats();
}

// 🏷️ Update Active Filters Display
function updateActiveFilters() {
    const activeFilters = document.getElementById('activeFilters');
    const activeFiltersList = document.getElementById('activeFiltersList');
    
    if (!activeFilters || !activeFiltersList) return;
    
    const filters = [];
    const dateValue = document.getElementById('dateFilter')?.value;
    const searchValue = document.getElementById('searchFilter')?.value;
    
    if (dateValue) {
        filters.push(`📅 ${dateValue}`);
    }
    
    if (searchValue) {
        filters.push(`🔍 "${searchValue}"`);
    }
    
    if (filters.length > 0) {
        activeFiltersList.innerHTML = filters.map(filter => 
            `<span class="active-filter-tag">${filter}</span>`
        ).join('');
        activeFilters.style.display = 'block';
    } else {
        activeFilters.style.display = 'none';
    }
}

// 🔽 Initialize Expanders
function initializeExpanders() {
    const expandToggles = document.querySelectorAll('.expand-toggle');
    
    expandToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = toggle.dataset.target;
            const content = document.getElementById(targetId);
            const icon = toggle.querySelector('.toggle-icon');
            
            if (content) {
                const isExpanded = content.classList.contains('expanded');
                
                if (isExpanded) {
                    content.classList.remove('expanded');
                    toggle.classList.remove('expanded');
                } else {
                    content.classList.add('expanded');
                    toggle.classList.add('expanded');
                }
            }
        });
    });
    
    // Auto-expand today's programs
    const today = new Date().toISOString().split('T')[0];
    const todayBlock = document.querySelector(`[data-date="${today}"]`);
    if (todayBlock) {
        const todayToggle = todayBlock.querySelector('.expand-toggle');
        if (todayToggle) {
            todayToggle.click();
        }
    }
}

// 🎈 Initialize Floating Buttons
function initializeFloatingButtons() {
    const scrollTopBtn = document.getElementById('scrollToTop');
    const shareBtn = document.getElementById('sharePrograms');
    const fabs = document.querySelectorAll('.fab');
    
    // Show FABs after a delay
    setTimeout(() => {
        fabs.forEach((fab, index) => {
            setTimeout(() => {
                fab.classList.add('show');
            }, index * 100);
        });
    }, 1000);
    
    // Scroll to top functionality
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Show/hide scroll button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.style.opacity = '1';
            } else {
                scrollTopBtn.style.opacity = '0.7';
            }
        });
    }
    
    // Share functionality
    if (shareBtn) {
        shareBtn.addEventListener('click', sharePrograms);
    }
}

// 📤 Share Programs
function sharePrograms() {
    const shareModal = document.getElementById('shareModal');
    if (shareModal) {
        shareModal.style.display = 'flex';
        
        // Share platform buttons
        const shareBtns = shareModal.querySelectorAll('[data-platform]');
        shareBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.target.dataset.platform;
                const url = window.location.href;
                const title = 'Sadguru Baba चे दैनिक कार्यक्रम';
                
                switch(platform) {
                    case 'whatsapp':
                        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`);
                        break;
                    case 'facebook':
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
                        break;
                    case 'copy':
                        navigator.clipboard.writeText(url).then(() => {
                            showFlashMessage('✅ Link copied to clipboard!');
                        });
                        break;
                }
                shareModal.style.display = 'none';
            });
        });
        
        // Close modal
        const closeBtn = shareModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                shareModal.style.display = 'none';
            });
        }
    }
}

// 💬 Initialize Flash Messages
function initializeFlashMessages() {
    const flashMessages = document.querySelectorAll('.flash-message');
    
    flashMessages.forEach(message => {
        const closeBtn = message.querySelector('.flash-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                message.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    message.remove();
                }, 300);
            });
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    message.remove();
                }, 300);
            }
        }, 5000);
    });
}

// 📋 Initialize View Controls
function initializeViewControls() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const programsList = document.getElementById('programsList');
    const programsCalendar = document.getElementById('programsCalendar');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            // Update active button
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Switch view
            if (view === 'list') {
                if (programsList) programsList.style.display = 'block';
                if (programsCalendar) programsCalendar.style.display = 'none';
                currentView = 'list';
            } else if (view === 'calendar') {
                if (programsList) programsList.style.display = 'none';
                if (programsCalendar) programsCalendar.style.display = 'block';
                currentView = 'calendar';
                generateCalendar();
            }
        });
    });
}

// 🔀 Initialize Sort Controls
function initializeSortControls() {
    const sortSelect = document.getElementById('sortSelect');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applySort();
        });
    }
}

// 🔀 Apply Sort
function applySort() {
    switch(currentSort) {
        case 'date-asc':
            filteredDays.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            filteredDays.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'programs-asc':
            filteredDays.sort((a, b) => a.programs.length - b.programs.length);
            break;
        case 'programs-desc':
            filteredDays.sort((a, b) => b.programs.length - a.programs.length);
            break;
    }
    
    updateDisplay();
}

// 🔄 Update Display
function updateDisplay() {
    const programsList = document.getElementById('programsList');
    if (!programsList) return;
    
    // Hide all original blocks
    originalDays.forEach(day => {
        if (day.element) {
            day.element.style.display = 'none';
        }
    });
    
    // Show filtered blocks in correct order
    filteredDays.forEach((day, index) => {
        if (day.element) {
            day.element.style.display = 'block';
            day.element.style.order = index;
        }
    });
    
    // Show empty state if no results
    let emptyState = document.querySelector('.empty-state-filtered');
    if (filteredDays.length === 0) {
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state empty-state-filtered';
            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <h2 class="empty-title">कोणतेही कार्यक्रम सापडले नाहीत</h2>
                <p class="empty-description">कृपया अन्य फिल्टर वापरून पहा</p>
                <button class="empty-action" onclick="clearAllFilters()">सर्व फिल्टर साफ करा</button>
            `;
            programsList.appendChild(emptyState);
        }
        emptyState.style.display = 'block';
    } else {
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
}

// 📊 Update Statistics
function updateStats() {
    const totalDaysSpan = document.getElementById('totalDays');
    const totalProgramsSpan = document.getElementById('totalPrograms');
    const todayProgramsSpan = document.getElementById('todayPrograms');
    
    if (totalDaysSpan) {
        totalDaysSpan.textContent = filteredDays.length;
    }
    
    if (totalProgramsSpan) {
        const total = filteredDays.reduce((sum, day) => sum + day.programs.length, 0);
        totalProgramsSpan.textContent = total;
    }
    
    if (todayProgramsSpan) {
        const today = new Date().toISOString().split('T')[0];
        const todayDay = filteredDays.find(day => day.date === today);
        todayProgramsSpan.textContent = todayDay ? todayDay.programs.length : 0;
    }
}

// 📅 Generate Calendar View
function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create calendar HTML
    let calendarHTML = '<div class="calendar-grid">';
    
    // Days of week header
    const daysOfWeek = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
    daysOfWeek.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Calendar days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayPrograms = filteredDays.find(day => day.date === dateStr);
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = dateStr === today.toISOString().split('T')[0];
        
        let dayClass = 'calendar-day';
        if (!isCurrentMonth) dayClass += ' other-month';
        if (isToday) dayClass += ' today';
        if (dayPrograms && dayPrograms.programs.length > 0) dayClass += ' has-programs';
        
        calendarHTML += `
            <div class="${dayClass}" data-date="${dateStr}">
                <span class="date-number">${date.getDate()}</span>
                ${dayPrograms ? `<span class="program-count">${dayPrograms.programs.length}</span>` : ''}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendarGrid.innerHTML = calendarHTML;
    
    // Add click handlers for calendar days
    const calendarDays = calendarGrid.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            document.getElementById('dateFilter').value = date;
            applyFilters();
            
            // Switch back to list view
            const listViewBtn = document.querySelector('[data-view="list"]');
            if (listViewBtn) listViewBtn.click();
        });
    });
}

// 🔄 Loading Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

// 💬 Show Flash Message
function showFlashMessage(message, type = 'success') {
    const flashContainer = document.createElement('div');
    flashContainer.className = 'flash-messages';
    
    const flashMessage = document.createElement('div');
    flashMessage.className = `flash-message flash-${type}`;
    flashMessage.innerHTML = `
        <span class="flash-text">${message}</span>
        <button class="flash-close">&times;</button>
    `;
    
    flashContainer.appendChild(flashMessage);
    document.body.appendChild(flashContainer);
    
    // Add close functionality
    const closeBtn = flashMessage.querySelector('.flash-close');
    closeBtn.addEventListener('click', () => {
        flashContainer.remove();
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (flashContainer.parentElement) {
            flashContainer.remove();
        }
    }, 3000);
}

// 🛠️ Utility Functions
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

// 📱 Offline Detection
window.addEventListener('online', () => {
    const offlineIndicator = document.getElementById('offlineIndicator');
    if (offlineIndicator) {
        offlineIndicator.style.display = 'none';
    }
});

window.addEventListener('offline', () => {
    const offlineIndicator = document.getElementById('offlineIndicator');
    if (offlineIndicator) {
        offlineIndicator.style.display = 'block';
    }
});

// 🔄 Load More Functionality
function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMorePrograms);
    }
}

function loadMorePrograms() {
    showLoading();
    
    // Simulate loading more data
    setTimeout(() => {
        hideLoading();
        showFlashMessage('✅ अधिक कार्यक्रम लोड झाले!');
    }, 1000);
}

// 🚀 Export functions for global access
window.programJS = {
    clearAllFilters,
    filterToday,
    filterUpcoming,
    showFlashMessage,
    loadMorePrograms
};

console.log('✅ Program.js loaded successfully');
