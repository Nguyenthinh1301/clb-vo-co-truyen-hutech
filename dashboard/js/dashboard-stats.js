/**
 * ============================================
 * DASHBOARD STATS MODULE
 * ============================================
 * File: dashboard-stats.js
 * Mục đích: Quản lý thống kê và biểu đồ
 */

// Global charts object
const charts = {
    registration: null,
    role: null
};

/**
 * Load tất cả thống kê
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/dashboard-stats`, {
            headers: { 
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                const stats = data.data.stats;
                updateStatsDisplay(stats);
            }
        } else {
            await loadStatsIndividually();
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
        await loadStatsIndividually();
    }
}

/**
 * Cập nhật hiển thị thống kê
 * @param {Object} stats - Dữ liệu thống kê
 */
function updateStatsDisplay(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('activeClasses').textContent = stats.activeClasses || 0;
    document.getElementById('upcomingEvents').textContent = stats.upcomingEvents || 0;
    
    // Update points stats in quick stats
    if (document.getElementById('totalPointsIssued')) {
        document.getElementById('totalPointsIssued').textContent = formatNumber(stats.totalPointsIssued || 0);
    }
    
    document.getElementById('userCount').textContent = stats.totalUsers || 0;
    document.getElementById('classCount').textContent = stats.activeClasses || 0;
    document.getElementById('eventCount').textContent = stats.upcomingEvents || 0;
    document.getElementById('revenueCount').textContent = formatCurrency(stats.monthlyRevenue || 0);
}

/**
 * Load thống kê tích điểm cho Overview
 */
async function loadPointsStatsForOverview() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/points/stats`, {
            headers: { 
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                const stats = data.data;
                
                // Update quick stats
                if (document.getElementById('totalPointsIssued')) {
                    document.getElementById('totalPointsIssued').textContent = formatNumber(stats.totalPointsIssued || 0);
                }
                
                // Update overview cards
                if (document.getElementById('overviewTotalPoints')) {
                    document.getElementById('overviewTotalPoints').textContent = formatNumber(stats.totalPointsIssued || 0);
                }
                if (document.getElementById('overviewMembersWithPoints')) {
                    document.getElementById('overviewMembersWithPoints').textContent = formatNumber(stats.membersWithPoints || 0);
                }
                if (document.getElementById('overviewMonthlyTransactions')) {
                    document.getElementById('overviewMonthlyTransactions').textContent = formatNumber(stats.monthlyTransactions || 0);
                }
                if (document.getElementById('overviewAvgPoints')) {
                    document.getElementById('overviewAvgPoints').textContent = formatNumber(stats.avgPointsPerMember || 0);
                }
            }
        }
    } catch (error) {
        console.error('Error loading points stats:', error);
        // Set default values on error
        if (document.getElementById('totalPointsIssued')) {
            document.getElementById('totalPointsIssued').textContent = '0';
        }
        if (document.getElementById('overviewTotalPoints')) {
            document.getElementById('overviewTotalPoints').textContent = '0';
        }
        if (document.getElementById('overviewMembersWithPoints')) {
            document.getElementById('overviewMembersWithPoints').textContent = '0';
        }
        if (document.getElementById('overviewMonthlyTransactions')) {
            document.getElementById('overviewMonthlyTransactions').textContent = '0';
        }
        if (document.getElementById('overviewAvgPoints')) {
            document.getElementById('overviewAvgPoints').textContent = '0';
        }
    }
}

/**
 * Format số với dấu phẩy
 */
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Load thống kê từng phần (fallback)
 */
async function loadStatsIndividually() {
    try {
        const usersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const userCount = usersData.success ? (usersData.data?.length || 0) : 0;
            document.getElementById('userCount').textContent = userCount;
            document.getElementById('totalUsers').textContent = userCount;
        }
        
        const classesResponse = await fetch(`${API_CONFIG.BASE_URL}/api/classes`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        
        if (classesResponse.ok) {
            const classesData = await classesResponse.json();
            const classCount = classesData.success ? (classesData.data?.length || 0) : 0;
            document.getElementById('classCount').textContent = classCount;
            document.getElementById('activeClasses').textContent = classCount;
        }
        
    } catch (error) {
        console.error('Error loading individual stats:', error);
    }
}

/**
 * Load trạng thái hệ thống
 */
async function loadSystemStatus() {
    const statusDiv = document.getElementById('systemStatus');
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health/detailed`);
        const data = await response.json();
        
        let statusHtml = '';
        const overallStatus = data.success ? 'online' : 'warning';
        
        statusHtml += `
            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${overallStatus === 'online' ? '#2ecc71' : '#f39c12'}; box-shadow: 0 0 10px ${overallStatus === 'online' ? '#2ecc71' : '#f39c12'};"></span>
                <strong style="font-size: 16px;">Backend API: ${data.success ? 'Online' : 'Issues detected'}</strong>
            </div>
        `;
        
        if (data.services?.database) {
            const dbStatus = data.services.database.status === 'healthy' ? 'online' : 'offline';
            statusHtml += `
                <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px; padding: 10px; background: ${dbStatus === 'online' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}; border-radius: 8px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${dbStatus === 'online' ? '#2ecc71' : '#e74c3c'};"></span>
                    <span><strong>Database:</strong> ${data.services.database.status}</span>
                </div>
            `;
        }
        
        if (data.system) {
            const uptimeMinutes = (data.uptime / 60).toFixed(1);
            const uptimeHours = (data.uptime / 3600).toFixed(1);
            const displayUptime = data.uptime > 3600 ? `${uptimeHours} giờ` : `${uptimeMinutes} phút`;
            
            statusHtml += `
                <div style="margin-top: 15px; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-clock" style="color: #667eea;"></i>
                    <span><strong>Uptime:</strong> ${displayUptime}</span>
                </div>
            `;
        }
        
        statusDiv.innerHTML = statusHtml;
        
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="error" style="display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #e74c3c; box-shadow: 0 0 10px #e74c3c;"></span>
                <div>
                    <strong>Không thể kết nối backend</strong><br>
                    <span style="font-size: 13px;">${error.message}</span>
                </div>
            </div>
        `;
    }
}

/**
 * Load số lượng thông báo chưa đọc
 */
async function loadNotificationCount() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                document.getElementById('notificationCount').textContent = data.data.count || 0;
            }
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

/**
 * Khởi tạo biểu đồ
 */
function initializeCharts() {
    const regCtx = document.getElementById('registrationChart');
    if (regCtx) {
        charts.registration = new Chart(regCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Đăng ký mới',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Chưa có dữ liệu',
                        color: '#999'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    const roleCtx = document.getElementById('roleChart');
    if (roleCtx) {
        charts.role = new Chart(roleCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: 'Chưa có dữ liệu',
                        color: '#999'
                    }
                }
            }
        });
    }
}

/**
 * Load tất cả dữ liệu dashboard
 */
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadSystemStatus(),
        loadNotificationCount(),
        loadNewUsersToday(),
        loadRecentNewUsers(),
        loadPointsStatsForOverview()
    ]);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadStats,
        loadSystemStatus,
        loadNotificationCount,
        initializeCharts,
        loadDashboardData,
        loadPointsStatsForOverview
    };
}
