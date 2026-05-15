const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.resend = null;
        this.initialized = false;
        this.mode = null; // 'resend' | 'smtp'
        this.init();
    }

    // Initialize email service
    init() {
        const resendKey = process.env.RESEND_API_KEY;
        const smtpPass  = process.env.SMTP_PASS;
        const smtpUser  = process.env.SMTP_USER;

        // Ưu tiên Resend (HTTP API — hoạt động trên Render free tier)
        if (resendKey && !resendKey.startsWith('<')) {
            try {
                const { Resend } = require('resend');
                this.resend = new Resend(resendKey);
                this.initialized = true;
                this.mode = 'resend';
                console.log('✅ Email service initialized (Resend HTTP API)');
                return;
            } catch(e) {
                console.warn('⚠️  Resend init failed:', e.message);
            }
        }

        // Fallback: SMTP (nodemailer)
        if (!smtpPass || !smtpUser || smtpPass.startsWith('<')) {
            console.warn('⚠️  Email service: không có RESEND_API_KEY và SMTP chưa cấu hình — email bị bỏ qua');
            return;
        }

        try {
            const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
            // Gmail: port 587 dùng STARTTLS (secure=false), port 465 dùng SSL (secure=true)
            // Luôn dùng 587+STARTTLS để tránh lỗi SSL handshake
            const smtpPort = 587;
            const smtpSecure = false;

            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: { user: smtpUser, pass: smtpPass },
                tls: { rejectUnauthorized: false },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000
            });
            this.initialized = true;
            this.mode = 'smtp';
            console.log(`✅ Email service initialized (SMTP ${smtpHost}:${smtpPort})`);
        } catch (error) {
            console.error('❌ Email service initialization failed:', error.message);
        }
    }

    // Verify email configuration
    async verify() {
        if (!this.initialized) {
            return { success: false, message: 'Email service not initialized' };
        }
        if (this.mode === 'resend') {
            return { success: true, message: 'Resend API ready' };
        }
        try {
            await this.transporter.verify();
            return { success: true, message: 'SMTP ready' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Send email
    async sendEmail({ to, subject, html, text, attachments = [] }) {
        if (!this.initialized) {
            console.warn('Email service not initialized, skipping email send');
            return { success: false, message: 'Email service not initialized' };
        }

        // ── Resend HTTP API ──────────────────────────────────
        if (this.mode === 'resend') {
            try {
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const fromName  = process.env.FROM_NAME || 'CLB Võ Cổ Truyền HUTECH';
                const { data, error } = await this.resend.emails.send({
                    from: `${fromName} <${fromEmail}>`,
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    html,
                    text: text || this.stripHtml(html)
                });
                if (error) {
                    console.error('❌ Resend error:', error);
                    return { success: false, message: error.message };
                }
                console.log('✅ Email sent via Resend:', data?.id);
                return { success: true, messageId: data?.id, message: 'Email sent via Resend' };
            } catch (error) {
                console.error('❌ Resend send failed:', error.message);
                return { success: false, message: error.message };
            }
        }

        // ── SMTP (nodemailer) ────────────────────────────────
        try {
            const mailOptions = {
                from: `${process.env.FROM_NAME || 'CLB Võ Cổ Truyền HUTECH'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
                to,
                subject,
                html,
                text: text || this.stripHtml(html),
                attachments
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent via SMTP:', info.messageId);
            return { success: true, messageId: info.messageId, message: 'Email sent via SMTP' };
        } catch (error) {
            console.error('❌ SMTP send failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    // Welcome email for new users
    async sendWelcomeEmail(user) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🥋 Chào mừng đến với CLB Võ Cổ Truyền HUTECH!</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        
                        <p>Chúc mừng bạn đã đăng ký thành công tài khoản tại CLB Võ Cổ Truyền HUTECH!</p>
                        
                        <p><strong>Thông tin tài khoản:</strong></p>
                        <ul>
                            <li>Email: ${user.email}</li>
                            <li>Username: ${user.username}</li>
                            <li>Vai trò: ${this.getRoleDisplayName(user.role)}</li>
                        </ul>
                        
                        <p>Bạn có thể đăng nhập và bắt đầu khám phá các lớp học, sự kiện và nhiều hoạt động thú vị khác của CLB.</p>
                        
                        <center>
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Đăng nhập ngay</a>
                        </center>
                        
                        <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
                        
                        <p>Trân trọng,<br><strong>Ban Quản Lý CLB Võ Cổ Truyền HUTECH</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 CLB Võ Cổ Truyền HUTECH. All rights reserved.</p>
                        <p>475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: 'Chào mừng đến với CLB Võ Cổ Truyền HUTECH',
            html
        });
    }

    // Password reset email
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Đặt lại mật khẩu</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        
                        <center>
                            <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
                        </center>
                        
                        <p>Hoặc copy link sau vào trình duyệt:</p>
                        <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">${resetUrl}</p>
                        
                        <div class="warning">
                            <strong>⚠️ Lưu ý:</strong>
                            <ul>
                                <li>Link này chỉ có hiệu lực trong 1 giờ</li>
                                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                                <li>Không chia sẻ link này với bất kỳ ai</li>
                            </ul>
                        </div>
                        
                        <p>Trân trọng,<br><strong>Ban Quản Lý CLB Võ Cổ Truyền HUTECH</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 CLB Võ Cổ Truyền HUTECH. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: 'Đặt lại mật khẩu - CLB Võ Cổ Truyền HUTECH',
            html
        });
    }

    // Email verification
    async sendVerificationEmail(user, verificationToken) {
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✉️ Xác thực email</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        
                        <p>Vui lòng xác thực địa chỉ email của bạn để hoàn tất đăng ký.</p>
                        
                        <center>
                            <a href="${verifyUrl}" class="button">Xác thực email</a>
                        </center>
                        
                        <p>Hoặc copy link sau vào trình duyệt:</p>
                        <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">${verifyUrl}</p>
                        
                        <p>Link xác thực có hiệu lực trong 24 giờ.</p>
                        
                        <p>Trân trọng,<br><strong>Ban Quản Lý CLB Võ Cổ Truyền HUTECH</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 CLB Võ Cổ Truyền HUTECH. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: 'Xác thực email - CLB Võ Cổ Truyền HUTECH',
            html
        });
    }

    // Class enrollment confirmation
    async sendClassEnrollmentEmail(user, classInfo) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3498db; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .class-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📚 Đăng ký lớp học thành công!</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        
                        <p>Bạn đã đăng ký thành công lớp học:</p>
                        
                        <div class="class-info">
                            <h3>${classInfo.name}</h3>
                            <p><strong>Lịch học:</strong> ${classInfo.schedule}</p>
                            <p><strong>Cấp độ:</strong> ${this.getLevelDisplayName(classInfo.level)}</p>
                            <p><strong>Học phí:</strong> ${this.formatCurrency(classInfo.fee)}</p>
                            <p><strong>Địa điểm:</strong> ${classInfo.location || 'Phòng tập CLB'}</p>
                        </div>
                        
                        <p>Vui lòng chuẩn bị đầy đủ trang phục và dụng cụ tập luyện. Đến đúng giờ để không bỏ lỡ buổi học.</p>
                        
                        <p>Chúc bạn có những buổi tập luyện hiệu quả!</p>
                        
                        <p>Trân trọng,<br><strong>Ban Quản Lý CLB Võ Cổ Truyền HUTECH</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 CLB Võ Cổ Truyền HUTECH. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: `Xác nhận đăng ký lớp học: ${classInfo.name}`,
            html
        });
    }

    // Event registration confirmation
    async sendEventRegistrationEmail(user, eventInfo) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #9b59b6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .event-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Đăng ký sự kiện thành công!</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        
                        <p>Bạn đã đăng ký thành công sự kiện:</p>
                        
                        <div class="event-info">
                            <h3>${eventInfo.title}</h3>
                            <p><strong>Ngày:</strong> ${this.formatDate(eventInfo.start_date)}</p>
                            <p><strong>Thời gian:</strong> ${eventInfo.start_time} - ${eventInfo.end_time}</p>
                            <p><strong>Địa điểm:</strong> ${eventInfo.location || 'Sẽ thông báo sau'}</p>
                            ${eventInfo.registration_fee > 0 ? `<p><strong>Phí tham gia:</strong> ${this.formatCurrency(eventInfo.registration_fee)}</p>` : ''}
                        </div>
                        
                        <p>Chúng tôi rất mong được gặp bạn tại sự kiện!</p>
                        
                        <p>Trân trọng,<br><strong>Ban Quản Lý CLB Võ Cổ Truyền HUTECH</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 CLB Võ Cổ Truyền HUTECH. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: user.email,
            subject: `Xác nhận đăng ký sự kiện: ${eventInfo.title}`,
            html
        });
    }

    // Contact form reply
    async sendContactReply(contactMessage, replyMessage) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #16a085; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .original-message { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
                    .reply-message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💬 Phản hồi từ CLB Võ Cổ Truyền HUTECH</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${contactMessage.name}</strong>,</p>
                        
                        <p>Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi của chúng tôi:</p>
                        
                        <div class="reply-message">
                            ${replyMessage}
                        </div>
                        
                        <div class="original-message">
                            <strong>Tin nhắn gốc của bạn:</strong>
                            <p><strong>Chủ đề:</strong> ${contactMessage.subject}</p>
                            <p>${contactMessage.message}</p>
                        </div>
                        
                        <p>Nếu bạn có thêm câu hỏi, đừng ngần ngại liên hệ lại với chúng tôi.</p>
                        
                        <p>Trân trọng,<br><strong>Ban Quản Lý CLB Võ Cổ Truyền HUTECH</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 CLB Võ Cổ Truyền HUTECH. All rights reserved.</p>
                        <p>Email: voco@hutech.edu.vn | Phone: 028 5445 7777</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: contactMessage.email,
            subject: `Re: ${contactMessage.subject}`,
            html
        });
    }

    // Utility functions
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '');
    }

    getRoleDisplayName(role) {
        const roles = {
            admin: 'Quản trị viên',
            instructor: 'Huấn luyện viên',
            student: 'Học viên',
            member: 'Thành viên'
        };
        return roles[role] || role;
    }

    getLevelDisplayName(level) {
        const levels = {
            beginner: 'Sơ cấp',
            intermediate: 'Trung cấp',
            advanced: 'Nâng cao',
            expert: 'Chuyên nghiệp'
        };
        return levels[level] || level;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create and export email service instance
const emailService = new EmailService();

module.exports = emailService;