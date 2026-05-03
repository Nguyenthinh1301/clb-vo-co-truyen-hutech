#!/bin/bash
# ============================================================
# SETUP SSL — Let's Encrypt / Certbot
# Chạy trên server Ubuntu/Debian sau khi DNS đã trỏ về server
# ============================================================
set -e

DOMAIN="vocotruyenhutech.edu.vn"
API_DOMAIN="api.vocotruyenhutech.edu.vn"
EMAIL="vctht2026@gmail.com"

echo "🔒 Cài đặt SSL cho $DOMAIN và $API_DOMAIN..."

# ── 1. Cài certbot ───────────────────────────────────────────
if ! command -v certbot &> /dev/null; then
    echo "📦 Cài certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
fi

# ── 2. Tạo thư mục webroot cho ACME challenge ────────────────
mkdir -p /var/www/certbot

# ── 3. Copy nginx config ─────────────────────────────────────
echo "📋 Copy nginx config..."
cp backend/nginx.conf /etc/nginx/nginx.conf

# Tạo thư mục SSL nếu chưa có
mkdir -p /etc/nginx/ssl

# ── 4. Tạm thời dùng self-signed cert để nginx start được ────
if [ ! -f /etc/nginx/ssl/fullchain.pem ]; then
    echo "🔑 Tạo self-signed cert tạm thời..."
    openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -days 1 \
        -subj "/CN=$DOMAIN"
fi

# ── 5. Test và start nginx ───────────────────────────────────
nginx -t && systemctl start nginx || systemctl reload nginx

# ── 6. Lấy cert thật từ Let's Encrypt ───────────────────────
echo "🌐 Lấy SSL certificate từ Let's Encrypt..."
certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "$API_DOMAIN"

# ── 7. Copy cert vào thư mục nginx ──────────────────────────
echo "📋 Copy certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/fullchain.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem   /etc/nginx/ssl/privkey.pem

# ── 8. Reload nginx với cert thật ───────────────────────────
nginx -t && systemctl reload nginx

# ── 9. Cài auto-renew ────────────────────────────────────────
echo "⏰ Cài auto-renew cron job..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/fullchain.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/privkey.pem && systemctl reload nginx") | crontab -

echo ""
echo "✅ SSL đã được cài đặt thành công!"
echo "   Website : https://$DOMAIN"
echo "   API     : https://$API_DOMAIN"
echo "   Auto-renew: Mỗi ngày lúc 3:00 AM"
