'use client';

import { useState } from 'react';

export default function EnvChecker() {
  const [showEnvDetails, setShowEnvDetails] = useState(false);
  
  // Extract relevant parts of keys to avoid showing full values
  const envInfo = {
    environment: process.env.NODE_ENV,
    firebase: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 5)}...` : 'Not set',
    },
    stripe: {
      key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
        `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...` : 'Not set',
    },
  };

  return (
    <div className="env-checker">
      <div className="env-status">
        <span className="env-badge">
          {process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD'}
        </span>
        <button 
          onClick={() => setShowEnvDetails(!showEnvDetails)}
          className="env-details-button"
        >
          {showEnvDetails ? 'Hide Details' : 'Show Environment Details'}
        </button>
      </div>
      
      {showEnvDetails && (
        <div className="env-details">
          <h3>Environment Configuration</h3>
          <ul>
            <li>Environment: <strong>{envInfo.environment}</strong></li>
            <li>Firebase Project: <strong>{envInfo.firebase.projectId}</strong></li>
            <li>Firebase API Key: <strong>{envInfo.firebase.apiKey}</strong></li>
            <li>Stripe Key: <strong>{envInfo.stripe.key}</strong></li>
          </ul>
          <p className="env-note">Note: Only partial key information is shown for security reasons.</p>
        </div>
      )}
      
      <style jsx>{`
        .env-checker {
          margin: 1rem 0;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
        }
        
        .env-status {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .env-badge {
          background-color: ${process.env.NODE_ENV === 'development' ? '#339af0' : '#20c997'};
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: bold;
          font-size: 0.75rem;
        }
        
        .env-details-button {
          background-color: transparent;
          border: 1px solid #ced4da;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .env-details {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: white;
          border-radius: 0.25rem;
          border: 1px solid #e9ecef;
        }
        
        .env-details h3 {
          margin-top: 0;
          font-size: 1rem;
        }
        
        .env-details ul {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        
        .env-note {
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
} 