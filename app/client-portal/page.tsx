'use client';

import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/messages";
import { Contract } from "@/types/contracts";
import { DjEvent } from "@/types/events";
import { format } from "date-fns";
import Link from "next/link";
import { FaEnvelope, FaFileContract, FaCalendarAlt, FaCreditCard, FaPlay, FaClock, FaChevronRight } from "react-icons/fa";

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<DjEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // TODO: Replace with actual client ID from auth
        const clientId = "demo-client-id";
        
        // Fetch events
        const eventsQuery = query(
          collection(db, "djContracts"),
          where("clientId", "==", clientId),
          orderBy("eventDate", "desc")
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DjEvent));
        setEvents(eventsData);

        // Fetch messages
        const messagesQuery = query(
          collection(db, "messages"),
          where("clientId", "==", clientId),
          orderBy("timestamp", "desc")
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        setMessages(messagesData);

        // Fetch contracts
        const contractsQuery = query(
          collection(db, "contracts"),
          where("clientId", "==", clientId),
          orderBy("createdAt", "desc")
        );
        const contractsSnapshot = await getDocs(contractsQuery);
        const contractsData = contractsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Contract));
        setContracts(contractsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching client data:", error);
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <div className="grid gap-4 p-6">
            {events.map(event => (
              <div key={event.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <FaCalendarAlt className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{event.eventType}</h3>
                    <p className="text-gray-400">{format(new Date(event.eventDate), 'MMMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-gray-400" />
                    <span className="text-gray-400">{event.startTime} - {event.endTime}</span>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4" asChild>
                    <Link href={`/client-portal/events/${event.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'messages':
        return (
          <div className="grid gap-4 p-6">
            {messages.map(message => (
              <div key={message.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                    <FaEnvelope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{message.subject || 'No Subject'}</h3>
                    <p className="text-sm text-gray-400">
                      {format(message.timestamp, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 pl-14">{message.content}</p>
              </div>
            ))}
            <Button className="bg-green-600 hover:bg-green-700 text-white">New Message</Button>
          </div>
        );

      case 'contracts':
        return (
          <div className="grid gap-4 p-6">
            {contracts.map(contract => (
              <div key={contract.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FaFileContract className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Contract for Event</h3>
                    <p className="text-gray-400">Status: <span className="capitalize">{contract.status}</span></p>
                  </div>
                  <div className="flex gap-2">
                    {contract.status === 'sent' && !contract.clientSignature && (
                      <Button className="bg-green-600 hover:bg-green-700">Sign Contract</Button>
                    )}
                    <Button variant="outline">View Contract</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'payments':
        return (
          <div className="grid gap-4 p-6">
            {events.map(event => (
              <div key={event.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <FaCreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Payment for {event.eventType}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Deposit Status:</span>
                      <span className={event.depositPaid ? "text-green-500" : "text-red-500"}>
                        {event.depositPaid ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                  {!event.depositPaid && (
                    <Button className="bg-green-600 hover:bg-green-700">Pay Deposit</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Client Portal</h1>
          <nav className="space-y-2">
            {[
              { id: 'events', label: 'Events', icon: FaCalendarAlt },
              { id: 'messages', label: 'Messages', icon: FaEnvelope },
              { id: 'contracts', label: 'Contracts', icon: FaFileContract },
              { id: 'payments', label: 'Payments', icon: FaCreditCard },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Link
                href="/client-portal/swipe"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <span>Try Swipeable View</span>
                <FaChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {renderContent()}
          </>
        )}
      </div>
    </div>
  );
} 