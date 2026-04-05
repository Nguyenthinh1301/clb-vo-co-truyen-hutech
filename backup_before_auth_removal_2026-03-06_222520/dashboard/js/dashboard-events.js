/**
 * Dashboard Events Module
 * Quản lý sự kiện trong hệ thống
 */

// Demo data - Sự kiện mẫu
let allEvents = [];

// Loại sự kiện
const EVENT_TYPES = {
    competition: 'Thi đấu',
    training: 'Huấn luyện',
    exchange: 'Giao lưu',
    seminar: 'Hội thảo',
    festival: 'Lễ hội',
    examination: 'Kiểm tra định kỳ'
};
// Trạng thái sự kiện
const EVENT_STATUS = {
    upcoming: 'Sắp tới',
    ongoing: 'Đang diễn ra',
    completed: 'Đã kết thúc',
    cancelled: 'Đã hủy'
};

/**
 * Khởi tạo module Events
 */
function initEventsModule() {
    console.log('Events module initialized');
    loadEventsList();
}

/**
 * Load danh sách sự kiện
 */
function loadEventsList() {
    const eventsContent = document.getElementById('events-content');
    if (!eventsContent) return;
    
    eventsContent.innerHTML = `
        <div class="events-header">
            <div class="header-left">
                <h2><i class="fas fa-calendar-alt"></i> Quản lý sự kiện</h2>
                <p class="subtitle">Tổng số: <strong>${allEvents.length}</strong> sự kiện</p>
            </div>
            <button class="action-btn primary" onclick="DashboardEvents.showCreateEventModal()">
                <i class="fas fa-plus"></i> Tạo sự kiện mới
            </button>
        </div>
        
        <div class="events-filters">
            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all">
                    <i class="fas fa-list"></i> Tất cả
                </button>
                <button class="filter-tab" data-filter="upcoming">
                    <i class="fas fa-clock"></i> Sắp tới
                </button>
                <button class="filter-tab" data-filter="ongoing">
                    <i class="fas fa-play-circle"></i> Đang diễn ra
                </button>
                <button class="filter-tab" data-filter="completed">
                    <i class="fas fa-check-circle"></i> Đã kết thúc
                </button>
            </div>
            
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="event-search" placeholder="Tìm kiếm sự kiện...">
            </div>
        </div>
        
        <div class="events-grid" id="events-grid">
            ${allEvents.length === 0 ? renderEmptyState() : renderEventCards(allEvents)}
        </div>
    `;
    
    // Attach event listeners
    attachEventListeners();
}

/**
 * Render empty state
 */
function renderEmptyState() {
    return `
        <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>Chưa có sự kiện nào</h3>
            <p>Bắt đầu bằng cách tạo sự kiện đầu tiên của bạn</p>
            <button class="action-btn primary" onclick="DashboardEvents.showCreateEventModal()">
                <i class="fas fa-plus"></i> Tạo sự kiện mới
            </button>
        </div>
    `;
}

/**
 * Render event cards
 */
function renderEventCards(events) {
    if (events.length === 0) return renderEmptyState();
    
    return events.map(event => {
        const status = getEventStatus(event);
        const progress = (event.registered / event.max_participants * 100).toFixed(0);
        
        return `
            <div class="event-card" data-status="${status}">
                <div class="event-image" style="background-image: url('${event.image || 'https://via.placeholder.com/400x200?text=Event'}')">
                    <span class="event-badge ${status}">${EVENT_STATUS[status]}</span>
                    <span class="event-type">${EVENT_TYPES[event.type]}</span>
                </div>
                
                <div class="event-content">
                    <h3 class="event-title">${escapeHtml(event.title)}</h3>
                    <p class="event-description">${escapeHtml(event.description || 'Không có mô tả')}</p>
                    
                    <div class="event-info">
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(event.start_date)}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <span>${event.start_time} - ${event.end_time}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHtml(event.location)}</span>
                        </div>
                    </div>
                    
                    <div class="event-participants">
                        <div class="participants-info">
                            <i class="fas fa-users"></i>
                            <span>${event.registered} / ${event.max_participants} người</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="event-actions">
                        <button class="action-btn small" onclick="DashboardEvents.viewEventDetails(${event.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn small" onclick="DashboardEvents.manageParticipants(${event.id})" title="Quản lý người tham gia">
                            <i class="fas fa-users"></i>
                        </button>
                        <button class="action-btn small" onclick="DashboardEvents.editEvent(${event.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn small danger" onclick="DashboardEvents.deleteEvent(${event.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Xác định trạng thái sự kiện
 */
function getEventStatus(event) {
    const now = new Date();
    const startDate = new Date(event.start_date + ' ' + event.start_time);
    const endDate = new Date(event.end_date + ' ' + event.end_time);
    
    if (event.status === 'cancelled') return 'cancelled';
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
}

/**
 * Format date
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterEvents(filter);
        });
    });
    
    // Search
    const searchInput = document.getElementById('event-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchEvents(this.value);
        });
    }
}

/**
 * Filter events
 */
function filterEvents(filter) {
    let filtered = allEvents;
    
    if (filter !== 'all') {
        filtered = allEvents.filter(event => getEventStatus(event) === filter);
    }
    
    const grid = document.getElementById('events-grid');
    if (grid) {
        grid.innerHTML = renderEventCards(filtered);
    }
}

/**
 * Search events
 */
function searchEvents(query) {
    const filtered = allEvents.filter(event => 
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase())
    );
    
    const grid = document.getElementById('events-grid');
    if (grid) {
        grid.innerHTML = renderEventCards(filtered);
    }
}

/**
 * Show create event modal
 */
function showCreateEventModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> Tạo sự kiện mới</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="create-event-form" onsubmit="DashboardEvents.saveNewEvent(event)">
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label>Tên sự kiện <span class="required">*</span></label>
                            <input type="text" name="title" required placeholder="VD: Giải võ cổ truyền HUTECH 2026">
                        </div>
                        
                        <div class="form-group full-width">
                            <label>Mô tả</label>
                            <textarea name="description" rows="3" placeholder="Mô tả chi tiết về sự kiện..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Loại sự kiện <span class="required">*</span></label>
                            <select name="type" required>
                                <option value="">-- Chọn loại --</option>
                                <option value="competition">Thi đấu</option>
                                <option value="training">Huấn luyện</option>
                                <option value="exchange">Giao lưu</option>
                                <option value="seminar">Hội thảo</option>
                                <option value="festival">Lễ hội</option>
                                <option value="examination">Kiểm tra định kỳ</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Địa điểm <span class="required">*</span></label>
                            <input type="text" name="location" required placeholder="VD: Sân võ HUTECH">
                        </div>
                        
                        <div class="form-group">
                            <label>Ngày bắt đầu <span class="required">*</span></label>
                            <input type="date" name="start_date" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Ngày kết thúc <span class="required">*</span></label>
                            <input type="date" name="end_date" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Giờ bắt đầu <span class="required">*</span></label>
                            <input type="time" name="start_time" required value="08:00">
                        </div>
                        
                        <div class="form-group">
                            <label>Giờ kết thúc <span class="required">*</span></label>
                            <input type="time" name="end_time" required value="17:00">
                        </div>
                        
                        <div class="form-group">
                            <label>Số người tối đa <span class="required">*</span></label>
                            <input type="number" name="max_participants" required min="1" value="100">
                        </div>
                        
                        <div class="form-group">
                            <label>URL ảnh banner</label>
                            <input type="url" name="image" placeholder="https://example.com/image.jpg">
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="action-btn success">
                            <i class="fas fa-save"></i> Tạo sự kiện
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
 * Save new event
 */
function saveNewEvent(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newEvent = {
        id: Date.now(),
        title: formData.get('title'),
        description: formData.get('description'),
        type: formData.get('type'),
        location: formData.get('location'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        max_participants: parseInt(formData.get('max_participants')),
        registered: 0,
        image: formData.get('image') || null,
        status: 'active',
        created_at: new Date().toISOString()
    };
    
    allEvents.unshift(newEvent);
    loadEventsList();
    document.querySelector('.modal-overlay').remove();
    showNotification('Tạo sự kiện thành công!', 'success');
}

/**
 * View event details
 */
function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const status = getEventStatus(event);
    const progress = (event.registered / event.max_participants * 100).toFixed(0);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> Chi tiết sự kiện</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="event-details">
                    ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-detail-image">` : ''}
                    
                    <div class="detail-section">
                        <h3>${escapeHtml(event.title)}</h3>
                        <span class="event-badge ${status}">${EVENT_STATUS[status]}</span>
                        <span class="event-type-badge">${EVENT_TYPES[event.type]}</span>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-align-left"></i> Mô tả</h4>
                        <p>${escapeHtml(event.description || 'Không có mô tả')}</p>
                    </div>
                    
                    <div class="detail-grid">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <div>
                                <strong>Ngày bắt đầu</strong>
                                <p>${formatDate(event.start_date)} ${event.start_time}</p>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar-check"></i>
                            <div>
                                <strong>Ngày kết thúc</strong>
                                <p>${formatDate(event.end_date)} ${event.end_time}</p>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <strong>Địa điểm</strong>
                                <p>${escapeHtml(event.location)}</p>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <div>
                                <strong>Người tham gia</strong>
                                <p>${event.registered} / ${event.max_participants}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-chart-line"></i> Tỷ lệ đăng ký</h4>
                        <div class="progress-bar large">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <p class="progress-text">${progress}% (${event.registered}/${event.max_participants})</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Manage participants
 */
function manageParticipants(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2><i class="fas fa-users"></i> Quản lý người tham gia</h2>
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="participants-header">
                    <h3>${escapeHtml(event.title)}</h3>
                    <p>Đã đăng ký: <strong>${event.registered}</strong> / ${event.max_participants} người</p>
                </div>
                
                <div class="empty-state small">
                    <i class="fas fa-user-plus"></i>
                    <p>Chưa có người tham gia nào</p>
                    <p class="note">Tính năng quản lý người tham gia sẽ được phát triển sau</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Edit event
 */
function editEvent(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    showNotification('Tính năng chỉnh sửa đang được phát triển', 'info');
}

/**
 * Delete event
 */
function deleteEvent(eventId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
    
    const index = allEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
        allEvents.splice(index, 1);
        loadEventsList();
        showNotification('Đã xóa sự kiện', 'success');
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.DashboardEvents = {
        init: initEventsModule,
        loadEventsList,
        showCreateEventModal,
        saveNewEvent,
        viewEventDetails,
        manageParticipants,
        editEvent,
        deleteEvent
    };
}
