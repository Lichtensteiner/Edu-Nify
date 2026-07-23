import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Play, 
  CheckCircle2, 
  Clock, 
  User as UserIcon, 
  Calendar,
  AlertCircle,
  Edit3,
  Lock,
  Sparkles
} from 'lucide-react';
import { Survey } from '../../types/surveyElection';
import { isUserInTargetAudience } from '../../utils/rbacPermissions';

interface StudentSurveyViewProps {
  surveys: Survey[];
  onOpenAnswer: (survey: Survey) => void;
  onOpenResults: (survey: Survey) => void;
  currentUser: any;
}

export const StudentSurveyView: React.FC<StudentSurveyViewProps> = ({
  surveys,
  onOpenAnswer,
  onOpenResults,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'pending' | 'voted'>('all');

  // Filter surveys strictly for student's class/school
  const studentSurveys = surveys.filter(s => {
    const isTargeted = isUserInTargetAudience(currentUser, s.targetAudience);
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return isTargeted && matchesSearch && s.status !== 'archived';
  });

  const getRemainingTimeText = (endDateStr?: string) => {
    if (!endDateStr) return 'Pas de date limite';
    const now = new Date().getTime();
    const end = new Date(endDateStr).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Clôturé';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Reste ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Ferme dans ${hours}h`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `Ferme dans ${minutes} min`;
  };

  const finalSurveys = studentSurveys.filter(s => {
    const hasVoted = s.voterIds?.includes(currentUser?.id || currentUser?.uid || '');
    if (filterState === 'pending') return !hasVoted && s.status === 'active';
    if (filterState === 'voted') return hasVoted;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Rechercher mes sondages..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs font-medium outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterState('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              filterState === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Tous ({studentSurveys.length})
          </button>
          <button
            onClick={() => setFilterState('pending')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              filterState === 'pending'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            A répondre
          </button>
          <button
            onClick={() => setFilterState('voted')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              filterState === 'voted'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Déjà répondu
          </button>
        </div>
      </div>

      {/* Grid of Student Surveys */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finalSurveys.map(survey => {
          const userId = currentUser?.id || currentUser?.uid || '';
          const hasVoted = survey.voterIds?.includes(userId);
          const isClosed = survey.status === 'closed';
          const remainingText = getRemainingTimeText(survey.endDate);
          const canEdit = survey.settings?.allowEditResponse && hasVoted && !isClosed;
          
          // Result visibility rule
          const canViewResults = 
            survey.settings?.showResults === 'immediate' || 
            (survey.settings?.showResults === 'after_close' && isClosed);

          return (
            <div 
              key={survey.id}
              className={`bg-white dark:bg-gray-800 rounded-3xl border ${
                hasVoted 
                  ? 'border-emerald-200 dark:border-emerald-900/60' 
                  : 'border-gray-100 dark:border-gray-700'
              } shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 relative`}
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                    {survey.category || 'Sondage'}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                      isClosed
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      <Clock size={12} />
                      {remainingText}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-2">
                  {survey.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                  {survey.description || 'Veuillez prendre un court instant pour répondre à cette consultation.'}
                </p>

                {/* Author Info */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 font-medium">
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <UserIcon size={12} /> {survey.authorName || 'Établissement'}
                  </span>
                  <span>{survey.questions?.length || 1} question(s)</span>
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                {hasVoted ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span>Votre réponse a été enregistrée.</span>
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => onOpenAnswer(survey)}
                        className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit3 size={14} /> Modifier ma réponse
                      </button>
                    )}
                  </div>
                ) : (
                  !isClosed ? (
                    <button 
                      onClick={() => onOpenAnswer(survey)}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-[1.01] transition-all"
                    >
                      <Play size={16} /> Participer au sondage
                    </button>
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl text-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      Ce sondage est clôturé.
                    </div>
                  )
                )}

                {/* View Results if public */}
                {canViewResults && (
                  <button
                    onClick={() => onOpenResults(survey)}
                    className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <BarChart3 size={14} /> Consulter les résultats
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {finalSurveys.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-3">
            <Sparkles size={40} className="mx-auto text-indigo-400" />
            <h3 className="text-base font-bold text-gray-800 dark:text-white">
              Aucun sondage disponible
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Vous avez répondu à tous les sondages en cours ou aucun sondage ne concerne votre classe pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
