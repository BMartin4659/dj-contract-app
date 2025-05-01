export interface Message {
  id: string;
  eventId?: string;
  clientId: string;
  senderId: string;
  recipientId: string;
  subject?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'email' | 'chat' | 'system';
  templateId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'inquiry' | 'confirmation' | 'reminder' | 'followup' | 'custom';
  variables: string[]; // e.g., {{clientName}}, {{eventDate}}, etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string; // Where the lead came from
  status: 'lead' | 'prospect' | 'active' | 'past' | 'archived';
  notes?: string;
  lastContact?: Date;
  createdAt: Date;
  updatedAt: Date;
  events?: string[]; // Array of event IDs
  tags?: string[];
} 