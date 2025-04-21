# EmailJS Integration Fix Guide

## Problem Identified
The app was experiencing 422 errors from EmailJS with the error message "Failed to send confirmation email". This occurs in two places:
1. During Stripe checkout after successful payment
2. On the payment success page when manually attempting to send an email

## Root Cause
The issue is caused by incorrect implementation of the EmailJS SDK, specifically:

1. Using `USER_ID` instead of `PUBLIC_KEY` for initialization (EmailJS changed their API)
2. Missing required template parameters in the email requests
3. Incorrect syntax for sending emails (the 4th parameter should not be included)

## How to Fix

### 1. Update Environment Variables

Create or update your `.env.local` or `.env.development.local` file to include:

```
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

To get these values:
1. Create an account at https://www.emailjs.com/
2. Create a service (e.g., Gmail, Outlook)
3. Create an email template with parameters matching the app
4. Get your public key from Account > API Keys
5. Get your service ID and template ID from the dashboard

### 2. Required Template Parameters

Your EmailJS template must have these parameters defined:
- `to_name` - Recipient's name
- `to_email` - Recipient's email address
- `from_name` - Sender's name (we use "Live City DJ")
- `event_type` - Type of event
- `event_date` - Date of event
- `venue_name` - Name of venue
- `venue_location` - Location of venue
- `payment_id` - Stripe payment ID
- `payment_method` - Payment method used
- `total_amount` - Total amount paid
- `message` - Additional message

### 3. Sending Emails Correctly

The correct way to send emails is:

```javascript
// First initialize with public key
emailjs.init(publicKey);

// Then send with only 3 parameters
await emailjs.send(
  serviceId,
  templateId,
  templateParams // Don't include publicKey/userId here
);
```

## Implementation Notes

1. The code has been updated to use the correct approach in both:
   - `components/StripeCheckout.js`
   - `app/payment/success/page.js`

2. Additional error handling has been added to provide more specific error messages

3. The email template parameters have been standardized between both components

## Testing Your Fix

1. Make sure your EmailJS account is properly set up
2. Check that your template contains all required parameters
3. Test the checkout flow and verify emails are sent successfully
4. Test the manual resend on the success page 