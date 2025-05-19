'use client';

import { useState, useEffect, useRef } from 'react';
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
  FaCheckCircle
} from 'react-icons/fa';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';

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
  const [isOpen, setIsOpen] = useState(false);
  const [eventType, setEventType] = useState('Wedding');
  const [basePrice, setBasePrice] = useState(1000);
  const [formData, setFormData] = useState({
    eventType: 'Wedding',
    brideName: '',
    groomName: '',
    weddingDate: '',
    email: '',
    phone: '',
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
    fatherDaughterSong: '',
    motherSonSong: '',
    bouquetTossSong: '',
    gatherTossSong: '',
    lastSong: '',
    // Additional details
    specialInstructions: '',
  });
  const [errors, setErrors] = useState({});
  const formRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Set base price based on event type (Wedding = $1000.00)
  useEffect(() => {
    if (eventType.toLowerCase() === 'wedding') {
      setBasePrice(1000);
    } else {
      setBasePrice(400);
    }
  }, [eventType]);

  // Set document title
  useEffect(() => {
    document.title = "Wedding Agenda Form - DJ Bobby Drake";
    return () => {
      document.title = "DJ Bobby Drake";
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // If event type is changing, update state
    if (name === 'eventType') {
      setEventType(value);
    }
    
    // Clear any errors for this field
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.brideName) newErrors.brideName = 'Required';
    if (!formData.groomName) newErrors.groomName = 'Required';
    if (!formData.weddingDate) newErrors.weddingDate = 'Required';
    if (!formData.email) newErrors.email = 'Required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone) newErrors.phone = 'Required';
    if (!formData.entranceMusic) newErrors.entranceMusic = 'Required';
    
    // Require at least one timeline event with time
    if (!formData.cocktailHourTime && 
        !formData.grandEntranceTime && 
        !formData.firstDanceTime && 
        !formData.dinnerTime && 
        !formData.toastsTime && 
        !formData.parentDancesTime && 
        !formData.cakeCuttingTime && 
        !formData.openDancingTime) {
      newErrors.timeline = 'At least one timeline event is required';
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
      firstDanceSong: '',
      fatherDaughterSong: '',
      motherSonSong: '',
      bouquetTossSong: '',
      gatherTossSong: '',
      lastSong: '',
      specialInstructions: '',
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="main-wrapper" style={{ 
        width: '100%', 
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        paddingBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          minHeight: '100vh'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '800px',
            width: '100%',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f0fdf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem'
              }}>
                <FaCheckCircle size={40} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                margin: 0,
                color: '#111827'
              }}>
                Wedding Agenda Submitted!
              </h2>
            </div>
            
            <p style={{
              fontSize: '1.1rem',
              color: '#4b5563',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Thank you for submitting your wedding agenda. We&apos;ll be in touch soon to discuss the details and make sure your special day is perfect.
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Return to Home
              </button>
              
              <button
                onClick={resetForm}
                style={{
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  border: '2px solid #3b82f6',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaFileAlt /> Submit Another Agenda
              </button>
            </div>
            
            <div style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '2rem'
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
      </div>
    );
  }

  return (
    <div className="main-wrapper" style={{ 
      width: '100%', 
      position: 'relative',
      minHeight: '100vh',
      overflowX: 'hidden',
      paddingBottom: '2rem'
    }}>
      <ToastContainer position="top-center" autoClose={5000} />
      
      {/* Add styles for animation */}
      <style jsx global>{animationStyles}</style>
      
      {/* Mobile Swipe Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-blue-500 text-white shadow-md md:hidden"
        aria-label={isOpen ? "Close form" : "Open form"}
      >
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {/* Main Form */}
      <div style={{
        display: 'flex', 
        justifyContent: 'center',
        width: '100%',
        overflow: 'visible',
        minHeight: '100vh'
      }}>
        <div style={{ 
          maxWidth: '800px',
          width: '96%',
          margin: '2rem auto 3rem auto'
        }}>
          {/* Back to Home Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: '500',
                fontSize: '0.875rem',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                color: '#3b82f6',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <FaArrowLeft /> Back to Home
            </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
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
                flexWrap: 'wrap',
                textAlign: 'center'
              }}>
                <span>Wedding Reception Agenda</span>
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 3vw, 16px)',
                color: '#4b5563',
                margin: '10px auto 0',
                maxWidth: '550px',
                lineHeight: '1.5'
              }}>
                Please fill out this form with details for your wedding reception agenda. This helps us plan the perfect music and flow for your special day.
              </p>
            </div>

            {/* Wedding Information Section */}
            <div style={{
              marginBottom: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1.5rem',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.75rem'
              }}>
                <FaUser /> Wedding Information
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Event Type
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Other">Other Event</option>
                  </select>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  padding: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4b5563' }}>Base Price:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#047857', marginLeft: '0.5rem' }}>${basePrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Bride&apos;s Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="brideName"
                    value={formData.brideName}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.brideName ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Bride&apos;s full name"
                  />
                  {errors.brideName && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.brideName}</p>}
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Groom&apos;s Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="groomName"
                    value={formData.groomName}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.groomName ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Groom&apos;s full name"
                  />
                  {errors.groomName && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.groomName}</p>}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#4b5563'
                }}>
                  Date of Wedding <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  name="weddingDate"
                  value={formData.weddingDate}
                  onChange={handleChange}
                  type="date"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.weddingDate ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                />
                {errors.weddingDate && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.weddingDate}</p>}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Phone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="(123) 456-7890"
                  />
                  {errors.phone && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.phone}</p>}
                </div>
              </div>
            </div>
            
            {/* Reception Entrance */}
            <div style={{
              marginBottom: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1.5rem',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.75rem'
              }}>
                <FaMusic /> Reception Entrance
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#4b5563'
                }}>
                  Wedding Party Entrance Music <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="entranceMusic"
                  value={formData.entranceMusic}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.entranceMusic ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="e.g., 'Uptown Funk' by Bruno Mars for the wedding party entrance"
                ></textarea>
                {errors.entranceMusic && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.entranceMusic}</p>}
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#4b5563'
                }}>
                  Bride & Groom Entrance Song
                </label>
                <input
                  name="coupleEntranceSong"
                  value={formData.coupleEntranceSong}
                  onChange={handleChange}
                  type="text"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  placeholder="Optional: Leave blank to use DJ&apos;s judgment"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Will a Welcome Be Offered?
                  </label>
                  <select
                    name="welcome"
                    value={formData.welcome}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Will a Blessing Be Offered?
                  </label>
                  <select
                    name="blessing"
                    value={formData.blessing}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Reception Timeline */}
            <div style={{
              marginBottom: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1.5rem',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.75rem'
              }}>
                <FaClock /> Reception Timeline
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#4b5563'
                }}>
                  Please enter the times for each event in your reception timeline. Times should be in format like &quot;6:00 PM&quot;.
                  {errors.timeline && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>{errors.timeline}</span>}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Cocktail Hour
                    </label>
                    <input
                      name="cocktailHourTime"
                      value={formData.cocktailHourTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 6:00 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Grand Entrance
                    </label>
                    <input
                      name="grandEntranceTime"
                      value={formData.grandEntranceTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 6:30 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      First Dance
                    </label>
                    <input
                      name="firstDanceTime"
                      value={formData.firstDanceTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 6:45 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Dinner Served
                    </label>
                    <input
                      name="dinnerTime"
                      value={formData.dinnerTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 7:00 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Toasts
                    </label>
                    <input
                      name="toastsTime"
                      value={formData.toastsTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 7:30 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Parent Dances
                    </label>
                    <input
                      name="parentDancesTime"
                      value={formData.parentDancesTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 8:00 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Cake Cutting
                    </label>
                    <input
                      name="cakeCuttingTime"
                      value={formData.cakeCuttingTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 8:30 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Open Dancing
                    </label>
                    <input
                      name="openDancingTime"
                      value={formData.openDancingTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 9:00 PM"
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Last Dance
                    </label>
                    <input
                      name="lastDanceTime"
                      value={formData.lastDanceTime}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder="e.g., 11:00 PM"
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Additional Timeline Notes
                  </label>
                  <textarea
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="Any additional timeline events or special notes about the schedule"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Special Dances */}
            <div style={{
              marginBottom: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1.5rem',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.75rem'
              }}>
                <FaMusic /> Special Dances
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    First Dance Song
                  </label>
                  <input
                    name="firstDanceSong"
                    value={formData.firstDanceSong}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Song title and artist"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Father/Daughter Dance Song
                  </label>
                  <input
                    name="fatherDaughterSong"
                    value={formData.fatherDaughterSong}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Song title and artist"
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Mother/Son Dance Song
                  </label>
                  <input
                    name="motherSonSong"
                    value={formData.motherSonSong}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Song title and artist"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Bouquet Toss Song
                  </label>
                  <input
                    name="bouquetTossSong"
                    value={formData.bouquetTossSong}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Song title and artist"
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Garter Toss Song
                  </label>
                  <input
                    name="gatherTossSong"
                    value={formData.gatherTossSong}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Song title and artist"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    Last Dance Song
                  </label>
                  <input
                    name="lastSong"
                    value={formData.lastSong}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    placeholder="Song title and artist"
                  />
                </div>
              </div>
            </div>
            
            {/* Special Instructions */}
            <div style={{
              marginBottom: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1.5rem',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.75rem'
              }}>
                <FaFileAlt /> Additional Information
              </h2>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#4b5563'
                }}>
                  Special Instructions or Requests
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    minHeight: '140px',
                    resize: 'vertical'
                  }}
                  placeholder="Any additional details, requests, or information we should know"
                ></textarea>
              </div>
            </div>
            
            {/* Submit Button */}
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => window.location.href = '/'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    borderRadius: '0.375rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minWidth: '120px'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.375rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minWidth: '180px',
                    opacity: isSubmitting ? '0.7' : '1',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Wedding Agenda'
                  )}
                </button>
              </div>
              
              <div style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                textAlign: 'center',
                marginTop: '1rem'
              }}>
                <p>
                  By submitting this form, you agree to our{' '}
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/terms', '_blank');
                    }}
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                  >
                    Terms and Conditions
                  </a>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Overlay when open on mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '30',
            display: 'block'
          }}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
} 