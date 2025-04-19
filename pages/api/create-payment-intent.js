import Stripe from 'stripe';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if it hasn't been initialized
let app;
try {
  app = initializeApp();
} catch (error) {
  if (!/already exists|duplicate app/.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
  }
}
const db = getFirestore();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { amount, clientName, email, eventType, eventDate, venueName } = req.body;
    
    // Validate input
    if (!amount) {
      return res.status(400).json({ error: 'Missing required payment information' });
    }

    // Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      description: `${eventType || 'DJ Service'} at ${venueName || 'Event Venue'} on ${eventDate || 'Event Date'}`,
      metadata: {
        clientName: clientName || 'Client',
        email: email || 'No email',
        eventType: eventType || 'DJ Service',
        eventDate: eventDate || 'No date provided',
        venueName: venueName || 'No venue provided'
      },
      receipt_email: email
    });

    // Store payment intent in Firestore
    await db.collection('paymentIntents').add({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      clientName: clientName || 'Client',
      email: email || 'No email',
      eventType: eventType || 'DJ Service',
      eventDate: eventDate || 'No date provided',
      venueName: venueName || 'No venue provided',
      status: paymentIntent.status,
      createdAt: new Date()
    });

    // Return client secret to the client
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Error creating payment',
      details: error.message 
    });
  }
}