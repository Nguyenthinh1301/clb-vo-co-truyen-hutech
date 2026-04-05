// Fixed version of script.js - No image duplication

// Prevent multiple instances
let carouselInstance = null;
let loadedComponents = new Set();
let loadingComponents = new Set();
let galleryInitialized = false;

// Fixed Image Carousel Class
class ImageCarousel {
    constructor(container) {
        this.container = container;
        this.slides = container.querySelectorAll('.carousel-slide');
        this.totalSlides = this.slides.length;
        this.currentSlide = 0;
        this.autoPlayInterval = null;
        this.isPlaying = true;
        
        // Clear any existing intervals first
        this.clearAllIntervals();
        this.init();
    }
    
    clearAllIntervals() {
        // Clear any existing intervals to prevent duplication
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    init() {
        if (this.totalSlides === 0) return;
        
        this.createIndicators();
        this.bindEvents();
        this.startAutoPlay();
        this.observeCarousel();
    }
    
    createIndicators() {
        const indicatorsContainer = this.container.querySelector('.carousel-indicators');
        if (!indicatorsContainer) return;
        
        // Clear existing indicators to prevent duplication
        indicatorsContainer.innerHTML = '';
        
        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicatorsContainer.appendChild(indicator);
        }
    }
    
    bindEvents() {
        const prevBtn = this.container.querySelector('.carousel-prev');
        const nextBtn = this.container.querySelector('.carousel-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prevSlide();
                this.resetAutoPlay();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextSlide();
                this.resetAutoPlay();
            });
        }
        
        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.resumeAutoPlay());
    }
    
    goToSlide(index) {
        if (index < 0 || index >= this.totalSlides) return;
        
        // Remove active class from all slides and indicators
        this.slides.forEach(slide => slide.classList.remove('active'));
        const indicators = this.container.querySelectorAll('.indicator');
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Add active class to current slide and indicator
        this.slides[index].classList.add('active');
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
        
        this.currentSlide = index;
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
        // Always clear existing interval first
        this.clearAllIntervals();
        
        this.autoPlayInterval = setInterval(() => {
            if (this.isPlaying && this.container) {
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
        this.clearAllIntervals();
        this.startAutoPlay();
    }
    
    observeCarousel() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.resumeAutoPlay();
                } else {
                    this.pauseAutoPlay();
                }
            });
        });
        
        observer.observe(this.container);
    }
    
    destroy() {
        // Clean up when component is destroyed
        this.clearAllIntervals();
        this.container = null;
        this.slides = null;
    }
}

// Fixed component loading function
async function loadComponent(elementId, componentPath) {
    // Prevent duplicate loading
    const key = `${elementId}:${componentPath}`;
    
    if (loadedComponents.has(key) || loadingComponents.has(key)) {
        console.log(`Component ${key} already loaded or loading`);
        return;
    }
    
    loadingComponents.add(key);
    
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        
        const element = document.getElementById(elementId);
        if (element && !element.hasAttribute('data-loaded')) {
            element.innerHTML = html;
            element.setAttribute('data-loaded', 'true');
            loadedComponents.add(key);
        }
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #999;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p>Không thể tải nội dung. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    } finally {
        loadingComponents.delete(key);
    }
}

// Fixed gallery initialization
function initGallery() {
    if (galleryInitialized) {
        console.log('Gallery already initialized');
        return;
    }
    
    const galleryContainer = document.querySelector('.gallery-grid');
    if (!galleryContainer) return;
    
    // Clear any existing content first to prevent duplication
    const existingItems = galleryContainer.querySelectorAll('.gallery-item');
    if (existingItems.length > 9) { // Expected number of items
        console.log('Removing duplicate gallery items');
        existingItems.forEach((item, index) => {
            if (index >= 9) {
                item.remove();
            }
        });
    }
    
    // Mark as initialized
    galleryContainer.setAttribute('data-gallery-initialized', 'true');
    galleryInitialized = true;
}

// Fixed carousel initialization
function initCarousel() {
    // Destroy existing instance to prevent duplication
    if (carouselInstance) {
        carouselInstance.destroy();
        carouselInstance = null;
    }
    
    const carouselContainer = document.querySelector('.image-carousel');
    if (carouselContainer && !carouselContainer.hasAttribute('data-carousel-initialized')) {
        carouselInstance = new ImageCarousel(carouselContainer);
        carouselContainer.setAttribute('data-carousel-initialized', 'true');
    }
}

// Fixed counter animation (prevent multiple animations)
function animateCounter(element, target, duration = 2000) {
    // Check if already animating
    if (element.hasAttribute('data-animating')) {
        return;
    }
    
    element.setAttribute('data-animating', 'true');
    
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
            element.removeAttribute('data-animating');
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Fixed stats observer (prevent multiple observations)
const observedElements = new WeakSet();

const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !observedElements.has(entry.target)) {
            observedElements.add(entry.target);
            
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent);
                if (!isNaN(target)) {
                    animateCounter(stat, target);
                }
            });
            
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Fixed gallery observer (prevent multiple gallery initialization)
const galleryObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const galleryGrid = document.querySelector('.gallery-grid');
            if (galleryGrid && !galleryGrid.hasAttribute('data-gallery-initialized')) {
                initGallery();
            }
        }
    });
});

// Smooth scrolling for navigation links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Fixed initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing components...');
    
    // Initialize stats observer
    const statsSection = document.querySelector('.stats-section, .quick-stats');
    if (statsSection && !observedElements.has(statsSection)) {
        statsObserver.observe(statsSection);
    }
    
    // Initialize gallery observer
    galleryObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initialize carousel when available
    setTimeout(() => {
        initCarousel();
    }, 1000);
    
    // Initialize gallery when available
    setTimeout(() => {
        initGallery();
    }, 1500);
});

// Clean up function
function clearAllInstances() {
    // Clear carousel
    if (carouselInstance) {
        carouselInstance.destroy();
        carouselInstance = null;
    }
    
    // Clear loaded components
    loadedComponents.clear();
    loadingComponents.clear();
    
    // Reset gallery
    galleryInitialized = false;
    
    // Clear data attributes
    document.querySelectorAll('[data-loaded]').forEach(el => {
        el.removeAttribute('data-loaded');
    });
    
    document.querySelectorAll('[data-carousel-initialized]').forEach(el => {
        el.removeAttribute('data-carousel-initialized');
    });
    
    document.querySelectorAll('[data-gallery-initialized]').forEach(el => {
        el.removeAttribute('data-gallery-initialized');
    });
    
    console.log('All instances cleared');
}

// Export functions for external use
window.clearAllInstances = clearAllInstances;
window.initCarousel = initCarousel;
window.initGallery = initGallery;