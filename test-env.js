// Test script to check environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('---------------------------');
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('NEXT_PUBLIC_BASE_URL exists:', !!process.env.NEXT_PUBLIC_BASE_URL);
console.log('NEXT_PUBLIC_FIREBASE_API_KEY exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('---------------------------');

// Check key prefixes (first 4 chars) without exposing full keys
if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.log('Stripe publishable key prefix:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 4));
}
if (process.env.STRIPE_SECRET_KEY) {
  console.log('Stripe secret key prefix:', process.env.STRIPE_SECRET_KEY.substring(0, 4));
}

// Check if dotenv is working correctly
console.log('\nDotenv config info:');
const dotenvResult = require('dotenv').config({ path: '.env.local' });
console.log('Dotenv parsed:', !!dotenvResult.parsed);
console.log('Dotenv error:', dotenvResult.error ? dotenvResult.error.message : 'None'); 