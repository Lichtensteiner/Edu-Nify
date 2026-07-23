import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Users, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  PieChart as PieIcon,
  MessageSquare,
  Award
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
import { Survey, SurveyResponse } from '../../types/surveyElection';
import { subscribeToSurveyResponses } from '../../services/surveyElectionService';
import { VotersListModal } from './VotersListModal';

interface SurveyResultsViewProps {
  survey: Survey;
  onBack: () => void;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6', '#8b5cf6'];

export const SurveyResultsView: React.FC<SurveyResultsViewProps> = ({ survey, onBack }) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVotersModal, setShowVotersModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSurveyResponses(survey.id, (data) => {
      setResponses(data);
      setLoading(false);
    });
    return () => unsub();
  }, [survey.id]);

  const totalParticipants = responses.length;

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Participant,Date,Question,Reponse\n";

    responses.forEach(r => {
      const name = r.isAnonymous ? "Anonyme" : (r.userName || "Participant");
      const date = r.votedAt?.toDate ? r.votedAt.toDate().toLocaleString('fr-FR') : "N/A";

      survey.questions?.forEach(q => {
        const val = r.answers[q.id];
        let strVal = "";
        if (Array.isArray(val)) strVal = val.join(" | ");
        else strVal = String(val || "");

        csvContent += `"${name}","${date}","${q.title.replace(/"/g, '""')}","${strVal.replace(/"/g, '""')}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resultats_sondage_${survey.id}.csv`);
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
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md">
                {survey.category || 'Général'}
              </span>
              <span className="text-xs text-gray-400">
                • Crée par {survey.authorName}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Résultats : {survey.title}
            </h1>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowVotersModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            <Users size={16} /> Liste des Votants ({totalParticipants})
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
          id: survey.id,
          title: survey.title,
          type: 'survey',
          isAnonymous: survey.settings?.isAnonymous
        }}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {totalParticipants}
            </p>
            <p className="text-xs font-medium text-gray-500">Total Participants</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-2xl">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {survey.questions?.length || 0}
            </p>
            <p className="text-xs font-medium text-gray-500">Questions analysées</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white uppercase">
              {survey.status === 'active' ? 'En cours' : 'Clôturé'}
            </p>
            <p className="text-xs font-medium text-gray-500">Statut de la consultation</p>
          </div>
        </div>
      </div>

      {/* Questions Results Breakdown */}
      <div className="space-y-8">
        {survey.questions?.map((q, qIdx) => {
          // Calculate distribution for choice-based questions
          let chartData: { name: string; count: number; percentage: number }[] = [];

          if (q.type === 'single' || q.type === 'multiple' || q.type === 'dropdown') {
            const counts: Record<string, number> = {};
            q.options?.forEach(opt => { counts[opt.id] = 0; });

            responses.forEach(r => {
              const val = r.answers[q.id];
              if (Array.isArray(val)) {
                val.forEach(optId => { if (counts[optId] !== undefined) counts[optId]++; });
              } else if (val && counts[val] !== undefined) {
                counts[val]++;
              }
            });

            chartData = (q.options || []).map(opt => {
              const count = counts[opt.id] || 0;
              const percentage = totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0;
              return {
                name: opt.label,
                count,
                percentage
              };
            });
          } else if (q.type === 'yesno') {
            let ouiCount = 0;
            let nonCount = 0;
            responses.forEach(r => {
              if (r.answers[q.id] === 'Oui') ouiCount++;
              if (r.answers[q.id] === 'Non') nonCount++;
            });
            chartData = [
              { name: 'Oui', count: ouiCount, percentage: totalParticipants ? Math.round((ouiCount / totalParticipants) * 100) : 0 },
              { name: 'Non', count: nonCount, percentage: totalParticipants ? Math.round((nonCount / totalParticipants) * 100) : 0 }
            ];
          } else if (q.type === 'rating5' || q.type === 'rating10') {
            const maxVal = q.type === 'rating5' ? 5 : 10;
            const counts: Record<number, number> = {};
            for (let i = 1; i <= maxVal; i++) counts[i] = 0;

            responses.forEach(r => {
              const val = Number(r.answers[q.id]);
              if (val && counts[val] !== undefined) counts[val]++;
            });

            chartData = Array.from({ length: maxVal }, (_, i) => i + 1).map(num => ({
              name: `${num} ★`,
              count: counts[num] || 0,
              percentage: totalParticipants ? Math.round(((counts[num] || 0) / totalParticipants) * 100) : 0
            }));
          }

          return (
            <div key={q.id} className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                    Question {qIdx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {q.title}
                  </h3>
                </div>
              </div>

              {/* Chart & Table Breakdown */}
              {chartData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Bar Chart */}
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis dataKey="name" type="category" width={110} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 12, 12, 0]} name="Nombre de votes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table view */}
                  <div className="space-y-3">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                          <span>{item.name}</span>
                          <span>{item.count} vote(s) ({item.percentage}%)</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Free text or list responses */
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
                    <MessageSquare size={16} /> Réponses textuelles reçues ({responses.length}) :
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                    {responses.map((r, idx) => {
                      const textVal = r.answers[q.id];
                      if (!textVal) return null;
                      return (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl text-xs text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                            {r.isAnonymous ? 'Anonyme' : (r.userName || 'Participant')} :
                          </span>
                          "{String(textVal)}"
                        </div>
                      );
                    })}

                    {responses.length === 0 && (
                      <p className="text-xs text-gray-400 py-4 text-center">Aucune réponse écrite pour l'instant.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
