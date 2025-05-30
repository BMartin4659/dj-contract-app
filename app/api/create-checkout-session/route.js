import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with error handling and specify API version
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' // Use a specific API version
    })
  : null;

// Default base URL if environment variable is not set
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(request) {
  console.log('Checkout session request received');
  
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe is not properly initialized. Missing STRIPE_SECRET_KEY.');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    const { amount, contractDetails } = await request.json();
    
    console.log('Creating checkout session with:', {
      amount,
      contractDetails: {
        ...contractDetails,
        clientName: contractDetails?.clientName,
        email: contractDetails?.email,
      }
    });

    if (!amount) {
      console.error('Missing amount in request');
      return NextResponse.json(
        { error: 'Missing amount parameter' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session with improved configuration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `DJ Services - ${contractDetails?.eventType || 'Event'}`,
              description: `Event Date: ${contractDetails?.eventDate || 'TBD'}\nVenue: ${contractDetails?.venueName || 'TBD'}`,
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}?canceled=true`,
      customer_email: contractDetails?.email,
      metadata: {
        clientName: contractDetails?.clientName || '',
        email: contractDetails?.email || '',
        eventType: contractDetails?.eventType || '',
        eventDate: contractDetails?.eventDate || '',
        venueName: contractDetails?.venueName || '',
        venueLocation: contractDetails?.venueLocation || '',
        startTime: contractDetails?.startTime || '',
        endTime: contractDetails?.endTime || '',
        contactPhone: contractDetails?.contactPhone || '',
        guestCount: contractDetails?.guestCount || '',
        paymentAmount: contractDetails?.paymentAmount || 'full',
        isDeposit: contractDetails?.isDeposit ? 'true' : 'false',
        bookingId: contractDetails?.bookingId || '',
        additionalHours: contractDetails?.additionalHours || '0',
        lighting: contractDetails?.lighting ? 'true' : 'false',
        photography: contractDetails?.photography ? 'true' : 'false',
        videoVisuals: contractDetails?.videoVisuals ? 'true' : 'false'
      }
    });

    console.log('Checkout session created successfully:', session.id);
    
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url // Include the URL for direct redirection
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: error.message || 'Error creating checkout session',
        type: error.type,
        code: error.code 
      },
      { status: error.statusCode || 500 }
    );
  }
} 