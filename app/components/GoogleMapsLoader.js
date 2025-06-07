'use client';

import { useEffect } from 'react';

export default function GoogleMapsLoader() {
  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      console.log('🗺️ Google Maps API already loaded');
      window.googleMapsLoaded = true;
      window.dispatchEvent(new CustomEvent('googleMapsReady'));
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log('🔄 Google Maps script already exists, waiting for load...');
      return;
    }

    console.log('🚀 Loading Google Maps API for Vercel deployment...');

    // Enhanced API key detection for Vercel deployment
    const getApiKey = () => {
      // Try multiple methods to get the API key
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const runtimeKey = typeof window !== 'undefined' && window.__GOOGLE_MAPS_API_KEY;
      const fallbackKey = 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc';
      
      const apiKey = envKey || runtimeKey || fallbackKey;
      console.log('🔑 API Key source:', {
        envKey: envKey ? `${envKey.substring(0, 10)}...` : 'not found',
        runtimeKey: runtimeKey ? `${runtimeKey.substring(0, 10)}...` : 'not found',
        using: apiKey ? `${apiKey.substring(0, 10)}...` : 'none'
      });
      
      return apiKey;
    };

    const script = document.createElement('script');
    const apiKey = getApiKey();
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=3.56&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Global callback for Google Maps
    window.initGoogleMapsCallback = () => {
      console.log('✅ Google Maps API loaded successfully via callback');
      window.googleMapsLoaded = true;
      window.dispatchEvent(new CustomEvent('googleMapsReady'));
      
      // Trigger custom event for AddressAutocomplete components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('googleMapsLoaded'));
      }, 100);
    };

    script.onload = () => {
      console.log('✅ Google Maps API script loaded successfully');
      // Fallback if callback doesn't fire
      setTimeout(() => {
        if (!window.googleMapsLoaded && window.google?.maps?.places) {
          console.log('🔧 Triggering manual Google Maps ready event');
          window.googleMapsLoaded = true;
          window.dispatchEvent(new CustomEvent('googleMapsReady'));
        }
      }, 1000);
    };

    script.onerror = (error) => {
      console.error('❌ Error loading Google Maps API:', error);
      console.error('🔑 Used API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
      window.googleMapsError = error;
      
      // Try loading without callback as fallback
      console.log('🔄 Attempting fallback load without callback...');
      const fallbackScript = document.createElement('script');
      fallbackScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=3.56`;
      fallbackScript.async = true;
      fallbackScript.defer = true;
      
      fallbackScript.onload = () => {
        console.log('✅ Google Maps API loaded via fallback method');
        window.googleMapsLoaded = true;
        window.dispatchEvent(new CustomEvent('googleMapsReady'));
      };
      
      document.head.appendChild(fallbackScript);
    };

    // Add to head for better loading
    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      
      // Clean up global callback
      if (window.initGoogleMapsCallback) {
        delete window.initGoogleMapsCallback;
      }
    };
  }, []);

  return null; // This component doesn't render anything
} 