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
import { getFunctions, httpsCallable } from 'firebase/functions';
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// EmailJS configuration fallbacks
const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'default_service_id',
  TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'default_template_id',
  PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'default_public_key',
  USER_ID: process.env.NEXT_PUBLIC_EMAILJS_USER_ID || 'default_user_id'
};

// Helper function to send confirmation email
const sendConfirmationEmail = async (contractDetails, paymentId) => {
  try {
    console.log("Sending payment confirmation email for contract:", contractDetails);
    
    // Format the amount if needed
    const getFormattedAmount = () => {
      // If there's a totalAmount property, use it
      if (contractDetails.totalAmount) {
        // Check if it's already a string with a dollar sign
        if (typeof contractDetails.totalAmount === 'string' && contractDetails.totalAmount.includes('$')) {
          return contractDetails.totalAmount;
        }
        
        // If it's a number or numeric string, format it with dollar sign
        const amount = Number(contractDetails.totalAmount);
        if (!isNaN(amount)) {
          return `$${amount.toFixed(2)}`;
        }
      }
      
      // If we're passed the raw Stripe amount in cents, convert it
      if (typeof amount !== 'undefined') {
        return `$${(amount/100).toFixed(2)}`;
      }
      
      // Default fallback
      return 'N/A';
    };
    
    const formattedAmount = getFormattedAmount();
    
    // Create email payload with all required fields
    const emailPayload = {
      clientName: contractDetails.clientName,
      email: contractDetails.email,
      eventType: contractDetails.eventType || 'Event',
      eventDate: contractDetails.eventDate,
      venueName: contractDetails.venueName || 'N/A',
      venueLocation: contractDetails.venueLocation || 'N/A',
      startTime: contractDetails.startTime || 'N/A',
      endTime: contractDetails.endTime || 'N/A',
      paymentId: paymentId || 'N/A',
      totalAmount: formattedAmount
    };
    
    console.log('Sending email with payload:', emailPayload);
    
    // Get project ID from environment
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // Call the HTTP endpoint directly instead of using httpsCallable
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendConfirmationEmailHttp`;
    
    // Send the request
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    
    // Check for success
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    // Parse the result
    const result = await response.json();
    
    // Log success
    console.log('📧 Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error("❌ Failed to send confirmation email:", error);
    
    // Log specific error details for debugging
    if (error.message) console.error("Error message:", error.message);
    if (error.code) console.error("Error code:", error.code);
    if (error.details) console.error("Error details:", error.details);
    
    // Don't throw the error - just return false to indicate failure
    return false;
  }
};

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
    lighting: contractDetails?.lighting === true,
    photography: contractDetails?.photography === true,
    videoVisuals: contractDetails?.videoVisuals === true,
    additionalHours: parseInt(contractDetails?.additionalHours || 0)
  };

  // Debug line - remove in production
  console.log("Contract details in StripeCheckout:", contractDetails);
  console.log("Extracted services:", services);
  console.log("Types:", {
    lighting: typeof contractDetails?.lighting,
    photography: typeof contractDetails?.photography,
    videoVisuals: typeof contractDetails?.videoVisuals,
    additionalHours: typeof contractDetails?.additionalHours
  });

  // Debug specific values - remove in production
  console.log("Raw values:", {
    lighting: contractDetails?.lighting,
    photography: contractDetails?.photography,
    videoVisuals: contractDetails?.videoVisuals,
    additionalHours: contractDetails?.additionalHours
  });

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
    console.log("Calculating total with services:", services);
    console.log("And contract details:", contractDetails);
    
    const basePackage = 400;
    
    // Try to use values from services object first, but fall back to direct contract details
    const lighting = services.lighting || contractDetails?.lighting ? 100 : 0;
    const photography = services.photography || contractDetails?.photography ? 150 : 0;
    const videoVisuals = services.videoVisuals || contractDetails?.videoVisuals ? 100 : 0;
    const additionalHoursVal = services.additionalHours || 
                            (contractDetails?.additionalHours ? parseInt(contractDetails.additionalHours) : 0);
    const additionalHoursCost = additionalHoursVal * 75;
    
    const total = basePackage + lighting + photography + videoVisuals + additionalHoursCost;
    console.log("Calculated total in Stripe component:", total);
    console.log("With components:", { basePackage, lighting, photography, videoVisuals, additionalHoursCost });
    return total;
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
      console.log('Services being submitted:', services);
      
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
          lighting: services.lighting || contractDetails?.lighting || false,
          photography: services.photography || contractDetails?.photography || false,
          videoVisuals: services.videoVisuals || contractDetails?.videoVisuals || false,
          additionalHours: services.additionalHours || 
                        (contractDetails?.additionalHours ? parseInt(contractDetails.additionalHours) : 0)
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
        console.log("Payment succeeded, storing in Firebase:", {
          paymentId: paymentIntent.id,
          amount: amountInCents,
          services
        });
        
        try {
          // Store payment details in Firestore for reference
          await addDoc(collection(db, 'stripePayments'), {
            paymentIntentId: paymentIntent.id,
            amount: amountInCents / 100, // Convert back to dollars for storage
            clientName: contractDetails?.clientName || 'Customer',
            email: contractDetails?.email || 'customer@example.com',
            eventType: contractDetails?.eventType || 'Event',
            eventDate: contractDetails?.eventDate || new Date().toISOString(),
            venueName: contractDetails?.venueName || 'Venue',
            venueLocation: contractDetails?.venueLocation || 'Venue Location',
            startTime: contractDetails?.startTime || '',
            endTime: contractDetails?.endTime || '',
            lighting: services.lighting,
            photography: services.photography,
            videoVisuals: services.videoVisuals,
            additionalHours: services.additionalHours,
            createdAt: new Date().toISOString()
          });
          
          console.log("Payment record stored successfully");
          
          // Send confirmation email
          await sendConfirmationEmail(contractDetails, paymentIntent.id);
          
          // Call the onSuccess callback
          if (onSuccess) {
            onSuccess(paymentIntent.id);
          }
        } catch (dbError) {
          console.error("Error storing payment record:", dbError);
          // Still consider payment successful even if DB storage fails
          if (onSuccess) {
            onSuccess(paymentIntent.id);
          }
        }
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
        
        {/* Debug information - will be removed in production */}
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          padding: '8px', 
          marginBottom: '15px', 
          borderRadius: '5px',
          fontSize: '12px',
          color: '#333',
          border: '1px solid #bae6fd'
        }}>
          <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>Debug Info:</p>
          <p style={{ margin: '0' }}>Lighting: {String(services.lighting)}</p>
          <p style={{ margin: '0' }}>Photography: {String(services.photography)}</p>
          <p style={{ margin: '0' }}>VideoVisuals: {String(services.videoVisuals)}</p>
          <p style={{ margin: '0' }}>Additional Hours: {services.additionalHours}</p>
        </div>
        
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
          {services.lighting || contractDetails?.lighting ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>💡 Event Lighting</span>
              <span>$100</span>
            </div>
          ) : null}
          
          {/* Photography */}
          {services.photography || contractDetails?.photography ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>📸 Photography</span>
              <span>$150</span>
            </div>
          ) : null}
          
          {/* Video Visuals */}
          {services.videoVisuals || contractDetails?.videoVisuals ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>📽️ Video Visuals</span>
              <span>$100</span>
            </div>
          ) : null}
          
          {/* Additional Hours */}
          {(services.additionalHours > 0 || (contractDetails?.additionalHours && parseInt(contractDetails.additionalHours) > 0)) && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>⏱️ Additional Hours ({services.additionalHours || parseInt(contractDetails?.additionalHours) || 0})</span>
              <span>${(services.additionalHours || parseInt(contractDetails?.additionalHours) || 0) * 75}</span>
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
          <Image
            src="https://js.stripe.com/v3/fingerprinted/img/stripe-badge-payment.f4bd5a1b.png"
            alt="Powered by Stripe"
            width={128}
            height={40}
            className="w-32 h-8"
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
  console.log("StripeCheckoutWrapper received contractDetails:", contractDetails);
  
  return (
    <div className="stripe-wrapper">
      <Elements stripe={stripePromise}>
        <CheckoutForm 
          amount={amount} 
          onSuccess={(paymentId) => {
            console.log("Payment successful, redirecting with ID:", paymentId);
            if (onSuccess) {
              onSuccess(paymentId);
            } else {
              // Default redirect if no callback provided
              window.location.href = `/payment/success?id=${paymentId}`;
            }
          }} 
          contractDetails={contractDetails} 
        />
      </Elements>
    </div>
  );
} 