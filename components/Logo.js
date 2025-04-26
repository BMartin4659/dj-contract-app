'use client';

import React from 'react';
import Link from 'next/link';

const Logo = ({ color = '#0070f3', size = 'default' }) => {
  const fontSize = size === 'small' ? '1.5rem' : size === 'large' ? '2.5rem' : '2rem';
  
  return (
    <Link href="/" style={{ textDecoration: 'none' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        <span style={{ 
          color: color,
          fontSize: fontSize,
          fontFamily: '"Montserrat", sans-serif',
          letterSpacing: '-0.5px'
        }}>
          Live City DJ
        </span>
      </div>
    </Link>
  );
};

export default Logo; 