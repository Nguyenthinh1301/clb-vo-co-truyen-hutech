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

// Toast notification system
const ToastNotification = {
    show: function(message, type = 'success', duration = 3000) {
        // Remove existing toast if any
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 350px;
            font-weight: 500;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);
    }
};

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
                <a href="views/account/dashboard.html" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i>
                    Dashboard
                </a>
                <a href="views/account/profile.html" class="dropdown-item">
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
