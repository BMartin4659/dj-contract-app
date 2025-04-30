import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Custom input component with display name for linting
const CustomInput = forwardRef(({ value, onClick }, ref) => (
  <div 
    className="custom-datepicker-input field-input"
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
      color: value ? '#000' : '#6b7280'
    }}
  >
    {value || 'Select a date'}
  </div>
));

// Set display name for linting
CustomInput.displayName = 'CustomDatePickerInput';

const CustomDatePicker = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Simple approach - use hardcoded dates for now
  const bookedDates = [
    new Date(2024, 5, 15), // June 15, 2024
    new Date(2024, 5, 22), // June 22, 2024
    new Date(2024, 6, 6),  // July 6, 2024
  ];

  const isDateBooked = (date) => {
    return bookedDates.some(bookedDate => 
      date.toDateString() === bookedDate.toDateString()
    );
  };

  return (
    <div>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          onChange(date);
          setIsOpen(false);
        }}
        customInput={<CustomInput />}
        dateFormat="MMMM d, yyyy"
        minDate={new Date()}
        filterDate={date => !isDateBooked(date)}
        onClickOutside={() => setIsOpen(false)}
        onInputClick={() => setIsOpen(!isOpen)}
        open={isOpen}
        calendarClassName="custom-calendar"
        popperClassName="custom-popper"
        popperPlacement="bottom-start"
      />
      <style jsx global>{`
        .custom-calendar {
          font-family: system-ui, -apple-system, sans-serif;
          border: none;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
        
        @media (max-width: 640px) {
          .custom-popper {
            position: fixed !important;
            inset: auto !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker; 