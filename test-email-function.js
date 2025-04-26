// Test script for Firebase sendConfirmationEmail function
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test data for callable function
const testData = {
  clientName: 'Test User',
  email: process.env.TEST_EMAIL || 'therealdjbobbydrake@gmail.com', // Use your own email for testing
  eventType: 'Test Event',
  eventDate: '2025-05-01',
  venueName: 'Test Venue',
  venueLocation: 'Test Location',
  startTime: '18:00',
  endTime: '22:00',
  paymentId: 'test-payment-123',
  totalAmount: '100.00'
};

// Test the callable function (the one we use in our app)
async function testCallableFunction() {
  try {
    console.log('Testing callable function (httpsCallable)...');
    console.log('Using test data:', testData);
    
    // Get the callable function
    const sendEmail = httpsCallable(functions, 'sendConfirmationEmail');
    
    // Call the function
    const result = await sendEmail(testData);
    
    console.log('✅ Callable function success!');
    console.log('Result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error calling callable function:', error);
    if (error.code) console.error('Error code:', error.code);
    if (error.message) console.error('Error message:', error.message);
    if (error.details) console.error('Error details:', error.details);
    throw error;
  }
}

// Run the test
testCallableFunction().catch(console.error); 