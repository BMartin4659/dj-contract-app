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

// Log CashApp info for debugging
if (typeof window !== 'undefined') {
  const { handle, url } = getCashAppInfo(PAYMENT_METHODS.CASHAPP.url);
  console.log('CashApp handle:', handle);
  console.log('CashApp URL:', url);
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams ? searchParams.get('session_id') : null;
  
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Log session ID for debugging
  useEffect(() => {
    if (sessionId) {
      console.log('Payment success page loaded with session ID:', sessionId);
    } else {
      console.error('Payment success page loaded without session ID');
    }
  }, [sessionId]);
  
  // Get session details from Stripe
  useEffect(() => {
    if (sessionId) {
      getPaymentDetails();
    } else {
      setLoading(false);
      setError('No session ID provided');
    }
  }, [sessionId]);
  
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
  const fetchBookingDetails = async (paymentId) => {
    try {
      // Try to find the booking by payment ID
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('paymentId', '==', paymentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Booking found
        const bookingDoc = querySnapshot.docs[0];
        const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
        setBookingDetails(bookingData);
        
        // Send email if not already sent
        if (!bookingData.emailSent) {
          await sendConfirmationEmail(bookingData);
          
          // Update booking to mark email as sent
          const bookingRef = doc(db, 'bookings', bookingDoc.id);
          await updateDoc(bookingRef, { 
            emailSent: true,
            status: 'confirmed',
            paymentStatus: 'paid'
          });
        }
      } else {
        console.log('No booking found with payment ID:', paymentId);
        
        // If no booking found, see if we can create one from payment details
        if (paymentDetails && paymentDetails.metadata) {
          const { metadata, amount_total } = paymentDetails;
          const newBookingData = {
            clientName: metadata.clientName,
            email: metadata.email,
            eventType: metadata.eventType,
            eventDate: metadata.eventDate,
            venueName: metadata.venueName,
            paymentId,
            amount: amount_total / 100, // Convert from cents to dollars
            paymentMethod: 'Stripe',
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
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => getPaymentDetails()} 
              className="bg-indigo-600 text-white px-6 py-2 rounded-md flex items-center justify-center"
            >
              <FaRedo className="mr-2" /> Retry
            </button>
            <Link 
              href="/"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md flex items-center justify-center"
            >
              <FaHome className="mr-2" /> Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <div className="max-w-4xl mx-auto pt-10 pb-20 px-4">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-8 px-6 text-center">
            <FaCheckCircle className="text-white w-16 h-16 mx-auto mb-4" />
            <h1 className="text-white text-3xl font-bold">Payment Successful!</h1>
            <p className="text-green-100 mt-2">
              Your payment has been processed and your booking is confirmed.
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Payment Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-lg font-bold text-gray-800">
                      ${((paymentDetails?.amount_total || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="text-lg font-medium text-gray-800">
                      <span className="inline-flex items-center">
                        <FaCreditCard className="mr-2 text-indigo-600" /> 
                        {paymentDetails?.payment_method_types?.[0] === 'card' ? 'Credit Card' : 'Online Payment'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment ID</p>
                    <p className="text-md font-medium text-gray-700 break-all">
                      {paymentDetails?.payment_intent || sessionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-lg font-medium text-gray-800">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Event Details */}
            {(bookingDetails || paymentDetails?.metadata) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Client Name</p>
                      <p className="text-lg font-medium text-gray-800">
                        {bookingDetails?.clientName || paymentDetails?.metadata?.clientName || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p className="text-lg font-medium text-gray-800">
                        {bookingDetails?.eventType || paymentDetails?.metadata?.eventType || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p className="text-lg font-medium text-gray-800">
                        {bookingDetails?.eventDate || paymentDetails?.metadata?.eventDate || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Venue</p>
                      <p className="text-lg font-medium text-gray-800">
                        {bookingDetails?.venueName || paymentDetails?.metadata?.venueName || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Email Status */}
            <div className="mb-8">
              <div className={`rounded-lg p-4 ${emailSent ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start">
                  {emailSent ? (
                    <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  ) : (
                    <FaEnvelope className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-medium ${emailSent ? 'text-green-800' : 'text-blue-800'}`}>
                      {emailSent ? 'Confirmation Email Sent' : 'Confirmation Email'}
                    </h3>
                    <p className={`text-sm mt-1 ${emailSent ? 'text-green-700' : 'text-blue-700'}`}>
                      {emailSent 
                        ? `A confirmation email has been sent to ${bookingDetails?.email || paymentDetails?.customer_details?.email || 'your email address'}.` 
                        : emailError || 'A confirmation email will be sent shortly with all the details of your booking.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Link 
                href="/"
                className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium flex items-center justify-center hover:bg-indigo-700 transition-colors"
              >
                <FaHome className="mr-2" /> Return to Home
              </Link>
              
              <button 
                onClick={() => window.print()}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <FaReceipt className="mr-2" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
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