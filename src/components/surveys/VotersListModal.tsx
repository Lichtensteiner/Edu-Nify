import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  FileSpreadsheet,
  Vote,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { subscribeToSurveyResponses, subscribeToElectionVotes } from '../../services/surveyElectionService';

interface VotersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    type: 'survey' | 'election';
    isAnonymous?: boolean;
    voterIds?: string[];
  };
}

interface VoterRecord {
  id: string;
  name: string;
  role: string;
  votedAtStr: string;
  votedAtTimestamp: number;
  isAnonymous?: boolean;
}

export const VotersListModal: React.FC<VotersListModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!isOpen || !item?.id) return;

    setLoading(true);

    if (item.type === 'survey') {
      const unsub = subscribeToSurveyResponses(item.id, (responses) => {
        const records: VoterRecord[] = responses.map((r: any) => {
          let dateStr = 'N/A';
          let timestamp = 0;
          if (r.votedAt?.toDate) {
            const d = r.votedAt.toDate();
            dateStr = d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            timestamp = d.getTime();
          } else if (r.votedAt) {
            const d = new Date(r.votedAt);
            dateStr = d.toLocaleString('fr-FR');
            timestamp = d.getTime();
          }

          return {
            id: r.id || r.userId || Math.random().toString(),
            name: r.isAnonymous ? 'Participant Anonyme' : (r.userName || 'Utilisateur'),
            role: r.userRole || 'Élève',
            votedAtStr: dateStr,
            votedAtTimestamp: timestamp,
            isAnonymous: r.isAnonymous
          };
        });

        records.sort((a, b) => b.votedAtTimestamp - a.votedAtTimestamp);
        setVoters(records);
        setLoading(false);
      });
      return () => unsub();
    } else {
      // Election votes
      const unsub = subscribeToElectionVotes(item.id, async (votes) => {
        // Collect voter user details if voterName not directly stored
        const userMap = new Map<string, any>();
        try {
          const voterIdsToFetch = votes.map((v: any) => v.voterId).filter(Boolean);
          if (voterIdsToFetch.length > 0) {
            // Fetch users in chunks if necessary
            const usersSnap = await getDocs(collection(db, 'users'));
            usersSnap.forEach(docSnap => {
              userMap.set(docSnap.id, docSnap.data());
            });
          }
        } catch (e) {
          console.warn("Could not fetch voter user details:", e);
        }

        const records: VoterRecord[] = votes.map((v: any) => {
          let dateStr = 'N/A';
          let timestamp = 0;
          if (v.votedAt?.toDate) {
            const d = v.votedAt.toDate();
            dateStr = d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            timestamp = d.getTime();
          } else if (v.votedAt) {
            const d = new Date(v.votedAt);
            dateStr = d.toLocaleString('fr-FR');
            timestamp = d.getTime();
          }

          const uData = userMap.get(v.voterId);
          const resolvedName = v.voterName || (uData ? `${uData.prenom || ''} ${uData.nom || ''}`.trim() : null) || 'Électeur';
          const resolvedRole = v.voterRole || uData?.role || 'Électeur';

          return {
            id: v.id || v.voterId,
            name: resolvedName,
            role: resolvedRole,
            votedAtStr: dateStr,
            votedAtTimestamp: timestamp,
            isAnonymous: false
          };
        });

        records.sort((a, b) => b.votedAtTimestamp - a.votedAtTimestamp);
        setVoters(records);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [isOpen, item?.id, item?.type]);

  if (!isOpen) return null;

  const filteredVoters = voters.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || v.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const uniqueRoles = Array.from(new Set(voters.map(v => v.role).filter(Boolean)));

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "N°,Nom du Votant / Participant,Rôle,Date & Heure du Vote,Statut\n";

    filteredVoters.forEach((v, idx) => {
      csvContent += `"${idx + 1}","${v.name}","${v.role}","${v.votedAtStr}","Vote enregistré"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `liste_votants_${item.type}_${item.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                {item.type === 'survey' ? <BarChart3 size={24} /> : <Vote size={24} />}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  {item.type === 'survey' ? 'Sondage' : 'Scrutin Électoral'} • Registre Officiel
                </span>
                <h2 className="text-xl font-extrabold tracking-tight line-clamp-1">
                  Liste des participants : {item.title}
                </h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un participant ou rôle..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="all">Tous les rôles</option>
                {uniqueRoles.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0"
              >
                <FileSpreadsheet size={15} /> CSV
              </button>
            </div>
          </div>

          {/* Voters Stats bar */}
          <div className="px-6 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <span className="flex items-center gap-1.5">
              <Users size={16} className="text-indigo-600" /> Total suffrages / voix : <strong>{voters.length}</strong>
            </span>
            <span className="text-gray-500 font-normal">
              {filteredStudentsCountText(filteredVoters.length, voters.length)}
            </span>
          </div>

          {/* Table list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-gray-400 font-semibold animate-pulse">
                Chargement du registre des votants...
              </div>
            ) : filteredVoters.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Users size={36} className="mx-auto opacity-30" />
                <p className="font-semibold text-sm">Aucun votant ne correspond aux critères.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Nom du Votant</div>
                  <div className="col-span-3">Rôle</div>
                  <div className="col-span-3 text-right">Horodatage</div>
                </div>

                {filteredVoters.map((v, index) => (
                  <div 
                    key={v.id + '_' + index} 
                    className="grid grid-cols-12 px-4 py-3 items-center text-xs hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="col-span-1 font-mono font-bold text-gray-400">
                      {index + 1}
                    </div>
                    <div className="col-span-5 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {v.isAnonymous ? '?' : v.name[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="truncate">{v.name}</span>
                      {v.isAnonymous && (
                        <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                          Confidentiel
                        </span>
                      )}
                    </div>
                    <div className="col-span-3">
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-md font-extrabold text-[10px] uppercase">
                        {v.role}
                      </span>
                    </div>
                    <div className="col-span-3 text-right text-gray-500 font-mono text-[11px] flex items-center justify-end gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {v.votedAtStr}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <ShieldCheck size={16} /> Empreinte d'audit certifiée Edu-Nify
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-200 rounded-xl"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function filteredStudentsCountText(filteredCount: number, totalCount: number) {
  if (filteredCount === totalCount) return `${totalCount} participant(s) enregistrés`;
  return `${filteredCount} sur ${totalCount} affiché(s)`;
}
