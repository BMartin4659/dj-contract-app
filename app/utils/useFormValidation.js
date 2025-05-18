'use client';

import { useState, useEffect } from 'react';

export const useFormValidation = (initialState, validateFunction) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  // Check if form is valid whenever formData changes
  useEffect(() => {
    if (Object.keys(touchedFields).length > 0) {
      const validationErrors = validateFunction(formData);
      setErrors(validationErrors);
      setIsFormValid(Object.keys(validationErrors).length === 0);
    }
  }, [formData, validateFunction, touchedFields]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
    
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Handle custom field changes (like dates, signatures, etc.)
  const handleCustomChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Set a specific error message
  const setError = (field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  };

  // Clear a specific error
  const clearError = (field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Mark all fields as touched (useful for form submission)
  const touchAllFields = () => {
    const allFields = Object.keys(formData).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    
    setTouchedFields(allFields);
  };

  // Validate form before submission
  const validateForm = () => {
    const validationErrors = validateFunction(formData);
    setErrors(validationErrors);
    const isValid = Object.keys(validationErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialState);
    setErrors({});
    setTouchedFields({});
    setIsFormValid(false);
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    isFormValid,
    touchedFields,
    setFormData,
    setErrors,
    setIsSubmitting,
    handleChange,
    handleCustomChange,
    setError,
    clearError,
    touchAllFields,
    validateForm,
    resetForm
  };
};

// Common validation functions
export const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const validatePhone = (phone) => 
  /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));

export const validateAddress = (address) => 
  address && address.trim().length > 0; 