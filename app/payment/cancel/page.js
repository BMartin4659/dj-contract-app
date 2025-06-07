'use client';

import Link from 'next/link';
import { FaTimesCircle, FaArrowLeft } from 'react-icons/fa';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{
      backgroundImage: 'url(/party-theme-background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-auto text-center">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <FaTimesCircle size={48} className="text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">Your DJ booking payment was not completed.</p>
          
          <div className="space-y-4 w-full">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">What you can do next:</h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li>• Try again with a different payment method</li>
                <li>• Contact support if you need assistance</li>
                <li>• Return to the booking form to review your details</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Link href="/" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaArrowLeft className="mr-2" />
                Return to Home
              </Link>
              
              <Link href="/contact" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 