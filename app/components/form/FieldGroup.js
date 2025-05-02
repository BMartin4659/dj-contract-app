'use client';

import React from 'react';

/**
 * A reusable form field group component with consistent styling
 */
const FieldGroup = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  icon = null,
  options = [],
  children,
  disabled = false,
  className = '',
  containerClassName = '',
  iconStyle = {},
}) => {
  const renderInput = () => {
    // Different input types
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            disabled={disabled}
            required={required}
          >
            <option value="" disabled>
              Select {label}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            rows={4}
            disabled={disabled}
            required={required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={name}
              id={name}
              checked={value || false}
              onChange={onChange}
              className={`w-5 h-5 text-blue-600 border-gray-300 rounded 
                focus:ring-blue-500 ${className}`}
              disabled={disabled}
            />
            <label
              htmlFor={name}
              className="ml-2 text-sm font-medium text-gray-700"
            >
              {label}
            </label>
          </div>
        );

      case 'custom':
        return children;

      default:
        return (
          <input
            type={type}
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            disabled={disabled}
            required={required}
          />
        );
    }
  };

  // For checkbox type, we don't need to show the label twice
  if (type === 'checkbox') {
    return (
      <div className={`mb-4 ${containerClassName}`}>
        {renderInput()}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`mb-5 ${containerClassName}`}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div
            className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
            style={{ color: error ? '#f56565' : '#4a5568' }}
          >
            {React.cloneElement(icon, {
              style: { ...iconStyle, color: error ? '#f56565' : iconStyle.color || '#4a5568' },
            })}
          </div>
        )}
        <div className={icon ? 'pl-10' : ''}>{renderInput()}</div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FieldGroup; 