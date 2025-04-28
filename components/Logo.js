'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Logo = ({ color = '#0070f3', size = 'default' }) => {
  const fontSize = size === 'small' ? '1.5rem' : size === 'large' ? '2.5rem' : '2rem';
  
  return (
    <Link href="/" style={{ textDecoration: 'none' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '250px', height: '80px' }}>
          <Image
            src="/dj-bobby-drake-logo.png"
            alt="DJ Bobby Drake Logo"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 250px"
            style={{
              objectFit: 'contain',
            }}
          />
        </div>
        <span style={{ 
          color: color,
          fontSize: fontSize,
          fontFamily: '"Montserrat", sans-serif',
          letterSpacing: '-0.5px',
          marginTop: '10px'
        }}>
          Live City DJ
        </span>
      </div>
    </Link>
  );
};

export default Logo; 