import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { QRCodeSVG } from 'qrcode.react';
import { UserCircle, GraduationCap, Hash, Mail, Castle, Phone, MapPin, Globe, Shield, Calendar, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  const [house, setHouse] = useState<any>(null);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Carte Biométrique Scolaire</h1>
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
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Adresse de Résidence</p>
                  <p className="font-extrabold text-xs mt-0.5 truncate">{currentUser.adresse || currentUser.address || 'Non spécifiée'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Users size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Parent / Tuteur</p>
                  <p className="font-extrabold text-xs mt-0.5 truncate">
                    {currentUser.parent_nom || currentUser.parentNom || currentUser.nom_parent || currentUser.parentName || currentUser.tuteur_nom || currentUser.tuteurNom || 'Non renseigné'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-gray-750 dark:text-gray-300">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Phone size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider leading-none">Téléphone du Tuteur</p>
                  <p className="font-extrabold text-xs mt-0.5 font-mono truncate">
                    {currentUser.parent_phone || currentUser.telephone_parent || currentUser.parentPhone || currentUser.tuteurPhone || 'Non renseigné'}
                  </p>
                </div>
              </div>

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
    </div>
  );
}
