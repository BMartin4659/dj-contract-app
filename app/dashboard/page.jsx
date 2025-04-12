'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { parseISO, isAfter, format, compareAsc } from "date-fns";

export default function Dashboard() {
  const [gigs, setGigs] = useState([]);
  const [upcomingGigs, setUpcomingGigs] = useState([]);

  useEffect(() => {
    const fetchGigs = async () => {
      const snapshot = await getDocs(collection(db, "djContracts"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const now = new Date();
      const futureGigs = data
        .filter(g => isAfter(parseISO(g.eventDate), now))
        .sort((a, b) => compareAsc(parseISO(a.eventDate), parseISO(b.eventDate)));

      setGigs(data);
      setUpcomingGigs(futureGigs);
    };

    fetchGigs();
  }, []);

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-3xl font-bold">🎧 DJ Dashboard</h1>

     {upcomingGigs.length > 0 && (
       <div className="mb-8">
         <h2 className="text-xl font-semibold mb-2">🗓️ Next Upcoming Gig</h2>
         <div className="bg-green-700/20 border border-green-500 text-green-200 p-4 rounded-lg shadow-md">
           <p className="text-lg font-bold">{upcomingGigs[0].eventType} @ {upcomingGigs[0].venueName}</p>
           <p className="text-sm">
             {format(parseISO(upcomingGigs[0].eventDate), "MMMM d, yyyy")} • {upcomingGigs[0].numberOfGuests} guests
           </p>
         </div>
   
         <div className="mb-8">
           <h2 className="text-xl font-semibold mb-2">📊 Contract Status</h2>
           <div className="bg-blue-700/20 border border-blue-500 text-blue-200 p-4 rounded-lg shadow-md space-y-2">
             <h3>Status: {upcomingGigs[0]?.status || 'pending'}</h3>
             {upcomingGigs[0]?.status === 'unpaid' && (
               <p style={{ color: 'red' }}>Payment Pending</p>
             )}
             {upcomingGigs[0]?.status === 'paid' && (
               <p style={{ color: 'green' }}>Paid</p>
             )}
             {upcomingGigs[0]?.status === 'emailSent' && (
               <p style={{ color: 'blue' }}>Email Sent</p>
             )}
             {upcomingGigs[0]?.status === 'depositPaid' && (
               <p style={{ color: 'orange' }}>Deposit Paid</p>
             )}
           </div>
         </div>
       </div>
     )}

     <Card>
       <CardContent className="p-4">
         <h2 className="text-xl font-semibold mb-2">📋 All Upcoming Gigs</h2>
         {upcomingGigs.length === 0 ? (
           <p>No upcoming bookings.</p>
         ) : (
           <ul className="space-y-4">
             {upcomingGigs.map((gig, index) => (
               <li
                 key={gig.id}
                 className={`p-4 rounded-xl backdrop-blur shadow
                   ${index === 0 ? "bg-white/10" : "bg-white/5"}`}
               >
                 <p className="font-bold">{gig.eventType} @ {gig.venueName}</p>
                 <p className="text-sm">
                   {format(parseISO(gig.eventDate), "MMMM d, yyyy")} • {gig.numberOfGuests} guests
                 </p>
               </li>
             ))}
           </ul>
         )}
       </CardContent>
     </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-2">Promotion Tools</h2>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white shadow">
            Generate Social Post
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
