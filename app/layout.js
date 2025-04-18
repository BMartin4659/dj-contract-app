import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// Remove API key check since we're not loading the script here
// Let individual components handle their own script loading

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Live City DJ Contract",
  description: "Book your DJ services with Live City - Professional DJ services for weddings, parties and events",
  applicationName: "Live City DJ Booking",
  keywords: ["DJ", "booking", "contract", "event", "party", "wedding", "live music"],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false, // Prevents pinch zoom on forms for better experience
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ overflowX: "hidden", maxWidth: "100vw" }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0070f3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preload" href="/dj-background-new.jpg" as="image" />
        {/* Google Maps API is now loaded in individual components that need it */}
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
        style={{ 
          overflowX: "hidden !important",
          maxWidth: "100vw !important",
          width: "100% !important",
          backgroundImage: "url('/dj-background-new.jpg') !important",
          backgroundSize: "cover !important",
          backgroundPosition: "center !important",
          backgroundRepeat: "no-repeat !important",
          backgroundAttachment: "fixed !important",
          minHeight: "100vh !important"
        }}
      >
        <div style={{
          minHeight: '100vh',
          width: '100%',
          padding: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          overflowX: 'hidden',
          maxWidth: '100vw'
        }}>
          {children}
        </div>

        {/* Script to fix iOS viewport issues */}
        <Script id="ios-viewport-fix" strategy="afterInteractive">
          {`
            function setAppHeight() {
              document.documentElement.style.setProperty('--app-height', \`\${window.innerHeight}px\`);
            }
            
            window.addEventListener('resize', setAppHeight);
            window.addEventListener('orientationchange', setAppHeight);
            
            // Initial setup
            setAppHeight();
            
            // Fix for when virtual keyboard appears/disappears
            const allInputs = document.querySelectorAll('input, select, textarea');
            allInputs.forEach(input => {
              input.addEventListener('focus', () => {
                setTimeout(setAppHeight, 100);
              });
              
              input.addEventListener('blur', () => {
                setTimeout(setAppHeight, 100);
              });
            });
            
            // Prevent horizontal scrolling
            document.body.addEventListener('touchmove', function(e) {
              if (Math.abs(e.touches[0].clientX) > window.innerWidth) {
                e.preventDefault();
              }
            }, { passive: false });
            
            // Fix mobile background image issues
            function fixMobileBackground() {
              // Add a direct background to body as fallback
              document.body.style.backgroundImage = "url('/dj-background-new.jpg')";
              document.body.style.backgroundSize = "cover";
              document.body.style.backgroundPosition = "center center";
              document.body.style.backgroundRepeat = "no-repeat";
              
              // Check if iOS
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
              if (isIOS) {
                document.body.style.backgroundAttachment = "scroll";
                
                // Create a pseudo element as iOS fallback
                const style = document.createElement('style');
                style.innerHTML = \`
                  body::before {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    background: url('/dj-background-new.jpg') center center no-repeat;
                    background-size: cover;
                  }
                \`;
                document.head.appendChild(style);
              }
            }
            
            // Run on load and on resize
            window.addEventListener('load', fixMobileBackground);
            window.addEventListener('resize', fixMobileBackground);
            
            // Run immediately
            fixMobileBackground();
          `}
        </Script>
      </body>
    </html>
  );
}
