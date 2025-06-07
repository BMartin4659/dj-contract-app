'use client';

import { useState, useEffect, useRef } from 'react';

export default function HydrationSuppressor({ children }) {
  // Only render on client-side
  const [isClient, setIsClient] = useState(false);
  const initialized = useRef(false);
  
  useEffect(() => {
    // Function to remove Grammarly-added attributes and any other problematic attributes
    const removeProblematicAttributes = () => {
      if (!document || !document.body) return;
      
      // List of problematic attributes to remove
      const attributesToRemove = [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-gr-ext-id',
        'data-grammarly-source',
        'grammarly',
        'data-grammarly'
      ];
      
      // Elements to clean
      const elementsToClean = [
        document.documentElement,
        document.body,
        ...Array.from(document.querySelectorAll('form, textarea, input, div, span, p'))
      ];
      
      // Remove attributes from each element
      elementsToClean.forEach(element => {
        if (!element) return;
        
        attributesToRemove.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr);
          }
        });
        
        // Add blocking attributes to relevant elements
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.tagName === 'FORM') {
          element.setAttribute('data-gramm', 'false');
          element.setAttribute('data-gramm_editor', 'false');
          element.setAttribute('data-enable-grammarly', 'false');
        }
      });
      
      // Remove any Grammarly elements
      document.querySelectorAll('grammarly-extension, grammarly-button').forEach(el => {
        el.remove();
      });
    };
    
    // Set up MutationObserver to handle dynamically added attributes
    const setupMutationObserver = () => {
      const observer = new MutationObserver((mutations) => {
        let needsCleanup = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'attributes') {
            const attributeName = mutation.attributeName;
            if (attributeName && attributeName.includes('data-gr') || attributeName.includes('gramm')) {
              needsCleanup = true;
              break;
            }
          }
        }
        
        if (needsCleanup) {
          removeProblematicAttributes();
        }
      });
      
      // Observe the entire document for attribute changes
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed', 'data-gr-ext-id'],
        subtree: true,
        childList: true
      });
      
      return observer;
    };
    
    // Run immediately
    removeProblematicAttributes();
    
    // Set state to indicate we're now client-side
    setIsClient(true);
    
    // Only run once to avoid potential performance issues
    if (!initialized.current) {
      initialized.current = true;
      
      // Set up the observer
      const observer = setupMutationObserver();
      
      // Set up periodic cleanup for additional safety
      const interval = setInterval(removeProblematicAttributes, 2000);
      
      // Cleanup function
      return () => {
        clearInterval(interval);
        observer.disconnect();
      };
    }
  }, []);
  
  // During SSR and first render, return a placeholder with the same general structure
  // This helps prevent major layout shifts during hydration
  if (!isClient) {
    return (
      <div style={{ visibility: 'hidden', minHeight: '100vh' }} suppressHydrationWarning={true}>
        {/* Empty placeholder */}
      </div>
    );
  }
  
  // Once on client-side, render the actual content
  return (
    <div suppressHydrationWarning={true}>
      {children}
    </div>
  );
} 