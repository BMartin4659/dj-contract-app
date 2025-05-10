import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingId, paymentMethod, amount } = body;

    // Validate required fields
    if (!bookingId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get booking details from Firebase
    const bookingRef = doc(db, 'djContracts', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingDoc.data();

    // Prepare email template parameters
    const templateParams = {
      to_email: bookingData.email,
      to_name: bookingData.clientName,
      event_date: bookingData.eventDate,
      event_type: bookingData.eventType,
      venue_name: bookingData.venueName,
      venue_location: bookingData.venueLocation,
      payment_method: paymentMethod,
      amount_paid: amount || bookingData.depositAmount || 'N/A',
      booking_ref: bookingId,
      payment_status: 'Confirmed'
    };

    // Send confirmation email
    // Replace emailjs.send with a placeholder

    // Update booking status in Firebase
    await updateDoc(bookingRef, {
      paymentConfirmed: true,
      paymentDate: new Date().toISOString(),
      paymentMethod: paymentMethod,
      amountPaid: amount || bookingData.depositAmount
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Payment confirmation email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return NextResponse.json({ 
      error: 'Failed to send payment confirmation' 
    }, { 
      status: 500 
    });
  }
} 