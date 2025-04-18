'use client';

import { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function DJContractForm() {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    contactPhone: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  
  function validateEmail(email) {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domainParts = parts[1].split('.');
    return parts[0].length > 0 && domainParts.length >= 2 && domainParts.every(p => p.length > 0);
  }
  
  function validatePhone(phone) {
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    return digitsOnly.length === 10;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (!validatePhone(formData.contactPhone)) {
      alert('Please enter a valid phone number (10 digits)');
      return;
    }
    
    // In a real app, you would submit the form data here
    console.log('Form submitted:', formData);
    
    // Show the success message
    setSubmitted(true);
  };
  
  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#222',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px'
  };
  
  return (
    <div style={{
      maxWidth: '650px',
      width: '95%',
      margin: '2rem auto',
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '15px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
    }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        color: '#0070f3'
      }}>
        🎧 DJ Booking Form
      </h1>
      
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>
              <FaUser style={{ marginRight: '8px' }} />
              Name:
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          
          <div>
            <label style={labelStyle}>
              <FaEnvelope style={{ marginRight: '8px' }} />
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          
          <div>
            <label style={labelStyle}>
              <FaPhone style={{ marginRight: '8px' }} />
              Phone:
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          
          <div>
            <label style={labelStyle}>
              <FaCalendarAlt style={{ marginRight: '8px' }} />
              Event Date:
            </label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                <FaClock style={{ marginRight: '8px' }} />
                Start Time:
              </label>
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">Select</option>
                <option value="6:00 PM">6:00 PM</option>
                <option value="7:00 PM">7:00 PM</option>
                <option value="8:00 PM">8:00 PM</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                <FaClock style={{ marginRight: '8px' }} />
                End Time:
              </label>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">Select</option>
                <option value="10:00 PM">10:00 PM</option>
                <option value="11:00 PM">11:00 PM</option>
                <option value="12:00 AM">12:00 AM</option>
              </select>
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>
              Additional Comments:
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: '100px' }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'block',
              margin: '1rem auto',
              width: 'auto',
              minWidth: '200px'
            }}
          >
            Submit Booking
          </button>
        </form>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#0070f3', marginBottom: '1rem' }}>
            🎉 Thank You!
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Your booking request has been submitted successfully. We&apos;ll contact you soon to confirm the details.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Submit Another Request
          </button>
        </div>
      )}
    </div>
  );
} 