/**
 * Tác vụ tự động (Scheduler)
 *
 * - Lịch chạy theo GIỜ VIỆT NAM (Asia/Ho_Chi_Minh).
 * - Trạng thái từng tác vụ (bật/tắt, lần chạy gần nhất, kết quả) lưu ở bảng system_jobs.
 * - Mỗi lần chạy được ghi vào Nhật ký hoạt động (mục "Hệ thống tự động"):
 *     logMode 'always'  → luôn ghi
 *             'changes' → chỉ ghi khi có thay đổi (count > 0) hoặc lỗi
 *             'errors'  → chỉ ghi khi lỗi
 * - Tác vụ có catchUpHours: nếu máy chủ ngủ / khởi động lại và lỡ lịch quá số giờ này
 *   thì tự chạy bù sau khi khởi động.
 * - Admin xem / bật tắt / chạy ngay ở trang Admin › Tác vụ tự động (routes/system-jobs.js).
 */
const cron         = require('node-cron');
const db           = require('../config/db');
const emailService = require('./emailService');
const auditLog     = require('../utils/auditLog');
const backupService = require('./backupService');
const newsPublisher = require('./newsPublisher');

const TZ        = 'Asia/Ho_Chi_Minh';
const TZ_OFFSET = 7 * 3600 * 1000;
const DB_TYPE   = (process.env.DB_TYPE || 'mysql').toLowerCase();
const IS_PROD   = process.env.NODE_ENV === 'production';

// ── Tiện ích ngày giờ VN ─────────────────────────────────────────
function vnDateStr(offsetDays) {
    return new Date(Date.now() + TZ_OFFSET + (offsetDays || 0) * 86400000).toISOString().slice(0, 10);
}
/** Mốc UTC của 00:00 giờ VN ngày dateStr */
function vnDayStart(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d) - TZ_OFFSET);
}
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
async function count(sql, params) {
    const r = await db.find(sql, params || []);
    return r && r[0] ? (parseInt(r[0].c, 10) || 0) : 0;
}
function fmtTime(t) {
    if (!t) return '';
    if (t instanceof Date) return String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0');
    return String(t).substring(0, 5);
}

// ═══════════════════════ CÁC TÁC VỤ ═══════════════════════
// Mỗi hàm trả về { count, message, details? }

async function jobCleanExpiredSessions() {
    const now = new Date();
    const n = await count('SELECT COUNT(*) AS c FROM user_sessions WHERE expires_at < ? OR is_active = false', [now]);
    if (n) await db.delete('user_sessions', 'expires_at < ? OR is_active = false', [now]);
    return { count: n, message: n ? `Đã dọn ${n} phiên đăng nhập hết hạn` : 'Không có phiên hết hạn' };
}

async function jobEventReminders() {
    // Nhắc các sự kiện diễn ra NGÀY MAI (giờ VN) cho người đã đăng ký — mỗi sự kiện chỉ nhắc 1 lần
    const tomorrow = vnDateStr(1);
    const rows = await db.find(
        `SELECT e.id AS event_id, e.name, e.date, e.start_time, e.end_time, e.location,
                u.email, u.first_name, u.last_name
         FROM events e
         JOIN event_registrations er ON er.event_id = e.id
         JOIN users u ON u.id = er.user_id
         WHERE e.status IN ('upcoming', 'ongoing') AND er.status = 'registered' AND e.date = ?`,
        [tomorrow]);

    let sent = 0, failed = 0;
    for (const r of rows) {
        const time = r.start_time ? fmtTime(r.start_time) + (r.end_time ? ' – ' + fmtTime(r.end_time) : '') : 'Đang cập nhật';
        const res = await emailService.sendEmail({
            to: r.email,
            subject: `Nhắc nhở: "${r.name}" diễn ra vào ngày mai`,
            html: `<h2>Nhắc nhở sự kiện</h2>
                <p>Xin chào ${esc([r.first_name, r.last_name].filter(Boolean).join(' '))},</p>
                <p>Sự kiện bạn đã đăng ký sẽ diễn ra vào <b>ngày mai</b>:</p>
                <ul><li><b>Sự kiện:</b> ${esc(r.name)}</li>
                    <li><b>Ngày:</b> ${tomorrow.split('-').reverse().join('/')}</li>
                    <li><b>Thời gian:</b> ${esc(time)}</li>
                    <li><b>Địa điểm:</b> ${esc(r.location || 'Sẽ thông báo sau')}</li></ul>
                <p>Hẹn gặp bạn! — CLB Võ Cổ Truyền HUTECH</p>`
        }).catch(() => ({ success: false }));
        if (res && res.success) sent++; else failed++;
    }
    const events = new Set(rows.map(r => r.event_id)).size;
    return {
        count: sent,
        message: rows.length
            ? `Gửi ${sent}/${rows.length} email nhắc cho ${events} sự kiện ngày ${tomorrow}` + (failed ? ` (${failed} lỗi — kiểm tra cấu hình email)` : '')
            : `Không có sự kiện nào vào ngày mai (${tomorrow}) có người đăng ký`,
        details: { date: tomorrow, events, recipients: rows.length, sent, failed }
    };
}

async function jobClassReminders() {
    // Mặc định TẮT: lịch học là chữ tự do nên không biết hôm nay có buổi hay không → sẽ gửi email mỗi ngày.
    const today = vnDateStr(0);
    const rows = await db.find(
        `SELECT c.name, c.schedule, c.location, u.email, u.first_name, u.last_name
         FROM classes c
         JOIN class_enrollments ce ON ce.class_id = c.id
         JOIN users u ON u.id = ce.user_id
         WHERE c.status = 'active' AND ce.status = 'active'
           AND (c.start_date IS NULL OR c.start_date <= ?) AND (c.end_date IS NULL OR c.end_date >= ?)`,
        [today, today]);
    let sent = 0;
    for (const r of rows) {
        const res = await emailService.sendEmail({
            to: r.email,
            subject: `Nhắc nhở: Lớp học ${r.name}`,
            html: `<h2>Nhắc nhở lớp học</h2>
                <p>Xin chào ${esc([r.first_name, r.last_name].filter(Boolean).join(' '))},</p>
                <ul><li><b>Lớp:</b> ${esc(r.name)}</li><li><b>Lịch:</b> ${esc(r.schedule || '')}</li>
                    <li><b>Địa điểm:</b> ${esc(r.location || 'Phòng tập CLB')}</li></ul>
                <p>Hẹn gặp bạn tại lớp!</p>`
        }).catch(() => ({ success: false }));
        if (res && res.success) sent++;
    }
    return { count: sent, message: rows.length ? `Gửi ${sent}/${rows.length} email nhắc lịch học` : 'Không có học viên cần nhắc' };
}

async function jobCleanNotifications() {
    // Dọn thông báo ĐÃ ĐỌC cũ hơn 90 ngày
    const cutoff = new Date(Date.now() - 90 * 86400000);
    const n = await count('SELECT COUNT(*) AS c FROM notifications WHERE is_read = true AND created_at < ?', [cutoff]);
    if (n) await db.delete('notifications', 'is_read = true AND created_at < ?', [cutoff]);
    return { count: n, message: n ? `Đã dọn ${n} thông báo đã đọc cũ hơn 90 ngày` : 'Không có thông báo cũ cần dọn' };
}

async function jobDailyReport() {
    const today = vnDateStr(0);
    const from = vnDayStart(today), to = new Date(from.getTime() + 86400000);
    const safeCount = (sql, p) => count(sql, p).catch(() => 0);
    const report = {
        date: today,
        new_users:    await safeCount('SELECT COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at < ?', [from, to]),
        new_contacts: await safeCount('SELECT COUNT(*) AS c FROM contact_messages WHERE created_at >= ? AND created_at < ?', [from, to]),
        new_events:   await safeCount('SELECT COUNT(*) AS c FROM events WHERE created_at >= ? AND created_at < ?', [from, to]),
        attendance:   await safeCount('SELECT COUNT(*) AS c FROM attendance WHERE date = ?', [today]),
        admin_actions: await safeCount('SELECT COUNT(*) AS c FROM audit_logs WHERE user_id IS NOT NULL AND created_at >= ? AND created_at < ?', [from, to]),
        deletions:    await safeCount("SELECT COUNT(*) AS c FROM audit_logs WHERE action LIKE '%deleted%' AND user_id IS NOT NULL AND created_at >= ? AND created_at < ?", [from, to])
    };

    const admins = await db.find("SELECT email FROM users WHERE role = 'admin' AND is_active = true", []);
    let sent = 0;
    for (const a of admins) {
        const res = await emailService.sendEmail({
            to: a.email,
            subject: `Báo cáo hoạt động ngày ${today.split('-').reverse().join('/')} — CLB Võ Cổ Truyền HUTECH`,
            html: `<h2>Báo cáo hoạt động ngày ${today.split('-').reverse().join('/')}</h2>
                <ul><li>Tài khoản mới: <b>${report.new_users}</b></li>
                    <li>Liên hệ mới: <b>${report.new_contacts}</b></li>
                    <li>Sự kiện mới: <b>${report.new_events}</b></li>
                    <li>Lượt điểm danh: <b>${report.attendance}</b></li>
                    <li>Thao tác của Admin: <b>${report.admin_actions}</b> (trong đó xóa: <b>${report.deletions}</b>)</li></ul>
                <p>Xem chi tiết tại Admin › Nhật ký hoạt động.</p>`
        }).catch(() => ({ success: false }));
        if (res && res.success) sent++;
    }
    return {
        count: 1,
        message: `Báo cáo ${today}: ${report.new_users} tài khoản mới, ${report.new_contacts} liên hệ, ${report.admin_actions} thao tác Admin` +
                 ` — đã gửi email cho ${sent}/${admins.length} Admin`,
        details: report
    };
}

async function jobCleanOldAuditLogs() {
    const cutoff = new Date(Date.now() - 90 * 86400000);
    const n = await count('SELECT COUNT(*) AS c FROM audit_logs WHERE created_at < ?', [cutoff]);
    if (n) await db.delete('audit_logs', 'created_at < ?', [cutoff]);
    return { count: n, message: n ? `Đã dọn ${n} dòng nhật ký cũ hơn 90 ngày` : 'Không có nhật ký cũ cần dọn' };
}

async function jobMembershipStatus() {
    // Hội viên (không phải Admin) không đăng nhập quá 6 tháng → chuyển "Không hoạt động" (inactive).
    // (CSDL chỉ cho phép active / inactive / suspended / pending — không có 'expired'.) Ghi lại từng người.
    const cutoff = new Date(Date.now() - 182 * 86400000);
    const rows = await db.find(
        `SELECT id, email, first_name, last_name, last_login_at FROM users
         WHERE membership_status = 'active' AND role <> 'admin'
           AND last_login_at IS NOT NULL AND last_login_at < ?`, [cutoff]);
    for (const u of rows.slice(0, 500)) {
        await db.update('users', { membership_status: 'inactive', updated_at: new Date() }, 'id = ?', [u.id]);
        await auditLog({
            user_id: null, action: 'membership_auto_expired', table_name: 'users', record_id: u.id,
            old_values: { email: u.email, membership_status: 'active', last_login_at: u.last_login_at },
            new_values: { email: u.email, membership_status: 'inactive', reason: 'Không đăng nhập quá 6 tháng' }
        });
    }
    const n = Math.min(rows.length, 500);
    return { count: n, message: n ? `Chuyển ${n} hội viên sang "Không hoạt động" (không đăng nhập quá 6 tháng)` : 'Không có hội viên cần chuyển trạng thái' };
}

async function jobBackup(trigger) {
    const r = await backupService.createBackup(trigger);
    const kb = Math.round(r.size_bytes / 1024);
    return {
        count: r.total_rows,
        message: `Đã sao lưu ${r.total_rows} bản ghi từ ${Object.keys(r.summary.tables).length} bảng (${kb} KB)` +
                 (r.removed ? `, xóa ${r.removed} bản cũ` : '') + ` — giữ ${backupService.KEEP} bản gần nhất`,
        details: { backup_id: r.id, size_bytes: r.size_bytes, tables: r.summary.tables, skipped: r.summary.skipped }
    };
}

async function jobPublishScheduledPosts() {
    const r = await newsPublisher.publishDue(true);
    return {
        count: r.count,
        message: r.count ? `Đã tự đăng ${r.count} bài: ` + r.titles.map(t => '"' + t + '"').join(', ') : 'Không có bài nào tới giờ đăng',
        details: r.count ? { titles: r.titles } : undefined
    };
}

async function jobKeepAlive() {
    const url = (process.env.RENDER_EXTERNAL_URL || 'https://clb-vo-co-truyen-hutech.onrender.com') + '/health';
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('Ping /health trả về ' + res.status);
    return { count: 0, message: 'Ping OK' };
}

// ═══════════════════════ DANH SÁCH TÁC VỤ ═══════════════════════
const JOBS = [
    { name: 'publishScheduledPosts', label: 'Đăng bài hẹn giờ', cron: '* * * * *', schedule: 'Mỗi phút',
      description: 'Tự đăng các tin tức được đặt "Hẹn giờ đăng" khi tới giờ. Mỗi bài tự đăng được ghi vào Nhật ký.',
      run: jobPublishScheduledPosts, logMode: 'changes', defaultEnabled: true },
    { name: 'backupDatabase', label: 'Sao lưu dữ liệu', cron: '0 3 * * *', schedule: 'Hằng ngày lúc 03:00',
      description: 'Xuất tin tức, sự kiện, đội ngũ, thư viện, thành viên, liên hệ… ra file nén. Không lưu mật khẩu. Giữ 14 bản gần nhất, tải về được.',
      run: jobBackup, logMode: 'always', defaultEnabled: true, catchUpHours: 26 },
    { name: 'sendEventReminders', label: 'Nhắc sự kiện qua email', cron: '0 9 * * *', schedule: 'Hằng ngày lúc 09:00',
      description: 'Gửi email nhắc người đã đăng ký các sự kiện diễn ra vào ngày mai.',
      run: jobEventReminders, logMode: 'changes', defaultEnabled: true, catchUpHours: 12 },
    { name: 'generateDailyReports', label: 'Báo cáo ngày cho Admin', cron: '0 22 * * *', schedule: 'Hằng ngày lúc 22:00',
      description: 'Tổng hợp tài khoản mới, liên hệ, sự kiện, thao tác Admin trong ngày và gửi email cho các Admin.',
      run: jobDailyReport, logMode: 'always', defaultEnabled: true },
    { name: 'updateMembershipStatus', label: 'Hội viên hết hạn', cron: '0 0 * * *', schedule: 'Hằng ngày lúc 00:00',
      description: 'Hội viên không đăng nhập quá 6 tháng tự chuyển sang "Không hoạt động" (không áp dụng Admin). Ghi lại từng người trong Nhật ký.',
      run: jobMembershipStatus, logMode: 'changes', defaultEnabled: true },
    { name: 'cleanExpiredSessions', label: 'Dọn phiên đăng nhập hết hạn', cron: '0 * * * *', schedule: 'Mỗi giờ',
      description: 'Xóa các phiên đăng nhập đã hết hạn hoặc đã đăng xuất.',
      run: jobCleanExpiredSessions, logMode: 'errors', defaultEnabled: true },
    { name: 'cleanExpiredNotifications', label: 'Dọn thông báo cũ', cron: '0 2 * * *', schedule: 'Hằng ngày lúc 02:00',
      description: 'Xóa thông báo đã đọc cũ hơn 90 ngày.',
      run: jobCleanNotifications, logMode: 'changes', defaultEnabled: true },
    { name: 'cleanOldAuditLogs', label: 'Dọn nhật ký cũ', cron: '0 3 * * 0', schedule: 'Chủ nhật lúc 03:00',
      description: 'Xóa nhật ký hoạt động cũ hơn 90 ngày.',
      run: jobCleanOldAuditLogs, logMode: 'changes', defaultEnabled: true },
    { name: 'sendClassReminders', label: 'Nhắc lịch học qua email', cron: '0 8 * * *', schedule: 'Hằng ngày lúc 08:00',
      description: 'Gửi email nhắc học viên đang ghi danh các lớp đang mở. Mặc định TẮT vì sẽ gửi mỗi ngày cho mọi học viên.',
      run: jobClassReminders, logMode: 'changes', defaultEnabled: false },
    { name: 'keepAlive', label: 'Giữ máy chủ hoạt động', cron: '*/14 * * * *', schedule: 'Mỗi 14 phút',
      description: 'Tự ping máy chủ để Render (gói miễn phí) không cho máy chủ "ngủ". Chỉ chạy trên production.',
      run: jobKeepAlive, logMode: 'errors', defaultEnabled: true, productionOnly: true }
];

// ═══════════════════════ LƯU TRẠNG THÁI ═══════════════════════
const STATE_DDL = {
    mssql: `
IF OBJECT_ID('system_jobs', 'U') IS NULL
CREATE TABLE system_jobs (
    name              NVARCHAR(60) NOT NULL PRIMARY KEY,
    enabled           INT NOT NULL DEFAULT 1,
    last_run_at       DATETIME NULL,
    last_success_at   DATETIME NULL,
    last_status       NVARCHAR(20) NULL,
    last_message      NVARCHAR(1000) NULL,
    last_duration_ms  INT NULL,
    run_count         INT NOT NULL DEFAULT 0,
    updated_at        DATETIME NULL
)`,
    postgres: `
CREATE TABLE IF NOT EXISTS system_jobs (
    name              VARCHAR(60) PRIMARY KEY,
    enabled           INT NOT NULL DEFAULT 1,
    last_run_at       TIMESTAMP,
    last_success_at   TIMESTAMP,
    last_status       VARCHAR(20),
    last_message      VARCHAR(1000),
    last_duration_ms  INT,
    run_count         INT NOT NULL DEFAULT 0,
    updated_at        TIMESTAMP
)`,
    mysql: `
CREATE TABLE IF NOT EXISTS system_jobs (
    name              VARCHAR(60) PRIMARY KEY,
    enabled           INT NOT NULL DEFAULT 1,
    last_run_at       DATETIME,
    last_success_at   DATETIME,
    last_status       VARCHAR(20),
    last_message      VARCHAR(1000),
    last_duration_ms  INT,
    run_count         INT NOT NULL DEFAULT 0,
    updated_at        DATETIME
) CHARACTER SET utf8mb4`
};

class SchedulerService {
    constructor() {
        this.tasks   = new Map();   // name → cron task
        this.running = new Set();   // tác vụ đang chạy (chống chạy chồng)
        this.state   = new Map();   // name → bản ghi system_jobs
        this.isRunning = false;
        this.ready = null;
    }

    get definitions() { return JOBS; }

    async ensureState() {
        if (!this.ready) {
            this.ready = (async () => {
                const ddl = DB_TYPE === 'mssql' ? STATE_DDL.mssql
                          : (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') ? STATE_DDL.postgres : STATE_DDL.mysql;
                await db.query(ddl);
                const rows = await db.find('SELECT * FROM system_jobs', []);
                rows.forEach(r => this.state.set(r.name, r));
                for (const j of JOBS) {
                    if (!this.state.has(j.name)) {
                        const row = { name: j.name, enabled: j.defaultEnabled ? 1 : 0, run_count: 0, updated_at: new Date() };
                        // Bảng không có cột id → không dùng db.insert (adapter tự thêm RETURNING/OUTPUT id)
                        await db.query('INSERT INTO system_jobs (name, enabled, run_count, updated_at) VALUES (?, ?, ?, ?)',
                            [row.name, row.enabled, 0, row.updated_at]).catch(e => console.warn('[Scheduler] insert state', j.name, e.message));
                        this.state.set(j.name, row);
                    }
                }
            })().catch(e => { this.ready = null; throw e; });
        }
        return this.ready;
    }

    async saveState(name, patch) {
        const cur = Object.assign({}, this.state.get(name) || { name }, patch, { updated_at: new Date() });
        this.state.set(name, cur);
        const upd = Object.assign({}, patch, { updated_at: cur.updated_at });
        try { await db.update('system_jobs', upd, 'name = ?', [name]); }
        catch (e) { console.warn('[Scheduler] Không lưu được trạng thái', name, e.message); }
    }

    isEnabled(name) {
        const s = this.state.get(name);
        return s ? !!parseInt(s.enabled, 10) : true;
    }

    /**
     * Chạy một tác vụ.
     * @param {string} name
     * @param {object} opts { trigger: 'schedule'|'manual'|'catchup', userId }
     */
    async runJob(name, opts) {
        opts = opts || {};
        const job = JOBS.find(j => j.name === name);
        if (!job) throw new Error('Không có tác vụ ' + name);
        if (this.running.has(name)) return { status: 'skipped', message: 'Tác vụ đang chạy' };
        this.running.add(name);

        const trigger = opts.trigger || 'schedule';
        const started = Date.now();
        let status = 'success', result = null, errMsg = null;
        try {
            await this.ensureState().catch(() => {});
            result = await job.run(trigger) || {};
        } catch (e) {
            status = 'error';
            errMsg = e.message || String(e);
            console.error(`❌ [Scheduler] ${name}:`, errMsg);
        } finally {
            this.running.delete(name);
        }

        const duration = Date.now() - started;
        const message  = status === 'success' ? (result.message || 'Hoàn tất') : ('Lỗi: ' + errMsg);
        const prev     = this.state.get(name) || {};
        await this.saveState(name, Object.assign({
            last_run_at: new Date(),
            last_status: status,
            last_message: message.substring(0, 1000),
            last_duration_ms: duration,
            run_count: (parseInt(prev.run_count, 10) || 0) + 1
        }, status === 'success' ? { last_success_at: new Date() } : {}));

        const shouldLog = trigger === 'manual' || status === 'error' || job.logMode === 'always' ||
                          (job.logMode === 'changes' && result && result.count > 0);
        if (shouldLog) {
            await auditLog({
                user_id: null,
                action: status === 'success' ? 'system_job_run' : 'system_job_failed',
                table_name: 'system_jobs',
                new_values: Object.assign({
                    job: name, label: job.label, status, trigger, duration_ms: duration, message
                }, result && result.details ? { details: result.details } : {})
            });
        }
        if (status === 'success') console.log(`✅ [Scheduler] ${name} (${duration}ms): ${message}`);
        return { status, message, duration_ms: duration, details: result && result.details };
    }

    start() {
        if (this.isRunning) return;
        console.log('🕐 Starting scheduler service (giờ Việt Nam)...');
        for (const j of JOBS) {
            if (j.productionOnly && !IS_PROD) continue;
            const task = cron.schedule(j.cron, () => {
                if (!this.isEnabled(j.name)) return;
                this.runJob(j.name, { trigger: 'schedule' }).catch(() => {});
            }, { timezone: TZ });
            this.tasks.set(j.name, task);
            console.log(`   Scheduled: ${j.name} (${j.schedule})`);
        }
        this.isRunning = true;

        // Nạp trạng thái + chạy bù các tác vụ quan trọng bị lỡ lịch.
        // Kết nối CSDL có thể chưa sẵn sàng ngay lúc khởi động → thử lại tối đa 10 lần, mỗi lần cách 15 giây.
        const init = (attempt) => {
            this.ensureState().then(() => {
                setTimeout(() => this.catchUp().catch(() => {}), 90 * 1000);
            }).catch(e => {
                if (attempt < 10) setTimeout(() => init(attempt + 1), 15 * 1000);
                else console.warn('[Scheduler] Không tạo được bảng system_jobs:', e.message);
            });
        };
        setTimeout(() => init(1), 5000);
        console.log('✅ Scheduler service started with', this.tasks.size, 'jobs');
    }

    async catchUp() {
        for (const j of JOBS) {
            if (!j.catchUpHours || !this.isEnabled(j.name)) continue;
            if (j.productionOnly && !IS_PROD) continue;
            const s = this.state.get(j.name) || {};
            const last = s.last_success_at ? new Date(s.last_success_at).getTime() : 0;
            if (Date.now() - last > j.catchUpHours * 3600 * 1000) {
                console.log(`↻ [Scheduler] Chạy bù ${j.name} (lần thành công gần nhất: ${last ? new Date(last).toISOString() : 'chưa có'})`);
                await this.runJob(j.name, { trigger: 'catchup' });
            }
        }
    }

    stop() {
        this.tasks.forEach(t => t.stop());
        this.tasks.clear();
        this.isRunning = false;
        console.log('✅ Scheduler service stopped');
    }

    async setEnabled(name, enabled) {
        if (!JOBS.find(j => j.name === name)) throw new Error('Không có tác vụ ' + name);
        await this.ensureState();
        await this.saveState(name, { enabled: enabled ? 1 : 0 });
    }

    async getStatus() {
        await this.ensureState().catch(() => {});
        return JOBS.map(j => {
            const s = this.state.get(j.name) || {};
            return {
                name: j.name, label: j.label, description: j.description, schedule: j.schedule, cron: j.cron,
                enabled: s.enabled === undefined ? j.defaultEnabled : !!parseInt(s.enabled, 10),
                active_here: !(j.productionOnly && !IS_PROD),
                running: this.running.has(j.name),
                last_run_at: s.last_run_at || null,
                last_success_at: s.last_success_at || null,
                last_status: s.last_status || null,
                last_message: s.last_message || null,
                last_duration_ms: s.last_duration_ms || null,
                run_count: parseInt(s.run_count, 10) || 0
            };
        });
    }

    // Tương thích với /health cũ
    getJobStatus() {
        return {
            isRunning: this.isRunning,
            totalJobs: this.tasks.size,
            jobs: Array.from(this.tasks.keys()).map(name => ({ name, running: this.running.has(name) }))
        };
    }
}

module.exports = new SchedulerService();
