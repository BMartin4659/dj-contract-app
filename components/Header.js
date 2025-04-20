import React from 'react';
import { MdEmail } from 'react-icons/md';

const Header = () => {
  return (
    <div className="text-center w-full mb-6">
      <div className="flex items-center justify-center gap-3">
        {/* Custom headphone icon with better styling */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path 
                d="M3 14H5V18H3V14Z" 
                fill="currentColor" 
              />
              <path 
                d="M19 14H21V18H19V14Z" 
                fill="currentColor" 
              />
              <path 
                d="M12 2C7.03 2 3 6.03 3 11V14H5V11C5 7.14 8.14 4 12 4C15.86 4 19 7.14 19 11V14H21V11C21 6.03 16.97 2 12 2Z" 
                fill="currentColor" 
              />
              <path 
                d="M7 14V18C7 20.21 8.79 22 11 22H13C15.21 22 17 20.21 17 18V14H15V18C15 19.1 14.1 20 13 20H11C9.9 20 9 19.1 9 18V14H7Z" 
                fill="currentColor" 
              />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
        
        <h1 className="text-4xl font-bold text-gradient">
          Live City DJ Contract
        </h1>
      </div>
      
      <div className="flex justify-center items-center mt-3 text-blue-600 bg-blue-50 rounded-full py-1.5 px-5 mx-auto w-fit shadow-sm">
        <MdEmail className="mr-2 text-blue-600" />
        <a 
          href="mailto:therealdj-bobbydrake@gmail.com"
          className="hover:underline text-blue-700 font-medium"
        >
          therealdj-bobbydrake@gmail.com
        </a>
      </div>
    </div>
  );
};

export default Header; 