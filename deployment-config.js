// FORCE VERCEL DEPLOYMENT - 2025-01-31 20:05
// This file forces Vercel to detect changes and rebuild the application
// Wedding event form cache-busting deployment

module.exports = {
  deploymentId: 'wedding-fix-20250131-2005',
  buildTime: new Date().toISOString(),
  cacheBustId: 'cb-20250131-2005',
  forceRebuild: true,
  
  // Wedding event types that must work on main contract form
  weddingEventTypes: [
    'Wedding Ceremony',
    'Wedding Reception', 
    'Wedding Ceremony & Reception',
    'Engagement Party',
    'Bridal Shower',
    'Bachelor/Bachelorette Party',
    'Anniversary Party',
    'Vow Renewal'
  ],
  
  // Expected pricing
  expectedPricing: {
    'Wedding Ceremony & Reception': 1500,
    'Wedding Ceremony': 1000,
    'Wedding Reception': 1000,
    'Bridal Shower': 1000,
    'Anniversary Party': 1000,
    'Vow Renewal': 1000,
    'Engagement Party': 500,
    'Bachelor/Bachelorette Party': 500
  }
}; 