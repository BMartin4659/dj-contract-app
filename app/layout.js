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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0070f3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Google Maps API is now loaded in individual components that need it */}
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
        style={{ 
          overflowX: "hidden",
          maxWidth: "100vw",
          width: "100%",
          position: "relative"
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

        {/* Script to fix iOS 100vh issue */}
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
          `}
        </Script>
      </body>
    </html>
  );
}
