/**
 * Upload Route - Xử lý upload hình ảnh
 * POST /api/upload/image  → upload 1 ảnh, trả về URL
 *
 * Nếu có CLOUDINARY_CLOUD_NAME → upload lên Cloudinary (production)
 * Nếu không → lưu local disk (development)
 */
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const { authenticate, authenticateJwt, requireAdmin } = require('../middleware/auth');

// ── Cloudinary setup (chỉ khi có env vars) ──────────────────
const USE_CLOUDINARY = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

let cloudinary;
if (USE_CLOUDINARY) {
    const { v2 } = require('cloudinary');
    v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure:     true
    });
    cloudinary = v2;
    console.log('☁️  Upload: Cloudinary enabled');
} else {
    console.log('💾  Upload: Local disk storage');
}

// ── Local disk fallback ──────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'cms');
if (!USE_CLOUDINARY && !fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Multer — dùng memoryStorage khi Cloudinary, diskStorage khi local ──
const storage = USE_CLOUDINARY
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOAD_DIR),
        filename:    (req, file, cb) => {
            const ext  = path.extname(file.originalname).toLowerCase();
            const name = crypto.randomBytes(12).toString('hex') + ext;
            cb(null, name);
        }
    });

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ── Helper: upload buffer lên Cloudinary ────────────────────
function uploadToCloudinary(buffer, originalname) {
    return new Promise((resolve, reject) => {
        const ext    = path.extname(originalname).toLowerCase().replace('.', '');
        const folder = 'clb-vo-hutech/cms';
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image', format: ext === 'jpg' ? 'jpg' : ext },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}

// ── POST /api/upload/image ───────────────────────────────────
router.post('/image', (req, res, next) => {
    authenticateJwt(req, res, (authErr) => {
        if (authErr) return next(authErr);
        requireAdmin(req, res, (adminErr) => {
            if (adminErr) return next(adminErr);

            upload.single('image')(req, res, async (multerErr) => {
                if (multerErr) return next(multerErr);
                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'Không có file được upload' });
                }

                try {
                    let url, filename;

                    if (USE_CLOUDINARY) {
                        // Upload lên Cloudinary
                        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
                        url      = result.secure_url;
                        filename = result.public_id;
                    } else {
                        // Local disk
                        url      = `/uploads/cms/${req.file.filename}`;
                        filename = req.file.filename;
                    }

                    res.json({
                        success: true,
                        message: 'Upload thành công',
                        data: {
                            url,
                            filename,
                            size:     req.file.size,
                            mimetype: req.file.mimetype,
                            storage:  USE_CLOUDINARY ? 'cloudinary' : 'local'
                        }
                    });
                } catch (err) {
                    console.error('Upload error:', err);
                    res.status(500).json({ success: false, message: 'Lỗi khi upload ảnh: ' + err.message });
                }
            });
        });
    });
});

// ── DELETE /api/upload/image/:filename ──────────────────────
router.delete('/image/:filename', authenticateJwt, requireAdmin, async (req, res) => {
    const filename = req.params.filename;

    try {
        if (USE_CLOUDINARY) {
            // Xóa trên Cloudinary (public_id)
            await cloudinary.uploader.destroy(filename);
            return res.json({ success: true, message: 'Đã xóa file trên Cloudinary' });
        }

        // Local disk
        const safeFilename = path.basename(filename);
        const filepath = path.join(UPLOAD_DIR, safeFilename);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'File không tồn tại' });
        }
        fs.unlinkSync(filepath);
        res.json({ success: true, message: 'Đã xóa file' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Không thể xóa file: ' + err.message });
    }
});

// ── Error handler ────────────────────────────────────────────
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File quá lớn — tối đa 10 MB' });
        }
        return res.status(400).json({ success: false, message: 'Lỗi upload: ' + err.message });
    }
    if (err && err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    res.status(400).json({ success: false, message: err ? err.message : 'Lỗi không xác định' });
});

module.exports = router;
