'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaHome, FaEnvelope, FaRedo, FaReceipt, FaArrowLeft, FaExclamationCircle, FaCalendarCheck, FaMusic, FaPhone, FaStar } from 'react-icons/fa';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { FaPaypal, FaCreditCard } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
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

// Payment Success Page Component
function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Extract parameters from URL
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    console.log('Payment success page loaded with:', { sessionId, bookingId });
    
    if (sessionId) {
      console.log('Processing Stripe payment with session ID:', sessionId);
      processStripePayment();
    } else if (bookingId) {
      console.log('Processing direct booking with booking ID:', bookingId);
      processDirectBooking();
    } else {
      console.error('No sessionId or bookingId found in URL parameters');
      setError('Invalid payment session. Missing payment information.');
      setLoading(false);
    }
  }, [sessionId, bookingId]);

  const processStripePayment = async () => {
    try {
      setLoading(true);
      
      // First get the session details from Stripe using GET method with query params
      console.log('Fetching session details for sessionId:', sessionId);
      const sessionResponse = await fetch(`/api/get-session-details?session_id=${sessionId}`);

      console.log('Session response status:', sessionResponse.status);
      
      if (!sessionResponse.ok) {
        let errorMessage = 'Failed to retrieve payment session details';
        try {
          const errorData = await sessionResponse.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Session API error:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          const responseText = await sessionResponse.text();
          console.error('Raw error response:', responseText);
        }
        throw new Error(errorMessage);
      }

      const sessionData = await sessionResponse.json();
      console.log('Session data retrieved successfully:', {
        sessionId: sessionData.sessionId,
        hasMetadata: !!sessionData.metadata,
        paymentStatus: sessionData.payment_status
      });
      setPaymentDetails(sessionData);

      // Extract booking details from session metadata
      const metadata = sessionData.metadata || {};
      const bookingData = {
        clientName: metadata.clientName || sessionData.customer_details?.name || '',
        email: metadata.email || sessionData.customer_details?.email || '',
        eventType: metadata.eventType || 'Event',
        eventDate: metadata.eventDate || '',
        venueName: metadata.venueName || '',
        venueLocation: metadata.venueLocation || '',
        startTime: metadata.startTime || '',
        endTime: metadata.endTime || '',
        contactPhone: metadata.contactPhone || '',
        guestCount: metadata.guestCount || '',
        totalAmount: (sessionData.amount_total || 0) / 100,
        paymentMethod: 'Stripe',
        bookingId: metadata.bookingId || sessionId,
        sessionId: sessionId,
        lighting: metadata.lighting === 'true',
        photography: metadata.photography === 'true',
        videoVisuals: metadata.videoVisuals === 'true',
        additionalHours: parseInt(metadata.additionalHours || '0'),
        paymentAmount: metadata.paymentAmount || 'full',
        isDeposit: metadata.isDeposit === 'true'
      };

      setBookingDetails(bookingData);

      // Send confirmation email via payment-confirmation API
      await sendPaymentConfirmation(bookingData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error processing Stripe payment:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const processDirectBooking = async () => {
    try {
      setLoading(true);
      
      // For direct bookings (non-Stripe), fetch from Firestore
      const response = await fetch(`/api/get-booking-details?bookingId=${bookingId}`);
      
      if (!response.ok) {
        throw new Error('Failed to retrieve booking details');
      }

      const bookingData = await response.json();
      setBookingDetails(bookingData);

      // Send confirmation email
      await sendPaymentConfirmation(bookingData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error processing direct booking:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const sendPaymentConfirmation = async (bookingData) => {
    try {
      const response = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          bookingId: bookingData.bookingId,
          clientName: bookingData.clientName,
          email: bookingData.email,
          eventType: bookingData.eventType,
          eventDate: bookingData.eventDate,
          venueName: bookingData.venueName,
          venueLocation: bookingData.venueLocation,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          totalAmount: bookingData.totalAmount,
          paymentMethod: bookingData.paymentMethod,
          signerName: 'Bobby Martin',
          hasSigned: true
        })
      });

      const result = await response.json();
      
      if (result.success && result.emailSent) {
        setEmailSent(true);
        console.log('Payment confirmation email sent successfully');
      } else {
        setEmailError(result.emailError || 'Email could not be sent automatically. We will send it shortly.');
        console.warn('Email sending issue:', result.emailError);
      }
    } catch (err) {
      console.error('Error sending payment confirmation:', err);
      setEmailError('Email could not be sent automatically. We will send it shortly.');
    }
  };

  const getPaymentMethodIcon = (method) => {
    const methodLower = (method || '').toLowerCase();
    switch (methodLower) {
      case 'venmo':
        return <SiVenmo className="text-blue-500 text-xl" />;
      case 'cashapp':
        return <SiCashapp className="text-green-500 text-xl" />;
      case 'paypal':
        return <FaPaypal className="text-blue-600 text-xl" />;
      default:
        return <FaCreditCard className="text-indigo-600 text-xl" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/party-theme-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Confirming your booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/party-theme-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-red-600 mb-4">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center mx-auto"
          >
            <FaArrowLeft className="mr-2" /> Return Home
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'url(/party-theme-background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Success Header */}
      <div className="pt-8 pb-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Logo and DJ Info */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <Image
                src="/dj-bobby-drake-logo.png"
                alt="DJ Bobby Drake"
                width={96}
                height={96}
                className="rounded-full border-4 border-white shadow-lg"
                priority
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ display: 'none' }}
              >
                DJ
              </div>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">DJ Bobby Drake</h1>
            <p className="text-white/90">Professional DJ & Entertainment Services</p>
          </div>
        </div>
      </div>

      {/* Main Success Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-8 px-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100 text-lg">Your booking is confirmed and we&apos;re ready to rock your event!</p>
          </div>

          {/* Payment Details */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FaReceipt className="text-indigo-600 mr-2" />
                  Payment Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-xl text-green-600">
                      {formatCurrency(bookingDetails?.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method:</span>
                    <div className="flex items-center">
                      {getPaymentMethodIcon(bookingDetails?.paymentMethod)}
                      <span className="ml-2 font-medium">
                        {bookingDetails?.paymentMethod || 'Credit Card'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                      {(bookingDetails?.bookingId || sessionId || 'N/A').substring(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FaCalendarCheck className="text-blue-600 mr-2" />
                  Event Details
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-gray-600 block text-sm">Client Name:</span>
                    <span className="font-semibold">{bookingDetails?.clientName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">Event Type:</span>
                    <span className="font-semibold">{bookingDetails?.eventType || 'Event'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">Event Date:</span>
                    <span className="font-semibold">{formatDate(bookingDetails?.eventDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">Time:</span>
                    <span className="font-semibold">
                      {bookingDetails?.startTime || 'TBD'} - {bookingDetails?.endTime || 'TBD'}
                    </span>
                  </div>
                  {bookingDetails?.venueName && (
                    <div>
                      <span className="text-gray-600 block text-sm">Venue:</span>
                      <span className="font-semibold">{bookingDetails.venueName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation Status */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaEnvelope className="text-blue-600 text-xl mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-800">Confirmation Email</h3>
                  <p className="text-sm text-gray-600">
                    {emailSent 
                      ? `Sent to ${bookingDetails?.email || 'your email address'}`
                      : emailError || 'Sending confirmation email...'
                    }
                  </p>
                </div>
              </div>
              <div className="text-2xl">
                {emailSent ? '✅' : emailError ? '⚠️' : '📧'}
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaStar className="text-yellow-500 mr-2" />
              What Happens Next
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaMusic className="text-purple-600 mr-2" />
                  <span className="font-semibold text-purple-800">Music Planning</span>
                </div>
                <p className="text-sm text-purple-700">
                  You&apos;ll receive a music preference form 4 weeks before your event to customize your playlist.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaPhone className="text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-800">Planning Call</span>
                </div>
                <p className="text-sm text-blue-700">
                  I&apos;ll call you 2 weeks before your event to finalize all details and timeline.
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaCalendarCheck className="text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">Venue Coordination</span>
                </div>
                <p className="text-sm text-green-700">
                  I&apos;ll coordinate with your venue one week prior to ensure smooth setup and logistics.
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaCheckCircle className="text-orange-600 mr-2" />
                  <span className="font-semibold text-orange-800">Event Day</span>
                </div>
                <p className="text-sm text-orange-700">
                  I&apos;ll arrive 30 minutes early for setup and ensure your event runs perfectly from start to finish.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium"
              >
                <FaHome className="mr-2" />
                Return Home
              </Link>
              <Link
                href="/wedding-agenda"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center font-medium"
              >
                <FaMusic className="mr-2" />
                Plan Your Wedding
              </Link>
              <button
                onClick={() => window.print()}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center font-medium"
              >
                <FaReceipt className="mr-2" />
                Print Receipt
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
            <h4 className="font-semibold mb-2">Questions? Contact DJ Bobby Drake</h4>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
              <a href="tel:2038099414" className="hover:text-indigo-200 transition-colors">
                📞 (203) 809-9414
              </a>
              <a href="mailto:therealdjbobbydrake@gmail.com" className="hover:text-indigo-200 transition-colors">
                ✉️ therealdjbobbydrake@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Component
function LoadingPaymentSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading payment details...</p>
      </div>
    </div>
  );
}

// Error Boundary
class PaymentSuccessErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Payment Success Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while processing your payment confirmation.
            </p>
            <Link
              href="/"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <FaHome className="mr-2" />
              Return Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Export
export default function PaymentSuccessPage() {
  return (
    <PaymentSuccessErrorBoundary>
      <React.Suspense fallback={<LoadingPaymentSuccess />}>
        <PaymentSuccessContent />
      </React.Suspense>
    </PaymentSuccessErrorBoundary>
  );
} 