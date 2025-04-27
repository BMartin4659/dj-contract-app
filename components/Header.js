import React from 'react';
import { MdEmail } from 'react-icons/md';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="w-full pt-3 pb-2 text-center">
      <div className="flex flex-col items-center justify-center">
        {/* Logo - 20% increased size */}
        <div className="relative w-32 h-32 mb-0">
          <Image 
            src="/dj-bobby-drake-logo.png" 
            alt="DJ Bobby Drake Logo" 
            width={128}
            height={128}
            sizes="(max-width: 768px) 100vw, 128px"
            style={{ 
              objectFit: "contain",
              maxWidth: "100%",
              height: "auto"
            }}
            priority
          />
        </div>
        
        {/* Title */}
        <div className="text-center mt-0">
          <h1 
            className="mb-2 text-2xl font-bold text-black" 
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              lineHeight: '1.2',
              position: 'relative',
              zIndex: 10,
              letterSpacing: '0.05em',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              fontSize: 'calc(1.5rem * 1.5)' // 50% larger than text-2xl (1.5rem)
            }}
          >
            <span style={{ display: 'inline-block', padding: '0 0.5rem' }}>Event Contract</span>
          </h1>
          
          {/* Email address */}
          <div className="mt-1 text-blue-700">
            <a 
              href="mailto:therealdjbobbydrake@gmail.com"
              className="flex items-center justify-center font-medium text-sm hover:underline md:text-base"
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
    </header>
  );
};

export default Header; 