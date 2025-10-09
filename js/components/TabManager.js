/**
 * TabManager Component
 * Handles tab navigation and content switching
 */

class TabManager {
    constructor(tabSelector = '.tab-btn', contentSelector = '.tab-content') {
        this.tabButtons = document.querySelectorAll(tabSelector);
        this.tabContents = document.querySelectorAll(contentSelector);
        this.currentTab = null;
        this.history = [];
        
        this.init();
    }

    /**
     * Initialize tab manager
     */
    init() {
        if (this.tabButtons.length === 0) {
            console.warn('No tab buttons found');
            return;
        }

        // Add click listeners to all tab buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTabClick(e));
            
            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleTabClick(e);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab, false);
            }
        });

        // Set initial tab from URL hash or first tab
        const initialTab = this.getTabFromURL() || this.getFirstTabName();
        this.switchTab(initialTab, false);
    }

    /**
     * Handle tab button click
     * @param {Event} event - Click event
     */
    handleTabClick(event) {
        const button = event.currentTarget;
        const tabName = button.getAttribute('data-tab');
        
        if (tabName && tabName !== this.currentTab) {
            this.switchTab(tabName);
        }
    }

    /**
     * Switch to a different tab
     * @param {string} tabName - Name of tab to switch to
     * @param {boolean} updateHistory - Whether to update browser history
     */
    switchTab(tabName, updateHistory = true) {
        // Validate tab exists
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (!targetContent) {
            console.error(`Tab content not found: ${tabName}`);
            return;
        }

        // Deactivate all tabs
        this.tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Activate selected tab
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-selected', 'true');
        }

        targetContent.classList.add('active');

        // Update history
        if (updateHistory) {
            this.updateHistory(tabName);
        }

        // Store current tab
        this.currentTab = tabName;

        // Trigger custom event
        this.dispatchTabChangeEvent(tabName);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile menu if open
        this.closeMobileMenu();
    }

    /**
     * Get tab name from URL hash
     * @returns {string|null} Tab name or null
     */
    getTabFromURL() {
        const hash = window.location.hash.substring(1);
        return hash || null;
    }

    /**
     * Get first tab name
     * @returns {string} First tab name
     */
    getFirstTabName() {
        const firstButton = this.tabButtons[0];
        return firstButton ? firstButton.getAttribute('data-tab') : 'home';
    }

    /**
     * Update browser history
     * @param {string} tabName - Tab name
     */
    updateHistory(tabName) {
        const state = { tab: tabName };
        const url = `#${tabName}`;
        
        history.pushState(state, '', url);
        this.history.push(tabName);
    }

    /**
     * Dispatch custom tab change event
     * @param {string} tabName - Tab name
     */
    dispatchTabChangeEvent(tabName) {
        const event = new CustomEvent('tabChange', {
            detail: { 
                tab: tabName,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        const navTabs = document.querySelector('.nav-tabs');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navTabs) {
            navTabs.classList.remove('active');
        }
        
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Navigate to specific tab programmatically
     * @param {string} tabName - Tab name
     */
    navigateTo(tabName) {
        this.switchTab(tabName);
    }

    /**
     * Get current active tab
     * @returns {string} Current tab name
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Get tab history
     * @returns {Array} Array of visited tabs
     */
    getHistory() {
        return [...this.history];
    }
}

// Make TabManager globally available
window.TabManager = TabManager;