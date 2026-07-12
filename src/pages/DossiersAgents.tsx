import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  FileText, 
  User as UserIcon, 
  Bot, 
  Trash2, 
  Download, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  BookOpen,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { User, Dossier, Message } from "../types";



export default function App() {
  // Real-time user state (defaulting to the admin user Martinien Mvezogo)
  const [currentUser, setCurrentUser] = useState<User>({
    nom: "Mvezogo",
    prenom: "Martinien",
    role: "admin",
    matricule: "MVL2026",
    biographie: "Ingénieur en Développement de Solutions Digitales."
  });

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [activeAgent, setActiveAgent] = useState<"orientation" | "administratif" | "juridique">("orientation");
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDossierTitle, setNewDossierTitle] = useState("");
  const [newDossierCategory, setNewDossierCategory] = useState<"Orientation" | "Administratif" | "Juridique">("Orientation");
  const [newDossierDesc, setNewDossierDesc] = useState("");

  // Notification and load states
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen to real-time user name and info from Firestore
  useEffect(() => {
    const userDocRef = doc(db, "users", "ECbTecvkpYYbSkNgu2UBdkMEr6s2");
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentUser({
          nom: data.nom || "Mvezogo",
          prenom: data.prenom || "Martinien",
          role: data.role || "admin",
          matricule: data.matricule || "MVL2026",
          biographie: data.biographie || "",
          status: data.status || "online",
          diploma: data.diploma || "Master 2"
        });
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to real-time dossiers list from Firestore
  useEffect(() => {
    const dossiersColRef = collection(db, "dossiers");
    const unsubscribe = onSnapshot(dossiersColRef, (querySnapshot) => {
      const items: Dossier[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || "Sans titre",
          category: data.category || "Orientation",
          agentRole: data.agentRole || "orientation",
          description: data.description || "",
          createdAt: data.createdAt || new Date().toISOString(),
          userName: data.userName || "Martinien Mvezogo"
        });
      });
      // Sort by creation date descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDossiers(items);
    }, (error) => {
      console.error("Error listening to dossiers:", error);
    });

    return () => unsubscribe();
  }, []);

  // 3. Clear existing dossiers on user request (or on mount to comply with "supprimer les dossiers enregistrer actuellement")
  // We will provide a clean programmatic way to delete them and show an immediate success indicator
  const handleDeleteAllDossiers = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer tous les dossiers enregistrés actuellement ? Cette action est irréversible.")) {
      setIsDeletingAll(true);
      try {
        const querySnapshot = await getDocs(collection(db, "dossiers"));
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(doc(db, "dossiers", docSnap.id)));
        });
        await Promise.all(deletePromises);
        setSelectedDossier(null);
        showNotification("success", "Tous les dossiers précédents ont été supprimés avec succès !");
      } catch (error: any) {
        console.error("Error deleting dossiers:", error);
        showNotification("error", `Échec de la suppression: ${error.message}`);
      } finally {
        setIsDeletingAll(false);
      }
    }
  };

  // Helper to show custom toasts
  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 4. Initialize agent welcome message on agent selection
  useEffect(() => {
    const welcomeMessages = {
      orientation: `Bonjour **${currentUser.prenom} ${currentUser.nom}**, je suis votre **Agent d'Orientation Académique**. Je peux vous guider dans le choix de vos filières, universités (comme l'Université de Libreville ou de l'étranger), et structurer vos candidatures. Comment puis-je vous orienter aujourd'hui ?`,
      administratif: `Bonjour **${currentUser.prenom} ${currentUser.nom}**, je suis votre **Agent de Rédaction Administrative**. Je suis expert dans la rédaction de lettres officielles, la relecture de dossiers d'inscription, et la structuration de vos rapports officiels. Que souhaitez-vous rédiger ?`,
      juridique: `Bonjour **${currentUser.prenom} ${currentUser.nom}**, je suis votre **Agent d'Analyse Juridique**. Je peux vous accompagner dans l'analyse de contrats administratifs, l'analyse réglementaire de vos documents scolaires et de vos dossiers. Précisez-moi votre demande pour démarrer.`
    };

    setMessages([
      {
        id: "welcome",
        sender: "agent",
        text: welcomeMessages[activeAgent],
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [activeAgent, currentUser.prenom, currentUser.nom]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 5. Send message to AI Agent (Express server proxy calling Gemini API)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          userName: `${currentUser.prenom} ${currentUser.nom}`,
          agentRole: activeAgent
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de communication avec le serveur intelligent.");
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: data.reply || "Désolé, je n'ai pas pu générer de réponse.",
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: `⚠️ Une erreur s'est produite : ${error.message || "Impossible de joindre le serveur intelligent."}`,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // 6. Create a brand new dossier in Firestore
  const handleCreateDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDossierTitle.trim() || !newDossierDesc.trim()) {
      showNotification("error", "Veuillez remplir le titre et la description du dossier.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "dossiers"), {
        title: newDossierTitle,
        category: newDossierCategory,
        agentRole: activeAgent,
        description: newDossierDesc,
        createdAt: new Date().toISOString(),
        userName: `${currentUser.prenom} ${currentUser.nom}`
      });

      showNotification("success", `Dossier "${newDossierTitle}" créé et sauvegardé dans Firestore en temps réel !`);
      setNewDossierTitle("");
      setNewDossierDesc("");
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("Error creating dossier:", error);
      showNotification("error", `Erreur de création: ${error.message}`);
    }
  };

  // 7. Dynamic PDF downloader module solving user request 1
  const handleDownloadPDF = (dossier: Dossier) => {
    try {
      const docPdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Background accent
      docPdf.setFillColor(248, 250, 252); // slate-50
      docPdf.rect(0, 0, 210, 297, "F");

      // Draw elegant margins
      docPdf.setDrawColor(226, 232, 240); // slate-200
      docPdf.setLineWidth(0.5);
      docPdf.rect(10, 10, 190, 277);

      // Header Brand
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(20);
      docPdf.setTextColor(15, 23, 42); // slate-900
      docPdf.text("PORTAIL DOSSIERS & AGENTS", 20, 25);

      // Subtitle / Stamp
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(9);
      docPdf.setTextColor(100, 116, 139); // slate-500
      docPdf.text("DOCUMENT SYNTHÈSE OFFICIEL ET SÉCURISÉ", 20, 30);
      
      const formatedDate = new Date(dossier.createdAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      docPdf.text(`GÉNÉRÉ LE : ${formatedDate.toUpperCase()}`, 130, 25);

      // Decorative Top Line
      docPdf.setFillColor(15, 23, 42); // slate-900
      docPdf.rect(20, 34, 170, 1.5, "F");

      // Dossier Info block
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(14);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text("1. IDENTIFICATION DU DOSSIER", 20, 47);

      docPdf.setFontSize(10);
      docPdf.setFont("helvetica", "normal");
      docPdf.setTextColor(71, 85, 105); // slate-600

      // Layout Grid info
      docPdf.text(`Titre du dossier :`, 20, 55);
      docPdf.setFont("helvetica", "bold");
      docPdf.text(dossier.title, 60, 55);

      docPdf.setFont("helvetica", "normal");
      docPdf.text(`Catégorie :`, 20, 61);
      docPdf.setFont("helvetica", "bold");
      docPdf.text(dossier.category, 60, 61);

      docPdf.setFont("helvetica", "normal");
      docPdf.text(`Agent Assigné :`, 20, 67);
      docPdf.setFont("helvetica", "bold");
      docPdf.text(dossier.agentRole.toUpperCase(), 60, 67);

      docPdf.setFont("helvetica", "normal");
      docPdf.text(`Auteur / Bénéficiaire :`, 20, 73);
      docPdf.setFont("helvetica", "bold");
      docPdf.text(dossier.userName, 60, 73);

      docPdf.setFont("helvetica", "normal");
      docPdf.text(`ID Document :`, 20, 79);
      docPdf.setFont("helvetica", "italic");
      docPdf.text(dossier.id, 60, 79);

      // Section: Notes et contenu
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(14);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text("2. CONTENU DU DOSSIER & NOTES", 20, 93);

      // Wrap text for description
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(10.5);
      docPdf.setTextColor(51, 65, 85); // slate-700
      const splitText = docPdf.splitTextToSize(dossier.description, 165);
      docPdf.text(splitText, 20, 101);

      // Footnote sign blocks
      docPdf.setDrawColor(226, 232, 240);
      docPdf.setLineWidth(0.5);
      docPdf.line(20, 235, 190, 235);

      // Stamp Text
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(9);
      docPdf.setTextColor(100, 116, 139);
      docPdf.text("CONFORME AUX PROTOCOLES ET EXIGENCES ADMINISTRATIVES", 20, 242);

      // Signatures
      docPdf.setFontSize(10);
      docPdf.text("Signature de l'Usager", 20, 255);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(dossier.userName, 20, 261);

      docPdf.setFont("helvetica", "bold");
      docPdf.text(`Signature Agent ${dossier.agentRole.toUpperCase()}`, 130, 255);
      docPdf.setFont("helvetica", "italic");
      docPdf.text("Approuvé électroniquement", 130, 261);

      // Save/Download PDF triggers actual download
      docPdf.save(`DOSSIER_${dossier.title.replace(/\s+/g, "_").toUpperCase()}.pdf`);
      showNotification("success", `Téléchargement du PDF "${dossier.title}" déclenché avec succès !`);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      showNotification("error", `Erreur de génération PDF: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-slate-900 selection:text-white" id="main-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              notification.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : notification.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
            id="toast-notification"
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <Info className="w-5 h-5 text-blue-600" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40" id="header-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 tracking-tight">Portail Dossiers & Agents</h1>
              <p className="text-xs text-slate-500 font-medium">Plateforme d'Assistant d'Elite • IA & Firestore</p>
            </div>
          </div>

          {/* User Real-time connection badge */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200" id="user-profile-badge">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                {currentUser.prenom[0]}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none">
                {currentUser.prenom} {currentUser.nom}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                {currentUser.role} • Matricule {currentUser.matricule}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content">
        {/* Left Side: Agent Workspace (7 cols) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-6" id="agent-workspace">
          {/* Agent Selection Ribbon */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-900" /> Sélectionnez votre Agent IA
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Model: Gemini 3.5</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* Agent 1: Orientation */}
              <button
                onClick={() => setActiveAgent("orientation")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  activeAgent === "orientation"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
                id="agent-btn-orientation"
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-semibold leading-tight">Orientation</span>
              </button>

              {/* Agent 2: Administratif */}
              <button
                onClick={() => setActiveAgent("administratif")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  activeAgent === "administratif"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
                id="agent-btn-administratif"
              >
                <Briefcase className="w-5 h-5" />
                <span className="text-xs font-semibold leading-tight">Administratif</span>
              </button>

              {/* Agent 3: Juridique */}
              <button
                onClick={() => setActiveAgent("juridique")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  activeAgent === "juridique"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
                id="agent-btn-juridique"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-semibold leading-tight">Juridique</span>
              </button>
            </div>
          </div>

          {/* Intelligent Interactive Chat Terminal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[450px]" id="chat-terminal">
            {/* Terminal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 uppercase tracking-wide">
                    {activeAgent === "orientation" ? "Agent d'Orientation" : activeAgent === "administratif" ? "Agent Administratif" : "Agent Juridique"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Prise en compte de {currentUser.prenom} {currentUser.nom} en temps réel</p>
                </div>
              </div>
              <button 
                onClick={() => setMessages(prev => [prev[0]])}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
                id="reset-chat-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
              </button>
            </div>

            {/* Chat Body messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[350px]" id="chat-messages-container">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                    }`}>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                      <span className={`text-[9px] mt-2 block text-right font-medium ${
                        msg.sender === "user" ? "text-slate-400" : "text-slate-500"
                      }`}>{msg.timestamp}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 border border-slate-200 flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Posez une question ou demandez une rédaction d'acte officiel..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 shadow-inner"
                id="chat-input-field"
              />
              <button
                type="submit"
                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
                id="send-msg-btn"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Dossier Management (5 cols) */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-6" id="dossiers-workspace">
          {/* Dossier Hub Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">Gestionnaire de Dossiers</h2>
                <p className="text-xs text-slate-500 font-medium">{dossiers.length} dossiers sauvegardés</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow hover:bg-slate-800 transition-all"
                id="open-create-dossier-modal"
              >
                <Plus className="w-4 h-4" /> Nouveau Dossier
              </button>
            </div>

            {/* Clear all dossiers triggers user request 2 */}
            <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-900">Demande de purge</p>
                  <p className="text-[10px] text-rose-700 leading-normal">Purgez tous les anciens dossiers conformément à vos instructions.</p>
                </div>
              </div>
              <button
                onClick={handleDeleteAllDossiers}
                disabled={isDeletingAll}
                className="bg-rose-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-700 disabled:bg-rose-300 transition-colors flex items-center gap-1 shadow-sm"
                id="clear-dossiers-btn"
              >
                {isDeletingAll ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {isDeletingAll ? "Purge..." : "Purger"}
              </button>
            </div>
          </div>

          {/* Real-time Dossier List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[350px]" id="dossiers-list-container">
            <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Liste des Dossiers Enregistrés</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Firestore synchronisé"></span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
              {dossiers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <FileText className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Aucun dossier enregistré</p>
                  <p className="text-xs text-slate-400 mt-1">Créez un nouveau dossier ou demandez à l'un de nos agents virtuels d'initier la rédaction d'un acte officiel.</p>
                </div>
              ) : (
                dossiers.map((dossier) => (
                  <div
                    key={dossier.id}
                    onClick={() => setSelectedDossier(dossier)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      selectedDossier?.id === dossier.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                    id={`dossier-card-${dossier.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{dossier.title}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        selectedDossier?.id === dossier.id
                          ? "bg-white/20 text-white"
                          : dossier.category === "Orientation"
                          ? "bg-blue-100 text-blue-800"
                          : dossier.category === "Administratif"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {dossier.category}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      selectedDossier?.id === dossier.id ? "text-slate-300" : "text-slate-600"
                    }`}>{dossier.description}</p>
                    <div className="flex items-center justify-between text-[10px] mt-1">
                      <span className={selectedDossier?.id === dossier.id ? "text-slate-400" : "text-slate-400"}>
                        {new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <span className={`font-mono ${selectedDossier?.id === dossier.id ? "text-slate-300" : "text-slate-500"}`}>
                        Par {dossier.userName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Selected Dossier Drawer Detail panel solving PDF request */}
      <AnimatePresence>
        {selectedDossier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDossier(null)}
            id="modal-backdrop-dossier"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {selectedDossier.category}
                  </span>
                  <h3 className="font-display font-bold text-lg mt-1">{selectedDossier.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedDossier(null)}
                  className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
                  id="close-detail-modal"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="text-slate-400 font-medium">Bénéficiaire :</p>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedDossier.userName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Créé le :</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {new Date(selectedDossier.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Agent Virtuel :</p>
                    <p className="font-bold text-slate-800 mt-0.5 uppercase">{selectedDossier.agentRole}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">ID Document Firestore :</p>
                    <p className="font-mono text-slate-500 mt-0.5 break-all">{selectedDossier.id}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contenu & Recommandations de l'Agent</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                    {selectedDossier.description}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedDossier)}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 transition-colors"
                    id="download-pdf-modal-btn"
                  >
                    <Download className="w-5 h-5" /> Télécharger le PDF Officiel
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("Supprimer ce dossier ?")) {
                        await deleteDoc(doc(db, "dossiers", selectedDossier.id));
                        setSelectedDossier(null);
                        showNotification("success", "Dossier supprimé de Firestore !");
                      }
                    }}
                    className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-3 rounded-xl border border-rose-200 transition-colors"
                    id="delete-single-dossier-btn"
                    title="Supprimer le dossier"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual creation modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
            id="create-modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Nouveau Dossier Administratif</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
                  id="close-create-modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDossier} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Titre du dossier</label>
                  <input
                    type="text"
                    required
                    value={newDossierTitle}
                    onChange={(e) => setNewDossierTitle(e.target.value)}
                    placeholder="Ex: Demande de réorientation ou dossier d'admission"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                    id="new-dossier-title-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Catégorie</label>
                  <select
                    value={newDossierCategory}
                    onChange={(e) => setNewDossierCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                    id="new-dossier-category-select"
                  >
                    <option value="Orientation">Orientation</option>
                    <option value="Administratif">Administratif</option>
                    <option value="Juridique">Juridique</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Contenu / Description des notes</label>
                  <textarea
                    required
                    rows={4}
                    value={newDossierDesc}
                    onChange={(e) => setNewDossierDesc(e.target.value)}
                    placeholder="Saisissez ici le contenu du dossier rédigé ou les conclusions formulées par l'agent..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                    id="new-dossier-desc-textarea"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow hover:bg-slate-800 transition-colors mt-2"
                  id="submit-new-dossier-btn"
                >
                  <Plus className="w-5 h-5" /> Enregistrer dans Firestore
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          Portail Dossiers & Agents • Développé de manière robuste, responsive et sécurisée • © {new Date().getFullYear()} Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
