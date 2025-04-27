import React from 'react';
import { MdEmail } from 'react-icons/md';
import Image from 'next/image';

const Header = () => {
  return (
    <div className="text-center w-full mb-5 relative">
      {/* Circular Text "Event Contract" */}
      <div className="absolute w-full flex justify-center" style={{ top: '-10px' }}>
        <div className="relative" style={{ width: '230px', height: '40px' }}>
          <svg viewBox="0 0 500 100" style={{ overflow: 'visible' }}>
            <path
              id="curve"
              d="M 50, 100 A 100, 50 0 1, 1 450, 100"
              fill="transparent"
            />
            <text width="500" style={{ fontWeight: 'bold', fontSize: '24px' }}>
              <textPath xlinkHref="#curve" startOffset="50%" textAnchor="middle" fill="#0070f3">
                Event Contract
              </textPath>
            </text>
          </svg>
        </div>
      </div>

      {/* Logo in center */}
      <div className="relative flex flex-col items-center justify-center pt-8">
        <div className="relative w-48 h-20 mb-2">
          <Image 
            src="/dj-bobby-drake-logo.png" 
            alt="Live City DJ Logo" 
            width={192}
            height={80}
            sizes="192px"
            style={{ 
              objectFit: "contain",
              maxWidth: "100%",
              height: "auto"
            }}
            priority
            unoptimized={true}
          />
        </div>
        
        {/* Email address directly under the logo */}
        <div className="flex justify-center items-center mt-1 text-blue-700">
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
    </div>
  );
};

export default Header; 