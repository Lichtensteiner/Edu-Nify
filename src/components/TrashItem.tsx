import React, { useState } from 'react';
import { TrashItem } from '../types/trash';
import { RestoreButton } from './RestoreButton';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  User, 
  DollarSign, 
  Megaphone, 
  BookOpen, 
  Trash2, 
  Clock, 
  Paperclip,
  CheckCircle2
} from 'lucide-react';

interface TrashItemProps {
  item: TrashItem;
  canPermanentlyDelete: boolean;
  onRestore: (item: TrashItem) => Promise<void>;
  onPermanentDelete: (item: TrashItem) => void;
}

export const TrashItemCard: React.FC<TrashItemProps> = ({
  item,
  canPermanentlyDelete,
  onRestore,
  onPermanentDelete
}) => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreClick = async () => {
    setIsRestoring(true);
    try {
      await onRestore(item);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRestoring(false);
    }
  };

  // Determine icon & badge color by type
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'story':
        return {
          label: 'Publication',
          icon: BookOpen,
          bgColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
        };
      case 'document':
        return {
          label: 'Document',
          icon: FileText,
          bgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        };
      case 'message':
        return {
          label: 'Message',
          icon: MessageSquare,
          bgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800'
        };
      case 'event':
        return {
          label: 'Événement',
          icon: Calendar,
          bgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
        };
      case 'student':
      case 'teacher':
        return {
          label: 'Utilisateur',
          icon: User,
          bgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        };
      case 'payment':
        return {
          label: 'Paiement',
          icon: DollarSign,
          bgColor: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border-teal-200 dark:border-teal-800'
        };
      case 'announcement':
        return {
          label: 'Annonce',
          icon: Megaphone,
          bgColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800'
        };
      default:
        return {
          label: 'Élément',
          icon: FileText,
          bgColor: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
        };
    }
  };

  const meta = getTypeMeta(item.type);
  const IconComponent = meta.icon;

  // Formatting dates
  const deletedDateObj = item.deletedAt
    ? typeof item.deletedAt.toDate === 'function'
      ? item.deletedAt.toDate()
      : new Date(item.deletedAt)
    : new Date();

  const formattedDeletedAt = format(deletedDateObj, "d MMMM yyyy 'à' HH:mm", { locale: fr });

  // Expiration calculation (30 days total)
  const expirationDateObj = item.expiresAt
    ? typeof item.expiresAt.toDate === 'function'
      ? item.expiresAt.toDate()
      : new Date(item.expiresAt)
    : new Date(deletedDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);

  const daysRemaining = Math.max(0, differenceInDays(expirationDateObj, new Date()));

  const mediaList = item.data?.media || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* Header: Type Badge & Days remaining */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.bgColor}`}>
            <IconComponent size={14} />
            {meta.label}
          </span>

          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            daysRemaining <= 5 
              ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            <Clock size={12} />
            {daysRemaining === 0 ? "Expire aujourd'hui" : `Expire dans ${daysRemaining} j`}
          </span>
        </div>

        {/* Title & Preview */}
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">
            {item.title}
          </h4>
          {item.content && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
              {item.content}
            </p>
          )}
        </div>

        {/* Attachments indicator if present */}
        {Array.isArray(mediaList) && mediaList.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <Paperclip size={13} />
            <span>{mediaList.length} fichier(s) média associé(s) conservé(s)</span>
          </div>
        )}

        {/* Author & Deletion meta */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          <div>Supprimé par <span className="font-semibold text-gray-700 dark:text-gray-200">{item.deletedByName}</span></div>
          <div>Le {formattedDeletedAt}</div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <RestoreButton
          onRestore={handleRestoreClick}
          isLoading={isRestoring}
          label="Restaurer"
        />

        {canPermanentlyDelete && (
          <button
            onClick={() => onPermanentDelete(item)}
            className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Supprimer définitivement"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Supprimer définitivement</span>
          </button>
        )}
      </div>
    </div>
  );
};
