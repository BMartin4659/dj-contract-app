// Constants and Pricing
export const SERVICES = {
  BASE: 400,
  LIGHTING: 100,
  PHOTOGRAPHY: 150,
  VIDEO_VISUALS: 100,
  ADDITIONAL_HOUR: 75,
};

// Payment method URL configurations
export const PAYMENT_URLS = {
  VENMO: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
  CASHAPP: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$LiveCity',
  PAYPAL: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659'
};

// Calculate total price based on selected services and event details
export const calculateTotal = (formData) => {
  let total = SERVICES.BASE;
  
  if (formData.includeLighting) total += SERVICES.LIGHTING;
  if (formData.includePhotography) total += SERVICES.PHOTOGRAPHY;
  if (formData.includeVideoVisuals) total += SERVICES.VIDEO_VISUALS;
  
  // Additional hours calculation
  const startTime = formData.eventStartTime ? new Date(`2000-01-01T${formData.eventStartTime}`) : null;
  const endTime = formData.eventEndTime ? new Date(`2000-01-01T${formData.eventEndTime}`) : null;
  
  if (startTime && endTime) {
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    
    // If more than 3 hours, charge for additional hours
    if (durationHours > 3) {
      const additionalHours = Math.ceil(durationHours - 3);
      total += additionalHours * SERVICES.ADDITIONAL_HOUR;
    }
  }
  
  return total;
};

// Calculate deposit amount (50% of total)
export const calculateDepositAmount = (total) => {
  return Math.round(total * 0.5);
};

// We won't use a direct URL for CashApp as deep linking isn't working reliably
export const getCashAppInfo = () => {
  const baseURL = PAYMENT_URLS.CASHAPP;
  const username = baseURL.includes('$') ? baseURL.split('cash.app/').pop() : 'LiveCity';
  
  // Format the CashApp payment URL properly
  // Cash App now uses a simpler format
  const formatPaymentUrl = (amount = 0) => {
    // Remove $ if it exists at the beginning
    const cleanUsername = username.startsWith('$') ? username.substring(1) : username;
    
    // Use the official format for Cash App
    return `https://cash.app/$${cleanUsername}`;
  };
  
  return {
    username: username,
    url: baseURL,
    formatPaymentUrl
  };
}; 