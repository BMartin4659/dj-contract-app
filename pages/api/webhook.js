import { buffer } from 'micro';
import Stripe from 'stripe';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, doc } from 'firebase-admin/firestore';
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

  // Handle checkout.session.completed events (for new checkout flow)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { id, metadata, amount_total, customer_details } = session;

    try {
      initFirebase();
      const db = getFirestore();
      
      console.log('Processing checkout session completed:', {
        sessionId: id,
        clientName: metadata?.clientName,
        email: customer_details?.email || metadata?.email,
        amount: amount_total
      });

      // Create booking data from session
      const bookingData = {
        sessionId: id,
        clientName: metadata?.clientName || customer_details?.name || '',
        email: metadata?.email || customer_details?.email || '',
        eventType: metadata?.eventType || 'Event',
        eventDate: metadata?.eventDate || '',
        venueName: metadata?.venueName || '',
        venueLocation: metadata?.venueLocation || '',
        startTime: metadata?.startTime || '',
        endTime: metadata?.endTime || '',
        contactPhone: metadata?.contactPhone || '',
        guestCount: metadata?.guestCount || '',
        totalAmount: (amount_total || 0) / 100,
        paymentMethod: 'Stripe',
        bookingId: metadata?.bookingId || id,
        lighting: metadata?.lighting === 'true',
        photography: metadata?.photography === 'true',
        videoVisuals: metadata?.videoVisuals === 'true',
        additionalHours: parseInt(metadata?.additionalHours || '0'),
        paymentAmount: metadata?.paymentAmount || 'full',
        isDeposit: metadata?.isDeposit === 'true',
        status: 'confirmed',
        paymentStatus: 'paid',
        paidAt: new Date(),
        createdAt: new Date()
      };

      // Save to Firestore
      const bookingRef = doc(db, 'djContracts', metadata?.bookingId || id);
      await bookingRef.set(bookingData, { merge: true });

      // Send payment confirmation email via our API
      try {
        const confirmationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: id,
            bookingId: metadata?.bookingId || id,
            clientName: bookingData.clientName,
            email: bookingData.email,
            eventType: bookingData.eventType,
            eventDate: bookingData.eventDate,
            venueName: bookingData.venueName,
            venueLocation: bookingData.venueLocation,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            totalAmount: bookingData.totalAmount,
            paymentMethod: 'Stripe',
            signerName: 'Bobby Martin',
            hasSigned: true
          })
        });

        if (confirmationResponse.ok) {
          console.log('✅ Payment confirmation email sent via webhook');
        } else {
          console.error('❌ Failed to send confirmation email via webhook');
        }
      } catch (emailError) {
        console.error('❌ Error sending confirmation email via webhook:', emailError);
      }

      console.log(`✅ Updated Firestore for checkout session: ${id}`);
    } catch (err) {
      console.error('❌ Error during checkout session webhook handling:', err.message);
    }
  }

  // Handle payment_intent.succeeded events (for legacy payment intent flow)
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

        // 🔄 Update matching contract in 'djContracts' collection
        const djContracts = await db
          .collection('djContracts')
          .where('email', '==', receipt_email)
          .where('eventDate', '==', docData.eventDate)
          .limit(1)
          .get();

        if (!djContracts.empty) {
          await djContracts.docs[0].ref.update({
            depositPaid: true,
            status: 'succeeded',
            paidAt: new Date(),
          });
        }

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