/**
 * Points System Routes
 * API endpoints cho hệ thống tích điểm
 */

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticate } = require('../middleware/auth');

// MSSQL config từ environment variables
const dbConfig = {
    server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

/**
 * GET /api/points/user/:userId
 * Lấy thông tin điểm của user
 */
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;
        
        // User chỉ có thể xem điểm của chính họ, trừ khi là admin
        if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Không có quyền truy cập' 
            });
        }
        
        const pool = await sql.connect(dbConfig);
        
        // Lấy thông tin điểm
        const pointsResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    up.*,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.full_name
                FROM user_points up
                INNER JOIN users u ON up.user_id = u.id
                WHERE up.user_id = @userId
            `);
        
        if (pointsResult.recordset.length === 0) {
            // Tạo record mới nếu chưa có
            await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    INSERT INTO user_points (user_id, total_points, available_points)
                    VALUES (@userId, 0, 0)
                `);
            
            return res.json({
                success: true,
                data: {
                    user_id: parseInt(userId),
                    total_points: 0,
                    available_points: 0,
                    spent_points: 0,
                    rank_level: 'bronze',
                    streak_days: 0
                }
            });
        }
        
        res.json({
            success: true,
            data: pointsResult.recordset[0]
        });
        
    } catch (error) {
        console.error('Error fetching user points:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy thông tin điểm',
            error: error.message 
        });
    }
});

/**
 * GET /api/points/transactions/:userId
 * Lấy lịch sử giao dịch điểm
 */
router.get('/transactions/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;
        const { limit = 50, offset = 0 } = req.query;
        
        if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Không có quyền truy cập' 
            });
        }
        
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
                SELECT 
                    pt.*,
                    u.email as created_by_email,
                    u.full_name as created_by_name
                FROM points_transactions pt
                LEFT JOIN users u ON pt.created_by = u.id
                WHERE pt.user_id = @userId
                ORDER BY pt.created_at DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy lịch sử giao dịch',
            error: error.message 
        });
    }
});

/**
 * GET /api/points/leaderboard
 * Lấy bảng xếp hạng
 */
router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit) * FROM v_leaderboard
                ORDER BY rank
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy bảng xếp hạng',
            error: error.message 
        });
    }
});

/**
 * POST /api/points/add
 * Thêm điểm cho user (Admin only)
 */
router.post('/add', authenticate, async (req, res) => {
    try {
        const currentUser = req.user;
        
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Chỉ admin mới có quyền thêm điểm' 
            });
        }
        
        const { userId, points, category, description, referenceId, referenceType } = req.body;
        
        if (!userId || !points || !category || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin bắt buộc' 
            });
        }
        
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('points', sql.Int, points)
            .input('category', sql.NVarChar, category)
            .input('description', sql.NVarChar, description)
            .input('reference_id', sql.Int, referenceId || null)
            .input('reference_type', sql.NVarChar, referenceType || null)
            .input('created_by', sql.Int, currentUser.id)
            .execute('sp_add_points');
        
        res.json({
            success: true,
            message: 'Thêm điểm thành công',
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('Error adding points:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi thêm điểm',
            error: error.message 
        });
    }
});

/**
 * GET /api/points/rewards
 * Lấy danh sách phần quà
 */
router.get('/rewards', authenticate, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT * FROM rewards
                WHERE is_active = 1
                ORDER BY display_order, points_required
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách phần quà',
            error: error.message 
        });
    }
});

/**
 * GET /api/points/achievements
 * Lấy danh sách thành tích
 */
router.get('/achievements', authenticate, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT * FROM achievements
                WHERE is_active = 1
                ORDER BY points_reward DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách thành tích',
            error: error.message 
        });
    }
});

/**
 * GET /api/points/user-achievements/:userId
 * Lấy thành tích của user
 */
router.get('/user-achievements/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;
        
        if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Không có quyền truy cập' 
            });
        }
        
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    a.*,
                    ua.earned_at,
                    CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_earned
                FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = @userId
                WHERE a.is_active = 1
                ORDER BY is_earned DESC, a.points_reward DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching user achievements:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy thành tích',
            error: error.message 
        });
    }
});

module.exports = router;
