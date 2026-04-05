/**
 * Backend Health Checker
 * Tự động kiểm tra và thông báo trạng thái backend
 */

class BackendChecker {
    constructor() {
        this.backendUrl = API_CONFIG.BASE_URL;
        this.checkInterval = null;
        this.isBackendOnline = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    /**
     * Kiểm tra backend có đang chạy không
     */
    async checkBackend() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.backendUrl}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.isBackendOnline = true;
                this.retryCount = 0;
                return true;
            }
            
            this.isBackendOnline = false;
            return false;
        } catch (error) {
            this.isBackendOnline = false;
            return false;
        }
    }
    
    /**
     * Hiển thị thông báo backend offline
     */
    showOfflineNotification() {
        // Kiểm tra xem đã có notification chưa
        if (document.getElementById('backend-offline-notification')) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.id = 'backend-offline-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(231, 76, 60, 0.4);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="font-size: 24px;">⚠️</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">
                        Backend không hoạt động
                    </div>
                    <div style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                        Không thể kết nối đến server. Vui lòng khởi động backend:
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; margin-bottom: 12px;">
                        cd backend && npm start
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="backendChecker.retryConnection()" style="
                            background: white;
                            color: #e74c3c;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 13px;
                        ">
                            🔄 Thử lại
                        </button>
                        <button onclick="backendChecker.hideNotification()" style="
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 13px;
                        ">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
    }
    
    /**
     * Ẩn thông báo
     */
    hideNotification() {
        const notification = document.getElementById('backend-offline-notification');
        if (notification) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }
    
    /**
     * Hiển thị thông báo backend online
     */
    showOnlineNotification() {
        this.hideNotification();
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(46, 204, 113, 0.4);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 20px;">✅</div>
                <div style="font-weight: 600;">Backend đã kết nối thành công!</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Thử kết nối lại
     */
    async retryConnection() {
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Đang kiểm tra...';
        button.disabled = true;
        
        const isOnline = await this.checkBackend();
        
        if (isOnline) {
            this.showOnlineNotification();
        } else {
            button.innerHTML = originalText;
            button.disabled = false;
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = `
                margin-top: 8px;
                padding: 8px;
                background: rgba(255,255,255,0.2);
                border-radius: 6px;
                font-size: 12px;
            `;
            errorMsg.textContent = 'Vẫn không thể kết nối. Vui lòng kiểm tra backend.';
            button.parentElement.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 3000);
        }
    }
    
    /**
     * Bắt đầu kiểm tra định kỳ
     */
    startMonitoring() {
        // Kiểm tra ngay lập tức
        this.checkBackend().then(isOnline => {
            if (!isOnline) {
                this.showOfflineNotification();
            }
        });
        
        // Kiểm tra mỗi 30 giây
        this.checkInterval = setInterval(async () => {
            const wasOnline = this.isBackendOnline;
            const isOnline = await this.checkBackend();
            
            // Nếu backend vừa offline
            if (wasOnline && !isOnline) {
                this.showOfflineNotification();
            }
            
            // Nếu backend vừa online
            if (!wasOnline && isOnline) {
                this.showOnlineNotification();
            }
        }, 30000);
    }
    
    /**
     * Dừng kiểm tra
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Create global instance
const backendChecker = new BackendChecker();

// Auto-start monitoring when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Chỉ monitor trên các trang cần backend
        const needsBackend = window.location.pathname.includes('dang-nhap') || 
                            window.location.pathname.includes('dang-ky') ||
                            window.location.pathname.includes('dashboard');
        
        if (needsBackend) {
            backendChecker.startMonitoring();
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        backendChecker.stopMonitoring();
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackendChecker, backendChecker };
} else {
    window.BackendChecker = BackendChecker;
    window.backendChecker = backendChecker;
}

console.log('Backend Checker loaded successfully');
