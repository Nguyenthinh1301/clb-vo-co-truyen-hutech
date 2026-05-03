/**
 * Points System Routes
 * API endpoints cho hệ thống tích điểm
 * Đã migrate: không còn dùng mssql package trực tiếp
 */

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

// ── Helper: tính rank từ tổng điểm ──────────────────────────
function calcRank(total) {
    if (total >= 1000) return 'legendary';
    if (total >= 600)  return 'diamond';
    if (total >= 300)  return 'gold';
    if (total >= 100)  return 'silver';
    return 'bronze';
}

/**
 * GET /api/points/user/:userId
 */
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const userId     = parseInt(req.params.userId);
        const currentUser = req.user;

        if (currentUser.role !== 'admin' && currentUser.id !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
        }

        let row = await db.findOne(
            `SELECT up.*, u.email, u.first_name, u.last_name, u.full_name
             FROM user_points up
             INNER JOIN users u ON up.user_id = u.id
             WHERE up.user_id = ?`,
            [userId]
        );

        if (!row) {
            await db.insert('user_points', {
                user_id: userId, total_points: 0, available_points: 0, spent_points: 0
            });
            return res.json({
                success: true,
                data: { user_id: userId, total_points: 0, available_points: 0,
                        spent_points: 0, rank_level: 'bronze', streak_days: 0 }
            });
        }

        res.json({ success: true, data: row });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin điểm', error: err.message });
    }
});

/**
 * GET /api/points/transactions/:userId
 */
router.get('/transactions/:userId', authenticate, async (req, res) => {
    try {
        const userId     = parseInt(req.params.userId);
        const currentUser = req.user;
        const limit  = parseInt(req.query.limit)  || 50;
        const offset = parseInt(req.query.offset) || 0;

        if (currentUser.role !== 'admin' && currentUser.id !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
        }

        const rows = await db.find(
            `SELECT pt.*, u.email as created_by_email, u.full_name as created_by_name
             FROM points_transactions pt
             LEFT JOIN users u ON pt.created_by = u.id
             WHERE pt.user_id = ?
             ORDER BY pt.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử giao dịch', error: err.message });
    }
});

/**
 * GET /api/points/leaderboard
 */
router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;

        const rows = await db.find(
            `SELECT * FROM v_leaderboard ORDER BY rank LIMIT ?`,
            [limit]
        );

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy bảng xếp hạng', error: err.message });
    }
});

/**
 * POST /api/points/add  (Admin only)
 */
router.post('/add', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền thêm điểm' });
        }

        const { userId, points, category, description, referenceId, referenceType } = req.body;
        if (!userId || !points || !category || !description) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Thêm transaction
        await db.insert('points_transactions', {
            user_id:        userId,
            points:         points,
            type:           'earn',
            category:       category,
            description:    description,
            reference_id:   referenceId   || null,
            reference_type: referenceType || null,
            created_by:     req.user.id
        });

        // Upsert user_points
        const existing = await db.findOne('SELECT id, total_points FROM user_points WHERE user_id = ?', [userId]);
        if (existing) {
            const newTotal = existing.total_points + points;
            await db.update('user_points',
                { total_points: newTotal, available_points: existing.available_points + points,
                  rank_level: calcRank(newTotal), last_activity_date: new Date().toISOString().split('T')[0] },
                'user_id = ?', [userId]
            );
        } else {
            await db.insert('user_points', {
                user_id: userId, total_points: points, available_points: points,
                rank_level: calcRank(points),
                last_activity_date: new Date().toISOString().split('T')[0]
            });
        }

        const updated = await db.findOne('SELECT * FROM user_points WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'Thêm điểm thành công', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi thêm điểm', error: err.message });
    }
});

/**
 * GET /api/points/rewards
 */
router.get('/rewards', authenticate, async (req, res) => {
    try {
        const rows = await db.find(
            `SELECT * FROM rewards WHERE is_active = TRUE ORDER BY display_order, points_required`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách phần quà', error: err.message });
    }
});

/**
 * GET /api/points/achievements
 */
router.get('/achievements', authenticate, async (req, res) => {
    try {
        const rows = await db.find(
            `SELECT * FROM achievements WHERE is_active = TRUE ORDER BY points_reward DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách thành tích', error: err.message });
    }
});

/**
 * GET /api/points/user-achievements/:userId
 */
router.get('/user-achievements/:userId', authenticate, async (req, res) => {
    try {
        const userId     = parseInt(req.params.userId);
        const currentUser = req.user;

        if (currentUser.role !== 'admin' && currentUser.id !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
        }

        const rows = await db.find(
            `SELECT a.*,
                    ua.earned_at,
                    CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as is_earned
             FROM achievements a
             LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
             WHERE a.is_active = TRUE
             ORDER BY is_earned DESC, a.points_reward DESC`,
            [userId]
        );

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thành tích', error: err.message });
    }
});

module.exports = router;
