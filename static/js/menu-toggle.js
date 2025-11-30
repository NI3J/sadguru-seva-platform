// Enhanced Menu Toggle Function with improved mobile handling
function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.querySelector('.hamburger');

  if (!navLinks || !hamburger) return;

  // Toggle visibility
  navLinks.classList.toggle('hidden');
  hamburger.classList.toggle('active');

  // Update ARIA attributes for accessibility
  const isExpanded = !navLinks.classList.contains('hidden');
  hamburger.setAttribute('aria-expanded', isExpanded);

  // Focus management for accessibility
  if (isExpanded) {
    const firstLink = navLinks.querySelector('.nav-link');
    if (firstLink) firstLink.focus();
  }

  // Close all dropdowns when menu is toggled
  if (!isExpanded) {
    document.querySelectorAll('.dropdown.show').forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }
}

// Enhanced Dropdown Handling for Mobile with better touch support
document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item');
  let touchStartTime = 0;

  navItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.dropdown');

    if (link && dropdown) {
      // Improve touch handling for mobile devices
      link.addEventListener('touchstart', function(e) {
        touchStartTime = Date.now();
      }, { passive: true });

      link.addEventListener('touchend', function(e) {
        const touchDuration = Date.now() - touchStartTime;
        
        // Only handle as tap if it was a quick touch (not a scroll)
        if (touchDuration < 300 && window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();
          
          // Close other dropdowns first
          navItems.forEach(otherItem => {
            if (otherItem !== item) {
              const otherDropdown = otherItem.querySelector('.dropdown');
              if (otherDropdown) {
                otherDropdown.classList.remove('show');
              }
            }
          });

          // Toggle current dropdown
          dropdown.classList.toggle('show');
          
          // Add a small delay to ensure the dropdown is rendered
          setTimeout(() => {
            dropdown.style.pointerEvents = 'auto';
          }, 50);
        }
      });

      // Handle click events for desktop and as backup for mobile
      link.addEventListener('click', function(e) {
        // On mobile, prevent default and toggle dropdown
        if (window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();

          // Close other dropdowns
          navItems.forEach(otherItem => {
            if (otherItem !== item) {
              const otherDropdown = otherItem.querySelector('.dropdown');
              if (otherDropdown) {
                otherDropdown.classList.remove('show');
              }
            }
          });

          // Toggle current dropdown with improved reliability
          const isCurrentlyShown = dropdown.classList.contains('show');
          dropdown.classList.toggle('show');
          
          // Ensure proper event handling
          if (!isCurrentlyShown) {
            dropdown.style.pointerEvents = 'auto';
            dropdown.style.zIndex = '1001';
          }
        }
      });

      // Improve dropdown link click handling
      const dropdownLinks = dropdown.querySelectorAll('a');
      dropdownLinks.forEach(dropdownLink => {
        dropdownLink.addEventListener('click', function(e) {
          // Ensure the click goes through properly
          e.stopPropagation();
          
          // Add visual feedback
          this.style.backgroundColor = '#c28800';
          setTimeout(() => {
            this.style.backgroundColor = '';
          }, 200);

          // Close dropdown after click on mobile
          if (window.innerWidth <= 768) {
            setTimeout(() => {
              dropdown.classList.remove('show');
              const navLinks = document.getElementById('nav-links');
              const hamburger = document.querySelector('.hamburger');
              if (navLinks && hamburger) {
                navLinks.classList.add('hidden');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
              }
            }, 100);
          }
        });

        // Improve touch handling for dropdown links
        dropdownLink.addEventListener('touchend', function(e) {
          e.stopPropagation();
          // Ensure the link is clickable
          this.click();
        });
      });

      // Handle keyboard navigation
      link.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (window.innerWidth <= 768) {
            dropdown.classList.toggle('show');
          }
        } else if (e.key === 'Escape') {
          dropdown.classList.remove('show');
          link.focus();
        }
      });
    }
  });

  // Improved outside click handling
  document.addEventListener('click', function(event) {
    const isNavClick = event.target.closest('.navbar');
    if (!isNavClick && window.innerWidth <= 768) {
      navItems.forEach(item => {
        const dropdown = item.querySelector('.dropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
      });
    }
  }, true); // Use capture phase for better reliability

  // Handle window resize with improved logic
  window.addEventListener('resize', debounce(function() {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.querySelector('.hamburger');

    if (window.innerWidth > 768) {
      // Desktop mode: show nav links and hide hamburger
      if (navLinks) navLinks.classList.remove('hidden');
      if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }

      // Remove mobile dropdown shows and reset styles
      navItems.forEach(item => {
        const dropdown = item.querySelector('.dropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
          dropdown.style.pointerEvents = '';
          dropdown.style.zIndex = '';
        }
      });
    } else {
      // Mobile mode: hide nav links
      if (navLinks && !hamburger?.classList.contains('active')) {
        navLinks.classList.add('hidden');
      }
    }
  }, 250));

  // Improved smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();

        // Close mobile menu if open
        const navLinks = document.getElementById('nav-links');
        const hamburger = document.querySelector('.hamburger');
        if (navLinks && !navLinks.classList.contains('hidden')) {
          navLinks.classList.add('hidden');
          if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
          }
        }

        // Close all dropdowns
        document.querySelectorAll('.dropdown.show').forEach(dropdown => {
          dropdown.classList.remove('show');
        });

        // Smooth scroll to target
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Table Filter Function (Enhanced)
function filterTableBySeva() {
  const input = document.getElementById("sevaInput");
  if (!input) return;

  const filterValue = input.value.toLowerCase().trim();
  const tableRows = document.querySelectorAll("table tbody tr");
  let visibleRows = 0;

  tableRows.forEach(row => {
    const sevaCell = row.cells[3];
    if (sevaCell) {
      const sevaText = sevaCell.textContent.toLowerCase();
      const shouldShow = sevaText.includes(filterValue);
      row.style.display = shouldShow ? "" : "none";
      if (shouldShow) visibleRows++;
    }
  });

  // Show message if no results found
  const noResultsMsg = document.getElementById('no-results-message');
  if (noResultsMsg) {
    noResultsMsg.style.display = visibleRows === 0 ? 'block' : 'none';
  }
}

// Enhanced accessibility features
document.addEventListener('DOMContentLoaded', function() {
  // Add focus indicators for better keyboard navigation
  const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');

  focusableElements.forEach(element => {
    element.addEventListener('focus', function() {
      this.classList.add('focused');
    });

    element.addEventListener('blur', function() {
      this.classList.remove('focused');
    });
  });

  // Announce page changes for screen readers
  const announceElement = document.createElement('div');
  announceElement.setAttribute('aria-live', 'polite');
  announceElement.setAttribute('aria-atomic', 'true');
  announceElement.className = 'sr-only';
  announceElement.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  document.body.appendChild(announceElement);

  // Global function to announce messages to screen readers
  window.announceToScreenReader = function(message) {
    announceElement.textContent = message;
    setTimeout(() => {
      announceElement.textContent = '';
    }, 1000);
  };
});

// Performance optimization: Lazy load images with error handling
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;

        if (src) {
          // Create a new image to test loading
          const testImg = new Image();
          testImg.onload = function() {
            img.src = src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
          };
          testImg.onerror = function() {
            img.classList.add('error');
            console.warn('Failed to load image:', src);
          };
          testImg.src = src;
        }

        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  // Observe all lazy-loading images
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  });
}

// Utility function for debouncing events (performance optimization)
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Apply debouncing to resize events for better performance
window.addEventListener('resize', debounce(function() {
  // Re-initialize any responsive features if needed
  console.log('Window resized - responsive features updated');
}, 250));

// Export functions for global use (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    toggleMenu,
    filterTableBySeva,
    debounce
  };
}
