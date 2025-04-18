'use client';

export default function MinimalTest() {
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
  
  return (
    <div>
      <h1>Test Component</h1>
    </div>
  );
} 