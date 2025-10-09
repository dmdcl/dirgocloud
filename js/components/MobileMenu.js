/**
 * MobileMenu Component
 * Handles mobile menu toggle and behavior
 */

class MobileMenu {
    constructor(toggleSelector = '.mobile-menu-toggle', menuSelector = '.nav-tabs') {
        this.toggleButton = document.querySelector(toggleSelector);
        this.menu = document.querySelector(menuSelector);
        this.isOpen = false;
        
        this.init();
    }

    /**
     * Initialize mobile menu
     */
    init() {
        if (!this.toggleButton || !this.menu) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Add click listener to toggle button
        this.toggleButton.addEventListener('click', () => this.toggle());

        // Close menu when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close menu on window resize if it becomes desktop size
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > CONFIG.breakpoints.tablet && this.isOpen) {
                this.close();
            }
        }, 250));

        // Close menu when tab changes
        document.addEventListener('tabChange', () => {
            if (this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Toggle menu open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open menu
     */
    open() {
        this.menu.classList.add('active');
        this.toggleButton.setAttribute('aria-expanded', 'true');
        this.isOpen = true;
        
        // Prevent body scroll on mobile
        document.body.style.overflow = 'hidden';
        
        // Focus first menu item
        const firstMenuItem = this.menu.querySelector('.tab-btn');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }

        // Dispatch event
        this.dispatchMenuEvent('open');
    }

    /**
     * Close menu
     */
    close() {
        this.menu.classList.remove('active');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        this.toggleButton.focus();

        // Dispatch event
        this.dispatchMenuEvent('close');
    }

    /**
     * Handle clicks outside menu
     * @param {Event} event - Click event
     */
    handleOutsideClick(event) {
        if (!this.isOpen) return;

        const isClickInside = this.menu.contains(event.target) || 
                             this.toggleButton.contains(event.target);

        if (!isClickInside) {
            this.close();
        }
    }

    /**
     * Dispatch custom menu event
     * @param {string} action - Action type (open/close)
     */
    dispatchMenuEvent(action) {
        const event = new CustomEvent('mobileMenu', {
            detail: { 
                action: action,
                isOpen: this.isOpen
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Check if menu is open
     * @returns {boolean} True if menu is open
     */
    isMenuOpen() {
        return this.isOpen;
    }
}

// Make MobileMenu globally available
window.MobileMenu = MobileMenu;