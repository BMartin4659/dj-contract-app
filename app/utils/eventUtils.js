'use client';

// CRITICAL VERCEL DEPLOYMENT FIX: 2025-02-01 01:30:00 UTC - AGGRESSIVE CACHE BUST
// FORCE DEPLOYMENT TIMESTAMP: 20250201-0130-PRICING-FIX
// DEPLOYMENT ID: wedding-pricing-fix-final-v1
// This file has been COMPLETELY rewritten to fix Vercel caching issues

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
 * Check if an event type is wedding-related - FINAL VERSION 2025-02-01
 * @param {string} eventType - The event type to check
 * @returns {boolean} - True if the event is wedding-related
 */
export function isWeddingEvent(eventType) {
  console.log('eventUtils.isWeddingEvent - DEPLOYMENT 20250201-0130 - called with:', eventType);
  
  if (!eventType) {
    console.log('eventUtils.isWeddingEvent - No event type provided');
    return false;
  }
  
  // Check if it's in the list of exact wedding event types
  if (WEDDING_EVENT_TYPES.includes(eventType)) {
    console.log('eventUtils.isWeddingEvent - FOUND in WEDDING_EVENT_TYPES:', eventType);
    return true;
  }
  
  // Only check for very specific wedding-related prefixes
  const eventTypeLower = eventType.toLowerCase();
  
  // Check if it starts with a wedding keyword
  for (const prefix of WEDDING_KEYWORDS) {
    if (eventTypeLower.startsWith(prefix)) {
      console.log('eventUtils.isWeddingEvent - FOUND wedding keyword prefix:', prefix, 'in:', eventType);
      return true;
    }
  }
  
  console.log('eventUtils.isWeddingEvent - NOT a wedding event:', eventType);
  return false;
}

/**
 * Get the base price for an event type - FINAL DEPLOYMENT VERSION 2025-02-01
 * @param {string} eventType - The event type
 * @returns {number} - The base price for the event
 */
export function getBasePrice(eventType) {
  console.log('==== DEPLOYMENT 20250201-0130 - FINAL PRICING DEBUG ====');
  console.log('eventUtils.getBasePrice called with:', eventType);
  console.log('Type:', typeof eventType);
  console.log('Length:', eventType?.length);
  console.log('Exact string comparison test for "Wedding Ceremony & Reception":', eventType === 'Wedding Ceremony & Reception');
  
  // CRITICAL SECTION: Wedding Ceremony & Reception pricing - $1500
  if (eventType === 'Wedding Ceremony & Reception') {
    console.log('🎯 FINAL DEPLOYMENT: EXACT MATCH - Wedding Ceremony & Reception - Returning $1500');
    console.log('🎯 PRICING CONFIRMED: $1500 for Wedding Ceremony & Reception');
    return 1500;
  }
  
  // Wedding Ceremony OR Wedding Reception separately - $1000 each
  if (eventType === 'Wedding Ceremony' || eventType === 'Wedding Reception') {
    console.log('🎯 FINAL DEPLOYMENT: Individual wedding ceremony/reception - Returning $1000 for:', eventType);
    return 1000;
  }
  
  // Other wedding-related events that should be $1000
  const thousandDollarWeddingEvents = [
    'Bridal Shower',
    'Anniversary Party',
    'Vow Renewal',
  ];
  
  if (thousandDollarWeddingEvents.includes(eventType)) {
    console.log('🎯 FINAL DEPLOYMENT: Wedding-related $1000 event:', eventType);
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
    console.log('🎯 FINAL DEPLOYMENT: $500 event:', eventType);
    return 500;
  }
  
  // Check if it's any other wedding event
  if (isWeddingEvent(eventType)) {
    console.log('🎯 FINAL DEPLOYMENT: Other wedding event (generic) - Returning $1000 for:', eventType);
    return 1000;
  }
  
  console.log('🎯 FINAL DEPLOYMENT: Default event - Returning $400 for:', eventType);
  return 400;
}

// Export V2 functions as aliases for backwards compatibility
export const isWeddingEventV2 = isWeddingEvent;
export const getBasePriceV2 = getBasePrice;

// Force deployment cache invalidation
export const DEPLOYMENT_TIMESTAMP = '2025-02-01T01:30:00Z';
export const CACHE_BUST_ID = 'final-pricing-fix-20250201-0130'; 