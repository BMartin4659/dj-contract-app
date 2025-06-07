# Firebase Setup Guide

## 1. Fixed Issues

### Firebase Initialization Error
The error `FirebaseError: Firebase: No Firebase App '[DEFAULT]' has been created - call initializeApp() first (app/no-app)` has been fixed by:

1. Updating `lib/firebase.js` to properly initialize Firebase and export all services:
   - Added proper app initialization checking
   - Added explicit export of the Firebase Functions service
   - Removed the named app identifier to use the default app

### Firebase Functions Configuration Error
The error `TypeError: Cannot read properties of undefined (reading 'user')` occurs because Firebase Functions needs email configuration to send emails.

## 2. Setup Instructions

### Step 1: Run the Setup Script
Run the setup script to configure your Firebase Functions email credentials:

```powershell
./setup-email-config.ps1
```

This script will:
- Read email credentials from your `.env.local` file
- Ask for input if not found
- Set up Firebase Functions configuration

### Step 2: Deploy the Functions
After setting up the email configuration, deploy your Firebase function:

```powershell
firebase deploy --only functions:sendConfirmationEmail
```

### Step 3: Test the Email Functionality
Navigate to the payment success page and test the "Resend Confirmation Email" button.

## 3. Additional Notes

### Email App Password
For Gmail accounts, you should use an App Password instead of your regular password. To create an app password:

1. Go to your Google Account
2. Navigate to Security → App passwords
3. Select "Other" as the app name
4. Copy the generated password and use that in your configuration

### Firebase Functions Logs
If you encounter issues with sending emails, check the Firebase Functions logs:

```powershell
firebase functions:log
```

### Local Testing
For local testing, you can use:

```powershell
firebase emulators:start --only functions
``` 