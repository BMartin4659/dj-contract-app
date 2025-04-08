'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../firebase'; // Adjust path if needed

export default function Dashboard() {
  // We'll store all upcoming events in `events` state.
  const [events, setEvents] = useState([]);
  // We'll also store just the single next upcoming event in `nextEvent`.
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
        const now = new Date();

        // If your `eventDate` is stored as a Firestore Timestamp:
        //   new Date(e.eventDate.seconds * 1000)
        // If it's stored as a string in YYYY-MM-DD format:
        //   new Date(e.eventDate)

        // Example assuming it's a YYYY-MM-DD string:
        const upcoming = data.filter(e => {
          const dateObj = new Date(e.eventDate);
          return dateObj >= now; // keep events today or in the future
        });

        // 2. Sort the filtered events by earliest date first
        upcoming.sort((a, b) => {
          const dateA = new Date(a.eventDate);
          const dateB = new Date(b.eventDate);
          return dateA - dateB; // ascending order
        });

        // 3. Our events state can hold all upcoming events
        setEvents(upcoming);

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

      <section>
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
    </div>
  );
}
