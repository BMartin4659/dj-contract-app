import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { amount, clientName, email, eventType, eventDate, venueName } = body;

    // Validate required fields
    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'usd',
      description: `DJ Service for ${eventType || 'Event'} on ${eventDate || 'TBD'} at ${venueName || 'Venue'}`,
      receipt_email: email,
      metadata: {
        clientName: clientName || '',
        eventType: eventType || '',
        eventDate: eventDate || '',
        venueName: venueName || ''
      }
    });

    // Return the client secret to the client
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating payment intent' },
      { status: 500 }
    );
  }
} 