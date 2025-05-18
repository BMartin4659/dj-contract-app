import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Contract, ContractTemplate } from '@/types/contracts';

export async function createContract(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  try {
    const contractData = {
      ...contract,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'contracts'), contractData);
    return { id: docRef.id, ...contractData };
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

export async function getContractsByClientId(clientId: string) {
  try {
    const contractsQuery = query(
      collection(db, 'contracts'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(contractsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Contract));
  } catch (error) {
    console.error('Error getting contracts:', error);
    throw error;
  }
}

export async function getContractById(contractId: string) {
  try {
    const contractRef = doc(db, 'contracts', contractId);
    const contractDoc = await getDoc(contractRef);
    
    if (!contractDoc.exists()) {
      throw new Error('Contract not found');
    }
    
    return {
      id: contractDoc.id,
      ...contractDoc.data()
    } as Contract;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
}

export async function updateContractStatus(
  contractId: string,
  status: Contract['status'],
  signature?: Contract['clientSignature'] | Contract['djSignature']
) {
  try {
    const contractRef = doc(db, 'contracts', contractId);
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'signed' && signature) {
      updateData.clientSignature = signature;
      updateData.signedAt = new Date();
    } else if (status === 'countersigned' && signature) {
      updateData.djSignature = signature;
      updateData.countersignedAt = new Date();
    } else if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'viewed') {
      updateData.viewedAt = new Date();
    }

    await updateDoc(contractRef, updateData);
  } catch (error) {
    console.error('Error updating contract status:', error);
    throw error;
  }
}

export async function getContractTemplates(type?: string) {
  try {
    let templatesQuery = collection(db, 'contractTemplates');
    
    if (type) {
      templatesQuery = query(
        templatesQuery,
        where('type', '==', type)
      ) as any;
    }
    
    const snapshot = await getDocs(templatesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContractTemplate));
  } catch (error) {
    console.error('Error getting contract templates:', error);
    throw error;
  }
}

export function applyContractVariables(template: ContractTemplate, variables: Record<string, string>) {
  let content = template.content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return content;
}

export async function voidContract(contractId: string, reason: string) {
  try {
    const contractRef = doc(db, 'contracts', contractId);
    await updateDoc(contractRef, {
      status: 'void',
      voidReason: reason,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error voiding contract:', error);
    throw error;
  }
} 