import React from 'react';
import { MdEmail } from 'react-icons/md';

const Header = () => {
  return (
    <div className="text-center w-full mb-5">
      {/* Title with detailed headphone icon */}
      <h1 className="text-3xl md:text-4xl font-bold text-black mb-2 flex items-center justify-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <svg 
          width="36" 
          height="36" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 text-blue-600"
        >
          {/* Headphone outer curve */}
          <path 
            d="M12 3C7.03 3 3 7.03 3 12V19H6V12C6 8.7 8.7 6 12 6C15.3 6 18 8.7 18 12V19H21V12C21 7.03 16.97 3 12 3Z" 
            fill="currentColor" 
            opacity="0.8"
          />
          {/* Left ear cup */}
          <path 
            d="M4 19H7.5C8.33 19 9 19.67 9 20.5V21.5C9 22.33 8.33 23 7.5 23H4C3.45 23 3 22.55 3 22V20C3 19.45 3.45 19 4 19Z" 
            fill="currentColor"
          />
          {/* Right ear cup */}
          <path 
            d="M16.5 19H20C20.55 19 21 19.45 21 20V22C21 22.55 20.55 23 20 23H16.5C15.67 23 15 22.33 15 21.5V20.5C15 19.67 15.67 19 16.5 19Z" 
            fill="currentColor"
          />
          {/* Headband bridge detail */}
          <path 
            d="M12 3C14.76 3 17.5 4.38 19.2 6.8" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Sound waves */}
          <path 
            d="M9.5 15C10.8807 15 12 13.8807 12 12.5C12 11.1193 10.8807 10 9.5 10" 
            stroke="currentColor" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d="M14.5 15C13.1193 15 12 13.8807 12 12.5C12 11.1193 13.1193 10 14.5 10" 
            stroke="currentColor" 
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        Live City DJ Contract
      </h1>
      
      {/* Email address directly under the header */}
      <div className="flex justify-center items-center mt-1 text-blue-700">
        <a 
          href="mailto:therealdjbobbydrake@gmail.com"
          className="hover:underline font-medium text-sm md:text-base flex items-center"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <MdEmail className="mr-1 text-blue-600" />
          therealdjbobbydrake@gmail.com
        </a>
      </div>
    </div>
  );
};

export default Header; 