'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const Banner = () => {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <div className="banner" style={{ 
      textAlign: 'center',
      padding: '1rem 0',
      marginBottom: '2rem' 
    }}>
      <div style={{ 
        position: 'relative',
        width: '200px',
        height: '200px',
        margin: '0 auto 1rem'
      }}>
        {!imgError ? (
          <Image
            src="/dj-bobby-drake-logo.png"
            alt="DJ Bobby Drake Logo"
            fill
            priority
            unoptimized={true}
            onError={handleImageError}
            sizes="(max-width: 768px) 200px, 200px"
            style={{
              objectFit: 'contain',
              objectPosition: 'center'
            }}
          />
        ) : (
          <div 
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 'bold',
              color: '#6366f1',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%'
            }}
          >
            DJ
          </div>
        )}
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