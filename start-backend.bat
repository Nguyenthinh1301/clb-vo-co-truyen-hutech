@echo off
echo ========================================
echo   STARTING BACKEND SERVER
echo ========================================
echo.
echo Checking if backend is already running...
netstat -ano | findstr :3001 >nul
if %errorlevel%==0 (
    echo [WARNING] Backend is already running on port 3001
    echo.
    echo Options:
    echo   1. Close this window and use existing backend
    echo   2. Kill existing process and restart
    echo.
    choice /C 12 /N /M "Choose option (1 or 2): "
    if errorlevel 2 (
        echo Killing existing backend process...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 >nul
    ) else (
        echo Keeping existing backend. Exiting...
        timeout /t 3
        exit /b 0
    )
)

echo.
echo Navigating to backend directory...
cd backend

echo.
echo Starting backend with npm run dev...
echo.
echo ========================================
echo   Backend will start in a moment...
echo   Press Ctrl+C to stop backend
echo ========================================
echo.

npm run dev

pause
