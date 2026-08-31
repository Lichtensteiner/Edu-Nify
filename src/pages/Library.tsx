import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { 
  Book, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  BookOpen, 
  History, 
  Library as LibraryIcon, 
  FileText, 
  Download, 
  User, 
  Upload, 
  Sparkles, 
  Filter, 
  GraduationCap, 
  Eye, 
  X, 
  Maximize2, 
  FileUp, 
  Check, 
  AlertCircle, 
  Bookmark, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import SuccessModal from '../components/SuccessModal';

export interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  status: 'available' | 'borrowed' | 'lost';
  currentBorrowerId?: string;
  currentBorrowerName?: string;
  currentLoanId?: string;
  dueDate?: any;
  addedAt: any;
  pdfUrl?: string;
  fileData?: string; // Base64 data URL for uploaded local files
  fileName?: string;
  fileSize?: string;
  targetClass?: string; // Dedicated class or 'all'
  description?: string;
  pageCount?: number;
  publishedYear?: string;
  etablissement?: string;
}

interface LoanRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  loanDate: any;
  dueDate: any;
  returnDate?: any;
  status: 'active' | 'returned' | 'late';
  etablissement?: string;
}

const CATEGORIES = [
  'Général',
  'Manuel Scolaire',
  'Littérature & Romans',
  'Mathématiques & Informatique',
  'Sciences & Technologies',
  'Histoire & Géographie',
  'Philosophie & Sciences Humaines',
  'Langues Vivantes & Dictionnaires',
  'Annales & Préparation Examens',
  'Maternelle & Contes'
];

export default function Library() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const activeEstId = currentEstablishment?.id || currentUser?.etablissement || 'EDU-001';

  const [books, setBooks] = useState<BookItem[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  
  // UI Tabs & Modals
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans'>('catalog');
  const [showAddModal, setShowAddModal] = useState(false);
  const [readingBook, setReadingBook] = useState<BookItem | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });

  // Add Book Form state
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Manuel Scolaire',
    targetClass: 'all', // 'all' or dedicated class name like '6ème A'
    pdfUrl: '', // Optional online PDF link
    description: '',
    pageCount: '',
    publishedYear: new Date().getFullYear().toString()
  });

  // Local File Upload state
  const [uploadedFile, setUploadedFile] = useState<{
    dataUrl: string;
    name: string;
    size: string;
    sizeBytes: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin' || 
                  currentUser?.role === 'personnel administratif' || 
                  currentUser?.role === 'enseignant' ||
                  (currentUser?.role as any) === 'Super Admin' ||
                  (currentUser?.role as any) === 'Directeur';

  // Load classes for the active establishment
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        const loaded = snap.docs
          .filter(d => (d.data().etablissement || 'EDU-001') === activeEstId && !d.data().deleted)
          .map(d => d.data().nom || d.id);
        
        if (loaded.length > 0) {
          setClassesList(Array.from(new Set(loaded)).sort());
        } else {
          setClassesList(['6ème A', '5ème B', '4ème A', '3ème C', 'Seconde', 'Première', 'Terminale C', 'Terminale D']);
        }
      } catch (err) {
        console.error('Error fetching classes for library:', err);
        setClassesList(['6ème A', '5ème B', '4ème A', '3ème C', 'Seconde', 'Première', 'Terminale']);
      }
    };
    fetchClasses();
  }, [activeEstId]);

  // Load books & loans in real-time
  useEffect(() => {
    const qBooks = query(collection(db, 'library_books'));
    const unsubscribeBooks = onSnapshot(qBooks, (snapshot) => {
      const bList = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => ({ id: doc.id, ...doc.data() })) as BookItem[];
      setBooks(bList);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to library books:', err);
      setLoading(false);
    });

    const qLoans = query(collection(db, 'library_loans'));
    const unsubscribeLoans = onSnapshot(qLoans, (snapshot) => {
      const lList = snapshot.docs
        .filter(doc => (doc.data().etablissement || 'EDU-001') === activeEstId)
        .map(doc => ({ id: doc.id, ...doc.data() })) as LoanRecord[];
      setLoans(lList);
    }, (err) => {
      console.error('Error listening to library loans:', err);
    });

    return () => {
      unsubscribeBooks();
      unsubscribeLoans();
    };
  }, [activeEstId]);

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Ko';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (cap at 15MB for Firestore dataUrl)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Le fichier dépasse la limite recommandée de 15 Mo. Veuillez choisir un document optimisé ou utiliser un lien en ligne.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedFile({
        dataUrl,
        name: file.name,
        size: formatBytes(file.size),
        sizeBytes: file.size
      });
      setIsUploading(false);
    };

    reader.onerror = () => {
      setUploadError('Erreur lors de la lecture du fichier PDF local.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;

    try {
      const bookData: any = {
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        isbn: newBook.isbn?.trim() || '',
        category: newBook.category,
        targetClass: newBook.targetClass,
        pdfUrl: newBook.pdfUrl?.trim() || '', // Optional
        description: newBook.description?.trim() || '',
        pageCount: newBook.pageCount ? parseInt(newBook.pageCount) : null,
        publishedYear: newBook.publishedYear || '',
        status: 'available',
        etablissement: activeEstId,
        addedAt: serverTimestamp(),
        addedBy: currentUser?.email || 'Admin'
      };

      // If user uploaded a local PDF file, include it
      if (uploadedFile) {
        bookData.fileData = uploadedFile.dataUrl;
        bookData.fileName = uploadedFile.name;
        bookData.fileSize = uploadedFile.size;
        // If no external URL was provided, use the dataUrl as pdfUrl for seamless viewing
        if (!bookData.pdfUrl) {
          bookData.pdfUrl = uploadedFile.dataUrl;
        }
      }

      await addDoc(collection(db, 'library_books'), bookData);

      setShowAddModal(false);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        category: 'Manuel Scolaire',
        targetClass: 'all',
        pdfUrl: '',
        description: '',
        pageCount: '',
        publishedYear: new Date().getFullYear().toString()
      });
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSuccessInfo({
        title: 'Ouvrage publié avec succès',
        message: `Le livre "${bookData.title}" a été ajouté au fonds documentaire ${
          bookData.targetClass === 'all' ? 'pour toutes les classes' : `pour la classe dédiée ${bookData.targetClass}`
        }.`
      });
      setShowSuccess(true);
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Erreur lors de l\'enregistrement du livre.');
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du livre "${title}" de la bibliothèque ?`)) return;
    try {
      await deleteDoc(doc(db, 'library_books', id));
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  const handleBorrow = async (book: BookItem) => {
    const studentName = prompt(`Nom et prénom de l'emprunteur pour "${book.title}" :`);
    if (!studentName || !studentName.trim()) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 2 weeks standard loan

    try {
      const loanRef = await addDoc(collection(db, 'library_loans'), {
        bookId: book.id,
        bookTitle: book.title,
        borrowerName: studentName.trim(),
        loanDate: serverTimestamp(),
        dueDate: dueDate.toISOString(),
        status: 'active',
        etablissement: activeEstId
      });

      await updateDoc(doc(db, 'library_books', book.id), {
        status: 'borrowed',
        currentBorrowerName: studentName.trim(),
        currentLoanId: loanRef.id
      });
    } catch (error) {
      console.error('Error borrowing book:', error);
    }
  };

  const handleReturn = async (book: BookItem) => {
    if (!book.currentLoanId) return;

    try {
      await updateDoc(doc(db, 'library_loans', book.currentLoanId), {
        returnDate: serverTimestamp(),
        status: 'returned'
      });

      await updateDoc(doc(db, 'library_books', book.id), {
        status: 'available',
        currentBorrowerName: null,
        currentLoanId: null
      });
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  // Filter books based on search, category, and target class
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesClass = selectedClassFilter === 'all' || 
                         book.targetClass === selectedClassFilter || 
                         book.targetClass === 'all' ||
                         !book.targetClass;

    return matchesSearch && matchesCategory && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <LibraryIcon size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Bibliothèque Numérique & Fonds Documentaire
                <span className="text-xs px-2.5 py-0.5 font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-full">
                  {currentEstablishment?.nom || 'Campus'}
                </span>
              </h1>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                Consultez, téléversez des manuels PDF et affectez des ressources documentaires aux classes dédiées.
              </p>
            </div>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-3 rounded-2xl font-black transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Nouveau Livre / Document PDF
          </button>
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl w-fit border border-gray-200/50 dark:border-gray-700/50">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'catalog' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <BookOpen size={16} />
            Catalogue & Bibliothèque ({filteredBooks.length})
          </button>
          <button 
            onClick={() => setActiveTab('loans')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'loans' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <History size={16} />
            Gestion des Emprunts ({loans.filter(l => l.status === 'active').length})
          </button>
        </div>

        {/* Global Stats Summary */}
        <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <Book size={14} /> Total ouvrages : <strong className="text-gray-900 dark:text-white">{books.length}</strong>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <FileText size={14} /> PDFs disponibles : <strong className="text-gray-900 dark:text-white">{books.filter(b => b.pdfUrl || b.fileData).length}</strong>
          </span>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par titre, auteur, ISBN, mot-clé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Toutes les disciplines / Catégories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Dedicated Class Filter */}
            <div className="relative">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">🎓 Toutes les classes (Fonds général)</option>
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>Classe : {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Book Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 font-bold">Chargement des ouvrages de la bibliothèque...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-3">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                <BookOpen size={28} />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Aucun livre ne correspond aux filtres sélectionnés</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Essayez d'ajuster votre recherche ou ajoutez un nouveau livre ou document PDF en cliquant sur le bouton ci-dessus.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700"
                >
                  <Plus size={16} /> Ajouter un livre maintenant
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredBooks.map((book) => {
                  const hasPdf = Boolean(book.pdfUrl || book.fileData);
                  return (
                    <motion.div
                      key={book.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all relative overflow-hidden"
                    >
                      {/* Top Header Card */}
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2">
                            <div className="p-3 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-105 transition-transform border border-indigo-100 dark:border-indigo-900/40">
                              <BookOpen size={22} />
                            </div>
                            {hasPdf && (
                              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-center justify-center">
                                <FileText size={22} />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              book.status === 'available' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}>
                              {book.status === 'available' ? '✓ Disponible' : '⏳ Emprunté'}
                            </span>

                            {/* Dedicated Class Badge */}
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                              book.targetClass && book.targetClass !== 'all'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              <GraduationCap size={12} />
                              {book.targetClass && book.targetClass !== 'all' ? `Classe : ${book.targetClass}` : 'Toutes classes'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Author */}
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug line-clamp-2 mt-1">
                          {book.title}
                        </h3>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                          <User size={13} className="text-gray-400" />
                          {book.author}
                        </p>

                        {/* Metadata Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-gray-600">
                            {book.category}
                          </span>
                          {book.isbn && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-[10px] font-mono rounded-lg">
                              ISBN: {book.isbn}
                            </span>
                          )}
                          {book.fileSize && (
                            <span className="px-2 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg border border-rose-100 dark:border-rose-900">
                              PDF ({book.fileSize})
                            </span>
                          )}
                        </div>

                        {/* Description Preview */}
                        {book.description && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5 line-clamp-2 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl">
                            "{book.description}"
                          </p>
                        )}
                      </div>

                      {/* Borrow Status / Bottom Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        {book.status === 'borrowed' && book.currentBorrowerName && (
                          <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                              <User size={13} />
                              <span>{book.currentBorrowerName}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400">En prêt</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {/* Read / Consult PDF Button */}
                          {hasPdf && (
                            <button
                              onClick={() => setReadingBook(book)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black transition-all shadow-sm"
                            >
                              <Eye size={14} />
                              Lire / Ouvrir le PDF
                            </button>
                          )}

                          {/* Admin Borrow / Return actions */}
                          {isAdmin && (
                            <>
                              {book.status === 'available' ? (
                                <button 
                                  onClick={() => handleBorrow(book)}
                                  className={`${hasPdf ? 'px-3' : 'flex-1'} py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1`}
                                  title="Prêter cet ouvrage à un élève"
                                >
                                  <Bookmark size={14} />
                                  <span>{hasPdf ? 'Prêter' : 'Emprunter'}</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleReturn(book)}
                                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Check size={14} />
                                  Retourner
                                </button>
                              )}

                              <button 
                                onClick={() => handleDeleteBook(book.id, book.title)}
                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                title="Supprimer ce livre"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        /* Loans Table Tab */
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <History size={16} className="text-indigo-600" />
              Historique & Registre des Prêts
            </h3>
            <span className="text-xs font-bold text-gray-500">
              {loans.length} transaction(s) enregistrée(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Ouvrage</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Emprunteur</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Date de Sortie</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Retour Prévu</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400 font-bold">
                      Aucun prêt enregistré actuellement pour cet établissement.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors text-xs font-semibold">
                      <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{loan.bookTitle}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <User size={13} className="text-indigo-500" />
                        {loan.borrowerName}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {loan.loanDate?.toDate ? loan.loanDate.toDate().toLocaleDateString() : 'En attente'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          loan.status === 'active' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400'
                        }`}>
                          {loan.status === 'active' ? '● En cours' : '✓ Restitué'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal with Local File Upload & Dedicated Class Selection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full p-8 border border-white/20 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Nouveau Livre ou Manuel PDF</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Téléversez un document depuis votre appareil et assignez-le à une classe dédiée</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-4">
              {/* Titre & Auteur */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                  Titre du livre / document <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Manuel de Mathématiques 3ème - Collection CIAM"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                    Auteur / Éditeur <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Prof. Martinien / Éditions Nathan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                    Discipline / Catégorie
                  </label>
                  <select
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classe Dédiée & ISBN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                    <GraduationCap size={14} />
                    Classe Dédiée / Public cible <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newBook.targetClass}
                    onChange={(e) => setNewBook({ ...newBook, targetClass: e.target.value })}
                    className="w-full bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-4 py-3 text-xs font-black text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">🌍 Toutes les classes (Fonds général)</option>
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>🎓 Réservé à : {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                    ISBN / Réf. Interne <span className="text-gray-400 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-mono text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="978-2-09-171234-5"
                  />
                </div>
              </div>

              {/* SECTION: TÉLÉVERSEMENT FICHIER PDF DEPUIS L'APPAREIL */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-rose-50/70 dark:from-indigo-950/20 dark:to-rose-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <FileUp size={16} className="text-rose-600 dark:text-rose-400" />
                    Téléverser le document PDF depuis l'appareil
                  </label>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md shadow-xs">
                    PDF, EPUB (max 15 Mo)
                  </span>
                </div>

                {!uploadedFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                      <Upload size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                        {isUploading ? 'Lecture du fichier en cours...' : 'Cliquez ou glissez-déposez le fichier PDF ici'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Parcourir les fichiers de votre ordinateur, tablette ou smartphone
                      </p>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="application/pdf,.pdf,.epub" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-black text-gray-900 dark:text-white truncate">{uploadedFile.name}</p>
                        <p className="text-[10px] font-bold text-gray-500">{uploadedFile.size} • Fichier prêt pour publication</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveUploadedFile}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-2"
                      title="Changer de fichier"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl">
                    <AlertCircle size={15} />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* LIEN EN LIGNE (OPTIONNEL) */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center justify-between">
                  <span>Lien du document PDF en ligne</span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                    Non obligatoire / Optionnel
                  </span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="url"
                    value={newBook.pdfUrl}
                    onChange={(e) => setNewBook({ ...newBook, pdfUrl: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-xs font-mono text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://exemple.com/document.pdf (facultatif si fichier déjà téléversé)"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 italic px-1">
                  Si vous n'avez pas de lien en ligne, le document téléversé ci-dessus sera directement consultable par la classe.
                </p>
              </div>

              {/* Description & Pages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                    Résumé / Description du cours
                  </label>
                  <input
                    type="text"
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Chapitres 1 à 6 conformes au programme officiel"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                    Nombre de pages
                  </label>
                  <input
                    type="number"
                    value={newBook.pageCount}
                    onChange={(e) => setNewBook({ ...newBook, pageCount: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: 240"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Publier l'ouvrage dans le catalogue
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PDF Viewer Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col border border-gray-700 overflow-hidden"
          >
            {/* Viewer Header */}
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-rose-600 text-white rounded-xl">
                  <FileText size={20} />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-black truncate">{readingBook.title}</h3>
                  <p className="text-xs text-gray-400">
                    Auteur : {readingBook.author} {readingBook.targetClass && readingBook.targetClass !== 'all' ? `• Dédié à la classe : ${readingBook.targetClass}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {readingBook.pdfUrl && (
                  <a
                    href={readingBook.pdfUrl}
                    download={readingBook.fileName || `${readingBook.title}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <Download size={14} />
                    Télécharger
                  </a>
                )}
                <button
                  onClick={() => setReadingBook(null)}
                  className="p-2 bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Embedded PDF Frame */}
            <div className="flex-1 bg-gray-950 p-2 overflow-hidden flex items-center justify-center">
              {readingBook.pdfUrl || readingBook.fileData ? (
                <iframe
                  src={readingBook.pdfUrl || readingBook.fileData}
                  className="w-full h-full rounded-2xl border border-gray-800 bg-white"
                  title={readingBook.title}
                />
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <AlertCircle size={32} className="mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-bold">Aucun document numérique associé à ce livre physique.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
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
}
