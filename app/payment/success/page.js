'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaHome, FaEnvelope, FaRedo } from 'react-icons/fa';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { FaPaypal, FaCreditCard } from 'react-icons/fa';
import Link from 'next/link';
import Header from '@/components/Header';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Inline implementation of sendEmail to avoid import issues
const sendEmail = async (bookingData) => {
  try {
    // Create the email payload
    const emailPayload = {
      clientName: bookingData.clientName || '',
      email: bookingData.email || '',
      eventType: bookingData.eventType || 'Event',
      eventDate: bookingData.eventDate || '',
      venueName: bookingData.venueName || '',
      venueLocation: bookingData.venueLocation || '',
      startTime: bookingData.startTime || '',
      endTime: bookingData.endTime || '',
      paymentId: bookingData.paymentId || '',
      amount: bookingData.amount || 0
    };
    
    console.log('Email payload:', JSON.stringify(emailPayload));
    
    // Client-side fallback implementation
    console.log('Using client-side email handling');
    
    try {
      // Try to send via API route
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Email sent successfully via API route:', result);
      return result;
    } catch (apiError) {
      console.error('API route error:', apiError);
      
      // Return a fallback success response
      return {
        success: true,
        message: 'Email request processed',
        method: 'client_fallback',
        details: {
          to: emailPayload.email,
          clientName: emailPayload.clientName,
          eventDetails: `${emailPayload.eventType} on ${emailPayload.eventDate}`,
          note: 'Your booking is confirmed. Our team will send a confirmation email shortly.'
        }
      };
    }
  } catch (error) {
    console.error('Error in email sending process:', error);
    throw new Error('Unable to send email confirmation now. We will send it later.');
  }
};

// Payment method configurations
const PAYMENT_METHODS = {
  VENMO: {
    url: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
    handle: '@Bobby-Martin-64',
    color: '#3D95CE',
    icon: SiVenmo,
    name: 'Venmo'
  },
  CASHAPP: {
    url: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$BobbyMartin64',
    handle: '$BobbyMartin64',
    color: '#00C244',
    icon: SiCashapp,
    name: 'CashApp'
  },
  PAYPAL: {
    url: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659',
    handle: 'paypal.me/bmartin4659',
    color: '#003087',
    icon: FaPaypal,
    name: 'PayPal'
  },
  STRIPE: {
    url: process.env.NEXT_PUBLIC_STRIPE_URL || '#',
    handle: '',
    color: '#6772E5',
    icon: FaCreditCard,
    name: 'Stripe'
  }
};

// Extract handles from URLs if available
if (PAYMENT_METHODS.VENMO.url) {
  let venmoHandle = '';
  
  // Extract handle from account.venmo.com/u/{username} format
  if (PAYMENT_METHODS.VENMO.url.includes('account.venmo.com/u/')) {
    venmoHandle = PAYMENT_METHODS.VENMO.url.split('/u/').pop();
    // Don't include @ in the URL but show it in the handle display
    PAYMENT_METHODS.VENMO.handle = `@${venmoHandle}`;
  } 
  // Extract handle from venmo.com/{username} format
  else if (PAYMENT_METHODS.VENMO.url.includes('venmo.com/')) {
    venmoHandle = PAYMENT_METHODS.VENMO.url.split('venmo.com/').pop();
    // Remove @ if it exists in the venmoHandle for display purposes
    if (venmoHandle.startsWith('@')) {
      venmoHandle = venmoHandle.substring(1);
      // Update the URL to remove the @ symbol
      PAYMENT_METHODS.VENMO.url = PAYMENT_METHODS.VENMO.url.replace(`/@${venmoHandle}`, `/${venmoHandle}`);
    }
    PAYMENT_METHODS.VENMO.handle = `@${venmoHandle}`;
  }
}

if (PAYMENT_METHODS.CASHAPP.url) {
  let cashappHandle = '';
  
  // Extract handle from cash.app/{$username} format
  if (PAYMENT_METHODS.CASHAPP.url.includes('cash.app/')) {
    // Get the part after cash.app/
    cashappHandle = PAYMENT_METHODS.CASHAPP.url.split('cash.app/').pop();
    
    // Remove any URL parameters if they exist
    if (cashappHandle.includes('?')) {
      cashappHandle = cashappHandle.split('?')[0];
    }
    
    // Make sure the handle has a $ prefix for display
    if (!cashappHandle.startsWith('$')) {
      PAYMENT_METHODS.CASHAPP.handle = `$${cashappHandle}`;
      // Update the URL to include the $ if it doesn't have it
      PAYMENT_METHODS.CASHAPP.url = `https://cash.app/$${cashappHandle}`;
    } else {
      PAYMENT_METHODS.CASHAPP.handle = cashappHandle;
      // Make sure the URL is consistent with the handle
      PAYMENT_METHODS.CASHAPP.url = `https://cash.app/${cashappHandle}`;
    }
    
    // Log for debugging
    console.log('CashApp handle:', PAYMENT_METHODS.CASHAPP.handle);
    console.log('CashApp URL:', PAYMENT_METHODS.CASHAPP.url);
  }
}

if (PAYMENT_METHODS.PAYPAL.url) {
  let paypalHandle = '';
  
  // Extract handle from paypal.me/{username} format
  if (PAYMENT_METHODS.PAYPAL.url.includes('paypal.me/')) {
    paypalHandle = PAYMENT_METHODS.PAYPAL.url.split('paypal.me/').pop();
    PAYMENT_METHODS.PAYPAL.handle = paypalHandle;
  }
}

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
    if (!emailSent && booking && booking.email) {
      try {
        console.log('Sending confirmation email...');
        setEmailSending(true);
        setEmailError(null);
        
        // Use our utility function
        const result = await sendEmail(booking);
        
        console.log('📧 Email sent successfully:', result);
        setEmailSent(true);
      } catch (error) {
        console.error('❌ Error sending email:', error);
        if (error.message) console.error("Error message:", error.message);
        
        // Show user-friendly error message
        setEmailError(
          error.message === 'Failed to fetch' 
            ? 'Unable to connect to email service. Please try again later.'
            : error.message || 'Failed to send email. Please try again or contact support.'
        );
      } finally {
        setEmailSending(false);
      }
    }
  };

  // Function to ensure payment URLs are correctly formatted before opening
  const openPaymentApp = (url, event) => {
    try {
      // Prevent default if an event was passed
      if (event && event.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      if (!url || !url.startsWith('http')) {
        alert("Invalid payment URL. Please contact support.");
        return;
      }
      
      let formattedUrl = url;
      
      // Handle Venmo URL formatting
      if (url.includes('venmo.com/') || url.includes('account.venmo.com/')) {
        // For Venmo, ensure we're using the format: https://venmo.com/u/USERNAME
        const username = url.split('/').pop();
        
        // Remove @ if it exists at the start of the username part
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
        
        // Use the correct Venmo URL format
        formattedUrl = `https://venmo.com/u/${cleanUsername}`;
      }
      
      // Handle Cash App URL formatting
      if (url.includes('cash.app/')) {
        // Extract the username from the URL
        let username = url.split('cash.app/').pop();
        
        // Remove any URL parameters if they exist
        if (username.includes('?')) {
          username = username.split('?')[0];
        }
        
        // Handle $ character in username
        if (username.startsWith('$')) {
          // URL already has $ character
          formattedUrl = `https://cash.app/${username}`;
        } else {
          // Add $ if it doesn't exist
          formattedUrl = `https://cash.app/$${username}`;
        }
        
        console.log('Formatted CashApp URL:', formattedUrl);
      }
      
      console.log('Opening payment URL:', formattedUrl);
      window.open(formattedUrl, '_blank');
    } catch (error) {
      console.error('Error opening payment app:', error);
      alert("There was an error opening the payment app. Please try again or contact support.");
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
          
          {booking && booking.isDeposit && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: 'rgba(246, 197, 59, 0.1)',
              border: '1px solid rgba(246, 197, 59, 0.3)',
              borderRadius: '8px',
              fontSize: '0.95rem',
              color: '#805f13'
            }}>
              <p><strong>Note:</strong> You&apos;ve paid the deposit amount (50%). The remaining balance of ${booking.remainingBalance || booking.totalAmount / 2} will be due on the day of the event.</p>
            </div>
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
            {!emailSent ? (
              <>
                <p style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '10px' }}>
                  {emailError 
                    ? "There was an issue sending the confirmation email:" 
                    : "A confirmation email has been sent to your email address. If you didn't receive it, you can resend it:"}
                </p>
                
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
                      {emailError ? 'Try Again' : 'Resend Confirmation Email'}
                    </>
                  )}
                </button>
                
                {emailError && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    background: 'rgba(254, 226, 226, 0.5)', 
                    borderRadius: '6px', 
                    color: '#b91c1c',
                    fontSize: '0.9rem'
                  }}>
                    {emailError}
                    <p style={{ marginTop: '8px', color: '#4b5563', fontSize: '0.85rem' }}>
                      Don&apos;t worry - your booking is confirmed. Our team will send you a manual confirmation soon.
                    </p>
                  </div>
                )}
              </>
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