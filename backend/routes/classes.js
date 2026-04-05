const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors } = require('../middleware/validation');

// Get all classes (public)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, level, status = 'active' } = req.query;

        let whereClause = 'c.status = ?';
        let params = [status];

        if (level) {
            whereClause += ' AND c.level = ?';
            params.push(level);
        }

        const sql = `
            SELECT c.*, 
             u.first_name as instructor_first_name, 
             u.last_name as instructor_last_name,
             u.profile_image as instructor_image
             FROM classes c
             JOIN users u ON c.instructor_id = u.id
             WHERE ${whereClause}
             ORDER BY c.created_at DESC
        `;

        const classes = await db.find(sql, params);

        res.json({
            success: true,
            data: classes
        });

    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách lớp học'
        });
    }
});

// Get my classes (for current user)
router.get('/my-classes', authenticate, async (req, res) => {
    try {
        const classes = await db.query(
            `SELECT c.*, ce.enrollment_date, ce.status as enrollment_status, 
             ce.payment_status, u.first_name as instructor_first_name, 
             u.last_name as instructor_last_name,
             CONCAT(u.first_name, ' ', u.last_name) as instructor_name
             FROM class_enrollments ce
             JOIN classes c ON ce.class_id = c.id
             JOIN users u ON c.instructor_id = u.id
             WHERE ce.user_id = ? AND ce.status = 'enrolled'
             ORDER BY ce.enrollment_date DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: classes
        });

    } catch (error) {
        console.error('Get my classes error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách lớp học của tôi'
        });
    }
});

// Get class details
router.get('/:id', ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        
        const classInfo = await db.findOne(`
            SELECT c.*, 
             u.first_name as instructor_first_name, 
             u.last_name as instructor_last_name,
             u.profile_image as instructor_image,
             u.email as instructor_email
             FROM classes c
             JOIN users u ON c.instructor_id = u.id
             WHERE c.id = ?`,
            [id]
        );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        res.json({
            success: true,
            data: { class: classInfo }
        });
    } catch (error) {
        console.error('Error getting class details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin lớp học'
        });
    }
});

// Enroll in class
router.post('/:id/enroll', authenticate, ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists and is active
        const classInfo = await db.findOne(
            'SELECT * FROM classes WHERE id = ? AND status = "active"',
            [id]
        );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại hoặc không còn hoạt động'
            });
        }

        // Check if class is full
        if (classInfo.current_students >= classInfo.max_students) {
            return res.status(400).json({
                success: false,
                message: 'Lớp học đã đầy'
            });
        }

        // Check if user is already enrolled
        const existingEnrollment = await db.findOne(
            'SELECT * FROM class_enrollments WHERE user_id = ? AND class_id = ?',
            [req.user.id, id]
        );

        if (existingEnrollment) {
            return res.status(409).json({
                success: false,
                message: 'Bạn đã đăng ký lớp học này rồi'
            });
        }

        // Create enrollment
        const enrollmentId = await db.insert('class_enrollments', {
            user_id: req.user.id,
            class_id: id,
            status: 'enrolled',
            payment_status: 'pending'
        });

        // Update class current students count
        await db.update(
            'classes',
            { current_students: classInfo.current_students + 1 },
            'id = ?',
            [id]
        );

        // Log enrollment
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'class_enrolled',
            table_name: 'class_enrollments',
            record_id: enrollmentId,
            new_values: JSON.stringify({ user_id: req.user.id, class_id: id }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký lớp học thành công',
            data: { enrollment_id: enrollmentId }
        });

    } catch (error) {
        console.error('Class enrollment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký lớp học'
        });
    }
});

// Create new class (instructor/admin only)
router.post('/', authenticate, authorize('instructor', 'admin'), ValidationRules.classCreation, handleValidationErrors, async (req, res) => {
    try {
        const {
            name,
            description,
            instructor_id,
            level,
            schedule,
            start_date,
            end_date,
            max_students,
            fee,
            location,
            requirements
        } = req.body;

        // Verify instructor exists and has correct role
        const instructor = await db.findOne(
            'SELECT id FROM users WHERE id = ? AND role IN ("instructor", "admin") AND is_active = 1',
            [instructor_id]
        );

        if (!instructor) {
            return res.status(400).json({
                success: false,
                message: 'Huấn luyện viên không hợp lệ'
            });
        }

        // Create class
        const classId = await db.insert('classes', {
            name,
            description: description || null,
            instructor_id,
            level,
            schedule,
            start_date,
            end_date: end_date || null,
            max_students: max_students || 15,
            fee: fee || 0,
            location: location || null,
            requirements: requirements || null,
            status: 'active'
        });

        // Get created class
        const newClass = await db.findOne(
            `SELECT c.*, 
             u.first_name as instructor_first_name, 
             u.last_name as instructor_last_name
             FROM classes c
             JOIN users u ON c.instructor_id = u.id
             WHERE c.id = ?`,
            [classId]
        );

        // Log class creation
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'class_created',
            table_name: 'classes',
            record_id: classId,
            new_values: JSON.stringify(newClass),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            message: 'Tạo lớp học thành công',
            data: { class: newClass }
        });

    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo lớp học'
        });
    }
});

// Update class (instructor/admin only)
router.put('/:id', authenticate, authorize('instructor', 'admin'), ValidationRules.idParam, ValidationRules.classUpdate, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists
        const existingClass = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Check permissions (instructor can only update their own classes)
        if (req.user.role === 'instructor' && existingClass.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể cập nhật lớp học của mình'
            });
        }

        // Prepare update data
        const updateData = {};
        const allowedFields = ['name', 'description', 'level', 'schedule', 'max_students', 'fee', 'location', 'requirements', 'status'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Update class
        await db.update('classes', updateData, 'id = ?', [id]);

        // Get updated class
        const updatedClass = await db.findOne(
            `SELECT c.*, 
             u.first_name as instructor_first_name, 
             u.last_name as instructor_last_name
             FROM classes c
             JOIN users u ON c.instructor_id = u.id
             WHERE c.id = ?`,
            [id]
        );

        // Log class update
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'class_updated',
            table_name: 'classes',
            record_id: id,
            old_values: JSON.stringify(existingClass),
            new_values: JSON.stringify(updatedClass),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Cập nhật lớp học thành công',
            data: { class: updatedClass }
        });

    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật lớp học'
        });
    }
});

// Get class students (instructor/admin only)
router.get('/:id/students', authenticate, authorize('instructor', 'admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists and user has permission
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể xem học viên của lớp học mình dạy'
            });
        }

        // Get students
        const students = await db.query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.email, 
             u.phone_number, u.belt_level, u.profile_image,
             ce.enrollment_date, ce.status, ce.payment_status
             FROM class_enrollments ce
             JOIN users u ON ce.user_id = u.id
             WHERE ce.class_id = ?
             ORDER BY ce.enrollment_date ASC`,
            [id]
        );

        res.json({
            success: true,
            data: { students }
        });

    } catch (error) {
        console.error('Get class students error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách học viên'
        });
    }
});

// Delete class (admin only)
router.delete('/:id', authenticate, authorize('admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists
        const existingClass = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Check if class has students
        const enrollmentCount = await db.findOne(
            'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ? AND status = "enrolled"',
            [id]
        );

        if (enrollmentCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa lớp học có ${enrollmentCount.count} học viên. Vui lòng chuyển học viên sang lớp khác trước.`
            });
        }

        // Soft delete by setting status to inactive
        await db.update('classes', { status: 'inactive' }, 'id = ?', [id]);

        // Log deletion
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'class_deleted',
            table_name: 'classes',
            record_id: id,
            old_values: JSON.stringify(existingClass),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Xóa lớp học thành công'
        });

    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa lớp học'
        });
    }
});

// Get class schedule
router.get('/:id/schedule', authenticate, ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Get schedule from class info
        res.json({
            success: true,
            data: {
                class_id: id,
                class_name: classInfo.name,
                schedule: classInfo.schedule,
                location: classInfo.location,
                start_date: classInfo.start_date,
                end_date: classInfo.end_date
            }
        });

    } catch (error) {
        console.error('Get class schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch học'
        });
    }
});

// Remove student from class (admin/instructor only)
router.delete('/:id/students/:userId', authenticate, authorize('instructor', 'admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Check if class exists
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Check permissions
        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể xóa học viên khỏi lớp học của mình'
            });
        }

        // Check if enrollment exists
        const enrollment = await db.findOne(
            'SELECT * FROM class_enrollments WHERE class_id = ? AND user_id = ?',
            [id, userId]
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Học viên không có trong lớp này'
            });
        }

        // Remove enrollment
        await db.query(
            'DELETE FROM class_enrollments WHERE class_id = ? AND user_id = ?',
            [id, userId]
        );

        // Update class current students count
        if (classInfo.current_students > 0) {
            await db.update(
                'classes',
                { current_students: classInfo.current_students - 1 },
                'id = ?',
                [id]
            );
        }

        // Send notification to user
        await db.insert('notifications', {
            user_id: userId,
            title: '📚 Thông báo về lớp học',
            message: `Bạn đã được xóa khỏi lớp "${classInfo.name}". Vui lòng liên hệ admin nếu có thắc mắc.`,
            type: 'info'
        });

        // Log removal
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'student_removed_from_class',
            table_name: 'class_enrollments',
            record_id: enrollment.id,
            old_values: JSON.stringify(enrollment),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Xóa học viên khỏi lớp thành công'
        });

    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa học viên'
        });
    }
});

module.exports = router;


// Delete class (admin only)
router.delete('/:id', authenticate, authorize('admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists
        const existingClass = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Check if class has students
        const enrollmentCount = await db.findOne(
            'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ? AND status = "enrolled"',
            [id]
        );

        if (enrollmentCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa lớp học có ${enrollmentCount.count} học viên. Vui lòng chuyển học viên sang lớp khác trước.`
            });
        }

        // Soft delete by setting status to inactive
        await db.update('classes', { status: 'inactive' }, 'id = ?', [id]);

        // Log deletion
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'class_deleted',
            table_name: 'classes',
            record_id: id,
            old_values: JSON.stringify(existingClass),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Xóa lớp học thành công'
        });

    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa lớp học'
        });
    }
});

// Get class schedule
router.get('/:id/schedule', authenticate, ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class exists
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Get schedule from class info (schedule field contains the schedule string)
        res.json({
            success: true,
            data: {
                class_id: id,
                class_name: classInfo.name,
                schedule: classInfo.schedule,
                location: classInfo.location,
                start_date: classInfo.start_date,
                end_date: classInfo.end_date
            }
        });

    } catch (error) {
        console.error('Get class schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch học'
        });
    }
});

// Get my schedule (all classes I'm enrolled in)
router.get('/schedule/my-schedule', authenticate, async (req, res) => {
    try {
        const schedule = await db.query(
            `SELECT c.id, c.name, c.schedule, c.location, c.start_date, c.end_date,
             u.first_name as instructor_first_name, u.last_name as instructor_last_name
             FROM class_enrollments ce
             JOIN classes c ON ce.class_id = c.id
             JOIN users u ON c.instructor_id = u.id
             WHERE ce.user_id = ? AND ce.status = 'enrolled' AND c.status = 'active'
             ORDER BY c.name`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: { schedule }
        });

    } catch (error) {
        console.error('Get my schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch học của tôi'
        });
    }
});

// Remove student from class (admin/instructor only)
router.delete('/:id/students/:userId', authenticate, authorize('instructor', 'admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Check if class exists
        const classInfo = await db.findOne('SELECT * FROM classes WHERE id = ?', [id]);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Check permissions
        if (req.user.role === 'instructor' && classInfo.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể xóa học viên khỏi lớp học của mình'
            });
        }

        // Check if enrollment exists
        const enrollment = await db.findOne(
            'SELECT * FROM class_enrollments WHERE class_id = ? AND user_id = ?',
            [id, userId]
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Học viên không có trong lớp này'
            });
        }

        // Remove enrollment
        await db.query(
            'DELETE FROM class_enrollments WHERE class_id = ? AND user_id = ?',
            [id, userId]
        );

        // Update class current students count
        if (classInfo.current_students > 0) {
            await db.update(
                'classes',
                { current_students: classInfo.current_students - 1 },
                'id = ?',
                [id]
            );
        }

        // Send notification to user
        await db.insert('notifications', {
            user_id: userId,
            title: '📚 Thông báo về lớp học',
            message: `Bạn đã được xóa khỏi lớp "${classInfo.name}". Vui lòng liên hệ admin nếu có thắc mắc.`,
            type: 'info'
        });

        // Log removal
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'student_removed_from_class',
            table_name: 'class_enrollments',
            record_id: enrollment.id,
            old_values: JSON.stringify(enrollment),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Xóa học viên khỏi lớp thành công'
        });

    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa học viên'
        });
    }
});

