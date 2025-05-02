'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

/**
 * A reusable modal component for displaying information
 */
const Modal = ({
  title = 'Information',
  icon = <FaInfoCircle className="text-blue-500 mr-2" />,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  footer = null,
}) => {
  const [animateIn, setAnimateIn] = useState(false);
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      style={{
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl overflow-hidden shadow-xl w-full ${maxWidth}`}
        style={{
          transform: animateIn ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease-in-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center">
              {icon}
              <span>{title}</span>
            </h3>
            {showCloseButton && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            )}
          </div>
        )}

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Info modal for displaying simple text information
 */
export const InfoModal = ({ text, title, onClose }) => (
  <Modal title={title || "Information"} onClose={onClose}>
    <div className="text-gray-700 whitespace-pre-line">{text}</div>
  </Modal>
);

/**
 * Payment modal for displaying payment instructions
 */
export const PaymentModal = ({ htmlContent, title, onClose }) => (
  <Modal 
    title={title || "Payment Information"} 
    onClose={onClose}
    maxWidth="max-w-2xl"
  >
    <div 
      className="payment-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  </Modal>
);

export default Modal; 