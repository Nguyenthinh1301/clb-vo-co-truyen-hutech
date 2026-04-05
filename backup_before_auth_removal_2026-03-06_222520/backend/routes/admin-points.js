const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Middleware: Chỉ admin mới được truy cập
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/points/stats
 * Lấy thống kê tổng quan về điểm
 */
router.get('/stats', async (req, res) => {
    try {
        // Tổng điểm đã phát
        const totalPointsResult = await db.query(
            'SELECT ISNULL(SUM(points), 0) as total FROM user_points_transactions WHERE points > 0'
        );
        const totalPointsIssued = totalPointsResult[0]?.total || 0;

        // Số thành viên có điểm
        const membersWithPointsResult = await db.query(
            'SELECT COUNT(DISTINCT user_id) as count FROM user_points WHERE total_points > 0'
        );
        const membersWithPoints = membersWithPointsResult[0]?.count || 0;

        // Giao dịch tháng này
        const monthlyTransactionsResult = await db.query(
            `SELECT COUNT(*) as count FROM user_points_transactions 
             WHERE MONTH(created_at) = MONTH(GETDATE()) 
             AND YEAR(created_at) = YEAR(GETDATE())`
        );
        const monthlyTransactions = monthlyTransactionsResult[0]?.count || 0;

        // Điểm trung bình mỗi thành viên
        const avgPointsResult = await db.query(
            'SELECT ISNULL(AVG(CAST(total_points AS FLOAT)), 0) as avg FROM user_points WHERE total_points > 0'
        );
        const avgPointsPerMember = Math.round(avgPointsResult[0]?.avg || 0);

        res.json({
            success: true,
            data: {
                totalPointsIssued,
                membersWithPoints,
                monthlyTransactions,
                avgPointsPerMember
            }
        });

    } catch (error) {
        console.error('Error getting points stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê điểm'
        });
    }
});

/**
 * GET /api/admin/points/members
 * Lấy danh sách thành viên với điểm
 */
router.get('/members', async (req, res) => {
    try {
        const members = await db.query(`
            SELECT 
                u.id,
                u.email,
                u.username,
                u.first_name,
                u.last_name,
                u.full_name,
                u.phone_number,
                u.role,
                ISNULL(up.total_points, 0) as total_points,
                ISNULL(up.points_used, 0) as points_used,
                up.rank,
                up.updated_at as last_transaction_date
            FROM users u
            LEFT JOIN user_points up ON u.id = up.user_id
            WHERE u.role != 'admin' AND u.is_active = 1
            ORDER BY up.total_points DESC
        `);

        res.json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error('Error getting members:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thành viên'
        });
    }
});

/**
 * GET /api/admin/points/member/:userId
 * Lấy chi tiết điểm của một thành viên
 */
router.get('/member/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Lấy thông tin thành viên
        const member = await db.findOne(`
            SELECT 
                u.id,
                u.email,
                u.username,
                u.first_name,
                u.last_name,
                u.full_name,
                u.phone_number,
                ISNULL(up.total_points, 0) as total_points,
                ISNULL(up.points_used, 0) as points_used,
                up.rank
            FROM users u
            LEFT JOIN user_points up ON u.id = up.user_id
            WHERE u.id = ?
        `, [userId]);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        // Lấy lịch sử giao dịch
        const transactions = await db.query(`
            SELECT 
                id,
                points,
                type,
                note,
                created_at
            FROM user_points_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        res.json({
            success: true,
            data: {
                member,
                transactions
            }
        });

    } catch (error) {
        console.error('Error getting member details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin thành viên'
        });
    }
});

/**
 * POST /api/admin/points/add
 * Thêm điểm cho thành viên
 */
router.post('/add', async (req, res) => {
    try {
        const { user_id, points, type, note } = req.body;

        // Validate
        if (!user_id || points === undefined || points === null) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Kiểm tra user tồn tại
        const user = await db.findOne('SELECT id, email, first_name, last_name, full_name FROM users WHERE id = ?', [user_id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        // Kiểm tra user_points tồn tại, nếu không thì tạo mới
        let userPoints = await db.findOne('SELECT * FROM user_points WHERE user_id = ?', [user_id]);
        
        if (!userPoints) {
            // Tạo mới record user_points
            await db.insert('user_points', {
                user_id: user_id,
                total_points: 0,
                points_used: 0,
                rank: 'bronze'
            });
            userPoints = await db.findOne('SELECT * FROM user_points WHERE user_id = ?', [user_id]);
        }

        // Thêm giao dịch
        await db.insert('user_points_transactions', {
            user_id: user_id,
            points: points,
            type: type || 'custom',
            note: note || null,
            created_by: req.user.id
        });

        // Cập nhật tổng điểm
        const newTotalPoints = (userPoints.total_points || 0) + points;
        
        // Tính rank mới dựa trên tổng điểm
        let newRank = 'bronze';
        if (newTotalPoints >= 1000) {
            newRank = 'platinum';
        } else if (newTotalPoints >= 500) {
            newRank = 'gold';
        } else if (newTotalPoints >= 200) {
            newRank = 'silver';
        }

        await db.update('user_points', 
            { 
                total_points: newTotalPoints,
                rank: newRank
            }, 
            'user_id = ?', 
            [user_id]
        );

        // Log audit
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'points_added',
            table_name: 'user_points_transactions',
            record_id: user_id,
            new_values: JSON.stringify({ user_id, points, type, note }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Thêm điểm thành công',
            data: {
                new_total: newTotalPoints,
                new_rank: newRank
            }
        });

    } catch (error) {
        console.error('Error adding points:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm điểm'
        });
    }
});

/**
 * POST /api/admin/points/deduct
 * Trừ điểm của thành viên
 */
router.post('/deduct', async (req, res) => {
    try {
        const { user_id, points, note } = req.body;

        // Validate
        if (!user_id || !points || points <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Kiểm tra user tồn tại
        const userPoints = await db.findOne('SELECT * FROM user_points WHERE user_id = ?', [user_id]);
        if (!userPoints) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin điểm của thành viên'
            });
        }

        // Kiểm tra đủ điểm để trừ
        if (userPoints.total_points < points) {
            return res.status(400).json({
                success: false,
                message: 'Không đủ điểm để trừ'
            });
        }

        // Thêm giao dịch (số âm)
        await db.insert('user_points_transactions', {
            user_id: user_id,
            points: -points,
            type: 'deduct',
            note: note || 'Trừ điểm',
            created_by: req.user.id
        });

        // Cập nhật tổng điểm
        const newTotalPoints = userPoints.total_points - points;
        
        // Tính rank mới
        let newRank = 'bronze';
        if (newTotalPoints >= 1000) {
            newRank = 'platinum';
        } else if (newTotalPoints >= 500) {
            newRank = 'gold';
        } else if (newTotalPoints >= 200) {
            newRank = 'silver';
        }

        await db.update('user_points', 
            { 
                total_points: newTotalPoints,
                rank: newRank
            }, 
            'user_id = ?', 
            [user_id]
        );

        res.json({
            success: true,
            message: 'Trừ điểm thành công',
            data: {
                new_total: newTotalPoints,
                new_rank: newRank
            }
        });

    } catch (error) {
        console.error('Error deducting points:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi trừ điểm'
        });
    }
});

module.exports = router;
