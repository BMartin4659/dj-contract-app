'use client';

import { useEffect, useRef } from 'react';

export default function DocumentHead() {
  const observerRef = useRef(null);
  
  useEffect(() => {
    // Function to remove all problematic attributes
    const removeProblematicAttributes = () => {
      const attributesToRemove = [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-gr-ext-id',
        'data-grammarly-source',
        'grammarly',
        'data-grammarly'
      ];
      
      // Elements to clean (expanded to include more elements)
      const elementsToClean = [
        document.documentElement,
        document.body,
        ...Array.from(document.querySelectorAll('form, textarea, input, div, p, span, button'))
      ];
      
      elementsToClean.forEach(el => {
        if (!el) return;
        
        // Remove all problematic attributes
        attributesToRemove.forEach(attr => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
          }
        });
        
        // Add blocking attributes to form elements
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'FORM') {
          el.setAttribute('data-gramm', 'false');
          el.setAttribute('data-gramm_editor', 'false');
          el.setAttribute('data-enable-grammarly', 'false');
        }
      });

      // Remove any Grammarly elements
      document.querySelectorAll('grammarly-extension, grammarly-button').forEach(el => {
        el.remove();
      });
    };

    // Run initially
    removeProblematicAttributes();

    // Set up MutationObserver with expanded scope
    if (!observerRef.current) {
      observerRef.current = new MutationObserver((mutations) => {
        let shouldRemove = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'attributes') {
            const attributeName = mutation.attributeName;
            if (attributeName && (
              attributeName.includes('data-gr') || 
              attributeName.includes('gramm')
            )) {
              shouldRemove = true;
              break;
            }
          } else if (mutation.type === 'childList') {
            // Check for added Grammarly nodes
            for (const node of mutation.addedNodes) {
              if (node.nodeName && (
                node.nodeName.toLowerCase().includes('grammarly') ||
                (node.getAttribute && node.getAttribute('data-gr-ext-installed'))
              )) {
                shouldRemove = true;
                break;
              }
            }
          }
        }
        
        if (shouldRemove) {
          removeProblematicAttributes();
        }
      });

      // Observe document with expanded monitoring
      observerRef.current.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [
          'data-new-gr-c-s-check-loaded', 
          'data-gr-ext-installed', 
          'data-gr-ext-id',
          'data-grammarly-source'
        ],
        subtree: true,
        childList: true
      });
    }

    // Also run cleanup periodically as a fallback
    const interval = setInterval(removeProblematicAttributes, 2000);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return null;
} 