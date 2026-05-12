/**
 * Keep-alive script cho Render free tier
 * Ping server mỗi 14 phút để tránh sleep
 * Chạy: node scripts/keep-alive.js
 * 
 * Hoặc dùng cron job / UptimeRobot (miễn phí) để ping tự động
 */

const https = require('https');
const HEALTH_URL = 'https://clb-vo-co-truyen-hutech.onrender.com/health';
const INTERVAL_MS = 14 * 60 * 1000; // 14 phút

function ping() {
    const start = Date.now();
    https.get(HEALTH_URL, (res) => {
        const ms = Date.now() - start;
        console.log(`[${new Date().toISOString()}] Ping OK: ${res.statusCode} (${ms}ms)`);
    }).on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Ping FAIL: ${err.message}`);
    });
}

console.log(`Keep-alive started. Pinging every 14 minutes...`);
console.log(`URL: ${HEALTH_URL}\n`);

ping(); // Ping ngay lập tức
setInterval(ping, INTERVAL_MS);
