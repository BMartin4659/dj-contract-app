'use client';

import React, { useEffect } from 'react';

// Component to suppress hydration warnings by re-rendering client-side only
export default function SuppressHydration({ children }) {
  const [mounted, setMounted] = React.useState(false);
  
  // Only render children after component mounts on the client
  useEffect(() => {
    setMounted(true);
    
    // Clean up Grammarly attributes when component mounts
    if (document.body) {
      document.body.removeAttribute('data-new-gr-c-s-check-loaded');
      document.body.removeAttribute('data-gr-ext-installed');
    }
  }, []);
  
  // During server-side rendering, return a div with suppressHydrationWarning
  if (!mounted) {
    return (
      <div suppressHydrationWarning data-suppress-hydration-warning={true}>
        {/* This will be replaced on the client */}
        Loading...
      </div>
    );
  }
  
  // After mounting on the client, render the actual children
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  );
} 