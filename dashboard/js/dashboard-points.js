/**
 * Dashboard Points System Module
 * Quản lý hệ thống tích điểm
 */

const DashboardPoints = {
    currentUser: null,
    userPoints: null,
    allMembers: [], // Thêm dòng này
    
    /**
     * Khởi tạo module
     */
    async init(isAdmin = false) {
        try {
            console.log('DashboardPoints: Starting init, isAdmin:', isAdmin);
            
            this.currentUser = Auth.getCurrentUser();
            if (!this.currentUser) {
                console.error('DashboardPoints: No user found');
                this.showError('Không tìm thấy thông tin người dùng');
                return;
            }
            
            console.log('DashboardPoints: User found:', this.currentUser.email);
            
            await this.loadUserPoints();
            
            console.log('DashboardPoints: User points loaded:', this.userPoints);
            
            if (isAdmin) {
                console.log('DashboardPoints: Rendering admin view');
                await this.renderAdminView();
            } else {
                console.log('DashboardPoints: Rendering user view');
                await this.renderUserView();
            }
            
            console.log('DashboardPoints: Init completed successfully');
            
        } catch (error) {
            console.error('DashboardPoints: Error initializing:', error);
            this.showError('Không thể tải hệ thống tích điểm: ' + error.message);
        }
    },
    
    /**
     * Lấy thông tin điểm của user
     */
    async loadUserPoints() {
        try {
            const response = await apiClient.get(`/api/points/user/${this.currentUser.id}`);
            
            if (response.success) {
                this.userPoints = response.data;
            } else {
                // Tạo mới nếu chưa có
                this.userPoints = {
                    user_id: this.currentUser.id,
                    total_points: 0,
                    available_points: 0,
                    spent_points: 0,
                    rank_level: 'bronze',
                    streak_days: 0
                };
            }
            
        } catch (error) {
            console.error('Error loading user points:', error);
            throw error;
        }
    },
    
    /**
     * Render giao diện cho User (chỉ xem)
     */
    async renderUserView() {
        const container = document.getElementById('points-section') || 
                         document.getElementById('overview-section');
        
        if (!container) return;
        
        const rankInfo = this.getRankInfo(this.userPoints.rank_level);
        const nextRank = this.getNextRank(this.userPoints.total_points);
        
        container.innerHTML = `
            <link rel="stylesheet" href="css/points-system.css">
            
            <div class="points-system-container">
                <!-- Points Overview -->
                <section class="points-overview">
                    <div class="points-card main-points">
                        <div class="points-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Tổng điểm</div>
                            <div class="points-value">${this.userPoints.total_points || 0}</div>
                        </div>
                    </div>

                    <div class="points-card available-points">
                        <div class="points-icon">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Điểm khả dụng</div>
                            <div class="points-value">${this.userPoints.available_points || 0}</div>
                        </div>
                    </div>

                    <div class="points-card spent-points">
                        <div class="points-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Đã đổi quà</div>
                            <div class="points-value">${this.userPoints.spent_points || 0}</div>
                        </div>
                    </div>

                    <div class="points-card rank-card">
                        <div class="rank-badge">
                            ${rankInfo.icon}
                        </div>
                        <div class="points-info">
                            <div class="points-label">Hạng hiện tại</div>
                            <div class="rank-name">${rankInfo.name}</div>
                        </div>
                    </div>
                </section>

                <!-- Rank Progress -->
                <section class="rank-progress-section">
                    <h2><i class="fas fa-chart-line"></i> Tiến độ thăng hạng</h2>
                    ${this.renderRankProgress(nextRank)}
                    ${this.renderRankLevels()}
                </section>

                <!-- Tabs -->
                <div class="tabs">
                    <button class="tab active" onclick="DashboardPoints.showTab('rewards')">
                        <i class="fas fa-gift"></i> Đổi quà
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('history')">
                        <i class="fas fa-history"></i> Lịch sử
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('leaderboard')">
                        <i class="fas fa-trophy"></i> Bảng xếp hạng
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('achievements')">
                        <i class="fas fa-award"></i> Thành tích
                    </button>
                </div>

                <!-- Rewards Tab -->
                <div id="rewards-tab" class="tab-content active">
                    <h2><i class="fas fa-gift"></i> Phần quà đổi điểm</h2>
                    <div id="rewards-content">
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <div>Đang tải phần quà...</div>
                        </div>
                    </div>
                </div>

                <!-- History Tab -->
                <div id="history-tab" class="tab-content">
                    <h2><i class="fas fa-history"></i> Lịch sử tích điểm</h2>
                    <div id="history-content">
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <div>Đang tải lịch sử...</div>
                        </div>
                    </div>
                </div>

                <!-- Leaderboard Tab -->
                <div id="leaderboard-tab" class="tab-content">
                    <h2><i class="fas fa-trophy"></i> Bảng xếp hạng</h2>
                    <div id="leaderboard-content">
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <div>Đang tải bảng xếp hạng...</div>
                        </div>
                    </div>
                </div>

                <!-- Achievements Tab -->
                <div id="achievements-tab" class="tab-content">
                    <h2><i class="fas fa-award"></i> Thành tích</h2>
                    <div id="achievements-content">
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <div>Đang tải thành tích...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load initial tab content
        await this.loadRewards();
    },
    
    /**
     * Render giao diện quản lý cho Admin
     */
    async renderAdminView() {
        const container = document.getElementById('points-section') || 
                         document.getElementById('content-section');
        
        if (!container) return;
        
        container.innerHTML = `
            <link rel="stylesheet" href="css/points-system.css">
            
            <div class="points-system-container">
                <!-- Admin Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 28px;">
                        <i class="fas fa-star"></i> Quản Lý Hệ Thống Tích Điểm
                    </h2>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Quản lý điểm thành viên, phần quà và quy tắc tích điểm</p>
                </div>

                <!-- Admin Stats Overview -->
                <section class="points-overview">
                    <div class="points-card main-points">
                        <div class="points-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Tổng thành viên</div>
                            <div class="points-value" id="totalMembers">-</div>
                        </div>
                    </div>

                    <div class="points-card available-points">
                        <div class="points-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Tổng điểm đã phát</div>
                            <div class="points-value" id="totalPointsIssued">-</div>
                        </div>
                    </div>

                    <div class="points-card spent-points">
                        <div class="points-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Phần quà đã đổi</div>
                            <div class="points-value" id="totalRedemptions">-</div>
                        </div>
                    </div>

                    <div class="points-card rank-card">
                        <div class="rank-badge">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="points-info">
                            <div class="points-label">Hoạt động tháng này</div>
                            <div class="rank-name" id="monthlyActivity">-</div>
                        </div>
                    </div>
                </section>

                <!-- Admin Tabs -->
                <div class="tabs">
                    <button class="tab active" onclick="DashboardPoints.showTab('members')">
                        <i class="fas fa-users"></i> Quản lý thành viên
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('rewards')">
                        <i class="fas fa-gift"></i> Quản lý phần quà
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('leaderboard')">
                        <i class="fas fa-trophy"></i> Bảng xếp hạng
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('rules')">
                        <i class="fas fa-cog"></i> Quy tắc tích điểm
                    </button>
                    <button class="tab" onclick="DashboardPoints.showTab('reports')">
                        <i class="fas fa-chart-bar"></i> Báo cáo
                    </button>
                </div>

                <!-- Members Management Tab -->
                <div id="members-tab" class="tab-content active">
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h2 style="margin: 0;"><i class="fas fa-users"></i> Quản lý điểm thành viên</h2>
                            <button class="btn-redeem" onclick="DashboardPoints.showAddPointsModal()">
                                <i class="fas fa-plus-circle"></i> Thêm điểm
                            </button>
                        </div>
                        
                        <!-- Search and Filter -->
                        <div style="display: grid; grid-template-columns: 1fr 200px; gap: 15px; margin-bottom: 20px;">
                            <input type="text" id="memberSearch" placeholder="Tìm kiếm thành viên..." 
                                   style="padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;"
                                   onkeyup="DashboardPoints.filterMembers()">
                            <select id="rankFilter" style="padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;"
                                    onchange="DashboardPoints.filterMembers()">
                                <option value="">Tất cả hạng</option>
                                <option value="bronze">Đồng</option>
                                <option value="silver">Bạc</option>
                                <option value="gold">Vàng</option>
                                <option value="diamond">Kim Cương</option>
                            </select>
                        </div>
                        
                        <div id="members-list">
                            <div class="loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                <div>Đang tải danh sách thành viên...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rewards Management Tab -->
                <div id="rewards-tab" class="tab-content">
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h2 style="margin: 0;"><i class="fas fa-gift"></i> Quản lý phần quà</h2>
                            <button class="btn-redeem" onclick="alert('Chức năng thêm phần quà đang phát triển')">
                                <i class="fas fa-plus-circle"></i> Thêm phần quà
                            </button>
                        </div>
                        <div id="rewards-content">
                            <div class="loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                <div>Đang tải phần quà...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Leaderboard Tab -->
                <div id="leaderboard-tab" class="tab-content">
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <h2 style="margin: 0 0 25px 0;"><i class="fas fa-trophy"></i> Bảng xếp hạng</h2>
                        <div id="leaderboard-content">
                            <div class="loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                <div>Đang tải bảng xếp hạng...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rules Tab -->
                <div id="rules-tab" class="tab-content">
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <h2 style="margin: 0 0 25px 0;"><i class="fas fa-cog"></i> Quy tắc tích điểm</h2>
                        <div id="rules-content">
                            ${this.renderRulesContent()}
                        </div>
                    </div>
                </div>

                <!-- Reports Tab -->
                <div id="reports-tab" class="tab-content">
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <h2 style="margin: 0 0 25px 0;"><i class="fas fa-chart-bar"></i> Báo cáo thống kê</h2>
                        <div id="reports-content">
                            <p style="text-align: center; color: #999; padding: 40px;">Chức năng báo cáo đang được phát triển</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load initial tab content
        await this.loadMembersList();
        await this.loadAdminStats();
    },
    
    /**
     * Render rank progress
     */
    renderRankProgress(nextRank) {
        if (!nextRank) {
            return `
                <div class="rank-progress-card">
                    <div style="text-align: center; width: 100%;">
                        <h3>🎉 Bạn đã đạt hạng cao nhất!</h3>
                        <p>Tiếp tục duy trì phong độ nhé!</p>
                    </div>
                </div>
            `;
        }
        
        const currentRank = this.getRankInfo(this.userPoints.rank_level);
        const progress = ((this.userPoints.total_points - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        const pointsNeeded = nextRank.min - this.userPoints.total_points;
        
        return `
            <div class="rank-progress-card">
                <div class="current-rank">
                    <div class="rank-icon">${currentRank.icon}</div>
                    <div class="rank-info">
                        <div class="rank-title">${currentRank.name}</div>
                        <div class="rank-points">${this.userPoints.total_points} điểm</div>
                    </div>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">Còn ${pointsNeeded} điểm để lên ${nextRank.name}</div>
                </div>
                
                <div class="next-rank">
                    <div class="rank-icon">${nextRank.icon}</div>
                    <div class="rank-info">
                        <div class="rank-title">${nextRank.name}</div>
                        <div class="rank-points">${nextRank.min} điểm</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render rank levels
     */
    renderRankLevels() {
        const ranks = [
            { level: 'bronze', name: 'Đồng', icon: '🥉', min: 0, max: 29 },
            { level: 'silver', name: 'Bạc', icon: '🥈', min: 30, max: 59 },
            { level: 'gold', name: 'Vàng', icon: '🥇', min: 60, max: 89 },
            { level: 'diamond', name: 'Kim Cương', icon: '💎', min: 90, max: 100 }
        ];
        
        const currentPoints = this.userPoints.total_points;
        
        return `
            <div class="rank-levels">
                ${ranks.map(rank => {
                    let className = 'rank-level';
                    if (currentPoints >= rank.min && currentPoints <= rank.max) {
                        className += ' active';
                    } else if (currentPoints > rank.max) {
                        className += ' completed';
                    }
                    
                    return `
                        <div class="${className}">
                            <div class="rank-icon">${rank.icon}</div>
                            <div class="rank-name">${rank.name}</div>
                            <div class="rank-requirement">${rank.min}-${rank.max}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    /**
     * Load admin statistics
     */
    async loadAdminStats() {
        try {
            // Load leaderboard to get stats
            const response = await apiClient.get('/api/points/leaderboard?limit=1000');
            
            if (response.success) {
                const members = response.data;
                const totalPoints = members.reduce((sum, m) => sum + (m.total_points || 0), 0);
                
                document.getElementById('totalMembers').textContent = members.length;
                document.getElementById('totalPointsIssued').textContent = totalPoints;
                document.getElementById('totalRedemptions').textContent = '0'; // TODO: Get from API
                document.getElementById('monthlyActivity').textContent = members.filter(m => m.total_points > 0).length;
            }
        } catch (error) {
            console.error('Error loading admin stats:', error);
        }
    },
    
    /**
     * Load members list for admin
     */
    async loadMembersList() {
        try {
            const response = await apiClient.get('/api/points/leaderboard?limit=100');
            
            const container = document.getElementById('members-list');
            if (!container) return;
            
            if (!response.success || response.data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Chưa có thành viên nào</p>
                    </div>
                `;
                return;
            }
            
            // Store for filtering
            this.allMembers = response.data;
            this.renderMembersList(response.data);
            
        } catch (error) {
            console.error('Error loading members:', error);
            document.getElementById('members-list').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>Không thể tải danh sách thành viên</p>
                </div>
            `;
        }
    },
    
    /**
     * Render members list
     */
    renderMembersList(members) {
        const container = document.getElementById('members-list');
        if (!container) return;
        
        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #e0e0e0;">
                            <th style="padding: 15px; text-align: left;">Hạng</th>
                            <th style="padding: 15px; text-align: left;">Thành viên</th>
                            <th style="padding: 15px; text-align: center;">Cấp bậc</th>
                            <th style="padding: 15px; text-align: center;">Điểm</th>
                            <th style="padding: 15px; text-align: center;">Thành tích</th>
                            <th style="padding: 15px; text-align: center;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(member => this.renderMemberRow(member)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    /**
     * Render member row
     */
    renderMemberRow(member) {
        const rankInfo = this.getRankInfo(member.rank_level);
        const displayName = member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;
        
        return `
            <tr style="border-bottom: 1px solid #e0e0e0; transition: background 0.3s;" 
                onmouseover="this.style.background='#f8f9fa'" 
                onmouseout="this.style.background='white'">
                <td style="padding: 15px;">
                    <span style="font-weight: bold; color: #667eea;">#${member.rank}</span>
                </td>
                <td style="padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 500;">${displayName}</div>
                            <div style="font-size: 12px; color: #999;">${member.email}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <span style="font-size: 24px;">${rankInfo.icon}</span>
                    <div style="font-size: 12px; color: #666;">${rankInfo.name}</div>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #667eea;">${member.total_points}</div>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 15px; font-size: 12px;">
                        ${member.achievement_count || 0} thành tích
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <button onclick="DashboardPoints.showMemberDetails(${member.user_id})" 
                            style="padding: 8px 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-eye"></i> Chi tiết
                    </button>
                </td>
            </tr>
        `;
    },
    
    /**
     * Filter members
     */
    filterMembers() {
        if (!this.allMembers) return;
        
        const searchTerm = document.getElementById('memberSearch')?.value.toLowerCase() || '';
        const rankFilter = document.getElementById('rankFilter')?.value || '';
        
        let filtered = this.allMembers;
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(m => {
                const name = (m.full_name || m.first_name || m.last_name || m.email || '').toLowerCase();
                return name.includes(searchTerm);
            });
        }
        
        // Filter by rank
        if (rankFilter) {
            filtered = filtered.filter(m => m.rank_level === rankFilter);
        }
        
        this.renderMembersList(filtered);
    },
    
    /**
     * Show member details
     */
    showMemberDetails(userId) {
        alert(`Xem chi tiết thành viên ID: ${userId}\nChức năng đang được phát triển`);
        // TODO: Show modal with member details, history, achievements
    },
    
    /**
     * Show add points modal
     */
    showAddPointsModal() {
        alert('Chức năng thêm điểm cho thành viên đang được phát triển');
        // TODO: Show modal to add points to members
    },
    
    /**
     * Render rules content
     */
    renderRulesContent() {
        return `
            <div style="display: grid; gap: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea;">
                    <h3 style="margin: 0 0 15px 0; color: #667eea;">
                        <i class="fas fa-chart-line"></i> Thang điểm xếp hạng
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px;">🥉</div>
                            <div style="font-weight: bold; margin: 10px 0;">Đồng</div>
                            <div style="color: #666;">0-29 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px;">🥈</div>
                            <div style="font-weight: bold; margin: 10px 0;">Bạc</div>
                            <div style="color: #666;">30-59 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px;">🥇</div>
                            <div style="font-weight: bold; margin: 10px 0;">Vàng</div>
                            <div style="color: #666;">60-89 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px;">💎</div>
                            <div style="font-weight: bold; margin: 10px 0;">Kim Cương</div>
                            <div style="color: #666;">90-100 điểm</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #2ecc71;">
                    <h3 style="margin: 0 0 15px 0; color: #2ecc71;">
                        <i class="fas fa-plus-circle"></i> Cách tích điểm
                    </h3>
                    <div style="display: grid; gap: 10px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>Điểm danh lớp học</span>
                            <span style="font-weight: bold; color: #2ecc71;">+10 điểm</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>Tham gia sự kiện</span>
                            <span style="font-weight: bold; color: #2ecc71;">+20 điểm</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>Thi đấu giải võ</span>
                            <span style="font-weight: bold; color: #2ecc71;">+50 điểm</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>Giới thiệu thành viên mới</span>
                            <span style="font-weight: bold; color: #2ecc71;">+30 điểm</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>Hoàn thành bài tập</span>
                            <span style="font-weight: bold; color: #2ecc71;">+15 điểm</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span>Đạt thành tích xuất sắc</span>
                            <span style="font-weight: bold; color: #f39c12;">+100 điểm (tối đa)</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #e74c3c;">
                    <h3 style="margin: 0 0 15px 0; color: #e74c3c;">
                        <i class="fas fa-gift"></i> Phần quà đổi điểm
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-weight: bold;">Bình nước CLB</div>
                            <div style="color: #667eea; font-weight: bold;">15 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-weight: bold;">Áo CLB</div>
                            <div style="color: #667eea; font-weight: bold;">30 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-weight: bold;">Găng tay võ</div>
                            <div style="color: #667eea; font-weight: bold;">50 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-weight: bold;">Đai võ</div>
                            <div style="color: #667eea; font-weight: bold;">70 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-weight: bold;">Giảm 50% học phí</div>
                            <div style="color: #667eea; font-weight: bold;">85 điểm</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-weight: bold;">Khóa học miễn phí</div>
                            <div style="color: #f39c12; font-weight: bold;">100 điểm</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Load phần quà
     */
    async loadRewards() {
        try {
            const response = await apiClient.get('/api/points/rewards');
            
            const container = document.getElementById('rewards-content');
            if (!container) return;
            
            if (!response.success || response.data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-gift" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Chưa có phần quà nào</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="rewards-grid">
                    ${response.data.map(reward => this.renderReward(reward)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading rewards:', error);
            document.getElementById('rewards-content').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>Không thể tải danh sách phần quà</p>
                </div>
            `;
        }
    },
    
    /**
     * Render reward card
     */
    renderReward(reward) {
        const iconMap = {
            'Bình nước CLB': 'fa-water',
            'Áo CLB': 'fa-tshirt',
            'Túi tập võ': 'fa-shopping-bag',
            'Găng tay võ': 'fa-hand-rock',
            'Voucher': 'fa-ticket-alt',
            'Đai võ': 'fa-ribbon',
            'Giảm': 'fa-percent',
            'Khóa học': 'fa-graduation-cap',
            'Buổi tập': 'fa-user-tie'
        };
        
        let icon = 'fa-gift';
        for (const [key, value] of Object.entries(iconMap)) {
            if (reward.name.includes(key)) {
                icon = value;
                break;
            }
        }
        
        const canRedeem = this.userPoints.available_points >= reward.points_required;
        const featuredClass = reward.points_required >= 85 ? 'featured' : '';
        const featuredBadge = reward.points_required >= 100 ? '<div class="featured-badge">VIP</div>' : 
                             reward.points_required >= 85 ? '<div class="featured-badge">HOT</div>' : '';
        
        return `
            <div class="reward-card ${featuredClass}">
                ${featuredBadge}
                <div class="reward-image">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="reward-info">
                    <h3>${reward.name}</h3>
                    <p>${reward.description || 'Phần quà hấp dẫn'}</p>
                    <div class="reward-points">
                        <i class="fas fa-coins"></i> ${reward.points_required} điểm
                    </div>
                    <button class="btn-redeem ${canRedeem ? '' : 'disabled'}" 
                            onclick="DashboardPoints.redeemReward(${reward.id})"
                            ${canRedeem ? '' : 'disabled'}>
                        ${canRedeem ? 'Đổi ngay' : 'Chưa đủ điểm'}
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Đổi quà
     */
    async redeemReward(rewardId) {
        if (confirm('Bạn có chắc muốn đổi phần quà này?')) {
            alert('Chức năng đổi quà đang được phát triển');
            // TODO: Implement reward redemption
        }
    },
    
    /**
     * Load lịch sử giao dịch
     */
    async loadHistory() {
        try {
            const response = await apiClient.get(`/api/points/transactions/${this.currentUser.id}?limit=20`);
            
            const container = document.getElementById('history-content');
            if (!container) return;
            
            if (!response.success || response.data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Chưa có lịch sử giao dịch</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="history-list">
                    ${response.data.map(tx => this.renderHistoryItem(tx)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading history:', error);
            document.getElementById('history-content').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>Không thể tải lịch sử giao dịch</p>
                </div>
            `;
        }
    },
    
    /**
     * Render history item
     */
    renderHistoryItem(tx) {
        const typeClass = tx.type === 'earn' ? 'earn' : 'spend';
        const icon = tx.type === 'earn' ? 'fa-plus-circle' : 'fa-minus-circle';
        const sign = tx.type === 'earn' ? '+' : '-';
        const date = new Date(tx.created_at).toLocaleDateString('vi-VN');
        
        return `
            <div class="history-item ${typeClass}">
                <div class="history-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="history-info">
                    <div class="history-title">${tx.description}</div>
                    <div class="history-date">${date}</div>
                </div>
                <div class="history-points">${sign}${tx.points}</div>
            </div>
        `;
    },
    
    /**
     * Load bảng xếp hạng
     */
    async loadLeaderboard() {
        try {
            const response = await apiClient.get('/api/points/leaderboard?limit=50');
            
            const container = document.getElementById('leaderboard-content');
            if (!container) return;
            
            if (!response.success || response.data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-trophy" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Chưa có dữ liệu xếp hạng</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="leaderboard-list">
                    ${response.data.map(user => this.renderLeaderboardItem(user)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            document.getElementById('leaderboard-content').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>Không thể tải bảng xếp hạng</p>
                </div>
            `;
        }
    },
    
    /**
     * Render leaderboard item
     */
    renderLeaderboardItem(user) {
        const rankClass = user.rank <= 3 ? `rank-${user.rank}` : '';
        const isCurrentUser = user.user_id === this.currentUser.id;
        const currentUserClass = isCurrentUser ? 'current-user' : '';
        const rankInfo = this.getRankInfo(user.rank_level);
        const displayName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        
        return `
            <div class="leaderboard-item ${rankClass} ${currentUserClass}">
                <div class="rank-number">${user.rank}</div>
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-info">
                    <div class="user-name">${displayName}${isCurrentUser ? ' (Bạn)' : ''}</div>
                    <div class="user-rank">${rankInfo.icon} ${rankInfo.name}</div>
                </div>
                <div class="user-points">${user.total_points} điểm</div>
            </div>
        `;
    },
    
    /**
     * Load thành tích
     */
    async loadAchievements() {
        try {
            const response = await apiClient.get(`/api/points/user-achievements/${this.currentUser.id}`);
            
            const container = document.getElementById('achievements-content');
            if (!container) return;
            
            if (!response.success || response.data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-award" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Chưa có thành tích nào</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="achievements-grid">
                    ${response.data.map(achievement => this.renderAchievement(achievement)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading achievements:', error);
            document.getElementById('achievements-content').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>Không thể tải thành tích</p>
                </div>
            `;
        }
    },
    
    /**
     * Render achievement
     */
    renderAchievement(achievement) {
        const statusClass = achievement.is_earned ? 'earned' : 'locked';
        const badge = achievement.is_earned ? '<div class="achievement-badge">✓</div>' : '<div class="achievement-lock">🔒</div>';
        
        return `
            <div class="achievement-card ${statusClass}">
                <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-points">+${achievement.points_reward} điểm</div>
                </div>
                ${badge}
            </div>
        `;
    },
    
    /**
     * Show tab
     */
    async showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active from all tab buttons
        document.querySelectorAll('.tabs .tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        // Load content if needed
        if (tabName === 'members') {
            await this.loadMembersList();
        } else if (tabName === 'rewards') {
            await this.loadRewards();
        } else if (tabName === 'history') {
            await this.loadHistory();
        } else if (tabName === 'leaderboard') {
            await this.loadLeaderboard();
        } else if (tabName === 'achievements') {
            await this.loadAchievements();
        }
    },
    
    /**
     * Show admin tab
     */
    showAdminTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active from all tab buttons
        document.querySelectorAll('.tabs .tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`admin-${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    },
    
    /**
     * Get rank info
     */
    getRankInfo(rankLevel) {
        const ranks = {
            bronze: { name: 'Đồng', icon: '🥉', min: 0, max: 29 },
            silver: { name: 'Bạc', icon: '🥈', min: 30, max: 59 },
            gold: { name: 'Vàng', icon: '🥇', min: 60, max: 89 },
            diamond: { name: 'Kim Cương', icon: '💎', min: 90, max: 100 }
        };
        
        return ranks[rankLevel] || ranks.bronze;
    },
    
    /**
     * Get next rank
     */
    getNextRank(currentPoints) {
        if (currentPoints < 30) return { name: 'Bạc', icon: '🥈', min: 30 };
        if (currentPoints < 60) return { name: 'Vàng', icon: '🥇', min: 60 };
        if (currentPoints < 90) return { name: 'Kim Cương', icon: '💎', min: 90 };
        return null; // Max rank
    },
    
    /**
     * Show error
     */
    showError(message) {
        console.error('DashboardPoints Error:', message);
        
        const container = document.getElementById('points-section') || 
                         document.getElementById('points-content');
        
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; background: white; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <div style="font-size: 64px; color: #e74c3c; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 15px;">Lỗi tải hệ thống tích điểm</h3>
                    <p style="color: #666; margin-bottom: 20px;">${message}</p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        <i class="fas fa-redo"></i> Thử lại
                    </button>
                </div>
            `;
        }
    }
};
