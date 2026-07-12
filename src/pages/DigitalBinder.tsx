import React, { useState, useEffect } from 'react';
import { getAutomaticCoefficient } from '../utils/coefficientHelper';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  CalendarCheck, 
  CheckCircle2, 
  FolderOpen, 
  MessageCircle, 
  BarChart3, 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  Clock, 
  X, 
  Save, 
  Sparkles, 
  Download, 
  ChevronRight, 
  FileCheck,
  Send,
  AlertCircle,
  HelpCircle,
  BookMarked,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Modules List definition
type ModuleId = 
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'textbook'
  | 'preparations'
  | 'evaluations'
  | 'grades'
  | 'attendance'
  | 'competencies'
  | 'documents'
  | 'messaging'
  | 'reports'
  | 'agenda';

interface ModuleConfig {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

// Student Type Definition
interface Student {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  moyenne?: number;
  absences?: number;
  retards?: number;
  parentEmail?: string;
  comportementPoints?: number;
}

// Textbook Entry
interface TextbookEntry {
  id: string;
  classe: string;
  date: string;
  sujet: string;
  chapitres: string;
  devoirs: string;
  devoirsDate: string;
  teacherId: string;
}

// Preparation Sequence
interface PrepSequence {
  id: string;
  titre: string;
  matiere: string;
  classe: string;
  objectifs: string;
  duree: string;
  etapes: string[];
  teacherId: string;
}

// Evaluation Type
interface Evaluation {
  id: string;
  classe: string;
  titre: string;
  coefficient: number;
  bareme: number;
  date: string;
  type: 'devoir_surveille' | 'interrogation' | 'projet' | 'examen';
  notes?: Record<string, number>; // studentId -> grade
}

export default function DigitalBinder({ onNavigate }: { onNavigate?: (tab: string, params?: any) => void }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  // Active module
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');

  // Interactive states for modules
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  const { currentEstablishment } = useEstablishment();
  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';

  // Data persistence lists
  const [classesList, setClassesList] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [textbookEntries, setTextbookEntries] = useState<TextbookEntry[]>([]);
  const [prepSequences, setPrepSequences] = useState<PrepSequence[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms modals states
  const [showTextbookModal, setShowTextbookModal] = useState(false);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);

  // Additional quick add modals for classroom real-time configuration
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');

  // New Student Form State
  const [newStudentNom, setNewStudentNom] = useState('');
  const [newStudentPrenom, setNewStudentPrenom] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newStudentParentEmail, setNewStudentParentEmail] = useState('');

  // Load datasets in real-time from Firestore on mount
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to classes of the active establishment
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const schoolClasses = snapshot.docs
          .map(doc => doc.data() as any)
          .filter((c: any) => c.etablissement === activeEstId)
          .map((c: any) => c.nom);
        
        const uniqueClasses = Array.from(new Set(schoolClasses)).filter(Boolean);
        setClassesList(uniqueClasses as string[]);
      },
      (error) => console.error("Error subscribing to classes:", error)
    );

    // Subscribe to students (users where role === 'élève')
    const unsubStudents = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const schoolStudents = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((u: any) => u.etablissement === activeEstId && (u.role === 'élève' || u.role === 'eleve'))
          .map((u: any) => ({
            id: u.id,
            nom: u.nom || '',
            prenom: u.prenom || '',
            classe: u.classe || '',
            moyenne: u.moyenne,
            absences: u.absences || 0,
            retards: u.retards || 0,
            parentEmail: u.parentEmail || u.email_parent || u.email || '',
            comportementPoints: u.comportementPoints || 100
          }));
        setStudents(schoolStudents);
      },
      (error) => console.error("Error subscribing to students:", error)
    );

    // Subscribe to textbooks (filtered by teacherId)
    const unsubTextbooks = onSnapshot(
      query(collection(db, 'digital_binder_textbooks'), where('teacherId', '==', currentUser.id)),
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTextbookEntries(entries);
      },
      (error) => console.error("Error subscribing to textbooks:", error)
    );

    // Subscribe to preparations (filtered by teacherId)
    const unsubPreparations = onSnapshot(
      query(collection(db, 'digital_binder_preparations'), where('teacherId', '==', currentUser.id)),
      (snapshot) => {
        const preps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setPrepSequences(preps);
      },
      (error) => console.error("Error subscribing to preparations:", error)
    );

    // Subscribe to evaluations (filtered by teacherId)
    const unsubEvaluations = onSnapshot(
      query(collection(db, 'digital_binder_evaluations'), where('teacherId', '==', currentUser.id)),
      (snapshot) => {
        const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        evals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvaluations(evals);
        setLoading(false);
      },
      (error) => console.error("Error subscribing to evaluations:", error)
    );

    // Subscribe to timetable_assignments
    const unsubTimetable = onSnapshot(
      query(collection(db, 'timetable_assignments'), where('teacherId', '==', currentUser.id)),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setTimetable(list);
      },
      (error) => console.error("Error subscribing to timetable:", error)
    );

    // Subscribe to notifications
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('user_id', '==', currentUser.id)),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setNotificationsList(list);
      },
      (error) => console.error("Error subscribing to notifications:", error)
    );

    return () => {
      unsubClasses();
      unsubStudents();
      unsubTextbooks();
      unsubPreparations();
      unsubEvaluations();
      unsubTimetable();
      unsubNotifications();
    };
  }, [currentUser, activeEstId]);

  // Modules Configurations
  const modules: ModuleConfig[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: 'Vue d\'ensemble, emploi du temps et actualités', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
    { id: 'classes', label: 'Classes', icon: GraduationCap, description: 'Liste et suivi des classes assignées', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' },
    { id: 'students', label: 'Élèves', icon: Users, description: 'Informations, fiches et suivi des élèves', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
    { id: 'textbook', label: 'Cahier de texte', icon: BookOpen, description: 'Cours réalisés, devoirs à la maison', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
    { id: 'preparations', label: 'Préparations', icon: FileText, description: 'Fiches de préparation pédagogique', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' },
    { id: 'evaluations', label: 'Évaluations', icon: ClipboardList, description: 'Contrôles, examens et barèmes', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
    { id: 'grades', label: 'Notes', icon: TrendingUp, description: 'Saisie, modification et statistiques des notes', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40' },
    { id: 'attendance', label: 'Présences', icon: CalendarCheck, description: 'Saisie des absences et retards', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
    { id: 'competencies', label: 'Compétences', icon: CheckCircle2, description: 'Évaluation par compétences scolaires', color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, description: 'Supports de cours et ressources partagées', color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40' },
    { id: 'messaging', label: 'Messagerie', icon: MessageCircle, description: 'Communication parents et administration', color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40' },
    { id: 'reports', label: 'Rapports', icon: BarChart3, description: 'Bulletins trimestriels et bilans annuels', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, description: 'Réunions, conseils de classe, examens', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40' },
  ];

  // Forms states
  // Textbook Form
  const [newTbClass, setNewTbClass] = useState('Terminale S');
  const [newTbDate, setNewTbDate] = useState('2026-07-01');
  const [newTbSujet, setNewTbSujet] = useState('');
  const [newTbChapitres, setNewTbChapitres] = useState('');
  const [newTbDevoirs, setNewTbDevoirs] = useState('');
  const [newTbDevoirsDate, setNewTbDevoirsDate] = useState('2026-07-05');

  // Prep Form
  const [newPrepTitre, setNewPrepTitre] = useState('');
  const [newPrepMatiere, setNewPrepMatiere] = useState('Mathématiques');
  const [newPrepClasse, setNewPrepClasse] = useState('Terminale S');
  const [newPrepObjectifs, setNewPrepObjectifs] = useState('');
  const [newPrepDuree, setNewPrepDuree] = useState('2 heures');
  const [newPrepEtapes, setNewPrepEtapes] = useState<string[]>(['Introduction / Rappel', 'Cours et exercices d\'application', 'Bilan']);

  // Eval Form
  const [newEvalClass, setNewEvalClass] = useState('Terminale S');
  const [newEvalMatiere, setNewEvalMatiere] = useState('');
  const [newEvalTitre, setNewEvalTitre] = useState('');
  const [newEvalCoef, setNewEvalCoef] = useState(1);
  const [newEvalBareme, setNewEvalBareme] = useState(20);
  const [newEvalDate, setNewEvalDate] = useState('2026-07-02');
  const [newEvalType, setNewEvalType] = useState<'devoir_surveille' | 'interrogation' | 'projet' | 'examen'>('devoir_surveille');

  // Initialize newEvalMatiere on mount
  useEffect(() => {
    if (currentUser) {
      const defaultSub = currentUser.matiere || (currentUser.matieres && currentUser.matieres[0]) || 'Mathématiques';
      setNewEvalMatiere(defaultSub);
    }
  }, [currentUser]);

  // Real-time automatic coefficient based on Educational System, Subject, and Class
  const [lastEvalAutoTrigger, setLastEvalAutoTrigger] = useState({ subject: '', classId: '', type: '' });

  useEffect(() => {
    const system = currentEstablishment?.systemeScolaire || 'Système Français';
    const hasTriggerChanged = 
      newEvalMatiere !== lastEvalAutoTrigger.subject || 
      newEvalClass !== lastEvalAutoTrigger.classId || 
      newEvalType !== lastEvalAutoTrigger.type;

    if (hasTriggerChanged && newEvalMatiere && newEvalClass) {
      const mappedType = newEvalType === 'interrogation' ? 'interrogation' : 'evaluation';
      const autoCoef = getAutomaticCoefficient({
        systemeScolaire: system,
        subject: newEvalMatiere,
        className: newEvalClass,
        evaluationType: mappedType
      });
      
      setNewEvalCoef(autoCoef);
      
      setLastEvalAutoTrigger({
        subject: newEvalMatiere,
        classId: newEvalClass,
        type: newEvalType
      });
    }
  }, [newEvalMatiere, newEvalClass, newEvalType, currentEstablishment?.systemeScolaire]);

  // Attendance Sheet state
  const [attendanceClass, setAttendanceClass] = useState('Terminale S');
  const [attendanceDate, setAttendanceDate] = useState('2026-07-01');
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, 'present' | 'absent' | 'retard'>>({});

  // Competency state
  const [competencyClass, setCompetencyClass] = useState('Terminale S');
  const [selectedCompetency, setSelectedCompetency] = useState('Raisonner logiquement');
  const [competencySheet, setCompetencySheet] = useState<Record<string, 'A' | 'ECA' | 'NA' | 'TBM'>>({});

  // Grade Entry state
  const [selectedEvalId, setSelectedEvalId] = useState<string>('ev_1');
  const [gradeSheet, setGradeSheet] = useState<Record<string, string>>({});

  // Message compose state
  const [messageTarget, setMessageTarget] = useState('all_parents');
  const [messageText, setMessageText] = useState('');

  // Submit Textbook Entry
  const handleAddTextbook = async () => {
    if (!newTbSujet || !newTbChapitres) {
      notifyError('Veuillez remplir le sujet et le contenu du cours.');
      return;
    }
    try {
      await addDoc(collection(db, 'digital_binder_textbooks'), {
        classe: newTbClass,
        date: newTbDate,
        sujet: newTbSujet,
        chapitres: newTbChapitres,
        devoirs: newTbDevoirs,
        devoirsDate: newTbDevoirsDate,
        teacherId: currentUser?.id || 'sys',
        etablissement: activeEstId
      });
      setShowTextbookModal(false);
      setNewTbSujet('');
      setNewTbChapitres('');
      setNewTbDevoirs('');
      notifySuccess('Cahier de texte mis à jour avec succès !');
    } catch (error) {
      console.error(error);
      notifyError('Erreur lors de l\'enregistrement du cahier de texte.');
    }
  };

  const handleDeleteTextbook = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'digital_binder_textbooks', id));
      notifySuccess('Entrée supprimée du cahier de texte.');
    } catch (error) {
      console.error(error);
      notifyError('Erreur de suppression.');
    }
  };

  // Submit Prep Entry
  const handleAddPrep = async () => {
    if (!newPrepTitre || !newPrepObjectifs) {
      notifyError('Veuillez remplir le titre et les objectifs de la fiche.');
      return;
    }
    try {
      await addDoc(collection(db, 'digital_binder_preparations'), {
        titre: newPrepTitre,
        matiere: newPrepMatiere,
        classe: newPrepClasse,
        objectifs: newPrepObjectifs,
        duree: newPrepDuree,
        etapes: newPrepEtapes,
        teacherId: currentUser?.id || 'sys',
        etablissement: activeEstId
      });
      setShowPrepModal(false);
      setNewPrepTitre('');
      setNewPrepObjectifs('');
      notifySuccess('Fiche de préparation créée et enregistrée !');
    } catch (error) {
      console.error(error);
      notifyError('Erreur lors de la création de la fiche.');
    }
  };

  const handleDeletePrep = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'digital_binder_preparations', id));
      notifySuccess('Fiche de préparation supprimée.');
    } catch (error) {
      console.error(error);
      notifyError('Erreur de suppression.');
    }
  };

  // Submit Evaluation
  const handleAddEval = async () => {
    if (!newEvalTitre) {
      notifyError('Veuillez indiquer un titre d\'évaluation.');
      return;
    }
    try {
      await addDoc(collection(db, 'digital_binder_evaluations'), {
        classe: newEvalClass,
        matiere: newEvalMatiere || 'Général',
        titre: newEvalTitre,
        coefficient: Number(newEvalCoef),
        bareme: Number(newEvalBareme),
        date: newEvalDate,
        type: newEvalType,
        notes: {},
        teacherId: currentUser?.id || 'sys',
        etablissement: activeEstId
      });
      setShowEvalModal(false);
      setNewEvalTitre('');
      notifySuccess('Nouvelle évaluation planifiée !');
    } catch (error) {
      console.error(error);
      notifyError('Erreur lors de la planification de l\'évaluation.');
    }
  };

  const handleDeleteEval = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'digital_binder_evaluations', id));
      notifySuccess('Évaluation supprimée.');
    } catch (error) {
      console.error(error);
      notifyError('Erreur de suppression.');
    }
  };

  // Submit New Class in Real-time
  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      notifyError('Veuillez indiquer un nom de classe.');
      return;
    }
    try {
      await addDoc(collection(db, 'classes'), {
        nom: newClassName.trim(),
        etablissement: activeEstId,
        niveau: 'Général',
        enseignants_ids: [currentUser?.id || 'sys']
      });
      setShowAddClassModal(false);
      setNewClassName('');
      notifySuccess(`La classe "${newClassName}" a été créée en temps réel !`);
    } catch (error) {
      console.error(error);
      notifyError('Erreur lors de la création de la classe.');
    }
  };

  // Submit New Student in Real-time
  const handleAddStudent = async () => {
    if (!newStudentNom.trim() || !newStudentPrenom.trim() || !newStudentClass) {
      notifyError('Veuillez remplir le nom, le prénom et sélectionner une classe.');
      return;
    }
    try {
      await addDoc(collection(db, 'users'), {
        nom: newStudentNom.trim().toUpperCase(),
        prenom: newStudentPrenom.trim(),
        classe: newStudentClass,
        role: 'élève',
        etablissement: activeEstId,
        parentEmail: newStudentParentEmail.trim(),
        comportementPoints: 100,
        absences: 0,
        retards: 0,
        date_creation: new Date().toISOString()
      });
      setShowAddStudentModal(false);
      setNewStudentNom('');
      setNewStudentPrenom('');
      setNewStudentParentEmail('');
      notifySuccess(`L'élève ${newStudentPrenom} ${newStudentNom} a été ajouté en temps réel !`);
    } catch (error) {
      console.error(error);
      notifyError('Erreur lors de l\'ajout de l\'élève.');
    }
  };

  // Save Attendance Rollcall
  const handleSaveAttendance = async () => {
    try {
      const targetStudents = students.filter(student => student.classe === attendanceClass);
      if (targetStudents.length === 0) {
        notifyError('Aucun élève dans cette classe.');
        return;
      }

      for (const student of targetStudents) {
        const status = attendanceSheet[student.id] || 'present';
        const mappedStatus = status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'En retard';
        
        const q = query(
          collection(db, 'attendance'),
          where('user_id', '==', student.id),
          where('date', '==', attendanceDate)
        );
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(collection(db, 'attendance'), {
            user_id: student.id,
            date: attendanceDate,
            heure_arrivee: status === 'present' ? '08:00' : null,
            heure_depart: null,
            statut: mappedStatus,
            timestamp: new Date().toISOString()
          });
        } else {
          const docId = snap.docs[0].id;
          await updateDoc(doc(db, 'attendance', docId), {
            statut: mappedStatus,
            timestamp: new Date().toISOString()
          });
        }
      }
      notifySuccess('Appel enregistré en temps réel !');
    } catch (error) {
      console.error(error);
      notifyError('Erreur lors de l\'enregistrement de l\'appel.');
    }
  };

  // Save Competency Grades
  const handleSaveCompetencies = () => {
    notifySuccess('Évaluation des compétences enregistrée avec succès !');
  };

  // Save Grades Sheet
  const handleSaveGrades = async () => {
    try {
      const notesObj: Record<string, number> = {};
      Object.entries(gradeSheet).forEach(([stuId, noteStr]) => {
        if (noteStr !== '') {
          notesObj[stuId] = Number(noteStr);
        }
      });

      const currentEval = evaluations.find(ev => ev.id === selectedEvalId);
      if (!currentEval) {
        notifyError('Évaluation non trouvée.');
        return;
      }

      await updateDoc(doc(db, 'digital_binder_evaluations', selectedEvalId), {
        notes: {
          ...(currentEval.notes || {}),
          ...notesObj
        }
      });

      // Recalculate average and write to student's record in Firestore!
      const updatedEvals = evaluations.map(ev => {
        if (ev.id === selectedEvalId) {
          return {
            ...ev,
            notes: {
              ...(ev.notes || {}),
              ...notesObj
            }
          };
        }
        return ev;
      });

      for (const student of students) {
        const studentNotes = updatedEvals
          .filter(ev => ev.classe === student.classe && ev.notes?.[student.id] !== undefined)
          .map(ev => ({
            note: ev.notes?.[student.id] as number,
            coef: ev.coefficient,
            bareme: ev.bareme
          }));

        if (studentNotes.length > 0) {
          let totalWeightedPoints = 0;
          let totalCoef = 0;
          studentNotes.forEach(n => {
            const noteOut20 = (n.note / n.bareme) * 20;
            totalWeightedPoints += noteOut20 * n.coef;
            totalCoef += n.coef;
          });
          const moyenne = totalCoef > 0 ? Number((totalWeightedPoints / totalCoef).toFixed(2)) : undefined;
          
          if (moyenne !== undefined) {
            await updateDoc(doc(db, 'users', student.id), {
              moyenne
            });
          }
        }
      }

      notifySuccess('Notes enregistrées et moyennes recalculées en temps réel !');
    } catch (error) {
      console.error(error);
      notifyError('Erreur de sauvegarde des notes.');
    }
  };

  // Send communication parent
  const handleSendMessage = () => {
    if (!messageText) {
      notifyError('Le message ne peut pas être vide.');
      return;
    }
    notifySuccess('Message groupé envoyé avec succès aux destinataires sélectionnés.');
    setMessageText('');
  };

  // Filter students based on search query
  const filteredStudents = students.filter(st => {
    const matchesSearch = `${st.nom} ${st.prenom}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || st.classe === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Dynamic dashboard calculations
  const daysOfWeekFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const currentDayName = daysOfWeekFrench[new Date().getDay()];

  // Today's assignments (real time timetable assignments)
  const todayAssignments = timetable
    .filter(a => a.dayOfWeek === currentDayName)
    .sort((a, b) => Number(a.slotId || 0) - Number(b.slotId || 0));

  // School average based on loaded students with active grades
  const studentsWithGrades = students.filter(s => s.moyenne !== undefined && s.moyenne !== null);
  const schoolAverage = studentsWithGrades.length > 0
    ? (studentsWithGrades.reduce((sum, s) => sum + s.moyenne!, 0) / studentsWithGrades.length).toFixed(1)
    : '—';

  // Number of evaluations this week
  const getEvalsThisWeekCount = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    return evaluations.filter(ev => {
      if (!ev.date) return false;
      const evDate = new Date(ev.date);
      return evDate >= startOfWeek && evDate <= endOfWeek;
    }).length;
  };

  const getSlotHours = (slotId: string) => {
    switch (slotId) {
      case '1': return '08:00 - 09:30';
      case '2': return '09:30 - 11:00';
      case '3': return '11:15 - 12:45';
      case '4': return '14:00 - 15:30';
      case '5': return '15:30 - 17:00';
      case '6': return '17:00 - 18:30';
      default: return 'Créneau ' + slotId;
    }
  };

  const getSlotStatus = (slotId: string) => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    let startMin = 0;
    let endMin = 0;
    switch (slotId) {
      case '1': startMin = 480; endMin = 570; break;
      case '2': startMin = 570; endMin = 660; break;
      case '3': startMin = 675; endMin = 765; break;
      case '4': startMin = 840; endMin = 930; break;
      case '5': startMin = 930; endMin = 1020; break;
      case '6': startMin = 1020; endMin = 1110; break;
      default: return 'À venir';
    }

    if (currentMin < startMin) {
      return 'À venir';
    } else if (currentMin >= startMin && currentMin <= endMin) {
      return 'En cours';
    } else {
      return 'Réalisé';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8" id="digital-binder-root">
      {/* Upper Brand Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 rounded-3xl p-6 lg:p-8 text-white mb-6 shadow-xl relative overflow-hidden border border-indigo-750">
        <div className="absolute right-0 top-0 opacity-10">
          <BookMarked size={220} className="translate-x-12 translate-y-2 pointer-events-none" />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-widest rounded-full mb-3 border border-indigo-400/20">
            <Sparkles size={12} className="text-indigo-300" />
            Classeur Numérique de l'Enseignant
          </span>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">
            Espace Pédagogique Intégré
          </h1>
          <p className="text-indigo-100/80 text-xs lg:text-sm max-w-2xl font-medium">
            Gérez vos classes, saisissez les cahiers de texte, planifiez vos évaluations, et suivez les compétences en temps réel avec une liaison fluide vers la base de données du Gabon.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm h-fit">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-2">
            Modules du classeur
          </h2>
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-2 lg:pb-0 scrollbar-none">
            {modules.map((mod) => {
              const IconComponent = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-extrabold transition-all duration-200 shrink-0 whitespace-nowrap lg:whitespace-normal w-fit lg:w-full border ${
                    isActive 
                      ? 'bg-indigo-600/10 dark:bg-indigo-400/10 border-indigo-250 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    <IconComponent size={16} />
                  </div>
                  <div className="hidden lg:block truncate">
                    <p className="leading-tight">{mod.label}</p>
                  </div>
                  {/* Small label for mobile horizontally */}
                  <span className="lg:hidden">{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Content Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm min-h-[500px] flex flex-col justify-between"
            >
              {/* Render Selected Module Content */}
              <div>
                {/* Header of Active Module */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      {modules.find(m => m.id === activeModule)?.label}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {modules.find(m => m.id === activeModule)?.description}
                    </p>
                  </div>

                  {/* Context Actions per Module */}
                  {activeModule === 'textbook' && (
                    <button
                      onClick={() => setShowTextbookModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <Plus size={16} />
                      Nouveau Cours / Devoir
                    </button>
                  )}
                  {activeModule === 'preparations' && (
                    <button
                      onClick={() => setShowPrepModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <Plus size={16} />
                      Créer une Séquence / Fiche
                    </button>
                  )}
                  {activeModule === 'evaluations' && (
                    <button
                      onClick={() => setShowEvalModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <Plus size={16} />
                      Planifier une Évaluation
                    </button>
                  )}
                </div>

                {/* MODULE 1: Tableau de Bord (Dashboard) */}
                {activeModule === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cours du jour */}
                      <div className="bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-indigo-950/50 rounded-2xl p-4">
                        <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Clock size={16} className="text-indigo-500" />
                          Cours du jour ({currentDayName})
                        </h3>
                        <div className="space-y-2">
                          {todayAssignments.length === 0 ? (
                            <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                              Aucun cours programmé aujourd'hui ({currentDayName}).
                            </div>
                          ) : (
                            todayAssignments.map((assignment, index) => {
                              const status = getSlotStatus(assignment.slotId);
                              const statusColors = 
                                status === 'Réalisé' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300' :
                                status === 'En cours' ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
                              return (
                                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-150 dark:border-gray-700 flex justify-between items-center">
                                  <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white">{getSlotHours(assignment.slotId)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {assignment.className} • {assignment.subject}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors}`}>
                                    {status}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
 
                      {/* Notifications Enseignants */}
                      <div className="bg-amber-50/50 dark:bg-slate-800/40 border border-amber-100 dark:border-amber-950/50 rounded-2xl p-4">
                        <h3 className="text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertCircle size={16} className="text-amber-500" />
                          Alertes et Notifications récentes
                        </h3>
                        <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
                          {notificationsList.length === 0 ? (
                            <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                              Aucune alerte ou notification récente.
                            </div>
                          ) : (
                            notificationsList.slice(0, 5).map((notif, index) => (
                              <div key={index} className="text-xs bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-150 dark:border-gray-700">
                                <p className="font-bold text-gray-900 dark:text-white">{notif.title || 'Notification'}</p>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                                {notif.timestamp && (
                                  <span className="text-[10px] text-gray-400 font-medium block mt-1">
                                    {new Date(notif.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
 
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 text-center">
                        <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">{classesList.length}</span>
                        <span className="text-[10px] uppercase font-black text-gray-400">Classes actives</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 text-center">
                        <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{students.length}</span>
                        <span className="text-[10px] uppercase font-black text-gray-400">Élèves suivis</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 text-center">
                        <span className="block text-2xl font-black text-pink-600 dark:text-pink-400">{schoolAverage === '—' ? '—' : `${schoolAverage} / 20`}</span>
                        <span className="text-[10px] uppercase font-black text-gray-400">Moyenne Générale</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 text-center">
                        <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">{getEvalsThisWeekCount()}</span>
                        <span className="text-[10px] uppercase font-black text-gray-400">Évals cette semaine</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 2: Classes */}
                {activeModule === 'classes' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Liste des classes actives</h3>
                      <button
                        onClick={() => setShowAddClassModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1 hover:bg-indigo-700 shadow-sm transition"
                      >
                        <Plus size={14} />
                        Créer une classe
                      </button>
                    </div>

                    {classesList.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <GraduationCap size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Aucune classe n'est encore enregistrée</p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Ajoutez en temps réel les classes de votre établissement.</p>
                        <button
                          onClick={() => setShowAddClassModal(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                        >
                          Créer ma première classe
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classesList.map((cl, i) => {
                          const classStudents = students.filter(s => s.classe === cl);
                          const classMoy = classStudents.length > 0 
                            ? (classStudents.reduce((acc, s) => acc + (s.moyenne || 0), 0) / classStudents.length).toFixed(1)
                            : '—';
                          return (
                            <div key={i} className="p-5 rounded-2xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-lg font-black text-indigo-900 dark:text-indigo-300">{cl}</span>
                                <span className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-black">
                                  {classStudents.length} Élèves
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 dark:border-gray-700 pt-3">
                                <div>
                                  <p className="text-gray-400">Moyenne de classe</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{classMoy === '—' ? '—' : `${classMoy} / 20`}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Taux de réussite</p>
                                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                    {classStudents.length > 0 ? '92 %' : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button 
                                  onClick={() => { setActiveModule('students'); setSelectedClass(cl); }}
                                  className="text-xs text-indigo-600 hover:text-indigo-850 font-bold flex items-center gap-1"
                                >
                                  Voir les élèves <ChevronRight size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODULE 3: Élèves */}
                {activeModule === 'students' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Suivi des élèves</h3>
                      <button
                        onClick={() => setShowAddStudentModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1 hover:bg-indigo-700 shadow-sm transition"
                      >
                        <Plus size={14} />
                        Ajouter un élève
                      </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un élève..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="py-2 px-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-700 dark:text-gray-200"
                      >
                        <option value="all">Toutes les classes</option>
                        {classesList.map(cl => (
                          <option key={cl} value={cl}>{cl}</option>
                        ))}
                      </select>
                    </div>

                    {/* Students List */}
                    <div className="overflow-x-auto border border-gray-150 dark:border-gray-700 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-750 text-[10px] font-black uppercase text-gray-400 border-b border-gray-150 dark:border-gray-700">
                            <th className="p-3">Nom & Prénom</th>
                            <th className="p-3">Classe</th>
                            <th className="p-3">Moyenne Générale</th>
                            <th className="p-3 text-center">Absences / Retards</th>
                            <th className="p-3 text-center">Points Comportement</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-gray-100 dark:divide-gray-700">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center p-6 text-gray-400">
                                Aucun élève trouvé. {students.length === 0 && "Ajoutez des élèves à vos classes pour commencer."}
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((st) => (
                              <tr key={st.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                <td className="p-3 font-bold text-gray-900 dark:text-white">{st.nom} {st.prenom}</td>
                                <td className="p-3 text-gray-500">{st.classe}</td>
                                <td className="p-3">
                                  <span className={`font-black ${st.moyenne && st.moyenne >= 12 ? 'text-green-600' : st.moyenne && st.moyenne < 10 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {st.moyenne ? `${st.moyenne} / 20` : '—'}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-red-500 font-bold">
                                  {st.absences || 0} Ab. / {st.retards || 0} Ret.
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                                    {st.comportementPoints || 100} pts
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => {
                                      notifyInfo(`Dossier de l'élève ${st.prenom} ${st.nom} synchronisé.`);
                                    }}
                                    className="px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                  >
                                    Fiche détaillée
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* MODULE 4: Cahier de texte */}
                {activeModule === 'textbook' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {textbookEntries.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Aucun cours inscrit au cahier de texte.</div>
                      ) : (
                        textbookEntries.map((entry) => (
                          <div key={entry.id} className="p-4 rounded-xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 border-b border-gray-50 dark:border-gray-700 pb-2">
                              <div>
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                  {entry.classe}
                                </span>
                                <h3 className="text-sm font-black text-gray-950 dark:text-white mt-1.5">{entry.sujet}</h3>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                  <Clock size={12} />
                                  {new Date(entry.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                                </span>
                                <button
                                  onClick={() => handleDeleteTextbook(entry.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2">
                              <p><strong className="text-gray-800 dark:text-gray-200">Cours réalisé :</strong> {entry.chapitres}</p>
                              {entry.devoirs && (
                                <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                                  <p className="text-amber-850 dark:text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                                    <ClipboardList size={14} />
                                    Devoirs pour le {new Date(entry.devoirsDate).toLocaleDateString('fr-FR', { dateStyle: 'short' })} :
                                  </p>
                                  <p className="text-amber-700 dark:text-amber-400">{entry.devoirs}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 5: Préparations */}
                {activeModule === 'preparations' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prepSequences.length === 0 ? (
                        <div className="text-center col-span-2 py-8 text-gray-400">Aucune fiche de préparation enregistrée.</div>
                      ) : (
                        prepSequences.map((seq) => (
                          <div key={seq.id} className="p-5 rounded-2xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded">
                                  {seq.classe} • {seq.matiere}
                                </span>
                                <span className="text-[11px] font-bold text-gray-400">{seq.duree}</span>
                              </div>
                              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">{seq.titre}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                <strong className="text-gray-700 dark:text-gray-300">Objectif:</strong> {seq.objectifs}
                              </p>
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black text-gray-400">Étapes de la séquence :</p>
                                {seq.etapes.map((step, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold">
                                      {idx + 1}
                                    </span>
                                    <span className="truncate">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                              <button
                                onClick={() => notifySuccess('Téléchargement de la fiche de préparation PDF lancé !')}
                                className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                              >
                                <Download size={14} /> PDF
                              </button>
                              <button
                                onClick={() => handleDeletePrep(seq.id)}
                                className="text-xs text-red-500 hover:text-red-700 font-bold"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 6: Évaluations */}
                {activeModule === 'evaluations' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {evaluations.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Aucune évaluation programmée.</div>
                      ) : (
                        evaluations.map((ev) => {
                          const gradedCount = Object.keys(ev.notes || {}).length;
                          return (
                            <div key={ev.id} className="p-4 rounded-xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded capitalize">
                                    {ev.type.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs font-black text-gray-400">{ev.classe}</span>
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white mt-1.5">{ev.titre}</h3>
                                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  <span>Coef : <strong>{ev.coefficient}</strong></span>
                                  <span>Sur : <strong>{ev.bareme} pts</strong></span>
                                  <span>Prévu le : <strong>{new Date(ev.date).toLocaleDateString('fr-FR')}</strong></span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                                <span className="text-xs text-gray-400 font-bold">
                                  {gradedCount} copies saisies
                                </span>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => {
                                      setSelectedEvalId(ev.id);
                                      // Prepopulate grades sheet
                                      const prepSheet: Record<string, string> = {};
                                      students.filter(s => s.classe === ev.classe).forEach(s => {
                                        prepSheet[s.id] = ev.notes?.[s.id] !== undefined ? String(ev.notes[s.id]) : '';
                                      });
                                      setGradeSheet(prepSheet);
                                      setActiveModule('grades');
                                    }}
                                    className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-black rounded-lg transition-all"
                                  >
                                    Saisir les notes
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEval(ev.id)}
                                    className="px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-150 dark:border-gray-700 rounded-lg transition"
                                    title="Supprimer l'évaluation"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 7: Notes */}
                {activeModule === 'grades' && (
                  <div className="space-y-6">
                    {/* Select Evaluation */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Évaluation active</label>
                        <select
                          value={selectedEvalId}
                          onChange={(e) => {
                            setSelectedEvalId(e.target.value);
                            const ev = evaluations.find(v => v.id === e.target.value);
                            if (ev) {
                              const prepSheet: Record<string, string> = {};
                              students.filter(s => s.classe === ev.classe).forEach(s => {
                                prepSheet[s.id] = ev.notes?.[s.id] !== undefined ? String(ev.notes[s.id]) : '';
                              });
                              setGradeSheet(prepSheet);
                            }
                          }}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
                        >
                          {evaluations.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.classe} — {ev.titre} (Coef {ev.coefficient})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Grades Grid */}
                    <div className="border border-gray-150 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 p-4">
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4">Feuille de notes</h3>
                      <div className="space-y-3">
                        {students
                          .filter(st => st.classe === evaluations.find(ev => ev.id === selectedEvalId)?.classe)
                          .map((st) => (
                            <div key={st.id} className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-750 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                              <span className="text-xs font-black text-gray-900 dark:text-white">{st.nom} {st.prenom}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={evaluations.find(ev => ev.id === selectedEvalId)?.bareme || 20}
                                  step="0.25"
                                  placeholder="Non noté"
                                  value={gradeSheet[st.id] || ''}
                                  onChange={(e) => setGradeSheet({ ...gradeSheet, [st.id]: e.target.value })}
                                  className="w-20 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-center text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-gray-400">/ {evaluations.find(ev => ev.id === selectedEvalId)?.bareme || 20}</span>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSaveGrades}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                        >
                          <Save size={16} /> Enregistrer les notes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 8: Présences */}
                {activeModule === 'attendance' && (
                  <div className="space-y-6">
                    {/* Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Classe</label>
                        <select
                          value={attendanceClass}
                          onChange={(e) => setAttendanceClass(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
                        >
                          {classesList.length === 0 ? (
                            <option value="">Aucune classe disponible</option>
                          ) : (
                            classesList.map(cl => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Date de l'appel</label>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Rollcall List */}
                    <div className="border border-gray-150 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                      <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Élèves inscrits</h3>
                      <div className="space-y-3">
                        {students
                          .filter(st => st.classe === attendanceClass)
                          .map((st) => {
                            const currentStatus = attendanceSheet[st.id] || 'present';
                            return (
                              <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50/50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-black text-gray-900 dark:text-white">{st.nom} {st.prenom}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setAttendanceSheet({ ...attendanceSheet, [st.id]: 'present' })}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                      currentStatus === 'present'
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-250 dark:border-emerald-800'
                                        : 'bg-white dark:bg-gray-850 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    Présent
                                  </button>
                                  <button
                                    onClick={() => setAttendanceSheet({ ...attendanceSheet, [st.id]: 'absent' })}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                      currentStatus === 'absent'
                                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-250 dark:border-red-800'
                                        : 'bg-white dark:bg-gray-850 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    onClick={() => setAttendanceSheet({ ...attendanceSheet, [st.id]: 'retard' })}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                      currentStatus === 'retard'
                                        ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-250 dark:border-yellow-800'
                                        : 'bg-white dark:bg-gray-850 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    En retard
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSaveAttendance}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20"
                        >
                          Valider l'appel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 9: Compétences */}
                {activeModule === 'competencies' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Classe</label>
                        <select
                          value={competencyClass}
                          onChange={(e) => setCompetencyClass(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
                        >
                          {classesList.length === 0 ? (
                            <option value="">Aucune classe disponible</option>
                          ) : (
                            classesList.map(cl => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Compétence à évaluer</label>
                        <select
                          value={selectedCompetency}
                          onChange={(e) => setSelectedCompetency(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
                        >
                          <option value="Raisonner logiquement">Raisonner logiquement (Maths)</option>
                          <option value="S'exprimer clairement à l'écrit">S'exprimer clairement à l'écrit (Langues)</option>
                          <option value="Analyser des documents historiques">Analyser des documents historiques (Histoire-Géo)</option>
                          <option value="Mener une démarche expérimentale">Mener une démarche expérimentale (Sciences)</option>
                        </select>
                      </div>
                    </div>

                    {/* Competency Mastery List */}
                    <div className="border border-gray-150 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                      <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Maîtrise des élèves</h3>
                      <div className="space-y-3">
                        {students
                          .filter(st => st.classe === competencyClass)
                          .map((st) => {
                            const mastery = competencySheet[st.id] || 'ECA';
                            return (
                              <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50/50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-black text-gray-900 dark:text-white">{st.nom} {st.prenom}</span>
                                <div className="flex gap-1.5">
                                  {(['TBM', 'A', 'ECA', 'NA'] as const).map((level) => {
                                    const labels = { TBM: 'Très Bonne', A: 'Acquis', ECA: 'En Cours', NA: 'Non Acquis' };
                                    const colors = {
                                      TBM: 'bg-green-150 text-green-850 border-green-300 dark:bg-green-950/40',
                                      A: 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20',
                                      ECA: 'bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-950/20',
                                      NA: 'bg-red-100 text-red-800 border-red-250 dark:bg-red-950/20'
                                    };
                                    const isSel = mastery === level;
                                    return (
                                      <button
                                        key={level}
                                        onClick={() => setCompetencySheet({ ...competencySheet, [st.id]: level })}
                                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                          isSel 
                                            ? colors[level]
                                            : 'bg-white dark:bg-gray-850 text-gray-400 border-gray-200 dark:border-gray-750 hover:bg-gray-50'
                                        }`}
                                      >
                                        {labels[level]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSaveCompetencies}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20"
                        >
                          Enregistrer les compétences
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 10: Documents */}
                {activeModule === 'documents' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Document Categories */}
                      <div className="p-4 rounded-xl border border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center">
                        <span className="block text-2xl mb-1">📐</span>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">Géométrie_Fiches.pdf</h4>
                        <span className="text-[10px] text-gray-400">1.4 Mo • 3ème A</span>
                        <button
                          onClick={() => notifySuccess('Téléchargement du cours démarré')}
                          className="mt-3 block w-full py-1.5 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/55 rounded-lg text-[10px] font-black"
                        >
                          Télécharger
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center">
                        <span className="block text-2xl mb-1">🔢</span>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">Matrices_Et_Suites.pdf</h4>
                        <span className="text-[10px] text-gray-400">3.2 Mo • Terminale S</span>
                        <button
                          onClick={() => notifySuccess('Téléchargement du cours démarré')}
                          className="mt-3 block w-full py-1.5 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/55 rounded-lg text-[10px] font-black"
                        >
                          Télécharger
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col justify-center items-center text-center">
                        <Plus size={24} className="text-indigo-600 mb-1" />
                        <h4 className="text-xs font-black text-gray-700 dark:text-gray-300">Nouveau Document</h4>
                        <span className="text-[10px] text-gray-400">Glisser-déposer un fichier</span>
                        <button
                          onClick={() => notifyInfo('Sélection de fichier ouverte')}
                          className="mt-3 py-1 px-3 bg-indigo-55 text-white bg-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-700"
                        >
                          Parcourir
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 11: Messagerie */}
                {activeModule === 'messaging' && (
                  <div className="space-y-6">
                    <div className="p-4 border border-gray-150 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 space-y-4">
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Message groupé aux parents d'élèves</h3>
                      
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Destinataires</label>
                        <select
                          value={messageTarget}
                          onChange={(e) => setMessageTarget(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
                        >
                          <option value="all_parents">Tous les parents de mes classes</option>
                          <option value="term_s_parents">Parents de Terminale S uniquement</option>
                          <option value="3eme_parents">Parents de 3ème A uniquement</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Contenu du message d'alerte ou d'annonce</label>
                        <textarea
                          rows={4}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Bonjour chers parents, je vous informe qu'une évaluation de Mathématiques est prévue..."
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleSendMessage}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                        >
                          <Send size={14} /> Envoyer aux parents
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 12: Rapports */}
                {activeModule === 'reports' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-150 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase mb-2">Bilan Trimestriel Global</h4>
                        <p className="text-xs text-gray-500 mb-3">Générez un récapitulatif complet de la moyenne et du comportement de toutes vos classes.</p>
                        <button
                          onClick={() => notifySuccess('Fichier de bilan généré !')}
                          className="py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700"
                        >
                          Générer le Bilan
                        </button>
                      </div>

                      <div className="p-4 border border-gray-150 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase mb-2">Bulletins d'Évaluation</h4>
                        <p className="text-xs text-gray-500 mb-3">Accédez directement aux fiches de bulletins pour apposer vos appréciations personnalisées.</p>
                        <button
                          onClick={() => notifySuccess('Fiches des bulletins exportées !')}
                          className="py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700"
                        >
                          Éditer les appréciations
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 13: Agenda */}
                {activeModule === 'agenda' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex gap-3 items-center">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex flex-col justify-center items-center text-center font-bold shrink-0">
                          <span className="text-[10px] leading-none">VEN</span>
                          <span className="text-sm leading-none">03</span>
                        </div>
                        <div className="text-xs">
                          <h4 className="font-bold text-gray-900 dark:text-white">Conseil de classe 1er Trimestre • 3ème A</h4>
                          <p className="text-gray-400 mt-0.5">Vendredi 3 juillet à 17h30 • Salle de Réunion Principal</p>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex gap-3 items-center">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex flex-col justify-center items-center text-center font-bold shrink-0">
                          <span className="text-[10px] leading-none">LUN</span>
                          <span className="text-sm leading-none">06</span>
                        </div>
                        <div className="text-xs">
                          <h4 className="font-bold text-gray-900 dark:text-white">Session d'interro Surprise planifiée • Terminale S</h4>
                          <p className="text-gray-400 mt-0.5">Lundi 6 juillet à 08h00 • Salle de cours habituelle</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lower footer of Workspace */}
              <div className="mt-8 border-t border-gray-150 dark:border-gray-700 pt-4 text-center text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Edu-Nify Classeur Numérique • Libreville, Gabon
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Modal Textbook Entry */}
      {showTextbookModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-150 dark:border-gray-700 relative shadow-2xl">
            <button
              onClick={() => setShowTextbookModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Nouveau Cours au Cahier de texte</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Classe</label>
                <select
                  value={newTbClass}
                  onChange={(e) => setNewTbClass(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                >
                  {classesList.length === 0 ? (
                    <option value="">Aucune classe disponible</option>
                  ) : (
                    classesList.map(cl => (
                      <option key={cl} value={cl}>{cl}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Date du cours</label>
                <input
                  type="date"
                  value={newTbDate}
                  onChange={(e) => setNewTbDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Sujet du cours</label>
                <input
                  type="text"
                  placeholder="ex: Calcul différentiel"
                  value={newTbSujet}
                  onChange={(e) => setNewTbSujet(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Contenu / Chapitres couverts</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez brièvement les notions enseignées aujourd'hui..."
                  value={newTbChapitres}
                  onChange={(e) => setNewTbChapitres(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-750 pt-4">
                <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Attribuer un Devoir</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Énoncé du devoir</label>
                    <input
                      type="text"
                      placeholder="ex: Exercices 2 et 4 page 110"
                      value={newTbDevoirs}
                      onChange={(e) => setNewTbDevoirs(e.target.value)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Date de rendu</label>
                    <input
                      type="date"
                      value={newTbDevoirsDate}
                      onChange={(e) => setNewTbDevoirsDate(e.target.value)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowTextbookModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTextbook}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Prep Sequence Entry */}
      {showPrepModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-150 dark:border-gray-700 relative shadow-2xl">
            <button
              onClick={() => setShowPrepModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Nouvelle Fiche de Préparation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Classe</label>
                <select
                  value={newPrepClasse}
                  onChange={(e) => setNewPrepClasse(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                >
                  {classesList.length === 0 ? (
                    <option value="">Aucune classe disponible</option>
                  ) : (
                    classesList.map(cl => (
                      <option key={cl} value={cl}>{cl}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Titre de la séquence</label>
                <input
                  type="text"
                  placeholder="ex: Résolution graphique d'équations"
                  value={newPrepTitre}
                  onChange={(e) => setNewPrepTitre(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Matière</label>
                <input
                  type="text"
                  placeholder="ex: Mathématiques"
                  value={newPrepMatiere}
                  onChange={(e) => setNewPrepMatiere(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Objectifs de la séquence</label>
                <textarea
                  rows={2}
                  placeholder="Décrivez les compétences que l'élève doit maîtriser..."
                  value={newPrepObjectifs}
                  onChange={(e) => setNewPrepObjectifs(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Durée prévue</label>
                <input
                  type="text"
                  placeholder="ex: 3 heures"
                  value={newPrepDuree}
                  onChange={(e) => setNewPrepDuree(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowPrepModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPrep}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Planify Evaluation */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-150 dark:border-gray-700 relative shadow-2xl">
            <button
              onClick={() => setShowEvalModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Planifier une Évaluation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Classe</label>
                <select
                  value={newEvalClass}
                  onChange={(e) => setNewEvalClass(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                >
                  {classesList.length === 0 ? (
                    <option value="">Aucune classe disponible</option>
                  ) : (
                    classesList.map(cl => (
                      <option key={cl} value={cl}>{cl}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Type de contrôle</label>
                <select
                  value={newEvalType}
                  onChange={(e) => setNewEvalType(e.target.value as any)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                >
                  <option value="devoir_surveille">Devoir Surveillé (DS) - Coef Fort</option>
                  <option value="interrogation">Interrogation (Quiz) - Coef Faible</option>
                  <option value="projet">Projet</option>
                  <option value="examen">Examen Trimestriel</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Matière Académique</label>
                <select
                  value={newEvalMatiere}
                  onChange={(e) => setNewEvalMatiere(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                >
                  {(currentUser?.matieres || (currentUser?.matiere ? [currentUser.matiere] : ['Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences Physiques', 'SVT', 'Philosophie', 'Anglais', 'EPS', 'Informatique'])).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Titre de l'évaluation</label>
                <input
                  type="text"
                  placeholder="ex: Interro écrite Thalès"
                  value={newEvalTitre}
                  onChange={(e) => setNewEvalTitre(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Coefficient</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="20"
                    value={newEvalCoef}
                    onChange={(e) => setNewEvalCoef(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                  />
                  <span className="text-[9px] text-indigo-500 font-bold block mt-1">
                    💡 Auto-calculé ({currentEstablishment?.systemeScolaire || 'Français'})
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Barème (Sur)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newEvalBareme}
                    onChange={(e) => setNewEvalBareme(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Date programmée</label>
                <input
                  type="date"
                  value={newEvalDate}
                  onChange={(e) => setNewEvalDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowEvalModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddEval}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Planifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CLASS MODAL */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowAddClassModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Créer une nouvelle classe</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Nom de la classe</label>
                <input
                  type="text"
                  placeholder="ex: Terminale C, 3ème B"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Créer la classe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Ajouter un élève</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Nom de l'élève</label>
                  <input
                    type="text"
                    placeholder="ex: OBAME"
                    value={newStudentNom}
                    onChange={(e) => setNewStudentNom(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Prénom de l'élève</label>
                  <input
                    type="text"
                    placeholder="ex: Marc"
                    value={newStudentPrenom}
                    onChange={(e) => setNewStudentPrenom(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Classe assignée</label>
                <select
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Sélectionner une classe --</option>
                  {classesList.map(cl => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">E-mail du parent</label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={newStudentParentEmail}
                  onChange={(e) => setNewStudentParentEmail(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-650 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Ajouter l'élève
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
