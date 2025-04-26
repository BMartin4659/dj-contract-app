# Script to set Firebase Functions email configuration

Write-Host "Setting up Firebase Functions Email Configuration" -ForegroundColor Green
Write-Host "This script will help you set up the necessary email configuration for your Firebase Functions." -ForegroundColor Cyan
Write-Host ""

# Get email credentials from .env.local
$envFile = ".env.local"
$emailUser = ""
$emailPassword = ""

if (Test-Path $envFile) {
    Write-Host "Reading email configuration from .env.local..." -ForegroundColor Yellow
    $envContent = Get-Content $envFile
    
    foreach ($line in $envContent) {
        if ($line -match "EMAIL_SENDER=(.*)") {
            $emailUser = $Matches[1]
        }
        if ($line -match "EMAIL_PASSWORD=(.*)") {
            $emailPassword = $Matches[1]
        }
    }
}

# If not found in .env.local, ask user for input
if ([string]::IsNullOrEmpty($emailUser)) {
    $emailUser = Read-Host "Enter email address for sending emails"
}

if ([string]::IsNullOrEmpty($emailPassword)) {
    $emailPassword = Read-Host "Enter email password (app password recommended)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
    $emailPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Set Firebase Functions configuration
Write-Host "Setting Firebase Functions email configuration..." -ForegroundColor Yellow
firebase functions:config:set email.user="$emailUser" email.password="$emailPassword"

Write-Host "Configuration set successfully!" -ForegroundColor Green
Write-Host "Now you can deploy your functions with: firebase deploy --only functions:sendConfirmationEmail" -ForegroundColor Cyan 