'use client';

// List of all wedding-related event types - explicitly defined
export const WEDDING_EVENT_TYPES = [
  'Wedding Ceremony',
  'Wedding Reception',
  'Wedding Ceremony & Reception',
  'Engagement Party',
  'Bridal Shower',
  'Bachelor Party',
  'Bachelorette Party',
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
 * Check if an event type is wedding-related
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
 * Get the base price for an event type
 * @param {string} eventType - The event type
 * @returns {number} - The base price for the event
 */
export function getBasePrice(eventType) {
  if (isWeddingEvent(eventType)) {
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
    return 500;
  }
  
  // Default for other events
  return 400;
} 