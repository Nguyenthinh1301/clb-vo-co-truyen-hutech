// Loading Animation
window.addEventListener('load', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    setTimeout(() => {
        loadingOverlay.classList.add('hidden');
    }, 1000);
});

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', function() {
    navMenu.classList.toggle('active');
    
    // Animate hamburger
    const bars = navToggle.querySelectorAll('.bar');
    bars[0].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(-5px, 6px)' : '';
    bars[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
    bars[2].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(-5px, -6px)' : '';
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        navMenu.classList.remove('active');
        const bars = navToggle.querySelectorAll('.bar');
        bars[0].style.transform = '';
        bars[1].style.opacity = '1';
        bars[2].style.transform = '';
    });
});

// Header scroll effect
const header = document.getElementById('main-header');
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

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
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
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function activateNavLink() {
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

// Contact Form Handling
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
    };
    
    // Validate
    if (!formData.name || !formData.email || !formData.phone) {
        showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showNotification('Email không hợp lệ!', 'error');
        return;
    }
    
    // Phone validation
    const phoneRegex = /^[0-9]{10,11}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        showNotification('Số điện thoại không hợp lệ!', 'error');
        return;
    }
    
    // Simulate sending (in real app, send to backend)
    showNotification('Đang gửi...', 'info');
    
    setTimeout(() => {
        console.log('Form data:', formData);
        showNotification('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.', 'success');
        contactForm.reset();
    }, 1500);
});

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
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 20px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .notification-success {
            border-left: 4px solid #28a745;
        }
        
        .notification-error {
            border-left: 4px solid #dc3545;
        }
        
        .notification-info {
            border-left: 4px solid #17a2b8;
        }
        
        .notification i {
            font-size: 24px;
        }
        
        .notification-success i {
            color: #28a745;
        }
        
        .notification-error i {
            color: #dc3545;
        }
        
        .notification-info i {
            color: #17a2b8;
        }
    `;
    
    if (!document.querySelector('style[data-notification]')) {
        style.setAttribute('data-notification', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Scroll animations
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
document.querySelectorAll('.schedule-card, .coach-card, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + '+';
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

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Demo: Simulate member login status
function checkMemberStatus() {
    // Check if user is logged in (demo purposes)
    const isLoggedIn = localStorage.getItem('demoMemberLoggedIn') === 'true';
    
    if (isLoggedIn) {
        updateHeaderForMember();
    }
}

function updateHeaderForMember() {
    const dropdown = document.querySelector('.dropdown .nav-link');
    if (dropdown) {
        dropdown.innerHTML = 'Tài khoản <i class="fas fa-user-circle"></i>';
    }
    
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.innerHTML = `
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#profile">Hồ sơ</a></li>
            <li><a href="#schedule-member">Lịch tập của tôi</a></li>
            <li><a href="#" onclick="logout()">Đăng xuất</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('demoMemberLoggedIn');
    showNotification('Đã đăng xuất thành công!', 'success');
    setTimeout(() => location.reload(), 1000);
}

// Check member status on load
checkMemberStatus();

// Console welcome message
console.log('%c🥋 CLB Võ Cổ Truyền HUTECH - Demo Website', 'color: #c41e3a; font-size: 20px; font-weight: bold;');
console.log('%cWebsite demo với đầy đủ tính năng cho phần công khai', 'color: #666; font-size: 14px;');
console.log('%cĐể test chức năng thành viên, thêm localStorage.setItem("demoMemberLoggedIn", "true")', 'color: #17a2b8; font-size: 12px;');

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
    new ImageCarousel();
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
const aboutStats = document.querySelector('.about-stats');
if (aboutStats) {
    aboutStatsObserver.observe(aboutStats);
}

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
