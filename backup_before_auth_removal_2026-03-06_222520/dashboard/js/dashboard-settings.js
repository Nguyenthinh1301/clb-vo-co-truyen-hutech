/**
 * ============================================
 * DASHBOARD SETTINGS MODULE
 * ============================================
 * File: dashboard-settings.js
 * Mục đích: Quản lý cài đặt dashboard
 */

/**
 * Hiển thị modal cài đặt
 */
function showSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('active');
    loadSettings();
}

/**
 * Đóng modal cài đặt
 */
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('active');
}

/**
 * Load cài đặt đã lưu từ localStorage
 */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('dashboardSettings') || '{}');
    
    // Load appearance settings
    document.getElementById('darkMode').checked = settings.darkMode || false;
    document.getElementById('language').value = settings.language || 'vi';
    
    // Load notification settings
    document.getElementById('emailNotif').checked = settings.emailNotif !== false;
    document.getElementById('browserNotif').checked = settings.browserNotif !== false;
    document.getElementById('soundNotif').checked = settings.soundNotif || false;
    
    // Load privacy settings
    document.getElementById('twoFactor').checked = settings.twoFactor || false;
    document.getElementById('onlineStatus').checked = settings.onlineStatus !== false;
    
    // Load data settings
    document.getElementById('autoSave').checked = settings.autoSave !== false;
    document.getElementById('itemsPerPage').value = settings.itemsPerPage || '25';
    
    // Apply dark mode if enabled
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Lưu cài đặt vào localStorage
 */
function saveSettings() {
    const settings = {
        darkMode: document.getElementById('darkMode').checked,
        language: document.getElementById('language').value,
        emailNotif: document.getElementById('emailNotif').checked,
        browserNotif: document.getElementById('browserNotif').checked,
        soundNotif: document.getElementById('soundNotif').checked,
        twoFactor: document.getElementById('twoFactor').checked,
        onlineStatus: document.getElementById('onlineStatus').checked,
        autoSave: document.getElementById('autoSave').checked,
        itemsPerPage: document.getElementById('itemsPerPage').value
    };
    
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    showNotification('Đã lưu cài đặt thành công!', 'success');
    closeSettings();
    
    // Apply settings
    applySettings(settings);
}

/**
 * Áp dụng cài đặt
 * @param {Object} settings - Object chứa cài đặt
 */
function applySettings(settings) {
    // Apply dark mode
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Request browser notification permission if enabled
    if (settings.browserNotif && 'Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

/**
 * Toggle chế độ tối
 */
function toggleDarkMode() {
    const isDark = document.getElementById('darkMode').checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
        showNotification('Đã bật chế độ tối', 'success');
    } else {
        document.body.classList.remove('dark-mode');
        showNotification('Đã tắt chế độ tối', 'success');
    }
}

/**
 * Thay đổi ngôn ngữ
 */
function changeLanguage() {
    const lang = document.getElementById('language').value;
    showNotification(`Đã chuyển sang ${lang === 'vi' ? 'Tiếng Việt' : 'English'}`, 'info');
    // In a real app, this would reload the page with new language
}

/**
 * Hiển thị thông báo (placeholder)
 */
function showNotifications() {
    showNotification('Chức năng thông báo đang được phát triển', 'info');
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showSettings,
        closeSettings,
        loadSettings,
        saveSettings,
        applySettings,
        toggleDarkMode,
        changeLanguage,
        showNotifications
    };
}
