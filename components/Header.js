import React from 'react';
import { MdEmail } from 'react-icons/md';
import Image from 'next/image';

const Header = () => {
  return (
    <div className="text-center w-full mb-5">
      {/* Title with company logo */}
      <div className="flex flex-col items-center justify-center mb-3">
        <div className="relative w-64 h-24 mb-2">
          <Image 
            src="/dj-bobby-drake-logo.png" 
            alt="Live City DJ Logo" 
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            style={{ 
              objectFit: "contain",
              maxWidth: "100%",
              height: "auto"
            }}
            priority
            fetchpriority="high"
            unoptimized={true}
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-black" 
          style={{ 
            fontFamily: 'Poppins, sans-serif',
            lineHeight: '1.3'
          }}>
          Event Contract
        </h1>
      </div>
      
      {/* Email address directly under the header */}
      <div className="flex justify-center items-center mt-2 text-blue-700">
        <a 
          href="mailto:therealdjbobbydrake@gmail.com"
          className="hover:underline font-medium text-sm md:text-base flex items-center"
          style={{ 
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '0.01em'
          }}
        >
          <MdEmail className="mr-1 text-blue-600" />
          therealdjbobbydrake@gmail.com
        </a>
      </div>
    </div>
  );
};

export default Header; 