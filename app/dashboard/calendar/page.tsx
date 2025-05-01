'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Views, 
  momentLocalizer 
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaClock, FaUsers, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

// Configure the localizer
const localizer = momentLocalizer(moment);

// Define the interface for DJ Contract/Event
interface DjEvent {
  id: string;
  title: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  venueName: string;
  venueLocation: string;
  numberOfGuests: number;
  depositPaid: boolean;
  status: string;
  notes?: string;
  start: Date; // For calendar display
  end: Date;   // For calendar display
}

// Booking status options
const EVENT_STATUSES = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'pending', label: 'Pending' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function CalendarPage() {
  const [events, setEvents] = useState<DjEvent[]>([]);
  const [selectedView, setSelectedView] = useState('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DjEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    eventType: '',
    venueName: '',
    venueLocation: '',
    numberOfGuests: 0,
    notes: '',
    status: 'inquiry'
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date()
  });

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  // Function to fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, "djContracts"));
      const eventsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Parse dates for calendar
        const eventDate = data.eventDate;
        const startDateTime = new Date(`${eventDate}T${data.startTime}`);
        const endDateTime = new Date(`${eventDate}T${data.endTime}`);
        
        return {
          id: doc.id,
          title: `${data.eventType} - ${data.clientName}`,
          clientName: data.clientName,
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime,
          eventType: data.eventType,
          venueName: data.venueName || '',
          venueLocation: data.venueLocation || '',
          numberOfGuests: data.numberOfGuests || 0,
          depositPaid: data.depositPaid || false,
          status: data.status || 'pending',
          notes: data.notes || '',
          start: startDateTime,
          end: endDateTime
        } as DjEvent;
      });
      
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    }
  };

  // Handle event selection
  const handleSelectEvent = (event: DjEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Handle slot selection for new event
  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    // Format the date and time for the form
    const eventDate = moment(start).format('YYYY-MM-DD');
    const startTime = moment(start).format('HH:mm');
    const endTime = moment(end).format('HH:mm');
    
    setNewEvent({
      ...newEvent,
      eventDate,
      startTime,
      endTime
    });
    
    setShowEventModal(true);
  };

  // Handle input change for new event form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };

  // Handle select change for new event form
  const handleSelectChange = (name: string, value: string) => {
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };

  // Check for booking conflicts
  const checkForConflicts = (date: string, startTime: string, endTime: string, excludeId?: string) => {
    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);

    return events.some(event => {
      // Skip comparing with the same event (for updates)
      if (excludeId && event.id === excludeId) return false;
      
      const eventStart = new Date(`${event.eventDate}T${event.startTime}`);
      const eventEnd = new Date(`${event.eventDate}T${event.endTime}`);
      
      // Check if events overlap
      return (
        (newStart >= eventStart && newStart < eventEnd) || 
        (newEnd > eventStart && newEnd <= eventEnd) ||
        (newStart <= eventStart && newEnd >= eventEnd)
      );
    });
  };

  // Save new event
  const handleSaveEvent = async () => {
    try {
      // Validate required fields
      if (!newEvent.clientName || !newEvent.eventDate || !newEvent.startTime || !newEvent.endTime) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Check for conflicts
      if (checkForConflicts(newEvent.eventDate, newEvent.startTime, newEvent.endTime)) {
        toast.error("There is a scheduling conflict with another event");
        return;
      }
      
      // Create new event object
      const eventToSave = {
        clientName: newEvent.clientName,
        email: newEvent.email,
        phoneNumber: newEvent.phoneNumber,
        eventDate: newEvent.eventDate,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        eventType: newEvent.eventType,
        venueName: newEvent.venueName,
        venueLocation: newEvent.venueLocation,
        numberOfGuests: Number(newEvent.numberOfGuests),
        depositPaid: false,
        status: newEvent.status,
        notes: newEvent.notes,
        createdAt: new Date()
      };
      
      // Save to Firestore
      await addDoc(collection(db, "djContracts"), eventToSave);
      
      // Close modal and refresh events
      setShowEventModal(false);
      
      // Reset form
      setNewEvent({
        clientName: '',
        email: '',
        phoneNumber: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        eventType: '',
        venueName: '',
        venueLocation: '',
        numberOfGuests: 0,
        notes: '',
        status: 'inquiry'
      });
      
      toast.success("Event added successfully");
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    }
  };

  // Update event status
  const updateEventStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "djContracts", id), { status });
      toast.success("Event status updated");
      
      // Update local state
      setEvents(prev => 
        prev.map(event => 
          event.id === id ? { ...event, status } : event
        )
      );
      
      // Update selected event if open
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent({ ...selectedEvent, status });
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to update event status");
    }
  };

  // Export calendar to Google
  const exportToGoogle = () => {
    // Create URL for Google Calendar
    const googleUrl = new URL('https://calendar.google.com/calendar/r/eventedit');
    
    if (selectedEvent) {
      const { eventDate, startTime, endTime, clientName, eventType, venueName, venueLocation } = selectedEvent;
      
      const startDateTime = `${eventDate.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
      const endDateTime = `${eventDate.replace(/-/g, '')}T${endTime.replace(':', '')}00`;
      
      googleUrl.searchParams.append('text', `${eventType} - ${clientName}`);
      googleUrl.searchParams.append('dates', `${startDateTime}/${endDateTime}`);
      googleUrl.searchParams.append('details', `DJ Booking for ${clientName}`);
      googleUrl.searchParams.append('location', `${venueName}, ${venueLocation}`);
      
      window.open(googleUrl.toString(), '_blank');
    }
  };

  return (
    <div className="p-6 space-y-6 text-white">
      <Header />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🎧 DJ Calendar</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setSelectedView('month')}
            variant={selectedView === 'month' ? 'default' : 'outline'}
          >
            Month
          </Button>
          <Button 
            onClick={() => setSelectedView('week')}
            variant={selectedView === 'week' ? 'default' : 'outline'}
          >
            Week
          </Button>
          <Button 
            onClick={() => setSelectedView('day')}
            variant={selectedView === 'day' ? 'default' : 'outline'}
          >
            Day
          </Button>
          <Button
            onClick={() => setShowEventModal(true)}
          >
            Add Event
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4 min-h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            style={{ height: 600 }}
            defaultView={selectedView as any}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={(event) => {
              // Color events based on status
              let backgroundColor = '#3174ad';
              
              switch (event.status) {
                case 'inquiry':
                  backgroundColor = '#6366f1'; // Indigo
                  break;
                case 'pending':
                  backgroundColor = '#f59e0b'; // Amber
                  break;
                case 'contract_sent':
                  backgroundColor = '#3b82f6'; // Blue
                  break;
                case 'confirmed':
                  backgroundColor = '#10b981'; // Emerald
                  break;
                case 'deposit_paid':
                  backgroundColor = '#059669'; // Green
                  break;
                case 'completed':
                  backgroundColor = '#6b7280'; // Gray
                  break;
                case 'cancelled':
                  backgroundColor = '#ef4444'; // Red
                  break;
              }
              
              return {
                style: {
                  backgroundColor,
                }
              };
            }}
          />
        </CardContent>
      </Card>
      
      {/* Event details modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedEvent?.eventType} - {selectedEvent?.clientName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-blue-400" />
                    <span>Date: {moment(selectedEvent.eventDate).format('dddd, MMMM D, YYYY')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-blue-400" />
                    <span>Time: {selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaUsers className="text-blue-400" />
                    <span>Guests: {selectedEvent.numberOfGuests}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaBuilding className="text-blue-400" />
                    <span>Venue: {selectedEvent.venueName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-blue-400" />
                    <span>Location: {selectedEvent.venueLocation}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaPhone className="text-blue-400" />
                    <span>Phone: {selectedEvent.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaEnvelope className="text-blue-400" />
                    <span>Email: {selectedEvent.email}</span>
                  </div>
                </div>
              </div>
              
              {selectedEvent.notes && (
                <div>
                  <h3 className="font-semibold">Notes:</h3>
                  <p>{selectedEvent.notes}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Status:</h3>
                <div className="flex space-x-2">
                  {EVENT_STATUSES.map(status => (
                    <Button
                      key={status.value}
                      size="sm"
                      variant={selectedEvent.status === status.value ? "default" : "outline"}
                      onClick={() => updateEventStatus(selectedEvent.id, status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                <Button onClick={exportToGoogle}>
                  Add to Google Calendar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* New event modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name*</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={newEvent.clientName}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type*</Label>
                <Input
                  id="eventType"
                  name="eventType"
                  value={newEvent.eventType}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                  placeholder="Wedding, Corporate, Party, etc."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date*</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={newEvent.eventDate}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time*</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time*</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newEvent.email}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={newEvent.phoneNumber}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  name="venueName"
                  value={newEvent.venueName}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfGuests">Expected Guests</Label>
                <Input
                  id="numberOfGuests"
                  name="numberOfGuests"
                  type="number"
                  value={newEvent.numberOfGuests.toString()}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="venueLocation">Venue Location</Label>
              <Input
                id="venueLocation"
                name="venueLocation"
                value={newEvent.venueLocation}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newEvent.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={newEvent.notes}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent}>
              Save Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
} 