'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

// Separate component that uses searchParams
function PaymentDetails() {
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState('');
  
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setPaymentId(id);
    }
  }, [searchParams]);

  return (
    <>
      {paymentId && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6 w-full">
          <p className="text-sm text-gray-500 mb-1">Transaction ID:</p>
          <p className="text-gray-700 font-mono text-sm break-all">{paymentId}</p>
        </div>
      )}
    </>
  );
}

// Fallback while loading
function PaymentDetailsFallback() {
  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-6 w-full animate-pulse">
      <p className="text-sm text-gray-500 mb-1">Transaction ID:</p>
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}

export default function PaymentSuccess() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-auto text-center">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <FaCheckCircle size={48} className="text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">Your DJ booking is now confirmed.</p>
          
          <Suspense fallback={<PaymentDetailsFallback />}>
            <PaymentDetails />
          </Suspense>
          
          <div className="space-y-4 w-full">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">What happens next?</h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li>• You will receive a confirmation email with your receipt</li>
                <li>• Your DJ will contact you to discuss event details</li>
                <li>• You can view your booking in your account dashboard</li>
              </ul>
            </div>
            
            <Link href="/" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
              <FaArrowLeft className="mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 