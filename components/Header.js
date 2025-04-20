import React from 'react';
import Link from 'next/link';
import { FaEnvelope, FaPhone } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center py-5 px-4 md:px-8 w-full">
      <div className="text-center md:text-left mb-4 md:mb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          DJ BMartin Bookings
        </h1>
      </div>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Link href="mailto:djbmartin@gmail.com" className="flex items-center text-white hover:text-blue-300 transition-colors duration-200">
          <FaEnvelope className="mr-2" />
          <span>djbmartin@gmail.com</span>
        </Link>
        <Link href="tel:+1-123-456-7890" className="flex items-center text-white hover:text-blue-300 transition-colors duration-200">
          <FaPhone className="mr-2" />
          <span>+1-123-456-7890</span>
        </Link>
      </div>
    </header>
  );
};

export default Header; 