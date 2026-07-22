import { useState, useEffect } from 'react';
import { TrashItem } from '../types/trash';
import { subscribeToTrash, restoreFromTrash, permanentlyDeleteFromTrash } from '../services/trashService';

export function useTrash() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

    return () => unsub();
  }, []);

  const restore = async (item: TrashItem) => {
    try {
      await restoreFromTrash(item);
      return true;
    } catch (err: any) {
      console.error('Error in restore hook:', err);
      throw err;
    }
  };

  const deletePermanently = async (item: TrashItem) => {
    try {
      await permanentlyDeleteFromTrash(item);
      return true;
    } catch (err: any) {
      console.error('Error in deletePermanently hook:', err);
      throw err;
    }
  };

  return {
    trashItems,
    loading,
    error,
    restore,
    deletePermanently
  };
}
