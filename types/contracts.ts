export interface Contract {
  id: string;
  eventId: string;
  clientId: string;
  templateId: string;
  content: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'countersigned' | 'void';
  clientSignature?: {
    name: string;
    signature: string;
    timestamp: Date;
    ipAddress?: string;
  };
  djSignature?: {
    name: string;
    signature: string;
    timestamp: Date;
  };
  sentAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  countersignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  type: 'wedding' | 'corporate' | 'party' | 'club' | 'custom';
  variables: string[]; // e.g., {{eventDate}}, {{venue}}, etc.
  sections: ContractSection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  order: number;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
} 