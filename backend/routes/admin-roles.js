/**
 * Phân cấp quản trị
 *   GET /api/admin-roles/me          — cấp của tài khoản đang đăng nhập (mọi Admin)
 *   GET /api/admin-roles             — cấp của tất cả Admin (Quản trị chính)
 *   PUT /api/admin-roles/:userId     — đổi cấp {level: 'owner'|'editor'} (Quản trị chính)
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJwt, requireAdmin } = require('../middleware/auth');
const { requireOwner } = require('../middleware/adminLevel');
const adminRoles = require('../services/adminRoles');
const auditLog   = require('../utils/auditLog');

router.use(authenticateJwt, requireAdmin);

router.get('/me', async (req, res) => {
    try {
        const level = await adminRoles.getLevel(req.user.id);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: { level, label: adminRoles.LEVEL_LBL[level] } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

router.get('/', requireOwner, async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: { levels: await adminRoles.listLevels(), labels: adminRoles.LEVEL_LBL } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

router.put('/:userId', requireOwner, async (req, res) => {
    try {
        const id    = parseInt(req.params.userId, 10);
        const level = String(req.body.level || '');
        if (!adminRoles.LEVELS.includes(level)) {
            return res.status(400).json({ success: false, message: 'Cấp quản trị không hợp lệ' });
        }
        const user = await db.findOne('SELECT id, email, role FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        if (user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Chỉ đặt cấp quản trị cho tài khoản có vai trò Admin' });
        }
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể tự đổi cấp quản trị của chính mình' });
        }
        const before = await adminRoles.getLevel(id);
        if (before === level) return res.json({ success: true, message: 'Không có thay đổi' });
        if (before === 'owner' && level !== 'owner' && await adminRoles.countOtherActiveOwners(id) === 0) {
            return res.status(400).json({ success: false, message: 'Phải còn ít nhất 1 Quản trị chính' });
        }

        await adminRoles.setLevel(id, level, req.user.id);
        await auditLog({
            user_id: req.user.id, action: 'admin_level_changed', table_name: 'users', record_id: id,
            old_values: { email: user.email, admin_level: before },
            new_values: { email: user.email, admin_level: level },
            ip_address: req.ip, user_agent: req.get('User-Agent')
        });
        res.json({ success: true, message: `Đã đặt ${user.email} là ${adminRoles.LEVEL_LBL[level]}` });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

module.exports = router;
