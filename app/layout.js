'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic";
import { Inter } from 'next/font/google';
import ClientFormProvider from './components/ClientFormProvider';
import { useEffect } from 'react';

// Dynamically import client-side only components with no SSR
const HydrationSuppressor = dynamic(() => import('./components/HydrationSuppressor'), { ssr: false });
const DocumentHead = dynamic(() => import('./components/DocumentHead'), { ssr: false });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });

// Metadata moved to head section since this is a client component
export default function RootLayout({ children }) {
  useEffect(() => {
    // Set document title and meta tags
    document.title = "Live City DJ Contract";
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Book your DJ services with Live City - Professional DJ services for weddings, parties and events";
    
    // Update meta application name
    let metaAppName = document.querySelector('meta[name="application-name"]');
    if (!metaAppName) {
      metaAppName = document.createElement('meta');
      metaAppName.name = 'application-name';
      document.head.appendChild(metaAppName);
    }
    metaAppName.content = "Live City DJ Booking";
    
    // Enhanced Grammarly cleanup
    const cleanupGrammarlyAttributes = () => {
      try {
        // Remove from document element
        if (document.documentElement) {
          document.documentElement.removeAttribute('data-new-gr-c-s-check-loaded');
          document.documentElement.removeAttribute('data-gr-ext-installed');
        }
        
        // Remove from body
        if (document.body) {
          document.body.removeAttribute('data-new-gr-c-s-check-loaded');
          document.body.removeAttribute('data-gr-ext-installed');
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
    
    // Clean up immediately
    cleanupGrammarlyAttributes();
    
    // Set up observer to continuously clean up Grammarly attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-new-gr-c-s-check-loaded' || 
             mutation.attributeName === 'data-gr-ext-installed')) {
          cleanupGrammarlyAttributes();
        }
      });
    });
    
    // Start observing
    if (document.body) {
      observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'] 
      });
    }
    
    // Cleanup interval as backup
    const cleanupInterval = setInterval(cleanupGrammarlyAttributes, 100);
    
    return () => {
      observer.disconnect();
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <title>Live City DJ Contract</title>
        <meta name="description" content="Book your DJ services with Live City - Professional DJ services for weddings, parties and events" />
        <meta name="keywords" content="DJ, booking, contract, event, party, wedding, live music" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#0070f3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preload critical images */}
        <link rel="preload" href="/dj-bobby-drake-logo.png" as="image" />

        {/* Prevent Grammarly from attaching to the document */}
        <meta name="grammarly:no-attach" content="true" />
        <meta name="grammarly:no-injection" content="true" />
        
        {/* Enhanced script to prevent Grammarly attributes */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Prevent Grammarly from adding attributes
              try {
                // Disable Grammarly
                window.grammarly = window.grammarly || {};
                window.grammarly.disable = true;
                
                // Remove attributes immediately and continuously
                const removeGrammarlyAttributes = () => {
                  try {
                    if (document.documentElement) {
                      document.documentElement.removeAttribute('data-new-gr-c-s-check-loaded');
                      document.documentElement.removeAttribute('data-gr-ext-installed');
                    }
                    if (document.body) {
                      document.body.removeAttribute('data-new-gr-c-s-check-loaded');
                      document.body.removeAttribute('data-gr-ext-installed');
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                };
                
                // Run immediately
                removeGrammarlyAttributes();
                
                // Run when DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeGrammarlyAttributes);
                } else {
                  removeGrammarlyAttributes();
                }
                
                // Run continuously for a short period
                let cleanupAttempts = 0;
                const maxAttempts = 50;
                const cleanupInterval = setInterval(() => {
                  removeGrammarlyAttributes();
                  cleanupAttempts++;
                  if (cleanupAttempts >= maxAttempts) {
                    clearInterval(cleanupInterval);
                  }
                }, 20);
                
              } catch (e) {
                // Ignore errors
              }
            })();
          `
        }} />
      </head>
      <body 
        suppressHydrationWarning={true}
        style={{
          minHeight: '100vh',
          fontFamily: "'Montserrat', sans-serif"
        }}
      >
        {/* Add our DocumentHead component for client-side cleanup */}
        <DocumentHead />
        
        {/* Wrap the children in ClientFormProvider first, then HydrationSuppressor */}
        <ClientFormProvider>
          <div suppressHydrationWarning={true}>
            <HydrationSuppressor>
              {children}
            </HydrationSuppressor>
          </div>
        </ClientFormProvider>

        {/* Script to suppress hydration errors */}
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
                errorMsg.includes('data-new-gr-c-s-check-loaded') ||
                errorMsg.includes('tree hydrated but some attributes') ||
                errorMsg.includes('grammarly') ||
                errorMsg.includes('Grammarly')
              )) {
                // Ignore hydration warnings
                return;
              }
              return originalError.apply(console, args);
            };
            
            // Override console.warn as well
            const originalWarn = console.warn;
            console.warn = function(...args) {
              const warnMsg = args[0] || '';
              if (typeof warnMsg === 'string' && (
                warnMsg.includes('hydration') || 
                warnMsg.includes('Hydration') ||
                warnMsg.includes('data-gr-ext-installed') ||
                warnMsg.includes('data-new-gr-c-s-check-loaded')
              )) {
                // Ignore hydration warnings
                return;
              }
              return originalWarn.apply(console, args);
            };
          `}
        </Script>
      </body>
    </html>
  );
}
