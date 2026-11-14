/**
 * requireOwner — chỉ cho phép Quản trị chính (admin_roles.level = 'owner').
 * Dùng SAU middleware xác thực + requireAdmin / authorize('admin') (cần req.user).
 */
const adminRoles = require('../services/adminRoles');

async function requireOwner(req, res, next) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Yêu cầu quyền quản trị' });
        }
        const level = await adminRoles.getLevel(req.user.id);
        req.adminLevel = level;
        if (level !== 'owner') {
            return res.status(403).json({
                success: false,
                code: 'OWNER_ONLY',
                message: 'Chức năng này chỉ dành cho Quản trị chính. Tài khoản của bạn là Biên tập viên.'
            });
        }
        next();
    } catch (e) {
        console.error('[requireOwner]', e.message);
        res.status(500).json({ success: false, message: 'Không kiểm tra được quyền quản trị' });
    }
}

module.exports = { requireOwner };
