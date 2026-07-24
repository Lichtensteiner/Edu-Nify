import React, { useState } from 'react';
import { X, Bell, Send, Check } from 'lucide-react';
import { Parent } from '../../types/parent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parents: Parent[];
  preselectedParentId?: string | null;
  onSend: (data: { targetType: 'single' | 'multiple' | 'all'; parentIds: string[]; title: string; message: string }) => Promise<void>;
}

export const ParentNotificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parents,
  preselectedParentId,
  onSend
}) => {
  const [targetType, setTargetType] = useState<'single' | 'multiple' | 'all'>(
    preselectedParentId ? 'single' : 'all'
  );
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>(
    preselectedParentId ? [preselectedParentId] : []
  );
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setError('Veuillez remplir le titre et le message de la notification.');
      return;
    }

    if (targetType === 'single' && selectedParentIds.length === 0) {
      setError('Veuillez choisir un parent destinataire.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSend({
        targetType,
        parentIds: targetType === 'all' ? parents.map(p => p.id) : selectedParentIds,
        title,
        message
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Envoyer une Notification aux Parents</h3>
              <p className="text-xs text-indigo-100">Diffusion d'informations ou d'alertes scolaires</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> Notification envoyée avec succès !
            </div>
          )}

          {/* Target Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cible de la diffusion</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === 'all'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tous ({parents.length})
              </button>

              <button
                type="button"
                onClick={() => setTargetType('single')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === 'single'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Parent Unique
              </button>

              <button
                type="button"
                onClick={() => setTargetType('multiple')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === 'multiple'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Sélection
              </button>
            </div>
          </div>

          {/* Select Parent if single */}
          {targetType === 'single' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sélectionner le Parent</label>
              <select
                value={selectedParentIds[0] || ''}
                onChange={(e) => setSelectedParentIds([e.target.value])}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium"
              >
                <option value="">-- Choisir un parent --</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nom} {p.prenom} ({p.telephone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Titre du Message</label>
            <input
              type="text"
              required
              placeholder="ex: Convocation Réunion Parents d'Élèves"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contenu du Message</label>
            <textarea
              required
              rows={4}
              placeholder="Rédigez le texte complet de la communication..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Envoyer la Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
