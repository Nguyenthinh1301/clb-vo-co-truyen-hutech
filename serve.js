/**
 * Static file server - CLB Võ Cổ Truyền HUTECH
 * node serve.js → http://localhost:8080
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(__dirname, 'website');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.mp4':  'video/mp4',
    '.webp': 'image/webp',
};

http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/')       p = '/index.html';
    if (p === '/admin' || p === '/admin/') p = '/admin/index.html';

    const file = path.join(ROOT, p);
    const ext  = path.extname(file).toLowerCase();
    const mime = MIME[ext] || 'text/html; charset=utf-8';

    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: ' + p);
        } else {
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        }
    });
}).listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   CLB Võ Cổ Truyền HUTECH - Web Server  ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  🌐 Trang chủ  : http://localhost:' + PORT + '     ║');
    console.log('║  🔐 Admin CMS  : http://localhost:' + PORT + '/admin/ ║');
    console.log('║  ⚙️  Backend   : http://localhost:3001    ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  📧 Email    : admin@vocotruyenhutech... ║');
    console.log('║  🔑 Password : Admin@123456              ║');
    console.log('╚══════════════════════════════════════════╝\n');
});
