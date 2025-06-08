import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const data = await req.json();
    
    // Create formatted email content
    const formattedTimeline = [
      data.cocktailHourTime ? `${data.cocktailHourTime} - Cocktail Hour` : '',
      data.grandEntranceTime ? `${data.grandEntranceTime} - Grand Entrance` : '',
      data.firstDanceTime ? `${data.firstDanceTime} - First Dance` : '',
      data.dinnerTime ? `${data.dinnerTime} - Dinner Served` : '',
      data.toastsTime ? `${data.toastsTime} - Toasts` : '',
      data.parentDancesTime ? `${data.parentDancesTime} - Parent Dances` : '',
      data.cakeCuttingTime ? `${data.cakeCuttingTime} - Cake Cutting` : '',
      data.openDancingTime ? `${data.openDancingTime} - Open Dancing` : '',
      data.lastDanceTime ? `${data.lastDanceTime} - Last Dance` : '',
    ].filter(Boolean).join('<br>');

    // Setup email server
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Create HTML content for the email
    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 20px;
              background-color: #f9f9f9;
            }
            h1 {
              color: #3b82f6;
              margin-bottom: 20px;
              text-align: center;
            }
            h2 {
              color: #4b5563;
              margin-top: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .detail-row {
              padding: 8px 0;
              display: flex;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              width: 200px;
              color: #4b5563;
            }
            .detail-value {
              flex: 1;
            }
            .timeline {
              margin: 20px 0;
              padding: 15px;
              background-color: #f0f4ff;
              border-radius: 5px;
              border-left: 4px solid #3b82f6;
            }
            .price {
              font-size: 18px;
              font-weight: bold;
              color: #047857;
              text-align: right;
              margin-top: 30px;
            }
            .logo {
              display: block;
              width: 100px;
              height: 100px;
              margin: 0 auto 20px;
              border-radius: 50%;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://dj-contract-app.vercel.app/dj-bobby-drake-logo.png" alt="DJ Bobby Drake Logo" class="logo">
            <h1>Wedding Agenda Submission</h1>
            
            <h2>Wedding Information</h2>
            <div class="detail-row">
              <div class="detail-label">Event Type:</div>
              <div class="detail-value">${data.eventType}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Bride's Name:</div>
              <div class="detail-value">${data.brideName}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Groom's Name:</div>
              <div class="detail-value">${data.groomName}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Wedding Date:</div>
              <div class="detail-value">${data.weddingDate}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Email:</div>
              <div class="detail-value">${data.email}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Phone:</div>
              <div class="detail-value">${data.phone}</div>
            </div>
            
            <h2>Reception Details</h2>
            <div class="detail-row">
              <div class="detail-label">Welcome:</div>
              <div class="detail-value">${data.welcome}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Blessing:</div>
              <div class="detail-value">${data.blessing}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Wedding Party Entrance Music:</div>
              <div class="detail-value">${data.entranceMusic}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Couple Entrance Song:</div>
              <div class="detail-value">${data.coupleEntranceSong || 'Not specified'}</div>
            </div>
            
            <h2>Reception Timeline</h2>
            <div class="timeline">
              ${formattedTimeline}
            </div>
            
            <h2>Special Dance Songs</h2>
            <div class="detail-row">
              <div class="detail-label">First Dance:</div>
              <div class="detail-value">${data.firstDanceSong || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Father/Daughter Dance:</div>
              <div class="detail-value">${data.fatherDaughterSong || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Mother/Son Dance:</div>
              <div class="detail-value">${data.motherSonSong || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Bouquet Toss:</div>
              <div class="detail-value">${data.bouquetTossSong || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Garter Toss:</div>
              <div class="detail-value">${data.gatherTossSong || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Last Dance:</div>
              <div class="detail-value">${data.lastSong || 'Not specified'}</div>
            </div>
            
            ${data.specialInstructions ? `
            <h2>Special Instructions</h2>
            <div class="detail-row">
              <div class="detail-value">${data.specialInstructions.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            <div class="price">Base Price: $${data.basePrice.toFixed(2)}</div>
          </div>
        </body>
      </html>
    `;

    // Email to DJ
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'therealdjbobbydrake@gmail.com',
      subject: `Wedding Agenda - ${data.brideName} & ${data.groomName} - ${data.weddingDate}`,
      html: htmlContent,
    };

    // Email to client
    const clientMailOptions = {
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: `Wedding Agenda Confirmation - DJ Bobby Drake`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 20px;
                background-color: #f9f9f9;
              }
              h1 {
                color: #3b82f6;
                margin-bottom: 20px;
              }
              .logo {
                display: block;
                width: 100px;
                height: 100px;
                margin: 0 auto 20px;
                border-radius: 50%;
              }
              .highlight {
                padding: 15px;
                background-color: #f0f4ff;
                border-radius: 5px;
                border-left: 4px solid #3b82f6;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="https://dj-contract-app.vercel.app/dj-bobby-drake-logo.png" alt="DJ Bobby Drake Logo" class="logo">
              <h1>Thanks for submitting your Wedding Agenda!</h1>
              
              <p>Dear ${data.brideName} & ${data.groomName},</p>
              
              <p>Thank you for sharing your wedding reception details with DJ Bobby Drake. We have received your submission for your wedding on ${data.weddingDate}.</p>
              
              <div class="highlight">
                <p>We will review the details and reach out to discuss any questions or recommendations to make your special day perfect.</p>
              </div>
              
              <p>If you have any questions or need to update any information, please don't hesitate to contact us:</p>
              <p>✉️ Email: therealdjbobbydrake@gmail.com</p>
              <p>📱 Phone: (850) 333-0775</p>
              
              <p>Best regards,<br>DJ Bobby Drake</p>
            </div>
          </body>
        </html>
      `,
    };

    // Send emails
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(clientMailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Wedding agenda submitted successfully' 
    });
  } catch (error) {
    console.error('Error sending wedding agenda email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to submit wedding agenda' 
    }, { status: 500 });
  }
} 