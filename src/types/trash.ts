export type TrashItemType = 
  | 'story' 
  | 'student' 
  | 'teacher' 
  | 'message' 
  | 'document' 
  | 'event' 
  | 'payment' 
  | 'announcement';

export interface TrashItem {
  id: string; // Trash document ID in 'trash' collection
  type: TrashItemType;
  title: string;
  content?: string;
  originalCollection: string;
  originalId: string;
  deletedBy: string;
  deletedByName: string;
  deletedAt: any; // Firestore Timestamp or Date ISO string
  expiresAt: any; // Expiration date (30 days from deletion)
  schoolId?: string;
  data: any; // Complete copy of original document payload including media, comments, etc.
}
