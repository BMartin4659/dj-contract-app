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
      color: 'white',
      backgroundImage: 'url(/images/dj-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Overlay to enhance text visibility */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        zIndex: 1
      }} />
      
      <div style={{
        backgroundColor: 'white',
        padding: '40px 50px',
        borderRadius: '20px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '92%',
        width: '700px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <Header />
        
        <div style={{ marginTop: '35px', marginBottom: '25px' }}>
          <FaCheckCircle style={{ color: '#22c55e', fontSize: '80px' }} />
        </div>
        
        <h1 style={{ 
          color: '#3b82f6', 
          marginBottom: '1.5rem', 
          fontSize: '2.75rem', 
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          letterSpacing: '-0.5px'
        }}>
          Payment Successful!
        </h1>
        
        <div style={{ 
          padding: '20px', 
          background: 'rgba(59, 130, 246, 0.08)', 
          borderRadius: '12px',
          marginBottom: '2rem' 
        }}>
          <p style={{ 
            fontSize: '1.4rem', 
            lineHeight: '1.6',
            color: '#333',
            fontWeight: '500'
          }}>
            Thank you for your payment. Your booking has been confirmed!
          </p>
          
          {paymentId && (
            <p style={{ 
              fontSize: '0.95rem', 
              color: '#4b5563',
              marginTop: '10px',
              fontWeight: '500'
            }}>
              Payment ID: {paymentId}
            </p>
          )}
        </div>
        
        <p style={{ 
          fontSize: '1.2rem', 
          lineHeight: '1.7',
          marginBottom: '2.5rem',
          color: '#4b5563',
        }}>
          We look forward to making your event special! A confirmation email has been sent with the details of your booking.
        </p>
        
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease'
        }}>
          <FaHome style={{ marginRight: '12px', fontSize: '1.2rem' }} />
          Secure Your Event Date
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
        padding: '35px',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 20px auto',
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '1.3rem', color: '#3b82f6', fontWeight: '500' }}>Loading payment details...</p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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