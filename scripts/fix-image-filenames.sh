#!/bin/bash
# ============================================================
# FIX IMAGE FILENAMES — Đổi tên file ảnh có ký tự đặc biệt
# Chạy trên Linux server sau khi upload website/
# ============================================================

ASSETS_DIR="./website/assets"

echo "🖼️  Đổi tên file ảnh có ký tự đặc biệt..."

# Đổi Giải_SV2 → Giai_SV2
if [ -f "$ASSETS_DIR/images_Thi_dau_vo/Giải_SV2.jpg" ]; then
    mv "$ASSETS_DIR/images_Thi_dau_vo/Giải_SV2.jpg" \
       "$ASSETS_DIR/images_Thi_dau_vo/Giai_SV2.jpg"
    echo "✅ Giải_SV2.jpg → Giai_SV2.jpg"
fi

# Đổi HD_Thiẹn_Nguyen → HD_Thien_Nguyen
if [ -f "$ASSETS_DIR/images_Thien_Nguyen/HD_Thiẹn_Nguyen.jpg" ]; then
    mv "$ASSETS_DIR/images_Thien_Nguyen/HD_Thiẹn_Nguyen.jpg" \
       "$ASSETS_DIR/images_Thien_Nguyen/HD_Thien_Nguyen.jpg"
    echo "✅ HD_Thiẹn_Nguyen.jpg → HD_Thien_Nguyen.jpg"
fi

if [ -f "$ASSETS_DIR/images_Thien_Nguyen/HD_Thiẹn_Nguyen2.jpg" ]; then
    mv "$ASSETS_DIR/images_Thien_Nguyen/HD_Thiẹn_Nguyen2.jpg" \
       "$ASSETS_DIR/images_Thien_Nguyen/HD_Thien_Nguyen2.jpg"
    echo "✅ HD_Thiẹn_Nguyen2.jpg → HD_Thien_Nguyen2.jpg"
fi

echo "✅ Hoàn tất đổi tên file ảnh."
