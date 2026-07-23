import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  ArrowLeft, 
  Users, 
  Vote as VoteIcon, 
  Award, 
  FileSpreadsheet, 
  Printer, 
  Crown,
  Sparkles
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
  Cell 
} from 'recharts';
import { Candidate, Election } from '../../types/surveyElection';
import { subscribeToCandidates } from '../../services/surveyElectionService';
import { VotersListModal } from './VotersListModal';

interface ElectionResultsViewProps {
  election: Election;
  onBack: () => void;
}

export const ElectionResultsView: React.FC<ElectionResultsViewProps> = ({
  election,
  onBack
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVotersModal, setShowVotersModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCandidates(election.id, (data) => {
      // Sort candidates by votes count descending
      const sorted = [...data].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
      setCandidates(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [election.id]);

  const totalVotes = candidates.reduce((acc, c) => acc + (c.votesCount || 0), 0);
  const winner = candidates.length > 0 && totalVotes > 0 ? candidates[0] : null;

  const chartData = candidates.map(c => ({
    name: `${c.firstName} ${c.lastName}`,
    votes: c.votesCount || 0,
    percentage: totalVotes > 0 ? Math.round(((c.votesCount || 0) / totalVotes) * 100) : 0,
    color: c.color || '#ec4899'
  }));

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rang,Candidat,Classe,Voix,Pourcentage\n";

    candidates.forEach((c, idx) => {
      const pct = totalVotes > 0 ? Math.round(((c.votesCount || 0) / totalVotes) * 100) : 0;
      csvContent += `"${idx + 1}","${c.firstName} ${c.lastName}","${c.candidateClass || ''}","${c.votesCount || 0}","${pct}%"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resultats_election_${election.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 px-2.5 py-0.5 rounded-md capitalize">
                {election.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400">
                • {totalVotes} suffrage(s) exprimé(s)
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Résultats : {election.title}
            </h1>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowVotersModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            <Users size={16} /> Liste des Votants ({totalVotes})
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            <FileSpreadsheet size={16} /> Exporter CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            <Printer size={16} /> Imprimer / PDF
          </button>
        </div>
      </div>

      <VotersListModal 
        isOpen={showVotersModal}
        onClose={() => setShowVotersModal(false)}
        item={{
          id: election.id,
          title: election.title,
          type: 'election'
        }}
      />

      {/* Winner Banner Announcement if votes exist */}
      {winner && (
        <div className="p-8 bg-gradient-to-br from-amber-500 via-pink-600 to-indigo-600 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
              <Crown size={16} className="text-amber-200 animate-spin" /> Vainqueur du Scrutin
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Félicitations à {winner.firstName} {winner.lastName} !
            </h2>
            <p className="text-xs text-amber-100 max-w-xl">
              Élu(e) avec {winner.votesCount} voix ({totalVotes > 0 ? Math.round(((winner.votesCount || 0) / totalVotes) * 100) : 0}% des suffrages exprimés).
            </p>
          </div>

          <div className="flex items-center gap-4 z-10 shrink-0">
            <img 
              src={winner.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.firstName}`}
              alt={winner.firstName} 
              className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-300 shadow-2xl"
            />
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-center">
              <p className="text-2xl font-black">{winner.votesCount}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-100">Suffrages</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Candidates Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visual Chart */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={20} className="text-pink-600" />
            Répartition des Voix
          </h3>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Bar dataKey="votes" fill="#ec4899" radius={[12, 12, 0, 0]} name="Voix obtenues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Ranking List */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            Classement Général des Candidats
          </h3>

          <div className="space-y-3">
            {candidates.map((c, rank) => {
              const pct = totalVotes > 0 ? Math.round(((c.votesCount || 0) / totalVotes) * 100) : 0;
              return (
                <div 
                  key={c.id} 
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                    rank === 0 
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' 
                      : 'bg-gray-50 dark:bg-gray-900/60 border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                      rank === 0 ? 'bg-amber-500 text-white' : rank === 1 ? 'bg-gray-300 text-gray-800' : rank === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      #{rank + 1}
                    </span>
                    <img 
                      src={c.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.firstName}`}
                      alt={c.firstName} 
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {c.firstName} {c.lastName}
                      </h4>
                      <p className="text-[11px] text-gray-500">{c.candidateClass}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-gray-900 dark:text-white">
                      {c.votesCount || 0} voix
                    </p>
                    <p className="text-xs font-bold text-pink-600 dark:text-pink-400">
                      {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
