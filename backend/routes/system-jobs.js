/**
 * Tác vụ tự động & Sao lưu (Admin)
 *   GET  /api/system-jobs                       — danh sách tác vụ + trạng thái
 *   POST /api/system-jobs/:name/run             — chạy ngay
 *   PUT  /api/system-jobs/:name   {enabled}     — bật / tắt
 *   GET  /api/system-jobs/backups               — danh sách bản sao lưu
 *   GET  /api/system-jobs/backups/:id/download  — tải bản sao lưu (JSON)
 */
const express   = require('express');
const router    = express.Router();
const { authenticateJwt, requireAdmin } = require('../middleware/auth');
const scheduler = require('../services/schedulerService');
const backupService = require('../services/backupService');
const auditLog  = require('../utils/auditLog');

router.use(authenticateJwt, requireAdmin);

function logUser(req, action, values) {
    return auditLog({
        user_id: req.user.id, action, table_name: 'system_jobs',
        new_values: values, ip_address: req.ip, user_agent: req.get('User-Agent')
    });
}

router.get('/', async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: { jobs: await scheduler.getStatus(), timezone: 'Asia/Ho_Chi_Minh', now: new Date() } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

router.get('/backups', async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: { backups: await backupService.listBackups(), keep: backupService.KEEP } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

router.get('/backups/:id/download', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const b = await backupService.getBackupJson(id);
        if (!b) return res.status(404).json({ success: false, message: 'Không tìm thấy bản sao lưu' });
        const stamp = new Date(b.created_at).toISOString().replace(/[:T]/g, '-').slice(0, 16);
        await logUser(req, 'backup_downloaded', { backup_id: id, label: 'Bản sao lưu #' + id });
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.set('Content-Disposition', `attachment; filename="clb-vct-backup-${id}-${stamp}.json"`);
        res.set('Cache-Control', 'no-store');
        res.send(b.json);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

router.post('/:name/run', async (req, res) => {
    const job = scheduler.definitions.find(j => j.name === req.params.name);
    if (!job) return res.status(404).json({ success: false, message: 'Không có tác vụ này' });
    try {
        await logUser(req, 'system_job_triggered', { job: job.name, label: job.label });
        const r = await scheduler.runJob(job.name, { trigger: 'manual', userId: req.user.id });
        res.json({ success: r.status !== 'error', message: r.message, data: r });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

router.put('/:name', async (req, res) => {
    const job = scheduler.definitions.find(j => j.name === req.params.name);
    if (!job) return res.status(404).json({ success: false, message: 'Không có tác vụ này' });
    try {
        const enabled = !!req.body.enabled;
        await scheduler.setEnabled(job.name, enabled);
        await logUser(req, enabled ? 'system_job_enabled' : 'system_job_disabled', { job: job.name, label: job.label });
        res.json({ success: true, message: (enabled ? 'Đã bật ' : 'Đã tắt ') + job.label });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

module.exports = router;
