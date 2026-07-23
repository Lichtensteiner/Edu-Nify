import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AppNotification {
  title: string;
  message: string;
  type: 'survey' | 'election' | 'results' | 'reminder';
  targetRoles?: string[];
  targetSchoolId?: string;
  targetAudience?: any;
  linkId?: string;
  createdAt?: any;
  isRead?: boolean;
}

export const createSurveyNotification = async (notificationData: AppNotification) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Could not record notification:", error);
  }
};

export const createActivityLog = async (
  title: string,
  type: 'survey' | 'election',
  action: string,
  userName: string,
  schoolId?: string
) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      title,
      type,
      action,
      userName,
      schoolId: schoolId || 'all',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.warn("Could not record activity log:", error);
  }
};
