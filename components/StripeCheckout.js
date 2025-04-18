'use client';

import React, { useState, useEffect } from 'react';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Add notice about HTTPS requirement
const StripeHttpsNotice = () => {
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div style={{
        backgroundColor: '#FFF9C4',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#5D4037',
        marginBottom: '12px',
        border: '1px solid #FFE082'
      }}>
        <strong>Development Mode:</strong> Stripe is running in test mode. In production, HTTPS is required.
      </div>
    );
  }
  return null;
};

const CheckoutForm = ({ amount, onSuccess, contractDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  
  // Extract services from contract details
  const services = {
    basePackage: true, // Always included
    lighting: contractDetails?.lighting || false,
    photography: contractDetails?.photography || false,
    videoVisuals: contractDetails?.videoVisuals || false,
    additionalHours: contractDetails?.additionalHours || 0
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    if (!confirmed) {
      setError("Please confirm your services before proceeding with payment");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Add timeout to prevent freezing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Determine base URL - ensure HTTPS in production
      let baseURL = '';
      if (typeof window !== 'undefined') {
        // In browser context
        const protocol = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production' 
          ? 'https' 
          : window.location.protocol.replace(':', '');
        const host = process.env.NEXT_PUBLIC_VERCEL_URL || window.location.host;
        baseURL = `${protocol}://${host}`;
      } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        // In server context with Vercel
        baseURL = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
      }
      
      const response = await fetch(`${baseURL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          clientName: contractDetails?.clientName || 'Customer',
          email: contractDetails?.email || 'customer@example.com',
          eventType: contractDetails?.eventType || 'Event',
          eventDate: contractDetails?.eventDate || new Date().toISOString(),
          venueName: contractDetails?.venueName || 'Venue',
          contractId: contractDetails?.contractId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent: ' + await response.text());
      }

      const { clientSecret } = await response.json();
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) throw error;

      if (paymentIntent.status === 'succeeded') {
        // Update the contract document with payment status
        await updateDoc(doc(db, 'djContracts', contractDetails.contractId), {
          depositPaid: true,
          paymentId: paymentIntent.id
        });
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Removed confetti effect that was causing errors

  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.92)',
      color: '#111',
      padding: '1.5rem 1rem',
      borderRadius: '16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      width: '100%',
      maxWidth: '700px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxSizing: 'border-box'
    }}>
      <StripeHttpsNotice />
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.25rem',
        borderRadius: '8px',
        marginBottom: '1.25rem',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{
          marginBottom: '0.75rem',
          color: '#333',
          fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
          fontWeight: 'bold',
          borderBottom: '2px solid #635BFF',
          paddingBottom: '0.5rem'
        }}>Order Summary</h3>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: '1px solid #eee'
          }}>
            <span>🎶 Base Package</span>
            <span>$350</span>
          </div>
          
          {services.lighting && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>💡 Event Lighting</span>
              <span>$100</span>
            </div>
          )}
          
          {services.photography && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>📸 Photography</span>
              <span>$150</span>
            </div>
          )}
          
          {services.videoVisuals && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>📽️ Video Visuals</span>
              <span>$100</span>
            </div>
          )}
          
          {services.additionalHours > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>⏱️ Additional Hours ({services.additionalHours})</span>
              <span>${services.additionalHours * 75}</span>
            </div>
          )}
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            fontWeight: 'bold',
            marginTop: '0.5rem'
          }}>
            <span>Total</span>
            <span>${amount/100}</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem' }}>
        <div style={{
          marginBottom: '1.25rem',
          backgroundColor: '#f8f9fa',
          padding: '1.25rem',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            marginBottom: '0.75rem',
            color: '#333',
            fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
            fontWeight: 'bold',
            borderBottom: '2px solid #635BFF',
            paddingBottom: '0.5rem'
          }}>Payment Details</h3>
          <div style={{
            padding: '0.875rem',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            backgroundColor: 'white',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#635BFF', marginRight: '0.5rem' }}>🔐</span>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>Secure payment powered by Stripe</span>
            </div>
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#111',
                  fontFamily: 'Arial, sans-serif',
                  '::placeholder': {
                    color: '#666',
                  },
                  iconColor: '#635BFF',
                },
                invalid: {
                  color: '#9e2146',
                  iconColor: '#fa755a',
                },
              },
              hidePostalCode: true
            }} />
          </div>
        </div>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            cursor: 'pointer',
            padding: '0.875rem',
            backgroundColor: confirmed ? 'rgba(99, 91, 255, 0.1)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '6px',
            border: `2px solid ${confirmed ? '#635BFF' : '#ddd'}`,
            boxShadow: confirmed ? '0 2px 8px rgba(99, 91, 255, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{
                marginRight: '0.75rem',
                marginTop: '0.125rem',
                width: '20px',
                height: '20px',
                accentColor: '#635BFF'
              }}
            />
            <span style={{ 
              fontWeight: confirmed ? 'bold' : 'normal',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              lineHeight: '1.4'
            }}>
              I confirm the services listed above and authorize payment
            </span>
          </label>
        </div>
        
        {error && <p style={{ color: 'red', marginBottom: '1rem', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>{error}</p>}
        
        <button
          type="submit"
          disabled={!stripe || loading || !confirmed}
          style={{
            width: '100%',
            backgroundColor: confirmed ? '#635BFF' : '#a8a8a8',
            color: '#fff',
            padding: '0.875rem 1.25rem',
            borderRadius: '6px',
            border: 'none',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: 'clamp(0.95rem, 4vw, 1.25rem)',
            boxShadow: confirmed ? '0 4px 12px rgba(99, 91, 255, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            transform: confirmed ? 'translateY(0)' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            if (confirmed) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            if (confirmed) e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default function StripeCheckoutWrapper({ amount, onSuccess, contractDetails }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} contractDetails={contractDetails} />
    </Elements>
  );
}