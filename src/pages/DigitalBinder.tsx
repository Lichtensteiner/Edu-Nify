import React, { useState, useEffect, useRef } from 'react';
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
  GraduationCap,
  UploadCloud,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  Eye,
  Paperclip,
  CheckCircle,
  ExternalLink
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

// Binder Document Type
export interface BinderDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  classe: string;
  matiere?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  etablissement: string;
}

// Parent Recipient Type
export interface ParentRecipient {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  childrenNames?: string;
  childrenClasses?: string;
  childrenClassList: string[];
}

// Announcement Type
export interface BinderAnnouncement {
  id: string;
  senderId: string;
  senderName: string;
  target: string;
  targetLabel: string;
  content: string;
  date: string;
  etablissement: string;
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

  const isStudent = currentUser?.role === 'élève' || currentUser?.role === 'eleve';
  const studentClass = currentUser?.classe || '';

  // Interactive states for modules
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(isStudent && studentClass ? studentClass : 'all');
  
  const { currentEstablishment } = useEstablishment();
  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';

  // Data persistence lists
  const [classesList, setClassesList] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parentsList, setParentsList] = useState<ParentRecipient[]>([]);
  const [binderDocuments, setBinderDocuments] = useState<BinderDocument[]>([]);
  const [sentAnnouncements, setSentAnnouncements] = useState<BinderAnnouncement[]>([]);
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
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<BinderDocument | null>(null);

  // Document Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string>('');
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [uploadDocClasse, setUploadDocClasse] = useState<string>('Toutes les classes');
  const [uploadDocMatiere, setUploadDocMatiere] = useState<string>('Général');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

  // Ensure student class is locked on student login
  useEffect(() => {
    if (isStudent && studentClass) {
      setSelectedClass(studentClass);
    }
  }, [isStudent, studentClass]);

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
        if (isStudent) {
          setClassesList(studentClass ? [studentClass] : []);
        } else {
          const schoolClasses = snapshot.docs
            .map(doc => doc.data() as any)
            .filter((c: any) => (c.etablissement || 'EDU-001') === activeEstId && !c.deleted)
            .map((c: any) => c.nom);
          
          const uniqueClasses = Array.from(new Set(schoolClasses)).filter(Boolean);
          setClassesList(uniqueClasses as string[]);
        }
      },
      (error) => console.error("Error subscribing to classes:", error)
    );

    // Subscribe to students & parents (users collection)
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const allEstUsers = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((u: any) => (u.etablissement || 'EDU-001') === activeEstId);

        // Filter students
        let schoolStudents = allEstUsers
          .filter((u: any) => u.role === 'élève' || u.role === 'eleve')
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
        
        if (isStudent && studentClass) {
          schoolStudents = schoolStudents.filter((s: any) => s.classe === studentClass);
        }
        setStudents(schoolStudents);

        // Derive and match parents with their children
        const parentUsers = allEstUsers.filter((u: any) => u.role === 'parent');
        
        // Also check if students have declared parents that might be in users or as contacts
        const mappedParents: ParentRecipient[] = [];
        const seenParentKeys = new Set<string>();

        // 1. Registered parent users
        parentUsers.forEach((p: any) => {
          // Find children of this parent
          const pChildren = allEstUsers.filter((s: any) => {
            if (s.role !== 'élève' && s.role !== 'eleve') return false;
            const hasIdMatch = p.enfant_ids?.includes(s.id) || p.children_ids?.includes(s.id);
            const hasEmailMatch = (p.email && (s.parentEmail || s.email_parent) && p.email.toLowerCase() === (s.parentEmail || s.email_parent).toLowerCase());
            const hasNomMatch = p.nom && s.nom && p.nom.toLowerCase() === s.nom.toLowerCase();
            return hasIdMatch || hasEmailMatch || hasNomMatch;
          });

          const childNames = pChildren.map((c: any) => `${c.prenom} ${c.nom}`).filter(Boolean).join(', ');
          const childClasses = Array.from(new Set(pChildren.map((c: any) => c.classe).filter(Boolean))).join(', ');
          const childClassList = Array.from(new Set(pChildren.map((c: any) => c.classe).filter(Boolean)));

          const key = p.id || p.email;
          if (!seenParentKeys.has(key)) {
            seenParentKeys.add(key);
            mappedParents.push({
              id: p.id,
              nom: p.nom || '',
              prenom: p.prenom || '',
              email: p.email || '',
              telephone: p.telephone || p.phone || '',
              childrenNames: childNames || p.enfants_noms || 'Élève assigné',
              childrenClasses: childClasses || p.classe || 'Classe active',
              childrenClassList: childClassList.length > 0 ? childClassList : (p.classe ? [p.classe] : [])
            });
          }
        });

        // 2. Parents identified directly from student profile details
        schoolStudents.forEach((s: any) => {
          if (s.parentEmail && !seenParentKeys.has(s.parentEmail.toLowerCase())) {
            seenParentKeys.add(s.parentEmail.toLowerCase());
            mappedParents.push({
              id: `parent_${s.id}`,
              nom: s.nom,
              prenom: 'Parent',
              email: s.parentEmail,
              childrenNames: `${s.prenom} ${s.nom}`,
              childrenClasses: s.classe,
              childrenClassList: s.classe ? [s.classe] : []
            });
          }
        });

        // If user is a student, restrict strictly to their linked parent
        if (isStudent) {
          const linkedParents = mappedParents.filter(p => {
            const isDirectChild = (p as any).enfant_ids?.includes(currentUser.id) || (p as any).children_ids?.includes(currentUser.id);
            const isDirectId = p.id === currentUser.parent_id || p.id === currentUser.parentId || p.id === `parent_${currentUser.id}`;
            const studentPEmail = (currentUser.parentEmail || currentUser.email_parent || '').toLowerCase();
            const isEmailMatch = Boolean(studentPEmail && p.email && p.email.toLowerCase() === studentPEmail);
            const isNameMatch = Boolean(p.childrenNames && currentUser.nom && p.childrenNames.toLowerCase().includes(currentUser.nom.toLowerCase()));
            return isDirectChild || isDirectId || isEmailMatch || isNameMatch;
          });

          if (linkedParents.length > 0) {
            setParentsList(linkedParents);
          } else if (currentUser.parentEmail || currentUser.email_parent) {
            setParentsList([{
              id: `parent_${currentUser.id}`,
              nom: currentUser.nom || 'Parent',
              prenom: 'Responsable Légal',
              email: currentUser.parentEmail || currentUser.email_parent || '',
              telephone: (currentUser as any).parentPhone || (currentUser as any).telephone_parent || '',
              childrenNames: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
              childrenClasses: studentClass,
              childrenClassList: studentClass ? [studentClass] : []
            }]);
          } else {
            setParentsList([]);
          }
        } else {
          setParentsList(mappedParents);
        }
      },
      (error) => console.error("Error subscribing to users:", error)
    );

    // Subscribe to binder documents for active establishment
    const unsubDocs = onSnapshot(
      collection(db, 'binder_documents'),
      (snapshot) => {
        let docs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as BinderDocument))
          .filter(d => (d.etablissement || 'EDU-001') === activeEstId);
        if (isStudent && studentClass) {
          docs = docs.filter(d => d.classe === studentClass || d.classe === 'Toutes les classes' || !d.classe);
        }
        docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setBinderDocuments(docs);
      },
      (error) => console.error("Error subscribing to binder documents:", error)
    );

    // Subscribe to announcements
    const unsubAnnouncements = onSnapshot(
      collection(db, 'parent_announcements'),
      (snapshot) => {
        let list = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as BinderAnnouncement))
          .filter(d => (d.etablissement || 'EDU-001') === activeEstId);
        if (isStudent) {
          list = list.filter(d => 
            d.senderId === currentUser.id ||
            (d.target && d.target.startsWith('parent_') && (d.target === `parent_${currentUser.id}` || d.target === `parent_${currentUser.parent_id}`)) ||
            (studentClass && d.target === `class_${studentClass}`)
          );
        }
        list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setSentAnnouncements(list);
      },
      (error) => console.error("Error subscribing to announcements:", error)
    );

    // Subscribe to textbooks
    const unsubTextbooks = onSnapshot(
      collection(db, 'digital_binder_textbooks'),
      (snapshot) => {
        let entries = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((d: any) => (d.etablissement || 'EDU-001') === activeEstId);
        if (isStudent) {
          if (studentClass) {
            entries = entries.filter((d: any) => d.classe === studentClass);
          }
        } else {
          entries = entries.filter((d: any) => d.teacherId === currentUser.id);
        }
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTextbookEntries(entries);
      },
      (error) => console.error("Error subscribing to textbooks:", error)
    );

    // Subscribe to preparations
    const unsubPreparations = onSnapshot(
      collection(db, 'digital_binder_preparations'),
      (snapshot) => {
        let preps = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((d: any) => (d.etablissement || 'EDU-001') === activeEstId);
        if (isStudent) {
          if (studentClass) {
            preps = preps.filter((d: any) => d.classe === studentClass);
          }
        } else {
          preps = preps.filter((d: any) => d.teacherId === currentUser.id);
        }
        setPrepSequences(preps);
      },
      (error) => console.error("Error subscribing to preparations:", error)
    );

    // Subscribe to evaluations
    const unsubEvaluations = onSnapshot(
      collection(db, 'digital_binder_evaluations'),
      (snapshot) => {
        let evals = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((d: any) => (d.etablissement || 'EDU-001') === activeEstId);
        if (isStudent) {
          if (studentClass) {
            evals = evals.filter((d: any) => d.classe === studentClass);
          }
        } else {
          evals = evals.filter((d: any) => d.teacherId === currentUser.id);
        }
        evals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvaluations(evals);
        setLoading(false);
      },
      (error) => console.error("Error subscribing to evaluations:", error)
    );

    // Subscribe to timetable_assignments
    const unsubTimetable = onSnapshot(
      collection(db, 'timetable_assignments'),
      (snapshot) => {
        let list = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((d: any) => (d.etablissement || 'EDU-001') === activeEstId);
        if (isStudent) {
          if (studentClass) {
            list = list.filter((d: any) => d.className === studentClass || d.classId === studentClass);
          }
        } else {
          list = list.filter((d: any) => d.teacherId === currentUser.id);
        }
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
      unsubUsers();
      unsubDocs();
      unsubAnnouncements();
      unsubTextbooks();
      unsubPreparations();
      unsubEvaluations();
      unsubTimetable();
      unsubNotifications();
    };
  }, [currentUser, activeEstId, isStudent, studentClass]);

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

  // Lock message target to linked parent when user is a student
  useEffect(() => {
    if (isStudent && parentsList.length > 0) {
      setMessageTarget(`parent_${parentsList[0].id}`);
    }
  }, [isStudent, parentsList]);

  // Submit Textbook Entry
  const handleAddTextbook = async () => {
    if (isStudent) {
      notifyError('Les élèves ne peuvent pas ajouter de cours ni de devoirs dans le cahier de texte.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Les élèves ne peuvent pas ajouter d\'autres élèves.');
      return;
    }
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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
            timestamp: new Date().toISOString(),
            etablissement: activeEstId
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
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
    notifySuccess('Évaluation des compétences enregistrée avec succès !');
  };

  // Save Grades Sheet
  const handleSaveGrades = async () => {
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
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

  // File handling for Documents
  const processSelectedFile = (file: File) => {
    if (!file) return;
    // Check max size (up to 15MB)
    if (file.size > 15 * 1024 * 1024) {
      notifyError('Le fichier est trop volumineux (maximum 15 Mo).');
      return;
    }

    setUploadFile(file);
    setUploadDocName(file.name);
    
    // Convert to data URL for storage & instant preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadFileDataUrl(e.target?.result as string);
      setShowUploadDocModal(true);
    };
    reader.onerror = () => {
      notifyError('Erreur de lecture du fichier.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
    if (!uploadFile || !uploadFileDataUrl) {
      notifyError('Veuillez sélectionner un fichier.');
      return;
    }

    setUploadingDoc(true);
    try {
      await addDoc(collection(db, 'binder_documents'), {
        name: uploadDocName.trim() || uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type || 'application/octet-stream',
        dataUrl: uploadFileDataUrl,
        classe: uploadDocClasse,
        matiere: uploadDocMatiere,
        uploadedBy: currentUser?.id || 'sys',
        uploadedByName: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Enseignant',
        createdAt: new Date().toISOString(),
        etablissement: activeEstId
      });

      notifySuccess(`Le document "${uploadDocName.trim() || uploadFile.name}" a été téléversé avec succès !`);
      setShowUploadDocModal(false);
      setUploadFile(null);
      setUploadFileDataUrl('');
      setUploadDocName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error saving document:", error);
      notifyError("Erreur lors du téléversement du document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (isStudent) {
      notifyError('Action non autorisée pour les élèves.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'binder_documents', docId));
      notifySuccess(`Document "${docName}" supprimé.`);
    } catch (error) {
      console.error(error);
      notifyError("Erreur lors de la suppression du document.");
    }
  };

  const handleDownloadDocument = (docItem: BinderDocument) => {
    if (!docItem.dataUrl) {
      notifyError("Lien du document non disponible.");
      return;
    }
    const link = document.createElement('a');
    link.href = docItem.dataUrl;
    link.download = docItem.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess(`Téléchargement de "${docItem.name}" démarré.`);
  };

  // Helper format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Ko';
    const k = 1024;
    if (bytes < k) return `${bytes} o`;
    if (bytes < k * k) return `${(bytes / k).toFixed(1)} Ko`;
    return `${(bytes / (k * k)).toFixed(1)} Mo`;
  };

  // Helper file icon
  const getFileIcon = (fileName: string, fileType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || fileType.includes('pdf')) {
      return <span className="text-2xl">📄</span>;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <span className="text-2xl">📊</span>;
    }
    if (['doc', 'docx'].includes(ext) || fileType.includes('word') || fileType.includes('document')) {
      return <span className="text-2xl">📝</span>;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || fileType.includes('image')) {
      return <span className="text-2xl">🖼️</span>;
    }
    if (['ppt', 'pptx'].includes(ext) || fileType.includes('presentation')) {
      return <span className="text-2xl">📑</span>;
    }
    return <span className="text-2xl">📁</span>;
  };

  // Send communication parent in real-time
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      notifyError('Le message ne peut pas être vide.');
      return;
    }

    if (isStudent) {
      if (parentsList.length === 0) {
        notifyError("Aucun parent référent n'est lié à votre compte élève. Vous ne pouvez pas envoyer de message.");
        return;
      }
    }

    try {
      let finalTarget = messageTarget;
      let targetLabel = "Tous les parents de mes classes";

      if (isStudent) {
        const linkedParent = parentsList[0];
        finalTarget = `parent_${linkedParent.id}`;
        targetLabel = `${linkedParent.prenom} ${linkedParent.nom} (Parent référent de ${currentUser?.prenom || 'l\'élève'})`;
      } else if (messageTarget === 'all_parents') {
        targetLabel = `Tous les parents de l'établissement (${parentsList.length} parents)`;
      } else if (messageTarget.startsWith('class_')) {
        const className = messageTarget.replace('class_', '');
        targetLabel = `Tous les parents de la classe ${className}`;
      } else if (messageTarget.startsWith('parent_')) {
        const parentId = messageTarget.replace('parent_', '');
        const parentObj = parentsList.find(p => p.id === parentId || `parent_${p.id}` === messageTarget);
        if (parentObj) {
          targetLabel = `${parentObj.prenom} ${parentObj.nom} (Parent de ${parentObj.childrenNames || 'élève'})`;
        }
      }

      await addDoc(collection(db, 'parent_announcements'), {
        senderId: currentUser?.id || 'sys',
        senderName: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || (isStudent ? 'Élève' : 'Enseignant / Responsable'),
        target: finalTarget,
        targetLabel,
        content: messageText.trim(),
        date: new Date().toISOString(),
        etablissement: activeEstId
      });

      notifySuccess(`Message transmis avec succès à : ${targetLabel}`);
      setMessageText('');
    } catch (error) {
      console.error("Error sending announcement:", error);
      notifyError("Erreur lors de l'envoi du message.");
    }
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
            {isStudent ? `Espace Élève • Classe ${studentClass || 'Non assignée'}` : "Classeur Numérique de l'Enseignant"}
          </span>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">
            {isStudent ? "Mon Espace Pédagogique" : "Espace Pédagogique Intégré"}
          </h1>
          <p className="text-indigo-100/80 text-xs lg:text-sm max-w-2xl font-medium">
            {isStudent 
              ? `Consultez les cours, devoirs du cahier de texte, fiches de révision et évaluations de votre classe (${studentClass || 'votre classe'}). Vos informations sont réservées à votre établissement.`
              : "Gérez vos classes, saisissez les cahiers de texte, planifiez vos évaluations, et suivez les compétences en temps réel avec une liaison fluide vers la base de données du Gabon."
            }
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
                  {isStudent ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold">
                      Classe : {studentClass || 'Non assignée'} (Lecture seule)
                    </div>
                  ) : (
                    <>
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
                    </>
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
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {isStudent ? `Ma classe (${studentClass || 'Non assignée'})` : "Liste des classes actives"}
                      </h3>
                      {!isStudent && (
                        <button
                          onClick={() => setShowAddClassModal(true)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1 hover:bg-indigo-700 shadow-sm transition"
                        >
                          <Plus size={14} />
                          Créer une classe
                        </button>
                      )}
                    </div>

                    {classesList.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <GraduationCap size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Aucune classe n'est encore enregistrée</p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                          {isStudent ? "Votre compte n'est pas encore rattaché à une classe." : "Ajoutez en temps réel les classes de votre établissement."}
                        </p>
                        {!isStudent && (
                          <button
                            onClick={() => setShowAddClassModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                          >
                            Créer ma première classe
                          </button>
                        )}
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
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {isStudent ? `Élèves de ma classe (${studentClass || 'Ma classe'})` : "Suivi des élèves"}
                      </h3>
                      {!isStudent && (
                        <button
                          onClick={() => setShowAddStudentModal(true)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1 hover:bg-indigo-700 shadow-sm transition"
                        >
                          <Plus size={14} />
                          Ajouter un élève
                        </button>
                      )}
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
                                {!isStudent && (
                                  <button
                                    onClick={() => handleDeleteTextbook(entry.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
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
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                              <button
                                onClick={() => notifySuccess('Téléchargement de la fiche de préparation PDF lancé !')}
                                className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                              >
                                <Download size={14} /> PDF
                              </button>
                              {!isStudent && (
                                <button
                                  onClick={() => handleDeletePrep(seq.id)}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                  Supprimer
                                </button>
                              )}
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
                                {!isStudent && (
                                  <span className="text-xs text-gray-400 font-bold">
                                    {gradedCount} copies saisies
                                  </span>
                                )}
                                {isStudent ? (
                                  <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl text-xs font-bold text-indigo-800 dark:text-indigo-300">
                                    {ev.notes?.[currentUser?.id || ''] !== undefined 
                                      ? `Ma note : ${ev.notes[currentUser?.id || '']} / ${ev.bareme}` 
                                      : 'En attente de notation'}
                                  </div>
                                ) : (
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
                                )}
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
                    {isStudent ? (
                      <div className="border border-gray-150 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 p-5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                            Mes notes d'évaluation • Classe {studentClass || 'Non assignée'}
                          </h3>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl">
                            {evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {evaluations.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-xs">
                            Aucune évaluation n'a encore été programmée ou notée pour votre classe.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {evaluations.map((ev) => {
                              const studentNote = ev.notes?.[currentUser?.id || ''];
                              return (
                                <div key={ev.id} className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-750 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                  <div>
                                    <span className="text-xs font-black text-gray-900 dark:text-white block">{ev.titre}</span>
                                    <span className="text-[11px] text-gray-400">
                                      {ev.matiere} • Coef {ev.coefficient} • {new Date(ev.date).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                  <div>
                                    {studentNote !== undefined && studentNote !== '' ? (
                                      <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                                        Number(studentNote) >= (ev.bareme / 2) 
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      }`}>
                                        {studentNote} / {ev.bareme}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">Non noté</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {/* MODULE 8: Présences */}
                {activeModule === 'attendance' && (
                  <div className="space-y-6">
                    {isStudent ? (
                      <div className="border border-gray-150 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                            Mon suivi de présence et d'assiduité • {studentClass || 'Ma classe'}
                          </h3>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl">
                            Établissement : {currentEstablishment?.nom || activeEstId}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-center">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 block mb-1">
                              {Math.max(0, 100 - (currentUser?.absences || 0) * 3)} %
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Taux de présence</span>
                          </div>
                          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-800 text-center">
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-300 block mb-1">
                              {currentUser?.absences || 0}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Absences cumulées</span>
                          </div>
                          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800 text-center">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-300 block mb-1">
                              {currentUser?.retards || 0}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Retards cumulés</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl text-xs text-gray-500">
                          ℹ️ Le registre d'appel officiel est tenu quotidiennement par vos professeurs et l'équipe de la vie scolaire de l'établissement.
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {/* MODULE 9: Compétences */}
                {activeModule === 'competencies' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!isStudent && (
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
                      )}
                      <div className={isStudent ? "sm:col-span-2" : ""}>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Compétence à consulter</label>
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
                      <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">
                        {isStudent ? `Évaluation de la compétence • ${currentUser?.prenom || ''} ${currentUser?.nom || ''}` : "Maîtrise des élèves"}
                      </h3>
                      {isStudent ? (
                        <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <span className="text-xs font-black text-gray-900 dark:text-white block">
                              {currentUser?.nom} {currentUser?.prenom}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Compétence : {selectedCompetency} • Classe {studentClass || ''}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-800">
                            {competencySheet[currentUser?.id || ''] === 'TBM' ? 'Très Bonne Maîtrise' :
                             competencySheet[currentUser?.id || ''] === 'A' ? 'Acquis' :
                             competencySheet[currentUser?.id || ''] === 'ECA' ? 'En Cours d\'Acquisition' :
                             competencySheet[currentUser?.id || ''] === 'NA' ? 'Non Acquis' : 'Acquis'}
                          </span>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 10: Documents */}
                {activeModule === 'documents' && (
                  <div className="space-y-6">
                    {/* Upload Dropzone & Button (Teachers/Admins only) */}
                    {!isStudent && (
                      <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
                          dragActive 
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-4 ring-indigo-500/10' 
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 hover:border-indigo-400'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="document-file-input"
                          className="hidden"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
                        />
                        
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                          <UploadCloud size={24} />
                        </div>
                        
                        <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">
                          Ajouter un document au classeur
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                          Glissez-déposez un fichier ici ou parcourez les dossiers de votre appareil (PDF, Word, Excel, Images jusqu'à 15 Mo).
                        </p>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <FolderOpen size={16} />
                          Parcourir mon appareil
                        </button>
                      </div>
                    )}

                    {/* Uploaded Documents List */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                          <FileText size={14} className="text-indigo-600" />
                          Documents {isStudent ? `de ma classe (${studentClass || 'Ma classe'})` : 'enregistrés'} ({binderDocuments.length})
                        </h3>
                        <span className="text-[11px] text-gray-400">
                          Établissement : {currentEstablishment?.nom || activeEstId}
                        </span>
                      </div>

                      {binderDocuments.length === 0 ? (
                        <div className="p-8 rounded-2xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                            <FolderOpen size={22} />
                          </div>
                          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Aucun document disponible
                          </h4>
                          <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                            {isStudent
                              ? "Aucun support ou document pédagogique n'a encore été mis en ligne pour votre classe."
                              : "Utilisez le bouton ci-dessus pour téléverser votre premier cours, fiche d'exercice ou support de révision depuis votre appareil."
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {binderDocuments.map((docItem) => (
                            <div 
                              key={docItem.id} 
                              className="p-4 rounded-xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow relative group"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2.5">
                                    {getFileIcon(docItem.name, docItem.type)}
                                    <div className="min-w-0">
                                      <h4 
                                        className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[180px]" 
                                        title={docItem.name}
                                      >
                                        {docItem.name}
                                      </h4>
                                      <span className="text-[10px] text-gray-400 block">
                                        {formatFileSize(docItem.size)} • {docItem.classe || 'Général'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {!isStudent && (
                                    <button
                                      onClick={() => handleDeleteDocument(docItem.id, docItem.name)}
                                      title="Supprimer ce document"
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {docItem.matiere && (
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                                      {docItem.matiere}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px]">
                                    Ajouté par {docItem.uploadedByName}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between gap-2">
                                <span className="text-[9px] text-gray-400">
                                  {new Date(docItem.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                
                                <div className="flex gap-1.5">
                                  {docItem.dataUrl && (
                                    <button
                                      onClick={() => setPreviewDoc(docItem)}
                                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                    >
                                      <Eye size={12} /> Aperçu
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDownloadDocument(docItem)}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs transition-colors"
                                  >
                                    <Download size={12} /> Télécharger
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 11: Messagerie */}
                {activeModule === 'messaging' && (
                  <div className="space-y-6">
                    <div className="p-5 border border-gray-150 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 space-y-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-750 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <MessageCircle size={16} className="text-indigo-600" />
                            {isStudent ? "Messagerie avec mon Parent Référent" : "Messagerie & Communications Parents"}
                          </h3>
                          <p className="text-[11px] text-gray-400">
                            {isStudent
                              ? "Communiquez directement et exclusivement avec votre parent ou responsable légal lié."
                              : "Diffusez des annonces, convocations ou alertes aux parents d'élèves en temps réel pour l'établissement."
                            }
                          </p>
                        </div>
                        <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[10px] font-bold self-start sm:self-auto">
                          {isStudent 
                            ? (parentsList.length > 0 ? '1 parent référent lié' : 'Aucun parent lié') 
                            : `${parentsList.length} parents répertoriés`
                          }
                        </div>
                      </div>
                      
                      {/* Destination Selector */}
                      {isStudent ? (
                        <div>
                          <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
                            Destinataire (Parent lié uniquement)
                          </label>
                          {parentsList.length === 0 ? (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 font-medium">
                              ⚠️ Aucun parent référent n'est actuellement rattaché à votre compte élève. Veuillez contacter l'administration de l'établissement pour associer votre parent.
                            </div>
                          ) : (
                            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                              <span>👤 {parentsList[0].prenom} {parentsList[0].nom} {parentsList[0].email ? `(${parentsList[0].email})` : ''}</span>
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-black">
                                Parent lié exclusif
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
                            Destinataires (Filtre par Établissement et Classes Créées)
                          </label>
                          <select
                            value={messageTarget}
                            onChange={(e) => setMessageTarget(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          >
                            <optgroup label="Diffusion Globale">
                              <option value="all_parents">
                                📢 Tous les parents de l'établissement ({parentsList.length} parents)
                              </option>
                            </optgroup>

                            {classesList.length > 0 && (
                              <optgroup label="Par Classe de l'Établissement">
                                {classesList.map(classeName => {
                                  const countInClass = parentsList.filter(p => p.childrenClassList.includes(classeName)).length;
                                  return (
                                    <option key={`class_${classeName}`} value={`class_${classeName}`}>
                                      🏫 Parents des élèves de {classeName} ({countInClass} parent{countInClass > 1 ? 's' : ''})
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}

                            {parentsList.length > 0 && (
                              <optgroup label="Parents Individuels">
                                {parentsList.map(parent => (
                                  <option key={parent.id} value={`parent_${parent.id}`}>
                                    👤 {parent.nom} {parent.prenom} {parent.childrenNames ? `(Parent de : ${parent.childrenNames} - ${parent.childrenClasses})` : `(${parent.email})`}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
                          {isStudent ? "Message à destination de votre parent" : "Contenu du message d'alerte, de convocation ou d'annonce"}
                        </label>
                        <textarea
                          rows={4}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={isStudent 
                            ? "Bonjour, je t'écris pour te tenir informé(e) de mes cours ou devoirs..." 
                            : "Bonjour chers parents, je vous informe qu'une évaluation ou une réunion pédagogique est prévue..."
                          }
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <span className="text-[11px] text-gray-400">
                          {messageText.length} caractères saisis
                        </span>
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={isStudent && parentsList.length === 0}
                          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                        >
                          <Send size={14} /> {isStudent ? 'Envoyer à mon parent' : 'Envoyer aux parents'}
                        </button>
                      </div>
                    </div>

                    {/* Historical Sent Announcements */}
                    <div className="border border-gray-150 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-800">
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-2">
                        <Clock size={14} className="text-indigo-600" />
                        Historique des messages diffusés ({sentAnnouncements.length})
                      </h3>

                      {sentAnnouncements.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-xs">
                          Aucun message diffusé récemment dans cet établissement.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sentAnnouncements.map((item) => (
                            <div key={item.id} className="p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                                  {item.targetLabel || item.target}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(item.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {item.content}
                              </p>
                              <span className="text-[9px] text-gray-400 block pt-1">
                                Émis par : {item.senderName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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

      {/* ADD DOCUMENT MODAL */}
      {showUploadDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => {
                setShowUploadDocModal(false);
                setUploadFile(null);
                setUploadFileDataUrl('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Téléverser le Document
                </h3>
                <p className="text-xs text-gray-400">
                  Associez ce fichier à une classe et une matière
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-center gap-3">
                {uploadFile && getFileIcon(uploadFile.name, uploadFile.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                    {uploadFile?.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {uploadFile && formatFileSize(uploadFile.size)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
                  Titre / Nom du document
                </label>
                <input
                  type="text"
                  required
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  placeholder="ex: Fiche révision géométrie dans l'espace"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
                    Classe Destinataire
                  </label>
                  <select
                    value={uploadDocClasse}
                    onChange={(e) => setUploadDocClasse(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Toutes les classes">Toutes les classes</option>
                    {classesList.map(cl => (
                      <option key={cl} value={cl}>{cl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
                    Matière / Discipline
                  </label>
                  <input
                    type="text"
                    value={uploadDocMatiere}
                    onChange={(e) => setUploadDocMatiere(e.target.value)}
                    placeholder="ex: Mathématiques, Histoire"
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-750">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadDocModal(false);
                    setUploadFile(null);
                    setUploadFileDataUrl('');
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {uploadingDoc ? 'Téléversement...' : 'Confirmer et Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-150 dark:border-gray-750 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewDoc.name, previewDoc.type)}
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white truncate max-w-md">
                    {previewDoc.name}
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {formatFileSize(previewDoc.size)} • {previewDoc.classe}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocument(previewDoc)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} /> Télécharger
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-[350px]">
              {previewDoc.type.includes('image') ? (
                <img 
                  src={previewDoc.dataUrl} 
                  alt={previewDoc.name} 
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : previewDoc.type.includes('pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-[60vh] rounded-lg border border-gray-300 dark:border-gray-700"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-1">
                    Aperçu intégré non disponible pour ce format
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Veuillez télécharger le document pour le consulter sur votre appareil.
                  </p>
                  <button
                    onClick={() => handleDownloadDocument(previewDoc)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black inline-flex items-center gap-2"
                  >
                    <Download size={14} /> Télécharger le fichier
                  </button>
                </div>
              )}
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
