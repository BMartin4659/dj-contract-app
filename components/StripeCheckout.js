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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, onSuccess, contractDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Extract services from contract details
  const services = {
    basePackage: true, // Always included
    lighting: contractDetails?.lighting || false,
    photography: contractDetails?.photography || false,
    videoVisuals: contractDetails?.videoVisuals || false,
    additionalHours: contractDetails?.additionalHours || 0
  };

  // Check for mobile screen on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 480);
      };
      
      // Initial check
      checkMobile();
      
      // Add listener for resize
      window.addEventListener('resize', checkMobile);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Calculate correct total from services
  const calculateTotal = () => {
    const basePackage = 400;
    const lighting = services.lighting ? 100 : 0;
    const photography = services.photography ? 150 : 0;
    const videoVisuals = services.videoVisuals ? 100 : 0;
    const additionalHoursCost = services.additionalHours * 75;
    
    return basePackage + lighting + photography + videoVisuals + additionalHoursCost;
  };
  
  // Get the final amount to use (either from props or calculated)
  const finalAmount = amount || calculateTotal();

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
      
      // Calculate the amount in cents for Stripe
      const amountInCents = calculateTotal() * 100;
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
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
          amount: amountInCents,
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
      padding: isMobile ? '1rem' : '2rem',
      borderRadius: isMobile ? '12px' : '20px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      width: '100%',
      maxWidth: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      boxSizing: 'border-box'
    }}>
      {/* Page Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          color: '#333',
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          fontWeight: 'bold',
          margin: '0'
        }}>Complete Your Booking</h2>
        <p style={{
          color: '#666',
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          margin: '0.5rem 0 0 0'
        }}>Secure your event date with a deposit payment</p>
      </div>

      {/* Order Summary Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: isMobile ? '1rem' : '1.5rem',
        borderRadius: '12px',
        marginBottom: '0.5rem',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{
          marginBottom: '1rem',
          color: '#333',
          fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
          fontWeight: 'bold',
          borderBottom: '2px solid #635BFF',
          paddingBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '0.5rem' }}>📋</span>
          Order Summary
        </h3>
        
        <div style={{ marginBottom: '0.5rem' }}>
          {/* Base Package */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: '1px solid #eee'
          }}>
            <span style={{ fontWeight: '500' }}>🎶 Base Package</span>
            <span style={{ fontWeight: '500' }}>$400</span>
          </div>
          
          {/* Lighting */}
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
          
          {/* Photography */}
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
          
          {/* Video Visuals */}
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
          
          {/* Additional Hours */}
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
          
          {/* Total */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            fontWeight: 'bold',
            marginTop: '0.5rem',
            fontSize: 'clamp(1rem, 4vw, 1.2rem)',
            borderTop: '2px solid #eee',
            paddingTop: '0.75rem'
          }}>
            <span>Total</span>
            <span>${calculateTotal()}</span>
          </div>
        </div>

        {/* 50% Deposit Note */}
        <div style={{
          backgroundColor: 'rgba(99, 91, 255, 0.1)',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
          display: 'flex',
          alignItems: 'center',
          marginTop: '0.5rem'
        }}>
          <span style={{ marginRight: '0.5rem', color: '#635BFF' }}>ℹ️</span>
          <span>50% deposit required to secure your booking. The remaining balance will be due on the event day.</span>
        </div>
      </div>
      
      {/* Payment Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: '0' }}>
        {/* Card Details Section */}
        <div style={{
          marginBottom: '1.5rem',
          backgroundColor: '#f8f9fa',
          padding: isMobile ? '1rem' : '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            marginBottom: '0.75rem',
            color: '#333',
            fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
            fontWeight: 'bold',
            borderBottom: '2px solid #635BFF',
            paddingBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '0.5rem' }}>💳</span>
            Payment Details
          </h3>

          {/* Security Note */}
          <div style={{ 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: 'rgba(0, 180, 0, 0.1)',
            padding: '0.5rem',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#00b400', marginRight: '0.5rem' }}>🔐</span>
            <span style={{ fontSize: '0.875rem', color: '#333' }}>Secure payment powered by Stripe</span>
          </div>

          {/* Card Element Container */}
          <div style={{
            padding: '1rem',
            border: '1px solid #ced4da',
            borderRadius: '10px',
            backgroundColor: 'white',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: '#555',
              fontWeight: '500'
            }}>
              Card Information
            </label>
            <CardElement options={{
              style: {
                base: {
                  fontSize: isMobile ? '16px' : '18px',
                  color: '#111',
                  fontFamily: 'Arial, sans-serif',
                  '::placeholder': {
                    color: '#888',
                  },
                  iconColor: '#635BFF',
                  lineHeight: '40px',
                },
                invalid: {
                  color: '#9e2146',
                  iconColor: '#fa755a',
                },
              },
              hidePostalCode: true
            }} />
          </div>

          {/* Card Brands Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            marginTop: '1rem'
          }}>
            <div style={{ opacity: 0.7, fontSize: '1.5rem' }}>💳</div>
            <div style={{ opacity: 0.7, fontSize: '1.5rem' }}>💳</div>
            <div style={{ opacity: 0.7, fontSize: '1.5rem' }}>💳</div>
            <div style={{ opacity: 0.7, fontSize: '1.5rem' }}>💳</div>
          </div>
        </div>
        
        {/* Confirmation Checkbox */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: confirmed ? 'rgba(99, 91, 255, 0.1)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '10px',
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
                marginTop: '0.25rem',
                width: '20px',
                height: '20px',
                accentColor: '#635BFF'
              }}
            />
            <span style={{ 
              fontWeight: confirmed ? '500' : 'normal',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              lineHeight: '1.4'
            }}>
              I confirm the services listed above and authorize payment of the 50% deposit. I understand the remaining balance is due on the event day.
            </span>
          </label>
        </div>
        
        {/* Error Message */}
        {error && (
          <div style={{ 
            color: '#e53e3e', 
            marginBottom: '1rem',
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '0.5rem' }}>⚠️</span>
            {error}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || loading || !confirmed}
          style={{
            width: '100%',
            backgroundColor: confirmed ? '#635BFF' : '#a8a8a8',
            color: '#fff',
            padding: '1.2rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: 'clamp(1rem, 4vw, 1.2rem)',
            boxShadow: confirmed ? '0 4px 12px rgba(99, 91, 255, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            transform: confirmed ? 'translateY(0)' : 'none',
            position: 'relative',
            overflow: 'hidden',
            marginTop: '0.5rem'
          }}
          onMouseOver={(e) => {
            if (confirmed) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            if (confirmed) e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? 'Processing Payment...' : 'Pay Now'}
        </button>

        {/* Security Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          color: '#666',
          fontSize: '0.8rem'
        }}>
          Your payment is secure and encrypted. We do not store your card details.
        </div>
      </form>
    </div>
  );
};

export default function StripeCheckoutWrapper({ amount, onSuccess, contractDetails }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        amount={amount} 
        onSuccess={onSuccess} 
        contractDetails={contractDetails} 
      />
    </Elements>
  );
} 