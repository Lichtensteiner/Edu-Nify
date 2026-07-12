import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  content?: string;
  type: 'info' | 'warning' | 'success';
  targetTab?: string;
  read: boolean;
  timestamp: string;
}

export const createNotification = async (data: Omit<NotificationData, 'read' | 'timestamp'>) => {
  try {
    // 1. Create for targeted user
    await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      timestamp: new Date().toISOString()
    });

    // 2. Propagate to conservator accounts (users with role 'admin')
    const { getDocs, query, where, collection: firestoreCollection } = await import('firebase/firestore');
    const q = query(firestoreCollection(db, 'users'), where('role', '==', 'admin'));
    const adminSnap = await getDocs(q);
    const promises = adminSnap.docs.map(adminDoc => {
      if (adminDoc.id !== data.user_id) {
        return addDoc(firestoreCollection(db, 'notifications'), {
          ...data,
          user_id: adminDoc.id,
          title: `[Conservateur] ${data.title}`,
          read: false,
          timestamp: new Date().toISOString()
        });
      }
      return Promise.resolve();
    });
    await Promise.all(promises);
  } catch (error) {
    console.error("Error creating notification in service:", error);
  }
};

export const notifyAllUsers = async (title: string, message: string, type: 'info' | 'warning' | 'success', targetTab?: string) => {
  try {
    const { getDocs, collection } = await import('firebase/firestore');
    const usersSnap = await getDocs(collection(db, 'users'));
    
    const promises = usersSnap.docs.map(userDoc => 
      createNotification({
        user_id: userDoc.id,
        title,
        message,
        type,
        targetTab
      })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error("Error notifying all users:", error);
  }
};

export const sendEmailNotification = async (email: string, prenom: string, nom: string, role: string, password?: string, establishmentName?: string) => {
  try {
    const response = await fetch('/api/notifications/user-created', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, prenom, nom, role, password, establishmentName }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to send email');
    }
    const data = await response.json();
    console.log('[NotificationService] Real-time email dispatch status:', data);
    return data;
  } catch (error) {
    console.error('[NotificationService] Error in sendEmailNotification:', error);
    return null;
  }
};
