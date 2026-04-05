/**
 * Dashboard System Module
 * Quản lý hệ thống và cấu hình
 */

// System info
const systemInfo = {
    server: {
        status: 'online',
        uptime: '15 ngày 8 giờ',
        cpu: 45,
        memory: 62,
        disk: 38
    },
    database: {
        status: 'connected',
        type: 'MSSQL',
        size: '2.4 GB',
        tables: 12,
        lastBackup: '2026-02-08 02:00:00'
    },
    version: {
        app: '1.0.0',
        node: 'v18.17.0',
        database: 'MSSQL 2019'
    }
};

// Activity logs (empty by default)
let activityLogs = [];

/**
 * Khởi tạo module System
 */
function initSystemModule() {
    console.log('System module initialized');
    loadSystemContent();
}

/**
 * Load nội dung hệ thống
 */
function loadSystemContent() {
    const systemContent = document.getElementById('system-content');
    if (!systemContent) return;
    
    systemContent.innerHTML = `
        <div class="system-header">
            <div class="header-left">
                <h2><i class="fas fa-server"></i> Quản lý hệ thống</h2>
                <p class="subtitle">Giám sát và cấu hình hệ thống</p>
            </div>
            <div class="system-actions">
                <button class="action-btn" onclick="DashboardSystem.refreshSystem()">
                    <i class="fas fa-sync-alt"></i> Làm mới
                </button>
            </div>
        </div>
        
        <!-- System Status -->
        <div class="system-status-grid">
            <div class="status-card server ${systemInfo.server.status}">
                <div class="status-icon">
                    <i class="fas fa-server"></i>
                </div>
                <div class="status-content">
                    <h3>Máy chủ</h3>
                    <div class="status-badge ${systemInfo.server.status}">
                        ${systemInfo.server.status === 'online' ? 'Đang hoạt động' : 'Offline'}
                    </div>
                    <div class="status-info">
                        <span>Uptime: ${systemInfo.server.uptime}</span>
                    </div>
                </div>
            </div>
            
            <div class="status-card database ${systemInfo.database.status}">
                <div class="status-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="status-content">
                    <h3>Cơ sở dữ liệu</h3>
                    <div class="status-badge ${systemInfo.database.status}">
                        ${systemInfo.database.status === 'connected' ? 'Đã kết nối' : 'Mất kết nối'}
                    </div>
                    <div class="status-info">
                        <span>${systemInfo.database.type} - ${systemInfo.database.size}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Resource Usage -->
        <div class="resource-section">
            <h3><i class="fas fa-chart-area"></i> Tài nguyên hệ thống</h3>
            <div class="resource-grid">
                <div class="resource-item">
                    <div class="resource-header">
                        <span class="resource-label">CPU</span>
                        <span class="resource-value">${systemInfo.server.cpu}%</span>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-fill cpu" style="width: ${systemInfo.server.cpu}%"></div>
                    </div>
                </div>
                
                <div class="resource-item">
                    <div class="resource-header">
                        <span class="resource-label">RAM</span>
                        <span class="resource-value">${systemInfo.server.memory}%</span>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-fill memory" style="width: ${systemInfo.server.memory}%"></div>
                    </div>
                </div>
                
                <div class="resource-item">
                    <div class="resource-header">
                        <span class="resource-label">Ổ đĩa</span>
                        <span class="resource-value">${systemInfo.server.disk}%</span>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-fill disk" style="width: ${systemInfo.server.disk}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- System Actions -->
        <div class="system-actions-grid">
            <div class="action-card">
                <div class="action-icon backup">
                    <i class="fas fa-download"></i>
                </div>
                <h4>Sao lưu dữ liệu</h4>
                <p>Tạo bản sao lưu cơ sở dữ liệu</p>
                <button class="action-btn primary" onclick="DashboardSystem.backupDatabase()">
                    <i class="fas fa-download"></i> Sao lưu ngay
                </button>
                <div class="action-info">
                    Lần cuối: ${formatDateTime(systemInfo.database.lastBackup)}
                </div>
            </div>
            
            <div class="action-card">
                <div class="action-icon logs">
                    <i class="fas fa-file-alt"></i>
                </div>
                <h4>Nhật ký hoạt động</h4>
                <p>Xem lịch sử hoạt động hệ thống</p>
                <button class="action-btn" onclick="DashboardSystem.viewLogs()">
                    <i class="fas fa-eye"></i> Xem logs
                </button>
                <div class="action-info">
                    ${activityLogs.length} bản ghi
                </div>
            </div>
            
            <div class="action-card">
                <div class="action-icon settings">
                    <i class="fas fa-cog"></i>
                </div>
                <h4>Cấu hình hệ thống</h4>
                <p>Quản lý cài đặt và tham số</p>
                <button class="action-btn" onclick="DashboardSystem.systemSettings()">
                    <i class="fas fa-cog"></i> Cấu hình
                </button>
                <div class="action-info">
                    Version ${systemInfo.version.app}
                </div>
            </div>
            
            <div class="action-card">
                <div class="action-icon maintenance">
                    <i class="fas fa-tools"></i>
                </div>
                <h4>Bảo trì hệ thống</h4>
                <p>Tối ưu và dọn dẹp dữ liệu</p>
                <button class="action-btn warning" onclick="DashboardSystem.maintenance()">
                    <i class="fas fa-tools"></i> Bảo trì
                </button>
                <div class="action-info">
                    Tự động hàng tuần
                </div>
            </div>
        </div>
        
        <!-- System Info -->
        <div class="system-info-section">
            <h3><i class="fas fa-info-circle"></i> Thông tin hệ thống</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Phiên bản ứng dụng</span>
                    <span class="info-value">${systemInfo.version.app}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Node.js</span>
                    <span class="info-value">${systemInfo.version.node}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Cơ sở dữ liệu</span>
                    <span class="info-value">${systemInfo.version.database}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Số bảng</span>
                    <span class="info-value">${systemInfo.database.tables} bảng</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Dung lượng DB</span>
                    <span class="info-value">${systemInfo.database.size}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Thời gian hoạt động</span>
                    <span class="info-value">${systemInfo.server.uptime}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Format date time
 */
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Refresh system
 */
function refreshSystem() {
    showNotification('Đang làm mới thông tin hệ thống...', 'info');
    
    setTimeout(() => {
        loadSystemContent();
        showNotification('Làm mới thành công!', 'success');
    }, 1000);
}

/**
 * Backup database
 */
function backupDatabase() {
    if (!confirm('Bạn có chắc chắn muốn sao lưu cơ sở dữ liệu?')) return;
    
    showNotification('Đang tạo bản sao lưu...', 'info');
    
    // Simulate backup process
    setTimeout(() => {
        systemInfo.database.lastBackup = new Date().toISOString();
        showNotification('Sao lưu dữ liệu thành công!', 'success');
        loadSystemContent();
    }, 2000);
}

/**
 * View logs
 */
function viewLogs() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-file-alt"></i> Nhật ký hoạt động</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${activityLogs.length === 0 ? `
                    <div class="empty-state small">
                        <i class="fas fa-file-alt"></i>
                        <h3>Chưa có nhật ký</h3>
                        <p>Các hoạt động của hệ thống sẽ được ghi lại tại đây</p>
                    </div>
                ` : `
                    <div class="logs-list">
                        ${activityLogs.map(log => `
                            <div class="log-item ${log.type}">
                                <div class="log-icon">
                                    <i class="fas fa-${getLogIcon(log.type)}"></i>
                                </div>
                                <div class="log-content">
                                    <div class="log-message">${escapeHtml(log.message)}</div>
                                    <div class="log-time">${formatDateTime(log.timestamp)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Get log icon
 */
function getLogIcon(type) {
    const icons = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle'
    };
    return icons[type] || 'circle';
}

/**
 * System settings
 */
function systemSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-cog"></i> Cấu hình hệ thống</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="system-settings-form" onsubmit="DashboardSystem.saveSettings(event)">
                    <div class="settings-section">
                        <h4>Cài đặt chung</h4>
                        <div class="form-group">
                            <label>Tên hệ thống</label>
                            <input type="text" name="system_name" value="CLB Võ Cổ Truyền HUTECH" required>
                        </div>
                        <div class="form-group">
                            <label>Email liên hệ</label>
                            <input type="email" name="contact_email" value="contact@hutech.edu.vn" required>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>Sao lưu tự động</h4>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="auto_backup" checked>
                                <span>Bật sao lưu tự động</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Tần suất sao lưu</label>
                            <select name="backup_frequency">
                                <option value="daily" selected>Hàng ngày</option>
                                <option value="weekly">Hàng tuần</option>
                                <option value="monthly">Hàng tháng</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>Bảo mật</h4>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="two_factor" checked>
                                <span>Xác thực hai yếu tố</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Thời gian hết phiên (phút)</label>
                            <input type="number" name="session_timeout" value="30" min="5" max="120">
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="action-btn success">
                            <i class="fas fa-save"></i> Lưu cấu hình
                        </button>
                        <button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Save settings
 */
function saveSettings(event) {
    event.preventDefault();
    
    showNotification('Đang lưu cấu hình...', 'info');
    
    setTimeout(() => {
        showNotification('Lưu cấu hình thành công!', 'success');
        document.querySelector('.modal-overlay').remove();
    }, 1000);
}

/**
 * Maintenance
 */
function maintenance() {
    if (!confirm('Bảo trì hệ thống có thể mất vài phút. Bạn có muốn tiếp tục?')) return;
    
    showNotification('Đang thực hiện bảo trì hệ thống...', 'info');
    
    setTimeout(() => {
        showNotification('Bảo trì hoàn tất! Hệ thống đã được tối ưu.', 'success');
    }, 3000);
}

// Export functions
if (typeof window !== 'undefined') {
    window.DashboardSystem = {
        init: initSystemModule,
        loadSystemContent,
        refreshSystem,
        backupDatabase,
        viewLogs,
        systemSettings,
        saveSettings,
        maintenance
    };
}
