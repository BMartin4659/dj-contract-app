import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import nodemailer from 'nodemailer';

// Function to send an email confirmation with Pro Event Checklist
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
    
    // Create a transporter using SMTP - Fixed method name
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
    
    // Enhanced HTML content with comprehensive Pro Event Checklist
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation - DJ Bobby Drake</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: block;
            border: 3px solid rgba(255,255,255,0.3);
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 30px;
          }
          .success-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 25px;
          }
          .success-icon {
            font-size: 32px;
            margin-bottom: 8px;
            display: block;
          }
          .section {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border-left: 4px solid #6366f1;
          }
          .checklist-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 4px solid #0ea5e9;
          }
          .checklist-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .checklist-icon {
            color: #10b981;
            font-weight: bold;
            margin-right: 12px;
            font-size: 16px;
            margin-top: 2px;
          }
          .checklist-content {
            flex: 1;
          }
          .checklist-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .checklist-desc {
            color: #6b7280;
            font-size: 14px;
          }
          h2 {
            color: #1f2937;
            font-size: 20px;
            margin: 0 0 15px 0;
            font-weight: 600;
          }
          h3 {
            color: #374151;
            font-size: 18px;
            margin: 0 0 15px 0;
            font-weight: 600;
          }
          .detail-row {
            display: flex;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-label {
            font-weight: 600;
            color: #4b5563;
            width: 140px;
            flex-shrink: 0;
          }
          .detail-value {
            color: #1f2937;
            flex: 1;
          }
          .contact-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
          }
          .contact-button {
            display: inline-block;
            background: #6366f1;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin: 8px;
            transition: background 0.3s;
          }
          .contact-button:hover {
            background: #4f46e5;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .timeline-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #6366f1;
          }
          .timeline-time {
            font-weight: 600;
            color: #6366f1;
            margin-bottom: 5px;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            .content {
              padding: 20px;
            }
            .detail-row {
              flex-direction: column;
            }
            .detail-label {
              width: 100%;
              margin-bottom: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://dj-contract-app.vercel.app/dj-bobby-drake-logo.png" alt="DJ Bobby Drake Logo" class="logo">
            <h1>🎉 Booking Confirmed!</h1>
            <p style="margin: 0; opacity: 0.9;">Thank you for choosing DJ Bobby Drake</p>
          </div>
          
          <div class="content">
            <div class="success-badge">
              <span class="success-icon">✅</span>
              <strong>Your ${bookingDetails.eventType || 'event'} is officially booked!</strong>
              <div style="font-size: 14px; margin-top: 5px; opacity: 0.9;">
                Confirmation sent on ${currentDate}
              </div>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Dear <strong>${bookingDetails.clientName || 'Customer'}</strong>,
            </p>
            
            <p>I'm absolutely thrilled that you've chosen DJ Bobby Drake for your upcoming ${bookingDetails.eventType || 'event'}! I'm excited to create an unforgettable experience for you and your guests.</p>
            
            <div class="section">
              <h2>📅 Event Details</h2>
              <div class="detail-row">
                <div class="detail-label">Event Type:</div>
                <div class="detail-value">${bookingDetails.eventType || 'TBD'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${bookingDetails.eventDate || 'TBD'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Venue:</div>
                <div class="detail-value">${bookingDetails.venueName || 'TBD'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Location:</div>
                <div class="detail-value">${bookingDetails.venueLocation || 'TBD'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Time:</div>
                <div class="detail-value">${bookingDetails.startTime || 'TBD'} - ${bookingDetails.endTime || 'TBD'}</div>
              </div>
            </div>
            
            <div class="section">
              <h2>💳 Payment Information</h2>
              <div class="detail-row">
                <div class="detail-label">Booking ID:</div>
                <div class="detail-value">${bookingDetails.bookingId || bookingDetails.paymentId || 'N/A'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Amount Paid:</div>
                <div class="detail-value" style="color: #059669; font-weight: 600;">${formattedAmount || 'N/A'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${bookingDetails.paymentMethod || 'Stripe'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Payment Date:</div>
                <div class="detail-value">${currentDate}</div>
              </div>
            </div>
            
            <div class="checklist-section">
              <h2>🎯 Pro Event Checklist - What Happens Next</h2>
              <p style="margin-bottom: 20px; color: #374151;">Here's your complete roadmap to ensure your event is absolutely perfect:</p>
              
              <div class="checklist-item">
                <div class="checklist-icon">📋</div>
                <div class="checklist-content">
                  <div class="checklist-title">Music Preference Form</div>
                  <div class="checklist-desc">I'll send you a detailed music preference form 4 weeks before your event to capture your must-play songs, do-not-play list, and special requests.</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">📞</div>
                <div class="checklist-content">
                  <div class="checklist-title">Pre-Event Planning Call</div>
                  <div class="checklist-desc">Scheduled for ${formattedPlanningDate} - We'll discuss timeline, special announcements, and any last-minute details.</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">🏢</div>
                <div class="checklist-content">
                  <div class="checklist-title">Venue Coordination</div>
                  <div class="checklist-desc">I'll contact your venue 1 week prior to confirm load-in times, power requirements, and setup logistics.</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">⚡</div>
                <div class="checklist-content">
                  <div class="checklist-title">Technical Requirements</div>
                  <div class="checklist-desc">Ensure 2 dedicated power outlets within 50ft of DJ setup area. I'll bring all necessary extension cords and power strips.</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">🎵</div>
                <div class="checklist-content">
                  <div class="checklist-title">Equipment Setup</div>
                  <div class="checklist-desc">I arrive 1-2 hours before your event start time for complete setup and sound testing.</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">💰</div>
                <div class="checklist-content">
                  <div class="checklist-title">Final Payment (if applicable)</div>
                  <div class="checklist-desc">${bookingDetails.isDeposit ? 'Remaining balance due 7 days before your event via Venmo, CashApp, or cash.' : 'Payment complete! No additional charges.'}</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">📱</div>
                <div class="checklist-content">
                  <div class="checklist-title">Day-of Communication</div>
                  <div class="checklist-desc">I'll text you my arrival time and provide my direct number for any last-minute coordination needs.</div>
                </div>
              </div>
              
              <div class="checklist-item">
                <div class="checklist-icon">🎉</div>
                <div class="checklist-content">
                  <div class="checklist-title">Event Day Excellence</div>
                  <div class="checklist-desc">Professional MC services, seamless music transitions, and reading the crowd to keep your dance floor packed!</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>🎼 What's Included in Your Package:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li>Professional DJ services for your entire event</li>
                <li>High-quality sound system and wireless microphones</li>
                <li>Extensive music library spanning all genres and decades</li>
                <li>Professional MC and announcement services</li>
                <li>Mood lighting and dance floor lighting</li>
                <li>Backup equipment for peace of mind</li>
                <li>Coordination with your other vendors</li>
                <li>Unlimited music requests (appropriate for your event)</li>
              </ul>
            </div>
            
            <div class="contact-section">
              <h3 style="margin-top: 0; color: #92400e;">Questions? Need to Make Changes?</h3>
              <p style="margin-bottom: 15px; color: #92400e;">I'm here to help make your event perfect!</p>
              <a href="tel:2038099414" class="contact-button">📞 Call (203) 809-9414</a>
              <a href="mailto:therealdjbobbydrake@gmail.com" class="contact-button">✉️ Email Me</a>
              <div style="margin-top: 15px; font-size: 14px; color: #92400e;">
                <strong>Best times to reach me:</strong> Mon-Fri 10AM-6PM, Weekends 12PM-4PM
              </div>
            </div>
            
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #22c55e;">
              <h3 style="margin-top: 0; color: #166534;">🌟 Pro Tips for an Amazing Event:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #166534;">
                <li><strong>Create a timeline:</strong> Share your event schedule with me 2 weeks prior</li>
                <li><strong>Designate a point person:</strong> Choose someone to communicate with me during the event</li>
                <li><strong>Consider your guests:</strong> Mix of ages? I'll curate the perfect playlist blend</li>
                <li><strong>Special moments:</strong> Let me know about surprise announcements or dedications</li>
                <li><strong>Backup plans:</strong> For outdoor events, discuss weather contingencies</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">
              I'm looking forward to making your ${bookingDetails.eventType || 'event'} truly special! 
              Your satisfaction is my top priority, and I'm committed to exceeding your expectations.
            </p>
            
            <p style="margin-bottom: 0;">
              Best regards,<br>
              <strong style="color: #6366f1; font-size: 18px;">DJ Bobby Drake</strong><br>
              <span style="color: #6b7280;">Professional DJ & Entertainment Services</span><br>
              <a href="mailto:therealdjbobbydrake@gmail.com" style="color: #6366f1;">therealdjbobbydrake@gmail.com</a><br>
              <a href="tel:2038099414" style="color: #6366f1;">(203) 809-9414</a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong>DJ Bobby Drake Entertainment</strong> | Professional DJ Services
            </p>
            <p style="margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} DJ Bobby Drake. All rights reserved. | 
              <a href="https://dj-contract-app.vercel.app" style="color: #6366f1;">Book Online</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send the email
    const mailOptions = {
      from: `DJ Bobby Drake <${EMAIL_SENDER}>`,
      to: bookingDetails.email,
      subject: `🎉 Your ${bookingDetails.eventType || 'Event'} is Confirmed - DJ Bobby Drake`,
      html: htmlContent,
      // Add text version for email clients that don't support HTML
      text: `
DJ BOBBY DRAKE - BOOKING CONFIRMATION

Dear ${bookingDetails.clientName || 'Customer'},

Your ${bookingDetails.eventType || 'event'} booking is confirmed!

EVENT DETAILS:
- Event Type: ${bookingDetails.eventType || 'TBD'}
- Date: ${bookingDetails.eventDate || 'TBD'}
- Venue: ${bookingDetails.venueName || 'TBD'}
- Location: ${bookingDetails.venueLocation || 'TBD'}
- Time: ${bookingDetails.startTime || 'TBD'} - ${bookingDetails.endTime || 'TBD'}

PAYMENT INFORMATION:
- Booking ID: ${bookingDetails.bookingId || bookingDetails.paymentId || 'N/A'}
- Amount Paid: ${formattedAmount || 'N/A'}
- Payment Method: ${bookingDetails.paymentMethod || 'Stripe'}
- Payment Date: ${currentDate}

PRO EVENT CHECKLIST - WHAT HAPPENS NEXT:
✓ Music Preference Form (sent 4 weeks before event)
✓ Pre-Event Planning Call (${formattedPlanningDate})
✓ Venue Coordination (1 week prior)
✓ Technical Requirements Check
✓ Equipment Setup (1-2 hours before event)
✓ Final Payment Due (if applicable - 7 days before event)
✓ Day-of Communication
✓ Event Day Excellence

WHAT'S INCLUDED:
- Professional DJ services for your entire event
- High-quality sound system and wireless microphones
- Extensive music library spanning all genres
- Professional MC and announcement services
- Mood lighting and dance floor lighting
- Backup equipment for peace of mind
- Coordination with your other vendors
- Unlimited music requests

Questions? Contact me:
Phone: (203) 809-9414
Email: therealdjbobbydrake@gmail.com

Best regards,
DJ Bobby Drake
Professional DJ & Entertainment Services
      `
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
    const body = await request.json();
    console.log('Payment confirmation request received:', body);
    
    const { sessionId, bookingId, paymentMethod } = body;
    
    if (!sessionId && !bookingId) {
      return NextResponse.json(
        { error: 'Missing sessionId or bookingId' },
        { status: 400 }
      );
    }
    
    // Try to find the booking in Firestore
    let bookingData = null;
    
    if (bookingId) {
      try {
        const bookingRef = doc(db, 'djContracts', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
          bookingData = { id: bookingSnap.id, ...bookingSnap.data() };
          console.log('Found booking in djContracts:', bookingData);
        } else {
          // Try bookings collection
          const bookingsRef = doc(db, 'bookings', bookingId);
          const bookingsSnap = await getDoc(bookingsRef);
          
          if (bookingsSnap.exists()) {
            bookingData = { id: bookingsSnap.id, ...bookingsSnap.data() };
            console.log('Found booking in bookings:', bookingData);
          }
        }
      } catch (error) {
        console.error('Error fetching booking from Firestore:', error);
      }
    }
    
    // If no booking found in Firestore, create from request data
    if (!bookingData) {
      bookingData = {
        ...body,
        paymentId: sessionId || bookingId,
        paymentMethod: paymentMethod || 'Stripe',
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: new Date().toISOString()
      };
      console.log('Created booking data from request:', bookingData);
    }
    
    // Send confirmation email with Pro Event Checklist
    const emailResult = await sendEmailConfirmation(bookingData);
    
    // Update booking status if found in Firestore
    if (bookingData.id && (sessionId || bookingId)) {
      try {
        const collectionName = bookingData.id === bookingId ? 'djContracts' : 'bookings';
        const bookingRef = doc(db, collectionName, bookingData.id);
        await updateDoc(bookingRef, {
          emailSent: emailResult.success,
          emailSentAt: serverTimestamp(),
          status: 'confirmed',
          paymentStatus: 'paid',
          lastUpdated: serverTimestamp()
        });
        console.log('Updated booking status in Firestore');
      } catch (updateError) {
        console.error('Error updating booking in Firestore:', updateError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment confirmation processed successfully',
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
      bookingId: bookingData.id || bookingId,
      paymentId: sessionId || bookingId
    });
    
  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment confirmation',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 