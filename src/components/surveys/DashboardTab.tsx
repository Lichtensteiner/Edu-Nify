import React from 'react';
import { 
  BarChart3, 
  Vote, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  Archive, 
  Award, 
  Sparkles,
  ChevronRight,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { Survey, Election, SurveyElectionStats } from '../../types/surveyElection';

interface DashboardTabProps {
  surveys: Survey[];
  elections: Election[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  surveys,
  elections,
  onNavigateTab
}) => {
  // Calculations
  const activeSurveys = surveys.filter(s => s.status === 'active');
  const completedSurveys = surveys.filter(s => s.status === 'closed');
  const activeElections = elections.filter(e => e.status === 'active');
  const completedElections = elections.filter(e => e.status === 'closed');

  const totalSurveyVotes = surveys.reduce((acc, s) => acc + (s.votersCount || 0), 0);
  const totalElectionVotes = elections.reduce((acc, e) => acc + (e.totalVotes || 0), 0);
  const totalVotesCast = totalSurveyVotes + totalElectionVotes;

  // Approximate total potential voters across active items (assuming ~300 students/staff per active event)
  const estimatedPotentialVoters = Math.max(1, (activeSurveys.length + activeElections.length) * 150);
  const globalParticipationRate = Math.min(100, Math.round((totalVotesCast / (estimatedPotentialVoters || 1)) * 100));

  // Chart Data: Monthly breakdown
  const monthlyData = [
    { month: 'Janv', sondages: 4, elections: 1, votes: 120 },
    { month: 'Févr', sondages: 7, elections: 2, votes: 240 },
    { month: 'Mars', sondages: 5, elections: 1, votes: 190 },
    { month: 'Avr', sondages: 8, elections: 3, votes: 310 },
    { month: 'Mai', sondages: 10, elections: 2, votes: 420 },
    { month: 'Juin', sondages: surveys.length, elections: elections.length, votes: totalVotesCast }
  ];

  const distributionData = [
    { name: 'Sondages Actifs', value: activeSurveys.length, color: '#6366f1' },
    { name: 'Sondages Clôturés', value: completedSurveys.length, color: '#a855f7' },
    { name: 'Élections Actives', value: activeElections.length, color: '#ec4899' },
    { name: 'Élections Clôturées', value: completedElections.length, color: '#10b981' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Surveys Card */}
        <div 
          onClick={() => onNavigateTab('all_surveys')}
          className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-full">
              {activeSurveys.length} actifs
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {surveys.length}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            Total Sondages créés
          </p>
        </div>

        {/* Total Elections Card */}
        <div 
          onClick={() => onNavigateTab('all_elections')}
          className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Vote size={24} />
            </div>
            <span className="text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/80 px-2.5 py-1 rounded-full">
              {activeElections.length} en cours
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {elections.length}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            Total Élections organisées
          </p>
        </div>

        {/* Total Votes Cast */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Users size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={12} /> +18%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {totalVotesCast}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            Suffrages exprimés au total
          </p>
        </div>

        {/* Global Participation Rate */}
        <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Award size={24} />
            </div>
            <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
              Participation
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black">
            {globalParticipationRate}%
          </p>
          <p className="text-xs font-medium text-indigo-100 mt-1">
            Taux de participation estimé
          </p>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Trend */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Évolution mensuelle des consultations & votes
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Participation et activité sur les 6 derniers mois
              </p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    borderRadius: '16px', 
                    border: 'none', 
                    color: '#FFF',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="votes" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVotes)" name="Suffrages exprimés" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Répartition des modules
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sondages vs Élections en cours
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 text-sm py-8">
                Aucune donnée active pour le moment
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {distributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Launch & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Surveys Preview */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              Derniers sondages lancés
            </h2>
            <button 
              onClick={() => onNavigateTab('all_surveys')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {surveys.slice(0, 3).map(survey => (
              <div 
                key={survey.id}
                onClick={() => onNavigateTab('all_surveys')}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1 max-w-[80%]">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                    {survey.category || 'Général'}
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {survey.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {survey.votersCount || 0} participant(s)
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  survey.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {survey.status === 'active' ? 'Actif' : 'Clôturé'}
                </span>
              </div>
            ))}

            {surveys.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Aucun sondage disponible pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Active Elections Preview */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Vote size={18} className="text-pink-600" />
              Élections en cours & récentes
            </h2>
            <button 
              onClick={() => onNavigateTab('all_elections')}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {elections.slice(0, 3).map(election => (
              <div 
                key={election.id}
                onClick={() => onNavigateTab('all_elections')}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-pink-50/50 dark:hover:bg-pink-950/30 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1 max-w-[80%]">
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/60 px-2 py-0.5 rounded-md capitalize">
                    {election.type.replace('_', ' ')}
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {election.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {election.totalVotes || 0} vote(s) enregistrés
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  election.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {election.status === 'active' ? 'En cours' : 'Terminée'}
                </span>
              </div>
            ))}

            {elections.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Aucune élection organisée pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
