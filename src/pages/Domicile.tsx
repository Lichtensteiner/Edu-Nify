import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';
import { db, storage } from '../lib/firebase';
import { recordAuditLog } from '../services/auditService';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  FileText,
  Trash2,
  AlertCircle,
  Download,
  Paperclip,
  X,
  RefreshCw,
  Eye,
  ExternalLink,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SuccessModal from '../components/SuccessModal';
import PDFViewerModal from '../components/PDFViewerModal';
import { formatFileSize } from '../components/DocumentViewer';

interface HomeworkItem {
  id: string;
  classId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: any;
  createdAt: any;
  teacherId: string;
  teacherName: string;
  completedBy: string[]; // Array of student UIDs
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  etablissement?: string;
}

const Homework: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { currentEstablishment } = useEstablishment();
  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';
  const { notifySuccess, notifyError, notifyAdd, notifyDelete } = useNotification();
  
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  
  // File upload & preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Dedicated in-app PDF / Document Viewer state
  const [viewingDocument, setViewingDocument] = useState<{
    url: string;
    name: string;
    size?: number;
  } | null>(null);

  const [newHomework, setNewHomework] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    classId: ''
  });

  // Normalized roles
  const userRole = (currentUser?.role || '').toLowerCase().trim();
  const isTeacher = userRole === 'enseignant' || userRole === 'teacher' || userRole === 'professeur' || userRole.includes('enseign') || userRole.includes('prof');
  const isStudent = userRole === 'élève' || userRole === 'eleve' || userRole === 'student';
  const isParent = userRole === 'parent';
  const isAdmin = userRole === 'admin' || userRole === 'directeur' || userRole.includes('admin') || !!currentUser?.isSuperAdmin;
  const canManageHomework = isTeacher || isAdmin;

  // Handle preview URL for selected file in modal
  useEffect(() => {
    if (!selectedFile) {
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
        setSelectedFilePreviewUrl(null);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // Fetch classes and subjects for this establishment
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const cls = snap.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId && !doc.data().deleted)
        .map(doc => ({ id: doc.id, name: (doc.data().nom || doc.data().name || doc.id) as string }));
      setClassesList(cls);
    });

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      const subs = snap.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => doc.data().name as string)
        .filter(Boolean);
      setSubjectsList(subs.sort());
    });

    return () => {
      unsubClasses();
      unsubSubjects();
    };
  }, [activeEstId]);

  useEffect(() => {
    if (!currentUser) return;

    let homeworkQuery;
    if (isStudent && currentUser.classe) {
      homeworkQuery = query(
        collection(db, 'homework'),
        where('classId', '==', currentUser.classe)
      );
    } else if (isTeacher && !isAdmin) {
      homeworkQuery = query(
        collection(db, 'homework'),
        where('teacherId', '==', currentUser.id)
      );
    } else {
      homeworkQuery = query(
        collection(db, 'homework'),
        orderBy('dueDate', 'asc')
      );
    }

    const unsubscribe = onSnapshot(homeworkQuery, (snapshot) => {
      let homeworkData = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HomeworkItem[];
      
      // Sort client-side to avoid requiring composite indexes
      homeworkData.sort((a, b) => {
        const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
        const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      });

      setHomework(homeworkData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching homework:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeEstId, isStudent, isTeacher, isAdmin]);

  const handleToggleComplete = async (homeworkId: string, isCompleted: boolean) => {
    if (!currentUser || !isStudent) return;

    const homeworkRef = doc(db, 'homework', homeworkId);
    const item = homework.find(h => h.id === homeworkId);
    if (!item) return;

    let newCompletedBy = [...(item.completedBy || [])];
    if (isCompleted) {
      newCompletedBy = newCompletedBy.filter(id => id !== currentUser.id);
    } else {
      newCompletedBy.push(currentUser.id);
    }

    try {
      await updateDoc(homeworkRef, { completedBy: newCompletedBy });

      if (currentUser) {
        await recordAuditLog({
          userId: currentUser.id,
          userName: `${currentUser.prenom} ${currentUser.nom}`,
          userRole: currentUser.role,
          action: isCompleted ? "Annulation de devoir" : "Marquage de devoir terminé",
          details: `Devoir: ${item.title}, Matière: ${item.subject}`,
          category: 'homework'
        });
      }
    } catch (error) {
      console.error("Error updating homework status:", error);
    }
  };

  /**
   * Resilient upload helper:
   * Tries Firebase Storage first with a short timeout.
   * If Firebase Storage fails (e.g. CORS on Vercel deployment, unconfigured bucket, or rules error),
   * seamlessly falls back to a Data URL (base64) so the file is NEVER lost.
   */
  const uploadFileResiliently = async (file: File): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }> => {
    let fileUrl = '';
    
    // Attempt Firebase Storage first with 6s timeout
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileRef = ref(storage, `homework/${activeEstId}/${Date.now()}_${sanitizedName}`);
      
      const uploadPromise = async () => {
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      };

      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase Storage timeout')), 6000);
      });

      fileUrl = await Promise.race([uploadPromise(), timeoutPromise]);
    } catch (storageErr) {
      console.warn('Firebase Storage upload failed or timed out, using resilient Data URL fallback:', storageErr);
      
      // Fallback: Read as Base64 Data URL
      fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    return {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
    };
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setUploading(true);
    setUploadProgress(20);
    try {
      let fileData: {
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        fileType?: string;
      } = {};
      
      if (selectedFile) {
        setUploadProgress(45);
        fileData = await uploadFileResiliently(selectedFile);
        setUploadProgress(85);
      }

      await addDoc(collection(db, 'homework'), {
        ...newHomework,
        ...fileData,
        teacherId: currentUser.id,
        teacherName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Enseignant',
        createdAt: serverTimestamp(),
        completedBy: [],
        dueDate: new Date(newHomework.dueDate),
        etablissement: activeEstId
      });
      
      await recordAuditLog({
        userId: currentUser.id,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: "Assignation de devoir",
        details: `Titre: ${newHomework.title}, Date d'échéance: ${newHomework.dueDate}${fileData.fileName ? `, Fichier: ${fileData.fileName}` : ''}`,
        category: 'homework'
      });

      setUploadProgress(100);
      
      setTimeout(() => {
        setShowAddModal(false);
        setNewHomework({ subject: '', title: '', description: '', dueDate: '', classId: '' });
        setSelectedFile(null);
        setUploadProgress(null);
        setUploading(false);
        setSuccessInfo({
          title: t('homework_published'),
          message: t('homework_assigned_success')
        });
        setShowSuccess(true);
      }, 400);
    } catch (error) {
      console.error("Error adding homework:", error);
      notifyError(t('error_adding_homework') || "Une erreur est survenue lors de l'ajout du devoir.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (window.confirm(t('confirm_delete') || "Êtes-vous sûr de vouloir supprimer ce devoir ?")) {
      try {
        const itemToDelete = homework.find(h => h.id === id);
        await deleteDoc(doc(db, 'homework', id));

        if (currentUser) {
          await recordAuditLog({
            userId: currentUser.id,
            userName: `${currentUser.prenom} ${currentUser.nom}`,
            userRole: currentUser.role,
            action: "Suppression de devoir",
            details: `Devoir supprimé: ${itemToDelete?.title || id}`,
            category: 'homework'
          });
        }
        notifySuccess("Devoir supprimé avec succès.");
      } catch (error) {
        console.error("Error deleting homework:", error);
        notifyError("Impossible de supprimer le devoir.");
      }
    }
  };

  /**
   * Safe universal file download handling both remote URLs, blob URLs, and Base64 data URLs
   */
  const handleDownloadFile = (url: string, fileName: string) => {
    try {
      if (url.startsWith('data:')) {
        const parts = url.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
      window.open(url, '_blank');
    }
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const date = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return date < new Date() && date.toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" />
            {t('homework')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isStudent ? t('homework_desc_student') : t('homework_desc_teacher')}
          </p>
        </div>

        {canManageHomework && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Plus size={18} />
            {t('add_homework')}
          </button>
        )}
      </div>

      {/* Homework List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-indigo-600" size={20} />
            <span>{t('loading_homework')}</span>
          </div>
        ) : homework.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('no_homework')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('no_homework_desc')}</p>
          </div>
        ) : (
          homework.map((item, index) => {
            const isCompleted = isStudent && item.completedBy?.includes(currentUser?.id || '');
            const overdue = isOverdue(item.dueDate);
            const isPdf = item.fileName?.toLowerCase().endsWith('.pdf') || item.fileType?.includes('pdf') || item.fileUrl?.startsWith('data:application/pdf');
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border transition-all ${
                  isCompleted 
                    ? 'border-emerald-100 dark:border-emerald-900/30 opacity-75' 
                    : overdue 
                      ? 'border-red-100 dark:border-red-900/30' 
                      : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {isStudent && (
                    <button 
                      onClick={() => handleToggleComplete(item.id, !!isCompleted)}
                      className={`mt-1 transition-colors cursor-pointer ${isCompleted ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
                      title={isCompleted ? "Marquer comme non terminé" : "Marquer comme fait"}
                    >
                      {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {item.subject}
                        </span>
                        {item.classId && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold">
                            {item.classId}
                          </span>
                        )}
                        {overdue && !isCompleted && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                            <AlertCircle size={12} />
                            {t('overdue')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <Clock size={15} />
                        <span>{t('due_to')} {item.dueDate?.toDate ? item.dueDate.toDate().toLocaleDateString(language) : new Date(item.dueDate).toLocaleDateString(language)}</span>
                      </div>
                    </div>
                    
                    <h3 className={`text-lg font-bold mb-2 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>

                    {/* Attached Document Card (PDF & Other Files) */}
                    {item.fileUrl && (
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-red-50/70 dark:bg-red-950/25 border border-red-200/80 dark:border-red-900/50 rounded-2xl transition-all hover:bg-red-50 dark:hover:bg-red-950/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${isPdf ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                              <FileText size={22} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white tracking-wider uppercase ${isPdf ? 'bg-red-600' : 'bg-indigo-600'}`}>
                                  {isPdf ? 'PDF' : item.fileName?.split('.').pop()?.toUpperCase() || 'DOC'}
                                </span>
                                {item.fileSize && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {formatFileSize(item.fileSize)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md" title={item.fileName || 'Devoir PDF'}>
                                {item.fileName || 'Fichier PDF attaché'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setViewingDocument({
                                url: item.fileUrl!,
                                name: item.fileName || 'Devoir.pdf',
                                size: item.fileSize
                              })}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                              title="Afficher et consulter le document"
                            >
                              <Eye size={14} />
                              <span>Afficher</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadFile(item.fileUrl!, item.fileName || 'Devoir.pdf')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                              title="Télécharger le fichier"
                            >
                              <Download size={14} />
                              <span className="hidden sm:inline">Télécharger</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {item.teacherName?.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.teacherName}</span>
                      </div>
                      
                      {canManageHomework && (
                        <button 
                          onClick={() => handleDeleteHomework(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Supprimer ce devoir"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Homework Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden my-8"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="text-indigo-600" size={22} />
                  {t('add_homework')}
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddHomework} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subject')}</label>
                    <input
                      type="text"
                      required
                      list="homework-subjects-list"
                      value={newHomework.subject}
                      onChange={(e) => setNewHomework({...newHomework, subject: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white text-sm"
                      placeholder="Ex: Mathématiques"
                    />
                    <datalist id="homework-subjects-list">
                      {subjectsList.map((s, idx) => (
                        <option key={idx} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('due_date_label')}</label>
                    <input
                      type="date"
                      required
                      value={newHomework.dueDate}
                      onChange={(e) => setNewHomework({...newHomework, dueDate: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {classesList.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classe ciblée</label>
                    <select
                      value={newHomework.classId}
                      onChange={(e) => setNewHomework({...newHomework, classId: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Toutes les classes / Générale</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('homework_title_label')}</label>
                  <input
                    type="text"
                    required
                    value={newHomework.title}
                    onChange={(e) => setNewHomework({...newHomework, title: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white text-sm"
                    placeholder="Ex: Exercices sur les fractions et géométrie"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('homework_instructions_label')}</label>
                  <textarea
                    required
                    rows={4}
                    value={newHomework.description}
                    onChange={(e) => setNewHomework({...newHomework, description: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-gray-900 dark:text-white text-sm leading-relaxed"
                    placeholder={t('homework_desc_placeholder')}
                  />
                </div>
                
                {/* PDF & Document Attachment Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip size={16} className="text-indigo-600" />
                      Document joint (PDF ou Image)
                    </span>
                    <span className="text-xs text-gray-400 font-normal">Max 25 Mo</span>
                  </label>

                  {!selectedFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        id="homework-file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null;
                          if (file) {
                            if (file.size > 25 * 1024 * 1024) {
                              notifyError("Le fichier dépasse la taille maximale de 25 Mo.");
                              return;
                            }
                            setSelectedFile(file);
                          }
                        }}
                        accept=".pdf,image/png,image/jpeg,image/webp"
                      />
                      <label 
                        htmlFor="homework-file"
                        className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-center group"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Paperclip size={20} />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Cliquez pour sélectionner un document PDF ou une image
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          Formats acceptés : PDF, JPG, PNG, WEBP
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shrink-0">
                          <FileText size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white tracking-wider uppercase">
                              {selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(selectedFile.size)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[220px]" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {selectedFilePreviewUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingDocument({
                              url: selectedFilePreviewUrl,
                              name: selectedFile.name,
                              size: selectedFile.size
                            })}
                            className="p-2 text-indigo-600 hover:text-indigo-700 bg-white dark:bg-gray-800 rounded-xl hover:bg-indigo-50 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                            title="Aperçu rapide"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-2 text-red-600 hover:text-red-700 bg-white dark:bg-gray-800 rounded-xl hover:bg-red-50 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                          title="Supprimer la sélection"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={uploading}
                    className="flex-1 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:bg-indigo-400 flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer text-sm"
                  >
                    {uploading ? (
                      <>
                        <div className="relative z-10 flex items-center gap-2">
                          <RefreshCw className="animate-spin" size={18} />
                          <span>{uploadProgress !== null ? `${Math.round(uploadProgress)}%` : t('uploading_msg')}</span>
                        </div>
                        {uploadProgress !== null && (
                          <div 
                            className="absolute inset-0 bg-white/20 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>{t('publish')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App PDF & Document Viewer Modal */}
      {viewingDocument && (
        <PDFViewerModal
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          fileUrl={viewingDocument.url}
          fileName={viewingDocument.name}
          fileSize={viewingDocument.size}
        />
      )}

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
};

export default Homework;
