'use client';

import { useState } from 'react';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaClock, FaBuilding,
  FaMapMarkerAlt, FaUsers, FaCreditCard, FaMusic
} from 'react-icons/fa';
import { SiVenmo, SiCashapp } from 'react-icons/si';

const SONG_CATEGORIES = {
  firstDance: {
    label: "First Dance Song",
    icon: "💃",
    songs: [
      "Perfect – Ed Sheeran (2017)",
      "Lover – Taylor Swift (2019)",
      "All of Me – John Legend (2013)",
      "Say You Won't Let Go – James Arthur (2016)",
      "Beyond – Leon Bridges (2018)",
      "Falling Like the Stars – James Arthur (2019)",
      "Love Someone – Lukas Graham (2018)",
      "First Time – Kygo & Ellie Goulding (2022)"
    ]
  },
  fatherDaughter: {
    label: "Father-Daughter Dance",
    icon: "👨‍👧",
    songs: [
      "Yours – Post Malone (2024)",
      "My Little Girl – Tim McGraw (2006)",
      "Gracie – Ben Folds (2005)",
      "Daughters – John Mayer (2003)",
      "My Girl – The Temptations (1965)",
      "I Loved Her First – Heartland (2006)",
      "When You Wish Upon a Star – Cliff Edwards (1940)",
      "You're My Best Friend – Queen (1975)"
    ]
  },
  motherSon: {
    label: "Mother-Son Dance",
    icon: "👩‍👦",
    songs: [
      "What a Wonderful World – Louis Armstrong (1967)",
      "My Wish – Rascal Flatts (2006)",
      "A Song for Mama – Boyz II Men (1997)",
      "You'll Be in My Heart – Phil Collins (1999)",
      "Humble and Kind – Tim McGraw (2015)",
      "Simple Man – Shinedown (2003)",
      "Landslide – Fleetwood Mac (1975)",
      "Unforgettable – Nat King Cole & Natalie Cole (1991)"
    ]
  },
  bouquetToss: {
    label: "Bouquet Toss Song",
    icon: "💐",
    songs: [
      "Single Ladies (Put a Ring on It) – Beyoncé (2008)",
      "Dear Future Husband – Meghan Trainor (2015)",
      "Love On Top – Beyoncé (2011)",
      "That's What I Like – Bruno Mars (2016)",
      "Blinding Lights – The Weeknd (2019)",
      "Girls Just Want to Have Fun – Cyndi Lauper (1983)",
      "Levitating – Dua Lipa (2020)",
      "Juice – Lizzo (2019)"
    ]
  },
  garterToss: {
    label: "Garter Toss Song",
    icon: "👰‍♂️",
    songs: [
      "Pony – Ginuwine (1996)",
      "Hot in Herre – Nelly (2002)",
      "Let's Get It On – Marvin Gaye (1973)",
      "Rock Your Body – Justin Timberlake (2002)",
      "SexyBack – Justin Timberlake (2006)",
      "Drunk in Love – Beyoncé ft. Jay-Z (2013)",
      "Savage – Megan Thee Stallion (2020)",
      "Dangerous – Kardinal Offishall ft. Akon (2008)"
    ]
  },
  partyEntrance: {
    label: "Wedding Party Entrance",
    icon: "🎉",
    songs: [
      "24K Magic – Bruno Mars (2016)",
      "Crazy in Love – Beyoncé ft. Jay-Z (2003)",
      "I Ain't Worried – OneRepublic (2022)",
      "Blinding Lights – The Weeknd (2019)",
      "As It Was – Harry Styles (2022)",
      "The Giver – Chappell Roan (2023)",
      "Bring Em Out – T.I. (2004)",
      "On Top of the World – Imagine Dragons (2012)"
    ]
  },
  coupleEntrance: {
    label: "Bride & Groom Entrance",
    icon: "💑",
    songs: [
      "Can't Help Falling in Love – Kina Grannis (2015)",
      "Perfect – Ed Sheeran (2017)",
      "Can You Feel the Love Tonight – Elton John (1994)",
      "Time of Our Lives – Pitbull & Ne-Yo (2014)",
      "Sugar – Maroon 5 (2015)",
      "Signed, Sealed, Delivered (I'm Yours) – Stevie Wonder (1970)",
      "Marry You – Bruno Mars (2010)",
      "This Will Be (An Everlasting Love) – Natalie Cole (1975)"
    ]
  },
  lastDance: {
    label: "Last Dance Song",
    icon: "🎶",
    songs: [
      "Last Dance – Donna Summer (1978)",
      "(I've Had) The Time of My Life – Bill Medley & Jennifer Warnes (1987)",
      "Sweet Caroline – Neil Diamond (1969)",
      "All You Need is Love – The Beatles (1967)",
      "Don't Stop Believin' – Journey (1981)",
      "Closing Time – Semisonic (1998)",
      "Bye Bye Bye – NSYNC (2000)",
      "Lover – Taylor Swift (2019)"
    ]
  }
};

export default function BookingForm() {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedSongs, setSelectedSongs] = useState({});
  const [customSongs, setCustomSongs] = useState({});

  const handleSongSelection = (category, song) => {
    setSelectedSongs(prev => ({
      ...prev,
      [category]: song
    }));
    // Clear custom input when selecting from list
    setCustomSongs(prev => ({
      ...prev,
      [category]: ''
    }));
  };

  const handleCustomSong = (category, value) => {
    setCustomSongs(prev => ({
      ...prev,
      [category]: value
    }));
    // Clear selected song when typing custom
    if (value) {
      setSelectedSongs(prev => ({
        ...prev,
        [category]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white/70 backdrop-blur-md shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
            DJ Bobby Drake
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
            Book an Event
          </h2>
        </div>

        <form className="space-y-4">
          <LabeledInput icon={<FaUser />} placeholder="Client Full Name" />
          <LabeledInput icon={<FaEnvelope />} placeholder="Email" type="email" />
          <LabeledInput icon={<FaPhone />} placeholder="Phone Number" type="tel" />

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type</label>
            <select className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-base">
              <option>Wedding</option>
              <option>Birthday</option>
              <option>Club Night</option>
              <option>Corporate Event</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <LabeledInput icon={<FaClock />} placeholder="Start Time" type="time" />
            </div>
            <div className="flex-1">
              <LabeledInput icon={<FaClock />} placeholder="End Time" type="time" />
            </div>
          </div>

          <LabeledInput icon={<FaBuilding />} placeholder="Venue Name" />
          <LabeledInput icon={<FaMapMarkerAlt />} placeholder="Venue Location" />
          <LabeledInput icon={<FaUsers />} placeholder="Number of Guests" type="number" />

          {/* Song Selection Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaMusic className="text-blue-600" />
              Song Selections
            </h3>
            
            {/* Test if this section renders */}
            <div className="text-sm text-gray-600">
              Found {Object.keys(SONG_CATEGORIES).length} song categories
            </div>
            
            {/* Simple test dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                🎵 Test Dropdown
              </label>
              <select className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base bg-white">
                <option value="">Select a test option...</option>
                <option value="test1">Test Song 1</option>
                <option value="test2">Test Song 2</option>
                <option value="test3">Test Song 3</option>
              </select>
            </div>
            
            {Object.entries(SONG_CATEGORIES).map(([category, categoryData]) => (
              <SongSelector
                key={category}
                category={category}
                label={categoryData.label}
                icon={categoryData.icon}
                songs={categoryData.songs}
                selectedSong={selectedSongs[category] || ''}
                customSong={customSongs[category] || ''}
                onSongSelect={(song) => handleSongSelection(category, song)}
                onCustomSong={(value) => handleCustomSong(category, value)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700 font-medium text-sm sm:text-base">Additional Hours</span>
            <label className="inline-flex items-center cursor-pointer relative">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full transition-all duration-300"></div>
              <div className="absolute left-0 top-0 ml-1 mt-1 w-4 h-4 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 transition-all duration-300"></div>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">Payment Method</label>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              {['card', 'venmo', 'cashapp'].map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === method ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="accent-blue-500"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  {method === 'card' && <FaCreditCard className="text-lg" />}
                  {method === 'venmo' && <SiVenmo className="text-lg" />}
                  {method === 'cashapp' && <SiCashapp className="text-lg" />}
                  <span className="capitalize text-sm sm:text-base">{method}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all active:bg-blue-800 touch-manipulation"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

function SongSelector({ category, label, icon, songs, selectedSong, customSong, onSongSelect, onCustomSong }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        <span className="mr-2">{icon}</span>
        {label}
        <span className="text-xs text-gray-500 ml-2">({songs?.length || 0} songs)</span>
      </label>
      
      {/* Dropdown for predefined songs */}
      <select 
        value={selectedSong}
        onChange={(e) => onSongSelect(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base bg-white"
      >
        <option value="">Choose from popular songs...</option>
        {songs?.map((song, index) => (
          <option key={`${category}-song-${index}`} value={song}>
            {song}
          </option>
        ))}
      </select>
      
      {/* Custom input field */}
      <input
        type="text"
        placeholder="Or enter custom song & artist..."
        value={customSong}
        onChange={(e) => onCustomSong(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base"
      />
    </div>
  );
}

function LabeledInput({ icon, placeholder, type = 'text' }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
      />
    </div>
  );
}
