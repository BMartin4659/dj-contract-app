'use client';

import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, onSuccess, contractDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setLoading(true);
    setError(null);

    try {
      // Add timeout to prevent freezing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          clientEmail: contractDetails?.clientEmail || 'customer@example.com',
          eventType: contractDetails?.eventType || 'Event',
          eventDate: contractDetails?.eventDate || new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent: ' + await response.text());
      }

      const { clientSecret } = await response.json();
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) throw error;

      if (paymentIntent.status === 'succeeded') {
        await addDoc(collection(db, 'stripePayments'), {
          paymentIntentId: paymentIntent.id,
          amount: amount,
          currency: paymentIntent.currency,
          ...contractDetails,
          timestamp: new Date()
        });
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={!stripe || loading} style={{
        marginTop: '1rem',
        backgroundColor: '#2563eb',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer'
      }}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default function StripeCheckoutWrapper({ amount, onSuccess, contractDetails }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} contractDetails={contractDetails} />
    </Elements>
  );
}