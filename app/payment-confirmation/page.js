'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

export default function PaymentConfirmation() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        const paymentMethod = searchParams.get('paymentMethod');

        if (!bookingId || !paymentMethod) {
          setError('Missing required parameters');
          setStatus('error');
          return;
        }

        const response = await fetch('/api/payment-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            paymentMethod,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to confirm payment');
        }

        setStatus('success');
      } catch (err) {
        console.error('Error confirming payment:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    confirmPayment();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        {status === 'loading' && (
          <>
            <FaSpinner style={{
              fontSize: '3rem',
              color: '#0070f3',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem'
            }} />
            <h2>Confirming Your Payment...</h2>
            <p>Please wait while we process your confirmation.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle style={{
              fontSize: '3rem',
              color: '#00C244',
              marginBottom: '1rem'
            }} />
            <h2>Payment Confirmed!</h2>
            <p>Thank you for your payment. A confirmation email has been sent to your inbox.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              You can now close this window.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '3rem',
              color: '#dc2626',
              marginBottom: '1rem'
            }}>❌</div>
            <h2>Error Confirming Payment</h2>
            <p>{error || 'An unexpected error occurred. Please try again or contact support.'}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 