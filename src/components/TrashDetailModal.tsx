import React from 'react';
import { TrashItem } from '../types/trash';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  X,
  Eye,
  RotateCcw,
  Trash2,
  Calendar,
  User,
  Building,
  Tag,
  Clock,
  Paperclip,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Info
} from 'lucide-react';

interface TrashDetailModalProps {
  item: TrashItem | null;
  isOpen: boolean;
  onClose: () => void;
  canPermanentlyDelete: boolean;
  onRestore: (item: TrashItem) => void;
  onPermanentDelete: (item: TrashItem) => void;
}

export const TrashDetailModal: React.FC<TrashDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  canPermanentlyDelete,
  onRestore,
  onPermanentDelete
}) => {
  if (!isOpen || !item) return null;

  const deletedDateObj = item.deletedAt
    ? typeof item.deletedAt.toDate === 'function'
      ? item.deletedAt.toDate()
      : new Date(item.deletedAt)
    : new Date();

  const formattedDeletedAt = format(deletedDateObj, "dd MMMM yyyy 'à' HH:mm", { locale: fr });

  const createdDateObj = item.metadata?.createdAt
    ? typeof item.metadata.createdAt.toDate === 'function'
      ? item.metadata.createdAt.toDate()
      : new Date(item.metadata.createdAt)
    : item.originalData?.createdAt
      ? typeof item.originalData.createdAt.toDate === 'function'
        ? item.originalData.createdAt.toDate()
        : new Date(item.originalData.createdAt)
      : null;

  const formattedCreatedAt = createdDateObj ? format(createdDateObj, "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : 'Inconnue';

  const mediaList = item.metadata?.fileUrls || item.originalData?.media || item.originalData?.attachments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/30">
              <Eye size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500 text-white uppercase tracking-wider">
                  {item.module}
                </span>
                <span className="text-xs font-medium text-slate-300">
                  {item.entityType}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mt-1 line-clamp-1">
                {item.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-800 dark:text-gray-200">
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <User size={13} className="text-indigo-500" /> Supprimé par
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{item.deletedByName}</p>
              <p className="text-[11px] text-gray-400">{item.deletedBy}</p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock size={13} className="text-indigo-500" /> Date de suppression
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{formattedDeletedAt}</p>
              <p className="text-[11px] text-gray-400">Purger après expiration</p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Building size={13} className="text-indigo-500" /> Établissement (School ID)
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{item.schoolId || 'default'}</p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar size={13} className="text-indigo-500" /> Date de création originale
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{formattedCreatedAt}</p>
            </div>
          </div>

          {/* Reason if provided */}
          {item.deletedReason && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
                <Info size={15} /> Motif de suppression indiqué :
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200">{item.deletedReason}</p>
            </div>
          )}

          {/* Content Description */}
          {item.content && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Aperçu du contenu
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/80 rounded-2xl border border-gray-200/80 dark:border-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {item.content}
              </div>
            </div>
          )}

          {/* Attachments / Media preview */}
          {Array.isArray(mediaList) && mediaList.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Paperclip size={14} /> Fichiers Média & Pièces jointes ({mediaList.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaList.map((m: any, idx: number) => {
                  const url = typeof m === 'string' ? m : m.url || m.fileUrl;
                  const name = typeof m === 'string' ? `Fichier ${idx + 1}` : m.name || `Pièce jointe ${idx + 1}`;
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 truncate"
                    >
                      <FileText size={16} className="shrink-0" />
                      <span className="truncate">{name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Original Data Details Expandable */}
          <details className="group border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
            <summary className="p-4 cursor-pointer font-extrabold text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between select-none">
              <span>Inspecter les métadonnées techniques brutes (Original Collection: {item.originalCollection})</span>
              <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-4 pt-0">
              <pre className="p-3 bg-slate-950 text-emerald-400 text-[11px] rounded-xl overflow-x-auto font-mono max-h-48 leading-relaxed">
                {JSON.stringify(item.originalData || {}, null, 2)}
              </pre>
            </div>
          </details>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRestore(item);
                onClose();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={15} /> Restaurer l'élément
            </button>

            {canPermanentlyDelete && (
              <button
                onClick={() => {
                  onPermanentDelete(item);
                  onClose();
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={15} /> Supprimer définitivement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
