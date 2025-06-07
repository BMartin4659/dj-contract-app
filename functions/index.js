const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const cors = require("cors")({ origin: true, methods: ['POST', 'OPTIONS'] });

admin.initializeApp();

// Load the email template
const confirmationTemplatePath = path.join(__dirname, "templates", "confirmationEmail.html");
const confirmationEmailTemplate = fs.readFileSync(confirmationTemplatePath, "utf8");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
});

// CALLABLE version for use with httpsCallable
exports.sendConfirmationEmail = functions.https.onCall(async (data, context) => {
    try {
      // Debug log for troubleshooting
      console.log('Received callable request with data:', data);
      
      // Extract data from the callable function request
      const {
        to, // recipient email
        subject,
        text,
        html,
        clientName,
        email,
        eventType,
        eventDate,
        venueName,
        venueLocation,
        startTime,
        endTime,
        paymentId,
        totalAmount
      } = data;
      
      // Use template if no HTML provided, otherwise use the provided HTML
      let emailHtml = html;
      
      // If no custom HTML is provided, use the template with replacements
      if (!emailHtml) {
        // Recipient email could be in 'to' or 'email' field
        const recipientEmail = to || email;
        
        // Validate required fields for template usage
        if (!recipientEmail || !clientName || !eventType || !eventDate) {
          throw new functions.https.HttpsError(
            'invalid-argument', 
            'Missing required fields for email template'
          );
        }
        
        // Read email template
        let emailTemplate = confirmationEmailTemplate;
        
        // Replace placeholders with actual data
        emailTemplate = emailTemplate
          .replace(/{{clientName}}/g, clientName)
          .replace(/{{eventType}}/g, eventType)
          .replace(/{{eventDate}}/g, eventDate)
          .replace(/{{venueName}}/g, venueName || 'N/A')
          .replace(/{{venueLocation}}/g, venueLocation || 'N/A')
          .replace(/{{startTime}}/g, startTime || 'N/A')
          .replace(/{{endTime}}/g, endTime || 'N/A')
          .replace(/{{paymentId}}/g, paymentId || 'N/A')
          .replace(/{{totalAmount}}/g, totalAmount ? `$${totalAmount}` : 'N/A');
        
        emailHtml = emailTemplate;
      }
      
      // Configure email options
      const mailOptions = {
        from: 'Live City DJ <noreply@livecitydj.com>',
        to: to || email,
        subject: subject || 'Live City DJ - Booking Confirmation',
        html: emailHtml,
        // Add text version for email clients that don't support HTML
        text: text || `Booking Confirmation for ${clientName || 'Customer'}\n\nEvent: ${eventType || 'Event'}\nDate: ${eventDate || 'N/A'}`
      };
      
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info);
      
      // Return success
      return { 
        success: true, 
        message: 'Confirmation email sent successfully',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw new functions.https.HttpsError(
        'internal', 
        'Failed to send confirmation email',
        error.message
      );
    }
  });

// HTTP endpoint for sending confirmation emails (keep for backward compatibility)
exports.sendConfirmationEmailHttp = functions.https.onRequest(async (req, res) => {
    // Wrap the entire function in the CORS handler
    return cors(req, res, async () => {
      // Handle preflight OPTIONS request
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }
      
      // Ensure this is a POST request
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
      }
      
      try {
        // Debug log for troubleshooting
        console.log('Received request with body:', req.body);
        
        // Get data from request body
        const {
          clientName,
          email,
          eventType,
          eventDate,
          venueName,
          venueLocation,
          startTime,
          endTime,
          paymentId,
          totalAmount
        } = req.body;
        
        // Validate required fields
        if (!email || !clientName || !eventType || !eventDate) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
          });
        }
        
        // Read email template
        const templatePath = path.join(__dirname, 'templates/confirmationEmail.html');
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholders with actual data
        emailTemplate = emailTemplate
          .replace(/{{clientName}}/g, clientName)
          .replace(/{{eventType}}/g, eventType)
          .replace(/{{eventDate}}/g, eventDate)
          .replace(/{{venueName}}/g, venueName || 'N/A')
          .replace(/{{venueLocation}}/g, venueLocation || 'N/A')
          .replace(/{{startTime}}/g, startTime || 'N/A')
          .replace(/{{endTime}}/g, endTime || 'N/A')
          .replace(/{{paymentId}}/g, paymentId || 'N/A')
          .replace(/{{totalAmount}}/g, totalAmount ? `$${totalAmount}` : 'N/A');
        
        // Configure email options
        const mailOptions = {
          from: 'Live City DJ <noreply@livecitydj.com>',
          to: email,
          subject: 'Live City DJ - Booking Confirmation',
          html: emailTemplate,
          // Add text version for email clients that don't support HTML
          text: `Booking Confirmation for ${clientName}\n\nEvent: ${eventType}\nDate: ${eventDate}\nVenue: ${venueName || 'N/A'}, ${venueLocation || 'N/A'}\nTime: ${startTime || 'N/A'} - ${endTime || 'N/A'}\nPayment ID: ${paymentId || 'N/A'}\nTotal Amount: ${totalAmount ? `$${totalAmount}` : 'N/A'}`
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        // Return success
        return res.status(200).json({ 
          success: true, 
          message: 'Confirmation email sent successfully' 
        });
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to send confirmation email',
          details: error.message
        });
      }
    });
  });

// Simple test function to verify Firebase Functions work
exports.testEmailFunction = functions.https.onCall(async (data, context) => {
    return {
      success: true,
      message: 'Test function works!',
      receivedData: data,
      timestamp: new Date().toISOString()
    };
  });
