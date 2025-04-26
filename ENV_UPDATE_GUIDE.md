# Environment Variables Update Guide

## Transitioning from EmailJS to Firebase Cloud Functions

This project has been updated to use Firebase Cloud Functions for sending emails instead of EmailJS. Follow these steps to update your environment variables:

### 1. Remove EmailJS Variables

You can safely remove these variables from your `.env.local` file:

```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
NEXT_PUBLIC_EMAILJS_USER_ID=
```

### 2. Keep Other Environment Variables

You should keep all other environment variables such as:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... rest of your Firebase config

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...

# Payment URLs
NEXT_PUBLIC_VENMO_URL=https://venmo.com/u/Bobby-Martin-64
NEXT_PUBLIC_CASHAPP_URL=https://cash.app/$BobbyMartin64
NEXT_PUBLIC_PAYPAL_URL=https://paypal.me/bmartin4659
```

### 3. Deploy Firebase Functions

Make sure your Firebase functions are deployed with:

```bash
firebase deploy --only functions
```

### 4. Email Configuration

The email configuration is now managed directly in the Firebase function (`functions/index.js`). The Gmail credentials are stored in the function code, so there's no need to set additional environment variables.

If you need to change the email address or password, you'll need to update the function code and redeploy.

### 5. Testing

After completing these steps, test the email functionality in your application to ensure everything is working correctly. 