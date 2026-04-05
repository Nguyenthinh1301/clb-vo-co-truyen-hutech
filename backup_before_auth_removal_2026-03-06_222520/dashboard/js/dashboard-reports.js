/**
 * Dashboard Reports Module
 * Báo cáo và thống kê tổng quan
 */

// Demo data
const reportData = {
    overview: {
        totalMembers: 0,
        activeMembers: 0,
        totalClasses: 0,
        totalEvents: 0,
        monthlyRevenue: 0,
        growthRate: 0
    },
    memberGrowth: [],
    classDistribution: [],
    eventStats: [],
    revenueByMonth: [],
    topPerformers: []
};

/**
 * Khởi tạo module Reports
 */
function initReportsModule() {
    console.log('Reports module initialized');
    loadReportsContent();
}

/**
 * Load nội dung báo cáo
 */
function loadReportsContent() {
    const reportsContent = document.getElementById('reports-content');
    if (!reportsContent) return;
    
    reportsContent.innerHTML = `
        <div class="reports-header">
            <div class="header-left">
                <h2><i class="fas fa-chart-line"></i> Báo cáo & Thống kê</h2>
                <p class="subtitle">Tổng quan hoạt động CLB Võ Cổ Truyền HUTECH</p>
            </div>
            <div class="report-actions">
                <button class="action-btn" onclick="DashboardReports.exportReport('pdf')">
                    <i class="fas fa-file-pdf"></i> Xuất PDF
                </button>
                <button class="action-btn primary" onclick="DashboardReports.exportReport('excel')">
                    <i class="fas fa-file-excel"></i> Xuất Excel
                </button>
            </div>
        </div>
        
        <!-- Overview Stats -->
        <div class="report-overview">
            <div class="overview-card">
                <div class="card-icon members">
                    <i class="fas fa-users"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${reportData.overview.totalMembers}</div>
                    <div class="card-label">Tổng thành viên</div>
                    <div class="card-change positive">
                        <i class="fas fa-arrow-up"></i> +${reportData.overview.growthRate}%
                    </div>
                </div>
            </div>
            
            <div class="overview-card">
                <div class="card-icon active">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${reportData.overview.activeMembers}</div>
                    <div class="card-label">Đang hoạt động</div>
                    <div class="card-change positive">
                        <i class="fas fa-arrow-up"></i> +8.2%
                    </div>
                </div>
            </div>
            
            <div class="overview-card">
                <div class="card-icon classes">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${reportData.overview.totalClasses}</div>
                    <div class="card-label">Lớp học</div>
                    <div class="card-change neutral">
                        <i class="fas fa-minus"></i> 0%
                    </div>
                </div>
            </div>
            
            <div class="overview-card">
                <div class="card-icon events">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${reportData.overview.totalEvents}</div>
                    <div class="card-label">Sự kiện</div>
                    <div class="card-change positive">
                        <i class="fas fa-arrow-up"></i> +15%
                    </div>
                </div>
            </div>
            
            <div class="overview-card revenue">
                <div class="card-icon revenue">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${formatCurrency(reportData.overview.monthlyRevenue)}</div>
                    <div class="card-label">Doanh thu tháng</div>
                    <div class="card-change positive">
                        <i class="fas fa-arrow-up"></i> +5.5%
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Charts Section -->
        <div class="charts-grid">
            <!-- Member Growth Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h3><i class="fas fa-chart-line"></i> Tăng trưởng thành viên</h3>
                    <select class="chart-filter" onchange="DashboardReports.filterChart('member', this.value)">
                        <option value="6months">6 tháng</option>
                        <option value="1year">1 năm</option>
                        <option value="all">Tất cả</option>
                    </select>
                </div>
                <div class="chart-body">
                    ${renderMemberGrowthChart()}
                </div>
            </div>
            
            <!-- Class Distribution Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h3><i class="fas fa-chart-pie"></i> Phân bố lớp học</h3>
                </div>
                <div class="chart-body">
                    ${renderClassDistributionChart()}
                </div>
            </div>
            
            <!-- Event Stats Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h3><i class="fas fa-chart-bar"></i> Thống kê sự kiện</h3>
                </div>
                <div class="chart-body">
                    ${renderEventStatsChart()}
                </div>
            </div>
            
            <!-- Revenue Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h3><i class="fas fa-money-bill-wave"></i> Doanh thu theo tháng</h3>
                </div>
                <div class="chart-body">
                    ${renderRevenueChart()}
                </div>
            </div>
        </div>
        
        <!-- Top Performers -->
        <div class="top-performers-section">
            <div class="section-header">
                <h3><i class="fas fa-trophy"></i> Top 5 Thành viên xuất sắc</h3>
            </div>
            <div class="performers-list">
                ${renderTopPerformers()}
            </div>
        </div>
    `;
}

/**
 * Render member growth chart
 */
function renderMemberGrowthChart() {
    if (reportData.memberGrowth.length === 0) {
        return `
            <div class="chart-empty">
                <i class="fas fa-chart-line"></i>
                <p>Chưa có dữ liệu tăng trưởng thành viên</p>
            </div>
        `;
    }
    
    const maxValue = Math.max(...reportData.memberGrowth.map(d => d.count));
    
    return `
        <div class="line-chart">
            ${reportData.memberGrowth.map((data, index) => {
                const height = (data.count / maxValue * 100);
                return `
                    <div class="chart-column">
                        <div class="column-bar" style="height: ${height}%">
                            <span class="bar-value">${data.count}</span>
                        </div>
                        <div class="column-label">${data.month}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Render class distribution chart
 */
function renderClassDistributionChart() {
    if (reportData.classDistribution.length === 0) {
        return `
            <div class="chart-empty">
                <i class="fas fa-chart-pie"></i>
                <p>Chưa có dữ liệu phân bố lớp học</p>
            </div>
        `;
    }
    
    return `
        <div class="pie-chart">
            ${reportData.classDistribution.map((data, index) => {
                const colors = ['#667eea', '#f093fb'];
                return `
                    <div class="pie-item">
                        <div class="pie-bar" style="width: ${data.percentage}%; background: ${colors[index]}"></div>
                        <div class="pie-info">
                            <span class="pie-label">${data.name}</span>
                            <span class="pie-value">${data.count} (${data.percentage}%)</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Render event stats chart
 */
function renderEventStatsChart() {
    if (reportData.eventStats.length === 0) {
        return `
            <div class="chart-empty">
                <i class="fas fa-chart-bar"></i>
                <p>Chưa có dữ liệu thống kê sự kiện</p>
            </div>
        `;
    }
    
    const maxValue = Math.max(...reportData.eventStats.map(d => d.count));
    
    return `
        <div class="bar-chart">
            ${reportData.eventStats.map(data => {
                const width = (data.count / maxValue * 100);
                return `
                    <div class="bar-row">
                        <div class="bar-label">${data.type}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${width}%">
                                <span class="bar-value">${data.count}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Render revenue chart
 */
function renderRevenueChart() {
    if (reportData.revenueByMonth.length === 0) {
        return `
            <div class="chart-empty">
                <i class="fas fa-money-bill-wave"></i>
                <p>Chưa có dữ liệu doanh thu</p>
            </div>
        `;
    }
    
    const maxValue = Math.max(...reportData.revenueByMonth.map(d => d.revenue));
    
    return `
        <div class="line-chart revenue">
            ${reportData.revenueByMonth.map(data => {
                const height = (data.revenue / maxValue * 100);
                return `
                    <div class="chart-column">
                        <div class="column-bar" style="height: ${height}%">
                            <span class="bar-value">${formatCurrency(data.revenue)}</span>
                        </div>
                        <div class="column-label">${data.month}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Render top performers
 */
function renderTopPerformers() {
    if (reportData.topPerformers.length === 0) {
        return `
            <div class="chart-empty">
                <i class="fas fa-trophy"></i>
                <p>Chưa có dữ liệu thành viên xuất sắc</p>
            </div>
        `;
    }
    
    return reportData.topPerformers.map(performer => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[performer.rank - 1] || '🏅';
        
        return `
            <div class="performer-item">
                <div class="performer-rank">${medal}</div>
                <div class="performer-info">
                    <div class="performer-name">${escapeHtml(performer.name)}</div>
                    <div class="performer-points">${performer.points} điểm</div>
                </div>
                <div class="performer-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(performer.points / 1000 * 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

/**
 * Filter chart
 */
function filterChart(type, period) {
    showNotification(`Lọc biểu đồ ${type} theo ${period}`, 'info');
    // TODO: Implement filter logic
}

/**
 * Export report
 */
function exportReport(format) {
    showNotification(`Đang xuất báo cáo định dạng ${format.toUpperCase()}...`, 'info');
    
    // Simulate export
    setTimeout(() => {
        showNotification(`Xuất báo cáo ${format.toUpperCase()} thành công!`, 'success');
    }, 1500);
}

// Export functions
if (typeof window !== 'undefined') {
    window.DashboardReports = {
        init: initReportsModule,
        loadReportsContent,
        filterChart,
        exportReport
    };
}
