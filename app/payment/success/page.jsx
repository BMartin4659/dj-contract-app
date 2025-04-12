'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          ✅ Payment Successful!
        </h1>
        <p className="text-gray-700 mb-2">
          Your event has been booked successfully.
        </p>
        <p className="text-gray-600">
          A confirmation email and receipt have been sent to your email address.
        </p>
        <p className="text-blue-600 mt-4">
          Redirecting to homepage in 5 seconds...
        </p>
      </div>
    </div>
  );
}