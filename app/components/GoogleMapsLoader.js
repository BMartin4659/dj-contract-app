'use client';

import { useEffect, useState } from 'react';

export default function GoogleMapsLoader() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Define a global callback for the script to call
    window.initGoogleMapsCallback = () => {
      console.log('GoogleMapsLoader: Maps API loaded via callback');
      window.googleMapsLoaded = true;
      setLoading(false);
    };
    
    // If already loaded, don't load again
    if (window.google?.maps?.places) {
      console.log('GoogleMapsLoader: Maps API already loaded');
      setLoading(false);
      return;
    }

    // Avoid duplicate script loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('GoogleMapsLoader: Maps script already in DOM, waiting for it to load');
      
      // Check if the script is loaded at regular intervals
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          console.log('GoogleMapsLoader: Maps API detected as loaded');
          clearInterval(checkInterval);
          setLoading(false);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          console.error('GoogleMapsLoader: Maps API failed to load after timeout');
          setError('Failed to load Google Maps');
          
          // Remove the failed script and try again
          existingScript.remove();
          loadMapsScript();
        }
      }, 10000);
      
      return () => clearInterval(checkInterval);
    } else {
      loadMapsScript();
    }
    
    // Function to load the Maps script
    function loadMapsScript() {
      console.log('GoogleMapsLoader: Loading Maps script');
      
      // Create and add script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      
      script.onerror = (err) => {
        console.error('GoogleMapsLoader: Error loading Maps API:', err);
        setError('Failed to load Google Maps API');
      };
      
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup if component unmounts during loading
      window.initGoogleMapsCallback = () => {
        console.log('GoogleMapsLoader: Maps API loaded after component unmounted');
      };
    };
  }, []);

  // Initialize address input fields with autocomplete when Maps is loaded
  useEffect(() => {
    if (typeof window === 'undefined' || loading || error) return;
    
    // Wait for DOM to be ready
    setTimeout(() => {
      // Find all address inputs
      const addressInputs = document.querySelectorAll('input[name="venueLocation"], input[placeholder*="address"], input[placeholder*="Address"]');
      
      if (addressInputs.length > 0) {
        console.log('GoogleMapsLoader: Found address inputs to initialize:', addressInputs.length);
        
        addressInputs.forEach((input, index) => {
          try {
            // Skip if already initialized
            if (input.dataset.autocompleteInitialized) return;
            
            // Initialize autocomplete
            const autocomplete = new google.maps.places.Autocomplete(input, {
              types: ['address'],
              componentRestrictions: { country: 'us' }
            });
            
            // Mark as initialized
            input.dataset.autocompleteInitialized = 'true';
            console.log(`GoogleMapsLoader: Initialized autocomplete for input ${index + 1}`);
          } catch (err) {
            console.error(`GoogleMapsLoader: Error initializing autocomplete for input ${index + 1}:`, err);
          }
        });
      } else {
        console.log('GoogleMapsLoader: No address inputs found to initialize');
      }
    }, 1000); // Wait 1s for the DOM to be fully ready
  }, [loading, error]);

  // This component doesn't render anything visible
  return null;
} 