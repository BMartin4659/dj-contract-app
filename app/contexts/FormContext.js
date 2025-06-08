'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const FormContext = createContext();

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    if (!isClient || isInitialized) return;

    try {
      const savedContractData = localStorage.getItem('djContractFormData');
      const savedAgendaData = localStorage.getItem('djWeddingAgendaData');
      
      if (savedContractData) {
        setContractFormData(JSON.parse(savedContractData));
      }
      
      if (savedAgendaData) {
        setWeddingAgendaData(JSON.parse(savedAgendaData));
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }, [isClient, isInitialized]);

  const updateContractFormData = (newData) => {
    setContractFormData(newData);
    if (isClient) {
      try {
        localStorage.setItem('djContractFormData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving contract data:', error);
      }
    }
  };

  const updateWeddingAgendaData = (newData) => {
    setWeddingAgendaData(newData);
    if (isClient) {
      try {
        localStorage.setItem('djWeddingAgendaData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving agenda data:', error);
      }
    }
  };

  const clearAllFormData = () => {
    setContractFormData({});
    setWeddingAgendaData({});
    if (isClient) {
      try {
        localStorage.removeItem('djContractFormData');
        localStorage.removeItem('djWeddingAgendaData');
      } catch (error) {
        console.error('Error clearing form data:', error);
      }
    }
  };

  const clearContractFormData = () => {
    setContractFormData({});
    if (isClient) {
      try {
        localStorage.removeItem('djContractFormData');
      } catch (error) {
        console.error('Error clearing contract data:', error);
      }
    }
  };

  const clearWeddingAgendaData = () => {
    setWeddingAgendaData({});
    if (isClient) {
      try {
        localStorage.removeItem('djWeddingAgendaData');
      } catch (error) {
        console.error('Error clearing agenda data:', error);
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