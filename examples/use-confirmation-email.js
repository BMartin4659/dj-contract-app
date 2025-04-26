// Example of how to use the sendConfirmationEmail function in your Next.js frontend

import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

// Example component demonstrating confirmation email
export default function EmailConfirmation({ contractDetails }) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);

  const sendConfirmationEmail = async () => {
    try {
      setIsSending(true);
      setError(null);
      
      // Get Firebase functions instance
      const functions = getFunctions();
      
      // Create callable function reference
      const sendEmail = httpsCallable(functions, 'sendConfirmationEmail');
      
      // Call the function with required parameters
      const result = await sendEmail({
        to: contractDetails.email,
        clientName: contractDetails.clientName,
        eventType: contractDetails.eventType,
        eventDate: contractDetails.eventDate,
        venueName: contractDetails.venueName,
        venueLocation: contractDetails.venueLocation,
        totalAmount: contractDetails.totalAmount
      });
      
      if (result.data.success) {
        setEmailSent(true);
        console.log('Confirmation email sent successfully!');
      } else {
        setError(result.data.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending confirmation email:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <button 
        onClick={sendConfirmationEmail}
        disabled={isSending || emailSent}
        className="primary-button"
      >
        {isSending ? 'Sending...' : emailSent ? 'Email Sent!' : 'Send Confirmation Email'}
      </button>
      
      {error && <p className="error-message">Error: {error}</p>}
      {emailSent && <p className="success-message">Confirmation email sent successfully!</p>}
    </div>
  );
} 