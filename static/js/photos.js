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

        /*** --- LIFECYCLE --- ***/
        async init() {
            await this.loadPhotos();
            if (!this.photos.length) {
                console.warn("⚠️ कोणतीही छायाचित्रे उपलब्ध नाहीत.");
                return;
            }
            this.createPhotoElements();
            this.showPhoto(0);
            this.startSlideshow();
            this.attachEvents();
        }

        /*** --- DATA LOADING --- ***/
        async loadPhotos() {
            try {
                const res  = await fetch(this.apiEndpoint);
                const data = await res.json();

                if (data.success && Array.isArray(data.photos)) {
                    this.photos = data.photos.filter(p => !!p.image_path);
                    console.info(`✅ ${this.photos.length} छायाचित्रे लोड झाली`);
                } else {
                    console.warn("⚠️ API कडून छायाचित्रे मिळाली नाहीत.");
                }
            } catch (err) {
                console.error("❌ छायाचित्रे लोड करताना त्रुटी:", err);
            }
        }

        /*** --- ELEMENT CREATION --- ***/
        createPhotoElements() {
            this.photoContainer.innerHTML = "";

            this.photos.forEach((photo, index) => {
                const img = document.createElement("img");
                img.src   = photo.image_path;
                img.alt   = photo.alt_text || "";
                img.classList.add("virtue-photo");
                if (index === 0) img.classList.add("active");

                img.onerror = () => {
                    console.warn(`⚠️ प्रतिमा लोड झाली नाही: ${photo.image_path}`);
                    img.src = "https://via.placeholder.com/800x500/cccccc/ffffff?text=प्रतिमा+आढळली+नाही";
                };

                this.photoContainer.appendChild(img);
            });
        }

        /*** --- RENDERING --- ***/
        showPhoto(index) {
            const images = this.photoContainer.querySelectorAll(".virtue-photo");
            if (!images.length) return;

            images.forEach((img, i) => {
                img.classList.toggle("active", i === index);
            });

            const photo = this.photos[index] || {};
            this.photoTitle.textContent       = photo.title || "";
            this.photoDescription.textContent = photo.description || "";
            this.photoAlt.textContent         = photo.alt_text || "";
            this.photoCounter.textContent     = `${index + 1} / ${this.photos.length}`;

            this.currentIndex = index;
            this.resetProgress();
        }

        /*** --- NAVIGATION --- ***/
        nextPhoto() {
            this.showPhoto((this.currentIndex + 1) % this.photos.length);
        }
        prevPhoto() {
            this.showPhoto((this.currentIndex - 1 + this.photos.length) % this.photos.length);
        }

        /*** --- SLIDESHOW CONTROL --- ***/
        startSlideshow() {
            this.stopSlideshow();
            this.isPlaying = true;
            this.playPauseBtn.textContent = "⏸️ विराम";
            this.timer = setInterval(() => this.nextPhoto(), this.displayDuration);
            this.startProgress();
        }
        stopSlideshow() {
            clearInterval(this.timer);
            this.isPlaying = false;
            this.playPauseBtn.textContent = "▶️ सुरू";
        }
        togglePlayPause() {
            this.isPlaying ? this.stopSlideshow() : this.startSlideshow();
        }

        /*** --- PROGRESS BAR --- ***/
        resetProgress() {
            this.progressFill.style.transition = "none";
            this.progressFill.style.width      = "0%";
            setTimeout(() => {
                this.progressFill.style.transition = `width ${this.displayDuration}ms linear`;
                this.progressFill.style.width      = "100%";
            }, 50);
        }
        startProgress() {
            this.progressFill.style.transition = `width ${this.displayDuration}ms linear`;
            this.progressFill.style.width      = "100%";
        }

        /*** --- EVENT BINDINGS --- ***/
        attachEvents() {
            this.nextBtn.addEventListener("click", () => {
                this.nextPhoto();
                if (this.isPlaying) this.startProgress();
            });
            this.prevBtn.addEventListener("click", () => {
                this.prevPhoto();
                if (this.isPlaying) this.startProgress();
            });
            this.playPauseBtn.addEventListener("click", () => {
                this.togglePlayPause();
                if (this.isPlaying) this.startProgress();
            });
        }
    }

    // Instantiate when DOM is ready
    new VirtuousPhotoSlideshow();
});
