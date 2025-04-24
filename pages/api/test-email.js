/**
 * Simple API test endpoint for email connectivity checks
 */

export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    message: 'Email API is available',
    timestamp: new Date().toISOString()
  });
} 