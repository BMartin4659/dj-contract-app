'use client';

import { useEffect } from 'react';

export default function EnvTest() {
  useEffect(() => {
    // Log environment information to the console for verification
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('Firebase API Key (first 4 chars):', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 4) + '...' : 'Not set');
    console.log('Stripe Key (first 8 chars):', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8) + '...' : 'Not set');
  }, []);

  return (
    <div style={{ display: 'none' }}>
      {/* Hidden component that just logs environment variables */}
    </div>
  );
} 