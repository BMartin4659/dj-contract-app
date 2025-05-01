'use client';
import React from 'react';
import Image from 'next/image';

export default function TestPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      minHeight: '100vh'
    }}>
      <h1>Testing Logo Display</h1>
      
      {/* Test 1: Next.js Image with fill */}
      <div style={{ 
        position: 'relative', 
        width: '200px', 
        height: '200px', 
        margin: '2rem',
        border: '1px solid red' 
      }}>
        <Image
          src="/dj-bobby-drake-logo.png"
          alt="Test 1: fill"
          fill
          sizes="200px"
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
      
      {/* Test 2: Next.js Image with dimensions */}
      <div style={{ 
        margin: '2rem',
        border: '1px solid blue' 
      }}>
        <Image
          src="/dj-bobby-drake-logo.png"
          alt="Test 2: dimensions"
          width={200}
          height={200}
          priority
        />
      </div>
      
      {/* Test 3: Direct img tag */}
      <div style={{ 
        margin: '2rem',
        border: '1px solid green' 
      }}>
        <Image
          src="/dj-bobby-drake-logo.png"
          alt="Test 3: img tag"
          width={200}
          height={200}
          style={{ objectFit: 'contain' }}
        />
      </div>
      
      {/* Test 4: Next.js Image with relative Path */}
      <div style={{ 
        margin: '2rem',
        border: '1px solid purple' 
      }}>
        <Image
          src="/dj-bobby-drake-logo.png"
          alt="Test 4: relative path"
          width={200}
          height={200}
          priority
        />
      </div>

      <Image
        src="/dj-bobby-drake-logo.png"
        alt="DJ Bobby Drake Logo"
        width={300}
        height={120}
        className="w-auto h-auto"
      />
    </div>
  );
} 