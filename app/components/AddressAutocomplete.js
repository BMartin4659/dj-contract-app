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
          
          // Poll for the API to become available
          const checkInterval = setInterval(() => {
            if (window.google?.maps?.places?.Autocomplete) {
              console.log('Google Maps API detected via polling');
              clearInterval(checkInterval);
              resolve();
            }
          }, 500);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.google?.maps?.places?.Autocomplete) {
              reject(new Error('Google Maps API failed to load within timeout'));
            }
          }, 10000);
          
          return;
        }
        
        console.log('Loading Google Maps API directly...');
        
        // Load the script directly
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc&libraries=places&loading=async';
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

        // Add a small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Create autocomplete instance with comprehensive error handling
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'name', 'place_id', 'geometry']
          });

          // Add place changed listener
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
              }
            } catch (err) {
              console.error('Error in place_changed listener:', err);
            }
          });

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
        
        // Retry up to 3 times with increasing delays
        if (retryCount < 3) {
          console.log(`Retrying autocomplete initialization (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
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
        
        // Add a small delay after API is detected
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
  }, [name, onChange]);

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
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
        required={required}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          width: '100%',
          padding: 'clamp(12px, 2vw, 16px)',
          marginBottom: '1rem',
          borderRadius: '8px',
          border: `1px solid ${error ? '#e53e3e' : '#ccc'}`,
          color: 'black',
          transition: 'all 0.2s ease',
          fontSize: 'clamp(16px, 2.5vw, 18px)',
          ...style
        }}
        className={className}
      />
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        color: '#888',
        fontSize: '14px'
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
    </div>
  );
} 