'use client';

import { useState } from 'react';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaClock, FaBuilding,
  FaMapMarkerAlt, FaUsers, FaCreditCard
} from 'react-icons/fa';
import { SiVenmo, SiCashapp } from 'react-icons/si';

export default function FigmaTestBookingForm() {
  const [paymentMethod, setPaymentMethod] = useState('card');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white/70 backdrop-blur-md shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          DJ Bobby Drake<br /><span className="text-blue-600">Book an Event</span>
        </h1>

        <form className="space-y-4">
          <LabeledInput icon={<FaUser />} placeholder="Client Full Name" />
          <LabeledInput icon={<FaEnvelope />} placeholder="Email" type="email" />
          <LabeledInput icon={<FaPhone />} placeholder="Phone Number" type="tel" />

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type</label>
            <select className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none">
              <option>Wedding</option>
              <option>Birthday</option>
              <option>Club Night</option>
              <option>Corporate Event</option>
            </select>
          </div>

          <div className="flex gap-4">
            <LabeledInput icon={<FaClock />} placeholder="Start Time" type="time" />
            <LabeledInput icon={<FaClock />} placeholder="End Time" type="time" />
          </div>

          <LabeledInput icon={<FaBuilding />} placeholder="Venue Name" />
          <LabeledInput icon={<FaMapMarkerAlt />} placeholder="Venue Location" />
          <LabeledInput icon={<FaUsers />} placeholder="Number of Guests" type="number" />

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700 font-medium">Additional Hours</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 transition-all duration-300"></div>
              <div className="absolute ml-1 w-4 h-4 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 transition-all duration-300"></div>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Payment Method</label>
            <div className="flex flex-wrap gap-4">
              {['card', 'venmo', 'cashapp'].map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
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
                  {method === 'card' && <FaCreditCard className="text-blue-600" />} 
                  {method === 'venmo' && <SiVenmo className="text-blue-500" />} 
                  {method === 'cashapp' && <SiCashapp className="text-green-500" />}
                  <span className="capitalize font-medium">{method === 'card' ? 'Credit Card' : method}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Submit Booking
          </button>
        </form>
      </div>
    </div>
  );
}

function LabeledInput({ icon, placeholder, type = 'text' }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
      />
    </div>
  );
} 