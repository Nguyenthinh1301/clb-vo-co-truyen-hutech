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
        const members = await db.query(`
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
 * GET /api/admin/members/:id
 * Lấy thông tin chi tiết một thành viên
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const members = await db.query(`
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
        
        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }
        
        res.json({
            success: true,
            data: members[0]
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
        
        // Validate required fields
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }
        
        // Check if email exists
        const existingUsers = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }
        
        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new member
        const result = await db.query(`
            INSERT INTO users (
                email,
                password,
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            email,
            hashedPassword,
            first_name,
            last_name,
            phone || null,
            date_of_birth || null,
            gender || null,
            address || null,
            role || 'member',
            is_active !== undefined ? Boolean(is_active) : true
        ]);
        
        // Get the newly created member
        const newMember = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        res.status(201).json({
            success: true,
            message: 'Tạo thành viên thành công',
            data: newMember[0]
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
        
        // Check if member exists
        const existingMembers = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );
        
        if (existingMembers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }
        
        // Check if email is taken by another user
        if (email) {
            const emailCheck = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            
            if (emailCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi thành viên khác'
                });
            }
        }
        
        // Update member
        await db.query(`
            UPDATE users SET
                email = COALESCE(?, email),
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = ?,
                date_of_birth = ?,
                gender = ?,
                address = ?,
                role = COALESCE(?, role),
                is_active = COALESCE(?, is_active),
                updated_at = NOW()
            WHERE id = ?
        `, [
            email,
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender,
            address,
            role,
            is_active,
            id
        ]);
        
        // Get updated member
        const updatedMember = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Cập nhật thành viên thành công',
            data: updatedMember[0]
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
 * Xóa thành viên
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if member exists
        const existingMembers = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );
        
        if (existingMembers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }
        
        // Soft delete (set is_active = false) instead of hard delete
        await db.query(
            'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ?',
            [id]
        );
        
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

/**
 * GET /api/admin/members/stats/summary
 * Lấy thống kê tổng quan
 */
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_members,
                SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_members,
                SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as regular_members,
                SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
            FROM users
        `);
        
        res.json({
            success: true,
            data: stats[0]
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

module.exports = router;
