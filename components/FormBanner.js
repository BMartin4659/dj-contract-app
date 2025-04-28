'use client';

import React from 'react';

const FormBanner = () => {
  return (
    <div style={{
      textAlign: 'center',
      marginBottom: '2rem',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem 0'
    }}>
      <div style={{ 
        width: '220px', 
        height: 'auto',
        margin: '0 auto'
      }}>
        <img
          src="/dj-bobby-drake-logo.png"
          alt="DJ Bobby Drake Logo"
          style={{ 
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
      </div>
      
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: '1rem 0 0.5rem',
        color: '#000'
      }}>
        Event Contract
      </h1>
      
      <a 
        href="mailto:therealdjbobbydrake@gmail.com"
        style={{
          color: '#0070f3',
          textDecoration: 'none',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ marginRight: '0.5rem' }}>✉️</span>
        therealdjbobbydrake@gmail.com
      </a>
    </div>
  );
};

export default FormBanner; 