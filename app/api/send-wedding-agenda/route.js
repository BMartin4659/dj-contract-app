import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    // Parse request body
    const agendaDetails = await request.json();
    
    // Check for required fields
    if (!agendaDetails.email) {
      return NextResponse.json(
        { success: false, error: 'Missing email address' },
        { status: 400 }
      );
    }
    
    // Get configuration from environment
    const EMAIL_SENDER = process.env.EMAIL_SENDER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    
    if (!EMAIL_SENDER || !EMAIL_PASSWORD) {
      console.warn('Email service configuration missing');
      return NextResponse.json(
        { 
          success: false, 
          warning: 'Email configuration missing',
          fallbackMessage: 'Your agenda was saved but we couldn&apos;t send an email confirmation at this time.'
        },
        { status: 200 }
      );
    }
    
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASSWORD,
      },
    });
    
    // Format wedding date
    let formattedDate = 'TBD';
    if (agendaDetails.weddingDate) {
      try {
        const date = new Date(agendaDetails.weddingDate);
        formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        formattedDate = agendaDetails.weddingDate;
      }
    }
    
    // Current date formatted nicely
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Build email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Wedding Agenda Confirmation</title>
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
            background-color: #3b82f6;
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
            <h1>Wedding Agenda Confirmation</h1>
          </div>
          
          <div class="content">
            <div class="success-section">
              <div style="font-size: 48px; color: #22c55e;">✓</div>
              <h2 style="color: #15803d;">Wedding Agenda Received!</h2>
              <p>Your wedding agenda for <strong>${formattedDate}</strong> has been received.</p>
            </div>
            
            <p>Dear ${agendaDetails.brideName || 'Bride'} & ${agendaDetails.groomName || 'Groom'},</p>
            
            <p>Thank you for submitting your wedding reception agenda. I&apos;m excited to be a part of your special day and will use this information to create the perfect soundtrack for your celebration.</p>
            
            <div class="section">
              <h3>Wedding Information</h3>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Bride:</span>
                <span style="color: #111827;">${agendaDetails.brideName || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Groom:</span>
                <span style="color: #111827;">${agendaDetails.groomName || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Date:</span>
                <span style="color: #111827;">${formattedDate}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Email:</span>
                <span style="color: #111827;">${agendaDetails.email || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Phone:</span>
                <span style="color: #111827;">${agendaDetails.phone || 'N/A'}</span>
              </div>
            </div>
            
            <div class="section">
              <h3>Reception Timeline</h3>
              <p style="white-space: pre-line; color: #111827;">${agendaDetails.timeline || 'No timeline provided'}</p>
              
              ${agendaDetails.cocktailHourTime || agendaDetails.grandEntranceTime || agendaDetails.firstDanceTime || 
                agendaDetails.dinnerTime || agendaDetails.toastsTime || agendaDetails.parentDancesTime || 
                agendaDetails.cakeCuttingTime || agendaDetails.openDancingTime || agendaDetails.lastDanceTime ? `
              <div style="margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                ${agendaDetails.cocktailHourTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Cocktail Hour:</span>
                  <span style="color: #111827;">${agendaDetails.cocktailHourTime}</span>
                </div>` : ''}
                
                ${agendaDetails.grandEntranceTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Grand Entrance:</span>
                  <span style="color: #111827;">${agendaDetails.grandEntranceTime}</span>
                </div>` : ''}
                
                ${agendaDetails.firstDanceTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">First Dance:</span>
                  <span style="color: #111827;">${agendaDetails.firstDanceTime}</span>
                </div>` : ''}
                
                ${agendaDetails.dinnerTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Dinner Served:</span>
                  <span style="color: #111827;">${agendaDetails.dinnerTime}</span>
                </div>` : ''}
                
                ${agendaDetails.toastsTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Toasts:</span>
                  <span style="color: #111827;">${agendaDetails.toastsTime}</span>
                </div>` : ''}
                
                ${agendaDetails.parentDancesTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Parent Dances:</span>
                  <span style="color: #111827;">${agendaDetails.parentDancesTime}</span>
                </div>` : ''}
                
                ${agendaDetails.cakeCuttingTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Cake Cutting:</span>
                  <span style="color: #111827;">${agendaDetails.cakeCuttingTime}</span>
                </div>` : ''}
                
                ${agendaDetails.openDancingTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Open Dancing:</span>
                  <span style="color: #111827;">${agendaDetails.openDancingTime}</span>
                </div>` : ''}
                
                ${agendaDetails.lastDanceTime ? `
                <div style="margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #4b5563;">Last Dance:</span>
                  <span style="color: #111827;">${agendaDetails.lastDanceTime}</span>
                </div>` : ''}
              </div>
              ` : ''}
            </div>
            
            <div class="section">
              <h3>Music Selections</h3>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Wedding Party Entrance:</span>
                <span style="color: #111827;">${agendaDetails.entranceMusic || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Bride & Groom Entrance:</span>
                <span style="color: #111827;">${agendaDetails.coupleEntranceSong || 'DJ Choice'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">First Dance:</span>
                <span style="color: #111827;">${agendaDetails.firstDanceSong || 'TBD'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Father/Daughter:</span>
                <span style="color: #111827;">${agendaDetails.fatherDaughterSong || 'TBD'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Mother/Son:</span>
                <span style="color: #111827;">${agendaDetails.motherSonSong || 'TBD'}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4b5563;">Last Dance:</span>
                <span style="color: #111827;">${agendaDetails.lastSong || 'TBD'}</span>
              </div>
            </div>
            
            ${agendaDetails.specialInstructions ? `
            <div class="section">
              <h3>Special Instructions</h3>
              <p style="white-space: pre-line; color: #111827;">${agendaDetails.specialInstructions}</p>
            </div>
            ` : ''}
            
            <p>I&apos;ll be in touch soon to discuss the details and ensure everything is perfect for your big day. If you have any questions or changes, please don&apos;t hesitate to contact me.</p>
            
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
    
    // Send the email to DJ Bobby Drake
    const adminMailOptions = {
      from: EMAIL_SENDER,
      to: 'therealdjbobbydrake@gmail.com',
      subject: `New Wedding Agenda: ${agendaDetails.brideName || ''} & ${agendaDetails.groomName || ''}`,
      html: htmlContent,
    };
    
    // Also send confirmation to the client
    const clientMailOptions = {
      from: EMAIL_SENDER,
      to: agendaDetails.email,
      subject: 'Your Wedding Agenda - DJ Bobby Drake',
      html: htmlContent,
    };
    
    // Send the emails
    const adminInfo = await transporter.sendMail(adminMailOptions);
    const clientInfo = await transporter.sendMail(clientMailOptions);
    
    console.log('Admin email sent successfully:', adminInfo.messageId);
    console.log('Client email sent successfully:', clientInfo.messageId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wedding agenda emails sent successfully',
      adminMessageId: adminInfo.messageId,
      clientMessageId: clientInfo.messageId
    });
  } catch (error) {
    console.error('Error sending wedding agenda email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error sending wedding agenda email',
        fallbackMessage: "We've saved your wedding agenda but couldn't send the confirmation email right now. We'll contact you shortly."
      },
      { status: 500 }
    );
  }
} 