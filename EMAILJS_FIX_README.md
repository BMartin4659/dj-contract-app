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
2. When prompted, press Enter to use the default key or enter your EmailJS public key
   - The default key is already set to: `PRPjY6zE2LkFb3a25`
3. Restart your development server:
   ```
   npm run dev
   ```

### Option 2: Use the Node.js Script

1. Run the fix script with your EmailJS public key:
   ```
   node fix-emailjs.js PRPjY6zE2LkFb3a25
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
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_p87ey1j
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=PRPjY6zE2LkFb3a25
   
   # Google Maps API Key (if needed)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc
   ```
3. Restart your development server:
   ```
   npm run dev
   ```

## Verifying the Fix

Once you've applied the fix:

1. Check that your browser console no longer shows the "Error sending email: {}" message
2. Test sending a confirmation email on the payment success page
3. Verify that emails are being sent after successful Stripe payments

## Affected Components

The EmailJS configuration affects two components:
1. `components/StripeCheckout.js` - Sends emails after successful payment
2. `app/payment/success/page.js` - Allows manual resending of confirmation emails

## Troubleshooting

If you're still experiencing issues:

1. Check your browser console for additional error information
2. Try using a different web browser to rule out CORS or caching issues
3. Make sure your EmailJS account is active and not hitting rate limits
4. Ensure the template parameters match those expected by your template
5. Inspect network traffic in the browser dev tools to see the exact request/response

## Additional Resources

For more detailed information about EmailJS integration, refer to:
1. The EmailJS documentation at https://www.emailjs.com/docs/sdk/send/
2. The `EMAILJS_SETUP.md` file in your project 