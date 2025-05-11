import React, { useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper function to get days in month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Get dates for the calendar display
const getCalendarDates = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

// Format date for display
const formatDate = (date) => {
  if (!date) return '';
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const CustomDatePicker = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const datePickerRef = useRef(null);
  const calendarRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 'calc(100% + 5px)', bottom: 'auto' });
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Simple approach - use hardcoded dates for now
  const bookedDates = [
    new Date(2024, 5, 15), // June 15, 2024
    new Date(2024, 5, 22), // June 22, 2024
    new Date(2024, 6, 6),  // July 6, 2024
  ];
  
  // Check if a date is booked
  const isDateBooked = (date) => {
    if (!date) return false;
    return bookedDates.some(bookedDate => 
      date.toDateString() === bookedDate.toDateString()
    );
  };
  
  // Check if date is in the past
  const isDateInPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Go to previous month
  const prevMonth = (e) => {
    // Prevent default to avoid scrolling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Go to next month
  const nextMonth = (e) => {
    // Prevent default to avoid scrolling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Calculate if the calendar should appear above or below the input
  const calculatePosition = () => {
    if (!datePickerRef.current) return;
    
    const rect = datePickerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const calendarHeight = isMobile ? 320 : 340; // Slightly smaller on mobile
    
    // On mobile, prioritize showing below unless there's really no space
    if (isMobile) {
      if (spaceBelow < 200 && rect.top > 250) {
        // Very limited space below on mobile, position above
        setCalendarPosition({ top: 'auto', bottom: 'calc(100% + 5px)' });
      } else {
        // Default to below on mobile for better UX
        setCalendarPosition({ top: 'calc(100% + 5px)', bottom: 'auto' });
        
        // If we're positioning below and near bottom of screen,
        // scroll to ensure it's fully visible
        if (spaceBelow < calendarHeight && isOpen) {
          setTimeout(() => {
            if (datePickerRef.current) {
              datePickerRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 100);
        }
      }
    } else {
      // Desktop behavior (unchanged)
      if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
        setCalendarPosition({ top: 'auto', bottom: 'calc(100% + 5px)' });
      } else {
        setCalendarPosition({ top: 'calc(100% + 5px)', bottom: 'auto' });
      }
    }
  };
  
  // Toggle calendar visibility and compute position
  const toggleCalendar = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // If opening the calendar, calculate position
    const willOpen = !isOpen;
    
    if (willOpen) {
      calculatePosition();
      // Fix for iOS Safari focus issues
      if (isMobile) {
        // Ensure any virtual keyboard is dismissed
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        // Slight delay to allow any keyboard to dismiss and properly position
        setTimeout(() => {
          if (datePickerRef.current) {
            // First make sure we're visible
            datePickerRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Force mobile browsers to recognize this as a tap event
            if (calendarRef.current) {
              calendarRef.current.style.display = 'block';
              calendarRef.current.style.opacity = '1';
            }
          }
        }, 150);
      }
    }
    
    setIsOpen(willOpen);
  };
  
  // Handle date selection
  const handleDateClick = (date, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!date || isDateBooked(date) || isDateInPast(date)) return;
    onChange(date);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    // Handle window resize to recalculate position
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };
    
    // Handle scroll to recalculate position
    const handleScroll = () => {
      if (isOpen) {
        calculatePosition();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchend', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    // On mobile, specifically handle touchmove
    if (isMobile) {
      document.addEventListener('touchmove', handleScroll, { passive: false });
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      
      if (isMobile) {
        document.removeEventListener('touchmove', handleScroll);
      }
    };
  }, [isOpen, isMobile]);
  
  // Calculate position when dependencies change
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, isMobile]);
  
  const calendarDates = getCalendarDates(currentYear, currentMonth);
  
  return (
    <div className="custom-datepicker" style={{ width: '100%', position: 'relative' }} ref={datePickerRef}>
      <div 
        className="custom-datepicker-input field-input"
        onClick={toggleCalendar}
        style={{
          position: 'relative',
          cursor: 'pointer',
          width: '100%',
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: 'clamp(12px, 2vw, 16px)',
          fontSize: 'clamp(16px, 2.5vw, 18px)',
          color: selectedDate ? '#000' : '#6b7280',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{selectedDate ? formatDate(selectedDate) : 'Select a date'}</span>
        <FaCalendarAlt style={{ color: '#6366f1' }} />
      </div>
      
      {isOpen && (
        <div 
          className="calendar-dropdown"
          ref={calendarRef}
          style={{
            position: 'absolute',
            top: calendarPosition.top,
            bottom: calendarPosition.bottom,
            left: 0,
            width: '100%',
            maxWidth: isMobile ? '100%' : '360px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="calendar-header" style={{ 
            backgroundColor: '#6366f1', 
            color: 'white',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button 
              onClick={(e) => prevMonth(e)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
              type="button"
            >
              <FaChevronLeft />
            </button>
            <div style={{ fontWeight: 600 }}>
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <button 
              onClick={(e) => nextMonth(e)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
              type="button"
            >
              <FaChevronRight />
            </button>
          </div>
          
          <div className="calendar-body" style={{ padding: '12px' }}>
            <div className="days-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              {DAYS.map(day => (
                <div key={day} style={{ padding: '8px' }}>{day}</div>
              ))}
            </div>
            
            <div className="days-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}>
              {calendarDates.map((date, index) => (
                <div 
                  key={index}
                  onClick={(e) => handleDateClick(date, e)}
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    borderRadius: '50%',
                    cursor: date && !isDateBooked(date) && !isDateInPast(date) ? 'pointer' : 'default',
                    backgroundColor: date && selectedDate && date.toDateString() === selectedDate.toDateString() 
                      ? '#6366f1' 
                      : 'transparent',
                    color: date 
                      ? (isDateBooked(date) || isDateInPast(date)
                          ? '#dc2626' 
                          : (selectedDate && date.toDateString() === selectedDate.toDateString() 
                            ? 'white' 
                            : 'black'))
                      : 'transparent',
                    textDecoration: date && (isDateBooked(date) || isDateInPast(date)) ? 'line-through' : 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {date ? date.getDate() : ''}
                </div>
              ))}
            </div>
          </div>
          
          {isMobile && (
            <div 
              style={{
                borderTop: '1px solid #e5e7eb',
                padding: '12px',
                textAlign: 'center'
              }}
            >
              <button 
                onClick={() => setIsOpen(false)} 
                style={{
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker; 