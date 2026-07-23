import React, { useState } from 'react';
import { 
  X, 
  Vote, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Image as ImageIcon 
} from 'lucide-react';
import { Election, ElectionType, TargetAudience } from '../../types/surveyElection';

interface ElectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (electionData: any) => Promise<void>;
  initialData?: Election | null;
  currentUser: any;
}

const ELECTION_TYPES: { type: ElectionType; label: string; icon: string }[] = [
  { type: 'delegue', label: 'Délégué de classe', icon: '🎓' },
  { type: 'bde', label: 'Bureau des élèves (BDE)', icon: '🏛️' },
  { type: 'club_president', label: 'Président du club', icon: '⚽' },
  { type: 'parents', label: 'Représentants des parents', icon: '👨‍👩‍👧' },
  { type: 'conseil_scolaire', label: 'Conseil scolaire', icon: '🏫' },
  { type: 'custom', label: 'Élection personnalisée', icon: '🗳️' }
];

export const ElectionFormModal: React.FC<ElectionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentUser
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<ElectionType>(initialData?.type || 'delegue');
  const [image, setImage] = useState(initialData?.image || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '08:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '18:00');

  const [targetScope, setTargetScope] = useState<TargetAudience['scope']>(initialData?.targetAudience?.scope || 'all');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        type,
        image,
        startDate,
        endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime,
        endTime,
        status: 'active',
        targetAudience: {
          scope: targetScope
        }
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Vote size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">
                {initialData ? 'Modifier l\'Élection' : 'Organiser une Élection'}
              </h2>
              <p className="text-xs text-pink-100">
                Définissez le scrutin, le calendrier et les catégories
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Titre de l'Élection *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Élection des Délégués de Classe 3ème A" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Type de Scrutin</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as ElectionType)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none dark:text-white"
                >
                  {ELECTION_TYPES.map(t => (
                    <option key={t.type} value={t.type}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Public Habilité</label>
                <select 
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none dark:text-white"
                >
                  <option value="all">Toute l'école</option>
                  <option value="classes">Élèves d'une classe</option>
                  <option value="teachers">Enseignants</option>
                  <option value="parents">Parents d'élèves</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description / Modalités du vote</label>
              <textarea 
                rows={3}
                placeholder="Règles du scrutin, conditions de majorité, consignes..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Image d'illustration (optionnel)</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Date Ouverture</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Heure Ouverture</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Date Clôture</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Heure Clôture</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading || !title}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-pink-100 disabled:opacity-50"
            >
              {loading ? 'Création...' : initialData ? 'Mettre à jour' : 'Ouvrir le Scrutin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
