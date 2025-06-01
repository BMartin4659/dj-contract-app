'use client';

import { useEffect } from 'react';

// This component helps prevent hydration mismatches
// by handling browser extensions like Grammarly that modify the DOM
export default function FixHydration() {
  useEffect(() => {
    // Handle Grammarly extension attributes
    const handleGrammarly = () => {
      // Check if Grammarly attributes already exist
      const bodyEl = document.body;
      const hasGrammarlyAttributes = 
        bodyEl.hasAttribute('data-gr-ext-installed') || 
        bodyEl.hasAttribute('data-new-gr-c-s-check-loaded');
      
      // If no Grammarly attributes found, no need to fix
      if (!hasGrammarlyAttributes) return;
      
      // Set suppressHydrationWarning on any element that might be affected
      // by Grammarly or similar extensions
      const elements = document.querySelectorAll('input, textarea, [contenteditable]');
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.setAttribute('suppressHydrationWarning', 'true');
        }
      });
    };

    // Run immediately after hydration
    handleGrammarly();
  }, []);

  // This component doesn't render anything
  return null;
} 