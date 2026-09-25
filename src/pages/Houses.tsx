import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, User } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { createNotification } from '../services/NotificationService';
import { Trophy, Shield, AlertTriangle, Plus, Edit2, Trash2, Star, Award, Flag, Medal, Save, RefreshCw, School, Sparkles } from 'lucide-react';

export interface House {
  id: string;
  nom_maison: string;
  logo: string;
  total_points: number;
  color: string;
  responsable_id?: string;
  description?: string;
  animal_nom?: string;
  valeurs?: string;
  etablissement?: string;
}

export interface HousePointHistory {
  id: string;
  student_id: string;
  teacher_id: string;
  house_id: string;
  type: 'gain' | 'penalty';
  category: string;
  reason: string;
  points: number;
  icon: string;
  timestamp: string;
  etablissement?: string;
}

export default function Houses() {
  const { currentUser } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const { t } = useLanguage();
  const { notifySuccess, notifyError, notifyDelete } = useNotification();
  const [activeTab, setActiveTab] = useState<'classement' | 'attribuer' | 'historique' | 'affiche' | 'gestion'>('affiche');
  
  const [houses, setHouses] = useState<House[]>([]);
  const [history, setHistory] = useState<HousePointHistory[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';
  const establishmentName = currentEstablishment?.nom || (currentUser?.etablissement ? `Établissement ${currentUser.etablissement}` : 'Établissement Scolaire');

  useEffect(() => {
    const unsubscribeHouses = onSnapshot(collection(db, 'houses'), (snap) => {
      const housesData = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as House))
        .filter(h => (h.etablissement || 'EDU-001') === activeEstId);
      housesData.sort((a, b) => b.total_points - a.total_points);
      setHouses(housesData);
    });

    const unsubscribeHistory = onSnapshot(query(collection(db, 'house_points_history')), (snap) => {
      const historyData = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as HousePointHistory))
        .filter(h => (h.etablissement || 'EDU-001') === activeEstId);
      historyData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(historyData);
    });

    const unsubscribeUsers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'élève')), (snap) => {
      const usersData = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => (u.etablissement || 'EDU-001') === activeEstId);
      setStudents(usersData);
    });

    const unsubscribeTeachers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'enseignant')), (snap) => {
      const teachersData = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => (u.etablissement || 'EDU-001') === activeEstId);
      setTeachers(teachersData);
      setLoading(false);
    });

    return () => {
      unsubscribeHouses();
      unsubscribeHistory();
      unsubscribeUsers();
      unsubscribeTeachers();
    };
  }, [activeEstId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Système des Maisons</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <School size={13} />
              {establishmentName}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Émulation scolaire, cohésion d'équipe et attribution des points pour {establishmentName}
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('gestion')}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus size={16} />
            Créer / Gérer les maisons
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('classement')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'classement' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            Classement
          </button>
          {currentUser?.role !== 'élève' && (
            <button
              onClick={() => setActiveTab('attribuer')}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'attribuer' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              Attribuer des points
            </button>
          )}
          <button
            onClick={() => setActiveTab('historique')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'historique' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab('affiche')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'affiche' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            Affiche Officielle ({establishmentName})
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('gestion')}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'gestion' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              Gestion des Maisons
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'classement' && <ClassementTab houses={houses} teachers={teachers} establishmentName={establishmentName} />}
          {activeTab === 'attribuer' && currentUser?.role !== 'élève' && <AttribuerTab houses={houses} students={students} activeEstId={activeEstId} />}
          {activeTab === 'historique' && <HistoriqueTab history={history} houses={houses} students={students} currentUser={currentUser} />}
          {activeTab === 'affiche' && <AfficheTab houses={houses} establishmentName={establishmentName} />}
          {activeTab === 'gestion' && currentUser?.role === 'admin' && <GestionTab houses={houses} teachers={teachers} activeEstId={activeEstId} establishmentName={establishmentName} />}
        </div>
      </div>
    </div>
  );
}

// --- TABS COMPONENTS ---

function ClassementTab({ houses, teachers, establishmentName }: { houses: House[], teachers: User[], establishmentName: string }) {
  const { t } = useLanguage();

  if (houses.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Trophy size={32} />
        </div>
        <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
          Aucune maison enregistrée pour {establishmentName}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          L'administrateur peut créer des maisons pour cet établissement dans l'onglet "Gestion des Maisons".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Top 3 Houses */}
        {houses.slice(0, 3).map((house, index) => {
          const responsable = teachers.find(t => t.id === house.responsable_id);
          return (
          <div key={house.id} className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xs border-2 p-6 text-center transform transition-transform hover:scale-102 ${
            index === 0 ? 'border-yellow-400 order-2 md:order-2 md:-mt-4' : 
            index === 1 ? 'border-gray-300 dark:border-gray-600 order-1 md:order-1' : 
            'border-amber-600 order-3 md:order-3'
          }`}>
            <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md ${
              index === 0 ? 'bg-yellow-400 text-yellow-950' : 
              index === 1 ? 'bg-gray-400 text-gray-900' : 
              'bg-amber-600'
            }`}>
              {index + 1}
            </div>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl overflow-hidden shadow-inner" style={{ backgroundColor: `${house.color}20`, color: house.color }}>
              {house.logo.startsWith('http') ? (
                <img src={house.logo} alt={house.nom_maison} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                house.logo
              )}
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{house.nom_maison}</h3>
            {responsable && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('resp')} {responsable.nom} {responsable.prenom}</p>}
            {house.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic line-clamp-2">{house.description}</p>}
            <div className="text-3xl font-black" style={{ color: house.color }}>
              {house.total_points} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{t('pts')}</span>
            </div>
          </div>
        )})}
      </div>

      {/* Other Houses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('position')}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('house')}</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('points')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {houses.map((house, index) => (
              <tr key={house.id} className={index < 3 ? 'bg-gray-50/50 dark:bg-gray-750/30' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-xl overflow-hidden" style={{ backgroundColor: `${house.color}20`, color: house.color }}>
                      {house.logo.startsWith('http') ? (
                        <img src={house.logo} alt={house.nom_maison} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        house.logo
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{house.nom_maison}</div>
                      {house.animal_nom && (
                        <div className="text-xs text-gray-400">{house.animal_nom} • {house.valeurs}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black" style={{ color: house.color }}>
                  {house.total_points} {t('pts')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttribuerTab({ houses, students, activeEstId }: { houses: House[], students: User[], activeEstId: string }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { notifySuccess, notifyError } = useNotification();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [actionType, setActionType] = useState<'gain' | 'penalty'>('gain');
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [customReason, setCustomReason] = useState('');
  const [customPoints, setCustomPoints] = useState(1);
  const [loading, setLoading] = useState(false);

  const gainRules = [
    { category: t('school_uniform'), icon: '👕👟', rules: [{ reason: t('complete_clean_uniform'), points: 5, icon: '👕' }, { reason: t('clean_shoes'), points: 3, icon: '👟' }] },
    { category: t('discipline'), icon: '🎓🤫', rules: [{ reason: t('respect_teachers'), points: 5, icon: '🎓' }, { reason: t('silence_in_class'), points: 3, icon: '🤫' }] },
    { category: t('behavior'), icon: '🤝⭐', rules: [{ reason: t('help_classmate'), points: 5, icon: '🤝' }, { reason: t('respect_rules'), points: 3, icon: '⭐' }] },
    { category: t('participation'), icon: '⚽📚', rules: [{ reason: t('class_participation'), points: 3, icon: '📚' }, { reason: t('activities_sport_culture'), points: 5, icon: '⚽' }] },
  ];

  const penaltyRules = [
    { category: t('possible_penalties'), icon: '⚠️', rules: [{ reason: t('incorrect_uniform'), points: -3, icon: '👕❌' }, { reason: t('lateness'), points: -2, icon: '⏰' }, { reason: t('lack_of_respect'), points: -5, icon: '🚫' }] }
  ];

  const rules = actionType === 'gain' ? gainRules : penaltyRules;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !currentUser) return;

    const student = students.find(s => s.id === selectedStudent);
    if (!student || !student.house_id) {
      notifyError(t('student_no_house_alert'));
      return;
    }

    const house = houses.find(h => h.id === student.house_id);
    if (!house) return;

    const pointsToApply = selectedRule ? selectedRule.rule.points : (actionType === 'gain' ? Math.abs(customPoints) : -Math.abs(customPoints));
    const reasonToApply = selectedRule ? selectedRule.rule.reason : customReason;
    const categoryToApply = selectedRule ? selectedRule.category : 'Autre';
    const iconToApply = selectedRule ? selectedRule.rule.icon : (actionType === 'gain' ? '✨' : '⚠️');

    if (!reasonToApply) {
      notifyError(t('select_rule_reason_alert'));
      return;
    }

    setLoading(true);
    try {
      // 1. Add history record with establishment ID
      await addDoc(collection(db, 'house_points_history'), {
        student_id: student.id,
        teacher_id: currentUser.id,
        house_id: house.id,
        type: actionType,
        category: categoryToApply,
        reason: reasonToApply,
        points: pointsToApply,
        icon: iconToApply,
        timestamp: new Date().toISOString(),
        etablissement: activeEstId
      });

      // 2. Update house total points
      await updateDoc(doc(db, 'houses', house.id), {
        total_points: (house.total_points || 0) + pointsToApply
      });

      // 3. Send notification to student and propagate to curators
      await createNotification({
        user_id: student.id,
        title: actionType === 'gain' ? t('house_points_won') : t('house_points_lost'),
        message: `${pointsToApply > 0 ? '+' : ''}${pointsToApply} ${t('points_for_house')} ${house.nom_maison} : ${reasonToApply}`,
        type: actionType === 'gain' ? 'success' : 'warning',
        etablissement: activeEstId
      });

      notifySuccess(t('points_assigned_success'));
      setSelectedStudent('');
      setSelectedRule(null);
      setCustomReason('');
      setCustomPoints(1);
    } catch (error) {
      console.error("Error adding points:", error);
      notifyError(t('error_assigning_points'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t('student')}</label>
        <select
          required
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t('select_student')}</option>
          {students.map(student => {
            const house = houses.find(h => h.id === student.house_id);
            return (
              <option key={student.id} value={student.id}>
                {student.nom} {student.prenom} {house ? `(${house.nom_maison})` : t('no_house')}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">{t('action_type')}</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => { setActionType('gain'); setSelectedRule(null); }}
            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-colors ${
              actionType === 'gain' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <Trophy size={18} />
            {t('reward_gain')}
          </button>
          <button
            type="button"
            onClick={() => { setActionType('penalty'); setSelectedRule(null); }}
            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-colors ${
              actionType === 'penalty' ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-200 hover:bg-red-50/50'
            }`}
          >
            <AlertTriangle size={18} />
            {t('sanction_penalty')}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">{t('reason')}</label>
        <div className="space-y-4">
          {rules.map((category, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span>{category.icon}</span> {category.category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {category.rules.map((rule, rIdx) => (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => { setSelectedRule({ category: category.category, rule }); setCustomReason(''); }}
                    className={`text-left px-4 py-3 rounded-xl border flex justify-between items-center transition-colors ${
                      selectedRule?.rule === rule 
                        ? (actionType === 'gain' ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/70' : 'border-red-500 bg-red-100 dark:bg-red-950/70') 
                        : 'border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{rule.icon}</span> {rule.reason}
                    </span>
                    <span className={`text-xs font-black ${actionType === 'gain' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {rule.points > 0 ? '+' : ''}{rule.points}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">{t('other_custom')}</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('custom_reason')}
                  value={customReason}
                  onChange={(e) => { setCustomReason(e.target.value); setSelectedRule(null); }}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customPoints}
                  onChange={(e) => { setCustomPoints(parseInt(e.target.value) || 1); setSelectedRule(null); }}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !selectedStudent || (!selectedRule && !customReason)}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
      >
        {loading ? t('saving') : t('save_points')}
      </button>
    </form>
  );
}

function HistoriqueTab({ history, houses, students, currentUser }: { history: HousePointHistory[], houses: House[], students: User[], currentUser: User | null }) {
  const { t } = useLanguage();
  const filteredHistory = currentUser?.role === 'élève' 
    ? history.filter(h => h.student_id === currentUser.id)
    : history;

  return (
    <div className="space-y-4">
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-xs">
          {t('no_points_history')}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('date')}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('student')}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('house')}</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('reason')}</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('points')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredHistory.map((record) => {
                const student = students.find(s => s.id === record.student_id);
                const house = houses.find(h => h.id === record.house_id);
                const date = new Date(record.timestamp);
                
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {student ? `${student.nom} ${student.prenom}` : 'Élève inconnu'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {house ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${house.color}20`, color: house.color }}>
                          {house.logo.startsWith('http') ? (
                            <img src={house.logo} alt={house.nom_maison} className="w-4 h-4 object-cover rounded-full" referrerPolicy="no-referrer" />
                          ) : (
                            <span>{house.logo}</span>
                          )}
                          {house.nom_maison}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                          {record.icon && <span>{record.icon}</span>}
                          {record.reason}
                        </span>
                        {record.category && <span className="text-[10px] text-gray-400">{record.category}</span>}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-xs font-black ${record.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {record.points > 0 ? '+' : ''}{record.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AfficheTab({ houses, establishmentName }: { houses: House[], establishmentName: string }) {
  const sortedHouses = [...houses].sort((a, b) => b.total_points - a.total_points);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 bg-gray-50 dark:bg-gray-850 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">
          Système des Maisons
        </h1>
        <p className="text-sm sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>🏫</span> {establishmentName}
        </p>
      </div>

      {/* HOUSES ROW */}
      {sortedHouses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {sortedHouses.map((house, index) => (
            <div key={house.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs border border-gray-150 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: house.color }}></div>
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
                #{index + 1}
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner" style={{ backgroundColor: `${house.color}20` }}>
                {house.logo.startsWith('http') ? (
                  <img src={house.logo} alt={house.nom_maison} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  house.logo
                )}
              </div>
              <h3 className="font-black text-gray-900 dark:text-white text-base">{house.nom_maison}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{house.description || house.valeurs || 'Maison officielle'}</p>
              <div className="mt-auto bg-gray-50 dark:bg-gray-750 px-4 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                <span className="font-black text-base" style={{ color: house.color }}>{house.total_points}</span>
                <span className="text-[10px] text-gray-400 ml-1 font-bold uppercase">pts</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Aucune maison n'est encore configurée pour <strong>{establishmentName}</strong>. Rendez-vous dans "Gestion des Maisons" pour en créer.
          </p>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* ATTRIBUTION DES POINTS */}
          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md transform -rotate-3">
                <Trophy size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200 uppercase tracking-tight">Attribution des Points</h2>
            </div>
            
            <div className="space-y-5">
              <div className="bg-white/70 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h3 className="font-black text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 text-sm sm:text-base"><span>👕👟</span> Tenue Scolaire</h3>
                <ul className="space-y-2 text-blue-900 dark:text-blue-100 font-medium">
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>👕</span> Tenue complète et propre</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+5</span></li>
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>👟</span> Chaussures propres</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+3</span></li>
                </ul>
              </div>
              
              <div className="bg-white/70 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h3 className="font-black text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 text-sm sm:text-base"><span>🎓🤫</span> Discipline</h3>
                <ul className="space-y-2 text-blue-900 dark:text-blue-100 font-medium">
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>🎓</span> Respect des enseignants</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+5</span></li>
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>🤫</span> Silence en classe</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+3</span></li>
                </ul>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h3 className="font-black text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 text-sm sm:text-base"><span>🤝⭐</span> Comportement</h3>
                <ul className="space-y-2 text-blue-900 dark:text-blue-100 font-medium">
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>🤝</span> Aide à un camarade</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+5</span></li>
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>⭐</span> Respect des règles</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+3</span></li>
                </ul>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h3 className="font-black text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 text-sm sm:text-base"><span>⚽📚</span> Participation</h3>
                <ul className="space-y-2 text-blue-900 dark:text-blue-100 font-medium">
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>📚</span> Participation en classe</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+3</span></li>
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-3 py-2 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-2 text-xs sm:text-sm"><span>⚽</span> Activités (sport/culture)</span> <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-lg text-xs self-end sm:self-auto">+5</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* RECOMPENSES */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md transform rotate-3">
                <Medal size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-tight">Récompenses</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl text-center shadow-2xs border border-emerald-100 dark:border-emerald-800">
                <div className="text-2xl mb-1">🏁</div>
                <div className="font-black text-emerald-900 dark:text-emerald-200 text-xs">Hebdo</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Drapeau hissé</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl text-center shadow-2xs border border-emerald-100 dark:border-emerald-800">
                <div className="text-2xl mb-1">🏆</div>
                <div className="font-black text-emerald-900 dark:text-emerald-200 text-xs">Mensuel</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Trophée du mois</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl text-center shadow-2xs border border-emerald-100 dark:border-emerald-800">
                <div className="text-2xl mb-1">👑</div>
                <div className="font-black text-emerald-900 dark:text-emerald-200 text-xs">Annuel</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Coupe de l'école</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* PENALITES */}
          <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-red-200 dark:border-red-800 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md transform rotate-3">
                <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-red-900 dark:text-red-200 uppercase tracking-tight">Pénalités Possibles</h2>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <ul className="space-y-3 text-red-900 dark:text-red-100 font-medium">
                <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-4 py-3 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-3 text-xs sm:text-sm"><span>👕❌</span> Tenue incorrecte</span> <span className="font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-3 py-1 rounded-lg text-xs self-end sm:self-auto">-3</span></li>
                <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-4 py-3 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-3 text-xs sm:text-sm"><span>⏰</span> Retard</span> <span className="font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-3 py-1 rounded-lg text-xs self-end sm:self-auto">-2</span></li>
                <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-750 px-4 py-3 rounded-xl shadow-2xs gap-2"><span className="flex items-center gap-3 text-xs sm:text-sm"><span>🚫</span> Manque de respect</span> <span className="font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-3 py-1 rounded-lg text-xs self-end sm:self-auto">-5</span></li>
              </ul>
            </div>
          </div>

          {/* REGLEMENT */}
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-orange-200 dark:border-orange-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md transform -rotate-3">
                <Shield size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-orange-900 dark:text-orange-200 uppercase tracking-tight">Règlement</h2>
            </div>
            <ul className="space-y-3 text-orange-900 dark:text-orange-100 font-medium">
              <li className="flex items-start gap-3 bg-white dark:bg-gray-750 p-3 rounded-xl shadow-2xs">
                <span className="text-orange-500 mt-0.5">•</span>
                <span className="text-xs sm:text-sm">Chaque élève appartient à une maison pour toute l'année scolaire au sein de {establishmentName}.</span>
              </li>
              <li className="flex items-start gap-3 bg-white dark:bg-gray-750 p-3 rounded-xl shadow-2xs">
                <span className="text-orange-500 mt-0.5">•</span>
                <span className="text-xs sm:text-sm">Les points sont cumulatifs pour la maison.</span>
              </li>
              <li className="flex items-start gap-3 bg-white dark:bg-gray-750 p-3 rounded-xl shadow-2xs">
                <span className="text-orange-500 mt-0.5">•</span>
                <span className="text-xs sm:text-sm">Seuls les enseignants et la direction peuvent attribuer ou retirer des points.</span>
              </li>
            </ul>
          </div>

          {/* BANNER */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-md">
            <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-wide drop-shadow-md">
              La maison qui a le plus de points gagne la Coupe de l'école {establishmentName} !
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

function GestionTab({ houses, teachers, activeEstId, establishmentName }: { houses: House[], teachers: User[], activeEstId: string, establishmentName: string }) {
  const { notifySuccess, notifyError, notifyDelete } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({ 
    nom_maison: '', 
    logo: '🦁', 
    color: '#4F46E5', 
    total_points: 0, 
    responsable_id: '', 
    description: '', 
    animal_nom: '', 
    valeurs: '' 
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [houseToDelete, setHouseToDelete] = useState<string | null>(null);

  const predefinedHouses = [
    { id: 'elephant', logo: '🐘', nom_maison: 'Maison Éléphant', animal_nom: 'Éléphant d\'Afrique', valeurs: 'Sagesse & Responsabilité', color: '#3B82F6' },
    { id: 'mandrill', logo: '🐒', nom_maison: 'Maison Mandrill', animal_nom: 'Mandrill', valeurs: 'Courage & Énergie', color: '#EF4444' },
    { id: 'grisou', logo: '🦜', nom_maison: 'Maison Grisou', animal_nom: 'Perroquet gris', valeurs: 'Créativité & Communication', color: '#10B981' },
    { id: 'lope', logo: '🦍', nom_maison: 'Maison Lopé', animal_nom: 'Gorille', valeurs: 'Leadership & Solidarité', color: '#F59E0B' },
    { id: 'panthere', logo: '🐆', nom_maison: 'Maison Panthère', animal_nom: 'Panthère Noire', valeurs: 'Agilité & Persévérance', color: '#8B5CF6' },
    { id: 'aigle', logo: '🦅', nom_maison: 'Maison Aigle', animal_nom: 'Aigle Royal', valeurs: 'Vision & Excellence', color: '#06B6D4' },
  ];

  const handleSelectPredefined = (house: typeof predefinedHouses[0]) => {
    setFormData({
      ...formData,
      logo: house.logo,
      nom_maison: house.nom_maison,
      animal_nom: house.animal_nom,
      valeurs: house.valeurs,
      color: house.color,
    });
  };

  const handleInitializeDefaultHouses = async () => {
    setInitializing(true);
    try {
      const defaults = predefinedHouses.slice(0, 4);
      for (const ph of defaults) {
        await addDoc(collection(db, 'houses'), {
          nom_maison: ph.nom_maison,
          animal_nom: ph.animal_nom,
          valeurs: ph.valeurs,
          logo: ph.logo,
          color: ph.color,
          total_points: 0,
          description: `Maison officielle ${ph.nom_maison} de l'établissement ${establishmentName}`,
          etablissement: activeEstId
        });
      }
      notifySuccess(`4 maisons créées avec succès pour ${establishmentName} !`);
    } catch (error) {
      console.error("Error initializing houses:", error);
      notifyError("Erreur lors de l'initialisation des maisons.");
    } finally {
      setInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_maison.trim()) {
      notifyError("Veuillez saisir le nom de la maison.");
      return;
    }
    setLoading(true);
    try {
      const dataToSave: any = { 
        ...formData, 
        etablissement: activeEstId 
      };
      if (!dataToSave.responsable_id) {
        delete dataToSave.responsable_id;
      }
      if (editingHouse) {
        await updateDoc(doc(db, 'houses', editingHouse.id), dataToSave);
        notifySuccess("Maison mise à jour avec succès !");
      } else {
        await addDoc(collection(db, 'houses'), dataToSave);
        notifySuccess("Nouvelle maison créée pour cet établissement !");
      }
      setShowModal(false);
      setEditingHouse(null);
      setFormData({ nom_maison: '', logo: '🦁', color: '#4F46E5', total_points: 0, responsable_id: '', description: '', animal_nom: '', valeurs: '' });
    } catch (error) {
      console.error("Error saving house:", error);
      notifyError("Erreur lors de l'enregistrement de la maison.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setHouseToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!houseToDelete) return;
    try {
      await deleteDoc(doc(db, 'houses', houseToDelete));
      notifyDelete("Maison supprimée.");
      setShowDeleteModal(false);
      setHouseToDelete(null);
    } catch (error) {
      console.error("Error deleting house:", error);
      notifyError("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-850">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <School size={16} className="text-indigo-600 dark:text-indigo-400" />
            Configuration des Maisons de {establishmentName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Chaque établissement possède ses propres maisons, ses mascottes, ses couleurs et ses points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {houses.length === 0 && (
            <button
              onClick={handleInitializeDefaultHouses}
              disabled={initializing}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {initializing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
              Initialiser 4 maisons
            </button>
          )}
          <button
            onClick={() => { 
              setEditingHouse(null); 
              setFormData({ nom_maison: '', logo: '🦁', color: '#4F46E5', total_points: 0, responsable_id: '', description: '', animal_nom: '', valeurs: '' }); 
              setShowModal(true); 
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus size={16} />
            Ajouter une maison
          </button>
        </div>
      </div>

      {houses.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Trophy size={28} />
          </div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">
            Aucune maison pour cet établissement
          </h4>
          <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
            Créez des maisons sur mesure pour <strong>{establishmentName}</strong> ou initialisez le jeu standard en un clic.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleInitializeDefaultHouses}
              disabled={initializing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2"
            >
              <Sparkles size={14} />
              Initialiser 4 maisons standards
            </button>
            <button
              onClick={() => { 
                setEditingHouse(null); 
                setFormData({ nom_maison: '', logo: '🦁', color: '#4F46E5', total_points: 0, responsable_id: '', description: '', animal_nom: '', valeurs: '' }); 
                setShowModal(true); 
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2"
            >
              <Plus size={14} />
              Créer une maison personnalisée
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {houses.map(house => {
            const responsable = teachers.find(t => t.id === house.responsable_id);
            return (
            <div key={house.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center text-center relative group shadow-xs">
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { 
                    setEditingHouse(house); 
                    setFormData({ 
                      nom_maison: house.nom_maison,
                      logo: house.logo,
                      color: house.color,
                      total_points: house.total_points || 0,
                      responsable_id: house.responsable_id || '', 
                      description: house.description || '', 
                      animal_nom: house.animal_nom || '', 
                      valeurs: house.valeurs || '' 
                    }); 
                    setShowModal(true); 
                  }} 
                  className="p-1.5 text-gray-500 hover:text-indigo-600 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  title="Modifier"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => confirmDelete(house.id)} 
                  className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 overflow-hidden shadow-inner" style={{ backgroundColor: `${house.color}20`, color: house.color }}>
                {house.logo.startsWith('http') ? (
                  <img src={house.logo} alt={house.nom_maison} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  house.logo
                )}
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">{house.nom_maison}</h3>
              {house.animal_nom && (
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Mascotte: {house.animal_nom}
                </span>
              )}
              {house.valeurs && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md font-bold mb-2">
                  {house.valeurs}
                </span>
              )}
              {responsable && <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Resp: {responsable.nom} {responsable.prenom}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Couleur: <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle border border-gray-300" style={{ backgroundColor: house.color }}></span></p>
              {house.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 italic line-clamp-2">{house.description}</p>}
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
                <span className="text-2xl font-black" style={{ color: house.color }}>{house.total_points}</span>
                <span className="text-xs text-gray-400 ml-1">points</span>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-4xl my-8 shadow-2xl border border-gray-150 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {editingHouse ? 'Modifier la maison' : 'Créer une nouvelle maison'}
                </h3>
                <p className="text-xs text-gray-400">
                  Établissement rattaché : <strong className="text-indigo-600 dark:text-indigo-400">{establishmentName}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-6">
                {/* LEFT COLUMN: PRÉRÉGLAGES RAPIDES */}
                <div className="w-full md:w-5/12">
                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-xs uppercase tracking-wider flex items-center justify-between">
                      <span>1. Modèles / Suggestions</span>
                      <span className="text-[10px] text-gray-400 font-normal">Cliquer pour charger</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5 flex-1">
                      {predefinedHouses.map((ph) => (
                        <button
                          key={ph.id}
                          type="button"
                          onClick={() => handleSelectPredefined(ph)}
                          className={`flex flex-col items-center p-2.5 rounded-xl border-2 transition-all duration-200 ${
                            formData.nom_maison === ph.nom_maison 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 shadow-xs transform scale-[1.02]' 
                              : 'border-gray-200 dark:border-gray-650 bg-white dark:bg-gray-800 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-3xl mb-1">{ph.logo}</span>
                          <span className="font-black text-gray-900 dark:text-white text-xs text-center">{ph.nom_maison}</span>
                          <span className="text-[9px] text-gray-500 dark:text-gray-400 text-center leading-tight mt-0.5">{ph.valeurs}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: FORM FIELDS (CUSTOMIZABLE) */}
                <div className="w-full md:w-7/12 space-y-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-xs uppercase tracking-wider">
                    2. Personnalisation de la maison
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Nom de la maison *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Maison Jaguar, Maison Phoenix"
                        value={formData.nom_maison}
                        onChange={(e) => setFormData({...formData, nom_maison: e.target.value})}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Émoticône / Logo
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: 🦁, 🦅, 🐆"
                        value={formData.logo}
                        onChange={(e) => setFormData({...formData, logo: e.target.value})}
                        className="w-full p-2.5 text-xs text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Mascotte / Animal emblème
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Lion Royal, Faucon Pèlerin"
                        value={formData.animal_nom}
                        onChange={(e) => setFormData({...formData, animal_nom: e.target.value})}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Valeurs clés
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Courage & Persévérance"
                        value={formData.valeurs}
                        onChange={(e) => setFormData({...formData, valeurs: e.target.value})}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Couleur
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-1 rounded-xl border border-gray-200 dark:border-gray-600">
                        <input
                          type="color"
                          required
                          value={formData.color}
                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                          className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300 font-bold">
                          {formData.color}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Points initiaux
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.total_points}
                        onChange={(e) => setFormData({...formData, total_points: parseInt(e.target.value) || 0})}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Enseignant Responsable
                      </label>
                      <select
                        value={formData.responsable_id}
                        onChange={(e) => setFormData({...formData, responsable_id: e.target.value})}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none"
                      >
                        <option value="">Aucun</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.nom} {teacher.prenom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      Description de la maison
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none"
                      rows={2}
                      placeholder="Devise, histoire ou description de la maison..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.nom_maison}
                  className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Enregistrer la maison
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md text-center shadow-2xl border border-gray-150 dark:border-gray-700">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Confirmer la suppression</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette maison ? Les points et historiques associés seront affectés.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setHouseToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-colors shadow-md shadow-red-600/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
