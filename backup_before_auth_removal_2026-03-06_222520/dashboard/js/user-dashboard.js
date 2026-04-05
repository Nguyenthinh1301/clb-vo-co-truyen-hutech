/**
 * User Dashboard Module
 * Dashboard dành cho thành viên thường
 * Wrapped in IIFE to avoid global namespace pollution
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let currentSection = 'overview';
    let isInitialized = false; // Prevent multiple initializations

    /**
     * Khởi tạo dashboard
     */
    document.addEventListener('DOMContentLoaded', async function() {
        // Prevent multiple initializations
        if (isInitialized) {
            console.log('Dashboard already initialized, skipping...');
            return;
        }
        
        console.log('Initializing user dashboard...');
        
        // Check authentication
        if (!Auth.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = '../website/views/account/dang-nhap.html';
            return;
        }
        
        // Get current user
        currentUser = Auth.getCurrentUser();
        console.log('Current user:', currentUser);
        
        // Check if user is member (not admin)
        if (currentUser && currentUser.role === 'admin') {
            console.log('User is admin, redirecting to admin dashboard...');
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Mark as initialized
        isInitialized = true;
        
        // Load user info
        loadUserInfo();
        
        // Load overview
        loadOverview();
    });

    /**
     * Load thông tin user
     */
    function loadUserInfo() {
        if (!currentUser) return;
        
        // Use full_name from backend if available, otherwise construct from first_name and last_name
        const fullName = currentUser.full_name || 
                        `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 
                        currentUser.username || 
                        currentUser.email;
        
        console.log('Loading user info:', { fullName, currentUser });
        
        // Use full name for both userName and userFullName
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userFullName').textContent = fullName;
    }

    /**
     * Show section - Exposed to global scope for onclick handlers
     */
    window.UserDashboard_showSection = function(sectionName, event) {
        // Prevent default link behavior
        if (event) {
            event.preventDefault();
        }
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionName + '-section').classList.add('active');
        
        // Add active to clicked tab
        if (event && event.target) {
            event.target.closest('.nav-tab').classList.add('active');
        } else {
            // If no event, find and activate the tab by section name
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach(tab => {
                if (tab.getAttribute('onclick')?.includes(sectionName)) {
                    tab.classList.add('active');
                }
            });
        }
        
        currentSection = sectionName;
        
        // Load section data
        switch(sectionName) {
            case 'overview':
                loadOverview();
                break;
            case 'profile':
                loadProfile();
                break;
            case 'classes':
                loadMyClasses();
                break;
            case 'events':
                loadEvents();
                break;
            case 'schedule':
                loadSchedule();
                break;
            case 'points':
                loadPoints();
                break;
            case 'notifications':
                loadNotifications();
                break;
        }
    };

/**
 * Load overview
 */
async function loadOverview() {
    const content = document.getElementById('overview-section');
    
    content.innerHTML = `
        <div class="welcome-card">
            <div class="welcome-content">
                <h2>👋 Chào mừng đến với CLB Võ Cổ Truyền HUTECH!</h2>
                <p>Đây là trang quản lý cá nhân của bạn. Bạn có thể xem thông tin lớp học, sự kiện và lịch tập tại đây.</p>
            </div>
            <div class="welcome-actions">
                <button class="btn-action" onclick="UserDashboard_showSection('classes', event)">
                    <i class="fas fa-graduation-cap"></i>
                    <span>Xem lớp học</span>
                </button>
                <button class="btn-action" onclick="UserDashboard_showSection('events', event)">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Xem sự kiện</span>
                </button>
            </div>
        </div>
        
        <div class="quick-stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="myClassesCount">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="stat-label">Lớp học của tôi</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="upcomingEventsCount">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="stat-label">Sự kiện sắp tới</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="unreadNotifications">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="stat-label">Thông báo mới</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="recent-section">
                <h3><i class="fas fa-clock"></i> Hoạt động gần đây</h3>
                <div class="activity-list" id="recentActivity">
                    <div class="loading-state-small">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
            
            <div class="upcoming-section">
                <h3><i class="fas fa-calendar-day"></i> Sắp diễn ra</h3>
                <div class="upcoming-list" id="upcomingItems">
                    <div class="loading-state-small">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load stats and activities
    loadOverviewStats();
    loadRecentActivity();
    loadUpcomingItems();
}

/**
 * Load overview stats
 */
async function loadOverviewStats() {
    try {
        const response = await apiClient.get('/api/user/stats');
        
        if (response.success) {
            const stats = response.data;
            document.getElementById('myClassesCount').textContent = stats.classCount;
            document.getElementById('upcomingEventsCount').textContent = stats.upcomingEventCount;
            document.getElementById('unreadNotifications').textContent = stats.unreadNotificationCount;
            
            // Update notification badge
            updateNotificationBadge(stats.unreadNotificationCount);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('myClassesCount').textContent = '0';
        document.getElementById('upcomingEventsCount').textContent = '0';
        document.getElementById('unreadNotifications').textContent = '0';
    }
}

/**
 * Update notification badge
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Load profile
 */
async function loadProfile() {
    const content = document.getElementById('profile-content');
    
    try {
        const response = await apiClient.get('/api/user/profile');
        
        if (response.success) {
            const user = response.data;
            
            content.innerHTML = `
                <div class="profile-header">
                    <h2><i class="fas fa-user"></i> Thông tin cá nhân</h2>
                    <p class="subtitle">Xem thông tin tài khoản của bạn</p>
                </div>
                
                <div class="profile-card">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            ${user.avatar ? `<img src="${user.avatar}" alt="Avatar">` : '<i class="fas fa-user"></i>'}
                        </div>
                        <h3>${user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</h3>
                        <p class="profile-role">Thành viên</p>
                        ${user.belt_level ? `<p class="profile-belt"><i class="fas fa-award"></i> ${user.belt_level}</p>` : ''}
                    </div>
                    
                    <div class="profile-info-grid">
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${user.email || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Số điện thoại:</span>
                            <span class="info-value">${user.phone_number || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Ngày sinh:</span>
                            <span class="info-value">${user.date_of_birth ? formatDate(user.date_of_birth) : 'Chưa cập nhật'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Giới tính:</span>
                            <span class="info-value">${formatGender(user.gender)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Địa chỉ:</span>
                            <span class="info-value">${user.address || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Trạng thái:</span>
                            <span class="info-value">
                                <span class="badge badge-${user.membership_status === 'active' ? 'success' : 'warning'}">
                                    ${formatMembershipStatus(user.membership_status)}
                                </span>
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Ngày tham gia:</span>
                            <span class="info-value">${formatDate(user.created_at)}</span>
                        </div>
                    </div>
                    
                    <div class="profile-note">
                        <i class="fas fa-info-circle"></i>
                        <p>Để cập nhật thông tin cá nhân, vui lòng liên hệ với quản trị viên.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        content.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không thể tải thông tin</h3>
                <p>${error.message || 'Vui lòng thử lại sau'}</p>
            </div>
        `;
    }
}

/**
 * Load my classes
 */
async function loadMyClasses() {
    const content = document.getElementById('classes-content');
    
    content.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-graduation-cap"></i> Lớp học của tôi</h2>
            <p class="subtitle">Danh sách lớp học bạn đã đăng ký</p>
        </div>
        
        <div class="classes-grid">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải...</p>
            </div>
        </div>
    `;
    
    try {
        const response = await apiClient.get('/api/user/classes');
        
        if (response.success) {
            const classes = response.data;
            
            if (classes.length === 0) {
                content.innerHTML = `
                    <div class="section-header">
                        <h2><i class="fas fa-graduation-cap"></i> Lớp học của tôi</h2>
                        <p class="subtitle">Danh sách lớp học bạn đã đăng ký</p>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-graduation-cap"></i>
                        <h3>Chưa đăng ký lớp nào</h3>
                        <p>Bạn chưa đăng ký lớp học nào. Liên hệ quản trị viên để đăng ký.</p>
                    </div>
                `;
                return;
            }
            
            const classesHTML = classes.map(cls => `
                <div class="class-card">
                    <div class="class-header">
                        <h3>${cls.name}</h3>
                        <span class="badge badge-${cls.status === 'active' ? 'success' : 'secondary'}">
                            ${formatClassStatus(cls.status)}
                        </span>
                    </div>
                    <div class="class-body">
                        <p class="class-description">${cls.description || 'Không có mô tả'}</p>
                        <div class="class-info">
                            <div class="info-item">
                                <i class="fas fa-user-tie"></i>
                                <span>Giảng viên: ${cls.instructor_name || 'Chưa có'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>${cls.schedule || 'Chưa có lịch'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${cls.location || 'Chưa có địa điểm'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <span>Đăng ký: ${formatDate(cls.enrolled_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-graduation-cap"></i> Lớp học của tôi</h2>
                    <p class="subtitle">Danh sách lớp học bạn đã đăng ký</p>
                </div>
                <div class="classes-grid">
                    ${classesHTML}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        content.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-graduation-cap"></i> Lớp học của tôi</h2>
                <p class="subtitle">Danh sách lớp học bạn đã đăng ký</p>
            </div>
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không thể tải danh sách lớp</h3>
                <p>${error.message || 'Vui lòng thử lại sau'}</p>
            </div>
        `;
    }
}

/**
 * Load events
 */
async function loadEvents() {
    const content = document.getElementById('events-content');
    
    content.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-calendar-alt"></i> Sự kiện</h2>
            <p class="subtitle">Các sự kiện sắp diễn ra</p>
        </div>
        
        <div class="events-list">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải...</p>
            </div>
        </div>
    `;
    
    try {
        const response = await apiClient.get('/api/user/events');
        
        if (response.success) {
            const events = response.data;
            
            if (events.length === 0) {
                content.innerHTML = `
                    <div class="section-header">
                        <h2><i class="fas fa-calendar-alt"></i> Sự kiện</h2>
                        <p class="subtitle">Các sự kiện sắp diễn ra</p>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>Chưa có sự kiện nào</h3>
                        <p>Các sự kiện sẽ được cập nhật tại đây</p>
                    </div>
                `;
                return;
            }
            
            const eventsHTML = events.map(event => `
                <div class="event-card">
                    <div class="event-date">
                        <div class="date-day">${new Date(event.date).getDate()}</div>
                        <div class="date-month">Tháng ${new Date(event.date).getMonth() + 1}</div>
                    </div>
                    <div class="event-content">
                        <h3>${event.name}</h3>
                        <p class="event-description">${event.description || 'Không có mô tả'}</p>
                        <div class="event-info">
                            <div class="info-item">
                                <i class="fas fa-tag"></i>
                                <span>${formatEventType(event.type)}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.location || 'Chưa có địa điểm'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>${event.start_time || ''} - ${event.end_time || ''}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-users"></i>
                                <span>${event.current_participants || 0}/${event.max_participants || '∞'} người</span>
                            </div>
                        </div>
                        ${event.is_registered ? `
                            <div class="event-registered">
                                <i class="fas fa-check-circle"></i>
                                <span>Đã đăng ký</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-calendar-alt"></i> Sự kiện</h2>
                    <p class="subtitle">Các sự kiện sắp diễn ra</p>
                </div>
                <div class="events-list">
                    ${eventsHTML}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading events:', error);
        content.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-calendar-alt"></i> Sự kiện</h2>
                <p class="subtitle">Các sự kiện sắp diễn ra</p>
            </div>
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không thể tải danh sách sự kiện</h3>
                <p>${error.message || 'Vui lòng thử lại sau'}</p>
            </div>
        `;
    }
}

/**
 * Load schedule
 */
async function loadSchedule() {
    const content = document.getElementById('schedule-content');
    
    content.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-clock"></i> Lịch tập</h2>
            <p class="subtitle">Lịch tập luyện của bạn</p>
        </div>
        
        <div class="schedule-calendar">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải...</p>
            </div>
        </div>
    `;
    
    try {
        // Get current month and year
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        const response = await apiClient.get(`/api/user/schedule?month=${month}&year=${year}`);
        
        if (response.success) {
            const schedule = response.data;
            
            if (schedule.length === 0) {
                content.innerHTML = `
                    <div class="section-header">
                        <h2><i class="fas fa-clock"></i> Lịch tập</h2>
                        <p class="subtitle">Lịch tập luyện của bạn</p>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        <h3>Chưa có lịch tập</h3>
                        <p>Lịch tập sẽ được cập nhật sau khi bạn đăng ký lớp</p>
                    </div>
                `;
                return;
            }
            
            const scheduleHTML = schedule.map(item => `
                <div class="schedule-item">
                    <div class="schedule-date">
                        <div class="date-day">${new Date(item.date).getDate()}</div>
                        <div class="date-month">Tháng ${new Date(item.date).getMonth() + 1}</div>
                    </div>
                    <div class="schedule-content">
                        <h4>${item.class_name}</h4>
                        <div class="schedule-info">
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>${item.class_schedule}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${item.location}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-${getAttendanceIcon(item.status)}"></i>
                                <span class="status-${item.status}">${formatAttendanceStatus(item.status)}</span>
                            </div>
                        </div>
                        ${item.notes ? `<p class="schedule-notes">${item.notes}</p>` : ''}
                    </div>
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-clock"></i> Lịch tập</h2>
                    <p class="subtitle">Lịch tập luyện tháng ${month}/${year}</p>
                </div>
                <div class="schedule-list">
                    ${scheduleHTML}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        content.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-clock"></i> Lịch tập</h2>
                <p class="subtitle">Lịch tập luyện của bạn</p>
            </div>
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không thể tải lịch tập</h3>
                <p>${error.message || 'Vui lòng thử lại sau'}</p>
            </div>
        `;
    }
}

/**
 * Load points system
 */
async function loadPoints() {
    const content = document.getElementById('points-content');
    
    content.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Đang tải hệ thống tích điểm...</p>
        </div>
    `;
    
    try {
        // Load HTML content from file
        const response = await fetch('points-content.html');
        const html = await response.text();
        content.innerHTML = html;
        console.log('Points content loaded successfully for user');
    } catch (error) {
        console.error('Error loading points:', error);
        content.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không thể tải hệ thống tích điểm</h3>
                <p>${error.message || 'Vui lòng thử lại sau'}</p>
                <button onclick="loadPoints()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
            </div>
        `;
    }
}

/**
 * Load notifications
 */
async function loadNotifications() {
    const content = document.getElementById('notifications-content');
    
    content.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-bell"></i> Thông báo</h2>
            <p class="subtitle">Các thông báo từ CLB</p>
        </div>
        
        <div class="notifications-list">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải...</p>
            </div>
        </div>
    `;
    
    try {
        const response = await apiClient.get('/api/user/notifications');
        
        if (response.success) {
            const { notifications, unreadCount } = response.data;
            
            if (notifications.length === 0) {
                content.innerHTML = `
                    <div class="section-header">
                        <h2><i class="fas fa-bell"></i> Thông báo</h2>
                        <p class="subtitle">Các thông báo từ CLB</p>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <h3>Chưa có thông báo</h3>
                        <p>Bạn chưa có thông báo nào</p>
                    </div>
                `;
                return;
            }
            
            const notificationsHTML = notifications.map(notif => `
                <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="markAsRead(${notif.id})">
                    <div class="notification-icon ${notif.type || 'info'}">
                        <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <h4>${notif.title}</h4>
                        <p>${notif.message}</p>
                        <span class="notification-time">${formatTimeAgo(notif.created_at)}</span>
                    </div>
                    ${!notif.is_read ? '<div class="unread-badge"></div>' : ''}
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-bell"></i> Thông báo</h2>
                    <p class="subtitle">Các thông báo từ CLB ${unreadCount > 0 ? `<span class="badge badge-danger">${unreadCount} mới</span>` : ''}</p>
                </div>
                <div class="notifications-list">
                    ${notificationsHTML}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        content.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-bell"></i> Thông báo</h2>
                <p class="subtitle">Các thông báo từ CLB</p>
            </div>
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không thể tải thông báo</h3>
                <p>${error.message || 'Vui lòng thử lại sau'}</p>
            </div>
        `;
    }
}

/**
 * Format date
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Chưa cập nhật';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Simple notification
    alert(message);
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId) {
    try {
        await apiClient.put(`/api/user/notifications/${notificationId}/read`);
        // Reload notifications
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Format gender
 */
function formatGender(gender) {
    const genderMap = {
        'male': 'Nam',
        'female': 'Nữ',
        'other': 'Khác'
    };
    return genderMap[gender] || 'Chưa cập nhật';
}

/**
 * Format membership status
 */
function formatMembershipStatus(status) {
    const statusMap = {
        'active': 'Đang hoạt động',
        'inactive': 'Không hoạt động',
        'suspended': 'Tạm ngưng',
        'pending': 'Chờ duyệt'
    };
    return statusMap[status] || status;
}

/**
 * Format class status
 */
function formatClassStatus(status) {
    const statusMap = {
        'active': 'Đang học',
        'completed': 'Đã hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

/**
 * Format event type
 */
function formatEventType(type) {
    const typeMap = {
        'tournament': 'Giải đấu',
        'demonstration': 'Biểu diễn',
        'workshop': 'Hội thảo',
        'seminar': 'Tọa đàm',
        'other': 'Khác'
    };
    return typeMap[type] || type;
}

/**
 * Get notification icon
 */
function getNotificationIcon(type) {
    const iconMap = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return iconMap[type] || 'bell';
}

/**
 * Format time ago
 */
function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return formatDate(dateStr);
}

/**
 * Format attendance status
 */
function formatAttendanceStatus(status) {
    const statusMap = {
        'present': 'Có mặt',
        'absent': 'Vắng mặt',
        'late': 'Đi muộn',
        'excused': 'Có phép'
    };
    return statusMap[status] || status;
}

/**
 * Get attendance icon
 */
function getAttendanceIcon(status) {
    const iconMap = {
        'present': 'check-circle',
        'absent': 'times-circle',
        'late': 'clock',
        'excused': 'info-circle'
    };
    return iconMap[status] || 'question-circle';
}

/**
 * Load recent activity
 */
async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    
    try {
        // Get recent classes and events
        const [classesRes, eventsRes] = await Promise.all([
            apiClient.get('/api/user/classes'),
            apiClient.get('/api/user/events')
        ]);
        
        const activities = [];
        
        // Add recent class enrollments
        if (classesRes.success && classesRes.data.length > 0) {
            classesRes.data.slice(0, 2).forEach(cls => {
                activities.push({
                    icon: 'graduation-cap',
                    text: `Đã đăng ký lớp "${cls.name}"`,
                    time: cls.enrolled_at,
                    type: 'class'
                });
            });
        }
        
        // Add upcoming events
        if (eventsRes.success && eventsRes.data.length > 0) {
            eventsRes.data.slice(0, 2).forEach(event => {
                if (event.is_registered) {
                    activities.push({
                        icon: 'calendar-check',
                        text: `Đã đăng ký sự kiện "${event.name}"`,
                        time: event.date,
                        type: 'event'
                    });
                }
            });
        }
        
        // Sort by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-inbox"></i>
                    <p>Chưa có hoạt động nào</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <i class="fas fa-${activity.icon}"></i>
                <span>${activity.text}</span>
                <span class="activity-time">${formatTimeAgo(activity.time)}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
        container.innerHTML = `
            <div class="empty-state-small">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể tải hoạt động</p>
            </div>
        `;
    }
}

/**
 * Load upcoming items
 */
async function loadUpcomingItems() {
    const container = document.getElementById('upcomingItems');
    
    try {
        const [scheduleRes, eventsRes] = await Promise.all([
            apiClient.get('/api/user/schedule'),
            apiClient.get('/api/user/events')
        ]);
        
        const upcoming = [];
        
        // Add upcoming schedule
        if (scheduleRes.success && scheduleRes.data.length > 0) {
            const now = new Date();
            scheduleRes.data.forEach(item => {
                const itemDate = new Date(item.date);
                if (itemDate >= now) {
                    upcoming.push({
                        icon: 'clock',
                        text: `Lịch tập: ${item.class_name}`,
                        time: item.date,
                        location: item.location,
                        type: 'schedule'
                    });
                }
            });
        }
        
        // Add upcoming events
        if (eventsRes.success && eventsRes.data.length > 0) {
            eventsRes.data.forEach(event => {
                upcoming.push({
                    icon: 'calendar-alt',
                    text: event.name,
                    time: event.date,
                    location: event.location,
                    type: 'event'
                });
            });
        }
        
        // Sort by time
        upcoming.sort((a, b) => new Date(a.time) - new Date(b.time));
        
        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-calendar-times"></i>
                    <p>Chưa có lịch sắp tới</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = upcoming.slice(0, 5).map(item => `
            <div class="upcoming-item">
                <div class="upcoming-icon">
                    <i class="fas fa-${item.icon}"></i>
                </div>
                <div class="upcoming-content">
                    <div class="upcoming-title">${item.text}</div>
                    <div class="upcoming-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(item.time)}</span>
                        ${item.location ? `<span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading upcoming items:', error);
        container.innerHTML = `
            <div class="empty-state-small">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể tải lịch sắp tới</p>
            </div>
        `;
    }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

/**
 * Close mobile menu when clicking nav item
 */
document.addEventListener('DOMContentLoaded', function() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            if (window.innerWidth <= 480) {
                toggleMobileMenu();
            }
        });
    });
});

    /**
     * Expose toggleMobileMenu to global scope
     */
    window.UserDashboard_toggleMobileMenu = toggleMobileMenu;

})(); // End of IIFE
