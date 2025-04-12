'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(5);
  const searchParams = useSearchParams();
  const contractId = searchParams.get('id');
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f3f4f6',
    }}>
      <div style={{
        background: '#fff',
        padding: '2rem 3rem',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#22c55e', fontSize: '1.75rem' }}>✅ Payment Successful!</h1>
        <p style={{ marginTop: '1rem', color: '#333' }}>
          Your event has been booked successfully.
        </p>
        <p>A confirmation email and receipt have been sent to your email address.</p>
        <p style={{ marginTop: '1.5rem', color: '#2563eb' }}>
          Redirecting to homepage in {countdown} second{countdown !== 1 && 's'}...
        </p>
      </div>
    </div>
  );
}