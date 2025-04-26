// Script to verify payment links
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('============== Payment Links Verification ==============');

// Expected values
const expectedLinks = {
  Venmo: 'https://venmo.com/u/Bobby-Martin-64',
  CashApp: 'https://cash.app/$BobbyMartin64',
  PayPal: 'https://paypal.me/bmartin4659'
};

// Environment variables
console.log('\nChecking environment variables:');
console.log(`NEXT_PUBLIC_VENMO_URL: ${process.env.NEXT_PUBLIC_VENMO_URL || 'Not set'}`);
console.log(`NEXT_PUBLIC_CASHAPP_URL: ${process.env.NEXT_PUBLIC_CASHAPP_URL || 'Not set'}`);
console.log(`NEXT_PUBLIC_PAYPAL_URL: ${process.env.NEXT_PUBLIC_PAYPAL_URL || 'Not set'}`);

// Check if environment variables match expected values
console.log('\nVerifying environment variables match expected values:');
console.log(`Venmo: ${process.env.NEXT_PUBLIC_VENMO_URL === expectedLinks.Venmo ? '✅ Match' : '❌ Mismatch'}`);
console.log(`CashApp: ${process.env.NEXT_PUBLIC_CASHAPP_URL === expectedLinks.CashApp ? '✅ Match' : '❌ Mismatch'}`);
console.log(`PayPal: ${process.env.NEXT_PUBLIC_PAYPAL_URL === expectedLinks.PayPal ? '✅ Match' : '❌ Mismatch'}`);

// Check code files for payment URLs
const filesToCheck = [
  'app/payment/success/page.js',
  'app/page.js',
  'app/page.js.fixed',
  'components/DJContractForm.js'
];

console.log('\nChecking payment URLs in code files:');

filesToCheck.forEach(filePath => {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    console.log(`\nChecking ${filePath}:`);
    
    // Check for Venmo URL
    const venmoMatch = content.includes(expectedLinks.Venmo);
    console.log(`- Venmo URL: ${venmoMatch ? '✅ Found' : '❌ Not found'}`);
    
    // Check for CashApp URL
    const cashAppMatch = content.includes(expectedLinks.CashApp);
    console.log(`- CashApp URL: ${cashAppMatch ? '✅ Found' : '❌ Not found'}`);
    
    // Check for PayPal URL
    const paypalMatch = content.includes(expectedLinks.PayPal);
    console.log(`- PayPal URL: ${paypalMatch ? '✅ Found' : '❌ Not found'}`);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
});

console.log('\n============== Manual Test Steps ==============');
console.log('1. Ensure the local server is running (npm run dev)');
console.log('2. Navigate to http://localhost:3000 in your browser');
console.log('3. Fill out the DJ Contract form with test data');
console.log('4. Test each payment method to verify the correct URL opens:');
console.log(`   - Venmo: ${expectedLinks.Venmo}`);
console.log(`   - CashApp: ${expectedLinks.CashApp}`);
console.log(`   - PayPal: ${expectedLinks.PayPal}`);
console.log('5. Submit the form and check the success page for payment options');
console.log('================================================='); 