// fix-vercel-build.js
// This script helps resolve build issues on Vercel deployments
const fs = require('fs');
const path = require('path');

console.log('Running fix-vercel-build.js');

// You can add any custom build steps here if needed in the future
try {
  // Run the ensure-components script to create missing components
  require('./ensure-components.js');
} catch (error) {
  console.error('Error running ensure-components.js:', error);
  // Continue with the build process even if component verification fails
}

// Define the critical components that must exist for the app to work
const requiredComponents = [
  {
    path: 'app/components/ClientOnly.js',
    content: `'use client';

import { useEffect, useState } from 'react';

// Enhanced ClientOnly component that handles hydration warnings with better fallback rendering
export default function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    // Mark as mounted
    setHasMounted(true);
  }, []);
  
  // Server-side and first render - return fallback or a hidden placeholder
  if (!hasMounted) {
    if (fallback) {
      // Use provided fallback with hydration warning suppression
      return (
        <div suppressHydrationWarning={true} data-client-only-fallback="true">
          {fallback}
        </div>
      );
    }
    
    // No fallback provided, use minimal invisible placeholder
    // This prevents layout shifts during hydration
    return (
      <div 
        suppressHydrationWarning={true}
        data-client-only-placeholder="true"
        aria-hidden="true"
        style={{ visibility: 'hidden', overflow: 'hidden', height: 0, width: 0 }}
      />
    );
  }
  
  // Client-side - return children with hydration warning suppression
  return (
    <div suppressHydrationWarning={true} data-client-rendered="true">
      {children}
    </div>
  );
}`,
  },
  {
    path: 'app/components/SuppressHydration.js',
    content: `'use client';

import React, { useEffect } from 'react';

// Component to suppress hydration warnings by re-rendering client-side only
export default function SuppressHydration({ children }) {
  const [mounted, setMounted] = React.useState(false);
  
  // Only render children after component mounts on the client
  useEffect(() => {
    setMounted(true);
    
    // Clean up Grammarly attributes when component mounts
    if (document.body) {
      document.body.removeAttribute('data-new-gr-c-s-check-loaded');
      document.body.removeAttribute('data-gr-ext-installed');
    }
  }, []);
  
  // During server-side rendering, return a div with suppressHydrationWarning
  if (!mounted) {
    return (
      <div suppressHydrationWarning data-suppress-hydration-warning={true}>
        {/* This will be replaced on the client */}
        Loading...
      </div>
    );
  }
  
  // After mounting on the client, render the actual children
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  );
}`,
  },
  {
    path: 'app/components/WeddingEventTypeDropdown.js',
    content: `'use client';
import { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { WEDDING_EVENT_TYPES } from '../utils/eventUtils';

// Only wedding-related event types
const WEDDING_EVENT_OPTIONS = [
  {
    category: '💍 Weddings & Formal',
    options: WEDDING_EVENT_TYPES,
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

  // Set initial price on mount if value is provided
  useEffect(() => {
    if (value && onPriceUpdate) {
      onPriceUpdate(1000.0);
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
    setSelected(newValue);
    
    // Support callback pattern
    if (onChange) {
      if (typeof onChange === 'function' && onChange.length >= 1) {
        onChange(e);
      } else {
        onChange(newValue);
      }
    }

    // All options are wedding-related, so always set to wedding price
    if (onPriceUpdate) onPriceUpdate(1000.0);
    setPriceNote('💰 Base price: $1000 for wedding services');
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
}`,
  },
  {
    path: 'app/utils/eventUtils.js',
    content: `'use client';

// List of all wedding-related event types - explicitly defined
export const WEDDING_EVENT_TYPES = [
  'Wedding Ceremony',
  'Wedding Reception',
  'Wedding Ceremony & Reception',
  'Engagement Party',
  'Bridal Shower',
  'Bachelor Party',
  'Bachelorette Party',
  'Anniversary Party',
  'Vow Renewal',
];

// Very specific wedding keywords - only used for exact matching
export const WEDDING_KEYWORDS = [
  'wedding',
  'bridal',
  'engagement'
];

/**
 * Check if an event type is wedding-related
 * @param {string} eventType - The event type to check
 * @returns {boolean} - True if the event is wedding-related
 */
export function isWeddingEvent(eventType) {
  if (!eventType) return false;
  
  // Check if it's in the list of exact wedding event types
  if (WEDDING_EVENT_TYPES.includes(eventType)) {
    return true;
  }
  
  // Only check for very specific wedding-related prefixes
  const eventTypeLower = eventType.toLowerCase();
  
  // Check if it starts with a wedding keyword
  for (const prefix of WEDDING_KEYWORDS) {
    if (eventTypeLower.startsWith(prefix)) {
      return true;
    }
  }
  
  // By default, not a wedding event
  return false;
}

/**
 * Get the base price for an event type
 * @param {string} eventType - The event type
 * @returns {number} - The base price for the event
 */
export function getBasePrice(eventType) {
  return isWeddingEvent(eventType) ? 1000 : 400;
}`,
  },
  {
    path: 'app/components/EventTypeDropdown.js',
    content: `'use client';
import { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isWeddingEvent, getBasePrice } from '../utils/eventUtils';

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
  const [selected, setSelected] = useState(value || selectedEvent || '');
  const [priceNote, setPriceNote] = useState('');
  const [showAgendaAlert, setShowAgendaAlert] = useState(false);

  const effectiveValue = value || selectedEvent;
  const effectiveOnChange = onChange || onEventChange;
  const effectiveOnPriceUpdate = onPriceUpdate || handleBasePrice;

  useEffect(() => {
    if (effectiveValue) {
      // Set initial price on mount
      if (effectiveOnPriceUpdate) {
        effectiveOnPriceUpdate(getBasePrice(effectiveValue));
      }
      
      // Set initial price note and agenda alert on mount
      if (isWeddingEvent(effectiveValue)) {
        console.log('EventTypeDropdown - Detected wedding event on mount:', effectiveValue);
        setPriceNote('💰 Base price updated to $1000 for weddings');
        if (showWeddingAgendaLink) setShowAgendaAlert(true);
      } else {
        console.log('EventTypeDropdown - Detected standard event on mount:', effectiveValue);
        setPriceNote('💰 Base price set to $400 for standard events');
        setShowAgendaAlert(false); // Explicitly set to false for non-wedding events
      }
    }
  }, [effectiveValue, effectiveOnPriceUpdate, showWeddingAgendaLink]);

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
    setSelected(newValue);

    if (effectiveOnChange) {
      if (typeof effectiveOnChange === 'function' && effectiveOnChange.length >= 1) {
        effectiveOnChange(e);
      } else {
        effectiveOnChange(newValue);
      }
    }

    const price = getBasePrice(newValue);
    if (effectiveOnPriceUpdate) effectiveOnPriceUpdate(price);

    const isWedding = isWeddingEvent(newValue);
    console.log('EventTypeDropdown - Event type changed:', newValue, 'Is wedding:', isWedding);
    
    if (isWedding) {
      console.log('EventTypeDropdown - Setting wedding pricing and showing agenda alert');
      setPriceNote('💰 Base price updated to $1000 for weddings');
      if (showWeddingAgendaLink) setShowAgendaAlert(true);
    } else {
      console.log('EventTypeDropdown - Setting standard pricing and hiding agenda alert');
      setPriceNote('💰 Base price set to $400 for standard events');
      setShowAgendaAlert(false); // Explicitly set to false for non-wedding events
    }
  };

  const handleAgendaLinkClick = (e) => {
    e.preventDefault();
    console.log('EventTypeDropdown - Wedding agenda link clicked, navigating to form');
    router.push('/wedding-agenda');
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
            paddingRight: 'clamp(24px, 3vw, 32px)',
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
        {showAgendaAlert && showWeddingAgendaLink && isWeddingEvent(selected) && (
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
}`,
  },
  {
    path: 'app/components/HydrationSuppressor.js',
    content: `'use client';

import React, { useEffect } from 'react';

// Component to suppress hydration warnings in modern React apps
export default function HydrationSuppressor({ children }) {
  const [hasMounted, setHasMounted] = React.useState(false);
  
  // Only execute client-side
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // During SSR or initial render, show a placeholder with suppressed hydration warnings
  if (!hasMounted) {
    return (
      <div suppressHydrationWarning>
        {/* Empty placeholder to maintain layout */}
      </div>
    );
  }
  
  // Once mounted on client, render the actual children
  return (
    <div suppressHydrationWarning>
      {children}
    </div>
  );
}`,
  },
];

// Ensure directories exist
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
    console.log(`Created directory: ${dirname}`);
  }
}

// Check and create required components
requiredComponents.forEach(component => {
  const fullPath = path.join(process.cwd(), component.path);
  try {
    if (!fs.existsSync(fullPath)) {
      ensureDirectoryExists(fullPath);
      fs.writeFileSync(fullPath, component.content, 'utf8');
      console.log(`Created missing component: ${component.path}`);
    } else {
      console.log(`Component already exists: ${component.path}`);
    }
  } catch (error) {
    console.error(`Error ensuring component ${component.path} exists:`, error);
  }
});

// Run additional build preparation steps if needed
try {
  // Clear Next.js cache to ensure clean build
  const cacheDir = path.join(process.cwd(), '.next/cache');
  if (fs.existsSync(cacheDir)) {
    console.log('Cleaning Next.js cache directory...');
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('Next.js cache directory cleaned');
  }
} catch (error) {
  console.error('Error cleaning cache:', error);
}

console.log('Build preparation completed successfully'); 