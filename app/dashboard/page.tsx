'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { parseISO, isAfter, format, compareAsc } from "date-fns";

interface DjContract {
  id: string;
  clientName: string;
  eventDate: string;
  depositPaid: boolean;
  eventType?: string;
  venueName?: string;
  numberOfGuests?: number;
  status?: string;
}

export default function Dashboard() {
  const [contracts, setContracts] = useState<DjContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<DjContract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnpaidOnly, setFilterUnpaidOnly] = useState(false);
  const [upcomingGigs, setUpcomingGigs] = useState<DjContract[]>([]);

  useEffect(() => {
    const fetchGigs = async () => {
      const snapshot = await getDocs(collection(db, "djContracts"));
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as DjContract));

      const now = new Date();
      const futureGigs = data
        .filter(g => isAfter(parseISO(g.eventDate), now))
        .sort((a, b) => compareAsc(parseISO(a.eventDate), parseISO(b.eventDate)));

      setContracts(data);
      setUpcomingGigs(futureGigs);
      applyFilters(data, '', false);
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
            <h2 className="text-xl font-semibold mb-2">🧾 Payment Status</h2>
            
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by client name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <button
                onClick={handleToggleUnpaid}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterUnpaidOnly
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {filterUnpaidOnly ? 'Showing Unpaid Only' : 'Show Unpaid Only'}
              </button>
            </div>

            <div className="bg-blue-700/20 border border-blue-500 rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Event Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="p-3">{contract.clientName}</td>
                      <td className="p-3">{format(parseISO(contract.eventDate), "MMM d, yyyy")}</td>
                      <td className="p-3">
                        {contract.depositPaid ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <FaCheckCircle /> Paid
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1">
                            <FaTimesCircle /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => togglePaidStatus(contract.id, contract.depositPaid)}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            contract.depositPaid
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          Mark as {contract.depositPaid ? 'Unpaid' : 'Paid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContracts.length === 0 && (
                <p className="p-4 text-center text-white/60">No matching contracts found</p>
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

  function togglePaidStatus(id: string, currentStatus: boolean): void {
    const contractRef = doc(db, "djContracts", id);
    updateDoc(contractRef, { depositPaid: !currentStatus })
      .then(() => {
        const updated = contracts.map(c =>
          c.id === id ? { ...c, depositPaid: !currentStatus } : c
        );
        setContracts(updated);
        applyFilters(updated, searchQuery, filterUnpaidOnly);
      })
      .catch((error: Error) => {
        console.error("Error updating payment status:", error);
      });
  }

  function applyFilters(
    data: DjContract[],
    query: string,
    unpaidOnly: boolean
  ): void {
    let filtered = data;
    if (unpaidOnly) {
      filtered = filtered.filter(c => !c.depositPaid);
    }
    if (query.trim()) {
      filtered = filtered.filter(c =>
        c.clientName.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredContracts(filtered);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value;
    setSearchQuery(value);
    applyFilters(contracts, value, filterUnpaidOnly);
  }

  function handleToggleUnpaid(): void {
    const newVal = !filterUnpaidOnly;
    setFilterUnpaidOnly(newVal);
    applyFilters(contracts, searchQuery, newVal);
  }
}