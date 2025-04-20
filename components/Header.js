import React from 'react';
import { FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="mb-4" style={{ paddingTop: '1rem' }}>
      {/* Logo and Title */}
      <h1
        className="text-center text-[clamp(1.5rem,5vw,2.5rem)] text-[#111] mb-3 leading-tight flex justify-center items-center gap-2"
      >
        <span className="text-2xl">🎧</span> <span>Live&nbsp;City&nbsp;DJ&nbsp;Contract</span>
      </h1>

      {/* Contact Information */}
      <div
        className="flex justify-center items-center gap-8 mb-4 text-base flex-wrap px-2"
      >
        <span className="flex items-center gap-1.5">
          <FaEnvelope className="text-[#0070f3]" />
          <a
            href="mailto:therealdjbobbydrake@gmail.com"
            className="text-[#0070f3] no-underline hover:underline text-sm"
          >
            therealdjbobbydrake@gmail.com
          </a>
        </span>
      </div>
    </header>
  );
};

export default Header; 