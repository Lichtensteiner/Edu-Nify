import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Archive, 
  Copy, 
  Share2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Users,
  Play
} from 'lucide-react';
import { Survey } from '../../types/surveyElection';

interface SurveysListTabProps {
  surveys: Survey[];
  onOpenCreate: () => void;
  onOpenAnswer: (survey: Survey) => void;
  onOpenResults: (survey: Survey) => void;
  onEdit: (survey: Survey) => void;
  onSoftDelete: (survey: Survey) => void;
  onArchive: (survey: Survey) => void;
  onDuplicate: (survey: Survey) => void;
  currentUser: any;
}

export const SurveysListTab: React.FC<SurveysListTabProps> = ({
  surveys,
  onOpenCreate,
  onOpenAnswer,
  onOpenResults,
  onEdit,
  onSoftDelete,
  onArchive,
  onDuplicate,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'personnel administratif' || currentUser?.role === 'enseignant';

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? s.status !== 'archived' : s.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleShare = (survey: Survey) => {
    navigator.clipboard.writeText(window.location.href);
    alert(`Lien du sondage "${survey.title}" copié dans le presse-papier !`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un sondage..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs font-medium outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold dark:text-white outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs seulement</option>
            <option value="closed">Clôturés seulement</option>
          </select>

          {isAdmin && (
            <button 
              onClick={onOpenCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0"
            >
              <Plus size={16} /> Nouveau Sondage
            </button>
          )}
        </div>
      </div>

      {/* Grid of Surveys */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSurveys.map(survey => {
          const hasVoted = survey.voterIds?.includes(currentUser?.id || currentUser?.uid || '');
          const isClosed = survey.status === 'closed';

          return (
            <div 
              key={survey.id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                    {survey.category || 'Général'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    isClosed
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                  }`}>
                    {isClosed ? 'Clôturé' : 'En cours'}
                  </span>
                </div>

                <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-2">
                  {survey.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {survey.description || 'Aucune description fournie.'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {survey.votersCount || 0} réponse(s)
                  </span>
                  <span>{survey.questions?.length || 0} question(s)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  {!isClosed && (
                    <button 
                      onClick={() => onOpenAnswer(survey)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        hasVoted 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100'
                      }`}
                    >
                      {hasVoted ? <CheckCircle2 size={16} /> : <Play size={16} />}
                      {hasVoted ? 'Déjà Répondu' : 'Participer'}
                    </button>
                  )}

                  <button 
                    onClick={() => onOpenResults(survey)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    title="Voir les résultats"
                  >
                    <BarChart3 size={16} />
                  </button>

                  <button 
                    onClick={() => handleShare(survey)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl text-xs font-bold transition-colors"
                    title="Partager le lien"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                {/* Admin Extra Tools */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button 
                      onClick={() => onDuplicate(survey)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                      title="Dupliquer"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={() => onEdit(survey)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                      title="Modifier"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => onArchive(survey)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                      title="Archiver"
                    >
                      <Archive size={14} />
                    </button>
                    <button 
                      onClick={() => onSoftDelete(survey)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Mettre à la corbeille"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredSurveys.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Aucun sondage ne correspond aux critères
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Modifiez vos filtres ou lancez une nouvelle consultation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
