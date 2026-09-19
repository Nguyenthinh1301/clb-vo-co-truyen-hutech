# 🧪 LOCAL TESTING GUIDE - Verify Code Works

**Purpose:** Test toàn bộ dự án trên máy local để verify code không có bug  
**Time:** 10-15 minutes  
**Prerequisite:** Node.js installed, VS Code, Git  

---

## 🎯 Mục tiêu

Test local để chứng minh:
- ✅ Backend code works (không phải backend đang down)
- ✅ Frontend code works (không phải Netlify issue)
- ✅ CORS config works (localhost accepted)
- ✅ Admin login works end-to-end
- ✅ Database connection works
- ✅ All features functional

---

## 📋 Test Plan Overview

```
┌─────────────────────────────────┐
│  Phase 1: Setup Environment     │ (2 min)
│  → Pull code, install deps      │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Phase 2: Start Backend         │ (1 min)
│  → npm run dev                  │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Phase 3: Start Frontend        │ (1 min)
│  → Live Server                  │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Phase 4: Test Features         │ (10 min)
│  → Login, CRUD, Upload          │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Phase 5: Run Automated Tests   │ (2 min)
│  → Test suite                   │
└─────────────────────────────────┘
```

---

## 🚀 PHASE 1: Setup Environment

### 1.1 Pull Latest Code

```powershell
# Navigate to project
cd D:\Code\ThongTin-VCT

# Pull latest changes
git pull origin main

# Should see: "Already up to date" or new commits
```

### 1.2 Install Dependencies (If needed)

```powershell
# Backend dependencies
cd backend
npm install

# Should see: "added X packages" hoặc "up to date"
```

### 1.3 Verify Environment File

```powershell
# Check .env exists
ls backend/.env

# Should see: .env file
```

**If .env missing:**
```powershell
# Copy from template
cp backend/.env.example backend/.env

# Edit với database credentials của bạn
```

### 1.4 Check Database

**PostgreSQL (Neon - default):**
```powershell
# Check .env has DATABASE_URL
cat backend/.env | findstr DATABASE_URL

# Should see connection string
```

**If empty:** Get from Neon.tech dashboard và paste vào `.env`

---

## 🔧 PHASE 2: Start Backend

### 2.1 Start Backend Server

**Option A: Using script (recommended)**
```powershell
# From project root
.\start-backend-local.ps1
```

**Option B: Manual**
```powershell
cd backend
npm run dev
```

### 2.2 Wait for Server Ready

Terminal should show:
```
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3001
🌍 Environment: development
📊 Health check: http://localhost:3001/health
📚 API Docs: http://localhost:3001/api-docs
✅ Database connected
```

**Important:** **KHÔNG TẮT** terminal này!

### 2.3 Verify Backend Online

**Open new terminal/PowerShell:**

```powershell
# Test health endpoint
curl http://localhost:3001/health

# Expected response:
# {
#   "success": true,
#   "message": "Server is running",
#   "database": {
#     "success": true,
#     "message": "Database connected"
#   }
# }
```

**Or open in browser:**
```
http://localhost:3001/health
```

**✅ If JSON returned → Backend ONLINE!**  
**❌ If error → Check logs in backend terminal**

---

## 🌐 PHASE 3: Start Frontend

### 3.1 Open Project in VS Code

```powershell
# From project root
code .
```

### 3.2 Open Admin Login Page

In VS Code:
1. Navigate to: `website/admin/index.html`
2. Right-click file
3. Select **"Open with Live Server"**

Or click **"Go Live"** button at bottom-right status bar

### 3.3 Verify Live Server Started

Browser should auto-open:
```
http://127.0.0.1:5500/website/admin/index.html
```

Or similar (port might be 5501, 5502...)

### 3.4 Check Backend Status Indicator

On admin login page, should see:
```
✅ Backend đang online
```

**If see red error:**
```
❌ Backend chưa chạy!
```
→ Go back to Phase 2, start backend

---

## 🧪 PHASE 4: Feature Testing

### 4.1 Test: Admin Login

**Steps:**
1. On admin login page
2. Enter credentials:
   - Email: `admin@vocotruyenhutech.edu.vn`
   - Password: `Admin@2026` (or your password)
3. Click "Đăng nhập"

**Expected:**
- ✅ No CORS error
- ✅ No "Cannot connect" error
- ✅ Loading spinner shows
- ✅ Redirects to Dashboard
- ✅ Dashboard loads successfully

**If fails:**
- Check browser DevTools Console (F12)
- Check Network tab for failed requests
- Check backend terminal for errors

---

### 4.2 Test: Dashboard Features

After successful login:

**Test Navigation:**
- [ ] Click "Tin tức" (News)
- [ ] Click "Sự kiện" (Events)
- [ ] Click "Thư viện" (Gallery)
- [ ] Click "Hoạt động" (Activities)
- [ ] All pages load without errors

**Test Data Display:**
- [ ] Dashboard shows statistics
- [ ] News list loads (or empty state)
- [ ] Events list loads (or empty state)

---

### 4.3 Test: Create News Article

1. Go to "Tin tức" page
2. Click "Thêm tin mới" button
3. Fill form:
   - Tiêu đề: `Test Article ${Date.now()}`
   - Nội dung: `Test content for QA`
   - Trạng thái: `published`
4. Click "Lưu"

**Expected:**
- ✅ Success message appears
- ✅ Article appears in list
- ✅ No errors in console

---

### 4.4 Test: Edit News Article

1. Find test article created above
2. Click "Sửa" button
3. Change title: add " - EDITED"
4. Click "Cập nhật"

**Expected:**
- ✅ Success message
- ✅ Title updated in list
- ✅ No errors

---

### 4.5 Test: Delete News Article

1. Find test article
2. Click "Xóa" button
3. Confirm deletion

**Expected:**
- ✅ Confirm dialog appears
- ✅ Article removed from list after confirm
- ✅ No errors

---

### 4.6 Test: Image Upload (Gallery)

1. Go to "Thư viện" page
2. Click "Thêm album" or "Thêm ảnh"
3. Select an image file (< 5MB)
4. Upload

**Expected:**
- ✅ Upload progress shows
- ✅ Image appears after upload
- ✅ Thumbnail displays correctly
- ✅ No errors

---

### 4.7 Test: Logout

1. Click user menu (top right)
2. Click "Đăng xuất"

**Expected:**
- ✅ Redirects to login page
- ✅ Session cleared
- ✅ Can't access dashboard without login

---

## 🤖 PHASE 5: Automated Testing

### 5.1 Run Backend Unit Tests (If available)

```powershell
cd backend
npm test

# Should see test results
```

**Expected:**
- Most tests pass
- No critical failures

### 5.2 Run Localhost CORS Test

```powershell
# From project root
.\scripts\test-localhost-cors.ps1
```

**Expected output:**
```
[1/5] Testing: http://localhost:5500
  ✅ ALLOWED (HTTP 204)

[2/5] Testing: http://localhost:5501
  ✅ ALLOWED (HTTP 204)

...

✅ VERDICT: ALL TESTS PASSED
Backend accepts localhost with ANY port!
```

### 5.3 Run Backend Status Checker

```powershell
# Open in browser
start check-backend.html
```

**Or double-click:** `check-backend.html`

**Expected:**
```
✅ Backend đang ONLINE!
Backend có thể kết nối thành công.
```

---

## 📊 Test Results Checklist

After completing all phases:

### Backend Tests
- [ ] ✅ Backend starts without errors
- [ ] ✅ Health endpoint returns JSON
- [ ] ✅ Database connects successfully
- [ ] ✅ API endpoints respond
- [ ] ✅ CORS allows localhost
- [ ] ✅ No crashes during testing

### Frontend Tests
- [ ] ✅ Live Server starts
- [ ] ✅ Admin page loads
- [ ] ✅ No 404 errors
- [ ] ✅ Static assets load (CSS/JS/images)
- [ ] ✅ No console errors
- [ ] ✅ Backend status indicator works

### Feature Tests
- [ ] ✅ Admin login works
- [ ] ✅ Dashboard loads
- [ ] ✅ Navigation works
- [ ] ✅ Create article works
- [ ] ✅ Edit article works
- [ ] ✅ Delete article works
- [ ] ✅ Image upload works (if tested)
- [ ] ✅ Logout works

### Security Tests
- [ ] ✅ No pre-filled credentials
- [ ] ✅ Autocomplete disabled
- [ ] ✅ Cannot access dashboard without login
- [ ] ✅ Session expires properly
- [ ] ✅ No sensitive data in console

---

## 🎯 Success Criteria

**Minimum passing criteria:**
- ✅ 15/20 checks passed (75%)
- ✅ All critical features work (login, CRUD)
- ✅ No blocking bugs

**Excellent criteria:**
- ✅ 18/20 checks passed (90%)
- ✅ All features smooth
- ✅ No bugs found

**Current expectations:**
- ✅ Should pass 18-20 checks (90-100%)
- ✅ Prove code works (production issues are infrastructure, not code)

---

## 📝 Document Findings

### Create Test Report

```markdown
# Local Test Report

**Date:** $(Get-Date)
**Tester:** [Your Name]
**Duration:** [X minutes]

## Results
- Backend: [PASS/FAIL]
- Frontend: [PASS/FAIL]
- Features: [X/20 passed]
- Overall: [PASS/FAIL]

## Issues Found
1. [Issue description]
   - Steps to reproduce
   - Expected vs Actual
   - Screenshot

## Conclusion
[Code works locally / Code has bugs / Needs fixes]
```

Save as: `LOCAL-TEST-REPORT-$(Get-Date -Format 'yyyyMMdd').md`

---

## 🐞 Common Local Issues & Fixes

### Issue: Backend won't start - "Port 3001 already in use"

**Fix:**
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /PID [PID] /F

# Start backend again
cd backend
npm run dev
```

---

### Issue: Database connection failed

**Fix:**
```powershell
# Check .env has DATABASE_URL
cat backend/.env | findstr DATABASE_URL

# If empty or wrong, update .env:
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Restart backend
```

---

### Issue: npm install fails

**Fix:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -r node_modules

# Reinstall
npm install
```

---

### Issue: Live Server not starting

**Fix:**
1. Install Live Server extension in VS Code
2. Right-click HTML file → "Open with Live Server"
3. Or use status bar "Go Live" button
4. Check port not blocked by firewall

---

### Issue: CORS error in browser console

**Check:**
1. Backend is running? (http://localhost:3001/health)
2. Backend logs show CORS allowed for localhost?
3. Browser cache cleared? (Ctrl+Shift+R)
4. Using correct port in frontend?

**Fix:**
```javascript
// Check backend/server.js has localhost regex
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
```

---

## 💡 Pro Tips

### Tip 1: Keep Backend Running
Leave backend terminal open throughout testing session. Don't restart unnecessarily.

### Tip 2: Use Incognito Mode
Test in incognito to avoid cache issues:
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P

### Tip 3: Monitor Backend Logs
Watch backend terminal for errors during testing. Helps catch issues early.

### Tip 4: Test Incrementally
Don't test everything at once. Test one feature, verify, then move to next.

### Tip 5: Document Everything
Screenshot errors, note steps to reproduce. Makes bug fixing easier.

---

## 📊 Comparison: Local vs Production

After local testing, compare with production issues:

| Aspect | Local | Production | Conclusion |
|--------|-------|------------|------------|
| Backend | ✅ Works | ❌ Timeout | Infrastructure issue |
| Frontend | ✅ Works | ❌ 404 | Deployment issue |
| CORS | ✅ Works | ❌ Blocked | Config not synced |
| Features | ✅ Works | ❓ Can't test | Code is fine |

**Analysis:**
- Code works perfectly local
- Production issues are infrastructure/deployment
- Not code bugs
- → Fix production config, not code

---

## ✅ Final Checklist

Before declaring "Local testing complete":

- [ ] Completed all 5 phases
- [ ] Passed 15+ feature checks (75%+)
- [ ] Documented findings
- [ ] No critical bugs found
- [ ] Ready to fix production (code verified working)

**If all checked → 🎉 Local testing PASSED!**

**Next step:** Use PRODUCTION-FIX-GUIDE.md to fix production infrastructure.

---

## 🎓 What We Learned

### If local tests pass (expected):
✅ **Code is GOOD**  
✅ **Problem is production infrastructure**  
✅ **Follow PRODUCTION-FIX-GUIDE.md to restore production**

### If local tests fail:
❌ **Code has bugs**  
❌ **Need to fix code first**  
❌ **Don't deploy until local works**

---

**Created:** 2026-07-01  
**Purpose:** Verify code works before fixing production  
**Expected Outcome:** 90-100% tests pass locally  
**Next Action:** Fix production using PRODUCTION-FIX-GUIDE.md
