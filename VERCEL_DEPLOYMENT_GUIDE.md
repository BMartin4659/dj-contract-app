# Vercel Deployment Guide

## Fixing EmailJS Configuration

To resolve the 422 errors from EmailJS, you need to update your environment variables in Vercel. Follow these steps:

1. Log in to your [Vercel dashboard](https://vercel.com)
2. Select your DJ Contract App project
3. Navigate to "Settings" → "Environment Variables"

### Required Environment Variables

Add or update the following environment variables:

| Variable Name | Purpose | Value Example |
|---------------|---------|---------------|
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Your EmailJS service ID | `service_9z9konq` |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Your EmailJS template ID | `template_booking_confirmation` |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Your EmailJS public key | `YOUR_PUBLIC_KEY` |

**Important:** The app is currently using the deprecated `USER_ID` approach. You need to add the new `PUBLIC_KEY` environment variable to fix the email sending issues.

### Deployment Environment Scope

Make sure to check the appropriate deployment environments (Production, Preview, Development) where these variables should apply.

## Creating Your EmailJS Account

If you haven't set up EmailJS yet:

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create a service (like Gmail, Outlook, etc.)
3. Create an email template with the following parameters:
   - `to_name` - Recipient's name
   - `to_email` - Recipient's email address
   - `from_name` - Sender name (Live City DJ)
   - `event_type` - Type of event
   - `event_date` - Date of event
   - `venue_name` - Venue name
   - `venue_location` - Venue location
   - `payment_id` - Stripe payment ID
   - `payment_method` - Payment method used
   - `total_amount` - Total amount paid
   - `message` - Additional message

4. Copy your service ID and template ID from the EmailJS dashboard
5. Get your public key from the EmailJS dashboard (Account → API Keys)

## Testing After Deployment

After adding these environment variables:

1. Redeploy your application or restart the existing deployment
2. Test the booking flow with Stripe payment
3. Check if the confirmation email is sent
4. Test the "Resend Confirmation Email" button on the success page

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify that all template parameters in the app match your EmailJS template
3. Ensure your EmailJS service is active and has sufficient email quota
4. Check that the CORS domain settings in EmailJS allow your Vercel domain 