'use client';

import { useEffect } from 'react';

export default function HTMLWrapper({ children }) {
  useEffect(() => {
    // Apply suppressHydrationWarning to html and body
    document.documentElement.setAttribute('suppressHydrationWarning', 'true');
    document.body.setAttribute('suppressHydrationWarning', 'true');

    // Mutation observer to remove Grammarly attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const node = mutation.target;
          if (
            node.hasAttribute('data-gr-ext-installed') ||
            node.hasAttribute('data-new-gr-c-s-check-loaded')
          ) {
            node.removeAttribute('data-gr-ext-installed');
            node.removeAttribute('data-new-gr-c-s-check-loaded');
          }
        }
      });
    });

    // Start observing document body for Grammarly attributes
    observer.observe(document.body, {
      attributes: true,
      childList: false,
      subtree: true,
      attributeFilter: ['data-gr-ext-installed', 'data-new-gr-c-s-check-loaded']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return children;
} 