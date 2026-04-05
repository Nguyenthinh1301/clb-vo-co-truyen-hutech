/**
 * ============================================
 * DASHBOARD CORE MODULE
 * ============================================
 * File: dashboard-core.js
 * Mục đích: Khởi tạo và quản lý core functions
 */

// Global variables
let currentSection = 'overview';

/**
 * Khởi tạo dashboard khi DOM loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initializing...');
    
    // Wait a bit for Auth to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check authentication
    if (!Auth.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '../website/views/account/dang-nhap.html';
        return;
    }
    
    const user = Auth.getCurrentUser();
    console.log('Current user:', user);
    
    if (!user) {
        console.error('No user data found');
        window.location.href = '../website/views/account/dang-nhap.html';
        return;
    }
    
    // Check admin role
    if (user.role !== 'admin') {
        console.log('User is not admin, showing access denied');
        showAccessDenied();
        return;
    }
    
    console.log('Loading dashboard for admin user');
    
    // Load dashboard components
    loadUserInfo();
    loadDashboardData();
    initializeCharts();
    
    // Load and apply saved settings
    const settings = JSON.parse(localStorage.getItem('dashboardSettings') || '{}');
    applySettings(settings);
    
    // Setup modal close on outside click
    setupModalHandlers();
});

/**
 * Setup modal event handlers
 */
function setupModalHandlers() {
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target === modal) {
            closeSettings();
        }
    });
}

/**
 * Chuyển đổi giữa các sections
 * @param {string} sectionName - Tên section cần hiển thị
 */
function showSection(sectionName) {
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
    event.target.classList.add('active');
    
    currentSection = sectionName;
    
    // Load section-specific data
    if (sectionName === 'users') {
        loadUserList();
    } else if (sectionName === 'classes') {
        loadClassList();
    } else if (sectionName === 'events') {
        DashboardEvents.loadEventsList();
    } else if (sectionName === 'notifications') {
        NotificationsManager.init();
    } else if (sectionName === 'points') {
        loadPointsContent();
    } else if (sectionName === 'reports') {
        DashboardReports.loadReportsContent();
    } else if (sectionName === 'system') {
        DashboardSystem.loadSystemContent();
    }
}

/**
 * Load thông tin user hiện tại
 */
function loadUserInfo() {
    const user = Auth.getCurrentUser();
    console.log('Loading user info:', user);
    
    if (user) {
        // Hiển thị tên đầy đủ với priority
        let displayName = '';
        
        // Priority 1: full_name
        if (user.full_name && user.full_name.trim()) {
            displayName = user.full_name.trim();
        }
        // Priority 2: first_name + last_name
        else if (user.first_name || user.last_name) {
            const firstName = (user.first_name || '').trim();
            const lastName = (user.last_name || '').trim();
            displayName = `${firstName} ${lastName}`.trim();
        }
        // Priority 3: username
        else if (user.username && user.username.trim()) {
            displayName = user.username.trim();
        }
        // Priority 4: email (fallback)
        else if (user.email) {
            displayName = user.email.split('@')[0]; // Use email prefix
        }
        // Last resort
        else {
            displayName = 'Admin User';
        }
        
        // Update display
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }
        
        // Hiển thị role và email
        const roleText = user.role === 'admin' ? 'Quản trị viên' : 
                        user.role === 'member' ? 'Thành viên' : 
                        user.role === 'student' ? 'Học viên' :
                        user.role.toUpperCase();
        
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = `${roleText} • ${user.email || 'No email'}`;
        }
        
        // Cập nhật avatar với chữ cái đầu
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.textContent = displayName.charAt(0).toUpperCase();
        }
        
        console.log('User info loaded successfully:', {
            name: displayName,
            role: roleText,
            email: user.email
        });
    } else {
        console.error('No user data found in Auth');
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        
        if (userNameElement) {
            userNameElement.textContent = 'Unknown User';
        }
        if (userRoleElement) {
            userRoleElement.textContent = 'No role';
        }
    }
}

/**
 * Hiển thị trang access denied
 */
function showAccessDenied() {
    const container = document.querySelector('.dashboard-container');
    container.innerHTML = `
        <div style="text-align: center; padding: 50px; background: rgba(255,255,255,0.95); border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
            <div style="font-size: 64px; color: #e74c3c; margin-bottom: 20px;">
                <i class="fas fa-lock"></i>
            </div>
            <h2 style="color: #333; margin-bottom: 15px;">Truy cập bị từ chối</h2>
            <p style="color: #666; margin-bottom: 30px; font-size: 16px;">
                Chỉ có quản trị viên (Admin) mới có thể truy cập trang Dashboard này.
            </p>
            <div style="margin-bottom: 20px;">
                <strong>Vai trò hiện tại:</strong> 
                <span style="color: #e74c3c; text-transform: uppercase;">${Auth.getCurrentUser()?.role || 'Unknown'}</span>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="window.location.href='../../index.html'" class="action-btn">
                    <i class="fas fa-home"></i> Về trang chủ
                </button>
                <button onclick="logout()" class="action-btn danger">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            </div>
        </div>
    `;
}

/**
 * Đăng xuất
 */
async function logout() {
    try {
        await Auth.logout();
        // Auth.logout() already handles redirect, but add fallback
        window.location.href = '/website/views/account/dang-nhap.html';
    } catch (error) {
        console.error('Logout error:', error);
        Auth.clearAuth();
        window.location.href = '/website/views/account/dang-nhap.html';
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showSection,
        loadUserInfo,
        showAccessDenied,
        logout
    };
}


/**
 * Load points content from HTML file
 */
async function loadPointsContent() {
    const container = document.getElementById('points-content');
    if (!container) return;
    
    try {
        // Load admin points management interface
        const response = await fetch('admin-points-management.html');
        const html = await response.text();
        container.innerHTML = html;
        console.log('Admin points management loaded successfully');
        
        // Initialize AdminPoints module if available
        if (typeof AdminPoints !== 'undefined') {
            await AdminPoints.init();
        }
    } catch (error) {
        console.error('Error loading points content:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
                <h3>Không thể tải nội dung tích điểm</h3>
                <p style="color: #666;">Vui lòng thử lại sau</p>
                <button onclick="loadPointsContent()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
            </div>
        `;
    }
}


/**
 * ============================================
 * NEW USERS REGISTRATION TRACKING
 * ============================================
 */

/**
 * Load new users registered today
 */
async function loadNewUsersToday() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/stats/new-users-today', {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load new users');
        }

        const result = await response.json();
        
        if (result.success) {
            // Update stat card
            document.getElementById('newUsersToday').textContent = result.data.count || 0;
            
            // Load recent users list
            loadRecentNewUsers();
        }
    } catch (error) {
        console.error('Error loading new users today:', error);
        document.getElementById('newUsersToday').textContent = '0';
    }
}

/**
 * Load recent new users list
 */
async function loadRecentNewUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/users/recent?limit=10', {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load recent users');
        }

        const result = await response.json();
        
        if (result.success && result.data.users) {
            displayNewUsers(result.data.users);
        } else {
            showNoNewUsers();
        }
    } catch (error) {
        console.error('Error loading recent users:', error);
        showNoNewUsers();
    }
}

/**
 * Display new users in the widget
 */
function displayNewUsers(users) {
    const container = document.getElementById('newUsersContainer');
    
    if (!users || users.length === 0) {
        showNoNewUsers();
        return;
    }

    let html = '<div style="overflow-x: auto;">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead>';
    html += '<tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">';
    html += '<th style="padding: 12px; text-align: left;">STT</th>';
    html += '<th style="padding: 12px; text-align: left;">Họ tên</th>';
    html += '<th style="padding: 12px; text-align: left;">Email</th>';
    html += '<th style="padding: 12px; text-align: left;">Số điện thoại</th>';
    html += '<th style="padding: 12px; text-align: left;">Ngày đăng ký</th>';
    html += '<th style="padding: 12px; text-align: left;">Trạng thái</th>';
    html += '<th style="padding: 12px; text-align: center;">Thao tác</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    users.forEach((user, index) => {
        const registeredDate = new Date(user.created_at);
        const isToday = isDateToday(registeredDate);
        const rowStyle = isToday ? 'background: #e8f5e9;' : '';
        
        html += `<tr style="border-bottom: 1px solid #dee2e6; ${rowStyle}">`;
        html += `<td style="padding: 12px;">${index + 1}</td>`;
        html += `<td style="padding: 12px;">`;
        html += `<div style="display: flex; align-items: center; gap: 10px;">`;
        html += `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">`;
        html += `${user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}`;
        html += `</div>`;
        html += `<div>`;
        html += `<div style="font-weight: 500;">${user.full_name || user.first_name + ' ' + user.last_name}</div>`;
        if (isToday) {
            html += `<span style="font-size: 11px; background: #4caf50; color: white; padding: 2px 8px; border-radius: 10px;">MỚI</span>`;
        }
        html += `</div>`;
        html += `</div>`;
        html += `</td>`;
        html += `<td style="padding: 12px;">${user.email}</td>`;
        html += `<td style="padding: 12px;">${user.phone_number || '<span style="color: #999;">Chưa cập nhật</span>'}</td>`;
        html += `<td style="padding: 12px;">${formatDateTime(user.created_at)}</td>`;
        html += `<td style="padding: 12px;">`;
        html += `<span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; background: ${getMembershipStatusColor(user.membership_status)}; color: white;">`;
        html += getMembershipStatusText(user.membership_status);
        html += `</span>`;
        html += `</td>`;
        html += `<td style="padding: 12px; text-align: center;">`;
        html += `<button onclick="viewUserDetail(${user.id})" style="padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;" title="Xem chi tiết">`;
        html += `<i class="fas fa-eye"></i>`;
        html += `</button>`;
        html += `<button onclick="approveUser(${user.id})" style="padding: 6px 12px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;" title="Phê duyệt">`;
        html += `<i class="fas fa-check"></i>`;
        html += `</button>`;
        html += `</td>`;
        html += `</tr>`;
    });

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Show no new users message
 */
function showNoNewUsers() {
    const container = document.getElementById('newUsersContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
            <p style="font-size: 16px;">Chưa có thành viên mới đăng ký</p>
        </div>
    `;
}

/**
 * Check if date is today
 */
function isDateToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.getDate() === today.getDate() &&
           checkDate.getMonth() === today.getMonth() &&
           checkDate.getFullYear() === today.getFullYear();
}

/**
 * Format date time
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get membership status color
 */
function getMembershipStatusColor(status) {
    const colors = {
        'pending': '#f39c12',
        'active': '#2ecc71',
        'inactive': '#95a5a6',
        'expired': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
}

/**
 * Get membership status text
 */
function getMembershipStatusText(status) {
    const texts = {
        'pending': 'Chờ duyệt',
        'active': 'Hoạt động',
        'inactive': 'Không hoạt động',
        'expired': 'Hết hạn'
    };
    return texts[status] || status;
}

/**
 * Refresh new users list
 */
function refreshNewUsers() {
    loadNewUsersToday();
    loadRecentNewUsers();
}

/**
 * Show all new users
 */
function showAllNewUsers() {
    showSection('users');
}

/**
 * View user detail
 */
function viewUserDetail(userId) {
    // TODO: Implement user detail modal
    alert(`Xem chi tiết user ID: ${userId}`);
}

/**
 * Approve user
 */
async function approveUser(userId) {
    if (!confirm('Bạn có chắc muốn phê duyệt thành viên này?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('Đã phê duyệt thành viên thành công!');
            refreshNewUsers();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Error approving user:', error);
        alert('Có lỗi xảy ra khi phê duyệt thành viên');
    }
}

// Auto refresh new users every 30 seconds
setInterval(() => {
    if (currentSection === 'overview') {
        loadNewUsersToday();
    }
}, 30000);
