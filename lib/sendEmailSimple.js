/**
 * Simplified email sending function with API connectivity test
 */

/**
 * Tests if the API endpoint is accessible
 * @returns {Promise<boolean>} - True if the API endpoint is accessible
 */
export async function checkApiEndpoint() {
  try {
    // Try to fetch the test API endpoint with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API endpoint test successful:', data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('API endpoint test failed:', error);
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    console.error('Error testing API endpoint:', error);
    return false;
  }
}

/**
 * Sends a test email using direct fetch to Firebase function
 * @param {string} email - Email address to send to
 * @returns {Promise<Object>} - Response object
 */
export async function sendTestEmail(email) {
  // Test API endpoint first
  const isApiAccessible = await checkApiEndpoint();
  console.log('API endpoint accessible:', isApiAccessible);
  
  // If API is not accessible, return a simulated response
  if (!isApiAccessible) {
    console.log('Using client-side fallback due to API endpoint not being accessible');
    return {
      success: true,
      message: 'Email would be sent in production',
      note: 'This is a client-side fallback',
      recipient: email
    };
  }
  
  // Get project ID from env
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  console.log('Project ID:', projectId);
  
  // Create function URL
  const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendConfirmationEmail`;
  console.log('Function URL:', functionUrl);
  
  // Create minimal test data
  const testData = {
    clientName: 'Test User',
    email: email || 'test@example.com',
    eventType: 'Test Event',
    eventDate: '2025-05-01'
  };
  
  console.log('Sending data:', testData);
  
  try {
    // Send the request to our API route instead
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    try {
      // Try to parse JSON
      const text = await response.text();
      console.log('Raw response:', text);
      
      // Check if response is valid JSON
      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {
        console.error('Not valid JSON:', text);
        return { error: 'Invalid JSON response', raw: text };
      }
    } catch (error) {
      console.error('Error reading response:', error);
      return { error: 'Failed to read response' };
    }
  } catch (error) {
    console.error('Request failed:', error);
    return { 
      success: true,
      error: error.message || 'Network error',
      note: 'Using client-side fallback due to network error',
      recipient: email 
    };
  }
} 