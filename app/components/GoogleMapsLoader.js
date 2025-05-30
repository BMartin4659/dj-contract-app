'use client';

import { useEffect } from 'react';

export default function GoogleMapsLoader() {
  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      console.log('Google Maps API already loaded');
      window.googleMapsLoaded = true;
      window.dispatchEvent(new CustomEvent('googleMapsReady'));
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log('Google Maps script already exists, waiting for load...');
      return;
    }

    console.log('Loading Google Maps API...');

    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc&libraries=places';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      window.googleMapsLoaded = true;
      window.dispatchEvent(new CustomEvent('googleMapsReady'));
    };

    script.onerror = (error) => {
      console.error('Error loading Google Maps API:', error);
      window.googleMapsError = error;
    };

    // Add to head for better loading
    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  return null; // This component doesn't render anything
} 