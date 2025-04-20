'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StripeCheckout from '../components/StripeCheckout';
import Header from '../components/Header';
import EnvChecker from '../components/EnvChecker';
import EnvTest from '../components/EnvTest';
import { 
  FaInfoCircle, 
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
  FaCreditCard,
  FaMoneyBillWave,
  FaPaypal,
  FaRegCreditCard,
  FaCheckCircle
} from 'react-icons/fa';
import { BsStripe } from 'react-icons/bs';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { v4 as uuidv4 } from 'uuid';

// Constants and Pricing
const SERVICES = {
  BASE: 400,
  LIGHTING: 100,
  PHOTOGRAPHY: 150,
  VIDEO_VISUALS: 100,
  ADDITIONAL_HOUR: 75,
};

// Payment confirmation banner component
const PaymentConfirmation = ({ show, message }) => {
  if (!show) return null;
  
  return (
    <div className="payment-confirmation-banner">
      <div className="payment-confirmation-content">
        <FaCheckCircle style={{ color: 'green', marginRight: '10px', fontSize: '20px' }} />
        <span>{message || 'Payment initiated successfully!'}</span>
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
    <div className="payment-confirmation-banner">
      <div className="confirmation-content">
        <h3>Payment Initiated</h3>
        <p>{getMessage()}</p>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
    </div>
  );
};

// Payment Option component
const PaymentOption = ({ method, iconComponent, isSelected, onSelect, iconColor }) => (
  <div 
    onClick={onSelect}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      borderRadius: '8px',
      border: isSelected ? `2px solid ${iconColor}` : '1px solid #ddd',
      backgroundColor: isSelected ? `${iconColor}10` : 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? `0 4px 8px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <div style={{ fontSize: '24px', marginBottom: '8px', color: iconColor }}>
      {iconComponent}
    </div>
    <div style={{ 
      fontWeight: isSelected ? '600' : '400',
      color: isSelected ? iconColor : '#333',
    }}>
      {method}
    </div>
  </div>
);

export default function DJContractForm() {
  // Terms and conditions text
  const termsAndConditionsText = `
Live City DJ Contract Terms and Conditions:

1. Booking & Deposit: A non-refundable deposit of 50% is required to secure your date.
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

  const initialFormData = {
    clientName: '',
    email: '',
    contactPhone: '',
    eventType: '',
    guestCount: '',
    venueName: '',
    venueLocation: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    paymentMethod: 'Stripe',
    lighting: false,
    photography: false,
    videoVisuals: false,
    agreeToTerms: false,
    additionalHours: 0,
    message: ''
  };
  
  const [formData, setFormData] = useState(initialFormData);
  
  const router = useRouter();
  const venueLocationRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [isChangingPayment, setIsChangingPayment] = useState(false);
  
  const [showStripe, setShowStripe] = useState(false);
  const [infoPopup, setInfoPopup] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [modalText, setModalText] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Convert time to minutes for better comparison
  const convertToMinutes = useCallback((t) => {
    if (!t) return 0;
    const [time, period] = t.split(' ');
    let [hour, minute] = time.split(':').map(Number);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    // Adjust early morning times (12:00 AM – 2:00 AM) to come *after* 11:30 PM
    const total = hour * 60 + minute;
    return total < 480 ? total + 1440 : total; // if before 8:00 AM, treat as after midnight
  }, []);

  // Time options for the dropdowns
  const timeOptions = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
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
    let total = SERVICES.BASE;
    if (formData.lighting) total += SERVICES.LIGHTING;
    if (formData.photography) total += SERVICES.PHOTOGRAPHY;
    if (formData.videoVisuals) total += SERVICES.VIDEO_VISUALS;
    total += formData.additionalHours * SERVICES.ADDITIONAL_HOUR;
    return total;
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
  
  // Set isClient to true when running on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add this to manually load Google Maps API
  useEffect(() => {
    if (isClient && !window.google) {
      console.log('Attempting to load Google Maps API manually...');
      const script = document.createElement('script');
      // Replace 'YOUR_API_KEY' with your actual API key
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC8PCjGiQZm9PQE5YeRjU8CgTmrHQdUFyc&libraries=places';
      script.async = true;
      script.defer = true;
      script.onload = () => console.log('Google Maps API loaded manually!');
      script.onerror = () => console.error('Failed to load Google Maps API manually!');
      document.head.appendChild(script);
    }
  }, [isClient]);

  // Add mobile scrolling fix
  useEffect(() => {
    if (isClient) {
      // Create a style element to add CSS fix for mobile scrolling
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        html, body {
          overflow-x: hidden !important;
          position: relative;
          width: 100% !important;
          -webkit-overflow-scrolling: touch;
          min-height: 100%;
        }
        body {
          background-size: cover !important;
          background-attachment: fixed !important;
          background-position: center center !important;
          height: auto !important;
          min-height: 100vh !important;
        }
        .main-wrapper {
          width: 100%;
          min-height: 100vh;
          padding-bottom: 50px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 767px) {
          .main-content {
            padding: 10px;
            margin-bottom: 80px;
          }
          .form-container {
            margin-bottom: 80px;
          }
          form {
            margin-bottom: 30px;
          }
        }
      `;
      document.head.appendChild(styleEl);
      
      return () => {
        if (document.head.contains(styleEl)) {
          document.head.removeChild(styleEl);
        }
      };
    }
  }, [isClient]);

  // Add this to improve responsive layout behavior
  useEffect(() => {
    // Create and add a meta viewport tag to prevent scaling issues
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(metaViewport);
    
    return () => {
      // Remove the meta tag when component unmounts
      if (document.head.contains(metaViewport)) {
        document.head.removeChild(metaViewport);
      }
    };
  }, []);
  
  // Google Maps Places API initialization
  useEffect(() => {
    if (isClient && venueLocationRef.current) {
      // Check if Google Maps API is loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeGooglePlaces();
        setMapsLoaded(true);
      } else {
        // Wait for API to load with a timeout
        let attempts = 0;
        const checkGoogleMapsLoaded = setInterval(() => {
          attempts++;
          console.log(`Attempt ${attempts} to load Google Maps...`);
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogleMapsLoaded);
            initializeGooglePlaces();
            setMapsLoaded(true);
            console.log('Google Maps loaded successfully!');
          } else if (attempts > 10) {
            // After 5 seconds (10 attempts x 500ms), show error
            clearInterval(checkGoogleMapsLoaded);
            const errorMsg = 'Google Maps API could not be loaded. Please ensure API key is set.';
            setMapsError(errorMsg);
            console.error(errorMsg);
          }
        }, 500);
        
        return () => clearInterval(checkGoogleMapsLoaded);
      }
    }
  }, [isClient]);
  
  const initializeGooglePlaces = () => {
    try {
      console.log('Initializing Google Places Autocomplete...');
      const autocomplete = new window.google.maps.places.Autocomplete(venueLocationRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          console.log('Place selected:', place.formatted_address);
          setFormData(prev => ({
            ...prev,
            venueLocation: place.formatted_address,
          }));
        }
      });
      console.log('Google Places Autocomplete initialized successfully!');
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setMapsError('Error initializing address autocomplete. Please check API key and configuration.');
    }
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? parseInt(value) || 0
          : value,
    }));
  };

  // Basic manual address validation: requires at least one letter, one number, and at least 5 characters.
  const validateAddress = (address) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d).{5,}$/;
    return regex.test(address);
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) =>
    /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const errors = {};
    const requiredFields = ['clientName', 'email', 'contactPhone', 'eventType', 'venueName', 'venueLocation', 'eventDate', 'startTime', 'endTime', 'paymentMethod'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    });
    
    // Validate email format if present
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Validate phone format if present
    if (formData.contactPhone && !validatePhone(formData.contactPhone)) {
      errors.contactPhone = 'Please enter a valid 10-digit phone number';
    }
    
    // Check terms agreement
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    // If any errors, update state and return
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Show payment confirmation
    setShowConfirmation(true);
    
    // Scroll to top to show the confirmation banner
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Clear any previous errors
    setFormErrors({});
    
    // Generate a unique contract ID
    const contractId = uuidv4();

    // Set submitting state
    setIsSubmitting(true);
    
    try {
      // Create contract first
      const docRef = await addDoc(collection(db, 'djContracts'), {
        eventType: formData.eventType,
        numberOfGuests: formData.guestCount,
        venueName: formData.venueName,
        venueLocation: formData.venueLocation,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        additionalHours: formData.additionalHours,
        email: formData.email,
        clientName: formData.clientName,
        phoneNumber: formData.contactPhone,
        paymentMethod: formData.paymentMethod,
        depositPaid: false,
        confirmationSent: false,
        reminderSent: false,
        status: 'pending',
        createdAt: new Date()
      });
      
      // Handle based on payment method
      if (formData.paymentMethod === 'Stripe') {
        // Use the existing showStripe state to toggle the Stripe checkout
        try {
          console.log('Setting showStripe to true');
          setShowStripe(true);
          setSubmitted(true); // Mark as submitted so the form is hidden
        } catch (error) {
          console.error('Error in Stripe payment handling:', error);
          // Fallback if setting state fails
          alert('There was an error processing your Stripe payment setup. Please try again or choose a different payment method.');
        }
      } else if (formData.paymentMethod === 'Venmo') {
        window.open('https://venmo.com/livecityentertainment', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
      } else if (formData.paymentMethod === 'CashApp') {
        window.open('https://cash.app/$LiveCity', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
      } else if (formData.paymentMethod === 'PayPal') {
        window.open('https://www.paypal.biz/livecity', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
      }
      
      // For other payment methods, continue with email flow
      
      // Create a clean template params object with only string values
      const templateParams = {
        to_name: formData.clientName || '',
        to_email: formData.email || '',
        event_type: formData.eventType || '',
        event_date: formData.eventDate || '',
        venue_name: formData.venueName || '',
        venue_location: formData.venueLocation || '',
        start_time: formData.startTime || '',
        end_time: formData.endTime || '',
        guest_count: String(formData.guestCount || 0),
        phone_number: formData.contactPhone || '',
        total_amount: `$${calculateTotal()}`,
        payment_method: formData.paymentMethod || 'Other'
      };
      
      console.log("Sending email with params:", templateParams);
      
      const emailResponse = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID
      );

      if (emailResponse.status === 200) {
        // Update the document with email confirmation
        await updateDoc(doc(db, 'djContracts', docRef.id), {
          confirmationSent: true,
          status: 'emailSent'
        });
        setSubmitted(true);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
      } else {
        console.error("Email failed. Contract not saved.");
        alert("Failed to send confirmation email. Contract not saved.");
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      alert("An error occurred while submitting the contract.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#333',
  };

  const inputStyle = {
    backgroundColor: 'white',
    width: '100%',
    padding: '12px',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    color: 'black',
  };

  const iconStyle = {
    marginRight: '8px',
    fontSize: '18px',
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
  };

  const fieldIcons = {
    clientName: <FaUser style={{...iconStyle, color: '#4299E1'}} />,
    email: <FaEnvelope style={{...iconStyle, color: '#ED8936'}} />,
    contactPhone: <FaPhone style={{...iconStyle, color: '#48BB78'}} />,
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
    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', color: '#000' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <span style={{ flex: '1 1 auto' }}>🎶 Base Package</span>
        <span style={{ whiteSpace: 'nowrap' }}>${SERVICES.BASE}</span>
      </div>
      {formData.lighting && <li>💡 Lighting: ${SERVICES.LIGHTING}</li>}
      {formData.photography && <li>📸 Event Photography: ${SERVICES.PHOTOGRAPHY}</li>}
      {formData.videoVisuals && <li>📽️ Video Visuals: ${SERVICES.VIDEO_VISUALS}</li>}
      {formData.additionalHours > 0 && (
        <li>⏱️ Additional Hours: ${formData.additionalHours * SERVICES.ADDITIONAL_HOUR}</li>
      )}
      <li>
        <strong>Total: ${calculateTotal()}</strong>
      </li>
    </ul>
  );

  // InfoModal component for displaying info popups with an "Ok" button.
  function InfoModal({ text, onClose }) {
    return (
      <div style={{
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
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          maxWidth: '500px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
          border: '2px solid #0070f3',
        }}>
          <h3 style={{ marginBottom: '12px', color: '#0070f3' }}>Additional Information</h3>
          <p style={{
            marginBottom: '20px',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#333',
            fontWeight: '500'
          }}>{text}</p>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
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
    
    // Update form data in the next tick to avoid blocking the UI
    setTimeout(() => {
      setFormData(prev => ({ ...prev, paymentMethod: method }));
    }, 0);
  }, []);

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

  if (!isClient) {
    return null;
  }

  if (submitted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        position: 'relative',
        width: '100%',
        background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
        color: 'white'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          maxWidth: '90%',
          width: '600px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <span role="img" aria-label="celebration" style={{ fontSize: '64px' }}>🎉</span>
          </div>
          <h1 style={{ 
            color: '#3b82f6', 
            marginBottom: '1.5rem', 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            Booking Submitted!
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            lineHeight: '1.6',
            marginBottom: '2rem',
            color: '#333',
            fontWeight: '500'
          }}>
            Thank you! Your DJ booking request has been submitted successfully. You will receive a confirmation email shortly.
            We look forward to celebrating with you!
          </p>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setSubmitted(false);
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Book Another Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: '2rem'
    }}>
      {/* Development Environment Indicator */}
      {process.env.NODE_ENV === 'development' && <EnvChecker />}
      
      {/* Test environment variables (hidden) */}
      <EnvTest />
      
      {showConfirmation && (
        <PaymentConfirmationBanner 
          paymentMethod={formData.paymentMethod} 
          onClose={() => setShowConfirmation(false)}
        />
      )}
      {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}
      {showTerms && <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />}
      
      <div className="main-content" style={{ 
        display: 'flex', 
        justifyContent: 'center',
        width: '100%',
        overflow: 'visible',
        minHeight: '100vh'
      }}>
        {showStripe ? (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            maxWidth: '600px',
            width: '85%',
            margin: '2rem auto 0 auto'
          }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', color: '#111', marginBottom: '1.5rem', fontWeight: '600' }}>
              Complete Your Payment
            </h2>
            <StripeCheckout
              amount={calculateTotal() * 100}
              contractDetails={formData}
              onSuccess={(paymentId) => {
                // Handle successful payment before form submission
                setShowStripe(false);
                router.push(`/payment/success?id=${paymentId}`);
              }}
            />
          </div>
        ) : submitted ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#111',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            maxWidth: '600px',
            width: '85%',
            margin: '2rem auto 0 auto'
          }}>
            <h2 style={{ color: '#0070f3', marginBottom: '1rem' }}>🎉 Thank You!</h2>
            <p style={{ marginBottom: '1rem', fontSize: '1rem' }}>
              Your contract has been submitted successfully. We&apos;ve sent a confirmation email to <strong>{formData.email}</strong>.
            </p>

            {formData.paymentMethod === 'Venmo' && (
              <div style={{ marginTop: '1rem', fontSize: '1rem' }}>
                <h3>Please send your deposit via Venmo:</h3>
                <p>@Bobby-Martin-64</p>
              </div>
            )}

            {formData.paymentMethod === 'CashApp' && (
              <div style={{ marginTop: '1rem', fontSize: '1rem' }}>
                <h3>Please send your deposit via Cash App:</h3>
                <p>$LiveCity</p>
              </div>
            )}

            {formData.paymentMethod === 'PayPal' && (
              <div style={{ marginTop: '1rem', fontSize: '1rem' }}>
                <h3>Please send your deposit via PayPal:</h3>
                <p>LiveCity (https://www.paypal.biz/livecity)</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            maxWidth: '600px',
            width: '85%',
            margin: '2rem auto 3rem auto'
          }}>
            <form onSubmit={handleSubmit} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '2.5rem',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              width: '100%',
              marginBottom: '50px'
            }}>
              {/* Add Header at the top of the form */}
              <Header />
              
              {/* Spacer div between email address and client name */}
              <div style={{ 
                height: '20px', 
                marginBottom: '20px', 
                borderBottom: '1px solid #e0e0e0',
                opacity: 0.5
              }}></div>
              
              {/* Client Information Section */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {fieldIcons['clientName']} Client Name:
                  </span>
                </label>
                <input
                  name="clientName"
                  type="text"
                  required
                  style={inputStyle}
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              {['email', 'contactPhone', 'eventType', 'guestCount', 'venueName'].map((field) => (
                <div key={field}>
                  <label style={labelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {fieldIcons[field]} 
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                  </label>
                  <input
                    name={field}
                    type={field.includes('guest') ? 'number' : 'text'}
                    required
                    style={inputStyle}
                    value={formData[field]}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {venueLocationIcon} Venue Location
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={venueLocationRef}
                    name="venueLocation"
                    type="text"
                    value={formData.venueLocation}
                    onChange={handleChange}
                    required
                    placeholder="Enter venue address powered by Google"
                    style={{ 
                      backgroundColor: 'white', 
                      width: '100%', 
                      padding: '12px 36px 12px 12px', 
                      marginBottom: '1rem', 
                      borderRadius: '8px', 
                      border: `1px solid ${mapsError ? '#e53e3e' : '#ccc'}`, 
                      color: 'black',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  <div style={{ 
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    color: '#888',
                    fontSize: '14px'
                  }}>
                    <FaMapMarkerAlt style={{ color: mapsError ? '#e53e3e' : '#0070f3' }} />
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: mapsError ? '#e53e3e' : '#666', 
                    marginTop: '-0.75rem',
                    marginBottom: '1rem'
                  }}>
                    {mapsError || (mapsLoaded ? 'Address suggestions powered by Google Maps' : 'Loading Google Maps...')}
                  </p>
                </div>
              </div>

              {/* Event Date */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {timeIcons['eventDate']} Event Date:
                  </span>
                </label>
                <input
                  name="eventDate"
                  type="date"
                  required
                  style={inputStyle}
                  value={formData.eventDate}
                  onChange={handleChange}
                />
              </div>

              {/* Start Time */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {timeIcons['startTime']} Start Time:
                  </span>
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    if (formData.endTime) {
                      // If end time already exists, calculate new additional hours
                      const additionalHours = calculateAdditionalHours(value, formData.endTime);
                      setFormData((prev) => ({
                        ...prev,
                        startTime: value,
                        additionalHours
                      }));
                    } else {
                      // If no end time yet, just update start time
                      setFormData((prev) => ({
                        ...prev,
                        startTime: value,
                        endTime: '' // reset endTime on startTime change
                      }));
                    }
                  }}
                  required
                  style={inputStyle}
                >
                  <option value="">Select start time</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {timeIcons['endTime']} End Time:
                  </span>
                </label>
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  required
                  disabled={!formData.startTime}
                  style={inputStyle}
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
                marginTop: '2rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e0e0e0',
                position: 'relative'
              }}>
                <h3 style={{
                  color: '#333',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  display: 'inline-block',
                  padding: '0 1rem 0.5rem 0',
                  position: 'relative',
                  marginBottom: '0'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <FaPlus style={{ marginRight: '8px', color: '#0070f3', fontSize: '16px' }} />
                    Additional Services
                  </span>
                </h3>
              </div>

              {/* Redesigned Card-Style Additional Services */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '2rem'
              }}>
                {[
                  {
                    name: 'lighting',
                    label: 'Event Lighting',
                    price: '$100',
                    description: 'Requires 2 hour early entry to venue for setup. Includes sound activated strobing lights.',
                    icon: <FaLightbulb style={{ fontSize: '24px', color: '#ECC94B' }} />
                  },
                  {
                    name: 'photography',
                    label: 'Event Photography',
                    price: '$150',
                    description: 'Includes 50 high-quality candid shots delivered within 48 hours.',
                    icon: <FaCamera style={{ fontSize: '24px', color: '#4FD1C5' }} />
                  },
                  {
                    name: 'videoVisuals',
                    label: 'Video Visuals',
                    price: '$100',
                    description: 'Slide shows, presentations, karaoke etc.',
                    icon: <FaVideo style={{ fontSize: '24px', color: '#F687B3' }} />
                  },
                ].map(({ name, label, price, description, icon }) => (
                  <div 
                    key={name}
                    onClick={() => setFormData(prev => ({ ...prev, [name]: !prev[name] }))}
                    style={{
                      border: `2px solid ${formData[name] ? '#0070f3' : '#ddd'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      backgroundColor: formData[name] ? 'rgba(0, 112, 243, 0.05)' : 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: formData[name] ? '0 4px 12px rgba(0, 112, 243, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {formData[name] && (
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
                ))}
              </div>

              {/* Compact Additional Hours Selector */}
              <div>
                <label style={labelStyle}>
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
                  }}>
                    {[0, 1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, additionalHours: num }))}
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

              {/* Redesigned Payment Method Selection */}
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
                  <PaymentOption
                    method="Stripe"
                    iconComponent={<FaCreditCard />}
                    isSelected={formData.paymentMethod === 'Stripe'}
                    onSelect={() => handlePaymentMethodSelect('Stripe')}
                    iconColor="#6772E5"
                  />
                  
                  <PaymentOption
                    method="Venmo"
                    iconComponent={<SiVenmo />}
                    isSelected={formData.paymentMethod === 'Venmo'}
                    onSelect={() => handlePaymentMethodSelect('Venmo')}
                    iconColor="#3D95CE"
                  />
                  
                  <PaymentOption
                    method="CashApp"
                    iconComponent={<SiCashapp />}
                    isSelected={formData.paymentMethod === 'CashApp'}
                    onSelect={() => handlePaymentMethodSelect('CashApp')}
                    iconColor="#00C244"
                  />
                  
                  <PaymentOption
                    method="PayPal"
                    iconComponent={<FaPaypal />}
                    isSelected={formData.paymentMethod === 'PayPal'}
                    onSelect={() => handlePaymentMethodSelect('PayPal')}
                    iconColor="#0070BA"
                  />
                </div>
                {formErrors.paymentMethod && (
                  <p style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {formErrors.paymentMethod}
                  </p>
                )}
              </div>

              {/* Redesigned Terms and Conditions */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '16px',
                borderRadius: '12px',
                border: formData.agreeToTerms ? '2px solid #0070f3' : '1px solid #ddd',
                boxShadow: formData.agreeToTerms ? '0 4px 12px rgba(0, 112, 243, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                  onClick={() => setFormData(prev => ({...prev, agreeToTerms: !prev.agreeToTerms}))}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: formData.agreeToTerms ? '2px solid #0070f3' : '2px solid #ccc',
                    backgroundColor: formData.agreeToTerms ? '#0070f3' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    marginTop: '2px',
                    transition: 'all 0.2s ease'
                  }}>
                    {formData.agreeToTerms && <FaCheck color="white" size={14} />}
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      required
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      fontWeight: '500',
                      color: '#333',
                      margin: 0
                    }}>
                      I agree to the <a 
                        onClick={(e) => { 
                          e.stopPropagation();
                          setShowTerms(true); 
                        }} 
                        style={{ 
                          color: '#0070f3', 
                          fontWeight: 'bold', 
                          cursor: 'pointer',
                          textDecoration: 'underline' 
                        }}
                      >
                        terms and conditions
                      </a>, including the cancellation policy and payment terms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Itemized Total */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#000' }}>Event Package Summary:</h3>
                {itemizedTotal()}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Processing...' : 'Submit Contract'}
              </button>
            </form>
          </div>
        )}
      </div>
      
      <PaymentConfirmation 
        show={showConfirmation} 
        message={`${formData.paymentMethod} payment initiated. Please complete the transaction.`}
      />
    </div>
  );
}