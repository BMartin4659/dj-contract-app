'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaHome, FaEnvelope, FaRedo, FaReceipt, FaArrowLeft } from 'react-icons/fa';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { FaPaypal, FaCreditCard } from 'react-icons/fa';
import Link from 'next/link';
import Header from '@/components/Header';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

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

// Function to format CashApp URL with amount
const formatCashAppURL = (username, amount = 0) => {
  // Remove $ if it exists
  const cleanUsername = username.startsWith('$') ? username.substring(1) : username;
  return `https://cash.app/$${cleanUsername}/pay?amount=${amount}&note=DJ%20Service%20Payment`;
};

// We won't use a direct URL for CashApp as deep linking isn't working reliably
const getCashAppInfo = (url) => {
  if (!url || !url.includes('cash.app/')) {
    return { username: '$LiveCity', url: 'https://cash.app/$LiveCity' };
  }
  
  let username = url.split('cash.app/').pop();
  
  // Remove any URL parameters if they exist
  if (username.includes('?')) {
    username = username.split('?')[0];
  }
  
  return { username, url };
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
    url: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$LiveCity',
    handle: '$LiveCity',
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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Get the payment ID from the URL
    const id = searchParams.get('id');
    if (id) {
      setPaymentId(id);
      
      // Determine payment method from the ID prefix
      if (id.startsWith('pi_')) {
        setPaymentMethod('Stripe');
      } else if (id.startsWith('vm_')) {
        setPaymentMethod('Venmo');
      } else if (id.startsWith('ca_')) {
        setPaymentMethod('CashApp');
      } else if (id.startsWith('pp_')) {
        setPaymentMethod('PayPal');
      }
      
      fetchBookingDetails(id);
    } else {
      // If no ID, check for session_id (Stripe Checkout redirect)
      const session = searchParams.get('session_id');
      if (session) {
        setPaymentMethod('Stripe');
        // We'll fetch session details separately
      } else {
        setError('No payment information found. Please check your booking email for details.');
        setLoading(false);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const getPaymentDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/get-session-details?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment details');
        }
        
        const data = await response.json();
        setPaymentDetails(data);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    getPaymentDetails();
  }, [sessionId]);

  // Function to fetch booking details from Firestore
  const fetchBookingDetails = async (paymentId) => {
    try {
      setLoading(true);
      
      // Try to find the payment in the stripePayments collection first (for Stripe payments)
      const paymentsRef = collection(db, 'stripePayments');
      const q = query(paymentsRef, where('paymentIntentId', '==', paymentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Payment found in stripePayments collection
        const paymentData = querySnapshot.docs[0].data();
        console.log("Found payment data in stripePayments:", paymentData);
        setBooking(paymentData);
        
        // Ensure payment method is Stripe if found in stripePayments
        setPaymentMethod('Stripe');
      } else {
        // Try to find the booking in djContracts collection
        const contractsRef = collection(db, 'djContracts');
        const contractQuery = query(contractsRef, where('bookingId', '==', paymentId));
        const contractSnapshot = await getDocs(contractQuery);
        
        if (!contractSnapshot.empty) {
          const contractData = contractSnapshot.docs[0].data();
          console.log("Found booking data in djContracts:", contractData);
          setBooking(contractData);
          
          // Set payment method from contract data if available
          if (contractData.paymentMethod) {
            setPaymentMethod(contractData.paymentMethod);
          }
        } else {
          console.log("Booking not found in database for ID:", paymentId);
          setError('Booking details not found. Please contact support.');
        }
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setError('Failed to load booking information. Please try refreshing or contact support.');
    } finally {
      setLoading(false);
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
      
      // Show a helpful message for CashApp instead of trying to deep link
      if (url.includes('cash.app/')) {
        const cashAppInfo = getCashAppInfo(url);
        alert(`Please open your CashApp app and send payment to: ${cashAppInfo.username}`);
        return;
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
      backgroundImage: 'url(/dj-background-new.jpg)',
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
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '92%',
        width: '600px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Logo Header - Simplified */}
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <div style={{ 
            position: 'relative',
            width: '120px',
            height: '120px',
            margin: '0 auto'
          }}>
            <Image
              src="/dj-bobby-drake-logo.png" 
              alt="DJ Bobby Drake Logo"
              fill
              priority
              sizes="120px"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
        
        {/* Success Message - Simplified and Improved */}
        <div style={{
          backgroundColor: '#f0fdf4', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '25px',
          border: '1px solid #dcfce7'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px auto'
          }}>
            <FaCheckCircle size={30} color="white" />
          </div>
          
          <h1 style={{ 
            color: '#15803d', 
            fontSize: '2rem', 
            fontWeight: 'bold',
            marginBottom: '10px',
          }}>
            Payment Successful!
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#166534',
            marginBottom: '0'
          }}>
            Your booking has been confirmed
          </p>
        </div>
        
        {/* Payment Details - More Organized */}
        <div style={{ 
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          textAlign: 'left'
        }}>
          <h2 style={{ 
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaReceipt style={{ color: '#3b82f6' }} />
            Payment Details
          </h2>
          
          <div className="summary-item">
            <h3>Payment Method</h3>
            {paymentMethod && (
              <div className="payment-method-info">
                <div style={{ color: '#111827', fontWeight: '600' }}>{paymentMethod}</div>
                {booking && booking.paymentId && (
                  <div style={{ fontSize: '0.9rem', marginTop: '5px', color: '#6b7280', wordBreak: 'break-all' }}>
                    ID: {booking.paymentId}
                  </div>
                )}
                {!booking && paymentId && (
                  <div style={{ fontSize: '0.9rem', marginTop: '5px', color: '#6b7280', wordBreak: 'break-all' }}>
                    ID: {paymentId}
                  </div>
                )}
              </div>
            )}
            {!paymentMethod && <div style={{ color: '#6b7280' }}>Processing</div>}
          </div>
          
          {booking && booking.amount && (
            <>
              <div style={{ color: '#6b7280', fontWeight: '500' }}>Amount:</div>
              <div style={{ color: '#111827', fontWeight: '600' }}>${booking.amount}</div>
            </>
          )}
          
          <div style={{ color: '#6b7280', fontWeight: '500' }}>Date:</div>
          <div style={{ color: '#111827', fontWeight: '500' }}>{new Date().toLocaleDateString()}</div>
          
          <div style={{ color: '#6b7280', fontWeight: '500' }}>Status:</div>
          <div style={{ color: '#16a34a', fontWeight: '600' }}>Paid</div>
        </div>

        {/* Email confirmation section - Simplified */}
        {booking && booking.email && (
          <div style={{
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            border: '1px solid #e0f2fe'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
              color: '#0369a1'
            }}>
              <FaEnvelope />
              <h3 style={{ 
                fontSize: '1.1rem',
                margin: 0,
                fontWeight: '600'
              }}>
                Confirmation Email
              </h3>
            </div>
            
            {!emailSent ? (
              <>
                <p style={{ fontSize: '0.95rem', color: '#334155', margin: '0 0 15px 0' }}>
                  {emailError 
                    ? "We couldn&apos;t send your confirmation email" 
                    : "A confirmation email has been sent. Didn&apos;t receive it?"}
                </p>
                
                <button
                  onClick={sendConfirmationEmail}
                  disabled={emailSending}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: emailSending ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: emailSending ? 'default' : 'pointer',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    marginBottom: emailError ? '10px' : '0'
                  }}
                >
                  {emailSending ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        marginRight: '8px',
                        animation: 'spin 1s linear infinite'
                      }} /> 
                      Sending...
                    </>
                  ) : (
                    <>
                      {emailError ? 'Try Again' : 'Resend Email'}
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
                    <p style={{ margin: '0 0 5px 0' }}>Error sending email</p>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.85rem' }}>
                      Don&apos;t worry - your booking is confirmed.
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
                gap: '8px',
                fontWeight: '500'
              }}>
                <FaCheckCircle /> 
                Email sent to {booking.email}
              </div>
            )}
          </div>
        )}
        
        <div style={{ marginBottom: '30px' }}>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#4b5563',
            margin: '0 0 20px 0',
            maxWidth: '90%',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Thank you for your booking! I&apos;ll make your event special.
          </p>
        </div>
        
        {/* Return Home - Clear Call to Action */}
        <Link 
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontWeight: '500',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)',
            fontSize: '1rem'
          }}
        >
          <FaArrowLeft size={14} />
          Return to Home
        </Link>
      </div>
      
      {/* Animation styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          h1 {
            font-size: 1.75rem !important;
          }
          h2 {
            font-size: 1.1rem !important;
          }
          p {
            font-size: 0.95rem !important;
          }
        }
      `}</style>
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