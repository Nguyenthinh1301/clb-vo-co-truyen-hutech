const db = require('../config/db');
const { cacheService, CacheKeys, CacheTTL } = require('./cacheService');

class AnalyticsService {
    constructor() {
        this.metrics = new Map();
    }

    // Track event
    trackEvent(eventName, data = {}) {
        const event = {
            name: eventName,
            data,
            timestamp: Date.now()
        };

        if (!this.metrics.has(eventName)) {
            this.metrics.set(eventName, []);
        }

        this.metrics.get(eventName).push(event);
    }

    // Get user analytics
    async getUserAnalytics(userId, options = {}) {
        const cacheKey = `analytics:user:${userId}`;
        
        return await cacheService.wrap(cacheKey, async () => {
            const { start_date, end_date } = options;
            
            let whereClause = 'user_id = ?';
            let params = [userId];

            if (start_date) {
                whereClause += ' AND created_at >= ?';
                params.push(start_date);
            }

            if (end_date) {
                whereClause += ' AND created_at <= ?';
                params.push(end_date);
            }

            const [
                classStats,
                eventStats,
                attendanceStats,
                paymentStats,
                activityLog
            ] = await Promise.all([
                // Class statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_classes,
                     SUM(CASE WHEN ce.status = 'enrolled' THEN 1 ELSE 0 END) as active_classes,
                     SUM(CASE WHEN ce.status = 'completed' THEN 1 ELSE 0 END) as completed_classes
                     FROM class_enrollments ce
                     WHERE ${whereClause}
                `, params),

                // Event statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_events,
                     SUM(CASE WHEN er.status = 'attended' THEN 1 ELSE 0 END) as attended_events
                     FROM event_registrations er
                     WHERE ${whereClause}
                `, params),

                // Attendance statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_sessions,
                     SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                     SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                     SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                     ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
                     FROM attendance
                     WHERE ${whereClause}
                `, params),

                // Payment statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_payments,
                     SUM(amount) as total_spent,
                     SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
                     FROM payments
                     WHERE ${whereClause}
                `, params),

                // Recent activity
                db.query(`
                    SELECT action, table_name, created_at
                    FROM audit_logs
                    WHERE ${whereClause}
                    ORDER BY created_at DESC
                    LIMIT 10
                `, params)
            ]);

            return {
                classes: classStats[0] || {},
                events: eventStats[0] || {},
                attendance: attendanceStats[0] || {},
                payments: paymentStats[0] || {},
                recent_activity: activityLog
            };
        }, CacheTTL.MEDIUM);
    }

    // Get class analytics
    async getClassAnalytics(classId, options = {}) {
        const cacheKey = `analytics:class:${classId}`;
        
        return await cacheService.wrap(cacheKey, async () => {
            const [
                enrollmentStats,
                attendanceStats,
                studentPerformance,
                revenueStats
            ] = await Promise.all([
                // Enrollment statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_enrollments,
                     SUM(CASE WHEN status = 'enrolled' THEN 1 ELSE 0 END) as active_students,
                     SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_students,
                     SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped_students
                     FROM class_enrollments
                     WHERE class_id = ?
                `, [classId]),

                // Attendance statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_sessions,
                     COUNT(DISTINCT date) as unique_dates,
                     COUNT(DISTINCT user_id) as unique_students,
                     SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
                     ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
                     FROM attendance
                     WHERE class_id = ?
                `, [classId]),

                // Student performance
                db.query(`
                    SELECT 
                     u.id, u.first_name, u.last_name,
                     COUNT(*) as total_sessions,
                     SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_sessions,
                     ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
                     FROM attendance a
                     JOIN users u ON a.user_id = u.id
                     WHERE a.class_id = ?
                     GROUP BY u.id, u.first_name, u.last_name
                     ORDER BY attendance_rate DESC
                     LIMIT 10
                `, [classId]),

                // Revenue statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_payments,
                     SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
                     SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_revenue
                     FROM payments p
                     JOIN class_enrollments ce ON p.reference_id = ce.id
                     WHERE ce.class_id = ? AND p.reference_type = 'class_enrollment'
                `, [classId])
            ]);

            return {
                enrollment: enrollmentStats[0] || {},
                attendance: attendanceStats[0] || {},
                top_students: studentPerformance,
                revenue: revenueStats[0] || {}
            };
        }, CacheTTL.MEDIUM);
    }

    // Get event analytics
    async getEventAnalytics(eventId) {
        const cacheKey = `analytics:event:${eventId}`;
        
        return await cacheService.wrap(cacheKey, async () => {
            const [
                registrationStats,
                participantStats,
                revenueStats
            ] = await Promise.all([
                // Registration statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_registrations,
                     SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registered,
                     SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                     SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) as attended,
                     SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                     FROM event_registrations
                     WHERE event_id = ?
                `, [eventId]),

                // Participant demographics
                db.query(`
                    SELECT 
                     u.role,
                     u.belt_level,
                     COUNT(*) as count
                     FROM event_registrations er
                     JOIN users u ON er.user_id = u.id
                     WHERE er.event_id = ?
                     GROUP BY u.role, u.belt_level
                `, [eventId]),

                // Revenue statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_payments,
                     SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
                     SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_revenue
                     FROM payments p
                     JOIN event_registrations er ON p.reference_id = er.id
                     WHERE er.event_id = ? AND p.reference_type = 'event_registration'
                `, [eventId])
            ]);

            return {
                registration: registrationStats[0] || {},
                participants: participantStats,
                revenue: revenueStats[0] || {}
            };
        }, CacheTTL.MEDIUM);
    }

    // Get system analytics
    async getSystemAnalytics(options = {}) {
        const cacheKey = 'analytics:system';
        
        return await cacheService.wrap(cacheKey, async () => {
            const { period = '30d' } = options;
            
            let dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
            switch (period) {
                case '7d': dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)'; break;
                case '30d': dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)'; break;
                case '90d': dateFilter = 'DATE_SUB(NOW(), INTERVAL 90 DAY)'; break;
                case '1y': dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)'; break;
            }

            const [
                userGrowth,
                classStats,
                eventStats,
                attendanceStats,
                revenueStats,
                activeUsers
            ] = await Promise.all([
                // User growth
                db.query(`
                    SELECT 
                     CAST(created_at AS DATE) as date,
                     COUNT(*) as new_users,
                     SUM(COUNT(*)) OVER (ORDER BY CAST(created_at AS DATE)) as cumulative_users
                     FROM users
                     WHERE created_at >= ${dateFilter}
                     GROUP BY CAST(created_at AS DATE)
                     ORDER BY date
                `),

                // Class statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_classes,
                     SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_classes,
                     SUM(current_students) as total_students,
                     AVG(current_students) as avg_students_per_class
                     FROM classes
                `),

                // Event statistics
                db.query(`
                    SELECT 
                     COUNT(*) as total_events,
                     SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as upcoming_events,
                     SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_events,
                     SUM(current_participants) as total_participants
                     FROM events
                     WHERE start_date >= ${dateFilter}
                `),

                // Attendance trends
                db.query(`
                    SELECT 
                     DATE(date) as date,
                     COUNT(*) as total_sessions,
                     SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                     ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
                     FROM attendance
                     WHERE date >= ${dateFilter}
                     GROUP BY DATE(date)
                     ORDER BY date
                `),

                // Revenue statistics
                db.query(`
                    SELECT 
                     CAST(created_at AS DATE) as date,
                     COUNT(*) as payment_count,
                     SUM(amount) as total_amount,
                     SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
                     FROM payments
                     WHERE created_at >= ${dateFilter}
                     GROUP BY CAST(created_at AS DATE)
                     ORDER BY date
                `),

                // Active users
                db.query(`
                    SELECT 
                     COUNT(DISTINCT user_id) as active_users
                     FROM audit_logs
                     WHERE created_at >= ${dateFilter}
                `)
            ]);

            return {
                user_growth: userGrowth,
                class_stats: classStats[0] || {},
                event_stats: eventStats[0] || {},
                attendance_trends: attendanceStats,
                revenue_trends: revenueStats,
                active_users: activeUsers[0]?.active_users || 0
            };
        }, CacheTTL.LONG);
    }

    // Get real-time metrics
    getRealTimeMetrics() {
        const metrics = {};
        
        this.metrics.forEach((events, eventName) => {
            const recentEvents = events.filter(e => 
                Date.now() - e.timestamp < 60000 // Last minute
            );
            
            metrics[eventName] = {
                count: recentEvents.length,
                lastEvent: recentEvents[recentEvents.length - 1]
            };
        });

        return metrics;
    }

    // Get popular classes
    async getPopularClasses(limit = 10) {
        return await db.query(`
            SELECT 
             c.id, c.name, c.level,
             COUNT(ce.id) as enrollment_count,
             AVG(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100 as avg_attendance_rate
             FROM classes c
             LEFT JOIN class_enrollments ce ON c.id = ce.class_id
             LEFT JOIN attendance a ON c.id = a.class_id
             WHERE c.status = 'active'
             GROUP BY c.id, c.name, c.level
             ORDER BY enrollment_count DESC, avg_attendance_rate DESC
             LIMIT ?
        `, [limit]);
    }

    // Get popular events
    async getPopularEvents(limit = 10) {
        return await db.query(`
            SELECT 
             e.id, e.title, e.type,
             COUNT(er.id) as registration_count,
             SUM(CASE WHEN er.status = 'attended' THEN 1 ELSE 0 END) as attendance_count
             FROM events e
             LEFT JOIN event_registrations er ON e.id = er.event_id
             WHERE e.status IN ('scheduled', 'completed')
             GROUP BY e.id, e.title, e.type
             ORDER BY registration_count DESC
             LIMIT ?
        `, [limit]);
    }

    // Get retention rate
    async getRetentionRate(period = '30d') {
        let dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
        switch (period) {
            case '7d': dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)'; break;
            case '30d': dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)'; break;
            case '90d': dateFilter = 'DATE_SUB(NOW(), INTERVAL 90 DAY)'; break;
        }

        const result = await db.query(`
            SELECT 
             COUNT(DISTINCT CASE WHEN created_at < ${dateFilter} THEN id END) as old_users,
             COUNT(DISTINCT CASE WHEN created_at < ${dateFilter} AND last_login_at >= ${dateFilter} THEN id END) as retained_users
             FROM users
        `);

        const data = result[0];
        const retentionRate = data.old_users > 0 
            ? (data.retained_users / data.old_users * 100).toFixed(2)
            : 0;

        return {
            old_users: data.old_users,
            retained_users: data.retained_users,
            retention_rate: `${retentionRate}%`
        };
    }

    // Clear analytics cache
    clearCache() {
        const deletedCount = cacheService.deletePattern('analytics:');
        console.log(`✅ Cleared ${deletedCount} analytics cache entries`);
        return deletedCount;
    }

    // Export analytics data
    async exportAnalytics(options = {}) {
        const { type = 'system', id = null, format = 'json' } = options;

        let data;
        switch (type) {
            case 'user':
                data = await this.getUserAnalytics(id);
                break;
            case 'class':
                data = await this.getClassAnalytics(id);
                break;
            case 'event':
                data = await this.getEventAnalytics(id);
                break;
            case 'system':
            default:
                data = await this.getSystemAnalytics();
                break;
        }

        return {
            type,
            id,
            data,
            exported_at: new Date().toISOString()
        };
    }
}

// Create and export analytics service instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;