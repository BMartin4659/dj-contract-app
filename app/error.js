'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-8">We apologize for the inconvenience. Please try again later.</p>
        <button
          onClick={reset}
          className="text-blue-500 hover:text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 