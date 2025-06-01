'use client';

import { useEffect, useRef, useState } from 'react';

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter venue address",
  name = "venueLocation",
  required = true,
  style = {},
  className = ""
}) {
  const inputRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const screenCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck || screenCheck);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!inputRef.current) return;

    const loadGoogleMapsAPI = () => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.google?.maps?.places?.Autocomplete) {
          console.log('Google Maps API already available');
          resolve();
          return;
        }
        
        // Check if script is already being loaded
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          console.log('Google Maps script already exists, waiting for load...');
          
          // Poll for the API to become available with shorter intervals for mobile
          const checkInterval = setInterval(() => {
            if (window.google?.maps?.places?.Autocomplete) {
              console.log('Google Maps API detected via polling');
              clearInterval(checkInterval);
              resolve();
            }
          }, isMobile ? 200 : 500); // Faster polling on mobile
          
          // Longer timeout for mobile networks
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.google?.maps?.places?.Autocomplete) {
              reject(new Error('Google Maps API failed to load within timeout'));
            }
          }, isMobile ? 15000 : 10000);
          
          return;
        }
        
        console.log('Loading Google Maps API directly...');
        
        // Load the script directly with mobile optimizations
        const script = document.createElement('script');
        const apiKey = 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc';
        
        // Add mobile-specific parameters for better performance
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async${isMobile ? '&region=US&language=en' : ''}`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google Maps API loaded successfully');
          window.googleMapsLoaded = true;
          resolve();
        };
        
        script.onerror = (error) => {
          console.error('Error loading Google Maps API:', error);
          reject(new Error('Failed to load Google Maps API'));
        };
        
        document.head.appendChild(script);
      });
    };

    const initializeAutocomplete = async (retryCount = 0) => {
      try {
        // Double-check that the API is available
        if (!window.google?.maps?.places?.Autocomplete) {
          console.log('Google Maps API not ready for autocomplete initialization');
          return false;
        }

        // Skip if already initialized
        if (autocompleteRef.current) {
          console.log('Autocomplete already initialized');
          return true;
        }

        // Ensure input is still available
        if (!inputRef.current) {
          console.log('Input ref not available');
          return false;
        }

        console.log('Initializing address autocomplete...');

        // Add a longer delay for mobile to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, isMobile ? 500 : 200));

        // Create autocomplete instance with mobile-optimized options
        try {
          const autocompleteOptions = {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'name', 'place_id', 'geometry'],
            // Mobile-specific optimizations
            ...(isMobile && {
              bounds: null, // Remove bounds restriction on mobile for better performance
              strictBounds: false,
              // Optimize for mobile networks
              sessionToken: new window.google.maps.places.AutocompleteSessionToken()
            })
          };

          const autocomplete = new window.google.maps.places.Autocomplete(
            inputRef.current, 
            autocompleteOptions
          );

          // Add place changed listener with mobile optimizations
          autocomplete.addListener('place_changed', () => {
            try {
              const place = autocomplete.getPlace();
              console.log('Place selected:', place?.formatted_address);
              
              if (place?.formatted_address && onChange) {
                onChange({
                  target: {
                    name: name,
                    value: place.formatted_address
                  }
                });
                
                // On mobile, blur the input to hide the keyboard
                if (isMobile && inputRef.current) {
                  inputRef.current.blur();
                }
              }
            } catch (err) {
              console.error('Error in place_changed listener:', err);
            }
          });

          // Add mobile-specific event listeners
          if (isMobile) {
            // Handle touch events for better mobile experience
            const handleMobileFocus = () => {
              // Ensure the autocomplete dropdown is visible on mobile
              setTimeout(() => {
                const pacContainer = document.querySelector('.pac-container');
                if (pacContainer) {
                  pacContainer.style.zIndex = '9999';
                  pacContainer.style.fontSize = '16px'; // Prevent zoom on iOS
                  
                  // Make sure dropdown is positioned correctly on mobile
                  const inputRect = inputRef.current.getBoundingClientRect();
                  if (inputRect.bottom > window.innerHeight / 2) {
                    // Position above if input is in bottom half
                    pacContainer.style.top = 'auto';
                    pacContainer.style.bottom = (window.innerHeight - inputRect.top) + 'px';
                  }
                }
              }, 100);
            };

            inputRef.current.addEventListener('focus', handleMobileFocus);
            inputRef.current.addEventListener('touchstart', handleMobileFocus);
          }

          autocompleteRef.current = autocomplete;
          setIsReady(true);
          setError(null);
          console.log('Address autocomplete initialized successfully');
          return true;
        } catch (autocompleteError) {
          console.error('Error creating Autocomplete instance:', autocompleteError);
          throw autocompleteError;
        }
      } catch (err) {
        console.error('Error initializing address autocomplete:', err);
        
        // Retry with longer delays on mobile
        if (retryCount < (isMobile ? 5 : 3)) {
          const delay = isMobile ? 2000 * (retryCount + 1) : 1000 * (retryCount + 1);
          console.log(`Retrying autocomplete initialization (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return initializeAutocomplete(retryCount + 1);
        }
        
        setError('Error initializing address suggestions');
        return false;
      }
    };

    // Main setup function
    const setupAutocomplete = async () => {
      try {
        setError(null);
        
        // Wait for Google Maps API to be available
        await loadGoogleMapsAPI();
        
        // Add a longer delay after API is detected on mobile
        await new Promise(resolve => setTimeout(resolve, isMobile ? 800 : 300));
        
        // Initialize autocomplete
        const success = await initializeAutocomplete();
        if (!success) {
          throw new Error('Failed to initialize autocomplete');
        }
      } catch (error) {
        console.error('Error setting up autocomplete:', error);
        setError('Address suggestions unavailable - please refresh the page');
      }
    };
    
    setupAutocomplete();

    return () => {
      // Cleanup autocomplete instance
      if (autocompleteRef.current) {
        try {
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          console.log('Could not clear autocomplete listeners:', e);
        }
        autocompleteRef.current = null;
      }
      setIsReady(false);
    };
  }, [name, onChange, isMobile]);

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Mobile-specific input handlers
  const handleMobileTouch = (e) => {
    if (isMobile) {
      // Prevent default to avoid zoom on double-tap
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (isReady) return '✓ Address suggestions ready';
    return 'Loading address suggestions...';
  };

  const getStatusColor = () => {
    if (error) return '#e53e3e';
    if (isReady) return '#0070f3';
    return '#888';
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        name={name}
        type="text"
        value={value}
        onChange={handleInputChange}
        onTouchStart={handleMobileTouch}
        required={required}
        placeholder={placeholder}
        autoComplete="off" // Disable browser autocomplete to avoid conflicts
        style={{
          backgroundColor: 'white',
          width: '100%',
          padding: 'clamp(12px, 2vw, 16px)',
          marginBottom: '1rem',
          borderRadius: '8px',
          border: `1px solid ${error ? '#e53e3e' : '#ccc'}`,
          color: 'black',
          transition: 'all 0.2s ease',
          fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)', // Force 16px on mobile to prevent zoom
          minHeight: isMobile ? '44px' : 'auto', // Better touch target on mobile
          WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
          WebkitTouchCallout: 'none', // Prevent callout on long-press
          WebkitUserSelect: 'none', // Prevent text selection on focus
          touchAction: 'manipulation', // Prevent zoom on double-tap
          WebkitAppearance: 'none', // Remove iOS styling
          appearance: 'none',
          ...style
        }}
        className={className}
      />
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        color: '#888',
        fontSize: '14px',
        pointerEvents: 'none' // Prevent interference with input
      }}>
        <span style={{ color: getStatusColor() }}>📍</span>
      </div>
      <p style={{
        fontSize: '0.75rem',
        color: getStatusColor(),
        marginTop: '-0.75rem',
        marginBottom: '1rem'
      }}>
        {getStatusMessage()}
      </p>
      
      {/* Mobile-specific styles for Google Places autocomplete */}
      <style jsx global>{`
        /* Mobile optimizations for Google Places autocomplete */
        @media (max-width: 768px) {
          .pac-container {
            background-color: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid #ddd !important;
            margin-top: 4px !important;
            font-size: 16px !important; /* Prevent zoom on iOS */
            max-width: calc(100vw - 40px) !important;
            left: 20px !important;
            right: 20px !important;
            width: auto !important;
            z-index: 9999 !important;
          }
          
          .pac-item {
            padding: 12px 16px !important; /* Larger tap targets */
            border-bottom: 1px solid #f0f0f0 !important;
            font-size: 16px !important;
            line-height: 1.4 !important;
            cursor: pointer !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          
          .pac-item:hover,
          .pac-item-selected {
            background-color: #f8f9fa !important;
          }
          
          .pac-item-query {
            font-size: 16px !important;
            font-weight: 600 !important;
          }
          
          .pac-matched {
            color: #1a73e8 !important;
            font-weight: 600 !important;
          }
          
          /* Ensure autocomplete doesn't interfere with mobile viewport */
          .pac-container:after {
            content: '';
            display: block;
            height: env(safe-area-inset-bottom, 0);
          }
        }
        
        /* Ensure autocomplete works well with iOS keyboard */
        @supports (-webkit-touch-callout: none) {
          .pac-container {
            position: fixed !important;
            z-index: 9999 !important;
          }
          
          .pac-item {
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
          }
        }
      `}</style>
    </div>
  );
} 