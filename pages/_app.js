import '../app/globals.css'
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Log environment variables for debugging
    console.log('🔍 Environment Variables Check:');
    console.log('FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ LOADED' : '❌ MISSING');
    console.log('FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ LOADED' : '❌ MISSING');
    console.log('API Key starts with:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10));
  }, []);

  return <Component {...pageProps} />
} 