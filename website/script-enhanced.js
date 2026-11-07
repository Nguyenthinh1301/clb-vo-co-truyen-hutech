/* ============================================
   ENHANCED UI/UX JAVASCRIPT
   Dynamic interactions and animations
   ============================================ */

(function() {
    'use strict';

    // ===== SMOOTH SCROLL TO SECTION =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#top') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
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
    }

    // ===== SCROLL REVEAL ANIMATION =====
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal');
        
        const revealOnScroll = () => {
            const windowHeight = window.innerHeight;
            const revealPoint = 100;

            revealElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                
                if (elementTop < windowHeight - revealPoint) {
                    element.classList.add('revealed');
                }
            });
        };

        // Initial check
        revealOnScroll();

        // Throttled scroll listener
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    revealOnScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ===== ANIMATED COUNTER FOR STATS =====
    function initCounters() {
        // Chỉ số liệu phần Giới thiệu — số ở hero (.hero-stat-number) đã được script.js đếm,
        // đếm thêm ở đây sẽ làm 2 animation giành nhau
        const counters = document.querySelectorAll('.stat-number');
        const speed = 2000; // Animation duration in ms

        const animateCounter = (counter) => {
            const text = counter.textContent.trim();
            const target = parseInt(counter.getAttribute('data-target')) || parseInt(text);
            if (!target) return; // không phải số (vd "∞") → giữ nguyên
            // Giữ phần chữ phía sau số, vd "8+" → hậu tố "+", "100%" → "%"
            const suffix = text.replace(/^[\d.,\s]+/, '');
            const increment = target / (speed / 16); // 60fps
            let current = 0;

            counter.setAttribute('data-target', target);
            counter.classList.add('counting');

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.ceil(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + suffix;
                    counter.classList.remove('counting');
                }
            };

            updateCounter();
        };

        // Intersection Observer for triggering animation when visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    // ===== BACK TO TOP BUTTON =====
    function initBackToTop() {
        // Create button if not exists
        let btn = document.querySelector('.back-to-top');
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'back-to-top';
            btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            btn.setAttribute('aria-label', 'Về đầu trang');
            document.body.appendChild(btn);
        }

        // Show/hide button on scroll
        const toggleButton = () => {
            if (window.pageYOffset > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', toggleButton);

        // Scroll to top on click
        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ===== ENHANCED HEADER SCROLL EFFECT =====
    function initHeaderScroll() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        let lastScroll = 0;
        const headerHeight = header.offsetHeight;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Add scrolled class when scrolling down
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });
    }

    // ===== PARALLAX EFFECT FOR HERO SECTION =====
    function initParallax() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            
            if (scrolled < window.innerHeight) {
                hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
                hero.style.opacity = 1 - (scrolled / 600);
            }
        });
    }

    // ===== ENHANCED IMAGE LOADING WITH FADE IN =====
    function initLazyImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    imageObserver.unobserve(img);

                    // Ảnh đã tải xong (trình duyệt tải sẵn ảnh lazy trước khi cuộn tới, hoặc lấy từ cache):
                    // sự kiện 'load' sẽ KHÔNG xảy ra nữa → nếu đặt opacity 0 thì ảnh bị ẩn vĩnh viễn.
                    if (img.complete) return;

                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.5s ease';
                    const show = () => { img.style.opacity = '1'; };
                    img.addEventListener('load', show, { once: true });
                    // Ảnh lỗi cũng phải hiện lại để onerror của trang hiển thị ô báo lỗi
                    img.addEventListener('error', show, { once: true });
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // ===== HOVER RIPPLE EFFECT FOR BUTTONS =====
    function initRippleEffect() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .cta-button');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    left: ${x}px;
                    top: ${y}px;
                    pointer-events: none;
                    animation: ripple-animation 0.6s ease-out;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation if not exists
        if (!document.querySelector('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple-animation {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== ENHANCED FORM VALIDATION =====
    function initFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea');

            inputs.forEach(input => {
                // Add floating label effect
                input.addEventListener('focus', function() {
                    this.parentElement.classList.add('focused');
                });

                input.addEventListener('blur', function() {
                    if (!this.value) {
                        this.parentElement.classList.remove('focused');
                    }
                });

                // Validate on blur
                input.addEventListener('blur', function() {
                    validateInput(this);
                });
            });
        });

        function validateInput(input) {
            const value = input.value.trim();
            let isValid = true;

            // Remove previous error
            const existingError = input.parentElement.querySelector('.error-message');
            if (existingError) existingError.remove();

            // Email validation
            if (input.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                if (!isValid) {
                    showError(input, 'Email không hợp lệ');
                }
            }

            // Required validation
            if (input.hasAttribute('required') && !value) {
                isValid = false;
                showError(input, 'Trường này là bắt buộc');
            }

            return isValid;
        }

        function showError(input, message) {
            input.style.borderColor = '#e74c3c';
            const error = document.createElement('span');
            error.className = 'error-message';
            error.style.cssText = 'color: #e74c3c; font-size: 0.85rem; margin-top: 5px; display: block;';
            error.textContent = message;
            input.parentElement.appendChild(error);
        }
    }

    // ===== CURSOR TRAIL EFFECT (Optional - can be disabled) =====
    function initCursorTrail() {
        // Only on desktop
        if (window.innerWidth < 768) return;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 8;

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 3 + 2;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 - 1;
                this.life = 30;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life--;
                if (this.size > 0.1) this.size -= 0.1;
            }

            draw() {
                ctx.fillStyle = `rgba(43,125,224, ${this.life / 30})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        document.addEventListener('mousemove', (e) => {
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(e.clientX, e.clientY));
            }
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
    function initIntersectionAnimations() {
        const animatedElements = document.querySelectorAll(`
            .intro-box,
            .mission-box,
            .vision-box,
            .stat-item,
            .martial-art-card,
            .value-item,
            .event-card,
            .gallery-item
        `);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.6s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    }

    // ===== INITIALIZE ALL ENHANCEMENTS =====
    function init() {
        // Trang chủ nạp các section bằng fetch() SAU DOMContentLoaded (xem index.html).
        // Nếu chạy ngay lúc DOM sẵn sàng, các querySelectorAll ở trên sẽ không tìm thấy gì.
        // → Trang có placeholder thì chờ sự kiện 'components:loaded'; trang thường thì chạy luôn.
        const start = () => {
            const usesComponents = document.querySelector('[id$="-placeholder"]');
            if (usesComponents && !window.__componentsLoaded) {
                document.addEventListener('components:loaded', runInit, { once: true });
            } else {
                runInit();
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }

    let initialized = false;
    function runInit() {
        if (initialized) return;
        initialized = true;
        console.log('🎨 Initializing Enhanced UI/UX...');

        try {
            initSmoothScroll();
            initScrollReveal();
            initCounters();
            initBackToTop();
            // initHeaderScroll(); — tắt: dropdown.js/script.js đã bật class 'scrolled' ở ngưỡng 100px,
            // chạy thêm bản này (ngưỡng 50px) làm header nhấp nháy trong khoảng 50–100px

            initParallax();
            initLazyImages();
            initRippleEffect();
            initFormValidation();
            initIntersectionAnimations();
            
            // Optional: Uncomment if you want cursor trail
            // initCursorTrail();

            console.log('✅ Enhanced UI/UX initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing enhancements:', error);
        }
    }

    // Start initialization
    init();

})();
