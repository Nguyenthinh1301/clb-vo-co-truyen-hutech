/**
 * API module - Gọi backend
 * Phụ thuộc: auth.js (phải load trước)
 */

// Tự động chọn API URL theo môi trường
// Ưu tiên window.APP_CONFIG (từ config.js), fallback về tự tính
const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE)
    ? window.APP_CONFIG.API_BASE
    : (function() {
        var h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1' || h === '') {
            return 'http://localhost:3001/api';
        }
        return 'https://api.' + h + '/api';
    })();

const API = {
    _headers() {
        return {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + Auth.getToken()
        };
    },

    async _call(method, path, body) {
        const opts = { method, headers: this._headers() };
        if (body) opts.body = JSON.stringify(body);

        let r;
        try {
            r = await fetch(API_BASE + path, opts);
        } catch (networkErr) {
            throw new Error('Không thể kết nối đến server backend. Kiểm tra backend đang chạy tại ' + API_BASE);
        }

        // Parse JSON an toàn
        let d;
        const ct = r.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            d = await r.json();
        } else {
            const text = await r.text();
            throw new Error('Server lỗi ' + r.status + (text ? ': ' + text.substring(0, 120) : ''));
        }

        if (!r.ok) {
            if (r.status === 401) {
                // Token hết hạn — xóa session và redirect về login
                if (typeof Auth !== 'undefined') {
                    Auth.clear();
                    const pg = window.location.pathname.split('/').pop();
                    if (pg !== 'index.html' && pg !== '') {
                        window.location.replace('index.html');
                        return; // dừng lại, không throw
                    }
                }
                throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            }
            throw new Error(d.message || 'Lỗi ' + r.status);
        }
        return d;
    },

    get:    path      => API._call('GET',    path),
    post:   (path, b) => API._call('POST',   path, b),
    put:    (path, b) => API._call('PUT',    path, b),
    delete: path      => API._call('DELETE', path),

    /* ── CMS ── */
    news: {
        list:   (p=1, limit=10, status='', q='', category='') => API.get(
            `/cms/news?page=${p}&limit=${limit}` +
            (status   ? '&status='   + status   : '') +
            (category ? '&category=' + category : '') +
            (q        ? '&q='        + encodeURIComponent(q) : '')
        ),
        get:    id   => API.get(`/cms/news/${id}`),
        create: data => API.post('/cms/news', data),
        update: (id, data) => API.put(`/cms/news/${id}`, data),
        delete: id   => API.delete(`/cms/news/${id}`)
    },

    events: {
        list:   (p=1, limit=15, status='', type='', q='') => API.get(
            `/cms/events?page=${p}&limit=${limit}` +
            (status ? '&status=' + status : '') +
            (type   ? '&type='   + type   : '') +
            (q      ? '&q='      + encodeURIComponent(q) : '')
        ),
        get:    id   => API.get(`/cms/events/${id}`),
        create: data => API.post('/cms/events', data),
        update: (id, data) => API.put(`/cms/events/${id}`, data),
        delete: id   => API.delete(`/cms/events/${id}`)
    },

    announcements: {
        list:   (status='', type='', priority='', q='') => API.get(
            '/cms/announcements?all=1' +
            (status   ? '&status='   + status   : '') +
            (type     ? '&type='     + type     : '') +
            (priority ? '&priority=' + priority : '') +
            (q        ? '&q='        + encodeURIComponent(q) : '')
        ),
        create: data => API.post('/cms/announcements', data),
        update: (id, data) => API.put(`/cms/announcements/${id}`, data),
        delete: id   => API.delete(`/cms/announcements/${id}`)
    },

    reviews: {
        list:   (status='', rating='', q='') => API.get(
            '/cms/reviews?all=1' +
            (status ? '&status=' + status : '') +
            (rating ? '&rating=' + rating : '') +
            (q      ? '&q='      + encodeURIComponent(q) : '')
        ),
        create: data => API.post('/cms/reviews', data),
        update: (id, data) => API.put(`/cms/reviews/${id}`, data),
        delete: id   => API.delete(`/cms/reviews/${id}`)
    },

    users: {
        list:   (p=1, limit=20, search='', role='', status='') => API.get(
            `/users?page=${p}&limit=${limit}` +
            (search ? '&search=' + encodeURIComponent(search) : '') +
            (role   ? '&role='   + role   : '') +
            (status ? '&status=' + status : '')
        ),
        total:  () => API.get('/users?page=1&limit=1'),
        update: (id, data) => API.put(`/users/${id}`, data),
        toggle: id => API.delete(`/users/${id}`),
        remove: id => API.delete(`/users/${id}/delete`)
    },

    contact: {
        list:   (p=1, limit=20, status='', search='') => API.get(
            `/contact?page=${p}&limit=${limit}` +
            (status ? '&status=' + status : '') +
            (search ? '&search=' + encodeURIComponent(search) : '')
        ),
        get:    id   => API.get(`/contact/${id}`),
        reply:  (id, msg, replyEmail) => API.post(`/contact/${id}/reply`, { reply_message: msg, reply_to_email: replyEmail || undefined }),
        status: (id, st)  => API.put(`/contact/${id}/status`, { status: st }),
        delete: id   => API.delete(`/contact/${id}`)
    },

    gallery: {
        albums:      (all)     => API.get('/gallery/albums' + (all ? '?all=1' : '')),
        album:       id        => API.get(`/gallery/albums/${id}`),
        createAlbum: data      => API.post('/gallery/albums', data),
        updateAlbum: (id,data) => API.put(`/gallery/albums/${id}`, data),
        deleteAlbum: id        => API.delete(`/gallery/albums/${id}`),
        addPhotos:   (id,photos) => API.post(`/gallery/albums/${id}/photos`, { photos }),
        deletePhoto: id        => API.delete(`/gallery/photos/${id}`),
        updatePhoto: (id,data) => API.put(`/gallery/photos/${id}`, data)
    }
};
