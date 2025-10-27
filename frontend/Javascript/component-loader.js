/**
 * Component Loader Utility
 * Loads HTML components into elements with data-component attribute
 */
class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
    }

    /**
     * Load a component into the specified element
     * @param {string} componentPath - Path to the component file
     * @param {string} targetSelector - CSS selector for the target element
     */
    async loadComponent(componentPath, targetSelector) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${response.status}`);
            }
            
            const html = await response.text();
            const targetElement = document.querySelector(targetSelector);
            
            if (targetElement) {
                targetElement.innerHTML = html;
                this.loadedComponents.add(componentPath);
                console.log(`Component loaded: ${componentPath}`);
                
                // Reinitialize event listeners after component is loaded
                this.reinitializeEventListeners();
            } else {
                console.error(`Target element not found: ${targetSelector}`);
            }
        } catch (error) {
            console.error(`Error loading component ${componentPath}:`, error);
        }
    }

    /**
     * Reinitialize event listeners for dynamically loaded components
     */
    reinitializeEventListeners() {
        // Re-setup login button listeners
        if (typeof setupLoginButtonListeners === 'function') {
            setupLoginButtonListeners();
        }
        
        // Re-setup list property button listener
        if (typeof setupListPropertyButton === 'function') {
            setupListPropertyButton();
        }
        
        // Re-setup form handlers
        this.setupFormHandlers();
        
        // Re-setup modal toggle handlers
        this.setupModalToggleHandlers();
        
        // Re-setup hamburger menu handlers
        this.setupHamburgerHandlers();
        
        // Re-setup profile dropdown handlers
        this.setupProfileDropdownHandlers();
        
        // Also call global setupProfileDropdown if available
        if (typeof setupProfileDropdown === 'function') {
            setTimeout(() => setupProfileDropdown(), 50);
        }
        
        // Check authentication state and update UI
        if (typeof apiService !== 'undefined' && apiService.isAuthenticated()) {
            if (typeof updateUIForLoggedInUser === 'function') {
                updateUIForLoggedInUser();
            }
        }
    }

    /**
     * Setup form event handlers
     */
    setupFormHandlers() {
        // Signup form
        const signupForm = document.querySelector('.signup-modal form');
        if (signupForm) {
            signupForm.removeEventListener('submit', this.handleSignup);
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (typeof handleSignup === 'function') {
                    handleSignup(e);
                }
            });
        }

        // Login form
        const loginForm = document.querySelector('.login-modal form');
        if (loginForm) {
            loginForm.removeEventListener('submit', this.handleLogin);
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (typeof handleLogin === 'function') {
                    handleLogin(e);
                }
            });
        }
    }

    /**
     * Setup modal toggle handlers
     */
    setupModalToggleHandlers() {
        // Switch from login → signup
        const loginToSignupLink = document.querySelector('.login-modal .signup-link a');
        if (loginToSignupLink) {
            loginToSignupLink.removeEventListener('click', this.toggleToSignup);
            loginToSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleModals('loginModal', 'signupModal');
            });
        }

        // Switch from signup → login
        const signupToLoginLink = document.getElementById('showLogin');
        if (signupToLoginLink) {
            signupToLoginLink.removeEventListener('click', this.toggleToLogin);
            signupToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleModals('signupModal', 'loginModal');
            });
        }
    }

    /**
     * Setup hamburger menu handlers
     */
    setupHamburgerHandlers() {
        // Close hamburger menu when clicking outside
        document.removeEventListener('click', this.handleOutsideClick);
        document.addEventListener('click', (e) => {
            const burgerMenu = document.querySelector('.burger-menu');
            const burgerBtn = document.querySelector('.burger-btn');
            const burgerToggle = document.getElementById('burger-toggle');

            if (burgerMenu && burgerToggle && burgerToggle.checked && 
                !burgerMenu.contains(e.target) && !e.target.closest('.hamburger')) {
                burgerToggle.checked = false;
            }
        });
    }

    /**
     * Setup profile dropdown handlers
     */
    setupProfileDropdownHandlers() {
        const profileIcon = document.getElementById('profileIcon');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileIcon && profileDropdown) {
            // Remove any existing event listeners by cloning the element
            const newProfileIcon = profileIcon.cloneNode(true);
            profileIcon.parentNode.replaceChild(newProfileIcon, profileIcon);
            
            // Add click event to toggle dropdown
            newProfileIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
                console.log('Profile icon clicked, dropdown active:', profileDropdown.classList.contains('active'));
            });

            // Close dropdown if clicking outside
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!profileDropdown.contains(e.target) && !newProfileIcon.contains(e.target)) {
                        profileDropdown.classList.remove('active');
                    }
                }, { once: false });
            }, 100);
        } else {
            console.warn('Profile icon or dropdown not found in DOM');
        }
    }

    /**
     * Toggle between modals
     */
    toggleModals(hideId, showId) {
        document.getElementById(hideId)?.classList.remove('active');
        document.getElementById(showId)?.classList.add('active');
    }

    /**
     * Load all components marked with data-component attribute
     */
    async loadAllComponents() {
        const componentElements = document.querySelectorAll('[data-component]');
        
        for (const element of componentElements) {
            const componentPath = element.getAttribute('data-component');
            const targetSelector = `#${element.id}`;
            
            if (!this.loadedComponents.has(componentPath)) {
                await this.loadComponent(componentPath, targetSelector);
            }
        }
    }

    /**
     * Initialize component loading when DOM is ready
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Add a small delay to ensure main.js is loaded
                setTimeout(() => {
                    this.loadAllComponents();
                }, 100);
            });
        } else {
            // Add a small delay to ensure main.js is loaded
            setTimeout(() => {
                this.loadAllComponents();
            }, 100);
        }
    }
}

// Create global instance
const componentLoader = new ComponentLoader();

// Auto-initialize
componentLoader.init();

// Export for manual use
window.ComponentLoader = ComponentLoader;
window.componentLoader = componentLoader;
