import React from 'react';
import { FaPhone, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="mb-8">
      {/* Logo and Title */}
      <h1
        className="text-center text-[clamp(1.75rem,6vw,3rem)] text-[#111] mb-8 leading-tight flex justify-center items-center gap-2"
      >
        <span className="text-3xl">🎧</span> <span>Live&nbsp;City&nbsp;DJ&nbsp;Contract</span>
      </h1>

      {/* Contact Information */}
      <div
        className="flex justify-center items-center gap-8 mb-10 text-base flex-wrap p-4 mt-4"
      >
        <span className="flex items-center gap-1.5">
          <FaPhone className="text-[#0070f3]" />
          <a
            href="tel:+12036949388"
            className="text-[#0070f3] no-underline hover:underline"
          >
            (203) 694‑9388
          </a>
        </span>

        <span
          className="h-4 w-px bg-[#ccc] inline-block"
        />

        <span className="flex items-center gap-1.5">
          <FaEnvelope className="text-[#0070f3]" />
          <a
            href="mailto:therealdjbobbydrake@gmail.com"
            className="text-[#0070f3] no-underline hover:underline"
          >
            therealdjbobbydrake@gmail.com
          </a>
        </span>
      </div>
    </header>
  );
};

export default Header; 