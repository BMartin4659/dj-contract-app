'use client';

// EMERGENCY CACHE BYPASS: 2025-02-01 01:45:00 UTC - NEW FUNCTION NAMES
// FORCE COMPLETE CACHE INVALIDATION - VERCEL DEPLOYMENT EMERGENCY FIX
// DEPLOYMENT ID: emergency-pricing-fix-v2-20250201-0145
// Using completely new function names to bypass Vercel caching

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
 * EMERGENCY: New function name to bypass Vercel caching
 * Check if an event type is wedding-related - EMERGENCY FIX 2025-02-01
 * @param {string} eventType - The event type to check
 * @returns {boolean} - True if the event is wedding-related
 */
export function isWeddingEventEmergencyFix(eventType) {
  console.log('🚨 EMERGENCY: isWeddingEventEmergencyFix - DEPLOYMENT 20250201-0145 - called with:', eventType);
  
  if (!eventType) {
    console.log('🚨 EMERGENCY: No event type provided');
    return false;
  }
  
  // Check if it's in the list of exact wedding event types
  if (WEDDING_EVENT_TYPES.includes(eventType)) {
    console.log('🚨 EMERGENCY: FOUND in WEDDING_EVENT_TYPES:', eventType);
    return true;
  }
  
  // Only check for very specific wedding-related prefixes
  const eventTypeLower = eventType.toLowerCase();
  
  // Check if it starts with a wedding keyword
  for (const prefix of WEDDING_KEYWORDS) {
    if (eventTypeLower.startsWith(prefix)) {
      console.log('🚨 EMERGENCY: FOUND wedding keyword prefix:', prefix, 'in:', eventType);
      return true;
    }
  }
  
  console.log('🚨 EMERGENCY: NOT a wedding event:', eventType);
  return false;
}

/**
 * EMERGENCY: New function name to bypass Vercel caching
 * Get the base price for an event type - EMERGENCY DEPLOYMENT VERSION 2025-02-01
 * @param {string} eventType - The event type
 * @returns {number} - The base price for the event
 */
export function getBasePriceEmergencyFix(eventType) {
  console.log('🚨🚨🚨 EMERGENCY DEPLOYMENT 20250201-0145 - PRICING FIX 🚨🚨🚨');
  console.log('🚨 getBasePriceEmergencyFix called with:', eventType);
  console.log('🚨 Type:', typeof eventType);
  console.log('🚨 Length:', eventType?.length);
  console.log('🚨 Exact string comparison test for "Wedding Ceremony & Reception":', eventType === 'Wedding Ceremony & Reception');
  
  // CRITICAL SECTION: Wedding Ceremony & Reception pricing - $1500
  if (eventType === 'Wedding Ceremony & Reception') {
    console.log('🚨💰 EMERGENCY FIX: EXACT MATCH - Wedding Ceremony & Reception - Returning $1500');
    console.log('🚨💰 EMERGENCY CONFIRMED: $1500 for Wedding Ceremony & Reception');
    return 1500;
  }
  
  // Wedding Ceremony OR Wedding Reception separately - $1000 each
  if (eventType === 'Wedding Ceremony' || eventType === 'Wedding Reception') {
    console.log('🚨💰 EMERGENCY FIX: Individual wedding ceremony/reception - Returning $1000 for:', eventType);
    return 1000;
  }
  
  // Other wedding-related events that should be $1000
  const thousandDollarWeddingEvents = [
    'Bridal Shower',
  ];
  
  if (thousandDollarWeddingEvents.includes(eventType)) {
    console.log('🚨💰 EMERGENCY FIX: Wedding-related $1000 event:', eventType);
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
    console.log('🚨💰 EMERGENCY FIX: $500 event:', eventType);
    return 500;
  }
  
  // Check if it's any other wedding event
  if (isWeddingEventEmergencyFix(eventType)) {
    console.log('🚨💰 EMERGENCY FIX: Other wedding event (generic) - Returning $1000 for:', eventType);
    return 1000;
  }
  
  console.log('🚨💰 EMERGENCY FIX: Default event - Returning $400 for:', eventType);
  return 400;
}

// BACKWARD COMPATIBILITY: Keep old function names but route to new functions
export function isWeddingEvent(eventType) {
  return isWeddingEventEmergencyFix(eventType);
}

export function getBasePrice(eventType) {
  return getBasePriceEmergencyFix(eventType);
}

// Export V2 functions as aliases for backwards compatibility
export const isWeddingEventV2 = isWeddingEventEmergencyFix;
export const getBasePriceV2 = getBasePriceEmergencyFix;

// Force deployment cache invalidation with emergency timestamp
export const EMERGENCY_DEPLOYMENT_TIMESTAMP = '2025-02-01T01:45:00Z';
export const EMERGENCY_CACHE_BUST_ID = 'emergency-pricing-fix-v2-20250201-0145';
export const FORCE_VERCEL_REBUILD = true; 