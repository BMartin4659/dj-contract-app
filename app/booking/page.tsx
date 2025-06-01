'use client';

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { DjEvent, EVENT_STATUSES } from "@/types/events";
import { checkForConflicts } from "@/lib/calendarSync";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { HiCalendar, HiClock, HiUser, HiEnvelope, HiPhone, HiBuildingOffice2, HiMapPin, HiUserGroup, HiCheck, HiXMark } from "react-icons/hi2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import CustomDatePicker from '@/app/components/CustomDatePicker';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [existingEvents, setExistingEvents] = useState<DjEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [hasConflict, setHasConflict] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    eventDate: '',
    startTime: '18:00',
    endTime: '22:00',
    eventType: '',
    venueName: '',
    venueLocation: '',
    numberOfGuests: 0,
    notes: '',
  });

  // Initialize - fetch events to check availability
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "djContracts"));
        const eventsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            eventDate: data.eventDate,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status
          } as DjEvent;
        });
        
        // Only consider events that are not cancelled
        const activeEvents = eventsData.filter(event => 
          event.status !== 'cancelled'
        );
        
        setExistingEvents(activeEvents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load availability data");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Check for conflicts when date or time changes
  useEffect(() => {
    if (formData.eventDate && formData.startTime && formData.endTime) {
      const conflict = checkForConflicts(
        formData.eventDate,
        formData.startTime,
        formData.endTime,
        existingEvents
      );
      
      setHasConflict(conflict);
    }
  }, [formData.eventDate, formData.startTime, formData.endTime, existingEvents]);

  // Add effect to handle event type changes and ensure the UI updates properly
  useEffect(() => {
    console.log("Event type changed to:", formData.eventType);
    
    // Register event listener for custom event
    const handleEventTypeProcessed = () => {
      console.log("Event type processing complete, refreshing UI elements");
      
      // Manually force input fields to refresh
      refreshFormElements();
    };
    
    window.addEventListener('eventTypeProcessed', handleEventTypeProcessed);
    
    return () => {
      window.removeEventListener('eventTypeProcessed', handleEventTypeProcessed);
    };
  }, [formData.eventType]);
  
  // Function to refresh form elements to ensure they remain interactive
  const refreshFormElements = () => {
    // Find all form elements that might need refreshing
    const formElements = document.querySelectorAll('input, select, button, .service-card');
    
    formElements.forEach(element => {
      // Force a refresh by manipulating the element
      if (element instanceof HTMLElement) {
        const currentDisplay = element.style.display;
        element.style.display = 'none';
        // This forces a reflow
        void element.offsetHeight;
        element.style.display = currentDisplay;
      }
    });
    
    console.log("Refreshed all form elements");
  };

  // Add keyboard event handlers
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        document.body.classList.add('keyboard-open');
      }
    };

    const handleBlur = () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('keyboard-open');
      }
    };

    // Add event listeners to date/time inputs
    const inputs = document.querySelectorAll('.fixed-position-input');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });

    // Cleanup
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  // Event type change handler with specific focus on maintaining interactivity
  const handleEventTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Log for debugging
    console.log(`Event type changed to: ${value}`);
    
    // Force a re-render to ensure all components update properly
    setTimeout(() => {
      // This will help ensure the UI updates after the event type change
      const event = new Event('eventTypeUpdated');
      window.dispatchEvent(event);
    }, 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Use special handler for event type to ensure proper updates
    if (name === 'eventType') {
      handleEventTypeChange(e as React.ChangeEvent<HTMLSelectElement>);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      eventDate: date
    }));
  };

  const handleNextStep = () => {
    // Validate the current step
    if (step === 1) {
      if (!formData.eventDate || !formData.startTime || !formData.endTime) {
        toast.error("Please select a date and time");
        return;
      }
      
      if (hasConflict) {
        toast.error("This date and time is already booked");
        return;
      }
    } else if (step === 2) {
      if (!formData.clientName || !formData.email || !formData.phoneNumber) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      
      // Simple phone validation (10 digits)
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      // Final validation
      if (!formData.clientName || !formData.email || !formData.phoneNumber || 
          !formData.eventDate || !formData.eventType) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Check for conflicts one more time
      if (hasConflict) {
        toast.error("This date and time is already booked");
        return;
      }
      
      // Create booking request
      const bookingData = {
        ...formData,
        status: 'inquiry',
        createdAt: new Date(),
        depositPaid: false,
        numberOfGuests: Number(formData.numberOfGuests) || 0
      };
      
      // Save to Firestore
      await addDoc(collection(db, "djContracts"), bookingData);
      
      // Show success and move to final step
      toast.success("Booking request submitted successfully!");
      setStep(4);
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking request");
    }
  };

  // Generate calendar for the current month and up to 6 months ahead
  const renderCalendar = () => {
    const today = new Date();
    const months = [];
    
    // Generate 6 months from current month
    for (let i = 0; i < 6; i++) {
      const currentMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = currentMonth.toLocaleString('default', { month: 'long' });
      const year = currentMonth.getFullYear();
      const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
      
      const days = [];
      
      // Get the day of week the month starts on (0 = Sunday)
      const firstDayOfMonth = new Date(year, currentMonth.getMonth(), 1).getDay();
      
      // Add empty days for the start of the month
      for (let j = 0; j < firstDayOfMonth; j++) {
        days.push(<div key={`empty-${i}-${j}`} className="h-10 w-10"></div>);
      }
      
      // Add the days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, currentMonth.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        
        // Check if date is in the past
        const isPast = date < new Date(today.setHours(0, 0, 0, 0));
        
        // Check if date is booked already
        const isBooked = existingEvents.some(event => event.eventDate === dateString);
        
        // Check if this is the selected date
        const isSelected = dateString === selectedDate;
        
        days.push(
          <button
            key={`day-${i}-${day}`}
            onClick={() => !isPast && !isBooked && handleDateSelect(dateString)}
            disabled={isPast || isBooked}
            className={`h-10 w-10 rounded-full flex items-center justify-center text-sm
              ${isPast ? 'text-gray-400 cursor-not-allowed' : ''}
              ${isBooked ? 'bg-red-500/20 text-red-200 cursor-not-allowed' : ''}
              ${!isPast && !isBooked ? 'hover:bg-blue-500/50 cursor-pointer' : ''}
              ${isSelected ? 'bg-blue-500 text-white' : ''}
            `}
          >
            {day}
          </button>
        );
      }
      
      months.push(
        <div key={`month-${i}`} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{monthName} {year}</h3>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="h-10 w-10 flex items-center justify-center text-xs text-gray-400">
                {day}
              </div>
            ))}
            {days}
          </div>
        </div>
      );
    }
    
    return months;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Book Your DJ Event</h1>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2">Loading availability...</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl">
            {/* Progress steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${step >= i ? 'bg-blue-500' : 'bg-gray-700'}`}>
                    {step > i ? <HiCheck className="h-6 w-6" /> : i}
                  </div>
                  <span className="text-xs mt-1">
                    {i === 1 && "Date & Time"}
                    {i === 2 && "Your Details"}
                    {i === 3 && "Event Info"}
                    {i === 4 && "Complete"}
                  </span>
                </div>
              ))}
              <div className="absolute left-0 right-0 h-0.5 bg-gray-700 -z-10" style={{ top: '2.5rem' }}></div>
            </div>
            
            {/* Step 1: Select date and time */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4">Select Date & Time</h2>
                
                <div className="space-y-6">
                  <div className="overflow-auto py-2 pr-2 max-h-[400px]">
                    {renderCalendar()}
                  </div>
                  
                  {selectedDate && (
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <p className="flex items-center mb-4">
                        <HiCalendar className="mr-2 h-5 w-5 text-blue-400" />
                        Selected Date: <span className="font-semibold ml-2">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 relative">
                          <Label htmlFor="eventDate">Event Date*</Label>
                          <div className="relative md:static">
                            <CustomDatePicker
                              selectedDate={formData.eventDate ? new Date(formData.eventDate) : null}
                              onChange={(date: Date) => {
                                const dateStr = date.toISOString().split('T')[0];
                                handleDateSelect(dateStr);
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time*</Label>
                          <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="bg-gray-700 border-gray-600 fixed-position-input"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time*</Label>
                          <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={handleChange}
                            className="bg-gray-700 border-gray-600 fixed-position-input"
                          />
                        </div>
                      </div>
                      
                      {hasConflict && (
                        <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded flex items-center mt-3">
                          <HiXMark className="h-5 w-5 mr-2 text-red-400" />
                          This time slot is already booked. Please select another date or time.
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextStep}
                      disabled={!selectedDate || hasConflict}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Personal details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4">Your Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1 flex items-center">
                      <HiUser className="mr-1 h-4 w-4 text-blue-400" />
                      Your Name*
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center">
                      <HiEnvelope className="mr-1 h-4 w-4 text-blue-400" />
                      Email Address*
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center">
                      <HiPhone className="mr-1 h-4 w-4 text-blue-400" />
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={handlePrevStep}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
                    >
                      Back
                    </button>
                    
                    <button
                      onClick={handleNextStep}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 3: Event details */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4">Event Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Event Type*</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      data-event-type-select="true"
                      ref={(el) => {
                        if (el) {
                          // Setup event listener for this element
                          window.addEventListener('eventTypeUpdated', () => {
                            console.log('Event type update detected, refreshing UI state');
                            // Force any dependent elements to update
                            const event = new Event('change', { bubbles: true });
                            el.dispatchEvent(event);
                          });
                        }
                      }}
                    >
                      <option value="">Select Event Type</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="Birthday Party">Birthday Party</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Club Night">Club Night</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1 flex items-center">
                        <HiBuildingOffice2 className="mr-1 h-4 w-4 text-blue-400" />
                        Venue Name
                      </label>
                      <input
                        type="text"
                        name="venueName"
                        value={formData.venueName}
                        onChange={handleChange}
                        placeholder="Venue Name"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 flex items-center">
                        <HiUserGroup className="mr-1 h-4 w-4 text-blue-400" />
                        Expected Guests
                      </label>
                      <input
                        type="number"
                        name="numberOfGuests"
                        value={formData.numberOfGuests}
                        onChange={handleChange}
                        placeholder="Number of Guests"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 flex items-center">
                      <HiMapPin className="mr-1 h-4 w-4 text-blue-400" />
                      Venue Address
                    </label>
                    <input
                      type="text"
                      name="venueLocation"
                      value={formData.venueLocation}
                      onChange={handleChange}
                      placeholder="Venue Address"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any specific requirements or details about your event"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={handlePrevStep}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
                    >
                      Back
                    </button>
                    
                    <button
                      onClick={handleSubmit}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                    >
                      Submit Booking Request
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 4: Confirmation */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiCheck className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Booking Request Submitted!</h2>
                <p className="mb-6">Thank you for your booking request. We&apos;ll review your details and get back to you shortly to confirm your booking.</p>
                
                <div className="bg-gray-700/50 p-4 rounded-lg text-left max-w-md mx-auto mb-6">
                  <h3 className="font-semibold mb-2">Booking Summary:</h3>
                  <p><span className="text-gray-400">Event:</span> {formData.eventType}</p>
                  <p><span className="text-gray-400">Date:</span> {new Date(formData.eventDate).toLocaleDateString()}</p>
                  <p><span className="text-gray-400">Time:</span> {formData.startTime} - {formData.endTime}</p>
                  <p><span className="text-gray-400">Contact:</span> {formData.clientName}</p>
                </div>
                
                <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                  Return to Home
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
} 