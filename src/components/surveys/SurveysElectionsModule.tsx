import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Vote, 
  LayoutDashboard, 
  ListOrdered, 
  Plus, 
  TrendingUp, 
  Users, 
  Trophy, 
  Archive, 
  Trash2,
  ShieldAlert,
  History,
  User as UserIcon,
  PieChart as PieIcon,
  Sparkles,
  ChevronRight,
  Settings,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Survey, Election } from '../../types/surveyElection';
import { 
  subscribeToSurveys, 
  subscribeToElections, 
  createSurvey, 
  updateSurvey, 
  softDeleteSurvey, 
  archiveSurvey, 
  duplicateSurvey, 
  submitSurveyResponse, 
  createElection, 
  updateElection, 
  softDeleteElection, 
  archiveElection 
} from '../../services/surveyElectionService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { detectUserRole, hasPermission, getRoleLabel, AppRole } from '../../utils/rbacPermissions';

import { DashboardTab } from './DashboardTab';
import { SurveysListTab } from './SurveysListTab';
import { StudentSurveyView } from './StudentSurveyView';
import { StudentElectionView } from './StudentElectionView';
import { SurveyFormModal } from './SurveyFormModal';
import { SurveyAnswerModal } from './SurveyAnswerModal';
import { SurveyResultsView } from './SurveyResultsView';
import { ElectionsListTab } from './ElectionsListTab';
import { ElectionFormModal } from './ElectionFormModal';
import { CandidatesManagerModal } from './CandidatesManagerModal';
import { ElectionVoteModal } from './ElectionVoteModal';
import { ElectionResultsView } from './ElectionResultsView';
import { ArchivesTab } from './ArchivesTab';
import { HistoryTab } from './HistoryTab';
import { StatsTab } from './StatsTab';

type NavTab = 
  | 'dashboard' 
  | 'all_surveys' 
  | 'my_surveys'
  | 'student_surveys'
  | 'parent_surveys'
  | 'staff_surveys'
  | 'survey_results' 
  | 'all_elections' 
  | 'available_elections'
  | 'student_elections'
  | 'parent_elections'
  | 'staff_elections'
  | 'election_results' 
  | 'candidates_manager'
  | 'stats'
  | 'archives'
  | 'history'
  | 'profile';

export const SurveysElectionsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const appRole = detectUserRole(currentUser);
  const userSchoolId = currentUser?.etablissement || 'all';

  // Determine initial default tab based on role
  const getDefaultTab = (role: AppRole): NavTab => {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'directeur':
        return 'dashboard';
      case 'enseignant':
        return 'my_surveys';
      case 'eleve':
        return 'student_surveys';
      case 'parent':
        return 'parent_surveys';
      default:
        return 'staff_surveys';
    }
  };

  const [activeTab, setActiveTab] = useState<NavTab>(() => getDefaultTab(appRole));
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [elections, setElections] = useState<Election[]>([]);

  // Modals & Active Selections State
  const [showSurveyFormModal, setShowSurveyFormModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  const [showSurveyAnswerModal, setShowSurveyAnswerModal] = useState(false);
  const [answeringSurvey, setAnsweringSurvey] = useState<Survey | null>(null);

  const [selectedSurveyResults, setSelectedSurveyResults] = useState<Survey | null>(null);

  const [showElectionFormModal, setShowElectionFormModal] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [candidatesElection, setCandidatesElection] = useState<Election | null>(null);

  const [showElectionVoteModal, setShowElectionVoteModal] = useState(false);
  const [votingElection, setVotingElection] = useState<Election | null>(null);

  const [selectedElectionResults, setSelectedElectionResults] = useState<Election | null>(null);

  useEffect(() => {
    const unsub1 = subscribeToSurveys((data) => setSurveys(data), userSchoolId);
    const unsub2 = subscribeToElections((data) => setElections(data), userSchoolId);
    return () => {
      unsub1();
      unsub2();
    };
  }, [userSchoolId]);

  // Handle Tab navigation & permissions check
  const allowedNavTabs = React.useMemo(() => {
    switch (appRole) {
      case 'super_admin':
      case 'admin':
        return [
          { id: 'dashboard', label: '📊 Tableau de bord', icon: LayoutDashboard },
          { id: 'all_surveys', label: '📋 Tous les sondages', icon: ListOrdered },
          { id: 'all_elections', label: '🗳️ Toutes les élections', icon: Vote },
          { id: 'stats', label: '📊 Statistiques & Rapports', icon: PieIcon },
          { id: 'archives', label: '📁 Archives', icon: Archive }
        ];
      case 'directeur':
        return [
          { id: 'dashboard', label: '📊 Tableau de bord', icon: LayoutDashboard },
          { id: 'all_surveys', label: '📋 Tous les sondages', icon: ListOrdered },
          { id: 'all_elections', label: '🗳️ Toutes les élections', icon: Vote },
          { id: 'stats', label: '📊 Statistiques & Exports', icon: PieIcon },
          { id: 'archives', label: '📁 Archives', icon: Archive }
        ];
      case 'enseignant':
        return [
          { id: 'my_surveys', label: '📊 Mes sondages', icon: ListOrdered },
          { id: 'available_elections', label: '🗳️ Élections disponibles', icon: Vote },
          { id: 'survey_results', label: '📈 Résultats', icon: TrendingUp },
          { id: 'history', label: '📜 Historique', icon: History }
        ];
      case 'eleve':
        return [
          { id: 'student_surveys', label: '📊 Sondages', icon: BarChart3 },
          { id: 'student_elections', label: '🗳️ Élections', icon: Vote },
          { id: 'history', label: '📜 Historique', icon: History },
          { id: 'profile', label: '👤 Mon profil', icon: UserIcon }
        ];
      case 'parent':
        return [
          { id: 'parent_surveys', label: '📊 Sondages Parents', icon: BarChart3 },
          { id: 'parent_elections', label: '🗳️ Élections Représentants', icon: Vote },
          { id: 'history', label: '📜 Historique', icon: History }
        ];
      default:
        // Staff (Comptable, Bibliothécaire, Infirmier, Surveillant, Secrétaire, Cuisinier)
        return [
          { id: 'staff_surveys', label: '📊 Sondages Personnel', icon: BarChart3 },
          { id: 'staff_elections', label: '🗳️ Élections Personnel', icon: Vote },
          { id: 'history', label: '📜 Historique', icon: History }
        ];
    }
  }, [appRole]);

  const isTabAllowed = allowedNavTabs.some(item => item.id === activeTab) || 
                       activeTab === 'survey_results' || 
                       activeTab === 'election_results';

  // Handlers for Surveys
  const handleCreateOrUpdateSurvey = async (surveyData: any) => {
    try {
      if (editingSurvey) {
        await updateSurvey(editingSurvey.id, surveyData, currentUser);
        notifySuccess("Sondage mis à jour avec succès.");
      } else {
        await createSurvey(surveyData, currentUser);
        notifySuccess("Sondage publié avec succès.");
      }
      setEditingSurvey(null);
      setShowSurveyFormModal(false);
    } catch (err: any) {
      notifyError("Erreur lors de l'enregistrement du sondage.");
    }
  };

  const handleSoftDeleteSurvey = async (survey: Survey) => {
    if (!window.confirm(`Mettre le sondage "${survey.title}" à la corbeille ?`)) return;
    try {
      await softDeleteSurvey(survey, currentUser);
      notifySuccess("Sondage déplacé vers la corbeille.");
    } catch (err) {
      notifyError("Erreur lors de la suppression.");
    }
  };

  const handleArchiveSurvey = async (survey: Survey) => {
    try {
      await archiveSurvey(survey.id, currentUser);
      notifySuccess("Sondage archivé.");
    } catch (err) {
      notifyError("Erreur lors de l'archivage.");
    }
  };

  const handleDuplicateSurvey = async (survey: Survey) => {
    try {
      await duplicateSurvey(survey, currentUser);
      notifySuccess("Sondage dupliqué en copie brouillon.");
    } catch (err) {
      notifyError("Erreur lors de la duplication.");
    }
  };

  const handleSubmitSurveyAnswer = async (survey: Survey, answers: Record<string, any>) => {
    try {
      await submitSurveyResponse(
        survey,
        currentUser?.id || currentUser?.uid || 'guest',
        `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Utilisateur',
        currentUser?.role || 'eleve',
        answers
      );
      notifySuccess("Votre réponse a été enregistrée avec succès !");
    } catch (err: any) {
      notifyError(err.message || "Erreur lors de l'envoi de la réponse.");
      throw err;
    }
  };

  // Handlers for Elections
  const handleCreateOrUpdateElection = async (electionData: any) => {
    try {
      if (editingElection) {
        await updateElection(editingElection.id, electionData, currentUser);
        notifySuccess("Élection mise à jour avec succès.");
      } else {
        await createElection(electionData, currentUser);
        notifySuccess("Élection organisée avec succès.");
      }
      setEditingElection(null);
      setShowElectionFormModal(false);
    } catch (err) {
      notifyError("Erreur lors de l'enregistrement de l'élection.");
    }
  };

  const handleSoftDeleteElection = async (election: Election) => {
    if (!window.confirm(`Mettre l'élection "${election.title}" à la corbeille ?`)) return;
    try {
      await softDeleteElection(election, currentUser);
      notifySuccess("Élection déplacée vers la corbeille.");
    } catch (err) {
      notifyError("Erreur lors de la suppression.");
    }
  };

  const handleArchiveElection = async (election: Election) => {
    try {
      await archiveElection(election.id, currentUser);
      notifySuccess("Élection archivée.");
    } catch (err) {
      notifyError("Erreur lors de l'archivage.");
    }
  };

  // Permission Checks
  const canCreateSurvey = hasPermission(currentUser, 'create_survey') || hasPermission(currentUser, 'create_teacher_survey');
  const canCreateElection = hasPermission(currentUser, 'create_election');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <Vote size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  Sondages & Élections
                </h1>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] rounded-full border border-indigo-100 dark:border-indigo-800">
                  {getRoleLabel(appRole)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                Plateforme de consultation citoyenne et de démocratie scolaire.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons for Authorized Roles Only */}
        <div className="flex items-center gap-3">
          {canCreateSurvey && (
            <button
              onClick={() => { setEditingSurvey(null); setShowSurveyFormModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-[1.02] transition-all"
            >
              <Plus size={16} /> Nouveau Sondage
            </button>
          )}

          {canCreateElection && (
            <button
              onClick={() => { setEditingElection(null); setShowElectionFormModal(true); }}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-pink-100 dark:shadow-none hover:scale-[1.02] transition-all"
            >
              <Plus size={16} /> Nouvelle Élection
            </button>
          )}
        </div>
      </div>

      {/* Role-Based Sub-Navigation Menu */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-max">
          {allowedNavTabs.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as NavTab);
                  if (item.id === 'survey_results' && surveys.length > 0 && !selectedSurveyResults) {
                    setSelectedSurveyResults(surveys[0]);
                  }
                  if (item.id === 'election_results' && elections.length > 0 && !selectedElectionResults) {
                    setSelectedElectionResults(elections[0]);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Router */}
      <div>
        {!isTabAllowed ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-red-100 dark:border-red-900/50 shadow-sm space-y-4 my-6">
            <ShieldAlert size={48} className="mx-auto text-red-500" />
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Accès refusé. Vous ne disposez pas des autorisations nécessaires.
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Cette section est réservée aux rôles administratifs autorisés.
            </p>
            <button
              onClick={() => setActiveTab(getDefaultTab(appRole))}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
            >
              Retourner à mon tableau de bord
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab 
                surveys={surveys}
                elections={elections}
                onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
              />
            )}

            {(activeTab === 'all_surveys' || activeTab === 'my_surveys') && (
              <SurveysListTab 
                surveys={surveys}
                onOpenCreate={() => { setEditingSurvey(null); setShowSurveyFormModal(true); }}
                onOpenAnswer={(survey) => { setAnsweringSurvey(survey); setShowSurveyAnswerModal(true); }}
                onOpenResults={(survey) => { setSelectedSurveyResults(survey); setActiveTab('survey_results'); }}
                onEdit={(survey) => { setEditingSurvey(survey); setShowSurveyFormModal(true); }}
                onSoftDelete={handleSoftDeleteSurvey}
                onArchive={handleArchiveSurvey}
                onDuplicate={handleDuplicateSurvey}
                currentUser={currentUser}
              />
            )}

            {(activeTab === 'student_surveys' || activeTab === 'parent_surveys' || activeTab === 'staff_surveys') && (
              <StudentSurveyView 
                surveys={surveys}
                onOpenAnswer={(survey) => { setAnsweringSurvey(survey); setShowSurveyAnswerModal(true); }}
                onOpenResults={(survey) => { setSelectedSurveyResults(survey); setActiveTab('survey_results'); }}
                currentUser={currentUser}
              />
            )}

            {(activeTab === 'all_elections' || activeTab === 'available_elections') && (
              <ElectionsListTab 
                elections={elections}
                onOpenCreate={() => { setEditingElection(null); setShowElectionFormModal(true); }}
                onOpenVote={(election) => { setVotingElection(election); setShowElectionVoteModal(true); }}
                onOpenResults={(election) => { setSelectedElectionResults(election); setActiveTab('election_results'); }}
                onManageCandidates={(election) => { setCandidatesElection(election); setShowCandidatesModal(true); }}
                onEdit={(election) => { setEditingElection(election); setShowElectionFormModal(true); }}
                onSoftDelete={handleSoftDeleteElection}
                onArchive={handleArchiveElection}
                currentUser={currentUser}
              />
            )}

            {(activeTab === 'student_elections' || activeTab === 'parent_elections' || activeTab === 'staff_elections') && (
              <StudentElectionView 
                elections={elections}
                onOpenVote={(election) => { setVotingElection(election); setShowElectionVoteModal(true); }}
                onOpenResults={(election) => { setSelectedElectionResults(election); setActiveTab('election_results'); }}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'survey_results' && (
              selectedSurveyResults ? (
                <SurveyResultsView 
                  survey={selectedSurveyResults}
                  onBack={() => setActiveTab(getDefaultTab(appRole))}
                />
              ) : (
                <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <BarChart3 size={36} className="mx-auto text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Sélectionnez un sondage</h3>
                  <p className="text-xs text-gray-400">Choisissez un sondage dans la liste pour analyser les réponses.</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {surveys.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setSelectedSurveyResults(s)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold text-xs rounded-xl"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {activeTab === 'election_results' && (
              selectedElectionResults ? (
                <ElectionResultsView 
                  election={selectedElectionResults}
                  onBack={() => setActiveTab(getDefaultTab(appRole))}
                />
              ) : (
                <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <Trophy size={36} className="mx-auto text-pink-600" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Sélectionnez une élection</h3>
                  <p className="text-xs text-gray-400">Choisissez un scrutin pour consulter les résultats et le vainqueur.</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {elections.map(e => (
                      <button 
                        key={e.id}
                        onClick={() => setSelectedElectionResults(e)}
                        className="px-4 py-2 bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400 font-bold text-xs rounded-xl"
                      >
                        {e.title}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {activeTab === 'stats' && (
              <StatsTab 
                surveys={surveys}
                elections={elections}
              />
            )}

            {activeTab === 'archives' && (
              <ArchivesTab 
                surveys={surveys}
                elections={elections}
                onOpenSurveyResults={(survey) => { setSelectedSurveyResults(survey); setActiveTab('survey_results'); }}
                onOpenElectionResults={(election) => { setSelectedElectionResults(election); setActiveTab('election_results'); }}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab 
                surveys={surveys}
                elections={elections}
                onOpenSurveyResults={(survey) => { setSelectedSurveyResults(survey); setActiveTab('survey_results'); }}
                onOpenElectionResults={(election) => { setSelectedElectionResults(election); setActiveTab('election_results'); }}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={currentUser?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                    alt={currentUser?.prenom} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                  />
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                      {currentUser?.prenom} {currentUser?.nom}
                    </h2>
                    <p className="text-xs text-indigo-600 font-bold">
                      Rôle : {getRoleLabel(appRole)} • Classe : {currentUser?.classe || 'Général'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Compte certifié et autorisé pour les votes et sondages de l'établissement.</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals Container */}
      <SurveyFormModal 
        isOpen={showSurveyFormModal}
        onClose={() => setShowSurveyFormModal(false)}
        onSubmit={handleCreateOrUpdateSurvey}
        initialData={editingSurvey}
        currentUser={currentUser}
      />

      <SurveyAnswerModal 
        isOpen={showSurveyAnswerModal}
        survey={answeringSurvey}
        onClose={() => setShowSurveyAnswerModal(false)}
        onSubmit={handleSubmitSurveyAnswer}
        currentUser={currentUser}
      />

      <ElectionFormModal 
        isOpen={showElectionFormModal}
        onClose={() => setShowElectionFormModal(false)}
        onSubmit={handleCreateOrUpdateElection}
        initialData={editingElection}
        currentUser={currentUser}
      />

      <CandidatesManagerModal 
        isOpen={showCandidatesModal}
        election={candidatesElection}
        onClose={() => setShowCandidatesModal(false)}
        currentUser={currentUser}
      />

      <ElectionVoteModal 
        isOpen={showElectionVoteModal}
        election={votingElection}
        onClose={() => setShowElectionVoteModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
