// Example of how to use the updated sendConfirmationEmail HTTP endpoint in your Next.js frontend

import { useState } from 'react';

// Example component demonstrating confirmation email using HTTP approach
export default function EmailConfirmation({ contractDetails }) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);

  const sendConfirmationEmail = async () => {
    try {
      setIsSending(true);
      setError(null);
      
      // Use Firebase function URL
      const functionUrl = 'https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net/sendConfirmationEmail';
      
      // Prepare email data
      const emailData = {
        clientName: contractDetails.clientName,
        email: contractDetails.email, // The recipient's email
        eventType: contractDetails.eventType,
        eventDate: contractDetails.eventDate,
        venueName: contractDetails.venueName,
        venueLocation: contractDetails.venueLocation,
        startTime: contractDetails.startTime,
        endTime: contractDetails.endTime,
        paymentId: contractDetails.paymentId || 'N/A',
        totalAmount: contractDetails.totalAmount
      };
      
      // Send the HTTP request
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setEmailSent(true);
        console.log('✅ Confirmation email sent successfully!', result);
      } else {
        setError(result.error || 'Failed to send email');
        console.error('Error response:', result);
      }
    } catch (err) {
      console.error('❌ Error sending confirmation email:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="email-confirmation">
      <button 
        onClick={sendConfirmationEmail}
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
          <p>Email sent to: {contractDetails.email}</p>
        </div>
      )}
    </div>
  );
} 