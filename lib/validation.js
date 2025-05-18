/**
 * Validates if a string is a valid email format
 * @param {string} email - Email string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a string is a valid phone number
 * @param {string} phone - Phone number string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  return digitsOnly.length === 10;
}; 