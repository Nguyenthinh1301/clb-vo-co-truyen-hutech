/**
 * Middleware ghi Nhật ký hoạt động cho các thao tác thêm / sửa / xóa của Admin.
 *
 * Gắn trước router, ví dụ:  app.use('/api/cms', adminAudit('cms'), require('./routes/admin-cms'))
 * - Chỉ ghi request POST/PUT/PATCH/DELETE thành công (status < 400) của người đã đăng nhập.
 * - Sửa / xóa: lưu bản ghi TRƯỚC khi thay đổi (old_values) để biết đã sửa/xóa gì.
 * - Không ghi mật khẩu / token; nội dung dài được cắt ngắn.
 */
const db       = require('../config/db');
const auditLog = require('../utils/auditLog');

// Cấu hình theo từng nhóm route: [regex path, resource, bảng CSDL]
const RESOURCES = {
    cms: [
        [/^\/news(?:\/(\d+))?\/?$/,          'news',         'news'],
        [/^\/events(?:\/(\d+))?\/?$/,        'event',        'events'],
        [/^\/reviews(?:\/(\d+))?\/?$/,       'review',       'reviews'],
        [/^\/announcements(?:\/(\d+))?\/?$/, 'announcement', 'announcements']
    ],
    gallery: [
        [/^\/albums\/(\d+)\/photos\/?$/,     'photos',       'gallery_albums', 'photos_added'],
        [/^\/albums(?:\/(\d+))?\/?$/,        'album',        'gallery_albums'],
        [/^\/photos(?:\/(\d+))?\/?$/,        'photo',        'gallery_photos']
    ],
    activities: [
        [/^\/(?:(\d+))?\/?$/,                'activity',     'activities']
    ],
    team: [
        [/^\/(?:(\d+))?\/?$/,                'team_member',  'team_members']
    ],
    upload: [
        [/^\/image(?:\/([^/]+))?\/?$/,       'upload',       null]
    ]
};

const VERB = { POST: 'created', PUT: 'updated', PATCH: 'updated', DELETE: 'deleted' };
const SECRET_KEYS = /pass(word)?|token|secret|otp/i;

function sanitize(obj, depth) {
    depth = depth || 0;
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return obj.length > 1500 ? obj.substring(0, 1500) + '…' : obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (depth > 3) return '[…]';
    if (Array.isArray(obj)) return obj.slice(0, 50).map(v => sanitize(v, depth + 1));
    const out = {};
    Object.keys(obj).forEach(k => {
        if (SECRET_KEYS.test(k)) return;
        out[k] = sanitize(obj[k], depth + 1);
    });
    return out;
}

function adminAudit(group) {
    const rules = RESOURCES[group] || [];
    return async function (req, res, next) {
        if (!VERB[req.method]) return next();

        let rule = null, idParam = null;
        for (const r of rules) {
            const m = req.path.match(r[0]);
            if (m) { rule = r; idParam = m[1] || null; break; }
        }
        if (!rule) return next();
        const [, resource, table, fixedAction] = rule;

        // Lấy dữ liệu cũ trước khi sửa / xóa
        let oldRow = null;
        if (table && idParam && /^\d+$/.test(idParam) && (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')) {
            try { oldRow = await db.findOne(`SELECT * FROM ${table} WHERE id = ?`, [parseInt(idParam, 10)]); }
            catch (e) { /* bỏ qua — không chặn request */ }
        }

        // Bắt body trả về để lấy id bản ghi mới tạo
        let respBody = null;
        const origJson = res.json.bind(res);
        res.json = function (body) { respBody = body; return origJson(body); };

        res.on('finish', () => {
            if (res.statusCode >= 400 || !req.user) return;
            const action = fixedAction || (resource + '_' + VERB[req.method]);
            let recordId = idParam && /^\d+$/.test(idParam) ? idParam : null;
            if (!recordId && respBody && respBody.data && respBody.data.id) recordId = respBody.data.id;

            let newValues = req.method === 'DELETE' ? null : sanitize(req.body || {});
            if (resource === 'upload') {
                newValues = sanitize({
                    file: req.file ? req.file.originalname : (idParam || null),
                    url:  respBody && respBody.data ? respBody.data.url : undefined
                });
            }

            auditLog({
                user_id:    req.user.id,
                action,
                table_name: table || resource,
                record_id:  recordId,
                old_values: oldRow ? sanitize(oldRow) : null,
                new_values: newValues && Object.keys(newValues).length ? newValues : null,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        });

        next();
    };
}

module.exports = adminAudit;
