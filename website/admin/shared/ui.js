/**
 * UI module - Toast, helpers, sidebar
 * Phụ thuộc: auth.js (phải load trước)
 */

/* ── TOAST ── */
function toast(msg, type = 'success') {
    let wrap = document.getElementById('toast-container');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toast-container';
        document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    const icons = { success: 'check-circle', danger: 'exclamation-circle', info: 'info-circle' };
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fas fa-${icons[type]||'info-circle'}"></i> ${msg}`;
    wrap.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.3s';
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

/* ── DOM HELPERS ── */
const $       = id => document.getElementById(id);
const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };

/**
 * Hiển thị spinner loading với timeout tự động
 * Nếu sau `timeoutMs` ms vẫn còn spinner → hiện thông báo lỗi
 * @param {string} id - element ID
 * @param {number} timeoutMs - timeout tính bằng ms (mặc định 15 giây)
 * @returns {Function} cancelFn - gọi để hủy timeout khi load xong
 */
function loading(id, timeoutMs = 15000) {
    setHTML(id, '<div class="loading"><div class="spinner"></div></div>');
    const timer = setTimeout(() => {
        const el = $(id);
        // Chỉ thay thế nếu vẫn đang hiện spinner (chưa bị ghi đè bởi data)
        if (el && el.querySelector('.spinner')) {
            el.innerHTML =
                '<div class="empty" style="color:#e74c3c;">' +
                '<i class="fas fa-exclamation-circle"></i>' +
                '<p>Không thể tải dữ liệu. Kiểm tra kết nối backend và thử lại.</p>' +
                '<button class="btn btn-outline btn-sm" style="margin-top:10px;" onclick="location.reload()">' +
                '<i class="fas fa-sync-alt"></i> Tải lại trang</button>' +
                '</div>';
        }
    }, timeoutMs);
    // Trả về hàm hủy timeout — gọi khi data đã load xong
    return () => clearTimeout(timer);
}

const empty   = (id, icon, msg) => setHTML(id, `<div class="empty"><i class="fas fa-${icon}"></i><p>${msg}</p></div>`);

/* ── FORMAT ── */
const fmtDate = s => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return '—'; }
};
const trunc = (s, n = 55) => !s ? '—' : s.length > n ? s.slice(0, n) + '…' : s;

/**
 * Escape HTML để chống XSS — dùng khi render dữ liệu từ DB vào innerHTML
 * Chuyển các ký tự đặc biệt thành HTML entities an toàn
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Escape + truncate — dùng thay cho trunc() khi render vào innerHTML
 * Đảm bảo dữ liệu từ DB không thể chứa script độc hại
 */
function safe(s, n = 55) {
    return escapeHtml(!s ? '' : s.length > n ? s.slice(0, n) + '…' : s);
}

/* ── LOGOUT ── */
function logout() {
    API.post('/auth/logout', {}).catch(() => {});
    Auth.clear();
    window.location.href = 'index.html';
}

/* ── SIDEBAR ── */
function buildSidebar(user, activePage) {
    const name = ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.email;

    let navHTML = '<div class="sb-section">Tổng quan</div>';
    navHTML += `<a href="dashboard.html" class="sb-link${activePage==='dashboard.html'?' active':''}"><i class="fas fa-tachometer-alt"></i> Dashboard</a>`;
    navHTML += '<div class="sb-section">Nội dung</div>';
    navHTML += `<a href="tin-tuc.html" class="sb-link${activePage==='tin-tuc.html'?' active':''}"><i class="fas fa-newspaper"></i> Tin tức</a>`;
    navHTML += `<a href="su-kien.html" class="sb-link${activePage==='su-kien.html'?' active':''}"><i class="fas fa-calendar-alt"></i> Sự kiện</a>`;
    navHTML += `<a href="thong-bao.html" class="sb-link${activePage==='thong-bao.html'?' active':''}"><i class="fas fa-bell"></i> Thông báo</a>`;
    navHTML += `<a href="cam-nhan.html" class="sb-link${activePage==='cam-nhan.html'?' active':''}"><i class="fas fa-heart"></i> Cảm nhận SV</a>`;
    navHTML += `<a href="thu-vien.html" class="sb-link${activePage==='thu-vien.html'?' active':''}"><i class="fas fa-images"></i> Thư viện ảnh</a>`;
    navHTML += '<div class="sb-section">Quản lý</div>';
    navHTML += `<a href="thanh-vien.html" class="sb-link${activePage==='thanh-vien.html'?' active':''}"><i class="fas fa-users"></i> Thành viên</a>`;
    navHTML += `<a href="lien-he.html" class="sb-link${activePage==='lien-he.html'?' active':''}"><i class="fas fa-envelope"></i> Liên hệ</a>`;
    navHTML += '<div class="sb-section">Website</div>';
    navHTML += `<a href="../index.html" class="sb-link" target="_blank"><i class="fas fa-globe"></i> Xem trang chủ</a>`;
    navHTML += `<a href="../views/tin-tuc.html" class="sb-link" target="_blank"><i class="fas fa-newspaper"></i> Xem tin tức</a>`;
    navHTML += `<a href="../views/su-kien.html" class="sb-link" target="_blank"><i class="fas fa-calendar-alt"></i> Xem sự kiện</a>`;
    navHTML += `<a href="../views/cam-nhan.html" class="sb-link" target="_blank"><i class="fas fa-heart"></i> Xem cảm nhận</a>`;

    return `
    <aside class="sidebar">
        <div class="sb-brand">
            <img src="../assets/images_Logo/Logo_CLB.png" alt="Logo"
                onerror="this.src='../assets/images_Avatar/Avatar_An.jpg'">
            <div class="sb-brand-text">
                <h3>Admin CMS</h3>
                <span>${name}</span>
            </div>
        </div>
        <nav class="sb-nav">${navHTML}</nav>
        <div class="sb-footer">
            <button class="btn-logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
        </div>
    </aside>`;
}

function buildTopbar(title, user) {
    return `
    <div class="topbar">
        <span class="topbar-title">${title}</span>
        <div class="topbar-right">
            <span class="user-greet">Xin chào, <b>${user.first_name || 'Admin'}</b></span>
            <span class="badge-admin">ADMIN</span>
        </div>
    </div>`;
}

/**
 * Khởi tạo layout cho trang admin
 */
function initLayout(title, activePage) {
    const user = Auth.check();
    if (!user) return null;

    document.getElementById('app').innerHTML =
        buildSidebar(user, activePage) +
        `<div class="main">
            ${buildTopbar(title, user)}
            <div class="page" id="page"></div>
        </div>`;

    return $('page');
}

/* ── BACKEND BASE URL — tự động theo môi trường ── */
var BACKEND_URL = (window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL)
    || (function() {
        var h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3001';
        return 'https://api.' + h;
    })();

function resolveImgUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return BACKEND_URL + (url.startsWith('/') ? url : '/' + url);
}

/* ════════════════════════════════════════
   IMAGE UPLOAD — viết lại hoàn toàn
   Dùng <label for> native, KHÔNG dùng JS click()
   → không có event bubble lên overlay
   ════════════════════════════════════════ */

/**
 * Khởi tạo upload widget cho một container.
 * Gọi trong openModal() / editItem() — KHÔNG gọi lúc page load.
 *
 * @param {string} containerId  - ID của div chứa widget
 * @param {string} hiddenId     - ID của hidden input lưu URL
 * @param {string} labelText    - Nhãn hiển thị (vd: "Ảnh đại diện")
 */
function initUpload(containerId, hiddenId, labelText) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Xóa file input cũ nếu còn sót
    const oldFile = document.getElementById(hiddenId + '_file');
    if (oldFile) oldFile.remove();

    // Render widget — file input nằm TRONG modal, label for trỏ đúng vào nó
    // onclick stopPropagation trên label để click không bubble lên overlay
    container.innerHTML = `
        <div class="up-box" id="${hiddenId}_box">
            <label for="${hiddenId}_file" class="up-drop"
                   onclick="event.stopPropagation()">
                <i class="fas fa-cloud-upload-alt"></i>
                <span class="up-drop-title">Chọn ${labelText || 'ảnh / video'}</span>
                <span class="up-drop-hint">JPG · PNG · GIF · WEBP · MP4 · MOV &nbsp;|&nbsp; tối đa 10 MB</span>
            </label>
            <div class="up-preview" id="${hiddenId}_preview" style="display:none;">
                <img id="${hiddenId}_img" src="" alt="">
                <div class="up-preview-info">
                    <span id="${hiddenId}_name" class="up-name"></span>
                    <button type="button" class="btn btn-sm btn-danger"
                            onclick="event.stopPropagation();_removeUpload('${hiddenId}','${containerId}','${labelText || ''}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
            <div class="up-progress" id="${hiddenId}_prog" style="display:none;">
                <div class="up-bar"><div class="up-fill" id="${hiddenId}_fill"></div></div>
                <span class="up-pct" id="${hiddenId}_pct">0%</span>
            </div>
            <input type="hidden" id="${hiddenId}">
            <input type="file" id="${hiddenId}_file"
                   accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                   style="display:none;">
        </div>`;

    // Gắn event listener cho file input (sau khi đã render vào DOM)
    const fileEl = document.getElementById(hiddenId + '_file');
    if (fileEl) {
        fileEl.addEventListener('change', () => _doUpload(fileEl, hiddenId, containerId));
    }
}

async function _doUpload(fileEl, hiddenId, containerId) {
    const file = fileEl.files[0];
    if (!file) return;

    // Validate kích thước
    if (file.size > 10 * 1024 * 1024) {
        toast('File quá lớn — tối đa 10 MB', 'danger');
        fileEl.value = '';
        return;
    }
    // Validate định dạng (kiểm tra cả MIME type và extension)
    const okTypes = ['image/jpeg','image/png','image/gif','image/webp',
                     'video/mp4','video/quicktime','video/webm'];
    const okExts  = ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.mov','.webm'];
    const ext     = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!okTypes.includes(file.type) && !okExts.includes(ext)) {
        toast('Định dạng không hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP, MP4, MOV', 'danger');
        fileEl.value = '';
        return;
    }

    // Kiểm tra token trước khi upload
    const token = Auth.getToken();
    if (!token) {
        toast('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', 'danger');
        fileEl.value = '';
        return;
    }

    // Hiện progress, ẩn drop zone
    const drop = document.querySelector(`#${hiddenId}_box .up-drop`);
    const prog = document.getElementById(hiddenId + '_prog');
    const fill = document.getElementById(hiddenId + '_fill');
    const pct  = document.getElementById(hiddenId + '_pct');
    if (drop) drop.style.display = 'none';
    if (prog) prog.style.display = 'flex';

    let p = 0;
    const timer = setInterval(() => {
        p = Math.min(p + 8, 88);
        if (fill) fill.style.width = p + '%';
        if (pct)  pct.textContent  = p + '%';
    }, 120);

    const _resetUI = () => {
        clearInterval(timer);
        if (prog) prog.style.display = 'none';
        if (drop) drop.style.display = '';
        if (fill) fill.style.width   = '0%';
        if (pct)  pct.textContent    = '0%';
        fileEl.value = '';
    };

    try {
        const fd = new FormData();
        fd.append('image', file);

        let res;
        try {
            res = await fetch(BACKEND_URL + '/api/upload/image', {
                method:  'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body:    fd
            });
        } catch (networkErr) {
            // Lỗi kết nối (server không chạy, sai port, CORS preflight fail...)
            throw new Error('Không thể kết nối đến server. Kiểm tra backend đang chạy tại ' + BACKEND_URL);
        }

        // Parse JSON an toàn — server có thể trả HTML khi có lỗi nginx/proxy
        let json;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            json = await res.json();
        } else {
            const text = await res.text();
            throw new Error('Server trả về lỗi ' + res.status + (text ? ': ' + text.substring(0, 100) : ''));
        }

        clearInterval(timer);
        if (fill) fill.style.width = '100%';
        if (pct)  pct.textContent  = '100%';

        if (!res.ok || !json.success) {
            if (res.status === 401) {
                // Token hết hạn — xóa session và yêu cầu đăng nhập lại
                // KHÔNG redirect ngay để tránh mất dữ liệu form đang nhập
                _resetUI();
                toast('⚠️ Phiên đăng nhập hết hạn. Vui lòng lưu nháp rồi đăng nhập lại.', 'danger');
                return;
            }
            if (res.status === 403) {
                throw new Error('Bạn không có quyền upload ảnh (yêu cầu quyền Admin)');
            }
            throw new Error(json.message || 'Upload thất bại (lỗi ' + res.status + ')');
        }

        const url     = json.data.url;          // Lưu path tương đối: /uploads/cms/xxx.jpg
        const fullUrl = resolveImgUrl(url);     // Dùng để hiển thị preview
        const hidden  = document.getElementById(hiddenId);
        const preview = document.getElementById(hiddenId + '_preview');
        const img     = document.getElementById(hiddenId + '_img');
        const name    = document.getElementById(hiddenId + '_name');

        if (hidden)  hidden.value     = url;       // Lưu path tương đối vào DB
        if (img)     img.src          = fullUrl;   // Hiển thị preview với full URL
        if (name)    name.textContent = file.name;

        setTimeout(() => {
            if (prog)    prog.style.display    = 'none';
            if (preview) preview.style.display = 'flex';
        }, 300);

        toast('✅ Upload ảnh thành công!', 'success');

    } catch (err) {
        _resetUI();
        toast('❌ Lỗi upload: ' + err.message, 'danger');
        console.error('[Upload Error]', err);
    }
}

function _removeUpload(hiddenId, containerId, labelText) {
    const hidden  = document.getElementById(hiddenId);
    const preview = document.getElementById(hiddenId + '_preview');
    const drop    = document.querySelector(`#${hiddenId}_box .up-drop`);
    if (hidden)  hidden.value          = '';
    if (preview) preview.style.display = 'none';
    if (drop)    drop.style.display    = '';
}

/** Đặt ảnh có sẵn vào widget (khi edit bài) */
function setUploadImage(hiddenId, url) {
    if (!url) return;
    // Chuẩn hóa: nếu là full URL của backend cũ → chuyển về path tương đối
    let relUrl = url;
    try {
        const u = new URL(url);
        // Nếu là URL của backend (localhost:3001 hoặc cùng host) → lấy pathname
        if (u.hostname === 'localhost' || u.hostname === window.location.hostname) {
            relUrl = u.pathname;
        }
    } catch(e) {
        // Không phải URL tuyệt đối → giữ nguyên (đã là path tương đối)
    }
    const fullUrl = resolveImgUrl(relUrl);
    const hidden  = document.getElementById(hiddenId);
    const preview = document.getElementById(hiddenId + '_preview');
    const img     = document.getElementById(hiddenId + '_img');
    const name    = document.getElementById(hiddenId + '_name');
    const drop    = document.querySelector(`#${hiddenId}_box .up-drop`);
    if (hidden)  hidden.value          = relUrl;   // Lưu path tương đối
    if (img)     img.src               = fullUrl;  // Hiển thị với full URL
    if (name)    name.textContent      = relUrl.split('/').pop();
    if (preview) preview.style.display = 'flex';
    if (drop)    drop.style.display    = 'none';
}

/** Dọn file input khi đóng modal */
function cleanupUpload(hiddenId) {
    // File input có thể nằm trong box hoặc body — xóa cả hai chỗ
    const fi = document.getElementById(hiddenId + '_file');
    if (fi) fi.remove();
}

/* ── Giữ lại alias cũ để không break code khác ── */
function buildImageUpload()  { return ''; }
function removeImage(hid, pid) { _removeUpload(hid, '', ''); }
function setExistingImage(hid, pid, url) { setUploadImage(hid, url); }
function isUploadInProgress() { return false; }
