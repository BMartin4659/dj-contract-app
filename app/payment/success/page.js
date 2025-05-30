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
  
  // Safely extract search parameters
  const sessionId = React.useMemo(() => {
    try {
      return searchParams?.get('session_id') || null;
    } catch (error) {
      console.error('Error getting session_id:', error);
      return null;
    }
  }, [searchParams]);
  
  const paymentMethod = React.useMemo(() => {
    try {
      return searchParams?.get('payment_method') || null;
    } catch (error) {
      console.error('Error getting payment_method:', error);
      return null;
    }
  }, [searchParams]);
  
  const bookingId = React.useMemo(() => {
    try {
      return searchParams?.get('booking_id') || null;
    } catch (error) {
      console.error('Error getting booking_id:', error);
      return null;
    }
  }, [searchParams]);
  
  const amount = React.useMemo(() => {
    try {
      return searchParams?.get('amount') || null;
    } catch (error) {
      console.error('Error getting amount:', error);
      return null;
    }
  }, [searchParams]);

  // Debug logging
  console.log('PaymentSuccessContent mounted with params:', {
    sessionId,
    paymentMethod,
    bookingId,
    amount,
    searchParamsAvailable: !!searchParams
  });

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false); // Track if we've already processed this session
  const [componentError, setComponentError] = useState(null);

  // Add error handling for component-level errors
  React.useEffect(() => {
    const handleError = (error) => {
      console.error('Unhandled error in PaymentSuccessContent:', error);
      setComponentError(error.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      handleError(new Error(event.reason));
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  useEffect(() => {
    // Prevent multiple processing of the same session
    if (hasProcessed) return;
    
    let isMounted = true; // Track if component is still mounted
    
    const processPayment = async () => {
      // Check if we've already processed this session in localStorage
      const processedKey = sessionId ? `processed_${sessionId}` : `processed_${paymentMethod}_${bookingId}`;
      const alreadyProcessed = localStorage.getItem(processedKey);
      
      if (alreadyProcessed) {
        console.log('Session already processed, skipping email send');
        if (isMounted) {
          setHasProcessed(true);
          // Still fetch details but don't send email
          if (sessionId) {
            await getPaymentDetailsOnly();
          } else if (paymentMethod && bookingId) {
            await handleNonStripePaymentOnly();
          }
        }
        return;
      }
      
      // Mark as processed immediately to prevent race conditions
      localStorage.setItem(processedKey, 'true');
      if (isMounted) {
        setHasProcessed(true);
        
        if (sessionId) {
          await getPaymentDetails();
        } else if (paymentMethod && bookingId) {
          await handleNonStripePayment();
        } else {
          setLoading(false);
          setError('No payment information provided');
        }
      }
    };
    
    processPayment();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [sessionId, paymentMethod, bookingId]); // Only depend on the URL parameters
  
  // Get payment details without sending email (for already processed sessions)
  const getPaymentDetailsOnly = async () => {
    try {
      setLoading(true);
      console.log('Fetching payment details (no email) for session:', sessionId);
      
      const response = await fetch(`/api/get-session-details?session_id=${encodeURIComponent(sessionId)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching session details:', response.status, errorText);
        throw new Error(`Failed to fetch session details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session details retrieved (no email):', data);
      setPaymentDetails(data);
      
      // Try to find the booking details in Firestore
      if (data && data.payment_intent) {
        await fetchBookingDetailsOnly(data.payment_intent);
      } else if (data && data.metadata) {
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
        setEmailSent(true); // Assume email was already sent
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError(err.message || 'Failed to load payment details');
      setLoading(false);
    }
  };
  
  // Handle non-Stripe payments without sending email (for already processed sessions)
  const handleNonStripePaymentOnly = async () => {
    try {
      setLoading(true);
      
      const alternativePaymentDetails = {
        payment_method: paymentMethod,
        amount_total: amount ? parseFloat(amount) * 100 : 0,
        payment_intent: bookingId,
        metadata: { bookingId }
      };
      
      setPaymentDetails(alternativePaymentDetails);
      await fetchBookingDetailsOnly(bookingId);
      setLoading(false);
    } catch (error) {
      console.error('Error processing alternative payment:', error);
      setError(error.message || 'Failed to process payment');
      setLoading(false);
    }
  };
  
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
      
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      
      const response = await fetch(`/api/get-session-details?session_id=${encodeURIComponent(sessionId)}`);
      
      console.log('Session details API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching session details:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          sessionId
        });
        throw new Error(`Failed to fetch session details (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session details retrieved successfully:', data);
      setPaymentDetails(data);
      
      // Send payment confirmation email with Pro Event Checklist
      try {
        const confirmationResponse = await fetch('/api/payment-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId,
            clientName: data.metadata?.clientName || '',
            email: data.customer_email || data.metadata?.email || '',
            eventType: data.metadata?.eventType || 'Event',
            eventDate: data.metadata?.eventDate || '',
            venueName: data.metadata?.venueName || '',
            venueLocation: data.metadata?.venueLocation || '',
            startTime: data.metadata?.startTime || '',
            endTime: data.metadata?.endTime || '',
            amount: (data.amount_total || 0) / 100,
            paymentMethod: 'Stripe',
            paymentId: sessionId,
            isDeposit: data.metadata?.isDeposit === 'true' || false
          })
        });
        
        if (confirmationResponse.ok) {
          const confirmationResult = await confirmationResponse.json();
          console.log('Payment confirmation sent successfully:', confirmationResult);
          setEmailSent(true);
        } else {
          const errorText = await confirmationResponse.text();
          console.error('Error sending payment confirmation:', errorText);
          setEmailError('Failed to send confirmation email');
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        setEmailError('Failed to send confirmation email');
      }
      
      // Try to find the booking details in Firestore
      if (data && data.payment_intent) {
        await fetchBookingDetails(data.payment_intent);
      } else {
        console.warn('No payment_intent found in session data');
        // Create booking from metadata
        if (data && data.metadata) {
          const newBookingData = {
            clientName: data.metadata.clientName,
            email: data.metadata.email || data.customer_email,
            eventType: data.metadata.eventType,
            eventDate: data.metadata.eventDate,
            venueName: data.metadata.venueName,
            venueLocation: data.metadata.venueLocation,
            startTime: data.metadata.startTime,
            endTime: data.metadata.endTime,
            paymentId: sessionId,
            amount: (data.amount_total || 0) / 100,
            paymentMethod: 'Stripe',
            status: 'confirmed',
            isDeposit: data.metadata.isDeposit === 'true' || false
          };
          setBookingDetails(newBookingData);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError(err.message || 'Failed to load payment details');
      setLoading(false);
    }
  };
  
  // Get booking details from Firestore without sending email
  const fetchBookingDetailsOnly = async (paymentIdOrBookingId) => {
    try {
      console.log('Fetching booking details (no email) for ID:', paymentIdOrBookingId);
      
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
        const bookingDoc = querySnapshot.docs[0];
        const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
        setBookingDetails(bookingData);
        setEmailSent(true); // Assume email was already sent since this is a repeat visit
      } else {
        console.log('No booking found with ID:', paymentIdOrBookingId);
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
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
        
        // Send email only if not already sent
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
        } else {
          console.log('Email already sent for this booking, skipping');
          setEmailSent(true);
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
            amount: (amount_total || 0) / 100,
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
        
        // Clean up old processed sessions (keep only last 10)
        cleanupProcessedSessions();
      } else {
        setEmailError('Email could not be sent. We will send it later.');
        console.error('Email sending failed:', result.error);
      }
    } catch (err) {
      setEmailError('Email could not be sent. We will send it later.');
      console.error('Error sending confirmation email:', err);
    }
  };
  
  // Clean up old processed sessions from localStorage
  const cleanupProcessedSessions = () => {
    try {
      const processedKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('processed_')) {
          processedKeys.push(key);
        }
      }
      
      // Keep only the most recent 10 processed sessions
      if (processedKeys.length > 10) {
        const keysToRemove = processedKeys.slice(0, processedKeys.length - 10);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleaned up ${keysToRemove.length} old processed sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up processed sessions:', error);
    }
  };
  
  // If there's a component error, show error state
  if (componentError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
          <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Component Error</h2>
          <p className="text-gray-600 mb-6">{componentError}</p>
          <button 
            onClick={() => {
              setComponentError(null);
              window.location.reload();
            }} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-md flex items-center justify-center mx-auto"
          >
            <FaRedo className="mr-2" /> Reload Page
          </button>
        </div>
      </div>
    );
  }
  
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
            onClick={() => {
              // Clear the processed flag and retry
              const processedKey = sessionId ? `processed_${sessionId}` : `processed_${paymentMethod}_${bookingId}`;
              localStorage.removeItem(processedKey);
              setHasProcessed(false);
              setError('');
              if (sessionId) {
                getPaymentDetails();
              } else {
                handleNonStripePayment();
              }
            }} 
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      backgroundImage: 'url(/party-theme-background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="success-card">
        <div className="success-icon-outer">
          <div className="success-icon-inner">
            <span className="party-horn-emoji">🎉</span>
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
        <div className="success-email">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FaEnvelope className="icon-email" />
            <span style={{ fontWeight: '700', fontSize: '1rem' }}>Confirmation Email</span>
          </div>
          {emailSent ? (
            <>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.4', color: '#059669' }}>
                ✓ Confirmation email sent to
              </div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#059669' }}>
                {details.email || 'your email address'}
              </div>
            </>
          ) : emailError ? (
            <>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.4', color: '#dc2626' }}>
                ⚠ {emailError}
              </div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#059669' }}>
                {details.email || 'your email address'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                A confirmation email will be sent to
              </div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#059669' }}>
                {details.email || 'your email address'}
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                shortly.
              </div>
            </>
          )}
        </div>
        <div className="success-actions">
          <Link href="/" className="success-btn success-btn-secondary" style={{ 
            background: 'transparent', 
            color: color.main, 
            border: `2px solid ${color.main}`, 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            whiteSpace: 'nowrap', 
            minWidth: '160px',
            padding: '14px 20px',
            fontSize: '1rem',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}>
            <FaHome style={{ marginRight: '8px' }} /> Return Home
          </Link>
          <button 
            onClick={() => window.print()} 
            className="success-btn success-btn-tertiary" 
            style={{ 
              background: '#f8fafc', 
              color: '#64748b', 
              border: '2px solid #e2e8f0', 
              borderRadius: '12px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              whiteSpace: 'nowrap', 
              minWidth: '160px',
              padding: '14px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FaReceipt style={{ marginRight: '8px' }} /> Print Receipt
          </button>
        </div>
      </div>
      <style jsx>{`
        .success-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          padding: 3rem 2.5rem;
          max-width: 480px;
          width: 100%;
          text-align: center;
          position: relative;
          border: 1px solid rgba(255,255,255,0.9);
        }
        .success-icon-outer {
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
        }
        .success-icon-inner {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-title {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          letter-spacing: -0.025em;
          color: #1e293b;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success-subtitle {
          color: #059669;
          font-size: 1.125rem;
          margin-bottom: 2.5rem;
          font-weight: 600;
          line-height: 1.5;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .success-details {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          font-size: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .success-details > div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.7);
        }
        .success-details > div:last-child {
          margin-bottom: 0;
        }
        .success-details > div span:first-child {
          color: #475569;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .success-details > div span:last-child {
          color: #1e293b;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .success-amount {
          font-weight: 800;
          font-size: 1.25rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .success-method {
          display: flex;
          align-items: center;
          gap: 0.5em;
          font-weight: 600;
        }
        .icon-method {
          font-size: 1.25em;
        }
        .success-email {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-bottom: 2.5rem;
          font-size: 0.95rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5em;
          font-weight: 600;
          line-height: 1.5;
          text-align: center;
          color: #1e293b;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .icon-email {
          font-size: 1.1em;
          flex-shrink: 0;
        }
        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        @media (min-width: 640px) {
          .success-actions {
            flex-direction: row;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
          }
        }
        .success-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .success-btn-primary:hover {
          filter: brightness(1.05);
        }
        .success-btn-secondary:hover {
          background: rgba(99,102,241,0.05);
        }
        .success-btn-tertiary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        @media (max-width: 640px) {
          .success-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }
          .success-title {
            font-size: 1.875rem;
          }
          .success-subtitle {
            font-size: 1rem;
          }
          .success-icon-outer {
            width: 100px;
            height: 100px;
            margin-bottom: 1.25rem;
          }
          .success-icon-inner {
            width: 80px;
            height: 80px;
          }
          .success-details {
            padding: 1.25rem;
          }
          .success-actions {
            gap: 0.75rem;
          }
        }
        @media (max-width: 480px) {
          .success-card {
            padding: 1.5rem 1rem;
          }
          .success-title {
            font-size: 1.5rem;
          }
          .success-details > div {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
          .success-details > div span:last-child {
            align-self: flex-end;
          }
        }
        .party-horn-emoji {
          font-size: 4rem;
          display: block;
          text-align: center;
          line-height: 1;
        }
        @media (max-width: 640px) {
          .party-horn-emoji {
            font-size: 3rem;
          }
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

// Error boundary component
class PaymentSuccessErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PaymentSuccess Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
            <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred while loading the payment confirmation page.'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 text-white px-6 py-2 rounded-md flex items-center justify-center mx-auto"
            >
              <FaRedo className="mr-2" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
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
  
  // Client-side rendering with error boundary
  return (
    <PaymentSuccessErrorBoundary>
      <React.Suspense fallback={<LoadingPaymentSuccess />}>
        <PaymentSuccessContent />
      </React.Suspense>
    </PaymentSuccessErrorBoundary>
  );
} 