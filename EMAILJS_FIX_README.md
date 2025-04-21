# EmailJS Fix Guide

## The Problem
Your application is encountering errors when trying to send emails via EmailJS:
```
Error: Error sending email: {}
```

This empty error object typically indicates authentication or configuration issues with EmailJS.

## Root Cause
The issue is caused by missing or incorrect EmailJS environment variables, specifically:
1. The EmailJS public key is missing from your environment configuration
2. The `.env.local` file either doesn't exist or has incorrect values

## The Fix

### Option 1: Use the Automated Fix Script (Windows)

1. Run the `fix-emailjs.bat` file included in this repository
2. When prompted, enter your EmailJS public key
   - You can find this in your EmailJS dashboard under Account > API Keys
3. Restart your development server:
   ```
   npm run dev
   ```

### Option 2: Use the Node.js Script

1. Run the fix script with your EmailJS public key:
   ```
   node fix-emailjs.js YOUR_PUBLIC_KEY_HERE
   ```
2. Restart your development server:
   ```
   npm run dev
   ```

### Option 3: Manual Fix

1. Create a `.env.local` file in the root of your project
2. Add the following content:
   ```
   # EmailJS Configuration
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_9z9konq
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_booking_confirmation
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
   
   # Google Maps API Key (if needed)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc
   ```
3. Replace `YOUR_PUBLIC_KEY_HERE` with your actual EmailJS public key
4. Restart your development server:
   ```
   npm run dev
   ```

## Getting Your EmailJS Public Key

1. Log in to your EmailJS account at https://dashboard.emailjs.com/admin/
2. Go to Account > API Keys
3. Copy your "Public Key"

## Affected Components

The EmailJS configuration affects two components:
1. `components/StripeCheckout.js` - Sends emails after successful payment
2. `app/payment/success/page.js` - Allows manual resending of confirmation emails

## Troubleshooting

If you're still experiencing issues:

1. Check your browser console for additional error information
2. Verify that your EmailJS account is active and not limited
3. Make sure the template parameters match those expected by your template
4. Test if the direct API call fallback works (already implemented in the code)

## Additional Resources

For more detailed information about EmailJS integration, refer to:
1. The EmailJS documentation at https://www.emailjs.com/docs/
2. The `EMAILJS_SETUP.md` file in your project 