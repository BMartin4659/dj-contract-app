'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaArrowLeft, 
  FaSpinner, 
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMusic,
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaRing,
  FaPray,
  FaClipboardList,
  FaBirthdayCake,
  FaMicrophoneAlt,
  FaAddressCard,
  FaUserFriends
} from 'react-icons/fa';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';
import ReactDatePickerField from '../components/ReactDatePickerField';
import Link from 'next/link';
import WeddingEventTypeDropdown from '../components/WeddingEventTypeDropdown';
import ClientOnly from '../components/ClientOnly';
import SuppressHydration from '../components/SuppressHydration';
import { useRouter } from 'next/navigation';
import { useFormContext } from '../contexts/FormContext';

// SectionHeader component for consistent styling
const SectionHeader = ({ icon, label, color = 'text-blue-500' }) => (
  <h2 className="flex items-center gap-2 text-xl font-semibold mb-3" style={{ color: '#333' }}>
    {icon && <span className={`text-xl ${color}`}>{icon}</span>}
    {label}
  </h2>
);

// Add CSS for animation
const animationStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;

export default function WeddingAgendaForm() {
  // Get form context
  const { contractFormData, weddingAgendaData, updateWeddingAgendaData, updateContractFormData, isClient: contextIsClient } = useFormContext();
  
  const [eventType, setEventType] = useState('Wedding');
  const [basePrice, setBasePrice] = useState(1000);
  
  // Initial form data structure
  const initialFormData = {
    eventType: 'Wedding',
    brideName: '',
    groomName: '',
    weddingDate: '',
    email: '',
    phone: '',
    // Wedding party fields
    maidOfHonor: '',
    bestMan: '',
    bridesmaids: ['', '', ''],
    groomsmen: ['', '', ''],
    flowerGirl: '',
    ringBearer: '',
    // Existing fields
    entranceMusic: '',
    coupleEntranceSong: '',
    welcome: 'Yes',
    blessing: 'Yes',
    timeline: '',
    // Timeline events with times
    cocktailHourTime: '',
    grandEntranceTime: '',
    firstDanceTime: '',
    dinnerTime: '',
    toastsTime: '',
    parentDancesTime: '',
    cakeCuttingTime: '',
    openDancingTime: '',
    lastDanceTime: '',
    // Special dances
    firstDanceSong: '',
    firstDanceArtist: '',
    fatherDaughterSong: '',
    fatherDaughterArtist: '',
    motherSonSong: '',
    motherSonArtist: '',
    bouquetTossSong: '',
    bouquetTossArtist: '',
    gatherTossSong: '',
    gatherTossArtist: '',
    lastSong: '',
    lastSongArtist: '',
    // Additional details
    specialInstructions: '',
  };
  
  // Initialize form data with context data if available, and pre-fill from contract form
  const [formData, setFormData] = useState(() => {
    const mergedData = { ...initialFormData, ...weddingAgendaData };
    
    // Pre-fill from contract form data if available
    if (contractFormData.clientName && !mergedData.brideName && !mergedData.groomName) {
      // Try to split client name into bride/groom names
      const nameParts = contractFormData.clientName.split(' ');
      if (nameParts.length >= 2) {
        mergedData.brideName = nameParts[0];
        mergedData.groomName = nameParts.slice(1).join(' ');
      } else {
        mergedData.brideName = contractFormData.clientName;
      }
    }
    
    if (contractFormData.email && !mergedData.email) {
      mergedData.email = contractFormData.email;
    }
    
    if (contractFormData.contactPhone && !mergedData.phone) {
      mergedData.phone = contractFormData.contactPhone;
    }
    
    if (contractFormData.eventDate && !mergedData.weddingDate) {
      mergedData.weddingDate = contractFormData.eventDate;
    }
    
    return mergedData;
  });
  const [errors, setErrors] = useState({});
  const formRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Sync with contract form data whenever it changes
  useEffect(() => {
    if (contextIsClient && contractFormData && Object.keys(contractFormData).length > 0) {
      console.log('Wedding agenda syncing with contract form data:', contractFormData);
      
      setFormData(prev => {
        const updatedData = { ...prev };
        let hasChanges = false;
        
        // Sync client name to bride/groom names if they're empty
        if (contractFormData.clientName && (!prev.brideName || !prev.groomName)) {
          const nameParts = contractFormData.clientName.split(' ');
          if (nameParts.length >= 2) {
            if (!prev.brideName) {
              updatedData.brideName = nameParts[0];
              hasChanges = true;
            }
            if (!prev.groomName) {
              updatedData.groomName = nameParts.slice(1).join(' ');
              hasChanges = true;
            }
          } else if (!prev.brideName) {
            updatedData.brideName = contractFormData.clientName;
            hasChanges = true;
          }
        }
        
        // Sync email
        if (contractFormData.email && !prev.email) {
          updatedData.email = contractFormData.email;
          hasChanges = true;
        }
        
        // Sync phone
        if (contractFormData.contactPhone && !prev.phone) {
          updatedData.phone = contractFormData.contactPhone;
          hasChanges = true;
        }
        
        // Sync wedding date
        if (contractFormData.eventDate && !prev.weddingDate) {
          updatedData.weddingDate = contractFormData.eventDate;
          hasChanges = true;
        }
        
        // If we made changes, save to context
        if (hasChanges) {
          console.log('Wedding agenda updated with contract data:', updatedData);
          updateWeddingAgendaData(updatedData);
        }
        
        return hasChanges ? updatedData : prev;
      });
    }
  }, [contextIsClient, contractFormData, updateWeddingAgendaData]);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Convert time string like "7:30 PM" to minutes since midnight
  const convertToMinutes = useCallback((timeStr) => {
    if (!timeStr) return 0;
    
    const [timePart, ampm] = timeStr.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    
    const total = hour * 60 + minute;
    return total < 180 ? total + 1440 : total; // if before 3:00 AM, treat as after midnight
  }, []);

  // Sync eventType state with formData.eventType
  useEffect(() => {
    if (formData.eventType && typeof formData.eventType === 'string' && formData.eventType !== eventType) {
      setEventType(formData.eventType);
    }
  }, [formData.eventType, eventType]);

  // Set base price based on event type (Wedding = $1000.00)
  useEffect(() => {
    if (eventType && typeof eventType === 'string' && eventType.toLowerCase() === 'wedding') {
      setBasePrice(1000);
    } else {
      setBasePrice(400);
    }
  }, [eventType]);

  // Set document title
  useEffect(() => {
    document.title = "Wedding Agenda Form - DJ Bobby Drake";
    
    // Add meta viewport tag for mobile devices
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = "viewport";
    viewportMeta.content = "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes";
    document.getElementsByTagName('head')[0].appendChild(viewportMeta);
    
    // Debug console log
    console.log('Wedding Agenda Form mounted');
    
    return () => {
      document.title = "DJ Bobby Drake";
      if (document.querySelector('meta[name="viewport"]')) {
        document.querySelector('meta[name="viewport"]').remove();
      }
    };
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Save to context for persistence across navigation
      updateWeddingAgendaData(newData);
      
      // Also save directly to localStorage as backup
      try {
        localStorage.setItem('djWeddingAgendaData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving wedding agenda to localStorage:', error);
      }
      
      return newData;
    });
    
    // If event type is changing, update state
    if (name === 'eventType' && typeof value === 'string') {
      setEventType(value);
    }
    
    // Clear any errors for this field
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handler for wedding party array fields (bridesmaids, groomsmen)
  const handlePartyMemberChange = (group, index, value) => {
    setFormData(prev => {
      const updatedArray = [...prev[group]];
      updatedArray[index] = value;
      const newData = { ...prev, [group]: updatedArray };
      
      // Save to context for persistence across navigation
      updateWeddingAgendaData(newData);
      
      // Also save directly to localStorage as backup
      try {
        localStorage.setItem('djWeddingAgendaData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving wedding agenda to localStorage:', error);
      }
      
      return newData;
    });
  };

  // Add a new field to bridesmaids or groomsmen
  const addPartyMember = (group) => {
    setFormData(prev => {
      const newData = { 
        ...prev, 
        [group]: [...prev[group], ''] 
      };
      
      // Save to context for persistence across navigation
      updateWeddingAgendaData(newData);
      
      // Also save directly to localStorage as backup
      try {
        localStorage.setItem('djWeddingAgendaData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving wedding agenda to localStorage:', error);
      }
      
      return newData;
    });
  };

  // Remove a field from bridesmaids or groomsmen
  const removePartyMember = (group, index) => {
    setFormData(prev => {
      if (prev[group].length <= 3) return prev; // Keep at least 3 fields
      
      const updatedArray = [...prev[group]];
      updatedArray.splice(index, 1);
      const newData = { 
        ...prev, 
        [group]: updatedArray 
      };
      
      // Save to context for persistence across navigation
      updateWeddingAgendaData(newData);
      
      // Also save directly to localStorage as backup
      try {
        localStorage.setItem('djWeddingAgendaData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving wedding agenda to localStorage:', error);
      }
      
      return newData;
    });
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields - only the most essential ones
    if (!formData.brideName) newErrors.brideName = 'Required';
    if (!formData.groomName) newErrors.groomName = 'Required';
    if (!formData.weddingDate) newErrors.weddingDate = 'Required';
    
    // Contact info validation - make phone optional
    if (!formData.email) newErrors.email = 'Required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    // Phone is now optional - removed the requirement
    
    // Make entrance music optional
    if (formData.entranceMusic === undefined) formData.entranceMusic = '';
    
    // Very flexible timeline validation - just check that at least one timeline element is specified
    const hasAnyTimelineEvent = formData.cocktailHourTime || 
                               formData.grandEntranceTime || 
                               formData.firstDanceTime || 
                               formData.dinnerTime || 
                               formData.toastsTime ||
                               formData.parentDancesTime ||
                               formData.cakeCuttingTime ||
                               formData.openDancingTime ||
                               formData.lastDanceTime;
    
    // Make timeline optional too - only warn if completely empty
    if (!hasAnyTimelineEvent) {
      // Don't make this a hard error, just a warning
      console.log('Warning: No timeline events specified, but allowing submission');
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add to Firebase
      const docRef = await addDoc(collection(db, 'weddingAgendas'), { 
        ...formData, 
        basePrice,
        createdAt: serverTimestamp() 
      });
      
      // Send email notification
      await sendEmailNotification();
      
      // Show success and reset form
      setSubmitted(true);
      setIsSubmitting(false);
      toast.success('Wedding agenda submitted successfully!');
    } catch (error) {
      console.error('Error submitting agenda:', error);
      setIsSubmitting(false);
      toast.error('Error submitting agenda. Please try again.');
    }
  };

  const sendEmailNotification = async () => {
    try {
      // Format the bridesmaids and groomsmen arrays to strings
      const bridesmaidsList = formData.bridesmaids.filter(item => item.trim() !== '').join('\n');
      const groomsmenList = formData.groomsmen.filter(item => item.trim() !== '').join('\n');
      
      // Combine timeline events into a formatted string
      const timelineText = [
        formData.cocktailHourTime ? `${formData.cocktailHourTime} - Cocktail Hour` : '',
        formData.grandEntranceTime ? `${formData.grandEntranceTime} - Grand Entrance` : '',
        formData.firstDanceTime ? `${formData.firstDanceTime} - First Dance` : '',
        formData.dinnerTime ? `${formData.dinnerTime} - Dinner Served` : '',
        formData.toastsTime ? `${formData.toastsTime} - Toasts` : '',
        formData.parentDancesTime ? `${formData.parentDancesTime} - Parent Dances` : '',
        formData.cakeCuttingTime ? `${formData.cakeCuttingTime} - Cake Cutting` : '',
        formData.openDancingTime ? `${formData.openDancingTime} - Open Dancing` : '',
        formData.lastDanceTime ? `${formData.lastDanceTime} - Last Dance` : '',
      ].filter(Boolean).join('\n');

      const response = await fetch('/api/send-wedding-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          bridesmaids: bridesmaidsList,
          groomsmen: groomsmenList,
          timeline: timelineText, // Use the formatted timeline
          basePrice
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      eventType: 'Wedding',
      brideName: '',
      groomName: '',
      weddingDate: '',
      email: '',
      phone: '',
      // Wedding party fields
      maidOfHonor: '',
      bestMan: '',
      bridesmaids: ['', '', ''],
      groomsmen: ['', '', ''],
      flowerGirl: '',
      ringBearer: '',
      // Rest of the fields
      entranceMusic: '',
      coupleEntranceSong: '',
      welcome: 'Yes',
      blessing: 'Yes',
      timeline: '',
      // Reset timeline events with times
      cocktailHourTime: '',
      grandEntranceTime: '',
      firstDanceTime: '',
      dinnerTime: '',
      toastsTime: '',
      parentDancesTime: '',
      cakeCuttingTime: '',
      openDancingTime: '',
      lastDanceTime: '',
      // Reset special dances
      firstDanceSong: '',
      firstDanceArtist: '',
      fatherDaughterSong: '',
      fatherDaughterArtist: '',
      motherSonSong: '',
      motherSonArtist: '',
      bouquetTossSong: '',
      bouquetTossArtist: '',
      gatherTossSong: '',
      gatherTossArtist: '',
      lastSong: '',
      lastSongArtist: '',
      // Reset additional details
      specialInstructions: ''
    });
    setErrors({});
    setSubmitted(false);
  };

  // Function to produce time slots that are chronologically valid
  const getValidTimeOptions = (currentField) => {
    const fields = [
      'cocktailHourTime',
      'grandEntranceTime',
      'firstDanceTime',
      'dinnerTime',
      'toastsTime',
      'parentDancesTime',
      'cakeCuttingTime',
      'openDancingTime',
      'lastDanceTime'
    ];
    
    // Find the current field index
    const currentIndex = fields.indexOf(currentField);
    
    // Get the field before
    const prevField = currentIndex > 0 ? fields[currentIndex - 1] : null;
    // Get the field after 
    const nextField = currentIndex < fields.length - 1 ? fields[currentIndex + 1] : null;
    
    // Get times from prev and next fields
    const prevTime = prevField ? formData[prevField] : null;
    const nextTime = nextField ? formData[nextField] : null;
    
    // If no constraints, return all options
    if (!prevTime && !nextTime) return timeOptions;
    
    // Filter based on constraints
    return timeOptions.filter(time => {
      const timeMinutes = convertToMinutes(time);
      
      // Check if time is after previous field
      const isAfterPrev = !prevTime || timeMinutes >= convertToMinutes(prevTime);
      
      // Check if time is before next field
      const isBeforeNext = !nextTime || timeMinutes <= convertToMinutes(nextTime);
      
      return isAfterPrev && isBeforeNext;
    });
  };

  if (submitted) {
    return (
      <ClientOnly>
        <SuppressHydration>
          <div className="min-h-screen p-6 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <div className="text-center mb-6">
                <Image 
                  src="/wedding-agenda-logo.png" 
                  alt="Wedding Agenda Logo" 
                  width={80} 
                  height={80} 
                  className="mx-auto mb-4 rounded-full"
                  unoptimized
                  priority
                />
                <h1 className="text-2xl font-bold text-indigo-600">Success!</h1>
                <p className="text-gray-600 mt-2">Your wedding agenda has been submitted.</p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaCheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      We&apos;ve received your wedding agenda details. You&apos;ll receive a confirmation email shortly.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="mx-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaArrowLeft className="mr-2 -ml-1 h-4 w-4" />
                  Return Home
                </Link>
                <button
                  onClick={resetForm}
                  className="mx-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Another
                </button>
              </div>
            </div>
            <ToastContainer />
          </div>
        </SuppressHydration>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <SuppressHydration>
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
          <style jsx global>{`
            ${animationStyles}
            
            body {
              background: url('/dj-background-new.jpg') !important;
              background-size: cover !important;
              background-position: center !important;
              background-repeat: no-repeat !important;
              background-attachment: fixed !important;
              min-height: 100vh;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Mobile-specific background fix */
            @media (max-width: 768px) {
              body {
                background-attachment: scroll !important;
              }
              
              .mobile-background-fix {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/dj-background-new.jpg') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                z-index: -1;
              }
              
              /* Improved touch targets for mobile */
              input, select, button, textarea {
                min-height: 44px;
                font-size: 16px !important;
                -webkit-appearance: none;
                appearance: none;
              }
              
              /* Better spacing for mobile form elements */
              .grid {
                gap: 1.25rem !important;
              }
              
              /* Ensure buttons are easier to tap */
              button[type="submit"] {
                padding: 0.875rem 1.5rem !important;
                min-height: 52px !important;
              }
              
              /* Improve form section spacing on mobile */
              .section-header {
                margin-top: 2.5rem !important;
              }
              
              /* Make sure select arrows are visible */
              select {
                background-position: right 12px center !important;
                background-size: 12px !important;
                padding-right: 35px !important;
              }
            }
            
            /* Fix for iOS button hover states */
            @media (hover: none) {
              button:hover {
                background-color: initial !important;
              }
              
              button[type="submit"]:hover {
                background-color: #1a73e8 !important;
              }
            }
            
            /* iOS-specific background fix */
            @supports (-webkit-touch-callout: none) {
              body {
                background-attachment: scroll !important;
              }
              
              .ios-background-fix {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('/dj-background-new.jpg') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                z-index: -1;
              }
              
              /* Prevent zoom on iOS input focus */
              input, select, textarea {
                font-size: 16px !important;
                -webkit-appearance: none;
                appearance: none;
                border-radius: 8px !important;
              }
              
              /* Fix iOS scrolling issues */
              .min-h-screen {
                min-height: -webkit-fill-available;
              }
            }
          `}</style>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
          </Head>
          
          {/* Mobile background fix element */}
          <div className="mobile-background-fix"></div>
          
          {/* iOS background fix element */}
          <div className="ios-background-fix"></div>
          
          {/* Main form container */}
          <div className="max-w-4xl mx-auto">
            <div style={{ 
              maxWidth: '800px',
              width: '96%',
              margin: '2rem auto 3rem auto'
            }}>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" id="wedding-form" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                padding: isMobile ? '1.5rem' : '2.5rem',
                borderRadius: '20px',
                width: '100%',
                marginBottom: '50px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
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
                    width: isMobile ? '120px' : '150px',
                    height: isMobile ? '120px' : '150px',
                    margin: '0 auto 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Image
                      src="/wedding-agenda-logo.png"
                      alt="Wedding Agenda Logo"
                      width={isMobile ? 120 : 150}
                      height={isMobile ? 120 : 150}
                      priority
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
                    flexWrap: 'nowrap'
                  }}>
                    <span style={{ 
                      fontSize: 'clamp(28px, 4vw, 36px)'
                    }}>📝</span>
                    <span>WEDDING AGENDA</span>
                  </h1>
                </div>
                
                {/* Spacer div */}
                <div style={{ 
                  height: '20px', 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #e0e0e0',
                  opacity: 0.5
                }} className="section-divider"></div>
                
                {/* Event Type and Wedding Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Type */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <FaMusic className="text-purple-500 mr-3" style={{ marginRight: '10px' }} /> Event Type
                      </span>
                    </label>
                    <WeddingEventTypeDropdown
                      value={formData.eventType}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, eventType: value }));
                        setEventType(value);
                      }}
                      onPriceUpdate={setBasePrice}
                      name="eventType"
                    />
                  </div>
                  
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
                        <FaCalendarAlt className="text-blue-500 mr-3" style={{ marginRight: '10px' }} /> Wedding Date *
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
                    />
                  </div>
                </div>

                {/* Section Header - Contact Information */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaAddressCard className="text-blue-500 mr-3" style={{ marginRight: '10px' }} /> Contact Information
                  </h3>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <FaEnvelope className="text-blue-500 mr-3" style={{ marginRight: '10px' }} /> Email *
                      </span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <FaPhone className="text-green-500 mr-3" style={{ marginRight: '10px' }} /> Phone *
                      </span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="(123) 456-7890"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                {/* Section Header - Couple Information */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaUserFriends className="text-green-500 mr-3" style={{ marginRight: '10px' }} /> Couple Information
                  </h3>
                </div>

                {/* Couple Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Bride&apos;s Name *
                      </span>
                    </label>
                    <input
                      id="brideName"
                      type="text"
                      name="brideName"
                      value={formData.brideName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: errors.brideName ? '1px solid #ef4444' : '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Enter bride's name"
                    />
                    {errors.brideName && <p className="mt-1 text-xs text-red-500">{errors.brideName}</p>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Groom&apos;s Name *
                      </span>
                    </label>
                    <input
                      id="groomName"
                      type="text"
                      name="groomName"
                      value={formData.groomName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: errors.groomName ? '1px solid #ef4444' : '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Enter groom's name"
                    />
                    {errors.groomName && <p className="mt-1 text-xs text-red-500">{errors.groomName}</p>}
                  </div>
                </div>

                {/* Section Header - Wedding Party */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaUserFriends className="text-pink-500 mr-3" style={{ marginRight: '10px' }} /> Wedding Party
                  </h3>
                </div>
               
                {/* Maid of Honor and Best Man */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Maid of Honor
                      </span>
                    </label>
                    <input
                      id="maidOfHonor"
                      type="text"
                      name="maidOfHonor"
                      value={formData.maidOfHonor}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Enter maid of honor's name"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Best Man
                      </span>
                    </label>
                    <input
                      id="bestMan"
                      type="text"
                      name="bestMan"
                      value={formData.bestMan}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Enter best man's name"
                    />
                  </div>
                </div>

                {/* Bridesmaids and Groomsmen */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: isMobile ? '2.5rem' : '3.5rem',
                  marginTop: '2rem',
                  marginBottom: '2.5rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: isMobile ? '1rem' : '1.2rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Bridesmaids
                      </span>
                    </label>
                    <div className="space-y-10">
                      {formData.bridesmaids.map((bridesmaid, index) => (
                        <div key={`bridesmaid-${index}`} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                          <input
                            type="text"
                            value={bridesmaid}
                            onChange={(e) => handlePartyMemberChange('bridesmaids', index, e.target.value)}
                            style={{
                              width: '100%',
                              padding: 'clamp(12px, 2vw, 16px)',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
                              backgroundColor: 'white',
                              marginBottom: '8px',
                              minHeight: isMobile ? '44px' : 'auto'
                            }}
                            placeholder={`Bridesmaid #${index + 1}`}
                          />
                          {index >= 3 && (
                            <div className="flex justify-end items-center" style={{ marginLeft: '2px' }}>
                              <button 
                                type="button"
                                onClick={() => removePartyMember('bridesmaids', index)}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '0',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  marginRight: '4px',
                                  width: '14px'
                                }}
                                aria-label="Remove bridesmaid"
                              >
                                -
                              </button>
                              <span className="text-sm text-gray-600" style={{ lineHeight: '1' }}>Remove</span>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="mt-4 flex items-center" style={{ marginLeft: '2px' }}>
                        <button 
                          type="button"
                          onClick={() => addPartyMember('bridesmaids')}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#4F46E5',
                            border: 'none',
                            padding: '0',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginRight: '4px',
                            width: '14px'
                          }}
                          aria-label="Add bridesmaid"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-600" style={{ lineHeight: '1' }}>Add bridesmaid</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">List bridesmaids in order of entrance</p>
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: isMobile ? '1rem' : '1.2rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Groomsmen
                      </span>
                    </label>
                    <div className="space-y-10">
                      {formData.groomsmen.map((groomsman, index) => (
                        <div key={`groomsman-${index}`} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                          <input
                            type="text"
                            value={groomsman}
                            onChange={(e) => handlePartyMemberChange('groomsmen', index, e.target.value)}
                            style={{
                              width: '100%',
                              padding: 'clamp(12px, 2vw, 16px)',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
                              backgroundColor: 'white',
                              marginBottom: '8px',
                              minHeight: isMobile ? '44px' : 'auto'
                            }}
                            placeholder={`Groomsman #${index + 1}`}
                          />
                          {index >= 3 && (
                            <div className="flex justify-end items-center" style={{ marginLeft: '2px' }}>
                              <button 
                                type="button"
                                onClick={() => removePartyMember('groomsmen', index)}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '0',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  marginRight: '4px',
                                  width: '14px'
                                }}
                                aria-label="Remove groomsman"
                              >
                                -
                              </button>
                              <span className="text-sm text-gray-600" style={{ lineHeight: '1' }}>Remove</span>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="mt-4 flex items-center" style={{ marginLeft: '2px' }}>
                        <button 
                          type="button"
                          onClick={() => addPartyMember('groomsmen')}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#4F46E5',
                            border: 'none',
                            padding: '0',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginRight: '4px',
                            width: '14px'
                          }}
                          aria-label="Add groomsman"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-600" style={{ lineHeight: '1' }}>Add groomsman</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">List groomsmen in order of entrance</p>
                    </div>
                  </div>
                </div>

                {/* Flower Girl and Ring Bearer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Flower Girl
                      </span>
                    </label>
                    <input
                      id="flowerGirl"
                      type="text"
                      name="flowerGirl"
                      value={formData.flowerGirl}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Enter flower girl's name (if applicable)"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Ring Bearer
                      </span>
                    </label>
                    <input
                      id="ringBearer"
                      type="text"
                      name="ringBearer"
                      value={formData.ringBearer}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Enter ring bearer's name (if applicable)"
                    />
                  </div>
                </div>

                {/* Section Header - Entrance Music */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaMusic className="text-red-500 mr-3" style={{ marginRight: '10px' }} /> Entrance Music
                  </h3>
                </div>

                {/* Entrance Music */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Wedding Party Entrance Music *
                      </span>
                    </label>
                    <input
                      id="entranceMusic"
                      type="text"
                      name="entranceMusic"
                      value={formData.entranceMusic}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Song title and artist"
                    />
                    {errors.entranceMusic && <p className="mt-1 text-xs text-red-500">{errors.entranceMusic}</p>}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Bride & Groom Entrance Song
                      </span>
                    </label>
                    <input
                      id="coupleEntranceSong"
                      type="text"
                      name="coupleEntranceSong"
                      value={formData.coupleEntranceSong}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                      placeholder="Song title and artist (if different)"
                    />
                  </div>
                </div>

                {/* Section Header - Welcome and Blessing */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaPray className="text-teal-500 mr-3" style={{ marginRight: '10px' }} /> Welcome and Blessing
                  </h3>
                </div>

                {/* Welcome and Blessing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Will a Welcome Be Offered? *
                      </span>
                    </label>
                    <select
                      name="welcome"
                      value={formData.welcome}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Will a Blessing Be Offered? *
                      </span>
                    </label>
                    <select
                      name="blessing"
                      value={formData.blessing}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem'
                      }}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Section Header - Reception Timeline */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaClipboardList className="text-blue-500 mr-3" style={{ marginRight: '10px' }} /> Reception Timeline
                  </h3>
                </div>

                {/* Reception Timeline Description */}
                <div style={{
                  marginBottom: '1.5rem',
                  color: '#555',
                  fontSize: 'clamp(14px, 2vw, 16px)',
                  lineHeight: '1.5'
                }}>
                  Please select appropriate times for the key events during your reception.
                  These times help us plan the flow of your event.
                </div>
                
                {/* Reception Timeline - First Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Cocktail Hour
                      </span>
                    </label>
                    <select
                      name="cocktailHourTime"
                      value={formData.cocktailHourTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: isMobile ? '1.5rem' : '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500',
                        minHeight: isMobile ? '44px' : 'auto'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('cocktailHourTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Grand Entrance
                      </span>
                    </label>
                    <select
                      name="grandEntranceTime"
                      value={formData.grandEntranceTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('grandEntranceTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        First Dance
                      </span>
                    </label>
                    <select
                      name="firstDanceTime"
                      value={formData.firstDanceTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('firstDanceTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Reception Timeline - Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Dinner Served
                      </span>
                    </label>
                    <select
                      name="dinnerTime"
                      value={formData.dinnerTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('dinnerTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Toasts
                      </span>
                    </label>
                    <select
                      name="toastsTime"
                      value={formData.toastsTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('toastsTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Parent Dances
                      </span>
                    </label>
                    <select
                      name="parentDancesTime"
                      value={formData.parentDancesTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('parentDancesTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reception Timeline - Third Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Cake Cutting
                      </span>
                    </label>
                    <select
                      name="cakeCuttingTime"
                      value={formData.cakeCuttingTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('cakeCuttingTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Open Dancing
                      </span>
                    </label>
                    <select
                      name="openDancingTime"
                      value={formData.openDancingTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('openDancingTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Last Dance
                      </span>
                    </label>
                    <select
                      name="lastDanceTime"
                      value={formData.lastDanceTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 14px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(15px, 2vw, 16px)',
                        backgroundColor: 'white',
                        marginBottom: '1rem',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        paddingRight: '30px',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">Select time</option>
                      {getValidTimeOptions('lastDanceTime').map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {errors.timeline && (
                  <div className="mt-2 mb-4">
                    <p className="text-red-500 text-sm">{errors.timeline}</p>
                  </div>
                )}

                {/* Section Header - Special Dances */}
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
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    padding: '0 1rem 0.5rem 0',
                    position: 'relative',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaMusic className="text-green-500 mr-3" style={{ marginRight: '10px' }} /> Special Dances
                  </h3>
                </div>
                
                {/* Special Dances Description */}
                <div style={{
                  marginBottom: '3rem',
                  color: '#555',
                  fontSize: 'clamp(14px, 2vw, 16px)',
                  lineHeight: '1.5'
                }}>
                  Please provide song selections for special moments. These are optional but recommended.
                </div>
                
                {/* Special Dances - First Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        First Dance
                      </span>
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="firstDanceSong"
                        value={formData.firstDanceSong}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          marginBottom: '1.2rem',
                          minHeight: isMobile ? '44px' : 'auto'
                        }}
                        placeholder="Song title"
                      />
                      <input
                        type="text"
                        name="firstDanceArtist"
                        value={formData.firstDanceArtist || ""}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          minHeight: isMobile ? '44px' : 'auto'
                        }}
                        placeholder="Artist"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Father/Daughter Dance
                      </span>
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="fatherDaughterSong"
                        value={formData.fatherDaughterSong}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          marginBottom: '1.2rem'
                        }}
                        placeholder="Song title"
                      />
                      <input
                        type="text"
                        name="fatherDaughterArtist"
                        value={formData.fatherDaughterArtist || ""}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white'
                        }}
                        placeholder="Artist"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Dances - Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Mother/Son Dance
                      </span>
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="motherSonSong"
                        value={formData.motherSonSong}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          marginBottom: '1.2rem'
                        }}
                        placeholder="Song title"
                      />
                      <input
                        type="text"
                        name="motherSonArtist"
                        value={formData.motherSonArtist || ""}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white'
                        }}
                        placeholder="Artist"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Bouquet Toss
                      </span>
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="bouquetTossSong"
                        value={formData.bouquetTossSong}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          marginBottom: '1.2rem'
                        }}
                        placeholder="Song title"
                      />
                      <input
                        type="text"
                        name="bouquetTossArtist"
                        value={formData.bouquetTossArtist || ""}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white'
                        }}
                        placeholder="Artist"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Dances - Third Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Garter Toss
                      </span>
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="gatherTossSong"
                        value={formData.gatherTossSong}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          marginBottom: '1.2rem'
                        }}
                        placeholder="Song title"
                      />
                      <input
                        type="text"
                        name="gatherTossArtist"
                        value={formData.gatherTossArtist || ""}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white'
                        }}
                        placeholder="Artist"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Last Dance
                      </span>
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="lastSong"
                        value={formData.lastSong}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white',
                          marginBottom: '1.2rem'
                        }}
                        placeholder="Song title"
                      />
                      <input
                        type="text"
                        name="lastSongArtist"
                        value={formData.lastSongArtist || ""}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: 'clamp(12px, 2vw, 16px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          fontSize: 'clamp(16px, 2.5vw, 18px)',
                          backgroundColor: 'white'
                        }}
                        placeholder="Artist"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="form-section" style={{ marginTop: '2rem' }}>
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
                      backgroundColor: 'transparent',
                      display: 'inline-block',
                      padding: '0 1rem 0.5rem 0',
                      position: 'relative',
                      marginBottom: '0',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <FaFileAlt className="text-yellow-500 mr-3" style={{ marginRight: '10px' }} /> Additional Information
                    </h3>
                  </div>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '10px',
                    border: '1px solid #e5e5e5',
                    marginBottom: '2rem'
                  }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}>
                      Special Instructions
                    </label>
                    <textarea
                      id="specialInstructions"
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: 'clamp(16px, 2.5vw, 18px)',
                        minHeight: '120px',
                        lineHeight: '1.5',
                        resize: 'vertical'
                      }}
                      placeholder="Anything else we should know about your event"
                      rows="4"
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button - positioned with better spacing */}
                <div className="mt-12 mb-10 text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-16 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 text-lg mx-auto inline-block"
                    style={{
                      border: 'none',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      minWidth: isMobile ? '260px' : '300px',
                      minHeight: isMobile ? '52px' : 'auto'
                    }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Wedding Agenda'
                    )}
                  </button>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    Your information helps us prepare for your special day
                  </div>
                  
                  {/* Back to Contract button - Bottom */}
                  <div className="mt-6">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push('/');
                      }}
                      className="px-10 py-2.5 text-white font-medium rounded-full hover:bg-blue-700 focus:outline-none transition-all duration-200 text-base mx-auto inline-flex items-center justify-center"
                      style={{
                        border: 'none',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        minWidth: isMobile ? '180px' : '200px',
                        minHeight: isMobile ? '44px' : 'auto',
                        letterSpacing: '0.3px',
                        backgroundColor: '#1a73e8'
                      }}
                    >
                      <FaArrowLeft className="mr-3" style={{ fontSize: '14px' }} />
                      Back to Contract
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <ToastContainer position={isMobile ? "bottom-center" : "bottom-right"} autoClose={5000} />
        </div>
      </SuppressHydration>
    </ClientOnly>
  );
} 