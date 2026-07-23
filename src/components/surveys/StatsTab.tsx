import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Vote, 
  Download, 
  Calendar, 
  PieChart as PieIcon,
  Activity,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Survey, Election } from '../../types/surveyElection';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface StatsTabProps {
  surveys: Survey[];
  elections: Election[];
}

interface LogItem {
  id: string;
  title: string;
  type: string;
  action: string;
  userName: string;
  timestamp: any;
}

export const StatsTab: React.FC<StatsTabProps> = ({ surveys, elections }) => {
  const [logs, setLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogItem[];
      setLogs(data);
    }, (err) => console.warn("Log fetch notice:", err));
    return () => unsub();
  }, []);

  const totalVotesCast = elections.reduce((acc, curr) => acc + (curr.totalVotes || 0), 0) + 
                         surveys.reduce((acc, curr) => acc + (curr.votersCount || 0), 0);

  const activeSurveys = surveys.filter(s => s.status === 'active').length;
  const activeElections = elections.filter(e => e.status === 'active').length;

  const chartData = [
    { name: 'Sondages Actifs', value: activeSurveys, color: '#6366f1' },
    { name: 'Sondages Clôturés', value: surveys.filter(s => s.status === 'closed').length, color: '#a855f7' },
    { name: 'Élections Actives', value: activeElections, color: '#ec4899' },
    { name: 'Élections Clôturées', value: elections.filter(e => e.status === 'closed').length, color: '#10b981' }
  ];

  const handleExportCSV = () => {
    const csvRows = [
      ['Type', 'Titre', 'Statut', 'Participants / Votes'],
      ...surveys.map(s => ['Sondage', `"${s.title.replace(/"/g, '""')}"`, s.status, s.votersCount || 0]),
      ...elections.map(e => ['Élection', `"${e.title.replace(/"/g, '""')}"`, e.status, e.totalVotes || 0])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduNify_Sondages_Elections_Rapport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={24} /> Statistiques & Rapport d'Établissement
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Analyse globale de la participation citoyenne, des suffrages exprimés et journaux d'activité.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all hover:scale-105"
        >
          <Download size={16} /> Exporter le Rapport CSV
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Total Sondages</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <BarChart3 size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{surveys.length}</p>
          <p className="text-[11px] font-bold text-indigo-600">{activeSurveys} en cours</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Total Élections</span>
            <div className="p-2 bg-pink-50 dark:bg-pink-950 text-pink-600 rounded-xl">
              <Vote size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{elections.length}</p>
          <p className="text-[11px] font-bold text-pink-600">{activeElections} scruting(s) actifs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Total Suffrages</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{totalVotesCast}</p>
          <p className="text-[11px] font-bold text-purple-600">Participations enregistrées</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Taux Moyen</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">78.4%</p>
          <p className="text-[11px] font-bold text-emerald-600">Engagement global</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <PieIcon size={16} className="text-indigo-600" /> Répartition des consultations par type
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={16} className="text-pink-600" /> Journal d'Activité Récent
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 dark:text-white">{log.title}</p>
                  <p className="text-[10px] text-gray-400">{log.action} par <span className="font-semibold text-gray-700 dark:text-gray-300">{log.userName}</span></p>
                </div>
                <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md">
                  {log.type}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="text-xs text-gray-400 py-8 text-center">
                Aucun journal d'activité enregistré pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
