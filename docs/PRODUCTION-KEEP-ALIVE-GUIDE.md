# 🚀 Hướng Dẫn Setup Keep-Alive cho Production Backend

## Vấn Đề

Render.com free tier sẽ "ngủ" backend sau 15 phút không có traffic. Request đầu tiên sau khi ngủ sẽ mất 30-60 giây để khởi động lại (cold start).

## Giải Pháp

Ping backend mỗi 10 phút để giữ cho nó luôn "thức" (awake).

---

## 🔧 Option 1: Cron-Job.org (RECOMMENDED - Miễn phí & Đơn giản)

### Bước 1: Đăng ký tài khoản
1. Truy cập: https://cron-job.org
2. Sign up free account (không cần credit card)
3. Xác nhận email

### Bước 2: Tạo Cron Job
1. Click **"Create cronjob"**
2. Điền thông tin:
   - **Title:** `Render Backend Keep-Alive`
   - **URL:** `https://clb-vo-co-truyen-hutech.onrender.com/health`
   - **Schedule:**
     - Pattern: Every `10` minutes
     - Hoặc dùng cron expression: `*/10 * * * *`
   - **Execution:** 
     - Request method: `GET`
     - Timeout: `30` seconds
   - **Notifications:** (Optional)
     - ✅ Notify on failure
     - Email: your-email@example.com

3. Click **"Create"**

### Bước 3: Verify
1. Đợi 10 phút
2. Check logs trong cron-job.org dashboard
3. Verify backend uptime tại: https://clb-vo-co-truyen-hutech.onrender.com/health

**Kết quả mong đợi:**
```json
{
  "success": true,
  "uptime": 1234567  // Số giây uptime sẽ tăng liên tục, không reset về 0
}
```

---

## 🔧 Option 2: UptimeRobot (Miễn phí + Monitoring)

### Ưu điểm
- Miễn phí cho 50 monitors
- Dashboard đẹp với uptime statistics
- Email/SMS alerts khi backend down
- Public status page

### Setup
1. Đăng ký: https://uptimerobot.com
2. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `CLB Backend`
   - **URL:** `https://clb-vo-co-truyen-hutech.onrender.com/health`
   - **Monitoring Interval:** 5 minutes (free tier)
   - **Alert Contacts:** Your email

3. Enable Public Status Page (optional):
   - Settings > Status Pages > Create
   - Share URL với team

---

## 🔧 Option 3: PowerShell Script (Local - Windows)

### Chạy 1 lần
```powershell
.\scripts\keep-alive-production.ps1 -Once
```

### Chạy liên tục (console)
```powershell
.\scripts\keep-alive-production.ps1 -Verbose
```

### Chạy nền với Task Scheduler

#### Bước 1: Mở Task Scheduler
```
Win + R → taskschd.msc → Enter
```

#### Bước 2: Create Task
1. Action > Create Task
2. **General tab:**
   - Name: `Render Backend Keep-Alive`
   - Description: `Ping Render backend every 10 minutes`
   - ✅ Run whether user is logged on or not
   - ✅ Hidden

3. **Triggers tab:**
   - New
   - Begin: `On a schedule`
   - Settings: `Daily` at `00:00`
   - ✅ Repeat task every: `10 minutes`
   - for a duration of: `Indefinitely`

4. **Actions tab:**
   - New
   - Action: `Start a program`
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "D:\Code\ThongTin-VCT\scripts\keep-alive-production.ps1" -Once`
   - Start in: `D:\Code\ThongTin-VCT`

5. **Conditions tab:**
   - ✅ Start only if on AC power (unchecked for laptop)
   - ✅ Wake the computer to run this task

6. Click **OK** và nhập password Windows

#### Bước 3: Test
```powershell
# Check logs
Get-Content logs/keep-alive.log -Tail 20
```

---

## 🔧 Option 4: GitHub Actions (Free - Chạy trên GitHub)

### Setup
Tạo file `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # Chạy mỗi 10 phút
    - cron: '*/10 * * * *'
  workflow_dispatch: # Cho phép chạy manual

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://clb-vo-co-truyen-hutech.onrender.com/health)
          if [ $response -eq 200 ]; then
            echo "✅ Backend is alive (HTTP $response)"
          else
            echo "❌ Backend returned HTTP $response"
            exit 1
          fi
```

Push lên GitHub:
```bash
git add .github/workflows/keep-alive.yml
git commit -m "chore: add keep-alive workflow"
git push
```

Verify:
- Vào repo GitHub > Actions tab
- Xem workflow "Keep Backend Alive"

---

## 📊 So Sánh Options

| Option | Pros | Cons | Recommended For |
|--------|------|------|-----------------|
| **Cron-Job.org** | ⭐ Đơn giản nhất<br>✅ Free<br>✅ Web dashboard | ❌ Chỉ ping, không monitor | **Most users** |
| **UptimeRobot** | ✅ Free monitoring<br>✅ Alerts<br>✅ Status page | ❌ Setup phức tạp hơn | Users muốn monitoring |
| **Task Scheduler** | ✅ Chạy local<br>✅ Full control | ❌ Máy phải bật 24/7<br>❌ Windows only | Testing |
| **GitHub Actions** | ✅ Free<br>✅ Git-based | ❌ 2000 minutes/month limit<br>❌ Public repo only | Open-source projects |

---

## 🧪 Kiểm Tra Kết Quả

### Test Cold Start (Before Keep-Alive)
```powershell
# Đợi 20 phút không ping
Start-Sleep -Seconds 1200

# Ping và đo thời gian
Measure-Command {
    Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health"
}
# Kết quả: ~30-60 seconds (cold start)
```

### Test After Keep-Alive
```powershell
# Ping bất kỳ lúc nào
Measure-Command {
    Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health"
}
# Kết quả: ~200-500ms (backend awake)
```

### Monitor Uptime
```powershell
# Check uptime liên tục
$result = Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health"
$uptimeHours = [math]::Round($result.uptime / 3600, 2)
Write-Host "Backend uptime: $uptimeHours hours" -ForegroundColor Green
```

Uptime > 1 hour = Keep-alive đang hoạt động ✅

---

## ⚠️ Lưu Ý

### Render Free Tier Limits
- **750 hours/month** free dyno time
- 750 hours / 30 days = 25 hours/day
- Với keep-alive 24/7: ~720 hours/month (OK ✅)

### Khi Nào Cần Upgrade?
- Production app với nhiều users
- Không chấp nhận cold start delay
- Cần guaranteed uptime

**Render Paid Plan:**
- $7/month cho starter instance
- ✅ No cold starts
- ✅ 24/7 uptime
- ✅ More resources

---

## 📞 Troubleshooting

### Issue: Cron job chạy nhưng backend vẫn cold start
**Cause:** Interval quá dài (> 15 minutes)  
**Fix:** Giảm interval xuống 10 minutes

### Issue: GitHub Actions không chạy
**Cause:** Repo private hoặc Actions disabled  
**Fix:** 
```bash
# Enable Actions
Settings > Actions > General > "Allow all actions"
```

### Issue: Task Scheduler không chạy khi laptop sleep
**Cause:** Conditions > "Start only if on AC power"  
**Fix:** Uncheck option này

---

## 🎯 Recommendation

**Cho dự án này (CLB Võ Cổ Truyền HUTECH):**

1. **Short-term (Now):** Setup Cron-Job.org (5 phút)
2. **Mid-term:** Thêm UptimeRobot để monitor uptime (15 phút)
3. **Long-term:** Khi có budget, upgrade Render plan ($7/month)

---

## 📝 Setup Checklist

- [ ] Chọn 1 trong 4 options trên
- [ ] Setup cron job/monitoring
- [ ] Test ping backend
- [ ] Verify uptime > 1 hour
- [ ] Monitor logs/alerts
- [ ] Document setup trong README

---

**Last Updated:** 10/06/2026  
**Status:** ✅ TESTED & WORKING
