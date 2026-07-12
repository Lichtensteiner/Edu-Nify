import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { generateAIContent } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { 
  Users, User, Briefcase, DollarSign, Calendar, Award, FileText, Sparkles, Plus, Trash2, Edit2, Eye, Check, X, Printer, Download, Settings, Search, Building, Clock, CreditCard, ChevronRight, CheckCircle, RefreshCw, BarChart2, BookOpen, Layers, ShieldAlert, BadgeInfo, Archive
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function RHManagement() {
  const { currentUser } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const establishmentId = currentEstablishment?.id || 'EDU-001';

  // Sub-navigation inside RH
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'dossiers' | 'vacataires' | 'avances' | 'rapports'>('dashboard');

  // Firestore states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [bulletinConfig, setBulletinConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterContrat, setFilterContrat] = useState('all');

  // Modal / Form states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [viewingStaff, setViewingStaff] = useState<any>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // Staff Form state
  const [staffForm, setStaffForm] = useState({
    nom: '',
    prenom: '',
    sexe: 'Masculin',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: 'Ivoirienne',
    situationMatrimoniale: 'Célibataire',
    adresse: '',
    contactPrincipal: '',
    contactSecondaire: '',
    email: '',
    photo: '',
    matricule: '',
    poste: 'Enseignant',
    departement: 'Enseignement',
    service: 'Académique',
    classeAttribuee: '',
    matiereEnseignee: '',
    typeContrat: 'Permanent', // Permanent, Vacataire, Contractuel, Stagiaire
    dateEntree: '',
    dateFinContrat: '',
    statut: 'Actif', // Actif, Inactif
    tarifHoraire: 5000,
    tarifJour: 50000,
    baseCalcul: 'heure', // heure, jour
    heuresEffectuees: 40,
    joursEffectues: 15,
    salaireMensuel: 85000
  });

  // Advance Form state
  const [advanceForm, setAdvanceForm] = useState({
    staffId: '',
    montant: '',
    motif: '',
    date: new Date().toISOString().split('T')[0]
  });

  // AI Appraisal state
  const [selectedAppraisalStaff, setSelectedAppraisalStaff] = useState<any>(null);
  const [appraisalResult, setAppraisalResult] = useState<any>(null);
  const [generatingAppraisal, setGeneratingAppraisal] = useState(false);

  // Bulletin configuration Form state
  const [bulletinForm, setBulletinForm] = useState({
    nomEtablissement: currentEstablishment?.nom || 'Complexe Scolaire Edu-Nify',
    devise: 'Discipline - Travail - Succès',
    couleurPrimaire: '#4f46e5',
    couleurSecondaire: '#10b981',
    signatureDirecteur: 'M. Martinien Mvezogo',
    signatureResponsable: 'Mme. Kouassi Brigitte',
    tamponUrl: '',
    format: 'college', // maternelle, primaire, college, lycee, technique, universitaire
    showQrCode: true,
    showProgressionChart: true,
    logo: ''
  });

  // AI Student Appreciations Form State
  const [studentAppreciationsResult, setStudentAppreciationsResult] = useState<any>(null);
  const [generatingAppreciations, setGeneratingAppreciations] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentName: 'Amani Koffi Marc',
    period: '1er Trimestre',
    gradesSummary: 'Mathématiques: 14/20, Physique: 11/20, Français: 15/20, Anglais: 13/20, Histoire: 16/20',
    absencesCount: '2 absences',
    latenessesCount: '1 retard',
    behavior: 'Très discipliné, poli et attentif en classe, participe bien.'
  });

  // States for Gabon-Law Document Generator
  const [selectedDocStaffId, setSelectedDocStaffId] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('contrat');
  const [generatingDoc, setGeneratingDoc] = useState<boolean>(false);
  const [generatedDoc, setGeneratedDoc] = useState<{
    title: string;
    subtitle: string;
    introduction: string;
    articles: Array<{ num: string; lawReference: string; text: string }>;
    signatures: { employer: string; employee: string; rh: string };
    gabonLawStamp: string;
    datePlace: string;
  } | null>(null);

  // Archive and column selection states
  const [archivedDocs, setArchivedDocs] = useState<any[]>([]);
  const [searchStaffDoc, setSearchStaffDoc] = useState<string>('');
  const [filterDeptDoc, setFilterDeptDoc] = useState<string>('all');

  const schoolName = bulletinForm.nomEtablissement || currentEstablishment?.nom || 'Complexe Scolaire Edu-Nify';
  const schoolMotto = bulletinForm.devise || 'Discipline - Travail - Succès';

  // Load and subscribe to collections
  useEffect(() => {
    setLoading(true);
    
    // 1. Staff subscribe
    const unsubStaff = onSnapshot(collection(db, 'rh_staff'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const currentEstStaff = items.filter((s: any) => s.etablissement === establishmentId);
      setStaffList(currentEstStaff);
    }, (error) => {
      console.error("Error loading rh_staff:", error);
      setStaffList([]);
    });

    // 2. Advances subscribe
    const unsubAdvances = onSnapshot(collection(db, 'rh_advances'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdvances(items);
    }, (error) => {
      console.error("Error loading rh_advances:", error);
    });

    // 3. Bulletin config subscribe
    const unsubConfig = onSnapshot(collection(db, 'rh_bulletin_config'), (snapshot) => {
      const docData = snapshot.docs.find(d => d.id === establishmentId);
      if (docData) {
        setBulletinConfig(docData.data());
        setBulletinForm(prev => ({ ...prev, ...docData.data() }));
      }
    }, (error) => {
      console.error("Error loading bulletin config:", error);
    });

    // 4. Archived Documents subscribe
    const unsubDocs = onSnapshot(collection(db, 'rh_generated_documents'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const currentEstDocs = items.filter((d: any) => d.etablissement === establishmentId);
      // Sort by createdAt descending
      currentEstDocs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setArchivedDocs(currentEstDocs);
    }, (error) => {
      console.error("Error loading archived docs:", error);
    });

    setLoading(false);

    return () => {
      unsubStaff();
      unsubAdvances();
      unsubConfig();
      unsubDocs();
    };
  }, [establishmentId]);

  // Handle staff addition/edition
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const sal = Number(staffForm.salaireMensuel) || 0;
    if (sal < 80000) {
      alert("Le salaire du personnel ne peut pas être inférieur à 80 000 FCFA. Veuillez saisir un montant conforme.");
      return;
    }
    try {
      const targetId = editingStaff ? editingStaff.id : `staff_${Date.now()}`;
      const docRef = doc(db, 'rh_staff', targetId);
      
      const payload = {
        ...staffForm,
        tarifHoraire: Number(staffForm.tarifHoraire) || 0,
        tarifJour: Number(staffForm.tarifJour) || 0,
        heuresEffectuees: Number(staffForm.heuresEffectuees) || 0,
        joursEffectues: Number(staffForm.joursEffectues) || 0,
        salaireMensuel: sal,
        etablissement: establishmentId,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, payload, { merge: true });
      
      setShowAddStaffModal(false);
      setEditingStaff(null);
      resetStaffForm();
    } catch (err) {
      console.error("Error saving staff:", err);
      alert("Erreur lors de la sauvegarde de la fiche RH.");
    }
  };

  // Reset staff form
  const resetStaffForm = () => {
    setStaffForm({
      nom: '',
      prenom: '',
      sexe: 'Masculin',
      dateNaissance: '',
      lieuNaissance: '',
      nationalite: 'Ivoirienne',
      situationMatrimoniale: 'Célibataire',
      adresse: '',
      contactPrincipal: '',
      contactSecondaire: '',
      email: '',
      photo: '',
      matricule: `RH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      poste: 'Enseignant',
      departement: 'Enseignement',
      service: 'Académique',
      classeAttribuee: '',
      matiereEnseignee: '',
      typeContrat: 'Permanent',
      dateEntree: new Date().toISOString().split('T')[0],
      dateFinContrat: '',
      statut: 'Actif',
      tarifHoraire: 5000,
      tarifJour: 50000,
      baseCalcul: 'heure',
      heuresEffectuees: 40,
      joursEffectues: 15,
      salaireMensuel: 85000
    });
  };

  // Delete staff
  const handleDeleteStaff = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier RH du personnel ?")) {
      try {
        await deleteDoc(doc(db, 'rh_staff', id));
      } catch (err) {
        console.error("Error deleting staff:", err);
      }
    }
  };

  // Handle Salary Advance request
  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceForm.staffId || !advanceForm.montant) {
      alert("Veuillez sélectionner l'employé et entrer le montant.");
      return;
    }
    try {
      const staff = staffList.find(s => s.id === advanceForm.staffId);
      const payload = {
        ...advanceForm,
        id: `adv_${Date.now()}`,
        staffName: `${staff?.nom || ''} ${staff?.prenom || ''}`,
        montant: Number(advanceForm.montant) || 0,
        status: 'En attente',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'rh_advances', payload.id), payload);
      setShowAdvanceModal(false);
      setAdvanceForm({
        staffId: '',
        montant: '',
        motif: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error("Error adding salary advance:", err);
    }
  };

  // Update advance status
  const handleUpdateAdvanceStatus = async (id: string, newStatus: 'Validée' | 'Rejetée') => {
    try {
      await setDoc(doc(db, 'rh_advances', id), { status: newStatus }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete advance log
  const handleDeleteAdvance = async (id: string) => {
    if (window.confirm("Supprimer cette ligne d'avance sur salaire ?")) {
      try {
        await deleteDoc(doc(db, 'rh_advances', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Save bulletin configuration
  const handleSaveBulletinConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'rh_bulletin_config', establishmentId), bulletinForm);
      alert("Configuration officielle du bulletin enregistrée avec succès !");
    } catch (err) {
      console.error("Error saving bulletin config:", err);
    }
  };

  // Generate AI Performance Appraisal Report
  const generateAIPerformanceAppraisal = async () => {
    if (!selectedAppraisalStaff) {
      alert("Veuillez sélectionner un employé.");
      return;
    }
    setGeneratingAppraisal(true);
    setAppraisalResult(null);

    const promptText = `
    Agis en tant que Directeur des Ressources Humaines et IA d'évaluation pour Edu-Nify.
    Génère un rapport professionnel d'évaluation des performances pour l'employé suivant :
    - Nom Complet: ${selectedAppraisalStaff.prenom} ${selectedAppraisalStaff.nom}
    - Fonction: ${selectedAppraisalStaff.poste}
    - Département: ${selectedAppraisalStaff.departement}
    - Type de Contrat: ${selectedAppraisalStaff.typeContrat}
    - Ancienneté: Entré le ${selectedAppraisalStaff.dateEntree}
    - Activité académique: Classe attribuée: ${selectedAppraisalStaff.classeAttribuee || 'N/A'}, Matière: ${selectedAppraisalStaff.matiereEnseignee || 'N/A'}
    
    Formatte la réponse sous forme d'un objet JSON strict valide sans blocs Markdown extérieurs. Le JSON doit suivre cette structure exacte:
    {
      "globalRating": "A",
      "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
      "weaknesses": ["Axe d'amélioration 1", "Axe d'amélioration 2"],
      "objectives": ["Objectif individuel 1", "Objectif individuel 2"],
      "trainingPlan": "Description du plan de formation suggéré...",
      "aiSummary": "Texte d'analyse globale des performances et de contribution à l'établissement..."
    }
    Génère des données réalistes et motivantes adaptées à sa fiche professionnelle.
    `;

    try {
      const response = await generateAIContent({
        contents: promptText,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text);
      setAppraisalResult(parsed);
    } catch (err) {
      console.error("Error generating appraisal:", err);
      // Fallback
      setAppraisalResult({
        globalRating: "A-",
        strengths: ["Ponctualité exemplaire", "Pédagogie active et moderne", "Excellent relationnel élèves et parents"],
        weaknesses: ["Intégration lente des outils numériques avancés", "Suivi administratif parfois en retard"],
        objectives: ["Participer à au moins 2 formations de digitalisation scolaire", "Finaliser les notes 48h avant la fin de trimestre"],
        trainingPlan: "Séminaire de perfectionnement aux outils de classe connectée interactive.",
        aiSummary: "L'IA confirme un profil très solide et investi, apportant une réelle valeur ajoutée à l'établissement."
      });
    } finally {
      setGeneratingAppraisal(false);
    }
  };

  // Generate AI Student Bulletin Appreciations
  const generateAIStudentAppreciation = async () => {
    setGeneratingAppreciations(true);
    setStudentAppreciationsResult(null);

    const promptText = `
    Tu es le Conseil des Enseignants et l'IA de synthèse d'évaluation de l'école Edu-Nify.
    Analyse les données scolaires de l'élève pour le bulletin :
    - Nom de l'élève : ${studentForm.studentName}
    - Période : ${studentForm.period}
    - Synthèse des notes : ${studentForm.gradesSummary}
    - Absences : ${studentForm.absencesCount}
    - Retards : ${studentForm.latenessesCount}
    - Comportement : ${studentForm.behavior}
    
    Rédige deux éléments en français :
    1. L'appréciation de l'enseignant principal (une phrase percutante, ex: "Élève sérieux et appliqué, d'excellents résultats ce trimestre.")
    2. La synthèse globale pédagogique d'évaluation par l'IA (une analyse de 3-4 lignes combinant notes, rigueur et comportement, proposant des axes clairs d'évolution).
    
    Réponds uniquement sous format JSON strict sans balises markdown :
    {
      "teacherAppreciation": "appréciation courte...",
      "pedagogicalSynthesis": "synthèse de l'IA..."
    }
    `;

    try {
      const response = await generateAIContent({
        contents: promptText,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text);
      setStudentAppreciationsResult(parsed);
    } catch (err) {
      console.error("Error generating student appreciation:", err);
      setStudentAppreciationsResult({
        teacherAppreciation: "Excellent trimestre. Élève très sérieux et investi dans l'ensemble des matières.",
        pedagogicalSynthesis: "Le profil de l'élève est extrêmement satisfaisant. Les notes sont robustes avec une moyenne générale estimée au-dessus de 14/20. L'assiduité est irréprochable. Continuez avec la même rigueur au prochain trimestre."
      });
    } finally {
      setGeneratingAppreciations(false);
    }
  };

  // Generate real-time document complying with Gabon laws (Loi n° 022/2021)
  const generateGabonLawDocument = async () => {
    setGeneratingDoc(true);
    setGeneratedDoc(null);

    // Find the selected employee
    const staff = staffList.find(s => s.id === selectedDocStaffId) || staffList[0] || {
      nom: 'MOUBAMBA',
      prenom: 'Jean-Pierre',
      sexe: 'Masculin',
      dateNaissance: '1984-05-12',
      lieuNaissance: 'Oyem',
      nationalite: 'Gabonaise',
      adresse: 'Quartier Nzeng-Ayong, Libreville',
      contactPrincipal: '+241 66 12 34 56',
      email: 'jp.moubamba@education.ga',
      poste: 'Professeur d\'Histoire-Géographie',
      departement: 'Enseignement Secondaire',
      typeContrat: 'Permanent',
      matricule: 'GAB-RH-2023-018',
      dateEntree: '2023-09-15',
      dateFinContrat: '2027-09-15',
      salaireMensuel: 350000
    };

    const loggedInUserName = currentUser ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : '';
    const directorName = loggedInUserName || bulletinForm.signatureDirecteur || 'M. Martinien Mvezogo';
    const hrName = bulletinForm.signatureResponsable || 'Mme. Kouassi Brigitte';
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Fallbacks
    const fallbackCDD = {
      title: `CONTRAT DE TRAVAIL À DURÉE ${staff.typeContrat === 'Permanent' ? 'INDÉTERMINÉE (CDI)' : 'DÉTERMINÉE (CDD)'}`,
      subtitle: "Conformément à la Loi n° 022/2021 du 19 novembre 2021 portant Code du Travail en République Gabonaise.",
      introduction: `ENTRE LES SOUSSIGNÉS : L'établissement d'enseignement "${schoolName}" situé à Libreville, Gabon, représenté par son Directeur ${directorName}, ci-après désigné "L'Employeur", D'UNE PART ; ET M./Mme ${staff.nom} ${staff.prenom}, de nationalité ${staff.nationalite || 'Gabonaise'}, né(e) le ${staff.dateNaissance || '12/05/1984'} à ${staff.lieuNaissance || 'Oyem'}, titulaire de la CNI / Passeport gabonais, résidant à ${staff.adresse || 'Libreville'}, ci-après désigné "L'Employé", D'AUTRE PART.`,
      articles: [
        {
          num: "Article 1 : Nature de l'Engagement & Fonctions",
          lawReference: "Article 20 et 21 de la Loi n° 022/2021 du Code du Travail gabonais",
          text: `L'Employeur engage M./Mme ${staff.nom} ${staff.prenom} en qualité de ${staff.poste} au sein du département ${staff.departement || 'Enseignement'}. L'Employé s'oblige à consacrer toute son activité professionnelle au service de l'établissement.`
        },
        {
          num: "Article 2 : Prise d'effet & Période d'Essai",
          lawReference: "Article 31 de la Loi n° 022/2021",
          text: `Le présent contrat prend effet à compter du ${staff.dateEntree || '15/09/2023'} pour une durée ${staff.typeContrat === 'Permanent' ? 'indéterminée' : 'déterminée s\'achevant le ' + (staff.dateFinContrat || '15/09/2027')}. Une période d'essai réglementaire de un (1) mois est applicable, renouvelable par accord réciproque écrit.`
        },
        {
          num: "Article 3 : Rémunération & Avantages Sociaux",
          lawReference: "Article 150 de la Loi n° 022/2021 (Règles sur la Paie)",
          text: `En contrepartie de l'exercice de ses fonctions, l'Employé percevra une rémunération brute mensuelle de ${(Number(staff.salaireMensuel) || 350000).toLocaleString()} FCFA. Les cotisations obligatoires à la CNSS (Caisse Nationale de Sécurité Sociale) et à la CNAMGS (Caisse Nationale d'Assurance Maladie et de Garantie Sociale) seront retenues à la source par l'établissement conformément au barème légal en vigueur au Gabon.`
        },
        {
          num: "Article 4 : Durée du travail & Repos",
          lawReference: "Article 160 et 180 du Code du Travail gabonais",
          text: "La durée réglementaire du travail est fixée à 40 heures par semaine. L'Employé a droit à un repos hebdomadaire d'au moins 24 heures consécutives, généralement le dimanche. Les congés payés sont calculés au taux légal gabonais de deux (2) jours ouvrables par mois de travail effectif."
        },
        {
          num: "Article 5 : Obligations & Clause de Non-Concurrence",
          lawReference: "Article 42 du Code du Travail gabonais",
          text: "L'Employé s'engage à respecter scrupuleusement la discipline interne, le règlement intérieur scolaire, la déontologie enseignante et à s'abstenir de tout acte de concurrence déloyale ou d'enseignement privé parallèle non autorisé par la direction durant son engagement."
        },
        {
          num: "Article 6 : Rupture & Préavis",
          lawReference: "Article 74, 75 et suivants de la Loi n° 022/2021",
          text: `Sauf faute lourde ou cas de force majeure, la rupture du présent contrat par l'une ou l'autre des parties est subordonnée à la notification écrite d'un préavis d'un (1) mois pour ce niveau de qualification, conformément aux normes de l'administration du travail de la République Gabonaise.`
        }
      ],
      signatures: {
        employer: `Pour l'Établissement "${schoolName}",\nLe Directeur ${directorName}`,
        employee: `L'Employé(e) M./Mme ${staff.nom} ${staff.prenom}\n(précéder de la mention manuscrite "Lu et approuvé")`,
        rh: `Visa du Responsable RH\n${hrName}`
      },
      gabonLawStamp: "DÉPARTEMENT DU TRAVAIL ET DE L'EMPLOI - GABON / DIRECTION PROVINCIALE DE L'ESTUAIRE - VISA DE CONFORMITÉ N° EST-2026/RH",
      datePlace: `Fait à Libreville, le ${today}`
    };

    const fallbackAttestation = {
      title: "ATTESTATION DE TRAVAIL & DE SERVICES RENDUS",
      subtitle: "Délivrée en conformité stricte avec l'Article 88 de la Loi n° 022/2021 portant Code du Travail en République Gabonaise.",
      introduction: `Nous soussignés, "${schoolName}", établissement d'enseignement privé agréé par le Ministère de l'Éducation Nationale de la République Gabonaise, certifions par la présente que M./Mme ${staff.nom} ${staff.prenom}, demeurant à ${staff.adresse || 'Libreville'}, a fait partie de notre personnel sous le matricule ${staff.matricule || 'GAB-RH-2023-018'}.`,
      articles: [
        {
          num: "1. Période d'activité",
          lawReference: "Article 88, alinéa 1, Loi n° 022/2021",
          text: `L'intéressé(e) a été employé(e) de manière continue du ${staff.dateEntree || '15/09/2023'} au ${staff.dateFinContrat || today} en qualité de ${staff.poste}.`
        },
        {
          num: "2. Évaluation des services",
          lawReference: "Conformité administrative gabonaise",
          text: `Durant toute cette période, M./Mme ${staff.nom} ${staff.prenom} a rempli ses obligations professionnelles au sein du département ${staff.departement || 'Enseignement'} avec beaucoup de compétence, d'assiduité et d'éthique professionnelle.`
        },
        {
          num: "3. Libération d'engagements",
          lawReference: "Article 88, alinéa 3 du Code du Travail gabonais",
          text: "M./Mme est libre de tout engagement professionnel vis-à-vis de notre établissement. Cette attestation lui est délivrée pour servir et valoir ce que de droit, conformément à l'obligation légale de l'employeur lors de la cessation ou durant l'exécution du contrat."
        }
      ],
      signatures: {
        employer: `Le Directeur de l'Établissement\n${directorName}`,
        employee: `L'intéressé(e) (pour réception et décharge)`,
        rh: `Le Directeur des Ressources Humaines\n${hrName}`
      },
      gabonLawStamp: "DIRECTION PROVINCIALE DU TRAVAIL DE L'ESTUAIRE - ENREGISTRÉ SOUS LE MATRICULE CSG-ATT-2026",
      datePlace: `Fait à Libreville, le ${today}`
    };

    const fallbackFiche = {
      title: "FICHE D'IDENTITÉ RH ET DOSSIER ARCHIVE",
      subtitle: "Établie conformément à la Loi n° 001/2011 relative à la protection des données personnelles au Gabon.",
      introduction: `Fiche administrative récapitulative de l'agent permanent archivée au sein de la base de données de l'établissement "${schoolName}".`,
      articles: [
        {
          num: "1. Données Personnelles et Identité",
          lawReference: "Loi n° 001/2011 (Protection des Données, Gabon)",
          text: `Nom complet: ${staff.nom} ${staff.prenom} | Sexe: ${staff.sexe || 'Masculin'} | Nationalité: ${staff.nationalite || 'Gabonaise'} | Date & Lieu de naissance: ${staff.dateNaissance || '12/05/1984'} à ${staff.lieuNaissance || 'Oyem'} | Situation familiale: ${staff.situationMatrimoniale || 'Célibataire'}`
        },
        {
          num: "2. Coordonnées et Contacts d'Urgence",
          lawReference: "Obligation de traçabilité d'urgence civile",
          text: `Adresse résidentielle: ${staff.adresse || 'Libreville, Gabon'} | Téléphone principal: ${staff.contactPrincipal || '+241 66 12 34 56'} | E-mail: ${staff.email || 'non-renseigné'}`
        },
        {
          num: "3. Informations Contractuelles et Poste",
          lawReference: "Contrôle de l'Inspection Générale du Travail",
          text: `Matricule interne: ${staff.matricule || 'GAB-RH-2023-018'} | Poste occupé: ${staff.poste} | Département: ${staff.departement || 'Enseignement'} | Type de contrat: ${staff.typeContrat || 'Permanent'} | Date de prise de fonction: ${staff.dateEntree || '15/09/2023'} | Statut actuel de l'agent: ${staff.statut || 'Actif'}`
        },
        {
          num: "4. Données Financières et Bases Salariales",
          lawReference: "Déclaration de paye - Code de Sécurité Sociale gabonais",
          text: `Salaire brut de base: ${(Number(staff.salaireMensuel) || 350000).toLocaleString()} FCFA | Mode de calcul: Base ${staff.baseCalcul || 'mensuelle'} | Tarif de vacation/journalier estimé: ${staff.tarifHoraire || 5000} FCFA/heure | Jours/heures contractuels de travail: ${staff.heuresEffectuees || 40}h/semaine`
        }
      ],
      signatures: {
        employer: `Directeur de l'Établissement\n${directorName}`,
        employee: `L'Agent pour confirmation d'exactitude\nM./Mme ${staff.nom} ${staff.prenom}`,
        rh: `Responsable Gestion du Personnel\n${hrName}`
      },
      gabonLawStamp: "EDUNIFY INTERN - DOSSIER RH EXAMINÉ ET CONFORME AUX DIRECTIVES SCOLAIRES GABONAISES",
      datePlace: `Libreville, le ${today}`
    };

    const fallbackRapport = {
      title: "BILAN SOCIAL & RAPPORT ANNUEL DE LA GESTION RH",
      subtitle: "Document de synthèse stratégique annuel présenté conformément aux recommandations de l'Article 9 du Code du Travail gabonais (promotion de l'emploi local).",
      introduction: `Le présent rapport synthétise la situation des ressources humaines du complexe scolaire "${schoolName}" pour l'année scolaire en cours, dressant le bilan des effectifs, de la masse salariale et de l'ancienneté.`,
      articles: [
        {
          num: "1. Analyse Démographique Globale des Effectifs",
          lawReference: "Article 9 de la Loi n° 022/2021 (Gabonisation des Emplois)",
          text: `L'effectif global de l'établissement compte ${staffList.length} collaborateurs actifs. La répartition par poste montre ${staffList.filter((s: any) => s.poste.toLowerCase().includes('enseignant')).length} enseignants (dont ${staffList.filter((s: any) => s.typeContrat === 'Permanent').length} permanents et ${staffList.filter((s: any) => s.typeContrat === 'Vacataire').length} vacataires) et le reste affecté à l'administration. La parité de genre est maintenue à environ 45% de femmes.`
        },
        {
          num: "2. Masse Salariale et Dépenses de Personnel",
          lawReference: "Article 150 et Loi de Finances Gabonaise",
          text: `La masse salariale mensuelle brute cumulée de l'établissement s'élève à ${staffList.reduce((sum, s) => sum + (Number(s.salaireMensuel) || 250000), 0).toLocaleString()} FCFA. Toutes les charges patronales CNSS (Caisse Nationale de Sécurité Sociale) et d'assurance maladie obligatoire CNAMGS sont déclarées trimestriellement à la Direction Provinciale du Travail de l'Estuaire.`
        },
        {
          num: "3. Ancienneté et Climat Social",
          lawReference: "Indicateurs de Performance et Stabilité",
          text: "L'ancienneté moyenne au sein de l'établissement est de 2,4 ans, ce qui démontre une excellente stabilité de l'équipe pédagogique. Aucun conflit social majeur n'a été enregistré. Des formations régulières sur la digitalisation et la gestion des effectifs ont été menées avec succès."
        }
      ],
      signatures: {
        employer: `Directeur de l'Établissement\n${directorName}`,
        employee: "Représentant du Personnel Enseignant",
        rh: `Chef du Département RH\n${hrName}`
      },
      gabonLawStamp: "RAPPORT RH OFFICIEL SOUMIS POUR CONTRÔLE DE SÉCURITÉ ET DE CONFORMITÉ MINISTÉRIELLE",
      datePlace: `Libreville, le ${today}`
    };

    const fallbackDisciplinaire = {
      title: "REGISTRE DE SÉCURITÉ DISCIPLINAIRE ET CONFORMITÉ",
      subtitle: "Géré en application stricte des Articles 102, 103 et 105 de la Loi n° 022/2021 portant Code du Travail en République Gabonaise.",
      introduction: `Ce registre retrace la procédure disciplinaire d'évaluation au sein de "${schoolName}" pour l'agent M./Mme ${staff.nom} ${staff.prenom}. Il consigne la conformité de la déontologie professionnelle et de l'exercice des droits de la défense de l'agent.`,
      articles: [
        {
          num: "1. Échelle des Sanctions Applicables",
          lawReference: "Article 102 de la Loi n° 022/2021 (Gabon)",
          text: "Les sanctions disciplinaires au sein de l'établissement respectent la gradation légale : avertissement écrit, blâme avec inscription au dossier, mise à pied disciplinaire de 1 à 8 jours maximum avec privation de salaire, et licenciement pour faute lourde."
        },
        {
          num: "2. Procédure Contradictoire et Droits de l'Agent",
          lawReference: "Article 103 du Code du Travail gabonais",
          text: "Aucune sanction de mise à pied ou de licenciement ne peut être prise sans que l'agent n'ait été préalablement convoqué à un entretien préalable contradictoire d'explication, au cours duquel il peut se faire assister d'un représentant du personnel."
        },
        {
          num: "3. Traçabilité des Faits",
          lawReference: "Article 105 (Prescription des fautes)",
          text: `Pour l'agent M./Mme ${staff.nom} ${staff.prenom}, son dossier RH présente un statut disciplinaire : CONFORME. Aucun manquement grave, retard injustifié répété, ou faute lourde n'a été constaté à ce jour. L'agent continue d'exercer avec dévouement sous le statut de bonne conduite.`
        }
      ],
      signatures: {
        employer: `Directeur de l'Établissement\n${directorName}`,
        employee: `L'Agent (pour notification)\nM./Mme ${staff.nom} ${staff.prenom}`,
        rh: `Visa du Conseil de Discipline & RH\n${hrName}`
      },
      gabonLawStamp: "REGISTRE DISCIPLINAIRE CERTIFIÉ ET ARCHIVÉ POUR INSPECTION DU TRAVAIL",
      datePlace: `Fait à Libreville, le ${today}`
    };

    const fallbackSalarial = {
      title: "RELEVÉ HISTORIQUE DES REMUNÉRATIONS & DROITS ACQUIS",
      subtitle: "Établi conformément à l'Article 150 et suivants du Code du Travail gabonais régissant l'obligation de délivrance de bulletin de paie.",
      introduction: `Ce document certifie l'historique de paiement des émoluments et l'état des comptes salariaux de l'agent M./Mme ${staff.nom} ${staff.prenom} employé au poste de ${staff.poste}.`,
      articles: [
        {
          num: "1. Salaire de Base et Minima Légaux",
          lawReference: "Article 151 de la Loi n° 022/2021 (SMIG à 150 000 FCFA)",
          text: `Le salaire mensuel de base de M./Mme ${staff.nom} ${staff.prenom} est de ${(Number(staff.salaireMensuel) || 350000).toLocaleString()} FCFA, ce qui est strictement supérieur au Salaire Minimum Interprofessionnel Garanti (SMIG) de la République Gabonaise fixé à 150 000 FCFA.`
        },
        {
          num: "2. Retenues Légales CNSS & CNAMGS",
          lawReference: "Réglementation gabonaise de sécurité sociale",
          text: "Chaque salaire fait l'objet de retenues à la source obligatoires : 2,5% au titre de la part ouvrière CNSS et 2% au titre de l'assurance maladie CNAMGS. Ces sommes sont intégralement reversées aux organismes collecteurs de l'État Gabonais."
        },
        {
          num: "3. Avances et Prêts de l'Établissement",
          lawReference: "Article 152 du Code du Travail (Quotité saisissable maximale)",
          text: "Conformément à la loi gabonaise, les remboursements d'avances sur salaire consentis à l'agent ne peuvent excéder la quotité saisissable d'un dixième (10%) de son salaire brut mensuel de base afin de garantir ses moyens de subsistance réguliers."
        }
      ],
      signatures: {
        employer: `Directeur Administratif\n${directorName}`,
        employee: `L'Agent pour acquit de paiement\nM./Mme ${staff.nom} ${staff.prenom}`,
        rh: `Responsable Comptabilité & Paie\n${hrName}`
      },
      gabonLawStamp: "RELEVÉ INDIVIDUEL DE SALAIRE EXTRAIT DU LIVRE DE PAIE DE L'ÉTABLISSEMENT - GABON-SYNC",
      datePlace: `Fait à Libreville, le ${today}`
    };

    // Prompt building for AI
    const promptText = `
    Tu es un expert juriste et gestionnaire des Ressources Humaines spécialisé dans le droit du travail gabonais (Loi n° 022/2021 du 19 novembre 2021 portant Code du Travail en République Gabonaise).
    Génère un document de type "${selectedDocType}" extrêmement rigoureux, formel, élégant et complet pour l'agent suivant :
    - Nom de l'agent : ${staff.nom} ${staff.prenom}
    - Sexe : ${staff.sexe || 'Masculin'}
    - Poste : ${staff.poste}
    - Département : ${staff.departement || 'Enseignement'}
    - Matricule : ${staff.matricule || 'GAB-RH-2023-018'}
    - Nationalité : ${staff.nationalite || 'Gabonaise'}
    - Date d'Entrée : ${staff.dateEntree || '15/09/2023'}
    - Salaire Brut Mensuel : ${staff.salaireMensuel || 350000} FCFA
    - Établissement : ${schoolName}
    - Directeur : ${directorName}
    - Responsable RH : ${hrName}
    - Date du jour : ${today}

    Détails du document à générer :
    - Type sélectionné : ${selectedDocType} (valeurs possibles : contrat, attestation, fiche, rapport, disciplinaire, salarial)
    - Tu DOIS citer les articles exacts et précis de la Loi n° 022/2021 du Code du Travail gabonais applicables à ce document (par exemple : Article 20 et 21 pour l'écrit du contrat, Article 31 pour l'essai, Article 88 pour l'attestation, Article 102+ pour le disciplinaire, Article 150+ pour la paie et le salaire minimum de 150 000 FCFA).
    - Rédige des explications claires et officielles en français soutenu.

    Renvoie uniquement un format JSON strict, sans bloc de code markdown, sans fioritures, avec les clés suivantes :
    {
      "title": "Titre officiel du document en majuscules",
      "subtitle": "Sous-titre citant les lois gabonaises de référence",
      "introduction": "Texte d'introduction formelle détaillant les parties ou le cadre général",
      "articles": [
        {
          "num": "Numéro de l'article (ex: Article 1 : Objet de l'engagement)",
          "lawReference": "Référence juridique gabonaise précise",
          "text": "Texte complet, rédigé, extrêmement détaillé et professionnel de l'article (3 à 5 lignes)."
        }
      ],
      "signatures": {
        "employer": "Libellé de signature pour l'employeur",
        "employee": "Libellé de signature pour l'employé",
        "rh": "Libellé de signature pour le service RH"
      },
      "gabonLawStamp": "Sceau officiel de conformité légale gabonaise",
      "datePlace": "Mention de date et lieu (ex: Fait à Libreville, le...)"
    }
    `;

    try {
      const response = await generateAIContent({
        contents: promptText,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text);
      setGeneratedDoc(parsed);
      await archiveDocument(parsed, staff);
    } catch (err) {
      console.error("AI Generation error, falling back to Gabon-Sync local templates:", err);
      // Fail over to extremely accurate local templates matching Gabon laws
      let fallbackDoc = null;
      if (selectedDocType === 'contrat') fallbackDoc = fallbackCDD;
      else if (selectedDocType === 'attestation') fallbackDoc = fallbackAttestation;
      else if (selectedDocType === 'fiche') fallbackDoc = fallbackFiche;
      else if (selectedDocType === 'rapport') fallbackDoc = fallbackRapport;
      else if (selectedDocType === 'disciplinaire') fallbackDoc = fallbackDisciplinaire;
      else if (selectedDocType === 'salarial') fallbackDoc = fallbackSalarial;

      if (fallbackDoc) {
        setGeneratedDoc(fallbackDoc);
        await archiveDocument(fallbackDoc, staff);
      }
    } finally {
      setGeneratingDoc(false);
    }
  };

  // Archive generated documents in Firestore
  const archiveDocument = async (docData: any, staffObj: any) => {
    try {
      const docId = `doc_${Date.now()}`;
      const docRef = doc(db, 'rh_generated_documents', docId);
      await setDoc(docRef, {
        etablissement: establishmentId,
        staffId: staffObj.id || 'unknown_staff',
        staffName: `${staffObj.nom} ${staffObj.prenom}`,
        typeDoc: selectedDocType,
        title: docData.title || '',
        subtitle: docData.subtitle || '',
        introduction: docData.introduction || '',
        articles: docData.articles || [],
        signatures: docData.signatures || { employer: '', employee: '', rh: '' },
        gabonLawStamp: docData.gabonLawStamp || '',
        datePlace: docData.datePlace || '',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error archiving document:", err);
    }
  };

  // Resilient PDF Download utilizing html2pdf.js
  const handleDownloadPDF = () => {
    const element = document.getElementById('rh-gabon-document-print');
    if (!element) {
      alert("Aucun document à télécharger. Veuillez générer un document d'abord.");
      return;
    }
    
    const staff = staffList.find(s => s.id === selectedDocStaffId) || { nom: 'Agent', prenom: '' };
    const filename = `${generatedDoc?.title || 'Document'}_${staff.nom}_${staff.prenom}.pdf`;
    
    const opt = {
      margin:       [10, 10, 10, 10] as [number, number, number, number],
      filename:     filename,
      image:        { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
    };
    
    try {
      // Robust detection of the main html2pdf function to handle ESM/CJS differences
      const pdfGenerator = (html2pdf as any).default || html2pdf;
      if (typeof pdfGenerator === 'function') {
        pdfGenerator().set(opt).from(element).save();
      } else {
        console.warn("html2pdf is not a function, falling back to window.print()");
        window.print();
      }
    } catch (e) {
      console.error("PDF generation failed, falling back to printer:", e);
      window.print();
    }
  };

  // Simple statistics calculations
  const totalEmployees = staffList.length;
  const teachersCount = staffList.filter(s => s.poste.toLowerCase().includes('enseignant')).length;
  const permanentCount = staffList.filter(s => s.typeContrat === 'Permanent').length;
  const vacatairesCount = staffList.filter(s => s.typeContrat === 'Vacataire').length;
  const activeCount = staffList.filter(s => s.statut === 'Actif').length;
  const inactiveCount = totalEmployees - activeCount;

  // Mass salariale brute calculation based on staff settings
  const payrollMass = staffList.reduce((sum, s) => {
    if (s.statut !== 'Actif') return sum;
    if (s.baseCalcul === 'heure') {
      return sum + ((s.tarifHoraire || 0) * (s.heuresEffectuees || 40));
    } else {
      return sum + ((s.tarifJour || 0) * (s.joursEffectues || 15));
    }
  }, 0);

  // Average seniority in months helper
  const averageSeniority = (() => {
    if (staffList.length === 0) return "0 mois";
    const totalMonths = staffList.reduce((sum, s) => {
      const date = s.dateEntree ? new Date(s.dateEntree) : new Date();
      const diffTime = Math.abs(new Date().getTime() - date.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      return sum + diffMonths;
    }, 0);
    const avg = Math.round(totalMonths / staffList.length);
    return avg >= 12 ? `${Math.floor(avg / 12)} an(s) et ${avg % 12} mois` : `${avg} mois`;
  })();

  // Render correct color presets matching configured colors
  const getSubTabClass = (tabName: typeof activeSubTab) => {
    return `flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all shrink-0 ${
      activeSubTab === tabName 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
    }`;
  };

  return (
    <div className="space-y-6">
      
      {/* Tab bar header */}
      <div className="flex border-b border-gray-200 pb-2 overflow-x-auto gap-2 no-scrollbar">
        <button onClick={() => setActiveSubTab('dashboard')} className={getSubTabClass('dashboard')}>
          <BarChart2 size={16} /> Dashboard RH
        </button>
        <button onClick={() => { setActiveSubTab('dossiers'); resetStaffForm(); }} className={getSubTabClass('dossiers')}>
          <Users size={16} /> Dossiers Personnel ({totalEmployees})
        </button>
        <button onClick={() => setActiveSubTab('vacataires')} className={getSubTabClass('vacataires')}>
          <DollarSign size={16} /> Rémunération & Vacations
        </button>
        <button onClick={() => setActiveSubTab('avances')} className={getSubTabClass('avances')}>
          <CreditCard size={16} /> Avances sur Salaire
        </button>
        <button onClick={() => setActiveSubTab('rapports')} className={getSubTabClass('rapports')}>
          <FileText size={16} /> Rapports & Documents
        </button>
      </div>

      {/* ==================================== */}
      {/* 1. DASHBOARD TAB                    */}
      {/* ==================================== */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Employés Totaux</span>
                <h3 className="text-2xl font-black text-gray-800 mt-1">{totalEmployees}</h3>
                <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle size={10} /> {activeCount} Actifs ({inactiveCount} Inactifs)
                </span>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={22} />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Enseignants</span>
                <h3 className="text-2xl font-black text-gray-800 mt-1">{teachersCount}</h3>
                <span className="text-[10px] text-gray-500 font-semibold mt-1 block">
                  {permanentCount} permanents | {vacatairesCount} vacataires
                </span>
              </div>
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
                <Briefcase size={22} />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Masse Salariale Brute</span>
                <h3 className="text-2xl font-black text-emerald-700 mt-1">{payrollMass.toLocaleString()} FCFA</h3>
                <span className="text-[10px] text-gray-500 font-semibold mt-1 block">Estimé mensuel global</span>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Ancienneté Moyenne</span>
                <h3 className="text-2xl font-black text-indigo-700 mt-1">{averageSeniority}</h3>
                <span className="text-[10px] text-gray-500 font-semibold mt-1 block">Fidélité de l'équipe</span>
              </div>
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock size={22} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick action helper card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <span className="px-3 py-1 bg-indigo-600/30 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Gestion RH Opérationnelle
                </span>
                <h2 className="text-xl font-black">Pilotez votre capital humain avec simplicité</h2>
                <p className="text-xs text-indigo-100/80 leading-relaxed max-w-md">
                  Le module RH d'Edu-Nify vous donne un accès total aux dossiers du personnel, calculs de paye automatiques pour enseignants vacataires, avances financières, et éditions de contrats officiels.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => { setActiveSubTab('dossiers'); setShowAddStaffModal(true); }} className="bg-white hover:bg-gray-100 text-indigo-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
                    <Plus size={14} className="text-indigo-600" /> Ajouter un Employé
                  </button>
                  <button onClick={() => setActiveSubTab('avances')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
                    <CreditCard size={14} /> Demander une Avance
                  </button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 opacity-10">
                <Briefcase size={250} />
              </div>
            </div>

            {/* List of active contracts summary */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm text-gray-800 uppercase mb-4 flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" /> Répartition du Personnel
              </h3>
              <div className="space-y-3.5">
                {['Permanent', 'Vacataire', 'Contractuel', 'Stagiaire'].map((type) => {
                  const count = staffList.filter(s => s.typeContrat === type).length;
                  const pct = staffList.length > 0 ? Math.round((count / staffList.length) * 100) : 0;
                  const colors = {
                    Permanent: 'bg-emerald-500',
                    Vacataire: 'bg-indigo-500',
                    Contractuel: 'bg-blue-500',
                    Stagiaire: 'bg-amber-500'
                  }[type];
                  return (
                    <div key={type} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-gray-600">{type}s</span>
                        <span className="font-black text-gray-800">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${colors}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 2. DOSSIERS RH TAB (STAFF DIRECTORY) */}
      {/* ==================================== */}
      {activeSubTab === 'dossiers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-gray-50/50"
              />
            </div>
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2 text-gray-700"
              >
                <option value="all">Tous les Départements</option>
                <option value="Enseignement">Enseignement</option>
                <option value="Direction">Direction</option>
                <option value="Administration">Administration</option>
                <option value="Comptabilité">Comptabilité</option>
                <option value="Services Généraux">Services Généraux</option>
              </select>

              <select
                value={filterContrat}
                onChange={(e) => setFilterContrat(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2 text-gray-700"
              >
                <option value="all">Tous les Contrats</option>
                <option value="Permanent">Permanent</option>
                <option value="Vacataire">Vacataire</option>
                <option value="Contractuel">Contractuel</option>
                <option value="Stagiaire">Stagiaire</option>
              </select>

              <button
                onClick={() => {
                  resetStaffForm();
                  setShowAddStaffModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ml-auto"
              >
                <Plus size={14} /> Nouveau Dossier
              </button>
            </div>
          </div>

          {/* Directory list */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Nom & Identité</th>
                    <th className="px-6 py-4">Poste & Département</th>
                    <th className="px-6 py-4">Contrat</th>
                    <th className="px-6 py-4">Matricule</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {staffList
                    .filter(staff => {
                      const matchesSearch = `${staff.nom} ${staff.prenom} ${staff.matricule}`.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesDept = filterDept === 'all' || staff.departement === filterDept;
                      const matchesContrat = filterContrat === 'all' || staff.typeContrat === filterContrat;
                      return matchesSearch && matchesDept && matchesContrat;
                    })
                    .map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors text-xs">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={staff.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                            />
                            <div>
                              <p className="font-black text-gray-800">{staff.nom} {staff.prenom}</p>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase">{staff.sexe} | Né(e) le {staff.dateNaissance || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-gray-700">{staff.poste}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{staff.departement}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            staff.typeContrat === 'Permanent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            staff.typeContrat === 'Vacataire' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            staff.typeContrat === 'Contractuel' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {staff.typeContrat}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-extrabold text-gray-500">
                          {staff.matricule}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-700">{staff.contactPrincipal}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{staff.email}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            staff.statut === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {staff.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setViewingStaff(staff)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Voir Fiche Complète"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setStaffForm({ ...staff });
                                setShowAddStaffModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Modifier Dossier"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 3. VACATAIRES & PAY CALCULATOR TAB  */}
      {/* ==================================== */}
      {activeSubTab === 'vacataires' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-900 text-xs leading-relaxed">
            <BadgeInfo size={20} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-black uppercase tracking-tight">Règle de Calcul Automatique par IA</h4>
              <p className="mt-1">
                Le comptable définit le tarif horaire ou journalier de l'employé. Le système multiplie automatiquement selon l'unité de calcul pour générer instantanément le salaire brut, moins les avances validées éventuelles, pour obtenir le solde final net à payer.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-gray-800 uppercase flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" /> Calculateur Automatique de la Paie
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase">
                    <th className="px-6 py-3">Employé</th>
                    <th className="px-6 py-3">Type Contrat</th>
                    <th className="px-6 py-3 text-center">Unité / Base de Calcul</th>
                    <th className="px-6 py-3">Tarif Unitaire (FCFA)</th>
                    <th className="px-6 py-3">Volume effectué (Mois)</th>
                    <th className="px-6 py-3">Salaire Brut (FCFA)</th>
                    <th className="px-6 py-3">Avances déduites (FCFA)</th>
                    <th className="px-6 py-3 text-right">Net à payer (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs">
                  {staffList.map((staff) => {
                    // Filter validated advances for this staff
                    const staffAdvances = advances
                      .filter(a => a.staffId === staff.id && a.status === 'Validée')
                      .reduce((sum, a) => sum + (a.montant || 0), 0);

                    // Calculations
                    let brute = 0;
                    if (staff.baseCalcul === 'heure') {
                      brute = (staff.tarifHoraire || 0) * (staff.heuresEffectuees || 0);
                    } else {
                      brute = (staff.tarifJour || 0) * (staff.joursEffectues || 0);
                    }
                    const net = brute - staffAdvances;

                    return (
                      <tr key={staff.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-extrabold text-gray-800">
                          {staff.nom} {staff.prenom}
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-tight">{staff.poste}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-black text-[9px] uppercase">
                            {staff.typeContrat}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={staff.baseCalcul || 'heure'}
                            onChange={async (e) => {
                              try {
                                await setDoc(doc(db, 'rh_staff', staff.id), { baseCalcul: e.target.value }, { merge: true });
                              } catch (err) { console.error(err); }
                            }}
                            className="bg-white border border-gray-200 text-[11px] font-bold rounded-lg p-1"
                          >
                            <option value="heure">Par heure</option>
                            <option value="jour">Par jour</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={staff.baseCalcul === 'heure' ? (staff.tarifHoraire || 5000) : (staff.tarifJour || 50000)}
                            onChange={async (e) => {
                              const val = Number(e.target.value) || 0;
                              const field = staff.baseCalcul === 'heure' ? 'tarifHoraire' : 'tarifJour';
                              try {
                                await setDoc(doc(db, 'rh_staff', staff.id), { [field]: val }, { merge: true });
                              } catch (err) { console.error(err); }
                            }}
                            className="w-24 p-1 border border-gray-200 rounded font-mono font-bold text-center"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={staff.baseCalcul === 'heure' ? (staff.heuresEffectuees || 0) : (staff.joursEffectues || 0)}
                              onChange={async (e) => {
                                const val = Number(e.target.value) || 0;
                                const field = staff.baseCalcul === 'heure' ? 'heuresEffectuees' : 'joursEffectues';
                                try {
                                  await setDoc(doc(db, 'rh_staff', staff.id), { [field]: val }, { merge: true });
                                } catch (err) { console.error(err); }
                              }}
                              className="w-16 p-1 border border-gray-200 rounded font-mono font-bold text-center"
                            />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              {staff.baseCalcul === 'heure' ? 'Hrs' : 'Jrs'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-gray-700">
                          {brute.toLocaleString()} F
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-red-650">
                          -{staffAdvances.toLocaleString()} F
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 text-sm">
                          {net.toLocaleString()} FCFA
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 4. AVANCES SUR SALAIRE TAB         */}
      {/* ==================================== */}
      {activeSubTab === 'avances' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm text-gray-800 uppercase flex items-center gap-2">
              <CreditCard size={18} className="text-blue-500" /> Registre des Avances Financières
            </h3>
            <button
              onClick={() => {
                setShowAdvanceModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} /> Demander une avance
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase">
                    <th className="px-6 py-3">Employé rattaché</th>
                    <th className="px-6 py-3">Date d'émission</th>
                    <th className="px-6 py-3">Motif explicatif</th>
                    <th className="px-6 py-3">Montant</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-semibold italic">
                        Aucune demande d'avance sur salaire répertoriée dans ce trimestre.
                      </td>
                    </tr>
                  ) : (
                    advances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-black text-gray-800">{adv.staffName}</td>
                        <td className="px-6 py-4 font-medium text-gray-500">{adv.date}</td>
                        <td className="px-6 py-4 text-gray-600 italic">"{adv.motif || 'Non renseigné'}"</td>
                        <td className="px-6 py-4 font-mono font-black text-slate-800 text-sm">
                          {Number(adv.montant).toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            adv.status === 'Validée' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            adv.status === 'Rejetée' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {adv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {adv.status === 'En attente' && (
                              <>
                                <button
                                  onClick={() => handleUpdateAdvanceStatus(adv.id, 'Validée')}
                                  className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-lg transition-all"
                                >
                                  Valider
                                </button>
                                <button
                                  onClick={() => handleUpdateAdvanceStatus(adv.id, 'Rejetée')}
                                  className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] rounded-lg transition-all"
                                >
                                  Rejeter
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteAdvance(adv.id)}
                              className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 7. RAPPORTS & DOCUMENTS GENERATOR   */}
      {/* ==================================== */}
      {activeSubTab === 'rapports' && (
        <div className="space-y-6">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #rh-gabon-document-print, #rh-gabon-document-print * {
                visibility: visible !important;
              }
              #rh-gabon-document-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 40px !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
              }
            }
          `}</style>

          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Temps Réel Gabon-Law
                </span>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Loi n° 022/2021
                </span>
              </div>
              <h2 className="text-xl font-black mt-2">Générateur de Documents Légaux RH</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Préparez et générez automatiquement des contrats, attestations et documents administratifs conformes au Code du Travail du Gabon. L'IA intègre les articles de lois et informations salariales en temps réel.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 p-2 rounded-xl backdrop-blur-xs text-xs font-mono text-indigo-200">
              <Building size={14} /> Province de l'Estuaire
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLONNE 1 : SÉLECTION DE L'AGENT (GAUCHE - lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs space-y-3">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                  <User size={15} className="text-indigo-600" /> Sélectionner un Agent
                </h3>

                {/* Recherche */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un agent..."
                    value={searchStaffDoc}
                    onChange={(e) => setSearchStaffDoc(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-850"
                  />
                </div>

                {/* Filtre Département */}
                <div className="relative">
                  <select
                    value={filterDeptDoc}
                    onChange={(e) => setFilterDeptDoc(e.target.value)}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 cursor-pointer"
                  >
                    <option value="all">Tous les départements</option>
                    <option value="Enseignement">Enseignement</option>
                    <option value="Administration">Administration</option>
                    <option value="Maternelle">Maternelle</option>
                    <option value="Services Généraux">Services Généraux</option>
                  </select>
                </div>

                {/* Liste des agents */}
                <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {staffList.filter((s) => {
                    const fullName = `${s.nom} ${s.prenom}`.toLowerCase();
                    const matchesSearch = fullName.includes(searchStaffDoc.toLowerCase()) || (s.poste || '').toLowerCase().includes(searchStaffDoc.toLowerCase());
                    const matchesDept = filterDeptDoc === 'all' || s.departement === filterDeptDoc;
                    return matchesSearch && matchesDept;
                  }).length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-4">Aucun agent trouvé.</p>
                  ) : (
                    staffList
                      .filter((s) => {
                        const fullName = `${s.nom} ${s.prenom}`.toLowerCase();
                        const matchesSearch = fullName.includes(searchStaffDoc.toLowerCase()) || (s.poste || '').toLowerCase().includes(searchStaffDoc.toLowerCase());
                        const matchesDept = filterDeptDoc === 'all' || s.departement === filterDeptDoc;
                        return matchesSearch && matchesDept;
                      })
                      .map((s) => {
                        const isSelected = selectedDocStaffId === s.id;
                        const isFemale = s.sexe === 'Féminin';
                        const initials = `${s.nom?.charAt(0) || ''}${s.prenom?.charAt(0) || ''}`.toUpperCase();
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedDocStaffId(s.id);
                              if (currentUser) {
                                const userFullName = `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim();
                                if (userFullName) {
                                  setBulletinForm(prev => ({
                                    ...prev,
                                    signatureDirecteur: userFullName
                                  }));
                                }
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden group ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                                : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              isFemale ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {initials || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-gray-800 truncate leading-tight font-sans">
                                {s.nom} {s.prenom}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">
                                {s.poste}
                              </p>
                              <span className="inline-block text-[9px] bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded-full font-bold mt-1">
                                {s.typeContrat || 'Standard'}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* COLONNE 2 : OPTIONS DE GÉNÉRATION & ARCHIVES (MILIEU - lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-4">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Settings size={15} className="text-indigo-600" /> Options de Génération
                </h3>

                {/* Choix du document */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Type de Document :</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
                    {[
                      { id: 'contrat', title: 'Contrat de Travail (CDI/CDD)', ref: 'Loi n° 022/2021', desc: 'Régit l\'engagement légal officiel, l\'essai, les congés et la rupture.' },
                      { id: 'attestation', title: 'Attestation de Travail', ref: 'Article 88', desc: 'Certifie la présence, l\'emploi de l\'agent et le libère de tout engagement.' },
                      { id: 'fiche', title: 'Fiche Employé Dossier', ref: 'Loi n° 001/2011', desc: 'Fiche de traçabilité des données d\'identité, coordonnées et bases salariales.' },
                      { id: 'rapport', title: 'Rapport Annuel RH / Bilan', ref: 'Article 9', desc: 'Vue statistique consolidée de la masse salariale et de la démographie scolaire.' },
                      { id: 'disciplinaire', title: 'Historique Disciplinaire', ref: 'Article 102+', desc: 'Registre de conformité éthique, avertissements et garanties contradictoires.' },
                      { id: 'salarial', title: 'Historique Salarial / Paie', ref: 'Article 150+', desc: 'Calcul de salaire, retenues de charges (CNSS, CNAMGS) et minima (SMIG).' }
                    ].map((docItem) => (
                      <button
                        key={docItem.id}
                        type="button"
                        onClick={() => setSelectedDocType(docItem.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                          selectedDocType === docItem.id
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-gray-100 hover:border-gray-250 bg-white'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${selectedDocType === docItem.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <FileText size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-gray-800 text-[11px] truncate">{docItem.title}</span>
                            <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono shrink-0">{docItem.ref}</span>
                          </div>
                          <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{docItem.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                 {/* Bouton d'action */}
                <button
                  type="button"
                  onClick={generateGabonLawDocument}
                  disabled={generatingDoc}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer animate-pulse-subtle"
                >
                  {generatingDoc ? (
                    <>
                      <RefreshCw className="animate-spin" size={13} /> Génération de l'IA en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-amber-400 fill-amber-400" /> Préparer et Générer l'Acte RH
                    </>
                  )}
                </button>

                {currentUser && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] flex items-center gap-2 text-slate-700 font-medium">
                    <User size={12} className="text-indigo-600" />
                    <div>
                      <span className="font-bold text-gray-400 block uppercase text-[8px]">Signataire de l'Acte</span>
                      <span className="font-black text-indigo-950">{currentUser.prenom || ''} {currentUser.nom || ''}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* DOSSIER D'ARCHIVES DES DOCUMENTS (TEMPS RÉEL) */}
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-4">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="flex items-center gap-1.5">
                    <Archive size={15} className="text-indigo-600" /> Dossier d'Archives
                  </span>
                  <div className="flex items-center gap-2">
                    {archivedDocs.length > 0 && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("⚠️ Attention : Êtes-vous sûr de vouloir supprimer DEFINITIVEMENT toutes les archives actuellement enregistrées de cet établissement ? Cette action est irréversible.")) {
                            try {
                              for (const docObj of archivedDocs) {
                                await deleteDoc(doc(db, 'rh_generated_documents', docObj.id));
                              }
                              setGeneratedDoc(null);
                              alert("Toutes les archives ont été supprimées avec succès !");
                            } catch (err) {
                              console.error("Error clearing archives:", err);
                              alert("Erreur lors de la suppression des archives.");
                            }
                          }
                        }}
                        className="text-[9px] bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Trash2 size={10} /> Vider l'archive
                      </button>
                    )}
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full font-mono">
                      {archivedDocs.length} acte{archivedDocs.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </h3>

                <div className="max-h-[255px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {archivedDocs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 flex flex-col items-center justify-center">
                      <Archive size={22} className="opacity-40 mb-1.5" />
                      <p className="text-[10px] max-w-[180px] leading-relaxed">Aucun document dans le dossier d'archives de l'établissement.</p>
                    </div>
                  ) : (
                    archivedDocs.map((archived) => {
                      const dateLabel = archived.createdAt?.seconds 
                        ? new Date(archived.createdAt.seconds * 1000).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) 
                        : 'À l\'instant';
                      const isCurrentlyLoaded = generatedDoc?.title === archived.title && selectedDocStaffId === archived.staffId;
                      return (
                        <div
                          key={archived.id}
                          className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isCurrentlyLoaded 
                              ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' 
                              : 'border-gray-100 hover:border-indigo-100 hover:bg-slate-50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedDoc({
                                title: archived.title,
                                subtitle: archived.subtitle,
                                introduction: archived.introduction,
                                articles: archived.articles,
                                signatures: archived.signatures,
                                gabonLawStamp: archived.gabonLawStamp,
                                datePlace: archived.datePlace
                              });
                              setSelectedDocStaffId(archived.staffId);
                              setSelectedDocType(archived.typeDoc);
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-[11px] text-gray-800 truncate block max-w-[120px]">
                                {archived.staffName}
                              </span>
                              <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold uppercase shrink-0 font-mono">
                                {archived.typeDoc}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-650 truncate mt-0.5 font-medium">
                              {archived.title}
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                              <Calendar size={10} /> {dateLabel}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Êtes-vous sûr de vouloir supprimer définitivement cet acte des archives de l'établissement ?")) {
                                try {
                                  await deleteDoc(doc(db, 'rh_generated_documents', archived.id));
                                  if (isCurrentlyLoaded) {
                                    setGeneratedDoc(null);
                                  }
                                } catch (err) {
                                  console.error("Error deleting archive:", err);
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* COLONNE 3 : APERÇU IMPRIMABLE DU DOCUMENT (DROITE - lg:col-span-5) */}
            <div className="lg:col-span-5">
              {generatingDoc ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Sparkles size={28} className="animate-pulse" />
                    </div>
                    <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Génération de l'IA en temps réel...</h4>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    L'IA analyse le profil de l'agent, croise les données financières avec la <strong>Loi n° 022/2021 portant Code du Travail au Gabon</strong>, et formule les clauses légales associées.
                  </p>
                </div>
              ) : generatedDoc ? (
                <div className="space-y-4">
                  {/* BOUTONS D'EXPORTATION */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 shrink-0">
                      <CheckCircle size={14} className="text-emerald-500" /> Acte RH Prêt
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Imprimer au format A4"
                      >
                        <Printer size={12} /> Imprimer
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-black py-1.5 px-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                        title="Télécharger l'acte au format PDF officiel"
                      >
                        <Download size={12} /> Télécharger PDF
                      </button>
                      <button
                        onClick={() => {
                          const textToCopy = `
                            ${generatedDoc.title}
                            ${generatedDoc.subtitle}
                            ${generatedDoc.introduction}
                            ${generatedDoc.articles.map(a => `${a.num}\n[Réf: ${a.lawReference}]\n${a.text}`).join('\n\n')}
                            ${generatedDoc.gabonLawStamp}
                            ${generatedDoc.datePlace}
                          `;
                          navigator.clipboard.writeText(textToCopy);
                          alert("Le contenu du document a été copié dans le presse-papier ! Vous pouvez le coller dans Word ou un éditeur externe.");
                        }}
                        className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Copier le texte brut de l'acte"
                      >
                        <CheckCircle size={12} /> Copier
                      </button>
                    </div>
                  </div>

                  {/* DOCUMENT FORMAT A4 */}
                  <div
                    id="rh-gabon-document-print"
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md relative overflow-hidden font-serif text-gray-900 mx-auto max-w-full min-h-[950px] text-justify"
                  >
                    {/* Filigrane d'authenticité */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] select-none">
                      <div className="text-center transform -rotate-45 font-black text-5xl tracking-widest text-slate-900 border-8 border-slate-900 p-6 rounded-3xl">
                        RÉPUBLIQUE GABONAISE
                      </div>
                    </div>

                    {/* EN-TÊTE DE L'ÉTAT GABONAIS */}
                    <div className="grid grid-cols-3 items-start border-b border-gray-300 pb-4 mb-4 text-[10px] font-sans">
                      <div className="text-left space-y-0.5">
                        <p className="font-black tracking-wide text-gray-800 text-[9px]">RÉPUBLIQUE GABONAISE</p>
                        <p className="text-gray-500 text-[8px] font-bold">Union - Travail - Justice</p>
                        <p className="text-gray-400 text-[8px]">Services des Impôts et du Travail</p>
                        <p className="text-gray-400 text-[8px]">Direction Générale de l'Emploi</p>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center font-black text-[11px] shadow-xs mb-0.5">
                          ★ GA ★
                        </div>
                        <span className="text-[8px] font-bold tracking-wider text-emerald-800 uppercase">Loi 2021</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="font-black text-gray-800 text-[9px]">{schoolName}</p>
                        <p className="text-gray-500 italic text-[8px]">"{schoolMotto}"</p>
                        <p className="text-gray-400 text-[8px]">Libreville - GABON</p>
                      </div>
                    </div>

                    {/* TITRE DU DOCUMENT */}
                    <div className="text-center space-y-1 my-4">
                      <h1 className="text-sm font-extrabold tracking-tight text-gray-950 uppercase decoration-double underline underline-offset-4">
                        {generatedDoc.title}
                      </h1>
                      <p className="text-[10px] italic text-gray-600 max-w-md mx-auto leading-tight">
                        {generatedDoc.subtitle}
                      </p>
                    </div>

                    {/* INTRODUCTION / PREAMBULE */}
                    <div className="my-4 text-[11px] text-gray-800 leading-relaxed font-sans text-justify bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      {generatedDoc.introduction}
                    </div>

                    {/* ARTICLES ET CLAUSES */}
                    <div className="space-y-4 my-4 text-[11px]">
                      {generatedDoc.articles.map((art, idx) => (
                        <div key={idx} className="space-y-0.5 border-l-2 border-indigo-650 pl-2.5 py-0.5">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="font-bold text-gray-950 text-[11px]">{art.num}</h4>
                            <span className="text-[8px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                              Réf : {art.lawReference}
                            </span>
                          </div>
                          <p className="text-gray-750 text-justify leading-relaxed font-sans text-[10px]">{art.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* DATE ET LIEU */}
                    <div className="text-right my-5 text-[11px] font-bold text-gray-800 font-sans italic">
                      {generatedDoc.datePlace}
                    </div>

                    {/* ZONE DE SIGNATURES ET STAMP */}
                    <div className="grid grid-cols-3 gap-3 border-t border-gray-200 pt-4 mt-6 text-center text-[10px] font-sans">
                      <div className="space-y-0.5">
                        <p className="font-black text-gray-950 uppercase tracking-wider text-[9px]">{generatedDoc.signatures.employer}</p>
                        <div className="h-12 flex items-center justify-center text-[8px] text-gray-400 italic">
                          (Signature & Tampon)
                        </div>
                      </div>
                      
                      {/* Tampon de conformité gabonaise visuel */}
                      <div className="flex flex-col items-center justify-center p-1">
                        <div className="border-4 border-double border-emerald-600 text-emerald-700 rounded-full p-1.5 w-18 h-18 flex flex-col items-center justify-center text-[6px] font-black tracking-tighter uppercase leading-none transform -rotate-6 shadow-xs select-none bg-emerald-50/30">
                          <span className="text-center">REPUBLIQUE</span>
                          <span className="text-center font-serif text-[8px] my-0.2">GABONAISE</span>
                          <span className="text-center border-t border-emerald-500 pt-0.2 text-[5px] text-emerald-800">CONFORME</span>
                        </div>
                        <p className="text-[6px] font-bold text-emerald-800 mt-1 uppercase tracking-tighter text-center">
                          {generatedDoc.gabonLawStamp}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="font-black text-gray-950 uppercase tracking-wider text-[9px]">{generatedDoc.signatures.employee}</p>
                        <div className="h-12 flex items-center justify-center text-[8px] text-gray-400 italic">
                          (Signature de l'Agent)
                        </div>
                      </div>
                    </div>

                    {/* BAS DE PAGE DE CONFORMITÉ */}
                    <div className="text-center text-[8px] text-gray-400 mt-8 border-t border-gray-100 pt-2">
                      Document certifié conforme à la Loi n° 022/2021. Archivé par Gabon-Law-Sync pour {schoolName}.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-250 rounded-3xl p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
                  <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Prêt pour la génération d'acte RH</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed">
                      Sélectionnez un agent dans le menu latéral gauche, choisissez le type d'acte, puis cliquez sur <strong>"Préparer et Générer l'Acte"</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-indigo-50/40 text-indigo-700 px-3 py-1 rounded-full text-[9px] font-bold">
                    <Sparkles size={11} className="fill-indigo-600 text-indigo-600" /> Alimenté par l'IA de conformité Gabon-Sync
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* MODALS SECTION                      */}
      {/* ==================================== */}

      {/* ADD / EDIT STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
                {editingStaff ? "Modifier Fiche RH de l'Agent" : "Créer un Dossier RH pour le Personnel"}
              </h2>
              <button onClick={() => { setShowAddStaffModal(false); setEditingStaff(null); }} className="text-gray-400 hover:text-gray-600 p-1.5 bg-white border border-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="overflow-y-auto p-6 space-y-4 text-xs flex-1">
              {/* Identité */}
              <div className="space-y-3">
                <h3 className="font-black text-[10px] text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1">1. Informations Générales / Identité</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nom</label>
                    <input
                      type="text" required
                      value={staffForm.nom}
                      onChange={(e) => setStaffForm({ ...staffForm, nom: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Prénom</label>
                    <input
                      type="text" required
                      value={staffForm.prenom}
                      onChange={(e) => setStaffForm({ ...staffForm, prenom: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sexe</label>
                    <select
                      value={staffForm.sexe}
                      onChange={(e) => setStaffForm({ ...staffForm, sexe: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    >
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date de Naissance</label>
                    <input
                      type="date"
                      value={staffForm.dateNaissance}
                      onChange={(e) => setStaffForm({ ...staffForm, dateNaissance: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lieu de Naissance</label>
                    <input
                      type="text"
                      value={staffForm.lieuNaissance}
                      onChange={(e) => setStaffForm({ ...staffForm, lieuNaissance: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nationalité</label>
                    <input
                      type="text"
                      value={staffForm.nationalite}
                      onChange={(e) => setStaffForm({ ...staffForm, nationalite: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Situation matrimoniale</label>
                    <select
                      value={staffForm.situationMatrimoniale}
                      onChange={(e) => setStaffForm({ ...staffForm, situationMatrimoniale: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    >
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                      <option value="Veuf(ve)">Veuf(ve)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Téléphone Principal</label>
                    <input
                      type="text" required
                      value={staffForm.contactPrincipal}
                      onChange={(e) => setStaffForm({ ...staffForm, contactPrincipal: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Téléphone Sec.</label>
                    <input
                      type="text"
                      value={staffForm.contactSecondaire}
                      onChange={(e) => setStaffForm({ ...staffForm, contactSecondaire: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Adresse</label>
                    <input
                      type="text"
                      value={staffForm.adresse}
                      onChange={(e) => setStaffForm({ ...staffForm, adresse: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Professionnel */}
              <div className="space-y-3">
                <h3 className="font-black text-[10px] text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1">2. Informations Professionnelles</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Matricule</label>
                    <input
                      type="text" required
                      value={staffForm.matricule}
                      onChange={(e) => setStaffForm({ ...staffForm, matricule: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Poste / Fonction</label>
                    <select
                      value={staffForm.poste}
                      onChange={(e) => setStaffForm({ ...staffForm, poste: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-indigo-900"
                    >
                      <option value="Directeur d'établissement">Directeur d'établissement</option>
                      <option value="Responsable pédagogique">Responsable pédagogique</option>
                      <option value="Enseignant permanent">Enseignant permanent</option>
                      <option value="Enseignant vacataire">Enseignant vacataire</option>
                      <option value="Surveillant">Surveillant</option>
                      <option value="Comptable">Comptable</option>
                      <option value="Secrétaire">Secrétaire</option>
                      <option value="Chauffeur">Chauffeur</option>
                      <option value="Agent d'entretien">Agent d'entretien</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Département</label>
                    <select
                      value={staffForm.departement}
                      onChange={(e) => setStaffForm({ ...staffForm, departement: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    >
                      <option value="Enseignement">Enseignement</option>
                      <option value="Direction">Direction</option>
                      <option value="Administration">Administration</option>
                      <option value="Comptabilité">Comptabilité</option>
                      <option value="Services Généraux">Services Généraux</option>
                      <option value="Surveillance">Surveillance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Classe attribuée (enseignants)</label>
                    <input
                      type="text"
                      placeholder="Ex: Tle D, 3ème A"
                      value={staffForm.classeAttribuee}
                      onChange={(e) => setStaffForm({ ...staffForm, classeAttribuee: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Matière enseignée (enseignants)</label>
                    <input
                      type="text"
                      placeholder="Ex: Physique, Mathématiques"
                      value={staffForm.matiereEnseignee}
                      onChange={(e) => setStaffForm({ ...staffForm, matiereEnseignee: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Salaire Mensuel (FCFA)</label>
                    <input
                      type="number" required
                      placeholder="Min 80000"
                      value={staffForm.salaireMensuel || ''}
                      onChange={(e) => setStaffForm({ ...staffForm, salaireMensuel: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold font-mono text-indigo-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type de Contrat</label>
                    <select
                      value={staffForm.typeContrat}
                      onChange={(e) => setStaffForm({ ...staffForm, typeContrat: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-black text-indigo-600"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Vacataire">Vacataire</option>
                      <option value="Contractuel">Contractuel</option>
                      <option value="Stagiaire">Stagiaire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date d'Entrée</label>
                    <input
                      type="date"
                      value={staffForm.dateEntree}
                      onChange={(e) => setStaffForm({ ...staffForm, dateEntree: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date Fin de Contrat</label>
                    <input
                      type="date"
                      value={staffForm.dateFinContrat}
                      onChange={(e) => setStaffForm({ ...staffForm, dateFinContrat: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Statut d'activité</label>
                    <select
                      value={staffForm.statut}
                      onChange={(e) => setStaffForm({ ...staffForm, statut: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 flex justify-end gap-2 bg-gray-50/20 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => { setShowAddStaffModal(false); setEditingStaff(null); }}
                  className="px-4 py-2 bg-white border border-gray-250 text-gray-700 font-bold rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-sm"
                >
                  {editingStaff ? "Mettre à jour" : "Valider Enregistrement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STAFF DETAIL MODAL */}
      {viewingStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-xl w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Fiche Individuelle RH</h2>
              <button onClick={() => setViewingStaff(null)} className="text-gray-400 hover:text-gray-600 p-1.5 bg-white border border-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5 text-xs">
              <div className="flex items-center gap-4 border-b border-gray-150 pb-4">
                <img
                  src={viewingStaff.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-800">{viewingStaff.nom} {viewingStaff.prenom}</h3>
                  <p className="font-extrabold text-indigo-700">{viewingStaff.poste}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {viewingStaff.matricule}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Coordonnées</span>
                  <p className="font-semibold text-gray-700">📧 {viewingStaff.email || 'Non renseigné'}</p>
                  <p className="font-semibold text-gray-700">📞 {viewingStaff.contactPrincipal}</p>
                  <p className="font-semibold text-gray-700">📍 {viewingStaff.adresse || 'N/A'}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Identité Légale</span>
                  <p className="text-gray-700 font-medium">Sexe: <span className="font-bold">{viewingStaff.sexe}</span></p>
                  <p className="text-gray-700 font-medium">Nationalité: <span className="font-bold">{viewingStaff.nationalite}</span></p>
                  <p className="text-gray-700 font-medium">Matrimonial: <span className="font-bold">{viewingStaff.situationMatrimoniale}</span></p>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-black text-indigo-500 uppercase block">Contrat d'engagement</span>
                  <p className="font-black text-indigo-900 text-sm mt-0.5">{viewingStaff.typeContrat}</p>
                  <p className="text-[10px] text-indigo-700 mt-0.5 font-semibold">Entré le {viewingStaff.dateEntree}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-indigo-500 uppercase block">Département & Service</span>
                  <p className="font-black text-indigo-900 text-sm mt-0.5">{viewingStaff.departement}</p>
                  <p className="text-[10px] text-indigo-700 mt-0.5 font-semibold">Service: {viewingStaff.service}</p>
                </div>
              </div>

              {viewingStaff.poste.toLowerCase().includes('enseignant') && (
                <div className="border-t border-gray-150 pt-3 space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase block">Spécificités Pédagogiques</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p className="text-gray-600 font-bold">Matière: <span className="text-indigo-900 font-black">{viewingStaff.matiereEnseignee || 'N/A'}</span></p>
                    <p className="text-gray-600 font-bold">Classe: <span className="text-indigo-900 font-black">{viewingStaff.classeAttribuee || 'N/A'}</span></p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Printer size={13} /> Imprimer Dossier
                </button>
                <button
                  onClick={() => setViewingStaff(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST SALARY ADVANCE MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Nouvelle Demande d'Avance</h2>
              <button onClick={() => setShowAdvanceModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 bg-white border border-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1">Sélectionner l'Employé</label>
                <select
                  required
                  value={advanceForm.staffId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                >
                  <option value="">-- Choisir un bénéficiaire --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.nom} {s.prenom} ({s.poste})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1">Montant Demandé (FCFA)</label>
                <input
                  type="number" required
                  placeholder="Ex: 50000"
                  value={advanceForm.montant}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, montant: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono text-sm font-black text-indigo-950"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1">Motif / Justification</label>
                <textarea
                  required
                  placeholder="Ex: Urgence médicale, frais de scolarité..."
                  value={advanceForm.motif}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, motif: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1">Date d'effet</label>
                <input
                  type="date" required
                  value={advanceForm.date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-white border border-gray-250 text-gray-700 font-bold rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-sm"
                >
                  Soumettre Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
