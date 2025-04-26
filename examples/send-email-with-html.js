// Example of how to call the updated sendConfirmationEmail function with HTML content
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

export default function SendConfirmationEmail({ contractDetails }) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);

  const sendBookingConfirmation = async () => {
    try {
      setIsSending(true);
      setError(null);
      
      // Get Firebase functions instance
      const functions = getFunctions();
      
      // Create callable function reference
      const sendEmail = httpsCallable(functions, 'sendConfirmationEmail');

      // Create the email payload with HTML content
      const emailPayload = {
        to: contractDetails.email,
        subject: `🎧 Live City DJ Booking Confirmed!`,
        text: `Your booking is confirmed for ${contractDetails.eventDate}.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #3b82f6;">🎉 Booking Confirmed!</h2>
            <p>Hi ${contractDetails.clientName},</p>
            <p>Thank you for booking <strong>Live City DJ</strong> for your <strong>${contractDetails.eventType}</strong>.</p>
            <ul>
              <li><strong>Date:</strong> ${contractDetails.eventDate}</li>
              <li><strong>Venue:</strong> ${contractDetails.venueName}</li>
              <li><strong>Location:</strong> ${contractDetails.venueLocation}</li>
              <li><strong>Total:</strong> ${contractDetails.totalAmount}</li>
            </ul>
            <p>We'll see you on the dance floor!</p>
            <p style="margin-top: 30px;">— DJ Bobby Drake 🎧</p>
          </div>
        `,
      };
      
      // Call the function with the HTML email payload
      const result = await sendEmail(emailPayload);
      
      if (result.data.success) {
        setEmailSent(true);
        console.log('✅ Email sent successfully:', result.data.info);
      } else {
        setError('Failed to send email');
      }
    } catch (err) {
      console.error('❌ Error sending email:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="email-confirmation">
      <button 
        onClick={sendBookingConfirmation}
        disabled={isSending || emailSent}
        className="primary-button"
      >
        {isSending ? 'Sending...' : emailSent ? 'Email Sent! ✅' : 'Send Confirmation Email'}
      </button>
      
      {error && (
        <div className="error-message">
          <p>❌ Error: {error}</p>
        </div>
      )}
      
      {emailSent && (
        <div className="success-message">
          <p>✅ Confirmation email sent successfully!</p>
        </div>
      )}
    </div>
  );
} 