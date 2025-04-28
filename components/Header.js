import React from 'react';
import { MdEmail } from 'react-icons/md';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="w-full pt-3 pb-2 text-center">
      <div className="flex flex-col items-center justify-center">
        {/* Logo with Next.js Image for better optimization */}
        <div className="relative" style={{ width: '200px', height: '200px', margin: '0 auto' }}>
          <Image 
            src="/dj-bobby-drake-logo.png" 
            alt="DJ Bobby Drake Logo" 
            fill
            sizes="(max-width: 768px) 200px, 200px"
            priority={true}
            quality={100}
            style={{ 
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
        </div>
        
        {/* Title */}
        <div className="text-center mt-4">
          <h1 
            className="mb-2 font-bold text-black" 
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              lineHeight: '1.2',
              position: 'relative',
              zIndex: 10,
              letterSpacing: '0.05em',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              fontSize: 'calc(1.5rem * 1.2)'
            }}
          >
            Event Contract
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