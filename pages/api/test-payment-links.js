// API endpoint to test and validate payment method links
export default function handler(req, res) {
  const paymentUrls = {
    venmo: process.env.NEXT_PUBLIC_VENMO_URL || 'https://venmo.com/u/Bobby-Martin-64',
    cashapp: process.env.NEXT_PUBLIC_CASHAPP_URL || 'https://cash.app/$LiveCity',
    paypal: process.env.NEXT_PUBLIC_PAYPAL_URL || 'https://paypal.me/bmartin4659'
  };
  
  // Process Venmo URL
  let venmoFormatted = paymentUrls.venmo;
  if (venmoFormatted.includes('venmo.com/')) {
    const username = venmoFormatted.split('/').pop();
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    venmoFormatted = `https://venmo.com/u/${cleanUsername}`;
  }
  
  // Get CashApp username - we won't try to format a deep link as it's unreliable
  let cashappUsername = '$LiveCity';
  if (paymentUrls.cashapp.includes('cash.app/')) {
    let username = paymentUrls.cashapp.split('cash.app/').pop();
    if (username.includes('?')) {
      username = username.split('?')[0];
    }
    cashappUsername = username;
  }
  
  // Return all payment links with their processed versions
  res.status(200).json({
    success: true,
    originalUrls: paymentUrls,
    processedUrls: {
      venmo: venmoFormatted,
      cashapp: paymentUrls.cashapp,
      paypal: paymentUrls.paypal
    },
    usernames: {
      cashapp: cashappUsername
    },
    message: 'For CashApp, instruct users to open their app and send to the username directly'
  });
} 