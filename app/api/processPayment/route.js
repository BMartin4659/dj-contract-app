// app/api/processPayment/route.js

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// Utility function to generate a PDF receipt in memory.
async function generatePDF(paymentAmount, remainingBalance) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Build the PDF content.
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

    // Assume an initial balance of $1000; adjust your logic as needed.
    const initialBalance = 1000;
    const remainingBalance = initialBalance - paymentAmount;

    // Generate the PDF receipt.
    const pdfData = await generatePDF(paymentAmount, remainingBalance);

    // Configure the nodemailer transporter using secure environment variables.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
      port: parseInt(process.env.SMTP_PORT, 10), // e.g., 465
      secure: process.env.SMTP_PORT === '465', // true if using port 465
      auth: {
        user: process.env.EMAIL_ADDRESS, // your production email address
        pass: process.env.EMAIL_PASSWORD, // your production email password or app-specific password
      },
    });

    // Set up email options with the PDF attachment.
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

    // Respond with a success message and the remaining balance.
    return NextResponse.json(
      { message: 'Payment processed and receipt sent.', remainingBalance },
      { status: 200 }
    );
  } catch (error) {
    console.error('Production error in payment endpoint:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
