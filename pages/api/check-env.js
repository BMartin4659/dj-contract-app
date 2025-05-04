export default function handler(req, res) {
  res.status(200).json({
    stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL
  });
} 