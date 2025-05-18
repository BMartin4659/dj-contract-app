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
        <title>Booking Confirmation</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
          }
          .header {
            text-align: center;
            background-image: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
            padding: 20px;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            width: 150px;
            height: auto;
            margin-bottom: 10px;
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
            <img src="https://dj-contract-app.vercel.app/logo.png" alt="DJ Bobby Drake Logo" class="logo" style="width: 150px; height: auto;">
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
            
            <p>Best regards,<br>DJ Bobby Drake<br>
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
    const requestData = await request.json();
    const { bookingId, paymentMethod, clientName, email, eventType, eventDate, venueName, venueLocation, startTime, endTime, totalAmount } = requestData;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing required parameter: bookingId' },
        { status: 400 }
      );
    }

    // Get the booking document
    const bookingRef = doc(db, "djContracts", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = bookingSnap.data();

    // Update the booking document with payment information
    await updateDoc(bookingRef, {
      paymentMethod: paymentMethod || bookingData.paymentMethod,
      paymentStatus: 'pending',
      paymentInitiated: true,
      paymentInitiatedAt: serverTimestamp(),
      paymentInitiatedMethod: paymentMethod || bookingData.paymentMethod,
      lastUpdated: serverTimestamp(),
      emailSent: true,
      emailSentAt: serverTimestamp()
    });

    // Extract booking details from both request and database
    const bookingDetails = {
      bookingId,
      paymentMethod: paymentMethod || bookingData.paymentMethod,
      amount: totalAmount || bookingData.totalAmount || 0,
      eventDate: eventDate || bookingData.eventDate || '',
      clientName: clientName || bookingData.clientName || '',
      venueName: venueName || bookingData.venueName || '',
      venueLocation: venueLocation || bookingData.venueLocation || '',
      email: email || bookingData.email || '',
      eventType: eventType || bookingData.eventType || '',
      startTime: startTime || bookingData.startTime || '',
      endTime: endTime || bookingData.endTime || '',
    };

    // Send confirmation email
    const emailResult = await sendEmailConfirmation(bookingDetails);
    
    // Return success response with booking details
    return NextResponse.json({
      success: true,
      message: 'Payment confirmation recorded successfully',
      bookingDetails,
      emailSent: emailResult.success,
      emailDetails: emailResult
    });
  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    
    return NextResponse.json(
      { error: 'Server error processing payment confirmation' },
      { status: 500 }
    );
  }
} 