/**
 * Admin Class Management Routes
 * API để admin quản lý phân công lớp học cho thành viên
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

/**
 * Phân công user vào lớp học
 * POST /api/admin/class-management/assign
 */
router.post('/assign', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { userId, classId } = req.body;
        
        // Validation
        if (!userId || !classId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin user và lớp học'
            });
        }
        
        // Check if user exists
        const user = await db.findOne(
            'SELECT id, email, first_name, last_name, full_name FROM users WHERE id = ? AND is_active = 1',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }
        
        // Check if class exists
        const classInfo = await db.findOne(
            `SELECT c.*, u.first_name as instructor_first_name, u.last_name as instructor_last_name 
             FROM classes c 
             LEFT JOIN users u ON c.instructor_id = u.id 
             WHERE c.id = ?`,
            [classId]
        );
        
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }
        
        // Check if already enrolled
        const existingEnrollment = await db.findOne(
            'SELECT id FROM class_enrollments WHERE user_id = ? AND class_id = ? AND status = ?',
            [userId, classId, 'active']
        );
        
        if (existingEnrollment) {
            return res.status(409).json({
                success: false,
                message: 'Thành viên đã được phân công vào lớp này'
            });
        }
        
        // Check class capacity
        if (classInfo.max_students && classInfo.current_students >= classInfo.max_students) {
            return res.status(400).json({
                success: false,
                message: 'Lớp học đã đầy'
            });
        }
        
        // Create enrollment
        const enrollmentId = await db.insert('class_enrollments', {
            user_id: userId,
            class_id: classId,
            status: 'active',
            enrolled_at: new Date()
        });
        
        // Update class student count
        await db.query(
            'UPDATE classes SET current_students = current_students + 1 WHERE id = ?',
            [classId]
        );
        
        // Update user membership status to active if pending
        await db.query(
            "UPDATE users SET membership_status = 'active' WHERE id = ? AND membership_status = 'pending'",
            [userId]
        );
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'assign_class',
            table_name: 'class_enrollments',
            record_id: enrollmentId,
            new_values: JSON.stringify({ userId, classId }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        // Send notification to user
        const classData = {
            id: classInfo.id,
            name: classInfo.name,
            instructor_name: classInfo.instructor_first_name && classInfo.instructor_last_name 
                ? `${classInfo.instructor_first_name} ${classInfo.instructor_last_name}` 
                : null,
            schedule: classInfo.schedule,
            location: classInfo.location
        };
        
        NotificationService.notifyClassAssignment(userId, classData).catch(err => {
            console.error('Failed to notify user about class assignment:', err);
        });
        
        res.json({
            success: true,
            message: 'Đã phân công thành viên vào lớp học',
            data: {
                enrollmentId,
                userId,
                classId
            }
        });
        
    } catch (error) {
        console.error('Assign class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi phân công lớp học'
        });
    }
});

/**
 * Xóa user khỏi lớp học
 * DELETE /api/admin/class-management/remove
 */
router.delete('/remove', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { userId, classId } = req.body;
        
        // Find enrollment
        const enrollment = await db.findOne(
            'SELECT id FROM class_enrollments WHERE user_id = ? AND class_id = ? AND status = ?',
            [userId, classId, 'active']
        );
        
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký lớp học'
            });
        }
        
        // Update enrollment status
        await db.update(
            'class_enrollments',
            { status: 'dropped' },
            'id = ?',
            [enrollment.id]
        );
        
        // Update class student count
        await db.query(
            'UPDATE classes SET current_students = current_students - 1 WHERE id = ? AND current_students > 0',
            [classId]
        );
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'remove_from_class',
            table_name: 'class_enrollments',
            record_id: enrollment.id,
            old_values: JSON.stringify({ userId, classId, status: 'active' }),
            new_values: JSON.stringify({ status: 'dropped' }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Đã xóa thành viên khỏi lớp học'
        });
        
    } catch (error) {
        console.error('Remove from class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa khỏi lớp học'
        });
    }
});

/**
 * Lấy danh sách user chưa được phân công lớp
 * GET /api/admin/class-management/unassigned-users
 */
router.get('/unassigned-users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const users = await db.query(
            `SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.full_name, 
                    u.phone_number, u.membership_status, u.created_at
             FROM users u
             WHERE u.role = 'student' 
             AND u.is_active = 1
             AND NOT EXISTS (
                 SELECT 1 FROM class_enrollments ce 
                 WHERE ce.user_id = u.id AND ce.status = 'active'
             )
             ORDER BY u.created_at DESC`
        );
        
        res.json({
            success: true,
            data: users || []
        });
        
    } catch (error) {
        console.error('Get unassigned users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách thành viên'
        });
    }
});

/**
 * Lấy danh sách user trong một lớp
 * GET /api/admin/class-management/class-members/:classId
 */
router.get('/class-members/:classId', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { classId } = req.params;
        
        const members = await db.query(
            `SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.full_name,
                    u.phone_number, ce.enrolled_at, ce.status
             FROM class_enrollments ce
             JOIN users u ON ce.user_id = u.id
             WHERE ce.class_id = ? AND ce.status = 'active'
             ORDER BY ce.enrolled_at DESC`,
            [classId]
        );
        
        res.json({
            success: true,
            data: members || []
        });
        
    } catch (error) {
        console.error('Get class members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách thành viên lớp'
        });
    }
});

/**
 * Phân công nhiều user vào lớp cùng lúc
 * POST /api/admin/class-management/bulk-assign
 */
router.post('/bulk-assign', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { userIds, classId } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất một thành viên'
            });
        }
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn lớp học'
            });
        }
        
        // Get class info
        const classInfo = await db.findOne(
            `SELECT c.*, u.first_name as instructor_first_name, u.last_name as instructor_last_name 
             FROM classes c 
             LEFT JOIN users u ON c.instructor_id = u.id 
             WHERE c.id = ?`,
            [classId]
        );
        
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }
        
        let successCount = 0;
        let failedUsers = [];
        
        for (const userId of userIds) {
            try {
                // Check if already enrolled
                const existing = await db.findOne(
                    'SELECT id FROM class_enrollments WHERE user_id = ? AND class_id = ? AND status = ?',
                    [userId, classId, 'active']
                );
                
                if (existing) {
                    failedUsers.push({ userId, reason: 'Đã được phân công' });
                    continue;
                }
                
                // Create enrollment
                await db.insert('class_enrollments', {
                    user_id: userId,
                    class_id: classId,
                    status: 'active',
                    enrolled_at: new Date()
                });
                
                // Update membership status
                await db.query(
                    "UPDATE users SET membership_status = 'active' WHERE id = ? AND membership_status = 'pending'",
                    [userId]
                );
                
                // Send notification
                const classData = {
                    id: classInfo.id,
                    name: classInfo.name,
                    instructor_name: classInfo.instructor_first_name && classInfo.instructor_last_name 
                        ? `${classInfo.instructor_first_name} ${classInfo.instructor_last_name}` 
                        : null,
                    schedule: classInfo.schedule,
                    location: classInfo.location
                };
                
                NotificationService.notifyClassAssignment(userId, classData).catch(err => {
                    console.error('Failed to notify user:', err);
                });
                
                successCount++;
                
            } catch (error) {
                console.error(`Failed to assign user ${userId}:`, error);
                failedUsers.push({ userId, reason: error.message });
            }
        }
        
        // Update class student count
        await db.query(
            'UPDATE classes SET current_students = current_students + ? WHERE id = ?',
            [successCount, classId]
        );
        
        res.json({
            success: true,
            message: `Đã phân công ${successCount}/${userIds.length} thành viên`,
            data: {
                successCount,
                totalCount: userIds.length,
                failedUsers
            }
        });
        
    } catch (error) {
        console.error('Bulk assign error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi phân công lớp học'
        });
    }
});

module.exports = router;
