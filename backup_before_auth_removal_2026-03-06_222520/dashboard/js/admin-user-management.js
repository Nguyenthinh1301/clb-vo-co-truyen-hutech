/**
 * Admin User Management JavaScript
 * Quản lý thành viên và phân lớp học
 */

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    search: '',
    status: '',
    role: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadStatistics();
    loadUsers();
    
    // Setup search with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = this.value;
            currentPage = 1;
            loadUsers();
        }, 500);
    });
});

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load statistics');

        const result = await response.json();
        if (result.success) {
            const stats = result.data.stats;
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('pendingUsers').textContent = stats.recentRegistrations || 0;
            document.getElementById('activeUsers').textContent = stats.totalUsers || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }

    // Load unassigned users count
    try {
        const response = await fetch(`${API_BASE_URL}/admin/class-management/unassigned-users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                document.getElementById('unassignedUsers').textContent = result.data.length;
            }
        }
    } catch (error) {
        console.error('Error loading unassigned users:', error);
    }
}

// Load users
async function loadUsers() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const usersTable = document.getElementById('usersTable');
    const tbody = document.getElementById('usersTableBody');

    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    usersTable.style.display = 'none';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            search: currentFilters.search,
            role: currentFilters.role,
            status: currentFilters.status
        });

        const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load users');

        const result = await response.json();
        
        loadingState.style.display = 'none';

        if (!result.success || !result.data.users || result.data.users.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        // Handle nested array structure from MSSQL adapter
        let users = result.data.users;
        if (Array.isArray(users[0]) && users[0].length > 0) {
            users = users[0]; // Extract the actual users array
        }
        
        totalPages = result.data.pagination.pages;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.full_name || `${user.first_name} ${user.last_name}`}</td>
                <td>${user.phone_number || 'N/A'}</td>
                <td>
                    <span class="status-badge status-${user.membership_status}">
                        ${getStatusText(user.membership_status)}
                    </span>
                </td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        ${user.membership_status === 'pending' ? 
                            `<button class="btn btn-success" onclick="approveUser(${user.id})">✓ Duyệt</button>` : ''}
                        <button class="btn btn-info" onclick="viewUserDetail(${user.id})">👁️ Xem</button>
                        <button class="btn btn-warning" onclick="editUser(${user.id})">✏️ Sửa</button>
                        <button class="btn btn-primary" onclick="assignClass(${user.id})">📚 Phân lớp</button>
                    </div>
                </td>
            </tr>
        `).join('');

        usersTable.style.display = 'table';
        renderPagination();

    } catch (error) {
        console.error('Error loading users:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        showNotification('Lỗi khi tải danh sách thành viên', 'error');
    }
}

// Apply filters
function applyFilters() {
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.role = document.getElementById('roleFilter').value;
    currentPage = 1;
    loadUsers();
}

// Refresh users
function refreshUsers() {
    currentPage = 1;
    currentFilters = { search: '', status: '', role: '' };
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('roleFilter').value = '';
    loadUsers();
    loadStatistics();
}

// Approve user
async function approveUser(userId) {
    if (!confirm('Bạn có chắc muốn phê duyệt thành viên này?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Đã phê duyệt thành viên thành công', 'success');
            loadUsers();
            loadStatistics();
        } else {
            showNotification(result.message || 'Lỗi khi phê duyệt thành viên', 'error');
        }
    } catch (error) {
        console.error('Error approving user:', error);
        showNotification('Lỗi khi phê duyệt thành viên', 'error');
    }
}

// View user detail
async function viewUserDetail(userId) {
    const modal = document.getElementById('userDetailModal');
    const content = document.getElementById('userDetailContent');
    
    content.innerHTML = '<p>Đang tải...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const user = result.data.user;
            const classes = result.data.classes || [];
            
            content.innerHTML = `
                <div class="user-detail">
                    <h3>Thông Tin Cá Nhân</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Họ Tên:</strong> ${user.full_name || `${user.first_name} ${user.last_name}`}</p>
                    <p><strong>Số Điện Thoại:</strong> ${user.phone_number || 'N/A'}</p>
                    <p><strong>Vai Trò:</strong> ${getRoleText(user.role)}</p>
                    <p><strong>Trạng Thái:</strong> ${getStatusText(user.membership_status)}</p>
                    <p><strong>Ngày Đăng Ký:</strong> ${formatDate(user.created_at)}</p>
                    
                    <h3 style="margin-top: 20px;">Lớp Học</h3>
                    ${classes.length > 0 ? `
                        <ul>
                            ${classes.map(cls => `
                                <li>${cls.name} - ${cls.schedule || 'N/A'}</li>
                            `).join('')}
                        </ul>
                    ` : '<p>Chưa được phân lớp</p>'}
                    
                    <h3 style="margin-top: 20px;">Thống Kê</h3>
                    <p><strong>Số lớp:</strong> ${result.data.stats.classCount}</p>
                    <p><strong>Điểm danh:</strong> ${result.data.stats.attendanceCount} lần</p>
                    <p><strong>Tỷ lệ tham gia:</strong> ${result.data.stats.attendanceRate}%</p>
                </div>
            `;
        } else {
            content.innerHTML = '<p>Không thể tải thông tin thành viên</p>';
        }
    } catch (error) {
        console.error('Error loading user detail:', error);
        content.innerHTML = '<p>Lỗi khi tải thông tin</p>';
    }
}

function closeUserDetailModal() {
    document.getElementById('userDetailModal').style.display = 'none';
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const user = result.data.user;
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editFirstName').value = user.first_name || '';
            document.getElementById('editLastName').value = user.last_name || '';
            document.getElementById('editPhone').value = user.phone_number || '';
            document.getElementById('editStatus').value = user.membership_status || 'pending';
            document.getElementById('editNotes').value = user.notes || '';
            
            document.getElementById('editUserModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading user for edit:', error);
        showNotification('Lỗi khi tải thông tin thành viên', 'error');
    }
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

// Handle edit form submission
document.getElementById('editUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const data = {
        first_name: document.getElementById('editFirstName').value,
        last_name: document.getElementById('editLastName').value,
        phone_number: document.getElementById('editPhone').value,
        membership_status: document.getElementById('editStatus').value,
        notes: document.getElementById('editNotes').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/profile`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Cập nhật thông tin thành công', 'success');
            closeEditUserModal();
            loadUsers();
        } else {
            showNotification(result.message || 'Lỗi khi cập nhật thông tin', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Lỗi khi cập nhật thông tin', 'error');
    }
});

// Assign class
async function assignClass(userId) {
    const modal = document.getElementById('assignClassModal');
    const content = document.getElementById('assignClassContent');
    
    content.innerHTML = '<p>Đang tải danh sách lớp học...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/classes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            const classes = result.data;
            
            content.innerHTML = `
                <div class="class-list">
                    <p>Chọn lớp học để phân công:</p>
                    ${classes.map(cls => `
                        <div class="class-item" style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 4px;">
                            <h4>${cls.name}</h4>
                            <p><strong>Lịch học:</strong> ${cls.schedule || 'N/A'}</p>
                            <p><strong>Địa điểm:</strong> ${cls.location || 'N/A'}</p>
                            <p><strong>Sĩ số:</strong> ${cls.current_students}/${cls.max_students || '∞'}</p>
                            <button class="btn btn-primary" onclick="confirmAssignClass(${userId}, ${cls.id})">
                                Phân công vào lớp này
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            content.innerHTML = '<p>Không có lớp học nào. Vui lòng tạo lớp học trước.</p>';
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        content.innerHTML = '<p>Lỗi khi tải danh sách lớp học</p>';
    }
}

async function confirmAssignClass(userId, classId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/class-management/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, classId })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Đã phân công lớp học thành công', 'success');
            closeAssignClassModal();
            loadUsers();
            loadStatistics();
        } else {
            showNotification(result.message || 'Lỗi khi phân công lớp học', 'error');
        }
    } catch (error) {
        console.error('Error assigning class:', error);
        showNotification('Lỗi khi phân công lớp học', 'error');
    }
}

function closeAssignClassModal() {
    document.getElementById('assignClassModal').style.display = 'none';
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    let html = '';
    
    // Previous button
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">« Trước</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }
    
    // Next button
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Sau »</button>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadUsers();
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ phê duyệt',
        'active': 'Đã kích hoạt',
        'inactive': 'Không hoạt động',
        'suspended': 'Tạm ngưng'
    };
    return statusMap[status] || status;
}

function getRoleText(role) {
    const roleMap = {
        'student': 'Học viên',
        'instructor': 'Giảng viên',
        'admin': 'Quản trị viên'
    };
    return roleMap[role] || role;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function showNotification(message, type = 'info') {
    // Use existing notification system from dashboard-core.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
