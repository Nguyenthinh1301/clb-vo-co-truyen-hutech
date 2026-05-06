require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
process.env.RESEND_API_KEY = process.argv[2] || process.env.RESEND_API_KEY;

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.log('Testing Resend API key...');
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['vctht2026@gmail.com'],
            subject: 'Test Resend - CLB Vo Co Truyen HUTECH',
            html: '<h2>Test email qua Resend API</h2><p>Email service hoat dong binh thuong tren Render!</p>'
        });
        if (error) {
            console.error('Resend error:', JSON.stringify(error));
        } else {
            console.log('SUCCESS! Email id:', data.id);
        }
    } catch(e) {
        console.error('Exception:', e.message);
    }
}
test();
