import React, { useEffect, useState } from 'react';
import { 
  X, 
  Vote, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Candidate, Election } from '../../types/surveyElection';
import { castElectionVote, subscribeToCandidates } from '../../services/surveyElectionService';
import confetti from 'canvas-confetti';

interface ElectionVoteModalProps {
  election: Election | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const ElectionVoteModal: React.FC<ElectionVoteModalProps> = ({
  election,
  isOpen,
  onClose,
  currentUser
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!election) return;
    const unsub = subscribeToCandidates(election.id, (data) => {
      setCandidates(data);
    });
    return () => unsub();
  }, [election]);

  if (!isOpen || !election) return null;

  const isParent = currentUser?.role === 'parent';
  const hasAssociatedStudents = (user: any): boolean => {
    if (!user) return false;
    if (user.role !== 'parent') return true;
    if (Array.isArray(user.children_ids) && user.children_ids.length > 0) return true;
    if (Array.isArray(user.children) && user.children.length > 0) return true;
    if (Array.isArray(user.enfants) && user.enfants.length > 0) return true;
    if (Array.isArray(user.studentIds) && user.studentIds.length > 0) return true;
    if (user.childId || user.studentId || user.student_id || user.assignedStudentId) return true;
    if (user.classe || user.student_email || user.email_eleve) return true;
    return false;
  };

  const parentHasChildren = hasAssociatedStudents(currentUser);
  const hasAlreadyVoted = election.voterIds?.includes(currentUser?.id || currentUser?.uid || '');

  const handleConfirmVote = async () => {
    if (!selectedCandidateId || !currentUser) return;

    setSubmitting(true);
    try {
      await castElectionVote(
        election,
        selectedCandidateId,
        currentUser.id || currentUser.uid,
        currentUser.role || 'eleve',
        currentUser
      );

      setSubmitted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Vote size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black truncate max-w-md">
                {election.title}
              </h2>
              <p className="text-xs text-pink-100 flex items-center gap-1">
                <ShieldCheck size={14} /> Isoloir sécurisé • Vote à bulletin secret
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
        {submitted ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none animate-bounce">
              <CheckCircle2 size={44} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Votre vote a été enregistré avec succès.
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Merci pour votre participation citoyenne à la vie de l'établissement !
            </p>
          </div>
        ) : isParent && !parentHasChildren ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              Participation non autorisée
            </h3>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 p-4 rounded-2xl max-w-md mx-auto border border-red-200 dark:border-red-900 leading-relaxed">
              Vous ne pouvez pas participer à cette élection, car aucun élève n'est actuellement associé à votre compte.
            </p>
            <button 
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : hasAlreadyVoted ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              Vous avez déjà exprimé votre vote
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Afin de garantir l'équité du scrutin, un seul suffrage est autorisé par personne. Vous pouvez consulter les résultats dès la clôture des votes.
            </p>
            <button 
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-bold text-xs rounded-xl"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <div className="p-4 bg-pink-50/60 dark:bg-pink-950/40 rounded-2xl border border-pink-100 dark:border-pink-900 text-xs font-medium text-pink-900 dark:text-pink-200 flex items-center gap-2">
              <Info size={18} className="text-pink-600 shrink-0" />
              <span>
                Sélectionnez le candidat de votre choix en cliquant sur sa carte, puis validez votre bulletin en bas de page.
              </span>
            </div>

            {/* Candidate Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidates.map(candidate => {
                const isSelected = selectedCandidateId === candidate.id;
                const isExpanded = expandedCandidateId === candidate.id;

                return (
                  <div 
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-600 shadow-xl shadow-pink-100 dark:shadow-none scale-[1.02]' 
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-pink-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={candidate.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.firstName}`}
                          alt={candidate.firstName} 
                          className="w-14 h-14 rounded-2xl object-cover border-2"
                          style={{ borderColor: candidate.color || '#6366f1' }}
                        />
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: candidate.color || '#6366f1' }}>
                            N° {candidate.number || 1}
                          </span>
                          <h4 className="text-base font-black text-gray-900 dark:text-white mt-0.5">
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <p className="text-xs text-gray-400 font-medium">{candidate.candidateClass}</p>
                        </div>

                        {isSelected && (
                          <div className="text-pink-600">
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                      </div>

                      {candidate.slogan && (
                        <p className="text-xs font-bold text-pink-600 dark:text-pink-400 italic">
                          "{candidate.slogan}"
                        </p>
                      )}

                      <p className={`text-xs text-gray-600 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {candidate.program}
                      </p>

                      {candidate.program.length > 80 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCandidateId(isExpanded ? null : candidate.id);
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {isExpanded ? 'Réduire le programme' : 'Lire la profession de foi complète'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {candidates.length === 0 && (
                <div className="sm:col-span-2 text-center py-12 text-gray-400 text-xs">
                  Aucun candidat prêt pour cette élection.
                </div>
              )}
            </div>

            {/* Voting Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              >
                Annuler
              </button>

              <button 
                type="button" 
                disabled={!selectedCandidateId || submitting}
                onClick={handleConfirmVote}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-pink-100 disabled:opacity-50"
              >
                <Vote size={16} />
                {submitting ? 'Validation...' : 'Confirmer mon Vote'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
