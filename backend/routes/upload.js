/**
 * Upload Route - Xử lý upload hình ảnh
 * POST /api/upload/image  → upload 1 ảnh, trả về URL
 */
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const { authenticate, authenticateJwt, requireAdmin } = require('../middleware/auth');

// ── Đảm bảo thư mục uploads tồn tại ──
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'cms');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Cấu hình multer ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(12).toString('hex') + ext;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP) hoặc video (MP4, MOV, AVI, MKV, WEBM)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ── POST /api/upload/image ──
router.post('/image', (req, res, next) => {
    // Chạy authenticateJwt trước, nếu lỗi trả JSON ngay (không để multer xử lý)
    authenticateJwt(req, res, (authErr) => {
        if (authErr) return next(authErr);
        requireAdmin(req, res, (adminErr) => {
            if (adminErr) return next(adminErr);
            // Auth OK → chạy multer
            upload.single('image')(req, res, (multerErr) => {
                if (multerErr) return next(multerErr);

                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'Không có file được upload' });
                }

                const url = `/uploads/cms/${req.file.filename}`;
                res.json({
                    success: true,
                    message: 'Upload thành công',
                    data: {
                        url,
                        filename: req.file.filename,
                        size:     req.file.size,
                        mimetype: req.file.mimetype
                    }
                });
            });
        });
    });
});

// ── DELETE /api/upload/image/:filename ──
router.delete('/image/:filename', authenticateJwt, requireAdmin, (req, res) => {
    const filename = path.basename(req.params.filename); // tránh path traversal
    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ success: false, message: 'File không tồn tại' });
    }

    fs.unlink(filepath, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Không thể xóa file' });
        res.json({ success: true, message: 'Đã xóa file' });
    });
});

// ── Error handler cho route này ──
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File quá lớn — tối đa 10 MB' });
        }
        return res.status(400).json({ success: false, message: 'Lỗi upload: ' + err.message });
    }
    // Lỗi auth đã được xử lý bởi middleware, nhưng phòng trường hợp
    if (err && err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    res.status(400).json({ success: false, message: err ? err.message : 'Lỗi không xác định' });
});

module.exports = router;
