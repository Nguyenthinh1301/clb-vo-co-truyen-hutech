#!/bin/bash

# ===================================================================
# 🥋 CLB VÕ CỔ TRUYỀN HUTECH - SYSTEM STARTUP SCRIPT
# ===================================================================
# Script tự động khởi động toàn bộ hệ thống
# Tác giả: Kiro AI Assistant
# Ngày tạo: $(date +"%d/%m/%Y")
# ===================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🥋 ===== CLB VÕ CỔ TRUYỀN HUTECH SYSTEM STARTUP =====${NC}"
echo ""

# Kiểm tra Node.js
echo -e "${YELLOW}🔍 Kiểm tra Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js chưa được cài đặt!${NC}"
    echo -e "${YELLOW}   Vui lòng cài đặt Node.js từ: https://nodejs.org${NC}"
    exit 1
fi

# Kiểm tra npm
echo -e "${YELLOW}🔍 Kiểm tra npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm version: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm không khả dụng!${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}📁 Chuẩn bị khởi động hệ thống...${NC}"

# Kiểm tra thư mục backend
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Không tìm thấy thư mục backend!${NC}"
    exit 1
fi

# Kiểm tra thư mục website
if [ ! -d "website" ]; then
    echo -e "${RED}❌ Không tìm thấy thư mục website!${NC}"
    exit 1
fi

# Cài đặt dependencies cho backend
echo ""
echo -e "${YELLOW}📦 Cài đặt dependencies cho Backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo -e "   ${WHITE}Đang cài đặt npm packages...${NC}"
    npm install --silent
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies đã được cài đặt${NC}"
    else
        echo -e "${RED}❌ Lỗi khi cài đặt backend dependencies!${NC}"
        cd ..
        exit 1
    fi
else
    echo -e "${GREEN}✅ Backend dependencies đã có sẵn${NC}"
fi

# Kiểm tra file .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Không tìm thấy file .env, sao chép từ .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo -e "${GREEN}✅ Đã tạo file .env từ template${NC}"
    else
        echo -e "${RED}❌ Không tìm thấy file .env.example!${NC}"
    fi
fi

cd ..

echo ""
echo -e "${CYAN}🚀 Khởi động Backend Server...${NC}"

# Khởi động backend trong background
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Đợi một chút để backend khởi động
sleep 3

# Kiểm tra backend có chạy không
echo -e "${YELLOW}🔍 Kiểm tra Backend Server...${NC}"
MAX_RETRIES=10
RETRY_COUNT=0
BACKEND_RUNNING=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$BACKEND_RUNNING" = false ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        BACKEND_RUNNING=true
        echo -e "${GREEN}✅ Backend Server đang chạy tại: http://localhost:3001${NC}"
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -e "   ${WHITE}Đang chờ backend khởi động... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
        sleep 2
    fi
done

if [ "$BACKEND_RUNNING" = false ]; then
    echo -e "${RED}❌ Backend Server không thể khởi động!${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${CYAN}🌐 Chuẩn bị Frontend...${NC}"

# Kiểm tra Live Server
LIVE_SERVER_INSTALLED=false
if npm list -g live-server &> /dev/null; then
    LIVE_SERVER_INSTALLED=true
fi

if [ "$LIVE_SERVER_INSTALLED" = false ]; then
    echo -e "${YELLOW}📦 Cài đặt Live Server...${NC}"
    if npm install -g live-server --silent; then
        echo -e "${GREEN}✅ Live Server đã được cài đặt${NC}"
        LIVE_SERVER_INSTALLED=true
    else
        echo -e "${YELLOW}⚠️  Không thể cài đặt Live Server tự động${NC}"
        LIVE_SERVER_INSTALLED=false
    fi
fi

# Khởi động frontend
if [ "$LIVE_SERVER_INSTALLED" = true ]; then
    echo -e "${CYAN}🚀 Khởi động Frontend với Live Server...${NC}"
    
    # Khởi động live server trong background
    cd website
    live-server --port=3000 --host=localhost --no-browser --quiet &
    FRONTEND_PID=$!
    cd ..
    
    sleep 2
    echo -e "${GREEN}✅ Frontend Server đang chạy tại: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Vui lòng mở file website/index.html bằng web server${NC}"
    FRONTEND_PID=""
fi

echo ""
echo -e "${GREEN}🎉 ===== HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG! =====${NC}"
echo ""
echo -e "${CYAN}📋 THÔNG TIN HỆ THỐNG:${NC}"
echo -e "   ${WHITE}🖥️  Backend API:     http://localhost:3001${NC}"
echo -e "   ${WHITE}🌐 Frontend Web:    http://localhost:3000${NC}"
echo -e "   ${WHITE}📚 API Docs:        http://localhost:3001/api-docs${NC}"
echo -e "   ${WHITE}❤️  Health Check:   http://localhost:3001/health${NC}"
echo -e "   ${WHITE}🧪 Test Dashboard:  http://localhost:3000/test-integrated-dashboard.html${NC}"
echo ""
echo -e "${CYAN}👥 TÀI KHOẢN MẶC ĐỊNH:${NC}"
echo -e "   ${WHITE}🛡️  Admin:    admin@hutech.edu.vn / Admin123456${NC}"
echo -e "   ${WHITE}👤 User:     user@hutech.edu.vn / User123456${NC}"
echo -e "   ${WHITE}👨‍🏫 Instructor: instructor@hutech.edu.vn / Instructor123456${NC}"
echo ""
echo -e "${CYAN}🔧 QUẢN LÝ HỆ THỐNG:${NC}"
echo -e "   ${WHITE}• Nhấn Ctrl+C để dừng hệ thống${NC}"
echo -e "   ${WHITE}• Xem logs trong terminal này${NC}"
echo -e "   ${WHITE}• Kiểm tra trạng thái tại /health endpoint${NC}"
echo ""

# Mở browser tự động (nếu có)
echo -e "${YELLOW}🌐 Mở trình duyệt...${NC}"
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &> /dev/null &
    echo -e "${GREEN}✅ Đã mở website trong trình duyệt${NC}"
elif command -v open &> /dev/null; then
    open http://localhost:3000 &> /dev/null &
    echo -e "${GREEN}✅ Đã mở website trong trình duyệt${NC}"
else
    echo -e "${YELLOW}⚠️  Vui lòng mở http://localhost:3000 trong trình duyệt${NC}"
fi

echo ""
echo -e "${YELLOW}⏳ Hệ thống đang chạy... Nhấn Ctrl+C để dừng${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Đang dừng hệ thống...${NC}"
    echo ""
    echo -e "${YELLOW}🧹 Dọn dẹp processes...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Đã dừng Backend Server${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Đã dừng Frontend Server${NC}"
    fi
    
    # Kill any remaining node processes on our ports
    pkill -f "node.*3001" 2>/dev/null
    pkill -f "live-server.*3000" 2>/dev/null
    
    echo ""
    echo -e "${CYAN}👋 Hệ thống đã được dừng. Cảm ơn bạn đã sử dụng!${NC}"
    echo -e "${CYAN}🥋 CLB Võ Cổ Truyền HUTECH${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Theo dõi processes
while true; do
    # Kiểm tra backend process
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process đã dừng!${NC}"
        cleanup
    fi
    
    # Kiểm tra frontend process (nếu có)
    if [ ! -z "$FRONTEND_PID" ] && ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend process đã dừng!${NC}"
        cleanup
    fi
    
    sleep 5
done