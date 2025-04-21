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
import { FaLock, FaShieldAlt, FaCheck, FaCreditCard, FaReceipt, FaInfo } from 'react-icons/fa';

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
  const finalAmount = amount ? amount / 100 : calculateTotal();

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
      const amountInCents = Math.round(calculateTotal() * 100);
      
      console.log('Submitting payment with amount:', amountInCents);
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          clientName: contractDetails?.clientName || 'Customer',
          email: contractDetails?.email || 'customer@example.com',
          eventType: contractDetails?.eventType || 'Event',
          eventDate: contractDetails?.eventDate || new Date().toISOString(),
          venueName: contractDetails?.venueName || 'Venue',
          lighting: services.lighting,
          photography: services.photography,
          videoVisuals: services.videoVisuals,
          additionalHours: services.additionalHours
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
          clientName: contractDetails?.clientName,
          email: contractDetails?.email,
          eventType: contractDetails?.eventType,
          eventDate: contractDetails?.eventDate,
          venueName: contractDetails?.venueName,
          venueLocation: contractDetails?.venueLocation,
          lighting: services.lighting,
          photography: services.photography,
          videoVisuals: services.videoVisuals,
          additionalHours: services.additionalHours,
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

  return (
    <div style={{
      backgroundColor: 'transparent',
      color: '#111',
      padding: '0',
      borderRadius: isMobile ? '12px' : '16px',
      width: '96%',
      maxWidth: '96%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      boxSizing: 'border-box',
      marginTop: '0'
    }}>
      {/* Order Summary Section */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: isMobile ? '1.25rem' : '1.5rem',
        borderRadius: '12px',
        marginBottom: '0.5rem',
        border: '1px solid #e5e7eb',
        width: '100%'
      }}>
        <h3 style={{
          marginBottom: '1rem',
          color: '#111',
          fontSize: 'clamp(1.1rem, 4vw, 1.25rem)',
          fontWeight: 'bold',
          borderBottom: '2px solid #635BFF',
          paddingBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          <FaReceipt style={{ marginRight: '10px', color: '#635BFF' }} />
          Order Summary
        </h3>
        
        <div style={{ marginBottom: '0.5rem' }}>
          {/* Base Package */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: '1px solid #e5e7eb'
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
              borderBottom: '1px solid #e5e7eb'
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
              borderBottom: '1px solid #e5e7eb'
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
              borderBottom: '1px solid #e5e7eb'
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
              borderBottom: '1px solid #e5e7eb'
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
            marginTop: '0.5rem',
            borderTop: '2px solid #e5e7eb',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            <span>Total</span>
            <span>${finalAmount}</span>
          </div>
          
          {/* Deposit Note */}
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '1rem',
            border: '1px solid #bae6fd',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <FaInfo size={16} style={{ color: '#0369a1', marginRight: '8px', marginTop: '2px' }} />
              <span>
                50% deposit required to secure your booking. The remaining balance will be due on the event day.
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '0', width: '100%' }}>
        {/* Card Details Section */}
        <div style={{
          marginBottom: '1.5rem',
          backgroundColor: '#f9fafb',
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <h3 style={{
            marginBottom: '0.75rem',
            color: '#111',
            fontSize: 'clamp(1.1rem, 4vw, 1.25rem)',
            fontWeight: 'bold',
            borderBottom: '2px solid #635BFF',
            paddingBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaCreditCard style={{ marginRight: '10px', color: '#635BFF' }} />
            Payment Details
          </h3>

          {/* Card Element Container */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            marginBottom: '1rem'
          }}>
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#111',
                  '::placeholder': {
                    color: '#6b7280',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              hidePostalCode: true,
            }} />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              color: '#ef4444',
              backgroundColor: '#fee2e2',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Terms Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: confirmed ? 'rgba(99, 91, 255, 0.05)' : '#f9fafb',
            borderRadius: '8px',
            border: confirmed ? '1px solid rgba(99, 91, 255, 0.3)' : '1px solid #e5e7eb',
            transition: 'all 0.2s ease'
          }}>
            <div 
              onClick={() => setConfirmed(!confirmed)}
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                borderRadius: '4px',
                border: confirmed ? '2px solid #635BFF' : '2px solid #d1d5db',
                backgroundColor: confirmed ? '#635BFF' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                marginTop: '2px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {confirmed && <FaCheck color="white" size={12} />}
            </div>
            <div>
              <label 
                htmlFor="confirm-services"
                style={{
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: '#111'
                }}
              >
                I confirm my service selections and understand that a 50% deposit is required to secure my booking.
                By proceeding, I agree to the terms and conditions, including the cancellation policy.
              </label>
              <input 
                id="confirm-services"
                type="checkbox" 
                checked={confirmed} 
                onChange={() => setConfirmed(!confirmed)}
                style={{ position: 'absolute', opacity: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          type="submit"
          disabled={!stripe || loading || !confirmed}
          style={{
            width: '100%',
            backgroundColor: confirmed ? '#635BFF' : '#d1d5db',
            color: '#fff',
            padding: '1.2rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            boxShadow: confirmed ? '0 2px 4px rgba(99, 91, 255, 0.25)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <FaLock size={16} />
          {loading ? 'Processing Payment...' : 'Submit Secure Payment'}
        </button>

        {/* Security Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '1rem',
          color: '#6b7280',
          fontSize: '0.85rem',
          textAlign: 'center',
          gap: '6px'
        }}>
          <FaLock size={12} style={{ color: '#635BFF' }} />
          Your payment information is encrypted and secure
        </div>
        
        {/* Official Stripe Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <img 
            src="https://js.stripe.com/v3/fingerprinted/img/stripe-badge-payment.f4bd5a1b.png" 
            alt="Powered by Stripe" 
            style={{ height: '40px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg";
              e.target.style.height = '32px';
            }}
          />
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