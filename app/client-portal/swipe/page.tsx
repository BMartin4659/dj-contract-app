'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Message } from "@/types/messages";
import { Contract } from "@/types/contracts";
import { DjEvent } from "@/types/events";
import { format } from "date-fns";
import Link from "next/link";
import { FaEnvelope, FaFileContract, FaCalendarAlt, FaCreditCard, FaPlay, FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const SWIPE_THRESHOLD = 50;
const SECTIONS = ['events', 'messages', 'contracts', 'payments'] as const;

export default function SwipeableClientPortal() {
  const [activeSection, setActiveSection] = useState(0);
  const [events, setEvents] = useState<DjEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  
  const dragX = useMotionValue(0);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
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

  const handleDragEnd = (event: Event, info: PanInfo) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      if (offset > 0 && activeSection > 0) {
        setActiveSection(prev => prev - 1);
      } else if (offset < 0 && activeSection < SECTIONS.length - 1) {
        setActiveSection(prev => prev + 1);
      }
    }
    dragX.set(0);
  };

  const renderSection = (section: string) => {
    switch (section) {
      case 'events':
        return (
          <div className="space-y-4">
            {events.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
              >
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
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-4">
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
              >
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
              </motion.div>
            ))}
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-4">
            {contracts.map(contract => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FaFileContract className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Contract for Event</h3>
                    <p className="text-gray-400">Status: <span className="capitalize">{contract.status}</span></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-4">
            {events.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
              >
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
                </div>
              </motion.div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-900 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Client Portal</h1>
          <nav className="space-y-2">
            {SECTIONS.map((section, index) => (
              <button
                key={section}
                onClick={() => setActiveSection(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  index === activeSection
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {section === 'events' && <FaCalendarAlt className="h-5 w-5" />}
                {section === 'messages' && <FaEnvelope className="h-5 w-5" />}
                {section === 'contracts' && <FaFileContract className="h-5 w-5" />}
                {section === 'payments' && <FaCreditCard className="h-5 w-5" />}
                <span className="capitalize">{section}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content with Swipe */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Section Header */}
          <div className="p-6 flex items-center justify-between border-b border-gray-800">
            <button
              onClick={() => activeSection > 0 && setActiveSection(prev => prev - 1)}
              className={`p-2 rounded-full ${
                activeSection > 0 ? 'text-white hover:bg-gray-800' : 'text-gray-600'
              }`}
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold capitalize">{SECTIONS[activeSection]}</h2>
            <button
              onClick={() => activeSection < SECTIONS.length - 1 && setActiveSection(prev => prev + 1)}
              className={`p-2 rounded-full ${
                activeSection < SECTIONS.length - 1 ? 'text-white hover:bg-gray-800' : 'text-gray-600'
              }`}
            >
              <FaChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Swipeable Content */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              x: dragX,
              cursor: 'grab'
            }}
            className="flex-1 overflow-y-auto p-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={SECTIONS[activeSection]}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  renderSection(SECTIONS[activeSection])
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 