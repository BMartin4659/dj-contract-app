'use client';

import { useEffect } from 'react';
import ClientFormProvider from './ClientFormProvider';

export default function ClientLayout({ children }) {
  useEffect(() => {
    // Clean up Grammarly attributes if needed
    const cleanupGrammarlyAttributes = () => {
      try {
        document.documentElement?.removeAttribute('data-new-gr-c-s-check-loaded');
        document.documentElement?.removeAttribute('data-gr-ext-installed');
        document.body?.removeAttribute('data-new-gr-c-s-check-loaded');
        document.body?.removeAttribute('data-gr-ext-installed');
      } catch (error) {
        // Ignore cleanup errors
      }
    };

    cleanupGrammarlyAttributes();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-new-gr-c-s-check-loaded' || 
             mutation.attributeName === 'data-gr-ext-installed')) {
          cleanupGrammarlyAttributes();
        }
      });
    });
    
    if (document.body) {
      observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'] 
      });
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <ClientFormProvider>
      <div id="client-root">
        {children}
      </div>
    </ClientFormProvider>
  );
} 