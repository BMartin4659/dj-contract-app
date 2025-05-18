import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Message, MessageTemplate } from '@/types/messages';

export async function sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'read'>) {
  try {
    const messageData = {
      ...message,
      timestamp: new Date(),
      read: false,
    };
    
    const docRef = await addDoc(collection(db, 'messages'), messageData);
    return { id: docRef.id, ...messageData };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getMessagesByClientId(clientId: string) {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('clientId', '==', clientId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

export async function getMessageTemplates(category?: string) {
  try {
    let templatesQuery = collection(db, 'messageTemplates');
    
    if (category) {
      templatesQuery = query(
        templatesQuery,
        where('category', '==', category)
      ) as any;
    }
    
    const snapshot = await getDocs(templatesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MessageTemplate));
  } catch (error) {
    console.error('Error getting message templates:', error);
    throw error;
  }
}

export function applyTemplateVariables(template: MessageTemplate, variables: Record<string, string>) {
  let content = template.content;
  let subject = template.subject;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return {
    subject,
    content
  };
} 