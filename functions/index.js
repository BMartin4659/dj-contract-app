const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// 🔁 DAILY REMINDER EMAIL FUNCTION
exports.sendReminderEmails = functions
  .region('us-central1')
  .pubsub.schedule("every 24 hours")
  .onRun(async () => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 14); // 14 days from now

    const snapshot = await db.collection("contracts").get();

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const eventDate = new Date(data.eventDate);
      const diffTime = Math.abs(eventDate - targetDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const payload = {
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_USER_ID,
          template_params: {
            to_email: data.customerEmail,
            to_name: data.customerName,
            event_type: data.eventType,
            venue: data.venueName,
            event_date: eventDate.toLocaleDateString(),
            payment_amount: `$${(data.amountPaid / 100).toFixed(2)}`,
            message: `This is a reminder that your event is coming up in 2 weeks on ${eventDate.toLocaleDateString()} at ${data.venueName}. Please confirm your details or final payment.`,
          },
        };

        try {
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", payload);
          console.log(`✅ Reminder sent to ${data.customerEmail}`);
        } catch (error) {
          console.error("❌ Failed to send reminder email:", error.message);
        }
      }
    });
  });

// 💵 RECEIPT EMAIL AFTER PAYMENT
exports.sendReceiptOnPayment = functions
  .region('us-central1')
  .firestore.document("payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const paymentData = snap.data();

    const {
      customerName,
      customerEmail,
      amountPaid,
      eventDate,
      eventType,
      venueName,
    } = paymentData;

    const formattedDate = new Date(eventDate).toLocaleDateString();
    const formattedAmount = `$${(amountPaid / 100).toFixed(2)}`;

    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_USER_ID,
      template_params: {
        to_email: customerEmail,
        to_name: customerName,
        event_type: eventType,
        venue: venueName,
        event_date: formattedDate,
        payment_amount: formattedAmount,
        message: `Thank you for your payment of ${formattedAmount} for your upcoming event on ${formattedDate} at ${venueName}. This email serves as your official receipt.`,
      },
    };

    try {
      await axios.post("https://api.emailjs.com/api/v1.0/email/send", payload);
      console.log(`✅ Receipt sent to ${customerEmail}`);
    } catch (error) {
      console.error("❌ Failed to send receipt email:", error.message);
    }
  });
