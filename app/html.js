'use client';

import { useEffect, useState } from 'react';

// Helper component to clean up problematic attributes added by browser extensions
export default function HTMLWrapper({ children }) {
  // State to track if we're in client-side environment
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted for client-side only rendering
    setMounted(true);

    // More aggressive removal of Grammarly attributes from body
    const cleanupBodyAttributes = () => {
      if (document.body) {
        // Remove Grammarly attributes
        document.body.removeAttribute('data-new-gr-c-s-check-loaded');
        document.body.removeAttribute('data-gr-ext-installed');
        
        // Add blocking attributes
        document.body.setAttribute('data-gramm', 'false');
        document.body.setAttribute('data-gramm_editor', 'false');
        document.body.setAttribute('data-enable-grammarly', 'false');
        
        // Set data attributes (alternative syntax)
        document.body.dataset.grammarly = 'false';
        document.body.dataset.grammEditor = 'false';
        document.body.dataset.enableGrammarly = 'false';
        
        // Get all form elements and inputs
        const elements = document.querySelectorAll('form, input, textarea, [contenteditable=true]');
        elements.forEach(el => {
          el.setAttribute('data-gramm', 'false');
          el.setAttribute('data-gramm_editor', 'false');
          el.setAttribute('data-enable-grammarly', 'false');
          
          // Use data attributes too
          if (el.dataset) {
            el.dataset.gramm = 'false';
            el.dataset.grammEditor = 'false';
            el.dataset.enableGrammarly = 'false';
          }
        });
        
        // Remove any Grammarly extensions from the DOM
        document.querySelectorAll('grammarly-extension, .grammarly-btn, .grammarly-ghost').forEach(el => {
          try {
            el.remove();
          } catch (e) {
            console.log('Failed to remove Grammarly element', e);
          }
        });
      }
    };
    
    // Run immediately on mount
    cleanupBodyAttributes();
    
    // Set up interval to keep checking and removing
    const intervalId = setInterval(cleanupBodyAttributes, 1000);
    
    // Create MutationObserver to continuously monitor DOM for Grammarly attributes
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        let shouldCleanup = false;
        
        mutations.forEach((mutation) => {
          // Check attribute mutations
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'data-new-gr-c-s-check-loaded' || 
               mutation.attributeName === 'data-gr-ext-installed')) {
            shouldCleanup = true;
          }
          
          // Check for added nodes
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) { // Element node
                if (node.hasAttribute?.('data-new-gr-c-s-check-loaded') || 
                    node.hasAttribute?.('data-gr-ext-installed') ||
                    node.tagName === 'GRAMMARLY-EXTENSION') {
                  shouldCleanup = true;
                  break;
                }
              }
            }
          }
        });
        
        if (shouldCleanup) {
          cleanupBodyAttributes();
        }
      });
      
      // Start observing if body exists
      if (document.body) {
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'],
          childList: true,
          subtree: true
        });
      }
      
      // Clean up observer on unmount
      return () => {
        observer.disconnect();
        clearInterval(intervalId);
      };
    }
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, []);
  
  // Safely return children with hydration warnings suppressed
  return (
    <div suppressHydrationWarning data-suppress-hydration-warning="true">
      {children}
    </div>
  );
} 