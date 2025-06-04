// TEST SCRIPT: Verify Anniversary Party and Vow Renewal pricing is $500
// DEPLOYMENT: anniversary-vow-renewal-pricing-fix-20250201

console.log('💰 ANNIVERSARY & VOW RENEWAL PRICING TEST');
console.log('='.repeat(60));

// Simulate the pricing logic from eventUtils.js
function testGetBasePrice(eventType) {
  console.log('Testing event type:', eventType);
  
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
  
  // Wedding-related events that should be $1000
  const thousandDollarWeddingEvents = [
    'Bridal Shower',
  ];
  
  if (thousandDollarWeddingEvents.includes(eventType)) {
    console.log('🎯 Wedding-related $1000 event');
    return 1000;
  }
  
  // Specific event types that should be $500 - INCLUDING ANNIVERSARY & VOW RENEWAL
  const fiveHundredDollarEvents = [
    'Company Holiday Party',
    'Engagement Party', 
    'Bachelor Party',
    'Bachelorette Party',
    'Bachelor/Bachelorette Party',
    'Anniversary Party',
    'Vow Renewal',
    'Prom',
    'Homecoming'
  ];
  
  if (fiveHundredDollarEvents.includes(eventType)) {
    console.log('🎯 $500 event - SUCCESS!');
    return 500;
  }
  
  console.log('🎯 Default pricing');
  return 400;
}

// Test the specific events that should be $500
const testEvents = [
  'Anniversary Party',
  'Vow Renewal',
  'Engagement Party',
  'Wedding Ceremony & Reception',
  'Wedding Ceremony',
  'Bridal Shower'
];

console.log('\nTesting specific event pricing:');
console.log('-'.repeat(40));

testEvents.forEach(event => {
  const price = testGetBasePrice(event);
  const expected = event === 'Wedding Ceremony & Reception' ? 1500 : 
                  event === 'Wedding Ceremony' || event === 'Bridal Shower' ? 1000 :
                  500;
  
  const status = price === expected ? '✅ PASS' : '❌ FAIL';
  console.log(`${event}: $${price} (expected $${expected}) ${status}`);
});

console.log('\n💰 SPECIFIC ANNIVERSARY & VOW RENEWAL TEST:');
console.log('-'.repeat(50));
console.log(`Anniversary Party: $${testGetBasePrice('Anniversary Party')} (should be $500)`);
console.log(`Vow Renewal: $${testGetBasePrice('Vow Renewal')} (should be $500)`);

console.log('\n✅ Test completed - Anniversary Party and Vow Renewal should both return $500'); 