/**
 * Utility Functions for CLB Võ Cổ Truyền HUTECH Website
 * Contains helper functions, common utilities, and shared logic
 */

const Utils = {
    /**
     * DOM Manipulation Utilities
     */
    DOM: {
        // Get element by ID
        getElementById(id) {
            return document.getElementById(id);
        },

        // Get elements by class name
        getElementsByClassName(className) {
            return document.getElementsByClassName(className);
        },

        // Query selector
        querySelector(selector) {
            return document.querySelector(selector);
        },

        // Query selector all
        querySelectorAll(selector) {
            return document.querySelectorAll(selector);
        },

        // Create element with attributes and content
        createElement(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });
            
            if (content) {
                element.textContent = content;
            }
            
            return element;
        },

        // Show element
        show(element) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            if (element) {
                element.style.display = 'block';
            }
        },

        // Hide element
        hide(element) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            if (element) {
                element.style.display = 'none';
            }
        },

        // Toggle element visibility
        toggle(element) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            if (element) {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        },

        // Add class
        addClass(element, className) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            if (element) {
                element.classList.add(className);
            }
        },

        // Remove class
        removeClass(element, className) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            if (element) {
                element.classList.remove(className);
            }
        },

        // Toggle class
        toggleClass(element, className) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            if (element) {
                element.classList.toggle(className);
            }
        },

        // Check if element has class
        hasClass(element, className) {
            if (typeof element === 'string') {
                element = this.getElementById(element);
            }
            return element ? element.classList.contains(className) : false;
        }
    },

    /**
     * Date and Time Utilities
     */
    DateTime: {
        // Get current timestamp
        now() {
            return new Date().toISOString();
        },

        // Format date
        formatDate(date, format = 'DD/MM/YYYY') {
            if (!date) return '';
            
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            switch (format) {
                case 'DD/MM/YYYY':
                    return `${day}/${month}/${year}`;
                case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                case 'DD/MM/YYYY HH:mm':
                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                case 'HH:mm':
                    return `${hours}:${minutes}`;
                default:
                    return d.toLocaleDateString('vi-VN');
            }
        },

        // Parse date string
        parseDate(dateString) {
            return new Date(dateString);
        },

        // Get age from birth date
        getAge(birthDate) {
            if (!birthDate) return null;
            
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        },

        // Check if date is in the future
        isFuture(date) {
            return new Date(date) > new Date();
        },

        // Check if date is in the past
        isPast(date) {
            return new Date(date) < new Date();
        },

        // Get days between two dates
        daysBetween(date1, date2) {
            const oneDay = 24 * 60 * 60 * 1000;
            const firstDate = new Date(date1);
            const secondDate = new Date(date2);
            
            return Math.round(Math.abs((firstDate - secondDate) / oneDay));
        },

        // Get relative time (e.g., "2 hours ago")
        getRelativeTime(date) {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffDays > 0) {
                return `${diffDays} ngày trước`;
            } else if (diffHours > 0) {
                return `${diffHours} giờ trước`;
            } else if (diffMins > 0) {
                return `${diffMins} phút trước`;
            } else {
                return 'Vừa xong';
            }
        }
    },

    /**
     * String Utilities
     */
    String: {
        // Capitalize first letter
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        // Capitalize each word
        capitalizeWords(str) {
            if (!str) return '';
            return str.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },

        // Remove Vietnamese accents
        removeAccents(str) {
            if (!str) return '';
            return str.normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, '')
                     .replace(/đ/g, 'd')
                     .replace(/Đ/g, 'D');
        },

        // Generate slug from string
        generateSlug(str) {
            if (!str) return '';
            return this.removeAccents(str)
                      .toLowerCase()
                      .replace(/[^a-z0-9 -]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-')
                      .trim('-');
        },

        // Truncate string
        truncate(str, length = 100, suffix = '...') {
            if (!str || str.length <= length) return str;
            return str.substring(0, length) + suffix;
        },

        // Check if string is empty or whitespace
        isEmpty(str) {
            return !str || str.trim().length === 0;
        },

        // Generate random string
        random(length = 10) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
    },

    /**
     * Number Utilities
     */
    Number: {
        // Format number with thousand separators
        format(num, locale = 'vi-VN') {
            if (num === null || num === undefined) return '0';
            return Number(num).toLocaleString(locale);
        },

        // Format currency
        formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
            if (amount === null || amount === undefined) return '0 ₫';
            
            const formatter = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0
            });
            
            return formatter.format(amount);
        },

        // Generate random number between min and max
        random(min = 0, max = 100) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        // Check if number is in range
        isInRange(num, min, max) {
            return num >= min && num <= max;
        }
    },

    /**
     * Array Utilities
     */
    Array: {
        // Check if array is empty
        isEmpty(arr) {
            return !Array.isArray(arr) || arr.length === 0;
        },

        // Get unique values from array
        unique(arr) {
            return [...new Set(arr)];
        },

        // Shuffle array
        shuffle(arr) {
            const shuffled = [...arr];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },

        // Group array by property
        groupBy(arr, key) {
            return arr.reduce((groups, item) => {
                const group = (groups[item[key]] || []);
                group.push(item);
                groups[item[key]] = group;
                return groups;
            }, {});
        },

        // Sort array by property
        sortBy(arr, key, direction = 'asc') {
            return arr.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                
                if (direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        },

        // Paginate array
        paginate(arr, page = 1, itemsPerPage = 10) {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            
            return {
                data: arr.slice(startIndex, endIndex),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(arr.length / itemsPerPage),
                    totalItems: arr.length,
                    itemsPerPage: itemsPerPage,
                    hasNext: endIndex < arr.length,
                    hasPrev: page > 1
                }
            };
        }
    },

    /**
     * Storage Utilities
     */
    Storage: {
        // Local Storage
        local: {
            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                    return false;
                }
            },

            get(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (error) {
                    console.error('Error reading from localStorage:', error);
                    return defaultValue;
                }
            },

            remove(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.error('Error removing from localStorage:', error);
                    return false;
                }
            },

            clear() {
                try {
                    localStorage.clear();
                    return true;
                } catch (error) {
                    console.error('Error clearing localStorage:', error);
                    return false;
                }
            }
        },

        // Session Storage
        session: {
            set(key, value) {
                try {
                    sessionStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    console.error('Error saving to sessionStorage:', error);
                    return false;
                }
            },

            get(key, defaultValue = null) {
                try {
                    const item = sessionStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (error) {
                    console.error('Error reading from sessionStorage:', error);
                    return defaultValue;
                }
            },

            remove(key) {
                try {
                    sessionStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.error('Error removing from sessionStorage:', error);
                    return false;
                }
            },

            clear() {
                try {
                    sessionStorage.clear();
                    return true;
                } catch (error) {
                    console.error('Error clearing sessionStorage:', error);
                    return false;
                }
            }
        }
    },

    /**
     * URL and Navigation Utilities
     */
    URL: {
        // Get URL parameters
        getParams() {
            const params = new URLSearchParams(window.location.search);
            const result = {};
            for (const [key, value] of params) {
                result[key] = value;
            }
            return result;
        },

        // Get specific URL parameter
        getParam(name, defaultValue = null) {
            const params = new URLSearchParams(window.location.search);
            return params.get(name) || defaultValue;
        },

        // Set URL parameter
        setParam(name, value) {
            const url = new URL(window.location);
            url.searchParams.set(name, value);
            window.history.pushState({}, '', url);
        },

        // Remove URL parameter
        removeParam(name) {
            const url = new URL(window.location);
            url.searchParams.delete(name);
            window.history.pushState({}, '', url);
        },

        // Navigate to URL
        navigate(url) {
            window.location.href = url;
        },

        // Navigate back
        goBack() {
            window.history.back();
        },

        // Reload page
        reload() {
            window.location.reload();
        }
    },

    /**
     * Validation Utilities
     */
    Validation: {
        // Email validation
        isEmail(email) {
            return CONFIG.VALIDATION.EMAIL.test(email);
        },

        // Phone validation
        isPhone(phone) {
            return CONFIG.VALIDATION.PHONE.test(phone);
        },

        // Username validation
        isUsername(username) {
            return CONFIG.VALIDATION.USERNAME.test(username);
        },

        // Password strength validation
        isStrongPassword(password) {
            return ConfigUtils.isStrongPassword(password);
        },

        // Required field validation
        isRequired(value) {
            return value !== null && value !== undefined && 
                   String(value).trim().length > 0;
        },

        // Minimum length validation
        minLength(value, min) {
            return String(value).length >= min;
        },

        // Maximum length validation
        maxLength(value, max) {
            return String(value).length <= max;
        },

        // Numeric validation
        isNumeric(value) {
            return !isNaN(value) && !isNaN(parseFloat(value));
        },

        // Date validation
        isDate(value) {
            return !isNaN(Date.parse(value));
        }
    },

    /**
     * UI Helper Utilities
     */
    UI: {
        // Show loading spinner
        showLoading(element, message = 'Đang tải...') {
            if (typeof element === 'string') {
                element = Utils.DOM.getElementById(element);
            }
            
            if (element) {
                element.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>${message}</span>
                    </div>
                `;
            }
        },

        // Show message
        showMessage(message, type = 'info', duration = 5000) {
            const messageDiv = Utils.DOM.createElement('div', {
                className: `message message-${type}`,
                innerHTML: `
                    <i class="fas fa-${this.getMessageIcon(type)}"></i>
                    <span>${message}</span>
                    <button class="message-close" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                `
            });

            document.body.appendChild(messageDiv);

            // Auto remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, duration);
            }
        },

        // Get message icon by type
        getMessageIcon(type) {
            const icons = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };
            return icons[type] || 'info-circle';
        },

        // Confirm dialog
        confirm(message, callback) {
            if (window.confirm(message)) {
                callback();
            }
        },

        // Scroll to element
        scrollTo(element, behavior = 'smooth') {
            if (typeof element === 'string') {
                element = Utils.DOM.getElementById(element);
            }
            
            if (element) {
                element.scrollIntoView({ behavior });
            }
        },

        // Copy to clipboard
        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.showMessage('Đã sao chép vào clipboard', 'success');
                return true;
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                this.showMessage('Không thể sao chép', 'error');
                return false;
            }
        }
    },

    /**
     * Debug and Development Utilities
     */
    Debug: {
        // Log with timestamp
        log(...args) {
            console.log(`[${new Date().toISOString()}]`, ...args);
        },

        // Error logging
        error(...args) {
            console.error(`[${new Date().toISOString()}]`, ...args);
        },

        // Performance timing
        time(label) {
            console.time(label);
        },

        timeEnd(label) {
            console.timeEnd(label);
        },

        // Memory usage
        getMemoryUsage() {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        }
    }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}

console.log('Utilities loaded successfully');
