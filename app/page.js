'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StripeCheckout from '../components/StripeCheckout';
import Header from '../components/Header';
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
  FaDollarSign,
  FaRegCreditCard,
  FaCheckCircle,
  FaVenusMars
} from 'react-icons/fa';
import { BsStripe } from 'react-icons/bs';
import { SiVenmo, SiCashapp } from 'react-icons/si';
import { v4 as uuidv4 } from 'uuid';

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
    paymentMethod: '',
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
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  
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

  // Pricing constants
  const BASE = 350,
    LIGHTING = 100,
    PHOTO = 150,
    VIDEO = 100,
    EXTRA_HOUR = 75;

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
    let total = BASE;
    if (formData.lighting) total += LIGHTING;
    if (formData.photography) total += PHOTO;
    if (formData.videoVisuals) total += VIDEO;
    total += formData.additionalHours * EXTRA_HOUR;
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

  useEffect(() => {
    if (isClient && venueLocationRef.current) {
      initializeGooglePlaces();
    }
  }, [isClient]);
  
  const initializeGooglePlaces = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(venueLocationRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setFormData(prev => ({
            ...prev,
            venueLocation: place.formatted_address,
          }));
        }
      });
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
    
    // Validate required fields
    let errors = {};
    if (!formData.clientName) errors.clientName = 'Client name is required';
    if (!formData.email) errors.clientEmail = 'Email is required';
    if (!formData.contactPhone) errors.clientPhone = 'Phone number is required';
    if (!formData.eventType) errors.eventType = 'Event type is required';
    if (!formData.guestCount) errors.guestCount = 'Guest count is required';
    if (!formData.venueName) errors.venueName = 'Venue name is required';
    if (!formData.venueLocation) errors.venueLocation = 'Venue location is required';
    if (!formData.eventDate) errors.eventDate = 'Event date is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    
    // Validate email format
    if (formData.email && !validateEmail(formData.email)) {
      errors.clientEmail = 'Please enter a valid email address';
    }
    
    // Validate phone format
    if (formData.contactPhone && !validatePhone(formData.contactPhone)) {
      errors.clientPhone = 'Please enter a valid phone number';
    }
    
    // Validate address format
    if (formData.venueLocation && !validateAddress(formData.venueLocation)) {
      errors.venueLocation = 'Please enter a valid address';
    }
    
    // If there are errors, update state and prevent form submission
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    if (!formData.paymentMethod) {
      setFormErrors({
        ...errors,
        paymentMethod: 'Please select a payment method'
      });
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
      
      if (formData.paymentMethod === 'Stripe') {
        // For Stripe payment
        const stripeSession = await createStripeSession(eventData, serviceTotal);
        if (stripeSession.url) {
          // Set confirmation before redirect
          setShowConfirmation(true);
          // Short delay before redirect to allow banner to display briefly
          setTimeout(() => {
            window.location.href = stripeSession.url;
          }, 1500);
        } else {
          setError('Failed to create Stripe checkout session');
          setLoading(false);
        }
      } else if (formData.paymentMethod === 'Venmo') {
        window.open('https://venmo.com/livecityentertainment', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
        return;
      } else if (formData.paymentMethod === 'CashApp') {
        window.open('https://cash.app/$LiveCity', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
        return;
      } else if (formData.paymentMethod === 'PayPal') {
        window.open('https://www.paypal.biz/livecity', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 5000);
        return;
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
    Stripe: <BsStripe style={{ fontSize: '36px', color: '#635BFF' }} />,
    Venmo: <SiVenmo style={{ fontSize: '36px', color: '#008CFF' }} />,
    CashApp: <SiCashapp style={{ fontSize: '36px', color: '#00D632' }} />,
    PayPal: <FaPaypal style={{ fontSize: '36px', color: '#0079C1' }} />,
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
        <span style={{ whiteSpace: 'nowrap' }}>${BASE}</span>
      </div>
      {formData.lighting && <li>💡 Lighting: ${LIGHTING}</li>}
      {formData.photography && <li>📸 Event Photography: ${PHOTO}</li>}
      {formData.videoVisuals && <li>📽️ Video Visuals: ${VIDEO}</li>}
      {formData.additionalHours > 0 && (
        <li>⏱️ Additional Hours: ${formData.additionalHours * EXTRA_HOUR}</li>
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
        height: '100vh',
        padding: '0 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#0070f3', marginBottom: '1rem' }}>Booking Submitted!</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2rem' }}>
          Thank you! Your DJ booking request has been submitted successfully. You will receive a confirmation email shortly.
          We look forward to celebrating with you!
        </p>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setSubmitted(false);
          }}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 20px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Book Another Event
        </button>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      {showConfirmation && (
        <PaymentConfirmationBanner 
          paymentMethod={formData.paymentMethod} 
          onClose={() => setShowConfirmation(false)} 
        />
      )}
      {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}
      {showTerms && <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />}
      
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center' }}>
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
              width: '100%'
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
              <div className="form-group">
                <label htmlFor="clientName" className="required-field">Client Name</label>
                <input
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
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
                <input
                  ref={venueLocationRef}
                  name="venueLocation"
                  type="text"
                  value={formData.venueLocation}
                  onChange={handleChange}
                  required
                  style={{ backgroundColor: 'white', width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #ccc', color: 'black' }}
                />
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
                          +${formData.additionalHours * EXTRA_HOUR}
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
              <div>
                <label style={{...labelStyle, marginBottom: '12px'}}>Payment Method:</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                  marginBottom: '1.5rem'
                }}>
                  {/* Stripe Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Stripe' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'Stripe' ? '#635BFF' : '#ddd'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'Stripe' ? '#f5f5ff' : 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: formData.paymentMethod === 'Stripe' ? '0 6px 16px rgba(99, 91, 255, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                      height: '120px',
                      transform: formData.paymentMethod === 'Stripe' ? 'translateY(-2px)' : 'none',
                      ':hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {paymentIcons.Stripe}
                    <span style={{
                      fontWeight: formData.paymentMethod === 'Stripe' ? 'bold' : 'medium',
                      color: formData.paymentMethod === 'Stripe' ? '#000' : '#444',
                      marginTop: '12px',
                      fontSize: '16px',
                      letterSpacing: '0.5px'
                    }}>
                      Stripe
                    </span>
                    {formData.paymentMethod === 'Stripe' && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#635BFF',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCheck color="white" size={12} />
                      </div>
                    )}
                  </div>
                  
                  {/* Venmo Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Venmo' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'Venmo' ? '#008CFF' : '#ddd'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'Venmo' ? '#f0f9ff' : 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: formData.paymentMethod === 'Venmo' ? '0 6px 16px rgba(0, 140, 255, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                      height: '120px',
                      transform: formData.paymentMethod === 'Venmo' ? 'translateY(-2px)' : 'none',
                      ':hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {paymentIcons.Venmo}
                    <span style={{
                      fontWeight: formData.paymentMethod === 'Venmo' ? 'bold' : 'medium',
                      color: formData.paymentMethod === 'Venmo' ? '#000' : '#444',
                      marginTop: '12px',
                      fontSize: '16px',
                      letterSpacing: '0.5px'
                    }}>
                      Venmo
                    </span>
                    {formData.paymentMethod === 'Venmo' && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#008CFF',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCheck color="white" size={12} />
                      </div>
                    )}
                  </div>
                  
                  {/* CashApp Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'CashApp' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'CashApp' ? '#00D632' : '#ddd'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'CashApp' ? '#f0fff4' : 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: formData.paymentMethod === 'CashApp' ? '0 6px 16px rgba(0, 214, 50, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                      height: '120px',
                      transform: formData.paymentMethod === 'CashApp' ? 'translateY(-2px)' : 'none',
                      ':hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {paymentIcons.CashApp}
                    <span style={{
                      fontWeight: formData.paymentMethod === 'CashApp' ? 'bold' : 'medium',
                      color: formData.paymentMethod === 'CashApp' ? '#000' : '#444',
                      marginTop: '12px',
                      fontSize: '16px',
                      letterSpacing: '0.5px'
                    }}>
                      CashApp
                    </span>
                    {formData.paymentMethod === 'CashApp' && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#00D632',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCheck color="white" size={12} />
                      </div>
                    )}
                  </div>
                  
                  {/* PayPal Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'PayPal' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'PayPal' ? '#0079C1' : '#ddd'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'PayPal' ? '#f0f9ff' : 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: formData.paymentMethod === 'PayPal' ? '0 6px 16px rgba(0, 121, 193, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                      height: '120px',
                      transform: formData.paymentMethod === 'PayPal' ? 'translateY(-2px)' : 'none',
                      ':hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {paymentIcons.PayPal}
                    <span style={{
                      fontWeight: formData.paymentMethod === 'PayPal' ? 'bold' : 'medium',
                      color: formData.paymentMethod === 'PayPal' ? '#000' : '#444',
                      marginTop: '12px',
                      fontSize: '16px',
                      letterSpacing: '0.5px'
                    }}>
                      PayPal
                    </span>
                    {formData.paymentMethod === 'PayPal' && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#0079C1',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCheck color="white" size={12} />
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="hidden" 
                    name="paymentMethod" 
                    value={formData.paymentMethod} 
                    required 
                  />
                </div>
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