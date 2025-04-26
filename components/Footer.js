'use client';

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer style={{
      backgroundColor: '#f9fafb',
      borderTop: '1px solid #e5e7eb',
      padding: '2rem 1rem',
      marginTop: '3rem',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0070f3' }}>
            Live City DJ
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/about" style={{ color: '#4b5563', textDecoration: 'none' }}>About</Link>
            <Link href="/services" style={{ color: '#4b5563', textDecoration: 'none' }}>Services</Link>
            <Link href="/contact" style={{ color: '#4b5563', textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <div>© {currentYear} Live City DJ. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 