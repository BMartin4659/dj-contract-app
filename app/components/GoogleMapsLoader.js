'use client';

import { useEffect, useState } from 'react';

export default function GoogleMapsLoader() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.warn('GoogleMapsLoader: No valid Google Maps API key found. Address autocomplete will be disabled.');
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }
    
    // Define a global callback for the script to call
    window.initGoogleMapsCallback = () => {
      console.log('GoogleMapsLoader: Maps API loaded via callback');
      window.googleMapsLoaded = true;
      setLoading(false);
      setError(null);
      
      // Trigger initialization for any waiting components
      setTimeout(() => {
        initializeAddressInputs();
      }, 100);
    };
    
    // If already loaded, don't load again
    if (window.google?.maps?.places) {
      console.log('GoogleMapsLoader: Maps API already loaded');
      window.googleMapsLoaded = true;
      setLoading(false);
      setTimeout(() => {
        initializeAddressInputs();
      }, 100);
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
          window.googleMapsLoaded = true;
          setLoading(false);
          setError(null);
          setTimeout(() => {
            initializeAddressInputs();
          }, 100);
        }
      }, 100);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          console.error('GoogleMapsLoader: Maps API failed to load after timeout');
          
          // Remove the failed script and try again if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`GoogleMapsLoader: Retrying... (${retryCount + 1}/${maxRetries})`);
            existingScript.remove();
            setRetryCount(prev => prev + 1);
            loadMapsScript();
          } else {
            setError('Google Maps failed to load after multiple attempts');
            setLoading(false);
          }
        }
      }, 15000);
      
      return () => clearInterval(checkInterval);
    } else {
      loadMapsScript();
    }
    
    // Function to load the Maps script
    function loadMapsScript() {
      console.log('GoogleMapsLoader: Loading Maps script');
      
      // Create and add script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      
      script.onerror = (err) => {
        console.error('GoogleMapsLoader: Error loading Maps API:', err);
        
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`GoogleMapsLoader: Retrying after error... (${retryCount + 1}/${maxRetries})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            script.remove();
            loadMapsScript();
          }, 2000); // Wait 2 seconds before retry
        } else {
          setError('Failed to load Google Maps API - please check your internet connection');
          setLoading(false);
        }
      };
      
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup if component unmounts during loading
      window.initGoogleMapsCallback = () => {
        console.log('GoogleMapsLoader: Maps API loaded after component unmounted');
      };
    };
  }, [retryCount]);

  // Function to initialize address inputs with autocomplete
  const initializeAddressInputs = () => {
    if (typeof window === 'undefined' || !window.google?.maps?.places) return;
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
      // Find all address inputs - more specific selectors
      const addressInputs = document.querySelectorAll(
        'input[name="venueLocation"], input[placeholder*="address"], input[placeholder*="Address"], input[placeholder*="venue"], input[placeholder*="location"]'
      );
      
      if (addressInputs.length > 0) {
        console.log('GoogleMapsLoader: Found address inputs to initialize:', addressInputs.length);
        
        addressInputs.forEach((input, index) => {
          try {
            // Skip if already initialized
            if (input.dataset.autocompleteInitialized) {
              console.log(`GoogleMapsLoader: Input ${index + 1} already initialized, skipping`);
              return;
            }
            
            // Initialize autocomplete
            const autocomplete = new google.maps.places.Autocomplete(input, {
              types: ['address'],
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'name']
            });
            
            // Mark as initialized
            input.dataset.autocompleteInitialized = 'true';
            console.log(`GoogleMapsLoader: Initialized autocomplete for input ${index + 1}`);
            
            // Add place changed listener
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (place.formatted_address) {
                input.value = place.formatted_address;
                // Trigger change event for form handling
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
                console.log('GoogleMapsLoader: Place selected and change event dispatched');
              }
            });
            
          } catch (err) {
            console.error(`GoogleMapsLoader: Error initializing autocomplete for input ${index + 1}:`, err);
          }
        });
      } else {
        console.log('GoogleMapsLoader: No address inputs found to initialize');
      }
    }, 500); // Wait 500ms for the DOM to be fully ready
  };

  // Re-initialize inputs when Maps loads
  useEffect(() => {
    if (!loading && !error && window.google?.maps?.places) {
      initializeAddressInputs();
      
      // Set up a periodic check for new inputs (for dynamic content)
      const periodicCheck = setInterval(() => {
        const uninitializedInputs = document.querySelectorAll(
          'input[name="venueLocation"]:not([data-autocomplete-initialized]), input[placeholder*="address"]:not([data-autocomplete-initialized])'
        );
        
        if (uninitializedInputs.length > 0) {
          console.log('GoogleMapsLoader: Found new uninitialized inputs, initializing...');
          initializeAddressInputs();
        }
      }, 2000);
      
      // Clean up after 30 seconds
      setTimeout(() => {
        clearInterval(periodicCheck);
      }, 30000);
      
      return () => clearInterval(periodicCheck);
    }
  }, [loading, error]);

  // This component doesn't render anything visible
  if (error) {
    console.warn('GoogleMapsLoader error:', error);
  }
  
  return null;
} 