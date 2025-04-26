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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#0070f3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preload" href="/dj-background-new.jpg" as="image" />
        <link rel="preload" href="/dj-bobby-drake-logo.png" as="image" fetchpriority="high" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
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
        {children}

        {/* Google Maps Places API for address autocomplete */}
        <Script id="google-maps-callback">
          {`
            window.initGoogleMapsCallback = function() {
              console.log('Google Maps initialized via callback');
              window.googleMapsLoaded = true;
            };
          `}
        </Script>
        
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback`}
        />

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
          `}
        </Script>
      </body>
    </html>
  );
}
