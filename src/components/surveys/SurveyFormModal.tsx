import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Image, 
  Settings, 
  Users, 
  Clock, 
  HelpCircle,
  ChevronDown,
  Sparkles,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Question, QuestionType, Survey, TargetAudience, SurveySettings } from '../../types/surveyElection';

interface SurveyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (surveyData: any) => Promise<void>;
  initialData?: Survey | null;
  currentUser: any;
}

const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: 'single', label: 'Choix unique', icon: '🔘' },
  { type: 'multiple', label: 'Choix multiples', icon: '☑️' },
  { type: 'yesno', label: 'Oui / Non', icon: '👍' },
  { type: 'text', label: 'Réponse libre', icon: '💬' },
  { type: 'rating5', label: 'Note sur 5 étoiles', icon: '⭐' },
  { type: 'rating10', label: 'Note sur 10', icon: '🔟' },
  { type: 'dropdown', label: 'Liste déroulante', icon: '🔽' },
  { type: 'ranking', label: 'Classement', icon: '🔢' },
  { type: 'slider', label: 'Curseur de satisfaction', icon: '🎚️' }
];

export const SurveyFormModal: React.FC<SurveyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentUser
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [category, setCategory] = useState(initialData?.category || 'Général');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');

  // Target audience
  const [targetScope, setTargetScope] = useState<TargetAudience['scope']>(initialData?.targetAudience?.scope || 'all');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialData?.targetAudience?.classes || []);

  // Settings
  const [isAnonymous, setIsAnonymous] = useState(initialData?.settings?.isAnonymous ?? true);
  const [allowSingleResponse, setAllowSingleResponse] = useState(initialData?.settings?.allowSingleResponse ?? true);
  const [showResults, setShowResults] = useState<SurveySettings['showResults']>(initialData?.settings?.showResults || 'immediate');
  const [autoNotify, setAutoNotify] = useState(initialData?.settings?.autoNotify ?? true);

  // Questions
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [
    {
      id: 'q_1',
      type: 'single',
      title: '',
      description: '',
      required: true,
      options: [
        { id: 'opt_1', label: 'Option 1' },
        { id: 'opt_2', label: 'Option 2' }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      title: '',
      description: '',
      required: true,
      options: type === 'single' || type === 'multiple' || type === 'dropdown' || type === 'ranking' ? [
        { id: `opt_1`, label: 'Option 1' },
        { id: `opt_2`, label: 'Option 2' }
      ] : undefined
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleUpdateQuestion = (qIndex: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], ...updates };
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const newOpt = {
      id: `opt_${Date.now()}`,
      label: `Option ${(q.options?.length || 0) + 1}`
    };
    handleUpdateQuestion(qIndex, { options: [...(q.options || []), newOpt] });
  };

  const handleRemoveOption = (qIndex: number, optId: string) => {
    const q = questions[qIndex];
    handleUpdateQuestion(qIndex, {
      options: (q.options || []).filter(opt => opt.id !== optId)
    });
  };

  const handleUpdateOptionLabel = (qIndex: number, optId: string, newLabel: string) => {
    const q = questions[qIndex];
    handleUpdateQuestion(qIndex, {
      options: (q.options || []).map(opt => opt.id === optId ? { ...opt, label: newLabel } : opt)
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        coverImage,
        category,
        authorId: currentUser?.id || currentUser?.uid || 'system',
        authorName: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Administrateur',
        authorRole: currentUser?.role || 'admin',
        targetAudience: {
          scope: targetScope,
          classes: selectedClasses
        },
        startDate,
        endDate: endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        questions,
        settings: {
          isAnonymous,
          isNominative: !isAnonymous,
          allowSingleResponse,
          allowEditResponse: false,
          showResults,
          autoNotify
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
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">
                {initialData ? 'Modifier le Sondage' : 'Créer un nouveau Sondage'}
              </h2>
              <p className="text-xs text-indigo-100">
                Configurez le titre, les questions, la cible et la confidentialité
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
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              Informations Générales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Titre du sondage *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Consultation sur les activités périscolaires 2026" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description / Consignes</label>
                <textarea 
                  rows={3}
                  placeholder="Expliquez brièvement l'objectif de ce sondage..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Catégorie</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                >
                  <option value="Général">Général</option>
                  <option value="Vie Scolaire">Vie Scolaire</option>
                  <option value="Cantine & Restauration">Cantine & Restauration</option>
                  <option value="Sorties & Pédagogie">Sorties & Pédagogie</option>
                  <option value="Équipements">Équipements</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">URL Image de couverture (optionnel)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..." 
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Date de début</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Date limite de réponse</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Target Audience & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            {/* Audience */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                Public Cible
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'all', label: 'Toute l\'école' },
                  { id: 'teachers', label: 'Tous les enseignants' },
                  { id: 'parents', label: 'Tous les parents' },
                  { id: 'staff', label: 'Personnel administratif' }
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                    <input 
                      type="radio" 
                      name="targetScope" 
                      value={opt.id}
                      checked={targetScope === opt.id}
                      onChange={() => setTargetScope(opt.id as any)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confidentiality & Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Settings size={16} className="text-indigo-600" />
                Paramètres
              </h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl cursor-pointer">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Vote Anonyme</span>
                  <input 
                    type="checkbox" 
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl cursor-pointer">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Une seule réponse par utilisateur</span>
                  <input 
                    type="checkbox" 
                    checked={allowSingleResponse}
                    onChange={(e) => setAllowSingleResponse(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>

                <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Affichage des résultats</span>
                  <select 
                    value={showResults}
                    onChange={(e) => setShowResults(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 outline-none dark:text-white"
                  >
                    <option value="immediate">Affichage immédiat après vote</option>
                    <option value="after_close">Affichage seulement après clôture</option>
                    <option value="never">Réservé aux administrateurs</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Question Builder Section */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600" />
                  Questions du Sondage ({questions.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ajoutez vos questions et configurez les options de réponse
                </p>
              </div>

              {/* Add Question Menu */}
              <div className="relative group">
                <button 
                  type="button"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all"
                >
                  <Plus size={16} /> Ajouter une question
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hidden group-hover:block z-30 p-2 space-y-1 max-h-60 overflow-y-auto">
                  {QUESTION_TYPES.map(qType => (
                    <button
                      key={qType.type}
                      type="button"
                      onClick={() => handleAddQuestion(qType.type)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl flex items-center gap-2"
                    >
                      <span>{qType.icon}</span>
                      <span>{qType.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List of Questions */}
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div 
                  key={q.id}
                  className="p-5 bg-gray-50 dark:bg-gray-900/80 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4 relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-3 py-1 rounded-full">
                      Question {qIndex + 1}
                    </span>

                    <button 
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Supprimer la question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <input 
                        type="text" 
                        required
                        placeholder="Intitulé de la question..." 
                        value={q.title}
                        onChange={(e) => handleUpdateQuestion(qIndex, { title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <select 
                        value={q.type}
                        onChange={(e) => handleUpdateQuestion(qIndex, { type: e.target.value as QuestionType })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      >
                        {QUESTION_TYPES.map(t => (
                          <option key={t.type} value={t.type}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Options if applicable */}
                  {(q.type === 'single' || q.type === 'multiple' || q.type === 'dropdown' || q.type === 'ranking') && (
                    <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">Options de choix :</label>
                      {q.options?.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-4 font-mono">{optIdx + 1}.</span>
                          <input 
                            type="text" 
                            value={opt.label}
                            onChange={(e) => handleUpdateOptionLabel(qIndex, opt.id, e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {(q.options?.length || 0) > 2 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveOption(qIndex, opt.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus size={14} /> Ajouter une option
                      </button>
                    </div>
                  )}

                  {q.type === 'rating5' && (
                    <div className="flex items-center gap-2 text-amber-400 py-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className="text-xl">★</span>
                      ))}
                      <span className="text-xs text-gray-400 ml-2">(Note de 1 à 5 étoiles)</span>
                    </div>
                  )}

                  {q.type === 'rating10' && (
                    <div className="flex items-center gap-1 py-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <span key={n} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.type === 'yesno' && (
                    <div className="flex items-center gap-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">Oui</span>
                      <span className="px-3 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 rounded-xl">Non</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
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
              disabled={loading || !title || questions.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Lancer le Sondage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
