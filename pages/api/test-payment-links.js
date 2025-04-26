// API endpoint to test and validate payment method links
export default function handler(req, res) {
  const paymentUrls = {
    venmo: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
    cashapp: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$BobbyMartin64',
    paypal: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659'
  };
  
  // Process Venmo URL
  let venmoFormatted = paymentUrls.venmo;
  if (venmoFormatted.includes('venmo.com/')) {
    const username = venmoFormatted.split('/').pop();
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    venmoFormatted = `https://venmo.com/u/${cleanUsername}`;
  }
  
  // Process CashApp URL
  let cashappFormatted = paymentUrls.cashapp;
  if (cashappFormatted.includes('cash.app/')) {
    let username = cashappFormatted.split('cash.app/').pop();
    if (!username.startsWith('$')) {
      username = `$${username}`;
    }
    cashappFormatted = `https://cash.app/${username}`;
  }
  
  // Return all payment links with their processed versions
  res.status(200).json({
    success: true,
    originalUrls: paymentUrls,
    processedUrls: {
      venmo: venmoFormatted,
      cashapp: cashappFormatted,
      paypal: paymentUrls.paypal
    },
    message: 'Use these processed URLs to ensure payment links work correctly'
  });
} 