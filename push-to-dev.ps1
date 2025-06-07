#!/usr/bin/env pwsh

# Script to commit and push changes to the dev branch
# Usage: .\push-to-dev.ps1 "Your commit message"

# Check if commit message was provided
if (-not $args[0]) {
    Write-Host "Error: Please provide a commit message" -ForegroundColor Red
    Write-Host "Usage: .\push-to-dev.ps1 `"Your commit message`"" -ForegroundColor Yellow
    exit 1
}

$commitMessage = $args[0]

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD

# Stage all changes
Write-Host "Staging changes..." -ForegroundColor Cyan
git add .

# Commit changes
Write-Host "Committing changes with message: $commitMessage" -ForegroundColor Cyan
git commit -m "$commitMessage"

# Push to dev branch
Write-Host "Pushing changes to dev branch..." -ForegroundColor Cyan
git push origin HEAD:dev

Write-Host "`nSuccessfully pushed changes to dev branch!" -ForegroundColor Green
Write-Host "Note: You are still on the '$currentBranch' branch." -ForegroundColor Yellow 