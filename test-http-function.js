// Test script for Firebase sendConfirmationEmailHttp function
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testHttpFunction() {
  try {
    console.log('Testing HTTP email function...');
    
    // Get Firebase project ID from env vars
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID not found in .env.local');
    }
    
    // Construct function URL
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendConfirmationEmailHttp`;
    console.log('Function URL:', functionUrl);
    
    // Create test data
    const testData = {
      clientName: 'Test User',
      email: process.env.TEST_EMAIL || 'therealdjbobbydrake@gmail.com', // Use your email for testing
      eventType: 'Test Event',
      eventDate: '2025-05-01',
      venueName: 'Test Venue',
      venueLocation: 'Test Location',
      startTime: '18:00',
      endTime: '22:00',
      paymentId: 'test-payment-123',
      totalAmount: '100.00'
    };
    
    console.log('Sending test data:', testData);
    
    // Call the function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ HTTP function call successful!');
    } else {
      console.log('❌ HTTP function call failed!');
    }
    
    return responseData;
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
}

// Run the test
testHttpFunction().catch(console.error); 