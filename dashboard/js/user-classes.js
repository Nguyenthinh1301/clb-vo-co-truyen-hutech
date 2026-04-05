/**
 * User Classes Page
 * Trang lớp học của sinh viên
 */

let myClasses = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = '../website/views/account/dang-nhap.html';
        return;
    }

    await loadMyClasses();
});

// Load my classes
async function loadMyClasses() {
    try {
        const response = await ApiClient.get('/api/classes/my-classes');
        
        if (response.success) {
            myClasses = response.data || [];
            displayMyClasses();
            updateStats();
        } else {
            showError('Không thể tải danh sách lớp học');
        }
    } catch (error) {
        console.error('Error loading my classes:', error);
        showError('Lỗi khi tải danh sách lớp học');
    }
}

// Display my classes
function displayMyClasses() {
    const classList = document.getElementById('myClassesList');
    
    if (!myClasses || myClasses.length === 0) {
        classList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <h2>Chưa có lớp học nào</h2>
                <p>Bạn chưa đăng ký lớp học nào. Vui lòng liên hệ admin để được phân lớp.</p>
            </div>
        `;
        return;
    }

    // Show stats
    document.getElementById('statsRow').style.display = 'grid';

    classList.innerHTML = `
        <div class="classes-grid">
            ${myClasses.map(cls => {
                const levelText = getLevelText(cls.level);
                const levelColor = getLevelColor(cls.level);
                
                return `
                    <div class="class-card">
                        <div class="class-banner" style="background: ${levelColor};">
                            <h2>${cls.name}</h2>
                            <span class="class-level">${levelText}</span>
                        </div>
                        <div class="class-body">
                            <div class="class-info-item">
                                <i class="fas fa-user-tie"></i>
                                <div>
                                    <strong>Giảng viên</strong>
                                    ${cls.instructor_name || 'Đang cập nhật'}
                                </div>
                            </div>
                            <div class="class-info-item">
                                <i class="fas fa-clock"></i>
                                <div>
                                    <strong>Lịch học</strong>
                                    ${cls.schedule || 'Chưa có lịch'}
                                    ${cls.schedule ? `
                                        <div class="schedule-preview">
                                            ${parseSchedule(cls.schedule)}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="class-info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <div>
                                    <strong>Địa điểm</strong>
                                    ${cls.location || 'Chưa có địa điểm'}
                                </div>
                            </div>
                            <div class="class-info-item">
                                <i class="fas fa-calendar-alt"></i>
                                <div>
                                    <strong>Ngày đăng ký</strong>
                                    ${new Date(cls.enrollment_date).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            ${cls.fee > 0 ? `
                                <div class="class-info-item">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <div>
                                        <strong>Học phí</strong>
                                        ${formatCurrency(cls.fee)}
                                        <span style="color: ${cls.payment_status === 'paid' ? '#28a745' : '#ffc107'};">
                                            (${cls.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'})
                                        </span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="class-footer">
                            <button onclick="viewClassDetails(${cls.id})">
                                <i class="fas fa-info-circle"></i> Xem Chi Tiết
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Update statistics
function updateStats() {
    const totalClasses = myClasses.length;
    
    // Calculate upcoming sessions (estimate based on schedule)
    let upcomingSessions = 0;
    myClasses.forEach(cls => {
        if (cls.schedule) {
            // Count days in schedule (rough estimate)
            const days = (cls.schedule.match(/Thứ/g) || []).length;
            upcomingSessions += days;
        }
    });

    // Calculate total hours per week (estimate)
    let totalHours = 0;
    myClasses.forEach(cls => {
        if (cls.schedule) {
            // Extract hours from schedule like "18:00-20:00"
            const timeMatch = cls.schedule.match(/(\d+):(\d+)-(\d+):(\d+)/);
            if (timeMatch) {
                const startHour = parseInt(timeMatch[1]);
                const endHour = parseInt(timeMatch[3]);
                const hoursPerSession = endHour - startHour;
                const days = (cls.schedule.match(/Thứ/g) || []).length;
                totalHours += hoursPerSession * days;
            }
        }
    });

    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('upcomingSessions').textContent = upcomingSessions;
    document.getElementById('totalHours').textContent = totalHours;
}

// View class details
async function viewClassDetails(classId) {
    try {
        const response = await ApiClient.get(`/api/classes/${classId}`);
        
        if (!response.success) {
            showError('Không thể tải thông tin lớp học');
            return;
        }

        const cls = response.data.class;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-graduation-cap"></i> ${cls.name}</h2>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; margin-bottom: 10px;">Thông Tin Lớp Học</h3>
                        ${cls.description ? `<p style="color: #666; line-height: 1.6;">${cls.description}</p>` : ''}
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #2c3e50;">📚 Cấp độ:</strong>
                            <span style="margin-left: 10px;">${getLevelText(cls.level)}</span>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #2c3e50;">👨‍🏫 Giảng viên:</strong>
                            <span style="margin-left: 10px;">${cls.instructor_first_name} ${cls.instructor_last_name}</span>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #2c3e50;">📧 Email giảng viên:</strong>
                            <span style="margin-left: 10px;">${cls.instructor_email}</span>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #2c3e50;">🕐 Lịch học:</strong>
                            <span style="margin-left: 10px;">${cls.schedule}</span>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #2c3e50;">📍 Địa điểm:</strong>
                            <span style="margin-left: 10px;">${cls.location || 'Chưa có'}</span>
                        </div>
                        ${cls.start_date ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #2c3e50;">📅 Ngày bắt đầu:</strong>
                                <span style="margin-left: 10px;">${new Date(cls.start_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                        ` : ''}
                        ${cls.requirements ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #2c3e50;">📋 Yêu cầu:</strong>
                                <span style="margin-left: 10px;">${cls.requirements}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error loading class details:', error);
        showError('Lỗi khi tải thông tin lớp học');
    }
}

// Utility functions
function getLevelText(level) {
    const levels = {
        'beginner': 'Cơ Bản',
        'intermediate': 'Trung Cấp',
        'advanced': 'Nâng Cao'
    };
    return levels[level] || 'Chưa xác định';
}

function getLevelColor(level) {
    const colors = {
        'beginner': 'linear-gradient(135deg, #28a745, #20c997)',
        'intermediate': 'linear-gradient(135deg, #ffc107, #fd7e14)',
        'advanced': 'linear-gradient(135deg, #c41e3a, #e74c3c)'
    };
    return colors[level] || 'linear-gradient(135deg, #6c757d, #495057)';
}

function parseSchedule(schedule) {
    // Parse schedule like "Thứ 2, 4, 6 - 18:00-20:00"
    const days = schedule.match(/Thứ \d/g) || [];
    return days.map(day => `<span class="schedule-day">${day}</span>`).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function showError(message) {
    alert('❌ ' + message);
}
