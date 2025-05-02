'use client';

import React from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

/**
 * Payment confirmation banner component
 */
const PaymentConfirmation = ({ show, message, email = 'therealdjbobbydrake@gmail.com' }) => {
  if (!show) return null;
  
  return (
    <div className="payment-confirmation-banner" style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      zIndex: '1000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '15px',
      borderRadius: '0 0 8px 8px'
    }}>
      <div className="payment-confirmation-content" style={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <FaCheckCircle style={{ color: 'green', marginRight: '10px', fontSize: '24px', marginTop: '3px' }} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{message || 'Payment initiated successfully!'}</div>
          <div style={{ fontSize: '0.95rem', marginTop: '5px', color: '#555' }}>
            If you have any questions or concerns, please contact us at <a href={`mailto:${email}`} style={{ color: '#0070f3', textDecoration: 'underline' }}>{email}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Payment confirmation banner with payment method-specific messages
 */
const PaymentConfirmationBanner = ({ paymentMethod, onClose }) => {
  const getMessage = () => {
    switch(paymentMethod) {
      case 'Stripe':
        return 'Redirecting to Stripe for secure payment...';
      case 'Venmo':
        return 'Redirecting to Venmo. Complete your payment to confirm booking.';
      case 'CashApp':
        return 'Redirecting to Cash App. Complete your payment to confirm booking.';
      case 'PayPal':
        return 'Redirecting to PayPal. Complete your payment to confirm booking.';
      default:
        return 'Processing your payment...';
    }
  };

  return (
    <div className="payment-confirmation-banner" style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      zIndex: '1000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      borderRadius: '0 0 8px 8px',
      height: '75px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="confirmation-content" style={{
        padding: '10px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        position: 'relative',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Payment Initiated</h3>
        <p style={{ margin: '0', fontSize: '14px' }}>{getMessage()}</p>
        <button onClick={onClose} className="close-btn" style={{
          position: 'absolute',
          top: '50%',
          right: '0',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer'
        }}>
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

// Export both components
export { PaymentConfirmation, PaymentConfirmationBanner };

// Default export with both components
export default {
  PaymentConfirmation,
  PaymentConfirmationBanner
}; 