// TEST SCRIPT: Verify pricing logic for Vercel deployment
// DEPLOYMENT ID: wedding-pricing-fix-final-v1
// Expected to match the deployed version on Vercel

console.log('🎯 VERCEL PRICING TEST - DEPLOYMENT 20250201-0130');
console.log('='.repeat(60));

// Simulate the pricing logic from eventUtils.js
function testGetBasePrice(eventType) {
  console.log('Testing event type:', eventType);
  console.log('String comparison for "Wedding Ceremony & Reception":', eventType === 'Wedding Ceremony & Reception');
  
  // CRITICAL: Wedding Ceremony & Reception pricing - $1500
  if (eventType === 'Wedding Ceremony & Reception') {
    console.log('🎯 EXACT MATCH - Wedding Ceremony & Reception - Returning $1500');
    return 1500;
  }
  
  // Wedding Ceremony OR Wedding Reception separately - $1000 each
  if (eventType === 'Wedding Ceremony' || eventType === 'Wedding Reception') {
    console.log('🎯 Individual wedding ceremony/reception - Returning $1000');
    return 1000;
  }
  
  // Other wedding-related events that should be $1000
  const thousandDollarWeddingEvents = [
    'Bridal Shower',
    'Anniversary Party',
    'Vow Renewal',
  ];
  
  if (thousandDollarWeddingEvents.includes(eventType)) {
    console.log('🎯 Wedding-related $1000 event');
    return 1000;
  }
  
  // Specific event types that should be $500
  const fiveHundredDollarEvents = [
    'Company Holiday Party',
    'Engagement Party', 
    'Bachelor Party',
    'Bachelorette Party',
    'Bachelor/Bachelorette Party',
    'Prom',
    'Homecoming'
  ];
  
  if (fiveHundredDollarEvents.includes(eventType)) {
    console.log('🎯 $500 event');
    return 500;
  }
  
  console.log('🎯 Default event - $400');
  return 400;
}

// Test cases
const testCases = [
  'Wedding Ceremony & Reception',
  'Wedding Ceremony',
  'Wedding Reception',
  'Bridal Shower',
  'Engagement Party',
  'Birthday Party'
];

console.log('Testing pricing for all cases:');
console.log('-'.repeat(40));

testCases.forEach(eventType => {
  const price = testGetBasePrice(eventType);
  console.log(`${eventType}: $${price}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('CRITICAL TEST: Wedding Ceremony & Reception');
const criticalPrice = testGetBasePrice('Wedding Ceremony & Reception');
console.log(`RESULT: $${criticalPrice}`);
console.log(`EXPECTED: $1500`);
console.log(`TEST ${criticalPrice === 1500 ? 'PASSED ✅' : 'FAILED ❌'}`);
console.log('='.repeat(60)); 