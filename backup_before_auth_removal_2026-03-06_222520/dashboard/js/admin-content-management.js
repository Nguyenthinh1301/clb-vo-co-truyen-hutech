/**
 * Admin Content Management
 * Quản lý thông báo và tin tức
 */

let currentTab = 'announcements';
let editingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = '../website/views/account/dang-nhap.html';
        return;
    }
    
    const user = Auth.getCurrentUser();
    if (user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'user-dashboard.html';
        return;
    }
    
    // Load initial data
    await loadAnnouncements();
    
    // Setup form handlers
    setupFormHandlers();
});

// Tab switching
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.content-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.content-tab').classList.add('active');
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tab}-section`).classList.add('active');
    
    // Load data
    if (tab === 'announcements') {
        loadAnnouncements();
    } else if (tab === 'news') {
        loadNews();
    }
}

// Load Announcements
async function loadAnnouncements() {
    const listEl = document.getElementById('announcements-list');
    listEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const token = Auth.getToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/announcements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data.announcements.length > 0) {
            listEl.innerHTML = result.data.announcements.map(announcement => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${escapeHtml(announcement.title)}</div>
                        <div class="content-meta">
                            <span><i class="fas fa-tag"></i> ${getTypeLabel(announcement.type)}</span>
                            <span><i class="fas fa-flag"></i> ${getPriorityLabel(announcement.priority)}</span>
                            <span><i class="fas fa-users"></i> ${getAudienceLabel(announcement.target_audience)}</span>
                            <span class="badge badge-${announcement.status}">${getStatusLabel(announcement.status)}</span>
                            <span><i class="fas fa-clock"></i> ${formatDate(announcement.created_at)}</span>
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="btn-icon btn-edit" onclick="editAnnouncement(${announcement.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteAnnouncement(${announcement.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <p>Chưa có thông báo nào</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load announcements error:', error);
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Lỗi khi tải thông báo</p>
            </div>
        `;
    }
}

// Load News
async function loadNews() {
    const listEl = document.getElementById('news-list');
    listEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const token = Auth.getToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/news`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data.news.length > 0) {
            listEl.innerHTML = result.data.news.map(news => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${escapeHtml(news.title)}</div>
                        <div class="content-meta">
                            <span><i class="fas fa-folder"></i> ${getCategoryLabel(news.category)}</span>
                            <span class="badge badge-${news.status}">${getStatusLabel(news.status)}</span>
                            <span><i class="fas fa-eye"></i> ${news.views} lượt xem</span>
                            <span><i class="fas fa-clock"></i> ${formatDate(news.published_at || news.created_at)}</span>
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="btn-icon btn-edit" onclick="editNews(${news.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteNews(${news.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>Chưa có tin tức nào</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load news error:', error);
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Lỗi khi tải tin tức</p>
            </div>
        `;
    }
}

// Modal functions
function openAnnouncementModal(id = null) {
    editingId = id;
    const modal = document.getElementById('announcement-modal');
    const form = document.getElementById('announcement-form');
    
    if (id) {
        document.getElementById('announcement-modal-title').textContent = 'Chỉnh sửa thông báo';
        loadAnnouncementData(id);
    } else {
        document.getElementById('announcement-modal-title').textContent = 'Tạo thông báo mới';
        form.reset();
    }
    
    modal.classList.add('active');
}

function closeAnnouncementModal() {
    document.getElementById('announcement-modal').classList.remove('active');
    document.getElementById('announcement-form').reset();
    editingId = null;
}

function openNewsModal(id = null) {
    editingId = id;
    const modal = document.getElementById('news-modal');
    const form = document.getElementById('news-form');
    
    if (id) {
        document.getElementById('news-modal-title').textContent = 'Chỉnh sửa tin tức';
        loadNewsData(id);
    } else {
        document.getElementById('news-modal-title').textContent = 'Tạo tin tức mới';
        form.reset();
    }
    
    modal.classList.add('active');
}

function closeNewsModal() {
    document.getElementById('news-modal').classList.remove('active');
    document.getElementById('news-form').reset();
    editingId = null;
}

// Load data for editing
async function loadAnnouncementData(id) {
    try {
        const token = Auth.getToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/announcements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        const announcement = result.data.announcements.find(a => a.id === id);
        
        if (announcement) {
            document.getElementById('announcement-id').value = announcement.id;
            document.getElementById('announcement-title').value = announcement.title;
            document.getElementById('announcement-content').value = announcement.content;
            document.getElementById('announcement-type').value = announcement.type;
            document.getElementById('announcement-priority').value = announcement.priority;
            document.getElementById('announcement-audience').value = announcement.target_audience;
            if (announcement.expires_at) {
                document.getElementById('announcement-expires').value = formatDateTimeLocal(announcement.expires_at);
            }
        }
    } catch (error) {
        console.error('Load announcement data error:', error);
        alert('Lỗi khi tải dữ liệu thông báo');
    }
}

async function loadNewsData(id) {
    try {
        const token = Auth.getToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/news`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        const news = result.data.news.find(n => n.id === id);
        
        if (news) {
            document.getElementById('news-id').value = news.id;
            document.getElementById('news-title').value = news.title;
            document.getElementById('news-excerpt').value = news.excerpt || '';
            document.getElementById('news-content').value = news.content;
            document.getElementById('news-category').value = news.category;
            document.getElementById('news-status').value = news.status;
        }
    } catch (error) {
        console.error('Load news data error:', error);
        alert('Lỗi khi tải dữ liệu tin tức');
    }
}

// Edit functions
function editAnnouncement(id) {
    openAnnouncementModal(id);
}

function editNews(id) {
    openNewsModal(id);
}

// Delete functions
async function deleteAnnouncement(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
        return;
    }
    
    try {
        const token = Auth.getToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/announcements/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Xóa thông báo thành công');
            loadAnnouncements();
        } else {
            alert(result.message || 'Lỗi khi xóa thông báo');
        }
    } catch (error) {
        console.error('Delete announcement error:', error);
        alert('Lỗi khi xóa thông báo');
    }
}

async function deleteNews(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
        return;
    }
    
    try {
        const token = Auth.getToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/news/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Xóa tin tức thành công');
            loadNews();
        } else {
            alert(result.message || 'Lỗi khi xóa tin tức');
        }
    } catch (error) {
        console.error('Delete news error:', error);
        alert('Lỗi khi xóa tin tức');
    }
}

// Form handlers
function setupFormHandlers() {
    // Announcement form
    document.getElementById('announcement-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('announcement-title').value,
            content: document.getElementById('announcement-content').value,
            type: document.getElementById('announcement-type').value,
            priority: document.getElementById('announcement-priority').value,
            target_audience: document.getElementById('announcement-audience').value,
            expires_at: document.getElementById('announcement-expires').value || null
        };
        
        try {
            const token = Auth.getToken();
            const id = document.getElementById('announcement-id').value;
            const url = id 
                ? `${API_CONFIG.BASE_URL}/api/admin/content/announcements/${id}`
                : `${API_CONFIG.BASE_URL}/api/admin/content/announcements`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(id ? 'Cập nhật thông báo thành công' : 'Tạo thông báo thành công');
                closeAnnouncementModal();
                loadAnnouncements();
            } else {
                alert(result.message || 'Lỗi khi lưu thông báo');
            }
        } catch (error) {
            console.error('Save announcement error:', error);
            alert('Lỗi khi lưu thông báo');
        }
    });
    
    // News form
    document.getElementById('news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('news-title').value,
            excerpt: document.getElementById('news-excerpt').value,
            content: document.getElementById('news-content').value,
            category: document.getElementById('news-category').value,
            status: document.getElementById('news-status').value
        };
        
        try {
            const token = Auth.getToken();
            const id = document.getElementById('news-id').value;
            const url = id 
                ? `${API_CONFIG.BASE_URL}/api/admin/content/news/${id}`
                : `${API_CONFIG.BASE_URL}/api/admin/content/news`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(id ? 'Cập nhật tin tức thành công' : 'Tạo tin tức thành công');
                closeNewsModal();
                loadNews();
            } else {
                alert(result.message || 'Lỗi khi lưu tin tức');
            }
        } catch (error) {
            console.error('Save news error:', error);
            alert('Lỗi khi lưu tin tức');
        }
    });
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getTypeLabel(type) {
    const labels = {
        'general': 'Thông thường',
        'urgent': 'Khẩn cấp',
        'info': 'Thông tin',
        'warning': 'Cảnh báo'
    };
    return labels[type] || type;
}

function getPriorityLabel(priority) {
    const labels = {
        'low': 'Thấp',
        'normal': 'Bình thường',
        'high': 'Cao',
        'urgent': 'Khẩn cấp'
    };
    return labels[priority] || priority;
}

function getAudienceLabel(audience) {
    const labels = {
        'all': 'Tất cả',
        'student': 'Học viên',
        'instructor': 'Huấn luyện viên',
        'admin': 'Quản trị viên'
    };
    return labels[audience] || audience;
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Hoạt động',
        'inactive': 'Không hoạt động',
        'draft': 'Nháp',
        'published': 'Đã xuất bản',
        'archived': 'Lưu trữ'
    };
    return labels[status] || status;
}

function getCategoryLabel(category) {
    const labels = {
        'general': 'Chung',
        'event': 'Sự kiện',
        'achievement': 'Thành tích',
        'training': 'Đào tạo'
    };
    return labels[category] || category;
}
