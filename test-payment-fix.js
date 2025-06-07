const fetch = require('node-fetch');

async function testPaymentFix() {
  console.log('🧪 Testing payment fix...');
  
  try {
    // Test data that matches what the form would send
    const testPaymentData = {
      amount: 92500, // $925 in cents
      contractDetails: {
        clientName: 'John Doe',
        email: 'test@example.com',
        eventType: 'Wedding',
        eventDate: '2025-06-07',
        venueName: 'Test Venue',
        venueLocation: '123 Main St, Test City, ST 12345',
        bookingId: 'TEST123'
      }
    };
    
    console.log('📤 Sending payment request with data:', testPaymentData);
    
    const response = await fetch('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPaymentData)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Checkout session created:', {
        sessionId: result.sessionId,
        hasUrl: !!result.url,
        urlPreview: result.url ? result.url.substring(0, 50) + '...' : 'No URL'
      });
    } else {
      const error = await response.json();
      console.log('❌ FAILED! Error response:', error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test with missing amount (old broken way)
async function testMissingAmount() {
  console.log('\n🧪 Testing with missing amount (should fail)...');
  
  try {
    const badPaymentData = {
      // Missing amount field
      contractDetails: {
        clientName: 'John Doe',
        email: 'test@example.com',
        totalAmount: 925 // This is in the wrong place
      }
    };
    
    console.log('📤 Sending bad request:', badPaymentData);
    
    const response = await fetch('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(badPaymentData)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      console.log('❌ UNEXPECTED: Bad request succeeded');
    } else {
      const error = await response.json();
      console.log('✅ EXPECTED: Bad request failed with:', error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run tests
(async () => {
  await testPaymentFix();
  await testMissingAmount();
})(); 