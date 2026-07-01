# ============================================================
# PRODUCTION DEPLOYMENT GUIDE (Interactive)
# ============================================================
# This script guides you through deploying to production
# ============================================================

$ErrorActionPreference = "Continue"

function Write-Step {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host ""
    Write-Host "========================================" -ForegroundColor $Color
    Write-Host "  $Message" -ForegroundColor $Color
    Write-Host "========================================" -ForegroundColor $Color
    Write-Host ""
}

function Write-Action {
    param([string]$Message)
    Write-Host "👉 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Confirm-Action {
    param([string]$Message)
    Write-Host ""
    Write-Host "$Message (Y/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    return ($response -eq "Y" -or $response -eq "y")
}

Clear-Host

Write-Step "PRODUCTION DEPLOYMENT WIZARD" "Green"

Write-Host "This script will guide you through deploying to production." -ForegroundColor White
Write-Host ""
Write-Host "Production URLs:" -ForegroundColor Cyan
Write-Host "  Backend:  https://clb-vo-co-truyen-hutech.onrender.com" -ForegroundColor White
Write-Host "  Frontend: https://vo-co-truyen-hutech.netlify.app" -ForegroundColor White
Write-Host ""

# Step 0: Pre-flight check
Write-Step "STEP 0: PRE-FLIGHT CHECK"

Write-Action "Checking backend status..."
try {
    $backendHealth = Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health" -Method GET -TimeoutSec 10
    if ($backendHealth.success) {
        Write-Success "Backend is ONLINE"
        Write-Info "Uptime: $([math]::Round($backendHealth.uptime/60, 1)) minutes"
        Write-Info "Database: $($backendHealth.database.message)"
        $backendOnline = $true
    } else {
        Write-Error "Backend is responding but health check failed"
        $backendOnline = $false
    }
} catch {
    Write-Error "Backend is OFFLINE or unreachable"
    Write-Info "This might be normal if Render is sleeping (free tier)"
    $backendOnline = $false
}

Write-Action "Checking frontend status..."
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://vo-co-truyen-hutech.netlify.app" -Method GET -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend is ONLINE"
        $frontendOnline = $true
    } else {
        Write-Error "Frontend returned HTTP $($frontendResponse.StatusCode)"
        $frontendOnline = $false
    }
} catch {
    Write-Error "Frontend is OFFLINE (404 or unreachable)"
    $frontendOnline = $false
}

Write-Action "Checking CORS configuration..."
try {
    $corsTest = curl.exe -s -w "%{http_code}" `
        -H "Origin: https://vo-co-truyen-hutech.netlify.app" `
        -H "Access-Control-Request-Method: POST" `
        -X OPTIONS "https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login" `
        -o nul 2>&1
    
    $statusCode = $corsTest | Select-Object -Last 1
    
    if ($statusCode -eq "204" -or $statusCode -eq "200") {
        Write-Success "CORS is configured correctly"
        $corsOk = $true
    } else {
        Write-Error "CORS is blocking Netlify (HTTP $statusCode)"
        $corsOk = $false
    }
} catch {
    Write-Error "Cannot test CORS"
    $corsOk = $false
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "Pre-flight Summary:" -ForegroundColor Cyan
Write-Host "  Backend:  $(if ($backendOnline) { '✅ Online' } else { '❌ Offline' })" -ForegroundColor $(if ($backendOnline) { "Green" } else { "Red" })
Write-Host "  Frontend: $(if ($frontendOnline) { '✅ Online' } else { '❌ Offline' })" -ForegroundColor $(if ($frontendOnline) { "Green" } else { "Red" })
Write-Host "  CORS:     $(if ($corsOk) { '✅ OK' } else { '❌ Needs Fix' })" -ForegroundColor $(if ($corsOk) { "Green" } else { "Red" })
Write-Host "----------------------------------------" -ForegroundColor Gray

$readyToDeploy = $backendOnline -and $frontendOnline -and $corsOk

if ($readyToDeploy) {
    Write-Host ""
    Write-Success "🎉 PRODUCTION IS READY!"
    Write-Host ""
    Write-Host "All systems are online and configured correctly." -ForegroundColor Green
    Write-Host "You can access the site at:" -ForegroundColor Cyan
    Write-Host "  https://vo-co-truyen-hutech.netlify.app" -ForegroundColor White
    Write-Host ""
    
    if (Confirm-Action "Do you want to run comprehensive QA tests?") {
        Write-Host ""
        Write-Action "Running QA test suite..."
        & ".\scripts\comprehensive-qa-test.ps1"
    }
    
    Write-Host ""
    Write-Success "Deployment complete! 🚀"
    exit 0
}

# If not ready, guide through fixes
Write-Host ""
Write-Host "⚠️  Production needs configuration. Let's fix it step by step." -ForegroundColor Yellow
Write-Host ""

if (-not (Confirm-Action "Continue with guided deployment?")) {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 1: Fix CORS
if (-not $corsOk) {
    Write-Step "STEP 1: FIX CORS CONFIGURATION"
    
    Write-Host "The backend is blocking requests from Netlify." -ForegroundColor Yellow
    Write-Host "You need to update the CORS_ORIGIN environment variable on Render." -ForegroundColor White
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open Render Dashboard: https://dashboard.render.com" -ForegroundColor White
    Write-Host "2. Click on service: clb-vo-co-truyen-hutech" -ForegroundColor White
    Write-Host "3. Go to 'Environment' tab" -ForegroundColor White
    Write-Host "4. Find variable: CORS_ORIGIN" -ForegroundColor White
    Write-Host "5. Click 'Edit'" -ForegroundColor White
    Write-Host "6. Set value to:" -ForegroundColor White
    Write-Host ""
    Write-Host "   https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://vo-co-truyen-hutech.netlify.app" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "7. Click 'Save Changes'" -ForegroundColor White
    Write-Host "8. Wait 30-60 seconds for backend to restart" -ForegroundColor White
    Write-Host ""
    
    if (Confirm-Action "Have you updated CORS_ORIGIN and waited for restart?") {
        Write-Action "Testing CORS configuration..."
        Start-Sleep -Seconds 2
        
        try {
            $corsTest = curl.exe -s -w "%{http_code}" `
                -H "Origin: https://vo-co-truyen-hutech.netlify.app" `
                -H "Access-Control-Request-Method: POST" `
                -X OPTIONS "https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login" `
                -o nul 2>&1
            
            $statusCode = $corsTest | Select-Object -Last 1
            
            if ($statusCode -eq "204" -or $statusCode -eq "200") {
                Write-Success "CORS is now configured correctly!"
                $corsOk = $true
            } else {
                Write-Error "CORS still blocking (HTTP $statusCode)"
                Write-Info "Please double-check the CORS_ORIGIN value has NO SPACES between domains"
                Write-Info "And verify the backend has restarted (check Render dashboard)"
            }
        } catch {
            Write-Error "Cannot test CORS"
        }
    } else {
        Write-Host "Please complete CORS configuration before continuing." -ForegroundColor Yellow
        Write-Host "Run this script again when ready." -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Fix Frontend
if (-not $frontendOnline) {
    Write-Step "STEP 2: FIX FRONTEND DEPLOYMENT"
    
    Write-Host "The frontend is returning 404 or is not deployed." -ForegroundColor Yellow
    Write-Host "You need to check and redeploy on Netlify." -ForegroundColor White
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open Netlify Dashboard: https://app.netlify.com" -ForegroundColor White
    Write-Host "2. Click on site: vo-co-truyen-hutech" -ForegroundColor White
    Write-Host "3. Check deployment status" -ForegroundColor White
    Write-Host ""
    Write-Host "If deployment failed or not deployed:" -ForegroundColor Yellow
    Write-Host "  4. Go to 'Site settings' → 'Build & deploy'" -ForegroundColor White
    Write-Host "  5. Verify 'Publish directory' = website" -ForegroundColor White
    Write-Host "  6. Verify 'Build command' = (empty)" -ForegroundColor White
    Write-Host "  7. Go to 'Deploys' tab" -ForegroundColor White
    Write-Host "  8. Click 'Trigger deploy' → 'Clear cache and deploy site'" -ForegroundColor White
    Write-Host "  9. Wait 1-2 minutes for deployment to complete" -ForegroundColor White
    Write-Host ""
    
    if (Confirm-Action "Have you redeployed on Netlify and deployment is complete?") {
        Write-Action "Testing frontend accessibility..."
        Start-Sleep -Seconds 2
        
        try {
            $frontendResponse = Invoke-WebRequest -Uri "https://vo-co-truyen-hutech.netlify.app" -Method GET -TimeoutSec 10
            if ($frontendResponse.StatusCode -eq 200) {
                Write-Success "Frontend is now ONLINE!"
                $frontendOnline = $true
            } else {
                Write-Error "Frontend still not accessible"
            }
        } catch {
            Write-Error "Frontend still offline"
            Write-Info "Check Netlify build logs for errors"
        }
    } else {
        Write-Host "Please complete frontend deployment before continuing." -ForegroundColor Yellow
        Write-Host "Run this script again when ready." -ForegroundColor Yellow
        exit 1
    }
}

# Step 3: Wake up backend
if (-not $backendOnline) {
    Write-Step "STEP 3: WAKE UP BACKEND"
    
    Write-Host "The backend is offline or sleeping (normal for Render free tier)." -ForegroundColor Yellow
    Write-Host ""
    Write-Action "Sending wake-up request to backend..."
    
    try {
        $backendHealth = Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health" -Method GET -TimeoutSec 60
        if ($backendHealth.success) {
            Write-Success "Backend is now ONLINE!"
            $backendOnline = $true
        } else {
            Write-Error "Backend responded but health check failed"
        }
    } catch {
        Write-Error "Backend did not wake up"
        Write-Host ""
        Write-Info "Please check Render dashboard for errors:"
        Write-Host "  https://dashboard.render.com" -ForegroundColor White
        Write-Host ""
        Write-Info "Common fixes:"
        Write-Host "  - Check service logs for errors" -ForegroundColor White
        Write-Host "  - Verify DATABASE_URL is set correctly" -ForegroundColor White
        Write-Host "  - Try manual restart from dashboard" -ForegroundColor White
    }
}

# Final verification
Write-Step "STEP 4: FINAL VERIFICATION"

$allGood = $backendOnline -and $frontendOnline -and $corsOk

if ($allGood) {
    Write-Success "🎉 ALL SYSTEMS ONLINE!"
    Write-Host ""
    Write-Host "Production URLs:" -ForegroundColor Cyan
    Write-Host "  Homepage: https://vo-co-truyen-hutech.netlify.app" -ForegroundColor White
    Write-Host "  Admin:    https://vo-co-truyen-hutech.netlify.app/admin/" -ForegroundColor White
    Write-Host "  Backend:  https://clb-vo-co-truyen-hutech.onrender.com" -ForegroundColor White
    Write-Host ""
    
    if (Confirm-Action "Run comprehensive QA test suite?") {
        Write-Host ""
        & ".\scripts\comprehensive-qa-test.ps1"
    }
    
    Write-Host ""
    Write-Host "✅ Manual Testing Checklist:" -ForegroundColor Cyan
    Write-Host "  1. Open homepage and verify it loads" -ForegroundColor White
    Write-Host "  2. Test contact form submission" -ForegroundColor White
    Write-Host "  3. Login to admin panel" -ForegroundColor White
    Write-Host "  4. Check dashboard statistics" -ForegroundColor White
    Write-Host "  5. Test one CRUD operation (e.g., add news)" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Recommended Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Set up monitoring (UptimeRobot): https://uptimerobot.com" -ForegroundColor White
    Write-Host "  2. Test from mobile device" -ForegroundColor White
    Write-Host "  3. Share site with stakeholders" -ForegroundColor White
    Write-Host ""
    Write-Success "🚀 DEPLOYMENT SUCCESSFUL!"
    
} else {
    Write-Error "Some issues remain unresolved:"
    Write-Host "  Backend:  $(if ($backendOnline) { '✅' } else { '❌' })" -ForegroundColor $(if ($backendOnline) { "Green" } else { "Red" })
    Write-Host "  Frontend: $(if ($frontendOnline) { '✅' } else { '❌' })" -ForegroundColor $(if ($frontendOnline) { "Green" } else { "Red" })
    Write-Host "  CORS:     $(if ($corsOk) { '✅' } else { '❌' })" -ForegroundColor $(if ($corsOk) { "Green" } else { "Red" })
    Write-Host ""
    Write-Info "Please review the error messages above and try again."
    Write-Info "Reference: PRODUCTION-FIX-GUIDE.md for detailed troubleshooting"
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
