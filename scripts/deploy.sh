#!/bin/bash
# ============================================================
# DEPLOY SCRIPT — CLB Võ Cổ Truyền HUTECH
# Chạy trên server Linux sau khi upload code
# ============================================================
set -e  # Dừng nếu có lỗi

echo "🚀 Bắt đầu deploy CLB Võ Cổ Truyền HUTECH..."

# ── 1. Kiểm tra Node.js ──────────────────────────────────────
echo "📦 Kiểm tra Node.js..."
node --version || { echo "❌ Node.js chưa được cài. Cài Node.js 18+ trước."; exit 1; }
npm --version  || { echo "❌ npm chưa được cài."; exit 1; }

# ── 2. Kiểm tra .env production ─────────────────────────────
echo "🔑 Kiểm tra file .env..."
if [ ! -f "backend/.env" ]; then
    echo "❌ Không tìm thấy backend/.env"
    echo "   Sao chép backend/.env.production thành backend/.env và điền thông tin."
    exit 1
fi

# Kiểm tra NODE_ENV=production
if ! grep -q "NODE_ENV=production" backend/.env; then
    echo "⚠️  CẢNH BÁO: NODE_ENV chưa được set thành 'production' trong .env"
fi

# ── 3. Cài dependencies backend ─────────────────────────────
echo "📦 Cài dependencies backend..."
cd backend
npm install --production --silent
cd ..

# ── 4. Kiểm tra PM2 ─────────────────────────────────────────
echo "🔄 Kiểm tra PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "📦 Cài PM2..."
    npm install -g pm2
fi

# ── 5. Khởi động / Restart backend ──────────────────────────
echo "🚀 Khởi động backend..."
cd backend
if pm2 list | grep -q "clb-vo-api"; then
    pm2 reload ecosystem.config.js --env production
    echo "✅ Backend đã được reload"
else
    pm2 start ecosystem.config.js --env production
    echo "✅ Backend đã được khởi động"
fi
pm2 save
cd ..

# ── 6. Chờ backend sẵn sàng ─────────────────────────────────
echo "⏳ Chờ backend khởi động..."
sleep 3

# ── 7. Health check ─────────────────────────────────────────
echo "🏥 Kiểm tra health..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$HEALTH" = "200" ]; then
    echo "✅ Backend đang chạy tốt (HTTP $HEALTH)"
else
    echo "❌ Backend health check thất bại (HTTP $HEALTH)"
    echo "   Xem logs: pm2 logs clb-vo-api"
    exit 1
fi

# ── 8. Reload Nginx ──────────────────────────────────────────
echo "🔄 Reload Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx
    echo "✅ Nginx đã được reload"
else
    echo "⚠️  Nginx chưa cài hoặc không tìm thấy — bỏ qua"
fi

echo ""
echo "✅ Deploy hoàn tất!"
echo "   Backend : http://localhost:3001/health"
echo "   Logs    : pm2 logs clb-vo-api"
echo "   Monitor : pm2 monit"
