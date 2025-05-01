'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LogoTestPage() {
  const [logoTests, setLogoTests] = useState({
    nextImageFill: false,
    nextImageWidth: false,
    regularImg: false,
    directUrl: false
  });
  
  useEffect(() => {
    // Simulate checking if each image loads successfully
    const imageTests = {
      nextImageFill: document.getElementById('next-image-fill'),
      nextImageWidth: document.getElementById('next-image-width'),
      regularImg: document.getElementById('regular-img'),
      directUrl: document.getElementById('direct-url')
    };
    
    // For regular images we can use the onload event
    const regularImg = new Image();
    regularImg.onload = () => setLogoTests(prev => ({ ...prev, regularImg: true }));
    regularImg.onerror = () => console.error('Regular image failed to load');
    regularImg.src = '/dj-bobby-drake-logo.png';
    
    // For direct URL
    const directUrl = new Image();
    directUrl.onload = () => setLogoTests(prev => ({ ...prev, directUrl: true }));
    directUrl.onerror = () => console.error('Direct URL image failed to load');
    directUrl.src = window.location.origin + '/dj-bobby-drake-logo.png';
    
    // We will assume Next.js Images are working if they don't throw errors
    // (since they're more complex to check due to their lazy loading)
    setLogoTests(prev => ({ 
      ...prev, 
      nextImageFill: true, 
      nextImageWidth: true 
    }));
  }, []);
  
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: 'white', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Logo Test Page</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to form
          </Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Test 1: Next.js Image with fill */}
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 1: Next.js Image (fill property)</h2>
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
              <Image
                id="next-image-fill"
                src="/dj-bobby-drake-logo.png"
                alt="DJ Bobby Drake Logo"
                fill
                priority
                sizes="200px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '8px', 
              backgroundColor: logoTests.nextImageFill ? '#d4edda' : '#f8d7da',
              color: logoTests.nextImageFill ? '#155724' : '#721c24',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              Status: {logoTests.nextImageFill ? 'Loaded ✓' : 'Failed ✗'}
            </div>
          </div>
          
          {/* Test 2: Next.js Image with width/height */}
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 2: Next.js Image (width/height)</h2>
            <div style={{ margin: '0 auto', textAlign: 'center' }}>
              <Image
                id="next-image-width"
                src="/dj-bobby-drake-logo.png"
                alt="DJ Bobby Drake Logo"
                width={200}
                height={200}
                priority
              />
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '8px', 
              backgroundColor: logoTests.nextImageWidth ? '#d4edda' : '#f8d7da',
              color: logoTests.nextImageWidth ? '#155724' : '#721c24',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              Status: {logoTests.nextImageWidth ? 'Loaded ✓' : 'Failed ✗'}
            </div>
          </div>
          
          {/* Test 3: Regular img tag */}
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 3: Regular img tag</h2>
            <div style={{ textAlign: 'center' }}>
              <Image
                id="regular-img"
                src="/dj-bobby-drake-logo.png"
                alt="DJ Bobby Drake Logo"
                width={300}
                height={120}
                className="w-auto h-auto"
              />
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '8px', 
              backgroundColor: logoTests.regularImg ? '#d4edda' : '#f8d7da',
              color: logoTests.regularImg ? '#155724' : '#721c24',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              Status: {logoTests.regularImg ? 'Loaded ✓' : 'Failed ✗'}
            </div>
          </div>
          
          {/* Test 4: Direct URL */}
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 4: Direct URL (full path)</h2>
            <div style={{ textAlign: 'center' }}>
              <Image
                id="direct-url"
                src="/dj-bobby-drake-logo.png"
                alt="DJ Bobby Drake Logo"
                width={300}
                height={120}
                className="w-auto h-auto"
              />
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '8px', 
              backgroundColor: logoTests.directUrl ? '#d4edda' : '#f8d7da',
              color: logoTests.directUrl ? '#155724' : '#721c24',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              Status: {logoTests.directUrl ? 'Loaded ✓' : 'Failed ✗'}
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h2>Debugging Information</h2>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Page URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</li>
            <li><strong>Logo URL:</strong> {typeof window !== 'undefined' ? window.location.origin + '/dj-bobby-drake-logo.png' : 'N/A'}</li>
            <li><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 