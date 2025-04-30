import React, { useState, useEffect } from 'react';
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
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Go to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Handle date selection
  const handleDateClick = (date) => {
    if (!date || isDateBooked(date) || isDateInPast(date)) return;
    onChange(date);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.closest('.custom-datepicker') === null) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);
  
  const calendarDates = getCalendarDates(currentYear, currentMonth);
  
  return (
    <div className="custom-datepicker" style={{ width: '100%', position: 'relative' }}>
      <div 
        className="custom-datepicker-input field-input"
        onClick={() => setIsOpen(!isOpen)}
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
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            width: '100%',
            maxWidth: '360px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
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
              onClick={prevMonth}
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
            >
              <FaChevronLeft />
            </button>
            <div style={{ fontWeight: 600 }}>
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <button 
              onClick={nextMonth}
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
                  onClick={() => handleDateClick(date)}
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
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker; 