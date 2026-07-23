import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  Search, 
  CheckCircle2, 
  Clock, 
  User as UserIcon, 
  Trophy, 
  FileText, 
  ShieldCheck, 
  Eye, 
  Sparkles,
  ChevronRight,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Election, Candidate } from '../../types/surveyElection';
import { subscribeToCandidates } from '../../services/surveyElectionService';
import { isUserInTargetAudience } from '../../utils/rbacPermissions';

function hasAssociatedStudents(user: any): boolean {
  if (!user) return false;
  if (user.role !== 'parent') return true;
  if (Array.isArray(user.children_ids) && user.children_ids.length > 0) return true;
  if (Array.isArray(user.children) && user.children.length > 0) return true;
  if (Array.isArray(user.enfants) && user.enfants.length > 0) return true;
  if (Array.isArray(user.studentIds) && user.studentIds.length > 0) return true;
  if (user.childId || user.studentId || user.student_id || user.assignedStudentId) return true;
  if (user.classe || user.student_email || user.email_eleve) return true;
  return false;
}

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

interface StudentElectionViewProps {
  elections: Election[];
  onOpenVote: (election: Election) => void;
  onOpenResults: (election: Election) => void;
  currentUser: any;
}

export const StudentElectionView: React.FC<StudentElectionViewProps> = ({
  elections,
  onOpenVote,
  onOpenResults,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidateProgram, setSelectedCandidateProgram] = useState<Candidate | null>(null);

  // Filter elections targeted to user role (student, parent, staff)
  const studentElections = elections.filter(e => {
    const isTargeted = isUserInTargetAudience(currentUser, e.targetAudience);
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
    return isTargeted && matchesSearch && e.status !== 'archived';
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Rechercher une élection ou un scrutin..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs font-medium outline-none dark:text-white"
        />
      </div>

      {/* List of Elections */}
      <div className="space-y-8">
        {studentElections.map(election => {
          const userId = currentUser?.id || currentUser?.uid || '';
          const hasVoted = election.voterIds?.includes(userId);
          const isClosed = election.status === 'closed';

          return (
            <ElectionCardItem 
              key={election.id}
              election={election}
              hasVoted={hasVoted}
              isClosed={isClosed}
              currentUser={currentUser}
              onOpenVote={() => onOpenVote(election)}
              onOpenResults={() => onOpenResults(election)}
              onViewProgram={(candidate) => setSelectedCandidateProgram(candidate)}
            />
          );
        })}

        {studentElections.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-3">
            <Trophy size={40} className="mx-auto text-pink-400" />
            <h3 className="text-base font-bold text-gray-800 dark:text-white">
              Aucune élection disponible
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Il n'y a pas d'élection en cours pour votre profil ou votre établissement en ce moment.
            </p>
          </div>
        )}
      </div>

      {/* Program Modal */}
      {selectedCandidateProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 max-w-lg w-full rounded-3xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <img 
                src={selectedCandidateProgram.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                alt={selectedCandidateProgram.firstName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
              />
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {selectedCandidateProgram.firstName} {selectedCandidateProgram.lastName}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  {selectedCandidateProgram.candidateClass || 'Candidat(e)'}
                </p>
                {selectedCandidateProgram.slogan && (
                  <p className="text-xs italic text-gray-500 mt-1">
                    "{selectedCandidateProgram.slogan}"
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Programme & Profession de Foi
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {selectedCandidateProgram.program || selectedCandidateProgram.manifesto || "Aucun programme détaillé n'a été fourni par le candidat."}
              </div>
            </div>

            <button
              onClick={() => setSelectedCandidateProgram(null)}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

interface ElectionCardItemProps {
  election: Election;
  hasVoted: boolean;
  isClosed: boolean;
  currentUser: any;
  onOpenVote: () => void;
  onOpenResults: () => void;
  onViewProgram: (candidate: Candidate) => void;
}

const ElectionCardItem: React.FC<ElectionCardItemProps> = ({
  election,
  hasVoted,
  isClosed,
  currentUser,
  onOpenVote,
  onOpenResults,
  onViewProgram
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const unsub = subscribeToCandidates(election.id, (data) => setCandidates(data));
    return () => unsub();
  }, [election.id]);

  const isParent = currentUser?.role === 'parent';
  const parentHasChildren = hasAssociatedStudents(currentUser);
  const totalVotesCount = election.totalVotes || election.voterIds?.length || 0;
  const estimatedTargetCount = election.targetAudience?.estimatedVoters || 40;
  const participationRate = Math.min(100, Math.round((totalVotesCount / Math.max(1, estimatedTargetCount)) * 100));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl border ${
      hasVoted 
        ? 'border-emerald-200 dark:border-emerald-900' 
        : 'border-gray-100 dark:border-gray-700'
    } shadow-sm p-6 space-y-6 relative`}>
      
      {/* Top Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Scrutin Électoral
            </span>
            {hasVoted && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-black text-[10px] rounded-lg flex items-center gap-1">
                <CheckCircle2 size={12} /> ✔ Vote effectué
              </span>
            )}
            {isClosed && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-black text-[10px] rounded-lg">
                Scrutin Clôturé
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            {election.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl">
            {election.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {hasVoted ? (
            <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck size={18} />
              <span>Votre vote a été enregistré avec succès</span>
            </div>
          ) : (
            !isClosed ? (
              isParent && !parentHasChildren ? (
                <button
                  disabled
                  title="Aucun élève associé à votre compte"
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-not-allowed border border-gray-200 dark:border-gray-600 opacity-80"
                >
                  <Vote size={18} /> Voter (Désactivé)
                </button>
              ) : (
                <button
                  onClick={onOpenVote}
                  className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-pink-100 dark:shadow-none hover:scale-105 transition-all"
                >
                  <Vote size={18} /> Participer & Voter
                </button>
              )
            ) : null
          )}

          {(isClosed || hasVoted) && (
            <button
              onClick={onOpenResults}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trophy size={16} /> Résultats
            </button>
          )}
        </div>
      </div>

      {/* Parent Warning Banner if no children attached */}
      {isParent && !parentHasChildren && !hasVoted && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>Vous ne pouvez pas participer à cette élection, car aucun élève n'est actuellement associé à votre compte.</span>
        </div>
      )}

      {/* Real-time Participation Statistics Bar */}
      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                Participation en temps réel
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isClosed 
                  ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
              }`}>
                {isClosed ? '🔒 Clôturé' : '🟢 Ouvert'}
              </span>
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
              {getRemainingTimeText(election.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold">
              Total Suffrages
            </p>
            <p className="text-sm font-black text-gray-900 dark:text-white">
              {totalVotesCount} vote{totalVotesCount > 1 ? 's' : ''}
            </p>
          </div>

          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              <span>Taux</span>
              <span>{participationRate}%</span>
            </div>
            <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${participationRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Cards Grid */}
      <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
          Candidats En Lice ({candidates.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map(candidate => (
            <div 
              key={candidate.id}
              className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between space-y-3 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={candidate.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                  alt={candidate.firstName}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                    {candidate.firstName} {candidate.lastName}
                  </h4>
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {candidate.candidateClass || 'Candidat'}
                  </p>
                  {candidate.slogan && (
                    <p className="text-[10px] italic text-gray-400 truncate mt-0.5">
                      "{candidate.slogan}"
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onViewProgram(candidate)}
                className="w-full py-2 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <FileText size={13} /> Voir le programme
              </button>
            </div>
          ))}

          {candidates.length === 0 && (
            <p className="text-xs text-gray-400 py-4 col-span-full">
              Les candidatures pour cette élection sont en cours de validation.
            </p>
          )}
        </div>
      </div>

    </div>
  );
};
