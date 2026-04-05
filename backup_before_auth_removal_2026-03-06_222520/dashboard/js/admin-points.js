/**
 * Admin Points Management Module
 * Quản lý điểm thưởng cho thành viên
 */

const AdminPoints = {
    members: [],
    filteredMembers: [],
    stats: {},

    /**
     * Khởi tạo module
     */
    async init() {
        console.log('Initializing Admin Points Management...');
        await this.loadStats();
        await this.loadMembers();
        await this.loadMembersForSelect();
    },

    /**
     * Load thống kê
     */
    async loadStats() {
        try {
            const response = await apiClient.get('/api/admin/points/stats');
            
            if (response.success) {
                this.stats = response.data;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values
            this.stats = {
                totalPointsIssued: 0,
                membersWithPoints: 0,
                monthlyTransactions: 0,
                avgPointsPerMember: 0
            };
            this.updateStatsDisplay();
        }
    },

    /**
     * Cập nhật hiển thị thống kê
     */
    updateStatsDisplay() {
        document.getElementById('totalPointsIssued').textContent = 
            this.formatNumber(this.stats.totalPointsIssued || 0);
        document.getElementById('membersWithPoints').textContent = 
            this.formatNumber(this.stats.membersWithPoints || 0);
        document.getElementById('monthlyTransactions').textContent = 
            this.formatNumber(this.stats.monthlyTransactions || 0);
        document.getElementById('avgPointsPerMember').textContent = 
            this.formatNumber(this.stats.avgPointsPerMember || 0);
    },

    /**
     * Load danh sách thành viên
     */
    async loadMembers() {
        const container = document.getElementById('membersListContainer');
        
        try {
            const response = await apiClient.get('/api/admin/points/members');
            
            if (response.success) {
                this.members = response.data;
                this.filteredMembers = [...this.members];
                this.renderMembers();
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Không thể tải dữ liệu</h3>
                        <p>${response.message || 'Vui lòng thử lại sau'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading members:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Lỗi kết nối</h3>
                    <p>Không thể tải danh sách thành viên</p>
                    <button class="btn btn-primary" onclick="AdminPoints.loadMembers()">
                        <i class="fas fa-redo"></i> Thử lại
                    </button>
                </div>
            `;
        }
    },

    /**
     * Render danh sách thành viên
     */
    renderMembers() {
        const container = document.getElementById('membersListContainer');
        
        if (this.filteredMembers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Không tìm thấy thành viên</h3>
                    <p>Thử thay đổi bộ lọc hoặc tìm kiếm</p>
                </div>
            `;
            return;
        }

        const html = this.filteredMembers.map(member => `
            <div class="member-card">
                <div class="member-avatar">
                    ${this.getInitials(member.full_name || member.first_name)}
                </div>
                <div class="member-info">
                    <h4>${member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}</h4>
                    <p>
                        <i class="fas fa-envelope"></i> ${member.email}
                        ${member.phone_number ? `<span style="margin-left: 15px;"><i class="fas fa-phone"></i> ${member.phone_number}</span>` : ''}
                    </p>
                    <div style="margin-top: 5px;">
                        <span class="rank-badge rank-${member.rank || 'bronze'}">
                            ${this.getRankName(member.rank)}
                        </span>
                    </div>
                </div>
                <div class="member-points">
                    <div class="points-value">${this.formatNumber(member.total_points || 0)}</div>
                    <div class="points-label">Điểm</div>
                </div>
                <div class="member-actions">
                    <button class="action-btn action-btn-primary" onclick="AdminPoints.quickAddPoints(${member.id})">
                        <i class="fas fa-plus"></i> Thêm điểm
                    </button>
                    <button class="action-btn action-btn-info" onclick="AdminPoints.viewMemberDetails(${member.id})">
                        <i class="fas fa-eye"></i> Chi tiết
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    /**
     * Lấy chữ cái đầu từ tên
     */
    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    },

    /**
     * Lấy tên hạng
     */
    getRankName(rank) {
        const ranks = {
            'bronze': 'Đồng',
            'silver': 'Bạc',
            'gold': 'Vàng',
            'platinum': 'Bạch Kim'
        };
        return ranks[rank] || 'Đồng';
    },

    /**
     * Format số
     */
    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    },

    /**
     * Tìm kiếm thành viên
     */
    searchMembers() {
        const searchTerm = document.getElementById('searchMember').value.toLowerCase();
        
        this.filteredMembers = this.members.filter(member => {
            const fullName = (member.full_name || `${member.first_name || ''} ${member.last_name || ''}`).toLowerCase();
            const email = (member.email || '').toLowerCase();
            const phone = (member.phone_number || '').toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   phone.includes(searchTerm);
        });

        this.applyFilters();
    },

    /**
     * Lọc theo hạng
     */
    filterByRank() {
        this.applyFilters();
    },

    /**
     * Sắp xếp thành viên
     */
    sortMembers() {
        const sortBy = document.getElementById('sortBy').value;

        switch(sortBy) {
            case 'points_desc':
                this.filteredMembers.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
                break;
            case 'points_asc':
                this.filteredMembers.sort((a, b) => (a.total_points || 0) - (b.total_points || 0));
                break;
            case 'name_asc':
                this.filteredMembers.sort((a, b) => {
                    const nameA = (a.full_name || a.first_name || '').toLowerCase();
                    const nameB = (b.full_name || b.first_name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'recent':
                this.filteredMembers.sort((a, b) => {
                    const dateA = new Date(a.last_transaction_date || 0);
                    const dateB = new Date(b.last_transaction_date || 0);
                    return dateB - dateA;
                });
                break;
        }

        this.renderMembers();
    },

    /**
     * Áp dụng bộ lọc
     */
    applyFilters() {
        const searchTerm = document.getElementById('searchMember').value.toLowerCase();
        const rankFilter = document.getElementById('filterRank').value;

        this.filteredMembers = this.members.filter(member => {
            // Search filter
            const fullName = (member.full_name || `${member.first_name || ''} ${member.last_name || ''}`).toLowerCase();
            const email = (member.email || '').toLowerCase();
            const phone = (member.phone_number || '').toLowerCase();
            const matchesSearch = fullName.includes(searchTerm) || 
                                 email.includes(searchTerm) || 
                                 phone.includes(searchTerm);

            // Rank filter
            const matchesRank = !rankFilter || member.rank === rankFilter;

            return matchesSearch && matchesRank;
        });

        this.sortMembers();
    },

    /**
     * Reset bộ lọc
     */
    resetFilters() {
        document.getElementById('searchMember').value = '';
        document.getElementById('filterRank').value = '';
        document.getElementById('sortBy').value = 'points_desc';
        
        this.filteredMembers = [...this.members];
        this.sortMembers();
    },

    /**
     * Load danh sách thành viên cho select
     */
    async loadMembersForSelect() {
        try {
            const response = await apiClient.get('/api/admin/users');
            
            if (response.success) {
                const select = document.getElementById('selectMember');
                const options = response.data.map(user => 
                    `<option value="${user.id}">${user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email} (${user.email})</option>`
                ).join('');
                
                select.innerHTML = '<option value="">-- Chọn thành viên --</option>' + options;
            }
        } catch (error) {
            console.error('Error loading members for select:', error);
        }
    },

    /**
     * Hiển thị modal thêm điểm
     */
    showAddPointsModal(userId = null) {
        const modal = document.getElementById('addPointsModal');
        modal.style.display = 'flex';
        
        // Reset form
        document.getElementById('addPointsForm').reset();
        
        // Pre-select user if provided
        if (userId) {
            document.getElementById('selectMember').value = userId;
        }
    },

    /**
     * Đóng modal thêm điểm
     */
    closeAddPointsModal() {
        document.getElementById('addPointsModal').style.display = 'none';
    },

    /**
     * Thêm điểm nhanh
     */
    quickAddPoints(userId) {
        this.showAddPointsModal(userId);
    },

    /**
     * Cập nhật input điểm theo loại giao dịch
     */
    updatePointsInput() {
        const type = document.getElementById('transactionType').value;
        const pointsInput = document.getElementById('pointsAmount');
        
        const pointsMap = {
            'attendance': 10,
            'event_participation': 20,
            'competition_win': 50,
            'achievement': 30,
            'referral': 15,
            'custom': 0,
            'deduct': 0
        };

        if (pointsMap[type] !== undefined) {
            pointsInput.value = pointsMap[type];
            pointsInput.readOnly = type !== 'custom' && type !== 'deduct';
        }
    },

    /**
     * Submit form thêm điểm
     */
    async submitAddPoints(event) {
        event.preventDefault();

        const userId = document.getElementById('selectMember').value;
        const type = document.getElementById('transactionType').value;
        let points = parseInt(document.getElementById('pointsAmount').value);
        const note = document.getElementById('pointsNote').value;

        // Nếu là trừ điểm, chuyển thành số âm
        if (type === 'deduct' && points > 0) {
            points = -points;
        }

        try {
            const response = await apiClient.post('/api/admin/points/add', {
                user_id: userId,
                points: points,
                type: type,
                note: note
            });

            if (response.success) {
                alert('✅ Thêm điểm thành công!');
                this.closeAddPointsModal();
                
                // Reload data
                await this.loadStats();
                await this.loadMembers();
            } else {
                alert('❌ Lỗi: ' + (response.message || 'Không thể thêm điểm'));
            }
        } catch (error) {
            console.error('Error adding points:', error);
            alert('❌ Có lỗi xảy ra khi thêm điểm');
        }
    },

    /**
     * Xem chi tiết thành viên
     */
    async viewMemberDetails(userId) {
        const modal = document.getElementById('memberDetailsModal');
        const content = document.getElementById('memberDetailsContent');
        
        modal.style.display = 'flex';
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #667eea;"></i>
                <p>Đang tải...</p>
            </div>
        `;

        try {
            const response = await apiClient.get(`/api/admin/points/member/${userId}`);
            
            if (response.success) {
                const member = response.data.member;
                const transactions = response.data.transactions || [];

                content.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        <div>
                            <h4 style="margin-bottom: 15px;">Thông tin cá nhân</h4>
                            <p><strong>Họ tên:</strong> ${member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}</p>
                            <p><strong>Email:</strong> ${member.email}</p>
                            <p><strong>Số điện thoại:</strong> ${member.phone_number || 'Chưa cập nhật'}</p>
                            <p><strong>Hạng:</strong> <span class="rank-badge rank-${member.rank || 'bronze'}">${this.getRankName(member.rank)}</span></p>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 15px;">Thống kê điểm</h4>
                            <p><strong>Tổng điểm:</strong> <span style="color: #667eea; font-size: 24px; font-weight: bold;">${this.formatNumber(member.total_points || 0)}</span></p>
                            <p><strong>Điểm đã dùng:</strong> ${this.formatNumber(member.points_used || 0)}</p>
                            <p><strong>Điểm khả dụng:</strong> ${this.formatNumber((member.total_points || 0) - (member.points_used || 0))}</p>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 15px;">Lịch sử giao dịch</h4>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${transactions.length > 0 ? transactions.map(tx => `
                            <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="color: ${tx.points > 0 ? '#2ecc71' : '#e74c3c'};">
                                            ${tx.points > 0 ? '+' : ''}${this.formatNumber(tx.points)} điểm
                                        </strong>
                                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                            ${tx.note || this.getTransactionTypeName(tx.type)}
                                        </p>
                                    </div>
                                    <div style="text-align: right; color: #999; font-size: 12px;">
                                        ${this.formatDate(tx.created_at)}
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p style="text-align: center; color: #999; padding: 40px;">Chưa có giao dịch nào</p>'}
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Không thể tải dữ liệu</h3>
                        <p>${response.message || 'Vui lòng thử lại sau'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading member details:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Lỗi kết nối</h3>
                    <p>Không thể tải thông tin thành viên</p>
                </div>
            `;
        }
    },

    /**
     * Đóng modal chi tiết thành viên
     */
    closeMemberDetailsModal() {
        document.getElementById('memberDetailsModal').style.display = 'none';
    },

    /**
     * Lấy tên loại giao dịch
     */
    getTransactionTypeName(type) {
        const types = {
            'attendance': 'Điểm danh',
            'event_participation': 'Tham gia sự kiện',
            'competition_win': 'Thắng giải',
            'achievement': 'Thành tích đặc biệt',
            'referral': 'Giới thiệu thành viên',
            'custom': 'Tùy chỉnh',
            'deduct': 'Trừ điểm'
        };
        return types[type] || type;
    },

    /**
     * Format ngày
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    },

    /**
     * Xuất báo cáo
     */
    async exportPointsReport() {
        try {
            alert('📊 Chức năng xuất báo cáo đang được phát triển...');
            // TODO: Implement export functionality
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('❌ Có lỗi xảy ra khi xuất báo cáo');
        }
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.AdminPoints = AdminPoints;
}

console.log('Admin Points Management module loaded');
