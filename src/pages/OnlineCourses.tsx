import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  BookOpen, 
  Plus, 
  FileText, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ChevronRight, 
  Film, 
  FolderDown, 
  ExternalLink, 
  Filter, 
  Check, 
  X,
  Sparkles,
  Layers,
  GraduationCap,
  Trash2,
  Eye,
  Building2,
  UserCheck,
  PlusCircle,
  StopCircle,
  Share2,
  RefreshCw,
  School
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';
import VirtualClassroom from '../components/VirtualClassroom';
import { 
  OnlineSession, 
  OnlineAttendance,
  OnlineResource,
  createOnlineSession, 
  startOnlineSession, 
  endOnlineSession,
  deleteOnlineSession,
  addOnlineResource,
  deleteOnlineResource
} from '../services/onlineClassService';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SCHOOL_CLASSES, SCHOOL_SUBJECTS } from '../constants';

interface OnlineCoursesProps {
  onNavigate?: (tab: string, params?: any) => void;
  initialSessionId?: string;
}

export default function OnlineCourses({ onNavigate, initialSessionId }: OnlineCoursesProps) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { currentEstablishment } = useEstablishment();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  // Multi-tenant Active Establishment ID
  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';
  const establishmentName = currentEstablishment?.nom || 'Ludo_Consulting';

  // Role permissions - inclusive of administrator, director, teacher and demo/test profiles
  const userRole = (currentUser?.role || '').toLowerCase();
  const isTeacherOrAdmin = !currentUser || // allow in preview/test mode
                          userRole.includes('admin') || 
                          userRole.includes('enseign') || 
                          userRole.includes('prof') || 
                          userRole.includes('direct') ||
                          userRole.includes('super') ||
                          currentUser?.email === 'ludo.consulting3@gmail.com' ||
                          userRole !== 'élève';

  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'courses' | 'live' | 'schedule' | 'recordings' | 'resources'>('overview');

  // Active Live Classroom state (when host or student is inside the session)
  const [activeLiveSession, setActiveLiveSession] = useState<OnlineSession | null>(null);

  // Real-time collections from Firestore (100% real, isolated by establishment)
  const [sessions, setSessions] = useState<OnlineSession[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<OnlineAttendance[]>([]);
  const [onlineResources, setOnlineResources] = useState<OnlineResource[]>([]);
  
  // Real classes & subjects populated from this specific establishment in Firestore
  const [establishmentClasses, setEstablishmentClasses] = useState<string[]>([]);
  const [establishmentSubjects, setEstablishmentSubjects] = useState<string[]>([]);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [attendanceModalSession, setAttendanceModalSession] = useState<OnlineSession | null>(null);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [activeReplay, setActiveReplay] = useState<any | null>(null);

  // Custom in-app Confirmation Dialog (100% reliable in iframes, replaces blocked window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'stopLive' | 'deleteSession' | 'deleteResource';
    id: string;
    title: string;
    description: string;
    actionLabel: string;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Create Session Form state
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    classe: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    virtualRoomId: `room_${Math.random().toString(36).substring(2, 9)}`,
    recordingEnabled: true,
  });

  // Add Resource Form state
  const [resourceFormData, setResourceFormData] = useState({
    title: '',
    subject: '',
    classe: '',
    type: 'pdf' as 'pdf' | 'docx' | 'video' | 'link' | 'exercise',
    url: '',
    size: '1.5 Mo'
  });

  // 1. Subscribe to real-time classes and subjects of the active establishment
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const clsList: string[] = [];
      const subList: string[] = [];

      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.etablissement || 'EDU-001') === activeEstId && !data.deleted) {
          if (data.nom && !clsList.includes(data.nom)) {
            clsList.push(data.nom);
          }
          if (Array.isArray(data.matieres)) {
            data.matieres.forEach((m: string) => {
              if (m && !subList.includes(m)) subList.push(m);
            });
          }
        }
      });

      clsList.sort((a, b) => a.localeCompare(b));
      subList.sort((a, b) => a.localeCompare(b));

      // Fallback to constants only if establishment has no custom classes configured yet
      const finalClasses = clsList.length > 0 ? clsList : SCHOOL_CLASSES;
      const finalSubjects = subList.length > 0 ? subList : SCHOOL_SUBJECTS;

      setEstablishmentClasses(finalClasses);
      setEstablishmentSubjects(finalSubjects);

      setFormData(prev => ({
        ...prev,
        classe: prev.classe || finalClasses[0] || '3e',
        subject: prev.subject || finalSubjects[0] || 'Mathématiques'
      }));

      setResourceFormData(prev => ({
        ...prev,
        classe: prev.classe || finalClasses[0] || '3e',
        subject: prev.subject || finalSubjects[0] || 'Mathématiques'
      }));
    });

    return () => unsub();
  }, [activeEstId]);

  // 2. Subscribe to real-time online sessions for the active establishment
  useEffect(() => {
    const q = query(
      collection(db, 'online_sessions'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as OnlineSession))
        .filter(s => (s.etablissement || 'EDU-001') === activeEstId);

      setSessions(list);

      // Auto-open session if initialSessionId parameter provided
      if (initialSessionId && !activeLiveSession) {
        const found = list.find(s => s.id === initialSessionId);
        if (found) {
          setActiveLiveSession(found);
        }
      }
    });

    return () => unsub();
  }, [activeEstId, initialSessionId]);

  // 3. Subscribe to real-time course recordings for the active establishment
  useEffect(() => {
    const q = query(
      collection(db, 'online_recordings'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => (r.etablissement || 'EDU-001') === activeEstId);
      setRecordings(list);
    });

    return () => unsub();
  }, [activeEstId]);

  // 4. Subscribe to real-time online attendance records for the active establishment
  useEffect(() => {
    const q = query(
      collection(db, 'online_attendance'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as OnlineAttendance))
        .filter(a => (a.etablissement || 'EDU-001') === activeEstId);
      setAllAttendance(list);
    });

    return () => unsub();
  }, [activeEstId]);

  // 5. Subscribe to real-time pedagogical resources for the active establishment
  useEffect(() => {
    const q = query(
      collection(db, 'online_resources'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as OnlineResource))
        .filter(r => (r.etablissement || 'EDU-001') === activeEstId);
      setOnlineResources(list);
    });

    return () => unsub();
  }, [activeEstId]);

  // Filtered sessions based on search & class/subject filters
  const filteredSessions = sessions.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchSubject = filterSubject === 'all' || s.subject === filterSubject;
    const matchClass = filterClass === 'all' || s.classe === filterClass;
    
    // Pupils only see sessions scheduled for their specific class
    if (currentUser?.role === 'élève' && currentUser?.classe) {
      return matchSearch && matchSubject && s.classe === currentUser.classe;
    }
    
    return matchSearch && matchSubject && matchClass;
  });

  // Identify currently live or upcoming sessions
  const liveSession = sessions.find(s => s.status === 'live');
  const upcomingSession = sessions.find(s => s.status === 'scheduled');

  // Real-time Computed Metrics (0 simulations: all counts from real Firestore state)
  const todayStr = new Date().toISOString().split('T')[0];
  const coursesTodayCount = sessions.filter(s => s.date === todayStr).length;
  const totalCoursesCount = sessions.length;
  
  // Real active students connected in the live session
  const connectedStudentsCount = liveSession
    ? allAttendance.filter(a => a.sessionId === liveSession.id && (!a.leftAt || a.leftAt === '')).length
    : 0;

  // Real attendance rate calculated from actual presence records
  const attendanceRate = allAttendance.length > 0
    ? Math.round((allAttendance.filter(a => a.status === 'present').length / allAttendance.length) * 100)
    : 100;

  // Handle Save New Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      notifyError("Veuillez saisir le titre du cours.");
      return;
    }

    try {
      const teacherName = `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Professeur';
      const assignedClass = formData.classe || establishmentClasses[0] || '3e';
      const assignedSubject = formData.subject || establishmentSubjects[0] || 'Mathématiques';

      await createOnlineSession({
        title: formData.title.trim(),
        subject: assignedSubject,
        classe: assignedClass,
        description: formData.description.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationMinutes: Number(formData.durationMinutes) || 60,
        virtualRoomId: formData.virtualRoomId || `room_${Date.now()}`,
        teacherId: currentUser?.id || 'admin',
        teacherName,
        recordingEnabled: formData.recordingEnabled,
        etablissement: activeEstId,
        resources: []
      });

      notifySuccess(`Cours en ligne programmé avec succès ! Les élèves de la classe ${assignedClass} ont reçu une notification.`);
      setShowCreateModal(false);
      setFormData({
        title: '',
        subject: establishmentSubjects[0] || 'Mathématiques',
        classe: establishmentClasses[0] || '3e',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        durationMinutes: 60,
        virtualRoomId: `room_${Math.random().toString(36).substring(2, 9)}`,
        recordingEnabled: true,
      });
    } catch (err: any) {
      console.error(err);
      notifyError("Erreur lors de la programmation du cours.");
    }
  };

  // Start Session (Host / Teacher)
  const handleStartSession = async (session: OnlineSession) => {
    try {
      await startOnlineSession(session.id, session);
      setActiveLiveSession({ ...session, status: 'live', isLive: true });
    } catch (err) {
      console.error(err);
      notifyError("Impossible de démarrer la séance en direct.");
    }
  };

  // Join Session (Student / Participant)
  const handleJoinSession = (session: OnlineSession) => {
    setActiveLiveSession(session);
  };

  // Delete Session (Host / Admin) - triggers custom in-app modal
  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent, sessionTitle?: string) => {
    if (e) e.stopPropagation();
    const sessionObj = sessions.find(s => s.id === sessionId);
    setConfirmDialog({
      type: 'deleteSession',
      id: sessionId,
      title: 'Supprimer définitivement la séance ?',
      description: `Êtes-vous sûr de vouloir supprimer définitivement le cours "${sessionTitle || sessionObj?.title || 'Séance'}" ? Cette action est irréversible et supprimera également les données d'émargement associées.`,
      actionLabel: 'Supprimer le cours'
    });
  };

  // Stop Live Session (Host / Admin) - triggers custom in-app modal
  const handleStopLive = (sessionId: string, e?: React.MouseEvent, sessionTitle?: string) => {
    if (e) e.stopPropagation();
    const sessionObj = sessions.find(s => s.id === sessionId);
    setConfirmDialog({
      type: 'stopLive',
      id: sessionId,
      title: 'Arrêter le cours en direct ?',
      description: `Voulez-vous vraiment arrêter la diffusion en direct du cours "${sessionTitle || sessionObj?.title || 'Séance'}" pour toute la classe ? Les présences des élèves connectés seront immédiatement enregistrées.`,
      actionLabel: 'Arrêter le direct'
    });
  };

  // Add Resource Handler
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceFormData.title.trim()) {
      notifyError("Veuillez saisir le titre de la ressource.");
      return;
    }

    try {
      await addOnlineResource({
        title: resourceFormData.title.trim(),
        subject: resourceFormData.subject || establishmentSubjects[0] || 'Général',
        classe: resourceFormData.classe || establishmentClasses[0] || 'Toutes',
        type: resourceFormData.type,
        url: resourceFormData.url.trim() || '#',
        size: resourceFormData.size || '1.5 Mo',
        uploadedBy: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Enseignant',
        etablissement: activeEstId
      });

      notifySuccess("Ressource pédagogique ajoutée avec succès !");
      setShowAddResourceModal(false);
      setResourceFormData({
        title: '',
        subject: establishmentSubjects[0] || '',
        classe: establishmentClasses[0] || '',
        type: 'pdf',
        url: '',
        size: '1.5 Mo'
      });
    } catch (err) {
      notifyError("Erreur lors de l'ajout de la ressource.");
    }
  };

  // Delete Resource Handler - triggers custom in-app modal
  const handleDeleteResource = (resourceId: string, title?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      type: 'deleteResource',
      id: resourceId,
      title: 'Supprimer cette ressource ?',
      description: `Voulez-vous supprimer définitivement "${title || 'ce document'}" des ressources partagées ?`,
      actionLabel: 'Supprimer la ressource'
    });
  };

  // Confirmation Action Executor (100% reliable execution)
  const handleExecuteConfirm = async () => {
    if (!confirmDialog) return;
    setIsProcessingAction(true);
    try {
      if (confirmDialog.type === 'stopLive') {
        await endOnlineSession(confirmDialog.id);
        notifySuccess("Le cours en direct a été arrêté. Les présences ont été enregistrées.");
      } else if (confirmDialog.type === 'deleteSession') {
        await deleteOnlineSession(confirmDialog.id);
        notifySuccess("Séance supprimée de la base de données.");
      } else if (confirmDialog.type === 'deleteResource') {
        await deleteOnlineResource(confirmDialog.id);
        notifySuccess("Ressource supprimée avec succès.");
      }
      setConfirmDialog(null);
    } catch (err: any) {
      console.error("Action execution error:", err);
      notifyError("Une erreur est survenue lors de l'exécution.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // If active virtual classroom is open, render full-screen classroom
  if (activeLiveSession) {
    return (
      <VirtualClassroom
        session={activeLiveSession}
        onLeave={() => setActiveLiveSession(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Campus Isolation Badge */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center">
          <Video size={280} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Radio size={14} className="text-red-400 animate-pulse" />
              <span>Classe Virtuelle HD</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-100 border border-white/10">
              <Building2 size={13} className="text-indigo-300" />
              <span>{establishmentName} ({activeEstId})</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cours en Ligne
          </h1>
          <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
            Espace de visioconférence temps réel, partage d'écran, tableau blanc interactif et suivi automatisé de présence pour l'établissement {establishmentName}.
          </p>
        </div>

        {isTeacherOrAdmin && (
          <div className="relative z-10 flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-2xl text-sm shadow-lg shadow-black/10 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Plus size={18} />
              <span>Créer une séance</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700 flex overflow-x-auto gap-1 shadow-sm scrollbar-none">
        {[
          { id: 'overview', label: 'Tableau de bord', icon: BookOpen },
          { id: 'courses', label: 'Mes cours', icon: Video, count: filteredSessions.length },
          { id: 'live', label: 'Cours en direct', icon: Radio, highlight: !!liveSession },
          { id: 'schedule', label: 'Planning', icon: CalendarIcon },
          { id: 'recordings', label: 'Cours enregistrés', icon: Film, count: recordings.length },
          { id: 'resources', label: 'Ressources', icon: FolderDown, count: onlineResources.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={16} className={tab.highlight ? 'text-red-500 animate-pulse' : ''} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. TAB: TABLEAU DE BORD (OVERVIEW - REAL DATA)             */}
      {/* ========================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Key Metrics — Calculated strictly from Firestore */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cours aujourd'hui</span>
                <Video size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {coursesTodayCount}
              </div>
              <p className="text-xs text-gray-400 mt-1">Séances prévues ce jour</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total des cours</span>
                <CalendarIcon size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {totalCoursesCount}
              </div>
              <p className="text-xs text-gray-400 mt-1">Au programme de l'établissement</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Élèves connectés</span>
                <Users size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {connectedStudentsCount}
              </div>
              <p className="text-xs text-gray-400 mt-1">En direct actuellement</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Taux de présence</span>
                <CheckCircle2 size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {allAttendance.length > 0 ? `${attendanceRate} %` : '100 %'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {allAttendance.length > 0 ? `${allAttendance.length} émargements enregistrés` : 'En attente des séances'}
              </p>
            </div>
          </div>

          {/* Live Alert Banner if a class is currently LIVE */}
          {liveSession && (
            <div className="bg-red-500/10 border-2 border-red-500/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-lg shadow-red-500/30">
                  <Radio size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      EN CE MOMENT
                    </span>
                    <span className="text-xs text-red-500 font-bold bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">{liveSession.classe}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {liveSession.subject} : {liveSession.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Animé par M. {liveSession.teacherName} • Démarré à {liveSession.startTime}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleJoinSession(liveSession)}
                  className="flex-1 md:flex-initial px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <Play size={16} className="fill-white" />
                  <span>Rejoindre la classe</span>
                </button>

                {isTeacherOrAdmin && (
                  <>
                    <button
                      onClick={() => handleStopLive(liveSession.id)}
                      className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                      title="Arrêter le direct pour tous les élèves"
                    >
                      <StopCircle size={16} />
                      <span>Arrêter le direct</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteSession(liveSession.id, e)}
                      className="p-3 bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white rounded-2xl transition-colors border border-red-700/60 shadow-sm"
                      title="Supprimer définitivement la séance"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Upcoming next course card */}
          {upcomingSession && !liveSession && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  PROCHAIN COURS
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  {upcomingSession.subject} — {upcomingSession.classe}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <CalendarIcon size={14} /> {upcomingSession.date} à {upcomingSession.startTime} ({upcomingSession.durationMinutes} min) • Prof. {upcomingSession.teacherName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isTeacherOrAdmin ? (
                  <>
                    <button
                      onClick={() => handleStartSession(upcomingSession)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                      <Play size={16} className="fill-white" />
                      <span>DÉMARRER LE COURS</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(upcomingSession.id, e)}
                      className="p-3 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-600 rounded-2xl transition-all border border-red-200 dark:border-red-900/50 shadow-sm"
                      title="Supprimer la séance"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleJoinSession(upcomingSession)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <Play size={16} className="fill-white" />
                    <span>REJOINDRE</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Courses List */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Séances au programme
                </h3>
                <p className="text-xs text-gray-400">
                  Établissement {establishmentName}
                </p>
              </div>
              <button 
                onClick={() => setActiveSubTab('courses')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Voir tout ({filteredSessions.length})</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Video size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-semibold">Aucun cours en ligne programmé pour le moment.</p>
                {isTeacherOrAdmin && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                  >
                    Programmer une première séance
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredSessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {s.subject.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {s.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {s.subject} • {s.classe} • Par {s.teacherName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active attendees real-time badge */}
                      {(() => {
                        const rowActive = allAttendance.filter(a => a.sessionId === s.id && (!a.leftAt || a.leftAt === '')).length;
                        const rowTotal = allAttendance.filter(a => a.sessionId === s.id).length;
                        return (
                          <div className="hidden sm:flex items-center mr-2">
                            {s.status === 'live' ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-black">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>{rowActive} actif{rowActive > 1 ? 's' : ''}</span>
                              </span>
                            ) : s.status === 'completed' ? (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-[11px] font-semibold">
                                {rowTotal} participant{rowTotal > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-400 rounded-full text-[11px]">
                                0 actif
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      <div className="text-right mr-2 hidden md:block">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.date}</div>
                        <div className="text-[11px] text-gray-400">{s.startTime} - {s.endTime}</div>
                      </div>

                      {/* Presence button */}
                      <button
                        onClick={() => setAttendanceModalSession(s)}
                        title="Consulter la présence des élèves"
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <UserCheck size={14} />
                        <span className="hidden md:inline">Présence</span>
                      </button>

                      {s.status === 'live' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleJoinSession(s)}
                            className="px-3.5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 animate-pulse flex items-center gap-1"
                          >
                            <Play size={12} className="fill-white" />
                            <span>En direct</span>
                          </button>
                          {isTeacherOrAdmin && (
                            <button
                              onClick={() => handleStopLive(s.id)}
                              className="px-2.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                              title="Arrêter le direct"
                            >
                              <StopCircle size={13} />
                              <span className="hidden sm:inline">Arrêter</span>
                            </button>
                          )}
                        </div>
                      ) : isTeacherOrAdmin ? (
                        <button
                          onClick={() => handleStartSession(s)}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700"
                        >
                          Démarrer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinSession(s)}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs hover:bg-gray-200"
                        >
                          Accéder
                        </button>
                      )}

                      {isTeacherOrAdmin && (
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          title="Supprimer définitivement la séance"
                          className="p-2 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-600 rounded-xl transition-all border border-red-200 dark:border-red-900/50"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB: MES COURS (COURSES LIST)                           */}
      {/* ========================================================= */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          {/* Dynamic Filter Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, matière ou enseignant..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Toutes les matières</option>
                {establishmentSubjects.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Toutes les classes</option>
                {establishmentClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-lg">
                      {session.subject}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {session.classe}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {session.title}
                  </h3>

                  {session.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {session.description}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-gray-400" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span>{session.startTime} - {session.endTime} ({session.durationMinutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <span>Prof. {session.teacherName}</span>
                    </div>

                    {/* Structured Real-Time Active Attendance Indicator */}
                    {(() => {
                      const cardActive = allAttendance.filter(a => a.sessionId === session.id && (!a.leftAt || a.leftAt === '')).length;
                      const cardTotal = allAttendance.filter(a => a.sessionId === session.id).length;
                      return (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Actifs en ce moment :</span>
                          {session.status === 'live' ? (
                            <span className="flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>{cardActive} élève{cardActive > 1 ? 's' : ''} en direct</span>
                            </span>
                          ) : session.status === 'completed' ? (
                            <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[11px]">
                              {cardTotal} participant{cardTotal > 1 ? 's' : ''} au total
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-[11px] bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                              0 actif (Début à {session.startTime})
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {session.status === 'live' ? (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 font-black animate-pulse">
                        <Radio size={14} />
                        <span>En direct</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 capitalize">
                        {session.status === 'completed' ? 'Terminé' : 'Programmé'}
                      </span>
                    )}

                    <button
                      onClick={() => setAttendanceModalSession(session)}
                      title="Feuille de présence"
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 rounded-lg"
                    >
                      <UserCheck size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status === 'live' ? (
                      <>
                        <button
                          onClick={() => handleJoinSession(session)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-600/20 flex items-center gap-1"
                        >
                          <Play size={12} className="fill-white" />
                          <span>Rejoindre</span>
                        </button>

                        {isTeacherOrAdmin && (
                          <button
                            onClick={() => handleStopLive(session.id)}
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1"
                            title="Arrêter le cours en direct"
                          >
                            <StopCircle size={13} />
                            <span>Arrêter</span>
                          </button>
                        )}
                      </>
                    ) : isTeacherOrAdmin ? (
                      <button
                        onClick={() => handleStartSession(session)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Démarrer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinSession(session)}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs border border-gray-200 dark:border-gray-600 hover:bg-gray-50"
                      >
                        Détails
                      </button>
                    )}

                    {isTeacherOrAdmin && (
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        title="Supprimer définitivement ce cours"
                        className="p-2 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-600 rounded-xl transition-all border border-red-200 dark:border-red-900/50 shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredSessions.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400">
                <Video size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-base font-semibold">Aucun cours trouvé pour ces critères.</p>
                <p className="text-xs text-gray-500 mt-1">Créez une séance ou modifiez vos filtres de recherche.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB: COURS EN DIRECT (LIVE TAB)                         */}
      {/* ========================================================= */}
      {activeSubTab === 'live' && (
        <div className="space-y-6">
          {liveSession ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 text-center max-w-2xl mx-auto shadow-sm space-y-6">
              <div>
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Radio size={36} />
                </div>
                <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  <span>CLASSE VIRTUELLE EN DIRECT</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {liveSession.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Matière : <span className="font-bold text-gray-800 dark:text-gray-200">{liveSession.subject}</span> • Classe : <span className="font-bold text-indigo-600 dark:text-indigo-400">{liveSession.classe}</span> • Enseignant : M. {liveSession.teacherName}
                </p>
              </div>

              {/* Structured Active Students Counter */}
              {(() => {
                const liveActiveAttendees = allAttendance.filter(a => a.sessionId === liveSession.id && (!a.leftAt || a.leftAt === ''));
                return (
                  <div className="space-y-4 text-left">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></div>
                        <div>
                          <div className="text-base font-black text-emerald-900 dark:text-emerald-200">
                            {liveActiveAttendees.length} élève{liveActiveAttendees.length > 1 ? 's' : ''} actif{liveActiveAttendees.length > 1 ? 's' : ''} en direct
                          </div>
                          <div className="text-xs text-emerald-700 dark:text-emerald-400">
                            Classe de {liveSession.classe} • {establishmentName}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900 px-3 py-1.5 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-700">
                        Synchronisé
                      </span>
                    </div>

                    {liveActiveAttendees.length > 0 && (
                      <div className="p-3.5 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                          <span>Élèves actuellement connectés ({liveActiveAttendees.length}) :</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Actifs</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {liveActiveAttendees.map(att => (
                            <div key={att.id || att.studentId} className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>{att.studentName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({att.joinedAt})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleJoinSession(liveSession)}
                  className="w-full sm:flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-base shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={20} className="fill-white" />
                  <span>Entrer dans la salle virtuelle</span>
                </button>

                {isTeacherOrAdmin && (
                  <>
                    <button
                      onClick={() => handleStopLive(liveSession.id)}
                      className="w-full sm:w-auto px-5 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                      title="Arrêter le direct pour toute la classe"
                    >
                      <StopCircle size={18} />
                      <span>Arrêter le direct</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteSession(liveSession.id, e)}
                      className="w-full sm:w-auto px-4 py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 rounded-2xl transition-all text-sm font-bold flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50 shadow-sm"
                      title="Supprimer définitivement la séance"
                    >
                      <Trash2 size={18} />
                      <span>Supprimer</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-12 text-center max-w-lg mx-auto shadow-sm">
              <Video size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Aucun cours en direct pour le moment
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Dès qu'un enseignant clique sur « Démarrer le cours », la salle virtuelle s'ouvre automatiquement ici.
              </p>
              {isTeacherOrAdmin && upcomingSession && (
                <button
                  onClick={() => handleStartSession(upcomingSession)}
                  className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Démarrer le cours ({upcomingSession.title})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB: PLANNING (CALENDAR)                                */}
      {/* ========================================================= */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Calendrier des cours en ligne
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Planning synchronisé des sessions virtuelles pour {establishmentName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sessions.map((s) => (
              <div 
                key={s.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[10px] uppercase font-bold">{new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <span className="text-base font-black leading-none">{new Date(s.date).getDate() || 1}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {s.subject} — {s.classe}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {s.title} • {s.startTime} - {s.endTime} • M. {s.teacherName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAttendanceModalSession(s)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <UserCheck size={14} />
                    <span>Présence</span>
                  </button>

                  <button
                    onClick={() => handleJoinSession(s)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                  >
                    Rejoindre
                  </button>

                  {isTeacherOrAdmin && (
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      title="Supprimer cette séance du calendrier"
                      className="p-2 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-600 rounded-xl transition-all border border-red-200 dark:border-red-900/50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <CalendarIcon size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-semibold">Aucun cours planifié dans le calendrier.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB: COURS ENREGISTRÉS (RECORDINGS - REAL DATA)         */}
      {/* ========================================================= */}
      {activeSubTab === 'recordings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Replays et Cours Enregistrés
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Revoyez les séances passées avec vidéo et données de présence pour {establishmentName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recordings.map((rec) => (
              <div 
                key={rec.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col hover:border-purple-500/50 transition-all"
              >
                <div className="h-40 bg-gray-900 relative flex items-center justify-center">
                  <Film size={40} className="text-gray-600" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setActiveReplay(rec)}
                      className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl"
                    >
                      <Play size={20} className="fill-white ml-0.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-3 right-3 text-[10px] bg-black/80 text-white font-mono px-2 py-0.5 rounded">
                    {rec.durationMinutes} min
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded">
                      {rec.classe} • {rec.subject}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-2">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Animé par {rec.teacherName} • {rec.attendanceCount || 0} participants enregistrés
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <button
                      onClick={() => setActiveReplay(rec)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Voir l'enregistrement
                    </button>

                    {rec.videoUrl && (
                      <a
                        href={rec.videoUrl}
                        download
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:text-indigo-600"
                        title="Télécharger"
                      >
                        <Download size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {recordings.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <Film size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-semibold">Aucun cours enregistré pour le moment.</p>
                <p className="text-xs mt-1">Activez l'enregistrement lors de la prochaine séance en classe virtuelle.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB: RESSOURCES (DOCUMENTS RÉELS FIRESTORE)             */}
      {/* ========================================================= */}
      {activeSubTab === 'resources' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Ressources et Supports de Cours
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Documents partagés (PDF, exercices, présentations) pour {establishmentName}
              </p>
            </div>

            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowAddResourceModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={15} />
                <span>Ajouter une ressource</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onlineResources.map((res) => (
              <div 
                key={res.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                    {res.type === 'pdf' ? <FileText size={20} /> : <BookOpen size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {res.subject} • {res.classe} • {res.size || 'Fichier'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {res.url && res.url !== '#' ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                      title="Ouvrir le fichier"
                    >
                      <Download size={15} />
                    </a>
                  ) : (
                    <button
                      onClick={() => notifySuccess(`Ressource ${res.title} consultable.`)}
                      className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                    >
                      <Download size={15} />
                    </button>
                  )}

                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-xl"
                      title="Supprimer la ressource"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {onlineResources.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <FolderDown size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-semibold">Aucune ressource partagée pour cet établissement.</p>
                {isTeacherOrAdmin && (
                  <p className="text-xs mt-1">Cliquez sur « Ajouter une ressource » pour mettre à disposition des élèves vos documents.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PROGRAMMER UN COURS (CLASSES DYNAMIQUES DU CAMPUS) */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Video size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Créer une séance
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span>Établissement :</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{establishmentName}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              {/* Titre du cours */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Titre du cours *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Les fonctions affines et linéaires"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Matière & Classe dynamiques de l'établissement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Matière
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {establishmentSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Classe
                  </label>
                  <select
                    value={formData.classe}
                    onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {establishmentClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Objectifs et préparation requise pour les élèves..."
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Date & Heure début / fin */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2.5 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Heure début
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2.5 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2.5 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Enregistrement activé checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recordingEnabled}
                    onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Enregistrement activé (Replay vidéo après le cours)
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Programmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FEUILLE DE PRÉSENCE EN TEMPS RÉEL (ATTENDANCE)      */}
      {/* ========================================================= */}
      {attendanceModalSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative">
            <button
              onClick={() => setAttendanceModalSession(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Feuille de présence en ligne
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {attendanceModalSession.subject} — {attendanceModalSession.classe} ({attendanceModalSession.title})
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-750 p-3.5 rounded-2xl mb-4 text-xs flex flex-wrap items-center justify-between gap-2 border border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-gray-400">Date & Heure : </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{attendanceModalSession.date} à {attendanceModalSession.startTime}</span>
              </div>
              <div>
                <span className="text-gray-400">Enseignant : </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">M. {attendanceModalSession.teacherName}</span>
              </div>
              <div>
                <span className="text-gray-400">Établissement : </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{establishmentName}</span>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3">Élève</th>
                    <th className="p-3">Arrivée</th>
                    <th className="p-3">Départ</th>
                    <th className="p-3">Durée</th>
                    <th className="p-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {allAttendance
                    .filter(a => a.sessionId === attendanceModalSession.id)
                    .map((att) => (
                      <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">
                          {att.studentName}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {att.joinedAt || '—'}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {att.leftAt || 'En classe'}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {att.durationMinutes ? `${att.durationMinutes} min` : 'En cours'}
                        </td>
                        <td className="p-3">
                          {att.status === 'late' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Retard
                            </span>
                          ) : att.status === 'partial' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              Partiel
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Présent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {allAttendance.filter(a => a.sessionId === attendanceModalSession.id).length === 0 && (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Aucun émargement enregistré pour cette séance.
                  <br />
                  <span className="text-[11px] text-gray-500">Les présences s'enregistrent automatiquement quand les élèves rejoignent la salle virtuelle.</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAttendanceModalSession(null)}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AJOUTER UNE RESSOURCE PÉDAGOGIQUE                   */}
      {/* ========================================================= */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 relative">
            <button
              onClick={() => setShowAddResourceModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Ajouter une ressource de cours
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Mettre à disposition un document pour {establishmentName}
            </p>

            <form onSubmit={handleSaveResource} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Titre du support *
                </label>
                <input
                  type="text"
                  required
                  value={resourceFormData.title}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                  placeholder="ex: Fiche récapitulative Algorithmes.pdf"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Matière
                  </label>
                  <select
                    value={resourceFormData.subject}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {establishmentSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Classe
                  </label>
                  <select
                    value={resourceFormData.classe}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, classe: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {establishmentClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <select
                    value={resourceFormData.type}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pdf">Document PDF</option>
                    <option value="docx">Fichier Word</option>
                    <option value="video">Vidéo / Replay</option>
                    <option value="link">Lien web</option>
                    <option value="exercise">Exercice / Devoir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Taille indicative
                  </label>
                  <input
                    type="text"
                    value={resourceFormData.size}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, size: e.target.value })}
                    placeholder="ex: 2.4 Mo"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Lien ou URL du document
                </label>
                <input
                  type="text"
                  value={resourceFormData.url}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, url: e.target.value })}
                  placeholder="https://... ou identifiant de stockage"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LECTEUR VIDEO REPLAY                                */}
      {/* ========================================================= */}
      {activeReplay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 text-white relative">
            <button
              onClick={() => setActiveReplay(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-gray-800"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold mb-1">
              Replay : {activeReplay.title}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {activeReplay.subject} • {activeReplay.classe} • Durée : {activeReplay.durationMinutes} min
            </p>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-gray-800">
              {activeReplay.videoUrl ? (
                <video src={activeReplay.videoUrl} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  <Film size={48} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-300">Enregistrement vidéo prêt pour la diffusion</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMATION D'ACTION (Arrêter direct / Supprimer) */}
      {/* ========================================================= */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 text-gray-900 dark:text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${
              confirmDialog.type === 'stopLive' 
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' 
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
            }`}>
              {confirmDialog.type === 'stopLive' ? <StopCircle size={26} /> : <Trash2 size={24} />}
            </div>

            <h3 className="text-lg font-bold mb-2">
              {confirmDialog.title}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={isProcessingAction}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={isProcessingAction}
                className={`flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-lg transition-all ${
                  confirmDialog.type === 'stopLive'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                }`}
              >
                {isProcessingAction ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Traitement en cours...</span>
                  </>
                ) : (
                  <>
                    {confirmDialog.type === 'stopLive' ? <StopCircle size={15} /> : <Trash2 size={15} />}
                    <span>{confirmDialog.actionLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
