import React, { forwardRef, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { FaCalendarAlt } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

const CustomInput = forwardRef(({ value, onClick, placeholder, isMobile }, ref) => (
  <div 
    className="datepicker-input"
    onClick={(e) => {
      try {
        onClick(e);
      } catch (error) {
        console.error('Input click error:', error);
      }
    }}
    ref={ref}
    style={{
      width: '100%',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: 'clamp(12px, 2vw, 16px)',
      fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)', // Force 16px on mobile to prevent zoom
      color: '#000',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      minHeight: isMobile ? '44px' : 'auto', // Better touch target on mobile
      WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
      WebkitTouchCallout: 'none', // Prevent callout on long-press
      WebkitUserSelect: 'none', // Prevent text selection
      userSelect: 'none',
      touchAction: 'manipulation' // Prevent zoom on double-tap
    }}
  >
    <span style={{ color: value ? '#000' : '#6b7280' }}>
      {value || placeholder || 'Select a date'}
    </span>
    <FaCalendarAlt style={{ color: '#6366f1', fontSize: '1.2rem' }} />
  </div>
));

CustomInput.displayName = 'CustomInput';

const ReactDatePickerField = ({ 
  selectedDate, 
  onChange, 
  placeholder = 'Select event date',
  dateFormat = 'MMMM d, yyyy',
  minDate = new Date(),
  error = null
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const screenCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck || screenCheck);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile-specific date picker props
  const mobileProps = isMobile ? {
    // Use portal only when necessary and ensure no dark overlays
    popperClassName: "mobile-datepicker-popper",
    popperPlacement: "bottom-start",
    popperProps: {
      strategy: "fixed"
    },
    popperModifiers: [
      {
        name: "preventOverflow",
        enabled: true,
        options: {
          rootBoundary: "viewport",
          tether: false,
          altAxis: true
        }
      },
      {
        name: "offset",
        enabled: true,
        options: {
          offset: [0, 8]
        }
      }
    ]
  } : {
    popperPlacement: "bottom-start",
    popperProps: {
      strategy: "fixed"
    }
  };

  return (
    <div className="relative w-full" style={{ width: '100%', marginBottom: '1rem', display: 'block' }}>
      <DatePicker
        selected={selectedDate ? new Date(selectedDate) : null}
        onChange={(date) => {
          // Safe date handling to prevent crashes
          try {
            if (date && typeof date === 'object' && date instanceof Date) {
              onChange(date);
            } else if (date === null) {
              onChange(null);
            }
          } catch (error) {
            console.error('Date picker error:', error);
            // Fallback to null if there's an error
            onChange(null);
          }
        }}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        minDate={minDate}
        customInput={<CustomInput placeholder={placeholder} isMobile={isMobile} />}
        calendarClassName={`date-picker-calendar ${isMobile ? 'mobile-calendar' : ''}`}
        wrapperClassName="w-full"
        showPopperArrow={false}
        fixedHeight
        monthsShown={1}
        shouldCloseOnSelect
        formatWeekDay={nameOfDay => nameOfDay.substring(0, 2)}
        // Apply mobile-specific props
        {...mobileProps}
        // Mobile-specific additional props
        disabledKeyboardNavigation={isMobile} // Disable keyboard navigation on mobile
        preventOpenOnFocus={isMobile} // Prevent auto-open on focus for mobile
      />
      {error && (
        <p className="text-red-500 text-xs italic mt-1">{error}</p>
      )}
      
      {/* Mobile-specific styles */}
      <style jsx global>{`
        .mobile-calendar {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: none !important;
          max-width: 320px !important;
          width: 100% !important;
        }
        
        .mobile-calendar .react-datepicker__header {
          padding: 16px !important;
          border-radius: 12px 12px 0 0 !important;
        }
        
        .mobile-calendar .react-datepicker__day {
          width: 2.5rem !important;
          height: 2.5rem !important;
          line-height: 2.5rem !important;
          margin: 0.15rem !important;
          font-size: 14px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        .mobile-calendar .react-datepicker__day-name {
          width: 2.5rem !important;
          height: 2.5rem !important;
          line-height: 2.5rem !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0.15rem !important;
        }
        
        .mobile-calendar .react-datepicker__navigation {
          top: 16px !important;
          width: 32px !important;
          height: 32px !important;
        }
        
        .mobile-calendar .react-datepicker__navigation--previous {
          left: 16px !important;
        }
        
        .mobile-calendar .react-datepicker__navigation--next {
          right: 16px !important;
        }
        
        @media (max-width: 768px) {
          .react-datepicker-popper {
            position: fixed !important;
            z-index: 10000 !important;
            width: auto !important;
            max-width: 90vw !important;
            transform: none !important;
            left: 50% !important;
            margin-left: -160px !important;
          }
          
          .mobile-datepicker-popper {
            position: fixed !important;
            z-index: 10001 !important;
            width: auto !important;
            max-width: 320px !important;
            left: 50% !important;
            margin-left: -160px !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          
          .mobile-datepicker-popper .react-datepicker {
            margin: 0 auto !important;
            max-width: 320px !important;
            width: 100% !important;
            position: relative !important;
            transform: none !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          }
          
          .react-datepicker-wrapper {
            width: 100% !important;
          }
          
          /* Prevent zoom on input focus for iOS */
          .datepicker-input input {
            font-size: 16px !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReactDatePickerField; 