#!/bin/bash
# ============================================================
# BACKUP SCRIPT — Chạy TRƯỚC khi deploy
# ============================================================
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

echo "💾 Tạo backup trước deploy: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# ── Backup uploads ───────────────────────────────────────────
if [ -d "backend/uploads" ]; then
    echo "📁 Backup uploads..."
    tar -czf "$BACKUP_DIR/uploads.tar.gz" backend/uploads/
    echo "✅ Uploads: $BACKUP_DIR/uploads.tar.gz"
fi

# ── Backup database (MSSQL) ──────────────────────────────────
if [ -f "backend/.env" ]; then
    source backend/.env 2>/dev/null || true
    if [ -n "$MSSQL_SERVER" ] && [ -n "$MSSQL_DATABASE" ]; then
        echo "🗄️  Backup database..."
        # Dùng sqlcmd nếu có
        if command -v sqlcmd &> /dev/null; then
            sqlcmd -S "$MSSQL_SERVER" -U "$MSSQL_USER" -P "$MSSQL_PASSWORD" \
                -Q "BACKUP DATABASE [$MSSQL_DATABASE] TO DISK='$BACKUP_DIR/database.bak' WITH FORMAT, COMPRESSION" \
                2>/dev/null && echo "✅ Database: $BACKUP_DIR/database.bak" \
                || echo "⚠️  Backup DB thất bại — backup thủ công qua SQL Server Management Studio"
        else
            echo "⚠️  sqlcmd không tìm thấy — backup DB thủ công qua SSMS"
        fi
    fi
fi

echo ""
echo "✅ Backup hoàn tất: $BACKUP_DIR"
echo "   Giữ backup này ít nhất 7 ngày sau khi deploy thành công."
