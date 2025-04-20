import React from 'react';
import { MdEmail } from 'react-icons/md';

const Header = () => {
  return (
    <div className="text-center w-full mb-5">
      {/* Title without headphone icon */}
      <h1 className="text-3xl md:text-4xl font-bold text-black mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
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