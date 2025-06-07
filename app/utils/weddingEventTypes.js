'use client';

// NEW FILE TO BYPASS VERCEL CACHING - Wedding event types with proper filtering
// DEPLOYMENT TIMESTAMP: 2025-01-31 18:30 - Force deployment refresh for wedding forms

// List of wedding event types - includes all wedding-related events
export const WEDDING_EVENT_TYPES_V2 = [
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
export const WEDDING_KEYWORDS_V2 = [
  'wedding',
  'bridal',
  'engagement'
];

/**
 * Check if an event type is wedding-related
 * @param {string} eventType - The event type to check
 * @returns {boolean} - True if the event is wedding-related
 */
export function isWeddingEventV2(eventType) {
  if (!eventType) return false;
  
  // Check if it's in the list of exact wedding event types
  if (WEDDING_EVENT_TYPES_V2.includes(eventType)) {
    return true;
  }
  
  // Only check for very specific wedding-related prefixes
  const eventTypeLower = eventType.toLowerCase();
  
  // Check if it starts with a wedding keyword
  for (const prefix of WEDDING_KEYWORDS_V2) {
    if (eventTypeLower.startsWith(prefix)) {
      return true;
    }
  }
  
  // By default, not a wedding event
  return false;
}

/**
 * Get the base price for an event type
 * @param {string} eventType - The event type
 * @returns {number} - The base price for the event
 */
export function getBasePriceV2(eventType) {
  console.log('getBasePriceV2 called with:', eventType);
  
  // Special pricing for Wedding Ceremony & Reception - $1500
  if (eventType === 'Wedding Ceremony & Reception') {
    console.log('Returning $1500 for Wedding Ceremony & Reception');
    return 1500;
  }
  
  // Wedding Ceremony OR Wedding Reception separately - $1000 each
  if (eventType === 'Wedding Ceremony' || eventType === 'Wedding Reception') {
    console.log('Returning $1000 for individual wedding ceremony/reception:', eventType);
    return 1000;
  }
  
  // Wedding-related events that should be $1000
  const thousandDollarWeddingEvents = [
    'Bridal Shower',
  ];
  
  if (thousandDollarWeddingEvents.includes(eventType)) {
    console.log('Returning $1000 for wedding event:', eventType);
    return 1000;
  }
  
  // Specific event types that should be $500
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
    console.log('Returning $500 for event:', eventType);
    return 500;
  }
  
  console.log('Returning default $400 for event:', eventType);
  // Default for other events
  return 400;
} 