'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Logo({ width = 200, height = 200, className = "" }) {
  return (
    <div className={`relative inline-block ${className}`} style={{ 
      width: `${width}px`, 
      height: `${height}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`
    }}>
      <Image 
        src="/dj-bobby-drake-logo.png" 
        alt="Live City DJ Logo" 
        fill
        sizes={`(max-width: 768px) ${width}px, ${width}px`}
        priority={true}
        quality={90}
        style={{ 
          objectFit: "contain",
          objectPosition: "center",
          display: "block"
        }}
        className="max-w-none"
      />
    </div>
  );
} 