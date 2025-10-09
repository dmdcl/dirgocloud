/**
 * Main Application
 * Initializes all components and handles app lifecycle
 */

class App {
    constructor() {
        this.tabManager = null;
        this.contentLoader = null;
        this.mobileMenu = null;
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize components
            this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Preload content for better UX
            this.preloadContent();

            // Mark as initialized
            this.initialized = true;

            console.log('✅ Dirgo Cloud App initialized successfully');

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        // Initialize Tab Manager
        this.tabManager = new TabManager();

        // Initialize Content Loader
        this.contentLoader = new ContentLoader();

        // Initialize Mobile Menu
        this.mobileMenu = new MobileMenu();

        console.log('Components initialized:', {
            tabManager: !!this.tabManager,
            contentLoader: !!this.contentLoader,
            mobileMenu: !!this.mobileMenu
        });
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Listen for tab changes and load content
        document.addEventListener('tabChange', (e) => {
            const tabName = e.detail.tab;
            this.handleTabChange(tabName);
        });

        // Listen for content loaded events
        document.addEventListener('contentLoaded', (e) => {
            console.log('Content loaded for element:', e.detail.element.id);
        });

        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle online/offline status
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
        });

        window.addEventListener('offline', () => {
            console.warn('📡 Connection lost');
        });
    }

    /**
     * Handle tab change
     * @param {string} tabName - Name of the tab
     */
    async handleTabChange(tabName) {
        try {
            // Load content if not home tab
            if (tabName !== 'home') {
                await this.contentLoader.loadContent(tabName);
            }
        } catch (error) {
            console.error('Error loading content for tab:', tabName, error);
        }
    }

    /**
     * Preload content for better UX
     */
    async preloadContent() {
        // Preload the most commonly accessed tabs
        const tabsToPreload = ['about', 'projects'];
        
        try {
            await this.contentLoader.preloadContent(tabsToPreload);
            console.log('📦 Content preloaded:', tabsToPreload);
        } catch (error) {
            console.warn('Preload warning:', error);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const breakpoint = Utils.getBreakpoint();
        console.log('Current breakpoint:', breakpoint);

        // Add breakpoint class to body for CSS targeting
        document.body.className = document.body.className
            .replace(/\bbreakpoint-\w+\b/g, '');
        document.body.classList.add(`breakpoint-${breakpoint}`);
    }

    /**
     * Handle initialization errors
     * @param {Error} error - Error object
     */
    handleInitError(error) {
        const container = document.querySelector('.container');
        if (container) {
            Utils.showError(container, 'Error al inicializar la aplicación. Por favor, recarga la página.');
        }
    }

    /**
     * Get app instance info
     * @returns {Object} App information
     */
    getInfo() {
        return {
            initialized: this.initialized,
            currentTab: this.tabManager?.getCurrentTab(),
            cacheStats: this.contentLoader?.getCacheStats(),
            breakpoint: Utils.getBreakpoint()
        };
    }

    /**
     * Reload current tab content
     */
    async reloadCurrentTab() {
        const currentTab = this.tabManager.getCurrentTab();
        if (currentTab && currentTab !== 'home') {
            this.contentLoader.clearCache(currentTab);
            await this.contentLoader.loadContent(currentTab);
        }
    }

    /**
     * Navigate to specific tab
     * @param {string} tabName - Tab name
     */
    navigateTo(tabName) {
        this.tabManager.navigateTo(tabName);
    }
}

// Create and initialize app instance
const app = new App();
app.init();

// Make app globally available for debugging
window.app = app;