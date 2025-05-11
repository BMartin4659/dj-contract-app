import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request) {
  try {
    const { bookingId, paymentMethod } = await request.json();

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the booking document
    const bookingRef = doc(db, "djContracts", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = bookingSnap.data();

    // Update the booking document with payment information
    await updateDoc(bookingRef, {
      paymentMethod,
      paymentStatus: 'pending',
      paymentInitiated: true,
      paymentInitiatedAt: serverTimestamp(),
      paymentInitiatedMethod: paymentMethod,
      lastUpdated: serverTimestamp(),
    });

    // Calculate all pricing details
    const basePrice = bookingData.basePrice || bookingData.price || 0;
    const equipmentFee = bookingData.equipmentFee || 0;
    const travelFee = bookingData.travelFee || 0;
    const additionalFees = bookingData.additionalFees || 0;
    const bookingFee = bookingData.bookingFee || 0;
    const taxRate = bookingData.taxRate || 0;
    
    const subtotal = basePrice + equipmentFee + travelFee + additionalFees;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount + bookingFee;

    // Create order items array based on booking data
    const orderItems = [
      { name: 'DJ Services', price: basePrice },
    ];
    
    if (equipmentFee > 0) {
      orderItems.push({ name: 'Equipment', price: equipmentFee });
    }
    
    if (travelFee > 0) {
      orderItems.push({ name: 'Travel', price: travelFee });
    }
    
    if (additionalFees > 0) {
      orderItems.push({ name: 'Additional Services', price: additionalFees });
    }

    // Extract relevant booking details to send back
    const bookingDetails = {
      bookingId,
      paymentMethod,
      amount: totalAmount || bookingData.totalPrice || bookingData.price || 0,
      eventDate: bookingData.eventDate || '',
      clientName: bookingData.clientName || '',
      venueName: bookingData.venueName || '',
      email: bookingData.email || '',
      eventType: bookingData.eventType || '',
      startTime: bookingData.startTime || '',
      endTime: bookingData.endTime || '',
      phoneNumber: bookingData.phoneNumber || '',
      orderItems,
      taxAmount,
      fees: bookingFee,
      subtotal
    };

    // Send success response with booking details
    return NextResponse.json({
      success: true,
      message: 'Payment confirmation recorded successfully',
      bookingDetails
    });
  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    
    return NextResponse.json(
      { error: 'Server error processing payment confirmation' },
      { status: 500 }
    );
  }
} 