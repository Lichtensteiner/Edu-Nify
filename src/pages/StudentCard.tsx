import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { QRCodeSVG } from 'qrcode.react';
import { UserCircle, GraduationCap, Hash, Mail, Castle, Phone, MapPin, Globe, Shield, Calendar, Users, Download, Award, AlertTriangle, Check, BookOpen, Plus, Sparkles, LogOut } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotification } from '../contexts/NotificationContext';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface SystemHeaderInfo {
  pays: string;
  deviseNationale: string;
  ministere: string;
  direction: string;
  nomEtablissement: string;
  adresseEtablissement: string;
  contactEtablissement: string;
  codePays: string;
  flagEmoji: string;
}

export function getSystemHeaderInfo(systemeScolaire?: string, est?: any): SystemHeaderInfo {
  const systemNormalized = (systemeScolaire || est?.systemeScolaire || '').toLowerCase();
  const adresseNormalized = (est?.adresse || '').toLowerCase();

  // Gabon
  if (systemNormalized.includes('gabon') || adresseNormalized.includes('gabon')) {
    return {
      pays: "RÉPUBLIQUE GABONAISE",
      deviseNationale: "Union – Travail – Justice",
      ministere: "MINISTÈRE DE L’ÉDUCATION NATIONALE",
      direction: "DIRECTION D’ACADÉMIE PROVINCIALE",
      nomEtablissement: est?.nom || "Ludo_Consulting",
      adresseEtablissement: est?.adresse || "Libreville, Gabon",
      contactEtablissement: est?.telephone ? `Tél: ${est.telephone}` : "Téléphone non disponible",
      codePays: "GA",
      flagEmoji: "🇬🇦"
    };
  }

  // France
  if (systemNormalized.includes('fran') || adresseNormalized.includes('france')) {
    return {
      pays: "RÉPUBLIQUE FRANÇAISE",
      deviseNationale: "Liberté – Égalité – Fraternité",
      ministere: "MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE LA JEUNESSE",
      direction: "RECTORAT D’ACADÉMIE",
      nomEtablissement: est?.nom || "Ludo_Consulting",
      adresseEtablissement: est?.adresse || "Paris, France",
      contactEtablissement: est?.telephone ? `Tél: ${est.telephone}` : "Téléphone non disponible",
      codePays: "FR",
      flagEmoji: "🇫🇷"
    };
  }

  // Canada / Quebec
  if (systemNormalized.includes('canad') || adresseNormalized.includes('canada') || systemNormalized.includes('quebec')) {
    return {
      pays: "GOUVERNEMENT DU CANADA / DU QUÉBEC",
      deviseNationale: "Je me souviens",
      ministere: "MINISTÈRE DE L'ÉDUCATION ET DE L'ENSEIGNEMENT SUPÉRIEUR",
      direction: "CENTRE DE SERVICES SCOLAIRE",
      nomEtablissement: est?.nom || "Ludo_Consulting",
      adresseEtablissement: est?.adresse || "Montréal, Canada",
      contactEtablissement: est?.telephone ? `Tél: ${est.telephone}` : "Téléphone non disponible",
      codePays: "CA",
      flagEmoji: "🇨🇦"
    };
  }

  // Default / International
  return {
    pays: "REPRÉSENTATION ACADÉMIQUE OFFICIELLE",
    deviseNationale: "Science – Éthique – Progrès",
    ministere: "MINISTÈRE DE L'ÉDUCATION & DE LA FORMATION PROFESSIONNELLE",
    direction: "DIRECTION GÉNÉRALE DES ENSEIGNEMENTS",
    nomEtablissement: est?.nom || "Ludo_Consulting",
    adresseEtablissement: est?.adresse || "Campus Éducatif",
    contactEtablissement: est?.telephone ? `Tél: ${est.telephone}` : "Téléphone non disponible",
    codePays: "INT",
    flagEmoji: "🌍"
  };
}

export function CountryFlag({ code, className = "w-8 h-5" }: { code: string; className?: string }) {
  if (code === "GA") {
    return (
      <div className={`flex flex-col rounded-sm overflow-hidden shadow-sm border border-black/10 dark:border-white/10 ${className}`}>
        <div className="h-1/3 bg-[#4CAF50]"></div>
        <div className="h-1/3 bg-[#FFEB3B]"></div>
        <div className="h-1/3 bg-[#2196F3]"></div>
      </div>
    );
  }
  if (code === "FR") {
    return (
      <div className={`flex rounded-sm overflow-hidden shadow-sm border border-black/10 dark:border-white/10 ${className}`}>
        <div className="w-1/3 bg-[#2196F3]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#F44336]"></div>
      </div>
    );
  }
  if (code === "CA") {
    return (
      <div className={`relative flex rounded-sm overflow-hidden shadow-sm border border-black/10 dark:border-white/10 bg-white ${className}`}>
        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-[#F44336]"></div>
        <div className="flex-1 flex items-center justify-center">
          <svg viewBox="0 0 10 10" className="w-1/2 h-1/2 text-[#F44336] fill-current">
            <path d="M5,1 L5.3,3.3 L7.5,2.5 L6.3,4.3 L8,5.5 L5.8,5.5 L5,8 L4.2,5.5 L2,5.5 L3.7,4.3 L2.5,2.5 L4.7,3.3 Z" />
          </svg>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-[#F44336]"></div>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30 ${className}`}>
      <Globe size={12} className="animate-spin-slow" />
    </div>
  );
}

export default function StudentCard() {
  const { currentUser } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const { notifySuccess, notifyError } = useNotification();
  const [house, setHouse] = useState<any>(null);
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubscribe = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const clubsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllClubs(clubsData);
      const userClubs = clubsData.filter((c: any) => c.members?.includes(currentUser.id));
      setJoinedClubs(userClubs);
      setLoadingClubs(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleJoinLeaveClub = async (club: any) => {
    if (!currentUser) return;
    
    // Teachers cannot join/leave student clubs
    if (currentUser.role === 'enseignant') {
      notifyError("En tant qu'enseignant, vous devez être géré par un administrateur.");
      return;
    }

    const isMember = club.members?.includes(currentUser.id);
    const clubRef = doc(db, 'clubs', club.id);
    
    try {
      if (isMember) {
        await updateDoc(clubRef, {
          members: arrayRemove(currentUser.id)
        });
        notifySuccess(`Vous avez quitté le club : ${club.name}`);
      } else {
        await updateDoc(clubRef, {
          members: arrayUnion(currentUser.id)
        });
        notifySuccess(`Félicitations ! Vous avez rejoint le club : ${club.name}`);
      }
    } catch (error) {
      console.error("Error joining/leaving club:", error);
      notifyError("Une erreur est survenue lors de l'inscription au club.");
    }
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    if (!hex) return [79, 70, 229]; // Indigo default
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const num = parseInt(hex, 16);
    if (isNaN(num)) return [79, 70, 229];
    return [
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255
    ];
  };

  const getImageDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        // Fallback for CORS or missing image
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      let pName = parentInfo ? `${parentInfo.prenom || ''} ${parentInfo.nom || ''}`.trim() : (currentUser.parent_nom || currentUser.parentNom || currentUser.nom_parent || currentUser.parentName || currentUser.tuteur_nom || currentUser.tuteurNom || 'N/A');
      let pPhone = parentInfo ? (parentInfo.contact || parentInfo.telephone || parentInfo.phone) : (currentUser.parent_phone || currentUser.telephone_parent || currentUser.parentPhone || currentUser.tuteurPhone || 'N/A');
      let pEmail = parentInfo?.email || currentUser.parent_email || currentUser.parentEmail || 'N/A';

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      });

      // --- FRONT SIDE ---
      const primaryColorRGB = hexToRgb(currentEstablishment?.primaryColor || '#4f46e5');
      const secondaryColorRGB = hexToRgb(currentEstablishment?.secondaryColor || '#ea580c');

      // Card Background with dual brand accents
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 85.6, 53.98, 'F');
      
      doc.setFillColor(secondaryColorRGB[0], secondaryColorRGB[1], secondaryColorRGB[2]);
      doc.triangle(38, 0, 85.6, 0, 85.6, 53.98, 'F');
      
      // Dynamic Tricolor bar based on active system
      const isGabon = headerInfo.pays.includes("GABON");
      const isFrance = headerInfo.pays.includes("FRAN");

      if (isGabon) {
        doc.setFillColor(76, 175, 80); doc.rect(0, 0, 28, 1.5, 'F'); // Green
        doc.setFillColor(255, 235, 59); doc.rect(28, 0, 28, 1.5, 'F'); // Yellow
        doc.setFillColor(33, 150, 243); doc.rect(56, 0, 29.6, 1.5, 'F'); // Blue
      } else if (isFrance) {
        doc.setFillColor(33, 150, 243); doc.rect(0, 0, 28, 1.5, 'F'); // Blue
        doc.setFillColor(255, 255, 255); doc.rect(28, 0, 28, 1.5, 'F'); // White
        doc.setFillColor(244, 67, 54); doc.rect(56, 0, 29.6, 1.5, 'F'); // Red
      } else {
        doc.setFillColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]); 
        doc.rect(0, 0, 85.6, 1.5, 'F');
      }

      // Draw Logo
      const logoSize = 10;
      const logoX = 5;
      const logoY = 4;
      try {
        const logoUrl = currentEstablishment?.logo || '/logo.png';
        const imgData = await getImageDataUrl(logoUrl);
        doc.addImage(imgData, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch (e) {
        const initials = currentEstablishment?.nom ? currentEstablishment.nom.substring(0, 3).toUpperCase() : 'EDU';
        doc.setFillColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 1.5, 1.5, 'F');
        doc.setTextColor(255);
        doc.setFontSize(logoSize * 0.38);
        doc.setFont("helvetica", "bold");
        doc.text(initials, logoX + logoSize/2, logoY + logoSize/2 + 0.5, { align: 'center', baseline: 'middle' });
      }

      // Flag
      const flagX = 17, flagY = 3.8, flagW = 3.5, flagH = 2.2;
      if (headerInfo.codePays === "GA") {
        doc.setFillColor(76, 175, 80); doc.rect(flagX, flagY, flagW, flagH / 3, 'F');
        doc.setFillColor(255, 235, 59); doc.rect(flagX, flagY + flagH / 3, flagW, flagH / 3, 'F');
        doc.setFillColor(33, 150, 243); doc.rect(flagX, flagY + (2 * flagH) / 3, flagW, flagH / 3, 'F');
      } else if (headerInfo.codePays === "FR") {
        doc.setFillColor(33, 150, 243); doc.rect(flagX, flagY, flagW / 3, flagH, 'F');
        doc.setFillColor(255, 255, 255); doc.rect(flagX + flagW / 3, flagY, flagW / 3, flagH, 'F');
        doc.setFillColor(244, 67, 54); doc.rect(flagX + (2 * flagW) / 3, flagY, flagW / 3, flagH, 'F');
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4.5);
      doc.setFont("helvetica", "bold");
      doc.text(headerInfo.pays, 21.5, 5.5);

      doc.setFontSize(6.5);
      doc.text(headerInfo.nomEtablissement.toUpperCase(), 17, 10);
      
      doc.setFontSize(3.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225);
      doc.text(`${headerInfo.ministere} | ${headerInfo.direction}`, 17, 14);

      // Photo Section
      doc.setDrawColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.setLineWidth(0.3);
      const photoX = 5;
      const photoY = 20;
      doc.roundedRect(photoX, photoY, 24, 28, 1, 1, 'D');

      if (currentUser.photo) {
        try {
          const studentPhotoData = await getImageDataUrl(currentUser.photo);
          doc.addImage(studentPhotoData, 'JPEG', photoX + 0.5, photoY + 0.5, 23, 27);
        } catch (e) {
          doc.setFillColor(51, 65, 85);
          doc.roundedRect(photoX + 0.5, photoY + 0.5, 23, 27, 0.5, 0.5, 'F');
          doc.setFontSize(5);
          doc.setTextColor(200);
          doc.text("PHOTO NON DISPO", photoX + 12, photoY + 14, { align: 'center' });
        }
      } else {
        doc.setFillColor(51, 65, 85);
        doc.roundedRect(photoX + 0.5, photoY + 0.5, 23, 27, 0.5, 0.5, 'F');
        doc.setFontSize(5);
        doc.setTextColor(200);
        doc.text("PAS DE PHOTO", photoX + 12, photoY + 14, { align: 'center' });
      }

      // Details Section
      const detailsX = 34;
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "bold");
      doc.text("NOM COMPLET", detailsX, 22);
      doc.text("ID ELEVE / MATRICULE", detailsX, 33);
      doc.text("CLASSE / PROGRAMME", detailsX, 40);
      doc.text("MAISON ACADEMIQUE", detailsX, 47);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(`${currentUser.nom.toUpperCase()} ${currentUser.prenom}`, detailsX, 26);
      
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(currentUser.matricule || currentUser.id.substring(0, 10), detailsX, 36);
      doc.text(currentUser.classe?.toUpperCase() || "N/A", detailsX, 43);
      doc.text(house?.nom_maison?.toUpperCase() || "N/A", detailsX, 50);

      // QR Code
      const qrDataStr = `STUDENT_VERIF:${currentUser.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrDataStr, { 
         margin: 1,
         color: { dark: '#1e293b', light: '#ffffff' }
      });
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(68, 18, 13, 13, 1, 1, 'F');
      doc.addImage(qrDataUrl, 'PNG', 68.5, 18.5, 12, 12);

      // Academic Year Ribbon
      doc.setFillColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.roundedRect(63, 51.5, 20, 2.48, 0.5, 0.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4);
      doc.setFont("helvetica", "bold");
      doc.text(currentEstablishment?.activeSchoolYear || "2025-2026", 73, 53);

      // --- BACK SIDE ---
      doc.addPage([85.6, 53.98], 'landscape');

      // Back side background (dark Slate)
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 85.6, 53.98, 'F');

      // Tricolor bar
      if (isGabon) {
        doc.setFillColor(76, 175, 80); doc.rect(0, 0, 28, 1.5, 'F'); // Green
        doc.setFillColor(255, 235, 59); doc.rect(28, 0, 28, 1.5, 'F'); // Yellow
        doc.setFillColor(33, 150, 243); doc.rect(56, 0, 29.6, 1.5, 'F'); // Blue
      } else if (isFrance) {
        doc.setFillColor(33, 150, 243); doc.rect(0, 0, 28, 1.5, 'F'); // Blue
        doc.setFillColor(255, 255, 255); doc.rect(28, 0, 28, 1.5, 'F'); // White
        doc.setFillColor(244, 67, 54); doc.rect(56, 0, 29.6, 1.5, 'F'); // Red
      } else {
        doc.setFillColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]); 
        doc.rect(0, 0, 85.6, 1.5, 'F');
      }

      // Title on Back Side
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("COORDONNÉES, FILIATION & CLUBS", 5, 8);

      // Line separator
      doc.setDrawColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.setLineWidth(0.2);
      doc.line(5, 10, 80.6, 10);

      // Parent Info
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("NOM DU PARENT / TUTEUR :", 5, 14);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "bold");
      doc.text(pName.toUpperCase(), 5, 18);

      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("CONTACT :", 5, 24);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(pPhone, 5, 28);

      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("EMAIL :", 5, 34);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      doc.text(pEmail, 5, 38);

      // Student Registered Clubs on back side
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("CLUBS REJOINTS :", 45, 14);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4.5);
      if (joinedClubs && joinedClubs.length > 0) {
        joinedClubs.slice(0, 2).forEach((c, index) => {
          doc.text(`• ${c.name}`, 45, 18 + (index * 3), { maxWidth: 35 });
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("Aucun club rejoint", 45, 18);
        doc.setFont("helvetica", "normal");
      }

      // Student Residence Address on back side
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("ADRESSE DE L'ÉLÈVE :", 45, 26);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      const addr = currentUser.adresse || currentUser.address || 'Non spécifiée';
      doc.text(addr, 45, 30, { maxWidth: 35 });

      // Card Policy / Instructions (Mini print)
      doc.setFontSize(3.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text("Cette carte est strictement personnelle et demeure la propriété de l'établissement.", 5, 45);
      doc.text("En cas de perte, veuillez contacter immédiatement l'administration.", 5, 48);

      doc.save(`Carte_Scolaire_${currentUser.prenom}_${currentUser.nom}.pdf`);
    } catch (err) {
      console.error("Error generating PDF card:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    const fetchHouse = async () => {
      if (currentUser?.house_id) {
        try {
          const houseDoc = await getDoc(doc(db, 'houses', currentUser.house_id));
          if (houseDoc.exists()) {
            setHouse({ id: houseDoc.id, ...houseDoc.data() });
          }
        } catch (error) {
          console.error("Error fetching house:", error);
        }
      }
    };
    fetchHouse();
  }, [currentUser]);

  useEffect(() => {
    const fetchParent = async () => {
      if (currentUser?.id) {
        try {
          const q = query(
            collection(db, 'users'),
            where('role', '==', 'parent'),
            where('children_ids', 'array-contains', currentUser.id)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const parentDoc = querySnapshot.docs[0];
            setParentInfo({ id: parentDoc.id, ...parentDoc.data() });
          }
        } catch (error) {
          console.error("Error fetching parent:", error);
        }
      }
    };
    fetchParent();
  }, [currentUser]);

  if (!currentUser) return null;

  const qrData = JSON.stringify({
    id: currentUser.id,
    nom: currentUser.nom,
    prenom: currentUser.prenom,
    classe: currentUser.classe,
    matricule: currentUser.matricule,
    etablissement: currentEstablishment?.nom || "Ludo_Consulting"
  });

  const primaryColor = currentEstablishment?.primaryColor || '#4f46e5';
  const secondaryColor = currentEstablishment?.secondaryColor || '#ea580c';
  const headerInfo = getSystemHeaderInfo(currentEstablishment?.systemeScolaire, currentEstablishment);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Carte Biométrique Scolaire</h1>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-2xl transition duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer text-xs"
        >
          {isGeneratingPDF ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Génération du PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Télécharger ma carte (PDF)</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-150 dark:border-gray-700 relative">
        {/* Official Country / State Header (Place of School Info - Now on Top) */}
        <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-850 p-6 border-b-2 border-dashed border-gray-150 dark:border-gray-700 relative text-center">
          {/* Flag Tricolor ribbon on top of header */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            {headerInfo.codePays === "GA" ? (
              <>
                <div className="flex-1 h-full bg-green-500"></div>
                <div className="flex-1 h-full bg-yellow-400"></div>
                <div className="flex-1 h-full bg-blue-500"></div>
              </>
            ) : headerInfo.codePays === "FR" ? (
              <>
                <div className="flex-1 h-full bg-blue-600"></div>
                <div className="flex-1 h-full bg-white"></div>
                <div className="flex-1 h-full bg-red-600"></div>
              </>
            ) : headerInfo.codePays === "CA" ? (
              <>
                <div className="flex-1 h-full bg-red-600"></div>
                <div className="flex-1 h-full bg-white"></div>
                <div className="flex-1 h-full bg-red-600"></div>
              </>
            ) : (
              <>
                <div className="flex-1 h-full bg-indigo-600"></div>
                <div className="flex-1 h-full bg-indigo-400"></div>
                <div className="flex-1 h-full bg-orange-500"></div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 mt-2">
            {/* Left side seal representation with automatic background country flag */}
            <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 p-1 shrink-0 overflow-hidden relative shadow-inner">
              <div className="absolute inset-0 opacity-15 dark:opacity-25 flex items-center justify-center">
                <CountryFlag code={headerInfo.codePays} className="w-full h-full scale-150 blur-[0.5px]" />
              </div>
              <div className="z-10 flex flex-col items-center justify-center">
                <Shield size={20} className="text-indigo-600 dark:text-indigo-400 animate-pulse-slow" />
                <span className="text-[6px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mt-0.5">OFFICIEL</span>
              </div>
            </div>

            {/* Central Official State and Government texts */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center gap-1.5">
                <CountryFlag code={headerInfo.codePays} className="w-4 h-2.5 shrink-0 rounded-[2px]" />
                <p className="text-[11px] font-black tracking-widest text-gray-900 dark:text-white uppercase leading-none">
                  {headerInfo.pays}
                </p>
                <CountryFlag code={headerInfo.codePays} className="w-4 h-2.5 shrink-0 rounded-[2px]" />
              </div>
              <p className="text-[8px] font-black text-gray-500 dark:text-gray-400 italic mt-1 uppercase tracking-wide">
                « {headerInfo.deviseNationale} »
              </p>
              <div className="h-[1px] bg-gray-200 dark:bg-gray-700 my-1.5 max-w-[120px] mx-auto"></div>
              <p className="text-[8px] font-black text-gray-600 dark:text-gray-300 uppercase leading-tight tracking-wider">
                {headerInfo.ministere}
              </p>
              <p className="text-[7.5px] font-extrabold text-gray-400 dark:text-gray-500 uppercase leading-none mt-0.5">
                {headerInfo.direction}
              </p>
              <p className="text-[13px] font-black uppercase tracking-tight mt-2" style={{ color: primaryColor }}>
                {headerInfo.nomEtablissement}
              </p>
              <p className="text-[8.5px] font-extrabold text-gray-400 dark:text-gray-500 mt-0.5">
                {headerInfo.adresseEtablissement} {headerInfo.contactEtablissement ? `| ${headerInfo.contactEtablissement}` : ''}
              </p>
            </div>

            {/* Right side: School Logo */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <img 
                src={currentEstablishment?.logo || "/logo.png"} 
                alt={currentEstablishment?.nom || "Logo"} 
                className="h-14 w-14 object-contain rounded-xl bg-white dark:bg-gray-900 p-1.5 border border-gray-150 dark:border-gray-755 shadow-sm shrink-0" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
          </div>

          {/* Biometric Year Ribbon */}
          <div className="flex items-center justify-between mt-3 px-2">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20 shadow-sm">
              <Shield size={10} className="stroke-[3]" />
              <span>Biométrique</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-350 px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider border border-gray-200 dark:border-gray-700">
              {currentEstablishment?.activeSchoolYear || "2025-2026"}
            </div>
          </div>
        </div>

        {/* Dynamic Card Inner Background Design */}
        <div className="h-20 relative bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-900/10 dark:to-transparent">
          <div className="absolute inset-0 bg-white/5 pattern-grid-lg opacity-10"></div>
        </div>

        {/* Profile Picture */}
        <div className="flex justify-center -mt-24 relative z-10">
          <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg" style={{ boxShadow: `0 8px 30px ${primaryColor}15` }}>
            <div className="w-full h-full rounded-full overflow-hidden border-2" style={{ borderColor: primaryColor }}>
              {currentUser.photo ? (
                <img src={currentUser.photo} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-4xl uppercase">
                  {currentUser.prenom?.[0]}{currentUser.nom?.[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-8 pt-4 text-center">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{currentUser.prenom} {currentUser.nom}</h2>
          <p className="font-extrabold mb-6 capitalize tracking-wider text-xs" style={{ color: primaryColor }}>{currentUser.role}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 text-left bg-gray-55 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
            {/* Colonne Gauche: État Civil & Scolarité */}
            <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-gray-700/50 pb-4 md:pb-0 md:pr-4">
              <h3 className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider pb-1">
                État Civil & Scolarité
              </h3>
              
              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <UserCircle size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Sexe / Genre</p>
                  <p className="font-extrabold text-xs mt-0.5 truncate">
                    {(() => {
                      const g = (currentUser.gender || currentUser.sexe || '').toLowerCase();
                      if (g.startsWith('m') || g === 'homme') return 'Masculin';
                      if (g.startsWith('f') || g === 'femme') return 'Féminin';
                      return 'Non spécifié';
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Date de Naissance</p>
                  <p className="font-extrabold text-xs mt-0.5 truncate">
                    {currentUser.dateNaissance || currentUser.date_naissance || currentUser.birthDate || 'Non renseignée'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Lieu de Naissance</p>
                  <p className="font-extrabold text-xs mt-0.5 truncate">
                    {currentUser.lieuNaissance || currentUser.lieu_naissance || currentUser.birthPlace || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {currentUser.classe && (
                <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                    <GraduationCap size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Classe d'Affectation</p>
                    <p className="font-extrabold text-xs mt-0.5 truncate">{currentUser.classe}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne Droite: Adresse & Parent/Tuteur */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider pb-1">
                Filiation & Coordonnées
              </h3>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Adresse</p>
                  <p className="font-extrabold text-xs mt-1 break-all bg-gray-50 dark:bg-gray-900/30 px-2.5 py-1.5 rounded-xl border border-gray-150/40 dark:border-gray-850">
                    {currentUser.adresse || currentUser.address || 'Non spécifiée'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Users size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Parent / Tuteur</p>
                  <p className="font-extrabold text-xs mt-1 truncate">
                    {parentInfo ? `${parentInfo.prenom || ''} ${parentInfo.nom || ''}`.trim() : (currentUser.parent_nom || currentUser.parentNom || currentUser.nom_parent || currentUser.parentName || currentUser.tuteur_nom || currentUser.tuteurNom || 'Non renseigné')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Phone size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Contact du Tuteur</p>
                  <p className="font-extrabold text-xs mt-1 font-mono break-all bg-gray-50 dark:bg-gray-900/30 px-2.5 py-1.5 rounded-xl border border-gray-150/40 dark:border-gray-850">
                    {parentInfo ? (parentInfo.contact || parentInfo.telephone || parentInfo.phone || 'Non renseigné') : (currentUser.parent_phone || currentUser.telephone_parent || currentUser.parentPhone || currentUser.tuteurPhone || 'Non renseigné')}
                  </p>
                </div>
              </div>

              {(parentInfo?.email || currentUser.parent_email || currentUser.parentEmail) && (
                <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Email du Tuteur</p>
                    <p className="font-extrabold text-xs mt-1 truncate text-indigo-600 dark:text-indigo-400 bg-gray-50 dark:bg-gray-900/30 px-2.5 py-1.5 rounded-xl border border-gray-150/40 dark:border-gray-850">
                      {parentInfo ? (parentInfo.email || 'Non renseigné') : (currentUser.parent_email || currentUser.parentEmail || 'Non renseigné')}
                    </p>
                  </div>
                </div>
              )}

              {currentUser.matricule && (
                <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Hash size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Matricule Identifiant</p>
                    <p className="font-extrabold text-xs mt-0.5 font-mono tracking-wider truncate">{currentUser.matricule}</p>
                  </div>
                </div>
              )}

              {house && (
                <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm shrink-0" style={{ backgroundColor: `${house.color}20`, color: house.color }}>
                    {house.logo.startsWith('http') ? (
                      <img src={house.logo} alt={house.nom_maison} className="w-4 h-4 object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xs">{house.logo}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Maison Académique</p>
                    <p className="font-extrabold text-xs truncate" style={{ color: house.color }}>{house.nom_maison}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code and Verification status */}
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-850 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl mb-4">
            <QRCodeSVG value={qrData} size={150} level="H" includeMargin={true} />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 font-extrabold uppercase tracking-widest">Scanner Biométrique Autorisé</p>
          </div>
        </div>

        {/* Dynamic Branded footer containing structured school information */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6 text-center">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Établissement Émetteur</p>
          <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wide mt-1.5">{currentEstablishment?.nom || "Ludo_Consulting"}</p>
          
          <div className="flex flex-col gap-2 mt-4 text-[10px] font-extrabold text-gray-500 dark:text-gray-450 text-left px-2 border-l-2" style={{ borderColor: primaryColor }}>
            {currentEstablishment?.adresse && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="shrink-0 text-gray-400" />
                <span className="truncate">{currentEstablishment.adresse}</span>
              </div>
            )}
            {currentEstablishment?.telephone && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="shrink-0 text-gray-400" />
                <span>{currentEstablishment.telephone}</span>
              </div>
            )}
            {currentEstablishment?.email && (
              <div className="flex items-center gap-2">
                <Mail size={12} className="shrink-0 text-gray-400" />
                <span className="truncate">{currentEstablishment.email}</span>
              </div>
            )}
            {currentEstablishment?.siteWeb && (
              <div className="flex items-center gap-2">
                <Globe size={12} className="shrink-0 text-gray-400" />
                <span className="truncate">{currentEstablishment.siteWeb}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION DES CLUBS SCOLAIRES OBLIGATOIRES (MINIMUM 2) */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl p-8 border border-gray-150/40 dark:border-gray-700 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-black text-gray-950 dark:text-white flex items-center gap-2">
              <Award className="text-indigo-600 dark:text-indigo-400" />
              Clubs Académiques Obligatoires
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Chaque élève doit obligatoirement faire partie d'au moins 2 clubs.</p>
          </div>
          
          {/* Status badge */}
          {joinedClubs.length >= 2 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-55 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 shadow-sm shrink-0">
              <Check size={12} className="stroke-[3]" />
              Conforme ({joinedClubs.length}/2)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-500/20 shadow-sm shrink-0 animate-pulse">
              <AlertTriangle size={12} className="stroke-[3]" />
              Incomplet ({joinedClubs.length}/2)
            </span>
          )}
        </div>

        {/* Warning Alert if < 2 clubs */}
        {joinedClubs.length < 2 && (
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px]">Réglementation Académique</p>
              <p className="font-medium">
                Pour être en règle, vous devez rejoindre au moins <strong className="font-black underline">{2 - joinedClubs.length}</strong> club(s) supplémentaire(s) parmi la liste disponible ci-dessous.
              </p>
            </div>
          </div>
        )}

        {/* List of currently joined clubs */}
        <div className="space-y-3">
          <h4 className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">
            Mes Clubs Actuels ({joinedClubs.length})
          </h4>
          
          {loadingClubs ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          ) : joinedClubs.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">Vous n'êtes membre d'aucun club pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {joinedClubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-900/20 rounded-2xl border border-gray-150/40 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-750 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner font-bold text-sm shrink-0 uppercase">
                      {club.name[0]}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-gray-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{club.name}</h5>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md">
                        {club.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinLeaveClub(club)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Quitter le club"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore and join other clubs */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">
            Clubs Disponibles à Rejoindre
          </h4>
          
          {loadingClubs ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          ) : allClubs.filter(c => !c.members?.includes(currentUser.id)).length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">Aucun autre club disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {allClubs
                .filter(c => !c.members?.includes(currentUser.id))
                .map((club) => (
                  <div key={club.id} className="p-3.5 bg-gray-50/50 dark:bg-gray-900/10 rounded-2xl border border-gray-150/20 dark:border-gray-850 flex items-start justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-all">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-gray-950 dark:text-white capitalize truncate">{club.name}</h5>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md shrink-0">
                          {club.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{club.description || "Pas de description."}</p>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Responsable : <span className="font-bold text-gray-600 dark:text-gray-300">{club.leaderName}</span></p>
                    </div>
                    <button
                      onClick={() => handleJoinLeaveClub(club)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] transition duration-150 shadow-sm shrink-0 cursor-pointer active:scale-95"
                    >
                      <Plus size={10} className="stroke-[3]" />
                      Rejoindre
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
