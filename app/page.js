'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StripeCheckout from '@/components/StripeCheckout';
import confetti from 'canvas-confetti';
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
        // Show Stripe checkout instead of redirecting
        setShowStripe(true);
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
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          zIndex: 9999,
        });
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          <p style={{ marginBottom: '15px' }}>{text}</p>
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
    color: '#0070f3',
  };

  const fieldIcons = {
    clientName: <FaUser style={iconStyle} />,
    email: <FaEnvelope style={iconStyle} />,
    contactPhone: <FaPhone style={iconStyle} />,
    eventType: <FaCalendarAlt style={iconStyle} />,
    guestCount: <FaUsers style={iconStyle} />,
    venueName: <FaBuilding style={iconStyle} />,
  };

  const venueLocationIcon = <FaMapMarkerAlt style={iconStyle} />;
  const timeIcons = {
    eventDate: <FaCalendarAlt style={iconStyle} />,
    startTime: <FaClock style={iconStyle} />,
    endTime: <FaClock style={iconStyle} />,
  };
  const serviceIcons = {
    lighting: <FaLightbulb style={iconStyle} />,
    photography: <FaCamera style={iconStyle} />,
    videoVisuals: <FaVideo style={iconStyle} />,
  };
  const additionalHoursIcon = <FaClock style={iconStyle} />;
  const paymentIcons = {
    Stripe: <FaCreditCard style={iconStyle} />,
    Venmo: <FaMoneyBillWave style={iconStyle} />,
    CashApp: <FaMoneyBillWave style={iconStyle} />,
  };

  return (
    <>
      {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}

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
          <h1 style={{ textAlign: 'center', fontSize: '2.25rem', color: '#000' }}>
            🎧 Live City DJ Contract
          </h1>

          {/* Only show the instruction text when the form is not submitted */}
          {!submitted && (
            <p style={{ textAlign: 'center', color: '#111', marginBottom: '0.5rem' }}>
              Please complete the contract form below to reserve your event date.
            </p>
          )}

          <p style={{ textAlign: 'center', color: '#111', marginBottom: '1.5rem' }}>
            📞 <a href="tel:+12036949388" style={{ color: '#0070f3' }}>(203) 694-9388</a> ·
            📧 <a href="mailto:therealdjbobbydrake@gmail.com" style={{ color: '#0070f3' }}>therealdjbobbydrake@gmail.com</a>
          </p>

          {showStripe ? (
            <div className="mt-4">
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
                <div key={name}>
                  <label style={labelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {serviceIcons[name]} {label}
                    </span>
                    <span onClick={() => setInfoPopup(description)} style={{ color: '#0070f3', marginLeft: 8, cursor: 'pointer' }}>
                      <FaInfoCircle />
                    </span>
                  </label>
                  <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} />
                </div>
              ))}

              {/* Redesigned compact Additional Hours Field with icon */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {additionalHoursIcon} Additional Hours ($75/hr):
                  </span>
                </label>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginLeft: '1rem',
                }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, additionalHours: Math.max(0, prev.additionalHours - 1) }))}
                    style={{
                      border: 'none',
                      background: '#f0f0f0',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <FaMinus />
                  </button>
                  <span style={{ padding: '0 12px', minWidth: '30px', textAlign: 'center' }}>
                    {formData.additionalHours}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, additionalHours: prev.additionalHours + 1 }))}
                    style={{
                      border: 'none',
                      background: '#f0f0f0',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label style={labelStyle}>Payment Method:</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  {['Stripe', 'Venmo', 'CashApp'].map(method => (
                    <label key={method} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={formData.paymentMethod === method}
                        onChange={handleChange}
                        required
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {paymentIcons[method]} {method}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    required
                    style={{ marginRight: '0.5rem', marginTop: '0.25rem' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>
                    I agree to the <a href="#" style={{ color: '#0070f3' }}>terms and conditions</a>, including the cancellation policy and payment terms.
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
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2 style={{ color: '#0070f3', marginBottom: '1rem' }}>🎉 Thank You!</h2>
              <p style={{ marginBottom: '1rem' }}>
                Your contract has been submitted successfully. We&apos;ve sent a confirmation email to {formData.email}.
              </p>

              {formData.paymentMethod === 'Venmo' && (
                <div style={{ marginTop: '1rem' }}>
                  <h3>Please send your deposit via Venmo:</h3>
                  <p>@BobbyDrake-DJ</p>
                </div>
              )}

              {formData.paymentMethod === 'CashApp' && (
                <div style={{ marginTop: '1rem' }}>
                  <h3>Please send your deposit via Cash App:</h3>
                  <p>$BobbyDrakeDJ</p>
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
                }}
              >
                Submit Another Contract
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
