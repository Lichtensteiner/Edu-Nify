import React from 'react';
import { X, History, UserCheck, Trash2, Edit3, PlusCircle, LogIn, FileText } from 'lucide-react';
import { ParentActivity } from '../../types/parent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activities: ParentActivity[];
}

export const ParentActivityLogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activities
}) => {
  if (!isOpen) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Création':
        return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case 'Modification':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case "Association d'un enfant":
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'Suppression':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'Connexion':
        return <LogIn className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Journal des Activités Parents</h3>
              <p className="text-xs text-indigo-100">Traçabilité complète des actions et modifications administratives</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Feed */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {activities.length > 0 ? (
            activities.map(act => (
              <div key={act.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3 hover:bg-gray-100/50 transition-colors">
                <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm mt-0.5">
                  {getActionIcon(act.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{act.action}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(act.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{act.details}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                    <span>Auteur: <strong className="text-gray-700">{act.performedBy}</strong></span>
                    {act.parentName && <span>• Parent: <strong className="text-gray-700">{act.parentName}</strong></span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-gray-400">
              Aucun journal d'activité enregistré pour le moment.
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
