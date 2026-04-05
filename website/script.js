// Smooth scrolling cho navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and update header
    if (AuthManager.isLoggedIn()) {
        setTimeout(() => {
            AuthManager.updateHeaderForLoggedInUser();
        }, 100);
    }
    
    // Smooth scrolling cho các liên kết trong menu
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Active navigation highlight
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('nav a[href^="#"]');
    
    function highlightNavigation() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    
    // CTA button click handler
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            // Scroll to services section
            const servicesSection = document.querySelector('#services');
            if (servicesSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = servicesSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe service cards for animation
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Mobile menu toggle (for future responsive menu)
    function createMobileMenu() {
        const nav = document.querySelector('nav');
        const navMenu = document.querySelector('.nav-menu');
        
        // Create hamburger button
        const hamburger = document.createElement('button');
        hamburger.classList.add('hamburger');
        hamburger.innerHTML = '☰';
        hamburger.style.display = 'none';
        hamburger.style.background = 'none';
        hamburger.style.border = 'none';
        hamburger.style.color = 'white';
        hamburger.style.fontSize = '1.5rem';
        hamburger.style.cursor = 'pointer';
        
        nav.appendChild(hamburger);
        
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('mobile-active');
        });
        
        // Show hamburger on mobile
        function checkScreenSize() {
            if (window.innerWidth <= 768) {
                hamburger.style.display = 'block';
                navMenu.classList.add('mobile-menu');
            } else {
                hamburger.style.display = 'none';
                navMenu.classList.remove('mobile-menu', 'mobile-active');
            }
        }
        
        window.addEventListener('resize', checkScreenSize);
        checkScreenSize();
    }
    
    createMobileMenu();
});

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Form validation (if forms are added later)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Authentication and user management
const AuthManager = {
    getCurrentUser: function() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    },
    
    isLoggedIn: function() {
        return this.getCurrentUser() !== null;
    },
    
    logout: function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('demoInfoShown');
        // Reload page to update header
        window.location.reload();
    },
    
    updateHeaderForLoggedInUser: function() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // Find auth items in navigation
        const authItems = document.querySelectorAll('.auth-item');
        if (authItems.length === 0) return;
        
        // Create user dropdown
        const userDropdown = document.createElement('li');
        userDropdown.className = 'nav-item user-dropdown';
        userDropdown.innerHTML = `
            <a href="#" class="nav-link user-menu-toggle">
                <i class="fas fa-user-circle"></i>
                <span>${user.name}</span>
                <i class="fas fa-chevron-down"></i>
            </a>
            <div class="user-dropdown-menu">
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                    <div class="user-role">${user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="../dashboard/dashboard.html" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i>
                    Dashboard
                </a>
                <a href="#" class="dropdown-item">
                    <i class="fas fa-user"></i>
                    Thông tin cá nhân
                </a>
                <a href="#" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    Cài đặt
                </a>
                ${user.role === 'admin' ? `
                <a href="#" class="dropdown-item">
                    <i class="fas fa-shield-alt"></i>
                    Quản lý
                </a>
                ` : ''}
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    Đăng xuất
                </a>
            </div>
        `;
        
        // Remove existing auth items and add user dropdown
        authItems.forEach(item => item.remove());
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) {
            navMenu.appendChild(userDropdown);
        }
        
        // Add event listeners
        this.setupUserDropdown();
    },
    
    setupUserDropdown: function() {
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        const userDropdownMenu = document.querySelector('.user-dropdown-menu');
        const logoutBtn = document.querySelector('.logout-btn');
        
        if (userMenuToggle && userDropdownMenu) {
            userMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                userDropdownMenu.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!userMenuToggle.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                    userDropdownMenu.classList.remove('show');
                }
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                    AuthManager.logout();
                }
            });
        }
    }
};

// Initialize auth manager on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update header based on login status
    AuthManager.updateHeaderForLoggedInUser();
});


// ========================================
// ENHANCED FEATURES - NEW DESIGN
// ========================================

// Header scroll effect
const header = document.querySelector('.main-header');
if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link on scroll
function activateNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', activateNavLink);

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Make showNotification available globally
window.showNotification = showNotification;

// Scroll animations for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
setTimeout(() => {
    document.querySelectorAll('.schedule-card, .coach-card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}, 1500);

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent);
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

setTimeout(() => {
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
}, 1500);

// Console welcome message
console.log('%c🥋 CLB Võ Cổ Truyền HUTECH', 'color: #c41e3a; font-size: 20px; font-weight: bold;');
console.log('%cWebsite đã được nâng cấp với thiết kế mới!', 'color: #666; font-size: 14px;');


// ========================================
// ENHANCED SMOOTH SCROLL WITH ANIMATION
// ========================================

// Improved smooth scroll with easing
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Smooth scroll with offset
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Update active link
            updateActiveLink(href);
        }
    });
});

// Update active link on scroll
function updateActiveLink(targetId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

// Auto-update active link on scroll
let scrollTimeout;
window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                updateActiveLink('#' + sectionId);
            }
        });
    }, 100);
});

console.log('%c✨ Smooth scroll với hiệu ứng đã được kích hoạt!', 'color: #ffd700; font-size: 14px; font-weight: bold;');

// ========================================
// IMAGE CAROUSEL FOR ABOUT SECTION
// ========================================

// Image Carousel for About Section
class ImageCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.totalSlides = this.slides.length;
        this.autoPlayInterval = null;
        this.isPlaying = true;
        
        this.init();
    }
    
    init() {
        if (this.slides.length === 0) return;
        
        // Set up indicators click events
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
                this.resetAutoPlay();
            });
        });
        
        // Set up keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
                this.resetAutoPlay();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
                this.resetAutoPlay();
            }
        });
        
        // Pause on hover
        const carousel = document.querySelector('.image-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => {
                this.pauseAutoPlay();
            });
            
            carousel.addEventListener('mouseleave', () => {
                this.resumeAutoPlay();
            });
        }
        
        // Start autoplay
        this.startAutoPlay();
        
        // Observe carousel for animation trigger
        this.observeCarousel();
    }
    
    goToSlide(index) {
        // Remove active classes
        this.slides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');
        
        // Add transition classes
        if (index > this.currentSlide) {
            this.slides[this.currentSlide].classList.add('prev');
        } else if (index < this.currentSlide) {
            this.slides[this.currentSlide].classList.add('next');
        }
        
        // Update current slide
        this.currentSlide = index;
        
        // Add active classes
        this.slides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');
        
        // Clean up transition classes after animation
        setTimeout(() => {
            this.slides.forEach(slide => {
                slide.classList.remove('prev', 'next');
            });
        }, 800);
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prevIndex);
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (this.isPlaying) {
                this.nextSlide();
            }
        }, 4000); // Change slide every 4 seconds
    }
    
    pauseAutoPlay() {
        this.isPlaying = false;
    }
    
    resumeAutoPlay() {
        this.isPlaying = true;
    }
    
    resetAutoPlay() {
        clearInterval(this.autoPlayInterval);
        this.startAutoPlay();
    }
    
    observeCarousel() {
        const carousel = document.querySelector('.image-carousel');
        if (!carousel) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Trigger entrance animation
                    carousel.style.opacity = '1';
                    carousel.style.transform = 'translateY(0)';
                    
                    // Start carousel animation
                    setTimeout(() => {
                        this.startEntranceAnimation();
                    }, 500);
                }
            });
        }, { threshold: 0.3 });
        
        // Set initial state
        carousel.style.opacity = '0';
        carousel.style.transform = 'translateY(50px)';
        carousel.style.transition = 'all 0.8s ease';
        
        observer.observe(carousel);
    }
    
    startEntranceAnimation() {
        // Add special entrance animation for first view
        const activeSlide = this.slides[this.currentSlide];
        const imageItem = activeSlide.querySelector('.image-item');
        
        if (imageItem) {
            imageItem.style.animation = 'none';
            setTimeout(() => {
                imageItem.style.animation = 'slideInContent 0.8s ease forwards';
            }, 100);
        }
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all components to load
    setTimeout(() => {
        new ImageCarousel();
    }, 1000);
});

// Enhanced stats animation for about section
const aboutStatsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-box .stat-number');
            statNumbers.forEach((stat, index) => {
                setTimeout(() => {
                    const target = parseInt(stat.textContent);
                    animateCounter(stat, target, 1500);
                    
                    // Add bounce animation to stat box
                    const statBox = stat.closest('.stat-box');
                    statBox.style.animation = 'bounceIn 0.6s ease forwards';
                }, index * 200);
            });
            aboutStatsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observe about stats
setTimeout(() => {
    const aboutStats = document.querySelector('.about-stats');
    if (aboutStats) {
        aboutStatsObserver.observe(aboutStats);
    }
}, 1500);

// Add bounce animation keyframes
const bounceStyle = document.createElement('style');
bounceStyle.textContent = `
    @keyframes bounceIn {
        0% {
            opacity: 0;
            transform: scale(0.3) translateY(50px);
        }
        50% {
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
        }
        70% {
            transform: scale(0.9) translateY(0);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
`;
document.head.appendChild(bounceStyle);

console.log('%c🎠 Image Carousel đã được kích hoạt cho phần About!', 'color: #c41e3a; font-size: 14px; font-weight: bold;');