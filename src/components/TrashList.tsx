import React, { useState } from 'react';
import { TrashItem, TrashRetentionSettings } from '../types/trash';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TrashDetailModal } from './TrashDetailModal';
import { RetentionSettingsModal } from './RetentionSettingsModal';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  Trash2,
  Filter,
  RefreshCw,
  Eye,
  RotateCcw,
  CheckSquare,
  Square,
  Clock,
  Building,
  User,
  GraduationCap,
  Users,
  UserCheck,
  Building2,
  School,
  BookOpen,
  Calendar,
  Award,
  ClipboardList,
  ShieldCheck,
  MessageCircle,
  Vote,
  FileText,
  Book,
  Mail,
  CreditCard,
  Settings,
  Box,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface TrashListProps {
  items: TrashItem[];
  loading: boolean;
  currentUser: any;
  retentionSettings: TrashRetentionSettings;
  onRestore: (item: TrashItem) => Promise<boolean>;
  onPermanentDelete: (item: TrashItem) => Promise<boolean>;
  onBulkRestore: (items: TrashItem[]) => Promise<boolean>;
  onBulkPermanentDelete: (items: TrashItem[]) => Promise<boolean>;
  onSaveRetentionSettings: (settings: TrashRetentionSettings) => Promise<boolean>;
  notifySuccess?: (msg: string) => void;
  notifyError?: (msg: string) => void;
}

export const TrashList: React.FC<TrashListProps> = ({
  items,
  loading,
  currentUser,
  retentionSettings,
  onRestore,
  onPermanentDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onSaveRetentionSettings,
  notifySuccess,
  notifyError
}) => {
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [detailItem, setDetailItem] = useState<TrashItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin' 
    || currentUser?.role === 'Administrateur d\'établissement' 
    || currentUser?.role === 'Super Administrateur'
    || currentUser?.role === 'Directeur';

  // Get list of unique schools & users for filter dropdowns
  const uniqueSchools = Array.from(new Set(items.map(i => i.schoolId || 'default'))).filter(Boolean);
  const uniqueUsers = Array.from(new Set(items.map(i => i.deletedByName).filter(Boolean)));

  // Module Categories
  const moduleCategories = [
    { id: 'all', label: 'Tous les modules' },
    { id: 'Élèves', label: 'Élèves' },
    { id: 'Parents', label: 'Parents' },
    { id: 'Enseignants', label: 'Enseignants' },
    { id: 'Classes', label: 'Classes' },
    { id: 'Notes', label: 'Notes & Bulletins' },
    { id: 'Devoirs', label: 'Devoirs' },
    { id: 'Présences', label: 'Présences' },
    { id: 'Documents', label: 'Documents' },
    { id: 'Histoire & Fil', label: 'Publications' },
    { id: 'Messages', label: 'Messages' },
    { id: 'Sondages', label: 'Sondages & Élections' },
    { id: 'Paiements & Factures', label: 'Paiements & Factures' },
  ];

  // Helper function to return Module Icon
  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case 'Élèves': return GraduationCap;
      case 'Parents': return Users;
      case 'Enseignants': return UserCheck;
      case 'Personnel': return Building2;
      case 'Classes': return School;
      case 'Matières': return BookOpen;
      case 'Emplois du temps': return Calendar;
      case 'Notes':
      case 'Bulletins': return Award;
      case 'Devoirs': return ClipboardList;
      case 'Présences': return CheckSquare;
      case 'Contrôle d\'accès': return ShieldCheck;
      case 'Histoire & Fil':
      case 'Publications': return MessageCircle;
      case 'Sondages':
      case 'Élections': return Vote;
      case 'Documents': return FileText;
      case 'Bibliothèque': return Book;
      case 'Messages': return Mail;
      case 'Paiements & Factures': return CreditCard;
      case 'Paramètres': return Settings;
      default: return Box;
    }
  };

  // Filtering logic
  const filteredItems = items.filter((item) => {
    // Module filter
    if (selectedModule !== 'all') {
      if (item.module !== selectedModule) return false;
    }

    // School filter
    if (selectedSchool !== 'all') {
      if ((item.schoolId || 'default') !== selectedSchool) return false;
    }

    // User filter
    if (selectedUser !== 'all') {
      if (item.deletedByName !== selectedUser) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      const matchDeletedBy = item.deletedByName?.toLowerCase().includes(q);
      const matchAuthor = item.authorName?.toLowerCase().includes(q);
      const matchModule = item.module?.toLowerCase().includes(q);
      const matchEntity = item.entityType?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchDeletedBy || matchAuthor || matchModule || matchEntity;
    }

    return true;
  });

  // Checkbox selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Single Item Handlers
  const handleRestoreItem = async (item: TrashItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsActionLoading(true);
    try {
      await onRestore(item);
      if (notifySuccess) notifySuccess(`"${item.title}" a été restauré avec succès.`);
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la restauration.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    setIsActionLoading(true);
    try {
      await onPermanentDelete(itemToDelete);
      if (notifySuccess) notifySuccess(`"${itemToDelete.title}" a été supprimé définitivement.`);
      setItemToDelete(null);
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la suppression définitive.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk Action Handlers
  const handleBulkRestore = async () => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) return;

    setIsActionLoading(true);
    try {
      await onBulkRestore(selectedItems);
      if (notifySuccess) notifySuccess(`${selectedItems.length} élément(s) restauré(s) avec succès.`);
      setSelectedIds([]);
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la restauration en masse.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkPermanentDeleteConfirm = async () => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) return;

    setIsBulkDeleting(true);
    try {
      await onBulkPermanentDelete(selectedItems);
      if (notifySuccess) notifySuccess(`${selectedItems.length} élément(s) supprimé(s) définitivement.`);
      setSelectedIds([]);
      setIsBulkConfirmOpen(false);
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la suppression en masse.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Filters, View Switcher & Settings */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-4">
        {/* Top Controls: Search Input & View Switchers */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche instantanée (titre, module, auteur, utilisateur...)"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {/* View Mode Switcher */}
            <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Vue Tableau"
              >
                <List size={16} />
                <span className="hidden sm:inline">Tableau</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Vue Grille"
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Grille</span>
              </button>
            </div>

            {/* Retention Setting Modal Trigger Button */}
            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 font-extrabold text-xs rounded-2xl border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Clock size={15} />
                <span className="hidden sm:inline">Purge:</span>
                <span>{retentionSettings.retentionDays === -1 ? 'Jamais' : `${retentionSettings.retentionDays}j`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Dropdowns & Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          {/* Module Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <Filter size={15} className="text-gray-400 shrink-0" />
            {moduleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedModule(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedModule === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* School filter if multiple exist */}
          {uniqueSchools.length > 1 && (
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="py-1.5 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none"
            >
              <option value="all">Toutes les écoles</option>
              {uniqueSchools.map(sch => (
                <option key={sch} value={sch}>Établissement: {sch}</option>
              ))}
            </select>
          )}

          {/* User filter if multiple exist */}
          {uniqueUsers.length > 1 && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="py-1.5 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none"
            >
              <option value="all">Tous les utilisateurs</option>
              {uniqueUsers.map(usr => (
                <option key={usr} value={usr}>Supprimé par: {usr}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-3 animate-fadeIn border border-indigo-700">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/40 text-indigo-200 font-black text-xs border border-indigo-400/30">
              {selectedIds.length} sélectionné(s)
            </span>
            <p className="text-xs text-indigo-100 font-medium hidden sm:inline">
              Sélection multiple active pour la corbeille.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRestore}
              disabled={isActionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} /> Restaurer la sélection
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsBulkConfirmOpen(true)}
                disabled={isActionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} /> Supprimer définitivement
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="p-2 text-indigo-300 hover:text-white text-xs font-bold ml-1"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
          <RefreshCw size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Chargement de la corbeille centrale...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="py-20 px-4 text-center space-y-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Trash2 size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
              {searchQuery ? "Aucun élément correspondant" : "La corbeille centrale est vide"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {searchQuery
                ? "Modifiez votre recherche ou réinitialisez les filtres pour voir plus d'éléments."
                : "Toutes les suppressions effectuées dans Edu-Nify basculent automatiquement ici avant restauration ou purge définitive."}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Display: Table or Grid */}
      {!loading && filteredItems.length > 0 && (
        <>
          {viewMode === 'table' ? (
            /* Table View */
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 w-10 text-center">
                        <button
                          onClick={handleSelectAll}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          {selectedIds.length > 0 && selectedIds.length === filteredItems.length ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="p-4">Module & Type</th>
                      <th className="p-4">Nom / Titre</th>
                      <th className="p-4">Auteur / Créateur</th>
                      <th className="p-4">Date de suppression</th>
                      <th className="p-4">Supprimé par</th>
                      <th className="p-4">Établissement</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 font-medium text-gray-800 dark:text-gray-200">
                    {filteredItems.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const IconComp = getModuleIcon(item.module);

                      const deletedDateObj = item.deletedAt
                        ? typeof item.deletedAt.toDate === 'function'
                          ? item.deletedAt.toDate()
                          : new Date(item.deletedAt)
                        : new Date();

                      const formattedDate = format(deletedDateObj, "dd/MM/yyyy HH:mm", { locale: fr });

                      const expiresDateObj = item.expiresAt
                        ? typeof item.expiresAt.toDate === 'function'
                          ? item.expiresAt.toDate()
                          : new Date(item.expiresAt)
                        : null;

                      const daysLeft = expiresDateObj ? Math.max(0, differenceInDays(expiresDateObj, new Date())) : null;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors ${
                            isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                          }`}
                        >
                          <td className="p-4 text-center">
                            <button
                              onClick={(e) => handleToggleSelect(item.id, e)}
                              className="text-gray-400 hover:text-indigo-600"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-indigo-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                <IconComp size={15} />
                              </div>
                              <div>
                                <span className="font-extrabold text-xs text-gray-900 dark:text-white block">
                                  {item.module}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                                  {item.entityType}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 max-w-xs">
                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1">
                              {item.title}
                            </div>
                            {item.content && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                {item.content}
                              </div>
                            )}
                          </td>

                          <td className="p-4 whitespace-nowrap text-gray-600 dark:text-gray-300 font-semibold">
                            {item.authorName || item.metadata?.authorName || 'Non renseigné'}
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white">{formattedDate}</div>
                            {daysLeft !== null && (
                              <div className={`text-[10px] font-extrabold ${daysLeft <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                                Expire dans {daysLeft}j
                              </div>
                            )}
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">
                              {item.deletedByName}
                            </span>
                          </td>

                          <td className="p-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {item.schoolId || 'default'}
                          </td>

                          <td className="p-4 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              En corbeille
                            </span>
                          </td>

                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View / Voir */}
                              <button
                                onClick={() => setDetailItem(item)}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Voir les détails"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Restore */}
                              <button
                                onClick={(e) => handleRestoreItem(item, e)}
                                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                                title="Restaurer l'élément"
                              >
                                <RotateCcw size={15} />
                              </button>

                              {/* Delete Permanently */}
                              {isAdmin && (
                                <button
                                  onClick={() => setItemToDelete(item)}
                                  className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const IconComp = getModuleIcon(item.module);

                const deletedDateObj = item.deletedAt
                  ? typeof item.deletedAt.toDate === 'function'
                    ? item.deletedAt.toDate()
                    : new Date(item.deletedAt)
                  : new Date();

                const formattedDate = format(deletedDateObj, "dd MMMM yyyy 'à' HH:mm", { locale: fr });

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                        : 'border-gray-200/80 dark:border-gray-700/80'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Icon, Module, Selection Checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <IconComp size={16} />
                          </div>
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            {item.module}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleToggleSelect(item.id, e)}
                          className="text-gray-400 hover:text-indigo-600 p-1"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-indigo-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </div>

                      {/* Title & Excerpt */}
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-base line-clamp-1">
                          {item.title}
                        </h4>
                        {item.content && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                        )}
                      </div>

                      {/* Deletion Meta */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
                        <div>Supprimé par : <strong className="text-gray-800 dark:text-gray-200">{item.deletedByName}</strong></div>
                        <div>Le {formattedDate}</div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setDetailItem(item)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Eye size={14} /> Voir
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleRestoreItem(item, e)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={14} /> Restaurer
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl transition-colors"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Item Detail Modal (👁 Voir) */}
      <TrashDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        canPermanentlyDelete={isAdmin}
        onRestore={(item) => handleRestoreItem(item)}
        onPermanentDelete={(item) => setItemToDelete(item)}
      />

      {/* Permanent Delete Modal for Single Item */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmPermanentDelete}
        title="Suppression définitive de la base de données"
        message={`Attention : Cette action est irréversible. L'élément "${itemToDelete?.title}" (${itemToDelete?.module}) et toutes ses données ou fichiers associés seront définitivement effacés.`}
        confirmText="Oui, Supprimer Définitivement"
        cancelText="Annuler"
        isPermanent={true}
        isLoading={isActionLoading}
      />

      {/* Bulk Permanent Delete Modal */}
      <DeleteConfirmModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkPermanentDeleteConfirm}
        title="Suppression définitive en masse"
        message={`Attention : Cette action est irréversible. Vous allez supprimer définitivement ${selectedIds.length} élément(s) de la corbeille centrale. Êtes-vous certain ?`}
        confirmText={`Supprimer Définitivement (${selectedIds.length})`}
        cancelText="Annuler"
        isPermanent={true}
        isLoading={isBulkDeleting}
      />

      {/* Retention Settings Modal */}
      <RetentionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={retentionSettings}
        onSave={onSaveRetentionSettings}
        notifySuccess={notifySuccess}
        notifyError={notifyError}
      />
    </div>
  );
};
