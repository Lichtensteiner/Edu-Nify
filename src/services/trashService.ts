import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TrashItem, TrashItemType, TrashModule, TrashRetentionSettings } from '../types/trash';
import { recordAuditLog } from './auditService';
import { createNotification } from './NotificationService';

const TRASH_COLLECTION = 'trash';
const RETENTION_SETTINGS_DOC = 'trash_settings';

export interface MoveToTrashParams {
  module: TrashModule | string;
  entityType: TrashItemType | string;
  entityId: string;
  title: string;
  content?: string;
  authorName?: string;
  authorId?: string;
  originalCollection: string;
  originalDocumentId?: string;
  deletedBy: string;
  deletedByName?: string;
  deletedReason?: string;
  schoolId?: string;
  originalData: any;
  metadata?: Record<string, any>;
}

/**
 * Gets the configured retention settings (defaults to 30 days)
 */
export async function getRetentionSettings(): Promise<TrashRetentionSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'system_settings', RETENTION_SETTINGS_DOC));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as TrashRetentionSettings;
    }
  } catch (e) {
    console.warn('Could not load trash retention settings, using default 30 days:', e);
  }
  return { retentionDays: 30 };
}

/**
 * Updates the trash retention setting (Super Admin / Admin)
 */
export async function updateRetentionSettings(settings: TrashRetentionSettings, user: any): Promise<void> {
  try {
    await setDoc(doc(db, 'system_settings', RETENTION_SETTINGS_DOC), {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: user?.displayName || user?.email || user?.uid || 'Admin'
    }, { merge: true });

    await recordAuditLog({
      userId: user?.uid || 'admin',
      userName: user?.displayName || user?.email || 'Admin',
      userRole: user?.role || 'admin',
      action: 'Modification de la politique de conservation de la corbeille',
      details: `Durée fixée à ${settings.retentionDays === -1 ? 'Jamais (Infinie)' : settings.retentionDays + ' jours'}`,
      category: 'management'
    });
  } catch (e) {
    console.error('Error updating retention settings:', e);
    throw e;
  }
}

/**
 * Moves an item to the trash collection and soft-deletes the original document
 */
export async function moveToTrash(params: MoveToTrashParams): Promise<string> {
  const now = new Date();
  const settings = await getRetentionSettings();
  const retentionDays = settings.retentionDays;

  // Calculate expiration date (-1 means never expire)
  let expiresAtDate: Date | null = null;
  if (retentionDays > 0) {
    expiresAtDate = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  } else {
    // 100 years in future for 'Never'
    expiresAtDate = new Date(now.getTime() + 36500 * 24 * 60 * 60 * 1000);
  }

  const docIdToUse = params.originalDocumentId || params.entityId;

  const trashPayload = {
    trashId: '', // Will be updated or set
    module: params.module || 'Autre',
    entityType: params.entityType || 'autre',
    entityId: params.entityId,
    title: params.title || 'Élément supprimé',
    content: params.content || '',
    authorName: params.authorName || 'Anonyme',
    authorId: params.authorId || '',
    originalCollection: params.originalCollection,
    originalDocumentId: docIdToUse,
    deletedBy: params.deletedBy || 'admin',
    deletedByName: params.deletedByName || 'Utilisateur',
    deletedAt: serverTimestamp(),
    deletedReason: params.deletedReason || '',
    expiresAt: expiresAtDate ? Timestamp.fromDate(expiresAtDate) : null,
    schoolId: params.schoolId || 'default',
    status: 'deleted',
    originalData: params.originalData || {},
    metadata: params.metadata || {}
  };

  try {
    // 1. Add to trash collection
    const trashRef = await addDoc(collection(db, TRASH_COLLECTION), trashPayload);
    await updateDoc(trashRef, { trashId: trashRef.id });

    // 2. Mark original document as soft-deleted in its primary collection
    const originalRef = doc(db, params.originalCollection, docIdToUse);
    try {
      await updateDoc(originalRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: params.deletedBy,
        deletedReason: params.deletedReason || '',
        trashRefId: trashRef.id
      });
    } catch (err) {
      console.warn(`Could not update soft-delete flag on ${params.originalCollection}/${docIdToUse}:`, err);
    }

    // 3. Sync soft-delete to secondary/legacy collections if necessary (e.g. stories -> posts)
    if (params.originalCollection === 'stories') {
      try {
        const postRef = doc(db, 'posts', docIdToUse);
        await updateDoc(postRef, {
          deleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: params.deletedBy,
          trashRefId: trashRef.id
        });
      } catch (e) {
        // Ignore if post doc doesn't exist
      }
    }

    // 4. Record Audit Log
    await recordAuditLog({
      userId: params.deletedBy,
      userName: params.deletedByName || 'Utilisateur',
      userRole: 'admin',
      action: `Suppression (Corbeille): ${params.module}`,
      details: `Élément "${params.title}" (${params.entityType}) mis en corbeille. Raison: ${params.deletedReason || 'Non spécifiée'}`,
      category: 'management'
    });

    // 5. Notify user/admins
    if (params.deletedBy) {
      createNotification({
        user_id: params.deletedBy,
        title: 'Élément déplacé dans la Corbeille 🗑️',
        message: `L'élément "${params.title}" (${params.module}) a été déplacé dans la corbeille. Il peut être restauré à tout moment.`,
        type: 'info',
        targetTab: 'trash'
      }).catch(err => console.error("Notification error:", err));
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
          trashId: data.trashId || d.id,
          module: data.module || 'Autre',
          entityType: data.entityType || data.type || 'autre',
          entityId: data.entityId || data.originalId || d.id,
          title: data.title || 'Élément',
          content: data.content || '',
          authorName: data.authorName || data.metadata?.authorName || '',
          authorId: data.authorId || '',
          originalCollection: data.originalCollection || 'stories',
          originalDocumentId: data.originalDocumentId || data.originalId || d.id,
          deletedBy: data.deletedBy || '',
          deletedByName: data.deletedByName || 'Utilisateur',
          deletedAt: data.deletedAt,
          deletedReason: data.deletedReason || '',
          expiresAt: data.expiresAt,
          schoolId: data.schoolId || 'default',
          status: data.status || 'deleted',
          originalData: data.originalData || data.data || {},
          metadata: data.metadata || {}
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
export async function restoreFromTrash(item: TrashItem, restoredByuser?: any): Promise<void> {
  try {
    const docId = item.originalDocumentId || item.entityId || item.id;

    // 1. Prepare restored data without soft delete flags
    const restoredData = { ...(item.originalData || {}) };
    delete restoredData.deleted;
    delete restoredData.deletedAt;
    delete restoredData.deletedBy;
    delete restoredData.deletedReason;
    delete restoredData.trashRefId;

    // Preserve original document ID
    restoredData.id = docId;

    // 2. Put back into original collection
    const originalRef = doc(db, item.originalCollection, docId);
    await setDoc(originalRef, restoredData, { merge: true });

    // 3. Remove soft delete flag explicitly
    await updateDoc(originalRef, {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
      trashRefId: null
    });

    // 4. Sync back to secondary collections if story
    if (item.originalCollection === 'stories') {
      try {
        const postRef = doc(db, 'posts', docId);
        await setDoc(postRef, restoredData, { merge: true });
        await updateDoc(postRef, {
          deleted: false,
          deletedAt: null,
          deletedBy: null
        });
      } catch (e) {
        // Ignore
      }
    }

    // 5. Delete entry from trash collection
    await deleteDoc(doc(db, TRASH_COLLECTION, item.id));

    // 6. Record Audit Log
    await recordAuditLog({
      userId: restoredByuser?.uid || restoredByuser?.email || item.deletedBy || 'admin',
      userName: restoredByuser?.displayName || restoredByuser?.email || 'Administrateur',
      userRole: restoredByuser?.role || 'admin',
      action: `Restauration (Corbeille): ${item.module}`,
      details: `Élément "${item.title}" (${item.entityType}) restauré avec succès dans ${item.originalCollection}.`,
      category: 'management'
    });

    // 7. Notification
    createNotification({
      user_id: restoredByuser?.uid || item.deletedBy,
      title: 'Élément Restauré ↩️',
      message: `L'élément "${item.title}" (${item.module}) a été restauré dans son emplacement d'origine.`,
      type: 'success',
      targetTab: 'trash'
    }).catch(e => console.error("Notification error:", e));

  } catch (error) {
    console.error('Error restoring item from trash:', error);
    handleFirestoreError(error, OperationType.WRITE, item.originalCollection);
    throw error;
  }
}

/**
 * Permanently deletes an item from trash and removes original document permanently
 */
export async function permanentlyDeleteFromTrash(item: TrashItem, currentUser?: any): Promise<void> {
  try {
    const docId = item.originalDocumentId || item.entityId || item.id;

    // 1. Delete original document from primary collection
    try {
      await deleteDoc(doc(db, item.originalCollection, docId));
    } catch (e) {
      console.warn(`Original document ${docId} in ${item.originalCollection} might already be deleted:`, e);
    }

    // 2. Delete legacy synced document if story
    if (item.originalCollection === 'stories') {
      try {
        await deleteDoc(doc(db, 'posts', docId));
      } catch (e) {
        // Ignore
      }
    }

    // 3. Delete trash document
    await deleteDoc(doc(db, TRASH_COLLECTION, item.id));

    // 4. Record Audit Log
    await recordAuditLog({
      userId: currentUser?.uid || 'admin',
      userName: currentUser?.displayName || currentUser?.email || 'Super Administrateur',
      userRole: currentUser?.role || 'admin',
      action: `Suppression définitive: ${item.module}`,
      details: `Élément "${item.title}" (${item.entityType}) et ses données associées ont été définitivement effacés.`,
      category: 'security'
    });

    // 5. Notification
    if (currentUser?.uid) {
      createNotification({
        user_id: currentUser.uid,
        title: 'Suppression Définitive ⚠️',
        message: `L'élément "${item.title}" (${item.module}) a été définitivement supprimé de la base de données.`,
        type: 'warning',
        targetTab: 'trash'
      }).catch(e => console.error(e));
    }

  } catch (error) {
    console.error('Error permanently deleting item:', error);
    handleFirestoreError(error, OperationType.DELETE, TRASH_COLLECTION);
    throw error;
  }
}

/**
 * Bulk restores items from trash
 */
export async function bulkRestoreFromTrash(items: TrashItem[], currentUser?: any): Promise<void> {
  for (const item of items) {
    await restoreFromTrash(item, currentUser);
  }
}

/**
 * Bulk permanently deletes items from trash
 */
export async function bulkPermanentlyDeleteFromTrash(items: TrashItem[], currentUser?: any): Promise<void> {
  for (const item of items) {
    await permanentlyDeleteFromTrash(item, currentUser);
  }
}

/**
 * Auto-purge expired items in trash based on retention duration
 */
export async function checkAndPurgeExpiredTrash(): Promise<number> {
  try {
    const now = new Date();
    const q = query(
      collection(db, TRASH_COLLECTION),
      where('expiresAt', '<=', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    let purgedCount = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const item: TrashItem = {
        id: docSnap.id,
        trashId: docSnap.id,
        module: data.module || 'Autre',
        entityType: data.entityType || 'autre',
        entityId: data.entityId || docSnap.id,
        title: data.title || 'Élément',
        originalCollection: data.originalCollection || 'stories',
        originalDocumentId: data.originalDocumentId || docSnap.id,
        deletedBy: data.deletedBy || '',
        deletedByName: data.deletedByName || 'Système',
        deletedAt: data.deletedAt,
        expiresAt: data.expiresAt,
        schoolId: data.schoolId || 'default',
        status: 'deleted',
        originalData: data.originalData || {}
      };

      try {
        await permanentlyDeleteFromTrash(item, { uid: 'system', displayName: 'Vidage Automatique Système', role: 'admin' });
        purgedCount++;
      } catch (e) {
        console.error("Failed to purge item:", docSnap.id, e);
      }
    }

    if (purgedCount > 0) {
      await recordAuditLog({
        userId: 'system',
        userName: 'Vidage Automatique',
        userRole: 'system',
        action: 'Vidage automatique de la corbeille',
        details: `${purgedCount} élément(s) expirés ont été définitivement purgés de la corbeille.`,
        category: 'management'
      });
    }

    return purgedCount;
  } catch (error) {
    console.error("Error during auto-purge of trash:", error);
    return 0;
  }
}
