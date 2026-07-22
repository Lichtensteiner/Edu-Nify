import React, { useState } from 'react';
import { TrashItem, TrashItemType } from '../types/trash';
import { TrashItemCard } from './TrashItem';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Search, Trash2, Filter, AlertCircle, RefreshCw } from 'lucide-react';

interface TrashListProps {
  items: TrashItem[];
  loading: boolean;
  currentUser: any;
  onRestore: (item: TrashItem) => Promise<boolean>;
  onPermanentDelete: (item: TrashItem) => Promise<boolean>;
  notifySuccess?: (msg: string) => void;
  notifyError?: (msg: string) => void;
}

export const TrashList: React.FC<TrashListProps> = ({
  items,
  loading,
  currentUser,
  onRestore,
  onPermanentDelete,
  notifySuccess,
  notifyError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Permanent Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUser?.role === 'admin' 
    || currentUser?.role === 'Administrateur d\'établissement' 
    || currentUser?.role === 'Super Administrateur'
    || currentUser?.role === 'Directeur';

  const filterCategories = [
    { id: 'all', label: 'Tous' },
    { id: 'story', label: 'Publications' },
    { id: 'document', label: 'Documents' },
    { id: 'message', label: 'Messages' },
    { id: 'event', label: 'Événements' },
    { id: 'user', label: 'Utilisateurs' }
  ];

  // Filtering
  const filteredItems = items.filter((item) => {
    // Type matching
    if (selectedType !== 'all') {
      if (selectedType === 'user' && item.type !== 'student' && item.type !== 'teacher') return false;
      if (selectedType !== 'user' && item.type !== selectedType) return false;
    }

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      const matchDeletedBy = item.deletedByName?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchDeletedBy;
    }

    return true;
  });

  const handleRestoreItem = async (item: TrashItem) => {
    try {
      await onRestore(item);
      if (notifySuccess) notifySuccess(`L'élément "${item.title}" a été restauré.`);
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la restauration.');
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await onPermanentDelete(itemToDelete);
      if (notifySuccess) notifySuccess(`L'élément "${itemToDelete.title}" a été définitivement supprimé.`);
      setItemToDelete(null);
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la suppression définitive.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Category Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la corbeille..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <Trash2 size={15} className="text-indigo-600" />
            <span><strong>{filteredItems.length}</strong> élément(s) masqué(s)</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <Filter size={15} className="text-gray-400 shrink-0 mr-1" />
          {filterCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Chargement de la corbeille...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="py-16 px-4 text-center space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Trash2 size={32} />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
              {searchQuery ? "Aucun résultat trouvé" : "La corbeille est vide"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {searchQuery 
                ? "Essayez de modifier votre terme de recherche ou le filtre sélectionné." 
                : "Les éléments supprimés par les enseignants et administrateurs apparaîtront ici pendant 30 jours avant leur suppression définitive."}
            </p>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredItems.map((item) => (
            <TrashItemCard
              key={item.id}
              item={item}
              canPermanentlyDelete={isAdmin}
              onRestore={handleRestoreItem}
              onPermanentDelete={(it) => setItemToDelete(it)}
            />
          ))}
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmPermanentDelete}
        title="Suppression définitive"
        message={`Attention : Cette action est irréversible. L'élément "${itemToDelete?.title}" et tous ses fichiers médias associés seront définitivement effacés.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isPermanent={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
