import React, { useState, useEffect, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';

// Custom input component with display name for linting
const CustomInput = forwardRef(({ value, onClick }, ref) => (
  <div 
    className="custom-datepicker-input"
    onClick={onClick}
    ref={ref}
    style={{
      position: 'relative',
      cursor: 'pointer',
      width: '100%',
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      padding: 'clamp(12px, 2vw, 16px)',
      fontSize: 'clamp(16px, 2.5vw, 18px)',
      color: value ? '#000' : '#6b7280',
      touchAction: 'manipulation' // Improves touch behavior on mobile
    }}
  >
    {value || 'Select a date'}
  </div>
));

// Set display name for linting
CustomInput.displayName = 'CustomDatePickerInput';

const CustomDatePicker = ({ selectedDate, onChange, labelStyle }) => {
  const [bookedDates, setBookedDates] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Fetch booked dates from your API/database
    fetchBookedDates();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const fetchBookedDates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/booked-dates');
      if (!response.ok) {
        throw new Error(`Failed to fetch booked dates: ${response.status}`);
      }
      const dates = await response.json();
      setBookedDates(dates.map(date => new Date(date)));
      setError(null);
    } catch (error) {
      console.error('Error fetching booked dates:', error);
      setError('Could not load booked dates');
      // Continue with empty booked dates rather than breaking the component
      setBookedDates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateBooked = (date) => {
    if (!date || !bookedDates.length) return false;
    return bookedDates.some(bookedDate => 
      date.toDateString() === bookedDate.toDateString()
    );
  };

  const handleDateChange = (date) => {
    // Close the picker after selection on mobile
    if (isMobile) {
      setIsOpen(false);
    }
    
    // Call the parent's onChange
    onChange(date);
  };

  return (
    <div>
      <label style={labelStyle} className="field-label">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaCalendarAlt style={{ color: '#6366f1' }} /> Event Date *
        </span>
      </label>
      {error && <p className="text-red-500 text-xs italic">{error}</p>}
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        customInput={<CustomInput />}
        dateFormat="MMMM d, yyyy"
        minDate={new Date()}
        filterDate={date => !isDateBooked(date)}
        open={isOpen}
        onClickOutside={() => setIsOpen(false)}
        onInputClick={() => setIsOpen(true)}
        calendarClassName="custom-calendar"
        popperClassName={`custom-popper ${isMobile ? 'mobile-popper' : ''}`}
        popperPlacement={isMobile ? "bottom" : "bottom-start"}
        popperModifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8]
            }
          },
          {
            name: "preventOverflow",
            options: {
              boundary: window,
              padding: 16
            }
          }
        ]}
        monthsShown={1}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        disabled={isLoading}
      />
      <style jsx global>{`
        .custom-calendar {
          font-family: system-ui, -apple-system, sans-serif;
          border: none;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 100vw !important;
          z-index: 1000;
        }
        .react-datepicker__header {
          background-color: #6366f1;
          border-bottom: none;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          padding-top: 12px;
        }
        .react-datepicker__current-month {
          color: white;
          font-weight: 600;
        }
        .react-datepicker__day-name {
          color: white;
        }
        .react-datepicker__day--selected {
          background-color: #6366f1;
          border-radius: 50%;
        }
        .react-datepicker__day--disabled {
          color: #dc2626;
          text-decoration: line-through;
        }
        .react-datepicker__day:hover {
          border-radius: 50%;
        }
        .react-datepicker__day {
          margin: 0.2rem;
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          border-radius: 50%;
        }
        .mobile-popper {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 280px !important;
          z-index: 2000 !important;
        }
        @media (max-width: 640px) {
          .react-datepicker__day {
            width: 1.7rem;
            height: 1.7rem;
            line-height: 1.7rem;
            font-size: 0.8rem;
            margin: 0.1rem;
          }
          .react-datepicker__day-name {
            width: 1.7rem;
            margin: 0.1rem;
          }
          .custom-popper {
            transform: translate3d(0, 0, 0) !important;
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker; 