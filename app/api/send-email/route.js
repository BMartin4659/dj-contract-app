import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Function to send email using the configured SMTP transport
async function sendEmailViaService(emailData) {
  try {
    // Get configuration from environment
    const EMAIL_SENDER = process.env.EMAIL_SENDER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    
    if (!EMAIL_SENDER || !EMAIL_PASSWORD) {
      console.warn('Email service configuration missing');
      // Return a partial success with warning instead of throwing an error
      return { 
        success: false, 
        warning: 'Email configuration missing',
        fallback: true 
      };
    }
    
    // Sanitized logging for debugging
    console.log('Email config:', {
      sender: EMAIL_SENDER ? `${EMAIL_SENDER.substring(0, 3)}...${EMAIL_SENDER.split('@')[1]}` : 'missing',
      password: EMAIL_PASSWORD ? '********' : 'missing',
    });
    
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASSWORD,
      },
    });
    
    // Format amount as currency
    const formattedAmount = typeof emailData.amount === 'number' 
      ? `$${emailData.amount.toFixed(2)}` 
      : emailData.amount;
      
    // Current date formatted nicely
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calculate date 2 weeks before event for the planning call
    let formattedPlanningDate = 'TBD';
    try {
      if (emailData.eventDate) {
        const eventDate = new Date(emailData.eventDate);
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
    
    // Build email HTML content with the original design
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
          .checklist {
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
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
          .success-icon {
            font-size: 48px;
            color: #22c55e;
          }
          .info-row {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #4b5563;
          }
          .info-value {
            color: #111827;
          }
          .checklist-item {
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
          }
          .checklist-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #22c55e;
            font-weight: bold;
          }
          @media only screen and (max-width: 600px) {
            .container {
              width: 100%;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://dj-contract-app.vercel.app/dj-bobby-drake-logo.png" alt="DJ Bobby Drake Logo" class="logo">
            <h1>Booking Confirmation</h1>
          </div>
          
          <div class="content">
            <div class="success-section">
              <div class="success-icon">✓</div>
              <h2 style="color: #15803d;">Thank You For Your Booking!</h2>
              <p>Your event has been confirmed for <strong>${emailData.eventDate || 'TBD'}</strong></p>
            </div>
            
            <p>Dear ${emailData.clientName || 'Customer'},</p>
            
            <p>I'm absolutely thrilled that you've chosen DJ Bobby Drake for your upcoming ${emailData.eventType || 'event'}! I'm excited to create an unforgettable experience for you and your guests.</p>
            
            <div class="section">
              <h3>Event Details</h3>
              <div class="info-row">
                <span class="info-label">Event Type:</span>
                <span class="info-value">${emailData.eventType || 'TBD'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${emailData.eventDate || 'TBD'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Venue:</span>
                <span class="info-value">${emailData.venueName || 'TBD'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${emailData.venueLocation || 'TBD'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">${emailData.startTime || 'TBD'} - ${emailData.endTime || 'TBD'}</span>
              </div>
            </div>
            
            <div class="section">
              <h3>Payment Information</h3>
              <div class="info-row">
                <span class="info-label">Payment ID:</span>
                <span class="info-value">${emailData.paymentId || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Amount:</span>
                <span class="info-value">${formattedAmount || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${emailData.paymentMethod || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${emailData.paymentDate || currentDate}</span>
              </div>
            </div>
            
            <div class="checklist">
              <h3>Pre-Event Checklist</h3>
              <p>Here's what comes next:</p>
              
              <div class="checklist-item">Fill out your music preference form (link will be sent 1 month before your event)</div>
              <div class="checklist-item">Planning call scheduled for ${formattedPlanningDate} (approximately 2 weeks before your event)</div>
              <div class="checklist-item">Final payment due (if applicable) 7 days before your event</div>
              <div class="checklist-item">Arrival and setup 1-2 hours before your event start time</div>
            </div>
            
            <p>If you have any questions or need to discuss anything about your upcoming event, please don't hesitate to contact me directly at <a href="tel:2038099414">(203) 809-9414</a> or reply to this email.</p>
            
            <p>You can also access and update your event details through our online portal:</p>
            
            <p style="text-align: center;"><a href="https://dj-contract-app.vercel.app/client/login" class="button">Access Client Portal</a></p>
            
            <p>I'm looking forward to making your event truly special!</p>
            
            <p>Best regards,<br>
            <strong>DJ Bobby Drake</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated confirmation email from DJ Bobby Drake.</p>
            <p>&copy; ${new Date().getFullYear()} DJ Bobby Drake Entertainment | (203) 809-9414</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Plain text version of the email
    const textContent = `
      DJ BOBBY DRAKE - BOOKING CONFIRMATION
      
      Thank you for your booking!
      
      Dear ${emailData.clientName || 'Customer'},
      
      I'm absolutely thrilled that you've chosen DJ Bobby Drake for your upcoming ${emailData.eventType || 'event'}! I'm excited to create an unforgettable experience for you and your guests.
      
      EVENT DETAILS:
      Event Type: ${emailData.eventType || 'TBD'}
      Date: ${emailData.eventDate || 'TBD'}
      Venue: ${emailData.venueName || 'TBD'}
      Location: ${emailData.venueLocation || 'TBD'}
      Time: ${emailData.startTime || 'TBD'} - ${emailData.endTime || 'TBD'}
      
      PAYMENT INFORMATION:
      Payment ID: ${emailData.paymentId || 'N/A'}
      Amount: ${formattedAmount || 'N/A'}
      Payment Method: ${emailData.paymentMethod || 'N/A'}
      Payment Date: ${emailData.paymentDate || currentDate}
      
      PRE-EVENT CHECKLIST:
      - Fill out your music preference form (link will be sent 1 month before your event)
      - Planning call scheduled for ${formattedPlanningDate} (approximately 2 weeks before your event)
      - Final payment due (if applicable) 7 days before your event
      - Arrival and setup 1-2 hours before your event start time
      
      If you have any questions or need to discuss anything about your upcoming event, please don't hesitate to contact me directly at (203) 809-9414 or reply to this email.
      
      You can also access and update your event details through our online portal at: https://dj-contract-app.vercel.app/client/login
      
      I'm looking forward to making your event truly special!
      
      Best regards,
      DJ Bobby Drake
      
      (203) 809-9414
      © ${new Date().getFullYear()} DJ Bobby Drake Entertainment
    `;
    
    // Email options
    const mailOptions = {
      from: `"DJ Bobby Drake" <${EMAIL_SENDER}>`,
      to: emailData.email,
      subject: `Booking Confirmation - ${emailData.eventType} on ${emailData.eventDate}`,
      html: htmlContent,
      text: textContent,
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return { 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Get email data from request body
    const emailData = await request.json();
    console.log('Received email request:', emailData);
    
    // Validate that we have minimum required fields
    if (!emailData.email) {
      console.error('Email validation failed: missing email address');
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }
    
    // Send the email
    const result = await sendEmailViaService(emailData);
    
    // Check if it was a partial success with warning
    if (result.warning) {
      console.warn('Email service warning:', result.warning);
      return NextResponse.json({
        success: false,
        warning: result.warning,
        message: 'Email could not be sent due to configuration issues. Your booking is still confirmed.',
        details: {
          to: emailData.email,
          eventType: emailData.eventType,
          eventDate: emailData.eventDate
        }
      }, { status: 200 });
    }
    
    console.log('Email sent successfully:', result);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      details: {
        to: emailData.email,
        eventType: emailData.eventType,
        eventDate: emailData.eventDate,
        messageId: result.messageId
      }
    });
  } catch (error) {
    console.error('Error in email API route:', error);
    console.error('Error details:', error.stack);
    
    // Return error response, but with 200 status to not block UI flow
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send email',
        details: error.details || {},
        fallback: true,
        message: 'Email could not be sent at this time. Your booking is still confirmed.'
      },
      { status: 200 }
    );
  }
} 