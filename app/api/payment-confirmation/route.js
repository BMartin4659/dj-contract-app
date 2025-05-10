import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingId, paymentMethod, amount } = body;

    // Validate required fields
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing required fields: bookingId is required' }, { status: 400 });
    }

    let bookingDoc;
    let bookingRef;
    let collectionName;

    // First try to find the booking in 'djContracts'
    bookingRef = doc(db, 'djContracts', bookingId);
    bookingDoc = await getDoc(bookingRef);

    // If not found by ID, try to query by paymentId
    if (!bookingDoc.exists()) {
      collectionName = 'djContracts';
      const bookingsRef = collection(db, collectionName);
      const q = query(bookingsRef, where('paymentId', '==', bookingId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Booking found by paymentId
        bookingDoc = querySnapshot.docs[0];
        bookingRef = doc(db, collectionName, bookingDoc.id);
      } else {
        // If not found in djContracts, try 'bookings' collection
        collectionName = 'bookings';
        bookingRef = doc(db, collectionName, bookingId);
        bookingDoc = await getDoc(bookingRef);
        
        // If not found by ID, try to query by paymentId in 'bookings'
        if (!bookingDoc.exists()) {
          const bookingsRef = collection(db, collectionName);
          const q = query(bookingsRef, where('paymentId', '==', bookingId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Booking found by paymentId
            bookingDoc = querySnapshot.docs[0];
            bookingRef = doc(db, collectionName, bookingDoc.id);
          } else {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
          }
        }
      }
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
      payment_method: paymentMethod || bookingData.paymentMethod || 'External Payment',
      amount_paid: amount || bookingData.depositAmount || bookingData.totalAmount || 'N/A',
      booking_ref: bookingId,
      payment_status: 'Confirmed'
    };

    // Update booking status in Firebase
    const updateData = {
      paymentConfirmed: true,
      paymentDate: new Date().toISOString(),
      status: 'payment_confirmed'
    };
    
    // Only update paymentMethod if provided
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    // Only update amount if provided
    if (amount) {
      updateData.amountPaid = amount;
    }
    
    await updateDoc(bookingRef, updateData);

    // Log the confirmation
    console.log(`Payment confirmed for booking ${bookingId} with ${paymentMethod || 'external payment'}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Payment confirmation processed successfully',
      bookingId,
      paymentMethod: paymentMethod || bookingData.paymentMethod || 'External Payment'
    });

  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    return NextResponse.json({ 
      error: 'Failed to process payment confirmation',
      details: error.message
    }, { 
      status: 500 
    });
  }
} 