'use client';

// FORCE VERCEL DEPLOYMENT REFRESH - 2025-01-31 20:10 UTC
// CRITICAL CACHE BUSTING: Wedding event selection on main contract form
// Wedding events not working on Vercel deployment - USING V2 FUNCTIONS
// All wedding event types must trigger dynamic pricing and wedding agenda alerts

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, addDoc, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import StripeCheckout from '../components/StripeCheckout';
import Header from '../components/Header';
import EnvChecker from '../components/EnvChecker';
import EnvTest from '../components/EnvTest';
import { 
  FaCheckCircle, 
  FaShieldAlt,
  FaReceipt,
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt,
  FaUsers,
  FaBuilding,
  FaMapMarkerAlt,
  FaClock,
  FaLightbulb,
  FaCamera,
  FaVideo,
  FaCheck,
  FaPlus,
  FaMinus,
  FaPaypal,
  FaCreditCard,
  FaInfoCircle,
  FaMobileAlt,
  FaPhoneAlt,
  FaUserAlt,
  FaFacebookSquare, 
  FaInstagram, 
  FaArrowRight,
  FaPlayCircle,
  FaMusic,
  FaTimes,
  FaList,
  FaRegClock,
  FaFileAlt,
  FaRegMoneyBillAlt,
  FaSpinner,
  FaUserFriends,
  FaStickyNote,
  FaPlusCircle,
  FaMinusCircle,
  FaMoneyBillWave,
  FaMoneyCheck,
  FaInfo,
  FaQuestionCircle,
  FaDollarSign,
  FaExclamationTriangle,
  FaCaretRight,
  FaPaperPlane,
  FaBriefcase,
  FaExclamationCircle,
  FaStripe,
  FaArrowDown,
  FaDrum,
  FaPlay,
  FaExternalLinkAlt,
  FaClipboard,
  FaRegClipboard,
  FaRegCopy,
  FaRedo,
  FaClipboardList,
  FaChevronRight,
  FaStar,
  FaVolumeUp,
  FaRegCreditCard
} from 'react-icons/fa';
import { BsStripe } from 'react-icons/bs';
import { SiVenmo, SiCashapp, SiSpotify, SiApplemusic, SiYoutubemusic } from 'react-icons/si';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import Logo from '../components/Logo';
import LoadingDots from '../components/LoadingDots';

import { handleNavigationClick } from '../lib/eventHandlers';
import { isValidEmail, isValidPhoneNumber } from '../lib/validation';
import Footer from '../components/Footer';
import { getStreamingLogo } from './components/StreamingLogos';
import { CustomDatePicker } from './components/CustomDatePicker';
import { loadStripe } from '@stripe/stripe-js';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/app/styles/datepicker.css';

// Import the new ReactDatePickerField component
import ReactDatePickerField from './components/ReactDatePickerField';
import EventTypeDropdown from './components/EventTypeDropdown';

// Import the new SuppressHydration component
import SuppressHydration from './components/SuppressHydration';

// Import the event utilities - USING CONSOLIDATED FUNCTIONS
import { isWeddingEvent, getBasePrice } from './utils/eventUtils';

// Import the form context
import { useFormContext } from './contexts/FormContext';

// Import the optimized address autocomplete component
import AddressAutocomplete from './components/AddressAutocomplete';

// Dynamic import for client-only component with no SSR
import dynamic from 'next/dynamic';

// Constants and Pricing
const SERVICES = {
  BASE: 400,
  LIGHTING: 100,
  PHOTOGRAPHY: 150,
  VIDEO_VISUALS: 100,
  ADDITIONAL_HOUR: 75,
};

// Dynamic import for client-only component with no SSR
const WeddingAgendaCard = dynamic(() => import('./components/WeddingAgendaCard'), { ssr: false });

// Payment confirmation banner component
const PaymentConfirmation = ({ show, message }) => {
  if (!show) return null;
  
  return (
    <div className="payment-confirmation-banner" style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      zIndex: '1000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '15px',
      borderRadius: '0 0 8px 8px'
    }}>
      <div className="payment-confirmation-content" style={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <FaCheckCircle style={{ color: 'green', marginRight: '10px', fontSize: '24px', marginTop: '3px' }} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{message || 'Payment initiated successfully!'}</div>
          <div style={{ fontSize: '0.95rem', marginTop: '5px', color: '#555' }}>
            If you have any questions or concerns, please contact us at <a href="mailto:therealdjbobbydrake@gmail.com" style={{ color: '#0070f3', textDecoration: 'underline' }}>therealdjbobbydrake@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment confirmation banner component
const PaymentConfirmationBanner = ({ paymentMethod, onClose }) => {
  const getMessage = () => {
    switch(paymentMethod) {
      case 'Stripe':
        return 'Redirecting to Stripe for secure payment...';
      case 'Venmo':
        return 'Redirecting to Venmo. Complete your payment to confirm booking.';
      case 'CashApp':
        return 'Redirecting to Cash App. Complete your payment to confirm booking.';
      case 'PayPal':
        return 'Redirecting to PayPal. Complete your payment to confirm booking.';
      default:
        return 'Processing your payment...';
    }
  };

  return (
    <div className="payment-confirmation-banner" style={{
      position: 'fixed',
      top: '0',
      left: 0,
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      zIndex: '1000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      borderRadius: '0 0 8px 8px',
      height: '75px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="confirmation-content" style={{
        padding: '10px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        position: 'relative',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Payment Initiated</h3>
        <p style={{ margin: '0', fontSize: '14px' }}>{getMessage()}</p>
        <button onClick={onClose} className="close-btn" style={{
          position: 'absolute',
          top: '50%',
          right: '0',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer'
        }}>×</button>
      </div>
    </div>
  );
};

// Payment Option component
const PaymentOption = ({ method, isSelected, onSelect, color }) => (
  <div 
    onClick={onSelect}
    className="payment-option-item"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '18px',
      borderRadius: '8px',
      border: isSelected ? `2px solid ${color || '#0070f3'}` : '1px solid #ddd',
      backgroundColor: isSelected ? (color ? `${color}10` : 'rgba(0, 112, 243, 0.05)') : 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? `0 4px 8px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <input
      type="radio"
      name="paymentMethod"
      value={method}
      checked={isSelected}
      onChange={() => {}}
      style={{ display: 'none' }}
    />
    <div style={{ 
      fontWeight: isSelected ? '600' : '400',
      color: isSelected ? (color || '#0070f3') : '#333',
      fontSize: '1rem',
    }}>
      {method}
    </div>
  </div>
);

// Add at the top of the file after imports
// Payment method URL configurations
const PAYMENT_URLS = {
  VENMO: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
  CASHAPP: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$LiveCity',
  PAYPAL: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659'
};

// We won't use a direct URL for CashApp as deep linking isn't working reliably
const getCashAppInfo = () => {
  const baseURL = PAYMENT_URLS.CASHAPP;
  const username = baseURL.includes('$') ? baseURL.split('cash.app/').pop() : 'LiveCity';
  
  // Format the CashApp payment URL properly using a simple format
  const formatPaymentUrl = (amount = 0) => {
    // Remove $ if it exists at the beginning
    const cleanUsername = username.startsWith('$') ? username.substring(1) : username;
    
    // Use the official format for Cash App (simple version)
    return `https://cash.app/$${cleanUsername}`;
  };
  
  return {
    username: username,
    url: baseURL,
    formatPaymentUrl
  };
};

// Format CashApp URL with amount
const formatCashAppURL = (username, amount = 0) => {
  // Remove $ if it exists at the beginning
  const cleanUsername = username.startsWith('$') ? username.substring(1) : username;
  
  // Use the simplest format to avoid 404 errors
  return `https://cash.app/$${cleanUsername}`;
};

// Add this component before the main DJContractForm component
const PlaylistHelpModal = ({ streamingService, onClose }) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const stepStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #eaeaea',
    margin: '12px 0',
    transition: 'transform 0.2s ease',
    cursor: 'default',
    '&:hover': {
      transform: 'translateY(-2px)'
    },
  };

  const numberBadgeStyle = (color) => ({
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: color,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0
  });

  const getServiceColor = () => {
    switch(streamingService) {
      case 'spotify': return '#1DB954';
      case 'apple': return '#FC3C44';
      case 'youtube': return '#FF0000';
      case 'tidal': return '#000000';
      default: return '#0070f3';
    }
  };

  const getServiceIcon = () => {
    switch(streamingService) {
      case 'spotify': return '🎵';
      case 'apple': return '🎵';
      case 'youtube': return '▶️';
      case 'tidal': return '🎵';
      default: return '🎵';
    }
  };

  const getInstructions = () => {
    if (!streamingService) {
      return (
        <div className="space-y-6">
          <div style={{
            backgroundColor: '#0070f3',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {getStreamingLogo(null, 'w-8 h-8')}
            <h4 style={{ 
              margin: 0, 
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              Sharing Guide
            </h4>
          </div>
          
          <div style={{
            padding: '24px',
            backgroundColor: '#f5f9ff',
            borderRadius: '12px',
            border: '1px solid #e1e8ff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px' }}>👋</span>
              <div>
                <h5 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Welcome to the Playlist Sharing Guide!
                </h5>
                <p style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#555'
                }}>
                  To get started:
                </p>
              </div>
            </div>

            <ol style={{
              margin: '0',
              paddingLeft: '24px',
              listStyle: 'decimal',
              color: '#555'
            }}>
              <li style={{
                marginBottom: '12px',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                First, select your streaming service from the options below
              </li>
              <li style={{
                marginBottom: '12px',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                Once selected, I&apos;ll show you specific steps for sharing your playlist
              </li>
              <li style={{
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                Follow the steps to copy and paste your playlist link
              </li>
            </ol>
          </div>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f7f7f7',
            borderRadius: '12px',
            border: '1px solid #eaeaea'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <h5 style={{ 
                margin: 0,
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#333'
              }}>
                Pro Tip
              </h5>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#666',
              lineHeight: '1.5'
            }}>
              Make sure your playlist is set to &quot;Public&quot; so we can access it. Don&apos;t worry, you can change it back to private after we&apos;ve reviewed it.
            </p>
          </div>
        </div>
      );
    }

    const color = getServiceColor();
    const Logo = () => getStreamingLogo(streamingService, 'w-8 h-8');
    
    const steps = {
      'spotify': [
        'Open Spotify and go to your playlist',
        'Click the three dots (...) next to the playlist',
        'Select "Share" → "Copy link to playlist"',
        'Paste the copied link in the playlist field below'
      ],
      'apple': [
        'Open Apple Music and select your playlist',
        'Click the three dots (...) in the top right',
        'Choose "Share" → "Copy Link"',
        'Paste the copied link in the playlist field below'
      ],
      'youtube': [
        'Go to your YouTube playlist',
        'Click "SHARE" below the playlist title',
        'Click "Copy" to copy the link',
        'Paste the copied link in the playlist field below'
      ],
      'tidal': [
        'Open TIDAL and navigate to your playlist',
        'Click the three dots (...) menu',
        'Select "Share" → "Copy Link"',
        'Paste the copied link in the playlist field below'
      ]
    };

    const currentSteps = steps[streamingService] || [];

    return (
      <div className="space-y-6">
        <div style={{
          backgroundColor: color,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Logo />
          <h4 style={{ 
            margin: 0, 
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            {streamingService?.charAt(0).toUpperCase() + streamingService?.slice(1)} Sharing Guide
          </h4>
        </div>

        <div className="steps-container">
          {currentSteps.map((step, index) => (
            <div key={index} style={stepStyle}>
              <div style={numberBadgeStyle(color)}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0,
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#333'
                }}>
                  {step}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f7f7f7',
          borderRadius: '12px',
          border: '1px solid #eaeaea'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <h5 style={{ 
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#333'
            }}>
              Pro Tip
            </h5>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#666',
            lineHeight: '1.5'
          }}>
            Make sure your playlist is set to &quot;Public&quot; so we can access it. Don&apos;t worry, you can change it back to private after we&apos;ve reviewed it.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '90%',
          width: '400px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          transform: animateIn ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s ease-in-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: 'none',
            background: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            ':hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          ×
        </button>
        
        {getInstructions()}
      </div>
    </div>
  );
}

// Add this new component for the confirmation page
const BookingConfirmationPage = ({ formData, onSendEmail, onBookAgain }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState(null);
  
  // Add ToastContainer for email notifications if not already in the parent component
  useEffect(() => {
    // Check if ToastContainer already exists in the DOM
    if (!document.querySelector('.Toastify')) {
      // It will be created by the ToastContainer component when needed
      console.log('Toast container will be created when needed');
    }
  }, []);
  
  // Get payment details based on selected method
  const getPaymentDetails = () => {
    switch (formData.paymentMethod) {
      case 'Venmo':
        return {
          name: 'Venmo',
          icon: <SiVenmo style={{ fontSize: '1.8rem', color: '#3D95CE' }} />,
          color: '#3D95CE',
          background: '#EBF8FF',
          url: PAYMENT_URLS.VENMO
        };
      case 'CashApp':
        return {
          name: 'Cash App',
          icon: <SiCashapp style={{ fontSize: '1.8rem', color: '#00C244' }} />,
          color: '#00C244',
          background: '#F0FFF4',
          url: PAYMENT_URLS.CASHAPP
        };
      case 'PayPal':
        return {
          name: 'PayPal',
          icon: <FaPaypal style={{ fontSize: '1.8rem', color: '#0070BA' }} />,
          color: '#0070BA',
          background: '#EBF8FF',
          url: PAYMENT_URLS.PAYPAL
        };
      case 'Stripe':
        return {
          name: 'Stripe',
          icon: <FaCreditCard style={{ fontSize: '1.8rem', color: '#6772E5' }} />,
          color: '#6772E5',
          background: '#F3F4FF',
          url: null
        };
      default:
        return {
          name: formData.paymentMethod,
          icon: <FaDollarSign style={{ fontSize: '1.8rem', color: '#0070f3' }} />,
          color: '#0070f3',
          background: '#F3F9FF',
          url: null
        };
    }
  };
  
  const paymentDetails = getPaymentDetails();
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Handle email sending
  // Handle email sending - both auto-send and manual resend
  const handleSendEmail = async () => {
    if (emailSending) return;
    
    setEmailSending(true);
    setEmailError(null);
    
    try {
      // Ensure we have a valid bookingId
      if (!formData.bookingId) {
        setEmailError('Missing booking ID. Please try again or contact support.');
        return;
      }
      
      // Prepare email template parameters
      const templateParams = {
        // Required parameters
        bookingId: formData.bookingId,
        
        // Customer details
        clientName: formData.clientName,
        email: formData.email, 
        
        // Event details
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        venueName: formData.venueName,
        venueLocation: formData.venueLocation,
        startTime: formData.startTime,
        endTime: formData.endTime,
        
        // Payment details
        totalAmount: formData.totalAmount || 0,
        paymentMethod: formData.paymentMethod,
        
        // Additional info
        signerName: formData.signerName,
        hasSigned: 'Yes'
      };
      
      console.log('Sending confirmation email with parameters:', templateParams);
      const result = await onSendEmail(templateParams);
      
      if (result.success) {
        setEmailSent(true);
        console.log('Email sent successfully:', result);
        
        // Show a temporary success message
        toast.success("Confirmation email sent successfully!", {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        console.warn('Email sending failed:', result);
        setEmailError(result.fallbackMessage || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      setEmailError('An unexpected error occurred. Please try again later.');
    } finally {
      setEmailSending(false);
    }
  };
  
  // Send the confirmation email automatically when the component mounts
  useEffect(() => {
    // Only auto-send if we have the necessary booking info and email hasn't been sent
    if (formData.bookingId && formData.email && !emailSent && !emailSending && !emailError) {
      handleSendEmail();
    }
  }, []);
  
  // Handle payment button click
  const handlePaymentClick = async () => {
    if (formData.paymentMethod === 'Stripe') {
      try {
        // Calculate the amount to charge (in cents for Stripe)
        const amountInDollars = formData.paymentAmount === 'deposit' ? (formData.totalAmount / 2) : formData.totalAmount;
        const amountInCents = Math.round(amountInDollars * 100);
        
        console.log('Creating Stripe checkout with amount:', {
          amountInDollars,
          amountInCents,
          paymentAmount: formData.paymentAmount,
          totalAmount: formData.totalAmount
        });
        
        // Create Stripe checkout session
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInCents, // Amount in cents at root level
            contractDetails: {
              clientName: formData.clientName,
              email: formData.email,
              eventType: formData.eventType,
              eventDate: formData.eventDate,
              venueName: formData.venueName,
              venueLocation: formData.venueLocation,
              bookingId: formData.bookingId
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error('Error creating Stripe checkout:', error);
        alert('Unable to process Stripe payment. Please try again or contact support.');
      }
    } else if (paymentDetails.url) {
      // For other payment methods, use their direct URLs
      window.location.href = paymentDetails.url;
    }
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative',
      width: '100%',
      background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
      color: 'white'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        maxWidth: '90%',
        width: '650px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '20px' }}>
            <span role="img" aria-label="celebration" style={{ fontSize: '64px' }}>🎉</span>
          </div>
          <h1 style={{ 
            color: '#3b82f6', 
            marginBottom: '1rem', 
            fontSize: '2.2rem', 
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            Booking Confirmed!
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.5',
            marginBottom: '1rem',
            color: '#4b5563',
            fontWeight: '500'
          }}>
            Thank you for booking DJ Bobby Drake for your event!
          </p>
        </div>
        
        {/* Booking Details Section */}
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCalendarAlt style={{ color: '#3b82f6' }} />
            Event Details
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '0.95rem'
          }}>
            <div style={{ color: '#4b5563' }}>
              <strong>Event Type:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937' }}>{formData.eventType}</div>
            </div>
            
            <div style={{ color: '#4b5563' }}>
              <strong>Event Date:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937' }}>{formatDate(formData.eventDate)}</div>
            </div>
            
            <div style={{ color: '#4b5563' }}>
              <strong>Start Time:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937' }}>{formData.startTime}</div>
            </div>
            
            <div style={{ color: '#4b5563' }}>
              <strong>End Time:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937' }}>{formData.endTime}</div>
            </div>
            
            <div style={{ color: '#4b5563', gridColumn: '1 / span 2' }}>
              <strong>Venue:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937' }}>{formData.venueName}</div>
            </div>
            
            <div style={{ color: '#4b5563', gridColumn: '1 / span 2' }}>
              <strong>Location:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937' }}>{formData.venueLocation}</div>
            </div>
            
            <div style={{ color: '#4b5563' }}>
              <strong>Booking ID:</strong>
              <div style={{ marginTop: '4px', color: '#1f2937', fontFamily: 'monospace' }}>{formData.bookingId}</div>
            </div>
            
            <div style={{ color: '#4b5563' }}>
              <strong>Booking Status:</strong>
              <div style={{ 
                marginTop: '4px', 
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '500'
              }}>
                <FaCheckCircle size={14} /> Confirmed
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Section */}
        <div style={{
          background: paymentDetails.background,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          border: `1px solid ${paymentDetails.color}25`
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaMoneyBillWave style={{ color: paymentDetails.color }} />
            Payment Information
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>Payment Method</div>
                <div style={{ 
                  color: '#1f2937', 
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}>
                  {paymentDetails.icon} {paymentDetails.name}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>Amount</div>
                <div style={{ 
                  color: '#1f2937', 
                  fontWeight: '600',
                  fontSize: '1.25rem',
                  marginTop: '4px'
                }}>
                  ${formData.paymentAmount === 'deposit' ? (formData.totalAmount / 2) : formData.totalAmount}
                </div>
              </div>
            </div>
            
            {(paymentDetails.url || formData.paymentMethod === 'Stripe') && (
              <button
                onClick={handlePaymentClick}
                style={{
                  backgroundColor: paymentDetails.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '10px',
                  width: '100%'
                }}
              >
                {paymentDetails.icon} Complete Payment with {paymentDetails.name}
              </button>
            )}
            
            <p style={{ 
              fontSize: '0.85rem', 
              color: '#4b5563',
              marginTop: '5px',
              textAlign: 'center'
            }}>
              {formData.paymentAmount === 'deposit' 
                ? 'This is a 50% deposit. The remaining balance will be due on the event day.'
                : 'This is the full payment amount for your event.'}
            </p>
          </div>
        </div>
        
        {/* Email Status Section */}
        <div style={{
          background: emailError ? '#fff1f2' : emailSent ? '#f0fdf4' : '#f0f9ff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: `1px solid ${emailError ? '#fecdd3' : emailSent ? '#dcfce7' : '#bae6fd'}`,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '10px',
            color: emailError ? '#e11d48' : emailSent ? '#16a34a' : '#0284c7'
          }}>
            {emailError ? <FaExclamationCircle /> : emailSent ? <FaCheckCircle /> : <FaEnvelope />}
          </div>
          
          <h3 style={{
            color: emailError ? '#e11d48' : emailSent ? '#16a34a' : '#0284c7',
            fontSize: '1.1rem',
            marginBottom: '8px'
          }}>
            {emailError ? 'Email Delivery Issue' : emailSent ? 'Confirmation Email Sent' : 'Email Status'}
          </h3>
          
          <p style={{
            fontSize: '0.95rem',
            color: emailError ? '#9f1239' : emailSent ? '#14532d' : '#0c4a6e',
            marginBottom: '15px'
          }}>
            {emailError 
              ? emailError 
              : emailSent 
                ? `We've sent a confirmation email to ${formData.email}. Please check your inbox (and spam folder).` 
                : `We're sending your confirmation email to ${formData.email}...`}
          </p>
          
          <button
            onClick={handleSendEmail}
            disabled={emailSending}
            style={{
              backgroundColor: emailError ? '#e11d48' : emailSent ? '#16a34a' : '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 18px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: emailSending ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: emailSending ? 0.7 : 1,
              transition: 'all 0.2s ease',
              width: 'auto',
              margin: '0 auto'
            }}
          >
            {emailSending ? (
              <>
                <FaSpinner className="spin" /> Sending...
              </>
            ) : emailError ? (
              <>
                <FaRedo /> Try Again
              </>
            ) : emailSent ? (
              <>
                <FaEnvelope /> Resend Email
              </>
            ) : (
              <>
                <FaEnvelope /> Send Email
              </>
            )}
          </button>
        </div>
        
        {/* Actions Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginTop: '20px',
          marginBottom: '10px'
        }}>
          <button
            onClick={onBookAgain}
            style={{
              backgroundColor: 'transparent',
              color: '#3b82f6',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaCalendarAlt /> Book Another Event
          </button>
        </div>
        
        <div style={{
          fontSize: '0.85rem',
          color: '#6b7280',
          textAlign: 'center',
          marginTop: '25px'
        }}>
          <p>
            If you have any questions, please contact us at{' '}
            <a 
              href="mailto:therealdjbobbydrake@gmail.com"
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
            >
              therealdjbobbydrake@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function DJContractForm() {
  const router = useRouter();
  
  // Get form context (now returns default values if not available)
  const { contractFormData, weddingAgendaData, updateContractFormData, isClient: contextIsClient } = useFormContext();
  
  // Debug: Log context values on every render
  console.log('Contract form render - Context values:', {
    contractFormData,
    contextIsClient,
    contractFormDataKeys: Object.keys(contractFormData),
    hasUpdateFunction: typeof updateContractFormData === 'function'
  });
  
  // Initial form data with blank values
  const initialFormData = {
    clientName: '',
    email: '',
    contactPhone: '',
    eventType: '',
    guestCount: '100',
    venueName: '',
    venueLocation: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    lighting: false,
    photography: false,
    videoVisuals: false,
    additionalHours: 0,
    paymentAmount: 'deposit',
    paymentMethod: 'Stripe',
    musicPreferences: [],
    otherMusicPreference: '',
    streamingService: '',
    playlistLink: '',
    agreeToTerms: false,
    notes: '',
    signerName: '',
    bookingId: '' // To store the booking ID when created
  };

  // Initialize form data with the initial values, but check localStorage first
  const [formData, setFormData] = useState(() => {
    // Only check localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('djContractFormData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Initializing form with saved data:', parsedData);
          // Ensure all string fields have string values (not undefined)
          const sanitizedData = {};
          Object.keys(initialFormData).forEach(key => {
            if (typeof initialFormData[key] === 'string') {
              sanitizedData[key] = parsedData[key] || initialFormData[key] || '';
            } else if (typeof initialFormData[key] === 'boolean') {
              sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : initialFormData[key];
            } else if (typeof initialFormData[key] === 'number') {
              sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : initialFormData[key];
            } else if (Array.isArray(initialFormData[key])) {
              sanitizedData[key] = Array.isArray(parsedData[key]) ? parsedData[key] : initialFormData[key];
            } else {
              sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : initialFormData[key];
            }
          });
          return sanitizedData;
        }
      } catch (error) {
        console.error('Error loading saved data during initialization:', error);
      }
    }
    console.log('Initializing form with default data');
    return initialFormData;
  });
  
  // Terms and conditions text
  const termsAndConditionsText = `
Live City DJ Contract Terms and Conditions:

1. Booking & Deposit: A deposit of 50% is required to secure your date.
2. Cancellation Policy: Cancellations made less than 30 days before the event forfeit the full deposit.
3. Final Payment: Remaining balance is due on the day of the event before services begin.
4. Equipment: DJ provides all necessary sound equipment unless otherwise specified.
5. Venue Requirements: Client is responsible for providing adequate power supply and space.
6. Time Extensions: Additional hours beyond contracted time will be charged at $75/hour.
7. Force Majeure: Neither party shall be liable for failure to perform due to circumstances beyond reasonable control.
8. Breaks: For events longer than 4 hours, DJ is entitled to a 15-minute break per 2 hours of performance.
9. Liability: DJ is not responsible for any injuries or property damage caused by guests.
10. Media Rights: DJ may use event photos/videos for promotional purposes unless otherwise specified.
`;

  // Music genre options for playlist preferences
  const musicGenres = [
    { id: 'hiphop', label: 'Hip Hop' },
    { id: 'rnb', label: 'R&B' },
    { id: 'pop', label: 'Pop' },
    { id: 'dance', label: 'Dance/EDM' },
    { id: 'latin', label: 'Latin' },
    { id: 'reggae', label: 'Reggae/Dancehall' },
    { id: 'afrobeats', label: 'Afrobeats' },
    { id: 'house', label: 'House' },
    { id: 'trap', label: 'Trap' },
    { id: 'oldschool', label: 'Old School Classics' },
    { id: 'rock', label: 'Rock' },
    { id: 'country', label: 'Country' },
    { id: 'jazz', label: 'Jazz' },
    { id: 'other', label: 'Other' }
  ];

  // Music streaming services
  const streamingServices = [
    { id: 'spotify', label: 'Spotify', icon: 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png', placeholder: 'Paste your Spotify playlist link' },
    { id: 'apple', label: 'Apple Music', icon: 'https://www.apple.com/v/apple-music/s/images/overview/icon_apple_music__hbcmmzxl7ysy_large_2x.jpg', placeholder: 'Paste your Apple Music playlist link' },
    { id: 'youtube', label: 'YouTube', icon: 'https://www.youtube.com/img/desktop/yt_1200.png', placeholder: 'Paste your YouTube playlist link' },
    { id: 'tidal', label: 'TIDAL', icon: 'https://tidal.com/img/tidal-share-image.jpg', placeholder: 'Paste your TIDAL playlist link' }
  ];


  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  // Google Maps state is now handled by the AddressAutocomplete component
  const [isChangingPayment, setIsChangingPayment] = useState(false);
  const [hasSignature, setHasSignature] = useState(false); // Track signature status
  
  const [showStripe, setShowStripe] = useState(false);
  const [infoPopup, setInfoPopup] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [modalText, setModalText] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showPlaylistHelp, setShowPlaylistHelp] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [basePrice, setBasePrice] = useState(400); // Added setBasePrice state
  
  // Google Maps autocomplete is now handled by the AddressAutocomplete component
  
  // Debug function to manually reload form data
  const debugReloadFormData = () => {
    console.log('Manual reload triggered...');
    try {
      const savedData = localStorage.getItem('djContractFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Manual reload found data:', parsedData);
        
        setFormData(prev => {
          const mergedData = { ...prev, ...parsedData };
          console.log('Manual reload merged data:', mergedData);
          return mergedData;
        });
        
        if (parsedData.eventType) {
          const newBasePrice = getBasePriceForEventType(parsedData.eventType);
          setBasePrice(newBasePrice);
        }
      } else {
        console.log('Manual reload: No data found in localStorage');
      }
    } catch (error) {
      console.error('Manual reload error:', error);
    }
  };
  
  // Debug function to manually save test data
  const debugSaveTestData = () => {
    console.log('Saving test data...');
    const testData = {
      clientName: 'Test Client',
      email: 'test@example.com',
      contactPhone: '1234567890',
      eventType: 'wedding'
    };
    
    // Save via context
    updateContractFormData(testData);
    
    // Also save directly to localStorage for comparison
    localStorage.setItem('djContractFormData', JSON.stringify(testData));
    
    console.log('Test data saved:', testData);
  };
  
  // Helper function to get base price for event type - USING CONSOLIDATED LOGIC
  const getBasePriceForEventType = useCallback((eventType) => {
    console.log('getBasePriceForEventType called with:', eventType);
    
    // Use the consolidated function with V2 logic
    const price = getBasePrice(eventType);
    console.log('CONSOLIDATED: getBasePrice returned:', price, 'for:', eventType);
    
    return price;
  }, []);
  
  // Handler for event type changes
  const handleEventTypeChange = useCallback((e) => {
    const newEventType = e.target ? e.target.value : e;
    console.log('Event type changed to:', newEventType);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        eventType: newEventType
      };
      
      // Save to context for persistence
      updateContractFormData(newData);
      
      return newData;
    });
    
    // Update base price based on event type
    const newBasePrice = getBasePriceForEventType(newEventType);
    setBasePrice(newBasePrice);
    console.log('Base price updated to:', newBasePrice, 'for event type:', newEventType);
  }, [getBasePriceForEventType, updateContractFormData]);

  // Handler for base price updates
  const handleBasePriceUpdate = useCallback((price) => {
    console.log('Base price update requested:', price);
    setBasePrice(price);
  }, []);
  
  // Memoized service card style function for better performance
  const getServiceCardStyle = useCallback((serviceName) => {
    const isSelected = formData[serviceName] === true;
    return {
      backgroundColor: isSelected ? '#e6f3ff' : 'white',
      border: isSelected ? '2px solid #0070f3' : '1px solid #ddd',
      borderRadius: '12px',
      padding: 'clamp(16px, 3vw, 20px)',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? '0 4px 12px rgba(0, 112, 243, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
      transform: isSelected ? 'translateY(-2px)' : 'none',
      position: 'relative'
    };
  }, [formData.lighting, formData.photography, formData.videoVisuals]);
  
  // Convert time to minutes for better comparison
  const convertToMinutes = useCallback((t) => {
    if (!t) return 0;
    const [time, period] = t.split(' ');
    let [hour, minute] = time.split(':').map(Number);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    // Adjust early morning times (12:00 AM – 2:00 AM) to come *after* 11:30 PM
    const total = hour * 60 + minute;
    return total < 180 ? total + 1440 : total; // if before 3:00 AM, treat as after midnight
  }, []);

  // Time options for the dropdowns
  const timeOptions = [
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
    '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
    '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM'
  ];

  // Calculate hours between two time strings
  const calculateHoursBetween = useCallback((startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    // Convert both times to minutes
    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);
    
    // Calculate difference in minutes and convert to hours
    const diffMinutes = endMinutes - startMinutes;
    return diffMinutes / 60;
  }, [convertToMinutes]);

  // Calculate additional hours beyond base package (4 hours)
  const calculateAdditionalHours = useCallback((startTime, endTime) => {
    const totalHours = calculateHoursBetween(startTime, endTime);
    const basePackageHours = 4;
    
    return Math.max(0, Math.ceil(totalHours - basePackageHours));
  }, [calculateHoursBetween]);

  const calculateTotal = () => {
    let total = basePrice; // Use basePrice state instead of hardcoded value
    
    // Add cost of additional hours
    total += (formData.additionalHours || 0) * SERVICES.ADDITIONAL_HOUR;
    
    // Add cost of additional services
    if (formData.lighting) total += SERVICES.LIGHTING;
    if (formData.photography) total += SERVICES.PHOTOGRAPHY;
    if (formData.videoVisuals) total += SERVICES.VIDEO_VISUALS;
    
    return total;
  };

  // Calculate the deposit amount (50% of total)
  const calculateDepositAmount = () => {
    const total = calculateTotal();
    return Math.round(total * 0.5);
  };
  
  // Get the final amount to pay based on selection (deposit or full)
  const getAmountToPay = () => {
    return formData.paymentAmount === 'deposit' 
      ? calculateDepositAmount() 
      : calculateTotal();
  };
  
  const handleEndTimeChange = (endTime) => {
    // Calculate additional hours based on time difference
    const additionalHours = calculateAdditionalHours(formData.startTime, endTime);
    
    // Update form data with both new end time and calculated additional hours
    setFormData((prev) => ({ 
      ...prev, 
      endTime,
      additionalHours
    }));
  };
  
  // Set isClient to true when running on client side and force reload context data
  useEffect(() => {
    setIsClient(true);
    
    // Force reload context data when component mounts (user navigates back)
    if (typeof window !== 'undefined') {
      console.log('Component mounted, checking for saved form data...');
      console.log('localStorage contents:', {
        contractData: localStorage.getItem('djContractFormData'),
        agendaData: localStorage.getItem('djWeddingAgendaData')
      });
      
      // Small delay to ensure context is ready
      setTimeout(() => {
        try {
          const savedData = localStorage.getItem('djContractFormData');
          console.log('Raw localStorage data:', savedData);
          
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('Found saved contract data on mount:', parsedData);
            
            // Force update the form data
            setFormData(prev => {
              const mergedData = { ...prev, ...parsedData };
              console.log('Previous form data:', prev);
              console.log('Parsed saved data:', parsedData);
              console.log('Force updating form data on mount:', mergedData);
              return mergedData;
            });
            
            // Update base price if needed
            if (parsedData.eventType) {
              const newBasePrice = getBasePriceForEventType(parsedData.eventType);
              setBasePrice(newBasePrice);
              console.log('Force updating base price on mount:', newBasePrice);
            }
          } else {
            console.log('No saved data found in localStorage');
          }
        } catch (error) {
          console.error('Error force loading data on mount:', error);
        }
      }, 100);
    }
  }, [getBasePriceForEventType]);
  
  // Listen for page visibility changes to reload data when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isClient) {
        console.log('Page became visible, reloading form data...');
        
        try {
          const savedData = localStorage.getItem('djContractFormData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('Reloading contract data on visibility change:', parsedData);
            
            setFormData(prev => {
              // Sanitize the data to prevent undefined values
              const sanitizedData = {};
              Object.keys(initialFormData).forEach(key => {
                if (typeof initialFormData[key] === 'string') {
                  sanitizedData[key] = parsedData[key] || prev[key] || '';
                } else if (typeof initialFormData[key] === 'boolean') {
                  sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
                } else if (typeof initialFormData[key] === 'number') {
                  sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
                } else if (Array.isArray(initialFormData[key])) {
                  sanitizedData[key] = Array.isArray(parsedData[key]) ? parsedData[key] : prev[key];
                } else {
                  sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
                }
              });
              console.log('Updated form data on visibility change:', sanitizedData);
              return sanitizedData;
            });
            
            if (parsedData.eventType) {
              const newBasePrice = getBasePriceForEventType(parsedData.eventType);
              setBasePrice(newBasePrice);
            }
          }
        } catch (error) {
          console.error('Error reloading data on visibility change:', error);
        }
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isClient, getBasePriceForEventType]);
  
  // Listen for window focus to reload data when user navigates back
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isClient) {
        console.log('Window focused, reloading form data...');
        
        try {
          const savedData = localStorage.getItem('djContractFormData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('Reloading contract data on window focus:', parsedData);
            
            setFormData(prev => {
              // Sanitize the data to prevent undefined values
              const sanitizedData = {};
              Object.keys(initialFormData).forEach(key => {
                if (typeof initialFormData[key] === 'string') {
                  sanitizedData[key] = parsedData[key] || prev[key] || '';
                } else if (typeof initialFormData[key] === 'boolean') {
                  sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
                } else if (typeof initialFormData[key] === 'number') {
                  sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
                } else if (Array.isArray(initialFormData[key])) {
                  sanitizedData[key] = Array.isArray(parsedData[key]) ? parsedData[key] : prev[key];
                } else {
                  sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
                }
              });
              console.log('Updated form data on window focus:', sanitizedData);
              return sanitizedData;
            });
            
            if (parsedData.eventType) {
              const newBasePrice = getBasePriceForEventType(parsedData.eventType);
              setBasePrice(newBasePrice);
            }
          }
        } catch (error) {
          console.error('Error reloading data on window focus:', error);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
      
      return () => {
        window.removeEventListener('focus', handleWindowFocus);
      };
    }
  }, [isClient, getBasePriceForEventType]);
  
  // Listen for localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'djContractFormData' && e.newValue && isClient) {
        console.log('localStorage changed from another tab, reloading form data...');
        
        try {
          const parsedData = JSON.parse(e.newValue);
          console.log('Reloading contract data from storage event:', parsedData);
          
          setFormData(prev => {
            // Sanitize the data to prevent undefined values
            const sanitizedData = {};
            Object.keys(initialFormData).forEach(key => {
              if (typeof initialFormData[key] === 'string') {
                sanitizedData[key] = parsedData[key] || prev[key] || '';
              } else if (typeof initialFormData[key] === 'boolean') {
                sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
              } else if (typeof initialFormData[key] === 'number') {
                sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
              } else if (Array.isArray(initialFormData[key])) {
                sanitizedData[key] = Array.isArray(parsedData[key]) ? parsedData[key] : prev[key];
              } else {
                sanitizedData[key] = parsedData[key] !== undefined ? parsedData[key] : prev[key];
              }
            });
            console.log('Updated form data from storage event:', sanitizedData);
            return sanitizedData;
          });
          
          if (parsedData.eventType) {
            const newBasePrice = getBasePriceForEventType(parsedData.eventType);
            setBasePrice(newBasePrice);
          }
        } catch (error) {
          console.error('Error reloading data from storage event:', error);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isClient, getBasePriceForEventType]);
  
  // Sync with context data on mount and when context data changes
  useEffect(() => {
    console.log('Context sync effect triggered:', { contextIsClient, contractFormData });
    
    if (contextIsClient) {
      // Add a small delay to ensure localStorage has been loaded by the context
      setTimeout(() => {
        // Check localStorage directly as a fallback
        try {
          const savedData = localStorage.getItem('djContractFormData');
          console.log('Direct localStorage check:', savedData);
          
          let dataToMerge = contractFormData;
          
          // If context data is empty but localStorage has data, use localStorage data
          if ((!contractFormData || Object.keys(contractFormData).length === 0) && savedData) {
            dataToMerge = JSON.parse(savedData);
            console.log('Using localStorage data as fallback:', dataToMerge);
          }
          
          if (dataToMerge && Object.keys(dataToMerge).length > 0) {
            console.log('Syncing contract form with data:', dataToMerge);
            setFormData(prev => {
              // Sanitize the data to prevent undefined values
              const sanitizedData = {};
              Object.keys(initialFormData).forEach(key => {
                if (typeof initialFormData[key] === 'string') {
                  sanitizedData[key] = dataToMerge[key] || prev[key] || '';
                } else if (typeof initialFormData[key] === 'boolean') {
                  sanitizedData[key] = dataToMerge[key] !== undefined ? dataToMerge[key] : prev[key];
                } else if (typeof initialFormData[key] === 'number') {
                  sanitizedData[key] = dataToMerge[key] !== undefined ? dataToMerge[key] : prev[key];
                } else if (Array.isArray(initialFormData[key])) {
                  sanitizedData[key] = Array.isArray(dataToMerge[key]) ? dataToMerge[key] : prev[key];
                } else {
                  sanitizedData[key] = dataToMerge[key] !== undefined ? dataToMerge[key] : prev[key];
                }
              });
              console.log('Previous form data:', prev);
              console.log('Data to merge:', dataToMerge);
              console.log('Sanitized merged data:', sanitizedData);
              return sanitizedData;
            });
            
            // Update base price if event type is loaded
            if (dataToMerge.eventType) {
              const newBasePrice = getBasePriceForEventType(dataToMerge.eventType);
              setBasePrice(newBasePrice);
              console.log('Base price updated to:', newBasePrice, 'for event type:', dataToMerge.eventType);
            }
          } else {
            console.log('No contract form data available in context or localStorage');
          }
        } catch (error) {
          console.error('Error in context sync effect:', error);
        }
      }, 100); // Small delay to ensure context has loaded localStorage data
    } else {
      console.log('Context not yet client-side ready');
    }
  }, [contextIsClient, contractFormData, getBasePriceForEventType]);

  // Sync with wedding agenda data when available (for shared fields)
  useEffect(() => {
    if (contextIsClient && weddingAgendaData && Object.keys(weddingAgendaData).length > 0) {
      console.log('Contract form syncing with wedding agenda data:', weddingAgendaData);
      
      setFormData(prev => {
        const updatedData = { ...prev };
        let hasChanges = false;
        
        // Sync email if not set in contract form but available in wedding agenda
        if (weddingAgendaData.email && !prev.email) {
          updatedData.email = weddingAgendaData.email;
          hasChanges = true;
        }
        
        // Sync phone if not set in contract form but available in wedding agenda
        if (weddingAgendaData.phone && !prev.contactPhone) {
          updatedData.contactPhone = weddingAgendaData.phone;
          hasChanges = true;
        }
        
        // Sync event date if not set in contract form but available in wedding agenda
        if (weddingAgendaData.weddingDate && !prev.eventDate) {
          updatedData.eventDate = weddingAgendaData.weddingDate;
          hasChanges = true;
        }
        
        // Sync client name from bride/groom names if not set in contract form
        if ((weddingAgendaData.brideName || weddingAgendaData.groomName) && !prev.clientName) {
          const brideName = weddingAgendaData.brideName || '';
          const groomName = weddingAgendaData.groomName || '';
          updatedData.clientName = `${brideName} ${groomName}`.trim();
          hasChanges = true;
        }
        
        // If we made changes, save to context
        if (hasChanges) {
          console.log('Contract form updated with wedding agenda data:', updatedData);
          updateContractFormData(updatedData);
        }
        
        return hasChanges ? updatedData : prev;
      });
    }
  }, [contextIsClient, weddingAgendaData, updateContractFormData]);
  
  // Force reload data when component mounts (for navigation scenarios)
  useEffect(() => {
    if (isClient) {
      console.log('Component mounted, forcing data reload...');
      
      // Force reload from localStorage on mount
      try {
        const savedData = localStorage.getItem('djContractFormData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Force reload on mount found data:', parsedData);
          
          setFormData(prev => {
            // Only merge if the saved data has more information than current form
            const hasMoreData = Object.keys(parsedData).some(key => 
              parsedData[key] && parsedData[key] !== '' && 
              (!prev[key] || prev[key] === '')
            );
            
            if (hasMoreData) {
              const mergedData = { ...prev, ...parsedData };
              console.log('Force merging data on mount:', mergedData);
              return mergedData;
            } else {
              console.log('Current form data is more complete, not overriding');
              return prev;
            }
          });
          
          if (parsedData.eventType) {
            const newBasePrice = getBasePriceForEventType(parsedData.eventType);
            setBasePrice(newBasePrice);
            console.log('Force updated base price on mount:', newBasePrice);
          }
        }
      } catch (error) {
        console.error('Error in force reload on mount:', error);
      }
    }
  }, [isClient, getBasePriceForEventType]);
  
  // Update base price when event type changes
  useEffect(() => {
    if (formData.eventType) {
      const newBasePrice = getBasePriceForEventType(formData.eventType);
      if (newBasePrice !== basePrice) {
        setBasePrice(newBasePrice);
        console.log('Base price updated to:', newBasePrice, 'for event type:', formData.eventType);
      }
    }
  }, [formData.eventType, basePrice, getBasePriceForEventType]);

  // Google Maps autocomplete is now handled by the AddressAutocomplete component
  // Removed duplicate initialization code to prevent conflicts


  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    
    if (type === 'checkbox') {
      console.log(`Setting ${name} to ${checked} (checkbox)`);
    }
    
    setFormData((prev) => {
      let newData;
      
      // Special handler for musicPreferences checkboxes
      if (name.startsWith('music_')) {
        const genreId = name.replace('music_', '');
        let updatedPreferences = [...prev.musicPreferences];
        
        if (checked) {
          // Add genre to preferences if checked and not already there
          if (!updatedPreferences.includes(genreId)) {
            updatedPreferences.push(genreId);
          }
        } else {
          // Remove genre from preferences if unchecked
          updatedPreferences = updatedPreferences.filter(id => id !== genreId);
        }
        
        newData = {
          ...prev,
          musicPreferences: updatedPreferences
        };
      } else {
        // Default handler for other form fields
        newData = {
          ...prev,
          [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
        };
      }
      
      console.log(`Updated formData ${name}:`, newData[name]);
      console.log('Full form data being saved to context:', newData);
      
      // Defer context update to avoid setState during render
      setTimeout(() => {
        updateContractFormData(newData);
      }, 0);
      
      // Also save directly to localStorage as backup
      try {
        localStorage.setItem('djContractFormData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      return newData;
    });
  };

  // Basic manual address validation: requires at least one letter, one number, and at least 5 characters.
  const validateAddress = (address) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d).{5,}$/;
    return regex.test(address);
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^[0-9]{10}$/.test(cleaned);
  };

  // Replacement for EmailJS functionality with Firebase API call
  const sendConfirmationEmail = async (templateParams) => {
    try {
      // Validate required parameters for the API
      if (!templateParams.bookingId) {
        console.error("Missing required bookingId parameter");
        return {
          success: false,
          error: "Missing required bookingId parameter",
          fallbackMessage: "Could not send confirmation email: missing booking ID."
        };
      }
      
      // Make sure we have an email to send to
      if (!templateParams.email) {
        console.error("Missing required email parameter");
        return {
          success: false,
          error: "Missing required email parameter",
          fallbackMessage: "Could not send confirmation email: missing email address."
        };
      }
      
      // Log what we're sending to help with debugging
      console.log('Sending confirmation email with parameters:', {
        bookingId: templateParams.bookingId,
        email: templateParams.email,
        paymentMethod: templateParams.paymentMethod
      });
      
      // Make API call to our own backend to handle email sending
      const response = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateParams),
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`Server returned ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📧 Email sent successfully:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to send confirmation email:", error);
      
      // Log specific error details for debugging
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.details) console.error("Error details:", error.details);
      
      // Return a structured error response
      return {
        success: false,
        error: error.message || "Failed to send confirmation email",
        fallbackMessage: "We've saved your booking but couldn't send the confirmation email. We'll contact you shortly."
      };
    }
  };

  const validateForm = () => {
    let errors = {};
    
    // Validate required fields
    if (!formData.clientName) errors.clientName = 'Client name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.contactPhone) errors.contactPhone = 'Phone number is required';
    if (!formData.eventType) errors.eventType = 'Event type is required';
    if (!formData.venueName) errors.venueName = 'Venue name is required';
    if (!formData.venueLocation) errors.venueLocation = 'Venue location is required';
    if (!formData.eventDate) errors.eventDate = 'Event date is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (!formData.paymentMethod) errors.paymentMethod = 'Payment method is required';
    if (!formData.agreeToTerms) errors.agreeToTerms = 'You must agree to the terms and conditions';
    if (!formData.signerName.trim()) errors.signerName = 'Please enter your name to sign';
    
    // Validate email format
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Validate phone format
    if (formData.contactPhone && !validatePhone(formData.contactPhone)) {
      errors.contactPhone = 'Please enter a valid phone number';
    }
    
    // Validate venue location
    if (formData.venueLocation && !validateAddress(formData.venueLocation)) {
      errors.venueLocation = 'Please enter a valid address';
    }
    
    // If there are errors, update state and return false
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    // Clear any previous errors
    setFormErrors({});
    return true;
  };

  // Create a success page URL for non-Stripe payment methods
  const createSuccessPageUrl = (bookingId, paymentMethod, amount) => {
    const baseUrl = window.location.origin + '/payment/success';
    const params = new URLSearchParams();
    params.append('booking_id', bookingId);
    params.append('payment_method', paymentMethod);
    if (amount) params.append('amount', amount);
    return `${baseUrl}?${params.toString()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any other handlers
    setIsSubmitting(true);
    setSubmitError(null);
    setShowConfirmation(false); // Reset any existing confirmation message

    try {
      // Validate form data
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Check payment method selection
      if (!formData.paymentMethod) {
        setFormErrors(prev => ({
          ...prev,
          paymentMethod: 'Please select a payment method'
        }));
        setIsSubmitting(false);
        
        // Scroll to payment method section
        const paymentMethodSection = document.querySelector('.payment-options');
        if (paymentMethodSection) {
          paymentMethodSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      
      // For Stripe payments, use the dedicated Stripe payment handler
      if (formData.paymentMethod === 'Stripe') {
        handleStripeButtonClick();
        return;
      }

      // Save form data first
      console.log("Saving form data before payment redirection");
      const docRef = await addDoc(collection(db, 'djContracts'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'redirecting_to_payment',
        totalAmount: calculateTotal(),
        depositAmount: calculateDepositAmount(),
        paymentMethod: formData.paymentMethod
      });

      console.log("Document written with ID: ", docRef.id);
      const bookingId = docRef.id;

      // Prepare email template parameters but don't send yet
      const templateParams = {
        clientName: formData.clientName,
        email: formData.email,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        venueName: formData.venueName,
        venueLocation: formData.venueLocation,
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalAmount: calculateTotal(),
        paymentMethod: formData.paymentMethod,
        bookingId: docRef.id,
        signerName: formData.signerName,
        hasSigned: hasSignature ? 'Yes' : 'No'
      };
      
      // For payment methods like Venmo, CashApp, and PayPal, show confirmation page
      if (formData.paymentMethod === 'Venmo' || formData.paymentMethod === 'CashApp' || formData.paymentMethod === 'PayPal') {
        console.log(`Setting up confirmation for ${formData.paymentMethod} payment`);
        
        // Update document with payment initiated status
        try {
          await updateDoc(doc(db, 'djContracts', bookingId), {
            status: 'payment_initiated',
            bookingConfirmed: true
          });
        } catch (updateError) {
          console.error("Error updating document status:", updateError);
        }
        
        // Send confirmation email automatically
        try {
          const emailResult = await sendConfirmationEmail(templateParams);
          if (emailResult.success) {
            console.log("Confirmation email sent successfully");
            await updateDoc(doc(db, 'djContracts', bookingId), {
              confirmationSent: true,
              emailSentAt: serverTimestamp()
            });
          } else {
            console.warn("Email sending failed:", emailResult.error);
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }
        
        // Show the confirmation page with integrated payment options
        setSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      // This code will only run if we're not redirecting to a payment platform
      // Send confirmation email
      const emailResult = await sendConfirmationEmail(templateParams);

      if (emailResult.success) {
        // Update the document with email confirmation
        try {
          await updateDoc(doc(db, 'djContracts', docRef.id), {
            confirmationSent: true,
            status: 'emailSent'
          });
        } catch (updateError) {
          console.error("Error updating document status:", updateError);
        }
      } else {
        console.warn("Email sending failed:", emailResult.error);
        // Show a user-friendly message but don't block form submission
        setSubmitError(emailResult.fallbackMessage || "We'll send your confirmation email shortly.");
      }

      // Only show success state for fallback or other payment methods
      setSubmitted(true);
      setShowConfirmation(true);

    } catch (error) {
      console.error("Error in form submission:", error);
      setSubmitError("An error occurred while submitting the form. Please try again or contact support.");
      setIsSubmitting(false);
    }
  };

  // Add payment confirmation component
  const PaymentInstructions = ({ paymentMethod, bookingId }) => {
    const [copySuccess, setCopySuccess] = useState(false);

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        setShowErrorMessage('Failed to copy to clipboard');
      }
    };

    const getPaymentDetails = () => {
      switch (paymentMethod) {
        case 'Venmo':
          return {
            username: '@Bobby-Martin-64',
            color: '#3D95CE',
            url: PAYMENT_URLS.VENMO,
            icon: <SiVenmo className="w-5 h-5" />
          };
        case 'CashApp':
          return {
            username: '$LiveCity',
            color: '#00C244',
            url: PAYMENT_URLS.CASHAPP,
            icon: <SiCashapp className="w-5 h-5" />
          };
        case 'PayPal':
          return {
            username: 'paypal.me/bmartin4659',
            color: '#0070BA',
            url: PAYMENT_URLS.PAYPAL,
            icon: <FaPaypal className="w-5 h-5" />
          };
        default:
          return null;
      }
    };

    const handlePayment = () => {
      // Open payment app based on type - direct to payment platform using replace
      if (paymentMethod === 'Venmo') {
        window.location.replace(PAYMENT_URLS.VENMO);
      } else if (paymentMethod === 'CashApp') {
        window.location.replace(PAYMENT_URLS.CASHAPP);
      } else if (paymentMethod === 'PayPal') {
        window.location.replace(PAYMENT_URLS.PAYPAL);
      }
    };

    const paymentDetails = getPaymentDetails();

    return (
      <div className="payment-instructions bg-white rounded-lg shadow-lg p-6 mt-8">
        <h3 className="text-2xl font-semibold text-primary mb-4">
          Payment Instructions for {paymentMethod}
        </h3>
        
        <div className="mb-6 space-y-2">
          <p className="text-lg">
            <strong>Amount Due:</strong> ${calculateDepositAmount()}
          </p>
          <p className="text-lg">
            <strong>Booking Reference:</strong> {bookingId}
          </p>
        </div>

        {paymentDetails && (
          <div className="space-y-4">
            <p className="text-lg">
              Please send payment to: <strong>{paymentDetails.username}</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => copyToClipboard(paymentDetails.username)}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-white transition-all"
                style={{ backgroundColor: paymentDetails.color }}
              >
                {copySuccess ? (
                  <>
                    <FaCheckCircle className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <FaMobileAlt className="w-5 h-5" />
                    <span>Copy Username</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handlePayment}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-white transition-all"
                style={{ backgroundColor: paymentDetails.color }}
              >
                {paymentDetails.icon}
                <span>Pay Now &amp; Continue</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Success message component
  const SuccessMessage = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <FaCheckCircle />
      <div>
        <p style={{ margin: 0, fontWeight: '500' }}>Booking Submitted Successfully!</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Please check your email for confirmation details.
        </p>
      </div>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ message }) => (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#f44336',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <FaInfoCircle />
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#333',
    fontSize: 'clamp(16px, 2.5vw, 18px)'
  };

  const inputStyle = {
    backgroundColor: 'white',
    width: '100%',
    padding: 'clamp(12px, 2vw, 16px)',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    color: 'black',
    fontSize: 'clamp(16px, 2.5vw, 18px)'
  };

  const iconStyle = {
    marginRight: '8px',
    fontSize: '18px',
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
  };

  const fieldIcons = {
    clientName: <FaUserAlt style={{...iconStyle, color: '#4299E1'}} />,
    email: <FaEnvelope style={{...iconStyle, color: '#ED8936'}} />,
    contactPhone: <FaPhoneAlt style={{...iconStyle, color: '#48BB78'}} />,
    eventType: <FaCalendarAlt style={{...iconStyle, color: '#9F7AEA'}} />,
    guestCount: <FaUsers style={{...iconStyle, color: '#F56565'}} />,
    venueName: <FaBuilding style={{...iconStyle, color: '#38B2AC'}} />,
  };

  const venueLocationIcon = <FaMapMarkerAlt style={{...iconStyle, color: '#FC8181'}} />;
  const timeIcons = {
    eventDate: <FaCalendarAlt style={{...iconStyle, color: '#D53F8C'}} />,
    startTime: <FaClock style={{...iconStyle, color: '#805AD5'}} />,
    endTime: <FaClock style={{...iconStyle, color: '#3182CE'}} />,
  };
  const serviceIcons = {
    lighting: <FaLightbulb style={{...iconStyle, color: '#ECC94B'}} />,
    photography: <FaCamera style={{...iconStyle, color: '#4FD1C5'}} />,
    videoVisuals: <FaVideo style={{...iconStyle, color: '#F687B3'}} />,
  };
  const additionalHoursIcon = <FaClock style={{...iconStyle, color: '#68D391'}} />;
  const paymentIcons = {
    Stripe: <FaCreditCard className="payment-icon" style={{ fontSize: '24px', marginRight: '10px', color: '#6772E5' }} />,
    Venmo: <SiVenmo className="payment-icon" style={{ fontSize: '24px', marginRight: '10px', color: '#3D95CE' }} />,
    CashApp: <SiCashapp className="payment-icon" style={{ fontSize: '24px', marginRight: '10px', color: '#00C244' }} />,
    PayPal: <FaPaypal className="payment-icon" style={{ fontSize: '24px', marginRight: '10px', color: '#0070BA' }} />
  };

  const itemizedTotal = () => (
    <ul className="event-summary-list" style={{ listStyle: 'none', padding: 0, marginTop: '1rem', color: '#000' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <span style={{ flex: '1 1 auto' }}>
          {isWeddingEvent(formData.eventType) ? '💍 Wedding Package' : '🎶 Base Package'}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}>${basePrice}</span>
      </div>
      {formData.lighting && <li>💡 Lighting: ${SERVICES.LIGHTING}</li>}
      {formData.photography && <li>📸 Event Photography: ${SERVICES.PHOTOGRAPHY}</li>}
      {formData.videoVisuals && <li>📽️ Video Visuals: ${SERVICES.VIDEO_VISUALS}</li>}
      {formData.additionalHours > 0 && (
        <li>⏱️ Additional Hours: ${formData.additionalHours * SERVICES.ADDITIONAL_HOUR}</li>
      )}
      <li className="event-total" style={{
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #ddd',
        fontWeight: 'bold'
      }}>
        <strong>Subtotal: ${calculateTotal()}</strong>
      </li>
      
      {/* Show the payment amount based on selection */}
      <li style={{ 
        marginTop: '5px',
        fontWeight: formData.paymentAmount === 'deposit' ? 'bold' : 'normal',
        color: formData.paymentAmount === 'deposit' ? '#0070f3' : 'inherit'
      }}>
        {formData.paymentAmount === 'deposit' ? (
          <>💵 <strong>Deposit (50%): ${calculateDepositAmount()}</strong></>
        ) : (
          <>💵 Deposit (50%): ${calculateDepositAmount()}</>
        )}
      </li>
      
      <li style={{ 
        marginTop: '5px',
        fontWeight: formData.paymentAmount === 'full' ? 'bold' : 'normal',
        color: formData.paymentAmount === 'full' ? '#0070f3' : 'inherit'
      }}>
        {formData.paymentAmount === 'full' ? (
          <>💰 <strong>Full Payment: ${calculateTotal()}</strong></>
        ) : (
          <>💰 Full Payment: ${calculateTotal()}</>
        )}
      </li>
      
      <li className="amount-to-pay" style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: 'rgba(0, 112, 243, 0.1)',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textAlign: 'center'
      }}>
        <strong>Amount to Pay: ${getAmountToPay()}</strong>
      </li>
    </ul>
  );

  // InfoModal component for displaying info popups with an "Ok" button.
  function InfoModal({ text, onClose }) {
    // Clean modal without dark overlay - shows near the checkbox
    return (
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '32px 28px 24px 28px',
          borderRadius: '14px',
          maxWidth: '90%',
          width: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          border: '2px solid #0070f3',
          zIndex: 1000,
        }}
      >
        <h3 style={{ marginBottom: '16px', color: '#0070f3', fontWeight: 700, fontSize: '1.35rem', letterSpacing: 0 }}>Terms and Conditions</h3>
        <div 
          style={{ 
            overflowY: 'auto', 
            flex: '1 1 auto',
            marginBottom: '20px',
            paddingRight: '5px',
            WebkitOverflowScrolling: 'touch' // Enable smooth scrolling on iOS
          }}
        >
          <p style={{ marginBottom: '18px', color: '#333', fontSize: '1rem', lineHeight: 1.6 }}>
            Please review the following terms before submitting your booking:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '22px', color: '#222', fontSize: '1rem', lineHeight: 1.7 }}>
            <li style={{ marginBottom: '10px' }}><b>Booking & Deposit:</b> A <b>deposit of 50%</b> is required to secure your date.</li>
            <li style={{ marginBottom: '10px' }}><b>Cancellation Policy:</b> Cancellations made less than <b>30 days</b> before the event forfeit the full deposit.</li>
            <li style={{ marginBottom: '10px' }}><b>Final Payment:</b> Remaining balance is due on the day of the event <b>before services begin</b>.</li>
            <li style={{ marginBottom: '10px' }}><b>Equipment:</b> DJ provides all necessary sound equipment unless otherwise specified.</li>
            <li style={{ marginBottom: '10px' }}><b>Venue Requirements:</b> Client is responsible for providing adequate power supply and space.</li>
            <li style={{ marginBottom: '10px' }}><b>Time Extensions:</b> Additional hours beyond contracted time will be charged at <b>$75/hour</b>.</li>
            <li style={{ marginBottom: '10px' }}><b>Force Majeure:</b> Neither party is liable for failure to perform due to circumstances beyond reasonable control.</li>
            <li style={{ marginBottom: '10px' }}><b>Breaks:</b> For events longer than 4 hours, DJ is entitled to a <b>15-minute break per 2 hours</b> of performance.</li>
            <li style={{ marginBottom: '10px' }}><b>Liability:</b> DJ is not responsible for any injuries or property damage caused by guests.</li>
            <li style={{ marginBottom: '10px' }}><b>Media Rights:</b> DJ may use event photos/videos for promotional purposes unless otherwise specified.</li>
          </ul>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            width: '100%'
          }}
        >
          Ok
        </button>
      </div>
    );
  }

  // PaymentModal component for displaying payment information with HTML content
  function PaymentModal({ htmlContent, onClose }) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            maxWidth: '500px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            border: '2px solid #0070f3',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '15px',
              width: '100%'
            }}
          >
            Ok
          </button>
        </div>
      </div>
    );
  }

  // Create a more direct payment method handler that doesn't rely on async processing
  // Update handlePaymentMethodSelect to be more direct
  const handlePaymentMethodSelect = useCallback((method) => {
    // Direct assignment for immediate UI feedback
    document.querySelectorAll('.payment-option').forEach(el => {
      el.style.border = el.dataset.method === method 
        ? '2px solid #0070f3' 
        : '2px solid #ddd';
      el.style.backgroundColor = el.dataset.method === method 
        ? 'rgba(0, 112, 243, 0.05)' 
        : 'white';
      el.style.boxShadow = el.dataset.method === method 
        ? '0 4px 12px rgba(0, 112, 243, 0.15)' 
        : '0 1px 3px rgba(0,0,0,0.05)';
    });
    
    // Update form data immediately to avoid state update issues
    setFormData(prev => {
      const newData = { ...prev, paymentMethod: method };
      
      // Defer context update to avoid setState during render
      setTimeout(() => {
        updateContractFormData(newData);
      }, 0);
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem('djContractFormData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving payment method to localStorage:', error);
      }
      return newData;
    });
    
    // Clear any payment method error when a selection is made
    if (formErrors.paymentMethod) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.paymentMethod;
        return newErrors;
      });
    }
  }, [formErrors, updateContractFormData]);

  // Memoize the payment method option styles to reduce recalculations
  const getPaymentOptionStyle = useCallback((method) => {
    const isSelected = formData.paymentMethod === method;
    return {
      border: `2px solid ${isSelected ? '#0070f3' : '#ddd'}`,
      borderRadius: '12px',
      padding: '15px 10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isChangingPayment ? 'wait' : 'pointer',
      backgroundColor: isSelected ? 'rgba(0, 112, 243, 0.05)' : 'white',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? '0 4px 12px rgba(0, 112, 243, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
      opacity: isChangingPayment ? 0.7 : 1
    };
  }, [formData.paymentMethod, isChangingPayment]);



  // Memoize common styles to avoid recreation on each render
  const paymentIconStyle = useMemo(() => ({ 
    fontSize: '28px', 
    marginBottom: '6px' 
  }), []);

  // Define icon colors for payment methods
  const paymentIconColors = useMemo(() => ({
    Stripe: '#6772E5',
    Venmo: '#3D95CE',
    CashApp: '#00C244',
    PayPal: '#0070BA'
  }), []);

  const paymentLabelStyle = useMemo(() => ({ 
    fontWeight: 'bold',
    fontSize: '1rem'
  }), []);

  const radioStyle = useMemo(() => ({ 
    position: 'absolute', 
    opacity: 0 
  }), []);

  // Log initial form state
  useEffect(() => {
    console.log("Initial form data:", formData);
    console.log("Service selections:", {
      lighting: formData.lighting,
      photography: formData.photography,
      videoVisuals: formData.videoVisuals
    });
  }, []);



  // GenreSelectionModal component for selecting music genres
  function GenreSelectionModal({ onClose }) {
    const [selectedGenres, setSelectedGenres] = useState([...formData.musicPreferences]);
    const [otherGenre, setOtherGenre] = useState(formData.otherMusicPreference || '');
    const [animateIn, setAnimateIn] = useState(false);
    
    // Set animation on mount
    useEffect(() => {
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    }, []);
    
    // Apply changes and close the modal
    const applyChanges = () => {
      const newData = {
        ...formData,
        musicPreferences: selectedGenres,
        otherMusicPreference: selectedGenres.includes('other') ? otherGenre : ''
      };
      setFormData(newData);
      
      // Use setTimeout to defer the context update to avoid setState during render
      setTimeout(() => {
        updateContractFormData(newData);
      }, 0);
      
      onClose();
    };
    
    // Handle genre selection
    const toggleGenre = (genreId) => {
      if (selectedGenres.includes(genreId)) {
        setSelectedGenres(prev => prev.filter(id => id !== genreId));
      } else {
        setSelectedGenres(prev => [...prev, genreId]);
      }
    };
    
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1050,
          opacity: animateIn ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onClick={onClose}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '85vh',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            border: '2px solid #0070f3',
            overflow: 'hidden',
            transform: animateIn ? 'translateY(0)' : 'translateY(30px)',
            transition: 'transform 0.4s ease-out',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: '20px 25px',
            borderBottom: '1px solid #eaeaea',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #0070f3, #3291ff)'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '12px', fontSize: '1.8rem' }}>🎵</span>
              Choose Your Music Style
            </h2>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
                ':hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            padding: '20px 25px',
            overflowY: 'auto',
            flexGrow: 1
          }}>
            <p style={{ 
              marginBottom: '20px', 
              fontSize: '1.1rem',
              color: '#444'
            }}>
              Select the music genres you&apos;d like to hear at your event:
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '25px'
            }}>
              {musicGenres.map(genre => (
                <div key={genre.id} 
                  onClick={() => toggleGenre(genre.id)}
                  style={{
                    padding: '15px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedGenres.includes(genre.id) ? '#0070f3' : '#e0e0e0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: selectedGenres.includes(genre.id) ? 'rgba(0, 112, 243, 0.08)' : 'white',
                    transition: 'all 0.2s ease',
                    transform: selectedGenres.includes(genre.id) ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedGenres.includes(genre.id) 
                      ? '0 6px 14px rgba(0, 112, 243, 0.15)' 
                      : '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: selectedGenres.includes(genre.id) ? '#0070f3' : '#ddd',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedGenres.includes(genre.id) ? '#0070f3' : 'white',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}>
                    {selectedGenres.includes(genre.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <label style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: selectedGenres.includes(genre.id) ? '600' : '500', 
                    color: selectedGenres.includes(genre.id) ? '#0070f3' : '#444',
                    cursor: 'pointer',
                    flexGrow: 1
                  }}>
                    {genre.label}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedGenres.includes('other') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#555'
                }}>
                  Please specify other genres:
                </label>
                <input
                  type="text"
                  value={otherGenre}
                  onChange={(e) => setOtherGenre(e.target.value)}
                  placeholder="Tell us about your other music preferences"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #0070f3',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
          
          <div style={{
            padding: '15px 25px',
            borderTop: '1px solid #eaeaea',
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f9f9f9'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                color: '#555',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              Cancel
            </button>
            <button
              onClick={applyChanges}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0070f3',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': { backgroundColor: '#0060df' }
              }}
            >
              Apply Selections
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Near the top of the component where other useEffect hooks are defined
  // Add responsive styles for header and logo
  useEffect(() => {
    if (isClient) {
      const responsiveStyles = document.createElement('style');
      responsiveStyles.textContent = `
        @media (max-width: 768px) {
          .logo-container {
            width: 150px !important;
            height: 150px !important;
          }
          .header-title {
            font-size: 32px !important;
          }
          .header-email {
            font-size: 15px !important;
          }
        }
        
        @media (max-width: 480px) {
          .logo-container {
            width: 120px !important;
            height: 120px !important;
          }
          .header-title {
            font-size: 28px !important;
          }
          .header-email {
            font-size: 14px !important;
          }
        }
      `;
      document.head.appendChild(responsiveStyles);
      
      return () => {
        if (document.head.contains(responsiveStyles)) {
          document.head.removeChild(responsiveStyles);
        }
      };
    }
  }, [isClient]);

  if (!isClient) {
    return null;
  }

  if (submitted) {
    return (
      <BookingConfirmationPage 
        formData={{
          ...formData,
          totalAmount: calculateTotal()
        }}
        onSendEmail={sendConfirmationEmail}
        onBookAgain={() => {
          setFormData({
            clientName: '',
            email: '',
            contactPhone: '',
            eventType: 'Wedding',
            guestCount: '100',
            venueName: '',
            venueLocation: '',
            eventDate: '',
            startTime: '',
            endTime: '',
            paymentMethod: 'Stripe',
            paymentAmount: 'deposit',
            lighting: false,
            photography: false,
            videoVisuals: false,
            additionalHours: 0,
            agreeToTerms: false,
            musicPreferences: [],
            otherMusicPreference: '',
            streamingService: '',
            playlistLink: ''
          });
          setSubmitted(false);
        }}
      />
    );
  }

  // Function to handle Stripe payment initialization - placed inside the component
  const handleStripeButtonClick = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the document in Firebase first to get the ID
      const docRef = await addDoc(collection(db, 'djContracts'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'payment_pending',
        totalAmount: calculateTotal(),
        depositAmount: calculateDepositAmount()
      });
      
      console.log("Document written with ID for Stripe payment: ", docRef.id);
      
      // Update form data with booking ID
      const bookingId = docRef.id;
      setFormData(prev => ({
        ...prev,
        bookingId: bookingId
      }));
      
      // Update document status
      try {
        await updateDoc(doc(db, 'djContracts', bookingId), {
          status: 'payment_initiated',
          bookingConfirmed: true
        });
      } catch (updateError) {
        console.error("Error updating document status:", updateError);
      }
      
      // Prepare email template parameters
      const templateParams = {
        clientName: formData.clientName,
        email: formData.email,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        venueName: formData.venueName,
        venueLocation: formData.venueLocation,
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalAmount: calculateTotal(),
        paymentMethod: formData.paymentMethod,
        bookingId: bookingId,
        signerName: formData.signerName,
        hasSigned: true
      };
      
      // Send confirmation email automatically
      try {
        const emailResult = await sendConfirmationEmail(templateParams);
        if (emailResult.success) {
          console.log("Confirmation email sent successfully");
          await updateDoc(doc(db, 'djContracts', bookingId), {
            confirmationSent: true,
            emailSentAt: serverTimestamp()
          });
        } else {
          console.warn("Email sending failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
      
      // Show confirmation page instead of immediately redirecting
      setSubmitted(true);
      setIsSubmitting(false);
      
      // Prepare Stripe checkout in the background
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: getAmountToPay() * 100,
            contractDetails: {
              clientName: formData.clientName,
              email: formData.email,
              eventType: formData.eventType,
              eventDate: formData.eventDate,
              venueName: formData.venueName,
              venueLocation: formData.venueLocation,
              startTime: formData.startTime,
              endTime: formData.endTime,
              lighting: formData.lighting === true,
              photography: formData.photography === true,
              videoVisuals: formData.videoVisuals === true,
              additionalHours: parseInt(formData.additionalHours || 0),
              paymentAmount: formData.paymentAmount,
              isDeposit: formData.paymentAmount === 'deposit'
            }
          }),
        });
        
        if (response.ok) {
          const { url } = await response.json();
          if (url) {
            // Store the URL for later use on confirmation page
            localStorage.setItem('stripeCheckoutUrl', url);
            
            // Update the document with the checkout URL
            await updateDoc(doc(db, 'djContracts', bookingId), {
              stripeCheckoutUrl: url
            });
          }
        }
      } catch (stripeError) {
        console.error("Error preparing Stripe payment in background:", stripeError);
      }
      
    } catch (error) {
      console.error("Error preparing Stripe payment:", error);
      setSubmitError("Error initializing payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <SuppressHydration>
      <div className="main-wrapper" style={{ 
        width: '100%', 
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        

        
        <ToastContainer position="top-center" autoClose={5000} />
        {showConfirmation && (
          <PaymentConfirmationBanner 
            paymentMethod={formData.paymentMethod} 
            onClose={() => setShowConfirmation(false)} 
          />
        )}
        {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}
        {showTerms && <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />}
        {modalText && <PaymentModal htmlContent={modalText} onClose={() => setModalText(null)} />}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '100%',
          overflow: 'visible',
          flex: '1',
          paddingBottom: '2rem'
        }}>
          {submitted && (
            <BookingConfirmationPage 
              formData={{
                ...formData,
                totalAmount: calculateTotal()
              }}
              onSendEmail={sendConfirmationEmail}
              onBookAgain={() => {
                setFormData(initialFormData);
                setSubmitted(false);
              }}
            />
          )}
          {!submitted && (
            <div style={{ 
              maxWidth: '800px',
              width: '96%',
              margin: '2rem auto 3rem auto'
            }}>
              <form onSubmit={handleSubmit} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                padding: '2.5rem',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                width: '100%',
                marginBottom: '50px',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                position: 'relative'
              }}>
                {/* Form Header with Logo */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '30px',
                  position: 'relative',
                  maxWidth: '100%',
                  padding: '0 10px'
                }}>
                  <div style={{
                    width: '150px',
                    height: '150px',
                    margin: '0 auto 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Image
                      src="/dj-bobby-drake-logo.png"
                      alt="DJ Bobby Drake Logo"
                      width={150}
                      height={150}
                      priority
                      unoptimized={false}
                      style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  
                  <h1 style={{
                    fontSize: 'clamp(28px, 4vw, 36px)',
                    fontWeight: 'bold',
                    margin: '10px auto',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    lineHeight: '1.2',
                    maxWidth: '100%',
                    textAlign: 'center',
                    flexWrap: 'nowrap',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ 
                      fontSize: 'clamp(28px, 4vw, 36px)'
                    }}>📝</span>
                    <span>EVENT CONTRACT</span>
                  </h1>
                  
                  {/* Debug section - temporary for testing */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b'
                    }}>
                      <button
                        type="button"
                        onClick={debugReloadFormData}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          marginBottom: '10px',
                          marginRight: '10px'
                        }}
                      >
                        🔄 Debug: Reload Form Data
                      </button>
                      <button
                        type="button"
                        onClick={debugSaveTestData}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          marginBottom: '10px'
                        }}
                      >
                        💾 Save Test Data
                      </button>
                      <div style={{ fontSize: '12px', color: '#92400e' }}>
                        <div>Client Name: {formData.clientName || 'empty'}</div>
                        <div>Email: {formData.email || 'empty'}</div>
                        <div>Event Type: {formData.eventType || 'empty'}</div>
                        <div>Context Client: {contextIsClient ? 'true' : 'false'}</div>
                        <div>Context Data Keys: {Object.keys(contractFormData).length}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Spacer div between email address and client name */}
                <div style={{ 
                  height: '20px', 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #e0e0e0',
                  opacity: 0.5
                }} className="section-divider"></div>
                
                {/* Client Information Section */}
                <div className="form-grid-1col">
                  <div>
                    <label style={{
                      ...labelStyle,
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {fieldIcons['clientName']} Client Name *
                      </span>
                    </label>
                    <input
                      name="clientName"
                      type="text"
                      required
                      style={{
                        ...inputStyle,
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        padding: 'clamp(12px, 2vw, 16px)'
                      }}
                      className="field-input"
                      value={formData.clientName || ''}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label style={labelStyle} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {fieldIcons['email']} Email:
                      </span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      style={inputStyle}
                      className="field-input"
                      value={formData.email || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {fieldIcons['contactPhone']} Contact Phone *
                      </span>
                    </label>
                    <input
                      name="contactPhone"
                      type="tel"
                      required
                      style={inputStyle}
                      className="field-input"
                      value={formData.contactPhone || ''}
                      onChange={handleChange}
                      placeholder="(123) 456-7890"
                    />
                    {formErrors.contactPhone && (
                      <p className="text-red-500 text-xs italic">{formErrors.contactPhone}</p>
                    )}
                  </div>
                </div>

                {/* Two-column grid for event details - changed to single column */}
                <div className="form-grid-1col">
                  <div>
                    <label style={{
                      ...labelStyle,
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {fieldIcons['eventType']} Event Type *
                      </span>
                    </label>
                    <EventTypeDropdown
                      value={formData.eventType}
                      onChange={handleEventTypeChange}
                      onPriceUpdate={handleBasePriceUpdate}
                      showWeddingAgendaLink={true}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {fieldIcons['guestCount']} Guest Count:
                      </span>
                    </label>
                    <input
                      name="guestCount"
                      type="number"
                      required
                      style={inputStyle}
                      className="field-input"
                      value={formData.guestCount || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Two-column grid for venue information - changed to single column */}
                <div className="form-grid-1col">
                  <div>
                    <label style={labelStyle} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {fieldIcons['venueName']} Venue Name:
                      </span>
                    </label>
                    <input
                      name="venueName"
                      type="text"
                      required
                      style={inputStyle}
                      className="field-input"
                      value={formData.venueName || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {venueLocationIcon} Venue Location:
                      </span>
                    </label>
                    <AddressAutocomplete
                      value={formData.venueLocation || ''}
                      onChange={handleChange}
                      name="venueLocation"
                      placeholder="Enter venue address"
                      required={true}
                      inputStyle={inputStyle}
                      className="field-input"
                    />
                  </div>
                </div>

                {/* Two-column grid for date and time selection - changed to single column */}
                <div className="form-grid-1col">
                  {/* Event Date */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <FaCalendarAlt className="text-blue-500 mr-3" style={{ marginRight: '10px' }} /> Event Date *
                      </span>
                    </label>
                    <ReactDatePickerField
                      id="weddingDate"
                      name="weddingDate"
                      selectedDate={formData.weddingDate}
                      onChange={(date) => {
                        setFormData(prev => ({ ...prev, weddingDate: date }));
                        setErrors(prev => ({ ...prev, weddingDate: '' }));
                      }}
                      placeholder="Select date"
                      error={errors.weddingDate}
                      className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label style={labelStyle} className="field-label">
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {timeIcons['startTime']} Start Time:
                      </span>
                    </label>
                    <select
                      name="startTime"
                      value={formData.startTime || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        if (formData.endTime) {
                          // If end time already exists, calculate new additional hours
                          const additionalHours = calculateAdditionalHours(value, formData.endTime);
                          const newData = {
                            ...formData,
                            startTime: value,
                            additionalHours
                          };
                          setFormData(newData);
                          updateContractFormData(newData);
                        } else {
                          // If no end time yet, just update start time
                          const newData = {
                            ...formData,
                            startTime: value,
                            endTime: '' // reset endTime on startTime change
                          };
                          setFormData(newData);
                          updateContractFormData(newData);
                        }
                      }}
                      required
                      style={inputStyle}
                      className="field-input"
                    >
                      <option value="">Select start time</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <label style={labelStyle} className="field-label">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {timeIcons['endTime']} End Time:
                    </span>
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime || ''}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    required
                    disabled={!formData.startTime}
                    style={inputStyle}
                    className="field-input"
                  >
                    <option value="">Select end time</option>
                    {formData.startTime &&
                      timeOptions
                        .filter((t) => convertToMinutes(t) > convertToMinutes(formData.startTime))
                        .map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                  </select>
                  {formData.startTime && formData.endTime && (
                    <div style={{
                      fontSize: '0.9rem',
                      color: formData.additionalHours > 0 ? '#0070f3' : '#666',
                      marginTop: '0.5rem',
                      fontWeight: formData.additionalHours > 0 ? '500' : 'normal'
                    }}>
                      {formData.additionalHours > 0 
                        ? `${calculateHoursBetween(formData.startTime, formData.endTime).toFixed(1)} hour event (+${formData.additionalHours} additional hours)`
                        : `${calculateHoursBetween(formData.startTime, formData.endTime).toFixed(1)} hour event (base package)`}
                    </div>
                  )}
                </div>

                {/* Additional Services Header */}
                <div style={{
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e2e8f0',
                  position: 'relative',
                  paddingBottom: '0.5rem'
                }} className="section-header">
                  <h3 style={{
                    color: '#2d3748',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0'
                  }}>
                    <FaPlus style={{ color: '#0070f3', fontSize: '0.9rem' }} />
                    Additional Services
                  </h3>
                </div>

                {/* Redesigned Card-Style Additional Services */}
                <div 
                  key={`service-options-${formData.eventType}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '2rem'
                  }} 
                  className="service-options"
                >
                  {[
                    {
                      name: 'lighting',
                      label: 'Event Lighting',
                      price: '$100',
                      description: 'Transform your venue with dynamic light shows that pulse to the music! Professional setup includes state-of-the-art strobes & LED effects.',
                      icon: <FaLightbulb style={{ fontSize: '24px', color: '#ECC94B' }} />
                    },
                    {
                      name: 'photography',
                      label: 'Event Photography',
                      price: '$150',
                      description: 'Capture all your perfect moments! 50+ professionally edited high-resolution photos delivered within 48 hours of your event.',
                      icon: <FaCamera style={{ fontSize: '24px', color: '#4FD1C5' }} />
                    },
                    {
                      name: 'videoVisuals',
                      label: 'Video Visuals',
                      price: '$100',
                      description: 'Add immersive visuals to your event! Custom HD projection including music videos, slideshows, and interactive displays.',
                      icon: <FaVideo style={{ fontSize: '24px', color: '#F687B3' }} />
                    }
                  ].map(({ name, label, price, description, icon }) => {
                    // Debug the current item's selection status
                    const isSelected = formData[name] === true;
                    console.log(`Service Card ${name}: isSelected=${isSelected}, value=${formData[name]}, type=${typeof formData[name]}`);
                    
                    const handleServiceToggle = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`Toggling ${name} from ${formData[name]} to ${!formData[name]}`);
                      
                      // Use direct state update with explicit true/false values
                      const newValue = formData[name] === true ? false : true;
                      console.log(`Setting ${name} to ${newValue} (explicit boolean)`);
                      
                      const newData = {
                        ...formData,
                        [name]: newValue
                      };
                      
                      setFormData(newData);
                      
                      // Defer context update to avoid setState during render
                      setTimeout(() => {
                        updateContractFormData(newData);
                      }, 0);
                      
                      // Also save directly to localStorage as backup
                      try {
                        localStorage.setItem('djContractFormData', JSON.stringify(newData));
                        console.log(`Saved ${name} service selection to localStorage:`, newValue);
                      } catch (error) {
                        console.error('Error saving service selection to localStorage:', error);
                      }
                    };
                    
                    return (
                      <div 
                        key={name}
                        onClick={handleServiceToggle}
                        className="service-card"
                        style={{
                          ...getServiceCardStyle(name),
                          cursor: 'pointer',
                          userSelect: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        {formData[name] === true && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#0070f3',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2
                          }}>
                            <FaCheck color="white" size={12} />
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ 
                            marginRight: '12px',
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: formData[name] ? 'rgba(0, 112, 243, 0.1)' : '#f5f5f5'
                          }}>
                            {icon}
                          </div>
                          <div>
                            <h4 style={{ 
                              margin: '0 0 4px 0',
                              color: '#333',
                              fontWeight: formData[name] ? '600' : '500'
                            }}>
                              {label}
                            </h4>
                            <div style={{ 
                              fontSize: '1rem', 
                              fontWeight: 'bold',
                              color: formData[name] ? '#0070f3' : '#666'
                            }}>
                              {price}
                            </div>
                          </div>
                        </div>
                        
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: '#666', 
                          margin: '0',
                          lineHeight: '1.4'
                        }}>
                          {description}
                        </p>
                        
                        <input
                          type="checkbox"
                          name={name}
                          checked={formData[name]}
                          onChange={handleChange}
                          style={{ position: 'absolute', opacity: 0 }}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Wedding Agenda Card - Using client-only component */}
                  {formData.eventType && isWeddingEvent(formData.eventType) ? (
                    <div>
                      <WeddingAgendaCard 
                        key={`wedding-agenda-${formData.eventType}`}
                        eventType={formData.eventType} 
                      />
                    </div>
                  ) : null}
                </div>

                {/* Music Preferences Section - Revamped with Tick Boxes */}
                <div style={{
                  marginTop: '2rem',
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e0e0e0',
                  position: 'relative'
                }} className="section-header">
                  <h3 style={{
                    color: '#333',
                    fontSize: 'clamp(20px, 3vw, 24px)',
                    fontWeight: '600',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span className="music-icon" style={{ 
                      color: '#0070f3', 
                      marginRight: '10px', 
                      display: 'flex',
                      alignItems: 'center'
                    }}>🎵</span>
                    What&apos;s On Your Playlist?
                  </h3>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  {/* Genre selection card that opens the modal */}
                  <div 
                    onClick={() => setShowGenreModal(true)}
                    style={{
                      padding: '15px 20px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      marginBottom: '1.5rem',
                      '&:hover': {
                        borderColor: '#0070f3',
                        boxShadow: '0 4px 14px rgba(0, 112, 243, 0.1)',
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <p style={{ 
                        fontWeight: '500', 
                        fontSize: '1.05rem', 
                        color: '#333',
                        margin: 0
                      }}>
                        Choose your preferred music genres
                      </p>
                      
                      <span style={{ 
                        backgroundColor: '#0070f3', 
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '70px'
                      }}>
                        Select
                      </span>
                    </div>
                    
                    {formData.musicPreferences.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {musicGenres
                          .filter(genre => formData.musicPreferences.includes(genre.id))
                          .map(genre => (
                            <span key={genre.id} style={{
                              backgroundColor: 'rgba(0, 112, 243, 0.1)',
                              color: '#0070f3',
                              padding: '5px 12px',
                              borderRadius: '30px',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}>
                              {genre.label}
                            </span>
                          ))
                        }
                      </div>
                    ) : (
                      <p style={{ 
                        color: '#666', 
                        fontStyle: 'italic', 
                        margin: 0 
                      }}>
                        No genres selected yet. Click to choose your preferences
                      </p>
                    )}
                  </div>
                  
                  {/* Streaming Service Integration */}
                  <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '0.75rem',
                      gap: '8px'
                    }}>
                      <p style={{ 
                        color: '#333', 
                        fontSize: '1rem', 
                        fontWeight: '500',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <span style={{ marginRight: '8px' }}>📱</span>
                        Share your playlist (optional)
                      </p>
                      <FaInfoCircle
                        style={{ 
                          color: '#0070f3',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPlaylistHelp(true);
                        }}
                        title="Click for help sharing your playlist"
                      />
                    </div>
                    
                    <div style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '1rem'
                    }}>
                      {streamingServices.map(service => (
                        <div 
                          key={service.id}
                          onClick={() => {
                            const newData = { ...formData, streamingService: service.id };
                            setFormData(newData);
                            
                            // Defer context update to avoid setState during render
                            setTimeout(() => {
                              updateContractFormData(newData);
                            }, 0);
                            
                            // Also save to localStorage as backup
                            try {
                              localStorage.setItem('djContractFormData', JSON.stringify(newData));
                            } catch (error) {
                              console.error('Error saving streaming service to localStorage:', error);
                            }
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: formData.streamingService === service.id 
                              ? '2px solid #0070f3' 
                              : '1px solid #e0e0e0',
                            backgroundColor: formData.streamingService === service.id 
                              ? 'rgba(0, 112, 243, 0.05)' 
                              : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flex: '1 0 150px',
                            maxWidth: '200px'
                          }}
                        >
                          <div 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              backgroundImage: `url(${service.icon})`,
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              marginRight: '10px'
                            }} 
                          />
                          <span style={{
                            fontWeight: formData.streamingService === service.id ? '500' : 'normal',
                            color: formData.streamingService === service.id ? '#0070f3' : '#333',
                          }}>
                            {service.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {formData.streamingService && (
                      <div style={{ marginBottom: '1rem' }}>
                        <input
                          type="text"
                          name="playlistLink"
                          value={formData.playlistLink || ''}
                          onChange={handleChange}
                          placeholder={streamingServices.find(s => s.id === formData.streamingService)?.placeholder || 'Paste your playlist link'}
                          style={{
                            ...inputStyle,
                            borderColor: '#0070f3',
                            borderWidth: '1px'
                          }}
                        />
                        <p style={{ 
                          fontSize: '0.8rem', 
                          color: '#666', 
                          marginTop: '0.5rem',
                          fontStyle: 'italic'
                        }}>
                          This helps us prepare the right music for your event. We&apos;ll review your playlist and incorporate your favorites.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Additional Hours Selector */}
                <div>
                  <label style={labelStyle} className="field-label">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <FaClock style={{ marginRight: '8px', color: '#68D391', fontSize: '18px' }} />
                      Additional Hours ($75/hr):
                    </span>
                    {formData.additionalHours > 0 && (
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#0070f3',
                        fontWeight: '500'
                      }}>
                        Auto-calculated from your time selection
                      </span>
                    )}
                  </label>
                  <div style={{ 
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }} className="hours-selector">
                      {[0, 1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            console.log(`Setting additionalHours to ${num}`);
                            const newData = { ...formData, additionalHours: num };
                            setFormData(newData);
                            
                            // Defer context update to avoid setState during render
                            setTimeout(() => {
                              updateContractFormData(newData);
                            }, 0);
                            
                            // Also save to localStorage as backup
                            try {
                              localStorage.setItem('djContractFormData', JSON.stringify(newData));
                            } catch (error) {
                              console.error('Error saving additional hours to localStorage:', error);
                            }
                          }}
                          style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: formData.additionalHours === num ? '#0070f3' : '#f5f5f5',
                            color: formData.additionalHours === num ? 'white' : '#333',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            boxShadow: formData.additionalHours === num ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    
                    {formData.additionalHours > 0 && (
                      <div style={{
                        backgroundColor: 'rgba(0, 112, 243, 0.05)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '12px',
                        border: '1px solid rgba(0, 112, 243, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{
                            fontSize: '0.9rem',
                            color: '#333',
                            fontWeight: '500'
                          }}>
                            <FaClock style={{ marginRight: '6px', color: '#0070f3', fontSize: '14px' }} />
                            {formData.additionalHours} additional {formData.additionalHours === 1 ? 'hour' : 'hours'}
                          </span>
                          <span style={{
                            fontSize: '0.9rem',
                            color: '#0070f3',
                            fontWeight: 'bold'
                          }}>
                            +${formData.additionalHours * SERVICES.ADDITIONAL_HOUR}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#666'
                        }}>
                          Auto-calculated from {formData.startTime} to {formData.endTime}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Amount Selection */}
                <div className="payment-amount-section" style={{ marginBottom: '2rem' }}>
                  <label style={{
                    ...labelStyle,
                    fontSize: '1.1rem',
                    marginBottom: '1rem'
                  }}>
                    Payment Option:
                  </label>
                  <div className="payment-amount-options" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '15px',
                    marginBottom: '1rem'
                  }}>
                    {/* Deposit Option */}
                    <div 
                      className="payment-amount-option"
                      onClick={() => {
                        const newData = { ...formData, paymentAmount: 'deposit' };
                        setFormData(newData);
                        updateContractFormData(newData);
                        // Also save to localStorage as backup
                        try {
                          localStorage.setItem('djContractFormData', JSON.stringify(newData));
                        } catch (error) {
                          console.error('Error saving payment amount to localStorage:', error);
                        }
                      }}
                      style={{
                        border: `2px solid ${formData.paymentAmount === 'deposit' ? '#0070f3' : '#ddd'}`,
                        borderRadius: '12px',
                        padding: '20px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        backgroundColor: formData.paymentAmount === 'deposit' ? 'rgba(0, 112, 243, 0.05)' : 'white',
                        transition: 'all 0.2s ease',
                        boxShadow: formData.paymentAmount === 'deposit' ? '0 4px 12px rgba(0, 112, 243, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ 
                        fontSize: '28px', 
                        color: '#0070f3',
                        marginBottom: '10px' 
                      }}>
                        💵
                      </div>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        marginBottom: '5px'
                      }}>
                        Pay Deposit
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#666',
                        textAlign: 'center'
                      }}>
                        50% now, 50% on event day
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#0070f3'
                      }}>
                        ${calculateDepositAmount()}
                      </div>
                      <input
                        type="radio"
                        name="paymentAmount"
                        value="deposit"
                        checked={formData.paymentAmount === 'deposit'}
                        onChange={(e) => {
                          const newData = { ...formData, paymentAmount: e.target.value };
                          setFormData(newData);
                          
                          // Defer context update to avoid setState during render
                          setTimeout(() => {
                            updateContractFormData(newData);
                          }, 0);
                          
                          // Also save to localStorage as backup
                          try {
                            localStorage.setItem('djContractFormData', JSON.stringify(newData));
                          } catch (error) {
                            console.error('Error saving payment amount to localStorage:', error);
                          }
                        }}
                        style={{ position: 'absolute', opacity: 0 }}
                      />
                    </div>
                    
                    {/* Full Payment Option */}
                    <div 
                      className="payment-amount-option"
                      onClick={() => {
                        const newData = { ...formData, paymentAmount: 'full' };
                        setFormData(newData);
                        
                        // Defer context update to avoid setState during render
                        setTimeout(() => {
                          updateContractFormData(newData);
                        }, 0);
                        
                        // Also save to localStorage as backup
                        try {
                          localStorage.setItem('djContractFormData', JSON.stringify(newData));
                        } catch (error) {
                          console.error('Error saving payment amount to localStorage:', error);
                        }
                      }}
                      style={{
                        border: `2px solid ${formData.paymentAmount === 'full' ? '#0070f3' : '#ddd'}`,
                        borderRadius: '12px',
                        padding: '20px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        backgroundColor: formData.paymentAmount === 'full' ? 'rgba(0, 112, 243, 0.05)' : 'white',
                        transition: 'all 0.2s ease',
                        boxShadow: formData.paymentAmount === 'full' ? '0 4px 12px rgba(0, 112, 243, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ 
                        fontSize: '28px', 
                        color: '#0070f3',
                        marginBottom: '10px' 
                      }}>
                        💰
                      </div>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        marginBottom: '5px'
                      }}>
                        Pay in Full
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#666',
                        textAlign: 'center'
                      }}>
                        Pay the full amount now
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#0070f3'
                      }}>
                        ${calculateTotal()}
                      </div>
                      <input
                        type="radio"
                        name="paymentAmount"
                        value="full"
                        checked={formData.paymentAmount === 'full'}
                        onChange={(e) => {
                          const newData = { ...formData, paymentAmount: e.target.value };
                          setFormData(newData);
                          
                          // Defer context update to avoid setState during render
                          setTimeout(() => {
                            updateContractFormData(newData);
                          }, 0);
                          
                          // Also save to localStorage as backup
                          try {
                            localStorage.setItem('djContractFormData', JSON.stringify(newData));
                          } catch (error) {
                            console.error('Error saving payment amount to localStorage:', error);
                          }
                        }}
                        style={{ position: 'absolute', opacity: 0 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    ...labelStyle,
                    fontSize: '1.1rem',
                    marginBottom: '1rem'
                  }}>
                    Payment Method:
                  </label>
                  <div className="payment-options" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                  }}>
                    {/* Stripe Payment Option */}
                    <div 
                      className="payment-option"
                      data-method="Stripe"
                      onClick={() => handlePaymentMethodSelect('Stripe')}
                      style={getPaymentOptionStyle('Stripe')}
                    >
                      <div className="payment-icon" style={{ 
                        ...paymentIconStyle,
                        color: paymentIconColors.Stripe
                      }}>
                        <FaCreditCard />
                      </div>
                      <div className="payment-method-label" style={{ 
                        fontWeight: formData.paymentMethod === 'Stripe' ? 'bold' : 'normal',
                        fontSize: '1rem'
                      }}>
                        Stripe
                      </div>
                    </div>
                    
                    {/* Venmo Payment Option */}
                    <div 
                      className="payment-option"
                      data-method="Venmo"
                      onClick={() => handlePaymentMethodSelect('Venmo')}
                      style={getPaymentOptionStyle('Venmo')}
                    >
                      <div className="payment-icon" style={{ 
                        ...paymentIconStyle,
                        color: paymentIconColors.Venmo
                      }}>
                        <SiVenmo />
                      </div>
                      <div className="payment-method-label" style={{ 
                        fontWeight: formData.paymentMethod === 'Venmo' ? 'bold' : 'normal',
                        fontSize: '1rem'
                      }}>
                        Venmo
                      </div>
                    </div>
                    
                    {/* Cash App Payment Option */}
                    <div 
                      className="payment-option"
                      data-method="CashApp"
                      onClick={() => handlePaymentMethodSelect('CashApp')}
                      style={getPaymentOptionStyle('CashApp')}
                    >
                      <div className="payment-icon" style={{ 
                        ...paymentIconStyle,
                        color: paymentIconColors.CashApp
                      }}>
                        <SiCashapp />
                      </div>
                      <div className="payment-method-label" style={{ 
                        fontWeight: formData.paymentMethod === 'CashApp' ? 'bold' : 'normal',
                        fontSize: '1rem'
                      }}>
                        CashApp
                      </div>
                    </div>
                    
                    {/* PayPal Payment Option */}
                    <div 
                      className="payment-option"
                      data-method="PayPal"
                      onClick={() => handlePaymentMethodSelect('PayPal')}
                      style={getPaymentOptionStyle('PayPal')}
                    >
                      <div className="payment-icon" style={{ 
                        ...paymentIconStyle,
                        color: paymentIconColors.PayPal
                      }}>
                        <FaPaypal />
                      </div>
                      <div className="payment-method-label" style={{ 
                        fontWeight: formData.paymentMethod === 'PayPal' ? 'bold' : 'normal',
                        fontSize: '1rem'
                      }}>
                        PayPal
                      </div>
                    </div>
                  </div>
                  {formErrors.paymentMethod && (
                    <p style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {formErrors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* Itemized Total */}
                <div className="event-summary" style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}>
                  <h3 style={{ marginBottom: '0.5rem', color: '#000' }}>Event Package Summary:</h3>
                  {itemizedTotal()}
                </div>
                
                {/* Terms and Conditions Checkbox with Button Styling */}
                <div style={{
                  backgroundColor: '#0070f3',
                  padding: '15px 20px',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: formErrors.agreeToTerms ? '3px solid #e53e3e' : 'none',
                  boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        setFormData(prev => ({
                          ...prev,
                          agreeToTerms: !prev.agreeToTerms
                        }));
                        // Clear error if present
                        if (formErrors.agreeToTerms) {
                          setFormErrors(prev => ({
                            ...prev,
                            agreeToTerms: ''
                          }));
                        }
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'white',
                        border: '2px solid white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        userSelect: 'none'
                      }}
                    >
                      {formData.agreeToTerms && (
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#0070f3" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms || false}
                      onChange={() => {}} // Controlled by div click
                      style={{ display: 'none' }}
                      required
                    />
                    <div style={{ flex: 1 }}>
                      <label 
                        onClick={(e) => {
                          // Only toggle if not clicking the terms button
                          if (e.target.tagName !== 'BUTTON') {
                            e.preventDefault();
                            setFormData(prev => ({
                              ...prev,
                              agreeToTerms: !prev.agreeToTerms
                            }));
                            // Clear error if present
                            if (formErrors.agreeToTerms) {
                              setFormErrors(prev => ({
                                ...prev,
                                agreeToTerms: ''
                              }));
                            }
                          }
                        }}
                        style={{
                          fontSize: '18px',
                          color: 'white',
                          lineHeight: '1.5',
                          cursor: 'pointer',
                          display: 'block',
                          fontWeight: 'bold',
                          userSelect: 'none'
                        }}
                      >
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTerms(true);
                          }}
                          style={{
                            color: 'white',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '0',
                            fontWeight: 'bold'
                          }}
                        >
                          terms and conditions
                        </button>
                        {' '}and authorize this DJ contract.
                      </label>
                      {formErrors.agreeToTerms && (
                        <p style={{ 
                          color: '#ffeb3b', 
                          marginTop: '0.5rem', 
                          fontSize: '16px',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}>
                          {formErrors.agreeToTerms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signature Input Field with Script Font */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1.5rem',
                  borderRadius: '10px',
                  marginBottom: '1.5rem',
                  border: formErrors.signerName ? '2px solid red' : '1px solid #e0e0e0',
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.2rem' }}>Digital Signature</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      name="signerName"
                      type="text"
                      value={formData.signerName || ''}
                      onChange={(e) => {
                        // Capitalize the first letter and letters after spaces
                        const input = e.target.value;
                        const capitalized = input.replace(/(^\w|\s\w)/g, match => match.toUpperCase());
                        handleChange({
                          target: {
                            name: 'signerName',
                            value: capitalized
                          }
                        });
                      }}
                      placeholder="Type your full name here"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '2px solid #0070f3',
                        fontFamily: 'Brush Script MT, Snell Roundhand, Comic Sans MS, cursive',
                        fontSize: '1.8rem',
                        letterSpacing: '0.05em',
                        fontWeight: '500',
                        color: '#222',
                        background: 'white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        outline: 'none',
                        marginBottom: '0.5rem',
                      }}
                      autoCapitalize="words"
                      required
                    />
                  </div>
                  <p style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    Your digital signature confirms your agreement to this contract
                  </p>
                  {formErrors.signerName && (
                    <p style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {formErrors.signerName}
                    </p>
                  )}
                </div>
                
                {/* Submit Error Message */}
                {submitError && (
                  <div style={{
                    color: '#e53e3e',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    backgroundColor: '#fee2e2',
                    borderRadius: '0.25rem',
                    borderLeft: '4px solid #e53e3e',
                  }}>
                    {submitError}
                  </div>
                )}

                {/* Submit Button with dynamic text based on payment method */}
                <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                  <button 
                    type={formData.paymentMethod === 'Stripe' ? 'button' : 'submit'}
                    onClick={formData.paymentMethod === 'Stripe' ? handleStripeButtonClick : undefined}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '18px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1,
                      fontWeight: 'bold',
                      boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spin"></div> Processing...
                      </>
                    ) : (
                      <>
                        {formData.paymentMethod === 'Stripe' ? (
                          <>
                            <FaCreditCard /> Proceed to Payment
                          </>
                        ) : (
                          <>
                            <FaPaperPlane /> Submit Contract
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
        <PaymentConfirmation 
          show={showConfirmation} 
          message={confirmationMessage || `${formData.paymentMethod} payment initiated. Please complete the transaction.`}
        />
        {/* Render the genre selection modal */}
        {showGenreModal && (
          <GenreSelectionModal onClose={() => setShowGenreModal(false)} />
        )}
        {/* Other modals */}
        {modalText && <InfoModal text={modalText} onClose={() => setModalText(null)} />}
        {showTerms && (
          <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />
        )}
        {showPlaylistHelp && (
          <PlaylistHelpModal
            streamingService={formData.streamingService}
            onClose={() => setShowPlaylistHelp(false)}
          />
        )}
        {showSuccessMessage && <SuccessMessage />}
        {showErrorMessage && <ErrorMessage message={showErrorMessage} />}
        {/* Confirmation page handles payment instructions */}
        
      </div>
      
      {/* Footer - should be at bottom of page, not scrolling with form */}
      <Footer />
      
    </SuppressHydration>
  );
}

