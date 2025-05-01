/**
 * DJ Event/Contract data type
 */
export interface DjEvent {
  id: string;
  title?: string;
  clientName: string;
  email?: string;
  phoneNumber?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType?: string;
  venueName?: string;
  venueLocation?: string;
  numberOfGuests?: number;
  depositPaid?: boolean;
  status?: string;
  notes?: string;
  createdAt?: Date;
  start?: Date; // For calendar display
  end?: Date;   // For calendar display
}

/**
 * Event status options
 */
export const EVENT_STATUSES = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'pending', label: 'Pending' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]; 