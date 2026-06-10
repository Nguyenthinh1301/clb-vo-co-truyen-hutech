# ================================================================
# KEEP-ALIVE SCRIPT - Prevent Render.com Cold Start
# ================================================================
# 
# Render free tier puts services to sleep after 15 minutes of
# inactivity. This script pings the backend every 10 minutes to
# keep it awake.
#
# USAGE:
#   1. Manual: .\scripts\keep-alive-production.ps1
#   2. Task Scheduler (Windows):
#      - Open Task Scheduler
#      - Create Task: "Render Keep-Alive"
#      - Trigger: Every 10 minutes
#      - Action: powershell.exe -File "D:\Code\ThongTin-VCT\scripts\keep-alive-production.ps1"
#   3. Cron job (Alternative - cron-job.org):
#      - Sign up at https://cron-job.org
#      - Create job: GET https://clb-vo-co-truyen-hutech.onrender.com/health
#      - Schedule: Every 10 minutes
# ================================================================

param(
    [int]$Interval = 600,  # 600 seconds = 10 minutes
    [switch]$Once,         # Run once and exit
    [switch]$Verbose
)

$backendUrl = "https://clb-vo-co-truyen-hutech.onrender.com/health"
$logFile = "logs/keep-alive.log"

# Create logs directory if not exists
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $logFile -Value $logMessage
    
    if ($Verbose -or $Level -eq "ERROR") {
        $color = switch ($Level) {
            "INFO"    { "White" }
            "SUCCESS" { "Green" }
            "WARNING" { "Yellow" }
            "ERROR"   { "Red" }
            default   { "Gray" }
        }
        Write-Host $logMessage -ForegroundColor $color
    }
}

function Ping-Backend {
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri $backendUrl -TimeoutSec 30 -UseBasicParsing
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($response.success) {
            $env = $response.environment
            $uptime = [math]::Round($response.uptime / 60, 1)
            Write-Log "Backend is ONLINE | Env: $env | Uptime: $uptime min | Response: $($duration)ms" "SUCCESS"
            return $true
        } else {
            Write-Log "Backend responded but status is not success" "WARNING"
            return $false
        }
    } catch {
        $error = $_.Exception.Message
        Write-Log "Backend ping FAILED: $error" "ERROR"
        return $false
    }
}

# Main loop
Write-Log "=== Keep-Alive Script Started ===" "INFO"
Write-Log "Backend URL: $backendUrl" "INFO"
Write-Log "Interval: $Interval seconds ($([math]::Round($Interval/60, 1)) minutes)" "INFO"

if ($Once) {
    Write-Log "Running in ONCE mode - will exit after single ping" "INFO"
    $result = Ping-Backend
    exit $(if ($result) { 0 } else { 1 })
}

$pingCount = 0
$successCount = 0
$failCount = 0

while ($true) {
    $pingCount++
    Write-Log "--- Ping #$pingCount ---" "INFO"
    
    $result = Ping-Backend
    if ($result) {
        $successCount++
    } else {
        $failCount++
    }
    
    $successRate = if ($pingCount -gt 0) { 
        [math]::Round(($successCount / $pingCount) * 100, 2) 
    } else { 0 }
    
    Write-Log "Stats: Total=$pingCount | Success=$successCount | Failed=$failCount | Rate=$successRate%" "INFO"
    
    if (-not $Once) {
        Write-Log "Sleeping for $Interval seconds..." "INFO"
        Start-Sleep -Seconds $Interval
    } else {
        break
    }
}

Write-Log "=== Keep-Alive Script Stopped ===" "INFO"
