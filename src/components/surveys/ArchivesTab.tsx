import React, { useState } from 'react';
import { 
  Archive, 
  BarChart3, 
  Vote, 
  Search, 
  Eye, 
  Calendar, 
  FileSpreadsheet, 
  Printer 
} from 'lucide-react';
import { Survey, Election } from '../../types/surveyElection';

interface ArchivesTabProps {
  surveys: Survey[];
  elections: Election[];
  onOpenSurveyResults: (survey: Survey) => void;
  onOpenElectionResults: (election: Election) => void;
}

export const ArchivesTab: React.FC<ArchivesTabProps> = ({
  surveys,
  elections,
  onOpenSurveyResults,
  onOpenElectionResults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'surveys' | 'elections'>('surveys');

  const archivedSurveys = surveys.filter(s => s.status === 'archived' && (
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const archivedElections = elections.filter(e => e.status === 'archived' && (
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('surveys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'surveys'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📊 Sondages Archivés ({archivedSurveys.length})
          </button>
          <button
            onClick={() => setActiveSubTab('elections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'elections'
                ? 'bg-white dark:bg-gray-800 text-pink-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🗳️ Élections Archivées ({archivedElections.length})
          </button>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Search size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher dans les archives..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs font-medium outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Content depending on subtab */}
      {activeSubTab === 'surveys' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedSurveys.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                Archivé
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {s.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{s.votersCount || 0} participants</span>
                <button 
                  onClick={() => onOpenSurveyResults(s)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100"
                >
                  Résultats
                </button>
              </div>
            </div>
          ))}

          {archivedSurveys.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 text-xs">
              Aucun sondage archivé.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedElections.map(e => (
            <div key={e.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                Archivé
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {e.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">{e.description}</p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{e.totalVotes || 0} votes</span>
                <button 
                  onClick={() => onOpenElectionResults(e)}
                  className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-100"
                >
                  Résultats
                </button>
              </div>
            </div>
          ))}

          {archivedElections.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 text-xs">
              Aucune élection archivée.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
