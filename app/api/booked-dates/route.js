import { NextResponse } from 'next/server';

// Helper function to ensure consistent date formatting
function formatDate(date) {
  return new Date(date).toISOString();
}

// Simple API to return a list of booked dates
export async function GET() {
  try {
    // Hardcoded sample dates - in a real app, these would come from a database
    const bookedDates = [
      new Date(2024, 5, 15), // June 15, 2024
      new Date(2024, 5, 22), // June 22, 2024
      new Date(2024, 6, 6),  // July 6, 2024
      new Date(2024, 6, 20), // July 20, 2024
    ];
    
    // Convert to ISO string format
    const formattedDates = bookedDates.map(date => date.toISOString());
    
    return NextResponse.json(formattedDates);
  } catch (error) {
    console.error('Error generating booked dates:', error);
    return NextResponse.json({ error: 'Failed to fetch booked dates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.date) {
      return NextResponse.json(
        { error: 'Date is required' }, 
        { status: 400 }
      );
    }
    
    // Parse the date to ensure it's valid
    const bookingDate = new Date(body.date);
    
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' }, 
        { status: 400 }
      );
    }
    
    // Here you would typically save the booked date to your database
    // For now, we'll just return success with the formatted date
    
    return NextResponse.json({ 
      message: 'Date booked successfully',
      date: formatDate(bookingDate)
    });
  } catch (error) {
    console.error('Error booking date:', error);
    return NextResponse.json({ error: 'Failed to book date' }, { status: 500 });
  }
} 