import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { 
  Users, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight,
  User as UserIcon,
  Castle,
  MessageSquare,
  Settings,
  BookOpen,
  Award,
  TrendingUp,
  FileText,
  CheckCircle,
  Calendar,
  ListTodo,
  Activity,
  ChevronDown,
  Sparkles,
  PlayCircle,
  CreditCard,
  Download,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import LiveClock from '../components/LiveClock';
import NewUserAnnouncement from '../components/NewUserAnnouncement';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const TIME_SLOTS = [
  { id: '1', name: '08:00 - 09:30', isBreak: false },
  { id: '2', name: '09:30 - 11:00', isBreak: false },
  { id: 'break1', name: '11:00 - 11:15', isBreak: true, label: 'Récréation' },
  { id: '3', name: '11:15 - 12:45', isBreak: false },
  { id: 'lunch', name: '12:45 - 14:00', isBreak: true, label: 'Pause Midi / Déjeuner' },
  { id: '4', name: '14:00 - 15:30', isBreak: false },
  { id: '5', name: '15:30 - 17:00', isBreak: false },
  { id: '6', name: '17:00 - 18:30', isBreak: false },
];

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
  'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
  'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
  'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
  'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
  'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300',
  'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
  'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300',
];

const DEFAULT_ASSIGNMENTS = [
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Lundi', slotId: '1', subject: 'Mathématiques', teacherId: 't_kouame', teacherName: 'M. Kouamé (Maths)', room: 'Salle 101', color: COLORS[0] },
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Lundi', slotId: '2', subject: 'Histoire-Géographie', teacherId: 't_diallo', teacherName: 'Mme Diallo (Histoire-Géo)', room: 'Salle 102', color: COLORS[3] },
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Lundi', slotId: '3', subject: 'Français', teacherId: 't_sow', teacherName: 'M. Sow (Français)', room: 'Salle 101', color: COLORS[2] },
  
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Mardi', slotId: '1', subject: 'Sciences Physiques', teacherId: 't_koffi', teacherName: 'M. Koffi (Physiques)', room: 'Labo Physique A', color: COLORS[1] },
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Mardi', slotId: '3', subject: 'Anglais', teacherId: 't_smith', teacherName: 'Mme Smith (Anglais)', room: 'Salle L-02', color: COLORS[4] },
  
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Mercredi', slotId: '1', subject: 'SVT', teacherId: 't_traore', teacherName: 'Mme Traoré (SVT)', room: 'Labo SVT B', color: COLORS[5] },
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Mercredi', slotId: '2', subject: 'EPS', teacherId: 't_bamba', teacherName: 'M. Bamba (EPS)', room: 'Terrain de Sport', color: COLORS[6] },
  
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Jeudi', slotId: '2', subject: 'Mathématiques', teacherId: 't_kouame', teacherName: 'M. Kouamé (Maths)', room: 'Salle 101', color: COLORS[0] },
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Jeudi', slotId: '4', subject: 'Français', teacherId: 't_sow', teacherName: 'M. Sow (Français)', room: 'Salle 101', color: COLORS[2] },
  
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Vendredi', slotId: '1', subject: 'Anglais', teacherId: 't_smith', teacherName: 'Mme Smith (Anglais)', room: 'Salle L-02', color: COLORS[4] },
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Vendredi', slotId: '3', subject: 'Philosophie', teacherId: 't_toure', teacherName: 'M. Touré (Philo)', room: 'Amphi A', color: COLORS[7] },
  
  { classId: 'c1', className: '6ème A', dayOfWeek: 'Samedi', slotId: '1', subject: 'Arts Plastiques', teacherId: 't_yigo', teacherName: 'Mme Yigo (Arts)', room: 'Salle L-02', color: COLORS[6] },
];

interface Child {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  matricule: string;
  photo?: string;
  house_id?: string;
}

export default function ParentDashboard({ onNavigate, initialTab }: { onNavigate?: (tab: string) => void, initialTab?: 'overview' | 'grades' | 'attendance' | 'homework' | 'courses' | 'timetable' | 'finance' }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childAttendance, setChildAttendance] = useState<any[]>([]);
  const [childHouse, setChildHouse] = useState<any>(null);
  const [childGrades, setChildGrades] = useState<any[]>([]);
  const [childHomework, setChildHomework] = useState<any[]>([]);
  const [childCourses, setChildCourses] = useState<any[]>([]);
  const [childAssignments, setChildAssignments] = useState<any[]>([]);
  const [childPayments, setChildPayments] = useState<any[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance' | 'homework' | 'courses' | 'timetable' | 'finance'>(initialTab || 'overview');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [linkingChild, setLinkingChild] = useState(false);
  const [matriculeToLink, setMatriculeToLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!currentUser?.children_ids || currentUser.children_ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const childrenData: Child[] = [];
        for (const childId of currentUser.children_ids) {
          const childDoc = await getDoc(doc(db, 'users', childId));
          if (childDoc.exists()) {
            childrenData.push({ id: childDoc.id, ...childDoc.data() } as Child);
          }
        }
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0]);
        }
      } catch (err) {
        console.error("Error fetching children:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedChild) {
      setChildAttendance([]);
      setChildHouse(null);
      setChildGrades([]);
      setChildHomework([]);
      setChildCourses([]);
      setChildAssignments([]);
      setChildPayments([]);
      setFeeConfigs([]);
      return;
    }

    setDetailsLoading(true);

    // 1. Attendance Real-time subscription
    const attQuery = query(collection(db, 'attendance'), where('user_id', '==', selectedChild.id));
    const unsubscribeAttendance = onSnapshot(attQuery, (snapshot) => {
      const attData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      attData.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setChildAttendance(attData);
      setDetailsLoading(false);
    }, (err) => {
      console.error("Error subscribing to attendance:", err);
      setDetailsLoading(false);
    });

    // 2. Grades Real-time subscription
    const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', selectedChild.id));
    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildGrades(gradesData);
    });

    // 3. Homework Real-time subscription
    const hwQuery = selectedChild.classe 
      ? query(collection(db, 'homework'), where('classId', '==', selectedChild.classe))
      : query(collection(db, 'homework'));
    const unsubscribeHomework = onSnapshot(hwQuery, (snapshot) => {
      const hwData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildHomework(hwData);
    });

    // 4. Courses/Resources Real-time subscription
    const coursesQuery = selectedChild.classe 
      ? query(collection(db, 'resources'), where('class_name', '==', selectedChild.classe))
      : query(collection(db, 'resources'));
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      coursesData.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setChildCourses(coursesData);
    });

    // 5. House Real-time subscription
    let unsubscribeHouse = () => {};
    if (selectedChild.house_id) {
      const houseRef = doc(db, 'houses', selectedChild.house_id);
      unsubscribeHouse = onSnapshot(houseRef, (docSnap) => {
        if (docSnap.exists()) {
          setChildHouse({ id: docSnap.id, ...docSnap.data() });
        } else {
          setChildHouse(null);
        }
      });
    } else {
      setChildHouse(null);
    }

    // 6. Timetable Real-time subscription
    const timetableQuery = query(collection(db, 'timetable_assignments'));
    const unsubscribeTimetable = onSnapshot(timetableQuery, (snapshot) => {
      const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildAssignments(tData);
    }, (err) => {
      console.error("Error subscribing to timetable:", err);
    });

    // 7. Payments Real-time subscription
    const paymentsQuery = query(collection(db, 'payments'), where('studentId', '==', selectedChild.id));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      pData.sort((a: any, b: any) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setChildPayments(pData);
    }, (err) => {
      console.error("Error subscribing to child payments:", err);
    });

    // 8. Fee Configurations Real-time subscription
    const feeConfigsQuery = query(collection(db, 'fee_configurations'));
    const unsubscribeFeeConfigs = onSnapshot(feeConfigsQuery, (snapshot) => {
      const fData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeeConfigs(fData);
    }, (err) => {
      console.error("Error subscribing to fee configurations:", err);
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeGrades();
      unsubscribeHomework();
      unsubscribeCourses();
      unsubscribeHouse();
      unsubscribeTimetable();
      unsubscribePayments();
      unsubscribeFeeConfigs();
    };
  }, [selectedChild]);

  // Analytics Helpers for the Parent Portal
  const computeStudentFinance = (student: any) => {
    if (!student) return null;
    
    const activeEstId = currentUser?.etablissement || student.etablissement || 'EDU-001';
    
    const applicable = feeConfigs.filter(fee => {
      if (fee.establishmentId && fee.establishmentId !== activeEstId) return false;
      
      if (fee.studentId) {
        return fee.studentId === student.id;
      }

      if (fee.houseId && fee.houseId !== 'Toutes') {
        const studentHouse = student.house_id || student.houseId;
        if (studentHouse !== fee.houseId) return false;
      }
      
      if (fee.niveau && fee.niveau !== 'Toutes') {
        const studentNiveau = (student.niveau || '').toLowerCase();
        const feeNiveau = fee.niveau.toLowerCase();
        if (!studentNiveau.includes(feeNiveau) && !feeNiveau.includes(studentNiveau)) return false;
      }
      
      if (fee.classe && fee.classe !== 'Toutes') {
        const studentClasse = (student.classe || '').toLowerCase().trim();
        const feeClasse = fee.classe.toLowerCase().trim();
        if (studentClasse !== feeClasse) return false;
      }

      if (fee.filiere && fee.filiere !== 'Toutes') {
        const studentFiliere = (student.filiere || '').toLowerCase().trim();
        const feeFiliere = fee.filiere.toLowerCase().trim();
        if (studentFiliere !== feeFiliere) return false;
      }

      return true;
    });

    let totalDu = 0;
    let totalPaye = 0;
    const feeDetails = applicable.map(fee => {
      const feePayments = childPayments.filter(p => p.studentId === student.id && (p.feeConfigId === fee.id || p.type === fee.category));
      const paid = feePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      totalDu += fee.amount || 0;
      totalPaye += paid;
      return {
        id: fee.id,
        name: fee.name,
        category: fee.category,
        amount: fee.amount,
        paid: paid,
        balance: (fee.amount || 0) - paid,
        deadline: fee.deadline || fee.dueDate || '30/06/2026'
      };
    });

    const totalActualPaid = childPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const defaultFees = [
      { id: "default-reg", name: "Droits d'Inscription", category: "registration", amount: 50000, deadline: "15/09/2025" },
      { id: "default-t1", name: "Frais Scolarité - 1er Trimestre", category: "tuition", amount: 150000, deadline: "31/10/2025" },
      { id: "default-t2", name: "Frais Scolarité - 2ème Trimestre", category: "tuition", amount: 150000, deadline: "15/01/2026" },
      { id: "default-t3", name: "Frais Scolarité - 3ème Trimestre", category: "tuition", amount: 150000, deadline: "30/04/2026" },
    ];

    if (applicable.length === 0) {
      let remainingPayment = totalActualPaid;
      const computedDefaultFees = defaultFees.map(fee => {
        const paidForThis = Math.min(fee.amount, remainingPayment);
        remainingPayment -= paidForThis;
        return {
          id: fee.id,
          name: fee.name,
          category: fee.category,
          amount: fee.amount,
          paid: paidForThis,
          balance: fee.amount - paidForThis,
          deadline: fee.deadline
        };
      });

      const fallbackTotalDu = computedDefaultFees.reduce((sum, f) => sum + f.amount, 0);
      const fallbackTotalPaye = computedDefaultFees.reduce((sum, f) => sum + f.paid, 0);

      return {
        totalDu: fallbackTotalDu,
        totalPaye: fallbackTotalPaye,
        balance: fallbackTotalDu - fallbackTotalPaye,
        percentPaid: Math.round((fallbackTotalPaye / fallbackTotalDu) * 100),
        feeDetails: computedDefaultFees,
        applicableCount: computedDefaultFees.length
      };
    }

    const balance = totalDu - totalPaye;
    const percentPaid = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;

    return {
      totalDu,
      totalPaye,
      balance,
      percentPaid,
      feeDetails,
      applicableCount: applicable.length
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA');
  };

  const calculateAverage = (gradeList: any[]) => {
    if (!gradeList || gradeList.length === 0) return 0;
    const validGrades = gradeList.filter(g => g.maxScore > 0);
    if (validGrades.length === 0) return 0;
    
    const totalWeightedScore = validGrades.reduce((acc, g) => acc + (g.score / g.maxScore * 20) * (g.coefficient || 1), 0);
    const totalCoefficients = validGrades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
    
    if (totalCoefficients === 0) return 0;
    const avg = totalWeightedScore / totalCoefficients;
    return isNaN(avg) ? 0 : avg;
  };

  const getAnalyticsData = () => {
    // 1. Grade Evolution Data
    const evolutionData = childGrades
      .filter(g => g.maxScore > 0)
      .map(g => ({
        date: g.date?.toDate ? g.date.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : 
              (g.date ? new Date(g.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : 'N/A'),
        timestamp: g.date?.toDate ? g.date.toDate().getTime() : (g.date ? new Date(g.date).getTime() : 0),
        score: parseFloat(((g.score / g.maxScore) * 20).toFixed(2)) || 0,
        subject: g.subject || ''
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // 2. Subject Averages
    const subjectAverages = Array.from(new Set(childGrades.filter(g => g && g.subject).map(g => g.subject))).map(subject => {
      const sGrades = childGrades.filter(g => g.subject === subject);
      return {
        subject,
        average: calculateAverage(sGrades),
        interrogations: sGrades.filter(g => g.type === 'interrogation').length,
        evaluations: sGrades.filter(g => g.type === 'evaluation').length
      };
    }).sort((a, b) => (b.average || 0) - (a.average || 0));

    // 3. Attendance Rate
    const totalAttendance = childAttendance.length;
    const presentsCount = childAttendance.filter(a => a.statut === 'Présent').length;
    const retardsCount = childAttendance.filter(a => a.statut === 'Retard').length;
    const absentsCount = childAttendance.filter(a => a.statut === 'Absent').length;
    const attendanceRate = totalAttendance > 0 ? (presentsCount / totalAttendance) * 100 : 100;

    return { evolutionData, subjectAverages, attendanceRate, presentsCount, retardsCount, absentsCount, totalAttendance };
  };

  const { evolutionData, subjectAverages, attendanceRate, presentsCount, retardsCount, absentsCount, totalAttendance } = getAnalyticsData();

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    
    if (!matriculeToLink.trim()) return;

    try {
      const q = query(collection(db, 'users'), where('matricule', '==', matriculeToLink.trim()), where('role', '==', 'élève'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLinkError("Aucun élève trouvé avec ce matricule.");
        return;
      }

      const childDoc = querySnapshot.docs[0];
      const childId = childDoc.id;

      if (currentUser?.children_ids?.includes(childId)) {
        setLinkError("Cet enfant est déjà lié à votre compte.");
        return;
      }

      await updateDoc(doc(db, 'users', currentUser!.id), {
        children_ids: arrayUnion(childId)
      });

      setLinkSuccess("Enfant lié avec succès !");
      setMatriculeToLink('');
      setLinkingChild(false);
      
      // Refresh children list (handled by currentUser dependency in useEffect)
    } catch (err) {
      console.error("Error linking child:", err);
      setLinkError("Une erreur est survenue lors de la liaison.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <NewUserAnnouncement />
        <LiveClock className="items-end" showDate={true} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('parent_dashboard')}</h1>
          <p className="text-gray-500 dark:text-gray-400">Suivez la scolarité de vos enfants en temps réel</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setLinkingChild(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            {t('link_child')}
          </button>
          {onNavigate && (
            <button 
              onClick={() => onNavigate('settings')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title={t('settings')}
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </div>

      {linkingChild && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('link_child')}</h2>
            <form onSubmit={handleLinkChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('child_matricule')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={matriculeToLink}
                    onChange={(e) => setMatriculeToLink(e.target.value)}
                    placeholder="Ex: 2023-001"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              {linkError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{linkError}</p>}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setLinkingChild(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  {t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Children Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            {t('my_children')}
          </h2>
          <div className="space-y-2">
            {children.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-sm text-gray-500">{t('no_student_in_class')}</p>
              </div>
            ) : (
              children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${
                    selectedChild?.id === child.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  {child.photo ? (
                    <img src={child.photo} alt={child.prenom} className="w-10 h-10 rounded-full object-cover border-2 border-white/20" referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedChild?.id === child.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                      {child.prenom[0]}
                    </div>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold truncate">{child.prenom} {child.nom}</p>
                    <p className={`text-xs truncate ${selectedChild?.id === child.id ? 'text-indigo-100' : 'text-gray-500'}`}>{child.classe}</p>
                  </div>
                  <ChevronRight size={18} className={selectedChild?.id === child.id ? 'text-white' : 'text-gray-400'} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Child Details */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChild ? (
            <div className="space-y-6">
              {/* Child Header Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {selectedChild.photo ? (
                      <img 
                        src={selectedChild.photo} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-indigo-50 dark:border-indigo-900/30 shadow-sm" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-indigo-950/30 dark:to-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-3xl font-black uppercase shadow-inner">
                        {selectedChild.prenom[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedChild.prenom} {selectedChild.nom}</h2>
                        {selectedChild.house_id && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                            🛡️ Membre Maison
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="px-3 py-1 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold border border-gray-100 dark:border-gray-700">
                          Classe : <strong className="text-indigo-600 dark:text-indigo-400">{selectedChild.classe}</strong>
                        </span>
                        <span className="px-3 py-1 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold border border-gray-100 dark:border-gray-700">
                          Matricule : <strong className="font-mono text-gray-900 dark:text-white">{selectedChild.matricule}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {childHouse && (
                    <div className="flex items-center gap-3.5 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
                      <div className="w-12 h-12 flex items-center justify-center text-2xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        {childHouse.logo?.startsWith('http') ? (
                          <img src={childHouse.logo} alt={childHouse.nom_maison} className="w-8 h-8 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        ) : (
                          childHouse.logo || '🏆'
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('house')}</p>
                        <p className="font-black text-gray-900 dark:text-white">{childHouse.nom_maison}</p>
                        <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                          <Sparkles size={12} />
                          {childHouse.total_points} pts
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub Tabs Bar */}
                <div className="mt-8 flex border-b border-gray-100 dark:border-gray-700/60 overflow-x-auto gap-2 scrollbar-none">
                  {[
                    { id: 'overview', name: "Vue d'ensemble", icon: Activity },
                    { id: 'grades', name: "Notes & Évaluations", icon: Award },
                    { id: 'timetable', name: "Emploi du temps", icon: Calendar },
                    { id: 'finance', name: "Suivi Financier", icon: CreditCard },
                    { id: 'attendance', name: "Présences", icon: Clock },
                    { id: 'homework', name: "Cahier de textes", icon: ListTodo },
                    { id: 'courses', name: "Cours & Leçons", icon: BookOpen }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <tab.icon size={15} />
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {detailsLoading && (
                <div className="p-12 flex justify-center items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Synchronisation en temps réel...</span>
                </div>
              )}

              {/* Tab Views */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* KPI cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-tr from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-gray-800 p-5 rounded-2xl border border-indigo-50 dark:border-indigo-950 shadow-sm">
                          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 mb-2">
                            <Award size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Moyenne</span>
                          </div>
                          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                            {calculateAverage(childGrades) > 0 ? calculateAverage(childGrades).toFixed(2) : '-'}
                            <span className="text-xs text-gray-400 font-medium">/20</span>
                          </p>
                        </div>

                        <div className="bg-gradient-to-tr from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800 p-5 rounded-2xl border border-emerald-50 dark:border-emerald-950 shadow-sm">
                          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-2">
                            <CheckCircle size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Présences</span>
                          </div>
                          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                            {Math.round(attendanceRate)}%
                          </p>
                        </div>

                        <div className="bg-gradient-to-tr from-amber-50/50 to-white dark:from-amber-950/20 dark:to-gray-800 p-5 rounded-2xl border border-amber-50 dark:border-amber-950 shadow-sm">
                          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-2">
                            <ListTodo size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Devoirs</span>
                          </div>
                          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                            {childHomework.filter(h => !h.completedBy?.includes(selectedChild.id)).length}
                            <span className="text-xs text-gray-400 font-medium"> à faire</span>
                          </p>
                        </div>

                        <div className="bg-gradient-to-tr from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-800 p-5 rounded-2xl border border-purple-50 dark:border-purple-950 shadow-sm">
                          <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 mb-2">
                            <BookOpen size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Leçons</span>
                          </div>
                          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                            {childCourses.length}
                            <span className="text-xs text-gray-400 font-medium"> cours</span>
                          </p>
                        </div>
                      </div>

                      {/* Evolution chart and Averages list split */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Evolution Card */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
                          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-600" />
                            Courbe d'évolution des notes
                          </h3>
                          <div className="h-[250px] w-full">
                            {evolutionData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={evolutionData}>
                                  <defs>
                                    <linearGradient id="colorParentScore" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#9ca3af' }} />
                                  <YAxis domain={[0, 20]} tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#9ca3af' }} />
                                  <Tooltip />
                                  <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorParentScore)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3 border-2 border-dashed border-gray-100 dark:border-gray-700/80 rounded-2xl">
                                <TrendingUp size={48} className="opacity-20 animate-pulse" />
                                <p className="text-xs font-semibold">Aucune note enregistrée pour le moment</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Average Sidebar */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-4">
                          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Award size={16} className="text-indigo-600" />
                            Moyennes de matières
                          </h3>
                          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {subjectAverages.length > 0 ? (
                              subjectAverages.map((sub, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[70%] capitalize">{sub.subject}</span>
                                    <span className={`${sub.average >= 12 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                      {sub.average.toFixed(2)}/20
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(sub.average / 20) * 100}%` }}
                                      className={`h-full rounded-full ${sub.average >= 12 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                      transition={{ duration: 1 }}
                                    />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-xs text-gray-400 py-6 italic">En attente des premières notes</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GRADES TAB */}
                  {activeTab === 'grades' && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700/80 flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white">Carnet de Notes Électronique</h3>
                          <p className="text-xs text-gray-400">Notes publiées par l'équipe enseignante</p>
                        </div>
                        <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          Moyenne Générale : <strong>{calculateAverage(childGrades) > 0 ? calculateAverage(childGrades).toFixed(2) : '-'} / 20</strong>
                        </div>
                      </div>

                      {childGrades.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                          <Award size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="font-semibold">Aucune note de contrôle ou d'examen n'a été saisie.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/50 dark:bg-gray-900/20 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700/50">
                                <th className="p-4 pl-6">Matière & Évaluation</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Note Obtenue</th>
                                <th className="p-4">Coefficient</th>
                                <th className="p-4 pr-6">Date d'évaluation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                              {childGrades.map((g) => (
                                <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors text-sm">
                                  <td className="p-4 pl-6">
                                    <div className="font-bold text-gray-900 dark:text-white capitalize">{g.subject}</div>
                                    <div className="text-xs text-gray-400 italic mt-0.5">{g.title || 'Deber de classe'}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      g.type === 'evaluation' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400'
                                    }`}>
                                      {g.type || 'Interro'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-black text-gray-900 dark:text-white">
                                      {g.score} <span className="text-xs text-gray-400 font-medium">/ {g.maxScore}</span>
                                    </div>
                                    {g.maxScore === 20 && (
                                      <div className="text-[10px] mt-0.5">
                                        {g.score >= 16 ? (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✨ Excellent</span>
                                        ) : g.score >= 12 ? (
                                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">👍 Satisfaisant</span>
                                        ) : g.score >= 10 ? (
                                          <span className="text-amber-600 dark:text-amber-400 font-semibold">📈 Moyen</span>
                                        ) : (
                                          <span className="text-red-500 font-semibold">⚠️ À retravailler</span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 font-mono font-bold text-gray-500">
                                    x{g.coefficient || 1}
                                  </td>
                                  <td className="p-4 pr-6 text-gray-500 text-xs">
                                    {g.date?.toDate ? g.date.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 
                                     (g.date ? new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ATTENDANCE TAB */}
                  {activeTab === 'attendance' && (
                    <div className="space-y-6">
                      {/* Attendance Breakdown Card */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">Présences</p>
                            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{presentsCount}</p>
                          </div>
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <CheckCircle2 size={24} />
                          </div>
                        </div>

                        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Retards</p>
                            <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{retardsCount}</p>
                          </div>
                          <div className="p-3 bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 rounded-xl">
                            <Clock size={24} />
                          </div>
                        </div>

                        <div className="bg-red-50/50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider mb-1">Absences</p>
                            <p className="text-2xl font-black text-red-900 dark:text-red-100">{absentsCount}</p>
                          </div>
                          <div className="p-3 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400 rounded-xl">
                            <AlertCircle size={24} />
                          </div>
                        </div>

                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-1">Total Signalements</p>
                            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{totalAttendance}</p>
                          </div>
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Activity size={24} />
                          </div>
                        </div>
                      </div>

                      {/* Detailed list */}
                      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700/80">
                          <h3 className="font-bold text-gray-900 dark:text-white">Registre de pointage en temps réel</h3>
                          <p className="text-xs text-gray-400 mt-1">Vérification de badge / carte d'accès d'entrée et de sortie de l'établissement</p>
                        </div>
                        {childAttendance.length === 0 ? (
                          <div className="p-16 text-center text-gray-400">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-semibold">Aucun pointage n'est enregistré pour le moment.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {childAttendance.map(record => (
                              <div key={record.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                                    record.statut === 'Présent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 
                                    record.statut === 'Retard' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' : 
                                    'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                  }`}>
                                    {record.statut === 'Présent' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 dark:text-white capitalize">
                                      {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Pointé par badge à {record.heure_arrivee || '08:00'}</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                  record.statut === 'Présent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' : 
                                  record.statut === 'Retard' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' : 
                                  'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                                }`}>
                                  {record.statut}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* HOMEWORK TAB */}
                  {activeTab === 'homework' && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700/80">
                        <h3 className="font-bold text-gray-900 dark:text-white">Cahier de Textes / Devoirs à rendre</h3>
                        <p className="text-xs text-gray-400 mt-1">Suivez l'avancement des devoirs assignés à la classe de votre enfant</p>
                      </div>

                      {childHomework.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                          <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="font-semibold">Aucun devoir programmé pour le moment.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {childHomework.map((hw) => {
                            const isCompleted = hw.completedBy?.includes(selectedChild.id);
                            return (
                              <div key={hw.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                      {hw.subject || 'Général'}
                                    </span>
                                    {hw.dueDate && (
                                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                        <Calendar size={12} />
                                        Pour le : {new Date(hw.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">{hw.title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{hw.description}</p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-center">
                                  {isCompleted ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                      <CheckCircle2 size={14} />
                                      Fait par l'élève
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                      <Clock size={14} />
                                      À faire
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* COURSES TAB */}
                  {activeTab === 'courses' && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700/80">
                        <h3 className="font-bold text-gray-900 dark:text-white">Leçons et Supports Pédagogiques</h3>
                        <p className="text-xs text-gray-400 mt-1">Ressources numériques officiellement publiées par les enseignants pour la classe</p>
                      </div>

                      {childCourses.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="font-semibold">Aucun cours disponible en ligne pour l'instant.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {childCourses.map((course) => (
                            <div key={course.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    {course.subject}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium">
                                    Publié le : {course.timestamp ? (course.timestamp.toDate ? course.timestamp.toDate().toLocaleDateString('fr-FR') : new Date(course.timestamp).toLocaleDateString('fr-FR')) : '-'}
                                  </span>
                                </div>
                              </div>
                              <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">{course.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{course.description}</p>
                              {course.file_url && (
                                <a 
                                  href={course.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 transition-colors"
                                >
                                  <FileText size={14} className="text-indigo-600" />
                                  Télécharger le cours PDF / Support
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TIMETABLE TAB */}
                  {activeTab === 'timetable' && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700/80 mb-6">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Emploi du Temps Hebdomadaire</h3>
                            <p className="text-xs text-gray-400 mt-1">Planning officiel des cours pour la classe : <strong className="text-indigo-600 dark:text-indigo-400 font-black">{selectedChild.classe || '6ème A'}</strong></p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-bold">
                            <Calendar size={14} />
                            Semaine en cours
                          </div>
                        </div>

                        {/* Schedule Table Grid */}
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                          <table className="w-full border-collapse text-left min-w-[850px]">
                            <thead>
                              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase w-40 text-center border-r border-gray-100 dark:border-gray-700">Heures / Plages</th>
                                {DAYS.map((day) => (
                                  <th key={day} className="py-4 px-4 text-xs font-black text-gray-900 dark:text-white text-center w-48 border-r last:border-none border-gray-100 dark:border-gray-700">
                                    {day}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {TIME_SLOTS.map((slot) => {
                                if (slot.isBreak) {
                                  return (
                                    <tr key={slot.id} className="bg-gray-50/40 dark:bg-gray-900/10 border-t border-b border-dashed border-gray-100 dark:border-gray-800">
                                      <td className="py-2.5 px-6 font-bold text-center border-r border-gray-100 dark:border-gray-700 text-[10px] text-indigo-600 uppercase">
                                        {slot.name}
                                      </td>
                                      <td colSpan={DAYS.length} className="py-2.5 text-center text-xs font-extrabold tracking-widest text-indigo-500 dark:text-indigo-400 bg-gray-50/60 dark:bg-gray-900/30">
                                        ⚡ RECRÉATION / PAUSE : {slot.label?.toUpperCase()} ⚡
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={slot.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/10 dark:hover:bg-gray-800/5 transition-all h-28">
                                    <td className="py-4 px-4 text-center border-r border-gray-100 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-900/5">
                                      <Clock size={14} className="text-gray-400 mx-auto mb-1.5 animate-pulse" />
                                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">{slot.name}</span>
                                    </td>
                                    {DAYS.map((day) => {
                                      // Get assignment for this cell
                                      const classAssignments = childAssignments.filter((a: any) => 
                                        (a.className && a.className.toLowerCase().trim() === (selectedChild.classe || '6ème a').toLowerCase().trim()) || 
                                        (a.classId && a.classId.toLowerCase().trim() === (selectedChild.classe || '6ème a').toLowerCase().trim())
                                      );
                                      
                                      const matchedAssignments = (classAssignments.length > 0 ? classAssignments : DEFAULT_ASSIGNMENTS.filter((a: any) => 
                                        a.className.toLowerCase().trim() === (selectedChild.classe || '6ème a').toLowerCase().trim()
                                      )).filter((a: any) => a.dayOfWeek === day && a.slotId === slot.id);

                                      return (
                                        <td key={`${day}-${slot.id}`} className="p-1.5 border-r last:border-none border-gray-100 dark:border-gray-700 relative">
                                          {matchedAssignments.length > 0 ? (
                                            matchedAssignments.map((assignment: any, i: number) => {
                                              const dynamicColor = assignment.color || COLORS[i % COLORS.length];
                                              return (
                                                <div
                                                  key={assignment.id || i}
                                                  className={`p-2.5 rounded-xl border text-xs h-full flex flex-col justify-between shadow-sm transition-transform hover:scale-[1.02] ${dynamicColor}`}
                                                >
                                                  <div>
                                                    <p className="font-black tracking-tight text-gray-900 dark:text-white truncate">{assignment.subject}</p>
                                                    <p className="text-[10px] opacity-80 font-semibold truncate mt-0.5 text-gray-600 dark:text-gray-300">
                                                      👤 {assignment.teacherName ? assignment.teacherName.split('(')[0].trim() : 'Enseignant'}
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-1 mt-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-black/20 px-2 py-0.5 rounded-md w-fit">
                                                    <span>🏫 {assignment.room || 'Salle N/A'}</span>
                                                  </div>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="h-full min-h-[50px] flex items-center justify-center text-[10px] text-gray-300 dark:text-gray-600 font-medium italic">
                                              -
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FINANCE TAB */}
                  {activeTab === 'finance' && (
                    <div className="space-y-6">
                      {/* Financial summary Cards */}
                      {(() => {
                        const fin = computeStudentFinance(selectedChild);
                        if (!fin) return null;
                        return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <CreditCard size={100} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Total Dû Scolarité</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white block">{formatCurrency(fin.totalDu)}</span>
                                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-gray-500">
                                  <span>Frais de scolarité & inscription rattachés</span>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <TrendingUp size={100} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 block mb-1">Total Réglé</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">{formatCurrency(fin.totalPaye)}</span>
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 size={12} />
                                  <span>{fin.percentPaid}% réglé</span>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <TrendingDown size={100} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 dark:text-red-400 block mb-1">Reste à Payer</span>
                                <span className={`text-xl font-black block ${fin.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(fin.balance)}</span>
                                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-gray-500">
                                  <span>{fin.balance > 0 ? 'Tranche(s) restante(s)' : 'Scolarité entièrement soldée'}</span>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <Clock size={100} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Dernier Versement</span>
                                <span className="text-base font-black text-gray-900 dark:text-white block truncate">
                                  {childPayments.length > 0 ? formatCurrency(parseFloat(childPayments[0].amount) || 0) : 'Aucun dépôt'}
                                </span>
                                <div className="flex items-center gap-1 mt-2.5 text-[10px] font-bold text-gray-400">
                                  <span>
                                    {childPayments.length > 0 
                                      ? `le ${childPayments[0].date?.toDate ? childPayments[0].date.toDate().toLocaleDateString('fr-FR') : new Date(childPayments[0].date || Date.now()).toLocaleDateString('fr-FR')}`
                                      : 'Aucun historique récent'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bulletins de scolarité & Trimestres Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left Panel: Échéancier de scolarité */}
                              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm p-6 space-y-5">
                                <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4">
                                  <h3 className="text-base font-black text-gray-900 dark:text-white">Échéances & Répartition des Frais</h3>
                                  <p className="text-xs text-gray-400 mt-1">Détails de l'état financier annuel par trimestre et nature de frais.</p>
                                </div>

                                <div className="space-y-3.5">
                                  {fin.feeDetails.map((fee: any) => {
                                    const percent = fee.amount > 0 ? Math.round((fee.paid / fee.amount) * 100) : 0;
                                    let statusBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
                                    let statusLabel = 'Non Payé';
                                    if (percent >= 100) {
                                      statusBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
                                      statusLabel = 'Soldé';
                                    } else if (percent > 0) {
                                      statusBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
                                      statusLabel = 'Partiel';
                                    }

                                    return (
                                      <div key={fee.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                          <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                              Rubrique : {fee.category === 'registration' ? "Droit d'Inscription" : fee.category === 'canteen' ? 'Cantine' : fee.category === 'transport' ? 'Transport' : 'Frais de Scolarité'}
                                            </span>
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{fee.name}</h4>
                                          </div>
                                          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border uppercase ${statusBg}`}>
                                            {statusLabel}
                                          </span>
                                        </div>

                                        <div className="space-y-1.5">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 font-semibold">Réglé : {formatCurrency(fee.paid)} / {formatCurrency(fee.amount)}</span>
                                            <span className="font-black text-gray-900 dark:text-white">{percent}%</span>
                                          </div>
                                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all duration-500 ${
                                                percent >= 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-600'
                                              }`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold pt-1">
                                          <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            Échéance de paiement : <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{fee.deadline}</strong>
                                          </span>
                                          {fee.balance > 0 && (
                                            <span className="text-rose-600 dark:text-rose-400 font-black">Reste dû : {formatCurrency(fee.balance)}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Right Panel: Rappels d'échéances et Notifications */}
                              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm p-6 space-y-5">
                                <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4">
                                  <h3 className="text-base font-black text-gray-900 dark:text-white">Rappels d'Échéances</h3>
                                  <p className="text-xs text-gray-400 mt-1">Alertes automatiques et informations importantes sur la facturation.</p>
                                </div>

                                <div className="space-y-4">
                                  {fin.balance > 0 ? (
                                    <div className="p-4 bg-amber-50/50 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/30 rounded-2xl flex gap-3">
                                      <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                                      <div className="space-y-1">
                                        <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Tranche en attente</h4>
                                        <p className="text-xs text-amber-700/90 dark:text-gray-300 leading-relaxed font-semibold">
                                          Un montant restant de <strong className="text-rose-600 dark:text-rose-400 font-black">{formatCurrency(fin.balance)}</strong> est dû pour clore l'année académique de <strong className="font-bold">{selectedChild.prenom}</strong>.
                                        </p>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                          ⚠️ Veuillez régulariser ce montant auprès de la comptabilité pour éviter tout retard d'examen.
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-2xl flex gap-3">
                                      <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={18} />
                                      <div className="space-y-1">
                                        <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Scolarité à jour !</h4>
                                        <p className="text-xs text-emerald-700/95 dark:text-gray-300 leading-relaxed font-semibold">
                                          Félicitations, l'ensemble des frais de scolarité pour <strong className="font-bold">{selectedChild.prenom}</strong> a été entièrement soldé auprès de la comptabilité.
                                        </p>
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                          ⚡ Merci pour votre confiance et votre ponctualité !
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="p-4 bg-indigo-50/30 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 rounded-2xl space-y-2">
                                    <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles size={13} className="text-indigo-500 animate-pulse" />
                                      Informations de Facturation
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                                      Tous les paiements doivent être effectués à la caisse de l'établissement par espèces, chèque ou par Mobile Money (Airtel Money, Moov Money, MTN, Orange Money) avec votre matricule de référence : <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedChild.matricule}</strong>.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Payments Receipts History Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden p-6">
                              <div className="pb-6 border-b border-gray-100 dark:border-gray-700/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <h3 className="text-base font-black text-gray-900 dark:text-white">Historique des Paiements & Reçus</h3>
                                  <p className="text-xs text-gray-400 mt-1">Reçus officiels de paiement émis par le service comptable.</p>
                                </div>
                              </div>

                              {childPayments.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                  <Receipt size={36} className="mx-auto mb-2 text-gray-300 dark:text-gray-600 animate-bounce" />
                                  <p className="text-xs font-bold italic">Aucun paiement enregistré pour l'instant dans le système.</p>
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                                  <table className="w-full border-collapse text-left min-w-[750px]">
                                    <thead>
                                      <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                        <th className="py-3.5 px-6 text-xs font-black text-gray-400 uppercase w-44">Date du Reçu</th>
                                        <th className="py-3.5 px-4 text-xs font-black text-gray-400 uppercase w-40">Référence</th>
                                        <th className="py-3.5 px-4 text-xs font-black text-gray-400 uppercase">Description / Rubrique</th>
                                        <th className="py-3.5 px-4 text-xs font-black text-gray-400 uppercase w-36 text-right">Montant</th>
                                        <th className="py-3.5 px-4 text-xs font-black text-gray-400 uppercase w-36">Mode</th>
                                        <th className="py-3.5 px-4 text-xs font-black text-gray-400 uppercase w-20 text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {childPayments.map((p: any) => {
                                        const paymentDate = p.date?.toDate 
                                          ? p.date.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                          : p.date 
                                            ? new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                            : new Date().toLocaleDateString('fr-FR');

                                        const typeLabels: Record<string, string> = {
                                          tuition: 'Scolarité Trimestrielle',
                                          registration: "Droits d'Inscription",
                                          canteen: 'Frais de Cantine',
                                          transport: 'Service de Transport',
                                          other: 'Frais Annexes / Divers'
                                        };

                                        return (
                                          <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/20 dark:hover:bg-gray-800/10 transition-colors">
                                            <td className="py-4 px-6 text-xs font-black text-gray-800 dark:text-gray-200">
                                              {paymentDate}
                                            </td>
                                            <td className="py-4 px-4 text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                                              {p.reference || `FAC-${p.id.slice(0, 6).toUpperCase()}`}
                                            </td>
                                            <td className="py-4 px-4 text-xs">
                                              <p className="font-black text-gray-900 dark:text-white">
                                                {typeLabels[p.type] || p.type}
                                              </p>
                                              {p.notes && (
                                                <p className="text-[10px] text-gray-400 font-semibold truncate max-w-xs mt-0.5">{p.notes}</p>
                                              )}
                                            </td>
                                            <td className="py-4 px-4 text-xs font-black text-gray-900 dark:text-white text-right">
                                              {formatCurrency(parseFloat(p.amount) || 0)}
                                            </td>
                                            <td className="py-4 px-4 text-xs font-semibold capitalize text-gray-600 dark:text-gray-300">
                                              {p.method === 'cash' ? '💵 Espèces' : p.method === 'card' ? '💳 Carte Bancaire' : p.method === 'transfer' ? '🏦 Virement' : `📱 Mobile Money (${p.method.toUpperCase()})`}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                              <button
                                                onClick={() => {
                                                  const formattedDateStr = p.date?.seconds 
                                                    ? new Date(p.date.seconds * 1000).toLocaleDateString('fr-FR', { dateStyle: 'long' })
                                                    : p.date?.toDate 
                                                      ? p.date.toDate().toLocaleDateString('fr-FR', { dateStyle: 'long' }) 
                                                      : new Date(p.date || Date.now()).toLocaleDateString('fr-FR', { dateStyle: 'long' });

                                                  generateReceiptPDF({
                                                    id: p.id,
                                                    reference: p.reference || `FAC-${p.id.slice(0,6).toUpperCase()}`,
                                                    date: formattedDateStr,
                                                    studentName: `${selectedChild.prenom || ''} ${selectedChild.nom || ''}`.trim(),
                                                    etablissement: p.etablissement || currentUser?.etablissement || 'EDU-001',
                                                    type: p.type,
                                                    method: p.method,
                                                    amount: parseFloat(p.amount) || 0,
                                                    notes: p.notes || "Paiement enregistré avec succès.",
                                                    recordedByName: p.recordedByName || 'Service Comptabilité'
                                                  }, { id: currentUser?.etablissement || 'EDU-001', nom: 'Établissement Scolaire' } as any);
                                                }}
                                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg transition-colors flex items-center justify-center gap-1 font-bold text-[10px] mx-auto uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                                                title="Télécharger le reçu PDF"
                                              >
                                                <Download size={12} />
                                                Reçu
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                <UserIcon size={44} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Sélectionnez un de vos enfants</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                Choisissez un élève dans la liste de gauche pour consulter l'intégralité de sa scolarité, ses cours, ses devoirs, et ses notes en temps réel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
