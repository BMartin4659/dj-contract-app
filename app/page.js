'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StripeCheckout from '@/components/StripeCheckout';
import { motion } from 'framer-motion';
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
  FaPaypal
} from 'react-icons/fa';

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
  const [formData, setFormData] = useState({
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
  });
  
  const router = useRouter();
  const venueLocationRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [showStripe, setShowStripe] = useState(false);
  const [infoPopup, setInfoPopup] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
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

    const {
      clientName, email, contactPhone, eventType, guestCount,
      venueName, venueLocation, eventDate, startTime, endTime,
      paymentMethod, lighting, photography, videoVisuals, agreeToTerms,
      additionalHours
    } = formData;

    if (!venueLocation) return alert('Please select a venue location.');
    if (!validateEmail(email)) return alert('Enter a valid email.');
    if (!validatePhone(contactPhone)) return alert('Enter a valid phone number.');
    if (!validateAddress(venueLocation)) return alert('Please enter a valid address.');
    if (!agreeToTerms) return alert('Please agree to the terms.');
    
    // Set submitting state
    setIsSubmitting(true);
    
    try {
      // Create contract first
      const docRef = await addDoc(collection(db, 'djContracts'), {
        eventType,
        numberOfGuests: guestCount,
        venueName,
        venueLocation,
        eventDate,
        startTime,
        endTime,
        additionalHours,
        email,
        clientName,
        phoneNumber: contactPhone,
        paymentMethod,
        depositPaid: false,
        confirmationSent: false,
        reminderSent: false,
        status: 'pending',
        createdAt: new Date()
      });
      
      if (paymentMethod === 'Stripe') {
        setShowStripe(true);
        return;
      } else if (paymentMethod === 'Venmo') {
        window.open('https://venmo.com/u/Bobby-Martin-64', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        return;
      } else if (paymentMethod === 'CashApp') {
        window.open('https://cash.app/$LiveCity', '_blank');
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1000);
        return;
      }
      
      // For other payment methods, continue with email flow
      
      // Create a clean template params object with only string values
      const templateParams = {
        to_name: clientName || '',
        to_email: email || '',
        event_type: eventType || '',
        event_date: eventDate || '',
        venue_name: venueName || '',
        venue_location: venueLocation || '',
        start_time: formData.startTime || '',
        end_time: formData.endTime || '',
        guest_count: String(guestCount || 0),
        phone_number: contactPhone || '',
        total_amount: `$${calculateTotal()}`,
        payment_method: paymentMethod || 'Other'
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

  // Convert time to minutes for better comparison
  const convertToMinutes = (t) => {
    if (!t) return 0;
    const [time, period] = t.split(' ');
    let [hour, minute] = time.split(':').map(Number);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    // Adjust early morning times (12:00 AM – 2:00 AM) to come *after* 11:30 PM
    const total = hour * 60 + minute;
    return total < 480 ? total + 1440 : total; // if before 8:00 AM, treat as after midnight
  };

  const BASE = 350,
    LIGHTING = 100,
    PHOTO = 150,
    VIDEO = 100,
    EXTRA_HOUR = 75;
  const calculateTotal = () => {
    let total = BASE;
    if (formData.lighting) total += LIGHTING;
    if (formData.photography) total += PHOTO;
    if (formData.videoVisuals) total += VIDEO;
    total += formData.additionalHours * EXTRA_HOUR;
    return total;
  };

  const itemizedTotal = () => (
    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', color: '#000' }}>
      <li>🎶 Base Package: ${BASE}</li>
      {formData.lighting && <li>💡 Lighting: ${LIGHTING}</li>}
      {formData.photography && <li>📸 Photography: ${PHOTO}</li>}
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
    Stripe: <FaCreditCard style={{...iconStyle, color: '#635BFF'}} />,
    Venmo: <FaMoneyBillWave style={{...iconStyle, color: '#008CFF'}} />,
    CashApp: <FaMoneyBillWave style={{...iconStyle, color: '#00D632'}} />,
  };

  return (
    <>
      {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}
      {showTerms && <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />}

      <div style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundImage: "url('/dj-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: 'Helvetica Neue, Segoe UI, Roboto, sans-serif',
      }}>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '2.5rem',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <h1 style={{ textAlign: 'center', fontSize: '2.25rem', color: '#000', marginBottom: '1rem' }}>
            🎧 Live City DJ Contract
          </h1>
          <p style={{
            textAlign: 'center',
            fontSize: '1rem',
            color: '#444',
            marginTop: '0.25rem',
            marginBottom: '1rem'
          }}>
            Lock in your date — submit your payment to get the party started! 🎉
          </p>


          <p style={{ textAlign: 'center', color: '#111', marginBottom: '1.5rem' }}>
            📞 <a href="tel:+12036949388" style={{ color: '#0070f3' }}>(203) 694-9388</a> ·
            📧 <a href="mailto:therealdjbobbydrake@gmail.com" style={{ color: '#0070f3' }}>therealdjbobbydrake@gmail.com</a>
          </p>

          {showStripe ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              padding: '2rem',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              maxWidth: '700px',
              margin: '0 auto',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)'
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
          ) : !submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              {['clientName', 'email', 'contactPhone', 'eventType', 'guestCount', 'venueName'].map((field) => (
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
                    setFormData((prev) => ({
                      ...prev,
                      startTime: value,
                      endTime: '' // reset endTime on startTime change
                    }));
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
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
              </div>

              {[
                {
                  name: 'lighting',
                  label: 'Event Lighting (+$100)',
                  description: 'Requires 2 hour early entry to venue for setup. Includes sound activated strobing lights.',
                },
                {
                  name: 'photography',
                  label: 'Photography (+$150)',
                  description: 'Includes 50 high-quality candid shots delivered within 48 hours.',
                },
                {
                  name: 'videoVisuals',
                  label: 'Video Visuals (+$100)',
                  description: 'Slide shows, presentations, karaoke etc.',
                },
              ].map(({ name, label, description }) => (
                <div key={name} style={{ position: 'relative' }}>
                  <label style={labelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {serviceIcons[name]} {label}
                    </span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      name={name}
                      checked={formData[name]}
                      onChange={handleChange}
                      style={{ marginRight: '10px' }}
                    />
                    <span
                      onClick={() => setInfoPopup(description)}
                      style={{
                        color: '#0070f3',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 112, 243, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <FaInfoCircle style={{ marginRight: '5px' }} /> Info
                    </span>
                  </div>
                </div>
              ))}

              {/* Stylish Additional Hours Selector */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <FaClock style={{ marginRight: '8px', color: '#68D391', fontSize: '18px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                    Additional Hours ($75/hr):
                  </span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: '150px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, additionalHours: Math.max(0, prev.additionalHours - 1) }))}
                    style={{
                      border: 'none',
                      background: '#f0f0f0',
                      padding: '10px 15px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flex: '0 0 auto'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  >
                    <FaMinus style={{ color: '#e53e3e' }} />
                  </button>
                  <div style={{
                    padding: '10px 15px',
                    flex: '1 1 auto',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    minWidth: '40px',
                    fontSize: '18px',
                    color: '#333'
                  }}>
                    {formData.additionalHours}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, additionalHours: prev.additionalHours + 1 }))}
                    style={{
                      border: 'none',
                      background: '#f0f0f0',
                      padding: '10px 15px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flex: '0 0 auto'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  >
                    <FaPlus style={{ color: '#38a169' }} />
                  </button>
                </div>
              </div>

              {/* Stylish Payment Method Selection */}
              <div>
                <label style={labelStyle}>Payment Method:</label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Stripe Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Stripe' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'Stripe' ? '#635BFF' : '#ddd'}`,
                      borderRadius: '8px',
                      padding: '10px 15px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'Stripe' ? '#f0f4ff' : 'white',
                      transition: 'all 0.2s ease',
                      minWidth: '120px'
                    }}
                  >
                    <input
                      type="radio"
                      id="stripe"
                      name="paymentMethod"
                      value="Stripe"
                      checked={formData.paymentMethod === 'Stripe'}
                      onChange={handleChange}
                      required
                      style={{ marginRight: '10px' }}
                    />
                    <FaCreditCard style={{
                      marginRight: '8px',
                      color: '#635BFF',
                      fontSize: '22px',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                    }} />
                    <span style={{
                      fontWeight: formData.paymentMethod === 'Stripe' ? 'bold' : 'normal',
                      color: formData.paymentMethod === 'Stripe' ? '#000' : '#444'
                    }}>
                      Stripe
                    </span>
                  </div>
                  
                  {/* Venmo Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Venmo' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'Venmo' ? '#008CFF' : '#ddd'}`,
                      borderRadius: '8px',
                      padding: '10px 15px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'Venmo' ? '#f0f9ff' : 'white',
                      transition: 'all 0.2s ease',
                      minWidth: '120px'
                    }}
                  >
                    <input
                      type="radio"
                      id="venmo"
                      name="paymentMethod"
                      value="Venmo"
                      checked={formData.paymentMethod === 'Venmo'}
                      onChange={handleChange}
                      required
                      style={{ marginRight: '10px' }}
                    />
                    <FaMoneyBillWave style={{
                      marginRight: '8px',
                      color: '#008CFF',
                      fontSize: '22px',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                    }} />
                    <span style={{
                      fontWeight: formData.paymentMethod === 'Venmo' ? 'bold' : 'normal',
                      color: formData.paymentMethod === 'Venmo' ? '#000' : '#444'
                    }}>
                      Venmo
                    </span>
                  </div>
                  
                  {/* CashApp Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'CashApp' }))}
                    style={{
                      border: `2px solid ${formData.paymentMethod === 'CashApp' ? '#00D632' : '#ddd'}`,
                      borderRadius: '8px',
                      padding: '10px 15px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.paymentMethod === 'CashApp' ? '#f0fff4' : 'white',
                      transition: 'all 0.2s ease',
                      minWidth: '120px'
                    }}
                  >
                    <input
                      type="radio"
                      id="cashapp"
                      name="paymentMethod"
                      value="CashApp"
                      checked={formData.paymentMethod === 'CashApp'}
                      onChange={handleChange}
                      required
                      style={{ marginRight: '10px' }}
                    />
                    <FaMoneyBillWave style={{
                      marginRight: '8px',
                      color: '#00D632',
                      fontSize: '22px',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                    }} />
                    <span style={{
                      fontWeight: formData.paymentMethod === 'CashApp' ? 'bold' : 'normal',
                      color: formData.paymentMethod === 'CashApp' ? '#000' : '#444'
                    }}>
                      CashApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{
                marginBottom: '1rem',
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    required
                    style={{
                      marginRight: '0.75rem',
                      width: '18px',
                      height: '18px'
                    }}
                  />
                  <span style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.4',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    I agree to the <a onClick={(e) => { e.preventDefault(); setShowTerms(true); }} style={{ color: '#0070f3', fontWeight: 'bold', cursor: 'pointer' }}>terms and conditions</a>, including the cancellation policy and payment terms.
                  </span>
                </label>
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
                  backgroundColor: '#0070f3',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Processing...' : 'Submit Contract'}
              </button>
            </form>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#111',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
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

              <button
                onClick={() => setSubmitted(false)}
                style={{
                  backgroundColor: '#0070f3',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  marginTop: '1.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Choose Another Payment Method
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
