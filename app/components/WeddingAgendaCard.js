'use client';

import { FaClipboardList, FaChevronRight } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isWeddingEvent, WEDDING_EVENT_TYPES } from '../utils/eventUtils';

export default function WeddingAgendaCard({ eventType }) {
  const router = useRouter();
  const [showCard, setShowCard] = useState(false);
  
  // Add more comprehensive logging to debug issues
  useEffect(() => {
    console.log('WeddingAgendaCard - Initial render with event type:', eventType);
    
    // Listen for custom event type update events
    const handleEventTypeUpdate = () => {
      console.log('WeddingAgendaCard - Event type update detected');
      // Small delay to ensure the event type has been updated in the parent
      setTimeout(() => {
        const isWedding = eventType && isWeddingEvent(eventType);
        console.log('WeddingAgendaCard - Re-evaluating after event update:', eventType, 'Is Wedding:', isWedding);
        setShowCard(isWedding);
      }, 50);
    };
    
    const handleEventProcessed = () => {
      console.log('WeddingAgendaCard - Event type processing complete');
      setTimeout(() => {
        const isWedding = eventType && isWeddingEvent(eventType);
        console.log('WeddingAgendaCard - Final evaluation after processing:', eventType, 'Is Wedding:', isWedding);
        setShowCard(isWedding);
      }, 100);
    };
    
    window.addEventListener('eventTypeUpdated', handleEventTypeUpdate);
    window.addEventListener('eventTypeProcessed', handleEventProcessed);
    
    return () => {
      window.removeEventListener('eventTypeUpdated', handleEventTypeUpdate);
      window.removeEventListener('eventTypeProcessed', handleEventProcessed);
    };
  }, [eventType]);
  
  useEffect(() => {
    // Only evaluate the condition on the client side and debounce updates
    const isWedding = eventType && isWeddingEvent(eventType);
    console.log('WeddingAgendaCard - Event Type:', eventType, 'Is Wedding:', isWedding, 'Wedding Types:', WEDDING_EVENT_TYPES);
    
    // Use a small timeout to ensure this runs after event type changes are fully processed
    const timer = setTimeout(() => {
      setShowCard(isWedding);
      console.log('WeddingAgendaCard - Card visibility set to:', isWedding);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [eventType]);
  
  // Improve the safety checks and make them clearer
  if (!eventType) {
    console.log('WeddingAgendaCard - No event type provided');
    return null;
  }
  
  // First check if the event is a wedding type before rendering anything
  const isWedding = isWeddingEvent(eventType);
  if (!isWedding) {
    console.log('WeddingAgendaCard - Not a wedding event:', eventType);
    return null;
  }
  
  if (!showCard) {
    console.log('WeddingAgendaCard - Card hidden by state');
    return null;
  }
  
  console.log('WeddingAgendaCard - Rendering card for wedding event:', eventType);
  
  // Direct navigation with multiple methods for redundancy
  const navigateToWeddingAgenda = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('WeddingAgendaCard - Navigating to wedding agenda form');
    
    try {
      // Use Next.js router for proper navigation
      router.push('/wedding-agenda');
    } catch (error) {
      console.error('Router navigation failed, using direct navigation:', error);
      // Fallback to direct navigation only if router fails
      window.location.href = '/wedding-agenda';
    }
  };
  
  const cardStyle = {
    border: '2px solid #8B5CF6',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(139, 92, 246, 0.1)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block'
  };
  
  return (
    <div>
      <div
        onClick={navigateToWeddingAgenda}
        style={cardStyle}
        className="service-card"
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.15)';
          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.1)';
          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
        }}
        role="button"
        aria-label="Complete Wedding Agenda Form"
      >
        <div style={{ 
          position: 'absolute',
          top: '0',
          right: '0',
          backgroundColor: '#8B5CF6',
          color: 'white',
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          borderBottomLeftRadius: '8px'
        }}>
          RECOMMENDED
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ 
            marginRight: '12px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)'
          }}>
            <FaClipboardList style={{ fontSize: '24px', color: '#8B5CF6' }} />
          </div>
          <div>
            <h4 style={{ 
              margin: '0 0 4px 0',
              color: '#333',
              fontWeight: '600'
            }}>
              Wedding Agenda Form
            </h4>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold',
              color: '#8B5CF6'
            }}>
              Included
            </div>
          </div>
        </div>
        
        <p style={{ 
          fontSize: '0.85rem', 
          color: '#666', 
          margin: '0 0 12px 0',
          lineHeight: '1.4'
        }}>
          Complete our detailed Wedding Agenda Form to ensure your special day flows perfectly. Helps us prepare all your special dances, timeline, and key moments.
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 'auto',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#8B5CF6'
        }}>
          Complete Form 
          <FaChevronRight style={{ marginLeft: '4px', fontSize: '0.75rem' }} />
        </div>
      </div>
      
      {/* Hidden direct link for better navigation */}
      <a 
        href="/wedding-agenda"
        className="wedding-agenda-direct-link"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      ></a>
    </div>
  );
} 