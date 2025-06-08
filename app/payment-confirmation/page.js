'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  FaExclamationTriangle, 
  FaTimes, 
  FaUsers, 
  FaClock, 
  FaCalendarAlt,
  FaShare,
  FaExclamationCircle
} from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

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
        console.error('Error loading booking data:', err);
        setError(err.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    loadBookingData();
  }, [searchParams]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

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
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading booking details...</h2>
          <p className="text-gray-600 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
        backgroundImage: 'url(/party-theme-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-3xl text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600">Booking Failed</h2>
          <p className="text-gray-600 mt-2 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
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
      <div className="bg-green-500 text-white px-4 pb-10 pt-6 relative shadow-md">
        <div className="max-w-2xl mx-auto relative">
          <button
            className="absolute top-0 left-0 text-white md:left-4"
            onClick={() => router.push('/')}
          >
            <FaTimes size={22} />
          </button>

          <div className="text-center mt-6">
            <h2 className="text-xl font-bold">
              {bookingData?.venueName || 'The Banquet Hall'}
            </h2>
            <p className="text-sm opacity-90">
              {bookingData?.venueLocation || '8A Oakland Court'}
            </p>

            <div className="mt-6 mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                <Image 
                  src="/dj-bobby-drake-logo.png" 
                  alt="DJ Bobby Drake" 
                  width={60} 
                  height={60}
                  className="rounded-full object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold">Booking confirmed</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-10">
        {/* Alert Card */}
        <div className="bg-yellow-100 mx-4 p-4 rounded-lg -mt-5 border border-yellow-200 shadow-sm">
          <div className="flex items-start">
            <FaExclamationCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-gray-700">
              DJ will arrive 30 mins before your event start time.
            </p>
          </div>
        </div>

        {/* Payment Button - Made more prominent */}
        <div className="mt-8 mx-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-3 text-center">
            COMPLETE YOUR BOOKING
          </h3>
          <Link href={`/payment?bookingId=${bookingData?.id}`}>
            <button 
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-colors text-lg flex items-center justify-center"
              style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
            >
              <span className="mr-2">💳</span> Proceed to Payment
            </button>
          </Link>
          <p className="text-xs text-center text-gray-500 mt-2">Secure payment processing by Stripe</p>
        </div>

        {/* Reservation Details */}
        <div className="mt-6 mx-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-3">
            RESERVATION DETAILS
          </h3>

          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="flex items-center">
              <FaUsers className="text-blue-500 mr-3" />
              <span>Guests: {bookingData?.guestCount || 100}</span>
            </div>

            <div className="flex items-center">
              <FaClock className="text-blue-500 mr-3" />
              <span>Time: {formatTime(bookingData?.startTime) || '4:00 PM'} - {formatTime(bookingData?.endTime) || '9:00 PM'}</span>
            </div>

            <div className="flex items-center">
              <FaCalendarAlt className="text-blue-500 mr-3" />
              <span>{formatDate(bookingData?.eventDate) || 'Fri, May 16'}</span>
            </div>

            <div className="flex justify-between pt-2 mt-2 border-t">
              <button className="text-red-500 font-medium text-sm">
                Cancel booking
              </button>
              <button className="text-blue-500 font-medium text-sm flex items-center">
                <FaShare className="mr-1" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentConfirmation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
} 