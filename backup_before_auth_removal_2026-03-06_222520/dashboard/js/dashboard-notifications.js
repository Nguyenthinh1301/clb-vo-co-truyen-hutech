/**
 * Dashboard Notifications Module
 * Quản lý gửi thông báo từ Admin đến User
 */

const NotificationsManager = {
    users: [],
    
    /**
     * Khởi tạo module
     */
    async init() {
        console.log('Initializing Notifications Manager...');
        await this.loadUsers();
        this.renderNotificationsSection();
        await this.loadNotificationHistory();
        await this.updateNotificationCount();
    },
    
    /**
     * Load danh sách users
     */
    async loadUsers() {
        try {
            const response = await apiClient.get('/api/admin/users');
            if (response.success) {
                this.users = response.data.users || [];
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    },
    
    /**
     * Render notifications section
     */
    renderNotificationsSection() {
        const section = document.getElementById('notifications-section');
        if (!section) return;
        
        section.innerHTML = `
            <!-- Received Notifications -->
            <div class="dashboard-card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #333;">
                        <i class="fas fa-inbox"></i> Thông báo nhận được
                    </h3>
                    <button class="action-btn" onclick="NotificationsManager.markAllAsRead()" 
                            style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 8px 16px;">
                        <i class="fas fa-check-double"></i> Đánh dấu đã đọc tất cả
                    </button>
                </div>
                <div id="receivedNotifications">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <div>Đang tải thông báo...</div>
                    </div>
                </div>
            </div>
        
            <div class="dashboard-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #333;">
                        <i class="fas fa-bell"></i> Gửi thông báo đến thành viên
                    </h3>
                </div>
                
                <!-- Send Notification Form -->
                <div class="notification-form-container">
                    <form id="sendNotificationForm" onsubmit="NotificationsManager.sendNotification(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-users"></i> Người nhận
                                </label>
                                <select class="form-input" id="recipientType" onchange="NotificationsManager.handleRecipientChange()" required>
                                    <option value="">-- Chọn người nhận --</option>
                                    <option value="all">Tất cả thành viên</option>
                                    <option value="role">Theo vai trò</option>
                                    <option value="specific">Chọn thành viên cụ thể</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="roleSelectGroup" style="display: none;">
                                <label class="form-label">
                                    <i class="fas fa-user-tag"></i> Vai trò
                                </label>
                                <select class="form-input" id="roleSelect">
                                    <option value="student">Học viên</option>
                                    <option value="instructor">Huấn luyện viên</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="userSelectGroup" style="display: none;">
                                <label class="form-label">
                                    <i class="fas fa-user"></i> Chọn thành viên
                                </label>
                                <select class="form-input" id="userSelect" multiple size="5">
                                    <!-- Will be populated dynamically -->
                                </select>
                                <small style="color: #666; margin-top: 5px; display: block;">
                                    Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều người
                                </small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-tag"></i> Loại thông báo
                            </label>
                            <select class="form-input" id="notificationType" required>
                                <option value="info">Thông tin</option>
                                <option value="success">Thành công</option>
                                <option value="warning">Cảnh báo</option>
                                <option value="error">Khẩn cấp</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-heading"></i> Tiêu đề
                            </label>
                            <input type="text" class="form-input" id="notificationTitle" 
                                   placeholder="Nhập tiêu đề thông báo..." required maxlength="255">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-align-left"></i> Nội dung
                            </label>
                            <textarea class="form-input" id="notificationMessage" rows="5" 
                                      placeholder="Nhập nội dung thông báo..." required maxlength="2000"></textarea>
                            <small style="color: #666; margin-top: 5px; display: block;">
                                <span id="messageCharCount">0</span>/2000 ký tự
                            </small>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="action-btn" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                                <i class="fas fa-paper-plane"></i> Gửi thông báo
                            </button>
                            <button type="button" class="action-btn" onclick="NotificationsManager.resetForm()" 
                                    style="background: linear-gradient(135deg, #95a5a6, #7f8c8d);">
                                <i class="fas fa-redo"></i> Làm mới
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Notification History -->
            <div class="dashboard-card" style="margin-top: 20px;">
                <h3 style="margin-bottom: 20px; color: #333;">
                    <i class="fas fa-history"></i> Lịch sử gửi thông báo
                </h3>
                <div id="notificationHistory">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <div>Đang tải lịch sử...</div>
                    </div>
                </div>
            </div>
        `;
        
        // Populate user select
        this.populateUserSelect();
        
        // Add character counter
        const messageInput = document.getElementById('notificationMessage');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                document.getElementById('messageCharCount').textContent = e.target.value.length;
            });
        }
        
        // Load received notifications
        this.loadReceivedNotifications();
    },
    
    /**
     * Populate user select dropdown
     */
    populateUserSelect() {
        const userSelect = document.getElementById('userSelect');
        if (!userSelect) return;
        
        userSelect.innerHTML = this.users
            .filter(user => user.role !== 'admin')
            .map(user => `
                <option value="${user.id}">
                    ${user.full_name || `${user.first_name} ${user.last_name}`} (${user.email})
                </option>
            `).join('');
    },
    
    /**
     * Handle recipient type change
     */
    handleRecipientChange() {
        const recipientType = document.getElementById('recipientType').value;
        const roleGroup = document.getElementById('roleSelectGroup');
        const userGroup = document.getElementById('userSelectGroup');
        
        roleGroup.style.display = 'none';
        userGroup.style.display = 'none';
        
        if (recipientType === 'role') {
            roleGroup.style.display = 'block';
        } else if (recipientType === 'specific') {
            userGroup.style.display = 'block';
        }
    },
    
    /**
     * Send notification
     */
    async sendNotification(event) {
        event.preventDefault();
        
        const recipientType = document.getElementById('recipientType').value;
        const type = document.getElementById('notificationType').value;
        const title = document.getElementById('notificationTitle').value.trim();
        const message = document.getElementById('notificationMessage').value.trim();
        
        if (!title || !message) {
            showNotification('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }
        
        // Determine recipients
        let recipients = [];
        if (recipientType === 'all') {
            recipients = this.users.filter(u => u.role !== 'admin').map(u => u.id);
        } else if (recipientType === 'role') {
            const role = document.getElementById('roleSelect').value;
            recipients = this.users.filter(u => u.role === role).map(u => u.id);
        } else if (recipientType === 'specific') {
            const selected = Array.from(document.getElementById('userSelect').selectedOptions);
            recipients = selected.map(opt => parseInt(opt.value));
        }
        
        if (recipients.length === 0) {
            showNotification('Vui lòng chọn người nhận', 'error');
            return;
        }
        
        try {
            showNotification('Đang gửi thông báo...', 'info');
            
            const response = await apiClient.post('/api/admin/notifications/send', {
                recipients,
                type,
                title,
                message
            });
            
            if (response.success) {
                showNotification(`Đã gửi thông báo đến ${recipients.length} người`, 'success');
                this.resetForm();
                await this.loadNotificationHistory();
            } else {
                showNotification(response.message || 'Gửi thông báo thất bại', 'error');
            }
        } catch (error) {
            console.error('Send notification error:', error);
            showNotification('Lỗi khi gửi thông báo', 'error');
        }
    },
    
    /**
     * Load notification history
     */
    async loadNotificationHistory() {
        const container = document.getElementById('notificationHistory');
        if (!container) return;
        
        try {
            const response = await apiClient.get('/api/admin/notifications/history?limit=20');
            
            if (response.success && response.data.length > 0) {
                container.innerHTML = `
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Tiêu đề</th>
                                    <th>Loại</th>
                                    <th>Người nhận</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${response.data.map(notif => `
                                    <tr>
                                        <td>${this.formatDate(notif.created_at)}</td>
                                        <td>${this.escapeHtml(notif.title)}</td>
                                        <td><span class="badge badge-${this.getTypeBadge(notif.type)}">${this.getTypeLabel(notif.type)}</span></td>
                                        <td>${notif.recipient_count || 1} người</td>
                                        <td><span class="badge badge-success">Đã gửi</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Chưa có lịch sử gửi thông báo</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Load notification history error:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải lịch sử thông báo</p>
                </div>
            `;
        }
    },
    
    /**
     * Load received notifications
     */
    async loadReceivedNotifications() {
        const container = document.getElementById('receivedNotifications');
        if (!container) return;
        
        try {
            const response = await apiClient.get('/api/notifications/my-notifications?limit=20');
            
            if (response.success && response.data && response.data.length > 0) {
                container.innerHTML = `
                    <div class="notifications-list">
                        ${response.data.map(notif => `
                            <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" 
                                 onclick="NotificationsManager.markAsRead(${notif.id})"
                                 style="padding: 15px; border: 1px solid ${notif.is_read ? '#e0e0e0' : '#667eea'}; 
                                        border-radius: 8px; margin-bottom: 10px; cursor: pointer;
                                        background: ${notif.is_read ? '#fff' : '#f0f4ff'}; 
                                        transition: all 0.3s ease;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                            <span class="badge badge-${this.getNotificationTypeBadge(notif.type)}">
                                                ${this.getNotificationTypeLabel(notif.type)}
                                            </span>
                                            ${!notif.is_read ? '<span class="badge badge-danger">Mới</span>' : ''}
                                            <span style="color: #999; font-size: 0.85em;">
                                                <i class="fas fa-clock"></i> ${this.formatDate(notif.created_at)}
                                            </span>
                                        </div>
                                        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 1.1em;">
                                            ${this.escapeHtml(notif.title)}
                                        </h4>
                                        <p style="margin: 0; color: #666; white-space: pre-wrap; line-height: 1.6;">
                                            ${this.escapeHtml(notif.message)}
                                        </p>
                                    </div>
                                    ${!notif.is_read ? `
                                        <button onclick="event.stopPropagation(); NotificationsManager.markAsRead(${notif.id})" 
                                                style="padding: 6px 12px; background: #667eea; color: white; 
                                                       border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em;">
                                            <i class="fas fa-check"></i> Đánh dấu đã đọc
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Chưa có thông báo nào</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Load received notifications error:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải thông báo</p>
                </div>
            `;
        }
    },
    
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
            
            if (response.success) {
                // Reload notifications
                await this.loadReceivedNotifications();
                // Update notification count in header
                this.updateNotificationCount();
            }
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    },
    
    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await apiClient.patch('/api/notifications/mark-all-read');
            
            if (response.success) {
                showNotification('Đã đánh dấu tất cả thông báo là đã đọc', 'success');
                await this.loadReceivedNotifications();
                this.updateNotificationCount();
            }
        } catch (error) {
            console.error('Mark all as read error:', error);
            showNotification('Lỗi khi đánh dấu thông báo', 'error');
        }
    },
    
    /**
     * Update notification count in header
     */
    async updateNotificationCount() {
        try {
            const response = await apiClient.get('/api/notifications/unread-count');
            
            if (response.success) {
                const count = response.data.unreadCount || 0;
                const badge = document.getElementById('notificationCount');
                if (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'inline-block' : 'none';
                }
            }
        } catch (error) {
            console.error('Update notification count error:', error);
        }
    },
    
    /**
     * Get notification type label
     */
    getNotificationTypeLabel(type) {
        const labels = {
            'info': 'Thông tin',
            'success': 'Thành công',
            'warning': 'Cảnh báo',
            'error': 'Lỗi'
        };
        return labels[type] || 'Thông tin';
    },
    
    /**
     * Get notification type badge color
     */
    getNotificationTypeBadge(type) {
        const badges = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'error': 'danger'
        };
        return badges[type] || 'info';
    },
    
    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('sendNotificationForm').reset();
        document.getElementById('roleSelectGroup').style.display = 'none';
        document.getElementById('userSelectGroup').style.display = 'none';
        document.getElementById('messageCharCount').textContent = '0';
    },
    
    // Helper functions
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('vi-VN');
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    getTypeLabel(type) {
        const labels = {
            'info': 'Thông tin',
            'success': 'Thành công',
            'warning': 'Cảnh báo',
            'error': 'Khẩn cấp'
        };
        return labels[type] || type;
    },
    
    getTypeBadge(type) {
        const badges = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'error': 'danger'
        };
        return badges[type] || 'info';
    },
    
    getPriorityLabel(priority) {
        const labels = {
            'low': 'Thấp',
            'normal': 'Bình thường',
            'high': 'Cao',
            'urgent': 'Khẩn cấp'
        };
        return labels[priority] || priority;
    },
    
    getPriorityBadge(priority) {
        const badges = {
            'low': 'secondary',
            'normal': 'info',
            'high': 'warning',
            'urgent': 'danger'
        };
        return badges[priority] || 'info';
    }
};

// Export to global scope
window.NotificationsManager = NotificationsManager;
