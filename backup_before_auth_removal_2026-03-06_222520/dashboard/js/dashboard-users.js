/**
 * ============================================
 * DASHBOARD USERS MODULE
 * ============================================
 * File: dashboard-users.js
 * Mục đích: Quản lý người dùng
 */

// Biến toàn cục
let allUsers = [];
let userClassEnrollments = {}; // Lưu thông tin đăng ký lớp của user

/**
 * Load danh sách người dùng
 */
async function loadUserList() {
    const userListDiv = document.getElementById('userList');
    userListDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><div>Đang tải danh sách thành viên...</div></div>';
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/members`, {
            headers: { 
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                allUsers = data.data;
                displayUserList(allUsers);
            } else {
                userListDiv.innerHTML = '<div class="error">Không có dữ liệu thành viên</div>';
            }
        } else {
            const errorData = await response.json();
            userListDiv.innerHTML = `<div class="error">${errorData.message || 'Không thể tải danh sách thành viên'}</div>`;
        }
    } catch (error) {
        console.error('Error loading members:', error);
        userListDiv.innerHTML = '<div class="error">Lỗi kết nối đến server. Vui lòng thử lại sau.</div>';
    }
}

/**
 * Hiển thị danh sách người dùng
 * @param {Array} users - Mảng người dùng
 */
function displayUserList(users) {
    const userListDiv = document.getElementById('userList');
    
    if (!users || users.length === 0) {
        userListDiv.innerHTML = '<div class="loading">Không có người dùng nào</div>';
        return;
    }
    
    let html = '<div class="table-wrapper">';
    html += '<table class="data-table"><thead><tr>';
    html += '<th>ID</th><th>Email</th><th>Tên</th><th>Vai trò</th><th>Lớp</th><th>Trạng thái</th><th>Hành động</th>';
    html += '</tr></thead><tbody>';
    
    users.forEach(user => {
        const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
        const statusClass = user.is_active ? 'active' : 'inactive';
        const statusText = user.is_active ? 'Hoạt động' : 'Không hoạt động';
        
        // Lấy thông tin lớp đã đăng ký
        const enrolledClass = userClassEnrollments[user.id] || 'Chưa đăng ký';
        
        html += `<tr>
            <td>${user.id}</td>
            <td title="${escapeHtml(user.email)}">${escapeHtml(user.email)}</td>
            <td>${escapeHtml(fullName)}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td><span class="class-badge">${enrolledClass}</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn small" onclick="viewUserDetail(${user.id})" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn small" onclick="editUser(${user.id})" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn small ${user.is_active ? 'danger' : 'success'}" onclick="toggleUserStatus(${user.id}, ${!user.is_active})" title="${user.is_active ? 'Vô hiệu' : 'Kích hoạt'}">
                    <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    userListDiv.innerHTML = html;
}

/**
 * Lọc người dùng theo tìm kiếm và vai trò
 */
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = allUsers.filter(user => {
        const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const matchSearch = !searchTerm || 
            user.email.toLowerCase().includes(searchTerm) ||
            fullName.toLowerCase().includes(searchTerm);
        
        const matchRole = !roleFilter || user.role === roleFilter;
        const matchStatus = !statusFilter || 
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);
        
        return matchSearch && matchRole && matchStatus;
    });
    
    displayUserList(filtered);
}

/**
 * Chuyển đổi trạng thái người dùng
 * @param {number} userId - ID người dùng
 * @param {boolean} newStatus - Trạng thái mới
 */
async function toggleUserStatus(userId, newStatus) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: newStatus })
        });
        
        if (response.ok) {
            showNotification('Cập nhật trạng thái thành công', 'success');
            loadUserList();
        } else {
            showNotification('Không thể cập nhật trạng thái', 'error');
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        showNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
}

/**
 * Hiển thị form thêm người dùng
 */
function showAddUserForm() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-user-plus"></i> Thêm thành viên mới</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addUserForm" onsubmit="saveNewUser(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Email * <span class="field-hint">(Dùng để đăng nhập)</span></label>
                            <input type="email" name="email" required class="form-input" placeholder="example@student.hutech.edu.vn">
                        </div>
                        
                        <div class="form-group">
                            <label>Mật khẩu * <span class="field-hint">(Tối thiểu 6 ký tự)</span></label>
                            <div class="password-input-group">
                                <input type="password" name="password" id="newUserPassword" required minlength="6" class="form-input" placeholder="••••••">
                                <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('newUserPassword')">
                                    <i class="fas fa-eye" id="newUserPassword-icon"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Họ *</label>
                            <input type="text" name="first_name" required class="form-input" placeholder="Nguyễn">
                        </div>
                        
                        <div class="form-group">
                            <label>Tên *</label>
                            <input type="text" name="last_name" required class="form-input" placeholder="Văn A">
                        </div>
                        
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="tel" name="phone" class="form-input" placeholder="0901234567" pattern="[0-9]{10}">
                            <small class="field-hint">10 chữ số</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Ngày sinh</label>
                            <input type="date" name="date_of_birth" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Giới tính</label>
                            <select name="gender" class="form-input">
                                <option value="">-- Chọn giới tính --</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Vai trò *</label>
                            <select name="role" required class="form-input">
                                <option value="member">Thành viên</option>
                                <option value="instructor">Huấn luyện viên</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Lớp học</label>
                            <select name="class" class="form-input">
                                <option value="">-- Chưa đăng ký lớp --</option>
                                <option value="Sài Gòn Campus">Lớp Sài Gòn Campus</option>
                                <option value="Thủ Đức Campus">Lớp Thủ Đức Campus</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Trạng thái *</label>
                            <select name="is_active" required class="form-input">
                                <option value="1" selected>Hoạt động</option>
                                <option value="0">Không hoạt động</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Địa chỉ</label>
                        <textarea name="address" class="form-input" rows="2" placeholder="Số nhà, đường, phường, quận, thành phố"></textarea>
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Ghi chú</label>
                        <textarea name="notes" class="form-input" rows="2" placeholder="Thông tin bổ sung về thành viên"></textarea>
                    </div>
                    
                    <div class="form-notice">
                        <i class="fas fa-info-circle"></i>
                        <span>Thông tin đăng nhập sẽ được gửi qua email sau khi tạo tài khoản thành công.</span>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="action-btn success">
                            <i class="fas fa-save"></i> Tạo thành viên
                        </button>
                        <button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Toggle hiển thị mật khẩu
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/**
 * Lưu thành viên mới
 */
async function saveNewUser(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    
    const formData = new FormData(event.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone') || null,
        date_of_birth: formData.get('date_of_birth') || null,
        gender: formData.get('gender') || null,
        role: formData.get('role') || 'member',
        is_active: parseInt(formData.get('is_active')),
        address: formData.get('address') || null
    };
    
    const selectedClass = formData.get('class');
    
    try {
        // Gọi API tạo thành viên mới
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/members`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Lưu thông tin lớp nếu có
            if (selectedClass && result.data.id) {
                userClassEnrollments[result.data.id] = selectedClass;
            }
            
            // Reload danh sách
            await loadUserList();
            
            // Thông báo thành công
            showNotification(`Đã tạo thành viên ${data.first_name} ${data.last_name} thành công!`, 'success');
            
            // Đóng modal
            document.querySelector('.modal-overlay').remove();
        } else {
            throw new Error(result.message || 'Không thể tạo thành viên');
        }
        
    } catch (error) {
        console.error('Error creating member:', error);
        showNotification('Lỗi khi tạo thành viên: ' + error.message, 'error');
        
        // Re-enable button
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-save"></i> Tạo thành viên';
    }
}
    }
}

/**
 * Gửi email chào mừng (placeholder)
 */
async function sendWelcomeEmail(userId) {
    // TODO: Implement email sending
    console.log('Sending welcome email to user:', userId);
}

/**
 * Xuất danh sách người dùng ra Excel
 */
function exportUsers() {
    try {
        // Tạo CSV content
        let csv = 'ID,Email,Họ tên,Vai trò,Lớp,Trạng thái,Ngày tạo\n';
        
        allUsers.forEach(user => {
            const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
            const enrolledClass = userClassEnrollments[user.id] || 'Chưa đăng ký';
            const status = user.is_active ? 'Hoạt động' : 'Không hoạt động';
            const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A';
            
            csv += `${user.id},"${user.email}","${fullName}",${user.role},"${enrolledClass}",${status},${createdDate}\n`;
        });
        
        // Tạo Blob và download
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `danh-sach-thanh-vien-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Đã xuất danh sách thành công!', 'success');
    } catch (error) {
        console.error('Error exporting users:', error);
        showNotification('Lỗi khi xuất danh sách', 'error');
    }
}

/**
 * Xem chi tiết thành viên
 */
function viewUserDetail(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Không tìm thấy thành viên', 'error');
        return;
    }
    
    const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
    const enrolledClass = userClassEnrollments[user.id] || 'Chưa đăng ký';
    const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A';
    const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString('vi-VN') : 'Chưa đăng nhập';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-user"></i> Chi tiết thành viên</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="user-detail-grid">
                    <div class="user-avatar-section">
                        <div class="user-avatar-large">${fullName.charAt(0).toUpperCase()}</div>
                        <h3>${escapeHtml(fullName)}</h3>
                        <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                            ${user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                    </div>
                    
                    <div class="user-info-section">
                        <div class="info-group">
                            <label><i class="fas fa-envelope"></i> Email:</label>
                            <span>${escapeHtml(user.email)}</span>
                        </div>
                        
                        <div class="info-group">
                            <label><i class="fas fa-user-tag"></i> Vai trò:</label>
                            <span class="status-badge ${user.role}">${user.role}</span>
                        </div>
                        
                        <div class="info-group">
                            <label><i class="fas fa-graduation-cap"></i> Lớp học:</label>
                            <span class="class-badge">${enrolledClass}</span>
                        </div>
                        
                        <div class="info-group">
                            <label><i class="fas fa-calendar-plus"></i> Ngày tạo:</label>
                            <span>${createdDate}</span>
                        </div>
                        
                        <div class="info-group">
                            <label><i class="fas fa-clock"></i> Đăng nhập cuối:</label>
                            <span>${lastLogin}</span>
                        </div>
                        
                        ${user.phone ? `
                        <div class="info-group">
                            <label><i class="fas fa-phone"></i> Điện thoại:</label>
                            <span>${escapeHtml(user.phone)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="action-btn" onclick="editUser(${userId}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-edit"></i> Chỉnh sửa
                    </button>
                    <button class="action-btn" onclick="manageUserClasses(${userId}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-graduation-cap"></i> Quản lý lớp học
                    </button>
                    <button class="action-btn ${user.is_active ? 'danger' : 'success'}" onclick="toggleUserStatus(${userId}, ${!user.is_active}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i> ${user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Chỉnh sửa thông tin thành viên
 */
function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Không tìm thấy thành viên', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Chỉnh sửa thành viên</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="editUserForm" onsubmit="saveUserEdit(event, ${userId})">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" value="${user.email}" required class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Họ *</label>
                            <input type="text" name="first_name" value="${user.first_name || ''}" required class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Tên *</label>
                            <input type="text" name="last_name" value="${user.last_name || ''}" required class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Điện thoại</label>
                            <input type="tel" name="phone" value="${user.phone || ''}" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Vai trò *</label>
                            <select name="role" required class="form-input">
                                <option value="member" ${user.role === 'member' ? 'selected' : ''}>Thành viên</option>
                                <option value="instructor" ${user.role === 'instructor' ? 'selected' : ''}>Huấn luyện viên</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Quản trị viên</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Trạng thái *</label>
                            <select name="is_active" required class="form-input">
                                <option value="1" ${user.is_active ? 'selected' : ''}>Hoạt động</option>
                                <option value="0" ${!user.is_active ? 'selected' : ''}>Không hoạt động</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="action-btn success">
                            <i class="fas fa-save"></i> Lưu thay đổi
                        </button>
                        <button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Lưu chỉnh sửa thành viên
 */
async function saveUserEdit(event, userId) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    
    const formData = new FormData(event.target);
    const data = {
        email: formData.get('email'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone') || null,
        role: formData.get('role'),
        is_active: parseInt(formData.get('is_active'))
    };
    
    try {
        // Gọi API cập nhật
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/members/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Reload danh sách
            await loadUserList();
            
            showNotification('Cập nhật thành công!', 'success');
            document.querySelector('.modal-overlay').remove();
        } else {
            throw new Error(result.message || 'Không thể cập nhật thành viên');
        }
        
    } catch (error) {
        console.error('Error updating member:', error);
        showNotification('Lỗi khi cập nhật thông tin: ' + error.message, 'error');
        
        // Re-enable button
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
    }
}

/**
 * Quản lý đăng ký lớp học của thành viên
 */
function manageUserClasses(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Không tìm thấy thành viên', 'error');
        return;
    }
    
    const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const currentClass = userClassEnrollments[userId] || null;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-graduation-cap"></i> Quản lý lớp học</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="user-class-info">
                    <h3>${escapeHtml(fullName)}</h3>
                    <p>Lớp hiện tại: <strong>${currentClass || 'Chưa đăng ký'}</strong></p>
                </div>
                
                <div class="class-selection">
                    <h4>Chọn lớp học:</h4>
                    <div class="class-options">
                        <label class="class-option">
                            <input type="radio" name="class" value="" ${!currentClass ? 'checked' : ''}>
                            <span>Không đăng ký lớp nào</span>
                        </label>
                        <label class="class-option">
                            <input type="radio" name="class" value="Sài Gòn Campus" ${currentClass === 'Sài Gòn Campus' ? 'checked' : ''}>
                            <span>Lớp Sài Gòn Campus</span>
                        </label>
                        <label class="class-option">
                            <input type="radio" name="class" value="Thủ Đức Campus" ${currentClass === 'Thủ Đức Campus' ? 'checked' : ''}>
                            <span>Lớp Thủ Đức Campus</span>
                        </label>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="action-btn success" onclick="saveUserClass(${userId})">
                        <i class="fas fa-save"></i> Lưu thay đổi
                    </button>
                    <button class="action-btn" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Lưu đăng ký lớp học
 */
function saveUserClass(userId) {
    const selectedClass = document.querySelector('input[name="class"]:checked').value;
    
    if (selectedClass) {
        userClassEnrollments[userId] = selectedClass;
    } else {
        delete userClassEnrollments[userId];
    }
    
    displayUserList(allUsers);
    showNotification('Cập nhật lớp học thành công!', 'success');
    document.querySelector('.modal-overlay').remove();
}

/**
 * Hiển thị thống kê nâng cao
 */
function showUserStatistics() {
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    // Thống kê theo vai trò
    const roleStats = {
        member: allUsers.filter(u => u.role === 'member').length,
        instructor: allUsers.filter(u => u.role === 'instructor').length,
        admin: allUsers.filter(u => u.role === 'admin').length
    };
    
    // Thống kê theo lớp
    const classStats = {
        saigon: Object.values(userClassEnrollments).filter(c => c === 'Sài Gòn Campus').length,
        thuduc: Object.values(userClassEnrollments).filter(c => c === 'Thủ Đức Campus').length,
        none: totalUsers - Object.keys(userClassEnrollments).length
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-chart-bar"></i> Thống kê thành viên</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <!-- Tổng quan -->
                <div class="stats-overview">
                    <div class="stat-box">
                        <i class="fas fa-users"></i>
                        <div class="stat-number">${totalUsers}</div>
                        <div class="stat-label">Tổng thành viên</div>
                    </div>
                    <div class="stat-box success">
                        <i class="fas fa-user-check"></i>
                        <div class="stat-number">${activeUsers}</div>
                        <div class="stat-label">Đang hoạt động</div>
                    </div>
                    <div class="stat-box danger">
                        <i class="fas fa-user-times"></i>
                        <div class="stat-number">${inactiveUsers}</div>
                        <div class="stat-label">Không hoạt động</div>
                    </div>
                </div>
                
                <!-- Biểu đồ vai trò -->
                <div class="chart-section">
                    <h3>Phân bố theo vai trò</h3>
                    <div class="chart-bars">
                        <div class="chart-bar">
                            <div class="bar-label">Thành viên</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(roleStats.member/totalUsers*100)}%; background: #3498db;"></div>
                                <span class="bar-value">${roleStats.member}</span>
                            </div>
                        </div>
                        <div class="chart-bar">
                            <div class="bar-label">Huấn luyện viên</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(roleStats.instructor/totalUsers*100)}%; background: #2ecc71;"></div>
                                <span class="bar-value">${roleStats.instructor}</span>
                            </div>
                        </div>
                        <div class="chart-bar">
                            <div class="bar-label">Quản trị viên</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(roleStats.admin/totalUsers*100)}%; background: #e74c3c;"></div>
                                <span class="bar-value">${roleStats.admin}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Biểu đồ lớp học -->
                <div class="chart-section">
                    <h3>Phân bố theo lớp học</h3>
                    <div class="chart-bars">
                        <div class="chart-bar">
                            <div class="bar-label">Sài Gòn Campus</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(classStats.saigon/totalUsers*100)}%; background: #667eea;"></div>
                                <span class="bar-value">${classStats.saigon}</span>
                            </div>
                        </div>
                        <div class="chart-bar">
                            <div class="bar-label">Thủ Đức Campus</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(classStats.thuduc/totalUsers*100)}%; background: #f093fb;"></div>
                                <span class="bar-value">${classStats.thuduc}</span>
                            </div>
                        </div>
                        <div class="chart-bar">
                            <div class="bar-label">Chưa đăng ký</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(classStats.none/totalUsers*100)}%; background: #95a5a6;"></div>
                                <span class="bar-value">${classStats.none}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadUserList,
        displayUserList,
        filterUsers,
        toggleUserStatus,
        showAddUserForm,
        saveNewUser,
        togglePasswordVisibility,
        exportUsers,
        viewUserDetail,
        editUser,
        saveUserEdit,
        manageUserClasses,
        saveUserClass,
        showUserStatistics
    };
}


/**
 * Xóa thành viên
 */
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Không tìm thấy thành viên', 'error');
        return;
    }
    
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    if (!confirm(`Bạn có chắc chắn muốn xóa thành viên "${fullName}"?\n\nThành viên sẽ bị vô hiệu hóa và không thể đăng nhập.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/members/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Reload danh sách
            await loadUserList();
            
            showNotification(`Đã xóa thành viên "${fullName}" thành công!`, 'success');
        } else {
            throw new Error(result.message || 'Không thể xóa thành viên');
        }
        
    } catch (error) {
        console.error('Error deleting member:', error);
        showNotification('Lỗi khi xóa thành viên: ' + error.message, 'error');
    }
}
