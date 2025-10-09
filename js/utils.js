/**
 * Utility Functions
 * Reusable helper functions for the application
 */

const Utils = {
    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function to limit function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Get current breakpoint
     * @returns {string} Current breakpoint name
     */
    getBreakpoint() {
        const width = window.innerWidth;
        if (width < CONFIG.breakpoints.mobile) return 'mobile';
        if (width < CONFIG.breakpoints.tablet) return 'tablet';
        if (width < CONFIG.breakpoints.desktop) return 'desktop';
        return 'wide';
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },

    /**
     * Format date to locale string
     * @param {Date|string} date - Date to format
     * @param {string} locale - Locale string
     * @returns {string} Formatted date
     */
    formatDate(date, locale = 'es-MX') {
        const d = new Date(date);
        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Show loading state
     * @param {HTMLElement} element - Element to show loading in
     */
    showLoading(element) {
        element.innerHTML = `
            <div class="loading-container">
                <div class="loading"></div>
            </div>
        `;
    },

    /**
     * Show error message
     * @param {HTMLElement} element - Element to show error in
     * @param {string} message - Error message
     */
    showError(element, message) {
        element.innerHTML = `
            <div class="alert alert-error">
                <strong>Error:</strong> ${this.sanitizeHTML(message)}
            </div>
        `;
    },

    /**
     * Smooth scroll to element
     * @param {HTMLElement|string} target - Element or selector to scroll to
     * @param {number} offset - Offset from top in pixels
     */
    scrollTo(target, offset = 0) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
        
        if (!element) return;

        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Local storage wrapper with error handling
     */
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage error:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    },

    /**
     * Create element from HTML string
     * @param {string} html - HTML string
     * @returns {HTMLElement} Created element
     */
    createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    },

    /**
     * Add event listener with cleanup
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    on(element, event, handler) {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }
};

// Make Utils globally available
window.Utils = Utils;