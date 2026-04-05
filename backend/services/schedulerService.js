const cron = require('node-cron');
const db = require('../config/db');
const emailService = require('./emailService');
const { SessionManager } = require('../middleware/auth');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    // Start all scheduled jobs
    start() {
        if (this.isRunning) {
            console.log('⚠️  Scheduler already running');
            return;
        }

        console.log('🕐 Starting scheduler service...');

        // Clean expired sessions - Every hour
        this.scheduleJob('cleanExpiredSessions', '0 * * * *', async () => {
            await this.cleanExpiredSessions();
        });

        // Send class reminders - Every day at 8 AM
        this.scheduleJob('sendClassReminders', '0 8 * * *', async () => {
            await this.sendClassReminders();
        });

        // Send event reminders - Every day at 9 AM
        this.scheduleJob('sendEventReminders', '0 9 * * *', async () => {
            await this.sendEventReminders();
        });

        // Clean expired notifications - Every day at 2 AM
        this.scheduleJob('cleanExpiredNotifications', '0 2 * * *', async () => {
            await this.cleanExpiredNotifications();
        });

        // Generate daily reports - Every day at 11 PM
        this.scheduleJob('generateDailyReports', '0 23 * * *', async () => {
            await this.generateDailyReports();
        });

        // Clean old audit logs - Every week on Sunday at 3 AM
        this.scheduleJob('cleanOldAuditLogs', '0 3 * * 0', async () => {
            await this.cleanOldAuditLogs();
        });

        // Update membership status - Every day at midnight
        this.scheduleJob('updateMembershipStatus', '0 0 * * *', async () => {
            await this.updateMembershipStatus();
        });

        // Backup database - Every day at 4 AM
        this.scheduleJob('backupDatabase', '0 4 * * *', async () => {
            await this.backupDatabase();
        });

        this.isRunning = true;
        console.log('✅ Scheduler service started with', this.jobs.size, 'jobs');
    }

    // Stop all scheduled jobs
    stop() {
        console.log('🛑 Stopping scheduler service...');
        
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`   Stopped: ${name}`);
        });
        
        this.jobs.clear();
        this.isRunning = false;
        console.log('✅ Scheduler service stopped');
    }

    // Schedule a job
    scheduleJob(name, cronExpression, task) {
        try {
            const job = cron.schedule(cronExpression, async () => {
                console.log(`⏰ Running scheduled job: ${name}`);
                const startTime = Date.now();
                
                try {
                    await task();
                    const duration = Date.now() - startTime;
                    console.log(`✅ Job completed: ${name} (${duration}ms)`);
                } catch (error) {
                    console.error(`❌ Job failed: ${name}`, error);
                }
            });

            this.jobs.set(name, job);
            console.log(`   Scheduled: ${name} (${cronExpression})`);
        } catch (error) {
            console.error(`Failed to schedule job ${name}:`, error);
        }
    }

    // Job: Clean expired sessions
    async cleanExpiredSessions() {
        try {
            const result = await SessionManager.cleanExpiredSessions();
            console.log(`   Cleaned ${result} expired sessions`);
        } catch (error) {
            console.error('Clean expired sessions error:', error);
        }
    }

    // Job: Send class reminders
    async sendClassReminders() {
        try {
            // Get classes happening today
            const today = new Date().toISOString().split('T')[0];
            
            const classes = await db.query(`
                SELECT c.*, ce.user_id, u.email, u.first_name, u.last_name
                FROM classes c
                JOIN class_enrollments ce ON c.id = ce.class_id
                JOIN users u ON ce.user_id = u.id
                WHERE c.status = 'active'
                AND ce.status = 'enrolled'
                AND c.start_date <= ?
                AND (c.end_date IS NULL OR c.end_date >= ?)
            `, [today, today]);

            let sentCount = 0;
            for (const classInfo of classes) {
                const result = await emailService.sendEmail({
                    to: classInfo.email,
                    subject: `Nhắc nhở: Lớp học ${classInfo.name}`,
                    html: `
                        <h2>Nhắc nhở lớp học</h2>
                        <p>Xin chào ${classInfo.first_name} ${classInfo.last_name},</p>
                        <p>Đây là lời nhắc về lớp học của bạn:</p>
                        <ul>
                            <li><strong>Lớp:</strong> ${classInfo.name}</li>
                            <li><strong>Lịch:</strong> ${classInfo.schedule}</li>
                            <li><strong>Địa điểm:</strong> ${classInfo.location || 'Phòng tập CLB'}</li>
                        </ul>
                        <p>Hẹn gặp bạn tại lớp!</p>
                    `
                });

                if (result.success) sentCount++;
            }

            console.log(`   Sent ${sentCount} class reminders`);
        } catch (error) {
            console.error('Send class reminders error:', error);
        }
    }

    // Job: Send event reminders
    async sendEventReminders() {
        try {
            // Get events happening in next 3 days
            const today = new Date();
            const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
            
            const events = await db.query(`
                SELECT e.*, er.user_id, u.email, u.first_name, u.last_name
                FROM events e
                JOIN event_registrations er ON e.id = er.event_id
                JOIN users u ON er.user_id = u.id
                WHERE e.status = 'scheduled'
                AND er.status IN ('registered', 'confirmed')
                AND e.start_date BETWEEN ? AND ?
            `, [today.toISOString().split('T')[0], threeDaysLater.toISOString().split('T')[0]]);

            let sentCount = 0;
            for (const event of events) {
                const result = await emailService.sendEmail({
                    to: event.email,
                    subject: `Nhắc nhở: Sự kiện ${event.title}`,
                    html: `
                        <h2>Nhắc nhở sự kiện</h2>
                        <p>Xin chào ${event.first_name} ${event.last_name},</p>
                        <p>Sự kiện bạn đã đăng ký sắp diễn ra:</p>
                        <ul>
                            <li><strong>Sự kiện:</strong> ${event.title}</li>
                            <li><strong>Ngày:</strong> ${new Date(event.start_date).toLocaleDateString('vi-VN')}</li>
                            <li><strong>Thời gian:</strong> ${event.start_time} - ${event.end_time}</li>
                            <li><strong>Địa điểm:</strong> ${event.location || 'Sẽ thông báo sau'}</li>
                        </ul>
                        <p>Chúng tôi rất mong được gặp bạn!</p>
                    `
                });

                if (result.success) sentCount++;
            }

            console.log(`   Sent ${sentCount} event reminders`);
        } catch (error) {
            console.error('Send event reminders error:', error);
        }
    }

    // Job: Clean expired notifications
    async cleanExpiredNotifications() {
        try {
            // Use GETDATE() for MSSQL instead of NOW()
            const result = await db.delete(
                'notifications',
                'expires_at IS NOT NULL AND expires_at < GETDATE()'
            );

            console.log(`   Cleaned ${result} expired notifications`);
        } catch (error) {
            console.error('Clean expired notifications error:', error);
        }
    }

    // Job: Generate daily reports
    async generateDailyReports() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Get daily statistics
            const [userStats, classStats, eventStats, attendanceStats] = await Promise.all([
                db.query('SELECT COUNT(*) as new_users FROM users WHERE CAST(created_at AS DATE) = ?', [today]),
                db.query('SELECT COUNT(*) as new_classes FROM classes WHERE CAST(created_at AS DATE) = ?', [today]),
                db.query('SELECT COUNT(*) as new_events FROM events WHERE CAST(created_at AS DATE) = ?', [today]),
                db.query('SELECT COUNT(*) as total_attendance FROM attendance WHERE date = ?', [today])
            ]);

            const report = {
                date: today,
                new_users: userStats[0].new_users,
                new_classes: classStats[0].new_classes,
                new_events: eventStats[0].new_events,
                total_attendance: attendanceStats[0].total_attendance
            };

            // Send report to admins
            const admins = await db.query('SELECT email FROM users WHERE role = "admin" AND is_active = 1');
            
            for (const admin of admins) {
                await emailService.sendEmail({
                    to: admin.email,
                    subject: `Báo cáo hàng ngày - ${today}`,
                    html: `
                        <h2>Báo cáo hoạt động ngày ${today}</h2>
                        <ul>
                            <li>Người dùng mới: ${report.new_users}</li>
                            <li>Lớp học mới: ${report.new_classes}</li>
                            <li>Sự kiện mới: ${report.new_events}</li>
                            <li>Tổng điểm danh: ${report.total_attendance}</li>
                        </ul>
                    `
                });
            }

            console.log('   Daily report generated and sent');
        } catch (error) {
            console.error('Generate daily reports error:', error);
        }
    }

    // Job: Clean old audit logs
    async cleanOldAuditLogs() {
        try {
            // Keep logs for 90 days
            // Use DATEADD for MSSQL instead of DATE_SUB
            const result = await db.delete(
                'audit_logs',
                'created_at < DATEADD(DAY, -90, GETDATE())'
            );

            console.log(`   Cleaned ${result} old audit logs`);
        } catch (error) {
            console.error('Clean old audit logs error:', error);
        }
    }

    // Job: Update membership status
    async updateMembershipStatus() {
        try {
            // Find users with expired memberships
            // Use DATEADD for MSSQL instead of DATE_SUB
            const result = await db.query(`
                UPDATE users 
                SET membership_status = 'expired'
                WHERE membership_status = 'active'
                AND last_login_at < DATEADD(MONTH, -6, GETDATE())
            `);

            console.log(`   Updated ${result.affectedRows || result.rowsAffected || 0} membership statuses`);
        } catch (error) {
            console.error('Update membership status error:', error);
        }
    }

    // Job: Backup database
    async backupDatabase() {
        try {
            // This is a placeholder - implement actual backup logic
            console.log('   Database backup completed (placeholder)');
            // TODO: Implement actual database backup
        } catch (error) {
            console.error('Backup database error:', error);
        }
    }

    // Get job status
    getJobStatus() {
        const status = [];
        
        this.jobs.forEach((job, name) => {
            status.push({
                name,
                running: this.isRunning
            });
        });

        return {
            isRunning: this.isRunning,
            totalJobs: this.jobs.size,
            jobs: status
        };
    }

    // Run a job manually
    async runJobManually(jobName) {
        const jobMethods = {
            cleanExpiredSessions: () => this.cleanExpiredSessions(),
            sendClassReminders: () => this.sendClassReminders(),
            sendEventReminders: () => this.sendEventReminders(),
            cleanExpiredNotifications: () => this.cleanExpiredNotifications(),
            generateDailyReports: () => this.generateDailyReports(),
            cleanOldAuditLogs: () => this.cleanOldAuditLogs(),
            updateMembershipStatus: () => this.updateMembershipStatus(),
            backupDatabase: () => this.backupDatabase()
        };

        if (jobMethods[jobName]) {
            console.log(`🔧 Running job manually: ${jobName}`);
            await jobMethods[jobName]();
            return { success: true, message: `Job ${jobName} executed successfully` };
        } else {
            return { success: false, message: `Job ${jobName} not found` };
        }
    }
}

// Create and export scheduler service instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;