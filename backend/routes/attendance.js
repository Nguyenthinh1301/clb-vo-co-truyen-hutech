const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auditLog = require('../utils/auditLog');
const { authenticate, authorize } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors } = require('../middleware/validation');

// Record attendance (instructor/admin only)
router.post('/', authenticate, authorize('instructor', 'admin'), ValidationRules.attendanceRecord, handleValidationErrors, async (req, res) => {
    try {
        const { user_id, class_id, date, status, notes } = req.body;

        // Check if class exists
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [class_id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Check if instructor has permission for this class
        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể điểm danh cho lớp học của mình'
            });
        }

        // Check if user is enrolled in the class
        const enrollment = await db.findOne(
            'SELECT * FROM class_enrollments WHERE user_id = ? AND class_id = ? AND status = "enrolled"',
            [user_id, class_id]
        );

        if (!enrollment) {
            return res.status(400).json({
                success: false,
                message: 'Học viên chưa đăng ký lớp học này'
            });
        }

        // Check if attendance already recorded for this date
        const existingAttendance = await db.findOne(
            'SELECT * FROM attendance WHERE user_id = ? AND class_id = ? AND date = ?',
            [user_id, class_id, date]
        );

        if (existingAttendance) {
            // Update existing attendance
            await db.update(
                'attendance',
                { 
                    status, 
                    notes: notes || null,
                    recorded_by: req.user.id 
                },
                'id = ?',
                [existingAttendance.id]
            );

            const updatedAttendance = await db.findOne(
                `SELECT a.*, u.first_name, u.last_name, c.name as class_name
                 FROM attendance a
                 JOIN users u ON a.user_id = u.id
                 JOIN classes c ON a.class_id = c.id
                 WHERE a.id = ?`,
                [existingAttendance.id]
            );

            res.json({
                success: true,
                message: 'Cập nhật điểm danh thành công',
                data: { attendance: updatedAttendance }
            });
        } else {
            // Create new attendance record
            const attendanceId = await db.insert('attendance', {
                user_id,
                class_id,
                date,
                status,
                notes: notes || null,
                recorded_by: req.user.id
            });

            const newAttendance = await db.findOne(
                `SELECT a.*, u.first_name, u.last_name, c.name as class_name
                 FROM attendance a
                 JOIN users u ON a.user_id = u.id
                 JOIN classes c ON a.class_id = c.id
                 WHERE a.id = ?`,
                [attendanceId]
            );

            // Log attendance record
            try {
                await auditLog({
                    user_id: req.user.id,
                    action: 'attendance_recorded',
                    table_name: 'attendance',
                    record_id: attendanceId,
                    new_values: JSON.stringify(newAttendance),
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
            } catch (logErr) { console.warn('Audit log warning:', logErr.message); }

            res.status(201).json({
                success: true,
                message: 'Ghi nhận điểm danh thành công',
                data: { attendance: newAttendance }
            });
        }

    } catch (error) {
        console.error('Record attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi ghi nhận điểm danh'
        });
    }
});

// Get attendance for a class (instructor/admin only)
router.get('/class/:classId', authenticate, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const { classId } = req.params;
        const numClassId = parseInt(classId);
        if (!numClassId || numClassId < 1) return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ' });

        const { date, page = 1, limit = 50 } = req.query;

        // Check if class exists and user has permission
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [numClassId]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể xem điểm danh của lớp học mình dạy'
            });
        }

        let whereClause = 'a.class_id = ?';
        let params = [numClassId];

        if (date) {
            whereClause += ' AND a.date = ?';
            params.push(date);
        }

        const sql = `
            SELECT a.*, u.first_name, u.last_name, u.username, u.profile_image,
             rb.first_name as recorded_by_first_name, rb.last_name as recorded_by_last_name
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             JOIN users rb ON a.recorded_by = rb.id
             WHERE ${whereClause}
             ORDER BY a.date DESC, u.last_name ASC, u.first_name ASC
        `;

        const result = await db.findMany(sql, params, parseInt(page), parseInt(limit));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get class attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách điểm danh'
        });
    }
});

// Get attendance statistics for a class (instructor/admin only)
router.get('/class/:classId/stats', authenticate, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const { classId } = req.params;
        const numClassId = parseInt(classId);
        if (!numClassId || numClassId < 1) return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ' });

        const { start_date, end_date } = req.query;

        // Check if class exists and user has permission
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [numClassId]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể xem thống kê của lớp học mình dạy'
            });
        }

        let whereClause = 'a.class_id = ?';
        let params = [numClassId];

        if (start_date) {
            whereClause += ' AND a.date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND a.date <= ?';
            params.push(end_date);
        }

        // Get overall statistics
        const overallStats = await db.query(
            `SELECT 
             COUNT(*) as total_records,
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
             SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count,
             COUNT(DISTINCT date) as total_sessions,
             COUNT(DISTINCT user_id) as total_students
             FROM attendance a WHERE ${whereClause}`,
            params
        );

        // Get student-wise statistics
        const studentStats = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.username,
             COUNT(*) as total_sessions,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_sessions,
             SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_sessions,
             SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_sessions,
             SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_sessions,
             ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             WHERE ${whereClause}
             GROUP BY u.id, u.first_name, u.last_name, u.username
             ORDER BY attendance_rate DESC`,
            params
        );

        // Get date-wise statistics
        const dateStats = await db.query(
            `SELECT date,
             COUNT(*) as total_students,
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
             SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count,
             ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
             FROM attendance a WHERE ${whereClause}
             GROUP BY date
             ORDER BY date DESC`,
            params
        );

        res.json({
            success: true,
            data: {
                overall: overallStats[0] || {},
                by_student: studentStats,
                by_date: dateStats
            }
        });

    } catch (error) {
        console.error('Get attendance stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê điểm danh'
        });
    }
});

// Bulk record attendance (instructor/admin only)
router.post('/bulk', authenticate, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const { class_id, date, attendance_records } = req.body;

        // Validate input
        if (!class_id || !date || !Array.isArray(attendance_records)) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ'
            });
        }

        // Check if class exists and user has permission
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [class_id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể điểm danh cho lớp học của mình'
            });
        }

        // Prepare bulk operations
        const operations = [];
        const results = [];

        for (const record of attendance_records) {
            const { user_id, status, notes } = record;

            // Check if user is enrolled
            const enrollment = await db.findOne(
                'SELECT * FROM class_enrollments WHERE user_id = ? AND class_id = ? AND status = "enrolled"',
                [user_id, class_id]
            );

            if (!enrollment) {
                results.push({
                    user_id,
                    success: false,
                    message: 'Học viên chưa đăng ký lớp học'
                });
                continue;
            }

            // Check if attendance already exists
            const existingAttendance = await db.findOne(
                'SELECT * FROM attendance WHERE user_id = ? AND class_id = ? AND date = ?',
                [user_id, class_id, date]
            );

            if (existingAttendance) {
                // Update existing
                operations.push({
                    sql: 'UPDATE attendance SET status = ?, notes = ?, recorded_by = ? WHERE id = ?',
                    params: [status, notes || null, req.user.id, existingAttendance.id]
                });
            } else {
                // Insert new
                operations.push({
                    sql: 'INSERT INTO attendance (user_id, class_id, date, status, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
                    params: [user_id, class_id, date, status, notes || null, req.user.id]
                });
            }

            results.push({
                user_id,
                success: true,
                message: existingAttendance ? 'Cập nhật thành công' : 'Ghi nhận thành công'
            });
        }

        // Execute bulk operations
        if (operations.length > 0) {
            await db.transaction(operations);
        }

        // Log bulk attendance
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'bulk_attendance_recorded',
                table_name: 'attendance',
                new_values: JSON.stringify({ class_id, date, records_count: operations.length }),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { console.warn('Audit log warning:', logErr.message); }

        res.json({
            success: true,
            message: `Đã xử lý ${operations.length} bản ghi điểm danh`,
            data: { results }
        });

    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi ghi nhận điểm danh hàng loạt'
        });
    }
});

// Get attendance summary for dashboard (instructor/admin only)
router.get('/summary', authenticate, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const { class_id, start_date, end_date } = req.query;

        let whereClause = '1=1';
        let params = [];

        // Filter by class if instructor
        if (req.user.role === 'instructor') {
            whereClause += ' AND c.instructor_id = ?';
            params.push(req.user.id);
        }

        if (class_id) {
            whereClause += ' AND a.class_id = ?';
            params.push(class_id);
        }

        if (start_date) {
            whereClause += ' AND a.date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND a.date <= ?';
            params.push(end_date);
        }

        const summary = await db.query(
            `SELECT 
             c.id as class_id, c.name as class_name,
             COUNT(*) as total_records,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
             SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
             ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
             FROM attendance a
             JOIN classes c ON a.class_id = c.id
             WHERE ${whereClause}
             GROUP BY c.id, c.name
             ORDER BY c.name`,
            params
        );

        res.json({
            success: true,
            data: { summary }
        });

    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy tổng quan điểm danh'
        });
    }
});

module.exports = router;
