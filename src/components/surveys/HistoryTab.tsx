import React, { useEffect, useState } from 'react';
import { 
  History, 
  CheckCircle2, 
  Vote, 
  BarChart3, 
  Calendar, 
  Sparkles 
} from 'lucide-react';
import { Survey, Election } from '../../types/surveyElection';

interface HistoryTabProps {
  surveys: Survey[];
  elections: Election[];
  onOpenSurveyResults: (survey: Survey) => void;
  onOpenElectionResults: (election: Election) => void;
  currentUser: any;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  surveys,
  elections,
  onOpenSurveyResults,
  onOpenElectionResults,
  currentUser
}) => {
  const userId = currentUser?.id || currentUser?.uid || '';

  const myAnsweredSurveys = surveys.filter(s => s.voterIds?.includes(userId));
  const myVotedElections = elections.filter(e => e.voterIds?.includes(userId));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black flex items-center gap-2">
            <History size={24} /> Mon Historique de Participation
          </h2>
          <p className="text-xs text-indigo-100 max-w-xl">
            Retrouvez tous les sondages auxquels vous avez répondu et les élections auxquelles vous avez pris part.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-center min-w-[90px]">
            <span className="text-2xl font-black block">{myAnsweredSurveys.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Sondages</span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-center min-w-[90px]">
            <span className="text-2xl font-black block">{myVotedElections.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Élections</span>
          </div>
        </div>
      </div>

      {/* Answered Surveys Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-600" />
          Sondages auxquels j'ai répondu ({myAnsweredSurveys.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAnsweredSurveys.map(survey => (
            <div 
              key={survey.id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                  {survey.category || 'Sondage'}
                </span>
                <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">
                  {survey.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {survey.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Réponse enregistrée
                </span>
                <button
                  onClick={() => onOpenSurveyResults(survey)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-colors"
                >
                  Résultats
                </button>
              </div>
            </div>
          ))}

          {myAnsweredSurveys.length === 0 && (
            <div className="col-span-full text-center py-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-xs text-gray-400">
              Vous n'avez pas encore répondu à un sondage.
            </div>
          )}
        </div>
      </div>

      {/* Voted Elections Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Vote size={16} className="text-pink-600" />
          Élections auxquelles j'ai voté ({myVotedElections.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myVotedElections.map(election => (
            <div 
              key={election.id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black text-pink-600 bg-pink-50 dark:bg-pink-950 px-2.5 py-1 rounded-md">
                  Scrutin Électoral
                </span>
                <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">
                  {election.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {election.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Vote Secret Effectué
                </span>
                <button
                  onClick={() => onOpenElectionResults(election)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-pink-50 dark:hover:bg-pink-950 text-pink-600 dark:text-pink-400 rounded-xl text-xs font-bold transition-colors"
                >
                  Résultats
                </button>
              </div>
            </div>
          ))}

          {myVotedElections.length === 0 && (
            <div className="col-span-full text-center py-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-xs text-gray-400">
              Vous n'avez participé à aucune élection pour le moment.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
