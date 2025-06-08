@echo off
REM Script to commit and push changes to the dev branch
REM Usage: push-to-dev.bat "Your commit message"

REM Check if commit message was provided
if "%~1"=="" (
    echo Error: Please provide a commit message
    echo Usage: push-to-dev.bat "Your commit message"
    exit /b 1
)

REM Get current branch
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set currentBranch=%%a

REM Stage all changes
echo Staging changes...
git add .

REM Commit changes
echo Committing changes with message: %~1
git commit -m "%~1"

REM Push to dev branch
echo Pushing changes to dev branch...
git push origin HEAD:dev

echo.
echo Successfully pushed changes to dev branch!
echo Note: You are still on the '%currentBranch%' branch. 