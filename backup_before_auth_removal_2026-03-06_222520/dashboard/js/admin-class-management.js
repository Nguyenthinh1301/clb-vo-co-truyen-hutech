/**
 * Admin Class Management
 * Quản lý lớp học cho Admin
 */

let allClasses = [];
let allInstructors = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = '../website/views/account/dang-nhap.html';
        return;
    }

    const user = Auth.getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'instructor') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'user-dashboard.html';
        return;
    }

    await loadClasses();
    await loadInstructors();
});

// Load all classes
async function loadClasses() {
    try {
        const response = await ApiClient.get('/api/classes');
        
        if (response.success) {
            allClasses = response.data;
            displayClasses();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Không thể tải danh sách lớp học');
    }
}

// Load instructors
async function loadInstructors() {
    try {
        const response = await ApiClient.get('/api/admin/users?role=instructor');
        
        if (response.success) {
            allInstructors = response.data.users || [];
        }
    } catch (error) {
        console.error('Error loading instructors:', error);
    }
}

// Display classes
function displayClasses() {
    const classList = document.getElementById('classList');
    
    if (!allClasses || allClasses.length === 0) {
        classList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <p>Chưa có lớp học nào</p>
                <button class="btn-primary" onclick="showCreateClassModal()">
                    <i class="fas fa-plus"></i> Tạo Lớp Đầu Tiên
                </button>
            </div>
        `;
        return;
    }

    classList.innerHTML = allClasses.map(cls => {
        const percentage = cls.max_students > 0 
            ? Math.round((cls.current_students / cls.max_students) * 100) 
            : 0;
        
        return `
            <div class="class-card">
                <div class="class-header">
                    <h3>${cls.name}</h3>
                    <span class="class-status ${cls.status}">${cls.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}</span>
                </div>
                <div class="class-info">
                    <div class="info-item">
                        <i class="fas fa-layer-group"></i>
                        <span>Cấp độ: ${cls.level || 'Chưa xác định'}</span>
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
                        <i class="fas fa-user-tie"></i>
                        <span>${cls.instructor_first_name} ${cls.instructor_last_name}</span>
                    </div>
                </div>
                <div class="class-stats">
                    <div class="stat-row">
                        <span>Học viên:</span>
                        <strong>${cls.current_students || 0}/${cls.max_students || 0}</strong>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="stat-row">
                        <span>Học phí:</span>
                        <strong>${formatCurrency(cls.fee || 0)}</strong>
                    </div>
                </div>
                <div class="class-actions">
                    <button class="btn-view" onclick="viewClassStudents(${cls.id})">
                        <i class="fas fa-users"></i> Học viên
                    </button>
                    <button class="btn-edit" onclick="editClass(${cls.id})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn-delete" onclick="deleteClass(${cls.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const totalClasses = allClasses.length;
    const activeClasses = allClasses.filter(c => c.status === 'active').length;
    const totalStudents = allClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);
    const totalCapacity = allClasses.reduce((sum, c) => sum + (c.max_students || 0), 0);
    const fillRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('activeClasses').textContent = activeClasses;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('fillRate').textContent = fillRate + '%';
}

// Show create class modal
function showCreateClassModal() {
    const modal = createModal('Tạo Lớp Học Mới', `
        <form id="createClassForm" onsubmit="handleCreateClass(event)">
            <div class="form-group">
                <label>Tên lớp học *</label>
                <input type="text" name="name" required placeholder="VD: Võ Cơ Bản - Sài Gòn Campus">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea name="description" placeholder="Mô tả về lớp học"></textarea>
            </div>
            <div class="form-group">
                <label>Cấp độ *</label>
                <select name="level" required>
                    <option value="">-- Chọn cấp độ --</option>
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                </select>
            </div>
            <div class="form-group">
                <label>Lịch học *</label>
                <input type="text" name="schedule" required placeholder="VD: Thứ 2, 4, 6 - 18:00-20:00">
            </div>
            <div class="form-group">
                <label>Địa điểm</label>
                <input type="text" name="location" placeholder="VD: Sân tập HUTECH - Sài Gòn Campus">
            </div>
            <div class="form-group">
                <label>Ngày bắt đầu *</label>
                <input type="date" name="start_date" required>
            </div>
            <div class="form-group">
                <label>Ngày kết thúc</label>
                <input type="date" name="end_date">
            </div>
            <div class="form-group">
                <label>Sĩ số tối đa *</label>
                <input type="number" name="max_students" required value="30" min="1">
            </div>
            <div class="form-group">
                <label>Học phí (VNĐ)</label>
                <input type="number" name="fee" value="0" min="0">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Hủy</button>
                <button type="submit" class="btn-primary">Tạo Lớp</button>
            </div>
        </form>
    `);
    
    document.body.appendChild(modal);
}

// Handle create class
async function handleCreateClass(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const user = Auth.getCurrentUser();
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        instructor_id: user.id, // Current admin/instructor
        level: formData.get('level'),
        schedule: formData.get('schedule'),
        location: formData.get('location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date') || null,
        max_students: parseInt(formData.get('max_students')),
        fee: parseInt(formData.get('fee')) || 0
    };

    try {
        const response = await ApiClient.post('/api/classes', data);
        
        if (response.success) {
            showSuccess('Tạo lớp học thành công!');
            closeModal();
            await loadClasses();
        } else {
            showError(response.message || 'Không thể tạo lớp học');
        }
    } catch (error) {
        console.error('Error creating class:', error);
        showError('Lỗi khi tạo lớp học');
    }
}

// Edit class
async function editClass(classId) {
    const cls = allClasses.find(c => c.id === classId);
    if (!cls) return;

    const modal = createModal('Chỉnh Sửa Lớp Học', `
        <form id="editClassForm" onsubmit="handleEditClass(event, ${classId})">
            <div class="form-group">
                <label>Tên lớp học *</label>
                <input type="text" name="name" required value="${cls.name}">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea name="description">${cls.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Cấp độ *</label>
                <select name="level" required>
                    <option value="beginner" ${cls.level === 'beginner' ? 'selected' : ''}>Cơ bản</option>
                    <option value="intermediate" ${cls.level === 'intermediate' ? 'selected' : ''}>Trung cấp</option>
                    <option value="advanced" ${cls.level === 'advanced' ? 'selected' : ''}>Nâng cao</option>
                </select>
            </div>
            <div class="form-group">
                <label>Lịch học *</label>
                <input type="text" name="schedule" required value="${cls.schedule || ''}">
            </div>
            <div class="form-group">
                <label>Địa điểm</label>
                <input type="text" name="location" value="${cls.location || ''}">
            </div>
            <div class="form-group">
                <label>Sĩ số tối đa *</label>
                <input type="number" name="max_students" required value="${cls.max_students}" min="1">
            </div>
            <div class="form-group">
                <label>Học phí (VNĐ)</label>
                <input type="number" name="fee" value="${cls.fee || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Trạng thái</label>
                <select name="status">
                    <option value="active" ${cls.status === 'active' ? 'selected' : ''}>Hoạt động</option>
                    <option value="inactive" ${cls.status === 'inactive' ? 'selected' : ''}>Tạm dừng</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Hủy</button>
                <button type="submit" class="btn-primary">Cập Nhật</button>
            </div>
        </form>
    `);
    
    document.body.appendChild(modal);
}

// Handle edit class
async function handleEditClass(event, classId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        level: formData.get('level'),
        schedule: formData.get('schedule'),
        location: formData.get('location'),
        max_students: parseInt(formData.get('max_students')),
        fee: parseInt(formData.get('fee')) || 0,
        status: formData.get('status')
    };

    try {
        const response = await ApiClient.put(`/api/classes/${classId}`, data);
        
        if (response.success) {
            showSuccess('Cập nhật lớp học thành công!');
            closeModal();
            await loadClasses();
        } else {
            showError(response.message || 'Không thể cập nhật lớp học');
        }
    } catch (error) {
        console.error('Error updating class:', error);
        showError('Lỗi khi cập nhật lớp học');
    }
}

// Delete class
async function deleteClass(classId) {
    const cls = allClasses.find(c => c.id === classId);
    if (!cls) return;

    if (!confirm(`Bạn có chắc muốn xóa lớp "${cls.name}"?\n\nLưu ý: Chỉ có thể xóa lớp không có học viên.`)) {
        return;
    }

    try {
        const response = await ApiClient.delete(`/api/classes/${classId}`);
        
        if (response.success) {
            showSuccess('Xóa lớp học thành công!');
            await loadClasses();
        } else {
            showError(response.message || 'Không thể xóa lớp học');
        }
    } catch (error) {
        console.error('Error deleting class:', error);
        showError('Lỗi khi xóa lớp học');
    }
}

// View class students
async function viewClassStudents(classId) {
    try {
        const response = await ApiClient.get(`/api/classes/${classId}/students`);
        
        if (!response.success) {
            showError('Không thể tải danh sách học viên');
            return;
        }

        const students = response.data.students || [];
        const cls = allClasses.find(c => c.id === classId);

        const modal = createModal(`Học Viên - ${cls.name}`, `
            <div style="margin-bottom: 20px;">
                <strong>Tổng số học viên:</strong> ${students.length}/${cls.max_students}
            </div>
            ${students.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Chưa có học viên nào trong lớp này</p>
                </div>
            ` : `
                <table class="students-table">
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Điện thoại</th>
                            <th>Đai</th>
                            <th>Ngày đăng ký</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr>
                                <td>${student.first_name} ${student.last_name}</td>
                                <td>${student.email}</td>
                                <td>${student.phone_number || 'N/A'}</td>
                                <td>${student.belt_level || 'Chưa có'}</td>
                                <td>${new Date(student.enrollment_date).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <button class="btn-remove" onclick="removeStudent(${classId}, ${student.id})">
                                        <i class="fas fa-times"></i> Xóa
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        `, 'large');
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Lỗi khi tải danh sách học viên');
    }
}

// Remove student from class
async function removeStudent(classId, userId) {
    if (!confirm('Bạn có chắc muốn xóa học viên này khỏi lớp?')) {
        return;
    }

    try {
        const response = await ApiClient.delete(`/api/classes/${classId}/students/${userId}`);
        
        if (response.success) {
            showSuccess('Xóa học viên thành công!');
            closeModal();
            await loadClasses();
        } else {
            showError(response.message || 'Không thể xóa học viên');
        }
    } catch (error) {
        console.error('Error removing student:', error);
        showError('Lỗi khi xóa học viên');
    }
}

// Utility functions
function createModal(title, content, size = '') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content ${size}">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-modal" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
