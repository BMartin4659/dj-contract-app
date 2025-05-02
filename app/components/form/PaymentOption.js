'use client';

import React from 'react';

/**
 * A payment option component for selecting payment methods
 */
const PaymentOption = ({ method, isSelected, onSelect, color, icon = null }) => (
  <div 
    onClick={onSelect}
    className="payment-option-item"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '18px',
      borderRadius: '8px',
      border: isSelected ? `2px solid ${color || '#0070f3'}` : '1px solid #ddd',
      backgroundColor: isSelected ? (color ? `${color}10` : 'rgba(0, 112, 243, 0.05)') : 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? `0 4px 8px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <input
      type="radio"
      name="paymentMethod"
      value={method}
      checked={isSelected}
      onChange={() => {}}
      style={{ display: 'none' }}
    />
    <div style={{ 
      fontWeight: isSelected ? '600' : '400',
      color: isSelected ? (color || '#0070f3') : '#333',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {icon && <span className="payment-icon">{icon}</span>}
      {method}
    </div>
  </div>
);

export default PaymentOption; 