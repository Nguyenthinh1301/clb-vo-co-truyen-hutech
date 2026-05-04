/**
 * Notification Service
 * Xử lý gửi thông báo tự động
 */

const db = require('../config/db');

class NotificationService {
    /**
     * Gửi thông báo đến tất cả admin
     */
    static async notifyAdmins(type, priority, title, message, metadata = {}) {
        try {
            // Validate and convert type to allowed values
            const validTypes = ['info', 'success', 'warning', 'error'];
            let notificationType = 'info'; // default
            
            if (validTypes.includes(type)) {
                notificationType = type;
            } else {
                // Map other types to valid ones
                const typeMap = {
                    'system': 'info',
                    'class': 'info',
                    'event': 'info',
                    'general': 'info'
                };
                notificationType = typeMap[type] || 'info';
            }
            
            // Get all admin users
            const admins = await db.query(
                'SELECT id FROM users WHERE role = ? AND is_active = true',
                ['admin']
            );
            
            if (!admins || admins.length === 0) {
                console.log('No admin users found to notify');
                return { success: false, message: 'No admins found' };
            }
            
            // Create notification for each admin
            const notificationPromises = admins.map(admin => {
                const notificationData = {
                    user_id: admin.id,
                    type: notificationType,
                    title: title,
                    message: message,
                    is_read: false
                };
                
                return db.insert('notifications', notificationData);
            });
            
            await Promise.all(notificationPromises);
            
            console.log(`Sent notification to ${admins.length} admin(s): ${title}`);
            
            return {
                success: true,
                recipientCount: admins.length
            };
            
        } catch (error) {
            console.error('Error notifying admins:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Thông báo khi có user mới đăng ký
     */
    static async notifyNewUserRegistration(user) {
        try {
            const title = '🎉 Thành viên mới đăng ký';
            const message = `${user.full_name || user.email} vừa đăng ký tài khoản mới.\n\n` +
                           `📧 Email: ${user.email}\n` +
                           `👤 Tên: ${user.first_name} ${user.last_name}\n` +
                           `📱 SĐT: ${user.phone_number || 'Chưa cập nhật'}\n` +
                           `📅 Ngày đăng ký: ${new Date().toLocaleString('vi-VN')}\n\n` +
                           `Vui lòng kiểm tra và phân công lớp học cho thành viên mới.`;
            
            return await this.notifyAdmins(
                'system',
                'high',
                title,
                message,
                {
                    userId: user.id,
                    email: user.email,
                    action: 'new_registration'
                }
            );
        } catch (error) {
            console.error('Error in notifyNewUserRegistration:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Thông báo khi user đăng ký lớp học
     */
    static async notifyClassEnrollment(user, classInfo) {
        const title = '📚 Đăng ký lớp học mới';
        const message = `${user.full_name || user.email} đã đăng ký lớp "${classInfo.name}".\n\n` +
                       `👤 Thành viên: ${user.full_name}\n` +
                       `📧 Email: ${user.email}\n` +
                       `📚 Lớp học: ${classInfo.name}\n` +
                       `📅 Thời gian: ${new Date().toLocaleString('vi-VN')}`;
        
        return await this.notifyAdmins(
            'class',
            'normal',
            title,
            message,
            {
                userId: user.id,
                classId: classInfo.id,
                action: 'class_enrollment'
            }
        );
    }
    
    /**
     * Thông báo khi user đăng ký sự kiện
     */
    static async notifyEventRegistration(user, eventInfo) {
        const title = '🎪 Đăng ký sự kiện mới';
        const message = `${user.full_name || user.email} đã đăng ký tham gia sự kiện "${eventInfo.name}".\n\n` +
                       `👤 Thành viên: ${user.full_name}\n` +
                       `📧 Email: ${user.email}\n` +
                       `🎪 Sự kiện: ${eventInfo.name}\n` +
                       `📅 Thời gian: ${new Date().toLocaleString('vi-VN')}`;
        
        return await this.notifyAdmins(
            'event',
            'normal',
            title,
            message,
            {
                userId: user.id,
                eventId: eventInfo.id,
                action: 'event_registration'
            }
        );
    }
    
    /**
     * Thông báo khi có liên hệ mới
     */
    static async notifyNewContact(contactInfo) {
        const title = '📬 Tin nhắn liên hệ mới';
        const message = `Có tin nhắn liên hệ mới từ ${contactInfo.name}.\n\n` +
                       `👤 Tên: ${contactInfo.name}\n` +
                       `📧 Email: ${contactInfo.email}\n` +
                       `📱 SĐT: ${contactInfo.phone || 'Không có'}\n` +
                       `💬 Nội dung: ${contactInfo.message}\n` +
                       `📅 Thời gian: ${new Date().toLocaleString('vi-VN')}`;
        
        return await this.notifyAdmins(
            'system',
            'normal',
            title,
            message,
            {
                contactId: contactInfo.id,
                action: 'new_contact'
            }
        );
    }
    
    /**
     * Thông báo khi user cập nhật profile
     */
    static async notifyProfileUpdate(user, changes) {
        const title = '✏️ Cập nhật thông tin thành viên';
        const message = `${user.full_name || user.email} đã cập nhật thông tin cá nhân.\n\n` +
                       `👤 Thành viên: ${user.full_name}\n` +
                       `📧 Email: ${user.email}\n` +
                       `📝 Thay đổi: ${changes}\n` +
                       `📅 Thời gian: ${new Date().toLocaleString('vi-VN')}`;
        
        return await this.notifyAdmins(
            'system',
            'low',
            title,
            message,
            {
                userId: user.id,
                action: 'profile_update'
            }
        );
    }
    
    /**
     * Gửi thông báo đến user cụ thể
     */
    static async notifyUser(userId, type, priority, title, message, metadata = {}) {
        try {
            // Validate and convert type to allowed values
            const validTypes = ['info', 'success', 'warning', 'error'];
            let notificationType = 'info'; // default
            
            if (validTypes.includes(type)) {
                notificationType = type;
            } else {
                // Map other types to valid ones
                const typeMap = {
                    'system': 'info',
                    'class': 'info',
                    'event': 'info',
                    'general': 'info'
                };
                notificationType = typeMap[type] || 'info';
            }
            
            const notificationData = {
                user_id: userId,
                type: notificationType,
                title: title,
                message: message,
                is_read: false
            };
            
            await db.insert('notifications', notificationData);
            
            return { success: true };
            
        } catch (error) {
            console.error('Error notifying user:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Thông báo chào mừng user mới
     */
    static async sendWelcomeNotification(userId, userName) {
        try {
            const title = '🎉 Chào mừng bạn đến với CLB Võ Cổ Truyền HUTECH!';
            const message = `Xin chào ${userName}!\n\n` +
                           `Cảm ơn bạn đã đăng ký tham gia CLB Võ Cổ Truyền HUTECH. ` +
                           `Chúng tôi rất vui mừng được chào đón bạn!\n\n` +
                           `📚 Bạn có thể xem danh sách lớp học và đăng ký tham gia.\n` +
                           `🎪 Theo dõi các sự kiện và hoạt động của CLB.\n` +
                           `📱 Cập nhật thông tin cá nhân trong phần Hồ sơ.\n\n` +
                           `Chúc bạn có trải nghiệm tuyệt vời! 🥋`;
            
            return await this.notifyUser(
                userId,
                'system',
                'normal',
                title,
                message,
                { action: 'welcome' }
            );
        } catch (error) {
            console.error('Error in sendWelcomeNotification:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Thông báo khi được phân công lớp
     */
    static async notifyClassAssignment(userId, classInfo) {
        const title = '📚 Bạn đã được phân công vào lớp học';
        const message = `Chúc mừng! Bạn đã được phân công vào lớp "${classInfo.name}".\n\n` +
                       `📚 Lớp học: ${classInfo.name}\n` +
                       `👨‍🏫 Giảng viên: ${classInfo.instructor_name || 'Đang cập nhật'}\n` +
                       `📅 Lịch học: ${classInfo.schedule || 'Đang cập nhật'}\n` +
                       `📍 Địa điểm: ${classInfo.location || 'Đang cập nhật'}\n\n` +
                       `Vui lòng kiểm tra lịch học và tham gia đầy đủ. Chúc bạn học tập tốt! 🥋`;
        
        return await this.notifyUser(
            userId,
            'class',
            'high',
            title,
            message,
            {
                classId: classInfo.id,
                action: 'class_assignment'
            }
        );
    }
}

module.exports = NotificationService;
