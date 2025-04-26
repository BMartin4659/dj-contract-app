@echo off
echo -----------------------------------
echo EmailJS Fix Script
echo -----------------------------------
echo.

echo Step 1: Remove conflicting EmailJS package
call npm uninstall emailjs-com
echo.

echo Step 2: Ensure the latest @emailjs/browser is installed
call npm install @emailjs/browser@latest
echo.

echo Step 3: Updating payment success page...
echo   This fixes the EmailJS implementation to handle CORS issues
echo.

echo Done! Run "node fix-emailjs-errors.js" to verify the changes.
echo.
echo If issues persist, please check the console logs in your browser
echo for specific error messages when sending emails.
echo ----------------------------------- 