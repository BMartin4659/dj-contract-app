import React from 'react';

export const SpotifyLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M85 0C38.1 0 0 38.1 0 85s38.1 85 85 85 85-38.1 85-85S131.9 0 85 0zm39 122.9c-1.6 2.6-4.9 3.4-7.5 1.8-20.5-12.5-46.3-15.4-76.7-8.4-2.9.7-5.8-1.1-6.5-4-.7-2.9 1.1-5.8 4-6.5 33.3-7.6 62-4.3 85.2 9.6 2.6 1.6 3.4 4.9 1.8 7.5zm10.4-23.1c-2 3.2-6.1 4.2-9.3 2.2-23.5-14.4-59.3-18.6-87-10.2-3.6 1.1-7.4-1-8.5-4.6-1.1-3.6 1-7.4 4.6-8.5 31.7-9.6 71.1-5 98.1 11.8 3.2 2 4.2 6.1 2.2 9.3zm.9-24.1c-28.2-16.7-74.7-18.3-101.6-10.1-4.3 1.3-8.8-1.2-10.1-5.5-1.3-4.3 1.2-8.8 5.5-10.1 31-9.4 82.6-7.6 115.2 11.7 3.9 2.3 5.2 7.4 2.9 11.3-2.3 3.9-7.4 5.2-11.3 2.9z"/>
  </svg>
);

export const AppleMusicLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M35.7 0C41 0 45.1 2.5 48.1 5.6c3 3 4.7 7.2 4.3 11.3-4.1-.2-8.4-2.5-11.3-5.6-3-3.1-4.7-7.2-4.3-11.3zM44.4 20c2.3 0 6.8 1.5 10 4.4 1.7-1.7 4.1-2.7 6.5-2.7h.5c-1.3-1.9-2.9-3.6-4.7-5-3.2-3-7.4-4.7-11.5-4.7h-.8c-.2 2.9.7 5.7 2.3 8h-2.3zm33.1 48.5c-.3.9-.5 1.7-.8 2.4-.9 2.3-2.3 4.3-4.1 5.8-1.7 1.5-3.7 2.3-5.8 2.3-2.1 0-3.9-.6-5.2-1.5-1.3-1-2.5-1.5-3.7-1.5s-2.4.5-3.7 1.5c-1.3.9-3.1 1.5-5.2 1.5h-.4c-2 0-3.8-.8-5.4-2.1-1.8-1.5-3.2-3.5-4.1-5.8-2-4.9-3-10.1-3-15.5 0-5.6 1.5-10.3 4.3-13.9 2.8-3.6 6.4-5.4 10.8-5.4 2.1 0 3.9.6 5.2 1.5 1.3 1 2.5 1.5 3.7 1.5s2.4-.5 3.7-1.5c1.3-.9 3.1-1.5 5.2-1.5h.4c4.3 0 7.8 1.7 10.6 5.1l-9.9 5.7c-1.3 2.3-2 4.8-2 7.5 0 2.9.8 5.6 2.3 8l10.1 5.9z"/>
  </svg>
);

export const YoutubeMusicLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
  </svg>
);

export const TidalLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zm4.004 8.008l4.004 4.004L24.024 12l-4.004-4.004-4.004 4.004z"/>
  </svg>
);

export const getStreamingLogo = (service, className) => {
  switch (service?.toLowerCase()) {
    case 'spotify':
      return <SpotifyLogo className={className} />;
    case 'apple':
      return <AppleMusicLogo className={className} />;
    case 'youtube':
      return <YoutubeMusicLogo className={className} />;
    case 'tidal':
      return <TidalLogo className={className} />;
    default:
      return <span className={className}>🎵</span>;
  }
}; 