import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { FaCalendarAlt } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div 
    className="datepicker-input"
    onClick={onClick}
    ref={ref}
  >
    <span style={{ color: value ? '#000' : '#6b7280' }}>
      {value || placeholder || 'Select a date'}
    </span>
    <FaCalendarAlt style={{ color: '#6366f1' }} />
  </div>
));

CustomInput.displayName = 'CustomInput';

const ReactDatePickerField = ({ 
  selectedDate, 
  onChange, 
  placeholder = 'Select event date',
  dateFormat = 'MMMM d, yyyy',
  minDate = new Date(),
  errorMessage = null
}) => {
  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate ? new Date(selectedDate) : null}
        onChange={onChange}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        minDate={minDate}
        customInput={<CustomInput placeholder={placeholder} />}
        popperPlacement="bottom-start"
        popperModifiers={[
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 20
            }
          }
        ]}
        calendarClassName="z-50"
      />
      {errorMessage && (
        <p className="text-red-500 text-xs italic mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default ReactDatePickerField; 