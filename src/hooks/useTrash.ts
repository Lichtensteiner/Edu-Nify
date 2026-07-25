import { useState, useEffect, useCallback } from 'react';
import { TrashItem, TrashRetentionSettings } from '../types/trash';
import {
  subscribeToTrash,
  restoreFromTrash,
  permanentlyDeleteFromTrash,
  bulkRestoreFromTrash,
  bulkPermanentlyDeleteFromTrash,
  getRetentionSettings,
  updateRetentionSettings,
  checkAndPurgeExpiredTrash
} from '../services/trashService';

export function useTrash() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retentionSettings, setRetentionSettings] = useState<TrashRetentionSettings>({ retentionDays: 30 });

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToTrash(
      (items) => {
        setTrashItems(items);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Erreur lors du chargement de la corbeille');
        setLoading(false);
      }
    );

    // Fetch retention settings
    getRetentionSettings()
      .then(setRetentionSettings)
      .catch(console.warn);

    // Run background expired check
    checkAndPurgeExpiredTrash()
      .then(count => {
        if (count > 0) {
          console.log(`[useTrash] Auto-purged ${count} expired trash items.`);
        }
      })
      .catch(console.warn);

    return () => unsub();
  }, []);

  const restore = useCallback(async (item: TrashItem, currentUser?: any) => {
    try {
      await restoreFromTrash(item, currentUser);
      return true;
    } catch (err: any) {
      console.error('Error in restore hook:', err);
      throw err;
    }
  }, []);

  const deletePermanently = useCallback(async (item: TrashItem, currentUser?: any) => {
    try {
      await permanentlyDeleteFromTrash(item, currentUser);
      return true;
    } catch (err: any) {
      console.error('Error in deletePermanently hook:', err);
      throw err;
    }
  }, []);

  const bulkRestore = useCallback(async (items: TrashItem[], currentUser?: any) => {
    try {
      await bulkRestoreFromTrash(items, currentUser);
      return true;
    } catch (err: any) {
      console.error('Error in bulkRestore hook:', err);
      throw err;
    }
  }, []);

  const bulkDeletePermanently = useCallback(async (items: TrashItem[], currentUser?: any) => {
    try {
      await bulkPermanentlyDeleteFromTrash(items, currentUser);
      return true;
    } catch (err: any) {
      console.error('Error in bulkDeletePermanently hook:', err);
      throw err;
    }
  }, []);

  const saveRetentionSettings = useCallback(async (settings: TrashRetentionSettings, currentUser?: any) => {
    try {
      await updateRetentionSettings(settings, currentUser);
      setRetentionSettings(settings);
      return true;
    } catch (err: any) {
      console.error('Error saving retention settings:', err);
      throw err;
    }
  }, []);

  return {
    trashItems,
    loading,
    error,
    retentionSettings,
    restore,
    deletePermanently,
    bulkRestore,
    bulkDeletePermanently,
    saveRetentionSettings
  };
}
