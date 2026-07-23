import React, { useState } from 'react';
import { 
  Vote, 
  Search, 
  Plus, 
  UserPlus, 
  Trophy, 
  Edit, 
  Trash2, 
  Archive, 
  ShieldCheck,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Election } from '../../types/surveyElection';

interface ElectionsListTabProps {
  elections: Election[];
  onOpenCreate: () => void;
  onOpenVote: (election: Election) => void;
  onOpenResults: (election: Election) => void;
  onManageCandidates: (election: Election) => void;
  onEdit: (election: Election) => void;
  onSoftDelete: (election: Election) => void;
  onArchive: (election: Election) => void;
  currentUser: any;
}

export const ElectionsListTab: React.FC<ElectionsListTabProps> = ({
  elections,
  onOpenCreate,
  onOpenVote,
  onOpenResults,
  onManageCandidates,
  onEdit,
  onSoftDelete,
  onArchive,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'personnel administratif';

  const filteredElections = elections.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    return matchesSearch && matchesType && e.status !== 'archived';
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher une élection..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs font-medium outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold dark:text-white outline-none"
          >
            <option value="all">Tous les scrutins</option>
            <option value="delegue">Délégués de classe</option>
            <option value="bde">Bureau des élèves (BDE)</option>
            <option value="club_president">Présidents de clubs</option>
            <option value="parents">Représentants des parents</option>
            <option value="conseil_scolaire">Conseil scolaire</option>
          </select>

          {isAdmin && (
            <button 
              onClick={onOpenCreate}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0"
            >
              <Plus size={16} /> Organiser une Élection
            </button>
          )}
        </div>
      </div>

      {/* Grid of Elections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredElections.map(election => {
          const hasVoted = election.voterIds?.includes(currentUser?.id || currentUser?.uid || '');

          return (
            <div 
              key={election.id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 px-2.5 py-1 rounded-md capitalize">
                    {election.type.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    election.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {election.status === 'active' ? 'Scrutin Ouvert' : 'Clôturé'}
                  </span>
                </div>

                <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-2">
                  {election.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {election.description || 'Scrutin officiel de l\'établissement.'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="flex items-center gap-1">
                    <Vote size={14} /> {election.totalVotes || 0} vote(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Jusqu'au {election.endDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  {election.status === 'active' && (
                    <button 
                      onClick={() => onOpenVote(election)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        hasVoted 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200'
                          : 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-100'
                      }`}
                    >
                      <Vote size={16} />
                      {hasVoted ? 'Bulletin Déposé' : 'Voter'}
                    </button>
                  )}

                  <button 
                    onClick={() => onOpenResults(election)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    title="Résultats du scrutin"
                  >
                    <Trophy size={16} />
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => onManageCandidates(election)}
                      className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-2xl text-xs font-bold transition-colors"
                      title="Gérer les candidats"
                    >
                      <UserPlus size={16} />
                    </button>
                  )}
                </div>

                {/* Admin extra tools */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button 
                      onClick={() => onEdit(election)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                      title="Modifier"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => onArchive(election)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                      title="Archiver"
                    >
                      <Archive size={14} />
                    </button>
                    <button 
                      onClick={() => onSoftDelete(election)}
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

        {filteredElections.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <Vote size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Aucune élection trouvée
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Organisez un nouveau scrutin pour inviter la communauté scolaire à voter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
