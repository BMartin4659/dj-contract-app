# EmailJS Setup Instructions

## Overview
This application uses EmailJS to send booking confirmation emails after successful payments. Follow these instructions to set up your EmailJS account and configure the application to use it.

## Step 1: Create an EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/) and create an account
2. Verify your email address

## Step 2: Configure an Email Service
1. In the EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account

## Step 3: Create an Email Template
1. In the EmailJS dashboard, go to "Email Templates"
2. Click "Create New Template"
3. Design your template with the following variables:
   - `{{to_name}}` - Recipient's name
   - `{{to_email}}` - Recipient's email address
   - `{{from_name}}` - Sender's name
   - `{{event_type}}` - Type of event
   - `{{event_date}}` - Date of event
   - `{{venue_name}}` - Name of venue
   - `{{venue_location}}` - Location of venue
   - `{{payment_id}}` - Stripe payment ID
   - `{{payment_method}}` - Payment method used
   - `{{total_amount}}` - Total amount paid
   - `{{message}}` - Additional message
4. Save your template and note the Template ID (e.g., "template_booking_confirmation")

## Step 4: Set Environment Variables
Create a `.env.local` file in the root of your project with the following:

```
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

Replace the placeholder values with:
- `your_service_id`: Found in EmailJS dashboard > Email Services
- `your_template_id`: Found in EmailJS dashboard > Email Templates
- `your_public_key`: Found in EmailJS dashboard > Account > API Keys

## Step 5: Restart Your Development Server
After setting up the environment variables, restart your development server:

```bash
npm run dev
```

## Troubleshooting
If you encounter an empty error object (`Error sending email: {}`), it usually indicates:
1. Missing or incorrect environment variables
2. CORS or network issues
3. Permissions problems with EmailJS

Solutions:
- Verify your API keys are correct
- Check that your EmailJS service is active
- Ensure your template has all required parameters
- Try using the direct API call (implemented as a fallback in the code) 