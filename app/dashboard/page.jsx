'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../../firebase';
 // Adjust path if needed

export default function Dashboard() {
  // We'll store all upcoming events in `events` state.
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all docs from the `djContracts` collection
        const snapshot = await getDocs(collection(db, 'djContracts'));
        const data = snapshot.docs.map(doc => doc.data());

        // 1. Filter only events in the future (or today).
        //    Make sure to parse the eventDate properly.
        //    If eventDate is a string like '2025-04-30', we can do:
        // If your `eventDate` is stored as a Firestore Timestamp:
        //   new Date(e.eventDate.seconds * 1000)
        // If it's stored as a string in YYYY-MM-DD format:
        //   new Date(e.eventDate)

        // Separate into past and upcoming events
        const now = new Date();
        const [upcoming, past] = data.reduce((acc, e) => {
          const dateObj = new Date(e.eventDate);
          (dateObj >= now ? acc[0] : acc[1]).push(e);
          return acc;
        }, [[], []]);

        // Sort upcoming by date ascending
        upcoming.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        
        // Sort past by date descending
        past.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

        setEvents(upcoming);
        setPastEvents(past);

        // 4. The "nextEvent" is the first (earliest) in the array
        if (upcoming.length > 0) {
          setNextEvent(upcoming[0]);
        } else {
          setNextEvent(null); // No upcoming events
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Next upcoming gig:</h2>
        {nextEvent ? (
          <div className="border border-white p-4 rounded">
            <p><strong>Event Type:</strong> {nextEvent.eventType}</p>
            <p><strong>Date:</strong> {nextEvent.eventDate}</p>
            <p><strong>Venue:</strong> {nextEvent.venueName}</p>
            <p><strong>Location:</strong> {nextEvent.venueLocation}</p>
            <p><strong>Guest Count:</strong> {nextEvent.numberOfGuests}</p>
          </div>
        ) : (
          <p>No upcoming events found.</p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All upcoming gigs:</h2>
        {events && events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((evt, idx) => (
              <li key={idx} className="border border-white p-4 rounded">
                <p><strong>Event Type:</strong> {evt.eventType}</p>
                <p><strong>Date:</strong> {evt.eventDate}</p>
                <p><strong>Venue:</strong> {evt.venueName}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming events in the database.</p>
        )}
      </section>

      {/* CRM Features Section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Client History & Follow-ups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-white p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Past Events ({pastEvents.length})</h3>
            <div className="max-h-96 overflow-y-auto">
              {pastEvents.map((evt, idx) => {
                const eventDate = new Date(evt.eventDate);
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                return (
                  <div key={idx} className="border-b border-gray-600 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{evt.venueName}</p>
                        <p className="text-sm text-gray-300">
                          {eventDate.toLocaleDateString()} • {evt.eventType}
                        </p>
                      </div>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleFollowUp(evt)}
                      >
                        Follow Up
                      </button>
                    </div>
                    {eventDate >= oneYearAgo && (
                      <p className="text-green-400 text-xs mt-1">
                        This client had an event around this time last year
                      </p>
                    )}
                  </div>
              
                );
              
                function handleFollowUp(event) {
                  console.log('Initiating follow-up for:', event);
                  alert(`Follow-up email draft created for ${event.venueName}`);
                }
              
                function generateSuggestions(events) {
                  const suggestions = [];
                  const now = new Date();
                  
                  events.forEach(event => {
                    const eventDate = new Date(event.eventDate);
                    if (now.getMonth() === eventDate.getMonth() &&
                        now.getDate() === eventDate.getDate() &&
                        now.getFullYear() > eventDate.getFullYear()) {
                      suggestions.push({
                        text: `${event.venueName} had an event on this date last year`,
                        cta: "Send Anniversary Follow-up",
                        action: () => handleFollowUp(event)
                      });
                    }
                  });
              
                  return suggestions.slice(0, 3);
                }
              }
                );
              })}
            </div>
          </div>

          <div className="border border-white p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Smart Suggestions</h3>
            <div className="space-y-3">
              {generateSuggestions(pastEvents).map((suggestion, idx) => (
                <div key={idx} className="bg-gray-800 p-3 rounded">
                  <p className="text-sm mb-2">{suggestion.text}</p>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                    onClick={suggestion.action}
                  >
                    {suggestion.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* Helper Functions */}
    {() => {
      const handleFollowUp = (event) => {
        console.log('Initiating follow-up for:', event);
        alert(`Follow-up email draft created for ${event.venueName}`);
      };

      const generateSuggestions = (events) => {
        const suggestions = [];
        const now = new Date();
        
        events.forEach(event => {
          const eventDate = new Date(event.eventDate);
          if (now.getMonth() === eventDate.getMonth() &&
              now.getDate() === eventDate.getDate() &&
              now.getFullYear() > eventDate.getFullYear()) {
            suggestions.push({
              text: `${event.venueName} had an event on this date last year`,
              cta: "Send Anniversary Follow-up",
              action: () => handleFollowUp(event)
            });
          }
        });

        return suggestions.slice(0, 3);
      };
    }}
  );
}
