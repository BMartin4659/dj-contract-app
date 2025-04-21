@echo off
echo EmailJS Fix Script
echo ==================
echo.
echo This script will fix EmailJS integration issues in the DJ Contract app.

set /p "public_key=Please enter your EmailJS public key (default: PRPjY6zE2LkFb3a25): "

if "%public_key%"=="" (
  set "public_key=PRPjY6zE2LkFb3a25"
)

echo.
echo Creating .env.local file with your EmailJS configuration...
echo.

(
  echo # EmailJS Configuration
  echo NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_9z9konq
  echo NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_p87ey1j
  echo NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=%public_key%
  echo.
  echo # Existing Google Maps API Key
  echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc
) > .env.local

echo Success: .env.local file has been created/updated with your EmailJS configuration.
echo.
echo Next steps:
echo 1. Run npm run dev to restart your development server
echo 2. Test the email functionality
echo 3. For any remaining issues, check the browser console for more details
echo.

pause 