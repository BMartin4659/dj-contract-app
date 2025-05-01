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
          <Logo width={40} height={40} />
          <span className="ml-2">Live City DJ</span>
        </Link>
        
        <nav>
          <ul className="flex space-x-6">
            {!minimal && (
              <>
                <li>
                  <Link href="/booking" className="text-white hover:text-purple-400 flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    Book Now
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-white hover:text-purple-400 flex items-center">
                    <FaSignInAlt className="mr-2" />
                    Dashboard
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