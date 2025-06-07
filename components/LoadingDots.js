'use client';

import React from 'react';

const LoadingDots = ({ color = '#0070f3', size = 'default' }) => {
  const dotSize = size === 'small' ? '6px' : size === 'large' ? '12px' : '8px';
  const dotSpacing = size === 'small' ? '4px' : size === 'large' ? '8px' : '6px';
  
  return (
    <span 
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: dotSize,
        gap: dotSpacing
      }}
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          style={{
            backgroundColor: color,
            height: dotSize,
            width: dotSize,
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'loadingAnimation 1.4s infinite ease-in-out both',
            animationDelay: `${dot * 0.16}s`
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes loadingAnimation {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </span>
  );
};

export default LoadingDots; 