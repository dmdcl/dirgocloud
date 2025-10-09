/**
 * ContentLoader Component
 * Handles dynamic loading of external content
 */

class ContentLoader {
    constructor() {
        this.cache = new Map();
        this.loadingStates = new Map();
    }

    /**
     * Load external HTML content
     * @param {string} tabName - Tab name to load content for
     * @returns {Promise<string>} Promise resolving to HTML content
     */
    async loadContent(tabName) {
        // Check if home tab (no external load needed)
        if (tabName === 'home') {
            return Promise.resolve(null);
        }

        // Check cache first
        if (CONFIG.cache.enabled && this.cache.has(tabName)) {
            const cached = this.cache.get(tabName);
            if (Date.now() - cached.timestamp < CONFIG.cache.ttl) {
                return Promise.resolve(cached.content);
            }
        }

        // Check if already loading
        if (this.loadingStates.has(tabName)) {
            return this.loadingStates.get(tabName);
        }

        // Get target element
        const targetElement = document.getElementById(`${tabName}-tab`);
        if (!targetElement) {
            return Promise.reject(new Error('Target element not found'));
        }

        // Show loading state
        Utils.showLoading(targetElement);

        // Create loading promise
        const loadingPromise = this.fetchContent(tabName)
            .then(html => {
                this.renderContent(targetElement, html);
                this.cacheContent(tabName, html);
                this.loadingStates.delete(tabName);
                return html;
            })
            .catch(error => {
                this.handleError(targetElement, error);
                this.loadingStates.delete(tabName);
                throw error;
            });

        // Store loading promise
        this.loadingStates.set(tabName, loadingPromise);

        return loadingPromise;
    }

    /**
     * Fetch content from server
     * @param {string} tabName - Tab name
     * @returns {Promise<string>} Promise resolving to HTML
     */
    async fetchContent(tabName) {
        const fileName = CONFIG.pages[tabName];
        if (!fileName) {
            throw new Error(`No page configured for tab: ${tabName}`);
        }

        const url = `${CONFIG.paths.pages}/${fileName}`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            return html;

        } catch (error) {
            if (error.name === 'TypeError') {
                throw new Error(CONFIG.messages.networkError);
            }
            throw error;
        }
    }

    /**
     * Render content in target element
     * @param {HTMLElement} element - Target element
     * @param {string} html - HTML content to render
     */
    renderContent(element, html) {
        // Wrap content in container
        const wrapper = document.createElement('div');
        wrapper.className = 'loaded-content';
        wrapper.innerHTML = html;

        // Clear and append
        element.innerHTML = '';
        element.appendChild(wrapper);

        // Initialize any scripts or components in loaded content
        this.initializeLoadedContent(element);

        // Trigger event
        this.dispatchContentLoadedEvent(element);
    }

    /**
     * Initialize components in loaded content
     * @param {HTMLElement} element - Container element
     */
    initializeLoadedContent(element) {
        // Handle lazy-loaded images
        const images = element.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });

        // Add animation classes
        const animatedElements = element.querySelectorAll('[data-animate]');
        animatedElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate-in');
            }, index * CONFIG.animations.slideDelay);
        });
    }

    /**
     * Cache content
     * @param {string} tabName - Tab name
     * @param {string} content - HTML content
     */
    cacheContent(tabName, content) {
        if (CONFIG.cache.enabled) {
            this.cache.set(tabName, {
                content: content,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Handle loading errors
     * @param {HTMLElement} element - Target element
     * @param {Error} error - Error object
     */
    handleError(element, error) {
        console.error('Content loading error:', error);
        
        const message = error.message || CONFIG.messages.loadError;
        Utils.showError(element, message);
    }

    /**
     * Dispatch content loaded event
     * @param {HTMLElement} element - Container element
     */
    dispatchContentLoadedEvent(element) {
        const event = new CustomEvent('contentLoaded', {
            detail: { element: element }
        });
        document.dispatchEvent(event);
    }

    /**
     * Clear cache
     * @param {string} tabName - Optional tab name to clear specific cache
     */
    clearCache(tabName = null) {
        if (tabName) {
            this.cache.delete(tabName);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Preload content for better UX
     * @param {Array<string>} tabNames - Array of tab names to preload
     */
    async preloadContent(tabNames) {
        const promises = tabNames.map(tabName => {
            if (tabName !== 'home' && !this.cache.has(tabName)) {
                return this.fetchContent(tabName)
                    .then(html => this.cacheContent(tabName, html))
                    .catch(err => console.warn(`Preload failed for ${tabName}:`, err));
            }
            return Promise.resolve();
        });

        return Promise.all(promises);
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Make ContentLoader globally available
window.ContentLoader = ContentLoader;