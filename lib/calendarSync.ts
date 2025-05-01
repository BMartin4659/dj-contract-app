import { DjEvent } from '@/types/events';

/**
 * Generates a Google Calendar URL for adding an event
 */
export function createGoogleCalendarUrl(event: DjEvent): string {
  const googleUrl = new URL('https://calendar.google.com/calendar/r/eventedit');
  
  const { eventDate, startTime, endTime, clientName, eventType, venueName, venueLocation } = event;
  
  // Format dates for Google Calendar
  const startDateTime = `${eventDate.replace(/-/g, '')}T${startTime.replace(/:/g, '')}00`;
  const endDateTime = `${eventDate.replace(/-/g, '')}T${endTime.replace(/:/g, '')}00`;
  
  googleUrl.searchParams.append('text', `${eventType} - ${clientName}`);
  googleUrl.searchParams.append('dates', `${startDateTime}/${endDateTime}`);
  googleUrl.searchParams.append('details', `DJ Booking for ${clientName}`);
  googleUrl.searchParams.append('location', `${venueName}, ${venueLocation}`);
  
  return googleUrl.toString();
}

/**
 * Generates an iCal file content for an event
 */
export function createICalEvent(event: DjEvent): string {
  const { eventDate, startTime, endTime, clientName, eventType, venueName, venueLocation } = event;
  
  // Format dates for iCal
  const startDateTime = new Date(`${eventDate}T${startTime}`);
  const endDateTime = new Date(`${eventDate}T${endTime}`);
  
  const formatICalDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const startStr = formatICalDate(startDateTime);
  const endStr = formatICalDate(endDateTime);
  
  // Create iCal content
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Live City DJ//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${eventType} - ${clientName}`,
    `DESCRIPTION:DJ Booking for ${clientName}`,
    `LOCATION:${venueName}, ${venueLocation}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icalContent;
}

/**
 * Generates Outlook Web URL for adding an event
 */
export function createOutlookCalendarUrl(event: DjEvent): string {
  const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  
  const { eventDate, startTime, endTime, clientName, eventType, venueName, venueLocation } = event;
  
  // Format dates for Outlook
  const startDateTime = new Date(`${eventDate}T${startTime}`);
  const endDateTime = new Date(`${eventDate}T${endTime}`);
  
  // Format parameters
  outlookUrl.searchParams.append('subject', `${eventType} - ${clientName}`);
  outlookUrl.searchParams.append('startdt', startDateTime.toISOString());
  outlookUrl.searchParams.append('enddt', endDateTime.toISOString());
  outlookUrl.searchParams.append('body', `DJ Booking for ${clientName}`);
  outlookUrl.searchParams.append('location', `${venueName}, ${venueLocation}`);
  
  return outlookUrl.toString();
}

/**
 * Download iCal file for an event
 */
export function downloadICalFile(event: DjEvent): void {
  const icalContent = createICalEvent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.eventType?.replace(/\s+/g, '_') || 'Event'}_${event.clientName?.replace(/\s+/g, '_') || 'Client'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate a shareable availability URL 
 * (This would need to be implemented with a real endpoint on your server)
 */
export function generateAvailabilityUrl(userId: string): string {
  // In a real implementation, this would create a unique link to a page
  // showing available slots for booking
  return `${window.location.origin}/availability/${userId}`;
}

/**
 * Check if two events overlap
 */
export function eventsOverlap(event1: DjEvent, event2: DjEvent): boolean {
  if (event1.eventDate !== event2.eventDate) return false;
  
  const event1Start = new Date(`${event1.eventDate}T${event1.startTime}`);
  const event1End = new Date(`${event1.eventDate}T${event1.endTime}`);
  const event2Start = new Date(`${event2.eventDate}T${event2.startTime}`);
  const event2End = new Date(`${event2.eventDate}T${event2.endTime}`);
  
  return (
    (event1Start >= event2Start && event1Start < event2End) || 
    (event1End > event2Start && event1End <= event2End) ||
    (event1Start <= event2Start && event1End >= event2End)
  );
}

/**
 * Check for booking conflicts among multiple events
 */
export function checkForConflicts(
  date: string, 
  startTime: string, 
  endTime: string, 
  existingEvents: DjEvent[],
  excludeId?: string
): boolean {
  const newEvent = {
    id: 'temp',
    eventDate: date,
    startTime,
    endTime
  } as DjEvent;
  
  return existingEvents.some(event => {
    if (excludeId && event.id === excludeId) return false;
    return eventsOverlap(newEvent, event);
  });
} 