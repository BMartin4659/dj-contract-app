/**
 * API route for sending confirmation emails
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Log the incoming request data
    console.log('Received email request:', JSON.stringify(data));
    
    // Check for required fields
    if (!data.email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    // In a real implementation, this would send the email
    // For now, we'll just simulate success
    
    // Simulate a short delay to mimic actual email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a success response
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      to: data.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      message: error.message 
    });
  }
} 