import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TrashItem, TrashItemType } from '../types/trash';

const TRASH_COLLECTION = 'trash';

export interface MoveToTrashParams {
  type: TrashItemType;
  title: string;
  content?: string;
  originalCollection: string;
  originalId: string;
  deletedBy: string;
  deletedByName: string;
  data: any;
  schoolId?: string;
}

/**
 * Moves an item to the trash collection and marks original as soft deleted
 */
export async function moveToTrash(params: MoveToTrashParams): Promise<string> {
  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days retention

  const trashPayload = {
    type: params.type,
    title: params.title || 'Élément supprimé',
    content: params.content || '',
    originalCollection: params.originalCollection,
    originalId: params.originalId,
    deletedBy: params.deletedBy,
    deletedByName: params.deletedByName || 'Utilisateur',
    deletedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAtDate),
    schoolId: params.schoolId || 'default',
    data: params.data || {}
  };

  try {
    // 1. Add to trash collection
    const trashRef = await addDoc(collection(db, TRASH_COLLECTION), trashPayload);

    // 2. Mark original document as soft-deleted
    const originalRef = doc(db, params.originalCollection, params.originalId);
    await updateDoc(originalRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: params.deletedBy,
      originalLocation: params.originalCollection
    });

    // 3. If original is a story, also soft-delete synced post if it exists
    if (params.originalCollection === 'stories') {
      try {
        const postRef = doc(db, 'posts', params.originalId);
        await updateDoc(postRef, {
          deleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: params.deletedBy
        });
      } catch (e) {
        // Ignore if legacy post doc doesn't exist
      }
    }

    return trashRef.id;
  } catch (error) {
    console.error('Error moving item to trash:', error);
    handleFirestoreError(error, OperationType.WRITE, TRASH_COLLECTION);
    throw error;
  }
}

/**
 * Real-time subscription to items in the trash
 */
export function subscribeToTrash(
  callback: (items: TrashItem[]) => void,
  errorCallback?: (err: any) => void
): () => void {
  const q = query(collection(db, TRASH_COLLECTION), orderBy('deletedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type || 'story',
          title: data.title || 'Élément',
          content: data.content || '',
          originalCollection: data.originalCollection || 'stories',
          originalId: data.originalId || d.id,
          deletedBy: data.deletedBy || '',
          deletedByName: data.deletedByName || 'Utilisateur',
          deletedAt: data.deletedAt,
          expiresAt: data.expiresAt,
          schoolId: data.schoolId,
          data: data.data || {}
        } as TrashItem;
      });
      callback(items);
    },
    (err) => {
      console.error('Error reading trash items:', err);
      if (errorCallback) errorCallback(err);
    }
  );
}

/**
 * Restores an item from the trash back to its original collection
 */
export async function restoreFromTrash(item: TrashItem): Promise<void> {
  try {
    // 1. Prepare restored data without soft delete flags
    const restoredData = { ...item.data };
    delete restoredData.deleted;
    delete restoredData.deletedAt;
    delete restoredData.deletedBy;
    delete restoredData.originalLocation;

    // Ensure ID is preserved
    restoredData.id = item.originalId;

    // 2. Put back into original collection
    const originalRef = doc(db, item.originalCollection, item.originalId);
    await setDoc(originalRef, restoredData, { merge: true });

    // 3. Remove soft delete flag if present
    await updateDoc(originalRef, {
      deleted: false,
      deletedAt: null,
      deletedBy: null
    });

    // 4. Sync back to 'posts' if story
    if (item.originalCollection === 'stories') {
      try {
        const postRef = doc(db, 'posts', item.originalId);
        await setDoc(postRef, restoredData, { merge: true });
        await updateDoc(postRef, {
          deleted: false,
          deletedAt: null
        });
      } catch (e) {
        // Ignore
      }
    }

    // 5. Delete entry from trash collection
    await deleteDoc(doc(db, TRASH_COLLECTION, item.id));
  } catch (error) {
    console.error('Error restoring item from trash:', error);
    handleFirestoreError(error, OperationType.WRITE, item.originalCollection);
    throw error;
  }
}

/**
 * Permanently deletes an item from trash and removes original document permanently
 */
export async function permanentlyDeleteFromTrash(item: TrashItem): Promise<void> {
  try {
    // 1. Delete original document from primary collection
    try {
      await deleteDoc(doc(db, item.originalCollection, item.originalId));
    } catch (e) {
      console.warn(`Original document ${item.originalId} might already be deleted:`, e);
    }

    // 2. Delete legacy synced document if story
    if (item.originalCollection === 'stories') {
      try {
        await deleteDoc(doc(db, 'posts', item.originalId));
      } catch (e) {
        // Ignore
      }
    }

    // 3. Delete trash document
    await deleteDoc(doc(db, TRASH_COLLECTION, item.id));
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    handleFirestoreError(error, OperationType.DELETE, TRASH_COLLECTION);
    throw error;
  }
}
