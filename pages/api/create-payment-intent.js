import Stripe from 'stripe';
import { getFirestore, collection, addDoc } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// Initialize Firebase Admin
if (!getFirestore.apps?.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateInvoicePDF = (details) => {
  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  
  doc.fontSize(20).text('Live City DJ Invoice', { align: 'center' })
     .fontSize(12)
     .text(`Client: ${details.clientName}`)
     .text(`Event: ${details.eventType}`)
     .text(`Date: ${new Date(details.eventDate).toLocaleDateString()}`)
     .text(`Venue: ${details.venueName}`)
     .text(`Amount: $${(details.amount / 100).toFixed(2)}`);
  
  doc.end();
  return Buffer.concat(buffers);
};

const sendConfirmationEmail = async (email, clientName, pdfBuffer) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `Live City DJ <${process.env.EMAIL_SENDER}>`,
    to: email,
    subject: 'Booking Confirmation & Invoice',
    text: `Thank you for your booking, ${clientName}!`,
    attachments: [{
      filename: 'invoice.pdf',
      content: pdfBuffer
    }]
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { amount } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ message: 'Amount is required and must be a number' });
  }

  try {
    const { amount, email, clientName, eventType, eventDate, venueName } = req.body;

    // Validate required fields
    if (!email || !clientName || !eventType || !eventDate || !venueName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email,
      metadata: { clientName, eventType, eventDate, venueName },
      automatic_payment_methods: { enabled: true },
    });

    // Store payment in Firestore
    await addDoc(collection(db, 'stripePayments'), {
      clientName,
      email,
      eventType,
      eventDate: new Date(eventDate),
      venueName,
      amount,
      paymentIntentId: paymentIntent.id,
      created: new Date(),
      status: 'paid'
    });

    // Generate PDF invoice
    const pdfBuffer = await generateInvoicePDF({
      clientName,
      amount,
      eventType,
      eventDate,
      venueName
    });

    // Send confirmation email
    await sendConfirmationEmail(email, clientName, pdfBuffer);

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}