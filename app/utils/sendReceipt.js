// utils/sendReceipt.js
import jsPDF from "jspdf";
import emailjs from "@emailjs/browser";

export const sendReceipt = async (formData, paymentAmount) => {
  const { clientName, email, eventDate, eventType } = formData;
  const total = calculateTotal(formData);
  const remaining = total - paymentAmount;

  // 1. Generate PDF
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Live City DJ Payment Receipt", 20, 20);
  doc.setFontSize(12);
  doc.text(`Client: ${clientName}`, 20, 40);
  doc.text(`Email: ${email}`, 20, 50);
  doc.text(`Event: ${eventType} on ${eventDate}`, 20, 60);
  doc.text(`Total: $${total}`, 20, 80);
  doc.text(`Paid: $${paymentAmount}`, 20, 90);
  doc.text(`Remaining: $${remaining}`, 20, 100);
  const pdfBase64 = doc.output("datauristring");

  // 2. Send email via EmailJS
  const emailParams = {
    to_name: clientName,
    to_email: email,
    event_type: eventType,
    event_date: eventDate,
    payment_amount: `$${paymentAmount}`,
    remaining_balance: `$${remaining}`,
    receipt_pdf: pdfBase64,
  };

  await emailjs.send(
    "service_9z9konq",
    "template_p87ey1j",
    emailParams,
    "NdEqZMAfDI3DOObLT"
  );
};

// Matches your pricing logic
function calculateTotal(formData) {
  let total = 350;
  if (formData.lighting) total += 100;
  if (formData.photography) total += 150;
  if (formData.videoVisuals) total += 100;
  total += formData.additionalHours * 75;
  return total;
}
