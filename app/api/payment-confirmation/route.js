import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import nodemailer from 'nodemailer';

// Function to send an email confirmation 
async function sendEmailConfirmation(bookingDetails) {
  try {
    // Get configuration from environment
    const EMAIL_SENDER = process.env.EMAIL_SENDER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    
    if (!EMAIL_SENDER || !EMAIL_PASSWORD) {
      console.warn('Email service configuration missing');
      return { 
        success: false, 
        warning: 'Email configuration missing',
        fallback: true 
      };
    }
    
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASSWORD,
      },
    });
    
    // Format amount as currency
    const formattedAmount = typeof bookingDetails.amount === 'number' 
      ? `$${bookingDetails.amount.toFixed(2)}` 
      : bookingDetails.amount;
      
    // Current date formatted nicely
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calculate date 2 weeks before event for the planning call
    let formattedPlanningDate = 'TBD';
    try {
      if (bookingDetails.eventDate) {
        const eventDate = new Date(bookingDetails.eventDate);
        const planningCallDate = new Date(eventDate);
        planningCallDate.setDate(eventDate.getDate() - 14);
        formattedPlanningDate = planningCallDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (dateError) {
      console.warn('Error calculating planning date:', dateError);
      formattedPlanningDate = 'Two weeks before your event';
    }
    
    // Build email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Booking Confirmation</title>
        <style type="text/css">
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
            -webkit-text-size-adjust: none;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            background-color: #ffffff;
          }
          .header {
            text-align: center;
            background-color: #3b82f6; /* Fallback color for Gmail */
            padding: 20px;
            border-radius: 10px 10px 0 0;
          }
          .content {
            padding: 20px;
          }
          .section {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .success-section {
            background-color: #f0fdf4;
            border: 1px solid #dcfce7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
          }
          h1 {
            color: white;
            margin: 0;
            font-size: 28px;
          }
          h2 {
            color: #4F46E5;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 15px;
          }
          h3 {
            color: #4b5563;
            font-size: 18px;
            margin-top: 0;
          }
          strong {
            color: #111827;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #6b7280;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://firebasestorage.googleapis.com/v0/b/dj-contract-app.appspot.com/o/logo.png?alt=media" 
                 alt="DJ Bobby Drake Logo" 
                 width="150" 
                 height="150" 
                 style="display: inline-block; width: 150px; height: auto; border: 0; outline: none; text-decoration: none; margin: 0 auto;">
            <h1>Booking Confirmation</h1>
          </div>
          
          <div class="content">
            <div class="success-section">
              <div style="font-size: 48px; color: #22c55e;">✓</div>
              <h2 style="color: #15803d;">Thank You For Your Booking!</h2>
              <p>Your event has been confirmed for <strong>${bookingDetails.eventDate || 'TBD'}</strong></p>
            </div>
            
            <p>Dear ${bookingDetails.clientName || 'Customer'},</p>
            
            <p>I'm thrilled that you've chosen DJ Bobby Drake for your upcoming ${bookingDetails.eventType || 'event'}! I'm excited to create an unforgettable experience for you and your guests.</p>
            
            <div class="section">
              <h3>Event Details</h3>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Event Type:</span>
                <span style="color: #111827;">${bookingDetails.eventType || 'TBD'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Date:</span>
                <span style="color: #111827;">${bookingDetails.eventDate || 'TBD'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Venue:</span>
                <span style="color: #111827;">${bookingDetails.venueName || 'TBD'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Time:</span>
                <span style="color: #111827;">${bookingDetails.startTime || 'TBD'} - ${bookingDetails.endTime || 'TBD'}</span>
              </div>
            </div>
            
            <div class="section">
              <h3>Payment Information</h3>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Booking ID:</span>
                <span style="color: #111827;">${bookingDetails.bookingId || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Amount:</span>
                <span style="color: #111827;">${formattedAmount || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Payment Method:</span>
                <span style="color: #111827;">${bookingDetails.paymentMethod || 'N/A'}</span>
              </div>
            </div>
            
            <p>I'll be in touch soon to discuss the details of your event. If you have any questions or specific requests in the meantime, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>
            DJ Bobby Drake<br>
            <a href="mailto:therealdjbobbydrake@gmail.com">therealdjbobbydrake@gmail.com</a></p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} DJ Bobby Drake. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send the email
    const mailOptions = {
      from: EMAIL_SENDER,
      to: bookingDetails.email,
      subject: `Your Booking Confirmation - DJ Bobby Drake`,
      html: htmlContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message || 'Error sending email',
      fallbackMessage: "We've saved your booking but couldn't send the confirmation email right now. We'll contact you shortly."
    };
  }
}

export async function POST(request) {
  try {
    // Parse request body
    const bookingDetails = await request.json();
    
    // Check for required fields
    if (!bookingDetails.bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing booking ID' },
        { status: 400 }
      );
    }
    
    // Get firestore document reference
    const bookingRef = doc(db, 'djContracts', bookingDetails.bookingId);
    
    // Validate document exists
    const bookingDoc = await getDoc(bookingRef);
    if (!bookingDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Get booking data
    const bookingData = bookingDoc.data();
    
    // Merge data from the request with data from the database
    const mergedBookingDetails = {
      ...bookingData,
      ...bookingDetails,
      // Ensure we have an email address
      email: bookingDetails.email || bookingData.email
    };
    
    // Send the email
    const emailResult = await sendEmailConfirmation(mergedBookingDetails);
    
    // Update document with confirmation email status
    try {
      await updateDoc(bookingRef, {
        emailConfirmationSent: emailResult.success,
        emailConfirmationDate: serverTimestamp(),
        emailConfirmationId: emailResult.messageId || null,
        lastUpdated: serverTimestamp()
      });
    } catch (updateError) {
      console.error('Error updating booking with email status:', updateError);
      // Continue processing - don't fail the API call if only the update fails
    }
    
    // Return appropriate response
    if (emailResult.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Confirmation email sent successfully',
        messageId: emailResult.messageId || null
      });
    } else if (emailResult.fallback) {
      return NextResponse.json({ 
        success: false, 
        warning: emailResult.warning || 'Email sending failed with a recoverable issue',
        fallbackMessage: 'Your booking is confirmed, but the email notification could not be sent at this time.'
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: emailResult.error || 'Failed to send confirmation email',
        fallbackMessage: emailResult.fallbackMessage || 'We have your booking, but could not send an email confirmation.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing confirmation request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Server error processing confirmation',
        fallbackMessage: 'Something went wrong. Please try again or contact us directly.'
      },
      { status: 500 }
    );
  }
} 