'use client';
import { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { WEDDING_EVENT_TYPES_V2, getBasePriceV2 } from '../utils/weddingEventTypes';

// Filter to only include events that contain the word "wedding"
const WEDDING_ONLY_EVENT_TYPES = WEDDING_EVENT_TYPES_V2.filter(eventType => 
  eventType.toLowerCase().includes('wedding')
);

// Only wedding-related event types - Using V2 to bypass caching
const WEDDING_EVENT_OPTIONS = [
  {
    category: '💍 Wedding Events',
    options: WEDDING_ONLY_EVENT_TYPES,
  }
];

export default function WeddingEventTypeDropdown({
  value,
  onChange,
  onPriceUpdate,
  error,
  name
}) {
  const [selected, setSelected] = useState(value || '');
  const [priceNote, setPriceNote] = useState('');

  // DEBUG: Log the wedding event types being used
  console.log('WeddingEventTypeDropdown - WEDDING_EVENT_TYPES_V2:', WEDDING_EVENT_TYPES_V2);
  console.log('WeddingEventTypeDropdown - WEDDING_ONLY_EVENT_TYPES (filtered):', WEDDING_ONLY_EVENT_TYPES);
  console.log('WeddingEventTypeDropdown - Deploy timestamp: 2025-06-07 18:50 - Wedding-only filter applied');
  console.log('WeddingEventTypeDropdown - Available options:', WEDDING_EVENT_OPTIONS[0].options);

  // Set initial price on mount if value is provided
  useEffect(() => {
    if (value && onPriceUpdate) {
      const initialPrice = getBasePriceV2(value);
      console.log('WeddingEventTypeDropdown - Setting initial price:', initialPrice, 'for event:', value);
      onPriceUpdate(initialPrice);
    }
  }, [value, onPriceUpdate]);
  
  // Hide price note after 4 seconds if shown
  useEffect(() => {
    if (priceNote) {
      const timer = setTimeout(() => setPriceNote(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [priceNote]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    console.log('WeddingEventTypeDropdown - handleChange called with:', newValue);
    setSelected(newValue);
    
    // Support callback pattern - always pass the value, not the event
    if (onChange) {
      console.log('WeddingEventTypeDropdown - Calling onChange with value:', newValue);
      onChange(newValue);
    }

    // Use dynamic pricing based on event type
    if (onPriceUpdate && newValue) {
      const dynamicPrice = getBasePriceV2(newValue);
      console.log('WeddingEventTypeDropdown - Price calculated:', dynamicPrice, 'for event:', newValue);
      onPriceUpdate(dynamicPrice);
      setPriceNote(`💰 Base price: $${dynamicPrice.toLocaleString()} for ${newValue.toLowerCase()}`);
      console.log('WeddingEventTypeDropdown - Price note set:', `💰 Base price: $${dynamicPrice.toLocaleString()} for ${newValue.toLowerCase()}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <select
          value={selected}
          onChange={handleChange}
          name={name || 'eventType'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          style={{
            backgroundColor: 'white',
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            marginBottom: '1rem',
            borderRadius: '8px',
            border: error ? '1px solid #ef4444' : '1px solid #ccc',
            color: 'black',
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem top 50%',
            backgroundSize: '0.75rem auto',
            paddingRight: 'clamp(24px, 3vw, 32px)'
          }}
        >
          <option value="" disabled>
            Select a wedding event type...
          </option>
          {WEDDING_EVENT_OPTIONS.map((group, index) => (
            <optgroup key={index} label={group.category}>
              {group.options.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <FaChevronDown 
          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 pointer-events-none" 
          style={{ fontSize: '0.875rem' }} 
        />
      </div>

      {/* Pricing note */}
      <AnimatePresence>
        {priceNote && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 text-green-400 text-sm font-medium"
          >
            {priceNote}
          </motion.div>
        )}
      </AnimatePresence>
      
      {error && (
        <p className="mt-2 text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
} 