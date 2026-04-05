/**
 * Main Application Loader for CLB Võ Cổ Truyền HUTECH Website
 * This file loads and initializes all necessary modules
 */

// Application initialization
class AppInitializer {
    constructor() {
        this.modules = [];
        this.isInitialized = false;
        this.initStartTime = Date.now();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing CLB Võ Cổ Truyền HUTECH Application...');
            
            // Load configuration
            await this.loadConfig();
            
            // Initialize database
            await this.initDatabase();
            
            // Initialize authentication
            await this.initAuth();
            
            // Setup UI components
            await this.setupUI();
            
            // Load user data if available
            await this.loadUserSession();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            
            const initTime = Date.now() - this.initStartTime;
            console.log(`✅ Application initialized successfully in ${initTime}ms`);
            
            // Trigger initialization complete event
            this.triggerEvent('app:initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Load configuration
     */
    async loadConfig() {
        console.log('📋 Loading configuration...');
        
        // Configuration is already loaded via config.js
        if (typeof CONFIG === 'undefined') {
            throw new Error('Configuration not loaded');
        }
        
        console.log('✅ Configuration loaded');
    }

    /**
     * Initialize database
     */
    async initDatabase() {
        console.log('🗄️ Initializing database...');
        
        if (typeof DB === 'undefined') {
            throw new Error('Database manager not loaded');
        }
        
        await DB.init();
        console.log('✅ Database initialized');
    }

    /**
     * Initialize authentication
     */
    async initAuth() {
        console.log('🔐 Initializing authentication...');
        
        if (typeof Auth === 'undefined') {
            throw new Error('Auth manager not loaded');
        }
        
        await Auth.init();
        console.log('✅ Authentication initialized');
    }

    /**
     * Setup UI components
     */
    async setupUI() {
        console.log('🎨 Setting up UI components...');
        
        // Setup mobile navigation
        this.setupMobileNavigation();
        
        // Setup scroll effects
        this.setupScrollEffects();
        
        // Setup form enhancements
        this.setupFormEnhancements();
        
        // Setup tooltips and modals
        this.setupTooltips();
        
        console.log('✅ UI components ready');
    }

    /**
     * Load user session
     */
    async loadUserSession() {
        console.log('👤 Loading user session...');
        
        const currentUser = Utils.Storage.local.get(CONFIG.STORAGE_KEYS.CURRENT_USER);
        if (currentUser) {
            console.log('✅ User session loaded:', currentUser.fullName);
        } else {
            console.log('ℹ️ No active user session');
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        console.log('👂 Setting up event listeners...');
        
        // Page load events
        window.addEventListener('load', () => {
            this.triggerEvent('app:loaded');
        });
        
        // Before unload
        window.addEventListener('beforeunload', () => {
            this.triggerEvent('app:beforeunload');
        });
        
        // Online/offline status
        window.addEventListener('online', () => {
            Utils.UI.showMessage('Kết nối internet đã được khôi phục', 'success');
        });
        
        window.addEventListener('offline', () => {
            Utils.UI.showMessage('Mất kết nối internet', 'warning');
        });
        
        // Error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
        
        console.log('✅ Event listeners ready');
    }

    /**
     * Setup mobile navigation
     */
    setupMobileNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            });
        }
    }

    /**
     * Setup scroll effects
     */
    setupScrollEffects() {
        let lastScrollTop = 0;
        const header = document.querySelector('.main-header');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Header scroll effect
            if (header) {
                if (scrollTop > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                
                // Hide header on scroll down, show on scroll up
                if (scrollTop > lastScrollTop && scrollTop > 200) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollTop = scrollTop;
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Setup form enhancements
     */
    setupFormEnhancements() {
        // Auto-save form data
        const forms = document.querySelectorAll('form[data-autosave]');
        forms.forEach(form => {
            const formId = form.id || 'form_' + Math.random().toString(36).substr(2, 9);
            
            // Load saved data
            const savedData = Utils.Storage.local.get(`autosave_${formId}`);
            if (savedData) {
                Object.keys(savedData).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = savedData[key];
                    }
                });
            }
            
            // Save on change
            form.addEventListener('input', () => {
                const formData = new FormData(form);
                const data = {};
                for (const [key, value] of formData.entries()) {
                    data[key] = value;
                }
                Utils.Storage.local.set(`autosave_${formId}`, data);
            });
            
            // Clear on submit
            form.addEventListener('submit', () => {
                Utils.Storage.local.remove(`autosave_${formId}`);
            });
        });
        
        // Form validation
        const validatedForms = document.querySelectorAll('form[data-validate]');
        validatedForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    }

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            });
            
            element.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }

    /**
     * Form validation
     */
    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('[required], [data-validate]');
        
        fields.forEach(field => {
            const value = field.value.trim();
            const fieldName = field.getAttribute('name') || field.getAttribute('id');
            let fieldValid = true;
            let errorMessage = '';
            
            // Required validation
            if (field.hasAttribute('required') && !value) {
                fieldValid = false;
                errorMessage = `${fieldName} là bắt buộc`;
            }
            
            // Type-specific validation
            if (value && field.type) {
                switch (field.type) {
                    case 'email':
                        if (!Utils.Validation.isEmail(value)) {
                            fieldValid = false;
                            errorMessage = 'Email không hợp lệ';
                        }
                        break;
                    case 'tel':
                        if (!Utils.Validation.isPhone(value)) {
                            fieldValid = false;
                            errorMessage = 'Số điện thoại không hợp lệ';
                        }
                        break;
                    case 'password':
                        if (!Utils.Validation.isStrongPassword(value)) {
                            fieldValid = false;
                            errorMessage = 'Mật khẩu không đủ mạnh';
                        }
                        break;
                }
            }
            
            // Custom validation
            const customValidation = field.getAttribute('data-validate');
            if (customValidation && value) {
                switch (customValidation) {
                    case 'username':
                        if (!Utils.Validation.isUsername(value)) {
                            fieldValid = false;
                            errorMessage = 'Tên đăng nhập không hợp lệ';
                        }
                        break;
                }
            }
            
            // Show/hide error
            this.showFieldError(field, fieldValid ? '' : errorMessage);
            
            if (!fieldValid) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error class
        if (message) {
            field.classList.add('error');
            
            const errorDiv = Utils.DOM.createElement('div', {
                className: 'field-error',
                innerHTML: message
            });
            
            field.parentNode.appendChild(errorDiv);
        } else {
            field.classList.remove('error');
        }
    }

    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        const errorMessage = `
            <div class="init-error">
                <h2>Lỗi khởi tạo ứng dụng</h2>
                <p>Đã xảy ra lỗi khi khởi tạo ứng dụng. Vui lòng thử lại.</p>
                <button onclick="window.location.reload()">Tải lại trang</button>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }

    /**
     * Handle global errors
     */
    handleGlobalError(error) {
        // Log error for debugging
        console.error('Global error handled:', error);
        
        // Don't show error messages in production for security
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            Utils.UI.showMessage(`Lỗi: ${error.message}`, 'error');
        }
    }

    /**
     * Trigger custom events
     */
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Public methods for external use
     */
    
    // Check if app is initialized
    isReady() {
        return this.isInitialized;
    }
    
    // Get app info
    getInfo() {
        return {
            name: CONFIG.APP.NAME,
            version: CONFIG.APP.VERSION,
            initialized: this.isInitialized,
            modules: this.modules
        };
    }
    
    // Force reload
    reload() {
        window.location.reload();
    }
}

// Create global app instance
const App = new AppInitializer();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, AppInitializer };
} else {
    window.App = App;
    window.AppInitializer = AppInitializer;
}

console.log('🎯 Application loader ready');
