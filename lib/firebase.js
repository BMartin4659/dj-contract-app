// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate required Firebase configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('Missing required Firebase environment variables:', missingEnvVars);
  console.warn('Please check your .env.local file and ensure all Firebase credentials are properly set.');
} else {
  console.log('✅ All Firebase environment variables loaded successfully');
}

// Initialize Firebase only if no apps exist (prevents duplicate initialization)
let app;
let db;
let auth;
let functions;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  
  // Initialize services with error handling
  db = getFirestore(app);
  
  // Make auth optional for now - only initialize if API key is valid
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY') {
    try {
      auth = getAuth(app);
    } catch (authError) {
      console.warn('Firebase Auth initialization failed:', authError.message);
      console.warn('Continuing without authentication features...');
      auth = null;
    }
  } else {
    console.warn('Firebase API key not configured properly. Auth disabled.');
    auth = null;
  }
  
  functions = getFunctions(app);
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create fallback objects to prevent app crashes
  db = null;
  auth = null;
  functions = null;
}

export { db, auth, functions };
export default app;