/**
 * Lấy IP thật của người dùng để rate limit.
 *
 * Production chạy sau Cloudflare → load balancer của Render → app, nên req.ip
 * (kể cả khi đã set 'trust proxy') thường là IP của máy proxy — nhiều người dùng
 * chung một IP proxy và bị chặn lây nhau.
 *
 * Cloudflare luôn GHI ĐÈ header CF-Connecting-IP bằng IP thật của client,
 * nên người dùng không giả mạo được khi request đi qua Cloudflare
 * (domain *.onrender.com luôn đi qua Cloudflare).
 * Đặt TRUST_CF_CONNECTING_IP=false nếu sau này deploy ở nơi không có Cloudflare.
 */
function clientIp(req) {
    if (process.env.TRUST_CF_CONNECTING_IP !== 'false') {
        const cf = req.headers['cf-connecting-ip'];
        if (typeof cf === 'string' && cf.trim()) return cf.trim();
    }
    return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isLocalRequest(req) {
    const ip = clientIp(req);
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
}

module.exports = { clientIp, isLocalRequest };
