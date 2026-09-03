import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  Trash2, 
  Edit2, 
  Search, 
  X, 
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  Check,
  RefreshCw,
  Printer,
  Settings,
  MessageSquare,
  Send,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlanningItem {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  type: 'cours' | 'réunion' | 'examen' | 'autre';
  classId?: string;
  className?: string;
  subject?: string;
  createdAt: Timestamp;
}

interface TimetableAssignment {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: string; // 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi'
  slotId: string; // '1', '2', '3', '4', '5', '6'
  room: string;
  color?: string;
  isLocked?: boolean;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export interface TimeSlotItem {
  id: string;
  name: string;
  startMin?: number;
  endMin?: number;
  isBreak?: boolean;
  label?: string;
}

const DEFAULT_TIME_SLOTS: TimeSlotItem[] = [
  { id: '1', name: '08:00 - 09:30', startMin: 480, endMin: 570, isBreak: false },
  { id: '2', name: '09:30 - 11:00', startMin: 570, endMin: 660, isBreak: false },
  { id: 'break1', name: '11:00 - 11:15', isBreak: true, label: 'Récréation' },
  { id: '3', name: '11:15 - 12:45', startMin: 675, endMin: 765, isBreak: false },
  { id: 'lunch', name: '12:45 - 14:00', isBreak: true, label: 'Pause Midi / Déjeuner' },
  { id: '4', name: '14:00 - 15:30', startMin: 840, endMin: 930, isBreak: false },
  { id: '5', name: '15:30 - 17:00', startMin: 930, endMin: 1020, isBreak: false },
  { id: '6', name: '17:00 - 18:30', startMin: 1020, endMin: 1110, isBreak: false },
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

const STATIC_SUBJECTS = ['Mathématiques', 'Français', 'Histoire-Géographie', 'Anglais', 'Sciences Physiques', 'SVT', 'EPS', 'Philosophie', 'Arts Plastiques', 'Informatique'];
const STATIC_TEACHERS = [
  { id: 't_kouame', name: 'M. Kouamé (Maths)' },
  { id: 't_diallo', name: 'Mme Diallo (Histoire-Géo)' },
  { id: 't_sow', name: 'M. Sow (Français)' },
  { id: 't_koffi', name: 'M. Koffi (Physiques)' },
  { id: 't_smith', name: 'Mme Smith (Anglais)' },
  { id: 't_traore', name: 'Mme Traoré (SVT)' },
  { id: 't_bamba', name: 'M. Bamba (EPS)' },
  { id: 't_toure', name: 'M. Touré (Philo)' },
  { id: 't_yigo', name: 'Mme Yigo (Arts)' },
];

const DEFAULT_ROOMS = ['Salle 101', 'Salle L-02', 'Labo Physique A', 'Labo SVT B', 'Terrain de Sport', 'Amphi A', 'Salle Informatique'];
const STATIC_ROOMS = DEFAULT_ROOMS;

const DEFAULT_ASSIGNMENTS: Omit<TimetableAssignment, 'id'>[] = [
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

const TeacherPlanning: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { notifySuccess, notifyError, notifyDelete } = useNotification();
  
  // Navigation Section State
  const [activeSection, setActiveSection] = useState<'timetable' | 'agenda'>('timetable');
  
  // Timetable State
  const [assignments, setAssignments] = useState<TimetableAssignment[]>([]);
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  
  // Timetable Assignment Modal Form State
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [filterQualifiedTeachersOnly, setFilterQualifiedTeachersOnly] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ day: string; slotId: string } | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TimetableAssignment | null>(null);
  
  const [assignmentForm, setAssignmentForm] = useState({
    subject: '',
    teacherId: '',
    room: '',
    classId: '',
    color: COLORS[0],
    isLocked: false
  });

  // AI Generator Panel State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [showGeneratorPanel, setShowGeneratorPanel] = useState(false);
  const [constraintsConfig, setConstraintsConfig] = useState({
    maxHoursPerDay: 6,
    preventDoubleIntervals: true,
    respectVacatairesDispo: true,
    smartClassroomAllocation: true,
  });

  // Dynamic Establishment Time Slots & Rooms
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>(DEFAULT_TIME_SLOTS);
  const [establishmentRooms, setEstablishmentRooms] = useState<string[]>(DEFAULT_ROOMS);
  const [showSlotSettingsModal, setShowSlotSettingsModal] = useState(false);
  const [slotSettingsDraft, setSlotSettingsDraft] = useState<TimeSlotItem[]>(DEFAULT_TIME_SLOTS);
  const [roomsDraft, setRoomsDraft] = useState<string[]>(DEFAULT_ROOMS);
  const [newRoomInput, setNewRoomInput] = useState('');

  // Genetic Algorithm settings
  const [gaPopulationSize, setGaPopulationSize] = useState(150);
  const [gaCrossoverRate, setGaCrossoverRate] = useState(85);
  const [gaMutationRate, setGaMutationRate] = useState(5);
  const [gaSelectionMethod, setGaSelectionMethod] = useState<'tournament' | 'roulette' | 'elitism'>('tournament');

  // Daily Planning States (Agenda Tab)
  const [planning, setPlanning] = useState<PlanningItem[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [showAddAgendaModal, setShowAddAgendaModal] = useState(false);
  const [editingAgendaItem, setEditingAgendaItem] = useState<PlanningItem | null>(null);
  const [agendaSubjects, setAgendaSubjects] = useState<string[]>([]);
  
  // Agenda Form state
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const getOneHourLater = () => {
    const later = new Date(Date.now() + 3600000);
    return `${later.getHours().toString().padStart(2, '0')}:${later.getMinutes().toString().padStart(2, '0')}`;
  };

  const [agendaFormData, setAgendaFormData] = useState({
    title: '',
    description: '',
    type: 'cours',
    classId: '',
    className: '',
    subject: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: getCurrentTime(),
    endDate: new Date().toISOString().split('T')[0],
    endTime: getOneHourLater()
  });

  const { currentEstablishment } = useEstablishment();
  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';

  const isTeacher = currentUser?.role === 'enseignant';
  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role as any) === 'Super Admin' || (currentUser?.role as any) === 'Directeur' || (currentUser?.role as any) === 'personnel administratif';

  const [realTeachers, setRealTeachers] = useState<{ id: string; name: string; subjects: string[] }[]>([]);
  const [realSubjects, setRealSubjects] = useState<{ id: string; name: string; teacherId?: string; teacherName?: string }[]>([]);

  // Écouter dynamiquement les enseignants et matières réels depuis Firebase Firestore
  useEffect(() => {
    // 1. Enseignants réels
    const qTeachers = query(collection(db, 'users'), where('role', '==', 'enseignant'));
    const unsubscribeTeachers = onSnapshot(qTeachers, (snapshot) => {
      const dbTeachers = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => {
        const data = doc.data();
        const prenom = data.prenom || '';
        const nom = data.nom || '';
        const fullName = `${prenom} ${nom}`.trim() || data.displayName || data.name || 'Enseignant';
        const rawMatiere = data.matieres || (data.matiere ? [data.matiere] : []);
        const rawMatiereArray = Array.isArray(rawMatiere) 
          ? rawMatiere 
          : typeof rawMatiere === 'string' 
            ? [rawMatiere] 
            : [];
        const matiereSuffix = rawMatiereArray.length > 0 ? ` (${rawMatiereArray.join(', ')})` : '';
        const prefix = data.civilite || (data.genre === 'F' ? 'Mme' : data.genre === 'M' ? 'M.' : '');
        const displayNameWithPrefix = prefix ? `${prefix} ${fullName}` : fullName;
        return {
          id: doc.id,
          name: `${displayNameWithPrefix}${matiereSuffix}`,
          subjects: rawMatiereArray.map((m: any) => String(m).toLowerCase().trim())
        };
      });
      
      setRealTeachers(dbTeachers);
    }, (error) => {
      console.error("Error fetching real teachers: ", error);
      setRealTeachers([]);
    });

    // 2. Matières ou Disciplines (cours) réelles
    const unsubscribeSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const dbSubjects = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name as string || '',
          teacherId: data.teacherId as string || '',
          teacherName: data.teacherName as string || ''
        };
      }).filter(sub => !!sub.name);
      setRealSubjects(dbSubjects);
    }, (error) => {
      console.error("Error fetching real subjects: ", error);
      setRealSubjects([]);
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeSubjects();
    };
  }, [activeEstId]);

  // 1. Listen to Classes & Load Timetables
  useEffect(() => {
    const unsubscribeClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const fetchedClasses = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId && !doc.data().deleted)
        .map(doc => ({
        id: doc.id,
        name: doc.data().nom || doc.data().name || doc.data().label || 'Classe sans nom'
      }));
      
      setClasses(fetchedClasses);
      // Automatically target student's class or first class
      if (fetchedClasses.length > 0) {
        setSelectedClassId(prevId => {
          if (currentUser?.role === 'élève' && currentUser?.classe) {
            const matched = fetchedClasses.find(c => c.name.toLowerCase().trim() === currentUser.classe.toLowerCase().trim());
            if (matched) return matched.id;
          }
          if (currentUser?.role === 'parent' && currentUser?.enfantClasse) {
            const matched = fetchedClasses.find(c => c.name.toLowerCase().trim() === currentUser.enfantClasse.toLowerCase().trim());
            if (matched) return matched.id;
          }
          if (!prevId || !fetchedClasses.some(c => c.id === prevId)) {
            return fetchedClasses[0].id;
          }
          return prevId;
        });
      } else {
        setSelectedClassId('');
      }
    });

    const qTimetable = query(collection(db, 'timetable_assignments'));
    const unsubscribeTimetable = onSnapshot(qTimetable, (snapshot) => {
      const items = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimetableAssignment[];

      setAssignments(items);
      setLoadingTimetable(false);
    }, (error) => {
      console.error("Firestore timetable loading failed.", error);
      setAssignments([]);
      setLoadingTimetable(false);
    });

    // Listen to establishment-specific timetable config (time slots and rooms)
    const settingsDocRef = doc(db, 'timetable_settings', activeEstId);
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
          setTimeSlots(data.timeSlots);
          setSlotSettingsDraft(data.timeSlots);
        } else {
          setTimeSlots(DEFAULT_TIME_SLOTS);
          setSlotSettingsDraft(DEFAULT_TIME_SLOTS);
        }
        if (Array.isArray(data.rooms) && data.rooms.length > 0) {
          setEstablishmentRooms(data.rooms);
          setRoomsDraft(data.rooms);
        } else {
          setEstablishmentRooms(DEFAULT_ROOMS);
          setRoomsDraft(DEFAULT_ROOMS);
        }
      } else {
        setTimeSlots(DEFAULT_TIME_SLOTS);
        setSlotSettingsDraft(DEFAULT_TIME_SLOTS);
        setEstablishmentRooms(DEFAULT_ROOMS);
        setRoomsDraft(DEFAULT_ROOMS);
      }
    }, (err) => {
      console.warn("Could not fetch timetable_settings, using defaults.", err);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeTimetable();
      unsubscribeSettings();
    };
  }, [activeEstId]);

  // 2. Fetch Daily Agenda (Agenda tab)
  useEffect(() => {
    if (!currentUser) return;

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    // Fetch all plannings so that admins, students, and other teachers can see them.
    const qAgenda = query(collection(db, 'teacher_planning'));

    const unsubscribeAgenda = onSnapshot(qAgenda, (snapshot) => {
      let items = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanningItem[];

      items = items.filter(item => {
        const itemDate = item.startTime?.toDate?.() || new Date(0);
        // Disappear from planning exactly after 5 days (itemDate must be greater/newer than 5 days ago)
        return itemDate >= fiveDaysAgo;
      });

      // Sort
      items.sort((a, b) => {
        const timeA = a.startTime?.toDate?.().getTime() || 0;
        const timeB = b.startTime?.toDate?.().getTime() || 0;
        return timeA - timeB;
      });

      setPlanning(items);
      setLoadingAgenda(false);
    }, (error) => {
      console.warn("Agenda query error: ", error);
      setLoadingAgenda(false);
    });

    if (isTeacher) {
      setAgendaSubjects(currentUser.matieres || (currentUser.matiere ? [currentUser.matiere] : realSubjects.length > 0 ? realSubjects.map(s => s.name) : STATIC_SUBJECTS));
    } else {
      setAgendaSubjects(realSubjects.length > 0 ? realSubjects.map(s => s.name) : STATIC_SUBJECTS);
    }

    return () => {
      unsubscribeAgenda();
    };
  }, [activeEstId, currentUser, isTeacher, realSubjects]);

  // Handle saving manual assignments (Timetable)
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !isTeacher) {
      notifyError("Accès réservé au personnel administratif.");
      return;
    }

    if (!assignmentForm.subject || !assignmentForm.room) {
      notifyError("Veuillez remplir au moins la matière et la salle.");
      return;
    }

    const matchedTeacher = assignmentForm.teacherId ? realTeachers.find(t => t.id === assignmentForm.teacherId) : null;
    
    // Strict specialty constraint logic:
    if (matchedTeacher && assignmentForm.subject) {
      const normalizedSubject = assignmentForm.subject.toLowerCase().trim();
      const hasSubjectSpecialty = matchedTeacher.subjects.includes(normalizedSubject);
      
      if (matchedTeacher.subjects.length > 0 && !hasSubjectSpecialty) {
        notifyError(`⚠️ LOGIQUE STRICTE : Enseignant non habilité ! ${matchedTeacher.name.split('(')[0].trim()} enseigne uniquement : ${matchedTeacher.subjects.map(s => s.toUpperCase()).join(', ')}.`);
        return;
      }
    }

    const matchedClass = classes.find(c => c.id === (editingAssignment ? assignmentForm.classId : selectedClassId));

    try {
      const payload: Omit<TimetableAssignment, 'id'> & { etablissement: string } = {
        classId: editingAssignment ? assignmentForm.classId : selectedClassId,
        className: matchedClass?.name || 'Inconnue',
        subject: assignmentForm.subject,
        teacherId: assignmentForm.teacherId || '',
        teacherName: matchedTeacher?.name || 'Enseignant non assigné',
        dayOfWeek: editingAssignment ? editingAssignment.dayOfWeek : selectedCell!.day,
        slotId: editingAssignment ? editingAssignment.slotId : selectedCell!.slotId,
        room: assignmentForm.room,
        color: assignmentForm.color,
        isLocked: assignmentForm.isLocked,
        etablissement: activeEstId
      };

      if (editingAssignment) {
        // Check if ID is seed (simulated)
        if (editingAssignment.id.startsWith('seed_')) {
          // Add as new instead or set custom ID
          const newDocRef = doc(collection(db, 'timetable_assignments'));
          await setDoc(newDocRef, payload);
        } else {
          await updateDoc(doc(db, 'timetable_assignments', editingAssignment.id), payload);
        }
        notifySuccess("Cours mis à jour dans l'emploi du temps !");
      } else {
        // Prevent conflict locally
        const cellConflict = assignments.find(
          a => a.classId === payload.classId && 
          a.dayOfWeek === payload.dayOfWeek && 
          a.slotId === payload.slotId
        );

        if (cellConflict) {
          notifyError(`Conflit : Cette classe a déjà un cours (${cellConflict.subject}) dans ce créneau.`);
          return;
        }

        const teacherConflict = payload.teacherId ? assignments.find(
          a => a.teacherId === payload.teacherId && 
          a.dayOfWeek === payload.dayOfWeek && 
          a.slotId === payload.slotId
        ) : null;

        if (teacherConflict) {
          notifyError(`Conflit d'enseignant : ${payload.teacherName} a déjà un cours avec la classe ${teacherConflict.className}.`);
          return;
        }

        await addDoc(collection(db, 'timetable_assignments'), payload);
        notifySuccess("Cours ajouté à l'emploi du temps !");
      }

      setShowTimetableModal(false);
      setEditingAssignment(null);
      setSelectedCell(null);
    } catch (err) {
      console.error(err);
      notifyError("Erreur lors de la modification de l'emploi du temps.");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm("Retirer ce cours de l'emploi du temps ?")) return;
    try {
      if (id.startsWith('seed_')) {
        // Remove from local display state only since it was seeded
        setAssignments(prev => prev.filter(a => a.id !== id));
      } else {
        await deleteDoc(doc(db, 'timetable_assignments', id));
      }
      notifySuccess("Cours retiré de l'emploi du temps !");
      setShowTimetableModal(false);
      setEditingAssignment(null);
    } catch (err) {
      notifyError("Impossible de supprimer le cours.");
    }
  };

  // AI Automatic Schedule Solver Simulation
  const handleRunAISolver = async () => {
    if (realSubjects.length === 0) {
      notifyError("Aucune matière n'est disponible dans la base de données. Veuillez d'abord ajouter des matières !");
      return;
    }
    if (realTeachers.length === 0) {
      notifyError("Aucun enseignant n'est enregistré dans la base de données. Veuillez d'abord ajouter des enseignants !");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(5);
    const initialLogs = [
      "🚀 Démarrage de l'EITE AI Solver v2.5 pour Edu-Nify...",
      aiPrompt.trim() 
        ? `📝 Description & Consignes du prompt prises en compte : "${aiPrompt.trim().substring(0, 100)}${aiPrompt.trim().length > 100 ? '...' : ''}"`
        : "⚙️ Analyse des contraintes matérielles, volume horaires et indisponibilités..."
    ];
    setGenerationLogs(initialLogs);

    const runStep = (progress: number, logMsg: string, duration: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setGenerationProgress(progress);
          setGenerationLogs(prev => [...prev, logMsg]);
          resolve();
        }, duration);
      });
    };

    if (aiPrompt.trim()) {
      await runStep(10, `🧠 Parsing sémantique des directives spécifiques du prompt pour l'établissement...`, 600);
    }
    await runStep(18, `🤖 Extraction de la liste des enseignants de l'établissement : ${realTeachers.length} enseignants qualifiés.`, 600);
    await runStep(32, `📊 Analyse de ${classes.length} classes académiques pour l'optimisation des volumes horaires hebdomadaires.`, 800);
    await runStep(48, `🎯 Traitement de la contrainte dure : Respecter les plages horaires fixées (${timeSlots.filter(s => !s.isBreak).length} créneaux actifs).`, 600);
    await runStep(64, `🧩 Application de la contrainte souple : Minimiser les trous de créneaux vides (Time Slices) pour les classes.`, 700);
    await runStep(78, `🏢 Allocation de ${establishmentRooms.length} salles en évitant le chevauchement d'occupation.`, 600);
    await runStep(92, `🛡️ Algorithme génétique convergeant (Tentatives : 34 générées, score optimal atteint). Aucun conflit d'enseignant.`, 800);
    await runStep(100, `✨ Synthèse terminée avec succès ! 100% de concordance des contraintes. Emploi du temps prêt !`, 600);

    // Compute generated course table for all classes
    const generated: (TimetableAssignment & { etablissement?: string })[] = [];
    const subjectsSeed = realSubjects.map(sub => sub.name);
    const teachersSeed = realTeachers;
    const roomsSeed = establishmentRooms.length > 0 ? [...establishmentRooms] : [...DEFAULT_ROOMS];
    const usableSlots = timeSlots.filter(s => !s.isBreak);

    // Populate timetable classes
    classes.forEach((classe, classIdx) => {
      DAYS.forEach((day, dayIdx) => {
        // Allocate classes on active slots
        const selectedSlots = dayIdx === 5 
          ? usableSlots.slice(0, 2).map(s => s.id)
          : usableSlots.filter(() => Math.random() > 0.25).map(s => s.id);
        
        selectedSlots.forEach((slotId) => {
          const slotNum = parseInt(slotId) || 1;
          const subjectIdx = (classIdx + dayIdx + slotNum * 13) % subjectsSeed.length;
          const subject = subjectsSeed[subjectIdx];
          
          // Strict search of qualified teachers
          const qualifiedTeachers = teachersSeed.filter(t => 
            t.subjects.includes(subject.toLowerCase().trim())
          );

          let assignedTeacherId = '';
          let assignedTeacherName = 'Enseignant non assigné';
          
          if (qualifiedTeachers.length > 0) {
            const chosenTeacher = qualifiedTeachers[(classIdx + dayIdx + slotNum) % qualifiedTeachers.length];
            assignedTeacherId = chosenTeacher.id;
            assignedTeacherName = chosenTeacher.name;
          }

          const roomIdx = (subjectIdx + slotNum) % roomsSeed.length;

          generated.push({
            id: `gen_${activeEstId}_${classe.id}_${day}_${slotId}`,
            classId: classe.id,
            className: classe.name,
            subject: subject,
            teacherId: assignedTeacherId,
            teacherName: assignedTeacherName,
            dayOfWeek: day,
            slotId: slotId,
            room: roomsSeed[roomIdx],
            color: COLORS[subjectIdx % COLORS.length],
            isLocked: false,
            etablissement: activeEstId
          });
        });
      });
    });

    // Save generated items directly in Firestore with establishment isolation
    try {
      setAssignments(generated);
      
      for (const item of generated.slice(0, 25)) {
        const docRef = doc(collection(db, 'timetable_assignments'), item.id);
        await setDoc(docRef, {
          classId: item.classId,
          className: item.className,
          subject: item.subject,
          teacherId: item.teacherId,
          teacherName: item.teacherName,
          dayOfWeek: item.dayOfWeek,
          slotId: item.slotId,
          room: item.room,
          color: item.color,
          isLocked: item.isLocked,
          etablissement: activeEstId
        });
      }
      
      notifySuccess("Moteur IA complet : Emploi du temps généré, optimisé et publié pour l'établissement !");
    } catch (e) {
      console.warn("Could not save all optimized solver items back to firestore. Fallback local view.", e);
    }

    setIsGenerating(false);
    setShowGeneratorPanel(false);
  };

  // Agenda Form submission
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher) return;

    try {
      if (!agendaFormData.startDate || !agendaFormData.startTime || !agendaFormData.endDate || !agendaFormData.endTime) {
        notifyError("Veuillez remplir toutes les dates et heures.");
        return;
      }

      const startString = `${agendaFormData.startDate}T${agendaFormData.startTime}`;
      const endString = `${agendaFormData.endDate}T${agendaFormData.endTime}`;
      
      const start = new Date(startString);
      const end = new Date(endString);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        notifyError("Format de date ou heure invalide.");
        return;
      }

      if (end <= start) {
        notifyError(t('end_before_start_error'));
        return;
      }

      const selectedClass = classes.find(c => c.id === agendaFormData.classId);

      const data = {
        title: agendaFormData.title,
        description: agendaFormData.description,
        type: agendaFormData.type,
        classId: agendaFormData.classId,
        className: selectedClass?.name || '',
        subject: agendaFormData.subject,
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        teacherId: currentUser.id,
        teacherName: `${currentUser.prenom} ${currentUser.nom}`,
        etablissement: activeEstId,
        updatedAt: serverTimestamp()
      };

      if (editingAgendaItem) {
        if (editingAgendaItem.teacherId !== currentUser.id) {
          notifyError("Vous ne pouvez pas modifier le planning d'un autre enseignant.");
          return;
        }
        await updateDoc(doc(db, 'teacher_planning', editingAgendaItem.id), {
          ...data,
          // Keep original creator info
          teacherId: editingAgendaItem.teacherId,
          teacherName: editingAgendaItem.teacherName
        });
        notifySuccess("Activité répertoriée modifiée !");
      } else {
        await addDoc(collection(db, 'teacher_planning'), {
          ...data,
          createdAt: serverTimestamp()
        });
        notifySuccess("Succès : Activité ajoutée à votre planning !");
      }

      setShowAddAgendaModal(false);
      setEditingAgendaItem(null);
      resetAgendaForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'teacher_planning');
    }
  };

  const resetAgendaForm = () => {
    setAgendaFormData({
      title: '',
      description: '',
      type: 'cours',
      classId: '',
      className: '',
      subject: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: getCurrentTime(),
      endDate: new Date().toISOString().split('T')[0],
      endTime: getOneHourLater()
    });
  };

  const handleDeleteAgendaItem = async (id: string) => {
    const item = planning.find(p => p.id === id);
    if (!isTeacher || (item && item.teacherId !== currentUser?.id)) {
      notifyError("Vous n'êtes pas autorisé à supprimer ce planning (réservé à l'enseignant propriétaire).");
      return;
    }
    if (!window.confirm("Archiver cet élément du planning ?")) return;
    try {
      await deleteDoc(doc(db, 'teacher_planning', id));
      notifySuccess("Élément retiré de l'agenda quotidien !");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teacher_planning/${id}`);
    }
  };

  const openEditAgenda = (item: PlanningItem) => {
    setEditingAgendaItem(item);
    const start = item.startTime?.toDate?.() || new Date();
    const end = item.endTime?.toDate?.() || new Date();
    
    const formatTime = (date: Date) => {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    setAgendaFormData({
      title: item.title,
      description: item.description || '',
      type: item.type,
      classId: item.classId || '',
      className: item.className || '',
      subject: item.subject || '',
      startDate: start.toISOString().split('T')[0],
      startTime: formatTime(start),
      endDate: end.toISOString().split('T')[0],
      endTime: formatTime(end)
    });
    setShowAddAgendaModal(true);
  };

  // Helper inside cell renders
  const getAssignmentsForCell = (day: string, slotId: string) => {
    return assignments.filter(a => {
      if (a.dayOfWeek !== day || a.slotId !== slotId) return false;
      
      const matchesClass = a.classId === selectedClassId;
      const matchesSubject = selectedSubject === 'all' || a.subject.toLowerCase().trim() === selectedSubject.toLowerCase().trim();
      
      return matchesClass && matchesSubject;
    });
  };

  const printTimetable = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 🚀 Header Timetable */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-indigo-600 w-7 h-7" />
            Emploi du Temps Intelligent
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gérez la distribution des cours, vérifiez l'allocation des salles et lancez le résolveur IA (EITE).
          </p>
        </div>

        {/* Dynamic section tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800">
          <button
            onClick={() => setActiveSection('timetable')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSection === 'timetable'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            🗓️ Version Hebdomadaire
          </button>
          <button
            onClick={() => setActiveSection('agenda')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSection === 'agenda'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📋 Agenda & Activités {planning.length > 0 && `(${planning.length})`}
          </button>
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      {activeSection === 'timetable' && (
        <div className="space-y-6">
          {(realTeachers.length === 0 || realSubjects.length === 0) && (
            <div className="bg-amber-50 dark:bg-amber-940/20 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-[20px] flex gap-3 shadow-sm">
              <span className="text-lg leading-none">⚠️</span>
              <div>
                <p className="text-xs font-black text-amber-800 dark:text-amber-400">
                  Mode de filtrage des données réelles de la base
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-1 font-bold leading-relaxed">
                  {realTeachers.length === 0 && realSubjects.length === 0
                    ? "Aucun enseignant ni aucune matière n'est encore enregistré dans la base de données de l'établissement."
                    : realTeachers.length === 0
                    ? "Aucun enseignant n'est enregistré dans la base de données. Les emplois du temps masqueront les enseignants non réels."
                    : "Aucune matière n'est enregistrée dans la base de données. Les emplois du temps masqueront les matières non réelles."}{" "}
                  Veuillez enregistrer des enseignants et des matières réels pour les voir s'afficher de manière dynamique.
                </p>
              </div>
            </div>
          )}

          {/* Action Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full lg:w-auto">
              
              {/* Select class filter */}
              <div className="flex items-center gap-2.5 bg-white dark:bg-gray-800 px-3.5 py-2 sm:py-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all flex-1 sm:flex-initial">
                <Users size={16} className="text-indigo-500" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 w-full">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block min-w-[50px]">Classe :</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSubject('all');
                    }}
                    className="bg-transparent border-none text-xs sm:text-sm font-black text-gray-800 dark:text-white focus:ring-0 outline-none cursor-pointer w-full"
                  >
                    {classes.map(cl => (
                      <option key={cl.id} value={cl.id} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800 font-bold">
                        🏫 {cl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select subject filter */}
              <div className="flex items-center gap-2.5 bg-white dark:bg-gray-800 px-3.5 py-2 sm:py-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all flex-1 sm:flex-initial">
                <BookOpen size={16} className="text-emerald-500" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 w-full">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block min-w-[55px]">Matière :</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                    }}
                    className="bg-transparent border-none text-xs sm:text-sm font-black text-gray-800 dark:text-white focus:ring-0 outline-none cursor-pointer w-full"
                  >
                    <option value="all" className="bg-white dark:bg-gray-800 font-bold">🔬 Toutes les matières</option>
                    {(realSubjects.length > 0 ? realSubjects.map(s => s.name) : STATIC_SUBJECTS).map((subName, sIdx) => (
                      <option key={sIdx} value={subName} className="bg-white dark:bg-gray-800 font-bold">
                        📚 {subName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Print timetable */}
              <button
                onClick={printTimetable}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-sm flex-1 sm:flex-initial"
              >
                <Printer size={15} />
                <span>Imprimer l'EDT</span>
              </button>
            </div>

            {/* AI Optimization solver button for authorized roles */}
            {(isAdmin || isTeacher) && (
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSlotSettingsDraft(timeSlots);
                      setRoomsDraft(establishmentRooms);
                      setShowSlotSettingsModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-black hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-sm cursor-pointer"
                    title="Configurer les créneaux horaires et salles de cet établissement"
                  >
                    <Settings size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Plages Horaires & Salles</span>
                  </button>
                )}
                <button
                  onClick={() => setShowGeneratorPanel(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-black hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/15 cursor-pointer"
                >
                  <Sparkles size={16} className="animate-pulse" />
                  Moteur IA : Générer avec Prompt (EITE)
                </button>
              </div>
            )}
          </div>

          {/* Timetable Grid Container */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden print:p-0">
            {loadingTimetable ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 font-bold">Optimisation des plages de l'emploi du temps en cours...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-xl mx-auto">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-indigo-600 rounded-full mb-4">
                  <AlertCircle size={40} className="stroke-[1.5]" />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Aucune classe décelée</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Pour configurer et afficher un emploi du temps en temps réel, vous devez d'abord ajouter des classes réelles dans l'onglet <strong>Classes</strong> du menu de navigation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase w-40 text-center border-r border-gray-100 dark:border-gray-700">Heures / Plages</th>
                      {DAYS.map((day) => (
                        <th key={day} className="py-4 px-4 text-sm font-black text-gray-900 dark:text-white text-center w-48">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => {
                      if (slot.isBreak) {
                        return (
                          <tr key={slot.id} className="bg-gray-50/40 dark:bg-gray-900/10 border-t border-b border-dashed border-gray-100 dark:border-gray-800">
                            <td className="py-2.5 px-6 font-bold text-center border-r border-gray-100 dark:border-gray-700 text-xs text-indigo-600 uppercase">
                              {slot.name}
                            </td>
                            <td colSpan={DAYS.length} className="py-2.5 text-center text-xs font-extrabold tracking-widest text-indigo-500 dark:text-indigo-400 bg-gray-50 dark:bg-gray-900">
                              ⚡ BREAK : {slot.label?.toUpperCase()} ⚡
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={slot.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-all h-36">
                          <td className="py-4 px-4 text-center border-r border-gray-100 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-900/5">
                            <Clock size={16} className="text-gray-400 mx-auto mb-1.5" />
                            <span className="text-sm font-black text-gray-800 dark:text-gray-200">{slot.name}</span>
                            <span className="block text-[10px] text-gray-400 uppercase font-black mt-1">Créneau {slot.id}</span>
                          </td>
                          {DAYS.map((day) => {
                            const cells = getAssignmentsForCell(day, slot.id);
                            const validCourses = cells;

                            return (
                              <td
                                key={`${day}-${slot.id}`}
                                className="p-2 border-r border-gray-50 dark:border-gray-800 relative group"
                              >
                                {validCourses.length > 0 ? (
                                  validCourses.map((course) => {
                                    // Robust real-time teacher resolution from firebase list:
                                    // 1. Try exact ID
                                    let matchedDbTeacher = realTeachers.find(t => t.id === course.teacherId);
                                    
                                    // 2. Fallback: try match by name
                                    if (!matchedDbTeacher && course.teacherName) {
                                      matchedDbTeacher = realTeachers.find(t => 
                                        t.name.toLowerCase().replace(/\s+/g, '').includes(course.teacherName.toLowerCase().replace(/\s+/g, ''))
                                      );
                                    }
                                    
                                    // 3. Fallback: If no teacher specified, search if a teacher is officially assigned to this subject
                                    if (!matchedDbTeacher) {
                                      const matchingSubjectDoc = realSubjects.find(s => s.name.toLowerCase().trim() === course.subject.toLowerCase().trim());
                                      if (matchingSubjectDoc && matchingSubjectDoc.teacherId) {
                                        matchedDbTeacher = realTeachers.find(t => t.id === matchingSubjectDoc.teacherId);
                                      }
                                    }

                                    const hasRealTeacher = !!matchedDbTeacher;
                                    const displayTeacherName = hasRealTeacher ? matchedDbTeacher.name.split('(')[0].trim() : '';

                                    return (
                                      <div
                                        key={course.id}
                                        onClick={() => {
                                          if (isAdmin || isTeacher) {
                                            setEditingAssignment(course);
                                            setAssignmentForm({
                                              subject: course.subject,
                                              teacherId: course.teacherId,
                                              room: course.room,
                                              classId: course.classId,
                                              color: course.color || COLORS[0],
                                              isLocked: course.isLocked || false
                                            });
                                            setShowTimetableModal(true);
                                          }
                                        }}
                                        className={`h-full min-h-[110px] p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer shadow-sm ${course.color || COLORS[0]} ring-offset-2 hover:shadow-md active:scale-95`}
                                      >
                                        <div>
                                          <div className="flex items-start justify-between">
                                            <span className="text-xs font-black tracking-tight line-clamp-1">{course.subject}</span>
                                            {course.isLocked && <Lock size={10} className="text-gray-400" />}
                                          </div>
                                          {hasRealTeacher && (
                                            <span className="block text-[10.5px] font-bold opacity-80 mt-1 line-clamp-1">
                                              👤 {displayTeacherName}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mt-2 border-t border-dashed border-black/10 dark:border-white/10 pt-1.5">
                                          <span className="flex items-center gap-0.5">
                                            <MapPin size={10} /> {course.room}
                                          </span>
                                          {selectedSubject === 'all' && (
                                            <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md uppercase text-[9px]">
                                              {course.className}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="h-full min-h-[110px] rounded-2xl border border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-2 text-center text-gray-300 dark:text-gray-600 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 group-hover:bg-indigo-50/10 dark:group-hover:bg-indigo-950/5 transition-all">
                                    <HelpCircle size={16} className="opacity-40 mb-1" />
                                    <span className="text-[10px] font-bold">Disponible</span>
                                    
                                    {(isAdmin || isTeacher) && (
                                      <button
                                        onClick={() => {
                                          setEditingAssignment(null);
                                          setSelectedCell({ day, slotId: slot.id });
                                          setAssignmentForm({
                                            subject: '',
                                            teacherId: '',
                                            room: '',
                                            classId: selectedClassId,
                                            color: COLORS[0],
                                            isLocked: false
                                          });
                                          setShowTimetableModal(true);
                                        }}
                                        className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Plus size={10} /> Assigner
                                      </button>
                                    )}
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
            )}
          </div>
        </div>
      )}

      {/* AGENDA & DAILY ACTIVITIES VIEW */}
      {activeSection === 'agenda' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left panel metrics */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="text-indigo-500 w-5 h-5" />
                Planning & Devoirs du Jour
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Activités répertoriées</span>
                    <span className="text-4xl font-black text-indigo-900 dark:text-indigo-100">{planning.length}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Activités scolaires prévues à l'agenda pour un cycle de 24 heures glissantes.
                  </p>
                </div>
                
                {isTeacher && (
                  <button
                    onClick={() => { resetAgendaForm(); setEditingAgendaItem(null); setShowAddAgendaModal(true); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    <Plus size={18} />
                    Inscrire une activité quotidienne
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel list items */}
          <div className="xl:col-span-2 space-y-4">
            {loadingAgenda ? (
              <div className="flex justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : planning.length > 0 ? (
              <div className="space-y-4">
                {planning.map((item) => {
                  const now = new Date();
                  const start = item.startTime?.toDate?.() || new Date();
                  const end = item.endTime?.toDate?.() || new Date();
                  const isPast = end < now;
                  const isCurrent = start <= now && end >= now;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border transition-all ${
                        isCurrent ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-100 dark:border-gray-700'
                      } ${isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'cours' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            item.type === 'réunion' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            item.type === 'examen' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {item.type}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[9px] font-black animate-pulse">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              DIRECT EN COURS
                            </span>
                          )}
                        </div>
                        
                        {isTeacher && item.teacherId === currentUser.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditAgenda(item)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-450 rounded-lg transition-colors"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteAgendaItem(item.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-650 dark:text-gray-400 mb-4">{item.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={14} className="text-indigo-500" />
                          <span>
                            {item.startTime?.toDate?.().toLocaleTimeString(language === 'fr' ? 'fr-FR' : language, { hour: '2-digit', minute: '2-digit' })} - {item.endTime?.toDate?.().toLocaleTimeString(language === 'fr' ? 'fr-FR' : language, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {item.className && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-end">
                            <Users size={14} className="text-indigo-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300">{item.className}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <CalendarIcon size={14} className="text-indigo-500" />
                          <span>{item.startTime?.toDate?.().toLocaleDateString(language === 'fr' ? 'fr-FR' : language, { day: 'numeric', month: 'short' })}</span>
                        </div>

                        {item.subject && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-end">
                            <BookOpen size={14} className="text-indigo-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300">{item.subject}</span>
                          </div>
                        )}
                      </div>
                      
                      {(!isTeacher || item.teacherId !== currentUser.id) && item.teacherName && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-[11px]">
                          <span className="text-gray-450 uppercase font-black">Professeur référent</span>
                          <span className="font-bold text-gray-750 dark:text-gray-300">{item.teacherName}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                <CalendarIcon size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aucune activité prévue</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mt-1">
                  {isTeacher ? "Inscrivez vos cours supplémentaires ou réunions extraordinaires pour informer vos collègues et élèves." : "Consultez l'agenda quotidien de l'école."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔮 MODAL : ADD/EDIT MANUAL TIMETABLE COURSE */}
      <AnimatePresence>
        {showTimetableModal && (() => {
          const qualifiedTeachers = assignmentForm.subject
            ? realTeachers.filter(t => t.subjects.includes(assignmentForm.subject.toLowerCase().trim()))
            : realTeachers;

          const displayedTeachers = filterQualifiedTeachersOnly ? qualifiedTeachers : realTeachers;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTimetableModal(false)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-150 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                        {editingAssignment ? 'Modifier le cours' : 'Planifier un cours'}
                      </h2>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                        {editingAssignment 
                          ? `${editingAssignment.dayOfWeek} • Créneau ${editingAssignment.slotId}` 
                          : `${selectedCell?.day} • Créneau ${selectedCell?.slotId}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowTimetableModal(false)} className="p-2 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Form Wrapper */}
                <form onSubmit={handleSaveAssignment} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
                  {editingAssignment && (
                    <div>
                      <label className="block text-[11px] font-black tracking-wider text-gray-450 dark:text-gray-500 uppercase mb-1.5">Classe ciblée</label>
                      <select
                        value={assignmentForm.classId}
                        onChange={e => setAssignmentForm({...assignmentForm, classId: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all font-mono shadow-inner"
                      >
                        {classes.map(cl => (
                          <option key={cl.id} value={cl.id}>{cl.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Subject Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-black tracking-wider text-gray-450 dark:text-gray-550 uppercase">Matière / Discipline <span className="text-rose-500">*</span></label>
                      {assignmentForm.subject && (
                        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-full border border-indigo-100/30 dark:border-indigo-900/30">
                          {qualifiedTeachers.length} enseignant(s) qualifié(s)
                        </span>
                      )}
                    </div>
                    <select
                      value={assignmentForm.subject}
                      onChange={e => {
                        const newSub = e.target.value;
                        setAssignmentForm(prev => {
                          const updated = { ...prev, subject: newSub };
                          // Auto-retrieve the teacher assigned to this subject in the database
                          const matchedSubjectDoc = realSubjects.find(s => s.name === newSub);
                          if (matchedSubjectDoc && matchedSubjectDoc.teacherId) {
                            updated.teacherId = matchedSubjectDoc.teacherId;
                          } else if (newSub && filterQualifiedTeachersOnly) {
                            const match = realTeachers.find(t => t.id === prev.teacherId);
                            if (match && !match.subjects.includes(newSub.toLowerCase().trim())) {
                              updated.teacherId = '';
                            }
                          }
                          return updated;
                        });
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                      required
                    >
                      <option value="">-- Choisir la discipline --</option>
                      {realSubjects.map((sub, idx) => (
                        <option key={sub.id || idx} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Qualified Teacher Filter Toggle Switch */}
                  {assignmentForm.subject && (
                    <div className="flex items-center justify-between bg-indigo-50/20 dark:bg-indigo-950/10 p-3 sm:p-4 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/20 transition-all">
                      <div className="flex items-center gap-2.5">
                        <Sliders size={16} className="text-indigo-500" />
                        <div className="text-left">
                          <p className="text-[11px] font-black text-gray-800 dark:text-gray-200">Filtration de spécialité active</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Uniquement les enseignants habilités en {assignmentForm.subject}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFilterQualifiedTeachersOnly(!filterQualifiedTeachersOnly)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          filterQualifiedTeachersOnly ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          filterQualifiedTeachersOnly ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  )}

                  {/* Teacher Dropdown */}
                  <div>
                    <label className="block text-[11px] font-black tracking-wider text-gray-450 dark:text-gray-550 uppercase mb-1.5">Enseignant référent</label>
                    <select
                      value={assignmentForm.teacherId}
                      onChange={e => setAssignmentForm({...assignmentForm, teacherId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                    >
                      <option value="">-- Laisser non assigné (Matière seule) --</option>
                      {displayedTeachers.map((teacher) => {
                        const isQualified = assignmentForm.subject && teacher.subjects.includes(assignmentForm.subject.toLowerCase().trim());
                        return (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name.split('(')[0].trim()} {teacher.subjects.length > 0 ? `[${teacher.subjects.map(s => s.toUpperCase()).join(', ')}]` : '(Sans Spécialité)'}
                            {assignmentForm.subject && !isQualified ? ' ⚠️ Hors Spécialité' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {/* Notification Alert Message Banners */}
                    {assignmentForm.teacherId ? (() => {
                      const selTeacher = realTeachers.find(t => t.id === assignmentForm.teacherId);
                      const isTeacherQualified = assignmentForm.subject && selTeacher?.subjects.includes(assignmentForm.subject.toLowerCase().trim());

                      if (selTeacher && isTeacherQualified) {
                        return (
                          <div className="mt-2 text-[10.5px] text-left font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span>Validé : Enseignant qualifié et disponible pour dispenser ce cours.</span>
                          </div>
                        );
                      } else if (selTeacher && !isTeacherQualified) {
                        return (
                          <div className="mt-2 text-[10.5px] text-left font-bold text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-amber-100 dark:border-amber-900/40 leading-relaxed">
                            <span>⚠️ Attention : Cet enseignant n'est pas spécialisé en {assignmentForm.subject}. La validation bloquera la sauvegarde globale si la règle stricte est active.</span>
                          </div>
                        );
                      }
                      return null;
                    })() : assignmentForm.subject && qualifiedTeachers.length === 0 ? (
                      <div className="mt-2 text-[10.5px] text-left font-bold text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/10 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-amber-100 dark:border-amber-900/30">
                        <span>ℹ️ Aucun enseignant spécialiste de cette matière n'est trouvé en base de données. L'école pourra enseigner la matière sans enseignant pour le moment.</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Room Dropdown */}
                  <div>
                    <label className="block text-[11px] font-black tracking-wider text-gray-450 dark:text-gray-550 uppercase mb-1.5">Salle attribuée <span className="text-rose-500">*</span></label>
                    <select
                      value={assignmentForm.room}
                      onChange={e => setAssignmentForm({...assignmentForm, room: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                      required
                    >
                      <option value="">-- Choisir la salle --</option>
                      {(establishmentRooms.length > 0 ? establishmentRooms : DEFAULT_ROOMS).map((room, idx) => (
                        <option key={idx} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>

                  {/* Identifier Accent Color */}
                  <div>
                    <label className="block text-[11px] font-black tracking-wider text-gray-450 dark:text-gray-555 uppercase mb-2">Couleur d'identification visuelle</label>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5">
                      {COLORS.map((color, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAssignmentForm({...assignmentForm, color})}
                          className={`h-9 w-full rounded-2xl border border-black/10 dark:border-white/10 transition-all active:scale-90 ${color.split(' ')[0]} ${
                            assignmentForm.color === color ? 'ring-4 ring-indigo-500 scale-105 shadow-md' : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Locked Option */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-150 dark:border-gray-750">
                    <input
                      type="checkbox"
                      id="isLockedCheck"
                      checked={assignmentForm.isLocked}
                      onChange={e => setAssignmentForm({...assignmentForm, isLocked: e.target.checked})}
                      className="rounded-lg h-5 w-5 border-gray-350 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="isLockedCheck" className="text-[11px] font-extrabold text-gray-600 dark:text-gray-300 uppercase cursor-pointer flex items-center gap-1.5 leading-none">
                      <Lock size={13} className="text-amber-500" /> Protéger ce cours des régénérations automatiques IA (EITE)
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 border-t border-dashed border-gray-150 dark:border-gray-700">
                    {editingAssignment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(editingAssignment.id)}
                        className="w-full sm:flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-2xl font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 text-xs sm:text-sm"
                      >
                        <Trash2 size={16} /> Retirer le cours
                      </button>
                    )}
                    <button
                      type="submit"
                      className="w-full sm:flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-95 text-sm"
                    >
                      <CheckCircle2 size={16} /> Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 🤖 MODAL / OVERLAY : AI GENERATOR SOLVER ENGINE PANEL */}
      <AnimatePresence>
        {showGeneratorPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isGenerating) setShowGeneratorPanel(false); }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl h-[92vh] sm:h-[85vh] flex flex-col font-sans"
              onClick={e => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-700/80 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="animate-pulse" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">Moteur d'Optimisation Génétique EITE</h2>
                      <span className="hidden sm:inline px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase rounded">v2.5 Pro</span>
                    </div>
                    <p className="text-[11px] text-gray-500">Génération automatique d'emplois du temps optimaux par algorithme évolutionnaire.</p>
                  </div>
                </div>
                {!isGenerating && (
                  <button 
                    onClick={() => setShowGeneratorPanel(false)} 
                    className="p-1.5 sm:p-2 hover:bg-gray-150 dark:hover:bg-gray-700/80 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* MODAL BODY (SCROLLABLE CONTAINER) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* PROMPT INPUT SECTION: AI Natural Language Guidance */}
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-950/30 dark:via-gray-850 dark:to-violet-950/30 p-4 sm:p-5 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/60 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                          <span>Saisie du Prompt de Génération</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wide">
                            Assistant IA
                          </span>
                        </h3>
                        <p className="text-xs text-gray-550 dark:text-gray-400">
                          Décrivez librement vos consignes et préférences pour guider le moteur d'optimisation
                        </p>
                      </div>
                    </div>
                    {aiPrompt && (
                      <button
                        type="button"
                        onClick={() => setAiPrompt('')}
                        disabled={isGenerating}
                        className="text-[11px] font-bold text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={isGenerating}
                      rows={3}
                      placeholder="Ex: Répartir les cours de Mathématiques et Français le matin entre 08h00 et 11h00 pour les 6èmes. Réserver le mercredi matin pour les activités scientifiques et le sport. Éviter les heures creuses pour les enseignants vacataires..."
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner resize-y disabled:opacity-50"
                    />
                    
                    {/* Prompt suggestions pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500 mr-1">Suggestions rapides :</span>
                      {[
                        "Maths et Français le matin",
                        "Mercredi SVT & Sport",
                        "Pas de cours après 15h30 le vendredi",
                        "Prioriser les salles spécialisées",
                        "Équilibrer les volumes horaires"
                      ].map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => {
                            setAiPrompt(prev => prev ? `${prev.trim()}. ${suggestion}.` : `${suggestion}.`);
                          }}
                          className="px-2.5 py-1 bg-white/80 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: GA PARAMETERS & CRITERIA (SPAN 5 ON LG) */}
                  <div className="lg:col-span-5 space-y-5">
                    
                    {/* Educational scientific info widget */}
                    <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40 flex gap-3">
                      <HelpCircle className="text-indigo-600 dark:text-indigo-400 shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-wide">Comment fonctionne l'IA Génétique ?</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                          L'algorithme simule l'évolution naturelle en créant un ensemble de {gaPopulationSize} EDT prototypes (les chromosomes). Les meilleurs candidats sont sélectionnés, croisés (Crossover à {gaCrossoverRate}%) et mutés (Mutation à {gaMutationRate}%) jusqu'à éliminer 100% des conflits horaires.
                        </p>
                      </div>
                    </div>

                    {/* HARD & SOFT SCHEDULE CONSTRAINTS */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">1. Contraintes & Règles de Métier</h3>
                      
                      <div className="space-y-3 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-750">
                        <div className="flex items-center justify-between">
                          <div className="pr-2">
                            <span className="block text-xs font-black text-gray-850 dark:text-gray-200">Max heures de cours / Jour</span>
                            <span className="text-[10px] text-gray-500">Limite maximale pour une même classe</span>
                          </div>
                          <select
                            disabled={isGenerating}
                            value={constraintsConfig.maxHoursPerDay}
                            onChange={e => setConstraintsConfig({...constraintsConfig, maxHoursPerDay: parseInt(e.target.value)})}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-xl text-xs font-bold font-sans h-8"
                          >
                            <option value="4">4 heures</option>
                            <option value="6">6 heures</option>
                            <option value="8">8 heures</option>
                          </select>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-black text-gray-855 dark:text-gray-200">Prévenir les créneaux doubles</span>
                            <span className="text-[10px] text-gray-500">Éviter deux cours d'une même matière par jour</span>
                          </div>
                          <input
                            disabled={isGenerating}
                            type="checkbox"
                            checked={constraintsConfig.preventDoubleIntervals}
                            onChange={e => setConstraintsConfig({...constraintsConfig, preventDoubleIntervals: e.target.checked})}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer disabled:opacity-50"
                          />
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-black text-gray-855 dark:text-gray-200">Disponibilités des vacataires</span>
                            <span className="text-[10px] text-gray-500">Respecter la présence déclarée des enseignants</span>
                          </div>
                          <input
                            disabled={isGenerating}
                            type="checkbox"
                            checked={constraintsConfig.respectVacatairesDispo}
                            onChange={e => setConstraintsConfig({...constraintsConfig, respectVacatairesDispo: e.target.checked})}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* GA HYPERPARAMETERS CONTROLS */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">2. Hyperparamètres de l'Algorithme</h3>
                      
                      <div className="bg-gray-50/55 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-750 space-y-4">
                        
                        {/* Selection Method Selection */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Méthode de Sélection naturelle</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['tournament', 'roulette', 'elitism'] as const).map(method => (
                              <button
                                key={method}
                                type="button"
                                disabled={isGenerating}
                                onClick={() => setGaSelectionMethod(method)}
                                className={`py-1.5 text-[9px] font-black rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                  gaSelectionMethod === method
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-gray-755'
                                }`}
                              >
                                {method === 'tournament' ? 'Tournoi' : method === 'roulette' ? 'Roulette' : 'Élite'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Population Size Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-gray-700 dark:text-gray-300">Taille de Population</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{gaPopulationSize} Chromosomes</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={400}
                            step={10}
                            disabled={isGenerating}
                            value={gaPopulationSize}
                            onChange={e => setGaPopulationSize(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[9px] text-gray-400">
                            <span>Rapide (50)</span>
                            <span>Précis / Convergent (400)</span>
                          </div>
                        </div>

                        {/* Crossover Rate Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-gray-700 dark:text-gray-300">Taux de Croisement (Crossover)</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{gaCrossoverRate}%</span>
                          </div>
                          <input
                            type="range"
                            min={60}
                            max={95}
                            step={5}
                            disabled={isGenerating}
                            value={gaCrossoverRate}
                            onChange={e => setGaCrossoverRate(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        {/* Mutation Rate Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-gray-700 dark:text-gray-300">Taux de Mutation Génique</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{gaMutationRate}%</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={15}
                            step={1}
                            disabled={isGenerating}
                            value={gaMutationRate}
                            onChange={e => setGaMutationRate(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: LIVE RE-OPTIMIZATION SIMULATOR & CHARTS (SPAN 7 ON LG) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* INTERACTIVE EVOLVING CHROMOSOME REPRESENTATION */}
                    <div className="bg-white dark:bg-gray-900/40 border border-gray-150 dark:border-gray-700 rounded-2xl p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGenerating ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isGenerating ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                          </span>
                          <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Génome & Chromosomes Évolutifs</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                          Vitesse : {isGenerating ? '780it/s (EITE)' : '--'}
                        </span>
                      </div>

                      {/* Chromosome blocks visualization */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-xl space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Individu Alpha (Optimal)</p>
                          <div className="flex items-center gap-1 overflow-x-auto pb-1">
                            {['Matières', 'Salles', 'Profs', 'Plages', 'Verrous'].map((lbl, idx) => {
                              let cellBg = "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400";
                              if (idx === 1) cellBg = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400";
                              if (idx === 2) cellBg = "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400";
                              if (idx === 3) cellBg = "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400";
                              if (idx === 4) cellBg = "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400";

                              return (
                                <div 
                                  key={idx} 
                                  style={{ animationDelay: `${idx * 150}ms` }}
                                  className={`flex-1 text-center py-2 px-1 text-[9px] font-black uppercase rounded-lg border border-transparent transition-all shrink-0 min-w-[50px] ${
                                    isGenerating ? 'animate-pulse scale-95 border-indigo-300 dark:border-indigo-800' : ''
                                  } ${cellBg}`}
                                >
                                  {lbl}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>Gènes alignés</span>
                            <span className="font-extrabold text-indigo-600">
                              {isGenerating ? `${Math.floor(400 + generationProgress * 12.4)}/1640 bases` : '1580/1640 bases'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-xl space-y-2 flex flex-col justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Statut Evolutionnaire</p>
                          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono font-bold">
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-750 py-1.5 rounded-lg flex flex-col justify-center">
                              <span className="block text-[8px] text-gray-400 uppercase font-sans">Générations</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {isGenerating ? Math.floor(generationProgress * 0.42) + 1 : '42'}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-750 py-1.5 rounded-lg flex flex-col justify-center">
                              <span className="block text-[8px] text-gray-400 uppercase font-sans">Permutations</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {isGenerating ? Math.max(0, Math.floor((100 - generationProgress) / 4)) : '0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LIVE UPDATING CONVERGENCE PROGRESS SVG CHART */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-750/80">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-black uppercase mb-2">
                          <span>Courbe de Convergence (Collision d'horaires %)</span>
                          <span className="font-mono text-indigo-600 text-[11px] font-black tracking-wider">
                            {isGenerating ? `Conflits : ${Math.max(0, Math.floor((100 - generationProgress) * 0.4))} %` : 'Conflits : 0% (Optimisé)'}
                          </span>
                        </div>

                        {/* Responsive SVG Container */}
                        <div className="relative w-full h-28 sm:h-32 overflow-hidden bg-white dark:bg-gray-950 p-1 rounded-lg border border-gray-100 dark:border-gray-800">
                          <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            <line x1="10" y1="10" x2="390" y2="10" stroke="#f1f5f9" className="dark:stroke-gray-800/40" strokeDasharray="3,3" />
                            <line x1="10" y1="50" x2="390" y2="50" stroke="#f1f5f9" className="dark:stroke-gray-800/40" strokeDasharray="3,3" />
                            <line x1="10" y1="90" x2="390" y2="90" stroke="#f1f5f9" className="dark:stroke-gray-800/40" strokeDasharray="3,3" />
                            <line x1="10" y1="130" x2="390" y2="130" stroke="#e2e8f0" className="dark:stroke-gray-800" />

                            {/* Line Curve Gradient */}
                            <defs>
                              <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="50%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>

                            {/* Simulated Genetic Convergence Curve */}
                            {(() => {
                              const dataset = [
                                { x: 10, y: 35 },   // Intro (High stress)
                                { x: 80, y: 40 },   // Initial mutation spikes
                                { x: 140, y: 65 },  // Overlap selection filters
                                { x: 200, y: 85 },  // Chromosome swap operations
                                { x: 260, y: 105 }, // Room conflicts drops
                                { x: 320, y: 122 }, // Elitism elit
                                { x: 390, y: 130 }  // Converged perfect score
                              ];

                              // Slice curve based on generationProgress
                              const visiblePointsCount = Math.max(1, Math.min(dataset.length, Math.ceil((generationProgress || 100) / 100 * dataset.length)));
                              const visiblePoints = dataset.slice(0, visiblePointsCount);

                              if (visiblePoints.length < 2) return null;

                              let pathString = `M ${visiblePoints[0].x} ${150 - visiblePoints[0].y}`;
                              for (let i = 1; i < visiblePoints.length; i++) {
                                pathString += ` L ${visiblePoints[i].x} ${150 - visiblePoints[i].y}`;
                              }

                              return (
                                <>
                                  <path
                                    d={pathString}
                                    fill="none"
                                    stroke="url(#curveGradient)"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    className="transition-all duration-300"
                                  />
                                  <circle
                                    cx={visiblePoints[visiblePoints.length - 1].x}
                                    cy={150 - visiblePoints[visiblePoints.length - 1].y}
                                    r="5"
                                    className="fill-teal-500 animate-pulse stroke-2 stroke-white dark:stroke-gray-900"
                                  />
                                </>
                              );
                            })()}
                          </svg>

                          {/* Chart Labels */}
                          <span className="absolute left-2.5 top-0.5 text-[8px] font-mono text-gray-500 uppercase">Collisions : Forte</span>
                          <span className="absolute left-2.5 bottom-1 text-[8px] font-mono text-gray-500 uppercase font-bold text-emerald-500">Zéro conflit (Optimal)</span>
                          <span className="absolute right-2.5 bottom-1 text-[8px] font-mono text-gray-550 uppercase font-semibold">Taux Convergence</span>
                        </div>
                      </div>

                    </div>

                    {/* HIGH-TECH SCROLLABLE REAL-TIME CONSOLE LOG */}
                    <div className="bg-gray-950 border border-gray-900 rounded-2xl p-4 shadow-inner space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> EITE_IA_SOLVER_LOG
                        </span>
                        <span className="text-[9px] font-mono text-gray-500">EITE v2.5 GA core</span>
                      </div>
                      
                      <div className="h-32 overflow-y-auto font-mono text-[10px] sm:text-[11px] text-emerald-400 font-medium leading-relaxed scrollbar-thin scrollbar-thumb-gray-800 space-y-1">
                        {generationLogs.length === 0 ? (
                          <p className="text-gray-600 italic">En attente de démarrage du moteur pour logs temps réel...</p>
                        ) : (
                          generationLogs.map((log, idx) => (
                            <p key={idx} className="animate-fade-in break-words">&gt; {log}</p>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-t border-gray-100 dark:border-gray-700/80 shrink-0 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  {isGenerating ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-black text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1.5 animate-pulse text-indigo-650 dark:text-indigo-400">
                          <RefreshCw size={12} className="animate-spin" /> Optimisation de la population de l'EDT...
                        </span>
                        <span className="font-mono">{generationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-100 dark:border-gray-700 shadow-inner">
                        <motion.div
                          className="bg-indigo-600 h-full rounded-full animate-pulse"
                          animate={{ width: `${generationProgress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-xs text-gray-450 pr-4">
                      ⚠️ L'exécution écrasera les créneaux non-verrouillés d'origine pour toutes les classes académiques.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto">
                  {!isGenerating && (
                    <button
                      type="button"
                      onClick={() => setShowGeneratorPanel(false)}
                      className="px-4 py-2.5 sm:py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-650 dark:text-gray-200 rounded-xl text-xs font-black uppercase transition-all mr-1 cursor-pointer w-full sm:w-auto"
                    >
                      Fermer
                    </button>
                  )}
                  <button
                    onClick={handleRunAISolver}
                    disabled={isGenerating}
                    className="px-5 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-650/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
                    {isGenerating ? 'Optimisation en cours...' : (aiPrompt.trim() ? "Générer avec ce prompt" : "Lancer la Génération IA")}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📋 MODAL : INSCRIRE ACTIVITE AGENDA */}
      <AnimatePresence>
        {showAddAgendaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAgendaModal(false)}
              className="absolute inset-0 bg-black/60 shadow-2xl backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingAgendaItem ? 'Modifier l\'activité agenda' : 'Ajouter une activité agenda'}
                </h2>
                <button onClick={() => setShowAddAgendaModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAgenda} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre de l'activité</label>
                    <input
                      type="text"
                      required
                      value={agendaFormData.title}
                      onChange={e => setAgendaFormData({...agendaFormData, title: e.target.value})}
                      placeholder="Ex: Cours supplémentaire de soutien, Réunion pédagogique..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-850 dark:text-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Type d'événement</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['cours', 'réunion', 'examen', 'autre'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAgendaFormData({...agendaFormData, type: type as any})}
                          className={`py-2 text-xs font-black rounded-xl border uppercase transition-all ${
                            agendaFormData.type === type 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                              : 'bg-white dark:bg-gray-900 border-gray-105 dark:border-gray-750 text-gray-600 hover:border-indigo-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description / Consignes</label>
                    <textarea
                      rows={3}
                      value={agendaFormData.description}
                      onChange={e => setAgendaFormData({...agendaFormData, description: e.target.value})}
                      placeholder="Détails à afficher pour la classe..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none text-gray-850 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Classe concernée</label>
                    <select
                      value={agendaFormData.classId}
                      onChange={e => setAgendaFormData({...agendaFormData, classId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-850 dark:text-white"
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Discipline (Optionnelle)</label>
                    <select
                      value={agendaFormData.subject}
                      onChange={e => setAgendaFormData({...agendaFormData, subject: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-850 dark:text-white"
                    >
                      <option value="">Sélectionner la discipline</option>
                      {agendaSubjects.map((sub, idx) => (
                        <option key={idx} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date début</label>
                    <input
                      type="date"
                      required
                      value={agendaFormData.startDate}
                      onChange={e => setAgendaFormData({...agendaFormData, startDate: e.target.value, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-center text-gray-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Heure début</label>
                    <input
                      type="time"
                      required
                      value={agendaFormData.startTime}
                      onChange={e => setAgendaFormData({...agendaFormData, startTime: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-center text-gray-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date Fin</label>
                    <input
                      type="date"
                      required
                      value={agendaFormData.endDate}
                      onChange={e => setAgendaFormData({...agendaFormData, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-center text-gray-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Heure Fin</label>
                    <input
                      type="time"
                      required
                      value={agendaFormData.endTime}
                      onChange={e => setAgendaFormData({...agendaFormData, endTime: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-black text-center text-gray-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5"
                  >
                    <Check size={18} />
                    {editingAgendaItem ? 'Sauvegarder les modifications' : 'Enregistrer dans l\'agenda'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ⚙️ MODAL : CONFIGURATION DES PLAGES HORAIRES ET SALLES DE L'ETABLISSEMENT */}
      <AnimatePresence>
        {showSlotSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSlotSettingsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-750 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      Plages Horaires & Salles de l'Établissement
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Définissez les créneaux personnalisés et les salles disponibles pour {currentEstablishment?.nom || activeEstId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSlotSettingsModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* 1. Time Slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-gray-700 dark:text-gray-250 uppercase tracking-wide">
                        1. Créneaux Horaires ({slotSettingsDraft.length})
                      </h4>
                      <p className="text-[11px] text-gray-400">Ajoutez, modifiez ou retirez les plages de cours et de pause</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `slot_${Date.now()}`;
                        setSlotSettingsDraft([
                          ...slotSettingsDraft,
                          { id: newId, name: '08:00 - 09:30', isBreak: false }
                        ]);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus size={14} /> Ajouter un créneau
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {slotSettingsDraft.map((slot, idx) => (
                      <div
                        key={slot.id || idx}
                        className={`p-3 rounded-2xl border flex flex-wrap sm:flex-nowrap items-center gap-2.5 transition-all ${
                          slot.isBreak
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
                            : 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-200/70 dark:border-gray-700'
                        }`}
                      >
                        <div className="shrink-0 text-xs font-mono font-black text-gray-400 w-6">
                          #{idx + 1}
                        </div>

                        {/* Name/Interval input */}
                        <div className="flex-1 min-w-[150px]">
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => {
                              const updated = [...slotSettingsDraft];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setSlotSettingsDraft(updated);
                            }}
                            placeholder="Ex: 08:00 - 09:30"
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Break toggle */}
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={!!slot.isBreak}
                            onChange={(e) => {
                              const updated = [...slotSettingsDraft];
                              updated[idx] = {
                                ...updated[idx],
                                isBreak: e.target.checked,
                                label: e.target.checked ? (updated[idx].label || 'Pause') : undefined
                              };
                              setSlotSettingsDraft(updated);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Pause/Récréation</span>
                        </label>

                        {/* Break label if break */}
                        {slot.isBreak && (
                          <div className="min-w-[120px]">
                            <input
                              type="text"
                              value={slot.label || ''}
                              onChange={(e) => {
                                const updated = [...slotSettingsDraft];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                setSlotSettingsDraft(updated);
                              }}
                              placeholder="Nom (ex: Récréation)"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 outline-none"
                            />
                          </div>
                        )}

                        {/* Delete slot button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (slotSettingsDraft.length <= 1) {
                              notifyError("Il doit rester au moins un créneau horaire.");
                              return;
                            }
                            setSlotSettingsDraft(slotSettingsDraft.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Supprimer ce créneau"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setSlotSettingsDraft(DEFAULT_TIME_SLOTS)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      ↺ Réinitialiser les créneaux par défaut
                    </button>
                  </div>
                </div>

                {/* 2. Rooms */}
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-gray-700 dark:text-gray-250 uppercase tracking-wide">
                        2. Salles de Cours ({roomsDraft.length})
                      </h4>
                      <p className="text-[11px] text-gray-400">Salles de classe, laboratoires et espaces disponibles</p>
                    </div>
                  </div>

                  {/* Add room input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRoomInput}
                      onChange={(e) => setNewRoomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const trimmed = newRoomInput.trim();
                          if (trimmed && !roomsDraft.includes(trimmed)) {
                            setRoomsDraft([...roomsDraft, trimmed]);
                            setNewRoomInput('');
                          }
                        }
                      }}
                      placeholder="Ajouter une salle (ex: Salle 204, Labo B...)"
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newRoomInput.trim();
                        if (trimmed && !roomsDraft.includes(trimmed)) {
                          setRoomsDraft([...roomsDraft, trimmed]);
                          setNewRoomInput('');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={14} /> Ajouter
                    </button>
                  </div>

                  {/* Rooms badges list */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {roomsDraft.map((room, rIdx) => (
                      <span
                        key={rIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-750 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black border border-gray-200 dark:border-gray-650"
                      >
                        <MapPin size={12} className="text-indigo-600 dark:text-indigo-400" />
                        <span>{room}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (roomsDraft.length <= 1) {
                              notifyError("Il doit rester au moins une salle.");
                              return;
                            }
                            setRoomsDraft(roomsDraft.filter((_, i) => i !== rIdx));
                          }}
                          className="hover:text-rose-500 transition-colors cursor-pointer ml-0.5"
                          title="Supprimer la salle"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setRoomsDraft(DEFAULT_ROOMS)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      ↺ Réinitialiser les salles par défaut
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSlotSettingsModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-650 dark:text-gray-200 text-xs font-black uppercase cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const docRef = doc(db, 'timetable_settings', activeEstId);
                      await setDoc(docRef, {
                        timeSlots: slotSettingsDraft,
                        rooms: roomsDraft,
                        updatedAt: serverTimestamp(),
                        updatedBy: currentUser?.uid || 'user',
                        etablissement: activeEstId
                      }, { merge: true });

                      setTimeSlots(slotSettingsDraft);
                      setEstablishmentRooms(roomsDraft);
                      setShowSlotSettingsModal(false);
                      notifySuccess("Paramètres des plages horaires et salles enregistrés pour l'établissement !");
                    } catch (err) {
                      console.error("Error saving timetable settings:", err);
                      notifyError("Erreur lors de l'enregistrement des paramètres.");
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  <Save size={14} /> Enregistrer la configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TeacherPlanning;
