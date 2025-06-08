'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import ClientFormProvider from './ClientFormProvider';
import dynamic from 'next/dynamic';

// Dynamically import client-side only components with no SSR
const HydrationSuppressor = dynamic(() => import('./HydrationSuppressor'), { ssr: false });
const DocumentHead = dynamic(() => import('./DocumentHead'), { ssr: false });

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
    <div id="client-root" suppressHydrationWarning>
      <DocumentHead />
      <ClientFormProvider>
        <div suppressHydrationWarning>
          <HydrationSuppressor>
            {children}
          </HydrationSuppressor>
        </div>
      </ClientFormProvider>

      <Script id="hydration-fix" strategy="beforeInteractive">
        {`
          // Suppress React hydration warnings
          window.__NEXT_HYDRATION_WARNINGS_DISABLED = true;
          
          // Override console.error to ignore hydration warnings
          const originalError = console.error;
          console.error = function(...args) {
            const errorMsg = args[0] || '';
            if (typeof errorMsg === 'string' && (
              errorMsg.includes('hydration') || 
              errorMsg.includes('Hydration') ||
              errorMsg.includes('content did not match') ||
              errorMsg.includes('did not match server-rendered') ||
              errorMsg.includes('data-gr-ext-installed') ||
              errorMsg.includes('data-new-gr-c-s-check-loaded')
            )) {
              // Ignore hydration warnings
              return;
            }
            return originalError.apply(console, args);
          };
        `}
      </Script>
    </div>
  );
} 