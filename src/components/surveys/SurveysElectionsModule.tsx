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
  Menu, 
  X,
  FileText
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
import { DashboardTab } from './DashboardTab';
import { SurveysListTab } from './SurveysListTab';
import { SurveyFormModal } from './SurveyFormModal';
import { SurveyAnswerModal } from './SurveyAnswerModal';
import { SurveyResultsView } from './SurveyResultsView';
import { ElectionsListTab } from './ElectionsListTab';
import { ElectionFormModal } from './ElectionFormModal';
import { CandidatesManagerModal } from './CandidatesManagerModal';
import { ElectionVoteModal } from './ElectionVoteModal';
import { ElectionResultsView } from './ElectionResultsView';
import { ArchivesTab } from './ArchivesTab';

type NavTab = 
  | 'dashboard' 
  | 'all_surveys' 
  | 'survey_results' 
  | 'all_elections' 
  | 'election_results' 
  | 'archives';

export const SurveysElectionsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
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

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToSurveys((data) => setSurveys(data));
    const unsub2 = subscribeToElections((data) => setElections(data));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

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
      notifySuccess("Votre réponse a été enregistrée !");
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

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'all_surveys', label: 'Tous les sondages', icon: ListOrdered },
    { id: 'survey_results', label: 'Résultats des sondages', icon: TrendingUp },
    { id: 'all_elections', label: 'Toutes les élections', icon: Vote },
    { id: 'election_results', label: 'Résultats des élections', icon: Trophy },
    { id: 'archives', label: 'Archives', icon: Archive }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <Vote size={26} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Sondages & Élections
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-relaxed text-sm">
            Module professionnel de consultation citoyenne et de vote électronique sécurisé pour l'établissement.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingSurvey(null); setShowSurveyFormModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-[1.02] transition-all"
          >
            <Plus size={16} /> Nouveau Sondage
          </button>
          <button
            onClick={() => { setEditingElection(null); setShowElectionFormModal(true); }}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-pink-100 dark:shadow-none hover:scale-[1.02] transition-all"
          >
            <Plus size={16} /> Nouvelle Élection
          </button>
        </div>
      </div>

      {/* Navigation Sub-Menu Bar */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-max">
          {navItems.map(item => {
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

      {/* Main View Display */}
      <div>
        {activeTab === 'dashboard' && (
          <DashboardTab 
            surveys={surveys}
            elections={elections}
            onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
          />
        )}

        {activeTab === 'all_surveys' && (
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

        {activeTab === 'survey_results' && (
          selectedSurveyResults ? (
            <SurveyResultsView 
              survey={selectedSurveyResults}
              onBack={() => setActiveTab('all_surveys')}
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

        {activeTab === 'all_elections' && (
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

        {activeTab === 'election_results' && (
          selectedElectionResults ? (
            <ElectionResultsView 
              election={selectedElectionResults}
              onBack={() => setActiveTab('all_elections')}
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

        {activeTab === 'archives' && (
          <ArchivesTab 
            surveys={surveys}
            elections={elections}
            onOpenSurveyResults={(survey) => { setSelectedSurveyResults(survey); setActiveTab('survey_results'); }}
            onOpenElectionResults={(election) => { setSelectedElectionResults(election); setActiveTab('election_results'); }}
          />
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
