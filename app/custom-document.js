'use client';

import { useEffect } from 'react';

/**
 * This component helps fix hydration issues by cleaning up browser extension attributes
 * after the first client-side render
 */
export default function CustomDocument() {
  useEffect(() => {
    // Fix hydration mismatches from browser extensions
    const fixHydrationMismatches = () => {
      // Handle Grammarly extension attributes
      const bodyEl = document.body;
      
      // List of attributes to remove (can add more if needed)
      const attributesToRemove = [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed'
      ];
      
      // Clean up specific attributes that cause hydration mismatches
      attributesToRemove.forEach(attr => {
        if (bodyEl.hasAttribute(attr)) {
          console.log(`Removing attribute: ${attr}`);
          bodyEl.removeAttribute(attr);
        }
      });
    };
    
    // Run on first client render
    requestAnimationFrame(() => {
      fixHydrationMismatches();
    });
  }, []);
  
  return null;
} 