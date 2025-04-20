'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaHome } from 'react-icons/fa';
import Link from 'next/link';
import Header from '@/components/Header';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState('');

  useEffect(() => {
    // Get the payment ID from the URL
    const id = searchParams.get('id');
    if (id) {
      setPaymentId(id);
    }
  }, [searchParams]);

  return (
    <div className="main-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
      color: 'white'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        maxWidth: '90%',
        width: '600px',
        textAlign: 'center'
      }}>
        <Header />
        
        <div style={{ marginTop: '30px', marginBottom: '20px' }}>
          <FaCheckCircle style={{ color: '#22c55e', fontSize: '64px' }} />
        </div>
        
        <h1 style={{ 
          color: '#3b82f6', 
          marginBottom: '1.5rem', 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
          Payment Successful!
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          lineHeight: '1.6',
          marginBottom: '1rem',
          color: '#333',
          fontWeight: '500'
        }}>
          Thank you for your payment. Your booking has been confirmed!
        </p>
        
        {paymentId && (
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            marginBottom: '2rem'
          }}>
            Payment ID: {paymentId}
          </p>
        )}
        
        <p style={{ 
          fontSize: '1.1rem', 
          lineHeight: '1.6',
          marginBottom: '2rem',
          color: '#333',
        }}>
          We look forward to making your event special! A confirmation email has been sent with the details of your booking.
        </p>
        
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease'
        }}>
          <FaHome style={{ marginRight: '8px' }} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingPaymentSuccess() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.2rem', color: '#3b82f6' }}>Loading payment details...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingPaymentSuccess />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 