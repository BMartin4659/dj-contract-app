'use client';
import { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isWeddingEvent, getBasePrice } from '../utils/eventUtils';

// FINAL PRICING FIX DEPLOYMENT - 2025-02-01 01:30:00 UTC
// DEPLOYMENT ID: wedding-pricing-fix-final-v1 
// This component has been updated for the FINAL pricing fix deployment

const EVENT_OPTIONS = [
  {
    category: '💍 Weddings & Formal',
    options: [
      'Wedding Ceremony',
      'Wedding Reception',
      'Wedding Ceremony & Reception',
      'Engagement Party',
      'Bridal Shower',
      'Bachelor/Bachelorette Party',
      'Anniversary Party',
      'Vow Renewal',
    ],
  },
  {
    category: '🎉 Private & Social',
    options: [
      'Birthday Party',
      'Graduation Party',
      'Retirement Celebration',
      'House Party',
      'Family Reunion',
      'Backyard BBQ',
      'Block Party',
      'Pool Party',
      'Holiday Party',
    ],
  },
  {
    category: '🏢 Corporate & Professional',
    options: [
      'Company Holiday Party',
      'Product Launch',
      'Brand Activation',
      'Networking Event',
      'Employee Appreciation',
      'Store Opening',
      'Trade Show or Expo',
    ],
  },
  {
    category: '🏫 School & Youth',
    options: [
      'Prom',
      'Homecoming',
      'School Dance',
      'College Party',
      'Fraternity/Sorority Event',
      'Sweet 16',
      'Quinceañera',
      'Graduation Ceremony',
    ],
  },
  {
    category: '💃 Community & Cultural',
    options: [
      'Cultural Festival',
      'Parade',
      'Fundraiser or Gala',
      'Church Event',
      'Youth Group Party',
      'Community Event',
    ],
  },
  {
    category: '🪩 Nightlife & Clubs',
    options: [
      'Bar/Club Set',
      'Silent Disco',
      'Afterparty',
      'EDM Rave',
      'Theme Night (80s, 90s, etc.)',
    ],
  },
];

export default function EventTypeDropdown({
  value,
  onChange,
  onPriceUpdate,
  error,
  selectedEvent,
  onEventChange,
  name,
  handleBasePrice,
  showWeddingAgendaLink = true,
}) {
  const router = useRouter();
  const [priceNote, setPriceNote] = useState('');
  const [showAgendaAlert, setShowAgendaAlert] = useState(false);

  // Use the passed value directly, don't maintain separate state
  const currentValue = value || selectedEvent || '';
  const effectiveOnChange = onChange || onEventChange;
  const effectiveOnPriceUpdate = onPriceUpdate || handleBasePrice;

  useEffect(() => {
    if (currentValue) {
      // Set initial price on mount
      if (effectiveOnPriceUpdate) {
        effectiveOnPriceUpdate(getBasePrice(currentValue));
      }
      
      // Set initial price note and agenda alert on mount
      const price = getBasePrice(currentValue);
      if (isWeddingEvent(currentValue)) {
        console.log('EventTypeDropdown - Detected wedding event on mount:', currentValue);
        // Show specific pricing message
        if (currentValue === 'Wedding Ceremony & Reception') {
          setPriceNote(`💰 Base price updated to $${price} for wedding ceremony & reception`);
        } else {
          setPriceNote(`💰 Base price updated to $${price} for ${currentValue.toLowerCase()}`);
        }
        if (showWeddingAgendaLink) setShowAgendaAlert(true);
      } else {
        console.log('EventTypeDropdown - Detected event on mount:', currentValue, 'Price:', price);
        setPriceNote(`💰 Base price set to $${price} for this event`);
        setShowAgendaAlert(false); // Explicitly set to false for non-wedding events
      }
    }
  }, [currentValue, effectiveOnPriceUpdate, showWeddingAgendaLink]);

  useEffect(() => {
    if (priceNote) {
      const timer = setTimeout(() => setPriceNote(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [priceNote]);

  useEffect(() => {
    if (showAgendaAlert) {
      const timer = setTimeout(() => setShowAgendaAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAgendaAlert]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    console.log('EventTypeDropdown - Value changed to:', newValue);

    // DYNAMIC PRICING: Calculate price immediately when value changes
    const price = getBasePrice(newValue);
    console.log('EventTypeDropdown - DYNAMIC PRICE CALCULATED:', price, 'for event:', newValue);

    // Call the parent onChange immediately
    if (effectiveOnChange) {
      if (typeof effectiveOnChange === 'function' && effectiveOnChange.length >= 1) {
        console.log('EventTypeDropdown - Calling onChange with event');
        effectiveOnChange(e);
      } else {
        console.log('EventTypeDropdown - Calling onChange with value');
        effectiveOnChange(newValue);
      }
    }

    // DYNAMIC PRICING: Update price immediately and force refresh
    if (effectiveOnPriceUpdate) {
      console.log('EventTypeDropdown - DYNAMIC UPDATE: Setting price to:', price);
      effectiveOnPriceUpdate(price);
      
      // Force another update after a brief delay to ensure it takes
      setTimeout(() => {
        console.log('EventTypeDropdown - DYNAMIC REFRESH: Re-confirming price:', price);
        effectiveOnPriceUpdate(price);
      }, 50);
    }

    // Update UI feedback with dynamic messaging
    const isWedding = isWeddingEvent(newValue);
    console.log('EventTypeDropdown - DYNAMIC UPDATE: Event type changed:', newValue, 'Is wedding:', isWedding, 'Price:', price);
    
    if (isWedding) {
      console.log('EventTypeDropdown - DYNAMIC: Setting wedding pricing and showing agenda alert');
      // Show specific pricing message with dynamic calculation
      if (newValue === 'Wedding Ceremony & Reception') {
        setPriceNote(`💰 DYNAMIC UPDATE: Base price set to $${price} for wedding ceremony & reception`);
      } else {
        setPriceNote(`💰 DYNAMIC UPDATE: Base price set to $${price} for ${newValue.toLowerCase()}`);
      }
      if (showWeddingAgendaLink) {
        setShowAgendaAlert(true);
        console.log('EventTypeDropdown - Wedding agenda alert shown');
      }
    } else {
      console.log('EventTypeDropdown - DYNAMIC: Setting pricing and hiding agenda alert. Price:', price);
      setPriceNote(`💰 DYNAMIC UPDATE: Base price set to $${price} for this event`);
      setShowAgendaAlert(false);
    }
    
    // Dispatch events for other components
    const eventTypeChanged = new Event('eventTypeUpdated');
    window.dispatchEvent(eventTypeChanged);
    
    setTimeout(() => {
      const eventProcessingComplete = new Event('eventTypeProcessed');
      window.dispatchEvent(eventProcessingComplete);
      console.log('EventTypeDropdown - DYNAMIC: Event type processing complete');
    }, 10);
  };

  const handleAgendaLinkClick = (e) => {
    e.preventDefault();
    console.log('EventTypeDropdown - Wedding agenda link clicked, navigating to form');
    router.push('/wedding-agenda');
  };

  return (
    <div className="w-full">
      <div className="relative">
        <select
          value={currentValue}
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
            paddingRight: 'clamp(24px, 3vw, 32px)',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          <option value="" disabled>
            Select an event type...
          </option>
          {EVENT_OPTIONS.map((group, index) => (
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

      {/* Wedding Agenda Alert - Only show for wedding events */}
      <AnimatePresence>
        {showAgendaAlert && showWeddingAgendaLink && isWeddingEvent(currentValue) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 text-blue-500 text-sm font-medium flex items-center"
          >
            <span className="mr-2">✨</span>
            <span>
              Please complete the Wedding Agenda Form in Additional Services!
            </span>
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