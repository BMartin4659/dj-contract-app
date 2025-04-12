'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        // Save payment details to Firestore
        await addDoc(collection(db, 'stripePayments'), {
          paymentIntentId: result.paymentIntent.id,
          amount: amount,
          currency: result.paymentIntent.currency,
          clientEmail: formData.email,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          timestamp: new Date()
        });
        
        onSuccess(result.paymentIntent.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    }
    setLoading(false);
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

export default function StripeCheckoutWrapper({ amount, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}