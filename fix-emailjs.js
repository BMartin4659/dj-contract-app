/**
 * EmailJS Fix Script
 * 
 * This script helps fix the EmailJS integration issues in the DJ Contract App.
 * 
 * 1. Creates/updates the .env.local file with proper EmailJS configuration
 * 2. Ensures the public key is properly set
 * 
 * Usage:
 * - Run with: node fix-emailjs.js YOUR_PUBLIC_KEY
 */

const fs = require('fs');
const path = require('path');

// Check if public key is provided
if (process.argv.length < 3) {
  console.error('\x1b[31mError: Please provide your EmailJS public key as an argument.\x1b[0m');
  console.log('Example: node fix-emailjs.js YOUR_PUBLIC_KEY');
  process.exit(1);
}

const publicKey = process.argv[2];

// Create .env.local file content
const envContent = `# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_9z9konq
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_booking_confirmation
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=${publicKey}

# Existing Google Maps API Key (preserving if it exists)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE'}
`;

try {
  // Write to .env.local file
  fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
  
  console.log('\x1b[32mSuccess: .env.local file has been created/updated with your EmailJS configuration.\x1b[0m');
  console.log('\x1b[32mRestart your development server for changes to take effect.\x1b[0m');
  
  // Check for common issues
  console.log('\n\x1b[34mVerifying components that use EmailJS:\x1b[0m');
  
  let stripeCheckoutPath = path.join(process.cwd(), 'components', 'StripeCheckout.js');
  let successPagePath = path.join(process.cwd(), 'app', 'payment', 'success', 'page.js');
  
  if (fs.existsSync(stripeCheckoutPath)) {
    console.log('\x1b[32m✓ StripeCheckout.js found.\x1b[0m');
  } else {
    console.log('\x1b[33m⚠ StripeCheckout.js not found at expected location.\x1b[0m');
  }
  
  if (fs.existsSync(successPagePath)) {
    console.log('\x1b[32m✓ Payment success page found.\x1b[0m');
  } else {
    console.log('\x1b[33m⚠ Payment success page not found at expected location.\x1b[0m');
  }
  
  console.log('\n\x1b[34mNext steps:\x1b[0m');
  console.log('1. Run \x1b[33mnpm run dev\x1b[0m to restart the development server');
  console.log('2. Test the email functionality');
  console.log('3. For any remaining issues, check browser console for detailed error messages');
  
} catch (error) {
  console.error('\x1b[31mError creating .env.local file:\x1b[0m', error.message);
  process.exit(1);
} 