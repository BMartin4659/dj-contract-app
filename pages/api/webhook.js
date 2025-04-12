import { buffer } from 'micro';
import Stripe from 'stripe';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

let initialized = false;
function initFirebase() {
  if (!initialized) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      initialized = true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const generateInvoicePDF = async ({ clientName, amount, eventType, eventDate, venueName }) => {
  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  doc.fontSize(20).text('Live City DJ Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Client: ${clientName}`);
  doc.text(`Event Type: ${eventType}`);
  doc.text(`Event Date: ${eventDate}`);
  doc.text(`Venue: ${venueName}`);
  doc.text(`Amount Paid: $${(amount / 100).toFixed(2)}`);

  doc.end();
  return await new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};

const sendAdminEmail = async ({ clientName, eventType, eventDate, amount }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to: 'therealdjbobbydrake@gmail.com',
    subject: '🎉 Payment Received – DJ Contract',
    text: `New payment received from ${clientName} for ${eventType} on ${eventDate}. Amount: $${(amount / 100).toFixed(2)}.`
  });
};

const sendClientPDF = async ({ email, clientName, pdfBuffer }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: '📎 Your Live City DJ Receipt & Event Info',
    text: `Thanks again for your booking, ${clientName}. Attached is your payment receipt and event details.`,
    attachments: [
      {
        filename: 'receipt.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { id, metadata, amount, receipt_email } = paymentIntent;

    try {
      initFirebase();
      const db = getFirestore();
      const snapshot = await db
        .collection('stripePayments')
        .where('paymentIntentId', '==', id)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        const docData = snapshot.docs[0].data();

        await docRef.update({
          status: 'succeeded',
          paidAt: new Date(),
        });

        const pdfBuffer = await generateInvoicePDF({
          clientName: docData.clientName,
          amount,
          eventType: docData.eventType,
          eventDate: docData.eventDate,
          venueName: docData.venueName,
        });

        await sendClientPDF({
          email: receipt_email,
          clientName: docData.clientName,
          pdfBuffer,
        });

        await sendAdminEmail({
          clientName: docData.clientName,
          eventType: docData.eventType,
          eventDate: docData.eventDate,
          amount,
        });

        console.log(`✅ Updated Firestore + emailed receipt for: ${id}`);
      } else {
        console.warn(`⚠️ No Firestore record found for intent: ${id}`);
      }
    } catch (err) {
      console.error('❌ Error during webhook handling:', err.message);
    }
  }

  res.status(200).json({ received: true });
}