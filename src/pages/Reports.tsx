import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Mail, 
  Printer, 
  Calendar, 
  RefreshCw, 
  Play, 
  Search, 
  Filter, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  Trash2,
  Share2
} from 'lucide-react';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Reports() {
  const { currentUser } = useAuth();
  const { currentEstablishment, isSuperAdmin } = useEstablishment();
  const { notifySuccess, notifyError } = useNotification();
  const { t, language } = useLanguage();

  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';

  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribeReports: () => void;

    const setupReports = async () => {
      let tClasses: string[] = [];
      
      // Si enseignant, récupérer d'abord ses classes
      if (currentUser.role === 'enseignant') {
        try {
          const classesQuery = query(
            collection(db, 'classes'), 
            where('professeur_principal_id', '==', currentUser.id)
          );
          const classesSnap = await getDocs(classesQuery);
          tClasses = classesSnap.docs
            .filter(d => (d.data().etablissement || 'EDU-001') === activeEstId)
            .map(d => d.data().nom);
          setTeacherClasses(tClasses);
        } catch (error) {
          console.error("Erreur lors de la vérification des classes de l'enseignant:", error);
        }
      }

      const q = query(collection(db, 'reports'));
      unsubscribeReports = onSnapshot(q, (snap) => {
        let reportsData = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
        
        // STRICT ISOLATION: Ne conserver QUE les rapports de l'établissement actif
        reportsData = reportsData.filter(r => {
          const rEstId = r.etablissement || r.establishmentId || 'EDU-001';
          return rEstId === activeEstId;
        });

        // Si enseignant, filtrer les rapports pour ne voir que ceux de ses classes
        if (currentUser.role === 'enseignant') {
          reportsData = reportsData.filter(r => tClasses.includes(r.classe));
        }

        // Trier par date décroissante
        reportsData.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

        setReports(reportsData);
        if (reportsData.length > 0) {
          setSelectedReportId(prev => {
            if (!prev || !reportsData.find(r => r.id === prev)) {
              return reportsData[0].id;
            }
            return prev;
          });
        } else {
          setSelectedReportId(null);
        }
        setLoading(false);
      }, (err) => {
        console.error("Erreur lors de la récupération des rapports:", err);
        setLoading(false);
      });
    };

    setupReports();

    return () => {
      if (unsubscribeReports) unsubscribeReports();
    };
  }, [currentUser, activeEstId]);

  // Extract unique weeks for dropdown archives
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set<string>();
    reports.forEach(r => {
      if (r.semaine) weeksSet.add(r.semaine);
    });
    return Array.from(weeksSet);
  }, [reports]);

  // Extract unique classes for filter
  const availableClasses = useMemo(() => {
    const clsSet = new Set<string>();
    reports.forEach(r => {
      if (r.classe) clsSet.add(r.classe);
    });
    return Array.from(clsSet).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = searchTerm === '' || 
        (r.user_name && r.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.user_email && r.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.classe && r.classe.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchWeek = selectedWeekFilter === 'all' || r.semaine === selectedWeekFilter;
      const matchClass = selectedClassFilter === 'all' || r.classe === selectedClassFilter;

      return matchSearch && matchWeek && matchClass;
    });
  }, [reports, searchTerm, selectedWeekFilter, selectedClassFilter]);

  const generateWeeklyReports = async () => {
    if (!isFirebaseConfigured) return;
    setGenerating(true);
    try {
      // 1. Calculer les dates de la semaine courante (Lundi à Vendredi)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      
      const monday = new Date(now.setDate(diffToMonday));
      monday.setHours(0, 0, 0, 0);
      
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);

      const weekString = `Semaine du ${monday.toLocaleDateString('fr-FR')} au ${friday.toLocaleDateString('fr-FR')}`;

      // 2. Récupérer STRICTEMENT les utilisateurs de l'établissement actif
      const usersSnap = await getDocs(collection(db, 'users'));
      let users = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(u => (u.etablissement || 'EDU-001') === activeEstId);

      // Si enseignant, ne générer que pour ses classes
      if (currentUser?.role === 'enseignant') {
        if (teacherClasses.length === 0) {
          notifyError("Vous n'êtes assigné à aucune classe en tant que professeur principal. Veuillez contacter un administrateur.");
          setGenerating(false);
          return;
        }
        
        users = users.filter(u => teacherClasses.includes(u.classe));
        
        if (users.length === 0) {
          notifyError(`Aucun élève n'est assigné à vos classes (${teacherClasses.join(', ')}).`);
          setGenerating(false);
          return;
        }
      }

      if (users.length === 0) {
        notifyError(`Aucun élève ou personnel trouvé pour l'établissement ${currentEstablishment?.nom || activeEstId}.`);
        setGenerating(false);
        return;
      }

      // 3. Récupérer toutes les présences de la semaine pour cet établissement
      const mondayStr = monday.toISOString().split('T')[0];
      const fridayStr = friday.toISOString().split('T')[0];
      
      const attQuery = query(collection(db, 'attendance'), 
        where('date', '>=', mondayStr),
        where('date', '<=', fridayStr)
      );
      const attSnap = await getDocs(attQuery);
      const attendances = attSnap.docs
        .map(d => d.data() as any)
        .filter(a => (a.etablissement || 'EDU-001') === activeEstId);

      let generatedCount = 0;

      // 4. Générer le rapport pour chaque utilisateur de cet établissement
      for (const user of users) {
        // Ignorer les admins purs si on ne veut évaluer que les élèves/employés
        if (user.role === 'admin' && !user.position) continue;

        // Vérifier si le rapport existe déjà pour cet établissement
        const existingReportQuery = query(collection(db, 'reports'), 
          where('user_id', '==', user.id),
          where('semaine', '==', weekString)
        );
        const existingSnap = await getDocs(existingReportQuery);
        const existingDoc = existingSnap.docs.find(d => {
          const data = d.data();
          return (data.etablissement || data.establishmentId || 'EDU-001') === activeEstId;
        });
        
        const userAtts = attendances.filter(a => a.user_id === user.id);
        
        let presence = 0;
        let retards = 0;
        let absences = 0;
        const tableau = [];

        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        for (let i = 0; i < 5; i++) {
          const currentDate = new Date(monday);
          currentDate.setDate(monday.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const dayAtt = userAtts.find(a => a.date === dateStr);
          
          if (dayAtt) {
            if (dayAtt.statut === 'Présent') presence++;
            if (dayAtt.statut === 'Retard') retards++;
            if (dayAtt.statut === 'Absent') absences++;
            tableau.push({
              jour: days[i],
              date: dateStr,
              heure_arrivee: dayAtt.heure_arrivee || '-',
              heure_depart: dayAtt.heure_depart || '-',
              statut: dayAtt.statut
            });
          } else {
            // Si la date est passée, c'est une absence
            const isPast = currentDate < new Date();
            if (isPast) absences++;
            tableau.push({
              jour: days[i],
              date: dateStr,
              heure_arrivee: '-',
              heure_depart: '-',
              statut: isPast ? 'Absent' : '-'
            });
          }
        }

        let analyse = "Assiduité exemplaire cette semaine. Félicitations !";
        if (absences > 1) analyse = `Attention : ${absences} absences enregistrées. Un justificatif médical ou parental est requis.`;
        else if (absences === 1) analyse = `1 absence enregistrée cette semaine. Assurez-vous de régulariser la situation.`;
        else if (retards > 0) analyse = `Présence constatée mais ${retards} retard(s) à corriger pour respecter la ponctualité.`;

        const reportData = {
          user_id: user.id,
          user_name: user.prenom || user.nom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : user.email?.split('@')[0] || 'Utilisateur',
          user_email: user.email || '',
          classe: user.classe || user.position || 'Général',
          semaine: weekString,
          resume: { jours_presence: presence, retards, absences },
          tableau_presence: tableau,
          analyse,
          etablissement: activeEstId,
          establishmentId: activeEstId,
          establishmentNom: currentEstablishment?.nom || 'Établissement Scolaire',
          timestamp: new Date().toISOString()
        };

        if (!existingDoc) {
          await addDoc(collection(db, 'reports'), reportData);
        } else {
          // Mettre à jour le rapport existant
          await updateDoc(doc(db, 'reports', existingDoc.id), reportData);
        }
        generatedCount++;
      }
      
      notifySuccess(`${generatedCount} rapport(s) de présence générés avec succès pour ${currentEstablishment?.nom || activeEstId} !`);
    } catch (err: any) {
      console.error(err);
      notifyError("Une erreur est survenue lors de la génération des rapports: " + (err.message || err));
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce rapport de présence ?")) return;
    setDeletingId(reportId);
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      notifySuccess("Rapport supprimé avec succès.");
      if (selectedReportId === reportId) {
        const remaining = reports.filter(r => r.id !== reportId);
        setSelectedReportId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error("Erreur suppression rapport:", err);
      notifyError("Impossible de supprimer le rapport.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      notifyError("Aucun rapport à exporter.");
      return;
    }
    const headers = ["Nom & Prénom", "Classe/Fonction", "Email", "Semaine", "Jours Présents", "Retards", "Absences", "Établissement", "Date Génération"];
    const rows = filteredReports.map(r => [
      `"${r.user_name || ''}"`,
      `"${r.classe || ''}"`,
      `"${r.user_email || ''}"`,
      `"${r.semaine || ''}"`,
      r.resume?.jours_presence || 0,
      r.resume?.retards || 0,
      r.resume?.absences || 0,
      `"${r.establishmentNom || currentEstablishment?.nom || activeEstId}"`,
      `"${r.timestamp ? new Date(r.timestamp).toLocaleDateString('fr-FR') : ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapports_Presence_${activeEstId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("Exportation CSV téléchargée avec succès !");
  };

  const handleSendEmail = () => {
    if (!selectedReport) return;
    const subject = encodeURIComponent(`Rapport d'assiduité & présence - ${selectedReport.semaine} - ${currentEstablishment?.nom || ''}`);
    const body = encodeURIComponent(`Bonjour ${selectedReport.user_name},

Veuillez trouver ci-dessous le relevé officiel de votre assiduité pour la ${selectedReport.semaine} au sein de l'établissement "${currentEstablishment?.nom || 'Edu-Nify'}" :

• Jours de présence : ${selectedReport.resume?.jours_presence || 0} / 5
• Retards enregistrés : ${selectedReport.resume?.retards || 0}
• Absences enregistrées : ${selectedReport.resume?.absences || 0}

Évaluation & Remarque :
"${selectedReport.analyse}"

Pour toute justification d'absence ou rectification, veuillez vous adresser à la Vie Scolaire ou au secrétariat de direction.

Cordialement,
La Direction / Vie Scolaire
${currentEstablishment?.nom || 'Complexe Scolaire'}
Contact : ${currentEstablishment?.telephone || ''}`);
    
    window.location.href = `mailto:${selectedReport.user_email || ''}?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedReport = reports.find(r => r.id === selectedReportId) || filteredReports[0] || null;

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Rapports de Présence & Archives
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
              <Building2 size={12} />
              {currentEstablishment?.nom || activeEstId}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Génération hebdomadaire, suivi d'assiduité et historique des archives scolaires de l'établissement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {(currentUser?.role === 'admin' || currentUser?.role === 'enseignant' || isSuperAdmin) && (
            <button 
              onClick={generateWeeklyReports}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md shadow-emerald-600/10 flex-1 sm:flex-none cursor-pointer"
              title="Générer ou synchroniser les rapports de présence de la semaine en cours pour cet établissement"
            >
              {generating ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
              <span className="whitespace-nowrap">Générer les Rapports</span>
            </button>
          )}

          <button 
            onClick={handleExportCSV}
            disabled={filteredReports.length === 0}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
            title="Exporter la liste filtrée en format tableur CSV"
          >
            <Download size={15} />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button 
            onClick={handleSendEmail}
            disabled={!selectedReport}
            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            title="Envoyer le rapport par email"
          >
            <Mail size={15} />
            <span className="hidden md:inline">Envoyer</span>
          </button>

          <button 
            onClick={handlePrint}
            disabled={!selectedReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            title="Imprimer ou enregistrer en PDF"
          >
            <Printer size={15} />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 print:block print:gap-0">
        {/* Sidebar for Archives and Report Selection */}
        <div className="w-full lg:w-88 bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[480px] lg:h-[calc(100vh-14rem)] print:hidden">
          {/* Header of Archive Panel */}
          <div className="p-4 border-b border-gray-150 dark:border-gray-700 bg-slate-50/70 dark:bg-gray-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  Archives ({filteredReports.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {currentEstablishment?.id || activeEstId}
              </span>
            </div>

            {/* Filter by Archived Week */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Période / Semaine :</label>
              <select 
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-gray-800 dark:text-gray-200"
              >
                <option value="all">Toutes les semaines archivées ({availableWeeks.length})</option>
                {availableWeeks.map(wk => (
                  <option key={wk} value={wk}>{wk}</option>
                ))}
              </select>
            </div>

            {/* Filter by Class */}
            {availableClasses.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Classe / Section :</label>
                <select 
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-gray-800 dark:text-gray-200"
                >
                  <option value="all">Toutes les classes</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Rechercher élève, classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List of Reports in Archive */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-2">
                <RefreshCw className="animate-spin text-indigo-600" size={24} />
                <span className="text-xs">Chargement des archives de l'établissement...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs space-y-3">
                <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                <p>Aucun rapport trouvé pour <strong>{currentEstablishment?.nom || activeEstId}</strong> selon vos critères de recherche.</p>
                {(currentUser?.role === 'admin' || isSuperAdmin) && (
                  <button
                    onClick={generateWeeklyReports}
                    className="text-indigo-600 hover:underline font-bold text-xs"
                  >
                    + Générer les rapports de cette semaine
                  </button>
                )}
              </div>
            ) : (
              filteredReports.map(report => {
                const isSelected = selectedReportId === report.id;
                const isPerfect = (report.resume?.absences || 0) === 0 && (report.resume?.retards || 0) === 0;

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`group relative p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700/50 border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[160px]">
                        {report.user_name || "Utilisateur"}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        isPerfect 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : (report.resume?.absences || 0) > 0 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {report.resume?.jours_presence || 0}/5 j
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                        {report.classe || 'Classe'}
                      </span>
                      <span className="text-[10px] truncate max-w-[120px] text-gray-400">
                        {report.semaine?.replace('Semaine du ', 'S: ')}
                      </span>
                    </div>

                    {/* Quick delete button on hover for admins */}
                    {(currentUser?.role === 'admin' || isSuperAdmin) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        disabled={deletingId === report.id}
                        className="opacity-0 group-hover:opacity-100 absolute right-2 bottom-2 text-gray-300 hover:text-rose-600 transition-opacity p-1"
                        title="Supprimer ce rapport"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Report Preview & Printable Area */}
        <div 
          id="printable-report" 
          className="flex-1 bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm p-6 sm:p-10 overflow-y-auto h-[calc(100vh-14rem)] print:border-none print:shadow-none print:p-0 print:h-auto print:overflow-visible print:block"
        >
          {selectedReport ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Official Academic Header */}
              <div className="border-b-2 border-indigo-600 dark:border-indigo-500 pb-6 flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-4">
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={currentEstablishment?.logoUrl || "/logo.png"} 
                      alt="Logo Établissement" 
                      className="h-16 w-16 object-contain rounded-xl border border-gray-100 dark:border-gray-700 bg-white p-1"
                      onError={(e: any) => { e.target.src = '/logo.png'; }}
                    />
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                        {currentEstablishment?.nom || selectedReport.establishmentNom || 'École Internationale Edu-Nify'}
                      </p>
                      <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        Code Établissement : {currentEstablishment?.id || activeEstId}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5 font-medium">
                    <p>{currentEstablishment?.adresse || 'Libreville, GABON'}</p>
                    <p>Tél : {currentEstablishment?.telephone || '+241 011 44 9292 / 062 24 8425'} | Email : {currentEstablishment?.email || 'contact@edu-nify.ga'}</p>
                  </div>
                </div>

                <div className="md:text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                    BULLETIN OFFICIEL D'ASSIDUITÉ
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    Rapport de Présence
                  </h1>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {selectedReport.semaine}
                  </p>
                </div>
              </div>

              {/* Student Identity Card */}
              <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nom & Prénom de l'apprenant</p>
                  <p className="text-base font-black text-gray-900 dark:text-white">{selectedReport.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedReport.user_email}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Classe / Section</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedReport.classe || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">Année Académique 2026-2027</p>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                    {selectedReport.resume?.jours_presence || 0}
                  </p>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-black">
                    Jours Présent
                  </p>
                </div>
                <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-amber-500 dark:text-amber-400 mb-1">
                    {selectedReport.resume?.retards || 0}
                  </p>
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 uppercase tracking-wider font-black">
                    Retards
                  </p>
                </div>
                <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-rose-500 dark:text-rose-400 mb-1">
                    {selectedReport.resume?.absences || 0}
                  </p>
                  <p className="text-[10px] text-rose-800 dark:text-rose-300 uppercase tracking-wider font-black">
                    Absences
                  </p>
                </div>
              </div>

              {/* Detailed Points Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    Relevé chronologique des pointages
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">Système Biométrique & Badges</span>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3">Jour</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Heure d'arrivée</th>
                        <th className="px-4 py-3">Heure de départ</th>
                        <th className="px-4 py-3 text-right">Statut constat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {selectedReport.tableau_presence?.map((row: any, idx: number) => {
                        const isPres = row.statut === 'Présent';
                        const isRet = row.statut === 'Retard';
                        const isAbs = row.statut === 'Absent';

                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{row.jour}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-[11px]">{row.date}</td>
                            <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{row.heure_arrivee || '-'}</td>
                            <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{row.heure_depart || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${
                                isPres 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                  : isRet 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                                    : isAbs 
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                      : 'text-gray-400'
                              }`}>
                                {row.statut || '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automatic Academic Analysis */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/60 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={15} />
                  Appréciation Pédagogique & Assiduité
                </h3>
                <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed italic font-medium">
                  « {selectedReport.analyse} »
                </p>
              </div>

              {/* Signatures & Stamps Area for Official Printing */}
              <div className="pt-8 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Le Responsable Vie Scolaire</p>
                  <p className="text-[10px] text-gray-400 mt-1">Visa & Cachet</p>
                  <div className="h-16 mt-2 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                </div>
                <div>
                  <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Le Chef d'Établissement</p>
                  <p className="text-[10px] text-gray-400 mt-1">Signature & Sceau officiel</p>
                  <div className="h-16 mt-2 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                </div>
              </div>
              
              <div className="text-center text-[10px] text-gray-400 pt-4">
                Document certifié conforme par la plateforme de gestion académique {currentEstablishment?.nom || 'Edu-Nify'} • Émis le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-4 p-8 text-center">
              <FileText size={48} className="text-gray-300 dark:text-gray-600" />
              <div className="space-y-1">
                <p className="font-bold text-gray-700 dark:text-gray-300">Sélectionnez un rapport d'assiduité</p>
                <p className="text-xs text-gray-400">
                  Choisissez un rapport dans la colonne des archives à gauche pour afficher son aperçu officiel et l'imprimer.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
