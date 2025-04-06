// app/api/processPayment/route.js

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// Utility function to generate the PDF receipt as a Buffer.
async function generatePDF(paymentAmount, remainingBalance) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    let buffers = [];

    // Collect data as it's generated.
    doc.on('data', buffers.push.bind(buffers));

    // Resolve the promise with the concatenated PDF data when finished.
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Handle PDF generation errors.
    doc.on('error', reject);

    // Build PDF content.
    doc.fontSize(20).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Payment Amount: $${paymentAmount}`, { align: 'left' });
    doc.text(`Remaining Balance: $${remainingBalance}`, { align: 'left' });
    doc.end();
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, paymentAmount } = body;

    if (!email || !paymentAmount) {
      return NextResponse.json(
        { error: 'Missing email or payment amount' },
        { status: 400 }
      );
    }

    // For demonstration, assume an initial balance of $1000.
    const initialBalance = 1000;
    const remainingBalance = initialBalance - paymentAmount;

    // Generate the PDF receipt.
    const pdfData = await generatePDF(paymentAmount, remainingBalance);

    // Configure the nodemailer transporter using your environment variables.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
      port: parseInt(process.env.SMTP_PORT, 10), // e.g., 465
      secure: process.env.SMTP_PORT === '465', // true for port 465
      auth: {
        user: process.env.EMAIL_ADDRESS, // your email address
        pass: process.env.EMAIL_PASSWORD, // your app-specific password or email password
      },
    });

    // Define the email options including the PDF receipt as an attachment.
    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: 'Your Payment Receipt',
      text: `Thank you for your payment of $${paymentAmount}. Your remaining balance is $${remainingBalance}.`,
      attachments: [
        {
          filename: 'receipt.pdf',
          content: pdfData,
        },
      ],
    };

    // Send the email.
    await transporter.sendMail(mailOptions);

    // Return a successful response.
    return NextResponse.json(
      { message: 'Payment processed and receipt sent.', remainingBalance },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in processPayment endpoint:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
