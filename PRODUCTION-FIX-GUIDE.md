# 🔧 PRODUCTION FIX GUIDE - Step by Step

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 10-15 minutes  
**Prerequisites:** Access to Render & Netlify Dashboards  
**Based on:** QA Test Report (Grade D - 53.1%)

---

## 📊 Current Status

❌ **Backend:** OFFLINE (timeout)  
❌ **Frontend:** 404 Error  
❌ **CORS:** Blocking Netlify  
❌ **Overall:** NOT WORKING

**Target:** ✅ Restore production to working state (90%+ success rate)

---

## 🎯 Fix Plan Overview

```
┌─────────────────────────────────┐
│  Step 1: Wake Up Backend        │ (5 min)
│  → Render Dashboard             │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Step 2: Fix CORS               │ (2 min)
│  → Update Environment Vars      │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Step 3: Fix Frontend           │ (5 min)
│  → Netlify Redeploy             │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Step 4: Verify                 │ (3 min)
│  → Run Test Suite               │
└─────────────────────────────────┘
```

---

## 🚀 STEP 1: Wake Up Backend (Render)

### 1.1 Access Render Dashboard

1. Mở browser, vào: **https://dashboard.render.com**
2. Login với tài khoản của bạn
3. Tìm service: **"clb-vo-co-truyen-hutech"** (hoặc tên tương tự)

### 1.2 Check Service Status

Trong service page, check phần **Status** ở góc trên:

**Nếu thấy "Suspended" hoặc "Sleeping":**
```
✅ Service đang sleep (bình thường với free tier)
→ Chuyển sang bước 1.3
```

**Nếu thấy "Failed" hoặc "Build Failed":**
```
❌ Service bị crash/lỗi build
→ Chuyển sang bước 1.4
```

**Nếu thấy "Live" hoặc "Running":**
```
🤔 Service đang chạy nhưng không response
→ Chuyển sang bước 1.5
```

### 1.3 Wake Up Sleeping Service

**Cách 1: Automatic wake up**
```powershell
# Gửi request để đánh thức service
curl https://clb-vo-co-truyen-hutech.onrender.com/health

# Chờ 30-60 giây cho service khởi động
# Render free tier sleep → wake up mất ~30-60s
```

**Cách 2: Manual restart**
1. Click nút **"Manual Deploy"** (góc trên bên phải)
2. Chọn **"Clear build cache & deploy"**
3. Click **"Yes, I'm sure"**
4. Chờ deploy xong (~2-3 phút)

### 1.4 Fix Failed Service

**Nếu service failed:**

1. Click tab **"Logs"** (bên trái)
2. Scroll xuống dưới cùng để xem latest logs
3. Tìm error messages (thường có chữ "ERROR" hoặc "FATAL")

**Common errors & fixes:**

**Error: "Port already in use"**
```
Fix: Ignore - Render sẽ tự assign port
```

**Error: "Database connection failed"**
```
Fix: 
1. Check tab "Environment"
2. Verify DATABASE_URL exists và đúng format:
   postgresql://user:pass@host/db?ssl=true
3. Nếu sai → Update → Save
```

**Error: "Module not found"**
```
Fix: Clear cache & redeploy
1. Click "Manual Deploy"
2. Check "Clear build cache"
3. Deploy
```

**Error: "npm install failed"**
```
Fix: Check package.json
1. Vào GitHub repo
2. Check backend/package.json valid
3. Fix typo nếu có
4. Commit & push
5. Render sẽ auto redeploy
```

### 1.5 Restart Running Service

**Nếu service "Live" nhưng không response:**

1. Click nút **"Restart Service"** (góc trên)
2. Confirm restart
3. Chờ 30 giây
4. Test: `curl https://clb-vo-co-truyen-hutech.onrender.com/health`

### 1.6 Verify Backend Online

**Test trong browser:**
```
Mở: https://clb-vo-co-truyen-hutech.onrender.com/health

Expected result:
{
  "success": true,
  "message": "Server is running",
  "database": {
    "success": true,
    "message": "Database connected"
  }
}
```

**Test trong PowerShell:**
```powershell
curl https://clb-vo-co-truyen-hutech.onrender.com/health

# Should return JSON (không có timeout)
```

**✅ Nếu thấy JSON response → Backend ONLINE! Chuyển Step 2**  
**❌ Nếu vẫn timeout → Check logs again hoặc contact Render support**

---

## 🔐 STEP 2: Fix CORS Configuration

### 2.1 Navigate to Environment Variables

1. Trong Render service page
2. Click tab **"Environment"** (bên trái)
3. Scroll tìm biến: **CORS_ORIGIN**

### 2.2 Update CORS_ORIGIN

**Current value (incorrect):**
```
https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://api.vocotruyenhutech.edu.vn
```

**New value (correct):**
```
https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://api.vocotruyenhutech.edu.vn,https://vo-co-truyen-hutech.netlify.app
```

**Steps:**
1. Click **"Edit"** button bên cạnh CORS_ORIGIN
2. Copy new value bên trên
3. Paste vào field
4. **CRITICAL:** Đảm bảo KHÔNG có khoảng trắng giữa các domain
5. Click **"Save"**

### 2.3 Restart Service

Sau khi save, Render sẽ tự động restart service (~30s).

Wait for restart complete (status: "Live")

### 2.4 Verify CORS Fixed

**Test với script:**
```powershell
.\scripts\test-cors.ps1

# Expected:
# ✅ CORS allows Netlify domain
# ✅ PASS
```

**Manual test:**
```powershell
curl.exe -s -H "Origin: https://vo-co-truyen-hutech.netlify.app" -H "Access-Control-Request-Method: POST" -X OPTIONS https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login -i

# Expected: HTTP 204 hoặc 200 (KHÔNG phải 500)
```

**✅ Nếu thấy 204/200 → CORS FIXED! Chuyển Step 3**  
**❌ Nếu vẫn 500 → Double check CORS_ORIGIN value (có khoảng trắng?)**

---

## 🌐 STEP 3: Fix Frontend (Netlify)

### 3.1 Access Netlify Dashboard

1. Mở browser, vào: **https://app.netlify.com**
2. Login với tài khoản của bạn
3. Tìm site: **"vo-co-truyen-hutech"** (hoặc tên tương tự)

### 3.2 Check Site Status

Click vào site để mở site dashboard.

**Check Deploy Status (top section):**

**Nếu thấy "Published" (màu xanh):**
```
🤔 Site đã deploy nhưng 404
→ Có thể domain issue hoặc build path sai
→ Chuyển 3.3
```

**Nếu thấy "Failed" (màu đỏ):**
```
❌ Deploy failed
→ Chuyển 3.4
```

**Nếu thấy "Building..." hoặc "Queued":**
```
⏳ Đang deploy
→ Chờ xong rồi check lại
```

### 3.3 Fix 404 Error (Site Published)

**Possible causes:**

**Cause 1: Wrong build directory**
1. Click **"Site settings"** (top menu)
2. Click **"Build & deploy"** → **"Continuous Deployment"**
3. Check **"Publish directory"**:
   - Should be: **`website`** hoặc **`.`** (root)
   - NOT: `dist`, `build`, `public`
4. Nếu sai → Click "Edit settings" → Fix → Save
5. Trigger new deploy (see 3.6)

**Cause 2: Domain misconfiguration**
1. Click **"Domain settings"**
2. Check primary domain: `vo-co-truyen-hutech.netlify.app`
3. Nếu sai → Update domain
4. Wait for DNS propagation (1-2 min)

**Cause 3: File not at root**
1. Check GitHub repo structure:
   ```
   repo/
   ├── website/        ← Frontend files here
   │   ├── index.html
   │   └── ...
   └── backend/
   ```
2. If correct → Publish directory should be **`website`**
3. Update in Site settings → Build & deploy

### 3.4 Fix Failed Deploy

**Check build logs:**

1. Click tab **"Deploys"**
2. Click latest failed deploy (red)
3. Scroll logs to find error

**Common errors:**

**Error: "Page not found"**
```
Fix: Set publish directory to "website"
1. Site settings → Build & deploy
2. Publish directory: website
3. Save
4. Trigger new deploy
```

**Error: "Build command failed"**
```
Fix: No build needed (static site)
1. Site settings → Build & deploy
2. Build command: leave EMPTY
3. Save
4. Trigger new deploy
```

**Error: "Failed to load resource"**
```
Fix: Check relative paths in HTML
1. Ensure paths start with ./ or /
2. Fix in code → commit → push
3. Auto redeploy
```

### 3.5 Configure Build Settings (If Needed)

**Correct settings for this project:**

1. **Build command:** (leave EMPTY - static site)
2. **Publish directory:** `website`
3. **Branch:** `main`

**To update:**
1. Site settings → Build & deploy → Edit settings
2. Update values above
3. Save

### 3.6 Trigger New Deploy

**Method 1: From GitHub push**
```powershell
git commit --allow-empty -m "Trigger Netlify redeploy"
git push
# Netlify auto-deploys từ GitHub
```

**Method 2: Manual deploy**
1. Click **"Deploys"** tab
2. Click **"Trigger deploy"** dropdown (top right)
3. Select **"Clear cache and deploy site"**
4. Confirm
5. Wait ~1-2 minutes

### 3.7 Verify Frontend Online

**Test homepage:**
```
Mở: https://vo-co-truyen-hutech.netlify.app

Expected: Thấy trang chủ website (không phải 404)
```

**Test admin page:**
```
Mở: https://vo-co-truyen-hutech.netlify.app/admin/

Expected: Thấy admin login form
```

**✅ Nếu load được → Frontend FIXED! Chuyển Step 4**  
**❌ Nếu vẫn 404 → Check publish directory & redeploy**

---

## ✅ STEP 4: Verify Everything Works

### 4.1 Run Automated Test Suite

```powershell
# Chạy comprehensive test
.\scripts\comprehensive-qa-test.ps1

# Chờ kết quả (~45 seconds)
```

**Expected results:**
```
Total Tests: 32
Passed: 28+ tests (87%+)
Failed: <4 tests
Success Rate: 87%+

Status: PRODUCTION READY ✅
```

### 4.2 Manual Test: Admin Login Flow

1. **Mở admin page:**
   ```
   https://vo-co-truyen-hutech.netlify.app/admin/
   ```

2. **Check backend status indicator:**
   - Phải thấy: "Backend đang online ✅" (màu xanh)
   - Nếu thấy đỏ → Backend vẫn có vấn đề

3. **Test login:**
   - Email: `admin@vocotruyenhutech.edu.vn`
   - Password: `Admin@2026` (hoặc password của bạn)
   - Click "Đăng nhập"

4. **Expected result:**
   - ✅ Không có lỗi CORS
   - ✅ Không có "Không kết nối được backend"
   - ✅ Redirect về Dashboard
   - ✅ Dashboard loads successfully

### 4.3 Quick Health Checks

**Backend health:**
```powershell
curl https://clb-vo-co-truyen-hutech.onrender.com/health
# Should return JSON với success: true
```

**Frontend homepage:**
```powershell
curl https://vo-co-truyen-hutech.netlify.app
# Should return HTML (status 200)
```

**CORS:**
```powershell
.\scripts\test-cors.ps1
# All tests should PASS
```

### 4.4 Browser Cache Clear

**Important:** Clear browser cache để thấy changes mới:

**Chrome/Edge:**
```
Ctrl + Shift + Delete
→ Cached images and files
→ All time
→ Clear data
```

**Or use Incognito mode:**
```
Ctrl + Shift + N
```

---

## 📊 Success Criteria

Sau khi hoàn thành 4 steps, check:

- [ ] ✅ Backend health returns JSON (no timeout)
- [ ] ✅ Backend uptime > 1 minute
- [ ] ✅ Database connected
- [ ] ✅ Frontend homepage loads (no 404)
- [ ] ✅ Admin page loads
- [ ] ✅ CORS allows Netlify
- [ ] ✅ Admin login successful
- [ ] ✅ Dashboard accessible after login
- [ ] ✅ Test suite passes 87%+
- [ ] ✅ No console errors

**If all checked → 🎉 PRODUCTION RESTORED!**

---

## 🐞 Troubleshooting

### Issue: Backend still timeout after wake up

**Possible causes:**
1. Database connection failed
2. Service crashed during startup
3. Memory limit exceeded (free tier)

**Fix:**
1. Check Render logs for errors
2. Check DATABASE_URL environment variable
3. Restart service
4. Consider upgrading Render plan

---

### Issue: Frontend still 404 after redeploy

**Possible causes:**
1. Wrong publish directory
2. Files not in correct location
3. CDN cache not cleared

**Fix:**
1. Verify publish directory = "website"
2. Check GitHub repo structure
3. Clear Netlify cache & redeploy
4. Wait 2-3 minutes for CDN propagation

---

### Issue: CORS still blocking after update

**Possible causes:**
1. CORS_ORIGIN has spaces between domains
2. Service not restarted after update
3. Wrong domain spelling

**Fix:**
1. Re-check CORS_ORIGIN (no spaces!)
2. Format: `domain1,domain2,domain3` (comma, no spaces)
3. Manual restart service
4. Wait 30 seconds
5. Test again

---

### Issue: Admin login fails with "Network Error"

**Possible causes:**
1. Backend is actually down
2. CORS still blocking
3. API_BASE URL wrong in frontend

**Fix:**
1. Test backend health directly
2. Test CORS with script
3. Check browser DevTools Console (F12) for exact error
4. Check browser DevTools Network tab for failed request

---

## 📞 Emergency Contacts

**Render Support:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Community: https://community.render.com

**Netlify Support:**
- Dashboard: https://app.netlify.com
- Docs: https://docs.netlify.com
- Support: https://www.netlify.com/support/

**Project Issues:**
- GitHub: https://github.com/Nguyenthinh1301/clb-vo-co-truyen-hutech
- Create issue with logs & screenshots

---

## 📋 Post-Fix Checklist

After successfully fixing production:

- [ ] Document what was wrong (for future reference)
- [ ] Set up monitoring (UptimeRobot, Pingdom)
- [ ] Configure alerts for downtime
- [ ] Consider upgrading Render to paid (avoid sleep)
- [ ] Add automated health checks
- [ ] Update team on status
- [ ] Schedule regular QA tests (weekly)

---

## 💡 Prevention Tips

**To avoid this happening again:**

1. **Monitoring:** Set up UptimeRobot to ping `/health` every 5 minutes
2. **Upgrade:** Consider Render paid plan ($7/month) to avoid sleep
3. **Testing:** Run QA test suite before major changes
4. **Documentation:** Keep this guide handy
5. **Backups:** Have rollback plan ready

---

**Created:** 2026-07-01  
**Updated:** 2026-07-01  
**Version:** 1.0  
**Status:** Production Fix Guide  
**Estimated Success Rate:** 95% if followed correctly
