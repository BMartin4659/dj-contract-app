'use client';

import React, { useState, useEffect, memo } from 'react';
import { FaMusic, FaTimes, FaCheck } from 'react-icons/fa';

const GENRE_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    genres: [
      { id: 'pop', name: 'Pop' },
      { id: 'rnb', name: 'R&B' },
      { id: 'hiphop', name: 'Hip Hop' },
      { id: 'rap', name: 'Rap' },
      { id: 'country', name: 'Country' },
      { id: 'rock', name: 'Rock' },
      { id: 'alternative', name: 'Alternative' },
      { id: 'metal', name: 'Metal' },
    ],
  },
  {
    id: 'electronic',
    name: 'Electronic',
    genres: [
      { id: 'edm', name: 'EDM' },
      { id: 'house', name: 'House' },
      { id: 'techno', name: 'Techno' },
      { id: 'trance', name: 'Trance' },
      { id: 'dubstep', name: 'Dubstep' },
      { id: 'trap', name: 'Trap' },
      { id: 'dnb', name: 'Drum & Bass' },
      { id: 'ambient', name: 'Ambient' },
    ],
  },
  {
    id: 'international',
    name: 'International',
    genres: [
      { id: 'latin', name: 'Latin' },
      { id: 'kpop', name: 'K-Pop' },
      { id: 'afrobeats', name: 'Afrobeats' },
      { id: 'reggae', name: 'Reggae' },
      { id: 'reggaeton', name: 'Reggaeton' },
      { id: 'salsa', name: 'Salsa' },
      { id: 'bollywood', name: 'Bollywood' },
      { id: 'jpop', name: 'J-Pop' },
    ],
  },
  {
    id: 'oldies',
    name: 'Decades',
    genres: [
      { id: '60s', name: '60s' },
      { id: '70s', name: '70s' },
      { id: '80s', name: '80s' },
      { id: '90s', name: '90s' },
      { id: '2000s', name: '2000s' },
      { id: '2010s', name: '2010s' },
      { id: 'disco', name: 'Disco' },
      { id: 'classics', name: 'Classics' },
    ],
  },
];

/**
 * Modal component for genre selection
 */
const GenreSelectionModal = memo(({ selectedGenres = [], onClose, onSave }) => {
  const [animateIn, setAnimateIn] = useState(false);
  const [selections, setSelections] = useState(new Set(selectedGenres));

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Toggle selected genre
  const toggleGenre = (genreId) => {
    setSelections((prev) => {
      const newSelections = new Set(prev);
      if (newSelections.has(genreId)) {
        newSelections.delete(genreId);
      } else {
        newSelections.add(genreId);
      }
      return newSelections;
    });
  };

  // Save changes and close
  const applyChanges = () => {
    onSave(Array.from(selections));
    onClose();
  };

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
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <FaMusic className="text-blue-500 mr-2" /> Select Your Music Preferences
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {GENRE_CATEGORIES.map((category) => (
            <div key={category.id} className="mb-6">
              <h4 className="text-sm uppercase tracking-wider text-gray-600 mb-3">
                {category.name}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {category.genres.map((genre) => {
                  const isSelected = selections.has(genre.id);
                  return (
                    <div
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`py-2 px-3 rounded-lg border cursor-pointer flex items-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {isSelected && (
                        <FaCheck className="text-blue-500 mr-1.5" size={12} />
                      )}
                      <span className={isSelected ? 'font-medium' : ''}>
                        {genre.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={applyChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Selections
          </button>
        </div>
      </div>
    </div>
  );
});

GenreSelectionModal.displayName = 'GenreSelectionModal';

export default GenreSelectionModal; 