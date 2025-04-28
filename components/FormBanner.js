'use client';

import React from 'react';
import Image from 'next/image';

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
        position: 'relative', 
        width: '220px', 
        height: '220px',
        margin: '0 auto'
      }}>
        <Image
          src="/dj-bobby-drake-logo.png"
          alt="DJ Bobby Drake Logo"
          fill
          priority
          sizes="(max-width: 768px) 220px, 220px"
          style={{ 
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