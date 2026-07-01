# 🔧 FIX EMAIL NOTIFICATION - Resend API Setup

**Vấn đề:** Email không gửi được qua SMTP (Render free tier block port 587)  
**Giải pháp:** Dùng Resend API (HTTP-based, miễn phí 3000 emails/tháng)  
**Thời gian:** 5 phút  

---

## 🚨 TẠI SAO EMAIL KHÔNG GỬI ĐƯỢC?

**Nguyên nhân:**
- Render free tier **block outbound SMTP** (port 587, 465, 25)
- Gmail SMTP không work trên Render free tier
- Code đã đúng, nhưng infrastructure block

**Giải pháp:**
- Dùng **Resend API** (HTTP-based, không dùng SMTP port)
- Resend work trên Render free tier
- Free tier: 3000 emails/tháng (đủ dùng!)

---

## ✅ HƯỚNG DẪN SETUP RESEND (5 phút)

### Bước 1: Tạo Resend Account

1. **Mở browser:**
   ```
   https://resend.com/signup
   ```

2. **Sign up:**
   - Option A: Email + password
   - Option B: Sign in with GitHub (nhanh hơn)

3. **Verify email** (check inbox)

4. **Login** vào Resend Dashboard

---

### Bước 2: Tạo API Key

1. **Trong Resend Dashboard:**
   - Click **"API Keys"** (sidebar bên trái)

2. **Create API Key:**
   - Click **"Create API Key"** button
   - Name: `CLB-VCT-HUTECH-Production`
   - Permission: **Full Access** (hoặc Send emails)
   - Click **"Create"**

3. **Copy API Key:**
   - API key hiển thị **1 lần duy nhất**
   - Format: `re_xxxxxxxxxxxxxxxxxxxx`
   - **COPY ngay!** (nếu mất phải tạo lại)

**Example:**
```
re_AbCdEfGh123456789IjKlMnOpQrStUvWxYz
```

---

### Bước 3: Add API Key vào Render

1. **Mở Render Dashboard:**
   ```
   https://dashboard.render.com
   ```

2. **Chọn service:**
   - Click vào service: `clb-vo-co-truyen-hutech`

3. **Vào Environment Variables:**
   - Click tab **"Environment"** (sidebar)

4. **Add variable mới:**
   - Click **"Add Environment Variable"** (hoặc "Edit")
   - **Key:** `RESEND_API_KEY`
   - **Value:** (paste API key từ Resend - bắt đầu với `re_`)
   - Click **"Save Changes"**

**Ví dụ:**
```
Key:   RESEND_API_KEY
Value: re_AbCdEfGh123456789IjKlMnOpQrStUvWxYz
```

5. **Đợi backend restart:**
   - Render sẽ tự động restart service (~30-60 giây)
   - Status: "Deploying" → "Live"

---

### Bước 4: (Optional) Setup FROM email

**Nếu bạn có domain và muốn email từ domain:**

#### Option A: Verify domain trên Resend

1. Trong Resend Dashboard, click **"Domains"**
2. Click **"Add Domain"**
3. Nhập: `vocotruyenhutech.edu.vn`
4. Add DNS records theo hướng dẫn:
   - SPF record
   - DKIM record
   - DMARC record (optional)
5. Wait for verification (vài phút đến vài giờ)

#### Option B: Dùng default (onboarding@resend.dev)

Nếu chưa có domain hoặc chưa setup DNS, skip bước này.

Email sẽ gửi từ: `onboarding@resend.dev` (vẫn work, nhưng không professional)

**Để set FROM email sau khi verify domain:**

1. Trong Render → Environment
2. Add variable:
   - **Key:** `RESEND_FROM_EMAIL`
   - **Value:** `noreply@vocotruyenhutech.edu.vn`
3. Save

---

## ✅ KIỂM TRA RESEND HOẠT ĐỘNG

### Test 1: Chạy Script Test

```powershell
.\scripts\test-contact-resend.ps1
```

Script sẽ:
1. Wait for backend restart
2. Submit test contact form
3. Check email sent via Resend API
4. Verify email received

### Test 2: Check Resend Dashboard

1. Vào: https://resend.com/emails
2. Xem **"Logs"** tab
3. Sẽ thấy email vừa gửi với status:
   - ✅ **Delivered** (thành công)
   - ❌ **Failed** (có lỗi)

### Test 3: Check Gmail Inbox

1. Vào: https://gmail.com
2. Login: vctht2026@gmail.com
3. Tìm email mới:
   - **From:** CLB Võ Cổ Truyền HUTECH
   - **Subject:** [Liên hệ mới] QA Tester (Resend Test)
   - **Time:** Within 15 seconds

### Test 4: Check Render Logs

1. Render Dashboard → Service → **Logs**
2. Tìm dòng:
   ```
   ✅ Email service initialized (Resend HTTP API)
   ```
3. Khi gửi email, sẽ thấy:
   ```
   ✅ Admin notification email sent
   ```

---

## 🐞 TROUBLESHOOTING

### Issue 1: "Email service not initialized"

**Nguyên nhân:** RESEND_API_KEY chưa được add hoặc sai format

**Giải pháp:**
1. Check Render → Environment → RESEND_API_KEY exists
2. Value phải bắt đầu với `re_`
3. Không có spaces hoặc newlines
4. Restart service manually

---

### Issue 2: Email vẫn không gửi

**Check Resend Dashboard:**
1. Vào: https://resend.com/emails
2. Check email list → tìm email vừa gửi
3. Click vào email → xem error details

**Common errors:**
- **Invalid API key:** Check RESEND_API_KEY đúng
- **Domain not verified:** Dùng onboarding@resend.dev
- **Rate limit exceeded:** Free tier: 3000/month

**Check Render Logs:**
1. Render → Service → Logs
2. Tìm error messages:
   ```
   ❌ Resend error: ...
   ❌ Admin notification email failed: ...
   ```

---

### Issue 3: Email vào Spam

**Giải pháp:**
1. **Verify domain** trên Resend (add SPF/DKIM records)
2. **Whitelist sender** trong Gmail settings
3. Mark as "Not Spam" (Gmail sẽ học)

---

## 📊 SO SÁNH: SMTP vs RESEND

| Feature | SMTP (Gmail) | Resend API |
|---------|--------------|------------|
| **Work trên Render free tier** | ❌ NO (port blocked) | ✅ YES (HTTP) |
| **Setup complexity** | Medium | Easy |
| **Free tier** | Unlimited | 3000/month |
| **Delivery speed** | Slow (~30s) | Fast (~5s) |
| **Tracking** | No | Yes (dashboard) |
| **Professional FROM** | gmail.com | Your domain |
| **Reliability** | Low (can be blocked) | High |

**Recommendation:** ✅ **Dùng Resend API**

---

## 🎯 CHECKLIST SAU KHI SETUP

- [ ] Resend account created
- [ ] API key generated và copied
- [ ] RESEND_API_KEY added to Render Environment
- [ ] Backend restarted (status = "Live")
- [ ] Test script chạy thành công
- [ ] Email nhận được trong Gmail inbox
- [ ] Resend dashboard shows "Delivered"
- [ ] Render logs show "Email service initialized (Resend)"

---

## 💡 BEST PRACTICES

### 1. Verify Domain (Recommended)

Verify domain `vocotruyenhutech.edu.vn` để:
- Email FROM professional: `noreply@vocotruyenhutech.edu.vn`
- Không vào spam
- Brand credibility

### 2. Monitor Email Usage

Free tier: 3000 emails/month

- Typical usage: ~50-100 emails/month (contact form)
- Enough cho 1-2 năm
- Nếu vượt → upgrade plan ($20/month for 50k emails)

### 3. Set Up Webhooks (Advanced)

Resend có webhooks để track:
- Email delivered
- Email opened
- Email clicked
- Email bounced

Setup trong Resend Dashboard → Webhooks

---

## 📞 HỖ TRỢ

### Resend Support:
- Docs: https://resend.com/docs
- Support: support@resend.com
- Discord: https://resend.com/discord

### Nếu vẫn không work:
- Check file này: `FIX-EMAIL-NOTIFICATION.md`
- Check Render logs
- Check Resend dashboard logs
- Run: `.\scripts\test-contact-resend.ps1`

---

## 🎉 KẾT QUẢ MONG ĐỢI

**Sau khi setup Resend:**

✅ User submit contact form  
→ ✅ Backend save to database  
→ ✅ Backend gửi email qua Resend API  
→ ✅ Resend delivers email in 5-15s  
→ ✅ Admin receives email: vctht2026@gmail.com  
→ ✅ Email content: Thông tin contact form  
→ ✅ Admin can reply via admin panel  

---

**Created:** 2026-07-01  
**Status:** Ready to implement  
**Estimated time:** 5 minutes  

