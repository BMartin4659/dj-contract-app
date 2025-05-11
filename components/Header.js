import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './Logo';
import { FaCalendarAlt, FaSignInAlt } from 'react-icons/fa';

const Header = ({ minimal = false }) => {
  return (
    <header className="py-4 mb-6">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-xl flex items-center">
          <div className="flex-shrink-0 flex items-center">
            <Logo width={40} height={40} className="block md:block" />
            <span className="ml-2 hidden sm:inline">Live City DJ</span>
          </div>
        </Link>
        
        <nav>
          <ul className="flex space-x-3 sm:space-x-6">
            {!minimal && (
              <>
                <li>
                  <Link href="/booking" className="text-white hover:text-purple-400 flex items-center text-sm sm:text-base">
                    <FaCalendarAlt className="mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Book Now</span>
                    <span className="xs:hidden">Book</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-white hover:text-purple-400 flex items-center text-sm sm:text-base">
                    <FaSignInAlt className="mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Dashboard</span>
                    <span className="xs:hidden">Login</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 