/**
 * User Content Module
 * Hiển thị thông báo và tin tức cho user
 */

class UserContentManager {
    constructor() {
        this.announcements = [];
        this.news = [];
        this.stats = null;
        this.isInitialized = false; // Prevent multiple initializations
    }
    
    async init() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('UserContent already initialized, skipping...');
            return;
        }
        
        console.log('Initializing user content...');
        this.isInitialized = true;
        
        await this.loadDashboardStats();
        await this.loadAnnouncements();
        await this.loadNews();
        await this.loadRecentActivities();
    }
    
    async loadDashboardStats() {
        try {
            const token = Auth.getToken();
            if (!token) {
                console.log('No auth token, skipping stats load');
                return;
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/content/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.stats = result.data.stats;
                this.renderStats();
            } else {
                console.error('Failed to load stats:', result.message);
            }
        } catch (error) {
            console.error('Load dashboard stats error:', error);
            // Don't throw error, just log it
        }
    }
    
    async loadAnnouncements() {
        try {
            const token = Auth.getToken();
            if (!token) {
                console.log('No auth token, skipping announcements load');
                return;
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/content/announcements?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.announcements = result.data.announcements;
                this.renderAnnouncements();
            } else {
                console.error('Failed to load announcements:', result.message);
            }
        } catch (error) {
            console.error('Load announcements error:', error);
            // Don't throw error, just log it
        }
    }
    
    async loadNews() {
        try {
            const token = Auth.getToken();
            if (!token) {
                console.log('No auth token, skipping news load');
                return;
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/content/news?limit=6`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.news = result.data.news;
                this.renderNews();
            } else {
                console.error('Failed to load news:', result.message);
            }
        } catch (error) {
            console.error('Load news error:', error);
            // Don't throw error, just log it
        }
    }
    
    async loadRecentActivities() {
        try {
            const token = Auth.getToken();
            if (!token) {
                console.log('No auth token, skipping activities load');
                return;
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/content/recent-activities?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.renderRecentActivities(result.data.activities);
            } else {
                console.error('Failed to load activities:', result.message);
            }
        } catch (error) {
            console.error('Load recent activities error:', error);
            // Don't throw error, just log it
        }
    }
    
    renderStats() {
        if (!this.stats) return;
        
        const statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${this.stats.enrolledClasses}</div>
                        <div class="stat-label">Lớp học đang tham gia</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${this.stats.upcomingEvents}</div>
                        <div class="stat-label">Sự kiện sắp tới</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${this.stats.attendanceRate}%</div>
                        <div class="stat-label">Tỷ lệ tham gia</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${this.stats.unreadNotifications}</div>
                        <div class="stat-label">Thông báo mới</div>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('dashboard-stats');
        if (container) {
            container.innerHTML = statsHTML;
        }
    }
    
    renderAnnouncements() {
        const container = document.getElementById('announcements-container');
        if (!container) return;
        
        if (this.announcements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <p>Không có thông báo mới</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="announcements-list">
                ${this.announcements.map(announcement => `
                    <div class="announcement-item ${this.getPriorityClass(announcement.priority)}">
                        <div class="announcement-header">
                            <div class="announcement-type">
                                <i class="${this.getTypeIcon(announcement.type)}"></i>
                                ${this.getTypeLabel(announcement.type)}
                            </div>
                            <div class="announcement-date">
                                ${this.formatDate(announcement.created_at)}
                            </div>
                        </div>
                        <div class="announcement-title">${this.escapeHtml(announcement.title)}</div>
                        <div class="announcement-content">${this.escapeHtml(announcement.content)}</div>
                        ${announcement.expires_at ? `
                            <div class="announcement-expires">
                                <i class="fas fa-clock"></i> Hết hạn: ${this.formatDate(announcement.expires_at)}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderNews() {
        const container = document.getElementById('news-container');
        if (!container) return;
        
        if (this.news.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>Không có tin tức mới</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="news-grid">
                ${this.news.map(newsItem => `
                    <div class="news-card" onclick="userContent.viewNews(${newsItem.id})">
                        ${newsItem.featured_image ? `
                            <div class="news-image" style="background-image: url('${newsItem.featured_image}')"></div>
                        ` : `
                            <div class="news-image news-image-placeholder">
                                <i class="fas fa-newspaper"></i>
                            </div>
                        `}
                        <div class="news-content">
                            <div class="news-category">${this.getCategoryLabel(newsItem.category)}</div>
                            <div class="news-title">${this.escapeHtml(newsItem.title)}</div>
                            <div class="news-excerpt">${this.escapeHtml(newsItem.excerpt || '')}</div>
                            <div class="news-meta">
                                <span><i class="fas fa-user"></i> ${newsItem.first_name} ${newsItem.last_name}</span>
                                <span><i class="fas fa-eye"></i> ${newsItem.views}</span>
                                <span><i class="fas fa-clock"></i> ${this.formatDate(newsItem.published_at)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderRecentActivities(activities) {
        const container = document.getElementById('recent-activities-container');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Chưa có hoạt động nào</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="activities-list">
                ${activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon ${activity.type}">
                            <i class="fas fa-${activity.type === 'attendance' ? 'check-circle' : 'calendar'}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${this.escapeHtml(activity.title)}</div>
                            <div class="activity-date">${this.formatDate(activity.date)}</div>
                        </div>
                        <div class="activity-status ${activity.status}">
                            ${this.getStatusLabel(activity.status)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    async viewNews(id) {
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/content/news/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNewsModal(result.data.news);
            }
        } catch (error) {
            console.error('View news error:', error);
            alert('Lỗi khi xem tin tức');
        }
    }
    
    showNewsModal(news) {
        const modal = document.createElement('div');
        modal.className = 'news-modal';
        modal.innerHTML = `
            <div class="news-modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="news-modal-content">
                <button class="news-modal-close" onclick="this.closest('.news-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                ${news.featured_image ? `
                    <img src="${news.featured_image}" alt="${this.escapeHtml(news.title)}" class="news-modal-image">
                ` : ''}
                <div class="news-modal-header">
                    <div class="news-modal-category">${this.getCategoryLabel(news.category)}</div>
                    <h2 class="news-modal-title">${this.escapeHtml(news.title)}</h2>
                    <div class="news-modal-meta">
                        <span><i class="fas fa-user"></i> ${news.first_name} ${news.last_name}</span>
                        <span><i class="fas fa-clock"></i> ${this.formatDate(news.published_at)}</span>
                        <span><i class="fas fa-eye"></i> ${news.views} lượt xem</span>
                    </div>
                </div>
                <div class="news-modal-body">
                    ${this.formatContent(news.content)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Helper functions
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatContent(content) {
        return content.replace(/\n/g, '<br>');
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return `${minutes} phút trước`;
            }
            return `${hours} giờ trước`;
        } else if (days === 1) {
            return 'Hôm qua';
        } else if (days < 7) {
            return `${days} ngày trước`;
        }
        
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    getPriorityClass(priority) {
        const classes = {
            'urgent': 'priority-urgent',
            'high': 'priority-high',
            'normal': 'priority-normal',
            'low': 'priority-low'
        };
        return classes[priority] || 'priority-normal';
    }
    
    getTypeIcon(type) {
        const icons = {
            'general': 'fas fa-info-circle',
            'urgent': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle',
            'warning': 'fas fa-exclamation-circle'
        };
        return icons[type] || 'fas fa-info-circle';
    }
    
    getTypeLabel(type) {
        const labels = {
            'general': 'Thông thường',
            'urgent': 'Khẩn cấp',
            'info': 'Thông tin',
            'warning': 'Cảnh báo'
        };
        return labels[type] || type;
    }
    
    getCategoryLabel(category) {
        const labels = {
            'general': 'Chung',
            'event': 'Sự kiện',
            'achievement': 'Thành tích',
            'training': 'Đào tạo'
        };
        return labels[category] || category;
    }
    
    getStatusLabel(status) {
        const labels = {
            'present': 'Có mặt',
            'absent': 'Vắng mặt',
            'late': 'Đi muộn',
            'registered': 'Đã đăng ký',
            'attended': 'Đã tham gia',
            'cancelled': 'Đã hủy'
        };
        return labels[status] || status;
    }
}

// Create global instance
const userContent = new UserContentManager();
