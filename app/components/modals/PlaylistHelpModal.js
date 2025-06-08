'use client';

import React, { useState, useEffect } from 'react';
import { FaPlayCircle, FaTimes } from 'react-icons/fa';
import { getStreamingLogo } from '../../components/StreamingLogos';

/**
 * Modal component for playlist help instructions
 */
const PlaylistHelpModal = ({ streamingService, onClose }) => {
  const [animateIn, setAnimateIn] = useState(false);
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Styling for steps
  const numberBadgeStyle = (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: color,
    color: 'white',
    fontWeight: 'bold',
    flexShrink: 0,
  });

  // Get color based on streaming service
  const getServiceColor = () => {
    switch(streamingService?.toLowerCase()) {
      case 'spotify': return '#1DB954';  
      case 'apple music': return '#FF2F54';
      case 'tidal': return '#000000';
      case 'amazon music': return '#00A8E1';
      case 'youtube music': return '#FF0000';
      case 'pandora': return '#00A0EE';
      case 'soundcloud': return '#FF7700';
      default: return '#4299E1';
    }
  };
  
  // Get icon based on streaming service
  const getServiceIcon = () => {
    const logoComponent = getStreamingLogo(streamingService, 'w-8 h-8');
    if (logoComponent) {
      return logoComponent;
    }
    return <FaPlayCircle className="w-8 h-8" style={{ color: getServiceColor() }} />;
  };

  // Streaming service-specific instructions
  const getInstructions = () => {
    const serviceColor = getServiceColor();
    const commonInstructions = [
      {
        title: "Find your favorite songs",
        content: "Search for songs and artists you'd like to hear at your event."
      },
      {
        title: "Create a playlist",
        content: `Create a new playlist named something like "DJ Event - ${new Date().toLocaleDateString()}".`
      },
      {
        title: "Add songs to your playlist",
        content: "Add all the songs you want to hear to your playlist."
      },
      {
        title: "Share your playlist",
        content: "Set your playlist to public, then copy the share link."
      },
      {
        title: "Paste in the form",
        content: "Return to our booking form and paste the playlist link in the designated field."
      }
    ];
    
    switch(streamingService?.toLowerCase()) {
      case 'spotify':
        return [
          {
            title: "Open Spotify",
            content: "Open the Spotify app on your device or go to open.spotify.com."
          },
          ...commonInstructions
        ];
      case 'apple music':
        return [
          {
            title: "Open Apple Music",
            content: "Open the Apple Music app on your device."
          },
          ...commonInstructions,
          {
            title: "Finding the share link",
            content: "Tap the three dots (...) next to your playlist, then tap 'Share' and copy the link."
          }
        ];
      case 'youtube music':
        return [
          {
            title: "Open YouTube Music",
            content: "Open the YouTube Music app or go to music.youtube.com."
          },
          ...commonInstructions,
          {
            title: "Finding the share link",
            content: "Click the three dots next to your playlist, select 'Share', and copy the link."
          }
        ];
      default:
        return [
          {
            title: `Open ${streamingService || 'your music app'}`,
            content: `Open your ${streamingService || 'music streaming'} app or website.`
          },
          ...commonInstructions
        ];
    }
  };

  // Component for logo
  const Logo = () => getStreamingLogo(streamingService, 'w-8 h-8');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      style={{
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <div
        className="bg-white rounded-xl overflow-hidden shadow-xl max-w-lg w-full"
        style={{
          transform: animateIn ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            {Logo ? <Logo /> : <FaPlayCircle className="mr-2" style={{ color: getServiceColor() }} />}
            <span className="ml-2">
              How to Share Your {streamingService || 'Music'} Playlist
            </span>
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {getInstructions().map((instruction, index) => (
              <div key={index} className="flex gap-4">
                <div style={numberBadgeStyle(getServiceColor())}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{instruction.title}</h4>
                  <p className="text-gray-600 mt-1">{instruction.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistHelpModal; 