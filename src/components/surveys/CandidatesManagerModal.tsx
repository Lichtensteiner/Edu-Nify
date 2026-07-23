import React, { useEffect, useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  UserPlus, 
  Award, 
  Sparkles, 
  FileText, 
  Palette, 
  Hash,
  Edit2
} from 'lucide-react';
import { Candidate, Election } from '../../types/surveyElection';
import { 
  addCandidate, 
  deleteCandidate, 
  subscribeToCandidates, 
  updateCandidate 
} from '../../services/surveyElectionService';

interface CandidatesManagerModalProps {
  election: Election | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

const COLOR_OPTIONS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'
];

export const CandidatesManagerModal: React.FC<CandidatesManagerModalProps> = ({
  election,
  isOpen,
  onClose,
  currentUser
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [candidateClass, setCandidateClass] = useState('');
  const [slogan, setSlogan] = useState('');
  const [program, setProgram] = useState('');
  const [bio, setBio] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [number, setNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!election) return;
    const unsub = subscribeToCandidates(election.id, (data) => {
      setCandidates(data);
    });
    return () => unsub();
  }, [election]);

  if (!isOpen || !election) return null;

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhotoUrl('');
    setCandidateClass('');
    setSlogan('');
    setProgram('');
    setBio('');
    setColor('#6366f1');
    setNumber(candidates.length + 1);
    setEditingCandidate(null);
    setShowAddForm(false);
  };

  const handleEditClick = (c: Candidate) => {
    setEditingCandidate(c);
    setFirstName(c.firstName);
    setLastName(c.lastName);
    setPhotoUrl(c.photoUrl || '');
    setCandidateClass(c.candidateClass || '');
    setSlogan(c.slogan || '');
    setProgram(c.program || '');
    setBio(c.bio || '');
    setColor(c.color || '#6366f1');
    setNumber(c.number || 1);
    setShowAddForm(true);
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !program) return;

    setLoading(true);
    try {
      if (editingCandidate) {
        await updateCandidate(editingCandidate.id, {
          firstName,
          lastName,
          photoUrl,
          candidateClass,
          slogan,
          program,
          bio,
          color,
          number
        });
      } else {
        await addCandidate({
          electionId: election.id,
          firstName,
          lastName,
          photoUrl: photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}_${lastName}`,
          candidateClass,
          slogan,
          program,
          bio,
          color,
          number
        }, currentUser);
      }
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm("Supprimer ce candidat de la liste des candidats ?")) return;
    await deleteCandidate(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">
                Gestion des Candidats ({candidates.length})
              </h2>
              <p className="text-xs text-pink-100 truncate max-w-md">
                Élection: {election.title}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Liste des professions de foi
            </p>
            {!showAddForm && (
              <button 
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-md"
              >
                <Plus size={16} /> Ajouter un candidat
              </button>
            )}
          </div>

          {/* Add / Edit Form Modal inner */}
          {showAddForm && (
            <form onSubmit={handleSaveCandidate} className="p-6 bg-pink-50/50 dark:bg-pink-950/20 rounded-3xl border border-pink-100 dark:border-pink-900 space-y-4">
              <h3 className="text-sm font-black text-pink-700 dark:text-pink-300">
                {editingCandidate ? 'Modifier le candidat' : 'Fiche nouveau candidat'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Prénom *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Clara"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Nom *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Classe / Rôle</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 3ème B"
                    value={candidateClass}
                    onChange={(e) => setCandidateClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Slogan de campagne</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Une voix pour tous, des actes pour chacun !"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">N° de Candidat</label>
                  <input 
                    type="number" 
                    min="1"
                    value={number}
                    onChange={(e) => setNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Couleur d'identification</label>
                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === c ? 'scale-125 border-pink-600' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Programme / Profession de Foi *</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Détaillez les engagements et propositions..."
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {loading ? 'Enregistrement...' : 'Valider Candidat'}
                </button>
              </div>
            </form>
          )}

          {/* Grid of Candidates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map(c => (
              <div 
                key={c.id}
                className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={c.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.firstName}`}
                      alt={c.firstName} 
                      className="w-14 h-14 rounded-2xl object-cover border-2"
                      style={{ borderColor: c.color || '#6366f1' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }}>
                          N° {c.number || 1}
                        </span>
                        <span className="text-xs text-gray-400 font-bold">{c.candidateClass}</span>
                      </div>
                      <h4 className="text-base font-black text-gray-900 dark:text-white">
                        {c.firstName} {c.lastName}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditClick(c)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCandidate(c.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {c.slogan && (
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 italic">
                    "{c.slogan}"
                  </p>
                )}

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                  {c.program}
                </p>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                  <span>Voix obtenues :</span>
                  <span className="font-black text-gray-900 dark:text-white text-sm">{c.votesCount || 0}</span>
                </div>
              </div>
            ))}

            {candidates.length === 0 && !showAddForm && (
              <div className="md:col-span-2 text-center py-12 text-gray-400 text-xs">
                Aucun candidat enregistré pour cette élection. Cliquez sur "Ajouter un candidat".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
