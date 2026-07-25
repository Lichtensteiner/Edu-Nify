import React from 'react';
import { useTrash } from '../hooks/useTrash';
import { TrashList } from '../components/TrashList';
import { Trash2, ShieldAlert, Info, Sparkles, ShieldCheck } from 'lucide-react';

interface TrashPageProps {
  currentUser: any;
  notifySuccess?: (msg: string) => void;
  notifyError?: (msg: string) => void;
}

export const Trash: React.FC<TrashPageProps> = ({
  currentUser,
  notifySuccess,
  notifyError
}) => {
  const {
    trashItems,
    loading,
    retentionSettings,
    restore,
    deletePermanently,
    bulkRestore,
    bulkDeletePermanently,
    saveRetentionSettings
  } = useTrash();

  const userRole = currentUser?.role || '';
  const isAllowed = 
    userRole === 'admin' ||
    userRole === 'Administrateur d\'établissement' ||
    userRole === 'Super Administrateur' ||
    userRole === 'Directeur';

  if (!isAllowed) {
    return (
      <div className="p-6 sm:p-10 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Accès restreint à la Corbeille Centralisée</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
          La corbeille intelligente centrale est réservée exclusivement aux Super Administrateurs et Administrateurs d'établissement.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <ShieldCheck size={15} />
              Système Global de Soft Delete & Restauration
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-white">
              <Trash2 className="text-indigo-400" size={32} />
              Corbeille Centrale Intelligent Edu-Nify
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Consultez, restaurez ou supprimez définitivement tout élément issu des élèves, enseignants, classes, devoirs, notes, documents, messages, sondages, factures ou publications.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs space-y-1.5 max-w-xs shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-indigo-200">
              <Info size={15} />
              Politique de conservation
            </div>
            <p className="text-slate-300 leading-normal">
              Les données en corbeille sont restaurables à 100% avec leurs relations. La suppression définitive est irréversible.
            </p>
          </div>
        </div>
      </div>

      {/* Central Trash List Component */}
      <TrashList
        items={trashItems}
        loading={loading}
        currentUser={currentUser}
        retentionSettings={retentionSettings}
        onRestore={(item) => restore(item, currentUser)}
        onPermanentDelete={(item) => deletePermanently(item, currentUser)}
        onBulkRestore={(items) => bulkRestore(items, currentUser)}
        onBulkPermanentDelete={(items) => bulkDeletePermanently(items, currentUser)}
        onSaveRetentionSettings={(settings) => saveRetentionSettings(settings, currentUser)}
        notifySuccess={notifySuccess}
        notifyError={notifyError}
      />
    </div>
  );
};
