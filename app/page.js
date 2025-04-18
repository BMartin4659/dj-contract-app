'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StripeCheckout from '../components/StripeCheckout';
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
  FaPaypal,
  FaDollarSign,
  FaRegCreditCard
} from 'react-icons/fa';
import { BsStripe } from 'react-icons/bs';
import { SiVenmo, SiCashapp } from 'react-icons/si';

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
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  
  const [showStripe, setShowStripe] = useState(false);
  const [infoPopup, setInfoPopup] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  
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

  // Load Google Maps API using a singleton pattern to prevent multiple inclusions
  useEffect(() => {
    // Only run on client-side
    if (!isClient) return;
    
    // Set up a global namespace for our app
    window.DJContractApp = window.DJContractApp || {};
    
    // Function to initialize the autocomplete once API is loaded
    const initializeAutocomplete = () => {
      try {
        if (!venueLocationRef.current) {
          console.warn("Venue location input reference is null");
          return;
        }
        
        console.log("Initializing Autocomplete...");
        const autocomplete = new window.google.maps.places.Autocomplete(
          venueLocationRef.current, 
          { types: ['address'], componentRestrictions: { country: 'us' } }
        );
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log("Place selected:", place);
          if (place && place.formatted_address) {
            setFormData(prev => ({
              ...prev,
              venueLocation: place.formatted_address
            }));
          }
        });
        
        console.log("Autocomplete initialized successfully");
        return autocomplete;
      } catch (error) {
        console.error("Error initializing autocomplete:", error);
        setMapsError("Failed to initialize address autocomplete");
        return null;
      }
    };
    
    // Function to load the API only once
    const loadGoogleMapsApiSingleton = () => {
      return new Promise((resolve, reject) => {
        // If API is already loaded, resolve immediately
        if (window.google?.maps?.places) {
          console.log("Google Maps API already loaded, using existing instance");
          setMapsLoaded(true);
          resolve();
          return;
        }
        
        // Check if we're already loading the API
        if (window.DJContractApp.mapsLoading) {
          console.log("Google Maps API is already being loaded by another component");
          
          // If we have a callback queue, add our resolver to it
          if (!window.DJContractApp.mapsCallbacks) {
            window.DJContractApp.mapsCallbacks = [];
          }
          
          window.DJContractApp.mapsCallbacks.push(() => {
            console.log("Maps loaded via callback");
            setMapsLoaded(true);
            resolve();
          });
          return;
        }
        
        // Mark that we're loading the API
        window.DJContractApp.mapsLoading = true;
        
        // Initialize callbacks array
        window.DJContractApp.mapsCallbacks = [];
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        console.log("Google Maps API Key available:", !!apiKey);
        console.log("API Key length:", apiKey ? apiKey.length : 0);
        
        if (!apiKey) {
          console.error("No Google Maps API key provided");
          setMapsError("Missing API key");
          reject(new Error("Missing API key"));
          return;
        }
        
        console.log("Loading Google Maps API (first load)...");
        
        // Check if there's already a script tag
        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
          console.log("Found existing script tag, removing to prevent duplicates");
          existingScript.remove();
        }
        
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=googleMapsCallback`;
        console.log("Maps script URL created (without showing full API key)");
        script.async = true;
        script.defer = true;
        
        // Define the callback function globally
        window.googleMapsCallback = () => {
          console.log("Google Maps API loaded via callback");
          window.DJContractApp.mapsLoading = false;
          setMapsLoaded(true);
          
          // Call all the callbacks that were waiting
          if (window.DJContractApp.mapsCallbacks && window.DJContractApp.mapsCallbacks.length > 0) {
            console.log(`Calling ${window.DJContractApp.mapsCallbacks.length} pending callbacks`);
            window.DJContractApp.mapsCallbacks.forEach(callback => callback());
            window.DJContractApp.mapsCallbacks = [];
          }
          
          resolve();
        };
        
        script.onerror = (error) => {
          console.error("Error loading Google Maps API:", error);
          window.DJContractApp.mapsLoading = false;
          setMapsError("Failed to load Google Maps");
          reject(error);
        };
        
        document.head.appendChild(script);
        console.log("Google Maps script tag added to document head");
      });
    };
    
    // Main execution
    let autocompleteInstance = null;
    
    loadGoogleMapsApiSingleton()
      .then(() => {
        autocompleteInstance = initializeAutocomplete();
      })
      .catch(err => {
        console.error("Google Maps loading failed:", err);
      });
    
    // Cleanup function
    return () => {
      if (autocompleteInstance && typeof autocompleteInstance.unbindAll === 'function') {
        console.log("Cleaning up autocomplete instance");
        autocompleteInstance.unbindAll();
      }
    };
  }, [isClient]);
  
  // Effect to calculate additional hours whenever times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const calculatedHours = calculateAdditionalHours(formData.startTime, formData.endTime);
      if (calculatedHours !== formData.additionalHours) {
        setFormData(prev => ({
          ...prev,
          additionalHours: calculatedHours
        }));
      }
    }
  }, [formData.startTime, formData.endTime, calculateAdditionalHours, formData.additionalHours]);

  // Helper function to manually initialize Maps API
  const initializeMapsAPI = () => {
    if (typeof window === 'undefined') return;
    
    console.log('Manual Maps initialization triggered');
    // First check if API is already available
    if (window.google?.maps?.places) {
      console.log('Maps API already loaded, just initializing autocomplete');
      setMapsLoaded(true);
      const autocomplete = new window.google.maps.places.Autocomplete(
        venueLocationRef.current,
        { types: ['address'], componentRestrictions: { country: 'us' } }
      );
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            venueLocation: place.formatted_address
          }));
        }
      });
      
      return;
    }
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('No Maps API key found');
      setMapsError('Missing API key');
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-maps-script-manual';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      console.log('Maps API loaded manually');
      setMapsLoaded(true);
      
      if (venueLocationRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          venueLocationRef.current,
          { types: ['address'], componentRestrictions: { country: 'us' } }
        );
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.formatted_address) {
            setFormData(prev => ({
              ...prev,
              venueLocation: place.formatted_address
            }));
          }
        });
      }
    };
    
    script.onerror = (error) => {
      console.error('Error loading Maps API manually:', error);
      setMapsError('Failed to load Maps API');
    };
    
    document.head.appendChild(script);
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
    
    // Scroll to top for better mobile experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
        // On mobile, use deep linking when possible
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const venmoDeepLink = 'venmo://paycharge?txn=pay&recipients=Bobby-Martin-64';
        
        if (isMobile) {
          // Try deep linking first
          window.location.href = venmoDeepLink;
          
          // Fallback after a short delay if deep linking fails
          setTimeout(() => {
            window.open('https://venmo.com/u/Bobby-Martin-64', '_blank');
          }, 1000);
        } else {
          window.open('https://venmo.com/u/Bobby-Martin-64', '_blank');
        }
        
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1500);
        return;
      } else if (paymentMethod === 'CashApp') {
        // On mobile, use deep linking when possible
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const cashAppDeepLink = 'cash://app/pay/$LiveCity';
        
        if (isMobile) {
          // Try deep linking first
          window.location.href = cashAppDeepLink;
          
          // Fallback after a short delay if deep linking fails
          setTimeout(() => {
            window.open('https://cash.app/$LiveCity', '_blank');
          }, 1000);
        } else {
          window.open('https://cash.app/$LiveCity', '_blank');
        }
        
        // Longer delay to ensure popup isn't blocked
        setTimeout(() => setSubmitted(true), 1500);
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
    color: '#222',
  };

  const inputStyle = {
    backgroundColor: 'white',
    width: '100%',
    padding: '12px',
    marginBottom: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #bbb',
    color: 'black',
    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
    maxWidth: '100%',
    overflowX: 'hidden',
    textOverflow: 'ellipsis'
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
    Stripe: <FaCreditCard style={{...iconStyle, color: '#635BFF', fontSize: '24px'}} />,
    Venmo: <SiVenmo style={{ marginRight: '10px', fontSize: '28px', color: '#008CFF' }} />,
    CashApp: <SiCashapp style={{ marginRight: '10px', fontSize: '24px', color: '#00D632' }} />,
  };

  // Add this to improve responsive layout behavior
  useEffect(() => {
    // Function to handle iOS viewport issues with virtual keyboard
    const handleResize = () => {
      // Fix for iOS virtual keyboard
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.documentElement.style.height = `${window.innerHeight}px`;
        
        // Additional fix for form positioning when keyboard appears
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA')) {
          // Scroll to the active element with some offset
          setTimeout(() => {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Add listeners for input focus events
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
      input.addEventListener('focus', handleResize);
    });
    
    // Initial call
    handleResize();
    
    // Create and add a meta viewport tag to prevent scaling issues
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(metaViewport);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      // Clean up focus listeners
      allInputs.forEach(input => {
        input.removeEventListener('focus', handleResize);
      });
      
      // Remove the meta tag when component unmounts
      if (document.head.contains(metaViewport)) {
        document.head.removeChild(metaViewport);
      }
    };
  }, []);

  // Add event listener to handle input focus events
  const handleInputFocus = (e) => {
    // After a short delay to allow the keyboard to appear
    setTimeout(() => {
      // Scroll the element into view
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // To be used with form elements
  const focusProps = {
    onFocus: handleInputFocus,
    style: { fontSize: '16px' }
  };

  // Add custom CSS to handle mobile-specific issues and prevent horizontal scrolling
  useEffect(() => {
    // Add viewport meta tag to prevent horizontal scrolling
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(viewportMeta);
    
    // Create a style tag for custom CSS
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      html, body {
        overflow-x: hidden !important;
        width: 100% !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .form-container {
        padding: 1rem 0.75rem !important;
        width: 100% !important;
        margin: 1rem auto !important;
        max-width: 700px !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      }
      
      .payment-method-option span {
        font-size: 14px !important;
      }
      
      input, select, textarea {
        font-size: 16px !important; /* Prevents iOS zoom */
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      .itemized-total-container {
        padding: 0.75rem !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      }
      
      .main-wrapper {
        overflow-x: hidden !important;
        max-width: 100vw !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      
      /* Mobile background fix */
      @media screen and (max-width: 768px) {
        body:before {
          content: "";
          display: block;
          position: fixed;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: -10;
          background: url('/dj-background-new.jpg') no-repeat center center;
          background-size: cover;
        }
      }

      @media screen and (max-width: 480px) {
        .payment-method-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-radio-label {
          display: flex;
          align-items: center;
          padding: 5px 0;
          cursor: pointer;
          font-size: 16px;
        }

        .form-radio-label:hover {
          color: #0070f3;
        }

        .form-radio-input:checked + .form-radio-label {
          font-weight: bold;
          color: #0070f3;
        }

        .form-radio-input {
          margin-right: 10px;
        }

        .venmo-info {
          margin-top: 1rem;
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
      document.head.removeChild(viewportMeta);
    };
  }, []);

  return (
    <div className="main-wrapper">
      <div className="mobile-background"></div>
      <div className="form-container" style={{
        maxWidth: '650px',
        width: '95%',
        margin: '1rem auto',
        padding: '1.5rem 1rem',
        borderRadius: '15px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        backgroundColor: 'rgba(255,255,255,0.92)',
        WebkitBackfaceVisibility: 'hidden',
        MozBackfaceVisibility: 'hidden',
        WebkitTransform: 'translate3d(0, 0, 0)',
        transform: 'translate3d(0, 0, 0)',
        WebkitPerspective: '1000',
        perspective: '1000',
        WebkitTransformStyle: 'preserve-3d',
        boxSizing: 'border-box',
      }}>
        {infoPopup && <InfoModal text={infoPopup} onClose={() => setInfoPopup(null)} />}
        {showTerms && <InfoModal text={termsAndConditionsText} onClose={() => setShowTerms(false)} />}
        
        <div className="sticky-form-header">
          <h1 style={{
            textAlign: 'center',
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            color: '#000',
            marginTop: '0.5rem',
            marginBottom: '1.5rem',
            lineHeight: '1.2'
          }}>
            🎧 Live City DJ Contract
          </h1>

          {/* Contact Information Cards */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            margin: '0 auto 1.5rem',
            flexWrap: 'wrap',
            maxWidth: '100%'
          }}>
            <a 
              href="tel:+12036949388" 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 112, 243, 0.08)',
                borderRadius: '12px',
                color: '#222',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(0, 112, 243, 0.2)',
                boxShadow: '0 2px 6px rgba(0, 112, 243, 0.05)',
                fontSize: '0.9rem',
                flex: '0 1 auto',
                minWidth: '120px',
                justifyContent: 'center'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 112, 243, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 112, 243, 0.15)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 112, 243, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 112, 243, 0.05)';
              }}
            >
              <div style={{
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '5px',
                fontSize: '12px'
              }}>
                📞
              </div>
              <span>(203) 694-9388</span>
            </a>
            
            <a 
              href="mailto:therealdjbobbydrake@gmail.com" 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 112, 243, 0.08)',
                borderRadius: '12px',
                color: '#222',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(0, 112, 243, 0.2)',
                boxShadow: '0 2px 6px rgba(0, 112, 243, 0.05)',
                fontSize: '0.9rem',
                flex: '1 1 auto',
                maxWidth: '220px',
                overflow: 'hidden',
                justifyContent: 'center'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 112, 243, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 112, 243, 0.15)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 112, 243, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 112, 243, 0.05)';
              }}
            >
              <div style={{
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '5px',
                fontSize: '12px',
                flexShrink: 0
              }}>
                📧
              </div>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>therealdjbobbydrake@gmail.com</span>
            </a>
          </div>
        </div>

        {showStripe ? (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            padding: '1.5rem',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            maxWidth: '580px',
            width: '95%',
            margin: '0 auto',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)'
          }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', color: '#111', marginBottom: '1.5rem', fontWeight: '600' }}>
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
          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem', 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }} className="form-group">
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
                  onFocus={handleInputFocus}
                />
              </div>
            ))}

            <div>
            <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {venueLocationIcon} Venue Location
                  </div>
                  {mapsLoaded ? (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#38A169', 
                      backgroundColor: 'rgba(56, 161, 105, 0.1)', 
                      padding: '3px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ marginRight: '4px' }}>✓</span> Autocomplete ready
                    </span>
                  ) : mapsError ? (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#E53E3E', 
                      backgroundColor: 'rgba(229, 62, 62, 0.1)', 
                      padding: '3px 6px',
                      borderRadius: '4px'
                    }}>
                      {mapsError}
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#718096', 
                      backgroundColor: 'rgba(113, 128, 150, 0.1)', 
                      padding: '3px 6px',
                      borderRadius: '4px'
                    }}>
                      Loading autocomplete...
                    </span>
                  )}
                </span>
            </label>
            <div style={{ position: 'relative' }}>
                <input
                  ref={(element) => {
                    // Log when the ref is attached
                    if (element && !venueLocationRef.current) {
                      console.log("Venue location input ref attached");
                    }
                    venueLocationRef.current = element;
                  }}
                  name="venueLocation"
                  type="text"
                  autoComplete="off"
                  value={formData.venueLocation}
                  onChange={handleChange}
                  onFocus={(e) => {
                    // Log status when field receives focus
                    console.log("Venue field focused. Google Maps loaded:", !!window.google?.maps?.places);
                    if (!window.google?.maps?.places) {
                      // Try to manually initialize if Maps isn't available
                      initializeMapsAPI();
                    }
                    // Also perform the input focus behavior for scrolling
                    handleInputFocus(e);
                  }}
                  required
                  placeholder="Start typing your address..."
                  style={{
                    backgroundColor: 'white', 
                    width: '100%', 
                    padding: '12px', 
                    paddingRight: '30px',
                    marginBottom: '1rem', 
                    borderRadius: '8px', 
                    border: `1px solid ${mapsError ? '#E53E3E' : '#ccc'}`, 
                    color: 'black',
                    boxShadow: mapsLoaded ? '0 0 0 1px rgba(56, 161, 105, 0.3)' : 'none'
                  }}
                />
                <div style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  {mapsLoaded ? (
                    <span style={{ color: '#38A169' }}>✓</span>
                  ) : mapsError ? (
                    <span style={{ color: '#E53E3E' }}>!</span>
                  ) : (
                    <span style={{ color: '#718096' }}>⟳</span>
                  )}
                </div>
              </div>
              {mapsError && (
                <div style={{
                  marginTop: '-0.5rem',
                  marginBottom: '1rem',
                  fontSize: '12px',
                  color: '#E53E3E',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(229, 62, 62, 0.1)',
                  borderRadius: '4px'
                }}>
                  Address autocomplete unavailable. Please enter the full address manually.
                </div>
              )}
              
              {/* Instructions for troubleshooting */}
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '4px'
              }}>
                If autocomplete isn&apos;t working, please refresh the page. Type a street address for best results.
              </div>
            </div>


              {/* Event Date */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {timeIcons['eventDate']} Event Date:
                  </span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    position: 'relative',
                    flex: '1 1 auto',
                    minWidth: '210px'
                  }}>
                    <input
                      name="eventDate"
                      type="date"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        fontSize: '16px', // Prevents iOS zoom
                        color: '#2D3748',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'textfield'
                      }}
                      value={formData.eventDate}
                      onChange={handleChange}
                      onFocus={handleInputFocus}
                    />
                  </div>
                  {formData.eventDate && (
                    <div style={{
                      backgroundColor: 'rgba(66, 153, 225, 0.1)',
                      color: '#3182CE',
                      padding: '7px 12px',
                      borderRadius: '5px',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(66, 153, 225, 0.2)',
                      letterSpacing: '0.3px',
                      flex: '1 1 auto',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {new Date(formData.eventDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Start and End Time - Combined Row */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <FaClock style={{...iconStyle, color: '#4299E1'}} /> Event Time:
                  </span>
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
                  {/* Start Time */}
                  <div style={{ 
                    flex: '1 1 140px',
                    minWidth: '120px',
                  }}>
                    <label style={{ 
                      fontSize: '0.8rem', 
                      color: '#718096', 
                      marginBottom: '3px',
                      display: 'block'
                    }}>
                      Start:
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
                      onFocus={handleInputFocus}
                      style={{
                        width: '100%',
                        padding: '10px 8px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        color: 'black',
                        fontSize: '16px', // Prevents iOS zoom
                        textAlign: 'center',
                        appearance: 'menulist'
                      }}
                    >
                      <option value="">Select</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* End Time */}
                  <div style={{ 
                    flex: '1 1 140px',
                    minWidth: '120px',
                  }}>
                    <label style={{ 
                      fontSize: '0.8rem', 
                      color: '#718096', 
                      marginBottom: '3px',
                      display: 'block'
                    }}>
                      End:
                    </label>
                    <select
                      name="endTime"
                      value={formData.endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      required
                      disabled={!formData.startTime}
                      onFocus={handleInputFocus}
                      style={{
                        width: '100%',
                        padding: '10px 8px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        color: 'black',
                        opacity: formData.startTime ? 1 : 0.6,
                        fontSize: '16px', // Prevents iOS zoom
                        textAlign: 'center',
                        appearance: 'menulist'
                      }}
                    >
                      <option value="">Select</option>
                      {formData.startTime &&
                        timeOptions
                          .filter((t) => convertToMinutes(t) > convertToMinutes(formData.startTime))
                          .map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                    </select>
                  </div>
                  
                  {/* Duration Display */}
                  {formData.startTime && formData.endTime && (
                    <div style={{
                      flex: '1 1 140px',
                      backgroundColor: 'rgba(66, 153, 225, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      marginTop: '22px' // To align with selects
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#2B6CB0' }}>
                        {Math.round(calculateHoursBetween(formData.startTime, formData.endTime) * 10) / 10} hrs total
                      </div>
                      {calculateAdditionalHours(formData.startTime, formData.endTime) > 0 && (
                        <div style={{ fontSize: '12px', color: '#4A5568' }}>
                          Base: 4h + {calculateAdditionalHours(formData.startTime, formData.endTime)}h additional
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Early morning warning */}
                {formData.endTime && formData.endTime.includes('AM') && ['12:', '1:', '2:'].some(h => formData.endTime.startsWith(h)) && (
                  <div style={{
                    fontSize: '12px',
                    color: '#805AD5',
                    marginTop: '4px',
                    padding: '6px',
                    backgroundColor: 'rgba(128, 90, 213, 0.1)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaInfoCircle style={{ marginRight: '6px', color: '#805AD5' }} />
                    <span>Early morning times (12AM-2AM) are treated as after midnight for billing purposes.</span>
                  </div>
                )}
              </div>

              {/* Additional Features Section */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  margin: '1.5rem 0 0.75rem',
                  color: '#2D3748',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.5rem'
                }}>
                  Additional Services
                </h3>
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

              {/* Additional Hours (manually added) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#222', marginBottom: '10px' }}>
                  Additional Hours ($75/hr):
                  {formData.startTime && formData.endTime && calculateHoursBetween(formData.startTime, formData.endTime) > 4 && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#4299E1', 
                      backgroundColor: 'rgba(66, 153, 225, 0.1)', 
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontWeight: 'normal',
                      marginLeft: '10px'
                    }}>
                      Auto-calculated based on time selection
                    </span>
                  )}
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  overflow: 'hidden',
                  maxWidth: '200px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      // Ensure we don't go below 0
                      const newValue = Math.max(0, formData.additionalHours - 1);
                      setFormData(prev => ({ ...prev, additionalHours: newValue }));
                    }}
                    style={{
                      border: 'none',
                      background: '#f5f5f5',
                      padding: '12px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: '0 0 auto',
                      height: '48px',
                      width: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #e0e0e0'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#e8e8e8';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#f5f5f5';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaMinus style={{ color: '#e53e3e', fontSize: '16px' }} />
                  </button>
                  <div style={{
                    padding: '10px 20px',
                    flex: '1 1 auto',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    minWidth: '60px',
                    fontSize: '22px',
                    color: '#333',
                    position: 'relative',
                    background: 'white'
                  }}>
                    {formData.additionalHours}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = formData.additionalHours + 1;
                      setFormData(prev => ({ ...prev, additionalHours: newValue }));
                    }}
                    style={{
                      border: 'none',
                      background: '#f5f5f5',
                      padding: '12px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: '0 0 auto',
                      height: '48px',
                      width: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderLeft: '1px solid #e0e0e0'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#e8e8e8';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#f5f5f5';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaPlus style={{ color: '#38a169', fontSize: '16px' }} />
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="payment-method-options-container" style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>Payment Method:</label>
                <div className="payment-method-options">
                  <div className="payment-method-option" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '10px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: formData.paymentMethod === 'stripe' ? 'rgba(99, 91, 255, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}>
                    <input
                      type="radio"
                      id="stripe"
                      name="paymentMethod"
                      value="stripe"
                      checked={formData.paymentMethod === 'stripe'}
                      onChange={handleChange}
                      style={{ marginRight: '12px', cursor: 'pointer', width: '20px', height: '20px' }}
                    />
                    <label 
                      htmlFor="stripe" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontWeight: formData.paymentMethod === 'stripe' ? 'bold' : 'normal',
                        color: formData.paymentMethod === 'stripe' ? '#0070f3' : '#333',
                        fontSize: '16px'
                      }}
                    >
                      <FaCreditCard style={{ marginRight: '12px', fontSize: '24px', color: '#635BFF' }} /> Stripe (Credit Card)
                    </label>
                  </div>
                  
                  <div className="payment-method-option" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '10px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: formData.paymentMethod === 'venmo' ? 'rgba(0, 140, 255, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}>
                    <input
                      type="radio"
                      id="venmo"
                      name="paymentMethod"
                      value="venmo"
                      checked={formData.paymentMethod === 'venmo'}
                      onChange={handleChange}
                      style={{ marginRight: '12px', cursor: 'pointer', width: '20px', height: '20px' }}
                    />
                    <label 
                      htmlFor="venmo" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontWeight: formData.paymentMethod === 'venmo' ? 'bold' : 'normal',
                        color: formData.paymentMethod === 'venmo' ? '#0070f3' : '#333',
                        fontSize: '16px'
                      }}
                    >
                      <SiVenmo style={{ marginRight: '12px', fontSize: '28px', color: '#008CFF' }} /> Venmo
                    </label>
                  </div>
                  
                  <div className="payment-method-option" style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: formData.paymentMethod === 'cashapp' ? 'rgba(0, 214, 50, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}>
                    <input
                      type="radio"
                      id="cashapp"
                      name="paymentMethod"
                      value="cashapp"
                      checked={formData.paymentMethod === 'cashapp'}
                      onChange={handleChange}
                      style={{ marginRight: '12px', cursor: 'pointer', width: '20px', height: '20px' }}
                    />
                    <label 
                      htmlFor="cashapp" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontWeight: formData.paymentMethod === 'cashapp' ? 'bold' : 'normal',
                        color: formData.paymentMethod === 'cashapp' ? '#0070f3' : '#333',
                        fontSize: '16px'
                      }}
                    >
                      <SiCashapp style={{ marginRight: '12px', fontSize: '24px', color: '#00D632' }} /> CashApp
                    </label>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{
                marginBottom: '1rem',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
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
                      marginTop: '0.25rem',
                      width: '18px',
                      height: '18px'
                    }}
                  />
                  <span style={{
                    fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
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
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                boxSizing: 'border-box',
                maxWidth: '100%',
                overflowX: 'hidden'
              }} className="itemized-total-container">
                <h3 style={{ marginBottom: '0.5rem', color: '#000', fontWeight: 'bold' }}>Event Package Summary:</h3>
                {itemizedTotal()}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: 'auto',
                  minWidth: '200px',
                  maxWidth: '300px',
                  margin: '0 auto',
                  display: 'block',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  opacity: isSubmitting ? 0.7 : 1,
                  fontWeight: 'bold',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {isSubmitting ? 'Processing...' : 'Submit Contract'}
              </button>
            </form>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              color: '#111',
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              maxWidth: '580px',
              width: '95%',
              margin: '0 auto'
            }}>
              <h2 style={{ color: '#0070f3', marginBottom: '1rem', fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>🎉 Thank You!</h2>
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
    </div>
  );
}
