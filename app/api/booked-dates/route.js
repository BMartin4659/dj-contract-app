import { NextResponse } from 'next/server';

// Helper function to ensure consistent date formatting
function formatDate(date) {
  return new Date(date).toISOString();
}

export async function GET() {
  try {
    // Here you would typically fetch booked dates from your database
    // For demonstration, creating a date range for the next few months
    const bookedDates = [];
    
    // Current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Add some sample weekend dates (Saturdays) as booked for the next 3 months
    for (let month = currentMonth; month < currentMonth + 3; month++) {
      const actualMonth = month % 12;
      const year = currentYear + Math.floor(month / 12);
      
      // Create a date for each Saturday in this month
      const date = new Date(year, actualMonth, 1);
      
      // Find the first Saturday of the month
      while (date.getDay() !== 6) { // 6 is Saturday
        date.setDate(date.getDate() + 1);
      }
      
      // Add all Saturdays in this month
      const monthEnd = new Date(year, actualMonth + 1, 0).getDate();
      while (date.getDate() <= monthEnd) {
        bookedDates.push(new Date(date));
        date.setDate(date.getDate() + 7); // Move to next Saturday
      }
    }

    return NextResponse.json(bookedDates.map(formatDate));
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