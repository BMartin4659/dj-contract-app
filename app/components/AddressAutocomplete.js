'use client';

import { useEffect, useRef, useState } from 'react';

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter venue address",
  name = "venueLocation",
  required = true,
  style = {},
  className = "",
  inputStyle = {}
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Client-side detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !inputRef.current) return;

    let isComponentMounted = true;

    const loadGoogleMapsAPI = async () => {
      // Check if already loaded
      if (window.google?.maps?.places?.Autocomplete) {
        return true;
      }
      
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.google?.maps?.places?.Autocomplete) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(!!window.google?.maps?.places?.Autocomplete);
          }, 10000);
        });
      }
      
      // Load new script
      return new Promise((resolve, reject) => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc';
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setTimeout(() => {
            resolve(!!window.google?.maps?.places?.Autocomplete);
          }, 500);
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps API'));
        };
        
        document.head.appendChild(script);
      });
    };

    const initializeAutocomplete = async () => {
      try {
        if (!isComponentMounted || !inputRef.current) return;

        // Skip if already initialized
        if (autocompleteRef.current) return;

        console.log('Initializing address autocomplete...');

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'name', 'place_id']
          }
        );

        autocomplete.addListener('place_changed', () => {
          if (!isComponentMounted) return;
          
          const place = autocomplete.getPlace();
          if (place?.formatted_address && onChange) {
            onChange({
              target: {
                name: name,
                value: place.formatted_address
              }
            });
          }
        });

        autocompleteRef.current = autocomplete;
        setIsReady(true);
        setError(null);
        console.log('Address autocomplete initialized successfully');
      } catch (err) {
        console.error('Error initializing autocomplete:', err);
        setError('Address suggestions temporarily unavailable');
      }
    };

    const setupAutocomplete = async () => {
      try {
        const loaded = await loadGoogleMapsAPI();
        if (loaded && isComponentMounted) {
          await initializeAutocomplete();
        }
      } catch (err) {
        console.error('Error setting up autocomplete:', err);
        setError('Address suggestions temporarily unavailable');
      }
    };

    setupAutocomplete();

    return () => {
      isComponentMounted = false;
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isClient, onChange, name]);

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Create combined styles - prioritize inputStyle over default styles
  const combinedStyle = {
    fontSize: '16px', // Prevent zoom on iOS
    ...inputStyle, // Apply inputStyle first
    ...style // Apply any additional style overrides
  };

  // Render nothing on server-side to prevent hydration issues
  if (!isClient) {
    return (
      <input
        type="text"
        placeholder={placeholder}
        style={combinedStyle}
        className={className}
      />
    );
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        autoComplete="address-line1"
        style={combinedStyle}
        className={className}
      />
      
      {error && (
        <p className="text-red-500 text-xs italic mt-1">{error}</p>
      )}
      
      {!isReady && !error && (
        <p className="text-gray-500 text-xs mt-1">Loading address suggestions...</p>
      )}
    </div>
  );
} 