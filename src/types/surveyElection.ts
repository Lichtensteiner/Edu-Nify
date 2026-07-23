export type QuestionType = 
  | 'single'      // Choix unique
  | 'multiple'    // Choix multiples
  | 'yesno'       // Oui / Non
  | 'text'        // Réponse libre
  | 'rating5'     // Note sur 5 étoiles
  | 'rating10'    // Note sur 10
  | 'dropdown'    // Liste déroulante
  | 'ranking'     // Classement
  | 'slider';     // Curseur de satisfaction

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  required?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

export interface TargetAudience {
  scope: 'all' | 'classes' | 'teachers' | 'parents' | 'staff' | 'custom';
  classes?: string[];
  roles?: string[];
  userIds?: string[];
}

export interface SurveySettings {
  isAnonymous: boolean;
  isNominative: boolean;
  allowSingleResponse: boolean;
  allowEditResponse: boolean;
  showResults: 'immediate' | 'after_close' | 'never';
  autoNotify: boolean;
  deadlineDate?: string;
  deadlineTime?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  category: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetAudience: TargetAudience;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  questions: Question[];
  settings: SurveySettings;
  votersCount: number;
  voterIds: string[];
  createdAt: any;
  updatedAt?: any;
  softDeleted?: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  answers: Record<string, any>; // questionId -> value
  votedAt: any;
  isAnonymous: boolean;
}

export type ElectionType = 
  | 'delegue'          // Délégué de classe
  | 'bde'              // Bureau des élèves
  | 'club_president'   // Président du club
  | 'parents'          // Représentants des parents
  | 'conseil_scolaire' // Conseil scolaire
  | 'custom';          // Élection personnalisée

export interface Election {
  id: string;
  title: string;
  description: string;
  type: ElectionType;
  image?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  targetAudience: TargetAudience;
  totalVotes: number;
  voterIds: string[];
  createdAt: any;
  updatedAt?: any;
  softDeleted?: boolean;
  winnerCandidateId?: string;
}

export interface Candidate {
  id: string;
  electionId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  candidateClass?: string;
  program: string;
  bio?: string;
  slogan?: string;
  manifesto?: string;
  color?: string;
  number?: number;
  votesCount: number;
  createdAt?: any;
}

export interface ElectionVote {
  id: string;
  electionId: string;
  candidateId: string;
  voterId: string;
  voterRole?: string;
  votedAt: any;
  isEncrypted?: boolean;
}

export interface ActivityLogItem {
  id: string;
  title: string;
  type: 'survey' | 'election';
  action: string;
  userName: string;
  timestamp: any;
}

export interface SurveyElectionStats {
  totalSurveys: number;
  activeSurveys: number;
  completedSurveys: number;
  totalElections: number;
  activeElections: number;
  completedElections: number;
  totalVotesCast: number;
  globalParticipationRate: number;
  monthlyData: { month: string; surveys: number; elections: number; votes: number }[];
}
