/**
 * ============================================
 * DASHBOARD CLASSES MODULE
 * ============================================
 * File: dashboard-classes.js
 * Mục đích: Quản lý lớp học và thành viên
 */

// Biến toàn cục
let allClasses = [];
let classMembers = {
    'saigon': [],
    'thuduc': []
};

// Demo data - 2 lớp chính
const DEMO_CLASSES = [
    {
        id: 1,
        name: 'Lớp Sài Gòn Campus',
        code: 'saigon',
        location: 'Cơ sở Sài Gòn',
        address: '475A Điện Biên Phủ, P.25, Q.Bình Thạnh, TP.HCM',
        schedule: 'Thứ 3, 5, 7 - 18:00-20:00',
        instructor: 'HLV Nguyễn Quốc An',
        capacity: 50,
        status: 'active',
        created_at: '2024-01-15'
    },
    {
        id: 2,
        name: 'Lớp Thủ Đức Campus',
        code: 'thuduc',
        location: 'Cơ sở Thủ Đức',
        address: 'Khu Công nghệ cao, P.Long Thạnh Mỹ, TP.Thủ Đức, TP.HCM',
        schedule: 'Thứ 2, 4, 6 - 18:00-20:00',
        instructor: 'HLV Nguyễn Quốc An',
        capacity: 50,
        status: 'active',
        created_at: '2024-01-15'
    }
];

// Demo members - Sài Gòn Campus (Trống - chờ nhập dữ liệu)
const DEMO_MEMBERS_SAIGON = [];

// Demo members - Thủ Đức Campus (Trống - chờ nhập dữ liệu)
const DEMO_MEMBERS_THUDUC = [];

/**
 * Load danh sách lớp học
 */
async function loadClassList() {
    try {
        // Sử dụng demo data
        allClasses = DEMO_CLASSES;
        classMembers.saigon = DEMO_MEMBERS_SAIGON;
        classMembers.thuduc = DEMO_MEMBERS_THUDUC;
        
        displayClassList();
        updateClassStats();
        
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Lỗi khi tải danh sách lớp học', 'error');
    }
}

/**
 * Hiển thị danh sách lớp học
 */
function displayClassList() {
    const classListDiv = document.getElementById('classList');
    
    if (!classListDiv) return;
    
    let html = '<div class="classes-grid">';
    
    allClasses.forEach(cls => {
        const memberCount = classMembers[cls.code]?.length || 0;
        const percentage = Math.round((memberCount / cls.capacity) * 100);
        
        html += `
            <div class="class-card">
                <div class="class-header">
                    <h3>${cls.name}</h3>
                    <span class="class-status ${cls.status}">${cls.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}</span>
                </div>
                <div class="class-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${cls.location}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${cls.schedule}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user-tie"></i>
                        <span>${cls.instructor}</span>
                    </div>
                </div>
                <div class="class-stats">
                    <div class="stat-row">
                        <span>Thành viên:</span>
                        <strong>${memberCount}/${cls.capacity}</strong>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="stat-percentage">${percentage}% đã đăng ký</div>
                </div>
                <div class="class-actions">
                    <button class="btn-view" onclick="viewClassMembers('${cls.code}')">
                        <i class="fas fa-users"></i> Xem danh sách (${memberCount})
                    </button>
                    <button class="btn-add" onclick="showAddMemberForm('${cls.code}')">
                        <i class="fas fa-user-plus"></i> Thêm thành viên
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    classListDiv.innerHTML = html;
}

/**
 * Cập nhật thống kê lớp học
 */
function updateClassStats() {
    const totalMembers = DEMO_MEMBERS_SAIGON.length + DEMO_MEMBERS_THUDUC.length;
    const saigonCount = DEMO_MEMBERS_SAIGON.length;
    const thuducCount = DEMO_MEMBERS_THUDUC.length;
    
    // Cập nhật số liệu trên dashboard
    const totalClassesEl = document.getElementById('totalClasses');
    const totalMembersEl = document.getElementById('totalClassMembers');
    const saigonMembersEl = document.getElementById('saigonMembers');
    const thuducMembersEl = document.getElementById('thuducMembers');
    
    if (totalClassesEl) totalClassesEl.textContent = allClasses.length;
    if (totalMembersEl) totalMembersEl.textContent = totalMembers;
    if (saigonMembersEl) saigonMembersEl.textContent = saigonCount;
    if (thuducMembersEl) thuducMembersEl.textContent = thuducCount;
}

/**
 * Xem danh sách thành viên của lớp
 */
function viewClassMembers(classCode) {
    const members = classMembers[classCode] || [];
    const className = allClasses.find(c => c.code === classCode)?.name || '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let memberListHtml = '';
    if (members.length === 0) {
        memberListHtml = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-users" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <p style="font-size: 16px;">Chưa có thành viên nào trong lớp này</p>
                <p style="font-size: 14px; color: #999;">Hãy thêm thành viên để bắt đầu quản lý</p>
            </div>
        `;
    } else {
        memberListHtml = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>MSSV</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Điện thoại</th>
                            <th>Đai</th>
                            <th>Ngày tham gia</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(member => `
                            <tr>
                                <td>${member.student_id}</td>
                                <td>${member.name}</td>
                                <td>${member.email}</td>
                                <td>${member.phone}</td>
                                <td><span class="belt-badge ${member.belt.toLowerCase()}">${member.belt}</span></td>
                                <td>${new Date(member.joined_date).toLocaleDateString('vi-VN')}</td>
                                <td><span class="status-badge ${member.status}">${member.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-users"></i> ${className}</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="member-stats">
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <div class="stat-number">${members.length}</div>
                            <div class="stat-label">Tổng thành viên</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-user-check"></i>
                        <div>
                            <div class="stat-number">${members.filter(m => m.status === 'active').length}</div>
                            <div class="stat-label">Đang hoạt động</div>
                        </div>
                    </div>
                </div>
                
                ${memberListHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Hiển thị form thêm thành viên
 */
function showAddMemberForm(classCode) {
    showNotification('Chức năng thêm thành viên đang được phát triển', 'info');
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadClassList,
        viewClassMembers,
        showAddMemberForm
    };
}
