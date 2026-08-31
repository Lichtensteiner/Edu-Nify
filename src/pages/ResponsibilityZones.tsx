import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Baby, 
  BookOpen, 
  GraduationCap, 
  Wallet, 
  Users, 
  ShieldAlert, 
  Eye, 
  Check, 
  Trash2, 
  Plus, 
  FileText, 
  Calendar, 
  Laptop, 
  Clock, 
  Key, 
  Activity, 
  Sparkles, 
  FileCheck, 
  Phone, 
  Search, 
  TrendingUp, 
  CheckSquare, 
  AlertTriangle,
  Heart,
  FileBadge,
  Sparkle,
  School,
  Award,
  Building2,
  UserCheck,
  Compass,
  BookmarkCheck,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth, mapPositionToResponsibility } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { administrativeResponsibilities } from './Staff';
import { getSystemConfig } from '../constants/educationalSystems';

export default function ResponsibilityZones() {
  const { currentUser } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const { t, tData } = useLanguage();
  const { notifySuccess, notifyError } = useNotification();

  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';
  const systemConfig = getSystemConfig(currentEstablishment?.systemeScolaire);

  // All administrative responsibility IDs that are available
  const availableResponsibilityIds = useMemo(() => {
    return administrativeResponsibilities.map(r => r.id);
  }, []);

  const getResponsibilityIcon = (id: string) => {
    switch (id) {
      case 'responsable_maternelle': return Baby;
      case 'responsable_primaire': return BookOpen;
      case 'responsable_college': return GraduationCap;
      case 'responsable_lycee': return School;
      case 'gestionnaire_comptable': return Wallet;
      case 'responsable_pedagogique': return FileCheck;
      case 'surveillant_general': return ShieldAlert;
      case 'surveillant_adjoint': return Clock;
      case 'dame_menage': return Sparkle;
      case 'secretaire_generale': return FileText;
      case 'secretaire_adjointe': return Phone;
      case 'responsable_it': return Laptop;
      default: return ShieldCheck;
    }
  };

  // Check which responsibilities are active for the logged-in user
  // If admin, they can manage and view ALL 11 responsibilities dynamically
  const isGlobalAdmin = currentUser?.role === 'admin';
  const responsibilitiesString = (currentUser?.responsibilities || []).join(',');
  
  const accessibleResponsibilityIds = React.useMemo(() => {
    // If the user has explicit responsibilities or an administrative position, we restrict them strictly to that!
    // This satisfies "le rôle de responsabilité de chaque user soit dans sa section bureau direction... rien que sa section"
    const configured = currentUser?.responsibilities || [];
    const fromPosition = currentUser?.position ? mapPositionToResponsibility(currentUser.position) : [];
    const combined = Array.from(new Set([...configured, ...fromPosition]));

    if (combined.length > 0) {
      return combined;
    }

    if (isGlobalAdmin) {
      return availableResponsibilityIds;
    }

    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobalAdmin, availableResponsibilityIds, responsibilitiesString, currentUser?.position]);

  const [activeRespId, setActiveRespId] = useState<string>('');

  const hasExplicitResponsibility = (respId: string): boolean => {
    const configured = currentUser?.responsibilities || [];
    const fromPosition = currentUser?.position ? mapPositionToResponsibility(currentUser.position) : [];
    return configured.includes(respId) || fromPosition.includes(respId);
  };

  const canWrite = (respId: string): boolean => {
    return hasExplicitResponsibility(respId) || isGlobalAdmin;
  };

  const enforcePermission = (respId: string): boolean => {
    if (canWrite(respId)) {
      return true;
    }
    notifyError("Sécurité : Droits d'écriture réservés au responsable titulaire de ce service.");
    return false;
  };

  const getSecurityBadge = (respId: string) => {
    const hasExplicit = hasExplicitResponsibility(respId);

    if (hasExplicit) {
      return (
        <div className="bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/40 flex items-center gap-3 shadow-sm border-dashed">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">Accréditation Active & Sécurisée</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              Vous pilotez ce service en tant que Responsable Titulaire. Vos droits d'ajout, modification et suppression sont exclusifs.
            </p>
          </div>
        </div>
      );
    }

    if (isGlobalAdmin) {
      return (
        <div className="bg-indigo-50 dark:bg-indigo-950/25 text-indigo-700 dark:text-indigo-400 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-800/40 flex items-center gap-3 shadow-sm border-dashed">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl text-indigo-650 dark:text-indigo-400">
            <Eye size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">Mode Supervision Directeur</p>
            <p className="text-[10px] text-indigo-650/80 dark:text-indigo-400/80 mt-0.5">
              Supervision Générale : Vous visualisez et modifiez les registres en vertu de vos accréditations d'Administrateur Général.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-400 p-4 rounded-3xl border border-amber-100 dark:border-amber-800/40 flex items-center gap-3 shadow-sm border-dashed">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-500">
          <Key size={20} className="animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider">Lecture Seule (Accès Limité Sûr)</p>
          <p className="text-[10px] text-amber-655/80 dark:text-amber-400/80 mt-0.5">
            Sécurisation Ordonnée : Séance de consultation uniquement. Les droits de mise à jour, de modification ou d'insertion sont désactivés.
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (accessibleResponsibilityIds.length > 0) {
      if (!activeRespId || !accessibleResponsibilityIds.includes(activeRespId)) {
        setActiveRespId(accessibleResponsibilityIds[0]);
      }
    } else {
      setActiveRespId('');
    }
  }, [accessibleResponsibilityIds, activeRespId]);

  // Real-time states for Maternelle
  const [siestas, setSiestas] = useState<Array<{id: string, name: string, classroom: string, status: 'awake' | 'sleeping' | 'resting', etablissement?: string}>>([]);
  const [maternelleTransmissions, setMaternelleTransmissions] = useState<Array<{id: string, kidName: string, notes: string, bottles: number, date: string, etablissement?: string}>>([]);

  // Subscribe to real-time Firestore updates for Maternelle
  useEffect(() => {
    if (!accessibleResponsibilityIds.includes('responsable_maternelle')) return;

    const unsubSiestas = onSnapshot(collection(db, 'maternelle_siestas'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().name,
          classroom: doc.data().classroom,
          status: doc.data().status as 'awake' | 'sleeping' | 'resting',
          etablissement: doc.data().etablissement || 'EDU-001'
        }))
        .filter(item => item.etablissement === activeEstId);

      if (data.length === 0 && snapshot.empty) {
        // Bootstrap default siestas if collection is totally empty
        const defaults = [
          { name: 'Léo Martin', classroom: 'Petite Section A', status: 'resting', etablissement: activeEstId },
          { name: 'Mia Kouao', classroom: 'Moyenne Section B', status: 'sleeping', etablissement: activeEstId },
          { name: 'Noé Dupont', classroom: 'Petite Section A', status: 'awake', etablissement: activeEstId },
        ];
        defaults.forEach(async (item) => {
          await addDoc(collection(db, 'maternelle_siestas'), item);
        });
      } else {
        setSiestas(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'maternelle_siestas');
    });

    const unsubTransmissions = onSnapshot(collection(db, 'maternelle_transmissions'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          kidName: doc.data().kidName,
          notes: doc.data().notes,
          bottles: Number(doc.data().bottles || 0),
          date: doc.data().date,
          etablissement: doc.data().etablissement || 'EDU-001'
        }))
        .filter(item => item.etablissement === activeEstId);

      if (data.length === 0 && snapshot.empty) {
        // Bootstrap default transmissions if collection is empty
        const defaults = [
          { kidName: 'Léo Martin', notes: 'A bien mangé à midi. Sieste calme de 1h30.', bottles: 2, date: 'Aujourd\'hui', etablissement: activeEstId }
        ];
        defaults.forEach(async (item) => {
          await addDoc(collection(db, 'maternelle_transmissions'), item);
        });
      } else {
        setMaternelleTransmissions(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'maternelle_transmissions');
    });

    return () => {
      unsubSiestas();
      unsubTransmissions();
    };
  }, [accessibleResponsibilityIds, activeEstId]);

  // 2. Reading Challenge (Primaire) state
  const [readingProgress, setReadingProgress] = useState<Array<{id: string, name: string, booksRead: number, goal: number, rating: string}>>([]);
  const [primaryFieldTrips, setPrimaryFieldTrips] = useState<Array<{id: string, destination: string, date: string, status: 'approved' | 'pending' | 'rejected'}>>([]);

  // 3. College (Detentions & Brevet Chapters)
  const [collegeDetentions, setCollegeDetentions] = useState<Array<{id: string, student: string, reason: string, teacher: string, date: string, hour: string, proctor: string}>>([]);
  const [brevetChapters, setBrevetChapters] = useState<Array<{id: string, subject: string, topic: string, status: 'ready' | 'pending'}>>([]);

  // 3b. Lycée / Proviseur state (6ème en Terminale / 2nde en Terminale)
  const [mockExams, setMockExams] = useState<Array<{
    id: string;
    name: string;
    serie: string;
    date: string;
    targetClass: string;
    status: 'planned' | 'in_progress' | 'graded' | 'published';
    supervisor: string;
    etablissement?: string;
  }>>([]);
  const [classCouncils, setClassCouncils] = useState<Array<{
    id: string;
    className: string;
    president: string;
    date: string;
    status: 'scheduled' | 'completed';
    honors: number;
    warnings: number;
    remarks: string;
    etablissement?: string;
  }>>([]);
  const [postBacWishes, setPostBacWishes] = useState<Array<{
    id: string;
    studentName: string;
    serie: string;
    targetProgram: string;
    proviseurAdvice: 'Tres Favorable' | 'Favorable' | 'Reserve';
    status: 'submitted' | 'validated';
    date: string;
    etablissement?: string;
  }>>([]);
  const [lyceeDiscipline, setLyceeDiscipline] = useState<Array<{
    id: string;
    studentName: string;
    className: string;
    motif: string;
    sanction: string;
    date: string;
    etablissement?: string;
  }>>([]);

  // 4. Comptabilité Ledger Flow (Cash Flow ledger)
  const [accountingFlows, setAccountingFlows] = useState<Array<{id: string, type: 'inflow' | 'outflow', category: string, amount: number, description: string, date: string, isCanteen?: boolean}>>([]);

  // Database-synced states for real-time validation & dropdown selects
  const [allEstablishmentUsers, setAllEstablishmentUsers] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbSurveillants, setDbSurveillants] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [canteenTransactions, setCanteenTransactions] = useState<any[]>([]);

  // 5. Pedagogique checks
  const [remedialGroups, setRemedialGroups] = useState<Array<{id: string, studentName: string, subject: string, level: string, date: string}>>([]);
  const [syllabusRates, setSyllabusRates] = useState<Array<{id: string, course: string, teacher: string, rate: number}>>([]);

  // 6. Surveillant Général
  const [lateSlips, setLateSlips] = useState<Array<{id: string, studentName: string, duration: number, reason: string, date: string, hasTicket: boolean}>>([]);

  // 7. Surveillant Adjoint
  const [visitorsLog, setVisitorsLog] = useState<Array<{id: string, visitorName: string, reason: string, targetPerson: string, entryTime: string, status: 'inside' | 'left'}>>([]);
  const [lockerKeys, setLockerKeys] = useState<Array<{id: string, lockerNo: string, student: string, date: string, returned: boolean}>>([]);

  // 8. Dame de ménage
  const [cleanZones, setCleanZones] = useState<Array<{id: string, zone: string, frequency: string, lastCleaned: string, status: 'cleaned' | 'pending'}>>([]);
  const [cleaningSupplies, setCleaningSupplies] = useState<Array<{id: string, item: string, stock: number, limit: number}>>([]);

  // 9. Secrétaire Générale
  const [dossiers, setDossiers] = useState<Array<{id: string, name: string, level: string, originSchool: string, status: 'pending' | 'accepted' | 'rejected'}>>([]);
  const [secTasks, setSecTasks] = useState<Array<{id: string, title: string, description: string, dueDate: string, priority: 'low' | 'medium' | 'high', scope: 'Secrétariat Général' | 'Bureau Direction', completed: boolean}>>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'sec' | 'dir'>('all');

  // 10. Secrétaire Adjointe
  const [phoneCalls, setPhoneCalls] = useState<Array<{id: string, caller: string, message: string, targetStudent: string, status: 'noted' | 'relayed'}>>([]);

  // 11. IT Admin
  const [itLoans, setItLoans] = useState<Array<{id: string, cartId: string, classTarget: string, duration: string, status: 'borrowed' | 'returned'}>>([]);
  const [itTickets, setItTickets] = useState<Array<{id: string, item: string, description: string, severity: 'minor' | 'critical', status: 'open' | 'investigating' | 'resolved'}>>([]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // 2. Reading Challenge progress
    if (accessibleResponsibilityIds.includes('responsable_primaire')) {
      const unsubRp = onSnapshot(collection(db, 'resp_reading_progress'), (snapshot) => {
        setReadingProgress(snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          booksRead: Number(doc.data().booksRead || 0),
          goal: Number(doc.data().goal || 8),
          rating: doc.data().rating || 'En progrès'
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_reading_progress'));
      unsubs.push(unsubRp);

      // Primary Field Trips
      const unsubFt = onSnapshot(collection(db, 'resp_field_trips'), (snapshot) => {
        setPrimaryFieldTrips(snapshot.docs.map(doc => ({
          id: doc.id,
          destination: doc.data().destination || '',
          date: doc.data().date || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_field_trips'));
      unsubs.push(unsubFt);
    }

    // 3. College Detentions
    if (accessibleResponsibilityIds.includes('responsable_college')) {
      const unsubDet = onSnapshot(collection(db, 'resp_college_detentions'), (snapshot) => {
        setCollegeDetentions(snapshot.docs.map(doc => ({
          id: doc.id,
          student: doc.data().student || '',
          reason: doc.data().reason || '',
          teacher: doc.data().teacher || '',
          date: doc.data().date || '',
          hour: doc.data().hour || '',
          proctor: doc.data().proctor || ''
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_college_detentions'));
      unsubs.push(unsubDet);

      // Brevet Chapters
      const unsubChapters = onSnapshot(collection(db, 'resp_brevet_chapters'), (snapshot) => {
        setBrevetChapters(snapshot.docs.map(doc => ({
          id: doc.id,
          subject: doc.data().subject || '',
          topic: doc.data().topic || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_brevet_chapters'));
      unsubs.push(unsubChapters);
    }

    // 3b. Lycée / Proviseur Subscriptions
    if (accessibleResponsibilityIds.includes('responsable_lycee')) {
      const unsubExams = onSnapshot(collection(db, 'resp_lycee_mock_exams'), (snapshot) => {
        const list = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(e => (e.etablissement || 'EDU-001') === activeEstId);
        setMockExams(list);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_lycee_mock_exams'));
      unsubs.push(unsubExams);

      const unsubCouncils = onSnapshot(collection(db, 'resp_lycee_councils'), (snapshot) => {
        const list = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(c => (c.etablissement || 'EDU-001') === activeEstId);
        setClassCouncils(list);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_lycee_councils'));
      unsubs.push(unsubCouncils);

      const unsubPostBac = onSnapshot(collection(db, 'resp_lycee_postbac'), (snapshot) => {
        const list = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(p => (p.etablissement || 'EDU-001') === activeEstId);
        setPostBacWishes(list);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_lycee_postbac'));
      unsubs.push(unsubPostBac);

      const unsubDisc = onSnapshot(collection(db, 'resp_lycee_discipline'), (snapshot) => {
        const list = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(d => (d.etablissement || 'EDU-001') === activeEstId);
        setLyceeDiscipline(list);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_lycee_discipline'));
      unsubs.push(unsubDisc);
    }

    // Remedial Groups
    if (accessibleResponsibilityIds.includes('responsable_pedagogique')) {
      const unsubRem = onSnapshot(collection(db, 'resp_remedial_groups'), (snapshot) => {
        setRemedialGroups(snapshot.docs.map(doc => ({
          id: doc.id,
          studentName: doc.data().studentName || '',
          subject: doc.data().subject || '',
          level: doc.data().level || '',
          date: doc.data().date || ''
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_remedial_groups'));
      unsubs.push(unsubRem);

      // Syllabus Rates
      const unsubSyllabus = onSnapshot(collection(db, 'resp_syllabus_rates'), (snapshot) => {
        setSyllabusRates(snapshot.docs.map(doc => ({
          id: doc.id,
          course: doc.data().course || '',
          teacher: doc.data().teacher || '',
          rate: Number(doc.data().rate || 0)
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_syllabus_rates'));
      unsubs.push(unsubSyllabus);
    }

    // Late Slips
    if (accessibleResponsibilityIds.includes('surveillant_general')) {
      const unsubLates = onSnapshot(collection(db, 'resp_late_slips'), (snapshot) => {
        setLateSlips(snapshot.docs.map(doc => ({
          id: doc.id,
          studentName: doc.data().studentName || '',
          duration: Number(doc.data().duration || 0),
          reason: doc.data().reason || '',
          date: doc.data().date || '',
          hasTicket: !!doc.data().hasTicket
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_late_slips'));
      unsubs.push(unsubLates);
    }

    // Visitors Log
    if (accessibleResponsibilityIds.includes('surveillant_adjoint')) {
      const unsubVisitors = onSnapshot(collection(db, 'resp_visitors_log'), (snapshot) => {
        setVisitorsLog(snapshot.docs.map(doc => ({
          id: doc.id,
          visitorName: doc.data().visitorName || '',
          reason: doc.data().reason || '',
          targetPerson: doc.data().targetPerson || '',
          entryTime: doc.data().entryTime || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_visitors_log'));
      unsubs.push(unsubVisitors);

      // Locker Keys
      const unsubLocker = onSnapshot(collection(db, 'resp_locker_keys'), (snapshot) => {
        setLockerKeys(snapshot.docs.map(doc => ({
          id: doc.id,
          lockerNo: doc.data().lockerNo || '',
          student: doc.data().student || '',
          date: doc.data().date || '',
          returned: !!doc.data().returned
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_locker_keys'));
      unsubs.push(unsubLocker);
    }

    // Clean zones
    if (accessibleResponsibilityIds.includes('dame_menage')) {
      const unsubClean = onSnapshot(collection(db, 'resp_clean_zones'), (snapshot) => {
        setCleanZones(snapshot.docs.map(doc => ({
          id: doc.id,
          zone: doc.data().zone || '',
          frequency: doc.data().frequency || '',
          lastCleaned: doc.data().lastCleaned || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_clean_zones'));
      unsubs.push(unsubClean);

      // Cleaning Supplies
      const unsubSupplies = onSnapshot(collection(db, 'resp_cleaning_supplies'), (snapshot) => {
        setCleaningSupplies(snapshot.docs.map(doc => ({
          id: doc.id,
          item: doc.data().item || '',
          stock: Number(doc.data().stock || 0),
          limit: Number(doc.data().limit || 0)
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_cleaning_supplies'));
      unsubs.push(unsubSupplies);
    }

    // Dossiers & Secretary Tasks (Secrétaire Générale & Target managers)
    if (accessibleResponsibilityIds.some(id => ['secretaire_generale', 'responsable_pedagogique', 'responsable_maternelle', 'responsable_college', 'responsable_primaire', 'responsable_it'].includes(id))) {
      const unsubDos = onSnapshot(collection(db, 'resp_dossiers'), (snapshot) => {
        setDossiers(snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          level: doc.data().level || '',
          originSchool: doc.data().originSchool || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_dossiers'));
      unsubs.push(unsubDos);

      const unsubTasks = onSnapshot(collection(db, 'resp_secretaire_tasks'), (snapshot) => {
        setSecTasks(snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '',
          description: doc.data().description || '',
          dueDate: doc.data().dueDate || '',
          priority: doc.data().priority || 'medium',
          scope: doc.data().scope || 'Bureau Direction',
          completed: !!doc.data().completed
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_secretaire_tasks'));
      unsubs.push(unsubTasks);
    }

    // Phone Calls (Secrétaire Adjointe)
    if (accessibleResponsibilityIds.includes('secretaire_adjointe')) {
      const unsubCalls = onSnapshot(collection(db, 'resp_phone_calls'), (snapshot) => {
        setPhoneCalls(snapshot.docs.map(doc => ({
          id: doc.id,
          caller: doc.data().caller || '',
          message: doc.data().message || '',
          targetStudent: doc.data().targetStudent || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_phone_calls'));
      unsubs.push(unsubCalls);
    }

    // IT Loans & Tickets
    if (accessibleResponsibilityIds.includes('responsable_it')) {
      const unsubLoans = onSnapshot(collection(db, 'resp_it_loans'), (snapshot) => {
        setItLoans(snapshot.docs.map(doc => ({
          id: doc.id,
          cartId: doc.data().cartId || '',
          classTarget: doc.data().classTarget || '',
          duration: doc.data().duration || '',
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_it_loans'));
      unsubs.push(unsubLoans);

      // IT Tickets
      const unsubTickets = onSnapshot(collection(db, 'resp_it_tickets'), (snapshot) => {
        setItTickets(snapshot.docs.map(doc => ({
          id: doc.id,
          item: doc.data().item || '',
          description: doc.data().description || '',
          severity: doc.data().severity as any,
          status: doc.data().status as any
        })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'resp_it_tickets'));
      unsubs.push(unsubTickets);
    }

    // Subscriptions to core collections (users, subjects, classes, payments, canteen_transactions) for real-time validation dropdowns
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => (u.etablissement || 'EDU-001') === activeEstId);
      const students = allUsers.filter((u: any) => u.role === 'élève' || u.role === 'eleve');
      let surveillants = allUsers.filter((u: any) => 
        u.role === 'surveillant' || 
        u.role === 'surveillant_general' || 
        u.role === 'surveillant_adjoint' ||
        (u.responsibilities && (
          u.responsibilities.includes('surveillant_general') || 
          u.responsibilities.includes('surveillant_adjoint') ||
          u.responsibilities.includes('surveillant')
        )) ||
        u.responsabilite === 'surveillant' ||
        u.position?.toLowerCase().includes('surveillant')
      );
      if (surveillants.length === 0) {
        surveillants = allUsers.filter((u: any) => 
          u.role === 'admin' || 
          u.role === 'enseignant' || 
          u.role === 'personnel administratif' || 
          u.role === 'personnel'
        );
      }
      setDbStudents(students);
      setDbSurveillants(surveillants);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));
    unsubs.push(unsubUsers);

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subs = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => doc.data().name as string)
        .filter(Boolean);
      setDbSubjects(subs);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'subjects'));
    unsubs.push(unsubSubjects);

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => (c.etablissement || 'EDU-001') === activeEstId);
      setDbClasses(classesData);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'classes'));
    unsubs.push(unsubClasses);

    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const payData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => (p.etablissement || 'EDU-001') === activeEstId);
      setPayments(payData);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'payments'));
    unsubs.push(unsubPayments);

    const unsubCanteen = onSnapshot(collection(db, 'canteen_transactions'), (snapshot) => {
      const transData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => (c.etablissement || 'EDU-001') === activeEstId);
      setCanteenTransactions(transData);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'canteen_transactions'));
    unsubs.push(unsubCanteen);

    return () => {
      unsubs.forEach(cleanup => cleanup());
    };
  }, [accessibleResponsibilityIds, activeEstId]);

  // Dynamic Real-time compute of Ledger Flows for the Accountant responsibility
  useEffect(() => {
    const combinedFlows: Array<{id: string, type: 'inflow' | 'outflow', category: string, amount: number, description: string, date: string, isCanteen?: boolean}> = [];

    // Map payments to cash flows
    payments.forEach(p => {
      const isOutflow = Number(p.amount || 0) < 0;
      const amt = Math.abs(Number(p.amount || 0));
      
      const catLabel = p.type === 'tuition' ? 'Écolages' :
                       p.type === 'registration' ? 'Inscription' :
                       p.type === 'canteen' ? 'Cantine' :
                       p.type === 'transport' ? 'Transport' : 'Autre';

      let dateStr = 'À l\'instant';
      if (p.date?.toDate) {
        const d = p.date.toDate();
        dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      } else if (p.date && typeof p.date === 'string') {
        dateStr = p.date;
      }

      combinedFlows.push({
        id: p.id,
        type: isOutflow ? 'outflow' : 'inflow',
        category: catLabel,
        amount: amt,
        description: p.notes || p.studentName || 'Transactions Réelles',
        date: dateStr,
        isCanteen: false
      });
    });

    // Map canteen transactions to cash flows
    canteenTransactions.forEach(t => {
      if (t.type === 'topup') {
        const student = dbStudents.find(s => s.id === t.userId);
        const name = student ? `${student.prenom} ${student.nom}` : 'Utilisateur Cantine';

        let dateStr = 'À l\'instant';
        if (t.timestamp?.toDate) {
          const d = t.timestamp.toDate();
          dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        } else if (t.timestamp && typeof t.timestamp === 'string') {
          dateStr = t.timestamp;
        }

        combinedFlows.push({
          id: t.id,
          type: 'inflow',
          category: 'Cantine',
          amount: Number(t.amount || 0),
          description: `Recharge cantine - ${name}`,
          date: dateStr,
          isCanteen: true
        });
      }
    });

    // Sort flows by ID (descending) so newest is on top
    combinedFlows.sort((a, b) => b.id.localeCompare(a.id));

    setAccountingFlows(combinedFlows);
  }, [payments, canteenTransactions, dbStudents]);

  // Form states
  const [maternelleFormType, setMaternelleFormType] = useState<'transmission' | 'siesta'>('transmission');
  const [formKidName, setFormKidName] = useState('');
  const [formKidClassroom, setFormKidClassroom] = useState('Petite Section');
  const [formNotesText, setFormNotesText] = useState('');
  const [formKidBottles, setFormKidBottles] = useState('2');
  const [formSiestaStatus, setFormSiestaStatus] = useState<'awake' | 'resting' | 'sleeping'>('sleeping');
  
  const [formReadingName, setFormReadingName] = useState('');
  const [formReadingLevel, setFormReadingLevel] = useState('En progrès');
  
  const [formDetStudent, setFormDetStudent] = useState('');
  const [formDetReason, setFormDetReason] = useState('');
  const [formDetProctor, setFormDetProctor] = useState('');
  
  const [formLedgerType, setFormLedgerType] = useState<'inflow' | 'outflow'>('inflow');
  const [formLedgerPrice, setFormLedgerPrice] = useState('');
  const [formLedgerDesc, setFormLedgerDesc] = useState('');
  const [formLedgerCategory, setFormLedgerCategory] = useState('Écolages');

  const [formRemedialStudent, setFormRemedialStudent] = useState('');
  const [formRemedialSubject, setFormRemedialSubject] = useState('Mathématiques');
  const [formRemedialLevel, setFormRemedialLevel] = useState('3ème B');

  const [formLateName, setFormLateName] = useState('');
  const [formLateDuration, setFormLateDuration] = useState('15');
  const [formLateReason, setFormLateReason] = useState('');

  const [formVisitorName, setFormVisitorName] = useState('');
  const [formVisitorReason, setFormVisitorReason] = useState('');
  const [formVisitorTarget, setFormVisitorTarget] = useState('');

  const [formLockerNo, setFormLockerNo] = useState('');
  const [formLockerStudent, setFormLockerStudent] = useState('');

  const [formITItem, setFormITItem] = useState('');
  const [formITDesc, setFormITDesc] = useState('');
  const [formITSeverity, setFormITSeverity] = useState<'minor' | 'critical'>('minor');

  // New Form states for College Brevet and IT equip loans
  const [collegeFormType, setCollegeFormType] = useState<'detention' | 'brevet'>('detention');
  const [formBrevetSubject, setFormBrevetSubject] = useState('');
  const [formBrevetTopic, setFormBrevetTopic] = useState('');

  const [itFormType, setItFormType] = useState<'incident' | 'loan'>('incident');
  const [formITLoanCart, setFormITLoanCart] = useState('');
  const [formITLoanClass, setFormITLoanClass] = useState('');
  const [formITLoanDuration, setFormITLoanDuration] = useState('1 Cours (Mardi 10h)');

  const [formDocName, setFormDocName] = useState('');
  const [formDocLevel, setFormDocLevel] = useState('Responsable Pédagogique');
  const [formDocOrigin, setFormDocOrigin] = useState('');
  const [secFormType, setSecFormType] = useState<'dossier' | 'task'>('dossier');
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formTaskDesc, setFormTaskDesc] = useState('');
  const [formTaskDueDate, setFormTaskDueDate] = useState('');
  const [formTaskPriority, setFormTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formTaskScope, setFormTaskScope] = useState<'Secrétariat Général' | 'Bureau Direction'>('Bureau Direction');

  const [formCallCaller, setFormCallCaller] = useState('');
  const [formCallMsg, setFormCallMsg] = useState('');
  const [formCallStudent, setFormCallStudent] = useState('');

  // Lycée / Proviseur interactive form states
  const [lyceeFormType, setLyceeFormType] = useState<'exam' | 'council' | 'postbac' | 'discipline'>('exam');
  const [formExamName, setFormExamName] = useState('');
  const [formExamSerie, setFormExamSerie] = useState('Terminale Générale / BAC');
  const [formExamClass, setFormExamClass] = useState('');
  const [formExamDate, setFormExamDate] = useState('');
  const [formExamSupervisor, setFormExamSupervisor] = useState('');

  const [formCouncilClass, setFormCouncilClass] = useState('');
  const [formCouncilPresident, setFormCouncilPresident] = useState('Proviseur / Responsable Lycée');
  const [formCouncilDate, setFormCouncilDate] = useState('');
  const [formCouncilHonors, setFormCouncilHonors] = useState('0');
  const [formCouncilWarnings, setFormCouncilWarnings] = useState('0');
  const [formCouncilRemarks, setFormCouncilRemarks] = useState('');

  const [formPostBacStudent, setFormPostBacStudent] = useState('');
  const [formPostBacSerie, setFormPostBacSerie] = useState('Terminale S / Scientifique');
  const [formPostBacTarget, setFormPostBacTarget] = useState('CPGE / Université / Grandes Écoles');
  const [formPostBacAdvice, setFormPostBacAdvice] = useState<'Tres Favorable' | 'Favorable' | 'Reserve'>('Tres Favorable');

  const [formDiscStudent, setFormDiscStudent] = useState('');
  const [formDiscClass, setFormDiscClass] = useState('');
  const [formDiscMotif, setFormDiscMotif] = useState('');
  const [formDiscSanction, setFormDiscSanction] = useState('Avertissement solennel du Proviseur');

  const renderAssignedTasksAndDossiers = (scopeName: string) => {
    const isMatch = (target: string) => {
      if (!target) return false;
      if (target === scopeName) return true;
      if (scopeName.toLowerCase().includes('lyc') && (target.toLowerCase().includes('lyc') || target.toLowerCase().includes('proviseur'))) return true;
      if (scopeName.toLowerCase().includes('maternelle') && target.toLowerCase().includes('maternelle')) return true;
      if (scopeName.toLowerCase().includes('primaire') && target.toLowerCase().includes('primaire')) return true;
      if (scopeName.toLowerCase().includes('coll') && target.toLowerCase().includes('coll')) return true;
      if (scopeName.toLowerCase().includes('direction') && target.toLowerCase().includes('direction')) return true;
      return false;
    };

    const assignedTasks = secTasks.filter(t => isMatch(t.scope) || (scopeName.includes('Direction') && t.scope === 'Bureau Direction'));
    const assignedDossiers = dossiers.filter(d => isMatch(d.level) || (scopeName.includes('Direction') && d.level === 'Bureau Direction'));

    if (assignedTasks.length === 0 && assignedDossiers.length === 0) {
      return null;
    }

    return (
      <div className="mt-6 pt-6 border-t border-gray-155 dark:border-gray-700/60 space-y-4 text-left">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
            Suivi Secrétariat Général (Temps Réel)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assigned Tasks */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Tâches assignées par le SG ({assignedTasks.length})</p>
            {assignedTasks.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic p-3 bg-gray-55/50 dark:bg-gray-900/10 rounded-xl border border-dashed dark:border-gray-800">
                Aucune tâche en cours
              </p>
            ) : (
              <div className="space-y-2">
                {assignedTasks.map(task => (
                  <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-750 flex items-center justify-between gap-2 text-left">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'resp_secretaire_tasks', task.id), {
                              completed: !task.completed
                            });
                            notifySuccess("Statut de la tâche mis à jour !");
                          } catch (error) {
                            console.error("Error updating task status:", error);
                          }
                        }}
                        className="mt-0.5 text-purple-650 hover:opacity-85 transition-opacity cursor-pointer flex-shrink-0"
                      >
                        <CheckSquare 
                          size={16} 
                          className={`transition-all ${task.completed ? 'text-emerald-500 fill-emerald-500/10' : 'text-gray-400'}`} 
                        />
                      </button>
                      <div>
                        <p className={`text-xs font-bold leading-normal ${task.completed ? 'line-through text-gray-400 font-normal' : 'text-gray-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">{task.description}</p>
                        )}
                        <p className="text-[8px] font-mono mt-0.5 text-gray-400">Échéance : {task.dueDate}</p>
                      </div>
                    </div>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-955/50 dark:text-red-400 border border-red-100/30'
                      : task.priority === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/50 dark:text-amber-400 border border-amber-100/30'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-955/50 dark:text-blue-400 border border-blue-100/30'
                    }`}>
                      {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Moyen' : 'Normal'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Candidates / Dossiers */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Dossiers de candidature visés ({assignedDossiers.length})</p>
            {assignedDossiers.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic p-3 bg-gray-55/50 dark:bg-gray-900/10 rounded-xl border border-dashed dark:border-gray-800">
                Aucun dossier pour ce service
              </p>
            ) : (
              <div className="space-y-2">
                {assignedDossiers.map(dos => (
                  <div key={dos.id} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-750 flex items-center justify-between gap-2 text-left">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-normal">{dos.name}</p>
                      <p className="text-[9px] text-gray-500">Provenance : {dos.originSchool}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      dos.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/50 dark:text-emerald-405 border border-emerald-100/30'
                      : dos.status === 'rejected' ? 'bg-red-50 text-red-700 dark:bg-red-955/50 dark:text-red-405 border border-red-100/30'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-955/50 dark:text-amber-405 border border-amber-105/30'
                    }`}>
                      {dos.status === 'accepted' ? 'Inscrit' : dos.status === 'rejected' ? 'Refusé' : 'À l\'étude'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Synchronise form dropdown values with Firestore database states smoothly
  useEffect(() => {
    if (dbStudents.length > 0) {
      const names = dbStudents.map(s => `${s.prenom} ${s.nom}`);
      if (!formDetStudent || !names.includes(formDetStudent)) {
        setFormDetStudent(names[0]);
      }
    }
  }, [dbStudents, formDetStudent]);

  useEffect(() => {
    if (dbSurveillants.length > 0) {
      const names = dbSurveillants.map(s => `${s.prenom} ${s.nom}`);
      if (!formDetProctor || !names.includes(formDetProctor)) {
        setFormDetProctor(names[0]);
      }
    }
  }, [dbSurveillants, formDetProctor]);

  useEffect(() => {
    if (dbStudents.length > 0) {
      const names = dbStudents.map(s => `${s.prenom} ${s.nom}`);
      if (!formRemedialStudent || !names.includes(formRemedialStudent)) {
        setFormRemedialStudent(names[0]);
      }
    }
  }, [dbStudents, formRemedialStudent]);

  useEffect(() => {
    if (dbSubjects.length > 0) {
      if (!formBrevetSubject || !dbSubjects.includes(formBrevetSubject)) {
        setFormBrevetSubject(dbSubjects[0]);
      }
    }
  }, [dbSubjects, formBrevetSubject]);

  useEffect(() => {
    if (dbSubjects.length > 0) {
      if (!formRemedialSubject || !dbSubjects.includes(formRemedialSubject)) {
        setFormRemedialSubject(dbSubjects[0]);
      }
    }
  }, [dbSubjects, formRemedialSubject]);

  const activeRespData = administrativeResponsibilities.find(r => r.id === activeRespId);

  // Quick Stats count
  const inactiveOrUnauthorised = accessibleResponsibilityIds.length === 0;

  if (inactiveOrUnauthorised) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-750 text-center px-4 max-w-lg mx-auto mt-10">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full mb-4">
          <ShieldAlert size={48} />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">Fonctions Coordonnées</h3>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Aucune responsabilité administrative ou de direction ne vous est attribuée pour le moment. 
          Les enseignants et personnels doivent être accrédités par un administrateur depuis l'onglet <strong>Personnel & Attribution</strong> pour piloter un service.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Upper Accoridian Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150 dark:border-gray-750/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-xl">
              Bureau Direction
            </span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              Tableaux de Pilotage Métiers
            </h1>
            <p className="text-xs text-gray-450 dark:text-gray-400 leading-snug">
              {isGlobalAdmin 
                ? "Compte Administrateur : Vous accédez aux 11 interfaces de pilotage administratif en temps réel." 
                : `Vous pilotez les ${accessibleResponsibilityIds.length} portails de direction qui vous ont été assignés.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-gray-405 dark:text-gray-400 font-mono tracking-widest uppercase">System Operational: Live</span>
          </div>
        </div>

        {/* Selected switch buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {administrativeResponsibilities
            .filter(r => accessibleResponsibilityIds.includes(r.id))
            .map(resp => {
              const isActive = activeRespId === resp.id;
              const IconComp = getResponsibilityIcon(resp.id);
              return (
                <button
                  key={resp.id}
                  onClick={() => setActiveRespId(resp.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer ${
                    isActive 
                      ? `${resp.badgeBg} ring-2 ring-indigo-500/20 scale-[1.02] shadow-sm` 
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-750 text-gray-500 hover:text-gray-900 border border-gray-100 dark:border-gray-750'
                  }`}
                >
                  <IconComp size={12} className="opacity-80" />
                  {resp.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* active board layout */}
      {activeRespData && (
        <div className="space-y-6">
          {getSecurityBadge(activeRespId)}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Controls Panel (Left size 2cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dashboard 1: Responsable de la Maternelle */}
            {activeRespId === 'responsable_maternelle' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-pink-100 dark:bg-pink-905/20 text-pink-600 rounded-2xl">
                    <Baby size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Gestion de la Maternelle</h2>
                    <p className="text-xs text-gray-400">Siestes scolaires, fiches de liaison et transmissions pour les parents.</p>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-950/10 rounded-2xl border border-pink-105/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-pink-500">Marmots Endormis</p>
                    <p className="text-2xl font-black text-pink-700 dark:text-pink-400 mt-1">
                      {siestas.filter(s => s.status === 'sleeping').length}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl border border-amber-105/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-amber-500">Marmots au Repos</p>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                      {siestas.filter(s => s.status === 'resting').length}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-105/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-emerald-500">Marmots Réveillés</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {siestas.filter(s => s.status === 'awake').length}
                    </p>
                  </div>
                </div>

                {/* List siestas */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Suivi actif du sommeil (Temps Réel)</h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
                    {siestas.map(kid => (
                      <div key={kid.id} className="p-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{kid.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{kid.classroom}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                          {(['awake', 'resting', 'sleeping'] as const).map(st => (
                            <button
                              key={st}
                              onClick={async () => {
                                if (!enforcePermission('responsable_maternelle')) return;
                                try {
                                  await updateDoc(doc(db, 'maternelle_siestas', kid.id), { status: st });
                                  notifySuccess(`Sommeil de ${kid.name} modifié !`);
                                } catch (error) {
                                  console.error("Error updating sleep status:", error);
                                }
                              }}
                              className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                                kid.status === st 
                                  ? st === 'awake' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35'
                                    : st === 'resting' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/35'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/35'
                                  : 'text-gray-405 dark:text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              {st === 'awake' ? 'Réveillé' : st === 'resting' ? 'Repos' : 'Dort'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transmissions Logs for parents */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Dernières notes aux parents</h3>
                  <div className="space-y-2">
                    {maternelleTransmissions.map(trans => (
                      <div key={trans.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 relative">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-extrabold text-pink-700 dark:text-pink-450">{trans.kidName}</p>
                          <span className="text-[9px] font-mono text-gray-400">{trans.date}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">"{trans.notes}"</p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-[10px] font-black uppercase bg-pink-50 text-pink-650 px-2 py-0.5 rounded-md">
                            Biberons : {trans.bottles}
                          </span>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!enforcePermission('responsable_maternelle')) return;
                            try {
                              await deleteDoc(doc(db, 'maternelle_transmissions', trans.id));
                              notifySuccess("Transmission supprimée !");
                            } catch (error) {
                              console.error("Error deleting transmission:", error);
                            }
                          }}
                          className="absolute right-3 bottom-3 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {renderAssignedTasksAndDossiers('Responsable Maternelle')}
              </div>
            )}

            {/* Dashboard 2: Responsable du Primaire */}
            {activeRespId === 'responsable_primaire' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-sky-100 dark:bg-sky-905/20 text-sky-600 rounded-2xl">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Pilotage du Primaire</h2>
                    <p className="text-xs text-gray-400">Défi Lecture inter-classes, sorties éducatives et supervision du Cycle 2 & 3.</p>
                  </div>
                </div>

                {/* Readings progress table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Challenge National de Lecture</h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
                    {readingProgress.map(student => (
                      <div key={student.id} className="p-4 flex items-center justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>{student.name}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{student.booksRead} / {student.goal} livres</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(student.booksRead / student.goal) * 100}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[9px] font-black uppercase tracking-widest rounded-lg">
                            {student.rating}
                          </span>
                          <button
                            onClick={async () => {
                              if (!enforcePermission('responsable_primaire')) return;
                              try {
                                const currentBooksRead = Number(student.booksRead || 0);
                                const currentGoal = Number(student.goal || 8);
                                const newRead = Math.min(currentBooksRead + 1, currentGoal);
                                const newRating = newRead >= currentGoal ? 'Légende' : 'En progrès';
                                await updateDoc(doc(db, 'resp_reading_progress', student.id), {
                                  booksRead: newRead,
                                  rating: newRating
                                });
                                notifySuccess(`Livre validé pour ${student.name} !`);
                              } catch (error) {
                                console.error("Error updating reading progress:", error);
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-sky-50 dark:bg-gray-800 border border-gray-150 rounded-xl cursor-pointer"
                            title="Ajouter un livre lu"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field trips */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Demandes de Sorties Scolaires</h3>
                  <div className="space-y-2">
                    {primaryFieldTrips.map(trip => (
                      <div key={trip.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white">{trip.destination}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Date prévue : {trip.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                            trip.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 text-emerald-300'
                            : trip.status === 'rejected' ? 'bg-red-105 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                          }`}>
                            {trip.status === 'approved' ? 'Autorisé' : trip.status === 'rejected' ? 'Rejeté' : 'En examen'}
                          </span>
                          {trip.status === 'pending' && (
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  if (!enforcePermission('responsable_primaire')) return;
                                  try {
                                    await updateDoc(doc(db, 'resp_field_trips', trip.id), {
                                      status: 'approved'
                                    });
                                    notifySuccess("Sortie de classe validée !");
                                  } catch (error) {
                                    console.error("Error approving field trip:", error);
                                  }
                                }}
                                className="p-1 bg-white hover:bg-emerald-50 text-emerald-600 rounded-lg border border-gray-150 cursor-pointer"
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {renderAssignedTasksAndDossiers('Responsable Primaire')}
              </div>
            )}

            {/* Dashboard 3: Responsable Collège */}
            {activeRespId === 'responsable_college' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-indigo-100 dark:bg-indigo-905/20 text-indigo-600 rounded-2xl">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Pilotage du Collège (6e à 3e)</h2>
                    <p className="text-xs text-gray-400">Suivi des épreuves blanches du Brevet, discipline collective et ASSR.</p>
                  </div>
                </div>

                {/* Brevet exam completion checks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Programme de révision Brevet Blanc</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {brevetChapters.map(chap => (
                      <div key={chap.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 text-left relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mt-1">{chap.subject}</p>
                          <p className="text-[11px] font-bold text-gray-800 dark:text-gray-300 mt-1.5 leading-tight">{chap.topic}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase ${chap.status === 'ready' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {chap.status === 'ready' ? 'Prêt' : 'En attente'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                if (!enforcePermission('responsable_college')) return;
                                try {
                                  const updatedStatus = chap.status === 'ready' ? 'pending' : 'ready';
                                  await updateDoc(doc(db, 'resp_brevet_chapters', chap.id), {
                                    status: updatedStatus
                                  });
                                  notifySuccess("Statut du programme actualisé !");
                                } catch (error) {
                                  console.error("Error updating chapter status:", error);
                                }
                              }}
                              className={`p-1 rounded-lg border text-[9px] font-black uppercase cursor-pointer ${
                                chap.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 border-gray-150'
                              }`}
                            >
                              Bascule
                            </button>
                            <button
                              onClick={async () => {
                                if (!enforcePermission('responsable_college')) return;
                                try {
                                  await deleteDoc(doc(db, 'resp_brevet_chapters', chap.id));
                                  notifySuccess("Programme de révision supprimé !");
                                } catch (error) {
                                  console.error("Error deleting brevet chapter:", error);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-md cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclusion Detentions List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Heures de Colle programmées</h3>
                  <div className="space-y-2">
                    {collegeDetentions.map(det => (
                      <div key={det.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white">{det.student}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">Saisi par : {det.teacher}</p>
                          </div>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-0.5 rounded-md font-bold">
                            {det.date} ({det.hour})
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 border-dashed">
                          <strong className="text-[10px] uppercase tracking-wider text-red-500 mr-1 block">Motif formel :</strong>
                          {det.reason}
                        </p>
                        <div className="mt-2.5 flex justify-between items-center text-[10px] text-gray-450 dark:text-gray-400">
                          <span>Surveillant : <strong>{det.proctor}</strong></span>
                          <button 
                            onClick={async () => {
                              if (!enforcePermission('responsable_college')) return;
                              try {
                                await deleteDoc(doc(db, 'resp_college_detentions', det.id));
                                notifySuccess("Ordre de retenue supprimé");
                              } catch (error) {
                                console.error("Error deleting detention:", error);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Annuler l'ordre
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {renderAssignedTasksAndDossiers('Responsable Collège')}
              </div>
            )}

            {/* Dashboard 3b: Responsable Lycée / Proviseur (6ème en Terminale) */}
            {activeRespId === 'responsable_lycee' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3.5 bg-purple-100 dark:bg-purple-905/20 text-purple-600 rounded-2xl">
                      <School size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Direction du Lycée & Études Supérieures</h2>
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          Proviseur
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Supervision académique de la 6ème en Terminale, Baccalauréat, conseils de classe et orientation post-bac.
                      </p>
                    </div>
                  </div>

                  {/* System tag badge */}
                  <div className="text-right bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Système Pédagogique</p>
                    <p className="text-[11px] font-black text-purple-600 dark:text-purple-400">
                      {systemConfig?.name || 'Système National'}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                      {systemConfig?.diplomas?.[0] || 'Baccalauréat'} • {systemConfig?.evaluationScale || '0-20'}
                    </p>
                  </div>
                </div>

                {/* Key Metric Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400">Examens Blancs</p>
                    <p className="text-2xl font-black text-purple-900 dark:text-purple-200 mt-1">{mockExams.length}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Épreuves officielles</p>
                  </div>
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-blue-600 dark:text-blue-400">Conseils de Classe</p>
                    <p className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">{classCouncils.length}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">6ème à Terminale</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Fiches Post-Bac</p>
                    <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">{postBacWishes.length}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Avis Proviseur</p>
                  </div>
                  <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400">Discipline Sup.</p>
                    <p className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">{lyceeDiscipline.length}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Dossiers suivis</p>
                  </div>
                </div>

                {/* Section 1: Examens Blancs & BAC */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Award size={14} className="text-purple-600" />
                      Organisation des Bacs Blancs & Examens Trimestriels
                    </h3>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {mockExams.filter(e => e.status === 'published').length}/{mockExams.length} publiés
                    </span>
                  </div>

                  {mockExams.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-400">Aucun examen blanc planifié. Utilisez le formulaire à droite pour en ajouter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mockExams.map(exam => (
                        <div key={exam.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                {exam.targetClass || exam.serie || 'Lycée'}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                exam.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                exam.status === 'graded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                exam.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {exam.status === 'published' ? 'Publié' :
                                 exam.status === 'graded' ? 'Corrigé' :
                                 exam.status === 'in_progress' ? 'En cours' : 'Planifié'}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-gray-900 dark:text-white mt-2 leading-snug">
                              {exam.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-1">
                              📅 {exam.date} • Surveillant : <strong className="text-gray-600 dark:text-gray-300">{exam.supervisor || 'Non assigné'}</strong>
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button
                              onClick={async () => {
                                if (!enforcePermission('responsable_lycee')) return;
                                try {
                                  const nextStatus: Record<string, 'planned' | 'in_progress' | 'graded' | 'published'> = {
                                    'planned': 'in_progress',
                                    'in_progress': 'graded',
                                    'graded': 'published',
                                    'published': 'planned'
                                  };
                                  await updateDoc(doc(db, 'resp_lycee_mock_exams', exam.id), {
                                    status: nextStatus[exam.status] || 'planned'
                                  });
                                  notifySuccess("Statut de l'épreuve actualisé !");
                                } catch (err) {
                                  console.error("Error updating exam status:", err);
                                }
                              }}
                              className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                            >
                              Avancer étape ➔
                            </button>
                            <button
                              onClick={async () => {
                                if (!enforcePermission('responsable_lycee')) return;
                                try {
                                  await deleteDoc(doc(db, 'resp_lycee_mock_exams', exam.id));
                                  notifySuccess("Examen supprimé");
                                } catch (err) {
                                  console.error("Error deleting exam:", err);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Conseils de Classe & Commissions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Users size={14} className="text-blue-600" />
                      Conseils de Classe & Décisions Trimestrielles
                    </h3>
                  </div>

                  {classCouncils.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-400">Aucun procès-verbal de conseil de classe enregistré.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classCouncils.map(council => (
                        <div key={council.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-900 dark:text-white">
                                {council.className}
                              </span>
                              <span className="text-[9px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                                {council.date}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                Présidé par : {council.president}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 italic">
                              "{council.remarks || 'Conseil satisfaisant. Progression générale observée.'}"
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[10px]">
                              <span className="text-emerald-600 font-bold">🌟 Félicitations : {council.honors || 0}</span>
                              <span className="text-rose-600 font-bold">⚠️ Avertissements : {council.warnings || 0}</span>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              if (!enforcePermission('responsable_lycee')) return;
                              try {
                                await deleteDoc(doc(db, 'resp_lycee_councils', council.id));
                                notifySuccess("Procès-verbal de conseil supprimé");
                              } catch (err) {
                                console.error("Error deleting council:", err);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 self-end sm:self-center p-1.5 rounded cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Orientation Post-Bac & Parcoursup */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-emerald-600" />
                      Fiches d'Orientation Post-Bac & Avis du Chef d'Établissement
                    </h3>
                  </div>

                  {postBacWishes.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-400">Aucune fiche post-bac saisie pour les élèves de Terminale.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {postBacWishes.map(wish => (
                        <div key={wish.id} className="p-3.5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-gray-900 dark:text-white">{wish.studentName}</p>
                              <span className="text-[9px] font-bold text-gray-400 font-mono">({wish.serie || 'Terminale'})</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                              Filière visée : <strong className="text-purple-600 dark:text-purple-400">{wish.targetProgram}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${
                              wish.proviseurAdvice === 'Tres Favorable' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' :
                              wish.proviseurAdvice === 'Favorable' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                            }`}>
                              Avis : {wish.proviseurAdvice}
                            </span>
                            <button
                              onClick={async () => {
                                if (!enforcePermission('responsable_lycee')) return;
                                try {
                                  await deleteDoc(doc(db, 'resp_lycee_postbac', wish.id));
                                  notifySuccess("Fiche post-bac retirée");
                                } catch (err) {
                                  console.error("Error deleting postbac wish:", err);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 4: Discipline Supérieure & Commissions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-rose-600" />
                      Conseil de Discipline du Second Cycle
                    </h3>
                  </div>

                  {lyceeDiscipline.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-400">Aucun dossier disciplinaire grave actif au niveau Lycée.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lyceeDiscipline.map(d => (
                        <div key={d.id} className="p-3.5 bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-rose-950 dark:text-rose-200">{d.studentName}</p>
                              <span className="text-[9px] font-mono text-gray-500">Classe : {d.className}</span>
                            </div>
                            <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-0.5">
                              Motif : {d.motif}
                            </p>
                            <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                              Décision Proviseur : {d.sanction}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!enforcePermission('responsable_lycee')) return;
                              try {
                                await deleteDoc(doc(db, 'resp_lycee_discipline', d.id));
                                notifySuccess("Dossier disciplinaire clôturé");
                              } catch (err) {
                                console.error("Error deleting lycee disc:", err);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {renderAssignedTasksAndDossiers('Responsable Lycée')}
              </div>
            )}

            {/* Dashboard 4: Gestionnaire Comptable */}
            {activeRespId === 'gestionnaire_comptable' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-emerald-100 dark:bg-emerald-905/20 text-emerald-600 rounded-2xl">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Relais Comptabilité & Balance</h2>
                    <p className="text-xs text-gray-400">Enregistrement des recettes directes, fournitures, salaires auxiliaires.</p>
                  </div>
                </div>

                {/* Ledger ledger list */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Journal d'écritures auxiliaires</h3>
                    <span className="text-[11px] text-emerald-600 font-bold border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md">
                      Solde : {accountingFlows.reduce((acc, f) => f.type === 'inflow' ? acc + f.amount : acc - f.amount, 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="space-y-2">
                    {accountingFlows.map(flow => (
                      <div key={flow.id} className="p-3.5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-black uppercase w-4 h-4 rounded-full flex items-center justify-center ${
                            flow.type === 'inflow' ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {flow.type === 'inflow' ? '📈' : '📉'}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{flow.description}</p>
                            <p className="text-[9px] text-gray-400 font-mono">Date : {flow.date} | Catégorie : {flow.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${flow.type === 'inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {flow.type === 'inflow' ? '+' : '-'}{flow.amount.toLocaleString()} F
                          </span>
                          <button
                            onClick={async () => {
                              if (!enforcePermission('gestionnaire_comptable')) return;
                              try {
                                await deleteDoc(doc(db, 'resp_accounting_flows', flow.id));
                                notifySuccess("Écriture comptable supprimée !");
                              } catch (error) {
                                console.error("Error deleting flow:", error);
                              }
                            }}
                            className="p-1 text-gray-450 hover:text-red-500 rounded-md cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* tuition recovery checks */}
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2.5xl border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-2 text-amber-850 dark:text-amber-300">
                    <AlertTriangle size={16} />
                    <h4 className="text-xs font-black uppercase tracking-wider">Écolages en souffrance (Actions requises)</h4>
                  </div>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-1">
                    Il reste à ce jour <strong>14 élèves</strong> n'ayant pas soldé le 3ème trimestre. Relancer de manière prévenante.
                  </p>
                  <button
                    onClick={() => {
                      notifySuccess("Lettre de relance type simulée et prête pour le publipostage !");
                    }}
                    className="mt-3 px-3 py-1.5 bg-amber-655 hover:bg-amber-705 bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Simuler un publipostage de relance
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard 5: Responsable Pédagogique */}
            {activeRespId === 'responsable_pedagogique' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-amber-100 dark:bg-amber-905/20 text-amber-600 rounded-2xl">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Direction Pédagogique</h2>
                    <p className="text-xs text-gray-400">Progression des cahiers de textes, coordination des évaluations publiques.</p>
                  </div>
                </div>

                {/* Syllabus Audits Progress bars */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Progression globale des syllabi</h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-2.5xl border border-gray-150 dark:border-gray-750">
                    {syllabusRates.map(rateObj => (
                      <div key={rateObj.id}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{rateObj.course} ({rateObj.teacher})</span>
                          <span>{rateObj.rate}% complété</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={rateObj.rate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSyllabusRates(p => p.map(s => s.id === rateObj.id ? { ...s, rate: val } : s));
                            }}
                            onMouseUp={async (e) => {
                              if (!enforcePermission('responsable_pedagogique')) return;
                              const val = Number((e.target as HTMLInputElement).value);
                              try {
                                await updateDoc(doc(db, 'resp_syllabus_rates', rateObj.id), {
                                  rate: val
                                });
                              } catch (error) {
                                console.error("Error updating syllabus rate:", error);
                              }
                            }}
                            onTouchEnd={async (e) => {
                              if (!enforcePermission('responsable_pedagogique')) return;
                              const val = Number((e.target as HTMLInputElement).value);
                              try {
                                await updateDoc(doc(db, 'resp_syllabus_rates', rateObj.id), {
                                  rate: val
                                });
                              } catch (error) {
                                console.error("Error updating syllabus rate:", error);
                              }
                            }}
                            className="flex-1 accent-indigo-600 cursor-pointer"
                          />
                          <span className="text-[10px] text-indigo-505 font-black">{rateObj.rate >= 90 ? '🌟 Parfait' : '⏳ En cours'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remedial groups scheduler */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Groupes de Soutien & Remédiation</h3>
                  <div className="space-y-2">
                    {remedialGroups.map(rem => (
                      <div key={rem.id} className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{rem.studentName}</p>
                          <p className="text-[10px] text-gray-455 dark:text-gray-400">Soutien {rem.subject} | Niveau: {rem.level}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-400 font-bold bg-white dark:bg-gray-800 border border-gray-105 px-2 py-0.5 rounded-lg">
                            {rem.date}
                          </span>
                          <button
                            onClick={async () => {
                              if (!enforcePermission('responsable_pedagogique')) return;
                              try {
                                await deleteDoc(doc(db, 'resp_remedial_groups', rem.id));
                                notifySuccess("Groupe de soutien annulé !");
                              } catch (error) {
                                console.error("Error deleting remedial group:", error);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {renderAssignedTasksAndDossiers('Responsable Pédagogique')}
              </div>
            )}

            {/* Dashboard 6: Surveillant Général */}
            {activeRespId === 'surveillant_general' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-red-105 bg-red-100 text-red-650 rounded-2xl">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Direction de la Discipline Scolaire</h2>
                    <p className="text-xs text-gray-400">Enregistrement des exclusions, billets de retard officiels et proctoring.</p>
                  </div>
                </div>

                {/* Interactive Delay Slip Generator */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Billets de retard émis aujourd'hui</h3>
                  <div className="space-y-2">
                    {lateSlips.map(slip => (
                      <div key={slip.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-red-750 dark:text-red-400">{slip.studentName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Motif : {slip.reason}</p>
                          </div>
                          <span className="text-[10px] font-mono font-black text-red-650 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-lg border border-red-100">
                            +{slip.duration} Minutes
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Émis le: {slip.date}</p>
                        
                        <div className="absolute right-3 bottom-3 flex gap-2">
                          <button
                            onClick={() => {
                              notifySuccess(`Billet d'entrée ré-imprimé pour ${slip.studentName} !`);
                            }}
                            className="text-[9px] font-black uppercase tracking-wider text-gray-500 bg-white border px-2 py-0.5 rounded-md cursor-pointer"
                          >
                            Imprimer
                          </button>
                          <button
                            onClick={async () => {
                              if (!enforcePermission('surveillant_general')) return;
                              try {
                                await deleteDoc(doc(db, 'resp_late_slips', slip.id));
                                notifySuccess("Billet de retard supprimé !");
                              } catch (error) {
                                console.error("Error deleting late slip:", error);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard 7: Surveillant Adjoint */}
            {activeRespId === 'surveillant_adjoint' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-orange-100 text-orange-650 rounded-2xl">
                    <Eye size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Surveillance de Proximité & Portails</h2>
                    <p className="text-xs text-gray-405">Contrôle d'accès des visiteurs de l'école et consignes des clefs de casiers.</p>
                  </div>
                </div>

                {/* Gate log controller */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Registre des entrées portails</h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
                    {visitorsLog.map(vis => (
                      <div key={vis.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-gray-850 dark:text-gray-300">{vis.visitorName}</p>
                          <p className="text-[10px] text-gray-450 dark:text-gray-400">Sujet : {vis.reason} | Reçu par : {vis.targetPerson}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                            vis.status === 'inside' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-150 text-gray-500'
                          }`}>
                            {vis.status === 'inside' ? 'Sur Place' : 'Sorti'}
                          </span>
                          {vis.status === 'inside' && (
                            <button
                              onClick={async () => {
                                if (!enforcePermission('surveillant_adjoint')) return;
                                try {
                                  await updateDoc(doc(db, 'resp_visitors_log', vis.id), {
                                    status: 'left'
                                  });
                                  notifySuccess("Heure de sortie enregistrée !");
                                } catch (error) {
                                  console.error("Error leaving visitor:", error);
                                }
                              }}
                              className="text-[9px] bg-white text-gray-600 border px-2 py-0.5 rounded cursor-pointer"
                            >
                              Valider Sortie
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locker loans keys */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Consignation Clefs Casiers Élèves</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lockerKeys.map(lock => (
                      <div key={lock.id} className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Casier {lock.lockerNo}</p>
                          <p className="text-[9px] text-gray-450 dark:text-gray-400">Attribué à: {lock.student}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!enforcePermission('surveillant_adjoint')) return;
                            try {
                              const updatedRet = !lock.returned;
                              await updateDoc(doc(db, 'resp_locker_keys', lock.id), {
                                returned: updatedRet
                              });
                              notifySuccess(updatedRet ? "Clef restituée !" : "Clef prêtée à nouveau !");
                            } catch (error) {
                              console.error("Error updating locker key:", error);
                            }
                          }}
                          className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border cursor-pointer ${
                            lock.returned 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}
                        >
                          {lock.returned ? 'Restituée' : 'Perdue/En Cours'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard 8: Dame de ménage */}
            {activeRespId === 'dame_menage' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-teal-100 text-teal-650 rounded-2xl">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Pilotage de la Salubrité</h2>
                    <p className="text-xs text-gray-400">Suivi hebdomadaire de la désinfection des locaux, commandes de fournitures de propreté.</p>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-950/10 rounded-2xl border border-teal-105/30 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-teal-600">Locaux Désinfectés</p>
                    <p className="text-xl font-black text-teal-700 dark:text-teal-400 mt-1">
                      {cleanZones.filter(z => z.status === 'cleaned').length} / {cleanZones.length}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-105/30 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-red-500">Alertes Ruptures Produits</p>
                    <p className="text-xl font-black text-red-750 dark:text-red-400 mt-1">
                      {cleaningSupplies.filter(s => s.stock <= s.limit).length} Alerte(s)
                    </p>
                  </div>
                </div>

                {/* Clean progress checks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Registre du plan hygiène</h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
                    {cleanZones.map(zoneObj => (
                      <div key={zoneObj.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-gray-850 dark:text-gray-300">{zoneObj.zone}</p>
                          <p className="text-[9px] text-gray-455 dark:text-gray-400">Dernier passage : {zoneObj.lastCleaned} | Fréquence : {zoneObj.frequency}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!enforcePermission('dame_menage')) return;
                            try {
                              const updatedSt = zoneObj.status === 'cleaned' ? 'pending' : 'cleaned';
                              await updateDoc(doc(db, 'resp_clean_zones', zoneObj.id), {
                                status: updatedSt,
                                lastCleaned: 'À l\'instant'
                              });
                              notifySuccess("Passage validé !");
                            } catch (error) {
                              console.error("Error updating clean zone:", error);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all cursor-pointer ${
                            zoneObj.status === 'cleaned' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          {zoneObj.status === 'cleaned' ? 'Propre 🟢' : 'En Attente 🟡'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Products alerts list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Commande express de produits de propreté</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {cleaningSupplies.map(supp => {
                      const isLow = supp.stock <= supp.limit;
                      return (
                        <div key={supp.id} className={`p-3 rounded-2xl border text-left ${
                          isLow ? 'bg-red-50/50 border-red-150' : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100'
                        }`}>
                          <p className="text-[11px] font-extrabold text-gray-800 dark:text-gray-300">{supp.item}</p>
                          <p className="text-[10px] text-gray-405 mt-0.5">Stock: <strong>{supp.stock}</strong> (Minimum: {supp.limit})</p>
                          <button
                            onClick={async () => {
                              if (!enforcePermission('dame_menage')) return;
                              try {
                                const currentStock = Number(supp.stock || 0);
                                await updateDoc(doc(db, 'resp_cleaning_supplies', supp.id), {
                                  stock: currentStock + 10
                                });
                                notifySuccess("Dotation de stock commandée !");
                              } catch (error) {
                                console.error("Error updating stock supply:", error);
                              }
                            }}
                            className={`w-full mt-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border text-center cursor-pointer ${
                              isLow ? 'bg-red-655 bg-red-600 text-white' : 'bg-white text-gray-600'
                            }`}
                          >
                            Recommander +10
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard 9: Secrétaire Générale */}
            {activeRespId === 'secretaire_generale' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-purple-100 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-2xl">
                    <FileBadge size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Secrétariat Général de l'Établissement</h2>
                    <p className="text-xs text-gray-400">Demandes de scolarisation, immatriculation et tableau de bord des tâches en temps réel.</p>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 rounded-2xl border border-purple-100/40 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-purple-650 dark:text-purple-400">Dossiers Inscrits</p>
                    <p className="text-xl font-black text-purple-700 dark:text-purple-400 mt-1">
                      {dossiers.filter(d => d.status === 'accepted').length} / {dossiers.length}
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/40 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-indigo-650 dark:text-indigo-400">Tâches Complétées</p>
                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
                      {secTasks.filter(t => t.completed).length} / {secTasks.length}
                    </p>
                  </div>
                </div>

                {/* Candidate dossiers registrations */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Suivi d'inscription des dossiers de candidature</h3>
                  {dossiers.length === 0 ? (
                    <p className="text-center text-[11px] text-gray-400 py-3">Aucun dossier encodé pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {dossiers.map(dos => (
                        <div key={dos.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-750 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white">{dos.name}</p>
                            <p className="text-[10px] text-gray-455 dark:text-gray-400">Niveau visé : {dos.level} | Établissement précédent : {dos.originSchool}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              dos.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-400'
                              : dos.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950/55 dark:text-red-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-400'
                            }`}>
                              {dos.status === 'accepted' ? 'Inscrit' : dos.status === 'rejected' ? 'Refusé' : 'En Saisie'}
                            </span>
                            {dos.status === 'pending' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    if (!enforcePermission('secretaire_generale')) return;
                                    try {
                                      await updateDoc(doc(db, 'resp_dossiers', dos.id), {
                                        status: 'accepted'
                                      });
                                      notifySuccess("Dossier de candidature validé et inscrit !");
                                    } catch (error) {
                                      console.error("Error accepting dossier:", error);
                                    }
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 dark:bg-gray-800 dark:text-emerald-400 rounded-lg text-[9px] font-bold border dark:border-gray-700 cursor-pointer animate-none"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!enforcePermission('secretaire_generale')) return;
                                    try {
                                      await updateDoc(doc(db, 'resp_dossiers', dos.id), {
                                        status: 'rejected'
                                      });
                                      notifySuccess("Candidature rejetée.");
                                    } catch (error) {
                                      console.error("Error rejecting dossier:", error);
                                    }
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-red-50 text-red-700 dark:bg-gray-800 dark:text-red-400 rounded-lg text-[9px] font-bold border dark:border-gray-700 cursor-pointer animate-none"
                                >
                                  Rejeter
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Real-time SG Tasks Section */}
                <div className="space-y-4 pt-4 border-t border-gray-105 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Suivi des Tâches & Bureau Direction</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Pilotez les tâches destinées au Secrétariat ou au Bureau Direction en temps réel.</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-905 border border-gray-100 dark:border-gray-700/60 rounded-xl w-fit">
                      <button 
                        onClick={() => setTaskFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${
                          taskFilter === 'all' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Toutes
                      </button>
                      <button 
                        onClick={() => setTaskFilter('sec')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${
                          taskFilter === 'sec' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Secrétariat
                      </button>
                      <button 
                        onClick={() => setTaskFilter('dir')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${
                          taskFilter === 'dir' 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Bureau Direction
                      </button>
                    </div>
                  </div>

                  {/* Tasks list */}
                  {(() => {
                    const filteredTasks = secTasks.filter(t => {
                      if (taskFilter === 'sec') return t.scope === 'Secrétariat Général';
                      if (taskFilter === 'dir') return t.scope === 'Bureau Direction';
                      return true;
                    });

                    if (filteredTasks.length === 0) {
                      return (
                        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20 text-center rounded-2.5xl border border-dashed border-gray-200 dark:border-gray-700/50">
                          <p className="text-[11px] text-gray-400 font-medium">
                            {taskFilter === 'all' 
                              ? "Aucune tâche enregistrée." 
                              : taskFilter === 'sec' 
                                ? "Aucune tâche pour le Secrétariat Général." 
                                : "Aucune tâche assignée au Bureau Direction."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {filteredTasks.map(task => {
                          const isHigh = task.priority === 'high';
                          const isMedium = task.priority === 'medium';
                          return (
                            <div key={task.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-750 flex items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <button 
                                  onClick={async () => {
                                    if (!enforcePermission('secretaire_generale')) return;
                                    try {
                                      await updateDoc(doc(db, 'resp_secretaire_tasks', task.id), {
                                        completed: !task.completed
                                      });
                                      notifySuccess("Statut de la tâche mis à jour !");
                                    } catch (error) {
                                      console.error("Error toggling task completion:", error);
                                    }
                                  }}
                                  className="mt-0.5 text-purple-650 hover:opacity-85 transition-opacity cursor-pointer flex-shrink-0"
                                >
                                  <CheckSquare 
                                    size={18} 
                                    className={`transition-all ${task.completed ? 'text-emerald-500 fill-emerald-500/10' : 'text-gray-400'}`} 
                                  />
                                </button>

                                <div className="text-left">
                                  <p className={`text-xs font-black ${task.completed ? 'line-through text-gray-450 dark:text-gray-500 font-normal' : 'text-gray-900 dark:text-white'}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">{task.description}</p>
                                  )}
                                  <p className="text-[9px] text-gray-450 mt-1 font-mono">Échéance : {task.dueDate || 'Non planifiée'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  task.scope === 'Bureau Direction' 
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-455 border border-indigo-100/50 dark:border-indigo-900/40' 
                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-455 border border-purple-100/50 dark:border-purple-900/40'
                                }`}>
                                  {task.scope}
                                </span>

                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                  isHigh ? 'bg-red-50 text-red-700 dark:bg-red-950/55 dark:text-red-400 border border-red-100/40'
                                  : isMedium ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/55 dark:text-amber-400 border border-amber-100/40'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/55 dark:text-blue-400 border border-blue-105/40'
                                }`}>
                                  {isHigh ? 'Urgent' : isMedium ? 'Moyen' : 'Normal'}
                                </span>

                                <button
                                  onClick={async () => {
                                    if (!enforcePermission('secretaire_generale')) return;
                                    try {
                                      await deleteDoc(doc(db, 'resp_secretaire_tasks', task.id));
                                      notifySuccess("Tâche supprimée avec succès !");
                                    } catch (error) {
                                      console.error("Error deleting task:", error);
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Dashboard 10: Secrétaire Adjointe */}
            {activeRespId === 'secretaire_adjointe' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-fuchsia-100 text-fuchsia-650 rounded-2xl">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Secrétariat Adjoint / Secrétariat d'Accueil</h2>
                    <p className="text-xs text-gray-400">Registre des appels téléphoniques reçus pour transmission externe.</p>
                  </div>
                </div>

                {/* Telephone message log list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Journal des Messages d'Appels Reçus</h3>
                  <div className="space-y-2">
                    {phoneCalls.map(call => (
                      <div key={call.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-fuchsia-750 dark:text-fuchsia-400">{call.caller}</p>
                            <span className="text-[9px] font-mono text-gray-405">À transmettre à : <strong>{call.targetStudent}</strong></span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            call.status === 'relayed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {call.status === 'relayed' ? 'Transmis' : 'En Attente'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 border-dashed">
                          "{call.message}"
                        </p>
                        
                        <div className="mt-2 text-right">
                          {call.status === 'noted' && (
                            <button
                              onClick={async () => {
                                if (!enforcePermission('secretaire_adjointe')) return;
                                try {
                                  await updateDoc(doc(db, 'resp_phone_calls', call.id), {
                                    status: 'relayed'
                                  });
                                  notifySuccess("Statut du message : Transmis à l'enseignant !");
                                } catch (error) {
                                  console.error("Error relaying phone call:", error);
                                }
                              }}
                              className="text-[9px] font-black uppercase tracking-wider text-white bg-fuchsia-600 px-3 py-1 rounded-lg cursor-pointer align-middle"
                            >
                              Marquer Transmis
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!enforcePermission('secretaire_adjointe')) return;
                              try {
                                  await deleteDoc(doc(db, 'resp_phone_calls', call.id));
                                  notifySuccess("Message supprimé !");
                              } catch (error) {
                                console.error("Error deleting phone call:", error);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 ml-2 text-xs cursor-pointer align-middle"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard 11: Responsable Informatique */}
            {activeRespId === 'responsable_it' && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-105 dark:border-gray-700">
                  <div className="p-3.5 bg-cyan-100 text-cyan-650 rounded-2xl">
                    <Laptop size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Gestion du Matériel Informatique</h2>
                    <p className="text-xs text-gray-400">Suivi des parcs mobiles de tablettes, réservation de matériel pédagogique et tickets d'incidents.</p>
                  </div>
                </div>

                {/* tablet loads table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Prêts actifs de valises numériques</h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
                    {itLoans.map(loan => (
                      <div key={loan.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400">{loan.cartId}</p>
                          <p className="text-[10px] text-gray-450 dark:text-gray-400">Classe cible : {loan.classTarget} | Période : {loan.duration}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!enforcePermission('responsable_it')) return;
                            try {
                              const newStatus = loan.status === 'borrowed' ? 'returned' : 'borrowed';
                              await updateDoc(doc(db, 'resp_it_loans', loan.id), {
                                status: newStatus
                              });
                              notifySuccess(newStatus === 'returned' ? "Chariot de tablettes restitué au labo IT !" : "Chariot marqué sorti !");
                            } catch (error) {
                              console.error("Error updating IT loan:", error);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all cursor-pointer ${
                            loan.status === 'returned' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                          }`}
                        >
                          {loan.status === 'returned' ? 'Restitué 🟢' : 'En Cours 🔴'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IT tickets reporting */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Tickets d'incidents techniques en cours</h3>
                  <div className="space-y-2">
                    {itTickets.map(tick => (
                      <div key={tick.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2.5xl border border-gray-100 dark:border-gray-700/60 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-gray-850 dark:text-gray-300">{tick.item}</p>
                            <p className="text-[10px] text-gray-455 mt-0.5 leading-snug">{tick.description}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            tick.severity === 'critical' ? 'bg-red-105 bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {tick.severity === 'critical' ? 'Critique' : 'Mineur'}
                          </span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-455">
                          <span>Statut : <strong>{tick.status.toUpperCase()}</strong></span>
                          <div className="flex gap-1">
                            <button
                              onClick={async () => {
                                if (!enforcePermission('responsable_it')) return;
                                try {
                                  await updateDoc(doc(db, 'resp_it_tickets', tick.id), {
                                    status: 'resolved'
                                  });
                                  notifySuccess("Ticket marqué Résolu !");
                                } catch (error) {
                                  console.error("Error resolving IT ticket:", error);
                                }
                              }}
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-600 border rounded-lg text-[9px] cursor-pointer"
                            >
                              Marquer Résolu
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {renderAssignedTasksAndDossiers('Responsable IT')}
              </div>
            )}

          </div>

          {/* Interactive Form Panel (Right size 1col) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Action Forms */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                  Ajouter un Enregistrement
                </h3>
              </div>

              {!canWrite(activeRespId) ? (
                <div className="p-6 bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/35 dark:border-amber-900/10 rounded-2xl text-center space-y-3">
                  <div className="p-3 bg-amber-100/50 dark:bg-amber-950/20 text-amber-600 rounded-full w-fit mx-auto">
                    <Key size={20} className="animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black text-amber-800 dark:text-amber-300">Formulaire Surtitré</h4>
                  <p className="text-[10px] text-gray-450 leading-normal">
                    Seul le responsable désigné de la direction **{activeRespData.label}** possède les permissions d'insertion pour ce registre.
                  </p>
                </div>
              ) : (
                <>
                  {/* Form 1: Maternelle */}
              {activeRespId === 'responsable_maternelle' && (() => {
                const displayStudents = dbStudents;
                const maternelleClasses = dbClasses.filter(c => {
                  const n = (c.name || c.nom || '').toLowerCase();
                  return n.includes('section') || n.includes('maternelle') || n.includes('tps') || n.includes('ps') || n.includes('ms') || n.includes('gs') || n.includes('garderie') || n.includes('crèche');
                });
                const defaultSections = maternelleClasses.length > 0 
                  ? maternelleClasses.map(c => c.name || c.nom)
                  : ['Petite Section', 'Moyenne Section', 'Grande Section', 'Toute Petite Section (TPS)', 'Garderie / Crèche'];

                return (
                  <div className="space-y-3">
                    {/* Action Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setMaternelleFormType('transmission')}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          maternelleFormType === 'transmission'
                            ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Transmission Parents
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaternelleFormType('siesta')}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          maternelleFormType === 'siesta'
                            ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Suivi Sieste / Sommeil
                      </button>
                    </div>

                    {maternelleFormType === 'transmission' ? (
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_maternelle')) return;
                          if (!formKidName.trim()) {
                            notifyError("Veuillez sélectionner ou saisir le nom de l'enfant.");
                            return;
                          }
                          
                          try {
                            await addDoc(collection(db, 'maternelle_transmissions'), {
                              kidName: formKidName,
                              notes: formNotesText || 'Enfant calme et joyeux. Bonne journée passée en classe.',
                              bottles: Number(formKidBottles) || 2,
                              date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                              etablissement: activeEstId
                            });
                            
                            setFormKidName('');
                            setFormNotesText('');
                            notifySuccess("Note de transmission parents enregistrée avec succès !");
                          } catch (error) {
                            console.error("Error adding transmission:", error);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Enfant de Maternelle</label>
                          {displayStudents.length > 0 ? (
                            <div className="space-y-1.5">
                              <select 
                                value={formKidName}
                                onChange={(e) => setFormKidName(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                              >
                                <option value="">-- Choisir un élève de l'établissement --</option>
                                {displayStudents.map(student => (
                                  <option key={student.id} value={`${student.prenom} ${student.nom}`}>
                                    {student.prenom} {student.nom} ({student.classe || 'Maternelle'})
                                  </option>
                                ))}
                              </select>
                              <input 
                                type="text" 
                                placeholder="Ou saisir un autre nom..."
                                value={formKidName}
                                onChange={(e) => setFormKidName(e.target.value)}
                                className="w-full p-2 bg-gray-50/50 dark:bg-gray-900/50 border rounded-lg text-[11px] outline-none"
                              />
                            </div>
                          ) : (
                            <input 
                              type="text" 
                              placeholder="Ex: Emma Kouassi"
                              value={formKidName}
                              onChange={(e) => setFormKidName(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Biberons / Repas</label>
                            <select
                              value={formKidBottles}
                              onChange={(e) => setFormKidBottles(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                            >
                              <option value="1">1 Repas / Biberon</option>
                              <option value="2">2 Repas / Biberons</option>
                              <option value="3">3 Repas / Biberons</option>
                              <option value="0">Aucun</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Section</label>
                            <select
                              value={formKidClassroom}
                              onChange={(e) => setFormKidClassroom(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                            >
                              {defaultSections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Remarques & Transmissions</label>
                          <textarea 
                            placeholder="Sieste de 2h, repas complet, humeur très joyeuse..."
                            rows={3}
                            value={formNotesText}
                            onChange={(e) => setFormNotesText(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Publier Transmission Réelle
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_maternelle')) return;
                          if (!formKidName.trim()) {
                            notifyError("Veuillez sélectionner ou saisir le nom de l'enfant.");
                            return;
                          }

                          try {
                            await addDoc(collection(db, 'maternelle_siestas'), {
                              name: formKidName,
                              classroom: formKidClassroom,
                              status: formSiestaStatus,
                              etablissement: activeEstId
                            });

                            setFormKidName('');
                            notifySuccess("Enfant ajouté au suivi sommeil en temps réel !");
                          } catch (error) {
                            console.error("Error adding siesta record:", error);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Nom de l'enfant</label>
                          {displayStudents.length > 0 ? (
                            <select 
                              value={formKidName}
                              onChange={(e) => setFormKidName(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                            >
                              <option value="">-- Choisir un enfant --</option>
                              {displayStudents.map(student => (
                                <option key={student.id} value={`${student.prenom} ${student.nom}`}>
                                  {student.prenom} {student.nom} ({student.classe || 'Maternelle'})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              placeholder="Ex: Louis Diallo"
                              value={formKidName}
                              onChange={(e) => setFormKidName(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                            />
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Section de Maternelle</label>
                          <select
                            value={formKidClassroom}
                            onChange={(e) => setFormKidClassroom(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                          >
                            {defaultSections.map(sec => (
                              <option key={sec} value={sec}>{sec}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">État Initial du Sommeil</label>
                          <select
                            value={formSiestaStatus}
                            onChange={(e) => setFormSiestaStatus(e.target.value as any)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                          >
                            <option value="sleeping">Dort paisiblement</option>
                            <option value="resting">Au repos / Calme</option>
                            <option value="awake">Réveillé / En activité</option>
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Enregistrer dans le Dortoir
                        </button>
                      </form>
                    )}
                  </div>
                );
              })()}

              {/* Form 2: Primaire */}
              {activeRespId === 'responsable_primaire' && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!enforcePermission('responsable_primaire')) return;
                    if (!formReadingName.trim()) return;
                    
                    try {
                      await addDoc(collection(db, 'resp_reading_progress'), {
                        name: formReadingName,
                        booksRead: 0,
                        goal: 8,
                        rating: formReadingLevel
                      });
                      setFormReadingName('');
                      notifySuccess("Élève inscrit au Challenge Lecture !");
                    } catch (error) {
                      console.error("Error adding reading progress:", error);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Nom de l'élève</label>
                    <input 
                      type="text" 
                      placeholder="Ex: David Soro"
                      value={formReadingName}
                      onChange={(e) => setFormReadingName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Niveau de départ</label>
                    <select
                      value={formReadingLevel}
                      onChange={(e) => setFormReadingLevel(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                    >
                      <option value="En progrès">En progrès</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Champion/ne">Champion/ne</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                  >
                    Inscrire au Challenge
                  </button>
                </form>
              )}

              {/* Form 3: College */}
              {activeRespId === 'responsable_college' && (() => {
                const displayStudents = dbStudents;
                const displaySurveillants = dbSurveillants;
                const displaySubjects = dbSubjects.length > 0 ? dbSubjects : ["Mathématiques", "Physique-Chimie", "Français", "Sciences - SVT", "Anglais", "Histoire-Géographie"];
                
                return (
                  <div className="space-y-3">
                    {/* Action Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setCollegeFormType('detention')}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          collegeFormType === 'detention'
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Heure de Colle
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollegeFormType('brevet')}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          collegeFormType === 'brevet'
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Révision Brevet
                      </button>
                    </div>

                    {collegeFormType === 'detention' ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_college')) return;
                          
                          if (displayStudents.length === 0) {
                            notifyError("Aucun élève enregistré dans la base de données. Créez des élèves dans l'onglet des utilisateurs.");
                            return;
                          }
                          if (displaySurveillants.length === 0) {
                            notifyError("Aucun personnel ou surveillant enregistré dans la base de données.");
                            return;
                          }

                          const studentVal = formDetStudent || `${displayStudents[0].prenom} ${displayStudents[0].nom}`;
                          const proctorVal = formDetProctor || `${displaySurveillants[0].prenom} ${displaySurveillants[0].nom}`;
                          if (!formDetReason.trim()) {
                            notifyError("Veuillez saisir un motif disciplinaire.");
                            return;
                          }

                          try {
                            await addDoc(collection(db, 'resp_college_detentions'), {
                                student: studentVal,
                                reason: formDetReason,
                                teacher: currentUser?.prenom || 'Direction',
                                date: '23 Mai 2026',
                                hour: '13h30 - 15h30',
                                proctor: proctorVal
                            });
                            setFormDetStudent('');
                            setFormDetReason('');
                            notifySuccess("Ordre de retenue officiellement émis !");
                          } catch (error) {
                            console.error("Error adding college detention:", error);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Élève Consigné l'élève</label>
                          <select 
                            value={formDetStudent}
                            onChange={(e) => setFormDetStudent(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            disabled={displayStudents.length === 0}
                          >
                            {displayStudents.length === 0 ? (
                              <option value="">Aucun élève trouvé dans la base</option>
                            ) : (
                              displayStudents.map(student => (
                                <option key={student.id} value={`${student.prenom} ${student.nom}`}>
                                  {student.prenom} {student.nom} ({student.classe || 'Sans classe'})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Motif Disciplinaire</label>
                          <textarea 
                            placeholder="Bavardages incessants malgré avertissements, etc."
                            rows={2}
                            value={formDetReason}
                            onChange={(e) => setFormDetReason(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Surveillant de permanence</label>
                          <select
                            value={formDetProctor}
                            onChange={(e) => setFormDetProctor(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            disabled={displaySurveillants.length === 0}
                          >
                            {displaySurveillants.length === 0 ? (
                              <option value="">Aucun surveillant trouvé dans la base</option>
                            ) : (
                              displaySurveillants.map(surv => (
                                <option key={surv.id} value={`${surv.prenom} ${surv.nom}`}>
                                  {surv.prenom} {surv.nom}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Émettre Heure de Colle
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_college')) return;
                          const subjectVal = formBrevetSubject || displaySubjects[0];
                          if (!formBrevetTopic.trim()) return;

                          try {
                            await addDoc(collection(db, 'resp_brevet_chapters'), {
                              subject: subjectVal,
                              topic: formBrevetTopic,
                              status: 'pending'
                            });
                            setFormBrevetTopic('');
                            notifySuccess("Programme de révision du Brevet planifié !");
                          } catch (error) {
                            console.error("Error adding brevet chapter:", error);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Matière disponible</label>
                          <select
                            value={formBrevetSubject}
                            onChange={(e) => setFormBrevetSubject(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            {displaySubjects.map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Chapitre / Sujet de révision</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Arithmétique & Théorème de Thalès"
                            value={formBrevetTopic}
                            onChange={(e) => setFormBrevetTopic(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Planifier Révision
                        </button>
                      </form>
                    )}
                  </div>
                );
              })()}

              {/* Form 3b: Responsable Lycée / Proviseur (6ème en Terminale) */}
              {activeRespId === 'responsable_lycee' && (() => {
                const displayStudents = dbStudents;
                const displayTeachers = dbSurveillants;
                const lyceeClasses = dbClasses.filter(c => {
                  const n = (c.name || c.nom || '').toLowerCase();
                  return n.includes('2nde') || n.includes('seconde') || n.includes('1ère') || n.includes('première') || n.includes('premiere') || n.includes('terminale') || n.includes('tle') || n.includes('6') || n.includes('5') || n.includes('4') || n.includes('3');
                });
                const defaultClasses = lyceeClasses.length > 0 
                  ? lyceeClasses.map(c => c.name || c.nom)
                  : ['Terminale S / C', 'Terminale A / L', 'Terminale D', 'Première Spécialités', 'Seconde Générale', '3ème', '4ème', '5ème', '6ème'];

                return (
                  <div className="space-y-3">
                    {/* Action Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setLyceeFormType('exam')}
                        className={`py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          lyceeFormType === 'exam'
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Examen Blanc / BAC
                      </button>
                      <button
                        type="button"
                        onClick={() => setLyceeFormType('council')}
                        className={`py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          lyceeFormType === 'council'
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Conseil de Classe
                      </button>
                      <button
                        type="button"
                        onClick={() => setLyceeFormType('postbac')}
                        className={`py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          lyceeFormType === 'postbac'
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Post-Bac & Orientation
                      </button>
                      <button
                        type="button"
                        onClick={() => setLyceeFormType('discipline')}
                        className={`py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          lyceeFormType === 'discipline'
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Discipline Proviseur
                      </button>
                    </div>

                    {/* Sub-form 1: Examen Blanc */}
                    {lyceeFormType === 'exam' && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_lycee')) return;
                          if (!formExamName.trim()) {
                            notifyError("Veuillez saisir l'intitulé de l'épreuve.");
                            return;
                          }

                          const classVal = formExamClass || defaultClasses[0];
                          const supVal = formExamSupervisor || (displayTeachers[0] ? `${displayTeachers[0].prenom} ${displayTeachers[0].nom}` : 'Proviseur / Direction');

                          try {
                            await addDoc(collection(db, 'resp_lycee_mock_exams'), {
                              name: formExamName,
                              targetClass: classVal,
                              serie: formExamSerie,
                              date: formExamDate || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                              supervisor: supVal,
                              status: 'planned',
                              etablissement: activeEstId
                            });
                            setFormExamName('');
                            setFormExamDate('');
                            notifySuccess("Examen blanc / épreuve officielle planifiée !");
                          } catch (err) {
                            console.error("Error adding mock exam:", err);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Intitulé de l'Épreuve</label>
                          <input
                            type="text"
                            placeholder="Ex: Bac Blanc N°2 - Épreuve de Mathématiques"
                            value={formExamName}
                            onChange={(e) => setFormExamName(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Classe Cible</label>
                            <select
                              value={formExamClass}
                              onChange={(e) => setFormExamClass(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            >
                              {defaultClasses.map(cl => (
                                <option key={cl} value={cl}>{cl}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Série / Filière</label>
                            <select
                              value={formExamSerie}
                              onChange={(e) => setFormExamSerie(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            >
                              <option value="Terminale Générale">Terminale Générale</option>
                              <option value="Série Scientifique (S/C/D)">Série Scientifique (S/C/D)</option>
                              <option value="Série Littéraire (L/A)">Série Littéraire (L/A)</option>
                              <option value="Série Économique (ES/B)">Série Économique (ES/B)</option>
                              <option value="Secondaire 1er Cycle (6e-3e)">Secondaire 1er Cycle (6e-3e)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Date de l'épreuve</label>
                            <input
                              type="text"
                              placeholder="Ex: 14 Juin 2026"
                              value={formExamDate}
                              onChange={(e) => setFormExamDate(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Surveillant / Responsable</label>
                            <select
                              value={formExamSupervisor}
                              onChange={(e) => setFormExamSupervisor(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            >
                              <option value="Proviseur / Direction">Proviseur / Direction</option>
                              {displayTeachers.map(t => (
                                <option key={t.id} value={`${t.prenom} ${t.nom}`}>{t.prenom} {t.nom}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Programmer Examen Blanc
                        </button>
                      </form>
                    )}

                    {/* Sub-form 2: Conseil de classe */}
                    {lyceeFormType === 'council' && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_lycee')) return;

                          const classVal = formCouncilClass || defaultClasses[0];

                          try {
                            await addDoc(collection(db, 'resp_lycee_councils'), {
                              className: classVal,
                              president: formCouncilPresident || 'Proviseur',
                              date: formCouncilDate || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                              honors: Number(formCouncilHonors) || 0,
                              warnings: Number(formCouncilWarnings) || 0,
                              remarks: formCouncilRemarks || 'Conseil satisfaisant avec une bonne dynamique de travail.',
                              status: 'held',
                              etablissement: activeEstId
                            });
                            setFormCouncilRemarks('');
                            notifySuccess("Procès-verbal de conseil de classe enregistré !");
                          } catch (err) {
                            console.error("Error adding council:", err);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Classe Convoquée</label>
                          <select
                            value={formCouncilClass}
                            onChange={(e) => setFormCouncilClass(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            {defaultClasses.map(cl => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Président de séance</label>
                            <input
                              type="text"
                              value={formCouncilPresident}
                              onChange={(e) => setFormCouncilPresident(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block">Date du conseil</label>
                            <input
                              type="text"
                              placeholder="Ex: 28 Mai 2026"
                              value={formCouncilDate}
                              onChange={(e) => setFormCouncilDate(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-emerald-600 block">🌟 Félicitations / Honneurs</label>
                            <input
                              type="number"
                              value={formCouncilHonors}
                              onChange={(e) => setFormCouncilHonors(e.target.value)}
                              className="w-full p-2 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-rose-600 block">⚠️ Avertissements Travail/Cond.</label>
                            <input
                              type="number"
                              value={formCouncilWarnings}
                              onChange={(e) => setFormCouncilWarnings(e.target.value)}
                              className="w-full p-2 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Synthèse & Appréciation Globale</label>
                          <textarea
                            rows={2}
                            placeholder="Trimestre honorable, félicitations aux élèves engagés..."
                            value={formCouncilRemarks}
                            onChange={(e) => setFormCouncilRemarks(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Enregistrer Procès-Verbal
                        </button>
                      </form>
                    )}

                    {/* Sub-form 3: Orientation Post-Bac */}
                    {lyceeFormType === 'postbac' && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_lycee')) return;

                          const studentVal = formPostBacStudent || (displayStudents[0] ? `${displayStudents[0].prenom} ${displayStudents[0].nom}` : '');
                          if (!studentVal) {
                            notifyError("Veuillez sélectionner ou renseigner un élève.");
                            return;
                          }

                          try {
                            await addDoc(collection(db, 'resp_lycee_postbac'), {
                              studentName: studentVal,
                              serie: formPostBacSerie,
                              targetProgram: formPostBacTarget || 'CPGE / Université',
                              proviseurAdvice: formPostBacAdvice,
                              etablissement: activeEstId
                            });
                            setFormPostBacStudent('');
                            notifySuccess("Avis Proviseur pour l'orientation validé !");
                          } catch (err) {
                            console.error("Error adding postbac:", err);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Élève de Terminale / Bac</label>
                          {displayStudents.length > 0 ? (
                            <select
                              value={formPostBacStudent}
                              onChange={(e) => setFormPostBacStudent(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            >
                              <option value="">-- Choisir un élève --</option>
                              {displayStudents.map(st => (
                                <option key={st.id} value={`${st.prenom} ${st.nom}`}>
                                  {st.prenom} {st.nom} ({st.classe || 'Lycée'})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Ex: Jean-Luc Koffi"
                              value={formPostBacStudent}
                              onChange={(e) => setFormPostBacStudent(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Filière / École d'Enseignement Supérieur Visée</label>
                          <input
                            type="text"
                            placeholder="Ex: CPGE MPSI / Faculté de Médecine / EPAC"
                            value={formPostBacTarget}
                            onChange={(e) => setFormPostBacTarget(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Avis Officiel du Proviseur</label>
                          <select
                            value={formPostBacAdvice}
                            onChange={(e) => setFormPostBacAdvice(e.target.value as any)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            <option value="Tres Favorable">🌟 Très Favorable</option>
                            <option value="Favorable">👍 Favorable</option>
                            <option value="Reserve">⚠️ Réservé</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Valider Fiche d'Orientation
                        </button>
                      </form>
                    )}

                    {/* Sub-form 4: Discipline Supérieure */}
                    {lyceeFormType === 'discipline' && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_lycee')) return;

                          const studentVal = formDiscStudent || (displayStudents[0] ? `${displayStudents[0].prenom} ${displayStudents[0].nom}` : '');
                          if (!studentVal || !formDiscMotif.trim()) {
                            notifyError("Veuillez renseigner le nom de l'élève et le motif.");
                            return;
                          }

                          const classVal = formDiscClass || defaultClasses[0];

                          try {
                            await addDoc(collection(db, 'resp_lycee_discipline'), {
                              studentName: studentVal,
                              className: classVal,
                              motif: formDiscMotif,
                              sanction: formDiscSanction,
                              etablissement: activeEstId
                            });
                            setFormDiscStudent('');
                            setFormDiscMotif('');
                            notifySuccess("Décision disciplinaire enregistrée au dossier du lycée !");
                          } catch (err) {
                            console.error("Error adding lycee discipline:", err);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Élève Auditionné</label>
                          {displayStudents.length > 0 ? (
                            <select
                              value={formDiscStudent}
                              onChange={(e) => setFormDiscStudent(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            >
                              <option value="">-- Choisir un élève --</option>
                              {displayStudents.map(st => (
                                <option key={st.id} value={`${st.prenom} ${st.nom}`}>
                                  {st.prenom} {st.nom} ({st.classe || 'Lycée'})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Ex: Alain Bado"
                              value={formDiscStudent}
                              onChange={(e) => setFormDiscStudent(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                            />
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Classe</label>
                          <select
                            value={formDiscClass}
                            onChange={(e) => setFormDiscClass(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            {defaultClasses.map(cl => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Motif d'infraction</label>
                          <textarea
                            rows={2}
                            placeholder="Fraude constatée, absentéisme injustifié répété..."
                            value={formDiscMotif}
                            onChange={(e) => setFormDiscMotif(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Sanction / Décision Proviseur</label>
                          <select
                            value={formDiscSanction}
                            onChange={(e) => setFormDiscSanction(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            <option value="Avertissement solennel du Proviseur">Avertissement solennel du Proviseur</option>
                            <option value="Blâme avec inscription au dossier scolaire">Blâme avec inscription au dossier scolaire</option>
                            <option value="Exclusion temporaire de 3 jours">Exclusion temporaire de 3 jours</option>
                            <option value="Travail d'intérêt général éducatif">Travail d'intérêt général éducatif</option>
                            <option value="Convocation devant le Conseil de Discipline">Convocation devant le Conseil de Discipline</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Émettre Sanction Officielle
                        </button>
                      </form>
                    )}
                  </div>
                );
              })()}

              {/* Form 4: Comptabilité */}
              {activeRespId === 'gestionnaire_comptable' && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!enforcePermission('gestionnaire_comptable')) return;
                    if (!formLedgerDesc.trim() || !formLedgerPrice) return;
                    
                    try {
                      const amountVal = Number(formLedgerPrice);
                      const isOutflow = formLedgerType === 'outflow';
                      await addDoc(collection(db, 'payments'), {
                        studentId: 'auxiliary',
                        studentName: formLedgerDesc,
                        amount: isOutflow ? -amountVal : amountVal,
                        type: formLedgerCategory === 'Écolages' ? 'tuition' :
                              formLedgerCategory === 'Cantine' ? 'canteen' :
                              formLedgerCategory === 'Transport' ? 'transport' : 'other',
                        status: 'paid',
                        date: new Date(), // use local timestamp compatibility
                        method: 'cash',
                        reference: 'COMPTE-RELAIS',
                        notes: formLedgerDesc
                      });
                      setFormLedgerDesc('');
                      setFormLedgerPrice('');
                      notifySuccess("Écriture financière enregistrée en temps réel !");
                    } catch (error) {
                      console.error("Error adding live payment flow:", error);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-bold block">Type d'opération</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button" 
                        onClick={() => setFormLedgerType('inflow')}
                        className={`py-1.5 border rounded-lg text-center font-bold font-black uppercase text-[10px] cursor-pointer ${
                          formLedgerType === 'inflow' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'text-gray-400'
                        }`}
                      >
                        Recette (+)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormLedgerType('outflow')}
                        className={`py-1.5 border rounded-lg text-center font-bold font-black uppercase text-[10px] cursor-pointer ${
                          formLedgerType === 'outflow' ? 'bg-rose-50 text-rose-700 border-rose-500' : 'text-gray-400'
                        }`}
                      >
                        Achat / Frais (-)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-bold">Catégorie</label>
                    <select
                      value={formLedgerCategory}
                      onChange={(e) => setFormLedgerCategory(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                    >
                      <option value="Écolages">Écolages (Frais sco)</option>
                      <option value="Fournitures">Fournitures administrative</option>
                      <option value="Cantine">Recharge Canteen</option>
                      <option value="Transport">Transport / Logistique</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Montant (FCFA)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 150000"
                      value={formLedgerPrice}
                      onChange={(e) => setFormLedgerPrice(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-bold">Description / Objet précis</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Scolarité Koné Ismaël"
                      value={formLedgerDesc}
                      onChange={(e) => setFormLedgerDesc(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] cursor-pointer"
                  >
                    Valider Écriture Réelle
                  </button>
                </form>
              )}

              {/* Form 5: Pedagogique */}
              {activeRespId === 'responsable_pedagogique' && (() => {
                const displayStudents = dbStudents;
                const displaySubjects = dbSubjects.length > 0 ? dbSubjects : ["Mathématiques", "Physique-Chimie", "Français", "Sciences - SVT", "Anglais", "Histoire-Géographie"];

                return (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!enforcePermission('responsable_pedagogique')) return;
                      
                      if (displayStudents.length === 0) {
                        notifyError("Aucun élève enregistré dans la base de données. Créez des élèves dans l'onglet des utilisateurs.");
                        return;
                      }

                      const studentVal = formRemedialStudent || `${displayStudents[0].prenom} ${displayStudents[0].nom}`;
                      const subjectVal = formRemedialSubject || displaySubjects[0];
                      const matchedStudent = displayStudents.find(s => `${s.prenom} ${s.nom}` === studentVal);
                      const classVal = matchedStudent?.classe || '3ème A';

                      try {
                        await addDoc(collection(db, 'resp_remedial_groups'), {
                          studentName: studentVal,
                          subject: subjectVal,
                          level: classVal,
                          date: 'Mercredi 14h30'
                        });
                        setFormRemedialStudent('');
                        notifySuccess("Élève inscrit au soutien scolaire !");
                      } catch (error) {
                        console.error("Error adding remedial group:", error);
                      }
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block">Élève en difficulté</label>
                      <select 
                        value={formRemedialStudent}
                        onChange={(e) => setFormRemedialStudent(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                        disabled={displayStudents.length === 0}
                      >
                        {displayStudents.length === 0 ? (
                          <option value="">Aucun élève trouvé dans la base</option>
                        ) : (
                          displayStudents.map(student => (
                            <option key={student.id} value={`${student.prenom} ${student.nom}`}>
                              {student.prenom} {student.nom} ({student.classe || 'Sans classe'})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block">Matière Soutien</label>
                      <select
                        value={formRemedialSubject}
                        onChange={(e) => setFormRemedialSubject(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                      >
                        {displaySubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                    >
                      Ouvrir un groupe de soutien
                    </button>
                  </form>
                );
              })()}

              {/* Form 6: Surveillant General */}
              {activeRespId === 'surveillant_general' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!enforcePermission('surveillant_general')) return;
                    if (!formLateName.trim() || !formLateReason.trim()) return;

                    try {
                      await addDoc(collection(db, 'resp_late_slips'), {
                        studentName: formLateName,
                        duration: Number(formLateDuration),
                        reason: formLateReason,
                        date: 'Aujourd\'hui',
                        hasTicket: true
                      });
                      setFormLateName('');
                      setFormLateReason('');
                      notifySuccess("Billet de retard officiel généré !");
                    } catch (error) {
                      console.error("Error adding late slip:", error);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Élève en retard</label>
                    <input 
                      type="text" 
                      placeholder="Nom complet"
                      value={formLateName}
                      onChange={(e) => setFormLateName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Minutes de Retard</label>
                    <select
                      value={formLateDuration}
                      onChange={(e) => setFormLateDuration(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Raison formelle</label>
                    <input 
                      type="text" 
                      placeholder="Panne de réveil, embouteillages..."
                      value={formLateReason}
                      onChange={(e) => setFormLateReason(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-red-600 text-white rounded-xl font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                  >
                    Émettre le Billet
                  </button>
                </form>
              )}

              {/* Form 7: Surveillant Adjoint */}
              {activeRespId === 'surveillant_adjoint' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!enforcePermission('surveillant_adjoint')) return;
                    if (!formVisitorName.trim() || !formVisitorReason.trim()) return;

                    try {
                      await addDoc(collection(db, 'resp_visitors_log'), {
                        visitorName: formVisitorName,
                        reason: formVisitorReason,
                        targetPerson: formVisitorTarget || 'Direction',
                        entryTime: 'À l\'instant',
                        status: 'inside'
                      });
                      setFormVisitorName('');
                      setFormVisitorReason('');
                      setFormVisitorTarget('');
                      notifySuccess("Enregistrement du visiteur portail avec succès !");
                    } catch (error) {
                      console.error("Error adding visitor:", error);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Identité du Visiteur</label>
                    <input 
                      type="text" 
                      placeholder="Nom, Société, etc."
                      value={formVisitorName}
                      onChange={(e) => setFormVisitorName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Motif de visite</label>
                    <input 
                      type="text" 
                      placeholder="Livraison, Entretien parent..."
                      value={formVisitorReason}
                      onChange={(e) => setFormVisitorReason(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                  >
                    Ouvrir Accès Barrière
                  </button>
                </form>
              )}

              {/* Form 8: Dame Ménage */}
              {activeRespId === 'dame_menage' && (
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-center">
                  <p className="text-xs font-bold text-teal-700">Audit de salubrité</p>
                  <p className="text-[10px] text-gray-450 mt-1">Vous pouvez réclamer du matériel ou déclarer un dysfonctionnement de plomberie directement au service IT / Administrative de l'école.</p>
                  <button
                    onClick={async () => {
                      if (!enforcePermission('dame_menage')) return;
                      try {
                        await addDoc(collection(db, 'resp_it_tickets'), {
                          item: 'Incident Plomberie (Sanitaires ou blocs)',
                          description: 'Dysfonctionnement de plomberie signalé par la Dame de Ménage.',
                          severity: 'minor',
                          status: 'open'
                        });
                        notifySuccess("Alerte plomberie transmise de manière prévenante !");
                      } catch (error) {
                        console.error("Error declaring plomberie incident:", error);
                      }
                    }}
                    className="w-full mt-3 py-2 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                  >
                    Déclarer un Incident Plomberie
                  </button>
                </div>
              )}

              {/* Form 9: Secretaire Generale */}
              {activeRespId === 'secretaire_generale' && (
                <div className="space-y-4 text-xs text-left">
                  {/* Select custom type toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSecFormType('dossier')}
                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                        secFormType === 'dossier'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
                      }`}
                    >
                      Nouveau Dossier
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecFormType('task')}
                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                        secFormType === 'task'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'
                      }`}
                    >
                      Nouvelle Tâche
                    </button>
                  </div>

                  {secFormType === 'dossier' ? (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!enforcePermission('secretaire_generale')) return;
                        if (!formDocName.trim() || !formDocOrigin.trim()) return;

                        try {
                          await addDoc(collection(db, 'resp_dossiers'), {
                            name: formDocName,
                            level: formDocLevel,
                            originSchool: formDocOrigin,
                            status: 'pending'
                          });
                          setFormDocName('');
                          setFormDocOrigin('');
                          notifySuccess("Candidature encodée sur le registre !");
                        } catch (error) {
                          console.error("Error adding dossier:", error);
                        }
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block text-left">Candidat Nom complet</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Kouassi Jean"
                          value={formDocName}
                          onChange={(e) => setFormDocName(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block text-left">Niveau de Direction visé</label>
                        <select
                          value={formDocLevel}
                          onChange={(e) => setFormDocLevel(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none text-xs"
                        >
                          <option value="Responsable Pédagogique">Responsable Pédagogique</option>
                          <option value="Responsable Maternelle">Responsable Maternelle</option>
                          <option value="Responsable Collège">Responsable Collège</option>
                          <option value="Responsable Primaire">Responsable Primaire</option>
                          <option value="Responsable IT">Responsable IT (Matériels informatiques)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block text-left">Établissement de provenance</label>
                        <input 
                          type="text" 
                          placeholder="Lycée municipal..."
                          value={formDocOrigin}
                          onChange={(e) => setFormDocOrigin(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                      >
                        Enregistrer Candidature
                      </button>
                    </form>
                  ) : (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!enforcePermission('secretaire_generale')) return;
                        if (!formTaskTitle.trim()) return;

                        try {
                          await addDoc(collection(db, 'resp_secretaire_tasks'), {
                            title: formTaskTitle,
                            description: formTaskDesc,
                            dueDate: formTaskDueDate || 'Non planifiée',
                            priority: formTaskPriority,
                            scope: formTaskScope,
                            completed: false
                          });
                          setFormTaskTitle('');
                          setFormTaskDesc('');
                          setFormTaskDueDate('');
                          notifySuccess("Tâche ajoutée en temps réel !");
                        } catch (error) {
                          console.error("Error adding task:", error);
                        }
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block text-left font-bold">Titre de la tâche</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Préparation des dossiers d'admission"
                          value={formTaskTitle}
                          onChange={(e) => setFormTaskTitle(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block text-left font-bold">Description détaillée</label>
                        <input 
                          type="text" 
                          placeholder="Spécifiez les objectifs ou détails..."
                          value={formTaskDesc}
                          onChange={(e) => setFormTaskDesc(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block text-left font-bold">Date d'échéance</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Ce vendredi, 15h"
                          value={formTaskDueDate}
                          onChange={(e) => setFormTaskDueDate(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block text-left font-bold">Priorité</label>
                          <select
                            value={formTaskPriority}
                            onChange={(e: any) => setFormTaskPriority(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none text-xs"
                          >
                            <option value="low">Normale</option>
                            <option value="medium">Moyenne</option>
                            <option value="high">Urgente</option>
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block text-left font-bold">Espace de Destination</label>
                          <select
                            value={formTaskScope}
                            onChange={(e: any) => setFormTaskScope(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl outline-none text-xs"
                          >
                            <option value="Bureau Direction">Bureau Direction</option>
                            <option value="Secrétariat Général">Secrétariat Général</option>
                            <option value="Responsable Pédagogique">Responsable Pédagogique</option>
                            <option value="Responsable Maternelle">Responsable Maternelle</option>
                            <option value="Responsable Collège">Responsable Collège</option>
                            <option value="Responsable Primaire">Responsable Primaire</option>
                            <option value="Responsable IT">Responsable IT (Matériels informatiques)</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                      >
                        Créer une nouvelle tâche
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Form 10: Secretaire Adjointe */}
              {activeRespId === 'secretaire_adjointe' && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!enforcePermission('secretaire_adjointe')) return;
                    if (!formCallCaller.trim() || !formCallMsg.trim()) return;

                    try {
                      await addDoc(collection(db, 'resp_phone_calls'), {
                        caller: formCallCaller,
                        message: formCallMsg,
                        targetStudent: formCallStudent || 'Néant',
                        status: 'noted'
                      });
                      setFormCallCaller('');
                      setFormCallMsg('');
                      setFormCallStudent('');
                      notifySuccess("Message téléphonique consigné !");
                    } catch (error) {
                      console.error("Error adding phone call:", error);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Correspondant & N°</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Banque de l'Habitat CI"
                      value={formCallCaller}
                      onChange={(e) => setFormCallCaller(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Message écrit</label>
                    <textarea 
                      placeholder="Urgent : Demande de certificat scolaire pour dossier de crédit."
                      rows={2}
                      value={formCallMsg}
                      onChange={(e) => setFormCallMsg(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                  >
                    Consigner Appel
                  </button>
                </form>
              )}

              {/* Form 11: IT Material */}
              {activeRespId === 'responsable_it' && (() => {
                const displayClasses = dbClasses.length > 0 ? dbClasses.map(c => c.name || c.id) : ["Terminales S-A", "Terminales S-B", "3ème A", "4ème B", "6ème C"];
                const tabletCarts = ["Chariot Tablettes Android #1", "Chariot Tablettes Android #2", "Valise iPads Pro #1", "Vidéo-projecteur Mobile #2"];

                return (
                  <div className="space-y-3">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setItFormType('incident')}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          itFormType === 'incident'
                            ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Incident Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => setItFormType('loan')}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          itFormType === 'loan'
                            ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-500 font-bold'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        Nouveau Prêt
                      </button>
                    </div>

                    {itFormType === 'incident' ? (
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_it')) return;
                          if (!formITItem.trim() || !formITDesc.trim()) return;

                          try {
                            await addDoc(collection(db, 'resp_it_tickets'), {
                              item: formITItem,
                              description: formITDesc,
                              severity: formITSeverity,
                              status: 'open'
                            });
                            setFormITItem('');
                            setFormITDesc('');
                            notifySuccess("Incident informatique consigné !");
                          } catch (error) {
                            console.error("Error adding IT ticket:", error);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Matériel défaillant</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Ordinateur portable Salle 4"
                            value={formITItem}
                            onChange={(e) => setFormITItem(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Symptômes relevés</label>
                          <textarea 
                            placeholder="Ne s'allume plus après mise à jour..."
                            rows={2}
                            value={formITDesc}
                            onChange={(e) => setFormITDesc(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-440 block">Gravité</label>
                          <select
                            value={formITSeverity}
                            onChange={(e) => setFormITSeverity(e.target.value as any)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            <option value="minor">Mineure (Simple bug)</option>
                            <option value="critical">Critique (Bloquant cours)</option>
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Créer incident ticket
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!enforcePermission('responsable_it')) return;
                          const selectedCart = formITLoanCart || tabletCarts[0];
                          const selectedClass = formITLoanClass || displayClasses[0];

                          try {
                            await addDoc(collection(db, 'resp_it_loans'), {
                              cartId: selectedCart,
                              classTarget: selectedClass,
                              duration: formITLoanDuration,
                              status: 'borrowed'
                            });
                            notifySuccess("Chariot de valises tablettes enregistré en prêt !");
                          } catch (error) {
                            console.error("Error creating IT loan doc:", error);
                          }
                        }}
                        className="space-y-3 text-xs"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Chariot / Valise</label>
                          <select
                            value={formITLoanCart}
                            onChange={(e) => setFormITLoanCart(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            {tabletCarts.map(cart => (
                              <option key={cart} value={cart}>{cart}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Classe destinataire</label>
                          <select
                            value={formITLoanClass}
                            onChange={(e) => setFormITLoanClass(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          >
                            {displayClasses.map(clsName => (
                              <option key={clsName} value={clsName}>{clsName}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400 block">Date & Créneau de retour</label>
                          <input 
                            type="text" 
                            value={formITLoanDuration}
                            onChange={(e) => setFormITLoanDuration(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-750 outline-none"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          Enregistrer Sortie Valise
                        </button>
                      </form>
                    )}
                  </div>
                );
              })()}
              </>
              )}

            </div>

            {/* General Advice and Mission statement */}
            <div className="bg-slate-900 text-slate-100 rounded-[2.5rem] p-6 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkle className="text-amber-400 animate-spin" size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fiche de Poste & Missions</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Chaque action que vous entreprenez sur cette interface est sauvegardée et transmise aux rapports d'activités opérationnelles de l'établissement pour assurer la transparence et la bonne marche de l'école.
              </p>
            </div>

          </div>

        </div>
      </div>
      )}

    </div>
  );
}
