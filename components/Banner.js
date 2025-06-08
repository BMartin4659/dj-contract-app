'use client';

import React from 'react';
import LogoFallback from '../app/components/LogoFallback';

const Banner = () => {
  return (
    <div className="banner" style={{ 
      textAlign: 'center',
      padding: '1rem 0',
      marginBottom: '2rem' 
    }}>
      <div style={{ 
        margin: '0 auto 1rem'
      }}>
        <LogoFallback 
          width={200} 
          height={200} 
        />
      </div>
      
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold',
        color: '#000',
        marginBottom: '0.5rem'
      }}>
        Event Contract
      </h1>
      
      <a 
        href="mailto:therealdjbobbydrake@gmail.com"
        style={{ 
          color: '#0070f3',
          textDecoration: 'none',
          fontSize: '1rem'
        }}
      >
        📧 therealdjbobbydrake@gmail.com
      </a>
    </div>
  );
};

export default Banner; 