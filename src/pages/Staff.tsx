import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Scale,
  Briefcase,
  MapPin,
  Calendar,
  Filter,
  GraduationCap,
  Laptop,
  Sparkles,
  BookOpen,
  Wallet,
  FileBadge,
  ShieldAlert,
  FileText,
  Building2,
  Clock,
  Award,
  BookMarked,
  Check,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import RoleResponsibilities from '../components/RoleResponsibilities';

// The 11 specific administrative roles/responsibilities defined by the user
export const administrativeResponsibilities = [
  { id: 'responsable_maternelle', label: 'Responsable de la Maternelle', color: 'pink', badgeBg: 'bg-pink-50 border-pink-100 dark:bg-pink-950/20 text-pink-700 dark:text-pink-350 dark:border-pink-900/30' },
  { id: 'responsable_primaire', label: 'Responsable du Primaire', color: 'sky', badgeBg: 'bg-sky-50 border-sky-100 dark:bg-sky-950/20 text-sky-700 dark:text-sky-350 dark:border-sky-900/30' },
  { id: 'responsable_college', label: 'Responsable Collège (6ème à 3ème)', color: 'indigo', badgeBg: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-350 dark:border-indigo-900/30' },
  { id: 'responsable_lycee', label: 'Responsable Lycée / Proviseur (6ème en Terminale / 2nde en Terminale)', color: 'violet', badgeBg: 'bg-violet-50 border-violet-100 dark:bg-violet-950/20 text-violet-700 dark:text-violet-350 dark:border-violet-900/30' },
  { id: 'gestionnaire_comptable', label: 'Gestionnaire Comptable', color: 'emerald', badgeBg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350 dark:border-emerald-900/30' },
  { id: 'responsable_pedagogique', label: 'Responsable Pédagogique', color: 'amber', badgeBg: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-350 dark:border-amber-900/30' },
  { id: 'surveillant_general', label: 'Surveillant Général', color: 'red', badgeBg: 'bg-red-50 border-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-350 dark:border-red-900/30' },
  { id: 'surveillant_adjoint', label: 'Surveillant Adjoint', color: 'orange', badgeBg: 'bg-orange-50 border-orange-100 dark:bg-orange-950/20 text-orange-750 dark:text-orange-350 dark:border-orange-900/30' },
  { id: 'dame_menage', label: 'Dame de Ménage', color: 'teal', badgeBg: 'bg-teal-50 border-teal-100 dark:bg-teal-950/20 text-teal-750 dark:text-teal-350 dark:border-teal-900/30' },
  { id: 'secretaire_generale', label: 'Secrétaire Générale', color: 'purple', badgeBg: 'bg-purple-50 border-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-350 dark:border-purple-900/30' },
  { id: 'secretaire_adjointe', label: 'Secrétaire Adjointe', color: 'fuchsia', badgeBg: 'bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-950/20 text-fuchsia-700 dark:text-fuchsia-350 dark:border-fuchsia-900/30' },
  { id: 'responsable_it', label: 'Responsable du Matériel Informatique', color: 'cyan', badgeBg: 'bg-cyan-50 border-cyan-100 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-350 dark:border-cyan-900/30' }
];

export type TeacherStatusType = 'permanent' | 'prestataire' | 'stagiaire';

export const TEACHER_STATUSES: { id: TeacherStatusType; label: string; description: string; badgeBg: string; border: string; text: string; dotColor: string }[] = [
  {
    id: 'permanent',
    label: 'Permanent',
    description: 'Enseignant titulaire / CDI rattaché à temps plein à l\'établissement',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40',
    border: 'border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'prestataire',
    label: 'Prestataire',
    description: 'Vacataire / Intervenant externe / Prestation horaire ou CDD',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'stagiaire',
    label: 'Stagiaire',
    description: 'Enseignant en formation pédagogique / Période d\'immersion et de stage',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500'
  }
];

interface StaffUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  lastSeen?: any;
  photo?: string;
  department?: string;
  position?: string;
  contact?: string;
  address?: string;
  gender?: string;
  age?: number;
  responsibilities?: string[];
  etablissement?: string;
  // Teacher-specific fields
  statut_enseignant?: TeacherStatusType;
  statutEnseignant?: TeacherStatusType;
  matiere?: string;
  matieres?: string[];
  classe?: string;
  classes?: string[];
  diploma?: string;
  experience_years?: number | string;
  matricule?: string;
  date_embauche?: string;
  contract_type?: string;
}

export default function Staff() {
  const { t, tData } = useLanguage();
  const { notifySuccess, notifyError, notifyDelete } = useNotification();
  const { currentUser } = useAuth();
  const { currentEstablishment, isSuperAdmin, establishments } = useEstablishment();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'directory' | 'teachers'>('teachers');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'all' | TeacherStatusType>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Modal states
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Teacher form state
  const [newTeacher, setNewTeacher] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    gender: 'male',
    statut_enseignant: 'permanent' as TeacherStatusType,
    matiere: '',
    matieres: [] as string[],
    classes: [] as string[],
    diploma: 'Master / CAPES',
    experience_years: '3',
    contract_type: 'CDI',
    matricule: '',
    address: '',
    date_embauche: new Date().toISOString().split('T')[0]
  });

  // New Administrative Staff form state
  const [newStaff, setNewStaff] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    gender: 'male',
    position: 'Secrétaire Générale',
    department: 'Administration Générale',
    responsibilities: [] as string[],
    matricule: '',
    address: ''
  });

  const activeEstId = isSuperAdmin 
    ? (currentEstablishment?.id || currentUser?.etablissement || 'EDU-001')
    : (currentUser?.etablissement || currentEstablishment?.id || 'EDU-001');

  // Permission check for establishment manager / admin
  const isManager = isSuperAdmin || currentUser?.role === 'admin' || (currentUser?.role === 'personnel administratif' && (currentUser?.position?.toLowerCase().includes('direct') || currentUser?.position?.toLowerCase().includes('provis')));

  // Auto generate teacher matricule
  useEffect(() => {
    if (showAddTeacherModal && !newTeacher.matricule) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      setNewTeacher(prev => ({ ...prev, matricule: `ENS-${year}-${rand}` }));
    }
  }, [showAddTeacherModal]);

  // Load staff & teachers for this establishment
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['personnel administratif', 'cuisinier', 'enseignant', 'secretaire', 'comptable'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StaffUser[];
      
      // Filter strictly by active establishment
      const filteredStaffData = staffData.filter(u => {
        const userEst = u.etablissement;
        if (!userEst) {
          return activeEstId === 'EDU-001';
        }
        return userEst === activeEstId;
      });

      filteredStaffData.sort((a, b) => {
        const nameA = `${a.nom || ''} ${a.prenom || ''}`.trim().toLowerCase();
        const nameB = `${b.nom || ''} ${b.prenom || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setStaff(filteredStaffData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching staff & teachers:", error);
      setLoading(false);
    });

    // Load classes for dropdown
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const cls = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(c => (c.etablissement || 'EDU-001') === activeEstId);
      setClassesList(cls);
    });

    // Load subjects for dropdown
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      const subs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(s => (s.etablissement || 'EDU-001') === activeEstId);
      setSubjectsList(subs);
    });

    return () => {
      unsubscribe();
      unsubClasses();
      unsubSubjects();
    };
  }, [activeEstId]);

  // Separate Teachers and Administrative Staff
  const teachersList = staff.filter(m => m.role === 'enseignant');
  const adminStaffList = staff.filter(m => m.role !== 'enseignant');

  // Filtered teachers list
  const filteredTeachers = teachersList.filter(teacher => {
    const fullName = `${teacher.prenom || ''} ${teacher.nom || ''}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const subject = (teacher.matiere || (teacher.matieres ? teacher.matieres.join(' ') : '')).toLowerCase();
    const matchesSearch = fullName.includes(search) || teacher.email?.toLowerCase().includes(search) || subject.includes(search);
    
    const teacherStatus = (teacher.statut_enseignant || teacher.statutEnseignant || 'permanent').toLowerCase();
    const matchesStatus = teacherStatusFilter === 'all' || teacherStatus === teacherStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtered administrative staff list
  const filteredAdminStaff = adminStaffList.filter(member => {
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const position = (member.position || member.department || '').toLowerCase();
    return fullName.includes(search) || member.email?.toLowerCase().includes(search) || position.includes(search);
  });

  // Count stats
  const countPermanents = teachersList.filter(t => (t.statut_enseignant || t.statutEnseignant || 'permanent') === 'permanent').length;
  const countPrestataires = teachersList.filter(t => (t.statut_enseignant || t.statutEnseignant) === 'prestataire').length;
  const countStagiaires = teachersList.filter(t => (t.statut_enseignant || t.statutEnseignant) === 'stagiaire').length;

  const handleDeleteStaff = async (id: string, isTeacher = false) => {
    if (!isManager) {
      notifyError("Seul le responsable de l'établissement ou l'administrateur peut supprimer un membre.");
      return;
    }
    const label = isTeacher ? "cet enseignant" : "ce membre du personnel administratif";
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${label} de votre établissement ?`)) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      notifyDelete(isTeacher ? "Enseignant supprimé." : "Personnel administratif supprimé.");
      if (selectedStaff?.id === id) setSelectedStaff(null);
    } catch (error) {
      console.error("Error deleting staff member:", error);
      notifyError(t('error_occurred'));
    }
  };

  // Quick update teacher status directly
  const handleUpdateTeacherStatus = async (teacherId: string, newStatus: TeacherStatusType) => {
    if (!isManager) {
      notifyError("Action réservée au responsable de l'établissement.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', teacherId), {
        statut_enseignant: newStatus,
        statutEnseignant: newStatus,
        lastUpdated: new Date().toISOString()
      });
      notifySuccess(`Statut mis à jour : ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error("Error updating teacher status:", err);
      notifyError("Échec de mise à jour du statut.");
    }
  };

  // Handle Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.nom.trim() || !newTeacher.prenom.trim()) {
      notifyError("Veuillez renseigner le nom et le prénom de l'enseignant.");
      return;
    }
    if (!newTeacher.email.trim()) {
      notifyError("L'adresse email est requise pour créer le compte de l'enseignant.");
      return;
    }

    setIsSubmitting(true);
    try {
      const teacherPayload = {
        nom: newTeacher.nom.trim(),
        prenom: newTeacher.prenom.trim(),
        email: newTeacher.email.trim().toLowerCase(),
        phone: newTeacher.phone.trim(),
        contact: newTeacher.phone.trim(),
        gender: newTeacher.gender,
        role: 'enseignant',
        statut_enseignant: newTeacher.statut_enseignant,
        statutEnseignant: newTeacher.statut_enseignant,
        matiere: newTeacher.matiere || (newTeacher.matieres.length > 0 ? newTeacher.matieres[0] : 'Général'),
        matieres: newTeacher.matieres.length > 0 ? newTeacher.matieres : (newTeacher.matiere ? [newTeacher.matiere] : []),
        classe: newTeacher.classes.length > 0 ? newTeacher.classes[0] : '',
        classes: newTeacher.classes,
        diploma: newTeacher.diploma,
        experience_years: Number(newTeacher.experience_years) || 0,
        contract_type: newTeacher.contract_type,
        matricule: newTeacher.matricule.trim() || `ENS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        address: newTeacher.address.trim(),
        date_embauche: newTeacher.date_embauche,
        etablissement: activeEstId,
        status: 'active',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'users'), teacherPayload);
      notifySuccess(`Enseignant ${newTeacher.prenom} ${newTeacher.nom} (${newTeacher.statut_enseignant.toUpperCase()}) enregistré avec succès !`);
      
      setShowAddTeacherModal(false);
      setNewTeacher({
        nom: '',
        prenom: '',
        email: '',
        phone: '',
        gender: 'male',
        statut_enseignant: 'permanent',
        matiere: '',
        matieres: [],
        classes: [],
        diploma: 'Master / CAPES',
        experience_years: '3',
        contract_type: 'CDI',
        matricule: '',
        address: '',
        date_embauche: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error("Error creating teacher:", err);
      notifyError("Erreur lors de l'enregistrement de l'enseignant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Administrative Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.nom.trim() || !newStaff.prenom.trim() || !newStaff.email.trim()) {
      notifyError("Veuillez remplir les champs obligatoires (Nom, Prénom, Email).");
      return;
    }

    setIsSubmitting(true);
    try {
      const staffPayload = {
        nom: newStaff.nom.trim(),
        prenom: newStaff.prenom.trim(),
        email: newStaff.email.trim().toLowerCase(),
        phone: newStaff.phone.trim(),
        contact: newStaff.phone.trim(),
        gender: newStaff.gender,
        role: 'personnel administratif',
        position: newStaff.position,
        department: newStaff.department,
        responsibilities: newStaff.responsibilities,
        matricule: newStaff.matricule.trim() || `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        address: newStaff.address.trim(),
        etablissement: activeEstId,
        status: 'active',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'users'), staffPayload);
      notifySuccess(`Membre administratif ${newStaff.prenom} ${newStaff.nom} enregistré avec succès !`);
      setShowAddStaffModal(false);
      setNewStaff({
        nom: '',
        prenom: '',
        email: '',
        phone: '',
        gender: 'male',
        position: 'Secrétaire Générale',
        department: 'Administration Générale',
        responsibilities: [],
        matricule: '',
        address: ''
      });
    } catch (err) {
      console.error("Error creating staff:", err);
      notifyError("Erreur lors de l'enregistrement du personnel administratif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
              Campus Actif : {currentEstablishment?.nom || activeEstId}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 mt-1.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Scale size={24} />
            </div>
            Personnel & Corps Enseignant
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Gestion du personnel administratif, des responsabilités de direction et du corps professoral (Permanents, Prestataires, Stagiaires).
          </p>
        </div>

        {/* Action Buttons for Establishment Manager */}
        {isManager && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddTeacherModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <GraduationCap size={16} />
              + Ajouter un Enseignant
            </button>

            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus size={16} />
              + Personnel Administratif
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex border-b border-gray-150 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-2 rounded-2xl gap-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveSubTab('teachers')}
          className={`flex-1 sm:flex-initial text-center px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-900/40'
          }`}
        >
          <GraduationCap size={15} />
          Corps Enseignant ({teachersList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('directory')}
          className={`flex-1 sm:flex-initial text-center px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-900/40'
          }`}
        >
          <Briefcase size={15} />
          Personnel Administratif ({adminStaffList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`flex-1 sm:flex-initial text-center px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-900/40'
          }`}
        >
          <Shield size={15} />
          Missions & Responsabilités par Page
        </button>
      </div>

      {/* TAB 1: CORPS ENSEIGNANT */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-6">
          
          {/* Teacher Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <GraduationCap size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Enseignants</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{teachersList.length}</h3>
              </div>
            </div>

            <div 
              onClick={() => setTeacherStatusFilter(teacherStatusFilter === 'permanent' ? 'all' : 'permanent')}
              className={`p-5 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
                teacherStatusFilter === 'permanent' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-400/20' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-200'
              }`}
            >
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Permanents</p>
                </div>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{countPermanents}</h3>
              </div>
            </div>

            <div 
              onClick={() => setTeacherStatusFilter(teacherStatusFilter === 'prestataire' ? 'all' : 'prestataire')}
              className={`p-5 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
                teacherStatusFilter === 'prestataire' 
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-400/20' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200'
              }`}
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Clock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Prestataires / Vacataires</p>
                </div>
                <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{countPrestataires}</h3>
              </div>
            </div>

            <div 
              onClick={() => setTeacherStatusFilter(teacherStatusFilter === 'stagiaire' ? 'all' : 'stagiaire')}
              className={`p-5 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
                teacherStatusFilter === 'stagiaire' 
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-400/20' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-amber-200'
              }`}
            >
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                <Award size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Stagiaires</p>
                </div>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{countStagiaires}</h3>
              </div>
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matière, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setTeacherStatusFilter('all')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    teacherStatusFilter === 'all'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300'
                  }`}
                >
                  Tous ({teachersList.length})
                </button>

                {TEACHER_STATUSES.map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTeacherStatusFilter(st.id)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      teacherStatusFilter === st.id
                        ? `${st.badgeBg} ${st.text} border font-black shadow-xs`
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${st.dotColor}`}></span>
                    {st.label} ({teachersList.filter(t => (t.statut_enseignant || t.statutEnseignant || 'permanent') === st.id).length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Teachers Grid */}
          {loading ? (
            <div className="bg-white dark:bg-gray-800 p-20 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium text-gray-500">Chargement du corps enseignant...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-16 rounded-3xl border border-gray-100 dark:border-gray-700 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Aucun enseignant trouvé</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchTerm || teacherStatusFilter !== 'all' 
                  ? "Aucun enseignant ne correspond à vos critères de recherche ou de filtre."
                  : `Aucun enseignant n'est encore enregistré pour l'établissement "${currentEstablishment?.nom || activeEstId}".`}
              </p>
              {isManager && (
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <GraduationCap size={16} />
                  + Enregistrer un Enseignant
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => {
                const currentStatus = (teacher.statut_enseignant || teacher.statutEnseignant || 'permanent') as TeacherStatusType;
                const statusMeta = TEACHER_STATUSES.find(s => s.id === currentStatus) || TEACHER_STATUSES[0];
                const teacherMatieres = teacher.matieres && teacher.matieres.length > 0 
                  ? teacher.matieres 
                  : (teacher.matiere ? [teacher.matiere] : ['Non spécifié']);
                const teacherClasses = teacher.classes && teacher.classes.length > 0 
                  ? teacher.classes 
                  : (teacher.classe ? [teacher.classe] : []);

                return (
                  <div 
                    key={teacher.id}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header: Avatar + Status + Quick Switcher */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {teacher.photo ? (
                            <img 
                              src={teacher.photo} 
                              alt="" 
                              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100 dark:border-gray-700" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                              {teacher.prenom?.[0] || 'E'}{teacher.nom?.[0] || ''}
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {teacher.prenom} {teacher.nom}
                            </h3>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {teacher.matricule || 'Sans matricule'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${statusMeta.badgeBg} ${statusMeta.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`}></span>
                            {statusMeta.label}
                          </span>

                          {/* Quick change for establishment manager */}
                          {isManager && (
                            <select
                              value={currentStatus}
                              onChange={(e) => handleUpdateTeacherStatus(teacher.id, e.target.value as TeacherStatusType)}
                              aria-label={`Changer le statut de l'enseignant ${teacher.prenom} ${teacher.nom}`}
                              className="text-[9px] bg-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 outline-none cursor-pointer text-right font-medium"
                            >
                              <option value="permanent" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Permanent (CDI)</option>
                              <option value="prestataire" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Prestataire (Vacataire)</option>
                              <option value="stagiaire" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Stagiaire</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Discipline / Subjects */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Matière(s) Enseignée(s)</p>
                          <div className="flex flex-wrap gap-1">
                            {teacherMatieres.map((mat, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30"
                              >
                                {mat}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Classes */}
                        {teacherClasses.length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Classes Attribuées</p>
                            <div className="flex flex-wrap gap-1">
                              {teacherClasses.map((cls, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-650 dark:text-gray-300 rounded-md text-[9px] font-bold"
                                >
                                  {cls}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contacts */}
                        <div className="pt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2 truncate">
                            <Mail size={12} className="shrink-0 text-gray-400" />
                            <span className="truncate">{teacher.email}</span>
                          </div>
                          {(teacher.phone || teacher.contact) && (
                            <div className="flex items-center gap-2 truncate">
                              <Phone size={12} className="shrink-0 text-emerald-500" />
                              <span className="truncate">{teacher.phone || teacher.contact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                      <div className="text-[10px] text-gray-400">
                        {teacher.diploma || 'Enseignant'}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(teacher)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Fiche détaillée"
                        >
                          <ExternalLink size={15} />
                        </button>
                        {isManager && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(teacher.id, true)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer l'enseignant"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERSONNEL ADMINISTRATIF */}
      {activeSubTab === 'directory' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher membre administratif, poste, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all shadow-sm"
                />
              </div>

              {isManager && (
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <UserPlus size={15} />
                  + Nouveau Personnel
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="w-1/3 px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Membre Administratif</th>
                  <th className="w-1/4 px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="w-1/4 px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Poste / Département</th>
                  <th className="w-24 px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="w-32 px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Chargement du personnel...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAdminStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={40} className="text-gray-300" />
                        <p className="text-sm font-medium">Aucun membre du personnel administratif trouvé</p>
                        <p className="text-xs text-gray-400">Ajoutez des membres administratifs rattachés à votre établissement.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAdminStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {member.photo ? (
                            <img src={member.photo} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase">
                              {member.prenom?.[0] || 'A'}{member.nom?.[0] || ''}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {member.prenom} {member.nom}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-750 dark:bg-indigo-950/45 dark:text-indigo-300">
                                {member.position || tData(member.role)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 min-w-0 text-xs">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 truncate">
                            <Mail size={12} className="shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {(member.phone || member.contact) && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 truncate">
                              <Phone size={12} className="shrink-0" />
                              <span className="truncate">{member.phone || member.contact}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium truncate">{member.position || 'Personnel'}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{member.department || 'Administration'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          member.status === 'online' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {member.status === 'online' ? 'En ligne' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={() => setSelectedStaff(member)}
                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all cursor-pointer"
                            title="Consulter"
                          >
                            <ExternalLink size={16} />
                          </button>
                          {isManager && (
                            <button 
                              type="button"
                              onClick={() => handleDeleteStaff(member.id, false)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & RESPONSIBILITIES */}
      {activeSubTab === 'roles' && (
        <RoleResponsibilities />
      )}

      {/* MODAL: AJOUTER UN ENSEIGNANT (CORPS ENSEIGNANT) */}
      <AnimatePresence>
        {showAddTeacherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-t-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Ajouter un Enseignant</h3>
                    <p className="text-xs text-indigo-100">
                      Enregistrement académique pour l'établissement <span className="font-bold underline">{currentEstablishment?.nom || activeEstId}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleCreateTeacher} className="p-6 md:p-8 space-y-6">
                
                {/* SECTION 1: STATUT DE L'ENSEIGNANT (OBLIGATOIRE) */}
                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    1. Statut de l'enseignant <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TEACHER_STATUSES.map((st) => {
                      const isSelected = newTeacher.statut_enseignant === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setNewTeacher({ ...newTeacher, statut_enseignant: st.id })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? `${st.border} ${st.badgeBg} shadow-sm ring-2 ring-indigo-500/20`
                              : 'border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`w-3 h-3 rounded-full ${st.dotColor}`}></span>
                            {isSelected && <Check size={16} className="text-indigo-600 dark:text-indigo-400 font-black" />}
                          </div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">{st.label}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                            {st.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 2: IDENTITÉ & COORDONNÉES */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    2. Identité & Coordonnées Professionnelles
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Paul"
                        value={newTeacher.prenom}
                        onChange={(e) => setNewTeacher({ ...newTeacher, prenom: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mba"
                        value={newTeacher.nom}
                        onChange={(e) => setNewTeacher({ ...newTeacher, nom: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email Académique / Pro *</label>
                      <input
                        type="email"
                        required
                        placeholder="paul.mba@etablissement.edu"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+241 07 00 00 00"
                        value={newTeacher.phone}
                        onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matricule Enseignant</label>
                      <input
                        type="text"
                        value={newTeacher.matricule}
                        onChange={(e) => setNewTeacher({ ...newTeacher, matricule: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Genre</label>
                      <select
                        value={newTeacher.gender}
                        onChange={(e) => setNewTeacher({ ...newTeacher, gender: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="male">Masculin</option>
                        <option value="female">Féminin</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: AFFECTATION PÉDAGOGIQUE */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    3. Affectation Pédagogique (Matières & Classes)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matière Principale</label>
                      {subjectsList.length > 0 ? (
                        <select
                          value={newTeacher.matiere}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewTeacher(prev => ({
                              ...prev,
                              matiere: val,
                              matieres: prev.matieres.includes(val) ? prev.matieres : [...prev.matieres, val]
                            }));
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Sélectionner une matière</option>
                          {subjectsList.map(s => (
                            <option key={s.id} value={s.name || s.id}>{s.name || s.id}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ex: Mathématiques, Français, SVT..."
                          value={newTeacher.matiere}
                          onChange={(e) => setNewTeacher({ ...newTeacher, matiere: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Diplôme / Qualification</label>
                      <input
                        type="text"
                        placeholder="Doctorat, Master, CAPES, Licence..."
                        value={newTeacher.diploma}
                        onChange={(e) => setNewTeacher({ ...newTeacher, diploma: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Classes attribution */}
                  {classesList.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Classes Attribuées (Cochez les classes)
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-150 dark:border-gray-700">
                        {classesList.map(c => {
                          const cName = c.name || c.id;
                          const isChecked = newTeacher.classes.includes(cName);
                          return (
                            <label
                              key={c.id}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 ${
                                isChecked
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewTeacher({ ...newTeacher, classes: [...newTeacher.classes, cName] });
                                  } else {
                                    setNewTeacher({ ...newTeacher, classes: newTeacher.classes.filter(cn => cn !== cName) });
                                  }
                                }}
                                className="hidden"
                              />
                              {cName}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Années d'expérience</label>
                      <input
                        type="number"
                        min="0"
                        value={newTeacher.experience_years}
                        onChange={(e) => setNewTeacher({ ...newTeacher, experience_years: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de prise de fonction</label>
                      <input
                        type="date"
                        value={newTeacher.date_embauche}
                        onChange={(e) => setNewTeacher({ ...newTeacher, date_embauche: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddTeacherModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer l'Enseignant"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AJOUTER PERSONNEL ADMINISTRATIF */}
      <AnimatePresence>
        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-900 text-white rounded-t-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-2xl">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Nouveau Personnel Administratif</h3>
                    <p className="text-xs text-gray-400">Établissement {currentEstablishment?.nom || activeEstId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-6 md:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sarah"
                      value={newStaff.prenom}
                      onChange={(e) => setNewStaff({ ...newStaff, prenom: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ondo"
                      value={newStaff.nom}
                      onChange={(e) => setNewStaff({ ...newStaff, nom: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah.ondo@etablissement.edu"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="+241 06 00 00 00"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Poste / Fonction</label>
                    <select
                      value={newStaff.position}
                      onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Secrétaire Générale">Secrétaire Générale</option>
                      <option value="Gestionnaire Comptable">Gestionnaire Comptable</option>
                      <option value="Surveillant Général">Surveillant Général</option>
                      <option value="Surveillant Adjoint">Surveillant Adjoint</option>
                      <option value="Responsable Pédagogique">Responsable Pédagogique</option>
                      <option value="Responsable IT / Matériel">Responsable IT / Matériel</option>
                      <option value="Cuisinier / Chef de Cuisine">Cuisinier / Chef de Cuisine</option>
                      <option value="Agent d'Accueil & Entretien">Agent d'Accueil & Entretien</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Département</label>
                    <input
                      type="text"
                      placeholder="Direction, Intendance, Scolarité..."
                      value={newStaff.department}
                      onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff / Teacher Detail Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20"
            >
              <div className="relative h-36 bg-gradient-to-br from-indigo-500 to-purple-600">
                <button 
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-md cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>
              <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6 flex justify-center">
                  <div className="relative">
                    {selectedStaff.photo ? (
                      <img 
                        src={selectedStaff.photo} 
                        alt="" 
                        className="w-32 h-32 rounded-3xl border-4 border-white dark:border-gray-800 object-cover shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-3xl border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-black shadow-xl">
                        {selectedStaff.prenom?.[0] || 'U'}{selectedStaff.nom?.[0] || ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {selectedStaff.prenom} {selectedStaff.nom}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-widest rounded-full">
                        {tData(selectedStaff.role)}
                      </span>
                      {selectedStaff.role === 'enseignant' && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                          TEACHER_STATUSES.find(s => s.id === (selectedStaff.statut_enseignant || selectedStaff.statutEnseignant))?.badgeBg || 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {TEACHER_STATUSES.find(s => s.id === (selectedStaff.statut_enseignant || selectedStaff.statutEnseignant))?.label || 'Permanent'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-4 bg-gray-50 dark:bg-gray-750/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Matricule</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">{selectedStaff.matricule || 'Non renseigné'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-750/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {selectedStaff.role === 'enseignant' ? 'Matière' : 'Poste'}
                      </p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
                        {selectedStaff.role === 'enseignant' ? (selectedStaff.matiere || 'Général') : (selectedStaff.position || 'Personnel')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-750/30 p-2.5 rounded-xl text-left">
                      <Mail size={16} className="text-indigo-500 shrink-0" />
                      <span className="truncate">{selectedStaff.email}</span>
                    </div>
                    {(selectedStaff.phone || selectedStaff.contact) && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-750/30 p-2.5 rounded-xl text-left">
                        <Phone size={16} className="text-emerald-500 shrink-0" />
                        <span>{selectedStaff.phone || selectedStaff.contact}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => setSelectedStaff(null)}
                    className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
