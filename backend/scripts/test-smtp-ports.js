/**
 * Test SMTP connectivity từ Render server
 * Chạy trên production để kiểm tra port nào hoạt động
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const net = require('net');
const nodemailer = require('nodemailer');

async function testPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, host);
    });
}

async function main() {
    console.log('Testing SMTP ports from this server...\n');

    const tests = [
        { host: 'smtp.gmail.com', port: 587 },
        { host: 'smtp.gmail.com', port: 465 },
        { host: 'smtp.gmail.com', port: 25 },
        { host: 'smtp-relay.brevo.com', port: 587 },
        { host: 'smtp-relay.brevo.com', port: 465 },
    ];

    for (const t of tests) {
        const ok = await testPort(t.host, t.port);
        console.log(`${ok ? '✅' : '❌'} ${t.host}:${t.port}`);
    }

    // Test actual send với port 587
    console.log('\nTesting actual Gmail send (port 587)...');
    const t587 = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 8000, socketTimeout: 10000
    });
    try {
        await t587.verify();
        console.log('✅ Gmail port 587: WORKS');
    } catch(e) {
        console.log('❌ Gmail port 587:', e.message);
    }

    // Test port 465
    console.log('Testing actual Gmail send (port 465)...');
    const t465 = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 8000, socketTimeout: 10000
    });
    try {
        await t465.verify();
        console.log('✅ Gmail port 465: WORKS');
    } catch(e) {
        console.log('❌ Gmail port 465:', e.message);
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
