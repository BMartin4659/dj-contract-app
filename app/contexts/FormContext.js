'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const FormContext = createContext();

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    console.warn('useFormContext called outside of FormProvider, returning default values');
    // Return default values instead of throwing an error
    return {
      contractFormData: {},
      weddingAgendaData: {},
      updateContractFormData: () => {},
      updateWeddingAgendaData: () => {},
      clearAllFormData: () => {},
      clearContractFormData: () => {},
      clearWeddingAgendaData: () => {},
      isClient: false
    };
  }
  return context;
};

export const FormProvider = ({ children }) => {
  const [contractFormData, setContractFormData] = useState({});
  const [weddingAgendaData, setWeddingAgendaData] = useState({});
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('FormContext loading effect triggered, isClient:', isClient);
    
    if (isClient) {
      try {
        console.log('Checking localStorage for saved form data...');
        const savedContractData = localStorage.getItem('djContractFormData');
        const savedAgendaData = localStorage.getItem('djWeddingAgendaData');
        
        console.log('Raw contract data from localStorage:', savedContractData);
        console.log('Raw agenda data from localStorage:', savedAgendaData);
        
        if (savedContractData) {
          const parsedContractData = JSON.parse(savedContractData);
          setContractFormData(parsedContractData);
          console.log('Loaded contract form data from localStorage:', parsedContractData);
        } else {
          console.log('No contract form data found in localStorage');
        }
        
        if (savedAgendaData) {
          const parsedAgendaData = JSON.parse(savedAgendaData);
          setWeddingAgendaData(parsedAgendaData);
          console.log('Loaded wedding agenda data from localStorage:', parsedAgendaData);
        } else {
          console.log('No wedding agenda data found in localStorage');
        }
      } catch (error) {
        console.error('Error loading form data from localStorage:', error);
      }
    } else {
      console.log('Not client-side yet, skipping localStorage load');
    }
  }, [isClient]);

  // Save contract form data to localStorage whenever it changes
  const updateContractFormData = (newData) => {
    console.log('updateContractFormData called with:', newData);
    setContractFormData(newData);
    if (isClient) {
      try {
        localStorage.setItem('djContractFormData', JSON.stringify(newData));
        console.log('Saved contract form data to localStorage:', newData);
        
        // Verify it was saved
        const saved = localStorage.getItem('djContractFormData');
        console.log('Verified saved data in localStorage:', JSON.parse(saved));
      } catch (error) {
        console.error('Error saving contract form data to localStorage:', error);
      }
    } else {
      console.log('Not client-side yet, skipping localStorage save');
    }
  };

  // Save wedding agenda data to localStorage whenever it changes
  const updateWeddingAgendaData = (newData) => {
    setWeddingAgendaData(newData);
    if (isClient) {
      try {
        localStorage.setItem('djWeddingAgendaData', JSON.stringify(newData));
        console.log('Saved wedding agenda data to localStorage:', newData);
      } catch (error) {
        console.error('Error saving wedding agenda data to localStorage:', error);
      }
    }
  };

  // Clear all form data (useful after successful submission)
  const clearAllFormData = () => {
    setContractFormData({});
    setWeddingAgendaData({});
    if (isClient) {
      try {
        localStorage.removeItem('djContractFormData');
        localStorage.removeItem('djWeddingAgendaData');
        console.log('Cleared all form data from localStorage');
      } catch (error) {
        console.error('Error clearing form data from localStorage:', error);
      }
    }
  };

  // Clear only contract form data
  const clearContractFormData = () => {
    setContractFormData({});
    if (isClient) {
      try {
        localStorage.removeItem('djContractFormData');
        console.log('Cleared contract form data from localStorage');
      } catch (error) {
        console.error('Error clearing contract form data from localStorage:', error);
      }
    }
  };

  // Clear only wedding agenda data
  const clearWeddingAgendaData = () => {
    setWeddingAgendaData({});
    if (isClient) {
      try {
        localStorage.removeItem('djWeddingAgendaData');
        console.log('Cleared wedding agenda data from localStorage');
      } catch (error) {
        console.error('Error clearing wedding agenda data from localStorage:', error);
      }
    }
  };

  const value = {
    contractFormData,
    weddingAgendaData,
    updateContractFormData,
    updateWeddingAgendaData,
    clearAllFormData,
    clearContractFormData,
    clearWeddingAgendaData,
    isClient
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}; 