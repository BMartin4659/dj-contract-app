'use client';

import React, { useState } from 'react';

/**
 * Simplified StripeCheckout component that redirects to the official Stripe checkout
 */
const StripeCheckout = ({ amount, contractDetails, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert amount from cents to dollars for display
  const displayAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          contractDetails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        // Navigate to the Stripe-hosted checkout page
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Error redirecting to checkout:', err);
      setError(err.message || 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      maxWidth: '500px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: '#333'
      }}>
        Ready to Proceed with Payment
      </h3>
      
      <div style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#4F46E5'
      }}>
        {displayAmount}
      </div>
      
      <div style={{
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        color: '#666',
        textAlign: 'left',
        padding: '0.75rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px'
      }}>
        <p><strong>Event:</strong> {contractDetails?.eventType || 'Event'}</p>
        <p><strong>Date:</strong> {contractDetails?.eventDate || 'TBD'}</p>
        <p><strong>Venue:</strong> {contractDetails?.venueName || 'TBD'}</p>
      </div>
      
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <path d="M13.3333 7.33334H2.66667C1.93029 7.33334 1.33334 7.93029 1.33334 8.66667V13.3333C1.33334 14.0697 1.93029 14.6667 2.66667 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V8.66667C14.6667 7.93029 14.0697 7.33334 13.3333 7.33334Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.66667 7.33334V4.66667C4.66667 3.78262 5.01786 2.93477 5.64298 2.30965C6.2681 1.68453 7.11595 1.33334 8 1.33334C8.88406 1.33334 9.7319 1.68453 10.357 2.30965C10.9821 2.93477 11.3333 3.78262 11.3333 4.66667V7.33334" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {loading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
      
      {error && (
        <div style={{
          color: '#DC2626',
          marginTop: '1rem',
          fontSize: '0.9rem',
          padding: '0.5rem',
          backgroundColor: '#FEF2F2',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{
        marginTop: '1rem',
        fontSize: '0.85rem',
        color: '#6B7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.3333 6.66667H2.66667C1.93333 6.66667 1.33333 7.26667 1.33333 8V13.3333C1.33333 14.0667 1.93333 14.6667 2.66667 14.6667H13.3333C14.0667 14.6667 14.6667 14.0667 14.6667 13.3333V8C14.6667 7.26667 14.0667 6.66667 13.3333 6.66667Z" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.66667 6.66667V4.00001C4.66667 3.29276 4.94762 2.61449 5.44772 2.11439C5.94781 1.61429 6.62609 1.33334 7.33333 1.33334C8.04058 1.33334 8.71885 1.61429 9.21895 2.11439C9.71905 2.61449 10 3.29276 10 4.00001V6.66667" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Secure payment by Stripe
      </div>
    </div>
  );
};

export default StripeCheckout; 