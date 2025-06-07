'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// This component tries multiple variations of the logo filename and provides a fallback
export default function LogoFallback({ width = 200, height = 200, className = "" }) {
  const [imgSrc, setImgSrc] = useState('/dj-bobby-drake-logo.png');
  const [imgError, setImgError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // List of potential logo filenames to try
  const logoVariations = [
    '/dj-bobby-drake-logo.png',
    '/dJ-bobby-drake-logo.png',
    '/DJ-bobby-drake-logo.png',
    '/dj-bobby-drake-logo-original.png',
    'https://raw.githubusercontent.com/BMartin4659/dj-contract-app/dev/public/dj-bobby-drake-logo-original.png'
  ];
  
  const handleImageError = () => {
    // Try the next logo variation
    if (attemptCount < logoVariations.length - 1) {
      setAttemptCount(attemptCount + 1);
      setImgSrc(logoVariations[attemptCount + 1]);
    } else {
      // If all variations fail, show fallback
      setImgError(true);
    }
  };
  
  // For debugging in console
  useEffect(() => {
    console.log(`Trying logo variation: ${imgSrc}`);
  }, [imgSrc]);

  return (
    <div className={`relative inline-block ${className}`} style={{ 
      width: `${width}px`, 
      height: `${height}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`
    }}>
      {!imgError ? (
        <Image 
          src={imgSrc}
          alt="DJ Bobby Drake Logo" 
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
          DJ Bobby Drake
        </div>
      )}
    </div>
  );
} 