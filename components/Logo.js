'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Logo({ width = 200, height = 200, className = "" }) {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <div className={`relative inline-block ${className}`} style={{ 
      width: `${width}px`, 
      height: `${height}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`
    }}>
      {!imgError ? (
        <Image 
          src="/dj-bobby-drake-logo.png" 
          alt="Live City DJ Logo" 
          fill
          sizes={`(max-width: 768px) ${width}px, ${width}px`}
          priority={true}
          quality={90}
          unoptimized={true}
          onError={handleImageError}
          style={{ 
            objectFit: "contain",
            objectPosition: "center",
            display: "block"
          }}
          className="max-w-none"
        />
      ) : (
        <div 
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.max(width / 5, 16)}px`,
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
  );
} 