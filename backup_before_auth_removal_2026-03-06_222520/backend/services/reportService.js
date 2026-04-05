/**
 * Report Service
 * Generate various reports and analytics
 */

const db = require('../config/db');
const logger = require('./loggerService');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportService {
  /**
   * Generate user activity report
   */
  static async generateUserActivityReport(startDate, endDate) {
    try {
      const [users] = await db.query(`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.role,
          COUNT(DISTINCT ce.class_id) as enrolled_classes,
          COUNT(DISTINCT er.event_id) as registered_events,
          COUNT(DISTINCT a.id) as attendance_count,
          u.created_at,
          u.last_login
        FROM users u
        LEFT JOIN class_enrollments ce ON u.id = ce.user_id
        LEFT JOIN event_registrations er ON u.id = er.user_id
        LEFT JOIN attendance a ON u.id = a.user_id
          AND a.date BETWEEN ? AND ?
        WHERE u.created_at BETWEEN ? AND ?
        GROUP BY u.id
        ORDER BY attendance_count DESC
      `, [startDate, endDate, startDate, endDate]);

      return {
        period: { startDate, endDate },
        totalUsers: users.length,
        users: users,
        summary: {
          totalEnrollments: users.reduce((sum, u) => sum + u.enrolled_classes, 0),
          totalEventRegistrations: users.reduce((sum, u) => sum + u.registered_events, 0),
          totalAttendance: users.reduce((sum, u) => sum + u.attendance_count, 0)
        }
      };
    } catch (error) {
      logger.error('Error generating user activity report:', error);
      throw error;
    }
  }

  /**
   * Generate class performance report
   */
  static async generateClassPerformanceReport(startDate, endDate) {
    try {
      const [classes] = await db.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.schedule,
          c.max_students,
          COUNT(DISTINCT ce.user_id) as enrolled_students,
          COUNT(DISTINCT a.id) as total_attendance,
          AVG(a.status = 'present') * 100 as attendance_rate,
          c.created_at
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id
        LEFT JOIN attendance a ON c.id = a.class_id
          AND a.date BETWEEN ? AND ?
        WHERE c.created_at <= ?
        GROUP BY c.id
        ORDER BY attendance_rate DESC
      `, [startDate, endDate, endDate]);

      return {
        period: { startDate, endDate },
        totalClasses: classes.length,
        classes: classes,
        summary: {
          totalEnrollments: classes.reduce((sum, c) => sum + c.enrolled_students, 0),
          averageAttendanceRate: classes.reduce((sum, c) => sum + (c.attendance_rate || 0), 0) / classes.length,
          totalCapacity: classes.reduce((sum, c) => sum + c.max_students, 0)
        }
      };
    } catch (error) {
      logger.error('Error generating class performance report:', error);
      throw error;
    }
  }

  /**
   * Generate financial report
   */
  static async generateFinancialReport(startDate, endDate) {
    try {
      const [payments] = await db.query(`
        SELECT 
          p.id,
          p.user_id,
          u.full_name,
          p.amount,
          p.type,
          p.status,
          p.payment_method,
          p.created_at
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.created_at BETWEEN ? AND ?
        ORDER BY p.created_at DESC
      `, [startDate, endDate]);

      const summary = {
        totalRevenue: 0,
        totalPending: 0,
        totalCompleted: 0,
        totalFailed: 0,
        byType: {},
        byMethod: {}
      };

      payments.forEach(payment => {
        if (payment.status === 'completed') {
          summary.totalCompleted += payment.amount;
          summary.totalRevenue += payment.amount;
        } else if (payment.status === 'pending') {
          summary.totalPending += payment.amount;
        } else if (payment.status === 'failed') {
          summary.totalFailed += payment.amount;
        }

        // By type
        if (!summary.byType[payment.type]) {
          summary.byType[payment.type] = 0;
        }
        summary.byType[payment.type] += payment.amount;

        // By method
        if (!summary.byMethod[payment.payment_method]) {
          summary.byMethod[payment.payment_method] = 0;
        }
        summary.byMethod[payment.payment_method] += payment.amount;
      });

      return {
        period: { startDate, endDate },
        totalTransactions: payments.length,
        payments: payments,
        summary: summary
      };
    } catch (error) {
      logger.error('Error generating financial report:', error);
      throw error;
    }
  }

  /**
   * Generate attendance report
   */
  static async generateAttendanceReport(classId, startDate, endDate) {
    try {
      const [attendance] = await db.query(`
        SELECT 
          a.id,
          a.date,
          a.status,
          u.id as user_id,
          u.full_name,
          u.email,
          c.name as class_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN classes c ON a.class_id = c.id
        WHERE a.class_id = ?
          AND a.date BETWEEN ? AND ?
        ORDER BY a.date DESC, u.full_name
      `, [classId, startDate, endDate]);

      const summary = {
        totalRecords: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        excused: attendance.filter(a => a.status === 'excused').length
      };

      summary.attendanceRate = summary.totalRecords > 0 
        ? (summary.present / summary.totalRecords * 100).toFixed(2)
        : 0;

      return {
        classId,
        period: { startDate, endDate },
        attendance: attendance,
        summary: summary
      };
    } catch (error) {
      logger.error('Error generating attendance report:', error);
      throw error;
    }
  }

  /**
   * Export report to Excel
   */
  static async exportToExcel(reportData, filename) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Add title
      worksheet.addRow([`Report: ${reportData.title || 'Data Report'}`]);
      worksheet.addRow([`Period: ${reportData.period?.startDate} to ${reportData.period?.endDate}`]);
      worksheet.addRow([]);

      // Add headers
      if (reportData.data && reportData.data.length > 0) {
        const headers = Object.keys(reportData.data[0]);
        worksheet.addRow(headers);

        // Add data
        reportData.data.forEach(row => {
          worksheet.addRow(Object.values(row));
        });

        // Style headers
        const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      // Save file
      const filepath = path.join(__dirname, '../uploads/reports', filename);
      await workbook.xlsx.writeFile(filepath);

      return filepath;
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Export report to PDF
   */
  static async exportToPDF(reportData, filename) {
    try {
      const filepath = path.join(__dirname, '../uploads/reports', filename);
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text(reportData.title || 'Data Report', { align: 'center' });
      doc.moveDown();

      // Add period
      if (reportData.period) {
        doc.fontSize(12).text(`Period: ${reportData.period.startDate} to ${reportData.period.endDate}`);
        doc.moveDown();
      }

      // Add summary
      if (reportData.summary) {
        doc.fontSize(14).text('Summary:', { underline: true });
        doc.fontSize(10);
        Object.entries(reportData.summary).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
        doc.moveDown();
      }

      // Add data table (simplified)
      if (reportData.data && reportData.data.length > 0) {
        doc.fontSize(14).text('Data:', { underline: true });
        doc.fontSize(8);
        
        reportData.data.slice(0, 50).forEach((row, index) => {
          doc.text(`${index + 1}. ${JSON.stringify(row)}`);
        });

        if (reportData.data.length > 50) {
          doc.text(`... and ${reportData.data.length - 50} more records`);
        }
      }

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Generate dashboard statistics
   */
  static async generateDashboardStats() {
    try {
      const [userStats] = await db.query(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
          SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN DATE(last_login) = CURDATE() THEN 1 ELSE 0 END) as active_today
        FROM users
      `);

      const [classStats] = await db.query(`
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_classes,
          COUNT(DISTINCT ce.user_id) as total_enrollments
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id
      `);

      const [eventStats] = await db.query(`
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN date >= CURDATE() THEN 1 ELSE 0 END) as upcoming_events,
          COUNT(DISTINCT er.user_id) as total_registrations
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
      `);

      const [paymentStats] = await db.query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
        FROM payments
        WHERE MONTH(created_at) = MONTH(CURDATE())
      `);

      return {
        users: userStats[0],
        classes: classStats[0],
        events: eventStats[0],
        payments: paymentStats[0],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating dashboard stats:', error);
      throw error;
    }
  }
}

module.exports = ReportService;
