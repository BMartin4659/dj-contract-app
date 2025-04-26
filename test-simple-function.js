// Test script for simple Firebase function
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

// Test data
const testData = {
  message: 'Hello from test script',
  timestamp: new Date().toISOString()
};

// Test the callable function (the one we use in our app)
async function testSimpleFunction() {
  try {
    console.log('Testing simple test function (httpsCallable)...');
    console.log('Using test data:', testData);
    
    // Get the callable function
    const testFunction = httpsCallable(functions, 'testEmailFunction');
    
    // Call the function
    const result = await testFunction(testData);
    
    console.log('✅ Simple function success!');
    console.log('Result:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error calling simple function:', error);
    if (error.code) console.error('Error code:', error.code);
    if (error.message) console.error('Error message:', error.message);
    if (error.details) console.error('Error details:', error.details);
    throw error;
  }
}

// Run the test
testSimpleFunction().catch(console.error); 