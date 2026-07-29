/**
 * Members API Routes
 * Quản lý thành viên CLB
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/members
 * Lấy danh sách tất cả thành viên
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const members = await db.find(`
            SELECT
                id,
                email,
                first_name,
                last_name,
                phone,
                date_of_birth,
                gender,
                address,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thành viên',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/members/stats/summary
 * Lấy thống kê tổng quan — phải khai báo trước /:id để tránh bị match nhầm
 */
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await db.findOne(`
            SELECT
                COUNT(*) as total_members,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_members,
                SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as regular_members,
                SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
            FROM users
        `);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/members/:id
 * Lấy thông tin chi tiết một thành viên
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const member = await db.findOne(`
            SELECT
                id,
                email,
                first_name,
                last_name,
                phone,
                date_of_birth,
                gender,
                address,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `, [id]);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        res.json({
            success: true,
            data: member
        });
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin thành viên',
            error: error.message
        });
    }
});

/**
 * POST /api/admin/members
 * Tạo thành viên mới
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender,
            address,
            role,
            is_active
        } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const existingUser = await db.findOne(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newId = await db.insert('users', {
            email,
            password: hashedPassword,
            first_name,
            last_name,
            phone: phone || null,
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            address: address || null,
            role: role || 'member',
            is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1
        });

        const newMember = await db.findOne(
            'SELECT * FROM users WHERE id = ?',
            [newId]
        );

        res.status(201).json({
            success: true,
            message: 'Tạo thành viên thành công',
            data: newMember
        });
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thành viên',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/members/:id
 * Cập nhật thông tin thành viên
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email,
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender,
            address,
            role,
            is_active
        } = req.body;

        const existingMember = await db.findOne(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (!existingMember) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        if (email) {
            const emailConflict = await db.findOne(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );

            if (emailConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi thành viên khác'
                });
            }
        }

        const updateData = {};
        if (email !== undefined)        updateData.email        = email;
        if (first_name !== undefined)   updateData.first_name   = first_name;
        if (last_name !== undefined)    updateData.last_name    = last_name;
        if (phone !== undefined)        updateData.phone        = phone;
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
        if (gender !== undefined)       updateData.gender       = gender;
        if (address !== undefined)      updateData.address      = address;
        if (role !== undefined)         updateData.role         = role;
        if (is_active !== undefined)    updateData.is_active    = is_active ? 1 : 0;
        updateData.updated_at = new Date();

        await db.update('users', updateData, 'id = ?', [id]);

        const updatedMember = await db.findOne(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Cập nhật thành viên thành công',
            data: updatedMember
        });
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thành viên',
            error: error.message
        });
    }
});

/**
 * DELETE /api/admin/members/:id
 * Xóa thành viên (soft delete)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const existingMember = await db.findOne(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (!existingMember) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        await db.update('users', { is_active: 0, updated_at: new Date() }, 'id = ?', [id]);

        res.json({
            success: true,
            message: 'Xóa thành viên thành công'
        });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thành viên',
            error: error.message
        });
    }
});

module.exports = router;
