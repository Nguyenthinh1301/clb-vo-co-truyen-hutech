@echo off
:: Kill bat cu dang chiem port 3001 neu co
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
:: Khoi dong lai backend qua PM2
pm2 resurrect
