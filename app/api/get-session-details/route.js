import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with error handling and specify API version
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })
  : null;

export async function GET(request) {
  // Get session_id from query params
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  
  console.log('Fetching session details for:', sessionId);
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id parameter' },
      { status: 400 }
    );
  }
  
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe is not properly initialized. Missing STRIPE_SECRET_KEY.');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    // Fetch the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items', 'customer']
    });
    
    console.log('Session retrieved successfully:', session.id);
    
    // Extract relevant payment details
    const paymentDetails = {
      sessionId: session.id,
      payment_intent: session.payment_intent?.id,
      customer_id: session.customer?.id,
      customer_email: session.customer_email || session.customer?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: session.status,
      metadata: session.metadata || {},
      payment_method_types: session.payment_method_types || ['card'],
      // If there are line items, get the first one's details
      item_name: session.line_items?.data[0]?.description || 'DJ Services',
      created_at: new Date(session.created * 1000).toISOString(),
    };
    
    return NextResponse.json(paymentDetails);
  } catch (error) {
    console.error('Error fetching session details:', error);
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: error.message || 'Error fetching session details',
        type: error.type,
        code: error.code 
      },
      { status: error.statusCode || 500 }
    );
  }
} 