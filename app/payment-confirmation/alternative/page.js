'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaShareAlt,
  FaUndoAlt,
  FaTimes,
  FaExclamationCircle
} from 'react-icons/fa';

// Client component that uses searchParams
function PaymentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId) {
          setError('Missing booking ID');
          setStatus('error');
          return;
        }

        const bookingRef = doc(db, 'djContracts', bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
          setError('Booking not found');
          setStatus('error');
          return;
        }

        setBookingData({ id: bookingId, ...bookingSnap.data() });
        setStatus('success');
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    loadBookingData();
  }, [searchParams]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hr, min] = timeStr.split(':');
    const h = parseInt(hr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${min} ${ampm}`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/party-theme-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <p className="text-gray-500 text-sm">Loading booking details...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{
        backgroundImage: 'url(/party-theme-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <p className="text-lg text-red-600 font-semibold">Booking Failed</p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          <FaUndoAlt className="inline mr-1" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'url(/party-theme-background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Green Header */}
      <div className="bg-green-500 rounded-b-3xl text-white px-6 pb-10 pt-12 relative shadow-md">
        <button
          className="absolute top-4 left-4 text-white"
          onClick={() => router.push('/')}
        >
          <FaTimes />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {bookingData.venueName || 'Confirmed Venue'}
          </h2>
          <p className="text-sm text-white text-opacity-90">
            {bookingData.venueLocation || 'Location TBD'}
          </p>

          <div className="mt-4 mb-2 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <FaCheckCircle className="text-green-500 text-2xl" />
            </div>
          </div>

          <h1 className="text-2xl font-bold">Booking confirmed</h1>
        </div>
      </div>

      {/* Alert Card */}
      <div className="bg-yellow-100 border border-yellow-300 mx-6 p-4 rounded-xl mt-4 text-sm shadow-sm">
        <div className="flex items-start">
          <FaExclamationCircle className="text-yellow-600 mt-1 mr-3" />
          <p className="text-gray-700 font-medium">
            DJ will arrive 30 mins before your event start time.
          </p>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="mt-6 mx-6 bg-white rounded-xl shadow p-5 text-sm text-gray-700">
        <h3 className="text-xs uppercase text-gray-400 font-semibold mb-4">
          Reservation Details
        </h3>

        <div className="flex items-center mb-3">
          <FaUsers className="mr-3 text-blue-500" />
          Guests: {bookingData.guestCount || 0}
        </div>

        <div className="flex items-center mb-3">
          <FaClock className="mr-3 text-blue-500" />
          Time: {formatTime(bookingData.startTime)} – {formatTime(bookingData.endTime)}
        </div>

        <div className="flex items-center mb-3">
          <FaMapMarkerAlt className="mr-3 text-blue-500" />
          {formatDate(bookingData.eventDate)}
        </div>

        <div className="flex justify-between mt-4">
          <button className="text-red-500 text-sm font-medium">
            Cancel booking
          </button>
          <button className="text-blue-500 text-sm font-medium flex items-center">
            <FaShareAlt className="mr-1" /> Share
          </button>
        </div>
      </div>

      {/* Offer Section */}
      <div className="mt-6 mx-6 mb-10 bg-white rounded-xl shadow p-5 text-sm text-gray-700">
        <h3 className="text-xs uppercase text-gray-400 font-semibold mb-4">
          Savings Corner
        </h3>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-black">Gold Offer - 15% OFF</p>
            <p className="text-gray-600 text-xs">
              Pay remaining balance online before your event.
            </p>
            <a className="text-blue-500 text-xs mt-1 inline-block">More details</a>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 font-bold text-lg">⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// The main page component with Suspense boundary
export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
} 