import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { 
      amount, 
      clientName, 
      email, 
      eventType, 
      eventDate, 
      venueName,
      lighting,
      photography,
      videoVisuals,
      additionalHours
    } = body;

    console.log("Create payment intent request body:", body);

    // Validate required fields
    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build service description
    let serviceDescription = `DJ Service for ${eventType || 'Event'} on ${eventDate || 'TBD'} at ${venueName || 'Venue'}`;
    const services = [];
    if (lighting) services.push('Lighting');
    if (photography) services.push('Photography');
    if (videoVisuals) services.push('Video Visuals');
    if (additionalHours > 0) services.push(`${additionalHours} Additional Hours`);
    
    if (services.length > 0) {
      serviceDescription += ` with ${services.join(', ')}`;
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'usd',
      description: serviceDescription,
      receipt_email: email,
      metadata: {
        clientName: clientName || '',
        eventType: eventType || '',
        eventDate: eventDate || '',
        venueName: venueName || '',
        lighting: lighting ? 'Yes' : 'No',
        photography: photography ? 'Yes' : 'No',
        videoVisuals: videoVisuals ? 'Yes' : 'No',
        additionalHours: additionalHours ? additionalHours.toString() : '0',
        totalAmount: (amount / 100).toFixed(2)
      }
    });

    console.log("Payment intent created:", paymentIntent.id, "for amount:", amount);

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