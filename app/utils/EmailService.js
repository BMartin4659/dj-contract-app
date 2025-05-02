import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';

class EmailService {
  constructor() {
    this.serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_xf2z1y9';
    this.templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_j4j7ew9';
    this.userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID || 'user_GyUbY2zy0f3HiXB1D';
  }
  
  /**
   * Send confirmation email using EmailJS
   * @param {Object} templateParams - Parameters for the email template
   * @returns {Promise<boolean>} - Success status
   */
  async sendConfirmationEmail(templateParams) {
    try {
      // Prepare the email parameters
      const emailParams = {
        ...templateParams,
        client_name: templateParams.clientName || templateParams.client_name,
        email: templateParams.email,
        phone: templateParams.contactPhone || templateParams.phone,
        event_date: templateParams.eventDate || templateParams.event_date,
        event_type: templateParams.eventType || templateParams.event_type,
        event_location: templateParams.eventLocation || templateParams.event_location,
        event_start_time: templateParams.eventStartTime || templateParams.event_start_time,
        event_end_time: templateParams.eventEndTime || templateParams.event_end_time,
        total_price: templateParams.totalPrice || templateParams.total_price,
        deposit_amount: templateParams.depositAmount || templateParams.deposit_amount,
        remaining_balance: templateParams.remainingBalance || templateParams.remaining_balance,
        payment_method: templateParams.paymentMethod || templateParams.payment_method,
        booking_id: templateParams.bookingId || templateParams.booking_id,
        include_lighting: templateParams.includeLighting ? 'Yes' : 'No',
        include_photography: templateParams.includePhotography ? 'Yes' : 'No',
        include_video_visuals: templateParams.includeVideoVisuals ? 'Yes' : 'No',
        special_requests: templateParams.specialRequests || templateParams.special_requests || 'None',
        song_requests: templateParams.songRequests || templateParams.song_requests || 'None',
        signature: templateParams.signature || 'Digital Signature',
      };

      // Send the email using EmailJS
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        emailParams,
        this.userId
      );

      if (response && response.status === 200) {
        console.log('Email sent successfully:', response);
        return true;
      } else {
        console.error('Email sending failed with response:', response);
        throw new Error('Email sending failed');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send confirmation email. Please contact support.');
      return false;
    }
  }
  
  /**
   * Format booking details for email
   * @param {Object} formData - Form data
   * @param {string} bookingId - Booking ID
   * @param {Object} pricing - Pricing information
   * @returns {Object} - Formatted template parameters
   */
  formatBookingForEmail(formData, bookingId, pricing) {
    return {
      clientName: formData.clientName,
      email: formData.email,
      contactPhone: formData.contactPhone,
      eventDate: formData.eventDate,
      eventType: formData.eventType,
      eventLocation: formData.eventLocation,
      eventStartTime: formData.eventStartTime,
      eventEndTime: formData.eventEndTime,
      totalPrice: `$${pricing.total}`,
      depositAmount: `$${pricing.depositAmount}`,
      remainingBalance: `$${pricing.remainingBalance}`,
      paymentMethod: formData.paymentMethod,
      bookingId: bookingId,
      includeLighting: formData.includeLighting,
      includePhotography: formData.includePhotography,
      includeVideoVisuals: formData.includeVideoVisuals,
      specialRequests: formData.specialRequests || 'None',
      songRequests: formData.songRequests || 'None',
      signature: formData.signature || 'Digital Signature',
    };
  }
}

export default new EmailService(); 