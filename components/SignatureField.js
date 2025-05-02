'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import SignatureCanvas dynamically to avoid SSR issues
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { 
  ssr: false 
});

const SignatureField = ({ onSignatureChange }) => {
  const [sigPad, setSigPad] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  
  // Handle scroll prevention during signing
  useEffect(() => {
    // Function to prevent default touchmove behavior to stop scrolling
    const preventScroll = (e) => {
      if (isSigning) {
        e.preventDefault();
      }
    };

    // Function to prevent default scroll behavior
    const preventScrolling = (e) => {
      if (isSigning) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    // Add event listeners to prevent scrolling while signing
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('scroll', preventScrolling, { passive: false });
    
    // Cleanup function
    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('scroll', preventScrolling);
    };
  }, [isSigning]);
  
  const clearSignature = () => {
    if (sigPad) {
      sigPad.clear();
      setHasSignature(false);
      onSignatureChange(null, false);
    }
  };
  
  const handleSignatureBegin = () => {
    setIsSigning(true);
    // Add class to body to prevent scrolling
    if (typeof document !== 'undefined') {
      document.body.classList.add('is-signing');
    }
  };
  
  const handleSignatureEnd = () => {
    setIsSigning(false);
    // Remove class from body to allow scrolling again
    if (typeof document !== 'undefined') {
      document.body.classList.remove('is-signing');
    }
    
    if (sigPad && !sigPad.isEmpty()) {
      if (!signerName.trim()) {
        setNameError('Please enter your name before signing');
        return;
      }
      
      setNameError('');
      setHasSignature(true);
      const signatureData = sigPad.toDataURL('image/png');
      onSignatureChange(signatureData, true, signerName);
    }
  };
  
  const handleNameChange = (e) => {
    setSignerName(e.target.value);
    setNameError('');
    
    // If there's already a signature and name is being entered, update the signature data
    if (hasSignature && sigPad && !sigPad.isEmpty()) {
      const signatureData = sigPad.toDataURL('image/png');
      onSignatureChange(signatureData, true, e.target.value);
    }
  };
  
  return (
    <div id="signature-section" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Signature</h3>
      <p style={{ marginBottom: '1rem', backgroundColor: '#3b82f6', color: 'white', padding: '8px 12px', borderRadius: '4px' }}>
        By signing below, you agree to the terms and conditions.
      </p>
      
      {/* Name input field */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Full Name:
        </label>
        <input
          type="text"
          value={signerName}
          onChange={handleNameChange}
          placeholder="Enter your full name"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '4px',
            border: nameError ? '1px solid #f44336' : '1px solid #ccc',
            fontSize: '1rem'
          }}
          required
        />
        {nameError && (
          <div style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {nameError}
          </div>
        )}
      </div>
      
      <div 
        style={{ 
          border: '1px solid #ccc', 
          borderRadius: '8px', 
          height: '200px', 
          position: 'relative',
          touchAction: 'none'
        }}
        onTouchStart={(e) => {
          if (isSigning) {
            e.preventDefault();
          }
        }}
        onTouchMove={(e) => {
          if (isSigning) {
            e.preventDefault();
          }
        }}
      >
        <SignatureCanvas
          ref={(ref) => setSigPad(ref)}
          canvasProps={{
            style: { width: '100%', height: '200px' },
            className: 'signature-pad-canvas',
            // Add these attributes to prevent scrolling on mobile devices
            'data-touch-action': 'none',
            'touch-action': 'none'
          }}
          options={{
            penColor: 'black',
            velocityFilterWeight: 0.7,
            dotSize: 1.8
          }}
          onBegin={handleSignatureBegin}
          onEnd={handleSignatureEnd}
        />
        
        {!hasSignature && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#999',
            pointerEvents: 'none'
          }}>
            Sign here
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginTop: '1rem'
      }}>
        <button 
          type="button"
          onClick={clearSignature}
          style={{
            backgroundColor: 'transparent',
            color: '#0070f3',
            border: '1px solid #0070f3',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Signature
        </button>
        
        <div style={{ 
          fontSize: '0.9rem', 
          color: hasSignature ? '#10b981' : '#666',
          fontStyle: 'italic'
        }}>
          {hasSignature ? 'Signature captured ✓' : 'Please sign above'}
        </div>
      </div>
    </div>
  );
};

export default SignatureField; 