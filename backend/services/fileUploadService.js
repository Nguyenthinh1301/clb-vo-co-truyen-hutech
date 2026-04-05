const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileUploadService {
    constructor() {
        this.uploadDir = process.env.UPLOAD_PATH || 'uploads';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default
        this.allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx').split(',');
        
        this.initializeUploadDir();
    }

    // Initialize upload directories
    async initializeUploadDir() {
        const dirs = [
            this.uploadDir,
            path.join(this.uploadDir, 'profiles'),
            path.join(this.uploadDir, 'documents'),
            path.join(this.uploadDir, 'events'),
            path.join(this.uploadDir, 'temp')
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }

        console.log('✅ Upload directories initialized');
    }

    // Configure multer storage
    getStorage(subfolder = '') {
        return multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadPath = path.join(this.uploadDir, subfolder);
                try {
                    await fs.mkdir(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                } catch (error) {
                    cb(error);
                }
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = crypto.randomBytes(16).toString('hex');
                const ext = path.extname(file.originalname);
                const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
                cb(null, filename);
            }
        });
    }

    // File filter
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase().substring(1);
        
        if (this.allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type .${ext} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`));
        }
    }

    // Create multer upload middleware
    createUploadMiddleware(options = {}) {
        const {
            subfolder = '',
            fieldName = 'file',
            maxCount = 1,
            fileSize = this.maxFileSize
        } = options;

        const upload = multer({
            storage: this.getStorage(subfolder),
            fileFilter: this.fileFilter.bind(this),
            limits: {
                fileSize: fileSize
            }
        });

        if (maxCount === 1) {
            return upload.single(fieldName);
        } else {
            return upload.array(fieldName, maxCount);
        }
    }

    // Profile image upload
    uploadProfileImage() {
        return this.createUploadMiddleware({
            subfolder: 'profiles',
            fieldName: 'profile_image',
            maxCount: 1,
            fileSize: 2 * 1024 * 1024 // 2MB for profile images
        });
    }

    // Document upload
    uploadDocument() {
        return this.createUploadMiddleware({
            subfolder: 'documents',
            fieldName: 'document',
            maxCount: 1
        });
    }

    // Multiple files upload
    uploadMultiple(fieldName = 'files', maxCount = 5) {
        return this.createUploadMiddleware({
            subfolder: 'temp',
            fieldName,
            maxCount
        });
    }

    // Event image upload
    uploadEventImage() {
        return this.createUploadMiddleware({
            subfolder: 'events',
            fieldName: 'event_image',
            maxCount: 1,
            fileSize: 3 * 1024 * 1024 // 3MB for event images
        });
    }

    // Get file URL
    getFileUrl(filename, subfolder = '') {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const filePath = subfolder ? `${subfolder}/${filename}` : filename;
        return `${baseUrl}/uploads/${filePath}`;
    }

    // Delete file
    async deleteFile(filename, subfolder = '') {
        try {
            const filePath = path.join(this.uploadDir, subfolder, filename);
            await fs.unlink(filePath);
            return { success: true, message: 'File deleted successfully' };
        } catch (error) {
            console.error('Delete file error:', error);
            return { success: false, message: error.message };
        }
    }

    // Get file info
    async getFileInfo(filename, subfolder = '') {
        try {
            const filePath = path.join(this.uploadDir, subfolder, filename);
            const stats = await fs.stat(filePath);
            
            return {
                success: true,
                data: {
                    filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    url: this.getFileUrl(filename, subfolder)
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Clean up old temp files
    async cleanupTempFiles(olderThanHours = 24) {
        try {
            const tempDir = path.join(this.uploadDir, 'temp');
            const files = await fs.readdir(tempDir);
            const now = Date.now();
            const maxAge = olderThanHours * 60 * 60 * 1000;
            
            let deletedCount = 0;
            
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }
            
            console.log(`✅ Cleaned up ${deletedCount} temp files`);
            return { success: true, deletedCount };
        } catch (error) {
            console.error('Cleanup temp files error:', error);
            return { success: false, message: error.message };
        }
    }

    // Validate image dimensions
    async validateImageDimensions(filePath, options = {}) {
        const {
            minWidth = 0,
            minHeight = 0,
            maxWidth = Infinity,
            maxHeight = Infinity
        } = options;

        try {
            // This would require an image processing library like 'sharp'
            // For now, we'll just return true
            // TODO: Implement with sharp library
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get upload statistics
    async getUploadStats() {
        try {
            const stats = {
                profiles: await this.getDirectoryStats('profiles'),
                documents: await this.getDirectoryStats('documents'),
                events: await this.getDirectoryStats('events'),
                temp: await this.getDirectoryStats('temp')
            };

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get directory statistics
    async getDirectoryStats(subfolder) {
        try {
            const dirPath = path.join(this.uploadDir, subfolder);
            const files = await fs.readdir(dirPath);
            
            let totalSize = 0;
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }

            return {
                fileCount: files.length,
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            return {
                fileCount: 0,
                totalSize: 0,
                totalSizeMB: '0.00'
            };
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Check if file exists
    async fileExists(filename, subfolder = '') {
        try {
            const filePath = path.join(this.uploadDir, subfolder, filename);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    // Move file from temp to permanent location
    async moveFile(filename, fromSubfolder, toSubfolder) {
        try {
            const fromPath = path.join(this.uploadDir, fromSubfolder, filename);
            const toPath = path.join(this.uploadDir, toSubfolder, filename);
            
            // Ensure destination directory exists
            await fs.mkdir(path.join(this.uploadDir, toSubfolder), { recursive: true });
            
            // Move file
            await fs.rename(fromPath, toPath);
            
            return { 
                success: true, 
                message: 'File moved successfully',
                newUrl: this.getFileUrl(filename, toSubfolder)
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Create and export file upload service instance
const fileUploadService = new FileUploadService();

module.exports = fileUploadService;