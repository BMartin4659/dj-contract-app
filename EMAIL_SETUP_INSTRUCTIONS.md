# Email Confirmation Setup Instructions

This guide will help you set up the email confirmation functionality using Firebase Cloud Functions and Nodemailer.

## Prerequisites

1. Firebase project with Cloud Functions enabled
2. Gmail account for sending emails
3. Firebase CLI installed locally (`npm install -g firebase-tools`)

## Implementation

The email confirmation function has been implemented directly in the `functions/index.js` file with Gmail credentials. This function now accepts flexible HTML content from the client.

### Key Features

- **Flexible Email Content**: Send any HTML content from your frontend
- **Plain Text Fallback**: Include both HTML and plain text versions for compatibility
- **Error Handling**: Better error handling with detailed messages
- **Response Data**: Get confirmation when emails are sent successfully

### Gmail App Password

The function uses a Gmail App Password for authentication. For security reasons, you should never use your regular Gmail password in code. If you need to create or update the App Password:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to Security > App passwords
3. You may need to enable 2-Step Verification first
4. Generate a new app password for "Firebase Functions" 
5. Copy the generated password (16 characters without spaces)
6. Update the `pass` value in the transporter config in `functions/index.js`

## Deploy Your Functions

Deploy the functions to Firebase using the included script:

```bash
.\deploy-functions.bat
```

Or manually:

```bash
cd functions
npm install --save firebase-functions@latest
npm install --save dotenv
npm install
cd ..
firebase deploy --only functions
```

## Using the Email Function

The function now expects the following parameters:

```javascript
const emailPayload = {
  to: "recipient@example.com",         // Email address of recipient
  subject: "Your email subject",       // Subject line
  text: "Plain text version",          // Plain text version (fallback)
  html: "<p>HTML version</p>"          // HTML version of the email
};
```

See `examples/send-email-with-html.js` for a complete example of sending an email with HTML content.

## Example HTML Email Template

```html
<div style="font-family: sans-serif; padding: 20px;">
  <h2 style="color: #3b82f6;">🎉 Booking Confirmed!</h2>
  <p>Hi ${clientName},</p>
  <p>Thank you for booking <strong>Live City DJ</strong> for your event.</p>
  <ul>
    <li><strong>Date:</strong> ${eventDate}</li>
    <li><strong>Venue:</strong> ${venueName}</li>
    <li><strong>Location:</strong> ${location}</li>
    <li><strong>Total:</strong> ${totalAmount}</li>
  </ul>
  <p>We'll see you on the dance floor!</p>
  <p style="margin-top: 30px;">— DJ Bobby Drake 🎧</p>
</div>
```

## Troubleshooting

### Common Issues

1. **Email not sending**: Check that the app password is correct and that your Gmail account is properly configured.

2. **Authentication errors**: If you see authentication errors:
   - Make sure you're using a valid App Password, not your regular Gmail password
   - Check that you've enabled "Less secure app access" in your Google account
   - Ensure your Gmail account isn't locked due to security settings

3. **CORS issues**: If experiencing CORS issues when calling the function, ensure your Firebase project settings allow your domain.

### Gmail Sending Limits

Be aware that Gmail has sending limits:
- 500 emails per day for regular Gmail accounts
- 2,000 emails per day for Google Workspace accounts

For production environments with higher email volumes, consider using a dedicated email service provider like SendGrid, Mailgun, or AWS SES.

## Security Considerations

Note that hard-coding credentials in your function code is not ideal for production environments. For better security:

1. Consider moving credentials to Firebase environment config:
   ```bash
   firebase functions:config:set gmail.email="youremail@gmail.com" gmail.password="app-password"
   ```

2. Then access them in code with:
   ```javascript
   const gmailEmail = functions.config().gmail.email;
   const gmailPass = functions.config().gmail.password;
   ```

## Additional Information

For more details about the implementation, see:
- `functions/index.js` - Contains the email function
- `examples/send-email-with-html.js` - Frontend usage example

# Payment URLs
NEXT_PUBLIC_VENMO_URL=https://venmo.com/u/Bobby-Martin-64
NEXT_PUBLIC_CASHAPP_URL=https://cash.app/$BobbyMartin64
NEXT_PUBLIC_PAYPAL_URL=https://paypal.me/bmartin4659 