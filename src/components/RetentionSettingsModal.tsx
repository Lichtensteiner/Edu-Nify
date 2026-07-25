import React, { useState } from 'react';
import { TrashRetentionSettings } from '../types/trash';
import { X, Clock, Settings, Check, ShieldAlert, Sparkles } from 'lucide-react';

interface RetentionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: TrashRetentionSettings;
  onSave: (settings: TrashRetentionSettings) => Promise<void>;
  notifySuccess?: (msg: string) => void;
  notifyError?: (msg: string) => void;
}

export const RetentionSettingsModal: React.FC<RetentionSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  notifySuccess,
  notifyError
}) => {
  const [days, setDays] = useState<number>(currentSettings.retentionDays || 30);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const options = [
    { value: 30, label: '30 Jours', desc: 'Durée standard recommandee' },
    { value: 60, label: '60 Jours', desc: 'Conservation intermédiaire' },
    { value: 90, label: '90 Jours', desc: 'Un trimestre scolaire complet' },
    { value: 180, label: '180 Jours', desc: 'Six mois de conservation' },
    { value: 365, label: '365 Jours', desc: 'Une année scolaire complète' },
    { value: -1, label: 'Jamais (Infinie)', desc: 'Aucun vidage automatique de la corbeille' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ retentionDays: days });
      if (notifySuccess) notifySuccess('Politique de conservation mise à jour.');
      onClose();
    } catch (e) {
      if (notifyError) notifyError('Erreur lors de la mise à jour des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden space-y-0">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/30">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Vidage Automatique</h3>
              <p className="text-xs text-indigo-200">Paramètre du délai de conservation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Choisissez la durée pendant laquelle les éléments supprimés sont conservés dans la corbeille avant leur purge définitive automatique :
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {options.map((opt) => (
              <label
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  days === opt.value
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-xs'
                    : 'bg-gray-50 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                    {opt.label}
                    {opt.value === 30 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                        Défaut
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  days === opt.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {days === opt.value && <Check size={12} />}
                </div>
              </label>
            ))}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <span>À l'expiration du délai choisi, les éléments sont effacés définitivement et ne pourront plus être restaurés.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
