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
 * @param {number} timeoutMs - timeout tính bằng ms (mặc định 90 giây cho Render free tier)
 * @returns {Function} cancelFn - gọi để hủy timeout khi load xong
 */
function loading(id, timeoutMs = 90000) {
    setHTML(id,
        '<div class="loading">' +
        '<div class="spinner"></div>' +
        '<p style="margin-top:12px;color:#718096;font-size:0.82rem;">Đang kết nối server...</p>' +
        '</div>'
    );
    const timer = setTimeout(() => {
        const el = $(id);
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

    // Ảnh avatar: ưu tiên profile_image → avatar → fallback chữ cái đầu
    const avatarUrl = user.profile_image || user.avatar || null;
    const initial   = (user.first_name || user.email || 'A').charAt(0).toUpperCase();

    const avatarHtml = avatarUrl
        ? `<img src="${resolveImgUrl(avatarUrl)}" alt="${name}"
               style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3);"
               onerror="this.outerHTML='<div style=\\'width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#c41e3a,#e74c3c);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;flex-shrink:0;\\'>${initial}</div>'">`
        : `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#c41e3a,#e74c3c);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;flex-shrink:0;">${initial}</div>`;

    let navHTML = '<div class="sb-section">Tổng quan</div>';
    navHTML += `<a href="dashboard.html" class="sb-link${activePage==='dashboard.html'?' active':''}"><i class="fas fa-tachometer-alt"></i> Dashboard</a>`;
    navHTML += '<div class="sb-section">Nội dung</div>';
    navHTML += `<a href="tin-tuc.html" class="sb-link${activePage==='tin-tuc.html'?' active':''}"><i class="fas fa-newspaper"></i> Tin tức</a>`;
    navHTML += `<a href="su-kien.html" class="sb-link${activePage==='su-kien.html'?' active':''}"><i class="fas fa-calendar-alt"></i> Sự kiện</a>`;
    navHTML += `<a href="cam-nhan.html" class="sb-link${activePage==='cam-nhan.html'?' active':''}"><i class="fas fa-heart"></i> Cảm nhận SV</a>`;
    navHTML += `<a href="thu-vien.html" class="sb-link${activePage==='thu-vien.html'?' active':''}"><i class="fas fa-images"></i> Thư viện ảnh</a>`;
    navHTML += `<a href="hoat-dong.html" class="sb-link${activePage==='hoat-dong.html'?' active':''}"><i class="fas fa-trophy"></i> Hoạt động</a>`;
    navHTML += `<a href="doi-ngu.html" class="sb-link${activePage==='doi-ngu.html'?' active':''}"><i class="fas fa-user-tie"></i> Đội ngũ CLB</a>`;
    navHTML += '<div class="sb-section">Quản lý</div>';
    navHTML += `<a href="thanh-vien.html" class="sb-link${activePage==='thanh-vien.html'?' active':''}"><i class="fas fa-users"></i> Thành viên</a>`;
    navHTML += `<a href="lien-he.html" class="sb-link${activePage==='lien-he.html'?' active':''}"><i class="fas fa-envelope"></i> Liên hệ</a>`;
    navHTML += `<a href="nhat-ky.html" class="sb-link${activePage==='nhat-ky.html'?' active':''}"><i class="fas fa-history"></i> Nhật ký hoạt động</a>`;
    navHTML += `<a href="tac-vu.html" class="sb-link${activePage==='tac-vu.html'?' active':''}"><i class="fas fa-robot"></i> Tác vụ tự động</a>`;
    navHTML += '<div class="sb-section">Website</div>';
    navHTML += `<a href="../index.html" class="sb-link" target="_blank"><i class="fas fa-globe"></i> Xem trang chủ</a>`;
    navHTML += `<a href="../views/tin-tuc.html" class="sb-link" target="_blank"><i class="fas fa-newspaper"></i> Xem tin tức</a>`;
    navHTML += `<a href="../views/su-kien.html" class="sb-link" target="_blank"><i class="fas fa-calendar-alt"></i> Xem sự kiện</a>`;
    navHTML += `<a href="../views/cam-nhan.html" class="sb-link" target="_blank"><i class="fas fa-heart"></i> Xem cảm nhận</a>`;

    return `
    <aside class="sidebar">
        <div class="sb-brand">
            ${avatarHtml}
            <div class="sb-brand-text">
                <h3>${name}</h3>
                <span>${user.role === 'admin' ? 'Quản Trị Viên' : (user.role || 'Admin')}</span>
            </div>
        </div>
        <nav class="sb-nav">${navHTML}</nav>
        <div class="sb-footer">
            <button class="btn-logout btn-changepw" onclick="openChangePassword()">
                <i class="fas fa-key"></i> Đổi mật khẩu
            </button>
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
 * Tự động wake up server nếu đang sleep (Render free tier)
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

    // Wake up server ngầm ngay khi trang load (không block UI)
    const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'http://localhost:3001/api';
    fetch(apiBase.replace('/api', '/health'), { method: 'GET' }).catch(() => {});

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

/* ══════════════════════════════════════════════════════════════
   SỰ KIỆN — tính trạng thái theo thời gian thực (ngày + giờ)
   Dùng chung cho su-kien.html và dashboard.html, cùng logic với trang chủ.
   ══════════════════════════════════════════════════════════════ */

/** HH:MM từ ISO datetime hoặc chuỗi "HH:MM[:SS]" */
function extractTime(s) {
    if (!s) return null;
    s = String(s);
    if (s.indexOf('T') !== -1) {
        var t = new Date(s);
        return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
    }
    return s.substring(0, 5);
}

/** YYYY-MM-DD theo giờ địa phương (date có thể là ISO UTC) */
function evDateStr(ev) {
    if (!ev || !ev.date) return '';
    var s = String(ev.date);
    if (s.indexOf('T') !== -1) {
        var d = new Date(s);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    return s.substring(0, 10);
}

function _evLocalDate(dateStr, timeStr, fallback) {
    if (!dateStr) return null;
    var p = String(dateStr).substring(0, 10).split('-').map(Number);
    if (p.length !== 3 || isNaN(p[0])) return null;
    var t = (timeStr || fallback).split(':').map(Number);
    return new Date(p[0], p[1] - 1, p[2], t[0] || 0, t[1] || 0, t[2] || 0);
}

/** Trạng thái thực tế: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' */
function calcStatus(dateStr, startTime, endTime, savedStatus) {
    if (savedStatus === 'cancelled') return 'cancelled';
    var start = _evLocalDate(dateStr, startTime, '00:00');
    var end   = _evLocalDate(dateStr, endTime,   '23:59:59');
    if (!start || !end) return savedStatus || 'upcoming';
    if (end < start) end = _evLocalDate(dateStr, null, '23:59:59');
    var now = new Date();
    if (now < start) return 'upcoming';
    if (now <= end)  return 'ongoing';
    return 'completed';
}

function effectiveStatus(ev) {
    return calcStatus(evDateStr(ev), extractTime(ev.start_time), extractTime(ev.end_time), ev.status);
}

/* ══════════════════════════════════════════════════════════════
   ĐỔI MẬT KHẨU — dùng chung cho mọi trang Admin (nút ở cuối sidebar)
   API: PUT /api/auth/change-password { current_password, new_password, confirm_password }
   ══════════════════════════════════════════════════════════════ */
var PW_RULES = [
    { id: 'len',   text: 'Ít nhất 8 ký tự',     test: function (p) { return p.length >= 8; } },
    { id: 'lower', text: 'Có chữ thường (a–z)', test: function (p) { return /[a-z]/.test(p); } },
    { id: 'upper', text: 'Có chữ hoa (A–Z)',    test: function (p) { return /[A-Z]/.test(p); } },
    { id: 'digit', text: 'Có chữ số (0–9)',     test: function (p) { return /\d/.test(p); } }
];

function _pwField(id, label, autocomplete) {
    return '<div class="form-group">' +
        '<label class="form-label" for="' + id + '">' + label + ' <span class="req">*</span></label>' +
        '<div class="pw-wrap">' +
            '<input class="form-control" type="password" id="' + id + '" autocomplete="' + autocomplete + '">' +
            '<button type="button" class="pw-eye" tabindex="-1" title="Hiện / ẩn mật khẩu" data-target="' + id + '"><i class="fas fa-eye"></i></button>' +
        '</div></div>';
}

function openChangePassword() {
    var ov = document.getElementById('pw-modal');
    if (!ov) {
        ov = document.createElement('div');
        ov.className = 'overlay';
        ov.id = 'pw-modal';
        ov.innerHTML =
            '<div class="modal modal-sm" onclick="event.stopPropagation()">' +
                '<div class="modal-head">' +
                    '<h3><i class="fas fa-key" style="color:#1450a3;margin-right:8px;"></i>Đổi mật khẩu</h3>' +
                    '<button class="modal-close" type="button" onclick="closeChangePassword()"><i class="fas fa-times"></i></button>' +
                '</div>' +
                '<form class="modal-body" id="pw-form" novalidate>' +
                    '<p style="color:#718096;font-size:0.82rem;margin:0 0 14px;">Đổi mật khẩu cho tài khoản <b id="pw-email"></b>. ' +
                        'Sau khi đổi, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.</p>' +
                    '<input type="text" autocomplete="username" id="pw-username" style="display:none;">' +
                    _pwField('pw-current', 'Mật khẩu hiện tại', 'current-password') +
                    _pwField('pw-new', 'Mật khẩu mới', 'new-password') +
                    '<ul class="pw-rules" id="pw-rules">' + PW_RULES.map(function (r) {
                        return '<li data-rule="' + r.id + '"><i class="fas fa-circle"></i> ' + r.text + '</li>';
                    }).join('') + '<li data-rule="diff"><i class="fas fa-circle"></i> Khác mật khẩu hiện tại</li></ul>' +
                    _pwField('pw-confirm', 'Nhập lại mật khẩu mới', 'new-password') +
                    '<div class="pw-match" id="pw-match"></div>' +
                    '<div class="pw-error" id="pw-error" style="display:none;"></div>' +
                    '<button type="submit" style="display:none;"></button>' +
                '</form>' +
                '<div class="modal-foot">' +
                    '<button class="btn btn-outline" type="button" onclick="closeChangePassword()"><i class="fas fa-times"></i> Hủy</button>' +
                    '<button class="btn btn-primary" type="button" id="pw-save" onclick="submitChangePassword()"><i class="fas fa-save"></i> Đổi mật khẩu</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(ov);

        document.getElementById('pw-form').addEventListener('submit', function (e) { e.preventDefault(); submitChangePassword(); });
        ['pw-current', 'pw-new', 'pw-confirm'].forEach(function (id) {
            document.getElementById(id).addEventListener('input', _updatePwChecks);
        });
        ov.querySelectorAll('.pw-eye').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var el = document.getElementById(btn.dataset.target);
                var show = el.type === 'password';
                el.type = show ? 'text' : 'password';
                btn.innerHTML = '<i class="fas fa-eye' + (show ? '-slash' : '') + '"></i>';
            });
        });
        ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeChangePassword(); });
    }

    var user = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || {};
    document.getElementById('pw-email').textContent = user.email || '';
    document.getElementById('pw-username').value = user.email || '';
    ['pw-current', 'pw-new', 'pw-confirm'].forEach(function (id) {
        var el = document.getElementById(id); el.value = ''; el.type = 'password';
    });
    ov.querySelectorAll('.pw-eye').forEach(function (b) { b.innerHTML = '<i class="fas fa-eye"></i>'; });
    document.getElementById('pw-error').style.display = 'none';
    _updatePwChecks();
    ov.classList.add('open');
    setTimeout(function () { document.getElementById('pw-current').focus(); }, 80);
}

function closeChangePassword() {
    var ov = document.getElementById('pw-modal');
    if (ov) ov.classList.remove('open');
}

function _updatePwChecks() {
    var cur = document.getElementById('pw-current').value;
    var p   = document.getElementById('pw-new').value;
    var c   = document.getElementById('pw-confirm').value;
    PW_RULES.concat([{ id: 'diff', test: function (x) { return x.length > 0 && x !== cur; } }]).forEach(function (r) {
        var li = document.querySelector('#pw-rules [data-rule="' + r.id + '"]');
        var ok = r.test(p);
        li.classList.toggle('ok', ok);
        li.querySelector('i').className = 'fas fa-' + (ok ? 'check-circle' : 'circle');
    });
    var m = document.getElementById('pw-match');
    if (!c) { m.innerHTML = ''; m.className = 'pw-match'; }
    else if (c === p) { m.innerHTML = '<i class="fas fa-check-circle"></i> Mật khẩu nhập lại khớp'; m.className = 'pw-match ok'; }
    else { m.innerHTML = '<i class="fas fa-times-circle"></i> Mật khẩu nhập lại chưa khớp'; m.className = 'pw-match bad'; }
}

async function submitChangePassword() {
    var cur = document.getElementById('pw-current').value;
    var p   = document.getElementById('pw-new').value;
    var c   = document.getElementById('pw-confirm').value;
    var err = document.getElementById('pw-error');
    var showErr = function (msg, focusId) {
        err.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + escapeHtml(msg);
        err.style.display = 'block';
        if (focusId) document.getElementById(focusId).focus();
    };
    err.style.display = 'none';

    if (!cur) return showErr('Vui lòng nhập mật khẩu hiện tại.', 'pw-current');
    var failed = PW_RULES.filter(function (r) { return !r.test(p); });
    if (failed.length) return showErr('Mật khẩu mới chưa đạt: ' + failed.map(function (r) { return r.text.charAt(0).toLowerCase() + r.text.slice(1); }).join(', ') + '.', 'pw-new');
    if (p === cur) return showErr('Mật khẩu mới phải khác mật khẩu hiện tại.', 'pw-new');
    if (p !== c)   return showErr('Mật khẩu nhập lại chưa khớp.', 'pw-confirm');

    var btn = document.getElementById('pw-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    try {
        var r = await fetch(API_BASE + '/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + Auth.getToken() },
            body: JSON.stringify({ current_password: cur, new_password: p, confirm_password: c })
        });
        var d = {};
        try { d = await r.json(); } catch (e) { /* không phải JSON */ }
        if (r.status === 401) {
            return showErr('Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại để đổi mật khẩu.');
        }
        if (!r.ok || !d.success) {
            var msg = (d.errors && d.errors.length)
                ? d.errors.map(function (x) { return x.message; }).join(' ')
                : (d.message || ('Lỗi ' + r.status));
            return showErr(msg, /hiện tại/i.test(msg) ? 'pw-current' : null);
        }
        closeChangePassword();
        toast('✅ Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
    } catch (e) {
        showErr('Không kết nối được máy chủ. Vui lòng thử lại.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Đổi mật khẩu';
    }
}
