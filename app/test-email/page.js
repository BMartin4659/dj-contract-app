'use client';

import React, { useState } from 'react';
import { sendTestEmail } from '@/lib/sendEmailSimple';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Sending test email to:', email);
      const response = await sendTestEmail(email);
      console.log('Test email response:', response);
      setResult(response);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Email Function</h1>
      <p>Use this page to test the Firebase Cloud Function for sending emails.</p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Email Address:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
      </form>
      
      {error && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#fee2e2', 
          border: '1px solid #ef4444',
          borderRadius: '4px',
          color: '#b91c1c'
        }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: result.success ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${result.success ? '#22c55e' : '#ef4444'}`,
          borderRadius: '4px'
        }}>
          <h3>Result:</h3>
          <pre style={{ 
            background: '#f1f5f9', 
            padding: '1rem',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '3rem' }}>
        <h2>Debug Information</h2>
        <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not found'}</p>
        <p>Function URL: {`https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown'}.cloudfunctions.net/sendConfirmationEmail`}</p>
      </div>
    </div>
  );
} 