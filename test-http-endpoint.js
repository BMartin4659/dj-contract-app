const fetch = require('node-fetch');

async function testEmailEndpoint() {
  const url = 'https://us-central1-dj-contract-app.cloudfunctions.net/sendConfirmationEmailHttp';
  const data = {
    clientName: 'Test User',
    email: 'therealdjbobbydrake@gmail.com',
    eventType: 'Test Event',
    eventDate: '2025-05-01',
    venueName: 'Test Venue',
    venueLocation: 'Test Location'
  };

  try {
    console.log('Sending test email...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmailEndpoint(); 