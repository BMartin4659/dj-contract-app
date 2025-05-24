'use client';

import { useEffect, useState } from 'react';

// Enhanced ClientOnly component that handles hydration warnings with better fallback rendering
export default function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    // Mark as mounted
    setHasMounted(true);
  }, []);
  
  // Server-side and first render - return fallback or a hidden placeholder
  if (!hasMounted) {
    if (fallback) {
      // Use provided fallback with hydration warning suppression
      return (
        <div suppressHydrationWarning={true} data-client-only-fallback="true">
          {fallback}
        </div>
      );
    }
    
    // No fallback provided, use minimal invisible placeholder
    // This prevents layout shifts during hydration
    return (
      <div 
        suppressHydrationWarning={true}
        data-client-only-placeholder="true"
        aria-hidden="true"
        style={{ visibility: 'hidden', overflow: 'hidden', height: 0, width: 0 }}
      />
    );
  }
  
  // Client-side - return children with hydration warning suppression
  return (
    <div suppressHydrationWarning={true} data-client-rendered="true">
      {children}
    </div>
  );
} 