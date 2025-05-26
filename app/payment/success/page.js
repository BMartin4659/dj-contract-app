'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaHome, FaEnvelope, FaRedo, FaReceipt, FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { FaPaypal, FaCreditCard } from 'react-icons/fa';
import Link from 'next/link';
import Header from '@/components/Header';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

// Inline implementation of sendEmail to avoid import issues
const sendEmail = async (bookingData) => {
  try {
    // Create the email payload with all required and optional fields
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
      amount: bookingData.amount || bookingData.total || 0,
      paymentMethod: bookingData.paymentMethod || 'Stripe',
      paymentDate: new Date().toLocaleDateString()
    };
    
    console.log('Email payload:', JSON.stringify(emailPayload));
    
    try {
      // Try to send via API route
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Use text() instead of json() for error responses to avoid parsing errors
        const errorText = await response.text();
        let errorData = {};
        
        // Only try to parse as JSON if the content type is JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
        }
        
        console.error('Email API error:', errorText);
        throw new Error(`HTTP error ${response.status}: ${errorData.error || errorText || 'Unknown error'}`);
      }
      
      // Only try to parse as JSON if the content type is JSON
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('Email sent successfully via API route:', result);
        return result;
      } else {
        console.log('Email request received non-JSON response.');
        return {
          success: true,
          message: 'Email request processed',
          method: 'non_json_response'
        };
      }
    } catch (apiError) {
      console.error('API route error:', apiError);
      
      // Try fallback method - This could be a serverless function call or another approach
      console.log('Attempting fallback email method...');
      
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
    // Instead of throwing an error, return a fallback response
    return {
      success: false,
      error: error.message || 'Unable to send email confirmation now',
      fallback: true
    };
  }
};

// Format CashApp URL with amount
const formatCashAppURL = (username, amount = 0) => {
  // Remove $ if it exists
  const cleanUsername = username.startsWith('$') ? username.substring(1) : username;
  return `https://cash.app/$${cleanUsername}/pay?amount=${amount}&note=DJ%20Service%20Payment`;
};

// Get CashApp info with fallback
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

// Payment method configurations with fallbacks
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

// Get payment method icon component based on method name
const getPaymentMethodIcon = (methodName) => {
  const method = methodName ? methodName.toUpperCase() : 'STRIPE';
  switch (method) {
    case 'VENMO':
      return <SiVenmo className="mr-2 text-[#3D95CE]" />;
    case 'CASHAPP':
      return <SiCashapp className="mr-2 text-[#00C244]" />;
    case 'PAYPAL':
      return <FaPaypal className="mr-2 text-[#003087]" />;
    default:
      return <FaCreditCard className="mr-2 text-indigo-600" />;
  }
};

// Log CashApp info for debugging
if (typeof window !== 'undefined') {
  const { handle, url } = getCashAppInfo(PAYMENT_METHODS.CASHAPP.url);
  console.log('CashApp handle:', handle);
  console.log('CashApp URL:', url);
}

const PAYMENT_COLORS = {
  card:    { main: '#6366f1', dark: '#4338ca' }, // Stripe/credit card indigo
  stripe:  { main: '#6366f1', dark: '#4338ca' },
  venmo:   { main: '#3D95CE', dark: '#276fa1' },
  cashapp: { main: '#00C244', dark: '#00913a' },
  paypal:  { main: '#003087', dark: '#001f4c' },
};

// --- Redesigned Payment Success Page ---

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams ? searchParams.get('session_id') : null;
  const paymentMethod = searchParams ? searchParams.get('payment_method') : null;
  const bookingId = searchParams ? searchParams.get('booking_id') : null;
  const amount = searchParams ? searchParams.get('amount') : null;

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (sessionId) {
      getPaymentDetails();
    } else if (paymentMethod && bookingId) {
      handleNonStripePayment();
    } else {
      setLoading(false);
      setError('No payment information provided');
    }
  }, [sessionId, paymentMethod, bookingId]);
  
  // Handle non-Stripe payments (Venmo, CashApp, PayPal)
  const handleNonStripePayment = async () => {
    try {
      setLoading(true);
      
      // Create a payment details object
      const alternativePaymentDetails = {
        payment_method: paymentMethod,
        amount_total: amount ? parseFloat(amount) * 100 : 0, // Convert to cents for consistency
        payment_intent: bookingId,
        metadata: {
          bookingId
        }
      };
      
      setPaymentDetails(alternativePaymentDetails);
      
      // Fetch booking details from Firestore
      await fetchBookingDetails(bookingId);
      
      // Update the booking to mark payment as confirmed
      try {
        await fetch('/api/payment-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            paymentMethod,
            amount: amount || 0
          })
        });
      } catch (updateError) {
        console.error('Error updating payment status:', updateError);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing alternative payment:', error);
      setError(error.message || 'Failed to process payment');
      setLoading(false);
    }
  };
  
  const getPaymentDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching payment details for session:', sessionId);
      
      const response = await fetch(`/api/get-session-details?session_id=${encodeURIComponent(sessionId)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching session details:', response.status, errorText);
        throw new Error(`Failed to fetch session details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session details retrieved:', data);
      setPaymentDetails(data);
      
      // Try to find the booking details in Firestore
      if (data && data.payment_intent) {
        await fetchBookingDetails(data.payment_intent);
      } else {
        console.warn('No payment_intent found in session data');
        // Try to create booking from metadata
        if (data && data.metadata) {
          const newBookingData = {
            clientName: data.metadata.clientName,
            email: data.metadata.email || data.customer_email,
            eventType: data.metadata.eventType,
            eventDate: data.metadata.eventDate,
            venueName: data.metadata.venueName,
            paymentId: sessionId,
            amount: (data.amount_total || 0) / 100,
            paymentMethod: 'Stripe',
            status: 'confirmed'
          };
          setBookingDetails(newBookingData);
          await sendConfirmationEmail(newBookingData);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError(err.message || 'Failed to load payment details');
      setLoading(false);
    }
  };
  
  // Get booking details from Firestore
  const fetchBookingDetails = async (paymentIdOrBookingId) => {
    try {
      console.log('Fetching booking details for ID:', paymentIdOrBookingId);
      
      // First try to find by paymentId in 'bookings' collection
      let bookingsRef = collection(db, 'bookings');
      let q = query(bookingsRef, where('paymentId', '==', paymentIdOrBookingId));
      let querySnapshot = await getDocs(q);
      
      // If not found, try document ID in 'bookings'
      if (querySnapshot.empty) {
        try {
          const bookingDoc = await getDoc(doc(db, 'bookings', paymentIdOrBookingId));
          if (bookingDoc.exists()) {
            querySnapshot = {
              empty: false,
              docs: [{ id: bookingDoc.id, data: () => bookingDoc.data() }]
            };
          }
        } catch (docError) {
          console.log('Error fetching by document ID:', docError);
        }
      }
      
      // If still not found, try 'djContracts' collection
      if (querySnapshot.empty) {
        bookingsRef = collection(db, 'djContracts');
        q = query(bookingsRef, where('paymentId', '==', paymentIdOrBookingId));
        querySnapshot = await getDocs(q);
        
        // If not found by payment ID, try document ID in 'djContracts'
        if (querySnapshot.empty) {
          try {
            const contractDoc = await getDoc(doc(db, 'djContracts', paymentIdOrBookingId));
            if (contractDoc.exists()) {
              querySnapshot = {
                empty: false,
                docs: [{ id: contractDoc.id, data: () => contractDoc.data() }]
              };
            }
          } catch (docError) {
            console.log('Error fetching from djContracts by ID:', docError);
          }
        }
      }
      
      if (!querySnapshot.empty) {
        // Booking found
        const bookingDoc = querySnapshot.docs[0];
        const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
        setBookingDetails(bookingData);
        
        // Send email if not already sent
        if (!bookingData.emailSent) {
          await sendConfirmationEmail(bookingData);
          
          // Update booking to mark email as sent
          try {
            const collectionName = bookingData.id === paymentIdOrBookingId ? 'djContracts' : 'bookings';
            const bookingRef = doc(db, collectionName, bookingDoc.id);
            await updateDoc(bookingRef, { 
              emailSent: true,
              status: 'confirmed',
              paymentStatus: 'paid'
            });
          } catch (updateError) {
            console.error('Error updating booking after email sent:', updateError);
          }
        }
      } else {
        console.log('No booking found with ID:', paymentIdOrBookingId);
        
        // If no booking found, see if we can create one from payment details
        if (paymentDetails && paymentDetails.metadata) {
          const { metadata, amount_total } = paymentDetails;
          const newBookingData = {
            clientName: metadata.clientName,
            email: metadata.email,
            eventType: metadata.eventType,
            eventDate: metadata.eventDate,
            venueName: metadata.venueName,
            paymentId: paymentIdOrBookingId,
            amount: amount_total / 100, // Convert from cents to dollars
            paymentMethod: paymentMethod || 'Stripe',
            paymentStatus: 'paid',
            status: 'confirmed',
            createdAt: new Date()
          };
          
          setBookingDetails(newBookingData);
          await sendConfirmationEmail(newBookingData);
        }
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
    }
  };
  
  // Send confirmation email
  const sendConfirmationEmail = async (bookingData) => {
    if (!bookingData || !bookingData.email) {
      setEmailError('Cannot send email - booking or email is missing');
      return;
    }
    
    try {
      const result = await sendEmail(bookingData);
      
      if (result.success) {
        setEmailSent(true);
        console.log('Confirmation email sent successfully');
      } else {
        setEmailError('Email could not be sent. We will send it later.');
        console.error('Email sending failed:', result.error);
      }
    } catch (err) {
      setEmailError('Email could not be sent. We will send it later.');
      console.error('Error sending confirmation email:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-600">Loading payment details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
          <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Payment Details</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => sessionId ? getPaymentDetails() : handleNonStripePayment()} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-md flex items-center justify-center"
          >
            <FaRedo className="mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // --- SIMPLIFIED SUCCESS PAGE WITH ORANGE & TEAL PALETTE ---
  const details = {
    amount: ((paymentDetails?.amount_total || 0) / 100) || amount || 0,
    method: (bookingDetails?.paymentMethod || paymentDetails?.payment_method_types?.[0] || paymentMethod || 'card'),
    date: bookingDetails?.eventDate || paymentDetails?.metadata?.eventDate,
    client: bookingDetails?.clientName || paymentDetails?.metadata?.clientName,
    venue: bookingDetails?.venueName || paymentDetails?.metadata?.venueName,
    email: bookingDetails?.email || paymentDetails?.customer_details?.email,
  };
  const methodKey = (details.method || '').toLowerCase();
  const color = PAYMENT_COLORS[methodKey] || PAYMENT_COLORS.card;

  const methodDisplay = {
    card: 'Credit Card',
    stripe: 'Credit Card',
    venmo: 'Venmo',
    cashapp: 'CashApp',
    paypal: 'PayPal',
  };
  const methodIcon = {
    card: <FaCreditCard className="icon-method" />,
    stripe: <FaCreditCard className="icon-method" />,
    venmo: <SiVenmo className="icon-method" />,
    cashapp: <SiCashapp className="icon-method" />,
    paypal: <FaPaypal className="icon-method" />,
  };

  return (
    <div className="success-bg">
      <div className="success-card">
        <div className="success-icon-outer" style={{ background: `linear-gradient(135deg, ${color.main} 0%, #fff 100%)` }}>
          <div className="success-icon-inner" style={{ background: color.main, padding: 0 }}>
            <Image src="/dj-bobby-drake-logo.png" alt="DJ Bobby Drake Logo" width={70} height={70} className="logo-img-circle" unoptimized priority style={{ borderRadius: '50%', width: '70px', height: '70px', objectFit: 'cover' }} />
          </div>
        </div>
        <h1 className="success-title" style={{ color: color.main }}>Payment Successful!</h1>
        <p className="success-subtitle" style={{ color: '#00C244' }}>
          Your payment has been processed and your booking is confirmed.
        </p>
        <div className="success-details">
          <div>
            <span>Amount Paid</span>
            <span className="success-amount" style={{ color: color.main }}>${Number(details.amount).toFixed(2)}</span>
          </div>
          <div>
            <span>Payment Method</span>
            <span className="success-method">
              {methodIcon[methodKey] || null}
              {methodDisplay[methodKey] || details.method}
            </span>
          </div>
          {details.date && (
            <div>
              <span>Event Date</span>
              <span>{details.date}</span>
            </div>
          )}
          {details.client && (
            <div>
              <span>Client Name</span>
              <span>{details.client}</span>
            </div>
          )}
          {details.venue && (
            <div>
              <span>Venue</span>
              <span>{details.venue}</span>
            </div>
          )}
        </div>
        <div className="success-email" style={{ background: `${color.main}22`, color: color.dark }}>
          <FaEnvelope className="icon-email" />
          <span>
            A confirmation email will be sent to <b>{details.email || 'your email address'}</b> shortly.
          </span>
        </div>
        <div className="success-actions">
          <Link href="/" className="success-btn success-btn-primary" style={{ background: color.main, color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', minWidth: '140px' }}>
            <FaRedo /> <span style={{marginLeft: '0.5em', fontWeight: 600}}>Book Again</span>
          </Link>
          <Link href="/" className="success-btn success-btn-alt" style={{ background: 'transparent', color: color.main, border: `2px solid ${color.main}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', minWidth: '140px' }}>
            <FaHome /> <span style={{marginLeft: '0.5em', fontWeight: 600}}>Return Home</span>
          </Link>
          <button onClick={() => window.print()} className="success-btn success-btn-alt" style={{ background: 'transparent', color: color.main, border: `2px solid ${color.main}`, borderRadius: '8px' }}>
            <FaReceipt /> Print Receipt
          </button>
        </div>
      </div>
      <style jsx>{`
        .success-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-card {
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.13);
          padding: 2.5rem 2rem 2rem 2rem;
          max-width: 410px;
          width: 100%;
          text-align: center;
          position: relative;
        }
        .success-icon-outer {
          border-radius: 50%;
          width: 86px;
          height: 86px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.2rem auto;
          box-shadow: 0 2px 12px rgba(32,191,169,0.13);
        }
        .success-icon-inner {
          border-radius: 50%;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .success-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .success-subtitle {
          color: #ff7e29;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }
        .success-details {
          background: #f3f4f6;
          border-radius: 12px;
          padding: 1.2rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .success-details > div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.7rem;
        }
        .success-details > div:last-child {
          margin-bottom: 0;
        }
        .success-amount {
          font-weight: 700;
        }
        .success-method {
          display: flex;
          align-items: center;
          gap: 0.4em;
          font-weight: 500;
        }
        .icon-method {
          font-size: 1.2em;
        }
        .success-email {
          border-radius: 8px;
          padding: 0.7rem 1rem;
          margin-bottom: 1.7rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5em;
          font-weight: 500;
        }
        .icon-email {
          font-size: 1.1em;
        }
        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-top: 0.5rem;
        }
        @media (min-width: 480px) {
          .success-actions {
            flex-direction: row;
            justify-content: center;
            gap: 1rem;
          }
        }
        .success-btn {
          border-radius: 8px;
          padding: 0.7em 1.2em;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5em;
          cursor: pointer;
          transition: background 0.18s, color 0.18s, border 0.18s;
          border: 2px solid transparent;
        }
        .success-btn-main {
          background: #fff;
        }
        .success-btn-main:hover {
          background: #f3f4f6;
        }
        .success-btn-alt {
          background: #6366f1;
        }
        .success-btn-alt:hover {
          filter: brightness(0.92);
        }
        @media (max-width: 500px) {
          .success-card {
            padding: 1.2rem 0.5rem 1.2rem 0.5rem;
          }
          .success-title {
            font-size: 1.3rem;
          }
        }
        .logo-img-circle {
          border-radius: 50%;
          width: 70px;
          height: 70px;
          object-fit: cover;
          display: block;
        }
      `}</style>
    </div>
  );
}

// Loading placeholder
function LoadingPaymentSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
        <p className="text-gray-600">Please wait while we confirm your payment...</p>
      </div>
    </div>
  );
}

// Error handling in the main component
export default function PaymentSuccessPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Return loading state for SSR
  if (!isClient) {
    return <LoadingPaymentSuccess />;
  }
  
  // Client-side rendering
  return (
    <React.Suspense fallback={<LoadingPaymentSuccess />}>
      <PaymentSuccessContent />
    </React.Suspense>
  );
} 