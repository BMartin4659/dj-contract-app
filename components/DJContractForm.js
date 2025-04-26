'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { SiVenmo, SiCashapp } from 'react-icons/si';
import Header from './Header';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Payment method URL configurations
const PAYMENT_URLS = {
  VENMO: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
  CASHAPP: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$BobbyMartin64',
  PAYPAL: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659'
};

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
    let autocomplete;

    async function initAutocomplete() {
      // 1. load script if needed
      if (!window.google?.maps?.places) {
        await new Promise((resolve, reject) => {
          const src = `https://maps.googleapis.com/maps/api/js?key=${
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          }&libraries=places&loading=async`;
          const existing = document.querySelector(`script[src^="${src.split('&')[0]}"]`);
          if (existing) {                      // already added
            existing.addEventListener('load', resolve);
            existing.addEventListener('error', reject);
          } else {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          }
        }).catch(err => console.error('Maps JS failed:', err));
      }

      // 2. create autocomplete
      console.log('Venue ref current:', venueLocationRef.current);
      if (window.google?.maps?.places && venueLocationRef.current) {
        autocomplete = new google.maps.places.Autocomplete(venueLocationRef.current, {
          types: ['address', 'establishment'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'geometry', 'name']
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place?.formatted_address) {
            setFormData(p => ({
              ...p,
              venueName: place.name || p.venueName,
              venueLocation: place.formatted_address
            }));
          }
        });
      } else {
        console.warn('Google Places not available or ref missing');
      }
    }

    initAutocomplete();

    return () => {
      if (autocomplete) {
        autocomplete.unbindAll();
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const validateAddress = (address) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d).{5,}$/;
    return regex.test(address);
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { clientName, email, contactPhone, eventType, guestCount, venueName, venueLocation, 
            eventDate, startTime, endTime, paymentMethod, agreeToTerms } = formData;

    if (!validateEmail(email)) return alert('Enter a valid email.');
    if (!validatePhone(contactPhone)) return alert('Enter a valid phone number.');
    if (!validateAddress(venueLocation)) return alert('Please enter a valid address.');
    if (!agreeToTerms) return alert('Please agree to the terms.');
    
    setIsSubmitting(true);
    
    try {
      const docRef = await addDoc(collection(db, 'djContracts'), {
        eventType,
        numberOfGuests: guestCount,
        venueName,
        venueLocation,
        eventDate,
        startTime,
        endTime,
        additionalHours: getAdditionalHours(),
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
      } else if (paymentMethod === 'Venmo') {
        try {
          window.open(PAYMENT_URLS.VENMO, '_blank');
          setTimeout(() => setSubmitted(true), 1000);
        } catch (error) {
          console.error('Error opening Venmo payment URL:', error);
          alert('Could not open Venmo. Please try again or use another payment method.');
          setSubmitted(true); // Still mark as submitted so user isn't stuck
        }
      } else if (paymentMethod === 'CashApp') {
        try {
          window.open(PAYMENT_URLS.CASHAPP, '_blank');
          setTimeout(() => setSubmitted(true), 1000);
        } catch (error) {
          console.error('Error opening CashApp payment URL:', error);
          alert('Could not open CashApp. Please try again or use another payment method.');
          setSubmitted(true); // Still mark as submitted so user isn't stuck
        }
      } else if (paymentMethod === 'PayPal') {
        try {
          window.open(PAYMENT_URLS.PAYPAL, '_blank');
          setTimeout(() => setSubmitted(true), 1000);
        } catch (error) {
          console.error('Error opening PayPal payment URL:', error);
          alert('Could not open PayPal. Please try again or use another payment method.');
          setSubmitted(true); // Still mark as submitted so user isn't stuck
        }
      } else {
        try {
          const functions = getFunctions();
          const sendEmail = httpsCallable(functions, 'sendConfirmationEmail');
          
          const emailPayload = {
            to: email,
            subject: `🎧 Live City DJ Booking Confirmed!`,
            text: `Your booking for ${eventType} on ${eventDate} has been confirmed.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #3b82f6;">🎉 Booking Confirmed!</h2>
                <p>Hi ${clientName},</p>
                <p>Thank you for booking <strong>Live City DJ</strong> for your <strong>${eventType}</strong>.</p>
                <ul>
                  <li><strong>Date:</strong> ${eventDate}</li>
                  <li><strong>Venue:</strong> ${venueName}</li>
                  <li><strong>Location:</strong> ${venueLocation}</li>
                  <li><strong>Start Time:</strong> ${startTime}</li>
                  <li><strong>End Time:</strong> ${endTime}</li>
                  <li><strong>Total:</strong> $${calculateTotal()}</li>
                </ul>
                <p>We'll see you on the dance floor!</p>
                <p style="margin-top: 30px;">— DJ Bobby Drake 🎧</p>
              </div>
            `
          };
          
          const result = await sendEmail(emailPayload);
          
          console.log('Email sent successfully:', result.data);
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
          // Continue with the process even if email fails
        }

        await updateDoc(doc(db, 'djContracts', docRef.id), {
          confirmationSent: true,
          status: 'emailSent'
        });
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting the contract.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const InfoModal = ({ text, onClose }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Additional Information</h3>
        <p>{text}</p>
        <button onClick={onClose}>Ok</button>
      </div>
    </div>
  );

  return (
    <div className="form-container">
      {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}
      {showTerms && <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />}

      <Header />

      {showStripe ? (
        <div className="payment-container">
          <h2>Complete Your Payment</h2>
          <StripeCheckout
            amount={calculateTotal() * 100}
            contractDetails={formData}
            onSuccess={(paymentId) => {
              setShowStripe(false);
              router.push(`/payment/success?id=${paymentId}`);
            }}
          />
        </div>
      ) : !submitted ? (
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="form-group">
            <label>Client Name</label>
            <input
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
          </div>
          
          {/* Other form fields */}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Contract'}
          </button>
        </form>
      ) : (
        <div className="confirmation-message">
          <h2>Contract Submitted Successfully!</h2>
          <p>Check your email for confirmation details.</p>
        </div>
      )}
    </div>
  );
}
