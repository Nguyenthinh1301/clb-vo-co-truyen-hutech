/**
 * Test email service trên production
 * Chạy: node scripts/test-email.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const emailService = require('../services/emailService');

async function testEmail() {
    console.log('=== Email Service Test ===\n');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0,4)}****` : 'NOT SET');
    console.log('Initialized:', emailService.initialized);
    console.log('');

    // Verify connection
    console.log('Verifying SMTP connection...');
    const verify = await emailService.verify();
    console.log('Verify result:', verify);
    console.log('');

    if (!verify.success) {
        console.log('❌ SMTP connection failed — email will not work');
        console.log('Fix: Create new Gmail App Password at https://myaccount.google.com/apppasswords');
        process.exit(1);
    }

    // Test send
    console.log('Sending test email...');
    const result = await emailService.sendEmail({
        to: process.env.SMTP_USER, // gửi về chính mình để test
        subject: 'Test Email - CLB VCT HUTECH',
        html: '<h2>Test email từ hệ thống CLB Võ Cổ Truyền HUTECH</h2><p>Email service đang hoạt động bình thường.</p>'
    });
    console.log('Send result:', result);

    process.exit(result.success ? 0 : 1);
}

testEmail().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
