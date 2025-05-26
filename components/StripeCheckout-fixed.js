'use client';

import React, { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { isWeddingEvent } from '../app/utils/eventUtils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          clientName: contractDetails?.clientName || 'Customer',
          email: contractDetails?.email || 'customer@example.com',
          eventType: contractDetails?.eventType || 'Event',
          eventDate: contractDetails?.eventDate || new Date().toISOString(),
          venueName: contractDetails?.venueName || 'Venue'
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
        await addDoc(collection(db, 'stripePayments'), {
          paymentIntentId: paymentIntent.id,
          amount: amount,
          currency: paymentIntent.currency,
          ...contractDetails,
          timestamp: new Date()
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
      backgroundColor: 'rgba(255,255,255,0.95)',
      color: '#111',
      padding: '2rem 1rem',
      borderRadius: '20px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      width: '100%',
      maxWidth: '100%',
      margin: '0 auto',
      '@media (max-width: 480px)': {
        padding: '1rem',
        borderRadius: '12px'
      },
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{
          marginBottom: '1rem',
          color: '#333',
          fontSize: 'clamp(1.2rem, 5vw, 2rem)',
          fontWeight: 'bold',
          borderBottom: '2px solid #635BFF',
          paddingBottom: '0.5rem'
        }}>Order Summary</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: '1px solid #eee'
          }}>
            <span>
              {isWeddingEvent(contractDetails?.eventType) ? '💍 Wedding Package' : '🎶 Base Package'}
            </span>
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
      
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div style={{
          marginBottom: '1.5rem',
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            marginBottom: '0.75rem',
            color: '#333',
            fontSize: 'clamp(1.2rem, 5vw, 2rem)',
            fontWeight: 'bold',
            borderBottom: '2px solid #635BFF',
            paddingBottom: '0.5rem'
          }}>Payment Details</h3>
          <div style={{
            padding: '1rem',
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
                  fontSize: 'clamp(14px, 3vw, 16px)',
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
              }
            }} />
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '1rem',
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
                width: '20px',
                height: '20px',
                accentColor: '#635BFF'
              }}
            />
            <span style={{ fontWeight: confirmed ? 'bold' : 'normal' }}>
              I confirm the services listed above and authorize payment
            </span>
          </label>
        </div>
        
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        
        <button
          type="submit"
          disabled={!stripe || loading || !confirmed}
          style={{
            width: '100%',
            backgroundColor: confirmed ? '#635BFF' : '#a8a8a8',
            color: '#fff',
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
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