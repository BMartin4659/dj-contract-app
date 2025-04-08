// app/dashboard/page.jsx
"use client";
import { useEffect, useState } from "react";
import db from '../../firebase';
 // your firebase.js is in lib
import { collection, getDocs } from "firebase/firestore";

export default function DashboardPage() {
  const [gigs, setGigs] = useState([]);

  useEffect(() => {
    const fetchGigs = async () => {
      const snapshot = await getDocs(collection(db, "djContracts"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      const now = new Date();
  
      const upcoming = data
        .filter(g => new Date(g.eventDate) >= now) // only future dates
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)); // sort soonest to latest
  
      setGigs(upcoming);
    };
  
    fetchGigs();
  }, []);
  

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">🎧 DJ Dashboard</h1>
  
      {/* Show next upcoming gig */}
      {gigs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">🗓️ Next Upcoming Gig</h2>
          <div className="bg-green-700/20 border border-green-500 text-green-200 p-4 rounded-lg shadow-md">
            <p className="text-lg font-bold">{gigs[0].eventType} @ {gigs[0].venueName}</p>
            <p className="text-sm">{new Date(gigs[0].eventDate).toLocaleDateString()} • {gigs[0].numberOfGuests} guests</p>
          </div>
        </div>
      )}
  
      {/* List all upcoming gigs */}
      <h2 className="text-xl font-semibold mb-2">📋 All Upcoming Gigs</h2>
      {gigs.length === 0 ? (
        <p>No upcoming bookings.</p>
      ) : (
        <ul className="space-y-4">
          {gigs.map((gig) => (
            <li key={gig.id} className="bg-white/10 p-4 rounded-xl shadow backdrop-blur">
              <p className="font-bold">{gig.eventType} @ {gig.venueName}</p>
              <p className="text-sm">
                {new Date(gig.eventDate).toLocaleDateString()} • {gig.numberOfGuests} guests
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
