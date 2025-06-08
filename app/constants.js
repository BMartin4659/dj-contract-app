// Common URL constants for the application

// Payment method URL configurations
export const PAYMENT_URLS = {
  VENMO: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
  CASHAPP: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$LiveCity',
  PAYPAL: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659'
};

// Payment method icons and colors
export const PAYMENT_ICONS = {
  VENMO: 'venmo',
  CASHAPP: 'cashapp',
  PAYPAL: 'paypal',
  STRIPE: 'creditcard'
};

// Payment method display colors
export const PAYMENT_COLORS = {
  VENMO: '#3D95CE',
  CASHAPP: '#00C244',
  PAYPAL: '#0070BA',
  STRIPE: '#6772E5'
};

// Helper functions
export const getPaymentUrl = (method) => {
  if (!method) return '#';
  
  const methodUpper = method.toUpperCase();
  let url = PAYMENT_URLS[methodUpper] || '#';
  
  // Ensure CashApp URL is properly formatted
  if (methodUpper === 'CASHAPP') {
    // Extract username from URL
    let username = url.split('cash.app/').pop();
    
    // Make sure username starts with $
    if (!username.startsWith('$')) {
      username = `$${username}`;
    }
    
    // Properly formatted CashApp URL
    url = `https://cash.app/${username}`;
  }
  
  return url;
};

export const redirectToPayment = (method) => {
  if (!method) {
    console.error('No payment method provided');
    return;
  }
  
  console.log(`Redirecting to payment: ${method}`);
  
  // Special handling for Stripe
  if (method.toLowerCase() === 'stripe') {
    console.log('Attempting to dispatch Stripe checkout event');
    
    if (typeof window !== 'undefined') {
      try {
        // Method 1: Fire custom event
        const event = new CustomEvent('showStripeCheckout');
        window.dispatchEvent(event);
        console.log('Stripe checkout event dispatched successfully');
        
        // Method 2: Set global variable that can be checked by app
        window.__showStripeCheckout = true;
        
        // Method 3: Try to find and click the Stripe button directly
        setTimeout(() => {
          const stripeButtons = document.querySelectorAll('button');
          for (const button of stripeButtons) {
            if (button.textContent.includes('Credit Card') || 
                button.textContent.includes('Stripe') || 
                button.textContent.includes('Card') ||
                button.hasAttribute('data-stripe-button')) {
              console.log('Found Stripe button, clicking it:', button);
              button.click();
              return; // Exit after successful click
            }
          }
          console.log('No Stripe button found');
        }, 100);
      } catch (error) {
        console.error('Error dispatching Stripe event:', error);
      }
    }
    return;
  }
  
  // For other payment methods, get the URL and redirect
  const url = getPaymentUrl(method);
  console.log(`Payment URL for ${method}: ${url}`);
  
  if (url && url !== '#' && typeof window !== 'undefined') {
    console.log(`Navigating to: ${url}`);
    // Open in a new tab for better user experience
    window.open(url, '_blank');
  } else {
    console.error(`Invalid payment URL for ${method}`);
  }
}; 