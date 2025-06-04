// Test pricing function
const eventType = 'Wedding Ceremony & Reception';

// Simulate the pricing logic
function testGetBasePrice(eventType) {
  console.log('Testing with:', eventType);
  
  // CRITICAL: Special pricing for Wedding Ceremony & Reception
  if (eventType === 'Wedding Ceremony & Reception') {
    console.log('MATCH: Returning $1500 for Wedding Ceremony & Reception');
    return 1500;
  }
  
  // Main wedding events (ceremony and reception)
  if (eventType === 'Wedding Ceremony' || eventType === 'Wedding Reception') {
    console.log('MATCH: Returning $1000 for main wedding event:', eventType);
    return 1000;
  }
  
  console.log('NO MATCH: Returning default $400');
  return 400;
}

console.log('=== PRICING TEST ===');
console.log('Testing "Wedding Ceremony & Reception"');
const result = testGetBasePrice('Wedding Ceremony & Reception');
console.log('Result:', result);
console.log('Expected: 1500');
console.log('Match:', result === 1500 ? 'YES' : 'NO');

console.log('\n=== COMPARISON TEST ===');
console.log('String comparison:');
console.log('"Wedding Ceremony & Reception" === "Wedding Ceremony & Reception":', 
  'Wedding Ceremony & Reception' === 'Wedding Ceremony & Reception');

console.log('\n=== CHARACTER CHECK ===');
const testString = 'Wedding Ceremony & Reception';
console.log('Length:', testString.length);
console.log('Characters:');
for (let i = 0; i < testString.length; i++) {
  console.log(`${i}: "${testString[i]}" (${testString.charCodeAt(i)})`);
} 