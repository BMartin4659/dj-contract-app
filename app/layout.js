import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic";
import { Inter } from 'next/font/google';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import ClientFormProvider from './components/ClientFormProvider';

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

export const metadata = {
  title: "Live City DJ Contract",
  description: "Book your DJ services with Live City - Professional DJ services for weddings, parties and events",
  applicationName: "Live City DJ Booking",
  keywords: ["DJ", "booking", "contract", "event", "party", "wedding", "live music"],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true, // Allow zooming for better accessibility
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#0070f3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preload critical images */}
        <link rel="preload" href="/dj-background-new.jpg" as="image" />
        <link rel="preload" href="/dj-bobby-drake-logo.png" as="image" />

        {/* Prevent Grammarly from attaching to the document */}
        <meta name="grammarly:no-attach" content="true" />
        <meta name="grammarly:no-injection" content="true" />
        
        {/* Simple script to clear attributes immediately */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Remove attributes that cause hydration issues
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
            })();
          `
        }} />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
        suppressHydrationWarning={true}
        style={{ 
          overflowX: "hidden !important",
          maxWidth: "100vw !important",
          width: "100% !important",
          backgroundImage: "url('/dj-background-new.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          minHeight: "100vh"
        }}
      >
        {/* Add our DocumentHead component for client-side cleanup */}
        <DocumentHead />
        
        {/* Wrap the children in ClientFormProvider first, then HydrationSuppressor */}
        <ClientFormProvider>
          <div suppressHydrationWarning={true}>
            <HydrationSuppressor>
              <GoogleMapsLoader />
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
                errorMsg.includes('data-new-gr-c-s-check-loaded')
              )) {
                // Ignore hydration warnings
                return;
              }
              return originalError.apply(console, args);
            };
          `}
        </Script>
      </body>
    </html>
  );
}
