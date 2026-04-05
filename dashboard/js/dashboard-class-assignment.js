/**
 * Dashboard Class Assignment Module
 * Quản lý phân công lớp học cho thành viên
 */

const ClassAssignment = {
    unassignedUsers: [],
    classes: [],
    
    /**
     * Khởi tạo module
     */
    async init() {
        console.log('Initializing Class Assignment...');
        await this.loadUnassignedUsers();
        await this.loadClasses();
        this.renderAssignmentSection();
    },
    
    /**
     * Load danh sách user chưa được phân công
     */
    async loadUnassignedUsers() {
        try {
            const response = await apiClient.get('/api/admin/class-management/unassigned-users');
            if (response.success) {
                this.unassignedUsers = response.data || [];
            }
        } catch (error) {
            console.error('Error loading unassigned users:', error);
            this.unassignedUsers = [];
        }
    },
    
    /**
     * Load danh sách lớp học
     */
    async loadClasses() {
        try {
            const response = await apiClient.get('/api/admin/classes');
            if (response.success) {
                this.classes = response.data.classes || [];
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            this.classes = [];
        }
    },
    
    /**
     * Render assignment section
     */
    renderAssignmentSection() {
        const container = document.getElementById('class-assignment-container');
        if (!container) {
            console.warn('Class assignment container not found');
            return;
        }
        
        container.innerHTML = `
            <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Unassigned Users -->
                <div class="dashboard-card">
                    <h3 style="margin-bottom: 20px; color: #333;">
                        <i class="fas fa-user-clock"></i> Thành viên chưa phân lớp
                        <span class="badge badge-warning" style="margin-left: 10px;">${this.unassignedUsers.length}</span>
                    </h3>
                    
                    ${this.unassignedUsers.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>Tất cả thành viên đã được phân công lớp</p>
                        </div>
                    ` : `
                        <div class="user-list" style="max-height: 500px; overflow-y: auto;">
                            ${this.unassignedUsers.map(user => `
                                <div class="user-item" style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 10px; background: #f9f9f9;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                                                ${user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                                            </div>
                                            <div style="font-size: 0.9em; color: #666;">
                                                <i class="fas fa-envelope"></i> ${user.email}
                                            </div>
                                            ${user.phone_number ? `
                                                <div style="font-size: 0.9em; color: #666;">
                                                    <i class="fas fa-phone"></i> ${user.phone_number}
                                                </div>
                                            ` : ''}
                                            <div style="font-size: 0.85em; color: #999; margin-top: 5px;">
                                                <i class="fas fa-calendar"></i> Đăng ký: ${this.formatDate(user.created_at)}
                                            </div>
                                        </div>
                                        <div>
                                            <button class="btn btn-primary btn-sm" onclick="ClassAssignment.showAssignModal(${user.id})">
                                                <i class="fas fa-plus"></i> Phân lớp
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Classes Overview -->
                <div class="dashboard-card">
                    <h3 style="margin-bottom: 20px; color: #333;">
                        <i class="fas fa-graduation-cap"></i> Danh sách lớp học
                        <span class="badge badge-info" style="margin-left: 10px;">${this.classes.length}</span>
                    </h3>
                    
                    ${this.classes.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-info-circle"></i>
                            <p>Chưa có lớp học nào</p>
                        </div>
                    ` : `
                        <div class="class-list" style="max-height: 500px; overflow-y: auto;">
                            ${this.classes.map(cls => `
                                <div class="class-item" style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 10px; background: #f9f9f9;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                                                ${cls.name}
                                            </div>
                                            ${cls.description ? `
                                                <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">
                                                    ${cls.description}
                                                </div>
                                            ` : ''}
                                            <div style="font-size: 0.85em; color: #999;">
                                                <i class="fas fa-users"></i> ${cls.current_students || 0}/${cls.max_students || '∞'} học viên
                                            </div>
                                        </div>
                                        <div>
                                            <span class="badge badge-${cls.status === 'active' ? 'success' : 'secondary'}">
                                                ${cls.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },
    
    /**
     * Show assign modal
     */
    showAssignModal(userId) {
        const user = this.unassignedUsers.find(u => u.id === userId);
        if (!user) {
            alert('Không tìm thấy thông tin user');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Phân công lớp học</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                        <strong>Thành viên:</strong> ${user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}<br>
                        <strong>Email:</strong> ${user.email}
                    </div>
                    
                    <form id="assignClassForm" onsubmit="ClassAssignment.handleAssign(event, ${userId})">
                        <div class="form-group">
                            <label>Chọn lớp học <span style="color: red;">*</span></label>
                            <select id="selectClass" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <option value="">-- Chọn lớp --</option>
                                ${this.classes.filter(c => c.status === 'active').map(cls => `
                                    <option value="${cls.id}">${cls.name} (${cls.current_students || 0}/${cls.max_students || '∞'})</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Ghi chú</label>
                            <textarea id="assignNote" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Ghi chú về việc phân công..."></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check"></i> Xác nhận
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    /**
     * Handle assign
     */
    async handleAssign(event, userId) {
        event.preventDefault();
        
        const classId = document.getElementById('selectClass').value;
        const note = document.getElementById('assignNote').value;
        
        if (!classId) {
            alert('Vui lòng chọn lớp học');
            return;
        }
        
        try {
            const response = await apiClient.post('/api/admin/class-management/assign', {
                user_id: userId,
                class_id: classId,
                note: note
            });
            
            if (response.success) {
                alert('✅ Phân công lớp học thành công!');
                document.querySelector('.modal').remove();
                
                // Reload data
                await this.init();
            } else {
                alert('❌ Lỗi: ' + (response.message || 'Không thể phân công'));
            }
        } catch (error) {
            console.error('Error assigning class:', error);
            alert('❌ Có lỗi xảy ra khi phân công lớp');
        }
    },
    
    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.ClassAssignment = ClassAssignment;
}

console.log('Class Assignment module loaded');
