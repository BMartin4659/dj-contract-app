'use client';

// FORCE VERCEL DEPLOYMENT REFRESH - 2025-01-31 20:30
// CRITICAL CACHE BUSTING: DEBUGGING - Added detailed logging to track pricing
// Updated to consolidate V2 logic into main functions to avoid import issues

// List of wedding event types - all wedding-related events from dropdown
export const WEDDING_EVENT_TYPES = [
  'Wedding Ceremony',
  'Wedding Reception',
  'Wedding Ceremony & Reception',
  'Engagement Party',
  'Bridal Shower',
  'Bachelor/Bachelorette Party',
  'Anniversary Party',
  'Vow Renewal',
];

// Very specific wedding keywords - only used for exact matching
export const WEDDING_KEYWORDS = [
  'wedding',
  'bridal',
  'engagement'
];

/**
 * Check if an event type is wedding-related - CONSOLIDATED V2 LOGIC
 * @param {string} eventType - The event type to check
 * @returns {boolean} - True if the event is wedding-related
 */
export function isWeddingEvent(eventType) {
  if (!eventType) return false;
  
  // Check if it's in the list of exact wedding event types
  if (WEDDING_EVENT_TYPES.includes(eventType)) {
    return true;
  }
  
  // Only check for very specific wedding-related prefixes
  const eventTypeLower = eventType.toLowerCase();
  
  // Check if it starts with a wedding keyword
  for (const prefix of WEDDING_KEYWORDS) {
    if (eventTypeLower.startsWith(prefix)) {
      return true;
    }
  }
  
  // By default, not a wedding event
  return false;
}

/**
 * Get the base price for an event type - CONSOLIDATED V2 LOGIC
 * @param {string} eventType - The event type
 * @returns {number} - The base price for the event
 */
export function getBasePrice(eventType) {
  console.log('=== DETAILED PRICING DEBUG ===');
  console.log('eventUtils.getBasePrice called with:', eventType);
  console.log('Type of eventType:', typeof eventType);
  console.log('Length of eventType:', eventType?.length);
  
  // CRITICAL: Special pricing for Wedding Ceremony & Reception
  if (eventType === 'Wedding Ceremony & Reception') {
    console.log('✅ EXACT MATCH: Wedding Ceremony & Reception - Returning $1500');
    return 1500;
  } else {
    console.log('❌ NO EXACT MATCH for Wedding Ceremony & Reception');
    console.log('Comparison result:', eventType === 'Wedding Ceremony & Reception');
  }
  
  // Main wedding events (ceremony and reception)
  if (eventType === 'Wedding Ceremony' || eventType === 'Wedding Reception') {
    console.log('V2-LOGIC: Returning $1000 for main wedding event:', eventType);
    return 1000;
  }
  
  // Wedding-related events that should be $1000
  const thousandDollarWeddingEvents = [
    'Bridal Shower',
    'Anniversary Party',
    'Vow Renewal',
  ];
  
  if (thousandDollarWeddingEvents.includes(eventType)) {
    console.log('V2-LOGIC: Returning $1000 for wedding-related event:', eventType);
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
    console.log('V2-LOGIC: Returning $500 for event:', eventType);
    return 500;
  }
  
  // Check if it's any other wedding event
  if (isWeddingEvent(eventType)) {
    console.log('V2-LOGIC: Returning $1000 for other wedding event:', eventType);
    return 1000;
  }
  
  console.log('V2-LOGIC: Returning default $400 for event:', eventType);
  // Default for other events
  return 400;
}

// Export V2 functions as aliases for backwards compatibility
export const isWeddingEventV2 = isWeddingEvent;
export const getBasePriceV2 = getBasePrice; 