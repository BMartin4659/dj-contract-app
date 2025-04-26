// Test data for form submission
const formData = {
  clientName: 'Test Client',
  email: 'test@example.com',
  contactPhone: '1234567890',
  eventType: 'Wedding',
  guestCount: '100',
  venueName: 'Test Venue',
  venueLocation: '123 Test St, City, State 12345',
  eventDate: '2025-05-15',
  startTime: '6:00 PM',
  endTime: '10:00 PM',
  paymentMethod: 'Venmo',
  lighting: true,
  photography: false,
  videoVisuals: true,
  agreeToTerms: true,
  additionalHours: 2
};

// Output test information
console.log('============== DJ Contract App Test Information ==============');
console.log('\nForm data to fill manually:');
Object.entries(formData).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

console.log('\nPayment method URLs to verify:');
console.log('Venmo URL: https://venmo.com/u/Bobby-Martin-64');
console.log('CashApp URL: https://cash.app/$BobbyMartin64');
console.log('PayPal URL: https://paypal.me/bmartin4659');

console.log('\nTest Instructions:');
console.log('1. Open a browser and navigate to http://localhost:3000');
console.log('2. Fill in the form with the data provided above');
console.log('3. Select different payment methods to verify they open the correct URLs');
console.log('4. Submit the form to test email sending and confirmation page');
console.log('\n============================================================'); 