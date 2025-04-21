'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaHome, FaEnvelope, FaRedo } from 'react-icons/fa';
import Link from 'next/link';
import Header from '@/components/Header';
import emailjs from '@emailjs/browser';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// EmailJS configuration fallbacks
const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'default_service_id',
  TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'default_template_id',
  USER_ID: process.env.NEXT_PUBLIC_EMAILJS_USER_ID || 'default_user_id'
};

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState('');
  const [booking, setBooking] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState(null);

  useEffect(() => {
    // Get the payment ID from the URL
    const id = searchParams.get('id');
    if (id) {
      setPaymentId(id);
      fetchBookingDetails(id);
    }
  }, [searchParams]);

  // Function to fetch booking details from Firestore
  const fetchBookingDetails = async (paymentId) => {
    try {
      // Try to find the payment in the stripePayments collection
      const paymentsRef = collection(db, 'stripePayments');
      const q = query(paymentsRef, where('paymentIntentId', '==', paymentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Payment found
        const paymentData = querySnapshot.docs[0].data();
        console.log("Found payment data:", paymentData);
        setBooking(paymentData);
      } else {
        console.log("Payment not found in database");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
    }
  };

  // Function to manually send confirmation email
  const sendConfirmationEmail = async () => {
    if (!booking || !booking.email) {
      setEmailError("Cannot send email: missing booking information");
      return;
    }

    setEmailSending(true);
    setEmailError(null);

    try {
      // Initialize EmailJS
      const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID || EMAILJS_CONFIG.USER_ID;
      if (userId && userId !== 'default_user_id') {
        emailjs.init(userId);
      }
      
      // Prepare template parameters
      const templateParams = {
        to_name: booking.clientName || 'Customer',
        to_email: booking.email,
        event_type: booking.eventType || 'Event',
        event_date: booking.eventDate || 'TBD',
        venue_name: booking.venueName || 'Venue',
        venue_location: booking.venueLocation || 'TBD',
        payment_id: paymentId || 'Unknown',
        payment_method: 'Stripe',
        total_amount: `$${(booking.amount / 100).toFixed(2) || '0.00'}`
      };
      
      console.log("Sending manual confirmation email:", templateParams);
      
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID;
      
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        userId
      );
      
      console.log("Manual email sent successfully:", response);
      setEmailSent(true);
    } catch (error) {
      console.error("Failed to send manual confirmation email:", error);
      setEmailError(error.message || "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="main-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
      color: 'white',
      backgroundImage: 'url(/images/dj-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Overlay to enhance text visibility */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        zIndex: 1
      }} />
      
      <div style={{
        backgroundColor: 'white',
        padding: '40px 50px',
        borderRadius: '20px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '92%',
        width: '700px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Increase the header size and prominence */}
        <div style={{ transform: 'scale(1.3)', marginBottom: '30px' }}>
          <Header />
        </div>
        
        <div style={{ marginTop: '50px', marginBottom: '25px' }}>
          <FaCheckCircle style={{ color: '#22c55e', fontSize: '90px' }} />
        </div>
        
        <h1 style={{ 
          color: '#3b82f6', 
          marginBottom: '1.5rem', 
          fontSize: '3rem', 
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          letterSpacing: '-0.5px'
        }}>
          Payment Successful!
        </h1>
        
        <div style={{ 
          padding: '25px', 
          background: 'rgba(59, 130, 246, 0.08)', 
          borderRadius: '12px',
          marginBottom: '2.5rem',
          border: '1px solid rgba(59, 130, 246, 0.15)'
        }}>
          <p style={{ 
            fontSize: '1.5rem', 
            lineHeight: '1.6',
            color: '#333',
            fontWeight: '500'
          }}>
            Thank you for your payment. Your booking has been confirmed!
          </p>
          
          {paymentId && (
            <p style={{ 
              fontSize: '1rem', 
              color: '#4b5563',
              marginTop: '15px',
              fontWeight: '500',
              padding: '10px',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              Payment ID: {paymentId}
            </p>
          )}
        </div>
        
        <p style={{ 
          fontSize: '1.3rem', 
          lineHeight: '1.7',
          marginBottom: '2rem',
          color: '#4b5563',
          padding: '0 15px'
        }}>
          We look forward to making your event special! A confirmation email has been sent with the details of your booking.
        </p>

        {/* Email confirmation section */}
        {booking && booking.email && (
          <div style={{
            padding: '15px',
            borderRadius: '10px',
            backgroundColor: '#f9fafb',
            marginBottom: '2.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '10px' }}>
              Didn&apos;t receive the confirmation email?
            </p>
            
            {!emailSent ? (
              <button
                onClick={sendConfirmationEmail}
                disabled={emailSending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: emailSending ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: emailSending ? 'default' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  marginBottom: emailError ? '10px' : '0'
                }}
              >
                {emailSending ? (
                  <>
                    <div style={{ 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      marginRight: '10px',
                      animation: 'spin 1s linear infinite'
                    }} /> 
                    Sending...
                  </>
                ) : (
                  <>
                    <FaEnvelope style={{ marginRight: '10px' }} /> 
                    Resend Confirmation Email
                  </>
                )}
              </button>
            ) : (
              <div style={{ 
                color: '#059669', 
                padding: '10px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500'
              }}>
                <FaCheckCircle style={{ marginRight: '10px' }} /> 
                Email sent successfully to {booking.email}
              </div>
            )}
            
            {emailError && (
              <div style={{ 
                color: '#dc2626', 
                fontSize: '0.9rem',
                padding: '8px', 
                borderRadius: '6px', 
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                marginTop: '10px'
              }}>
                {emailError}
              </div>
            )}
          </div>
        )}
        
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '16px 32px',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease'
        }}>
          <FaHome style={{ marginRight: '12px', fontSize: '1.3rem' }} />
          Book Another Event
        </Link>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingPaymentSuccess() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '35px',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 20px auto',
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '1.3rem', color: '#3b82f6', fontWeight: '500' }}>Loading payment details...</p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingPaymentSuccess />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 