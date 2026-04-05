// Enhanced Menu JavaScript Functionality

class MenuManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollIndicator();
        this.setupKeyboardNavigation();
        this.setupTouchSupport();
    }

    setupEventListeners() {
        // Existing mobile menu toggle
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Enhanced dropdown functionality
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            this.setupDropdown(dropdown);
        });

        // Close menus on outside click
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Close menus on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllMenus();
            }
        });
    }

    setupDropdown(dropdown) {
        const dropdownLink = dropdown.querySelector('.nav-link');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        if (!dropdownLink || !dropdownMenu) return;

        dropdownLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown').forEach(item => {
                if (item !== dropdown) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking on submenu items
        dropdown.querySelectorAll('.dropdown-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('active');
                
                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Prevent body scroll when mobile menu is open
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        }
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllMenus() {
        // Close dropdowns
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        
        // Close mobile menu
        this.closeMobileMenu();
    }

    handleOutsideClick(e) {
        // Close dropdowns if clicking outside
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
        
        // Close mobile menu if clicking outside
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle && 
            !navMenu.contains(e.target) && 
            !navToggle.contains(e.target)) {
            this.closeMobileMenu();
        }
    }

    setupScrollIndicator() {
        const header = document.querySelector('.main-header');
        let ticking = false;

        const updateHeader = () => {
            if (header) {
                const scrolled = window.scrollY > 100;
                header.classList.toggle('scrolled', scrolled);
            }
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        });

        // Active link highlighting
        this.setupActiveLinks();
    }

    setupActiveLinks() {
        const sections = document.querySelectorAll('section[id], div[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        const updateActiveLink = () => {
            let current = '';
            const scrollY = window.pageYOffset;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;

                if (scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateActiveLink);
                ticking = true;
            }
        });
    }

    setupKeyboardNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach((link, index) => {
            link.addEventListener('keydown', (e) => {
                let targetIndex;
                
                switch (e.key) {
                    case 'ArrowLeft':
                        targetIndex = index > 0 ? index - 1 : navLinks.length - 1;
                        break;
                    case 'ArrowRight':
                        targetIndex = index < navLinks.length - 1 ? index + 1 : 0;
                        break;
                    case 'Home':
                        targetIndex = 0;
                        break;
                    case 'End':
                        targetIndex = navLinks.length - 1;
                        break;
                    default:
                        return;
                }
                
                e.preventDefault();
                navLinks[targetIndex].focus();
            });
        });
    }

    setupTouchSupport() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            
            const deltaX = touchStartX - touchEndX;
            const deltaY = touchStartY - touchEndY;
            
            // Swipe detection for mobile menu
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                const navMenu = document.getElementById('nav-menu');
                
                if (deltaX > 50 && navMenu && navMenu.classList.contains('active')) {
                    // Swipe left to close menu
                    this.closeMobileMenu();
                }
            }
        });
    }

    // Smooth scrolling for anchor links
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const headerHeight = document.querySelector('.main-header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Initialize menu manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
});

// Utility functions
const MenuUtils = {
    // Add loading state to menu items
    addLoadingState(element) {
        element.classList.add('loading');
        element.style.opacity = '0.7';
        element.style.pointerEvents = 'none';
    },

    // Remove loading state
    removeLoadingState(element) {
        element.classList.remove('loading');
        element.style.opacity = '';
        element.style.pointerEvents = '';
    },

    // Animate menu item
    animateMenuItem(element, animation = 'fadeInUp') {
        element.style.animation = `${animation} 0.3s ease-out`;
        element.addEventListener('animationend', () => {
            element.style.animation = '';
        }, { once: true });
    },

    // Get current section
    getCurrentSection() {
        const sections = document.querySelectorAll('section[id], div[id]');
        let current = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                current = section.getAttribute('id');
            }
        });
        
        return current;
    }
};

// Export for use in other scripts
window.MenuManager = MenuManager;
window.MenuUtils = MenuUtils;
