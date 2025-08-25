document.addEventListener("DOMContentLoaded", () => {

    class VirtuousPhotoSlideshow {
        constructor() {
            /*** --- CONFIG & STATE --- ***/
            this.apiEndpoint     = "/api/photos";
            this.displayDuration = 5000; // milliseconds per photo
            this.photos          = [];
            this.currentIndex    = 0;
            this.isPlaying       = true;
            this.timer           = null;

            /*** --- DOM ELEMENT REFERENCES --- ***/
            this.photoContainer  = document.getElementById("photo-container");
            this.photoTitle      = document.getElementById("photo-title");
            this.photoDescription= document.getElementById("photo-description");
            this.photoAlt        = document.getElementById("photo-alt");
            this.photoCounter    = document.getElementById("photo-counter");
            this.progressFill    = document.getElementById("progress-fill");

            this.prevBtn         = document.getElementById("prev-btn");
            this.playPauseBtn    = document.getElementById("play-pause-btn");
            this.nextBtn         = document.getElementById("next-btn");

            // Start the sequence
            this.init();
        }

        /*** --- DEBUG LOGGING --- ***/
        log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ${message}`);
            
            // Optional: Display debug info on page (remove in production)
            if (window.DEBUG_MODE) {
                const debugDiv = document.getElementById('debug-info');
                if (debugDiv) {
                    debugDiv.innerHTML += `<p>[${timestamp}] ${message}</p>`;
                    debugDiv.scrollTop = debugDiv.scrollHeight;
                }
            }
        }

        /*** --- LIFECYCLE --- ***/
        async init() {
            this.log("🚀 Initializing VirtuousPhotoSlideshow...");
            
            // Validate DOM elements
            if (!this.validateDOMElements()) {
                this.log("❌ Required DOM elements not found!", 'error');
                return;
            }

            await this.loadPhotos();
            
            if (!this.photos.length) {
                this.log("⚠️ कोणतीही छायाचित्रे उपलब्ध नाहीत.", 'warn');
                this.showNoPhotosMessage();
                return;
            }
            
            this.log(`✅ ${this.photos.length} छायाचित्रे लोड झाली`);
            this.createPhotoElements();
            this.showPhoto(0);
            this.startSlideshow();
            this.attachEvents();
            this.log("🎉 Slideshow initialized successfully!");
        }

        /*** --- VALIDATION --- ***/
        validateDOMElements() {
            const requiredElements = [
                'photo-container', 'photo-title', 'photo-description', 
                'photo-alt', 'photo-counter', 'progress-fill',
                'prev-btn', 'play-pause-btn', 'next-btn'
            ];

            for (const elementId of requiredElements) {
                if (!document.getElementById(elementId)) {
                    this.log(`❌ Missing DOM element: #${elementId}`, 'error');
                    return false;
                }
            }
            return true;
        }

        /*** --- DATA LOADING --- ***/
        async loadPhotos() {
            try {
                this.log("📡 Loading photos from API...");
                const res  = await fetch(this.apiEndpoint);
                const data = await res.json();

                if (data.success && Array.isArray(data.photos)) {
                    this.photos = data.photos.filter(p => p && p.image_path);
                    this.log(`✅ API returned ${this.photos.length} valid photos`);
                } else {
                    this.log("⚠️ API response invalid or empty", 'warn');
                    this.photos = [];
                }
            } catch (err) {
                this.log(`❌ API fetch failed: ${err.message}`, 'error');
                this.photos = [];
            }
        }

        /*** --- ELEMENT CREATION --- ***/
        createPhotoElements() {
            this.log("🖼️ Creating photo DOM elements...");
            this.photoContainer.innerHTML = "";

            this.photos.forEach((photo, index) => {
                const img = document.createElement("img");
                img.src   = photo.image_path;
                img.alt   = photo.alt_text || photo.title || `Photo ${index + 1}`;
                img.classList.add("virtue-photo");
                img.setAttribute('data-index', index);
                
                // Show first image immediately
                if (index === 0) {
                    img.classList.add("active");
                }

                // Handle image load events
                img.onload = () => {
                    this.log(`✅ Image ${index + 1} loaded successfully`);
                };

                img.onerror = () => {
                    this.log(`❌ Failed to load image: ${photo.image_path}`, 'error');
                    // Fallback to placeholder
                    img.src = this.createPlaceholderImage(photo.title || `Photo ${index + 1}`);
                };

                this.photoContainer.appendChild(img);
            });

            this.log(`📸 Created ${this.photos.length} photo elements`);
        }

        /*** --- UTILITY METHODS --- ***/
        createPlaceholderImage(title) {
            return `https://via.placeholder.com/800x500/f2e3d5/5e3d25?text=${encodeURIComponent(title)}`;
        }

        showNoPhotosMessage() {
            this.photoContainer.innerHTML = `
                <div class="no-photos-message">
                    <h3>कोणतीही छायाचित्रे उपलब्ध नाहीत</h3>
                    <p>कृपया नंतर पुन्हा प्रयत्न करा</p>
                </div>
            `;
        }

        /*** --- RENDERING --- ***/
        showPhoto(index) {
            // Validate index
            if (index < 0 || index >= this.photos.length) {
                this.log(`❌ Invalid photo index: ${index}`, 'error');
                return;
            }

            this.log(`🔄 Showing photo ${index + 1}/${this.photos.length}: ${this.photos[index].title}`);
            
            const images = this.photoContainer.querySelectorAll(".virtue-photo");
            if (!images.length) {
                this.log("❌ No photo elements found!", 'error');
                return;
            }

            // Update active image with smooth transition
            images.forEach((img, i) => {
                if (i === index) {
                    img.classList.add("active");
                } else {
                    img.classList.remove("active");
                }
            });

            // Update photo information
            const photo = this.photos[index];
            if (this.photoTitle) this.photoTitle.textContent = photo.title || "";
            if (this.photoDescription) this.photoDescription.textContent = photo.description || "";
            if (this.photoAlt) this.photoAlt.textContent = photo.alt_text || "";
            if (this.photoCounter) this.photoCounter.textContent = `${index + 1} / ${this.photos.length}`;

            this.currentIndex = index;
            this.resetProgress();
        }

        /*** --- NAVIGATION --- ***/
        nextPhoto() {
            if (!this.photos.length) return;
            const nextIndex = (this.currentIndex + 1) % this.photos.length;
            this.log(`➡️ Moving to next photo (${nextIndex + 1})`);
            this.showPhoto(nextIndex);
        }

        prevPhoto() {
            if (!this.photos.length) return;
            const prevIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
            this.log(`⬅️ Moving to previous photo (${prevIndex + 1})`);
            this.showPhoto(prevIndex);
        }

        /*** --- SLIDESHOW CONTROL --- ***/
        startSlideshow() {
            this.log("▶️ Starting slideshow...");
            this.stopSlideshow(); // Clear any existing timer
            
            if (!this.photos.length) {
                this.log("⚠️ Cannot start slideshow - no photos available", 'warn');
                return;
            }

            this.isPlaying = true;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = "⏸️ विराम";
            }

            // Set up auto-advance timer
            this.timer = setInterval(() => {
                this.log("⏰ Auto-advancing to next photo...");
                this.nextPhoto();
            }, this.displayDuration);

            this.startProgress();
            this.log(`✅ Slideshow started (${this.displayDuration/1000}s intervals)`);
        }

        stopSlideshow() {
            if (this.timer) {
                this.log("⏹️ Stopping slideshow...");
                clearInterval(this.timer);
                this.timer = null;
            }
            
            this.isPlaying = false;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = "▶️ सुरू";
            }
        }

        togglePlayPause() {
            this.log(`🔄 Toggling playback (currently: ${this.isPlaying ? 'playing' : 'paused'})`);
            this.isPlaying ? this.stopSlideshow() : this.startSlideshow();
        }

        /*** --- PROGRESS BAR --- ***/
        resetProgress() {
            if (!this.progressFill) return;

            // Reset progress bar
            this.progressFill.style.transition = "none";
            this.progressFill.style.width = "0%";

            // Start progress animation if slideshow is playing
            setTimeout(() => {
                if (this.isPlaying && this.progressFill) {
                    this.progressFill.style.transition = `width ${this.displayDuration}ms linear`;
                    this.progressFill.style.width = "100%";
                }
            }, 50);
        }

        startProgress() {
            if (!this.progressFill) return;
            this.progressFill.style.transition = `width ${this.displayDuration}ms linear`;
            this.progressFill.style.width = "100%";
        }

        /*** --- EVENT BINDINGS --- ***/
        attachEvents() {
            this.log("🔗 Attaching event listeners...");

            // Navigation buttons
            if (this.nextBtn) {
                this.nextBtn.addEventListener("click", () => {
                    this.nextPhoto();
                    if (this.isPlaying) {
                        this.resetProgress();
                    }
                });
            }

            if (this.prevBtn) {
                this.prevBtn.addEventListener("click", () => {
                    this.prevPhoto();
                    if (this.isPlaying) {
                        this.resetProgress();
                    }
                });
            }

            if (this.playPauseBtn) {
                this.playPauseBtn.addEventListener("click", () => {
                    this.togglePlayPause();
                });
            }

            // Keyboard navigation
            document.addEventListener("keydown", (event) => {
                if (event.target.tagName.toLowerCase() === 'input') return; // Don't interfere with form inputs
                
                switch (event.key) {
                    case 'ArrowRight':
                    case ' ':
                        event.preventDefault();
                        this.nextPhoto();
                        if (this.isPlaying) this.resetProgress();
                        break;
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.prevPhoto();
                        if (this.isPlaying) this.resetProgress();
                        break;
                    case 'Escape':
                        event.preventDefault();
                        this.togglePlayPause();
                        break;
                }
            });

            // Pause on hover (optional)
            if (this.photoContainer) {
                this.photoContainer.addEventListener("mouseenter", () => {
                    if (this.isPlaying && this.progressFill) {
                        this.progressFill.style.animationPlayState = "paused";
                    }
                });

                this.photoContainer.addEventListener("mouseleave", () => {
                    if (this.isPlaying && this.progressFill) {
                        this.progressFill.style.animationPlayState = "running";
                    }
                });
            }

            this.log("✅ Event listeners attached successfully");
        }

        /*** --- PUBLIC API METHODS --- ***/
        
        // Allow external control
        goToPhoto(index) {
            if (index >= 0 && index < this.photos.length) {
                this.showPhoto(index);
                if (this.isPlaying) this.resetProgress();
            }
        }

        // Get current state
        getState() {
            return {
                currentIndex: this.currentIndex,
                totalPhotos: this.photos.length,
                isPlaying: this.isPlaying,
                currentPhoto: this.photos[this.currentIndex] || null
            };
        }
    }

    // Create global instance for external access
    window.VirtuousPhotoSlideshow = VirtuousPhotoSlideshow;
    
    // Auto-initialize
    window.slideshowInstance = new VirtuousPhotoSlideshow();
    
    // Enable debug mode by adding ?debug=1 to URL
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
        window.DEBUG_MODE = true;
        document.body.insertAdjacentHTML('beforeend', 
            '<div id="debug-info" style="position:fixed;bottom:10px;right:10px;width:300px;height:200px;background:rgba(0,0,0,0.8);color:white;padding:10px;font-size:12px;overflow-y:scroll;z-index:9999;"></div>'
        );
    }
});
