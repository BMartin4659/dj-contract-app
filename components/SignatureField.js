'use client';

import React, { useState, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const SignatureField = ({ onSignatureChange, showTermsModal }) => {
  const [signerName, setSignerName] = useState('');
  const [nameError, setNameError] = useState('');
  
  const handleNameChange = (e) => {
    // Get input value
    let name = e.target.value;
    
    // Auto-capitalize the first letter of each word
    if (name) {
      name = name.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    setSignerName(name);
    setNameError('');
    
    // Notify parent component of the name change, treating it as the signature
    if (name.trim()) {
      onSignatureChange(name, true, name);
    } else {
      onSignatureChange(null, false, '');
    }
  };
  
  return (
    <div id="signature-section" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Authorization</h3>
      <p style={{ 
        marginBottom: '1rem', 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '8px 12px', 
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>By entering your name below, you agree to the terms and conditions.</span>
        <FaInfoCircle 
          style={{ 
            marginLeft: '8px', 
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: 'white'
          }}
          onClick={(e) => {
            e.preventDefault();
            if (showTermsModal) showTermsModal();
          }}
          title="View Terms and Conditions"
        />
      </p>
      
      {/* Name input field with signature-like font */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Full Name:
        </label>
        <input
          type="text"
          value={signerName}
          onChange={handleNameChange}
          placeholder="Type your legal full name"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '4px',
            border: nameError ? '1px solid #f44336' : '1px solid #ccc',
            fontSize: '1.5rem',
            fontFamily: '"Dancing Script", cursive, "Brush Script MT", "Segoe Script", "Bradley Hand", cursive',
            fontStyle: 'italic',
            fontWeight: '500',
            backgroundColor: '#f8f9fa'
          }}
          required
        />
        {nameError ? (
          <div style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {nameError}
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
            Your name will automatically be formatted with proper capitalization
          </div>
        )}
      </div>
      
      {/* Add import for signature font using style */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        
        #signature-section input::placeholder {
          opacity: 0.5;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default SignatureField; 