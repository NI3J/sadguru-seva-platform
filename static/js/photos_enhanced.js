/**
 * 🌸 Enhanced Virtuous Photos Gallery JavaScript
 * Modern, Feature-Rich Photo Gallery with Advanced Functionality
 */

class EnhancedPhotoGallery {
    constructor() {
        // Configuration
        this.config = {
            apiEndpoint: '/api/photos',
            photosPerPage: 12,
            slideshowDuration: 5000,
            imageLoadTimeout: 10000,
            debounceDelay: 300
        };

        // State Management
        this.state = {
            photos: [],
            filteredPhotos: [],
            currentPage: 1,
            totalPages: 1,
            currentView: 'grid',
            currentSlide: 0,
            isSlideshowPlaying: false,
            slideshowTimer: null,
            searchQuery: '',
            selectedCategory: '',
            isLoading: false,
            error: null
        };

        // DOM Elements
        this.elements = {
            // Main containers
            photosGrid: document.getElementById('photos-grid'),
            loadingIndicator: document.getElementById('loading-indicator'),
            errorMessage: document.getElementById('error-message'),
            pagination: document.getElementById('pagination'),
            statsSection: document.getElementById('stats-section'),
            
            // Controls
            searchInput: document.getElementById('search-input'),
            clearSearchBtn: document.getElementById('clear-search'),
            categorySelect: document.getElementById('category-select'),
            viewButtons: {
                grid: document.getElementById('grid-view'),
                slideshow: document.getElementById('slideshow-view'),
                list: document.getElementById('list-view')
            },
            
            // Slideshow modal
            slideshowModal: document.getElementById('slideshow-modal'),
            slideImage: document.getElementById('slide-image'),
            slideTitle: document.getElementById('slide-title'),
            slideDescription: document.getElementById('slide-description'),
            slideCounter: document.getElementById('slide-counter'),
            slideCategory: document.getElementById('slide-category'),
            closeSlideshowBtn: document.getElementById('close-slideshow'),
            prevSlideBtn: document.getElementById('prev-slide'),
            nextSlideBtn: document.getElementById('next-slide'),
            playPauseBtn: document.getElementById('play-pause'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            downloadBtn: document.getElementById('download-btn'),
            progressFill: document.getElementById('progress-fill'),
            
            // Pagination
            prevPageBtn: document.getElementById('prev-page'),
            nextPageBtn: document.getElementById('next-page'),
            pageNumbers: document.getElementById('page-numbers'),
            
            // Stats
            totalPhotos: document.getElementById('total-photos'),
            totalViews: document.getElementById('total-views'),
            avgViews: document.getElementById('avg-views'),
            
            // Retry button
            retryBtn: document.getElementById('retry-btn')
        };

        // Initialize the gallery
        this.init();
    }

    /**
     * Initialize the gallery
     */
    async init() {
        try {
            this.log('🚀 Initializing Enhanced Photo Gallery...');
            
            // Validate DOM elements
            if (!this.validateElements()) {
                throw new Error('Required DOM elements not found');
            }

            // Set up event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadPhotos();
            await this.loadStats();

            // Apply initial filters
            this.applyFilters();

            this.log('✅ Gallery initialized successfully');
        } catch (error) {
            this.log(`❌ Initialization failed: ${error.message}`, 'error');
            this.showError(error.message);
        }
    }

    /**
     * Validate required DOM elements
     */
    validateElements() {
        const requiredElements = [
            'photosGrid', 'loadingIndicator', 'errorMessage',
            'searchInput', 'categorySelect', 'slideshowModal'
        ];

        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                this.log(`❌ Missing element: ${elementName}`, 'error');
                return false;
            }
        }
        return true;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search functionality
        this.elements.searchInput.addEventListener('input', 
            this.debounce(() => this.handleSearch(), this.config.debounceDelay));
        
        this.elements.clearSearchBtn.addEventListener('click', () => this.clearSearch());

        // Category filter
        this.elements.categorySelect.addEventListener('change', () => this.handleCategoryChange());

        // View mode toggle
        Object.entries(this.elements.viewButtons).forEach(([view, button]) => {
            if (button) {
                button.addEventListener('click', () => this.setViewMode(view));
            }
        });

        // Slideshow controls
        this.elements.closeSlideshowBtn.addEventListener('click', () => this.closeSlideshow());
        this.elements.prevSlideBtn.addEventListener('click', () => this.previousSlide());
        this.elements.nextSlideBtn.addEventListener('click', () => this.nextSlide());
        this.elements.playPauseBtn.addEventListener('click', () => this.toggleSlideshow());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadCurrentPhoto());

        // Pagination
        this.elements.prevPageBtn.addEventListener('click', () => this.previousPage());
        this.elements.nextPageBtn.addEventListener('click', () => this.nextPage());

        // Retry button
        this.elements.retryBtn.addEventListener('click', () => this.retry());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Modal click outside to close
        this.elements.slideshowModal.addEventListener('click', (e) => {
            if (e.target === this.elements.slideshowModal) {
                this.closeSlideshow();
            }
        });

        this.log('✅ Event listeners set up');
    }

    /**
     * Load photos from API
     */
    async loadPhotos() {
        try {
            this.setState({ isLoading: true, error: null });
            this.showLoading();

            const params = new URLSearchParams({
                page: this.state.currentPage,
                per_page: this.config.photosPerPage,
                category: this.state.selectedCategory,
                search: this.state.searchQuery
            });

            const response = await fetch(`${this.config.apiEndpoint}?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load photos');
            }

            this.setState({
                photos: data.data.photos,
                totalPages: data.data.total_pages,
                isLoading: false
            });

            this.renderPhotos();
            this.updatePagination();
            this.hideLoading();

            this.log(`✅ Loaded ${data.data.photos.length} photos`);
        } catch (error) {
            this.log(`❌ Failed to load photos: ${error.message}`, 'error');
            this.setState({ isLoading: false, error: error.message });
            this.showError(error.message);
        }
    }

    /**
     * Load gallery statistics
     */
    async loadStats() {
        try {
            const response = await fetch('/api/photos/stats');
            const data = await response.json();

            if (data.success) {
                this.updateStats(data.stats);
                this.elements.statsSection.style.display = 'flex';
            }
        } catch (error) {
            this.log(`⚠️ Failed to load stats: ${error.message}`, 'warn');
        }
    }

    /**
     * Render photos based on current view mode
     */
    renderPhotos() {
        if (!this.elements.photosGrid) {
            this.log('❌ Photos grid element not found', 'error');
            return;
        }

        this.elements.photosGrid.innerHTML = '';

        if (this.state.photos.length === 0) {
            this.showNoPhotosMessage();
            return;
        }

        // FIXED: Remove existing view classes first, then add the correct one
        this.elements.photosGrid.className = 'photos-grid';
        this.elements.photosGrid.classList.add(`${this.state.currentView}-view`);
        
        this.log(`🔄 Setting view to: ${this.state.currentView}-view`);

        this.state.photos.forEach((photo, index) => {
            this.log(`🖼️ Creating element for photo ${index + 1}: ${photo.title}`);
            const element = this.createPhotoElement(photo, index);
            if (element && element.nodeType === Node.ELEMENT_NODE) {
                this.elements.photosGrid.appendChild(element);
                this.log(`✅ Added photo element ${index + 1} to grid`);
            } else {
                this.log(`❌ Failed to create element for photo ${index + 1}`, 'error');
            }
        });

        this.log(`📸 Rendered ${this.state.photos.length} photos in ${this.state.currentView} view`);
    }

    /**
     * Create photo element based on view mode
     */
    createPhotoElement(photo, index) {
        const templateElement = this.state.currentView === 'list' 
            ? document.getElementById('photo-list-template')
            : document.getElementById('photo-card-template');
        
        if (!templateElement) {
            this.log(`❌ Template not found for view: ${this.state.currentView}`, 'error');
            return this.createFallbackElement(photo, index);
        }
        
        const template = templateElement.content.cloneNode(true);

        const element = this.state.currentView === 'list' 
            ? template.querySelector('.photo-list-item')
            : template.querySelector('.photo-card');
        
        if (!element) {
            this.log(`❌ Template element not found for view: ${this.state.currentView}`, 'error');
            return this.createFallbackElement(photo, index);
        }

        // Set photo data
        element.setAttribute('data-photo-id', photo.id);
        
        // Set image
        const img = element.querySelector('.photo-image, .list-image');
        if (img) {
            img.src = photo.image_path;
            img.alt = photo.alt_text || photo.title;
            img.loading = 'lazy';
            
            // Handle image load events
            img.addEventListener('load', () => {
                const loadingEl = element.querySelector('.photo-loading, .image-loading');
                if (loadingEl) loadingEl.style.display = 'none';
            });
            
            img.addEventListener('error', () => {
                this.log(`❌ Failed to load image: ${photo.image_path}`, 'error');
                img.src = this.createPlaceholderImage(photo.title);
            });
        }

        // Set text content
        const title = element.querySelector('.photo-title, .list-title');
        if (title) title.textContent = photo.title || 'Untitled';

        const description = element.querySelector('.photo-description, .list-description');
        if (description) description.textContent = photo.description || '';

        const category = element.querySelector('.photo-category, .list-category');
        if (category) {
            category.textContent = this.getCategoryName(photo.category);
            category.className = `photo-category category-${photo.category}`;
        }

        const date = element.querySelector('.photo-date, .list-date');
        if (date && photo.upload_date) {
            date.textContent = this.formatDate(photo.upload_date);
        }

        const views = element.querySelector('.list-views');
        if (views && photo.view_count) {
            views.textContent = `${photo.view_count} दृश्ये`;
        }

        // Add click handlers
        const viewBtn = element.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSlideshow(index);
            });
        }

        const downloadBtn = element.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadPhoto(photo);
            });
        }

        // Add click handler to entire element (except for list view actions)
        if (this.state.currentView !== 'list') {
            element.addEventListener('click', () => {
                this.openSlideshow(index);
            });
        } else {
            const imageContainer = element.querySelector('.list-image-container');
            const infoContainer = element.querySelector('.list-info');
            if (imageContainer) {
                imageContainer.addEventListener('click', () => this.openSlideshow(index));
            }
            if (infoContainer) {
                infoContainer.addEventListener('click', () => this.openSlideshow(index));
            }
        }

        return element;
    }

    /**
     * Create fallback element if template is missing
     */
    createFallbackElement(photo, index) {
        const div = document.createElement('div');
        div.className = this.state.currentView === 'list' ? 'photo-list-item' : 'photo-card';
        div.setAttribute('data-photo-id', photo.id);
        div.innerHTML = `
            <div class="${this.state.currentView === 'list' ? 'list-image-container' : 'photo-image-container'}">
                <img src="${photo.image_path}" alt="${photo.alt_text || photo.title}" class="${this.state.currentView === 'list' ? 'list-image' : 'photo-image'}" loading="lazy">
            </div>
            <div class="${this.state.currentView === 'list' ? 'list-info' : 'photo-info'}">
                <h3>${photo.title || 'Untitled'}</h3>
                <p>${photo.description || ''}</p>
            </div>
        `;
        div.addEventListener('click', () => this.openSlideshow(index));
        return div;
    }

    /**
     * Handle search input
     */
    handleSearch() {
        const query = this.elements.searchInput.value.trim();
        this.setState({ searchQuery: query, currentPage: 1 });
        
        if (query) {
            this.elements.clearSearchBtn.style.display = 'block';
        } else {
            this.elements.clearSearchBtn.style.display = 'none';
        }
        
        this.loadPhotos();
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.clearSearchBtn.style.display = 'none';
        this.setState({ searchQuery: '', currentPage: 1 });
        this.loadPhotos();
    }

    /**
     * Handle category change
     */
    handleCategoryChange() {
        const category = this.elements.categorySelect.value;
        this.setState({ selectedCategory: category, currentPage: 1 });
        this.loadPhotos();
    }

    /**
     * Set view mode
     */
    setViewMode(mode) {
        // Update button states
        Object.entries(this.elements.viewButtons).forEach(([view, button]) => {
            if (button) {
                button.classList.toggle('active', view === mode);
            }
        });

        this.setState({ currentView: mode });
        this.renderPhotos();
        
        this.log(`🔄 Switched to ${mode} view`);
    }

    /**
     * Open slideshow modal
     */
    openSlideshow(index) {
        this.setState({ currentSlide: index });
        this.elements.slideshowModal.style.display = 'flex';
        this.updateSlideshowContent();
        this.startSlideshow();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        this.log(`🎬 Opened slideshow at index ${index}`);
    }

    /**
     * Close slideshow modal
     */
    closeSlideshow() {
        this.elements.slideshowModal.style.display = 'none';
        this.stopSlideshow();
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        this.log('🎬 Closed slideshow');
    }

    /**
     * Update slideshow content
     */
    updateSlideshowContent() {
        const photo = this.state.photos[this.state.currentSlide];
        if (!photo) return;

        // Update image
        this.elements.slideImage.src = photo.image_path;
        this.elements.slideImage.alt = photo.alt_text || photo.title;

        // Update text content
        this.elements.slideTitle.textContent = photo.title || 'Untitled';
        this.elements.slideDescription.textContent = photo.description || '';
        this.elements.slideCounter.textContent = `${this.state.currentSlide + 1} / ${this.state.photos.length}`;
        
        const categoryElement = this.elements.slideCategory;
        if (categoryElement) {
            categoryElement.textContent = this.getCategoryName(photo.category);
            categoryElement.className = `slide-category category-${photo.category}`;
        }

        // Update download button
        this.elements.downloadBtn.onclick = () => this.downloadPhoto(photo);
    }

    /**
     * Navigate slideshow
     */
    nextSlide() {
        const nextIndex = (this.state.currentSlide + 1) % this.state.photos.length;
        this.setState({ currentSlide: nextIndex });
        this.updateSlideshowContent();
        this.resetProgress();
    }

    previousSlide() {
        const prevIndex = (this.state.currentSlide - 1 + this.state.photos.length) % this.state.photos.length;
        this.setState({ currentSlide: prevIndex });
        this.updateSlideshowContent();
        this.resetProgress();
    }

    /**
     * Toggle slideshow play/pause
     */
    toggleSlideshow() {
        if (this.state.isSlideshowPlaying) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }

    /**
     * Start slideshow
     */
    startSlideshow() {
        this.setState({ isSlideshowPlaying: true });
        this.elements.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        this.startProgress();
        
        this.state.slideshowTimer = setInterval(() => {
            this.nextSlide();
        }, this.config.slideshowDuration);
    }

    /**
     * Stop slideshow
     */
    stopSlideshow() {
        this.setState({ isSlideshowPlaying: false });
        this.elements.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        
        if (this.state.slideshowTimer) {
            clearInterval(this.state.slideshowTimer);
            this.state.slideshowTimer = null;
        }
    }

    /**
     * Start progress bar animation
     */
    startProgress() {
        if (!this.elements.progressFill) return;
        
        this.elements.progressFill.style.transition = `width ${this.config.slideshowDuration}ms linear`;
        this.elements.progressFill.style.width = '100%';
    }

    /**
     * Reset progress bar
     */
    resetProgress() {
        if (!this.elements.progressFill) return;
        
        this.elements.progressFill.style.transition = 'none';
        this.elements.progressFill.style.width = '0%';
        
        setTimeout(() => {
            if (this.state.isSlideshowPlaying) {
                this.startProgress();
            }
        }, 50);
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.elements.slideshowModal.requestFullscreen().catch(err => {
                this.log(`❌ Fullscreen failed: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Download current photo
     */
    downloadCurrentPhoto() {
        const photo = this.state.photos[this.state.currentSlide];
        if (photo) {
            this.downloadPhoto(photo);
        }
    }

    /**
     * Download photo
     */
    downloadPhoto(photo) {
        try {
            const link = document.createElement('a');
            link.href = photo.image_path;
            link.download = `${photo.title || 'photo'}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.log(`📥 Downloaded: ${photo.title}`);
        } catch (error) {
            this.log(`❌ Download failed: ${error.message}`, 'error');
        }
    }

    /**
     * Pagination methods
     */
    previousPage() {
        if (this.state.currentPage > 1) {
            this.setState({ currentPage: this.state.currentPage - 1 });
            this.loadPhotos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    nextPage() {
        if (this.state.currentPage < this.state.totalPages) {
            this.setState({ currentPage: this.state.currentPage + 1 });
            this.loadPhotos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.state.totalPages) {
            this.setState({ currentPage: page });
            this.loadPhotos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Update pagination UI
     */
    updatePagination() {
        if (!this.elements.pagination) return;

        if (this.state.totalPages <= 1) {
            this.elements.pagination.style.display = 'none';
            return;
        }

        this.elements.pagination.style.display = 'flex';

        // Update prev/next buttons
        this.elements.prevPageBtn.disabled = this.state.currentPage === 1;
        this.elements.nextPageBtn.disabled = this.state.currentPage === this.state.totalPages;

        // Update page numbers
        this.elements.pageNumbers.innerHTML = '';
        
        const startPage = Math.max(1, this.state.currentPage - 2);
        const endPage = Math.min(this.state.totalPages, this.state.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageTemplate = document.getElementById('page-number-template');
            if (!pageTemplate) continue;
            
            const pageBtn = pageTemplate.content.cloneNode(true);
            const button = pageBtn.querySelector('.page-number-btn');
            button.textContent = i;
            button.setAttribute('data-page', i);
            button.classList.toggle('active', i === this.state.currentPage);
            
            button.addEventListener('click', () => this.goToPage(i));
            this.elements.pageNumbers.appendChild(pageBtn);
        }
    }

    /**
     * Update statistics
     */
    updateStats(stats) {
        if (this.elements.totalPhotos) {
            this.elements.totalPhotos.textContent = stats.total_photos || 0;
        }
        if (this.elements.totalViews) {
            this.elements.totalViews.textContent = stats.total_views || 0;
        }
        if (this.elements.avgViews) {
            this.elements.avgViews.textContent = Math.round(stats.avg_views || 0);
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(event) {
        if (this.elements.slideshowModal.style.display === 'flex') {
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    this.closeSlideshow();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                case ' ':
                    event.preventDefault();
                    this.nextSlide();
                    break;
                case 'f':
                case 'F':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        } else {
            switch (event.key) {
                case '/':
                    event.preventDefault();
                    this.elements.searchInput.focus();
                    break;
            }
        }
    }

    /**
     * Apply filters
     */
    applyFilters() {
        // This method can be extended for client-side filtering
        // Currently, filtering is handled server-side
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'block';
        }
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'none';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'block';
            const errorText = this.elements.errorMessage.querySelector('p');
            if (errorText) {
                errorText.textContent = message;
            }
        }
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Show no photos message
     */
    showNoPhotosMessage() {
        this.elements.photosGrid.innerHTML = `
            <div class="no-photos-message">
                <i class="fas fa-images"></i>
                <h3>कोणतीही छायाचित्रे सापडली नाहीत</h3>
                <p>कृपया शोध क्वेरी किंवा श्रेणी बदला</p>
            </div>
        `;
    }

    /**
     * Retry loading
     */
    retry() {
        this.loadPhotos();
    }

    /**
     * Utility methods
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    debounce(func, wait) {
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

    createPlaceholderImage(title) {
        return `https://via.placeholder.com/400x300/f2e3d5/5e3d25?text=${encodeURIComponent(title)}`;
    }

    getCategoryName(categoryId) {
        const categories = {
            'darshan': 'दर्शन',
            'satsang': 'सत्संग',
            'festivals': 'सण',
            'ashram': 'आश्रम',
            'devotees': 'भक्तगण',
            'nature': 'निसर्ग'
        };
        return categories[categoryId] || categoryId;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('mr-IN');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.photoGallery = new EnhancedPhotoGallery();
});

// Export for external access
window.EnhancedPhotoGallery = EnhancedPhotoGallery;

