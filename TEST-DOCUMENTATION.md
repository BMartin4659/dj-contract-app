# DJ Contract App Testing Documentation

## Overview
This document provides testing instructions for the DJ Contract App, focusing on payment method integration and form submission.

## Prerequisites
- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Development server running (`npm run dev`)

## Environment Variables
Ensure the following environment variables are properly set in your `.env.local` file:

```
NEXT_PUBLIC_VENMO_URL=https://venmo.com/u/Bobby-Martin-64
NEXT_PUBLIC_CASHAPP_URL=https://cash.app/$BobbyMartin64
NEXT_PUBLIC_PAYPAL_URL=https://paypal.me/bmartin4659
```

## Test Cases

### Test Case 1: Form Submission with Venmo Payment
1. Navigate to http://localhost:3000
2. Fill out the DJ Contract form with the following test data:
   - Client Name: Test Client
   - Email: test@example.com
   - Contact Phone: 1234567890
   - Event Type: Wedding
   - Guest Count: 100
   - Venue Name: Test Venue
   - Venue Location: 123 Test St, City, State 12345
   - Event Date: 2025-05-15
   - Start Time: 6:00 PM
   - End Time: 10:00 PM
   - Select Venmo as payment method
   - Add optional services as desired
   - Check "Agree to Terms"
3. Click "Submit Contract"
4. Verify a new browser tab opens to `https://venmo.com/u/Bobby-Martin-64`
5. Verify the confirmation page appears with correct information
6. Verify the Venmo payment option appears on the success page
7. Click "Open Venmo" and verify it navigates to the correct Venmo URL

### Test Case 2: Form Submission with CashApp Payment
1. Navigate to http://localhost:3000
2. Fill out the form as above but select CashApp as payment method
3. Click "Submit Contract"
4. Verify a new browser tab opens to `https://cash.app/$BobbyMartin64`
5. Verify the confirmation page appears with correct information
6. Verify the CashApp payment option appears on the success page
7. Click "Open CashApp" and verify it navigates to the correct CashApp URL

### Test Case 3: Form Submission with PayPal Payment
1. Navigate to http://localhost:3000
2. Fill out the form as above but select PayPal as payment method
3. Click "Submit Contract"
4. Verify a new browser tab opens to `https://paypal.me/bmartin4659`
5. Verify the confirmation page appears with correct information
6. Verify the PayPal payment option appears on the success page
7. Click "Open PayPal" and verify it navigates to the correct PayPal URL

### Test Case 4: Success Page Payment Options
1. Navigate directly to the success page
2. Verify all payment options appear:
   - Venmo: @Bobby-Martin-64
   - CashApp: $BobbyMartin64
   - PayPal: paypal.me/bmartin4659
3. Click on each payment button and verify they open the correct URLs

## Expected Results
- All form submissions should process successfully
- Each payment method should open the correct URL
- The success page should display all payment options correctly
- The email confirmation should be sent successfully

## Troubleshooting
If any issues occur:
1. Check browser console for JavaScript errors
2. Verify environment variables are set correctly
3. Restart the development server
4. Clear browser cache and cookies 